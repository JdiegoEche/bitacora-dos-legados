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

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getAuthHeader(email: string): Promise<Record<string, string>> {
  const loginRes = await app.request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const { token: jwt } = await loginRes.json() as { token: string };
  return { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' };
}

// ─── Setup ──────────────────────────────────────────────────────────────────

let app: Hono;
let authHeaders: Record<string, string>;

beforeAll(async () => {
  testDb = await createTestDb();

  // Dynamic imports — these will use the mocked connection
  const { default: authRouter } = await import('../routes/auth');
  const { default: brewRouter } = await import('../routes/brews');
  const { default: beanRouter } = await import('../routes/beans');
  const { default: noteRouter } = await import('../routes/notes');
  const { default: recipeRouter } = await import('../routes/recipes');
  const { default: publicBrewRouter } = await import('../routes/public');
  const { cors } = await import('hono/cors');

  // Build the Hono app (same structure as index.ts but without server startup)
  app = new Hono();
  app.use('/api/*', cors());
  app.route('/api/auth', authRouter);
  app.route('/api/brews', brewRouter);
  app.route('/api/beans', beanRouter);
  app.route('/api', noteRouter);
  app.route('/api/recipes', recipeRouter);
  app.route('/api/public/brews', publicBrewRouter);
  app.get('/api/health', (c) => c.json({ status: 'ok' }));

  // Create test user and get auth headers for protected routes
  authHeaders = await getAuthHeader('integration-test@test.com');
});

// ─── Second user for auth scoping tests ─────────────────────────────────────

let otherUserHeaders: Record<string, string>;

beforeAll(async () => {
  otherUserHeaders = await getAuthHeader('other-user@test.com');
});

afterAll(() => {
  destroyTestDb();
});

// ─── Coffee Bean API Tests ──────────────────────────────────────────────────

describe('POST /api/beans', () => {
  it('creates a bean and returns 201', async () => {
    const res = await app.request('/api/beans', {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
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
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
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
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Zulu Bean', roaster: 'Z' }),
    });
    await app.request('/api/beans', {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Alpha Bean', roaster: 'A' }),
    });

    const res = await app.request('/api/beans', { headers: authHeaders });
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
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Update Me', roaster: 'R' }),
    });
    const bean = await createRes.json();

    const res = await app.request(`/api/beans/${bean.id}`, {
      method: 'PUT',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ roastLevel: 'dark' }),
    });
    expect(res.status).toBe(200);
    const updated = await res.json();
    expect(updated.roastLevel).toBe('dark');
  });

  it('returns 404 for non-existent bean', async () => {
    const res = await app.request('/api/beans/99999', {
      method: 'PUT',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Nope' }),
    });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/beans/:id', () => {
  it('deletes unreferenced bean and returns 204', async () => {
    const createRes = await app.request('/api/beans', {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Delete Me', roaster: 'R' }),
    });
    const bean = await createRes.json();

    const res = await app.request(`/api/beans/${bean.id}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    expect(res.status).toBe(204);
  });

  it('returns 404 for non-existent bean delete', async () => {
    const res = await app.request('/api/beans/99999', {
      method: 'DELETE',
      headers: authHeaders,
    });
    expect(res.status).toBe(404);
  });
});

// ─── Brew Session API Tests ─────────────────────────────────────────────────

describe('POST /api/brews', () => {
  it('creates a brew and returns 201', async () => {
    const res = await app.request('/api/brews', {
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
    expect(res.status).toBe(201);
    const brew = await res.json();
    expect(brew.id).toBeGreaterThan(0);
    expect(brew.method).toBe('V60');
  });
});

// SKIPPED: pg-mem v2.9.1 does not support LATERAL JOIN generated by
// drizzle `findFirst({ with: { ... } })`. Tests pass against real PostgreSQL.
// See: backend/notes/pg-mem-limitations.md
describe.skip('GET /api/brews/:id', () => {
  it('returns brew with relations', async () => {
    const createRes = await app.request('/api/brews', {
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
    const created = await createRes.json();

    const res = await app.request(`/api/brews/${created.id}`, {
      headers: authHeaders,
    });
    expect(res.status).toBe(200);
    const brew = await res.json();
    expect(brew.method).toBe('Aeropress');
    expect(Array.isArray(brew.tastingNotes)).toBe(true);
  });

  it('returns 404 for non-existent brew', async () => {
    const res = await app.request('/api/brews/99999', { headers: authHeaders });
    expect(res.status).toBe(404);
  });
});

// ─── Tasting Note API Tests ─────────────────────────────────────────────────

describe('POST /api/brews/:brewId/notes', () => {
  it('creates a note for existing brew and returns 201', async () => {
    const brewRes = await app.request('/api/brews', {
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
    const brew = await brewRes.json();

    const res = await app.request(`/api/brews/${brew.id}/notes`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
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
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ aroma: 'test' }),
    });
    expect(res.status).toBe(404);
  });
});

describe('GET /api/brews/:brewId/notes', () => {
  it('returns notes for a brew', async () => {
    const brewRes = await app.request('/api/brews', {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
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
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ aroma: 'nutty' }),
    });
    await app.request(`/api/brews/${brew.id}/notes`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ flavor: 'caramel' }),
    });

    const res = await app.request(`/api/brews/${brew.id}/notes`, {
      headers: authHeaders,
    });
    expect(res.status).toBe(200);
    const notes = await res.json();
    expect(notes).toHaveLength(2);
  });

  it('returns 404 for brew that does not exist', async () => {
    const res = await app.request('/api/brews/99999/notes', {
      headers: authHeaders,
    });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/notes/:id', () => {
  it('deletes a single note and returns 204', async () => {
    const brewRes = await app.request('/api/brews', {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
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
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ aroma: 'test delete' }),
    });
    const note = await noteRes.json();

    const res = await app.request(`/api/notes/${note.id}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    expect(res.status).toBe(204);
  });

  it('returns 404 for non-existent note', async () => {
    const res = await app.request('/api/notes/99999', {
      method: 'DELETE',
      headers: authHeaders,
    });
    expect(res.status).toBe(404);
  });
});

// ─── Bean Stats & History Tests ──────────────────────────────────────────────

describe('GET /api/beans/:id — with stats', () => {
  it('returns bean with avgRating, brewCount, methodBreakdown', async () => {
    // Create a bean
    const beanRes = await app.request('/api/beans', {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Stats Bean', roaster: 'Stats Roaster' }),
    });
    const bean = await beanRes.json();

    // Create brews with different methods
    const brewPayloads = [
      { method: 'V60', grindSize: 'medium', waterTemp: 93, brewTime: '2:30', coffeeDose: 15, waterDose: 250, coffeeBeanId: bean.id, rating: '1:15' },
      { method: 'V60', grindSize: 'medium', waterTemp: 93, brewTime: '2:35', coffeeDose: 15, waterDose: 250, coffeeBeanId: bean.id, rating: '1:15' },
      { method: 'Aeropress', grindSize: 'fine', waterTemp: 88, brewTime: '1:45', coffeeDose: 14, waterDose: 200, coffeeBeanId: bean.id, rating: '1:14' },
    ];

    const brewIds: number[] = [];
    for (const payload of brewPayloads) {
      const brewRes = await app.request('/api/brews', {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const brew = await brewRes.json();
      brewIds.push(brew.id);
    }

    // Add tasting notes with numeric ratings (these drive avgRating, not brewSessions.rating)
    const noteRatings = [4, 5, 3];
    for (let i = 0; i < brewIds.length; i++) {
      await app.request(`/api/brews/${brewIds[i]}/notes`, {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: noteRatings[i], aroma: 'test' }),
      });
    }

    const res = await app.request(`/api/beans/${bean.id}`, {
      headers: authHeaders,
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.avgRating).toBeCloseTo(4, 0);
    expect(body.brewCount).toBe(3);
    expect(body.methodBreakdown).toEqual({ V60: 2, Aeropress: 1 });
  });

  it('returns 404 for non-existent bean', async () => {
    const res = await app.request('/api/beans/99999', { headers: authHeaders });
    expect(res.status).toBe(404);
  });

  it('returns stats with brewCount 0 when bean has no brews', async () => {
    const beanRes = await app.request('/api/beans', {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Lonely Bean', roaster: 'Solo' }),
    });
    const bean = await beanRes.json();

    const res = await app.request(`/api/beans/${bean.id}`, {
      headers: authHeaders,
    });
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
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'History Bean', roaster: 'History R' }),
    });
    const bean = await beanRes.json();

    // Create 2 brews for the bean
    const brew1Res = await app.request('/api/brews', {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
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
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: 'Aeropress', grindSize: 'fine', waterTemp: 88, brewTime: '120',
        coffeeDose: 14, waterDose: 200, coffeeBeanId: bean.id,
      }),
    });
    const brew2 = await brew2Res.json();

    // Add tasting notes to brew2 (the newer brew)
    await app.request(`/api/brews/${brew2.id}/notes`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ aroma: 'floral', flavor: 'berry' }),
    });

    const res = await app.request(`/api/beans/${bean.id}/brews`, {
      headers: authHeaders,
    });
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
    const res = await app.request('/api/beans/99999/brews', {
      headers: authHeaders,
    });
    expect(res.status).toBe(404);
  });

  it('returns 200 with empty array when bean has no brews', async () => {
    const beanRes = await app.request('/api/beans', {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'No Brews Yet', roaster: 'Empty R' }),
    });
    const bean = await beanRes.json();

    const res = await app.request(`/api/beans/${bean.id}/brews`, {
      headers: authHeaders,
    });
    expect(res.status).toBe(200);
    const brews = await res.json();
    expect(brews).toEqual([]);
  });
});

