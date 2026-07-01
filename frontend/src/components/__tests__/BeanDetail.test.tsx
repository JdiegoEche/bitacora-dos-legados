/**
 * BeanDetail — Component tests
 *
 * Tests: parallel fetch of stats + brew history, stats display,
 * brew list with tasting notes, empty state, "Nueva preparación" link.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../__tests__/test-utils';
import { beansApi } from '../../api/client';
import BeanDetail from '../BeanDetail';
import type { CoffeeBeanWithStats, BrewSessionWithNotes } from '../../types';

// ── Mock data ─────────────────────────────────────────────────────────

const mockStats: CoffeeBeanWithStats = {
  id: 3,
  name: 'Ethiopia Yirgacheffe',
  roaster: 'Counter Culture',
  origin: 'Ethiopia',
  roastLevel: 'light',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  avgRating: 3.5,
  brewCount: 4,
  methodBreakdown: { V60: 3, Aeropress: 1 },
};

const mockBrews: BrewSessionWithNotes[] = [
  {
    id: 10,
    coffeeBeanId: 3,
    method: 'V60',
    brewTime: '2:30',
    grindSize: 'medium',
    waterTemp: 93,
    coffeeDose: 15,
    waterDose: 250,
    notes: 'Bright and floral',
    rating: 4,
    createdAt: '2026-06-15T10:00:00Z',
    updatedAt: '2026-06-15T10:00:00Z',
    tastingNotesSummary: null,
  },
  {
    id: 9,
    coffeeBeanId: 3,
    method: 'Aeropress',
    brewTime: '1:45',
    grindSize: 'fine',
    waterTemp: 85,
    coffeeDose: 14,
    waterDose: 200,
    notes: null,
    rating: 3,
    createdAt: '2026-06-10T10:00:00Z',
    updatedAt: '2026-06-10T10:00:00Z',
    tastingNotesSummary: 'aroma: floral, flavor: berry',
  },
];

beforeEach(() => {
  vi.spyOn(beansApi, 'getById').mockResolvedValue(mockStats);
  vi.spyOn(beansApi, 'getBrewsByBean').mockResolvedValue(mockBrews);
});

// ── Tests ────────────────────────────────────────────────────────────

describe('BeanDetail', () => {
  it('renders bean name', async () => {
    renderWithProviders(<BeanDetail />, {
      initialEntries: ['/bitacora/3'],
      routePath: '/bitacora/:id',
    });

    expect(await screen.findByText('Ethiopia Yirgacheffe')).toBeInTheDocument();
  });

  it('renders roaster, origin, roast level in subtitle', async () => {
    renderWithProviders(<BeanDetail />, {
      initialEntries: ['/bitacora/3'],
      routePath: '/bitacora/:id',
    });

    // The subtitle text (roaster · origin · roast) is near the bean name
    await screen.findByText('Ethiopia Yirgacheffe');
    // The pod subtitle combines roaster, origin, and roast with middot
    expect(screen.getByText(/Counter Culture/)).toBeInTheDocument();
    // "light" appears in the subtitle (and not in other elements that also contain "light")
    expect(screen.getByText(/light/)).toBeInTheDocument();
  });

  it('renders aggregate stats: avgRating, brewCount, methodBreakdown', async () => {
    renderWithProviders(<BeanDetail />, {
      initialEntries: ['/bitacora/3'],
      routePath: '/bitacora/:id',
    });

    await screen.findByText(/3\.5/);
    // brewCount is shown as a number in the stats grid
    expect(screen.getByText('4')).toBeInTheDocument();
    // Method badges: V60 and Aeropress
    expect(screen.getByText('V60: 3')).toBeInTheDocument();
    expect(screen.getByText('Aeropress: 1')).toBeInTheDocument();
  });

  it('renders brew history list newest-first', async () => {
    renderWithProviders(<BeanDetail />, {
      initialEntries: ['/bitacora/3'],
      routePath: '/bitacora/:id',
    });

    await screen.findByText('Ethiopia Yirgacheffe');

    // Use getAllByText for "V60" since it appears in both method tags and brew history
    const v60Elements = screen.getAllByText(/V60/);
    expect(v60Elements.length).toBeGreaterThanOrEqual(1);

    // Brew history uses listitem role
    const brewCards = screen.getAllByRole('listitem');
    expect(brewCards).toHaveLength(2);
    // First item should be the newer brew (V60 from June 15)
    expect(brewCards[0]).toHaveTextContent('V60');
    expect(brewCards[1]).toHaveTextContent('Aeropress');
  });

  it('shows tasting notes summary on brews that have them', async () => {
    renderWithProviders(<BeanDetail />, {
      initialEntries: ['/bitacora/3'],
      routePath: '/bitacora/:id',
    });

    expect(
      await screen.findByText(/aroma: floral, flavor: berry/i),
    ).toBeInTheDocument();
  });

  it('renders "Nueva preparación" link pointing to /bitacora/:id/brews/new', async () => {
    renderWithProviders(<BeanDetail />, {
      initialEntries: ['/bitacora/3'],
      routePath: '/bitacora/:id',
    });

    await screen.findByText('Ethiopia Yirgacheffe');

    const links = screen.getAllByRole('link', {
      name: /nueva preparación/i,
    });
    expect(links.length).toBeGreaterThanOrEqual(1);
    // Every "Nueva preparación" link should point to the correct path
    for (const link of links) {
      expect(link).toHaveAttribute('href', '/bitacora/3/brews/new');
    }
  });

  it('shows loading state while fetching', () => {
    vi.spyOn(beansApi, 'getById').mockImplementation(
      () => new Promise(() => {}),
    );
    vi.spyOn(beansApi, 'getBrewsByBean').mockImplementation(
      () => new Promise(() => {}),
    );

    renderWithProviders(<BeanDetail />, {
      initialEntries: ['/bitacora/3'],
      routePath: '/bitacora/:id',
    });

    expect(screen.getByText(/cargando/i)).toBeInTheDocument();
  });

  it('shows error state when API fails', async () => {
    vi.spyOn(beansApi, 'getById').mockRejectedValue(
      new Error('Network error'),
    );

    renderWithProviders(<BeanDetail />, {
      initialEntries: ['/bitacora/3'],
      routePath: '/bitacora/:id',
    });

    expect(
      await screen.findByText(/error al cargar/i),
    ).toBeInTheDocument();
  });

  it('shows empty brew state with action link when bean has no brews', async () => {
    vi.spyOn(beansApi, 'getBrewsByBean').mockResolvedValue([]);

    renderWithProviders(<BeanDetail />, {
      initialEntries: ['/bitacora/3'],
      routePath: '/bitacora/:id',
    });

    await screen.findByText('Ethiopia Yirgacheffe');

    expect(
      screen.getByText(/sin preparaciones aún/i),
    ).toBeInTheDocument();

    // In empty state, "Nueva preparación" appears in both header and empty-state section
    const links = screen.getAllByRole('link', {
      name: /nueva preparación/i,
    });
    expect(links.length).toBe(2);
    for (const link of links) {
      expect(link).toHaveAttribute('href', '/bitacora/3/brews/new');
    }
  });
});
