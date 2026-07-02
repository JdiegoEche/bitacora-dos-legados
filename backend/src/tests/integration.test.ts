import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import { Hono } from 'hono';

// Note: Route modules are imported dynamically in beforeAll after DATABASE_URL is set.
// This ensures that connection.ts evaluates with the test database path.

// ─── Setup ──────────────────────────────────────────────────────────────────

let testDir: string;
let app: Hono;

beforeAll(async () => {
  testDir = mkdtempSync(join(tmpdir(), 'bitacora-int-'));

  const dbPath = join(testDir, 'test.db');

  // Create database and tables
  const sqlite = new Database(dbPath);
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
      coffee_dose REAL,
      water_dose REAL,
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

  // Important: set env BEFORE importing route modules so connection.ts uses our test db
  process.env.DATABASE_URL = dbPath;

  // Dynamic imports — these will see DATABASE_URL set above
  const { default: brewRouter } = await import('../routes/brews');
  const { default: beanRouter } = await import('../routes/beans');
  const { default: noteRouter } = await import('../routes/notes');
  const { cors } = await import('hono/cors');

  // Build the Hono app (same structure as index.ts but without server startup)
  app = new Hono();
  app.use('/api/*', cors());
  app.route('/api/brews', brewRouter);
  app.route('/api/beans', beanRouter);
  app.route('/api', noteRouter);
  app.get('/api/health', (c) => c.json({ status: 'ok' }));
});

afterAll(async () => {
  // Close the database connection so the file can be deleted on Windows
  try {
    const { db } = await import('../db/connection');
    if ('session' in db && typeof (db as any).session?.close === 'function') {
      (db as any).session.close();
    }
  } catch {
    // Best effort: if we can't close the connection, the OS will release it eventually
  }

  // Give the OS a moment to release the file handle
  await new Promise((r) => setTimeout(r, 100));

  if (existsSync(testDir)) {
    try {
      rmSync(testDir, { recursive: true, force: true });
    } catch {
      // On Windows, EBUSY can still happen. The temp dir will be cleaned on reboot.
    }
  }
  delete process.env.DATABASE_URL;
});

// ─── Coffee Bean API Tests ──────────────────────────────────────────────────

describe('POST /api/beans', () => {
  it('creates a bean and returns 201', async () => {
    const res = await app.request('/api/beans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Bean',
        roaster: 'Test Roaster',
        origin: 'Test Region',
        roastLevel: 'medium',
      }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBeGreaterThan(0);
    expect(body.name).toBe('Test Bean');
    expect(body.roaster).toBe('Test Roaster');
  });

  it('returns 400 when name is missing', async () => {
    const res = await app.request('/api/beans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roaster: 'Test' }),
    });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/beans', () => {
  it('returns an array of beans sorted alphabetically', async () => {
    // Create a few beans first
    await app.request('/api/beans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Zulu Bean', roaster: 'Z' }),
    });
    await app.request('/api/beans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Alpha Bean', roaster: 'A' }),
    });

    const res = await app.request('/api/beans');
    expect(res.status).toBe(200);
    const beans = await res.json();
    expect(Array.isArray(beans)).toBe(true);
    expect(beans.length).toBeGreaterThanOrEqual(2);

    // Check alphanumeric ordering
    const names = beans.map((b: { name: string }) => b.name);
    const sortedNames = [...names].sort((a, b) => a.localeCompare(b));
    expect(names).toEqual(sortedNames);
  });
});