// ─── Brew Sharing Tests ─────────────────────────────────────────────────────

describe('PATCH /api/brews/:id/share', () => {
  let brewId: number;

  beforeAll(async () => {
    // Create a brew to share
    const res = await app.request('/api/brews', {
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
    const brew = await res.json();
    brewId = brew.id;
  });

  it('enables sharing and returns shareToken', async () => {
    const res = await app.request(`/api/brews/${brewId}/share`, {
      method: 'PATCH',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublic: true }),
    });
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.isPublic).toBe(true);
    expect(typeof body.shareToken).toBe('string');
    expect(body.shareToken).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });

  it('disables sharing and clears shareToken', async () => {
    const res = await app.request(`/api/brews/${brewId}/share`, {
      method: 'PATCH',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublic: false }),
    });
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.isPublic).toBe(false);
    expect(body.shareToken).toBeNull();
  });

  it('returns 404 for another user\'s brew', async () => {
    const res = await app.request(`/api/brews/${brewId}/share`, {
      method: 'PATCH',
      headers: { ...otherUserHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublic: true }),
    });
    expect(res.status).toBe(404);
  });

  it('returns 400 when isPublic is not a boolean', async () => {
    const res = await app.request(`/api/brews/${brewId}/share`, {
      method: 'PATCH',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublic: 'not-a-boolean' }),
    });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/public/brews/:shareToken', () => {
  let shareToken: string;
  let sharedBrewId: number;

  beforeAll(async () => {
    // Create a brew and enable sharing to get a valid token
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
    sharedBrewId = brew.id;

    const shareRes = await app.request(`/api/brews/${brew.id}/share`, {
      method: 'PATCH',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublic: true }),
    });
    const shareBody = await shareRes.json();
    shareToken = shareBody.shareToken;
  });

  // SKIPPED: pg-mem v2.9.1 does not support LATERAL JOIN generated by
  // drizzle `findFirst({ with: { ... } })`. Tests pass against real PostgreSQL.
  // See: backend/notes/pg-mem-limitations.md
  it.skip('returns brew with coffee bean and tasting notes for valid token', async () => {
    const res = await app.request(`/api/public/brews/${shareToken}`, {
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.method).toBe('Aeropress');
    expect(Array.isArray(body.tastingNotes)).toBe(true);
  });

  it.skip('returns 404 for invalid share token', async () => {
    const res = await app.request('/api/public/brews/invalid-token-123', {
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe('Brew not found or not shared');
  });

  it.skip('returns 404 after sharing is disabled', async () => {
    // Disable sharing using the stored brew ID
    await app.request(`/api/brews/${sharedBrewId}/share`, {
      method: 'PATCH',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublic: false }),
    });

    const res = await app.request(`/api/public/brews/${shareToken}`, {
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe('Brew not found or not shared');
  });
});

// ─── Recipe Routes (Public — No Auth Required) ──────────────────────────────

describe('Recipe routes — public access', () => {
  it('GET /api/recipes returns 200 without auth headers', async () => {
    const res = await app.request('/api/recipes');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  it('GET /api/recipes/:id returns 200 without auth headers', async () => {
    const res = await app.request('/api/recipes/99999');
    // Non-existent returns 404, not 401 — proving no auth middleware
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBeDefined();
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
