/**
 * client.ts — Auth token injection tests
 *
 * Tests: setAuthToken, clearAuthToken, Authorization header injection.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const TOKEN_KEY = 'bitacora-auth-token';

describe('client.ts — auth token management', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    localStorage.clear();
    originalFetch = globalThis.fetch;
    vi.resetModules();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('exports setAuthToken function', async () => {
    const mod = await import('../api/client');
    expect(mod.setAuthToken).toBeDefined();
    expect(typeof mod.setAuthToken).toBe('function');
  });

  it('exports clearAuthToken function', async () => {
    const mod = await import('../api/client');
    expect(mod.clearAuthToken).toBeDefined();
    expect(typeof mod.clearAuthToken).toBe('function');
  });

  it('injects Authorization header when token is set via setAuthToken', async () => {
    const mockFetch = vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify([]), { status: 200 }))
    );
    globalThis.fetch = mockFetch;

    const mod = await import('../api/client');
    mod.setAuthToken('test-jwt-456');
    await mod.brewsApi.list();

    const callOptions = mockFetch.mock.calls[0][1] || {};
    expect(callOptions.headers).toHaveProperty('Authorization');
    expect(callOptions.headers['Authorization']).toBe('Bearer test-jwt-456');
  });

  it('removes Authorization header after clearAuthToken', async () => {
    const mockFetch = vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify([]), { status: 200 }))
    );
    globalThis.fetch = mockFetch;

    const mod = await import('../api/client');
    mod.setAuthToken('test-jwt-789');
    mod.clearAuthToken();
    await mod.brewsApi.list();

    const callOptions = mockFetch.mock.calls[0][1] || {};
    expect(callOptions.headers['Authorization']).toBeUndefined();
  });
});
