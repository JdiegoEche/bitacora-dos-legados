# Exploration: bean-crud-complete

## Current State
**Edit/Delete Beans**: Backend routes (`beans.ts`), service (`bean-service.ts`), API client (`client.ts`), and form component (`BeanForm.tsx`) all support edit/delete — **but BeanDetail.tsx has no Edit/Delete UI**. BrewDetail already shows the exact pattern needed.

**Toast Notifications**: Zero toast infrastructure exists. Errors use inline `.state-error` divs. Success feedback is implied by navigation. No notification library in the project.

**Skeleton Loaders**: All loading states use plain text (`"Cargando…"`, `"Cargando cafés…"`, `"Loading…"`). No skeleton/placeholder components or CSS exist.

**Share Brew Publicly**: All brew routes are behind `authMiddleware`. `brewService.getById()` is scoped to `userId`. No `shareToken`, `isPublic`, or any sharing concept exists in schema, routes, or services.

## Affected Areas
- `backend/src/db/schema.ts` — needs `shareToken` + `isPublic` columns
- `backend/src/routes/brews.ts` — needs public `GET /api/public/brews/:shareToken` endpoint (no auth)
- `backend/src/services/brew-service.ts` — needs `getByShareToken()` + `toggleShare()`
- `backend/src/lib/validators.ts` — share-related validation
- `backend/src/tests/integration.test.ts` — tests for public endpoint + delete cascade
- `frontend/src/components/BeanDetail.tsx` — Add Edit/Delete buttons + modal + skeleton
- `frontend/src/components/BrewDetail.tsx` — Add Share button + skeleton
- `frontend/src/components/BitacoraHome.tsx` — skeleton loader
- `frontend/src/api/client.ts` — add `toggleShareBrew()` method
- `frontend/src/types.ts` — add shared brew response type
- `frontend/src/App.tsx` — add `/shared/brews/:shareToken` route
- `frontend/src/styles/index.css` — skeleton shimmer + toast CSS
- `frontend/src/components/Layout.tsx` — toast container + portal
- `frontend/src/contexts/ToastContext.tsx` — new context (NEW FILE)
- `frontend/src/components/Skeleton.tsx` — new component (NEW FILE)
- `frontend/src/components/SharedBrewView.tsx` — new component (NEW FILE)
- Various test files — updated mocks and assertions

## Approaches

### 1. Edit/Delete Beans
- **Approach A (Recommended)**: Edit button opens `<BeanForm>` as modal + Delete button with confirm. Reuses existing BeanForm and api.delete(). Matches BrewDetail pattern. Effort: Low
- **Approach B**: Separate `/beans/:id/edit` route. More code, inconsistent with existing pattern. Effort: Medium

### 2. Toast Notifications
- **Approach A (Recommended)**: Custom ToastContext + ToastProvider in Layout. CSS animations. Zero dependencies, follows existing Context pattern. Types: success/error/info with auto-dismiss. Effort: Low
- **Approach B**: Add react-hot-toast. Unnecessary dependency for a simple case. Effort: Low

### 3. Skeleton Loaders
- **Approach A (Recommended)**: CSS-only skeleton with `@keyframes shimmer`. Skeleton.tsx + domain-specific skeletons. Zero dependencies. Respect `prefers-reduced-motion`. Effort: Low-Medium
- **Approach B**: react-loading-skeleton library. Adds dependency, less control. Effort: Low

### 4. Share Brew Publicly
- **Approach A (Recommended)**: shareToken + isPublic columns. UUID via crypto.randomUUID(). Public endpoint without auth. brewService.getByShareToken() returns brew + bean + notes. SharedBrewView component + route. Effort: Medium
- **Approach B**: Remove auth from GET /api/brews/:id. Insecure. NOT recommended.

## Risks
1. Bean delete cascade: SET NULL on brew_sessions — orphaned brews
2. Share token collision: crypto.randomUUID() is effectively unique, DB constraint handles it
3. Oversharing: brew notes may contain personal content
4. Skeleton shimmer must respect prefers-reduced-motion
