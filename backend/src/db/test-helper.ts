import { newDb, type IMemoryDb } from 'pg-mem';
import { drizzle } from 'drizzle-orm/pg-proxy';
import { sql } from 'drizzle-orm';
import type { PgDatabase } from 'drizzle-orm/pg-core';
import * as schema from './schema';

export type TestDb = PgDatabase<typeof schema> & {
  // Extend with a raw query helper for convenience
  raw: (query: string) => void;
};

let memDb: IMemoryDb | null = null;

/**
 * Extracts the ordered output column names from a SQL query.
 * Handles SELECT ... FROM ... and ... RETURNING ... patterns.
 */
function extractColumnOrder(sql: string): string[] {
  const trimmed = sql.trim();

  // SELECT ... FROM ... — extract columns between SELECT and FROM
  // Handle CTEs by finding the outermost SELECT
  const selectMatch = trimmed.match(/\bselect\s+(.*?)\s+from\s/i);
  if (selectMatch) {
    return parseColumnList(selectMatch[1]);
  }

  // INSERT ... RETURNING ... or UPDATE ... RETURNING ... or DELETE ... RETURNING ...
  const returningMatch = trimmed.match(/\breturning\s+(.*?)$/i);
  if (returningMatch) {
    return parseColumnList(returningMatch[1]);
  }

  return [];
}

/**
 * Returns the pg-mem result column name for a SELECT expression.
 * - `"col"` → `col`
 * - `"table"."col"` → `col`
 * - `count(*)` → `count`
 * - `json_build_array("a", "b")` → `json_build_array`
 * - `coalesce(json_agg(...), '[]'::json)` → `coalesce`
 * - `"table"."col" as "alias"` → `alias`
 */
