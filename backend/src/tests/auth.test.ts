import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import { Hono } from 'hono';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getAuthHeader(email: string): Promise<Record<string, string>> {
  const devRes = await app.request(
    `/api/auth/dev-magic-link?email=${encodeURIComponent(email)}`,
  );
  const { magicLink } = await devRes.json() as { magicLink: string };
  const rawToken = new URL(magicLink).searchParams.get('token') || '';
  const verifyRes = await app.request(`/api/auth/verify?token=${rawToken}`);
  const { token: jwt } = await verifyRes.json() as { token: string };
  return { Authorization: `Bearer ${jwt}` };
}

// ─── AuthLib Unit Tests ─────────────────────────────────────────────────────
// These test the pure functions in ../lib/auth before the implementation exists.
// All tests will fail at import time (RED) until lib/auth.ts is created.

describe('signJWT / verifyJWT', () => {
  it('signs a JWT with HS256 and verifies it', async () => {
    const { signJWT, verifyJWT } = await import('../lib/auth');
    const payload = { userId: 1, email: 'test@example.com' };
    const token = await signJWT(payload);
    expect(typeof token).toBe('string');
    // JWTs have 3 dot-separated segments
    expect(token.split('.')).toHaveLength(3);

    const decoded = await verifyJWT(token);
    expect(decoded.userId).toBe(1);
    expect(decoded.email).toBe('test@example.com');
  });

  it('rejects an invalid JWT', async () => {
    const { verifyJWT } = await import('../lib/auth');
    await expect(verifyJWT('invalid.token.here')).rejects.toThrow();
  });

  it('rejects a tampered JWT', async () => {
    const { signJWT, verifyJWT } = await import('../lib/auth');
    const token = await signJWT({ userId: 1, email: 'test@example.com' });
    const parts = token.split('.');
    // Tamper the payload segment
    const tampered = [parts[0], 'eyJ0YW1wZXJlZCI6dHJ1ZX0', parts[2]].join('.');
    await expect(verifyJWT(tampered)).rejects.toThrow();
  });
});

describe('generateToken / hashToken', () => {
  it('generateToken produces a raw token and a hash', async () => {
    const { generateToken } = await import('../lib/auth');
    const result = generateToken();
    expect(typeof result.raw).toBe('string');
    expect(result.raw.length).toBeGreaterThan(0);
    expect(typeof result.hash).toBe('string');
    expect(result.hash.length).toBeGreaterThan(0);
  });

  it('hashToken produces a consistent SHA-256 hex string', async () => {
    const { hashToken } = await import('../lib/auth');
    const input = 'test-raw-token-123';
    const hash = hashToken(input);
    // SHA-256 hex is 64 characters
    expect(hash).toHaveLength(64);
    expect(/^[a-f0-9]{64}$/.test(hash)).toBe(true);
  });

  it('hashToken is deterministic — same input produces same hash', async () => {
    const { hashToken } = await import('../lib/auth');
    const input = 'deterministic-test';
    expect(hashToken(input)).toBe(hashToken(input));
  });

  it('generateToken raw token hashes to the stored hash', async () => {
    const { generateToken, hashToken } = await import('../lib/auth');
    const result = generateToken();
    expect(hashToken(result.raw)).toBe(result.hash);
  });
});

// ─── Auth Route Integration Tests ─────────────────────────────────────────────
// These test the full auth flow using app.request() with a real test database.

function extractToken(magicLink: string): string {
  const url = new URL(magicLink);
  return url.searchParams.get('token') || '';
}

let testDir: string;
let app: Hono;

