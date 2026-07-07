import { beforeAll, afterAll, describe, it, expect, vi } from 'vitest';
import { createTestDb, destroyTestDb } from '../db/test-helper';
import type { TestDb } from '../db/test-helper';
import * as schema from '../db/schema';
import { Hono } from 'hono';

// ─── Mock DB connection ──────────────────────────────────────────────────────

let testDb: TestDb;

vi.mock('../db/connection', () => ({
  get db() { return testDb; },
}));

// ─── Setup ──────────────────────────────────────────────────────────────────

let app: Hono;

beforeAll(async () => {
  testDb = await createTestDb();

  // Seed some recipes
  await testDb.insert(schema.recipes).values([
    {
      method: 'v60',
      name: 'Classic V60',
      coffeeDose: 15,
      waterDose: 250,
      ratio: '1:16.7',
      temperature: '93°C',
      grindSize: 'medium',
      totalTime: '2:30',
      profile: 'bright',
      steps: JSON.stringify([{ stepOrder: 1, instruction: 'Bloom', waterAtStep: 50 }]),
    },
    {
      method: 'aeropress',
      name: 'Standard Aeropress',
      coffeeDose: 14,
      waterDose: 200,
      ratio: '1:14.3',
      temperature: '88°C',
      grindSize: 'fine',
      totalTime: '1:30',
      profile: 'smooth',
      steps: '[]',
    },
    {
      method: 'v60',
      name: 'Another V60',
      coffeeDose: 18,
      waterDose: 300,
      ratio: '1:16.7',
      temperature: '92°C',
      grindSize: 'medium',
      totalTime: '3:00',
      profile: 'full',
      steps: '[]',
    },
  ]);

  // Dynamic imports — will use the mocked connection
  const { default: recipeRouter } = await import('../routes/recipes');
  const { cors } = await import('hono/cors');

  // Build the Hono app
  app = new Hono();
  app.use('/api/*', cors());
  app.route('/api/recipes', recipeRouter);
});

afterAll(() => {
  destroyTestDb();
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

  it('filters recipes by method query param', async () => {
    const res = await app.request('/api/recipes?method=v60');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(2);
    expect(body.every((r: { method: string }) => r.method === 'v60')).toBe(true);
  });

  it('returns empty array for non-existent method', async () => {
    const res = await app.request('/api/recipes?method=chemex');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  it('strips steps from list response (steps only available in detail)', async () => {
    const res = await app.request('/api/recipes');
    const body = await res.json();
    for (const recipe of body) {
      expect(recipe).not.toHaveProperty('steps');
    }
  });

  it('returns 400 for invalid method query param', async () => {
    const res = await app.request('/api/recipes?method=invalid-method');
    expect(res.status).toBe(400);
  });
});

describe('GET /api/recipes/:id', () => {
  it('returns a single recipe with parsed steps', async () => {
    // Get the list first to find an ID
    const listRes = await app.request('/api/recipes');
    const recipes = await listRes.json() as { id: number }[];

    const res = await app.request(`/api/recipes/${recipes[0].id}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.name).toBeTruthy();
    expect(body.method).toBeTruthy();
    expect(Array.isArray(body.steps)).toBe(true);
  });

  it('returns 404 for non-existent id', async () => {
    const res = await app.request('/api/recipes/999');
    expect(res.status).toBe(404);
  });

  it('returns 400 for invalid id', async () => {
    const res = await app.request('/api/recipes/not-a-number');
    expect(res.status).toBe(400);
  });
});
