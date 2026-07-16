import { beforeAll, afterAll, describe, it, expect, vi } from 'vitest';
import { createTestDb, destroyTestDb } from '../db/test-helper.js';
import type { TestDb } from '../db/test-helper.js';
import * as schema from '../db/schema.js';

// ─── Mock DB connection ──────────────────────────────────────────────────────

let testDb: TestDb;

vi.mock('../db/connection', () => ({
  get db() { return testDb; },
}));

// ─── Setup ──────────────────────────────────────────────────────────────────

beforeAll(async () => {
  testDb = await createTestDb();
});

afterAll(() => {
  destroyTestDb();
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

describe('seedRecipes()', () => {
  it('seeds recipes from filter-coffeMD markdown files', async () => {
    const { seedRecipes } = await import('../db/seed');
    const count = await seedRecipes();
    expect(count).toBeGreaterThan(0);
  });

  it('inserts recipes grouped by method', async () => {
    const { seedRecipes } = await import('../db/seed');
    await seedRecipes();

    for (const [method, expected] of Object.entries(EXPECTED_COUNTS)) {
      const result = await testDb
        .select()
        .from(schema.recipes)
        .where(
          (await import('drizzle-orm')).eq(schema.recipes.method, method),
        );
      expect(result).toHaveLength(expected);
    }
  });

  it('is idempotent — calling seedRecipes twice produces the same count', async () => {
    const { seedRecipes } = await import('../db/seed');

    await seedRecipes();
    const count1 = await seedRecipes();

    // After second seed, total should be same as first (recipes were truncated)
    const total = await testDb
      .select({ count: (await import('drizzle-orm')).count() })
      .from(schema.recipes);
    expect(Number(total[0].count)).toBe(count1);
  });

  it('each seeded recipe has all required fields', async () => {
    const { seedRecipes } = await import('../db/seed');
    await seedRecipes();

    const recipes = await testDb.select().from(schema.recipes).limit(5);
    for (const recipe of recipes) {
      expect(recipe.name).toBeTruthy();
      expect(recipe.method).toBeTruthy();
      expect(recipe.coffeeDose).toBeGreaterThan(0);
      expect(recipe.waterDose).toBeGreaterThan(0);
      expect(recipe.ratio).toBeTruthy();
      expect(recipe.temperature).toBeTruthy();
      expect(recipe.grindSize).toBeTruthy();
      expect(recipe.totalTime).toBeTruthy();
      expect(recipe.profile).toBeTruthy();
    }
  });

  it('each seeded recipe has valid JSON steps', async () => {
    const { seedRecipes } = await import('../db/seed');
    await seedRecipes();

    const recipes = await testDb.select().from(schema.recipes);
    for (const recipe of recipes) {
      expect(() => JSON.parse(recipe.steps)).not.toThrow();
      const steps = JSON.parse(recipe.steps);
      expect(Array.isArray(steps)).toBe(true);
      for (const step of steps) {
        expect(step).toHaveProperty('stepOrder');
        expect(step).toHaveProperty('instruction');
      }
    }
  });

  // Skipped: seedRecipes resolves its path via __dirname at module load,
  //   so mocking process.cwd or monkey-patching fs doesn't affect it.
  //   Proper vi.mock('node:fs') would break other tests in this file.
  it.skip('returns 0 when no markdown files are found (wrong cwd)', async () => {
    // Needs vi.mock('node:fs', ...) setup at file level
  });
});
