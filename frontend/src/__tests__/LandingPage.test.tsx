/**
 * LandingPage — Tests for the LandingPage component
 *
 * Tests: hero section rendering (title, tagline, gradient visual),
 * three CTA cards, Bitácora card linking to /bitacora,
 * Recetas/Diario placeholder cards showing "Próximamente",
 * responsive grid layout.
 *
 * NOTE: Recetas and Diario are both placeholders with "Próximamente" badge,
 * so getAllByText is used for that text.
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
