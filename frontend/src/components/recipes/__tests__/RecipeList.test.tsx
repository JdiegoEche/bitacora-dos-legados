/**
 * RecipeList — Component tests
 *
 * Tests: fetches recipes by method, renders cards,
 * loading/error/empty states, card navigation
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../../__tests__/test-utils';
import { recipesApi } from '../../../api/client';
import RecipeList from '../RecipeList';
import type { Recipe } from '../../../types';

const mockRecipes: Recipe[] = [
  {
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
  },
  {
    id: 2,
    method: 'v60',
    name: 'James Hoffmann V60',
    objective: 'A balanced, sweet cup',
    coffeeDose: 15,
    waterDose: 250,
    ratio: '1:16.7',
    temperature: '100 °C',
    grindSize: 'Medium-fine',
    totalTime: '3:30',
    profile: 'Sweet, balanced, complex',
    createdAt: '2026-01-01T00:00:00Z',
  },
];

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('RecipeList', () => {
  it('renders recipe cards from API data', async () => {
    vi.spyOn(recipesApi, 'list').mockResolvedValue(mockRecipes);

    renderWithProviders(<RecipeList />, {
      initialEntries: ['/recetas/v60'],
      routePath: '/recetas/:method',
    });

    await waitFor(() => {
      expect(screen.getByText('Classic V60')).toBeInTheDocument();
    });

    expect(screen.getByText('James Hoffmann V60')).toBeInTheDocument();
    // Both recipes have 15g/250ml/1:16.7 — use getAllByText
    expect(screen.getAllByText('15g')).toHaveLength(2);
    expect(screen.getAllByText('250gr')).toHaveLength(2);
    expect(screen.getAllByText('1:16.7')).toHaveLength(2);
    // Unique values per recipe
    expect(screen.getByText('96 °C')).toBeInTheDocument();
    expect(screen.getByText('100 °C')).toBeInTheDocument();
    expect(screen.getByText('2:30')).toBeInTheDocument();
    expect(screen.getByText('3:30')).toBeInTheDocument();
  });

  it('each recipe card links to /recetas/:method/:id', async () => {
    vi.spyOn(recipesApi, 'list').mockResolvedValue(mockRecipes);

    renderWithProviders(<RecipeList />, {
      initialEntries: ['/recetas/v60'],
      routePath: '/recetas/:method',
    });

    await waitFor(() => {
      expect(screen.getByText('Classic V60')).toBeInTheDocument();
    });

    const cardLink = screen.getByRole('link', { name: /classic v60/i });
    expect(cardLink).toHaveAttribute('href', '/recetas/v60/1');
  });

  it('shows loading state initially', () => {
    vi.spyOn(recipesApi, 'list').mockImplementation(
      () => new Promise(() => {}),
    );

    renderWithProviders(<RecipeList />, {
      initialEntries: ['/recetas/v60'],
      routePath: '/recetas/:method',
    });

    expect(screen.getByText(/cargando/i)).toBeInTheDocument();
  });

  it('shows error state when API fails', async () => {
    vi.spyOn(recipesApi, 'list').mockRejectedValue(new Error('Network error'));

    renderWithProviders(<RecipeList />, {
      initialEntries: ['/recetas/v60'],
      routePath: '/recetas/:method',
    });

    await waitFor(() => {
      expect(
        screen.getByText(/error al cargar/i),
      ).toBeInTheDocument();
    });
  });

  it('shows empty state when no recipes exist for method', async () => {
    vi.spyOn(recipesApi, 'list').mockResolvedValue([]);

    renderWithProviders(<RecipeList />, {
      initialEntries: ['/recetas/chemex'],
      routePath: '/recetas/:method',
    });

    await waitFor(() => {
      expect(
        screen.getByText(/no hay recetas/i),
      ).toBeInTheDocument();
    });
  });

  it('shows method name in the header', async () => {
    vi.spyOn(recipesApi, 'list').mockResolvedValue(mockRecipes);

    renderWithProviders(<RecipeList />, {
      initialEntries: ['/recetas/v60'],
      routePath: '/recetas/:method',
    });

    await waitFor(() => {
      // The header h2 shows the method name
      expect(screen.getByRole('heading', { level: 2, name: /v60/i })).toBeInTheDocument();
    });
  });
});
