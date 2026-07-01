# Tasks: historial-por-cafe

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~565 add, ~180 del (~745 total) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1: Backend → PR 2: Frontend new → PR 3: Wiring |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main |

Decision needed before apply: Yes (resolved: stacked-to-main PR 1)
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Backend types + services + routes + tests | PR 1 | ~155 add, standalone testable |
| 2 | Frontend types + API client + BitacoraHome + BeanDetail | PR 2 | ~300 add, needs PR 1 backend |
| 3 | App.tsx routes + BrewForm/BeanForm mods + deletions | PR 3 | ~50 add + ~180 del, final wiring |

## Phase 1: Backend Types & Services

- [x] 1.1 Add `CoffeeBeanWithStats` and `BrewSessionWithNotes` to `backend/src/types/index.ts`
- [x] 1.2 Add `getByIdWithStats(id)` to `bean-service.ts` — Drizzle sub-queries for avgRating, brewCount, methodBreakdown
- [x] 1.3 Add `getBrewsByBeanId(id)` to `bean-service.ts` — brews newest-first with tasting notes summary join

## Phase 2: Backend Routes & Tests

- [x] 2.1 Update `GET /api/beans/:id` in `routes/beans.ts` to use `getByIdWithStats`
- [x] 2.2 Add `GET /api/beans/:id/brews` route in `routes/beans.ts` using `getBrewsByBeanId`
- [x] 2.3 Add integration tests: `GET /api/beans/:id` returns stats; `GET /api/beans/:id/brews` returns 200/404/empty

## Phase 3: Frontend Types & API Client

- [x] 3.1 Add `CoffeeBeanWithStats` and `BrewSessionWithNotes` interfaces to `frontend/src/types.ts`
- [x] 3.2 Update `beansApi.getById` return type to `CoffeeBeanWithStats` in `api/client.ts`
- [x] 3.3 Add `beansApi.getBrewsByBean(id)` returning `BrewSessionWithNotes[]` in `api/client.ts`

## Phase 4: New Frontend Components

- [x] 4.1 Create `BitacoraHome.tsx` — bean card grid + "Crear café" (BeanForm modal with `onCreated`), card click navigates to `/bitacora/:id`
- [x] 4.2 Create `BeanDetail.tsx` — parallel fetch bean stats + brew history, stats display, brew list with tasting notes, "Nueva preparación" link

## Phase 5: Modify Existing Components

- [x] 5.1 Add `preSelectedBeanId` prop to `BrewForm.tsx` — hide bean selector when set; inline `<select>` when unset; post-create redirect to `/bitacora/:beanId`; invalidate `['bean-brews', id]`
- [x] 5.2 Add `onCreated` callback to `BeanForm.tsx` — pass created bean to parent for navigation after save

## Phase 6: Routing & Cleanup

- [x] 6.1 Update `App.tsx` — add `/bitacora` (BitacoraHome), `/bitacora/:id` (BeanDetail), `/bitacora/:id/brews/new` (BrewForm with preSelectedBeanId); remove `/beans`, `/brews/new`, old `/bitacora`
- [x] 6.2 Delete `BeanList.tsx`, `BeanSelect.tsx`, `BrewList.tsx`
- [x] 6.3 Fix brewTime type consistency (validator→string, route→Number() conversion, test data); all 49 tests pass, zero tsc errors
