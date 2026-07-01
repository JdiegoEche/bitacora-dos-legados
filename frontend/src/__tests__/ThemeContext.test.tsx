/**
 * ThemeContext — Behavioral tests for ThemeProvider + useTheme hook
 *
 * Tests: mounting, localStorage read, toggle, data-theme attribute sync,
 * prefers-color-scheme fallback, and edge cases.
 *
 * NOTE: Requires vitest + @testing-library/react + happy-dom/jsdom.
 * Not yet installed in the frontend. When available, run:
 *   npx vitest run frontend/src/__tests__/ThemeContext.test.tsx
 */
import React from 'react';
import { render, renderHook, act, screen } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';

// ── Helpers ────────────────────────────────────────────────────────────

function getDataTheme(): string | null {
  return document.documentElement.getAttribute('data-theme');
}

function setLocalStorage(key: string, value: string | null) {
  if (value === null) {
    localStorage.removeItem(key);
  } else {
    localStorage.setItem(key, value);
  }
}

function matchMediaMock(prefersDark: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: prefersDark && query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

// ── Tests ──────────────────────────────────────────────────────────────

describe('ThemeProvider — initial mount', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('defaults to light when no localStorage and OS prefers light', () => {
    matchMediaMock(false);
    renderHook(() => useTheme(), { wrapper: ThemeProvider });
    expect(getDataTheme()).toBe('light');
  });

  it('reads existing localStorage preference on mount', () => {
    setLocalStorage('bitacora-theme', 'dark');
    matchMediaMock(false);
    renderHook(() => useTheme(), { wrapper: ThemeProvider });
    expect(getDataTheme()).toBe('dark');
  });

  it('falls back to prefers-color-scheme when no localStorage key', () => {
    matchMediaMock(true);
    renderHook(() => useTheme(), { wrapper: ThemeProvider });
    expect(getDataTheme()).toBe('dark');
  });

  it('sets data-theme="light" when localStorage has "light" explicitly', () => {
    setLocalStorage('bitacora-theme', 'light');
    renderHook(() => useTheme(), { wrapper: ThemeProvider });
    expect(getDataTheme()).toBe('light');
  });
});

describe('ThemeProvider — toggleTheme', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('flips from light to dark on first toggle', () => {
    matchMediaMock(false);
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });
    expect(result.current.theme).toBe('light');

    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.theme).toBe('dark');
    expect(getDataTheme()).toBe('dark');
  });

  it('flips from dark to light when currently dark', () => {
    setLocalStorage('bitacora-theme', 'dark');
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });
    expect(result.current.theme).toBe('dark');

    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.theme).toBe('light');
    expect(getDataTheme()).toBe('light');
  });

  it('persists preference to localStorage after toggle', () => {
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });
    act(() => {
      result.current.toggleTheme();
    });
    expect(localStorage.getItem('bitacora-theme')).toBe('dark');
  });

  it('toggles back and forth correctly', () => {
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });

    act(() => result.current.toggleTheme());
    expect(result.current.theme).toBe('dark');

    act(() => result.current.toggleTheme());
    expect(result.current.theme).toBe('light');

    act(() => result.current.toggleTheme());
    expect(result.current.theme).toBe('dark');
  });
});

describe('ThemeProvider — data-theme attribute sync', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('sets data-theme="dark" on documentElement when dark', () => {
    setLocalStorage('bitacora-theme', 'dark');
    renderHook(() => useTheme(), { wrapper: ThemeProvider });
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('removes data-theme or sets data-theme="light" when light', () => {
    // After mount in light mode, data-theme should be "light"
    renderHook(() => useTheme(), { wrapper: ThemeProvider });
    expect(getDataTheme()).toBe('light');
  });
});

describe('ThemeProvider — useTheme hook errors', () => {
  it('throws when useTheme is used outside ThemeProvider', () => {
    // Suppress console.error from the expected React error boundary
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useTheme())).toThrow();
    spy.mockRestore();
  });
});

describe('ThemeProvider — children render correctly', () => {
  it('renders children with light theme', () => {
    render(
      <ThemeProvider>
        <div data-testid="child">Hello</div>
      </ThemeProvider>
    );
    expect(screen.getByTestId('child')).toHaveTextContent('Hello');
  });
});

describe('ThemeProvider — localStorage error handling', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('gracefully handles localStorage being unavailable', () => {
    const getItem = Storage.prototype.getItem;
    const setItem = Storage.prototype.setItem;
    Storage.prototype.getItem = vi.fn(() => { throw new Error('denied'); });
    Storage.prototype.setItem = vi.fn(() => { throw new Error('denied'); });

    matchMediaMock(false);
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });
    expect(result.current.theme).toBe('light');

    act(() => {
      result.current.toggleTheme();
    });
    // Should still flip theme even if localStorage fails
    expect(result.current.theme).toBe('dark');

    Storage.prototype.getItem = getItem;
    Storage.prototype.setItem = setItem;
  });
});
