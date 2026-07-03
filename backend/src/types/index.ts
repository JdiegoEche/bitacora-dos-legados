import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { users, coffeeBeans, brewSessions, tastingNotes, recipes } from '../db/schema';

// ─── Hono Context Extension ─────────────────────────────────────────────────

declare module 'hono' {
  interface ContextVariableMap {
    userId: number;
  }
}

// ─── Auth types ──────────────────────────────────────────────────────────────

export type User = InferSelectModel<typeof users>;
export type CreateUser = InferInsertModel<typeof users>;


// ─── Select types (what comes out of the DB) ───────────────────────────────

export type CoffeeBean = InferSelectModel<typeof coffeeBeans>;
export type BrewSession = InferSelectModel<typeof brewSessions>;
export type TastingNote = InferSelectModel<typeof tastingNotes>;

// ─── Insert types (what goes into the DB) ───────────────────────────────────

export type CreateCoffeeBean = InferInsertModel<typeof coffeeBeans>;
export type CreateBrewSession = InferInsertModel<typeof brewSessions>;
export type CreateTastingNote = InferInsertModel<typeof tastingNotes>;

// ─── Detail response types ──────────────────────────────────────────────────

export type BrewSessionDetail = BrewSession & {
  coffeeBean?: CoffeeBean | null;
  tastingNotes: TastingNote[];
};

export type CoffeeBeanWithBrews = CoffeeBean & {
  brewSessions: BrewSession[];
};

export type CoffeeBeanWithStats = CoffeeBean & {
  avgRating: number | null;
  brewCount: number;
  methodBreakdown: Record<string, number>;
};

export type BrewSessionWithNotes = BrewSession & {
  tastingNotesSummary: string | null;
};

// ─── Recipe Catalog ──────────────────────────────────────────────────────────

export type Recipe = InferSelectModel<typeof recipes>;
export type CreateRecipe = InferInsertModel<typeof recipes>;

export interface RecipeStep {
  stepOrder: number;
  instruction: string;
  waterAtStep?: number;
}

export interface RecipeDetail extends Recipe {
  steps: RecipeStep[];
}
