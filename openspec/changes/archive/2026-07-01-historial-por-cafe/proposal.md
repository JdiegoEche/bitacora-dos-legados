# Proposal: historial-por-cafe

## Intent

Replace the flat all-brews `/bitacora` with bean-centric navigation: beans as entry points, each with brew history, tasting note summaries, stats, and nested brew creation.

## Scope

### In Scope
- New routes: `/bitacora` (bean cards), `/bitacora/:id` (detail), `/bitacora/:id/brews/new` (preselected brew form)
- `GET /api/beans/:id/brews` endpoint (brews for a bean, newest first)
- Stats on bean detail: avg rating, method breakdown, brew count
- `BrewForm` optional `preSelectedBeanId` prop to hide bean selector
- Remove routes `/beans`, `/brews/new`, old all-brews `/bitacora`, plus components `BeanList`, `BeanSelect`, old `BrewList`
- UI enforces `coffee_bean_id` as required (DB stays nullable for legacy)

### Out of Scope
- DB migrations, pre-existing `brewTime` type mismatch, editing brew from bean detail, deleting beans from bean detail

## Capabilities

### New Capabilities
- `bean-history`: Bean detail with stats + chronologically ordered brew history showing tasting notes summary. New API `GET /api/beans/:id/brews`.

### Modified Capabilities
- `coffee-beans`: `GET /api/beans/:id` includes or companions stats. UI mapping: removed `BeanList`/`BeanSelect`, added `BitacoraHome`/`BeanDetail`.
- `brew-sessions`: Routes change (removed and nested). `BrewForm` gets `preSelectedBeanId` prop. Post-creation redirect goes to bean detail.

## Approach

Approach A from exploration: dedicated bean detail route + nested brew creation. One optional `preSelectedBeanId` prop keeps `BrewForm` reusable. `bean-service.ts` adds a query for brews by bean with tasting notes join. Frontend adds 3 routes via React Router; existing brew detail/edit untouched.

## Affected Areas

- `backend/src/routes/beans.ts` — new `GET /api/beans/:id/brews`
- `backend/src/services/bean-service.ts` — new `getBrewsByBeanId`
- `frontend/src/App.tsx` — 3 routes added, 3 removed
- `frontend/src/api/client.ts` — new `beansApi.getBrewsByBean`
- `frontend/src/types.ts` — new `BeanWithBrews`
- `frontend/src/components/BrewForm.tsx` — optional `preSelectedBeanId`
- NEW `BitacoraHome.tsx`, `BeanDetail.tsx`
- REMOVED `BeanList.tsx`, `BeanSelect.tsx`, old `BrewList.tsx`

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Orphan brews hidden but still in DB | Low | Filter in service layer; no data loss |
| brewTime type mismatch confusion | Medium | Pre-existing; don't block on it |

## Rollback Plan

Restore old routes in `App.tsx`, revert `BrewForm` prop, restore removed components. Keep new endpoints unused. No DB changes to roll back.

## Dependencies

None. Schema already supports all relations.

## Success Criteria

- [ ] `/bitacora` shows bean cards + "Crear café"
- [ ] Bean detail shows brew history, stats, and "Nueva preparación"
- [ ] Brew from bean context preseeds bean and hides selector
- [ ] Post-creation redirect lands on bean detail
- [ ] Old `/beans`, `/brews/new`, old `/bitacora` return 404/redirect
- [ ] All existing tests still pass
