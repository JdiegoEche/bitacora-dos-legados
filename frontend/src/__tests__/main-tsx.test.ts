/**
 * main.tsx — Structural verification tests
 *
 * Verifies that tokens.css is imported BEFORE index.css.
 *
 * NOTE: Requires vitest. Not yet installed in the frontend.
 */
import fs from 'fs';
import path from 'path';

describe('main.tsx — import order', () => {
  const mainPath = path.resolve(__dirname, '../main.tsx');
  let source: string;

  beforeAll(() => {
    source = fs.readFileSync(mainPath, 'utf-8');
  });

  it('imports ./styles/tokens.css', () => {
    expect(source).toMatch(/import\s+['"]\.\/styles\/tokens\.css['"]/);
  });

  it('imports ./styles/index.css', () => {
    expect(source).toMatch(/import\s+['"]\.\/styles\/index\.css['"]/);
  });

  it('imports tokens.css before index.css', () => {
    const tokensIdx = source.indexOf('tokens.css');
    const indexIdx = source.indexOf('index.css');
    expect(tokensIdx).toBeGreaterThan(-1);
    expect(indexIdx).toBeGreaterThan(-1);
    expect(tokensIdx).toBeLessThan(indexIdx);
  });

  it('preserves all other imports (React, Router, Query, App)', () => {
    expect(source).toMatch(/react/);
    expect(source).toMatch(/react-dom\/client/);
    expect(source).toMatch(/react-router-dom/);
    expect(source).toMatch(/@tanstack\/react-query/);
    expect(source).toMatch(/\.\/App/);
  });

  // --- PWA: Service Worker registration (PWA-REQ-3) ---

  it('conditionally imports virtual:pwa-register via async IIFE', () => {
    expect(source).toMatch(/import\(['"]virtual:pwa-register['"]\)/);
    expect(source).toMatch(/async\s*\(\)/);
  });

  it('guards SW registration with serviceWorker in navigator check', () => {
    expect(source).toMatch(/'serviceWorker' in navigator/);
  });

  it('calls registerSW with { immediate: true }', () => {
    expect(source).toMatch(/registerSW\(\s*\{\s*immediate:\s*true\s*\}\s*\)/);
  });
});
