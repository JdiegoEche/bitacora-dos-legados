/**
 * vite.config.ts — PWA configuration verification tests
 *
 * Verifies that vite-plugin-pwa is imported and configured.
 */
import fs from 'fs';
import path from 'path';

describe('vite.config.ts — PWA setup', () => {
  const configPath = path.resolve(__dirname, '../../vite.config.ts');
  let source: string;

  beforeAll(() => {
    source = fs.readFileSync(configPath, 'utf-8');
  });

  it('imports VitePWA from vite-plugin-pwa', () => {
    expect(source).toMatch(/import\s*\{\s*VitePWA\s*\}\s*from\s+['"]vite-plugin-pwa['"]/);
  });

  it('includes VitePWA in the plugins array', () => {
    expect(source).toMatch(/VitePWA\(\{/);
  });

  it('sets registerType to autoUpdate', () => {
    expect(source).toMatch(/registerType:\s*['"]autoUpdate['"]/);
  });

  it('includes manifest with name Bitácora Café', () => {
    expect(source).toMatch(/name:\s*['"]Bitácora Café['"]/);
  });

  it('includes manifest with short_name Bitácora', () => {
    expect(source).toMatch(/short_name:\s*['"]Bitácora['"]/);
  });

  it('sets theme_color to #292524', () => {
    expect(source).toMatch(/theme_color:\s*['"]#292524['"]/);
  });

  it('sets display to standalone', () => {
    expect(source).toMatch(/display:\s*['"]standalone['"]/);
  });

  it('references coffee-cup.svg as an icon entry', () => {
    expect(source).toMatch(/coffee-cup\.svg/);
  });

  it('configures navigateFallback to /index.html', () => {
    expect(source).toMatch(/navigateFallback:\s*['"]\/index\.html['"]/);
  });

  it('configures NetworkFirst runtime caching for API routes', () => {
    expect(source).toMatch(/NetworkFirst/);
  });

  it('configures StaleWhileRevalidate for recipes', () => {
    expect(source).toMatch(/StaleWhileRevalidate/);
  });
});