describe('PUT /api/beans/:id', () => {
  it('updates a bean and returns 200', async () => {
    const createRes = await app.request('/api/beans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Update Me', roaster: 'R' }),
    });
    const bean = await createRes.json();

    const res = await app.request(`/api/beans/${bean.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roastLevel: 'dark' }),
    });
    expect(res.status).toBe(200);
    const updated = await res.json();
    expect(updated.roastLevel).toBe('dark');
  });

  it('returns 404 for non-existent bean', async () => {
    const res = await app.request('/api/beans/99999', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Nope' }),
    });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/beans/:id', () => {
  it('deletes unreferenced bean and returns 204', async () => {
    const createRes = await app.request('/api/beans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Delete Me', roaster: 'R' }),
    });
    const bean = await createRes.json();

    const res = await app.request(`/api/beans/${bean.id}`, { method: 'DELETE' });
    expect(res.status).toBe(204);
  });

  it('returns 404 for non-existent bean delete', async () => {
    const res = await app.request('/api/beans/99999', { method: 'DELETE' });
    expect(res.status).toBe(404);
  });
});

// ─── Brew Session API Tests ─────────────────────────────────────────────────

describe('POST /api/brews', () => {
  it('creates a brew and returns 201', async () => {
    const res = await app.request('/api/brews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: 'V60',
        grindSize: 'medium',
        waterTemp: 93,
        brewTime: '150',
        coffeeDose: 15,
        waterDose: 250,
      }),
    });
    expect(res.status).toBe(201);
    const brew = await res.json();
    expect(brew.id).toBeGreaterThan(0);
    expect(brew.method).toBe('V60');
  });
});

describe('GET /api/brews/:id', () => {
  it('returns brew with relations', async () => {
    const createRes = await app.request('/api/brews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: 'Aeropress',
        grindSize: 'fine',
        waterTemp: 88,
        brewTime: '120',
        coffeeDose: 14,
        waterDose: 200,
      }),
    });
    const created = await createRes.json();

    const res = await app.request(`/api/brews/${created.id}`);
    expect(res.status).toBe(200);
    const brew = await res.json();
    expect(brew.method).toBe('Aeropress');
    expect(Array.isArray(brew.tastingNotes)).toBe(true);
  });

  it('returns 404 for non-existent brew', async () => {
    const res = await app.request('/api/brews/99999');
    expect(res.status).toBe(404);
  });
});

// ─── Tasting Note API Tests ─────────────────────────────────────────────────

describe('POST /api/brews/:brewId/notes', () => {
  it('creates a note for existing brew and returns 201', async () => {
    const brewRes = await app.request('/api/brews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: 'Chemex',
        grindSize: 'medium-coarse',
        waterTemp: 92,
        brewTime: '240',
        coffeeDose: 30,
        waterDose: 500,
      }),
    });
    const brew = await brewRes.json();

    const res = await app.request(`/api/brews/${brew.id}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        aroma: 'floral',
        flavor: 'berry',
        rating: 4,
      }),
    });
    expect(res.status).toBe(201);
    const note = await res.json();
    expect(note.brewSessionId).toBe(brew.id);
    expect(note.aroma).toBe('floral');
  });

  it('returns 404 for non-existent brew', async () => {
    const res = await app.request('/api/brews/99999/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aroma: 'test' }),
    });
    expect(res.status).toBe(404);
  });
});

