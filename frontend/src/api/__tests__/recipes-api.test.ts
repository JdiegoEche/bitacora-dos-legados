/**
 * recipesApi — Unit tests for list() and getById()
 *
 * Follows same pattern as client.test.ts — mocks global fetch.
 * Tests: list without filter, list with method filter, getById found,
 * getById not found.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { recipesApi } from '../client';
import type { Recipe, RecipeDetail } from '../../types';

// ── Helpers ──────────────────────────────────────────────────────────

const API_BASE = 'http://localhost:3001';

function mockFetch(status: number, body: unknown) {
  return vi.mocked(fetch).mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response);
}

// ── Setup ────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.spyOn(globalThis, 'fetch').mockImplementation(
    () => Promise.resolve(new Response()),
  );
});

// ── Tests ────────────────────────────────────────────────────────────

describe('recipesApi.list', () => {
  const sampleRecipes: Recipe[] = [
    {
      id: 1,
      method: 'v60',
      name: 'Classic V60',
      objective: 'Bright cup',
      preparation: null,
      coffeeDose: 15,
      waterDose: 250,
      ratio: '1:16.7',
      temperature: '93°C',
      grindSize: 'medium',
      totalTime: '2:30',
      profile: 'bright',
      createdAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 2,
      method: 'aeropress',
      name: 'Quick Aeropress',
      objective: null,
      preparation: null,
      coffeeDose: 14,
      waterDose: 200,
      ratio: '1:14.3',
      temperature: '88°C',
      grindSize: 'fine',
      totalTime: '1:30',
      profile: 'smooth',
      createdAt: '2026-01-02T00:00:00Z',
    },
  ];

  it('fetches all recipes when no method filter is provided', async () => {
    mockFetch(200, sampleRecipes);

    const result = await recipesApi.list();

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Classic V60');
    expect(result[1].name).toBe('Quick Aeropress');
    expect(fetch).toHaveBeenCalledWith(
      `${API_BASE}/api/recipes`,
      expect.objectContaining({
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  });

  it('fetches recipes filtered by method', async () => {
    const v60Recipes = sampleRecipes.filter((r) => r.method === 'v60');
    mockFetch(200, v60Recipes);

    const result = await recipesApi.list('v60');

    expect(result).toHaveLength(1);
    expect(result[0].method).toBe('v60');
    expect(fetch).toHaveBeenCalledWith(
      `${API_BASE}/api/recipes?method=v60`,
      expect.any(Object),
    );
  });

  it('returns empty array when no recipes match the method', async () => {
    mockFetch(200, []);

    const result = await recipesApi.list('chemex');

    expect(result).toEqual([]);
    expect(fetch).toHaveBeenCalledWith(
      `${API_BASE}/api/recipes?method=chemex`,
      expect.any(Object),
    );
  });

  it('throws ApiError on server error', async () => {
    mockFetch(500, { error: 'Internal server error' });

    await expect(recipesApi.list()).rejects.toThrow('Internal server error');
  });
});

describe('recipesApi.getById', () => {
  it('returns RecipeDetail for a valid recipe ID', async () => {
    const detail: RecipeDetail = {
      id: 1,
      method: 'v60',
      name: 'Classic V60',
      objective: 'Bright cup',
      preparation: null,
      coffeeDose: 15,
      waterDose: 250,
      ratio: '1:16.7',
      temperature: '93°C',
      grindSize: 'medium',
      totalTime: '2:30',
      profile: 'bright',
      createdAt: '2026-01-01T00:00:00Z',
      steps: [
        { stepOrder: 1, instruction: 'Bloom', waterAtStep: 50 },
        { stepOrder: 2, instruction: 'Main pour', waterAtStep: 200 },
      ],
    };
    mockFetch(200, detail);

    const result = await recipesApi.getById(1);

    expect(result.name).toBe('Classic V60');
    expect(result.steps).toHaveLength(2);
    expect(result.steps[0].instruction).toBe('Bloom');
    expect(fetch).toHaveBeenCalledWith(
      `${API_BASE}/api/recipes/1`,
      expect.objectContaining({
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  });

  it('throws ApiError with 404 when recipe is not found', async () => {
    mockFetch(404, { error: 'Recipe not found' });

    let err: unknown;
    try {
      await recipesApi.getById(999);
    } catch (e) {
      err = e;
    }

    expect(err).toBeInstanceOf(Error);
    expect((err as Error).message).toBe('Recipe not found');
    expect((err as { status: number }).status).toBe(404);
  });

  it('throws ApiError for invalid ID', async () => {
    mockFetch(400, { error: 'Invalid recipe ID' });

    await expect(recipesApi.getById(-1)).rejects.toThrow('Invalid recipe ID');
  });
});
