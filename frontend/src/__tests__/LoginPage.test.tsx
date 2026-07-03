/**
 * LoginPage — Tests for the login page component
 *
 * Tests: email form rendering, submit calls API, dev link display.
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AuthProvider } from '../contexts/AuthContext';
import LoginPage from '../components/LoginPage';

function renderAt(path = '/login') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/bitacora" element={<div data-testid="bitacora">Bitácora</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('LoginPage — email form', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    globalThis.fetch = undefined as any;
  });

  it('renders email input and submit button', () => {
    renderAt();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /enviar/i })).toBeInTheDocument();
  });

  it('shows loading state while submitting', async () => {
    // Mock fetch that never resolves during the assertion
    const mockFetch = vi.fn(() => new Promise<Response>(() => {}));
    globalThis.fetch = mockFetch;

    renderAt();
    const input = screen.getByLabelText(/email/i);
    const button = screen.getByRole('button', { name: /enviar/i });

    fireEvent.change(input, { target: { value: 'test@test.com' } });
    fireEvent.click(button);

    // Button should be disabled while submitting
    await waitFor(() => {
      expect(button).toBeDisabled();
    });

    globalThis.fetch = undefined as any;
  });

  it('calls magic link API on submit', async () => {
    const mockFetch = vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );
    globalThis.fetch = mockFetch;

    renderAt();
    const input = screen.getByLabelText(/email/i);
    const button = screen.getByRole('button', { name: /enviar/i });

    fireEvent.change(input, { target: { value: 'user@example.com' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[0]).toContain('/api/auth/request-magic-link');
      if (callArgs[1]) {
        const body = JSON.parse(callArgs[1].body || '{}');
        expect(body.email).toBe('user@example.com');
      }
    });
  });
});
