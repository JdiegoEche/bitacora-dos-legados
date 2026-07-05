import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// ─── Users ──────────────────────────────────────────────────────────────────

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

// ─── Coffee Beans ───────────────────────────────────────────────────────────

export const coffeeBeans = sqliteTable('coffee_beans', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  roaster: text('roaster').notNull(),
  origin: text('origin'),
  roastLevel: text('roast_level'), // "light" | "medium" | "dark" | etc.
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
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
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
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
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
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

// ─── Indexes ────────────────────────────────────────────────────────────────

export const brewSessionsUserMethodIdx = index('brew_sessions_user_method_idx')
  .on(brewSessions.userId, brewSessions.method);

export const brewSessionsCoffeeBeanIdx = index('brew_sessions_coffee_bean_idx')
  .on(brewSessions.coffeeBeanId);

export const tastingNotesBrewSessionIdx = index('tasting_notes_brew_session_idx')
  .on(tastingNotes.brewSessionId);

export const coffeeBeansUserIdx = index('coffee_beans_user_idx')
  .on(coffeeBeans.userId);
