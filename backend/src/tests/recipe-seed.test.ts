import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Database from 'better-sqlite3';

// ─── Setup ──────────────────────────────────────────────────────────────────

let testDir: string;

beforeAll(async () => {
  testDir = mkdtempSync(join(tmpdir(), 'bitacora-seed-'));
  const dbPath = join(testDir, 'test.db');

  // Create database with recipes table
  const sqlite = new Database(dbPath);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');

  sqlite.exec(`
    CREATE TABLE recipes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      method TEXT NOT NULL,
      name TEXT NOT NULL,
      objective TEXT,
      preparation TEXT NOT NULL DEFAULT '',
      coffee_dose REAL NOT NULL,
      water_dose REAL NOT NULL,
      ratio TEXT NOT NULL,
      temperature TEXT NOT NULL,
      grind_size TEXT NOT NULL,
      total_time TEXT NOT NULL,
      profile TEXT NOT NULL,
      steps TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  sqlite.close();

  // Set env BEFORE importing modules
  process.env.DATABASE_URL = dbPath;
});

afterAll(async () => {
  try {
    const { db } = await import('../db/connection');
    if ('session' in db && typeof (db as any).session?.close === 'function') {
      (db as any).session.close();
    }
  } catch {
    // Best effort
  }

  await new Promise((r) => setTimeout(r, 100));

  if (existsSync(testDir)) {
    try {
      rmSync(testDir, { recursive: true, force: true });
    } catch {
      // Windows EBUSY
    }
  }
  delete process.env.DATABASE_URL;
});

// ─── Seed Tests ─────────────────────────────────────────────────────────────

const EXPECTED_COUNTS: Record<string, number> = {
  v60: 8,   // 1 filtered out: "Otras recetas competitivas (Resumen técnico)"
  switch: 6,
  origami: 3,
  kalitawave: 3,
  chemex: 2,
  aeropress: 3,
};

const TOTAL_RECIPES = Object.values(EXPECTED_COUNTS).reduce((a, b) => a + b, 0);

describe('recipe seed', () => {
  it('runs without error and inserts all recipes', async () => {
    const { seedRecipes } = await import('../db/seed');

    // Run the seed function
    await seedRecipes();

    // Verify all recipes were inserted
    const { db } = await import('../db/connection');
    const { recipes } = await import('../db/schema');
    const { count } = await import('drizzle-orm');

    // Count total
    const [totalResult] = await db
      .select({ total: count() })
      .from(recipes);
    expect(totalResult.total).toBe(TOTAL_RECIPES);
  });
});

describe('recipe seed — counts per method', () => {
  it('inserts correct number of recipes per method', async () => {
    const { seedRecipes } = await import('../db/seed');
    const { db } = await import('../db/connection');
    const { recipes } = await import('../db/schema');
    const { eq, count } = await import('drizzle-orm');

    // Seed again (idempotent run)
    await seedRecipes();

    // Check counts per method
    for (const [method, expected] of Object.entries(EXPECTED_COUNTS)) {
      const [result] = await db
        .select({ total: count() })
        .from(recipes)
        .where(eq(recipes.method, method));
      expect(result.total).toBe(expected);
    }
  });
});

describe('seed idempotency', () => {
  it('produces same recipe count after running twice', async () => {
    const { seedRecipes } = await import('../db/seed');
    const { db } = await import('../db/connection');
    const { recipes } = await import('../db/schema');
    const { count } = await import('drizzle-orm');

    // Run seed a third time
    await seedRecipes();

    const [result] = await db
      .select({ total: count() })
      .from(recipes);
    expect(result.total).toBe(TOTAL_RECIPES);
  });

  it('does not create duplicate recipes after multiple runs', async () => {
    const { seedRecipes } = await import('../db/seed');
    const { db } = await import('../db/connection');
    const { recipes } = await import('../db/schema');
    const { eq, count } = await import('drizzle-orm');

    // Verify each method has the exact same count after multiple runs
    for (const [method, expected] of Object.entries(EXPECTED_COUNTS)) {
      const [result] = await db
        .select({ total: count() })
        .from(recipes)
        .where(eq(recipes.method, method));
      expect(result.total).toBe(expected);
    }
  });
});
