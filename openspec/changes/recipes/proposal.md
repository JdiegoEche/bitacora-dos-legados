# Proposal: Recipe Book (Recetario de Métodos de Filtrado)

## Intent

Users log brews but have no reference to follow established filter-coffee recipes. Add a recipe book completing "study → brew → log" — browse 6 iconic methods with parameters and step-by-step steps.

## Scope

### In Scope
- SQLite `recipes` table via Drizzle ORM + migration
- Zod validators, service layer, Hono routes (list + detail)
- Seed script with 26+ recipes from `filter-coffeMD/*.md`
- Frontend types, `recipesApi` in API client
- Navbar "Recetas" link with SVG method icons
- Routes: `/recetas` → `/recetas/:metodo` → `/recetas/:metodo/:id`
- Responsive method grid + recipe list + detail components

### Out of Scope
- User CRUD, favorites, "apply to brew" linking, search, mobile drawer

## Capabilities

### New Capabilities
- `recipes`: Read-only filter-coffee recipe catalog — method filtering, steps, profiles

### Modified Capabilities
- None

## Approach

Add `recipes` table to existing Drizzle schema. Create `recipe-service.ts`, `routes/recipes.ts`, validators. Seed from `filter-coffeMD/` programmatically. Frontend: `recipesApi`, component tree under `recipes/`, routes in `App.tsx`, nav link in `Layout.tsx`. Responsive CSS Grid; inline SVG icons.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `backend/src/db/schema.ts` | Modified | Add `recipes` table |
| `backend/src/db/seed.ts` | Modified | Seed from markdown |
| `backend/src/lib/validators.ts` | Modified | Recipe Zod schemas |
| `backend/src/services/recipe-service.ts` | **New** | list, getById |
| `backend/src/routes/recipes.ts` | **New** | GET routes |
| `backend/src/index.ts` | Modified | Mount `/api/recipes` |
| `backend/src/types/index.ts` | Modified | Recipe types |
| `frontend/src/types.ts` | Modified | `Recipe`, `Step` interfaces |
| `frontend/src/api/client.ts` | Modified | `recipesApi` |
| `frontend/src/components/Layout.tsx` | Modified | Nav link + SVG icons |
| `frontend/src/App.tsx` | Modified | Recipe routes |
| `frontend/src/components/recipes/` | **New** | 3 components |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Large seed data | Low | Static import, no runtime parsing |
| Route conflicts | Low | `/recetas` is new prefix |
| SVG maintenance | Low | Inline components, one per method |

## Rollback Plan

Drop `recipes` table, revert schema + migration. Delete new routes, service, components, nav link.

## Dependencies

- Existing `filter-coffeMD/*.md` as seed source
- Existing Drizzle + Hono + React Router infra

## Success Criteria

- [ ] `GET /api/recipes?method=v60` returns 9 V60 recipes with all fields
- [ ] `GET /api/recipes/1` returns full recipe with JSON steps array
- [ ] `/recetas` shows a 6-method grid with SVG icons
- [ ] `/recetas/v60` lists V60 recipes with params table
- [ ] `/recetas/v60/1` shows full James Hoffmann recipe with steps
- [ ] Navbar shows "Recetas" link next to "Bitácora"
- [ ] All existing tests pass
