/**
 * MethodIcons — Component tests
 *
 * Tests: each icon renders with correct aria-label,
 * default size, custom size, and uses currentColor.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  V60Icon,
  SwitchIcon,
  OrigamiIcon,
  KalitaIcon,
  ChemexIcon,
  AeropressIcon,
  methodIcons,
  methodNames,
} from './MethodIcons';

describe('V60Icon', () => {
  it('renders with default size and correct aria-label', () => {
    render(<V60Icon />);
    const svg = screen.getByRole('img', { name: /v60/i });
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('width', '48');
    expect(svg).toHaveAttribute('height', '48');
    expect(svg).toHaveAttribute('viewBox');
  });

  it('renders with custom size', () => {
    render(<V60Icon size={64} />);
    const svg = screen.getByRole('img', { name: /v60/i });
    expect(svg).toHaveAttribute('width', '64');
    expect(svg).toHaveAttribute('height', '64');
  });

  it('uses currentColor for fill', () => {
    render(<V60Icon />);
    const svg = screen.getByRole('img', { name: /v60/i });
    // At least one path/element should have fill="currentColor"
    const paths = svg.querySelectorAll('[fill="currentColor"]');
    expect(paths.length).toBeGreaterThanOrEqual(1);
  });

  it('renders SVG elements with valid geometry', () => {
    render(<V60Icon />);
    const svg = screen.getByRole('img', { name: /v60/i });
    const paths = svg.querySelectorAll('path');
    expect(paths.length).toBeGreaterThanOrEqual(1);
  });
});

describe('SwitchIcon', () => {
  it('renders with correct aria-label', () => {
    render(<SwitchIcon />);
    expect(
      screen.getByRole('img', { name: /switch/i }),
    ).toBeInTheDocument();
  });

  it('renders custom size', () => {
    render(<SwitchIcon size={32} />);
    const svg = screen.getByRole('img', { name: /switch/i });
    expect(svg).toHaveAttribute('width', '32');
    expect(svg).toHaveAttribute('height', '32');
  });
});

describe('OrigamiIcon', () => {
  it('renders with correct aria-label', () => {
    render(<OrigamiIcon />);
    expect(
      screen.getByRole('img', { name: /origami/i }),
    ).toBeInTheDocument();
  });
});

describe('KalitaIcon', () => {
  it('renders with correct aria-label', () => {
    render(<KalitaIcon />);
    expect(
      screen.getByRole('img', { name: /kalita/i }),
    ).toBeInTheDocument();
  });
});

describe('ChemexIcon', () => {
  it('renders with correct aria-label', () => {
    render(<ChemexIcon />);
    expect(
      screen.getByRole('img', { name: /chemex/i }),
    ).toBeInTheDocument();
  });
});

describe('AeropressIcon', () => {
  it('renders with correct aria-label', () => {
    render(<AeropressIcon />);
    expect(
      screen.getByRole('img', { name: /aeropress/i }),
    ).toBeInTheDocument();
  });
});

describe('methodIcons map', () => {
  it('exports icons for all 6 methods', () => {
    const expectedKeys = ['v60', 'switch', 'origami', 'kalitawave', 'chemex', 'aeropress'];
    for (const key of expectedKeys) {
      expect(methodIcons).toHaveProperty(key);
      expect(typeof methodIcons[key]).toBe('function');
    }
  });

  it('renders all icons from the map without crashing', () => {
    for (const [, IconComponent] of Object.entries(methodIcons)) {
      const { container } = render(<IconComponent />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    }
  });
});

describe('methodNames', () => {
  it('maps all 6 method slugs to display names', () => {
    expect(methodNames.v60).toBe('V60');
    expect(methodNames.switch).toBe('Hario Switch');
    expect(methodNames.origami).toBe('Origami');
    expect(methodNames.kalitawave).toBe('Kalita Wave');
    expect(methodNames.chemex).toBe('Chemex');
    expect(methodNames.aeropress).toBe('Aeropress');
  });
});
