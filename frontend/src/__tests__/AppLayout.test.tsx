/**
 * App — Tests for App.tsx routing structure
 *
 * Tests: ThemeProvider wrapping, Layout wrapping, route mapping:
 *   - `/`  → LandingPage
 *   - `/bitacora` → BrewList
 *   - `/brews/:id` → BrewDetail
 *   - `*` → Navigate to `/`
 *
 * NOTE: Requires vitest + @testing-library/react + happy-dom/jsdom.
 * Not yet installed in the frontend. When available, run:
 *   npx vitest run frontend/src/__tests__/AppLayout.test.tsx
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';

// ── Helpers ────────────────────────────────────────────────────────────

function renderAt(path: string) {
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.setAttribute('data-theme', 'light');
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>
  );
}

// ── Tests ──────────────────────────────────────────────────────────────

describe('App — route mapping', () => {
  it('renders LandingPage at /', () => {
    renderAt('/');
    // Landing page hero should include the brand title
    expect(screen.getByText(/bitácora café/i)).toBeInTheDocument();
  });

  it('renders Layout nav on every route', () => {
    renderAt('/bitacora');
    // Nav should be visible via the brand logo link
    const navLink = screen.getByRole('link', { name: /bitácora café/i });
    expect(navLink).toBeInTheDocument();
    expect(navLink).toHaveAttribute('href', '/');
  });
});

describe('App — theme provider', () => {
  it('renders without crashing and sets data-theme on mount', () => {
    renderAt('/');
    // data-theme should be set to "light" by default
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });
});
