import { pgTable, text, integer, real, boolean, serial, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ─── Users ──────────────────────────────────────────────────────────────────

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

// ─── Coffee Beans ───────────────────────────────────────────────────────────

export const coffeeBeans = pgTable('coffee_beans', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  roaster: text('roaster'),
  origin: text('origin'),
  roastLevel: text('roast_level'),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString())
    .$onUpdateFn(() => new Date().toISOString()),
}, (table) => [
  index('coffee_beans_user_idx').on(table.userId),
]);

// ─── Brew Sessions ──────────────────────────────────────────────────────────

export const brewSessions = pgTable('brew_sessions', {
  id: serial('id').primaryKey(),
  coffeeBeanId: integer('coffee_bean_id').references(() => coffeeBeans.id, {
    onDelete: 'set null',
  }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  shareToken: text('share_token').unique(),
  isPublic: boolean('is_public').notNull().default(false),
  grindSize: text('grind_size'),
  waterTemp: integer('water_temp'),
  brewTime: text('brew_time'),
  method: text('method').notNull(),
  grinder: text('grinder'),
  clicks: text('clicks'),
  coffeeDose: real('coffee_dose'),
  waterDose: real('water_dose'),
  notes: text('notes'),
  rating: text('rating'),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString())
    .$onUpdateFn(() => new Date().toISOString()),
}, (table) => [
  index('brew_sessions_user_method_idx').on(table.userId, table.method),
  index('brew_sessions_coffee_bean_idx').on(table.coffeeBeanId),
]);

// ─── Tasting Notes ──────────────────────────────────────────────────────────

export const tastingNotes = pgTable('tasting_notes', {
  id: serial('id').primaryKey(),
  brewSessionId: integer('brew_session_id')
    .notNull()
    .references(() => brewSessions.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  aroma: text('aroma'),
  flavor: text('flavor'),
  body: text('body'),
  acidity: text('acidity'),
  rating: integer('rating'),
  freeText: text('free_text'),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
}, (table) => [
  index('tasting_notes_brew_session_idx').on(table.brewSessionId),
]);

// ─── Recipe Catalog ──────────────────────────────────────────────────────────

export const recipes = pgTable('recipes', {
  id: serial('id').primaryKey(),
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

export const coffeeBeansRelations = relations(coffeeBeans, ({ one, many }) => ({
  brewSessions: many(brewSessions),
  user: one(users, {
    fields: [coffeeBeans.userId],
    references: [users.id],
  }),
}));

export const brewSessionsRelations = relations(brewSessions, ({ one, many }) => ({
  coffeeBean: one(coffeeBeans, {
    fields: [brewSessions.coffeeBeanId],
    references: [coffeeBeans.id],
  }),
  user: one(users, {
    fields: [brewSessions.userId],
    references: [users.id],
  }),
  tastingNotes: many(tastingNotes),
}));

export const tastingNotesRelations = relations(tastingNotes, ({ one }) => ({
  brewSession: one(brewSessions, {
    fields: [tastingNotes.brewSessionId],
    references: [brewSessions.id],
  }),
  user: one(users, {
    fields: [tastingNotes.userId],
    references: [users.id],
  }),
}));

// ─── User Relations ──────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  coffeeBeans: many(coffeeBeans),
  brewSessions: many(brewSessions),
  tastingNotes: many(tastingNotes),
}));
