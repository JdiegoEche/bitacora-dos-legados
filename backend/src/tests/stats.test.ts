import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import { Hono } from 'hono';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getAuthHeader(
  app: Hono,
  email: string,
): Promise<Record<string, string>> {
  const loginRes = await app.request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const { token: jwt } = (await loginRes.json()) as { token: string };
  return {
    Authorization: `Bearer ${jwt}`,
    'Content-Type': 'application/json',
  };
}

// ─── Setup ──────────────────────────────────────────────────────────────────

let testDir: string;
let app: Hono;
let authHeaders: Record<string, string>;
let emptyUserHeaders: Record<string, string>;
let parseWords: (text: string | null) => string[];
let topWords: (words: string[], limit?: number) => { word: string; count: number }[];

beforeAll(async () => {
  testDir = mkdtempSync(join(tmpdir(), 'bitacora-stats-'));

  const dbPath = join(testDir, 'test.db');

  // Create database and tables
  const sqlite = new Database(dbPath);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');

  sqlite.exec(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE magic_link_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE coffee_beans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      roaster TEXT NOT NULL,
      origin TEXT,
      roast_level TEXT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE brew_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      coffee_bean_id INTEGER REFERENCES coffee_beans(id) ON DELETE SET NULL,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      grind_size TEXT,
      water_temp INTEGER,
      brew_time INTEGER,
      method TEXT NOT NULL,
      coffee_dose REAL,
      water_dose REAL,
      notes TEXT,
      rating TEXT,
      grinder TEXT,
      clicks TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE tasting_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      brew_session_id INTEGER NOT NULL REFERENCES brew_sessions(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      aroma TEXT,
      flavor TEXT,
      body TEXT,
      acidity TEXT,
      rating INTEGER,
      free_text TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

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

  // Set env BEFORE importing route modules so connection.ts uses our test db
  process.env.DATABASE_URL = dbPath;

  // Dynamic imports — these will see DATABASE_URL set above
  const { default: authRouter } = await import('../routes/auth');
  const { default: brewRouter } = await import('../routes/brews');
  const { default: noteRouter } = await import('../routes/notes');
  const { default: statsRouter } = await import('../routes/stats');
  const { cors } = await import('hono/cors');

  // Import pure functions from the service module
  const statsService = await import('../services/stats-service');
  parseWords = statsService.parseWords;
  topWords = statsService.topWords;

  // Build the Hono app (routes needed for setup + stats)
  app = new Hono();
  app.use('/api/*', cors());
  app.route('/api/auth', authRouter);
  app.route('/api/brews', brewRouter);
  app.route('/api', noteRouter);
  app.route('/api/stats', statsRouter);

  // Create test user with data and get auth headers
  authHeaders = await getAuthHeader(app, 'stats-test@test.com');

  // Create second user (empty data) and get auth headers
  emptyUserHeaders = await getAuthHeader(app, 'empty-user@test.com');
});

afterAll(async () => {
  // Close the database connection so the file can be deleted on Windows
  try {
    const { db } = await import('../db/connection');
    if (
      'session' in db &&
      typeof (db as any).session?.close === 'function'
    ) {
      (db as any).session.close();
    }
  } catch {
    // Best effort
  }

  // Give the OS a moment to release the file handle
  await new Promise((r) => setTimeout(r, 100));

  if (existsSync(testDir)) {
    try {
      rmSync(testDir, { recursive: true, force: true });
    } catch {
      // On Windows, EBUSY can still happen
    }
  }
  delete process.env.DATABASE_URL;
});

// ─── Pure Function Tests ─────────────────────────────────────────────────────

describe('parseWords()', () => {
  it('splits comma-separated words', () => {
    expect(parseWords('floral, jasmine')).toEqual(['floral', 'jasmine']);
  });

  it('splits " and " connector', () => {
    expect(parseWords('chocolate and berry')).toEqual(['chocolate', 'berry']);
  });

  it('splits "&" connector', () => {
    expect(parseWords('creamy & smooth')).toEqual(['creamy', 'smooth']);
  });

  it('returns empty array for null input', () => {
    expect(parseWords(null)).toEqual([]);
  });

  it('returns empty array for empty string', () => {
    expect(parseWords('')).toEqual([]);
  });

  it('filters stopwords', () => {
    const input =
      'the and a with very notes like slight of in on it is was has have some but not too also more than an floral';
    expect(parseWords(input)).toEqual(['floral']);
  });

  it('lowercases and trims words', () => {
    expect(parseWords('  FLORAL, JASMINE  ')).toEqual(['floral', 'jasmine']);
  });

  it('handles mixed spacing', () => {
    expect(parseWords('nutty,  sweet   &  creamy')).toEqual([
      'nutty',
      'sweet',
      'creamy',
    ]);
  });
});

describe('topWords()', () => {
  it('returns top 5 sorted by count descending', () => {
    const words = [
      'floral',
      'floral',
      'jasmine',
      'jasmine',
      'jasmine',
      'berry',
      'berry',
      'nutty',
    ];
    expect(topWords(words)).toEqual([
      { word: 'jasmine', count: 3 },
      { word: 'floral', count: 2 },
      { word: 'berry', count: 2 },
      { word: 'nutty', count: 1 },
    ]);
  });

  it('limits results to specified number', () => {
    const words = ['a', 'b', 'c', 'd', 'e', 'f'];
    expect(topWords(words, 3)).toHaveLength(3);
  });

  it('returns empty array for empty input', () => {
    expect(topWords([])).toEqual([]);
  });

  it('handles single word', () => {
    expect(topWords(['floral', 'floral', 'floral'])).toEqual([
      { word: 'floral', count: 3 },
    ]);
  });
});

// ─── Tasting Words Integration ───────────────────────────────────────────────

describe('GET /api/stats/tasting-words', () => {
  it('returns parsed words for authenticated user', async () => {
    // Create a brew
    const brewRes = await app.request('/api/brews', {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: 'V60',
        grindSize: 'medium',
        waterTemp: 93,
        brewTime: '150',
        coffeeDose: 15,
        waterDose: 250,
      }),
    });
    const brew1 = await brewRes.json();

    // Add tasting notes to brew1
    await app.request(`/api/brews/${brew1.id}/notes`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        aroma: 'floral, jasmine',
        flavor: 'berry',
        body: 'creamy & smooth',
        acidity: 'bright',
      }),
    });

    // Create second brew with notes
    const brewRes2 = await app.request('/api/brews', {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: 'Chemex',
        grindSize: 'medium-coarse',
        waterTemp: 92,
        brewTime: '240',
        coffeeDose: 30,
        waterDose: 500,
      }),
    });
    const brew2 = await brewRes2.json();

    await app.request(`/api/brews/${brew2.id}/notes`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        aroma: 'floral, rose, nutty',
        flavor: 'chocolate and caramel',
        rating: 4,
      }),
    });

    // Fetch tasting words
    const res = await app.request('/api/stats/tasting-words', {
      headers: authHeaders,
    });
    expect(res.status).toBe(200);
    const body = await res.json();

    // Verify structure
    expect(body).toHaveProperty('aroma');
    expect(body).toHaveProperty('flavor');
    expect(body).toHaveProperty('body');
    expect(body).toHaveProperty('acidity');

    // aroma: floral (2), jasmine (1), rose (1), nutty (1) → top 5
    expect(body.aroma).toContainEqual({ word: 'floral', count: 2 });
    expect(body.aroma).toContainEqual({ word: 'jasmine', count: 1 });
    expect(body.aroma).toContainEqual({ word: 'rose', count: 1 });
    expect(body.aroma).toContainEqual({ word: 'nutty', count: 1 });

    // flavor: berry (1), chocolate (1), caramel (1)
    expect(body.flavor).toContainEqual({ word: 'berry', count: 1 });
    expect(body.flavor).toContainEqual({ word: 'chocolate', count: 1 });
    expect(body.flavor).toContainEqual({ word: 'caramel', count: 1 });

    // body: creamy (1), smooth (1)
    expect(body.body).toContainEqual({ word: 'creamy', count: 1 });
    expect(body.body).toContainEqual({ word: 'smooth', count: 1 });

    // acidity: bright (1)
    expect(body.acidity).toContainEqual({ word: 'bright', count: 1 });
  });

  it('returns empty arrays for user with no tasting notes', async () => {
    const res = await app.request('/api/stats/tasting-words', {
      headers: emptyUserHeaders,
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.aroma).toEqual([]);
    expect(body.flavor).toEqual([]);
    expect(body.body).toEqual([]);
    expect(body.acidity).toEqual([]);
  });

  it('returns max 5 words per category', async () => {
    // Create a brew with 7 distinct aroma words
    const brewRes = await app.request('/api/brews', {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: 'V60',
        grindSize: 'medium',
        waterTemp: 93,
        brewTime: '150',
        coffeeDose: 15,
        waterDose: 250,
      }),
    });
    const brew = await brewRes.json();

    await app.request(`/api/brews/${brew.id}/notes`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        aroma: 'alpha, beta, gamma, delta, epsilon, zeta, eta',
      }),
    });

    const res = await app.request('/api/stats/tasting-words', {
      headers: authHeaders,
    });
    expect(res.status).toBe(200);
    const body = await res.json();

    // Find the aroma words for this user — at most 5 entries
    expect(body.aroma.length).toBeLessThanOrEqual(5);
  });
});

