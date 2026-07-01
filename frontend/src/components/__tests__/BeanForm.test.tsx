/**
 * BeanForm — Component tests
 *
 * Tests: onCreated callback is called with created bean after submit.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../__tests__/test-utils';
import { beansApi } from '../../api/client';
import BeanForm from '../BeanForm';
import type { CoffeeBean } from '../../types';

// ── Mock data ─────────────────────────────────────────────────────────

const mockCreatedBean: CoffeeBean = {
  id: 42,
  name: 'Test Bean',
  roaster: 'Test Roaster',
  origin: 'Test Origin',
  roastLevel: 'medium',
  createdAt: '2026-07-01T00:00:00Z',
  updatedAt: '2026-07-01T00:00:00Z',
};

beforeEach(() => {
  vi.restoreAllMocks();
});

// ── Tests ────────────────────────────────────────────────────────────

describe('BeanForm — onCreated callback', () => {
  it('calls onCreated with the created bean after successful create', async () => {
    vi.spyOn(beansApi, 'create').mockResolvedValue(mockCreatedBean);
    const onCreated = vi.fn();
    const onClose = vi.fn();

    renderWithProviders(
      <BeanForm onCreated={onCreated} onClose={onClose} />,
    );

    // Fill in required fields
    await userEvent.type(
      screen.getByPlaceholderText('Ethiopia Yirgacheffe'),
      'Test Bean',
    );
    await userEvent.type(
      screen.getByPlaceholderText('Counter Culture'),
      'Test Roaster',
    );

    // Submit the form
    await userEvent.click(screen.getByRole('button', { name: /add bean/i }));

    await waitFor(() => {
      expect(onCreated).toHaveBeenCalledTimes(1);
      expect(onCreated).toHaveBeenCalledWith(mockCreatedBean);
    });
  });

  it('calls onCreated before onClose', async () => {
    vi.spyOn(beansApi, 'create').mockResolvedValue(mockCreatedBean);
    const onCreated = vi.fn();
    const onClose = vi.fn();

    renderWithProviders(
      <BeanForm onCreated={onCreated} onClose={onClose} />,
    );

    await userEvent.type(
      screen.getByPlaceholderText('Ethiopia Yirgacheffe'),
      'Test Bean',
    );
    await userEvent.type(
      screen.getByPlaceholderText('Counter Culture'),
      'Test Roaster',
    );

    await userEvent.click(screen.getByRole('button', { name: /add bean/i }));

    await waitFor(() => {
      // onCreated must be called before onClose
      expect(onCreated).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
      expect(onCreated.mock.invocationCallOrder[0]).toBeLessThan(
        onClose.mock.invocationCallOrder[0],
      );
    });
  });
});