describe('GET /api/brews/:brewId/notes', () => {
  it('returns notes for a brew', async () => {
    const brewRes = await app.request('/api/brews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: 'Espresso',
        grindSize: 'fine',
        waterTemp: 92,
        brewTime: '30',
        coffeeDose: 18,
        waterDose: 36,
      }),
    });
    const brew = await brewRes.json();

    // Add 2 notes
    await app.request(`/api/brews/${brew.id}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aroma: 'nutty' }),
    });
    await app.request(`/api/brews/${brew.id}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ flavor: 'caramel' }),
    });

    const res = await app.request(`/api/brews/${brew.id}/notes`);
    expect(res.status).toBe(200);
    const notes = await res.json();
    expect(notes).toHaveLength(2);
  });

  it('returns 404 for brew that does not exist', async () => {
    const res = await app.request('/api/brews/99999/notes');
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/notes/:id', () => {
  it('deletes a single note and returns 204', async () => {
    const brewRes = await app.request('/api/brews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: 'Siphon',
        grindSize: 'medium',
        waterTemp: 91,
        brewTime: '60',
        coffeeDose: 20,
        waterDose: 300,
      }),
    });
    const brew = await brewRes.json();

    const noteRes = await app.request(`/api/brews/${brew.id}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aroma: 'test delete' }),
    });
    const note = await noteRes.json();

    const res = await app.request(`/api/notes/${note.id}`, {
      method: 'DELETE',
    });
    expect(res.status).toBe(204);
  });

  it('returns 404 for non-existent note', async () => {
    const res = await app.request('/api/notes/99999', { method: 'DELETE' });
    expect(res.status).toBe(404);
  });
});

// ─── Bean Stats & History Tests ──────────────────────────────────────────────
// These tests verify the new getByIdWithStats + getBrewsByBeanId endpoints.
// brewTime is sent as string to match the pre-existing validator (z.string()).

describe('GET /api/beans/:id — with stats', () => {
  it('returns bean with avgRating, brewCount, methodBreakdown', async () => {
    // Create a bean
    const beanRes = await app.request('/api/beans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Stats Bean', roaster: 'Stats Roaster' }),
    });
    const bean = await beanRes.json();

    // Create brews with different ratings and methods
    const brewPayloads = [
      { method: 'V60', grindSize: 'medium', waterTemp: 93, brewTime: '150', coffeeDose: 15, waterDose: 250, coffeeBeanId: bean.id, rating: '4' },
      { method: 'V60', grindSize: 'medium', waterTemp: 93, brewTime: '155', coffeeDose: 15, waterDose: 250, coffeeBeanId: bean.id, rating: '5' },
      { method: 'Aeropress', grindSize: 'fine', waterTemp: 88, brewTime: '120', coffeeDose: 14, waterDose: 200, coffeeBeanId: bean.id, rating: '3' },
    ];

    for (const payload of brewPayloads) {
      await app.request('/api/brews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }

    const res = await app.request(`/api/beans/${bean.id}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.avgRating).toBeCloseTo(4, 0);
    expect(body.brewCount).toBe(3);
    expect(body.methodBreakdown).toEqual({ V60: 2, Aeropress: 1 });
  });

  it('returns 404 for non-existent bean', async () => {
    const res = await app.request('/api/beans/99999');
    expect(res.status).toBe(404);
  });

  it('returns stats with brewCount 0 when bean has no brews', async () => {
    const beanRes = await app.request('/api/beans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Lonely Bean', roaster: 'Solo' }),
    });
    const bean = await beanRes.json();

    const res = await app.request(`/api/beans/${bean.id}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.brewCount).toBe(0);
    expect(body.avgRating).toBeNull();
    expect(body.methodBreakdown).toEqual({});
  });
});

describe('GET /api/beans/:id/brews', () => {
  it('returns brews newest-first with tastingNotesSummary', async () => {
    const beanRes = await app.request('/api/beans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'History Bean', roaster: 'History R' }),
    });
    const bean = await beanRes.json();

    // Create 2 brews for the bean — add delay so created_at differs
    const brew1Res = await app.request('/api/brews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: 'V60', grindSize: 'medium', waterTemp: 93, brewTime: '150',
        coffeeDose: 15, waterDose: 250, coffeeBeanId: bean.id,
      }),
    });
    const brew1 = await brew1Res.json();

    // Small delay so created_at timestamps differ
    await new Promise((r) => setTimeout(r, 50));

    const brew2Res = await app.request('/api/brews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: 'Aeropress', grindSize: 'fine', waterTemp: 88, brewTime: '120',
        coffeeDose: 14, waterDose: 200, coffeeBeanId: bean.id,
      }),
    });
    const brew2 = await brew2Res.json();

    // Add tasting notes to brew2 (the newer brew)
    await app.request(`/api/brews/${brew2.id}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aroma: 'floral', flavor: 'berry' }),
    });

    const res = await app.request(`/api/beans/${bean.id}/brews`);
    expect(res.status).toBe(200);
    const brews = await res.json();
    expect(brews).toHaveLength(2);
    // Newest first (brew2 is newer)
    expect(brews[0].id).toBe(brew2.id);
    expect(brews[1].id).toBe(brew1.id);
    // brew2 has notes, brew1 doesn't
    expect(typeof brews[0].tastingNotesSummary).toBe('string');
    expect(brews[0].tastingNotesSummary).toMatch(/floral/);
    expect(brews[1].tastingNotesSummary).toBeNull();
  });

  it('returns 404 for non-existent bean', async () => {
    const res = await app.request('/api/beans/99999/brews');
    expect(res.status).toBe(404);
  });

  it('returns 200 with empty array when bean has no brews', async () => {
    const beanRes = await app.request('/api/beans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'No Brews Yet', roaster: 'Empty R' }),
    });
    const bean = await beanRes.json();

    const res = await app.request(`/api/beans/${bean.id}/brews`);
    expect(res.status).toBe(200);
    const brews = await res.json();
    expect(brews).toEqual([]);
  });
});

// ─── Health Check ───────────────────────────────────────────────────────────

describe('GET /api/health', () => {
  it('returns ok', async () => {
    const res = await app.request('/api/health');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
  });
});
