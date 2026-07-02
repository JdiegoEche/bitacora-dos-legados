import { z } from 'zod';

// ─── Coffee Beans ───────────────────────────────────────────────────────────

export const createBeanSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  roaster: z.string().min(1, 'Roaster is required'),
  origin: z.string().nullable().optional(),
  roastLevel: z.string().nullable().optional(),
});

export const updateBeanSchema = createBeanSchema.partial();

// ─── Brew Sessions ──────────────────────────────────────────────────────────

export const createBrewSchema = z.object({
  coffeeBeanId: z.number().int().positive().nullable().optional(),
  grindSize: z.string().min(1, 'Grind size is required'),
  waterTemp: z.number().int().positive('Water temperature must be positive'),
  brewTime: z.string().min(1, 'Brew time is required'),
  method: z.string().min(1, 'Method is required'),
  grinder: z.string().nullable().optional(),
  clicks: z.string().nullable().optional(),
  coffeeDose: z.number().positive('Coffee dose must be positive'),
  waterDose: z.number().positive('Water dose must be positive'),
  notes: z.string().nullable().optional(),
  rating: z.string().nullable().optional(),
});

export const updateBrewSchema = createBrewSchema.partial();

// ─── Tasting Notes ──────────────────────────────────────────────────────────

export const createNoteSchema = z.object({
  aroma: z.string().nullable().optional(),
  flavor: z.string().nullable().optional(),
  body: z.string().nullable().optional(),
  acidity: z.string().nullable().optional(),
  rating: z.number().int().min(1).max(5).nullable().optional(),
  freeText: z.string().nullable().optional(),
});

export const updateNoteSchema = createNoteSchema.partial();

// ─── Reusable param schemas ─────────────────────────────────────────────────

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive('ID must be a positive integer'),
});

export const brewIdParamSchema = z.object({
  brewId: z.coerce.number().int().positive('brewId must be a positive integer'),
});

// ─── Recipe Catalog ─────────────────────────────────────────────────────────

const recipeMethods = ['v60', 'aeropress', 'chemex', 'kalitawave', 'origami', 'switch'] as const;

export const recipeQuerySchema = z.object({
  method: z.enum(recipeMethods).optional(),
});

export const recipeIdParamSchema = z.object({
  id: z.coerce.number().int().positive('ID must be a positive integer'),
});

export const recipeStepSchema = z.object({
  stepOrder: z.number().int().positive(),
  instruction: z.string().min(1),
  waterAtStep: z.number().int().positive().optional(),
});

export const recipeStepsSchema = z.array(recipeStepSchema);
