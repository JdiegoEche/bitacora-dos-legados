/**
 * BitacoraHome — Component tests
 *
 * Tests: bean card grid rendering, "Crear café" button presence,
 * card click navigates to /bitacora/:id, empty state.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../__tests__/test-utils';
import { beansApi } from '../../api/client';
import BitacoraHome from '../BitacoraHome';
import type { CoffeeBean } from '../../types';

// ── Mocks ────────────────────────────────────────────────────────────

const mockBeans: CoffeeBean[] = [
  {
    id: 1,
    name: 'Ethiopia Yirgacheffe',
    roaster: 'Counter Culture',
    origin: 'Ethiopia',
    roastLevel: 'light',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 2,
    name: 'Colombia Supremo',
    roaster: 'Stumptown',
    origin: 'Colombia',
    roastLevel: 'medium',
    createdAt: '2026-01-15T00:00:00Z',
    updatedAt: '2026-01-15T00:00:00Z',
  },
];

beforeEach(() => {
  vi.spyOn(beansApi, 'list').mockResolvedValue(mockBeans);
});

// ── Tests ────────────────────────────────────────────────────────────

describe('BitacoraHome', () => {
  it('renders bean cards from API data', async () => {
    renderWithProviders(<BitacoraHome />);

    await waitFor(() => {
      expect(screen.getByText('Ethiopia Yirgacheffe')).toBeInTheDocument();
    });

    expect(screen.getByText('Colombia Supremo')).toBeInTheDocument();
    expect(screen.getByText('Counter Culture')).toBeInTheDocument();
    expect(screen.getByText('Stumptown')).toBeInTheDocument();
    expect(screen.getByText('Ethiopia')).toBeInTheDocument();
    expect(screen.getByText('light')).toBeInTheDocument();
    expect(screen.getByText('medium')).toBeInTheDocument();
  });

  it('shows "Crear café" button', async () => {
    renderWithProviders(<BitacoraHome />);

    await waitFor(() => {
      expect(screen.getByText('Ethiopia Yirgacheffe')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /crear café/i })).toBeInTheDocument();
  });

  it('renders bean cards as clickable links to /bitacora/:id', async () => {
    renderWithProviders(<BitacoraHome />);

    await waitFor(() => {
      expect(screen.getByText('Ethiopia Yirgacheffe')).toBeInTheDocument();
    });

    const cardLink = screen.getByRole('link', { name: /ethiopia yirgacheffe/i });
    expect(cardLink).toHaveAttribute('href', '/bitacora/1');
  });

  it('shows loading state initially', () => {
    vi.spyOn(beansApi, 'list').mockImplementation(
      () => new Promise(() => {}), // never resolves
    );

    renderWithProviders(<BitacoraHome />);

    expect(screen.getByText(/cargando/i)).toBeInTheDocument();
  });

  it('shows error state when API fails', async () => {
    vi.spyOn(beansApi, 'list').mockRejectedValue(new Error('Network error'));

    renderWithProviders(<BitacoraHome />);

    await waitFor(() => {
      expect(
        screen.getByText(/error al cargar/i),
      ).toBeInTheDocument();
    });
  });

  it('shows empty state when no beans exist', async () => {
    vi.spyOn(beansApi, 'list').mockResolvedValue([]);

    renderWithProviders(<BitacoraHome />);

    await waitFor(() => {
      expect(
        screen.getByText(/no hay cafés/i),
      ).toBeInTheDocument();
    });
  });

  it('shows "—" for missing origin or roast level on cards', async () => {
    const beansWithNulls: CoffeeBean[] = [
      {
        id: 5,
        name: 'Test Bean',
        roaster: 'Test Roaster',
        origin: null,
        roastLevel: null,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ];
    vi.spyOn(beansApi, 'list').mockResolvedValue(beansWithNulls);

    renderWithProviders(<BitacoraHome />);

    await waitFor(() => {
      expect(screen.getByText('Test Bean')).toBeInTheDocument();
    });

    // Both origin and roast should show em-dash as fallback
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBe(2);
  });

  it('opens BeanForm modal when "Crear café" is clicked', async () => {
    renderWithProviders(<BitacoraHome />);

    await waitFor(() => {
      expect(screen.getByText('Ethiopia Yirgacheffe')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: /crear café/i }));

    // BeanForm modal should appear with the title "Add New Bean"
    expect(screen.getByText('Add New Bean')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Ethiopia Yirgacheffe')).toBeInTheDocument();
  });
});