beforeAll(async () => {
  testDir = mkdtempSync(join(tmpdir(), 'bitacora-auth-int-'));
  const dbPath = join(testDir, 'test.db');

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
      grinder TEXT,
      clicks TEXT,
      coffee_dose REAL,
      water_dose REAL,
      notes TEXT,
      rating TEXT,
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
  `);

  sqlite.close();

  process.env.DATABASE_URL = dbPath;

  // Dynamic imports — these will see DATABASE_URL set above
  const { default: authRouter } = await import('../routes/auth');
  const { default: brewRouter } = await import('../routes/brews');
  const { default: beanRouter } = await import('../routes/beans');
  const { default: noteRouter } = await import('../routes/notes');
  const { cors } = await import('hono/cors');

  app = new Hono();
  app.use('/api/*', cors());
  app.route('/api/auth', authRouter);
  app.route('/api/brews', brewRouter);
  app.route('/api/beans', beanRouter);
  app.route('/api', noteRouter);
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

// ─── Request Magic Link ──────────────────────────────────────────────────────

describe('POST /api/auth/request-magic-link', () => {
  it('returns ok for new email', async () => {
    const res = await app.request('/api/auth/request-magic-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'newuser@test.com' }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true });
  });

  it('returns ok for existing email (upsert)', async () => {
    // First request creates the user
    const res1 = await app.request('/api/auth/request-magic-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'existing@test.com' }),
    });
    expect(res1.status).toBe(200);

    // Second request upserts (finds existing)
    const res2 = await app.request('/api/auth/request-magic-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'existing@test.com' }),
    });
    expect(res2.status).toBe(200);
    const body2 = await res2.json();
    expect(body2).toEqual({ ok: true });
  });

  it('returns 400 for invalid email', async () => {
    const res = await app.request('/api/auth/request-magic-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email' }),
    });
    expect(res.status).toBe(400);
  });
});

// ─── Dev Magic Link ──────────────────────────────────────────────────────────

describe('GET /api/auth/dev-magic-link', () => {
  it('returns a magic link URL with token', async () => {
    const res = await app.request('/api/auth/dev-magic-link?email=devtest@test.com');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.magicLink).toMatch(/^http:\/\/localhost:5173\/auth\/verify\?token=/);
  });

  it('creates user and returns valid magic link', async () => {
    const email = 'freshdev@test.com';
    const res = await app.request(`/api/auth/dev-magic-link?email=${email}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(typeof body.magicLink).toBe('string');

    const rawToken = extractToken(body.magicLink);
    expect(rawToken.length).toBeGreaterThan(0);

    // Verify the token actually works
    const verifyRes = await app.request(`/api/auth/verify?token=${rawToken}`);
    expect(verifyRes.status).toBe(200);
  });

  it('returns 401 when NODE_ENV is production', async () => {
    const prevEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const res = await app.request('/api/auth/dev-magic-link?email=prodtest@test.com');
    expect(res.status).toBe(401);

    process.env.NODE_ENV = prevEnv;
  });

  it('returns 400 when email is missing', async () => {
    const res = await app.request('/api/auth/dev-magic-link');
    expect(res.status).toBe(400);
  });
});

// ─── Verify Magic Link ───────────────────────────────────────────────────────

