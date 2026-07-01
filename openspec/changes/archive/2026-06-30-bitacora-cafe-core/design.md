# Design: Bitácora Café Core

## Technical Approach

Monorepo with `backend/` (Hono + Drizzle + better-sqlite3), `frontend/` (React + Vite), and `database/` (SQLite file). API-first: all state from REST, enabling future mobile reuse. Three independent route modules (brews, beans, notes) sharing a single Drizzle schema and SQLite connection.

## Architecture Decisions

| Decision | Alternatives | Choice | Rationale |
|----------|-------------|--------|-----------|
| ORM | Prisma, Kysely | Drizzle | Lightweight, SQLite-native, no codegen, full TS inference |
| Validation | Joi, class-validator | Zod | Drizzle-native via `drizzle-zod`; infers types from schema |
| DB Driver | bun:sqlite, libsql | better-sqlite3 | Synchronous API simplifies request lifecycle; Node.js LTS compat |
| State mgmt | Redux, Zustand | TanStack Query | REST-native caching, auto refetch, optimistic updates built in |
| Routing | Hono file-based | Explicit route modules | Fine-grained control per domain; 3 modules manageable |
| Frontend routing | wouter, TanStack Router | React Router v6 | Community standard; layout nesting for brew pages |
| Static serving | nginx, separate Vite server | Hono serves built frontend | Single process for local MVP; no reverse proxy needed |

## Data Model

```
coffee_beans                brew_sessions                  tasting_notes
┌──────────────────┐       ┌─────────────────────┐        ┌─────────────────────┐
│ id (PK)          │◄──FK──│ coffee_bean_id      │        │ id (PK)             │
│ name (NOT NULL)  │       │ grind_size          │        │ brew_session_id (FK)│
│ roaster (NOT NULL)│      │ water_temp          │        │ aroma               │
│ origin           │       │ brew_time           │        │ flavor              │
│ roast_level      │       │ method              │◄─FK──── │ body                │
│ created_at       │       │ coffee_dose         │  CASCADE│ acidity             │
│ updated_at       │       │ water_dose          │        │ rating (1-5)        │
└──────────────────┘       │ notes               │        │ free_text           │
                           │ rating (1-5)        │        │ created_at          │
                           │ created_at          │        └─────────────────────┘
                           │ updated_at          │
                           └─────────────────────┘
```

Relationships:
- **coffee_bean → brew_session**: 1:N via `coffee_bean_id` (nullable, ON DELETE SET NULL)
- **brew_session → tasting_note**: 1:N via `brew_session_id` (ON DELETE CASCADE)

## Data Flow

```
React SPA ──fetch──▶ Hono Router ──▶ Zod validation ──▶ Service ──▶ Drizzle ORM ──▶ better-sqlite3
                          │                                                              │
                          └───────────────── JSON response ◄─────────────────────────────┘
```

GET `/api/brews/:id` expands tasting notes via Drizzle relations — one query with SQL joins. All mutations go through service layer for consistent FK handling (SET NULL on bean delete, CASCADE on brew delete).

## File Changes

### Backend (14 new files)

| File | Description |
|------|-------------|
| `backend/package.json` | Deps: hono, drizzle-orm, better-sqlite3, zod, drizzle-zod, @hono/zod-validator, tsx, drizzle-kit |
| `backend/tsconfig.json` | Node ES2022 target, strict |
| `backend/drizzle.config.ts` | Drizzle Kit config — SQLite, schema path, migrations dir |
| `backend/src/index.ts` | App entry: Hono app, CORS, mount routes, serve static in prod |
| `backend/src/db/connection.ts` | Better-sqlite3 + drizzle client from `DATABASE_URL` env |
| `backend/src/db/schema.ts` | All 3 tables + relations (coffeeBeans, brewSessions, tastingNotes) |
| `backend/src/db/seed.ts` | Dev seed script |
| `backend/src/lib/validators.ts` | Zod schemas: Create/Update for each domain |
| `backend/src/types/index.ts` | Re-exported inferred types via `$inferSelect`/`$inferInsert` |
| `backend/src/services/brew-service.ts` | Brew CRUD + cascade logic |
| `backend/src/services/bean-service.ts` | Bean CRUD + SET NULL on referenced brews |
| `backend/src/services/note-service.ts` | Note CRUD (scoped to brew) |
| `backend/src/routes/brews.ts` | Hono route group: `GET/POST /api/brews`, `GET/PUT/DELETE /api/brews/:id` |
| `backend/src/routes/beans.ts` | Hono route group: `GET/POST /api/beans`, `GET/PUT/DELETE /api/beans/:id` |
| `backend/src/routes/notes.ts` | Hono route group: `GET/POST /api/brews/:brewId/notes`, `DELETE /api/notes/:id` |

