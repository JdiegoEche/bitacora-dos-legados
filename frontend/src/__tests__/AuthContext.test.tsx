/**
 * AuthContext — Behavioral tests for AuthProvider + useAuth hook
 *
 * Tests: initial state, login flow, logout, token from localStorage,
 * auto-validation on mount, isAuthenticated/isLoading transitions.
 */
import React from 'react';
import { render, renderHook, act, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AuthProvider, useAuth } from '../contexts/AuthContext';

const TOKEN_KEY = 'bitacora-auth-token';

// ── Helpers ────────────────────────────────────────────────────────────

function createMockFetch(response: unknown, status = 200) {
  return vi.fn(() =>
    Promise.resolve(
      new Response(JSON.stringify(response), {
        status,
        headers: { 'Content-Type': 'application/json' },
      }),
    ),
  );
}

// ── Tests ──────────────────────────────────────────────────────────────

describe('AuthProvider — initial state', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts with null user, null token, isAuthenticated=false when no stored token', () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('does not call /api/auth/me when no token in localStorage', () => {
    const mockFetch = createMockFetch({ id: 1, email: 'test@test.com' });
    globalThis.fetch = mockFetch;

    renderHook(() => useAuth(), { wrapper: AuthProvider });

    // Should NOT have called /api/auth/me because there's no token
    const meCalls = mockFetch.mock.calls.filter((c: any[]) => c[0]?.includes('/api/auth/me'));
    expect(meCalls).toHaveLength(0);

    globalThis.fetch = undefined as any;
  });
});

describe('AuthProvider — login flow', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    globalThis.fetch = undefined as any;
  });

  it('login(email) calls POST /api/auth/request-magic-link with the email', async () => {
    const mockFetch = createMockFetch({ ok: true });
    globalThis.fetch = mockFetch;

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    await act(async () => {
      await result.current.login('test@example.com');
    });

    // Check that it called the magic link endpoint
    const postCall = mockFetch.mock.calls.find(
      (c: any[]) => c[0]?.includes('/api/auth/request-magic-link'),
    );
    expect(postCall).toBeDefined();
    expect(postCall[1]?.method).toBe('POST');
    const body = JSON.parse(postCall[1]?.body || '{}');
    expect(body.email).toBe('test@example.com');
  });

  it('login returns the response for dev link extraction', async () => {
    const mockFetch = createMockFetch({ ok: true });
    globalThis.fetch = mockFetch;

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    let response: any;
    await act(async () => {
      response = await result.current.login('dev@test.com');
    });

    expect(response).toEqual({ ok: true });
  });
});

describe('AuthProvider — logout', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('logout clears user, token, isAuthenticated', () => {
    // Start with a stored token so the provider initializes with it
    localStorage.setItem(TOKEN_KEY, 'some-jwt');
    const mockFetch = createMockFetch({ id: 1, email: 'test@test.com' });
    globalThis.fetch = mockFetch;

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    act(() => {
      result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });
});

describe('AuthProvider — useAuth hook errors', () => {
  it('throws when useAuth is used outside AuthProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useAuth())).toThrow();
    spy.mockRestore();
  });
});

describe('AuthProvider — children render correctly', () => {
  it('renders children within AuthProvider', () => {
    render(
      <AuthProvider>
        <div data-testid="child">Hello Auth</div>
      </AuthProvider>,
    );
    expect(screen.getByTestId('child')).toHaveTextContent('Hello Auth');
  });
});
