/**
 * Recipe types — structural verification
 *
 * Tests that the Recipe, RecipeStep, and RecipeDetail interfaces
 * match the API contract shape. Since types are compile-time only,
 * we verify runtime object shapes using the interfaces.
 */
import { describe, it, expect } from 'vitest';
import type { Recipe, RecipeStep, RecipeDetail } from '../types';

describe('Recipe types', () => {
  it('creates a valid Recipe object with all required fields', () => {
    const recipe: Recipe = {
      id: 1,
      method: 'v60',
      name: 'Classic V60',
      objective: 'Bright and clean cup',
      preparation: null,
      coffeeDose: 15,
      waterDose: 250,
      ratio: '1:16.7',
      temperature: '93°C',
      grindSize: 'medium',
      totalTime: '2:30',
      profile: 'bright',
      createdAt: '2026-01-01T00:00:00Z',
    };

    expect(recipe.id).toBe(1);
    expect(recipe.method).toBe('v60');
    expect(recipe.name).toBe('Classic V60');
    expect(recipe.objective).toBe('Bright and clean cup');
    expect(recipe.coffeeDose).toBe(15);
    expect(recipe.waterDose).toBe(250);
    expect(recipe.ratio).toBe('1:16.7');
    expect(recipe.temperature).toBe('93°C');
    expect(recipe.grindSize).toBe('medium');
    expect(recipe.totalTime).toBe('2:30');
    expect(recipe.profile).toBe('bright');
    expect(recipe.createdAt).toBe('2026-01-01T00:00:00Z');
  });

  it('creates a valid Recipe object with nullable objective as null', () => {
    const recipe: Recipe = {
      id: 2,
      method: 'aeropress',
      name: 'Quick Aeropress',
      objective: null,
      preparation: null,
      coffeeDose: 14,
      waterDose: 200,
      ratio: '1:14.3',
      temperature: '88°C',
      grindSize: 'fine',
      totalTime: '1:30',
      profile: 'smooth',
      createdAt: '2026-01-02T00:00:00Z',
    };

    expect(recipe.objective).toBeNull();
    expect(recipe.id).toBe(2);
  });

  it('creates a valid RecipeStep without optional waterAtStep', () => {
    const step: RecipeStep = {
      stepOrder: 1,
      instruction: 'Bloom with 50g water',
    };

    expect(step.stepOrder).toBe(1);
    expect(step.instruction).toContain('Bloom');
    expect(step.waterAtStep).toBeUndefined();
  });

  it('creates a valid RecipeStep with waterAtStep', () => {
    const step: RecipeStep = {
      stepOrder: 2,
      instruction: 'Main pour',
      waterAtStep: 200,
    };

    expect(step.stepOrder).toBe(2);
    expect(step.instruction).toBe('Main pour');
    expect(step.waterAtStep).toBe(200);
  });

  it('creates a valid RecipeDetail extending Recipe with steps', () => {
    const detail: RecipeDetail = {
      id: 1,
      method: 'v60',
      name: 'Classic V60',
      objective: null,
      preparation: 'Rinse filter, preheat server',
      coffeeDose: 15,
      waterDose: 250,
      ratio: '1:16.7',
      temperature: '93°C',
      grindSize: 'medium',
      totalTime: '2:30',
      profile: 'bright',
      createdAt: '2026-01-01T00:00:00Z',
      steps: [
        { stepOrder: 1, instruction: 'Bloom', waterAtStep: 50 },
        { stepOrder: 2, instruction: 'Main pour', waterAtStep: 200 },
        { stepOrder: 3, instruction: 'Drawdown' },
      ],
    };

    expect(detail.steps).toHaveLength(3);
    expect(detail.steps[0].waterAtStep).toBe(50);
    expect(detail.steps[1].instruction).toBe('Main pour');
    expect(detail.steps[2].waterAtStep).toBeUndefined();
    // Inherits Recipe fields
    expect(detail.method).toBe('v60');
    expect(detail.coffeeDose).toBe(15);
  });

  it('makes created fields readable as strings', () => {
    const recipe: Recipe = {
      id: 3,
      method: 'chemex',
      name: 'Chemex Classic',
      objective: 'Clean body',
      preparation: null,
      coffeeDose: 30,
      waterDose: 500,
      ratio: '1:16.7',
      temperature: '94°C',
      grindSize: 'medium-coarse',
      totalTime: '4:00',
      profile: 'clean',
      createdAt: '2026-06-15T10:00:00Z',
    };

    expect(typeof recipe.createdAt).toBe('string');
    expect(new Date(recipe.createdAt).getFullYear()).toBe(2026);
  });
});
