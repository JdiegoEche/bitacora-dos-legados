import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import { Hono } from 'hono';

// ─── Setup ──────────────────────────────────────────────────────────────────

let testDir: string;
let app: Hono;

beforeAll(async () => {
  testDir = mkdtempSync(join(tmpdir(), 'bitacora-recipe-routes-'));
  const dbPath = join(testDir, 'test.db');

  // Create database and tables
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

    INSERT INTO recipes (method, name, coffee_dose, water_dose, ratio, temperature, grind_size, total_time, profile, steps)
    VALUES ('v60', 'Classic V60', 15, 250, '1:16.7', '93°C', 'medium', '2:30', 'bright', '[{"stepOrder":1,"instruction":"Bloom","waterAtStep":50}]');

    INSERT INTO recipes (method, name, coffee_dose, water_dose, ratio, temperature, grind_size, total_time, profile, steps)
    VALUES ('aeropress', 'Standard Aeropress', 14, 200, '1:14.3', '88°C', 'fine', '1:30', 'smooth', '[]');

    INSERT INTO recipes (method, name, coffee_dose, water_dose, ratio, temperature, grind_size, total_time, profile, steps)
    VALUES ('v60', 'Another V60', 18, 300, '1:16.7', '92°C', 'medium', '3:00', 'full', '[]');
  `);

  sqlite.close();

  // Set env BEFORE importing route modules
  process.env.DATABASE_URL = dbPath;

  // Dynamic imports — will see DATABASE_URL
  const { default: recipeRouter } = await import('../routes/recipes');
  const { cors } = await import('hono/cors');

  // Build the Hono app
  app = new Hono();
  app.use('/api/*', cors());
  app.route('/api/recipes', recipeRouter);
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

// ─── Route Tests ─────────────────────────────────────────────────────────────

describe('GET /api/recipes', () => {
  it('returns all recipes sorted alphabetically by name', async () => {
    const res = await app.request('/api/recipes');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(3);

    // Check alphabetical ordering
    const names = body.map((r: { name: string }) => r.name);
    expect(names[0]).toBe('Another V60');
    expect(names[1]).toBe('Classic V60');
    expect(names[2]).toBe('Standard Aeropress');
  });

  it('filters by method when ?method= param is provided', async () => {
    const res = await app.request('/api/recipes?method=v60');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(2);
    for (const r of body) {
      expect(r.method).toBe('v60');
    }
  });

  it('returns empty array when method has no matches', async () => {
    const res = await app.request('/api/recipes?method=chemex');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(0);
  });

  it('returns 400 when method param is invalid', async () => {
    const res = await app.request('/api/recipes?method=french-press');
    expect(res.status).toBe(400);
  });

  it('returns recipes without steps data', async () => {
    const res = await app.request('/api/recipes');
    expect(res.status).toBe(200);
    const body = await res.json();
    for (const r of body) {
      expect(r.steps).toBeUndefined();
    }
  });
});

describe('GET /api/recipes/:id', () => {
  it('returns a single recipe with parsed steps', async () => {
    // First, get all recipes to find an ID
    const listRes = await app.request('/api/recipes');
    const recipes = await listRes.json();
    const firstId = recipes[0].id;

    const res = await app.request(`/api/recipes/${firstId}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe(firstId);
    expect(body.name).toBeDefined();
    expect(body.method).toBeDefined();
    // Steps should be included as parsed array
    expect(Array.isArray(body.steps)).toBe(true);
  });

  it('returns 404 for non-existent id', async () => {
    const res = await app.request('/api/recipes/99999');
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it('returns 400 for invalid id param', async () => {
    const res = await app.request('/api/recipes/abc');
    expect(res.status).toBe(400);
  });
});