### Frontend (14 new files)

| File | Description |
|------|-------------|
| `frontend/package.json` | Deps: react, react-dom, react-router-dom, @tanstack/react-query |
| `frontend/vite.config.ts` | Vite + React plugin, proxy `/api` → dev backend |
| `frontend/tsconfig.json` | React 18+ strict config |
| `frontend/index.html` | Vite entry |
| `frontend/src/main.tsx` | Root mount with QueryClientProvider + BrowserRouter |
| `frontend/src/App.tsx` | Route definitions: `/` → BrewList, `/brews/new` → BrewForm, `/brews/:id` → BrewDetail, `/brews/:id/edit` → BrewEdit, `/beans` → BeanList |
| `frontend/src/api/client.ts` | Fetch wrapper: typed request helpers for all endpoints |
| `frontend/src/components/BrewList.tsx` | Table: method, bean name, rating, date; link to detail |
| `frontend/src/components/BrewForm.tsx` | Create form + BeanSelect dropdown |
| `frontend/src/components/BrewDetail.tsx` | Full recipe + TastingNotesList + TastingNoteForm |
| `frontend/src/components/BrewEdit.tsx` | Pre-filled BrewForm variant |
| `frontend/src/components/TastingNotesList.tsx` | Note cards with delete action |
| `frontend/src/components/TastingNoteForm.tsx` | Aroma/flavor/body/acidity + rating + free text |
| `frontend/src/components/TastingNoteCard.tsx` | Single note display + delete |
| `frontend/src/components/BeanSelect.tsx` | Combobox: fetch beans, select, "add new" option |
| `frontend/src/components/BeanForm.tsx` | Create/edit bean modal |
| `frontend/src/components/BeanList.tsx` | Table with edit/delete actions |
| `frontend/src/styles/index.css` | Base layout styles |

### Database (1 file + gitignore)

| File | Description |
|------|-------------|
| `database/cafe.db` | SQLite file (gitignored) |

## Interfaces / Contracts

```typescript
// Inferred from Drizzle — these are representative shapes:
type CoffeeBean = typeof coffeeBeans.$inferSelect;
type BrewSession = typeof brewSessions.$inferSelect;
type TastingNote = typeof tastingNotes.$inferSelect;

type CreateBrewSession   = typeof brewSessions.$inferInsert;
type CreateTastingNote   = typeof tastingNotes.$inferInsert;
type CreateCoffeeBean    = typeof coffeeBeans.$inferInsert;

// Detail response with relations
type BrewSessionDetail = BrewSession & {
  coffeeBean?: CoffeeBean | null;
  tastingNotes: TastingNote[];
};
```

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Unit | Validators | Zod schema parse: valid payloads pass, invalid reject with `400` shape |
| Unit | Services | Isolate service functions, test FK edge cases (SET NULL, cascade) |
| Integration | API endpoints | In-memory better-sqlite3, full request → response via Hono's `app.request()` |
| E2E | Frontend | Manual for MVP; vitest + happy-dom for DOM smoke tests |

## Migration / Rollout

Initial schema: `npx drizzle-kit push:sqlite` for dev iteration speed. Production path: `npx drizzle-kit generate` then `npx drizzle-kit migrate`. The `DATABASE_URL` env var points to `../database/cafe.db`. No data migration needed for MVP.

## Open Questions

- **Static serving strategy**: Hono serves built frontend in prod vs. separate web server? Decision: Hono serves it — simplest for single-user local app.
- **Seed data scope**: What minimal seed beans/methods should ship with the app to avoid empty-state confusion? Propose 3 common beans + 3 brew methods.
- **Drizzle Kit version**: v0.36+ uses `push:sqlite`. Confirm during setup.
