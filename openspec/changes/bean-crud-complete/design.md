# Design: Bean CRUD Complete

## Technical Approach

Four independent features stacked on existing patterns:

1. **Toast notifications** — React context (copying AuthContext/ThemeContext structure) + CSS `@keyframes` animations. Zero new dependencies.
2. **Skeleton loaders** — CSS `@keyframes shimmer` on a gray base, composed into domain variants. Respects `prefers-reduced-motion`.
3. **Edit/Delete beans UI** — Extends BeanDetail with Edit (reuses BeanForm modal with `bean` prop) and Delete (`window.confirm` + API + redirect). Backend already supports PUT/DELETE.
4. **Public brew sharing** — Schema migration adds `shareToken` + `isPublic`. New `brewService.toggleShare/getByShareToken`. New auth-less public endpoint. Frontend Share button + `SharedBrewView` component.

## Architecture Decisions

### Decision: ToastContext follows AuthContext/ThemeContext pattern

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Separate lib (react-hot-toast) | + faster setup, - extra dep, - bundle | Rejected — CSS-only matches project's no-dependency approach |
| ToastContext in Layout | + lifecycle tied to app root in AuthProvider | Chosen — wraps `Layout`, accessible in all route components |

### Decision: Skeleton = primitive `<div>` with CSS shimmer

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Skeleton primitive + domain variants | + composable, + matches spec | Chosen — clean separation |
| Inline loading divs per component | - hard to maintain | Rejected |

### Decision: Share routes live in brewRouter, public endpoint separate

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Add `PATCH /:id/share` to brewRouter | + consistent location | Chosen — brewRouter already scoped with auth middleware |
| Public endpoint in separate router | + no auth middleware leak | Chosen — `publicBrewRouter` registered at `/api/public/brews` in backend `index.ts`, no auth middleware |

### Decision: SharedBrewView as standalone page (no Layout)

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Inside Layout | + consistent nav - shows auth UI to anonymous users | Chosen — wrapped in its own bare layout, no nav |
| Bare page outside Layout | + clean public view | Matches choice above |

## Data Flow

### Share toggle flow

```
User clicks "Share" in BrewDetail
  → PATCH /api/brews/:id/share { isPublic: true }
  → authMiddleware → brewService.toggleShare(id, userId)
  → crypto.randomUUID() → shareToken UUID → isPublic=1
  → Response { isPublic: true, shareToken: "abc-123" }
  → UI shows link: /shared/brews/abc-123
  → Button changes to "Shared — click to disable"

User clicks "Shared — click to disable"
  → PATCH /api/brews/:id/share { isPublic: false }
  → brewService.toggleShare → shareToken=null → isPublic=0
```

### Public view flow

```
Visitor opens /shared/brews/abc-123
  → SharedBrewView mounts
  → GET /api/public/brews/abc-123 (no auth header)
  → brewService.getByShareToken("abc-123")
  → Returns { brew + coffeeBean + tastingNotes }
  → SharedBrewView renders card layout

Invalid token → 404 → "Brew not found or not shared"
```

## Schema Changes

```diff
// backend/src/db/schema.ts — brewSessions table
+  shareToken: text('share_token').unique(),
+  isPublic: integer('is_public').notNull().default(0),
```

## API Contract

| Method | Path | Auth | Response |
|--------|------|------|----------|
| PATCH | `/api/brews/:id/share` | Required | `200` → `{ isPublic, shareToken }`, `404` |
| GET | `/api/public/brews/:shareToken` | None | `200` → `BrewSession` + `CoffeeBean` + `TastingNote[]`, `404` |

## File Changes

| File | Action | Feature |
|------|--------|---------|
| `frontend/src/contexts/ToastContext.tsx` | Create | Toasts |
| `frontend/src/components/Skeleton.tsx` | Create | Skeletons |
| `frontend/src/components/skeletons/BitacoraHomeSkeleton.tsx` | Create | Skeletons |
| `frontend/src/components/skeletons/BeanDetailSkeleton.tsx` | Create | Skeletons |
| `frontend/src/components/skeletons/BrewDetailSkeleton.tsx` | Create | Skeletons |
| `frontend/src/components/SharedBrewView.tsx` | Create | Share |
| `frontend/src/components/Layout.tsx` | Modify | Add `<ToastProvider>` wrapper |
| `frontend/src/components/BeanDetail.tsx` | Modify | Add Edit/Delete buttons + skeleton |
| `frontend/src/components/BrewDetail.tsx` | Modify | Add Share toggle + skeleton |
| `frontend/src/components/BitacoraHome.tsx` | Modify | Add skeleton |
| `frontend/src/App.tsx` | Modify | Add `/shared/brews/:shareToken` route |
| `frontend/src/api/client.ts` | Modify | Add `brewsApi.toggleShare`, `brewsApi.getPublic` |
| `frontend/src/styles/index.css` | Modify | Add `@keyframes shimmer`, `@keyframes slide-in/out`, toast CSS |
| `backend/src/db/schema.ts` | Modify | Add `shareToken` + `isPublic` columns |
| `backend/src/services/brew-service.ts` | Modify | Add `toggleShare`, `getByShareToken` |
| `backend/src/routes/brews.ts` | Modify | Add `PATCH /:id/share` route |
| `backend/src/routes/public.ts` | Create | Public brew route (no auth) |
| `backend/src/index.ts` | Modify | Register `/api/public/brews` router |
| `backend/src/tests/integration.test.ts` | Modify | Add share toggle + public endpoint tests |

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Backend integration | `PATCH /:id/share` toggle on/off, auth scoping, 404 for other user's brew | Add tests in `integration.test.ts` using existing test DB setup + auth headers |
| Backend integration | `GET /api/public/brews/:shareToken` returns brew+bean+notes, valid token returns 200, invalid returns 404 | Add tests in `integration.test.ts` |
| Frontend (manual) | Skeletons render on loading state | Visual check — loading state replaces `<div>Cargando…</div>` with skeleton |
| Frontend (manual) | Toasts appear and auto-dismiss | Visual check — success/error/info + timed dismissal |
| Frontend (manual) | Edit modal opens with pre-filled data, save calls PUT | Visual + `window.confirm` test |
| Frontend (manual) | Delete confirm → API call → redirect + toast | Visual test |
| Frontend (manual) | Share toggle → link appears → SharedBrewView renders | Visual + manual URL check |

## Migration

Additive schema migration via Drizzle: `drizzle-kit generate` then `drizzle-kit migrate`. Adds nullable columns with defaults — no data loss. Rollback = revert migration file.

## Open Questions

- [ ] None — all decisions resolved in specs and proposal.
