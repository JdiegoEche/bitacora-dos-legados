/**
 * Layout — Tests for the Layout component
 *
 * Tests: nav bar rendering, logo link, nav links (Bitácora, Recetas),
 * dark mode toggle button, footer, Outlet wrapper, responsive structure.
 *
 * NOTE: Requires vitest + @testing-library/react + happy-dom/jsdom.
 * Not yet installed in the frontend. When available, run:
 *   npx vitest run frontend/src/__tests__/Layout.test.tsx
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import Layout from '../components/Layout';

// ── Helpers ────────────────────────────────────────────────────────────

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <AuthProvider>
      <ThemeProvider>
        <BrowserRouter>
        <Routes>
          <Route element={ui}>
            <Route path="/" element={<div data-testid="content">Home</div>} />
            <Route path="/bitacora" element={<div data-testid="content-bitacora">Bitácora</div>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
    </AuthProvider>
  );
}

// ── Tests ──────────────────────────────────────────────────────────────

describe('Layout — nav bar', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.setAttribute('data-theme', 'light');
  });

  it('renders the brand logo linking to /', () => {
    renderWithProviders(<Layout />);
    const logo = screen.getByRole('link', { name: /bitácora café/i });
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('href', '/');
  });

  it('renders Bitácora nav link pointing to /bitacora', () => {
    renderWithProviders(<Layout />);
    const link = screen.getByRole('link', { name: 'Bitácora' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/bitacora');
  });

  it('renders Recetas nav link pointing to /recetas', () => {
    renderWithProviders(<Layout />);
    const link = screen.getByRole('link', { name: 'Recetas' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/recetas');
  });

  it('renders navigation links (logo + nav links + login)', () => {
    renderWithProviders(<Layout />);
    const links = screen.getAllByRole('link');
    // Logo, Bitácora, Recetas, Iniciar sesión
    expect(links).toHaveLength(4);
  });

  it('renders dark mode toggle button with aria-label', () => {
    renderWithProviders(<Layout />);
    const toggle = screen.getByRole('button', { name: /modo oscuro|modo claro/i });
    expect(toggle).toBeInTheDocument();
  });

  it('toggle button shows moon icon (☾) when theme is light', () => {
    // Ensure light theme
    localStorage.setItem('bitacora-theme', 'light');
    document.documentElement.setAttribute('data-theme', 'light');
    renderWithProviders(<Layout />);
    const toggle = screen.getByRole('button', { name: /modo oscuro/i });
    expect(toggle).toHaveTextContent('☾');
  });

  it('toggle button shows sun icon (☀) after switching to dark', () => {
    renderWithProviders(<Layout />);
    const toggle = screen.getByRole('button');
    fireEvent.click(toggle);
    expect(toggle).toHaveTextContent('☀');
  });
});

describe('Layout — footer', () => {
  it('renders footer with brand name', () => {
    renderWithProviders(<Layout />);
    // Brand name appears in both the logo and the footer
    const brandTexts = screen.getAllByText(/bitácora café/i);
    expect(brandTexts.length).toBeGreaterThanOrEqual(2);
    // Footer is the last occurrence
    const footerBrand = brandTexts[brandTexts.length - 1];
    expect(footerBrand.closest('.footer')).toBeInTheDocument();
  });
});

describe('Layout — outlet renders child routes', () => {
  it('renders child route content via Outlet', () => {
    renderWithProviders(<Layout />);
    expect(screen.getByTestId('content')).toHaveTextContent('Home');
  });
});
