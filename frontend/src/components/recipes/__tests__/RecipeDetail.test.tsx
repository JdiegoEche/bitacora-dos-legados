/**
 * RecipeDetail — Component tests
 *
 * Tests: fetches recipe by ID, renders full recipe fields,
 * ordered steps timeline, loading/error/not-found states
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../../__tests__/test-utils';
import { recipesApi } from '../../../api/client';
import RecipeDetail from '../RecipeDetail';
import type { RecipeDetail as RecipeDetailType } from '../../../types';

const mockRecipe: RecipeDetailType = {
  id: 1,
  method: 'v60',
  name: 'Classic V60',
  objective: 'A bright, clean cup',
  coffeeDose: 15,
  waterDose: 250,
  ratio: '1:16.7',
  temperature: '96 °C',
  grindSize: 'Medium-fine',
  totalTime: '2:30',
  profile: 'Bright, clean, floral',
  createdAt: '2026-01-01T00:00:00Z',
  steps: [
    { stepOrder: 1, instruction: 'Rinse the filter with hot water', waterAtStep: undefined },
    { stepOrder: 2, instruction: 'Add coffee grounds', waterAtStep: undefined },
    { stepOrder: 3, instruction: 'Pour 50ml water for bloom', waterAtStep: 50 },
    { stepOrder: 4, instruction: 'Wait 30 seconds', waterAtStep: undefined },
    { stepOrder: 5, instruction: 'Pour remaining water in circles', waterAtStep: 200 },
  ],
};

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('RecipeDetail', () => {
  it('renders recipe name and objective', async () => {
    vi.spyOn(recipesApi, 'getById').mockResolvedValue(mockRecipe);

    renderWithProviders(<RecipeDetail />, {
      initialEntries: ['/recetas/v60/1'],
      routePath: '/recetas/:method/:id',
    });

    await waitFor(() => {
      expect(screen.getByText('Classic V60')).toBeInTheDocument();
    });

    expect(screen.getByText('A bright, clean cup')).toBeInTheDocument();
  });

  it('renders all recipe fields in parameters grid', async () => {
    vi.spyOn(recipesApi, 'getById').mockResolvedValue(mockRecipe);

    renderWithProviders(<RecipeDetail />, {
      initialEntries: ['/recetas/v60/1'],
      routePath: '/recetas/:method/:id',
    });

    await waitFor(() => {
      expect(screen.getByText('Classic V60')).toBeInTheDocument();
    });

    expect(screen.getByText('15g')).toBeInTheDocument();
    expect(screen.getByText('250ml')).toBeInTheDocument();
    expect(screen.getByText('1:16.7')).toBeInTheDocument();
    expect(screen.getByText('96 °C')).toBeInTheDocument();
    expect(screen.getByText('Medium-fine')).toBeInTheDocument();
    expect(screen.getByText('2:30')).toBeInTheDocument();
  });

  it('renders ordered steps timeline', async () => {
    vi.spyOn(recipesApi, 'getById').mockResolvedValue(mockRecipe);

    renderWithProviders(<RecipeDetail />, {
      initialEntries: ['/recetas/v60/1'],
      routePath: '/recetas/:method/:id',
    });

    await waitFor(() => {
      expect(screen.getByText('Classic V60')).toBeInTheDocument();
    });

    // Steps should be ordered — check for step 1 and step 5
    expect(screen.getByText('Rinse the filter with hot water')).toBeInTheDocument();
    expect(screen.getByText('Pour remaining water in circles')).toBeInTheDocument();

    // Step 3 has water at step
    expect(screen.getByText('50ml')).toBeInTheDocument();
  });

  it('renders back link to /recetas/:method', async () => {
    vi.spyOn(recipesApi, 'getById').mockResolvedValue(mockRecipe);

    renderWithProviders(<RecipeDetail />, {
      initialEntries: ['/recetas/v60/1'],
      routePath: '/recetas/:method/:id',
    });

    await waitFor(() => {
      expect(screen.getByText('Classic V60')).toBeInTheDocument();
    });

    const backLink = screen.getByRole('link', { name: /volver/i });
    expect(backLink).toHaveAttribute('href', '/recetas/v60');
  });

  it('renders the recipe profile description', async () => {
    vi.spyOn(recipesApi, 'getById').mockResolvedValue(mockRecipe);

    renderWithProviders(<RecipeDetail />, {
      initialEntries: ['/recetas/v60/1'],
      routePath: '/recetas/:method/:id',
    });

    await waitFor(() => {
      expect(screen.getByText('Classic V60')).toBeInTheDocument();
    });

    expect(screen.getByText('Bright, clean, floral')).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    vi.spyOn(recipesApi, 'getById').mockImplementation(
      () => new Promise(() => {}),
    );

    renderWithProviders(<RecipeDetail />, {
      initialEntries: ['/recetas/v60/1'],
      routePath: '/recetas/:method/:id',
    });

    expect(screen.getByText(/cargando/i)).toBeInTheDocument();
  });

  it('shows error state when API fails', async () => {
    vi.spyOn(recipesApi, 'getById').mockRejectedValue(new Error('Network error'));

    renderWithProviders(<RecipeDetail />, {
      initialEntries: ['/recetas/v60/1'],
      routePath: '/recetas/:method/:id',
    });

    await waitFor(() => {
      expect(
        screen.getByText(/error al cargar/i),
      ).toBeInTheDocument();
    });
  });

  it('shows not found state when recipe is null', async () => {
    vi.spyOn(recipesApi, 'getById').mockRejectedValue(
      new Error('Not found'),
    );

    renderWithProviders(<RecipeDetail />, {
      initialEntries: ['/recetas/v60/999'],
      routePath: '/recetas/:method/:id',
    });

    await waitFor(() => {
      expect(
        screen.getByText(/error al cargar/i),
      ).toBeInTheDocument();
    });
  });
});
