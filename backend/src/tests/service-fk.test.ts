import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Database from 'better-sqlite3';

// ─── Helpers ────────────────────────────────────────────────────────────────

let testDir: string;
let dbPath: string;
let sqlite: Database.Database;

beforeAll(async () => {
  testDir = mkdtempSync(join(tmpdir(), 'bitacora-fk-'));
  dbPath = join(testDir, 'test.db');

  // Create database and tables
  sqlite = new Database(dbPath);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');

  sqlite.exec(`
    CREATE TABLE coffee_beans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      roaster TEXT NOT NULL,
      origin TEXT,
      roast_level TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE brew_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      coffee_bean_id INTEGER REFERENCES coffee_beans(id) ON DELETE SET NULL,
      grind_size TEXT,
      water_temp INTEGER,
      brew_time INTEGER,
      method TEXT NOT NULL,
      coffee_dose INTEGER,
      water_dose INTEGER,
      notes TEXT,
      rating INTEGER,
      grinder TEXT,
      clicks TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE tasting_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      brew_session_id INTEGER NOT NULL REFERENCES brew_sessions(id) ON DELETE CASCADE,
      aroma TEXT,
      flavor TEXT,
      body TEXT,
      acidity TEXT,
      rating INTEGER,
      free_text TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  sqlite.close();

  // Set env so services use our test db
  process.env.DATABASE_URL = dbPath;
});

afterAll(async () => {
  // Close the database connection so the file can be deleted on Windows
  try {
    const { db } = await import('../db/connection');
    if ('session' in db && typeof (db as any).session?.close === 'function') {
      (db as any).session.close();
    }
  } catch {
    // Best effort: clean up whatever we can
  }

  // Give the OS a moment to release the file handle
  await new Promise((r) => setTimeout(r, 100));

  if (existsSync(testDir)) {
    try {
      rmSync(testDir, { recursive: true, force: true });
    } catch {
      // On Windows, EBUSY can still happen. Temp dir will be cleaned on reboot.
    }
  }
  delete process.env.DATABASE_URL;
});

// ─── FK Tests — Bean Delete (SET NULL) ──────────────────────────────────────

describe('Bean delete — SET NULL on brew_sessions', () => {
  it('sets coffee_bean_id to NULL on referenced brews when bean is deleted', async () => {
    const { beanService } = await import('../services/bean-service');

    // Create a bean
    const bean = await beanService.create({
      name: 'Test Bean FK',
      roaster: 'Test Roaster FK',
    });
    expect(bean.id).toBeGreaterThan(0);

    // Create a brew referencing the bean — need to use raw DB for brew service
    const { db } = await import('../db/connection');
    await db.insert((await import('../db/schema')).brewSessions).values({
      coffeeBeanId: bean.id,
      method: 'V60',
      grindSize: 'medium',
      waterTemp: 93,
      brewTime: 150,
      coffeeDose: 15,
      waterDose: 250,
    });

    // Create a second brew referencing the same bean
    await db.insert((await import('../db/schema')).brewSessions).values({
      coffeeBeanId: bean.id,
      method: 'Aeropress',
      grindSize: 'fine',
      waterTemp: 88,
      brewTime: 120,
      coffeeDose: 14,
      waterDose: 200,
    });

    // Verify both brews reference the bean
    const brewsBefore = await db
      .select()
      .from((await import('../db/schema')).brewSessions)
      .where(
        (await import('drizzle-orm')).eq(
          (await import('../db/schema')).brewSessions.coffeeBeanId,
          bean.id,
        ),
      );
    expect(brewsBefore).toHaveLength(2);

    // Delete the bean
    const deleted = await beanService.delete(bean.id);
    expect(deleted).toBe(true);

    // Verify the brews still exist but have NULL coffee_bean_id
    const { isNull } = await import('drizzle-orm');
    const brewsAfter = await db
      .select()
      .from((await import('../db/schema')).brewSessions)
      .where(isNull((await import('../db/schema')).brewSessions.coffeeBeanId));
    expect(brewsAfter).toHaveLength(2);
  });

  it('deletes unreferenced bean without affecting any brews', async () => {
    const { beanService } = await import('../services/bean-service');
    const { db } = await import('../db/connection');
    const { brewSessions } = await import('../db/schema');
    const { eq } = await import('drizzle-orm');

    const bean = await beanService.create({
      name: 'Solo Bean',
      roaster: 'Solo Roaster',
    });

    const totalBrewsBefore = await db
      .select()
      .from(brewSessions);

    const deleted = await beanService.delete(bean.id);
    expect(deleted).toBe(true);

    // Total brews should be unchanged (no SET NULL needed)
    const totalBrewsAfter = await db
      .select()
      .from(brewSessions);

    expect(totalBrewsAfter).toHaveLength(totalBrewsBefore.length);
  });
});

// ─── FK Tests — Brew Delete (CASCADE on notes) ──────────────────────────────

describe('Brew delete — CASCADE on tasting_notes', () => {
  it('cascades deletion to all linked tasting notes', async () => {
    const { db } = await import('../db/connection');
    const { brewSessions, tastingNotes } = await import('../db/schema');
    const { eq, inArray } = await import('drizzle-orm');

    // Create a brew
    const [brew] = await db
      .insert(brewSessions)
      .values({ method: 'Pour Over', grindSize: 'medium' })
      .returning();

    // Add 3 tasting notes to that brew
    for (let i = 1; i <= 3; i++) {
      await db.insert(tastingNotes).values({
        brewSessionId: brew.id,
        aroma: `aroma-${i}`,
      });
    }

    // Verify notes exist
    const notesBefore = await db
      .select()
      .from(tastingNotes)
      .where(eq(tastingNotes.brewSessionId, brew.id));
    expect(notesBefore).toHaveLength(3);

    // Delete the brew
    const { brewService } = await import('../services/brew-service');
    const deleted = await brewService.delete(brew.id);
    expect(deleted).toBe(true);

    // Verify notes are cascade-deleted
    const notesAfter = await db
      .select()
      .from(tastingNotes)
      .where(eq(tastingNotes.brewSessionId, brew.id));
    expect(notesAfter).toHaveLength(0);
  });
});
