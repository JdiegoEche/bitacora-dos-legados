# Tasks: Recipe Catalog (Recetario)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 850–1000 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → PR 2 → PR 3 → PR 4 → PR 5 |
| Delivery strategy | auto-forecast |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Backend infra | PR 1 — base=main | schema, validators, service, routes, types, index |
| 2 | Seed + backend tests | PR 2 — base=main | markdown parser seed, integration tests |
| 3 | Frontend types + API + icons | PR 3 — base=main | types, recipesApi, 6 SVG method icons |
| 4 | Frontend components + routes + nav | PR 4 — base=main | 3 components, App.tsx routes, nav link |
| 5 | Frontend tests | PR 5 — base=main | component + navigation/routing tests |

## Phase 1: Backend Foundation (PR 1)

- [x] 1.1 Add `recipes` table with JSON `steps` column to `backend/src/db/schema.ts`
- [x] 1.2 Add recipe Zod schemas to `backend/src/lib/validators.ts` (methodQuery, step, steps array)
- [x] 1.3 Create `backend/src/services/recipe-service.ts` — `list(method?)`, `getById(id)`
- [x] 1.4 Create `backend/src/routes/recipes.ts` — GET `/`, GET `/:id` with zValidator
- [x] 1.5 Export `Recipe`, `RecipeDetail`, `RecipeStep` types from `backend/src/types/index.ts`
- [x] 1.6 Register recipe router in `backend/src/index.ts` under `/api/recipes`

## Phase 2: Seed + Backend Tests (PR 2)

- [x] 2.1 Write seed parser in `backend/src/db/seed.ts` — regex-parse `filter-coffeMD/*.md`, map to InsertRecipe, truncate + insert idempotently
- [x] 2.2 Integration tests: seed runs without error, counts per method, idempotency (running twice = same count)

## Phase 3: Frontend Foundation (PR 3)

- [x] 3.1 Add `Recipe`, `RecipeDetail`, `RecipeStep` interfaces to `frontend/src/types.ts`
- [x] 3.2 Add `recipesApi.list(method?)` and `recipesApi.getById(id)` to `frontend/src/api/client.ts`
- [x] 3.3 Create `frontend/src/components/icons/MethodIcons.tsx` — 6 inline SVG components (V60, Aeropress, Chemex, Kalita Wave, Origami, Switch)

## Phase 4: Frontend Components + Routes (PR 4)

- [x] 4.1 Create `RecipeMethodGrid` at `/recetas` — 6 SVG icons → `/recetas/:method`
- [x] 4.2 Create `RecipeList` at `/recetas/:method` — recipe cards with params + empty state
- [x] 4.3 Create `RecipeDetail` at `/recetas/:method/:id` — full recipe fields + ordered steps
- [x] 4.4 Add `/recetas` routes to `frontend/src/App.tsx` (grid, list, detail)
- [x] 4.5 Add "Recetas" nav link to `frontend/src/components/Layout.tsx`

## Phase 5: Frontend Tests (PR 5)

- [ ] 5.1 Test `RecipeDetail` — renders fields + steps, skeleton loading state
- [ ] 5.2 Test `RecipeList` — recipe cards render, empty state shows message
- [ ] 5.3 Test nav — "Recetas" link renders, route transitions work
