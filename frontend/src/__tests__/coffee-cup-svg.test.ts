/**
 * coffee-cup.svg — PWA icon source verification tests
 *
 * Verifies the SVG icon file exists and has the correct structure.
 */
import fs from 'fs';
import path from 'path';

describe('coffee-cup.svg — PWA icon source', () => {
  const svgPath = path.resolve(__dirname, '../../public/coffee-cup.svg');
  let source: string;

  beforeAll(() => {
    source = fs.readFileSync(svgPath, 'utf-8');
  });

  it('exists in frontend/public/', () => {
    expect(fs.existsSync(svgPath)).toBe(true);
  });

  it('is a valid SVG with <svg> root element', () => {
    expect(source).toMatch(/^<svg/);
    expect(source).toMatch(/<\/svg>\s*$/);
  });

  it('has 512x512 viewBox', () => {
    expect(source).toMatch(/viewBox="0 0 512 512"/);
  });

  it('includes stroke color #A67C52', () => {
    expect(source).toMatch(/#A67C52/);
  });

  it('includes a coffee cup outline (path or rect)', () => {
    expect(source).toMatch(/<(path|rect|g)/);
  });

  it('includes steam elements', () => {
    expect(source).toMatch(/steam|path.*[Cc]urve/i);
  });
});
