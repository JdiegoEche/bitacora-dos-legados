import { beforeAll, afterAll, beforeEach, describe, it, expect } from 'vitest';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Database from 'better-sqlite3';

// ─── Setup ──────────────────────────────────────────────────────────────────

let testDir: string;

beforeAll(async () => {
  testDir = mkdtempSync(join(tmpdir(), 'bitacora-recipe-svc-'));
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
      coffee_dose INTEGER NOT NULL,
      water_dose INTEGER NOT NULL,
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

  // Set env BEFORE importing modules that read it
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

// Clean table between tests for isolation
beforeEach(async () => {
  const { db } = await import('../db/connection');
  const { recipes } = await import('../db/schema');
  await db.delete(recipes);
});

// ─── Test Data ───────────────────────────────────────────────────────────────

const recipeV60 = {
  method: 'v60',
  name: 'Classic V60',
  coffeeDose: 15,
  waterDose: 250,
  ratio: '1:16.7',
  temperature: '93°C',
  grindSize: 'medium',
  totalTime: '2:30',
  profile: 'bright',
  objective: 'Bright and clean cup',
  steps: JSON.stringify([
    { stepOrder: 1, instruction: 'Bloom with 50ml water', waterAtStep: 50 },
    { stepOrder: 2, instruction: 'Pour remaining water', waterAtStep: 200 },
  ]),
};

const recipeAeropress = {
  method: 'aeropress',
  name: 'Standard Aeropress',
  coffeeDose: 14,
  waterDose: 200,
  ratio: '1:14.3',
  temperature: '88°C',
  grindSize: 'fine',
  totalTime: '1:30',
  profile: 'smooth',
  objective: 'Quick smooth cup',
  steps: JSON.stringify([]),
};

// ─── Service Tests ───────────────────────────────────────────────────────────

describe('recipeService.list()', () => {
  it('returns all recipes when no method filter is provided', async () => {
    const { recipeService } = await import('../services/recipe-service');
    const { db } = await import('../db/connection');
    const { recipes } = await import('../db/schema');

    await db.insert(recipes).values(recipeV60);
    await db.insert(recipes).values(recipeAeropress);

    const result = await recipeService.list();
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(2);
    const names = result.map((r) => r.name).sort();
    expect(names).toEqual(['Classic V60', 'Standard Aeropress']);
  });

  it('returns empty array when no recipes exist', async () => {
    const { recipeService } = await import('../services/recipe-service');

    const result = await recipeService.list();
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  it('filters recipes by method when method param is provided', async () => {
    const { recipeService } = await import('../services/recipe-service');
    const { db } = await import('../db/connection');
    const { recipes } = await import('../db/schema');

    await db.insert(recipes).values(recipeV60);
    await db.insert(recipes).values(recipeAeropress);

    const result = await recipeService.list('aeropress');
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(1);
    expect(result[0].method).toBe('aeropress');
    expect(result[0].name).toBe('Standard Aeropress');
  });

  it('returns empty array when method has no recipes', async () => {
    const { recipeService } = await import('../services/recipe-service');
    const { db } = await import('../db/connection');
    const { recipes } = await import('../db/schema');

    await db.insert(recipes).values(recipeV60);

    const result = await recipeService.list('chemex');
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });
});

describe('recipeService.getById()', () => {
  it('returns a single recipe with parsed steps array', async () => {
    const { recipeService } = await import('../services/recipe-service');
    const { db } = await import('../db/connection');
    const { recipes } = await import('../db/schema');

    const [inserted] = await db
      .insert(recipes)
      .values(recipeV60)
      .returning();

    const result = await recipeService.getById(inserted.id);
    expect(result).not.toBeNull();
    expect(result!.name).toBe('Classic V60');
    expect(result!.method).toBe('v60');
    expect(Array.isArray(result!.steps)).toBe(true);
    expect(result!.steps).toHaveLength(2);
    expect(result!.steps[0].instruction).toBe('Bloom with 50ml water');
    expect(result!.steps[0].waterAtStep).toBe(50);
    expect(result!.steps[1].instruction).toBe('Pour remaining water');
  });

  it('returns null for non-existent id', async () => {
    const { recipeService } = await import('../services/recipe-service');

    const result = await recipeService.getById(99999);
    expect(result).toBeNull();
  });
});
