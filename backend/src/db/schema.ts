import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// ─── Coffee Beans ───────────────────────────────────────────────────────────

export const coffeeBeans = sqliteTable('coffee_beans', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  roaster: text('roaster').notNull(),
  origin: text('origin'),
  roastLevel: text('roast_level'), // "light" | "medium" | "dark" | etc.
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString())
    .$onUpdateFn(() => new Date().toISOString()),
});

// ─── Brew Sessions ──────────────────────────────────────────────────────────

export const brewSessions = sqliteTable('brew_sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  coffeeBeanId: integer('coffee_bean_id').references(() => coffeeBeans.id, {
    onDelete: 'set null',
  }),
  grindSize: text('grind_size'), // e.g. "medium", "fine", "coarse"
  waterTemp: integer('water_temp'), // Celsius
  brewTime: integer('brew_time'), // seconds
  method: text('method').notNull(), // e.g. "V60", "Aeropress"
  grinder: text('grinder'), // grinder model/type
  clicks: text('clicks'), // grinder setting in clicks
  coffeeDose: real('coffee_dose'), // grams
  waterDose: real('water_dose'), // grams
  notes: text('notes'),
  rating: text('rating'), // free text
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString())
    .$onUpdateFn(() => new Date().toISOString()),
});

// ─── Tasting Notes ──────────────────────────────────────────────────────────

export const tastingNotes = sqliteTable('tasting_notes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  brewSessionId: integer('brew_session_id')
    .notNull()
    .references(() => brewSessions.id, { onDelete: 'cascade' }),
  aroma: text('aroma'),
  flavor: text('flavor'),
  body: text('body'),
  acidity: text('acidity'),
  rating: integer('rating'), // 1–5
  freeText: text('free_text'),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

// ─── Recipe Catalog ──────────────────────────────────────────────────────────

export const recipes = sqliteTable('recipes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  method: text('method').notNull(),
  name: text('name').notNull(),
  objective: text('objective'),
  preparation: text('preparation').notNull().$default(() => ''),
  coffeeDose: real('coffee_dose').notNull(),
  waterDose: real('water_dose').notNull(),
  ratio: text('ratio').notNull(),
  temperature: text('temperature').notNull(),
  grindSize: text('grind_size').notNull(),
  totalTime: text('total_time').notNull(),
  profile: text('profile').notNull(),
  steps: text('steps').notNull().$default(() => '[]'),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

// ─── Relations ──────────────────────────────────────────────────────────────

export const coffeeBeansRelations = relations(coffeeBeans, ({ many }) => ({
  brewSessions: many(brewSessions),
}));

export const brewSessionsRelations = relations(brewSessions, ({ one, many }) => ({
  coffeeBean: one(coffeeBeans, {
    fields: [brewSessions.coffeeBeanId],
    references: [coffeeBeans.id],
  }),
  tastingNotes: many(tastingNotes),
}));

export const tastingNotesRelations = relations(tastingNotes, ({ one }) => ({
  brewSession: one(brewSessions, {
    fields: [tastingNotes.brewSessionId],
    references: [brewSessions.id],
  }),
}));
