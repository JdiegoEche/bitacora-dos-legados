# Tasks: Bitácora Café Core

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~1,700 (backend 745, frontend 980, DB 10) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (Backend) → PR 2 (Frontend brew UI) → PR 3 (Frontend beans + notes UI) |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Backend: scaffolding, DB schema, seed, services, routes | PR 1 | Base: main. Complete testable API. |
| 2 | Frontend: API client, brew session pages, routing | PR 2 | Base: PR 1 branch. Brew CRUD in UI. |
| 3 | Frontend: coffee beans + tasting notes components | PR 3 | Base: PR 2 branch. Remaining UI. |

## Phase 1: Foundation

- [x] 1.1 Create `backend/package.json`, `tsconfig.json`, `drizzle.config.ts` — deps: hono, drizzle-orm, better-sqlite3, zod, drizzle-zod, @hono/zod-validator, tsx, drizzle-kit
- [x] 1.2 Create `frontend/package.json`, `vite.config.ts`, `tsconfig.json`, `index.html` — deps: react, react-dom, react-router-dom, @tanstack/react-query
- [x] 1.3 Create `backend/src/db/schema.ts` — Drizzle schema for coffee_beans, brew_sessions, tasting_notes with relations (SET NULL on bean FK, CASCADE on brew FK)
- [x] 1.4 Create `backend/src/db/connection.ts` — better-sqlite3 client from DATABASE_URL env; `backend/src/db/seed.ts` — 3 sample beans + 3 brew sessions
- [x] 1.5 Create `backend/src/types/index.ts` — re-export $inferSelect/$inferInsert types; `backend/src/lib/validators.ts` — Zod schemas for Create/Update per domain

## Phase 2: Backend API

- [x] 2.1 Create `backend/src/services/brew-service.ts` — brew CRUD + cascade-aware queries
- [x] 2.2 Create `backend/src/services/bean-service.ts` — bean CRUD + SET NULL on referenced brews
- [x] 2.3 Create `backend/src/services/note-service.ts` — note CRUD scoped to brew_session_id
- [x] 2.4 Create `backend/src/routes/brews.ts` — GET/POST /api/brews, GET/PUT/DELETE /api/brews/:id
- [x] 2.5 Create `backend/src/routes/beans.ts` — GET/POST /api/beans, GET/PUT/DELETE /api/beans/:id
- [x] 2.6 Create `backend/src/routes/notes.ts` — GET/POST /api/brews/:brewId/notes, DELETE /api/notes/:id
- [x] 2.7 Create `backend/src/index.ts` — Hono app, CORS, mount all route groups, serve static frontend in prod; add database/.gitignore for *.db

## Phase 3: Frontend — Brew Sessions

- [x] 3.1 Create `frontend/src/main.tsx` + `src/App.tsx` — QueryClientProvider, BrowserRouter, route defs (/, /brews/new, /brews/:id, /brews/:id/edit, /beans)
- [x] 3.2 Create `frontend/src/api/client.ts` — typed fetch wrapper for all API endpoints
- [x] 3.3 Create `frontend/src/components/BrewList.tsx` — table sorted by date with method, bean, rating; link to detail
- [x] 3.4 Create `frontend/src/components/BrewForm.tsx` — recipe fields form with BeanSelect dropdown; POST /api/brews
- [x] 3.5 Create `frontend/src/components/BrewDetail.tsx` + `BrewEdit.tsx` — detail view with full recipe + notes; pre-filled edit form

## Phase 4: Frontend — Beans & Tasting Notes

- [x] 4.1 Create `frontend/src/components/BeanForm.tsx` — add/edit bean modal with name, roaster, origin, roast level fields (BeanSelect.tsx was created in PR 2)
- [x] 4.2 Create `frontend/src/components/BeanList.tsx` — table with edit/delete actions
- [x] 4.3 Create `frontend/src/components/TastingNotesList.tsx`, `TastingNoteCard.tsx`, `TastingNoteForm.tsx` — note cards, delete, and add form; integrated into BrewDetail.tsx replacing inline notes
- [x] 4.4 Created `frontend/src/styles/index.css` — base layout styles (extended with modal, action buttons, note form styles)

## Phase 5: Testing

- [x] 5.1 Unit tests: Zod validators parse valid payloads and reject invalid with correct error shape — `backend/src/tests/validators.test.ts` (23 tests)
- [x] 5.2 Unit tests: service FK edge cases (SET NULL on bean delete, CASCADE on brew delete) — `backend/src/tests/service-fk.test.ts` (3 tests)
- [x] 5.3 Integration: in-memory SQLite + Hono app.request() full round-trip per endpoint — `backend/src/tests/integration.test.ts` (17 tests)
- [x] 5.4 Manual E2E: smoke test all UI flows — `backend/src/tests/e2e-smoke.md` (documented flows with acceptance checklist)
