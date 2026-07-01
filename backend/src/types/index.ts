import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { coffeeBeans, brewSessions, tastingNotes } from '../db/schema';

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