function expressionToColumnKey(expr: string): string {
  const trimmed = expr.trim();

  // Handle col AS alias
  const asMatch = trimmed.match(/\s+as\s+("(?:[^"]*)"|\w+)$/i);
  if (asMatch) return asMatch[1].replace(/^"|"$/g, '');

  // Handle table.col or "table"."col"
  const qualMatch = trimmed.match(/"?\w+"?\s*\.\s*("(?:[^"]+)"|\w+)/);
  if (qualMatch && /^[a-z_]/i.test(qualMatch[0])) {
    const col = qualMatch[1].replace(/^"|"$/g, '');
    if (col) return col;
  }

  // Handle function(...) — extract function name
  const fnMatch = trimmed.match(/^([a-z_]\w*)\s*\(/i);
  if (fnMatch) return fnMatch[1];

  // Handle * (wildcard — not ideal, fallback to first key)
  if (trimmed === '*') return '';

  // Simple col name (quoted or unquoted)
  return trimmed.replace(/^"|"$/g, '').trim();
}

/**
 * Parses a comma-separated column list into ordered column names.
 * Strips quoted identifiers, SQL aliases, and simple expressions.
 */
function parseColumnList(colList: string): string[] {
  const columns: string[] = [];
  let current = '';
  let inDoubleQuotes = false;
  let inSingleQuotes = false;
  let parenDepth = 0;

  for (const ch of colList) {
    if (ch === '"' && !inSingleQuotes) {
      inDoubleQuotes = !inDoubleQuotes;
      current += ch;
    } else if (ch === "'" && !inDoubleQuotes) {
      inSingleQuotes = !inSingleQuotes;
      current += ch;
    } else if (ch === '(' && !inDoubleQuotes && !inSingleQuotes) {
      parenDepth++;
      current += ch;
    } else if (ch === ')' && !inDoubleQuotes && !inSingleQuotes) {
      parenDepth--;
      current += ch;
    } else if (ch === ',' && !inDoubleQuotes && !inSingleQuotes && parenDepth === 0) {
      const col = current.trim();
      if (col) columns.push(col);
      current = '';
    } else {
      current += ch;
    }
  }
  const last = current.trim();
  if (last) columns.push(last);

  return columns.map(expressionToColumnKey).filter(Boolean);
}

/**
 * Creates an in-memory PostgreSQL database via pg-mem,
 * applies the full schema, and returns a Drizzle instance.
 */
export async function createTestDb(): Promise<TestDb> {
  memDb = newDb();

  // Create tables matching the pg-core schema
  memDb.public.none(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS coffee_beans (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      roaster TEXT NOT NULL,
      origin TEXT,
      roast_level TEXT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS brew_sessions (
      id SERIAL PRIMARY KEY,
      coffee_bean_id INTEGER REFERENCES coffee_beans(id) ON DELETE SET NULL,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      share_token TEXT UNIQUE,
      is_public BOOLEAN NOT NULL DEFAULT false,
      grind_size TEXT,
      water_temp INTEGER,
      brew_time INTEGER,
      method TEXT NOT NULL,
      grinder TEXT,
      clicks TEXT,
      coffee_dose REAL,
      water_dose REAL,
      notes TEXT,
      rating INTEGER,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tasting_notes (
      id SERIAL PRIMARY KEY,
      brew_session_id INTEGER NOT NULL REFERENCES brew_sessions(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      aroma TEXT,
      flavor TEXT,
      body TEXT,
      acidity TEXT,
      rating INTEGER,
      free_text TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS recipes (
      id SERIAL PRIMARY KEY,
      method TEXT NOT NULL,
      name TEXT NOT NULL,
      objective TEXT,
      preparation TEXT NOT NULL DEFAULT '',
      coffee_dose REAL NOT NULL,
      water_dose REAL NOT NULL,
      ratio TEXT NOT NULL,
      temperature TEXT NOT NULL,
      grind_size TEXT NOT NULL,
      total_time TEXT NOT NULL,
      profile TEXT NOT NULL,
      steps TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL
    );
  `);

  // Create indexes
  memDb.public.none(`
    CREATE INDEX IF NOT EXISTS brew_sessions_user_method_idx ON brew_sessions(user_id, method);
    CREATE INDEX IF NOT EXISTS brew_sessions_coffee_bean_idx ON brew_sessions(coffee_bean_id);
    CREATE INDEX IF NOT EXISTS tasting_notes_brew_session_idx ON tasting_notes(brew_session_id);
    CREATE INDEX IF NOT EXISTS coffee_beans_user_idx ON coffee_beans(user_id);
  `);

  const db = drizzle(
    async (query, params, _method) => {
      const q = query as string;
      const p = (params || []) as any[];

      // 1. Substitute $1, $2 params inline for pg-mem compatibility
      let sql = q;
      if (p.length > 0) {
        sql = q.replace(/\$(\d+)/g, (_match, index) => {
          const val = p[parseInt(index) - 1];
          if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
          if (val === null || val === undefined) return 'NULL';
          return String(val);
        });
      }

      // 2. Execute via pg-mem — returns objects { col: value, ... }
      const objectRows = memDb!.public.many(sql) as Record<string, any>[];

      // 3. Convert objects → positional arrays for drizzle's mapResultRow
      //    drizzle expects row[0] = first column, row[1] = second column, etc.
      //    We use pg-mem's own column order from the first row's keys.
      if (objectRows.length > 0) {
        const pgCols = Object.keys(objectRows[0]);
        const rows = objectRows.map((row) => pgCols.map((col) => row[col] ?? null));
        return { rows };
      }

      return { rows: [] as any[] };
    },
    { schema },
  ) as unknown as TestDb;

  // Add a raw query helper (useful for test setup/teardown)
  Object.assign(db, {
    raw: (query: string) => memDb!.public.none(query),
  });

  return db;
}

/**
 * Destroys the in-memory database. Call in afterAll/afterEach.
 */
export function destroyTestDb(): void {
  memDb = null;
}

/**
 * Quick helper to reset all user data between tests without dropping tables.
 */
export async function resetTestTables(db: TestDb): Promise<void> {
  await db.execute(sql`DELETE FROM tasting_notes`);
  await db.execute(sql`DELETE FROM brew_sessions`);
  await db.execute(sql`DELETE FROM coffee_beans`);
  await db.execute(sql`DELETE FROM users`);
}
