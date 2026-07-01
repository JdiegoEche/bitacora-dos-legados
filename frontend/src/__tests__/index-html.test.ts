/**
 * index.html — Structural verification tests
 *
 * Verifies the inline theme-init script and critical dark tokens <style>
 * that must be present before React hydration.
 *
 * NOTE: Requires vitest + happy-dom/jsdom. Not yet installed in the frontend.
 */
import fs from 'fs';
import path from 'path';

describe('index.html — structure and content', () => {
  const indexPath = path.resolve(__dirname, '../../index.html');
  let html: string;

  beforeAll(() => {
    html = fs.readFileSync(indexPath, 'utf-8');
  });

  it('sets lang="es" on <html>', () => {
    expect(html).toMatch(/<html\s+lang="es"/i);
  });

  it('includes a meta description tag', () => {
    expect(html).toMatch(/<meta\s+name="description"/i);
  });

  it('loads Playfair Display from Google Fonts', () => {
    expect(html).toMatch(/Playfair\+Display/i);
  });

  it('loads Inter from Google Fonts', () => {
    expect(html).toMatch(/Inter/i);
  });

  it('uses font-display: swap in Google Fonts link', () => {
    expect(html).toMatch(/font-display=swap/i);
  });

  it('includes an inline theme-init <script> in <head>', () => {
    expect(html).toMatch(/<script>[\s\S]*?bitacora-theme[\s\S]*?<\/script>/i);
  });

  it('the inline script reads localStorage("bitacora-theme")', () => {
    expect(html).toMatch(/localStorage\.getItem\(["']bitacora-theme["']\)/);
  });

  it('the inline script falls back to prefers-color-scheme', () => {
    expect(html).toMatch(/prefers-color-scheme/);
  });

  it('the inline script sets data-theme on document.documentElement', () => {
    expect(html).toMatch(/document\.documentElement/);
  });

  it('includes inline <style> with critical dark tokens', () => {
    expect(html).toMatch(/<style>[\s\S]*?--color-background[\s\S]*?--color-foreground[\s\S]*?<\/style>/i);
  });

  it('page title is brand-appropriate', () => {
    expect(html).toMatch(/<title>Bitácora Café/);
  });
});
