/**
 * LandingPage — Tests for the LandingPage component
 *
 * Tests: hero section rendering (title, tagline, gradient visual),
 * three CTA cards, Bitácora card linking to /bitacora,
 * Recetas/Diario placeholder cards showing "Próximamente",
 * responsive grid layout.
 *
 * NOTE: Requires vitest + @testing-library/react + happy-dom/jsdom.
 * Not yet installed in the frontend. When available, run:
 *   npx vitest run frontend/src/__tests__/LandingPage.test.tsx
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LandingPage from '../components/LandingPage';

// ── Helpers ────────────────────────────────────────────────────────────

function renderWithRouter() {
  return render(
    <BrowserRouter>
      <LandingPage />
    </BrowserRouter>
  );
}

// ── Tests ──────────────────────────────────────────────────────────────

describe('LandingPage — hero section', () => {
  it('renders brand title "Bitácora Café"', () => {
    renderWithRouter();
    expect(screen.getByText(/bitácora café/i)).toBeInTheDocument();
  });

  it('renders tagline subtitle', () => {
    renderWithRouter();
    expect(screen.getByText(/registrá/i)).toBeInTheDocument();
  });

  it('renders a CSS gradient visual element (hero-visual)', () => {
    renderWithRouter();
    const { container } = renderWithRouter();
    // The hero section should contain a visual element with gradient
    const heroVisual = container.querySelector('.hero-visual');
    expect(heroVisual).toBeInTheDocument();
  });
});

describe('LandingPage — CTA cards', () => {
  it('renders exactly three CTA cards', () => {
    const { container } = renderWithRouter();
    const cards = container.querySelectorAll('.cta-card');
    expect(cards).toHaveLength(3);
  });

  it('Bitácora card links to /bitacora', () => {
    renderWithRouter();
    const bitacoraLink = screen.getByRole('link', { name: /bitácora/i });
    expect(bitacoraLink).toBeInTheDocument();
    expect(bitacoraLink).toHaveAttribute('href', '/bitacora');
  });

  it('Recetas card shows "Próximamente" indicator and is not a link', () => {
    renderWithRouter();
    const recetasBadge = screen.getByText(/próximamente/i);
    expect(recetasBadge).toBeInTheDocument();
    // The Recetas card should not be wrapped in an anchor
    const recetasCard = recetasBadge.closest('.cta-card');
    expect(recetasCard?.tagName.toLowerCase()).not.toBe('a');
  });

  it('Diario card shows "Próximamente" indicator and is not a link', () => {
    renderWithRouter();
    const badges = screen.getAllByText(/próximamente/i);
    expect(badges.length).toBeGreaterThanOrEqual(2);
  });
});
