import { describe, it, expect } from 'vitest';
import {
  recipeQuerySchema,
  recipeIdParamSchema,
} from '../lib/validators';

// ─── Recipe Query Validators ─────────────────────────────────────────────────

describe('recipeQuerySchema', () => {
  const validMethods = ['v60', 'aeropress', 'chemex', 'kalitawave', 'origami', 'switch'];

  it('accepts empty query (no method filter)', () => {
    const result = recipeQuerySchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts a valid method', () => {
    for (const method of validMethods) {
      const result = recipeQuerySchema.safeParse({ method });
      expect(result.success).toBe(true);
    }
  });

  it('rejects an unsupported method value', () => {
    const result = recipeQuerySchema.safeParse({ method: 'french-press' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('method');
    }
  });

  it('rejects empty string method', () => {
    const result = recipeQuerySchema.safeParse({ method: '' });
    expect(result.success).toBe(false);
  });
});

// ─── Recipe ID Param Validators ──────────────────────────────────────────────

describe('recipeIdParamSchema', () => {
  it('coerces valid string id to number', () => {
    const result = recipeIdParamSchema.safeParse({ id: '3' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe(3);
    }
  });

  it('rejects non-positive id', () => {
    const result = recipeIdParamSchema.safeParse({ id: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects negative id', () => {
    const result = recipeIdParamSchema.safeParse({ id: -1 });
    expect(result.success).toBe(false);
  });

  it('rejects non-numeric id', () => {
    const result = recipeIdParamSchema.safeParse({ id: 'abc' });
    expect(result.success).toBe(false);
  });
});
