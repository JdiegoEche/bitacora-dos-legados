/**
 * API Client — Unit tests for beansApi and brewsApi methods
 *
 * Tests the new/high-risk API methods: getById (with stats), getBrewsByBean.
 * Uses vi.fn() to mock global fetch — no HTTP server needed.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { beansApi } from '../client';
import type { CoffeeBeanWithStats, BrewSessionWithNotes } from '../../types';

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

describe('beansApi.getById', () => {
  it('returns CoffeeBeanWithStats for a valid bean ID', async () => {
    const stats: CoffeeBeanWithStats = {
      id: 3,
      name: 'Ethiopia Yirgacheffe',
      roaster: 'Counter Culture',
      origin: 'Ethiopia',
      roastLevel: 'light',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
      avgRating: 4,
      brewCount: 4,
      methodBreakdown: { V60: 3, Aeropress: 1 },
    };
    mockFetch(200, stats);

    const result = await beansApi.getById(3);

    expect(result).toEqual(stats);
    expect(result.brewCount).toBe(4);
    expect(result.avgRating).toBe(4);
    expect(result.methodBreakdown).toHaveProperty('V60');
    expect(fetch).toHaveBeenCalledWith(
      `${API_BASE}/api/beans/3`,
      expect.objectContaining({
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  });

  it('throws ApiError with status 404 when bean is not found', async () => {
    mockFetch(404, { error: 'Coffee bean not found' });

    let err: unknown;
    try {
      await beansApi.getById(999);
    } catch (e) {
      err = e;
    }

    expect(err).toBeInstanceOf(Error);
    expect((err as Error).message).toBe('Coffee bean not found');
    expect((err as { status: number }).status).toBe(404);
  });
});

describe('beansApi.getBrewsByBean', () => {
  it('returns BrewSessionWithNotes array for a bean with brews', async () => {
    const brews: BrewSessionWithNotes[] = [
      {
        id: 10,
        coffeeBeanId: 3,
        method: 'V60',
        brewTime: '2:30',
        grindSize: 'medium',
        waterTemp: 93,
        coffeeDose: 15,
        waterDose: 250,
        notes: 'Bright and floral',
        rating: 4,
        createdAt: '2026-06-15T10:00:00Z',
        updatedAt: '2026-06-15T10:00:00Z',
        tastingNotesSummary: 'aroma: floral, flavor: berry',
      },
      {
        id: 9,
        coffeeBeanId: 3,
        method: 'Aeropress',
        brewTime: '1:45',
        grindSize: 'fine',
        waterTemp: 85,
        coffeeDose: 14,
        waterDose: 200,
        notes: null,
        rating: 3,
        createdAt: '2026-06-10T10:00:00Z',
        updatedAt: '2026-06-10T10:00:00Z',
        tastingNotesSummary: null,
      },
    ];
    mockFetch(200, brews);

    const result = await beansApi.getBrewsByBean(3);

    expect(result).toHaveLength(2);
    expect(result[0].tastingNotesSummary).toBe('aroma: floral, flavor: berry');
    expect(result[1].tastingNotesSummary).toBeNull();
    expect(fetch).toHaveBeenCalledWith(
      `${API_BASE}/api/beans/3/brews`,
      expect.any(Object),
    );
  });

  it('returns empty array for a bean with no brews', async () => {
    mockFetch(200, []);

    const result = await beansApi.getBrewsByBean(7);

    expect(result).toEqual([]);
  });

  it('throws ApiError for non-existent bean', async () => {
    mockFetch(404, { error: 'Coffee bean not found' });

    await expect(beansApi.getBrewsByBean(999)).rejects.toThrow(
      'Coffee bean not found',
    );
  });
});
