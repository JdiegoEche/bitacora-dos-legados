import { beforeAll, afterAll, beforeEach, describe, it, expect, vi } from 'vitest';
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

// Clean table between tests for isolation
beforeEach(async () => {
  await testDb.delete(schema.recipes);
});

// ─── Test Data ───────────────────────────────────────────────────────────────

const sampleRecipe = {
  method: 'v60' as const,
  name: 'Test V60',
  objective: 'A simple test recipe',
  preparation: 'Boil water, grind coffee, brew',
  coffeeDose: 15,
  waterDose: 250,
  ratio: '1:16.7',
  temperature: '93°C',
  grindSize: 'medium',
  totalTime: '2:30',
  profile: 'bright',
  steps: JSON.stringify([
    { stepOrder: 1, instruction: 'Bloom with 50g water', waterAtStep: 50 },
    { stepOrder: 2, instruction: 'Pour to 250g', waterAtStep: 250 },
  ]),
};

const sampleRecipe2 = {
  method: 'aeropress' as const,
  name: 'Test Aeropress',
  objective: null,
  preparation: '',
  coffeeDose: 14,
  waterDose: 200,
  ratio: '1:14.3',
  temperature: '88°C',
  grindSize: 'fine',
  totalTime: '1:30',
  profile: 'smooth',
  steps: '[]',
};

// ─── Service Tests ───────────────────────────────────────────────────────────

describe('recipeService.list()', () => {
  it('returns empty array when no recipes exist', async () => {
    const { recipeService } = await import('../services/recipe-service');
    const recipes = await recipeService.list();
    expect(recipes).toEqual([]);
  });

  it('returns all recipes when no method filter is given', async () => {
    const { recipeService } = await import('../services/recipe-service');

    await testDb.insert(schema.recipes).values(sampleRecipe);
    await testDb.insert(schema.recipes).values(sampleRecipe2);

    const recipes = await recipeService.list();
    expect(recipes).toHaveLength(2);
    const names = recipes.map((r) => r.name).sort();
    expect(names).toEqual(['Test Aeropress', 'Test V60']);
  });

  it('filters recipes by method when method param is provided', async () => {
    const { recipeService } = await import('../services/recipe-service');

    await testDb.insert(schema.recipes).values(sampleRecipe);
    await testDb.insert(schema.recipes).values(sampleRecipe2);

    const v60Recipes = await recipeService.list('v60');
    expect(v60Recipes).toHaveLength(1);
    expect(v60Recipes[0].name).toBe('Test V60');

    const aeropressRecipes = await recipeService.list('aeropress');
    expect(aeropressRecipes).toHaveLength(1);
    expect(aeropressRecipes[0].name).toBe('Test Aeropress');
  });

  it('returns steps field from list()', async () => {
    const { recipeService } = await import('../services/recipe-service');

    await testDb.insert(schema.recipes).values(sampleRecipe);

    const recipes = await recipeService.list();
    expect(recipes).toHaveLength(1);
    expect(typeof recipes[0].steps).toBe('string');
    expect(recipes[0].steps).toBe(sampleRecipe.steps);
  });

  it('returns empty array for non-existent method', async () => {
    const { recipeService } = await import('../services/recipe-service');
    await testDb.insert(schema.recipes).values(sampleRecipe);

    const chemexRecipes = await recipeService.list('chemex');
    expect(chemexRecipes).toEqual([]);
  });
});

describe('recipeService.getById()', () => {
  it('returns a recipe by id', async () => {
    const { recipeService } = await import('../services/recipe-service');

    const [inserted] = await testDb.insert(schema.recipes).values(sampleRecipe).returning();

    const recipe = await recipeService.getById(inserted.id);
    expect(recipe).not.toBeNull();
    expect(recipe!.name).toBe('Test V60');
  });

  it('returns null for non-existent id', async () => {
    const { recipeService } = await import('../services/recipe-service');
    const recipe = await recipeService.getById(999);
    expect(recipe).toBeNull();
  });

  it('returns null for negative id', async () => {
    const { recipeService } = await import('../services/recipe-service');
    const recipe = await recipeService.getById(-1);
    expect(recipe).toBeNull();
  });

  it('returns parsed steps as RecipeStep[]', async () => {
    const { recipeService } = await import('../services/recipe-service');

    const [inserted] = await testDb.insert(schema.recipes).values(sampleRecipe).returning();

    const recipe = await recipeService.getById(inserted.id);
    expect(recipe!.steps).toEqual([
      { stepOrder: 1, instruction: 'Bloom with 50g water', waterAtStep: 50 },
      { stepOrder: 2, instruction: 'Pour to 250g', waterAtStep: 250 },
    ]);
  });

  it('returns empty array for steps field with empty JSON array', async () => {
    const { recipeService } = await import('../services/recipe-service');

    const [inserted] = await testDb.insert(schema.recipes).values(sampleRecipe2).returning();

    const recipe = await recipeService.getById(inserted.id);
    expect(recipe!.steps).toEqual([]);
  });
});
