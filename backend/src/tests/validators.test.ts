import { describe, it, expect } from 'vitest';
import {
  createBeanSchema,
  updateBeanSchema,
  createBrewSchema,
  updateBrewSchema,
  createNoteSchema,
  idParamSchema,
  brewIdParamSchema,
} from '../lib/validators.js';

// ─── Coffee Bean Validators ─────────────────────────────────────────────────

describe('createBeanSchema', () => {
  it('accepts valid payload with all fields', () => {
    const result = createBeanSchema.safeParse({
      name: 'Ethiopia Yirgacheffe',
      roaster: 'Counter Culture',
      origin: 'Ethiopia',
      roastLevel: 'light',
    });
    expect(result.success).toBe(true);
  });

  it('accepts payload with only required fields', () => {
    const result = createBeanSchema.safeParse({
      name: 'Test Bean',
      roaster: 'Test Roaster',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.origin).toBeUndefined();
      expect(result.data.roastLevel).toBeUndefined();
    }
  });

  it('rejects payload without name', () => {
    const result = createBeanSchema.safeParse({
      roaster: 'Test Roaster',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('name');
    }
  });

  it('rejects empty name string', () => {
    const result = createBeanSchema.safeParse({
      name: '',
      roaster: 'Test Roaster',
    });
    expect(result.success).toBe(false);
  });

  it('rejects payload without roaster', () => {
    const result = createBeanSchema.safeParse({
      name: 'Test Bean',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('roaster');
    }
  });

  it('accepts nullable origin and roastLevel', () => {
    const result = createBeanSchema.safeParse({
      name: 'Test',
      roaster: 'Test',
      origin: null,
      roastLevel: null,
    });
    expect(result.success).toBe(true);
  });
});

describe('updateBeanSchema', () => {
  it('accepts partial payload', () => {
    const result = updateBeanSchema.safeParse({ name: 'Renamed' });
    expect(result.success).toBe(true);
  });

  it('accepts empty payload', () => {
    const result = updateBeanSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

// ─── Brew Session Validators ────────────────────────────────────────────────

describe('createBrewSchema', () => {
  const validBrew = {
    method: 'V60',
    grindSize: 'medium',
    waterTemp: 93,
    brewTime: '150',
    coffeeDose: 15,
    waterDose: 250,
  };

  it('accepts valid payload', () => {
    const result = createBrewSchema.safeParse(validBrew);
    expect(result.success).toBe(true);
  });

  it('rejects payload with missing method', () => {
    const { method, ...rest } = validBrew;
    const result = createBrewSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('rejects negative waterTemp', () => {
    const result = createBrewSchema.safeParse({ ...validBrew, waterTemp: -1 });
    expect(result.success).toBe(false);
  });

  it('accepts nullable rating', () => {
    const result = createBrewSchema.safeParse({ ...validBrew, rating: null });
    expect(result.success).toBe(true);
  });

  it('rejects rating over 5', () => {
    const result = createBrewSchema.safeParse({ ...validBrew, rating: 7 });
    expect(result.success).toBe(false);
  });

  it('accepts optional coffeeBeanId', () => {
    const result = createBrewSchema.safeParse({
      ...validBrew,
      coffeeBeanId: null,
    });
    expect(result.success).toBe(true);
  });
});

describe('updateBrewSchema', () => {
  it('accepts partial payload', () => {
    const result = updateBrewSchema.safeParse({ rating: '5' });
    expect(result.success).toBe(true);
  });
});

// ─── Tasting Note Validators ────────────────────────────────────────────────

describe('createNoteSchema', () => {
  it('accepts empty payload (all optional)', () => {
    const result = createNoteSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts full note payload', () => {
    const result = createNoteSchema.safeParse({
      aroma: 'floral',
      flavor: 'berry',
      body: 'medium',
      acidity: 'bright',
      rating: 4,
      freeText: 'Great cup',
    });
    expect(result.success).toBe(true);
  });

  it('rejects rating above 5', () => {
    const result = createNoteSchema.safeParse({ rating: 6 });
    expect(result.success).toBe(false);
  });

  it('accepts nullable string fields', () => {
    const result = createNoteSchema.safeParse({
      aroma: null,
      flavor: null,
    });
    expect(result.success).toBe(true);
  });
});

// ─── Param Validators ───────────────────────────────────────────────────────

describe('idParamSchema', () => {
  it('coerces string number to number', () => {
    const result = idParamSchema.safeParse({ id: '5' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe(5);
    }
  });

  it('rejects non-positive id', () => {
    const result = idParamSchema.safeParse({ id: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects non-numeric id', () => {
    const result = idParamSchema.safeParse({ id: 'abc' });
    expect(result.success).toBe(false);
  });
});

describe('brewIdParamSchema', () => {
  it('coerces valid brewId', () => {
    const result = brewIdParamSchema.safeParse({ brewId: '3' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.brewId).toBe(3);
    }
  });
});