// ─── Method Popularity Integration ───────────────────────────────────────────

describe('GET /api/stats/method-popularity', () => {
  it('returns methods sorted by count descending', async () => {
    // Create 3 V60 brews with ratings
    for (let i = 0; i < 3; i++) {
      const brewRes = await app.request('/api/brews', {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'V60',
          grindSize: 'medium',
          waterTemp: 93,
          brewTime: '150',
          coffeeDose: 15,
          waterDose: 250,
        }),
      });
      const brew = await brewRes.json();

      // Add tasting note with rating (4, 4, 5) → avg 4.33
      await app.request(`/api/brews/${brew.id}/notes`, {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aroma: 'floral',
          rating: i === 2 ? 5 : 4,
        }),
      });
    }

    // Create 2 Aeropress brews with ratings (3, 4) → avg 3.5
    for (let i = 0; i < 2; i++) {
      const brewRes = await app.request('/api/brews', {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'Aeropress',
          grindSize: 'fine',
          waterTemp: 88,
          brewTime: '120',
          coffeeDose: 14,
          waterDose: 200,
        }),
      });
      const brew = await brewRes.json();

      await app.request(`/api/brews/${brew.id}/notes`, {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aroma: 'nutty',
          rating: i === 0 ? 3 : 4,
        }),
      });
    }

    const res = await app.request('/api/stats/method-popularity', {
      headers: authHeaders,
    });
    expect(res.status).toBe(200);
    const body = await res.json();

    // V60 should come before Aeropress (sorted by count DESC)
    const v60Idx = body.findIndex((i: { method: string }) => i.method === 'V60');
    const aeropressIdx = body.findIndex((i: { method: string }) => i.method === 'Aeropress');
    expect(v60Idx).toBeLessThan(aeropressIdx);

    const v60 = body[v60Idx];
    const aeropress = body[aeropressIdx];

    // Each method has at least the number of brews we just created
    expect(v60.count).toBeGreaterThanOrEqual(3);
    expect(aeropress.count).toBeGreaterThanOrEqual(2);

    // V60 avg ~4.33 (ratings 4,4,5) and Aeropress avg 3.5 (ratings 3,4)
    expect(v60.avgRating).toBeCloseTo(4.33, 1);
    expect(aeropress.avgRating).toBe(3.5);
  });

  it('includes methods with null avgRating when no tasting notes', async () => {
    // Create a French Press brew with no notes
    await app.request('/api/brews', {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: 'French Press',
        grindSize: 'coarse',
        waterTemp: 95,
        brewTime: '240',
        coffeeDose: 20,
        waterDose: 350,
      }),
    });

    const res = await app.request('/api/stats/method-popularity', {
      headers: authHeaders,
    });
    expect(res.status).toBe(200);
    const body = await res.json();

    const frenchPress = body.find(
      (item: { method: string }) => item.method === 'French Press',
    );
    expect(frenchPress).toBeDefined();
    expect(frenchPress.count).toBe(1);
    expect(frenchPress.avgRating).toBeNull();
  });

  it('returns empty array for user with no brews', async () => {
    const res = await app.request('/api/stats/method-popularity', {
      headers: emptyUserHeaders,
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });
});

// ─── Auth Tests ──────────────────────────────────────────────────────────────

describe('Auth — 401 without JWT', () => {
  it('GET /api/stats/tasting-words returns 401 without auth', async () => {
    const res = await app.request('/api/stats/tasting-words');
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it('GET /api/stats/method-popularity returns 401 without auth', async () => {
    const res = await app.request('/api/stats/method-popularity');
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });
});
