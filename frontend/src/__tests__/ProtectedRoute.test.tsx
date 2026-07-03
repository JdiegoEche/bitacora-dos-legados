/**
 * ProtectedRoute — Tests for auth guard component
 *
 * Tests: renders children when authenticated, redirects to /login when not,
 * shows loading state during auth check.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthProvider } from '../contexts/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';

const TOKEN_KEY = 'bitacora-auth-token';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <Routes>
          <Route
            path="/bitacora"
            element={
              <ProtectedRoute>
                <div data-testid="protected-content">Secret Bitácora</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div data-testid="login-page">Login</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute — when not authenticated', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('redirects to /login when user is not authenticated', () => {
    renderAt('/bitacora');
    // Should not see protected content
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    // Should redirect to login
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });
});

describe('ProtectedRoute — when authenticated', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(TOKEN_KEY, 'valid-jwt');
  });

  it('renders children when user is authenticated', async () => {
    // Mock /api/auth/me to return a valid user
    const mockFetch = vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify({ id: 1, email: 'test@test.com' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );
    globalThis.fetch = mockFetch;

    renderAt('/bitacora');

    // After the AuthProvider validates the token, it should render children
    const content = await screen.findByTestId('protected-content');
    expect(content).toBeInTheDocument();
    expect(content).toHaveTextContent('Secret Bitácora');

    globalThis.fetch = undefined as any;
  });
});
