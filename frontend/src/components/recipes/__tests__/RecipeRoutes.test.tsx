/**
 * RecipeRoutes — Integration tests for recipe route mapping
 *
 * Tests: RecipeMethodGrid renders at /recetas,
 * RecipeList renders at /recetas/:method,
 * RecipeDetail renders at /recetas/:method/:id
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../../__tests__/test-utils';
import { recipesApi } from '../../../api/client';
import App from '../../../App';
import type { Recipe, RecipeDetail as RecipeDetailType } from '../../../types';

const mockRecipes: Recipe[] = [
  {
    id: 1,
    method: 'v60',
    name: 'Classic V60',
    objective: null,
    coffeeDose: 15,
    waterDose: 250,
    ratio: '1:16.7',
    temperature: '96 °C',
    grindSize: 'Medium-fine',
    totalTime: '2:30',
    profile: 'Bright, clean',
    createdAt: '2026-01-01T00:00:00Z',
  },
];

const mockDetail: RecipeDetailType = {
  ...mockRecipes[0],
  objective: 'A bright cup',
  steps: [{ stepOrder: 1, instruction: 'Boil water' }],
};

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(recipesApi, 'list').mockResolvedValue(mockRecipes);
  vi.spyOn(recipesApi, 'getById').mockResolvedValue(mockDetail);
});

function renderAt(path: string) {
  return renderWithProviders(<App />, { initialEntries: [path] });
}

describe('Recipe routes in App', () => {
  it('renders RecipeMethodGrid at /recetas', () => {
    renderAt('/recetas');
    expect(screen.getByText('Recetario')).toBeInTheDocument();
    expect(screen.getAllByRole('link').length).toBeGreaterThanOrEqual(6);
  });

  it('renders RecipeList at /recetas/v60', async () => {
    renderAt('/recetas/v60');

    await waitFor(() => {
      expect(screen.getByText('Classic V60')).toBeInTheDocument();
    });
  });

  it('renders RecipeDetail at /recetas/v60/1', async () => {
    renderAt('/recetas/v60/1');
    await waitFor(() => {
      expect(screen.getByText('Classic V60')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText('Boil water')).toBeInTheDocument();
    });
  });
});