describe('GET /api/auth/verify', () => {
  it('verifies a valid token and returns JWT', async () => {
    const devRes = await app.request('/api/auth/dev-magic-link?email=verifytest@test.com');
    const { magicLink } = await devRes.json();
    const rawToken = extractToken(magicLink);

    const res = await app.request(`/api/auth/verify?token=${rawToken}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(typeof body.token).toBe('string');
    expect(body.token.split('.')).toHaveLength(3);
  });

  it('rejects already-used token (double-use)', async () => {
    const devRes = await app.request('/api/auth/dev-magic-link?email=doubletest@test.com');
    const { magicLink } = await devRes.json();
    const rawToken = extractToken(magicLink);

    // First use — should succeed
    const firstRes = await app.request(`/api/auth/verify?token=${rawToken}`);
    expect(firstRes.status).toBe(200);

    // Second use — should be rejected
    const secondRes = await app.request(`/api/auth/verify?token=${rawToken}`);
    expect(secondRes.status).toBe(401);
    const body = await secondRes.json();
    expect(body.error).toBeDefined();
  });

  it('rejects expired token', async () => {
    // Create a user and token via dev endpoint
    const devRes = await app.request('/api/auth/dev-magic-link?email=expiredtest@test.com');
    const { magicLink } = await devRes.json();
    const rawToken = extractToken(magicLink);

    // Hash the token so we can find it in the DB
    const { hashToken: ht } = await import('../lib/auth');
    const tokenHash = ht(rawToken);

    // Manually set the token to be expired (1 hour ago)
    const { db } = await import('../db/connection');
    const { magicLinkTokens } = await import('../db/schema');
    const { eq } = await import('drizzle-orm');

    await db
      .update(magicLinkTokens)
      .set({ expiresAt: new Date(Date.now() - 3_600_000).toISOString() })
      .where(eq(magicLinkTokens.tokenHash, tokenHash));

    const res = await app.request(`/api/auth/verify?token=${rawToken}`);
    expect(res.status).toBe(401);
  });

  it('rejects invalid token', async () => {
    const res = await app.request('/api/auth/verify?token=invalidtokenhex1234567890');
    expect(res.status).toBe(401);
  });

  it('returns 400 when token query param is missing', async () => {
    const res = await app.request('/api/auth/verify');
    expect(res.status).toBe(400);
  });
});

// ─── Get Current User ────────────────────────────────────────────────────────

describe('GET /api/auth/me', () => {
  it('returns user with valid JWT', async () => {
    // Full flow: get token, then authenticate via me
    const email = 'metest@test.com';
    const devRes = await app.request(`/api/auth/dev-magic-link?email=${email}`);
    const { magicLink } = await devRes.json();
    const rawToken = extractToken(magicLink);

    const verifyRes = await app.request(`/api/auth/verify?token=${rawToken}`);
    const { token: jwt } = await verifyRes.json();

    const res = await app.request('/api/auth/me', {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    expect(res.status).toBe(200);
    const user = await res.json();
    expect(user.email).toBe(email);
    expect(user.id).toBeGreaterThan(0);
  });

  it('returns 401 without Authorization header', async () => {
    const res = await app.request('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns 401 with invalid Authorization header', async () => {
    const res = await app.request('/api/auth/me', {
      headers: { Authorization: 'Bearer invalid.jwt.token' },
    });
    expect(res.status).toBe(401);
  });
});

// ─── Data Isolation Tests (TDD 4.1 RED) ───────────────────────────────────────

describe('Data Isolation — Beans', () => {
  let userAHeaders: Record<string, string>;
  let userBHeaders: Record<string, string>;
  let beanAId: number;
  let beanBId: number;

  beforeAll(async () => {
    userAHeaders = await getAuthHeader('isolation-a@test.com');
    userBHeaders = await getAuthHeader('isolation-b@test.com');
  });

  it('User A creates a bean → 201', async () => {
    const res = await app.request('/api/beans', {
      method: 'POST',
      headers: { ...userAHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Bean A', roaster: 'Roaster A' }),
    });
    expect(res.status).toBe(201);
    const bean = await res.json() as { id: number };
    beanAId = bean.id;
    expect(beanAId).toBeGreaterThan(0);
  });

  it('User B creates a bean → 201', async () => {
    const res = await app.request('/api/beans', {
      method: 'POST',
      headers: { ...userBHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Bean B', roaster: 'Roaster B' }),
    });
    expect(res.status).toBe(201);
    const bean = await res.json() as { id: number };
    beanBId = bean.id;
    expect(beanBId).toBeGreaterThan(0);
  });

  it('User B lists beans — does NOT see User A bean', async () => {
    const res = await app.request('/api/beans', { headers: userBHeaders });
    expect(res.status).toBe(200);
    const beans = await res.json() as { id: number; name: string }[];
    const ids = beans.map((b) => b.id);
    expect(ids).toContain(beanBId);
    expect(ids).not.toContain(beanAId);
  });

  it('User B reads User A bean by ID → 404', async () => {
    const res = await app.request(`/api/beans/${beanAId}`, {
      headers: userBHeaders,
    });
    expect(res.status).toBe(404);
  });

  it('User B updates User A bean → 404', async () => {
    const res = await app.request(`/api/beans/${beanAId}`, {
      method: 'PUT',
      headers: { ...userBHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Hacked' }),
    });
    expect(res.status).toBe(404);
  });

  it('User B deletes User A bean → 404', async () => {
    const res = await app.request(`/api/beans/${beanAId}`, {
      method: 'DELETE',
      headers: userBHeaders,
    });
    expect(res.status).toBe(404);
  });

  it('User A can still read own bean after cross-user attempt', async () => {
    const res = await app.request(`/api/beans/${beanAId}`, {
      headers: userAHeaders,
    });
    expect(res.status).toBe(200);
    const bean = await res.json() as { name: string };
    expect(bean.name).toBe('Bean A');
  });
});

describe('Data Isolation — Brews', () => {
  let userAHeaders: Record<string, string>;
  let userBHeaders: Record<string, string>;
  let brewAId: number;

  beforeAll(async () => {
    userAHeaders = await getAuthHeader('isolation-brew-a@test.com');
    userBHeaders = await getAuthHeader('isolation-brew-b@test.com');
  });

  it('User A creates a brew → 201', async () => {
    const res = await app.request('/api/brews', {
      method: 'POST',
      headers: { ...userAHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: 'V60', grindSize: 'medium', waterTemp: 93, brewTime: '150',
        coffeeDose: 15, waterDose: 250,
      }),
    });
    expect(res.status).toBe(201);
    const brew = await res.json() as { id: number };
    brewAId = brew.id;
    expect(brewAId).toBeGreaterThan(0);
  });

  it('User B lists brews — does NOT see User A brew', async () => {
    const res = await app.request('/api/brews', { headers: userBHeaders });
    expect(res.status).toBe(200);
    const brews = await res.json() as { id: number }[];
    const ids = brews.map((b) => b.id);
    expect(ids).not.toContain(brewAId);
  });

  it('User B reads User A brew by ID → 404', async () => {
    const res = await app.request(`/api/brews/${brewAId}`, {
      headers: userBHeaders,
    });
    expect(res.status).toBe(404);
  });

  it('User B updates User A brew → 404', async () => {
    const res = await app.request(`/api/brews/${brewAId}`, {
      method: 'PUT',
      headers: { ...userBHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ method: 'Hacked' }),
    });
    expect(res.status).toBe(404);
  });

  it('User B deletes User A brew → 404', async () => {
    const res = await app.request(`/api/brews/${brewAId}`, {
      method: 'DELETE',
      headers: userBHeaders,
    });
    expect(res.status).toBe(404);
  });
});

describe('Data Isolation — Notes (indirect via brew session)', () => {
  let userAHeaders: Record<string, string>;
  let userBHeaders: Record<string, string>;
  let brewAId: number;
  let noteAId: number;

  beforeAll(async () => {
    userAHeaders = await getAuthHeader('isolation-note-a@test.com');
    userBHeaders = await getAuthHeader('isolation-note-b@test.com');

    // User A creates a brew
    const brewRes = await app.request('/api/brews', {
      method: 'POST',
      headers: { ...userAHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: 'Chemex', grindSize: 'medium-coarse', waterTemp: 92,
        brewTime: '240', coffeeDose: 30, waterDose: 500,
      }),
    });
    const brew = await brewRes.json() as { id: number };
    brewAId = brew.id;

    // User A creates a note on own brew
    const noteRes = await app.request(`/api/brews/${brewAId}/notes`, {
      method: 'POST',
      headers: { ...userAHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ aroma: 'floral', flavor: 'berry' }),
    });
    const note = await noteRes.json() as { id: number };
    noteAId = note.id;
  });

  it('User B creates note for User A brew → 404', async () => {
    const res = await app.request(`/api/brews/${brewAId}/notes`, {
      method: 'POST',
      headers: { ...userBHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ aroma: 'hacked' }),
    });
    expect(res.status).toBe(404);
  });

  it('User B lists notes for User A brew → 404', async () => {
    const res = await app.request(`/api/brews/${brewAId}/notes`, {
      headers: userBHeaders,
    });
    expect(res.status).toBe(404);
  });

  it('User B deletes User A note → 404', async () => {
    const res = await app.request(`/api/notes/${noteAId}`, {
      method: 'DELETE',
      headers: userBHeaders,
    });
    expect(res.status).toBe(404);
  });
});

describe('Data Isolation — Unauthenticated', () => {
  it('GET /api/brews returns 401 without auth', async () => {
    const res = await app.request('/api/brews');
    expect(res.status).toBe(401);
  });

  it('POST /api/brews returns 401 without auth', async () => {
    const res = await app.request('/api/brews', { method: 'POST' });
    expect(res.status).toBe(401);
  });

  it('GET /api/beans returns 401 without auth', async () => {
    const res = await app.request('/api/beans');
    expect(res.status).toBe(401);
  });

  it('POST /api/beans returns 401 without auth', async () => {
    const res = await app.request('/api/beans', { method: 'POST' });
    expect(res.status).toBe(401);
  });

  it('GET /api/brews/:brewId/notes returns 401 without auth', async () => {
    const res = await app.request('/api/brews/1/notes');
    expect(res.status).toBe(401);
  });

  it('DELETE /api/notes/:id returns 401 without auth', async () => {
    const res = await app.request('/api/notes/1', { method: 'DELETE' });
    expect(res.status).toBe(401);
  });
});
