# Tasks: Bean CRUD Complete

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~500-600 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Chain strategy | stacked-to-main |
| Delivery strategy | single-pr-default (size:exception accepted via split) |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Chained PR Plan (stacked-to-main)

```
main ← PR #1 (toast + skeletons)
main ← PR #2 (backend share API)
main ← PR #3 (frontend UI + wiring)
main ← PR #4 (integration tests)
```

| PR | Work Unit | Files | Est. lines |
|----|-----------|-------|------------|
| 1 | Toast + Skeleton infra | 6 new, 1 modified | ~120-150 |
| 2 | Backend share API | 1 new, 4 modified | ~150-200 |
| 3 | Frontend UI + wiring | 1 new, 5 modified | ~150-200 |
| 4 | Integration tests | 1 modified | ~80-100 |

## Phase 1: Foundation

- [x] 1.1 Create `frontend/src/contexts/ToastContext.tsx` — ToastContext + ToastProvider with success/error/info + auto-dismiss
- [x] 1.2 Create `frontend/src/components/Skeleton.tsx` — Primitive with width/height/rounded props, CSS shimmer
- [x] 1.3 Create `frontend/src/components/skeletons/BitacoraHomeSkeleton.tsx` — Card grid skeleton
- [x] 1.4 Create `frontend/src/components/skeletons/BeanDetailSkeleton.tsx` — Two-column layout skeleton
- [x] 1.5 Create `frontend/src/components/skeletons/BrewDetailSkeleton.tsx` — Single-column brew detail skeleton
- [x] 1.6 Modify `frontend/src/styles/index.css` — Add `@keyframes shimmer`, `@keyframes slide-in/out`, toast CSS, `prefers-reduced-motion` guard

## Phase 2: Backend Share API

- [x] 2.1 Modify `backend/src/db/schema.ts` — Add `shareToken TEXT UNIQUE` + `isPublic INTEGER DEFAULT 0` to brewSessions
- [x] 2.2 Generate + run Drizzle migration for new columns
- [x] 2.3 Modify `backend/src/services/brew-service.ts` — Add `toggleShare(id, userId, isPublic)` + `getByShareToken(token)`
- [x] 2.4 Modify `backend/src/routes/brews.ts` — Add `PATCH /:id/share` (auth-scoped, 404 if not owner)
- [x] 2.5 Create `backend/src/routes/public.ts` — `GET /:shareToken` returning brew + coffee bean + tasting notes
- [x] 2.6 Modify `backend/src/index.ts` — Register publicBrewRouter at `/api/public/brews`

## Phase 3: Frontend UI

- [ ] 3.1 Modify `frontend/src/components/BeanDetail.tsx` — Add Edit (BeanForm modal pre-filled) + Delete (confirm → API → redirect + toast)
- [ ] 3.2 Modify `frontend/src/components/BrewDetail.tsx` — Add Share toggle showing public URL + skeleton
- [ ] 3.3 Modify `frontend/src/components/BitacoraHome.tsx` — Replace loading text with BitacoraHomeSkeleton
- [x] 3.4 Modify `frontend/src/components/Layout.tsx` — Wrap with `<ToastProvider>`
- [ ] 3.5 Create `frontend/src/components/SharedBrewView.tsx` — Public read-only brew page from public endpoint
- [ ] 3.6 Modify `frontend/src/App.tsx` — Add `/shared/brews/:shareToken` route

## Phase 4: API Client & Types

- [ ] 4.1 Modify `frontend/src/api/client.ts` — Add `brewsApi.toggleShare(id, isPublic)` + `brewsApi.getPublic(shareToken)`
- [ ] 4.2 Modify `frontend/src/types.ts` — Add shared brew response types (brew + bean + notes)

## Phase 5: Testing

- [ ] 5.1 Modify `backend/src/tests/integration.test.ts` — Tests for share toggle on/off, auth scoping, 404 for other user's brew
- [ ] 5.2 Modify `backend/src/tests/integration.test.ts` — Tests for public endpoint: valid token returns 200 with brew+bean+notes, invalid returns 404
