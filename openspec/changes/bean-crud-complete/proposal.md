# Proposal: Bean CRUD Complete

## Intent

Bean CRUD has backend but no Edit/Delete UI. Brews can't be shared publicly. No toasts or skeleton loaders. Complete bean CRUD, add brew sharing, fill UX gaps.

## Scope

### In Scope
- Edit/Delete on BeanDetail (modal reuse, matches BrewDetail)
- Toast context + provider (CSS-only, auto-dismiss)
- CSS-only skeletons (primitive + domain shapes, respects reduced-motion)
- Share brew: `shareToken` columns, public endpoint, SharedBrewView

### Out of Scope
- Profile skeleton, share expiration, external deps, comments on shared brews

## Capabilities

### New Capabilities
- `toast-notifications`: ToastContext + ToastProvider (success/error/info). CSS animations. Zero new deps.
- `skeleton-loaders`: Skeleton.tsx + BeanDetailSkeleton, BitacoraHomeSkeleton, BrewDetailSkeleton.
- `public-brew-sharing`: `GET /api/public/brews/:shareToken` returns brew+bean+notes. SharedBrewView at `/shared/brews/:shareToken`. No auth.

### Modified Capabilities
- `coffee-beans`: CBR-REQ-3/4 gain UI acceptance criteria (edit modal, delete confirm).
- `brew-sessions`: New requirement for share toggle, token gen, public view.

## Approach

1. **Beans UI**: Edit opens BeanForm modal. Delete uses `window.confirm()` → `beansApi.delete()`.
2. **Toasts**: createContext + provider in Layout. CSS `@keyframes` enter/exit, auto-dismiss via timer.
3. **Skeletons**: `@keyframes shimmer` CSS. Primitive with size props, composed by domain skeletons.
4. **Share brew**: Migration adds `shareToken TEXT UNIQUE` + `isPublic`. `crypto.randomUUID()` on toggle. Public route before auth middleware.

## Affected Areas

| Area | Impact | What |
|------|--------|------|
| `backend/src/db/schema.ts` | Modified | +`shareToken`, `isPublic` |
| `backend/src/routes/brews.ts` | Modified | +public endpoint |
| `backend/src/services/brew-service.ts` | Modified | +getByShareToken, toggleShare |
| `frontend/src/contexts/ToastContext.tsx` | **New** | Toast provider |
| `frontend/src/components/Skeleton.tsx` | **New** | Primitive + domain variants |
| `frontend/src/components/SharedBrewView.tsx` | **New** | Public brew page |
| `frontend/src/components/BeanDetail.tsx` | Modified | +Edit/Delete + skeleton |
| `frontend/src/components/BrewDetail.tsx` | Modified | +Share toggle + skeleton |
| `frontend/src/components/BitacoraHome.tsx` | Modified | +skeleton |
| `frontend/src/App.tsx` | Modified | +shared brew route |
| `frontend/src/styles/index.css` | Modified | +shimmer + toast CSS |
| `frontend/src/api/client.ts` | Modified | +toggleShareBrew |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Bean delete orphans brews (SET NULL) | Low | Existing behavior — no change |
| Token collision | Very Low | `crypto.randomUUID()` + UNIQUE |
| Oversharing brew notes | Low | User toggles share intentionally |
| Skeleton a11y | Low | Respects `prefers-reduced-motion` |

## Rollback

Revert DB migration. Remove public endpoint, toast/skeleton/share components, new routes. All additive — no destructive schema.

## Dependencies

- SQLite Drizzle migration (additive)

## Success Criteria

- [ ] BeanDetail shows Edit (modal) + Delete (confirm)
- [ ] Toasts appear on success/error, auto-dismiss
- [ ] Loading states use shape-matching skeletons
- [ ] Share toggle creates public link with all brew data
- [ ] All existing + new tests pass
