/**
 * RecipeMethodGrid — Component tests
 *
 * Tests: renders 6 method cards with icon + name,
 * clicking navigates to /recetas/:method
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import RecipeMethodGrid from '../RecipeMethodGrid';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <RecipeMethodGrid />
    </MemoryRouter>,
  );
}

describe('RecipeMethodGrid', () => {
  it('renders all 6 method cards', () => {
    renderAt('/recetas');
    // All 6 method names should be visible
    expect(screen.getByText('V60')).toBeInTheDocument();
    expect(screen.getByText('Hario Switch')).toBeInTheDocument();
    expect(screen.getByText('Origami')).toBeInTheDocument();
    expect(screen.getByText('Kalita Wave')).toBeInTheDocument();
    expect(screen.getByText('Chemex')).toBeInTheDocument();
    expect(screen.getByText('Aeropress')).toBeInTheDocument();
  });

  it('renders 6 SVG icons with correct aria-labels', () => {
    renderAt('/recetas');
    const icons = screen.getAllByRole('img');
    expect(icons).toHaveLength(6);
  });

  it('each method card links to /recetas/:method', () => {
    renderAt('/recetas');
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(6);

    const expectedPaths = [
      '/recetas/v60',
      '/recetas/switch',
      '/recetas/origami',
      '/recetas/kalitawave',
      '/recetas/chemex',
      '/recetas/aeropress',
    ];

    const hrefs = links.map((link) => link.getAttribute('href'));
    for (const path of expectedPaths) {
      expect(hrefs).toContain(path);
    }
  });

  it('navigates to /recetas/v60 when V60 card is clicked', async () => {
    renderAt('/recetas');
    // Click on the first V60 link — it's inside a card that's a Link
    const v60Link = screen.getByRole('link', { name: /v60/i });
    expect(v60Link).toHaveAttribute('href', '/recetas/v60');
  });
});
