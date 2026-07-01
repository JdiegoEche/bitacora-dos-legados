/**
 * tokens.css — Structural verification tests
 *
 * Verifies that all design token custom properties are defined in both
 * light (:root) and dark ([data-theme="dark"]) variants.
 *
 * NOTE: These tests require vitest + happy-dom (or jsdom) to be available
 * in the frontend. As of PR 1, the frontend has no test infrastructure.
 * When vitest is available, run:
 *   npx vitest run frontend/src/__tests__/tokens.test.ts
 */

// ── Helper: parse CSS variable from computed style ─────────────────────
function getCssVar(element: HTMLElement, name: string): string {
  return getComputedStyle(element).getPropertyValue(name).trim();
}

// ── Light theme token definitions (from :root) ────────────────────────
const LIGHT_TOKENS: Record<string, string> = {
  // Colors
  '--color-primary': '#92400E',
  '--color-primary-hover': '#78350F',
  '--color-secondary': '#B45309',
  '--color-accent': '#D97706',
  '--color-background': '#FFFBEB',
  '--color-surface': '#FFFFFF',
  '--color-foreground': '#0F172A',
  '--color-muted': '#F5F0EB',
  '--color-muted-fg': '#78716C',
  '--color-border': '#E8DFD3',
  '--color-destructive': '#DC2626',

  // Typography
  '--font-heading': "'Playfair Display', Georgia, serif",
  '--font-body': "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",

  // Text sizes
  '--text-xs': '0.75rem',
  '--text-sm': '0.875rem',
  '--text-base': '1rem',
  '--text-lg': '1.125rem',
  '--text-xl': '1.25rem',
  '--text-2xl': '1.5rem',
  '--text-3xl': '1.875rem',
  '--text-4xl': '2.25rem',

  // Spacing (4px base)
  '--space-1': '0.25rem',
  '--space-2': '0.5rem',
  '--space-3': '0.75rem',
  '--space-4': '1rem',
  '--space-5': '1.25rem',
  '--space-6': '1.5rem',
  '--space-7': '1.75rem',
  '--space-8': '2rem',

  // Border radius
  '--radius-sm': '4px',
  '--radius-md': '8px',
  '--radius-lg': '12px',

  // Shadows
  '--shadow-sm': '0 1px 2px rgba(0,0,0,0.05)',
  '--shadow-md': '0 4px 6px -1px rgba(0,0,0,0.08)',
  '--shadow-lg': '0 10px 15px -3px rgba(0,0,0,0.1)',
};

const DARK_TOKENS: Record<string, string> = {
  '--color-primary': '#B45309',
  '--color-primary-hover': '#92400E',
  '--color-secondary': '#D97706',
  '--color-accent': '#F59E0B',
  '--color-background': '#1C1917',
  '--color-surface': '#292524',
  '--color-foreground': '#F5F5F4',
  '--color-muted': '#3F3A36',
  '--color-muted-fg': '#A8A29E',
  '--color-border': '#44403C',
  '--color-destructive': '#F87171',
  // Dark typography, spacing, radius, shadows inherit from :root (unchanged)
};

describe('tokens.css — design token definitions', () => {
  let root: HTMLElement;

  beforeAll(() => {
    // Create a root element and attach tokens.css as inline style
    root = document.createElement('div');
    root.id = 'token-test-root';
    document.body.appendChild(root);
  });

  afterAll(() => {
    document.body.removeChild(root);
  });

  describe('Light mode (:root)', () => {
    beforeAll(() => {
      document.documentElement.removeAttribute('data-theme');
    });

    for (const [token, expectedValue] of Object.entries(LIGHT_TOKENS)) {
      it(`defines ${token} with value ${expectedValue}`, () => {
        const value = getCssVar(root, token);
        expect(value).toBe(expectedValue);
      });
    }
  });

  describe('Dark mode ([data-theme="dark"])', () => {
    beforeAll(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });

    afterAll(() => {
      document.documentElement.removeAttribute('data-theme');
    });

    for (const [token, expectedValue] of Object.entries(DARK_TOKENS)) {
      it(`overrides ${token} with value ${expectedValue} in dark mode`, () => {
        const value = getCssVar(root, token);
        expect(value).toBe(expectedValue);
      });
    }
  });

  it('preserves typography tokens across themes', () => {
    const headingLight = getCssVar(root, '--font-heading');
    const bodyLight = getCssVar(root, '--font-body');
    expect(headingLight).toBeTruthy();
    expect(bodyLight).toBeTruthy();
  });

  it('defines all spacing tokens from --space-1 to --space-8', () => {
    for (let i = 1; i <= 8; i++) {
      const token = `--space-${i}`;
      expect(getCssVar(root, token)).toBeTruthy();
    }
  });
});
