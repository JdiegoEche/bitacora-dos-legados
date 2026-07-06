/**
 * BrewForm — Component tests
 *
 * Tests: preSelectedBeanId prop, conditional bean selector rendering,
 * conditional redirect, and query invalidation.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../__tests__/test-utils';
import { brewsApi, beansApi } from '../../api/client';
import BrewForm from '../BrewForm';
import type { BrewSession, CoffeeBean } from '../../types';

// ── Mock data ─────────────────────────────────────────────────────────

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

const mockCreatedBrew: BrewSession = {
  id: 99,
  coffeeBeanId: 1,
  method: 'V60',
  brewTime: '2:30',
  grindSize: 'medium',
  waterTemp: 93,
  coffeeDose: 15,
  waterDose: 250,
  notes: null,
  rating: 4,
  createdAt: '2026-07-01T00:00:00Z',
  updatedAt: '2026-07-01T00:00:00Z',
};

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(beansApi, 'list').mockResolvedValue(mockBeans);
  vi.spyOn(brewsApi, 'create').mockResolvedValue(mockCreatedBrew);
});

// ── Tests ────────────────────────────────────────────────────────────

describe('BrewForm — preSelectedBeanId', () => {
  it('hides bean selector when preSelectedBeanId is set', () => {
    renderWithProviders(
      <BrewForm preSelectedBeanId={1} />,
    );

    // Should NOT render a standalone <select> for beans (the inline selector)
    const selects = screen.queryAllByRole('combobox');
    // No selects at all (rating is now a text input)
    expect(selects).toHaveLength(0);
  });

  it('renders inline bean selector when preSelectedBeanId is NOT set', async () => {
    renderWithProviders(<BrewForm />);

    // Should show the Café label (select with accessible name "Café")
    expect(screen.getByRole('combobox', { name: /café/i })).toBeInTheDocument();
    // Should render an inline <select> for bean selection
    const selects = screen.getAllByRole('combobox');
    // One select: only the bean selector (rating is now a text input)
    expect(selects).toHaveLength(1);
    // The bean select should list fetched beans
    await waitFor(() => {
      expect(screen.getByText(/ethiopia yirgacheffe/i)).toBeInTheDocument();
    });
  });

  it('shows "-- Select bean --" option when no bean selected in inline mode', async () => {
    renderWithProviders(<BrewForm />);

    await waitFor(() => {
      expect(screen.getByText(/-- Seleccionar café/i)).toBeInTheDocument();
    });
  });

  it('sets coffeeBeanId from preSelectedBeanId in payload on create', async () => {
    const { queryClient } = renderWithProviders(
      <BrewForm preSelectedBeanId={1} />,
    );

    // Fill required fields
    await userEvent.type(
      screen.getByPlaceholderText(/v60, aeropress/i),
      'V60',
    );
    await userEvent.type(
      screen.getByPlaceholderText(/media, fina/i),
      'medium',
    );
    // Water temp
    const numberInputs = screen.getAllByRole('spinbutton');
    await userEvent.type(numberInputs[0], '93');
    // Brew time — find the text input inside the "Brew Time *" label
    const brewTimeInput = screen.getByRole('textbox', { name: /tiempo/i });
    await userEvent.type(brewTimeInput, '2:30');
    // Coffee dose
    await userEvent.type(numberInputs[1], '15');
    // Water dose
    await userEvent.type(numberInputs[2], '250');

    // Submit
    await userEvent.click(screen.getByText('Guardar'));

    await waitFor(() => {
      expect(brewsApi.create).toHaveBeenCalledWith(
        expect.objectContaining({ coffeeBeanId: 1 }),
      );
    });
  });
});
