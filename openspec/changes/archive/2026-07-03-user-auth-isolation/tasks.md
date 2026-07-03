# Tasks: User Auth + Data Isolation

## Review Workload Forecast

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

| Field | Value |
|-------|-------|
| Estimated changed lines | 800–1100 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | 5 stacked PRs → main |
| Chain strategy | stacked-to-main |

### Work Units

| Unit | Goal | PR | Notes |
|------|------|-----|-------|
| 1 | Backend auth foundation | PR 1 → main | schema, lib/auth.ts, middleware/auth.ts, deps, types |
| 2 | Backend auth routes | PR 2 → main | AuthService, /api/auth/* routes, mount, seed update |
| 3 | Frontend auth | PR 3 → main | AuthContext, LoginPage, ProtectedRoute, client, App.tsx |
| 4 | Backend data isolation | PR 4 → main | userId filters, authMiddleware on routes, ownership checks |
| 5 | Testing cleanup | PR 5 → main | getAuthHeader(), integration.test.ts refactor, isolation tests |

## Phase 1: Schema + Auth Foundation (PR 1 → main)

- [x] 1.1 RED: Write unit tests for auth lib (signJWT, verifyJWT, hashToken)
- [x] 1.2 GREEN: Add `users` + `magic_link_tokens` tables + `userId` FK on 3 tables in `schema.ts`
- [x] 1.3 GREEN: Install `jose`, `nodemailer`, `@types/nodemailer` in `backend/package.json`
- [x] 1.4 GREEN: Create `backend/src/lib/auth.ts` — signJWT, verifyJWT, generateToken, hashToken
- [x] 1.5 GREEN: Create `backend/src/middleware/auth.ts` — Bearer → verify → c.set('userId')
- [x] 1.6 GREEN: Extend Hono ContextVariableMap; add User/MagicLinkToken types
- [x] 1.7 Generate Drizzle migration for schema changes

## Phase 2: Backend Auth Routes (PR 2 → main)

- [x] 2.1 RED: Write auth route integration tests (magic link, verify, dev, me, double-use, expiry)
- [x] 2.2 GREEN: Create `backend/src/services/auth-service.ts` — upsertUser, createMagicLink, verifyToken, getUser
- [x] 2.3 GREEN: Create `backend/src/routes/auth.ts` — request-magic-link, verify, dev-magic-link, me
- [x] 2.4 GREEN: Mount authRouter in `backend/src/index.ts`
- [x] 2.5 GREEN: Update `backend/src/db/seed.ts` — default user, assign existing data

## Phase 3: Frontend Auth (PR 3 → main)

- [x] 3.1 GREEN: Create `frontend/src/contexts/AuthContext.tsx` — user, token, login, logout, isAuthenticated
- [x] 3.2 GREEN: Create `frontend/src/components/LoginPage.tsx` — email form, dev link display, verify callback
- [x] 3.3 GREEN: Create `frontend/src/components/ProtectedRoute.tsx` — redirect to /login if unauthenticated
- [x] 3.4 GREEN: Modify `frontend/src/api/client.ts` — setAuthToken/clearAuthToken, inject Authorization
- [x] 3.5 GREEN: Modify `frontend/src/App.tsx` — AuthProvider, /login, /auth/verify, ProtectedRoute on /bitacora/*
- [x] 3.6 GREEN: Modify `frontend/src/components/Layout.tsx` — user email + logout in nav
- [x] 3.7 GREEN: Add User type to `frontend/src/types.ts` (mirrors backend)

## Phase 4: Backend Data Isolation (PR 4 → main)

- [x] 4.1 RED: Write cross-user data isolation tests (User A cannot see User B's data)
- [x] 4.2 GREEN: Modify `brew-service.ts` — add .where(eq(brewSessions.userId, userId)) to all queries
- [x] 4.3 GREEN: Modify `bean-service.ts` — userId filter on list, getById, getByIdWithStats, getBrewsByBeanId
- [x] 4.4 GREEN: Modify `note-service.ts` — brewBelongsToUser ownership check via brew_sessions.user_id join
- [x] 4.5 GREEN: Modify `routes/brews.ts` — apply authMiddleware, pass c.get('userId') to services
- [x] 4.6 GREEN: Modify `routes/beans.ts` — same authMiddleware + userId pass-through
- [x] 4.7 GREEN: Modify `routes/notes.ts` — authMiddleware + userId ownership verification

## Phase 5: Testing + Refactor (PR 5 → main)

- [x] 5.1 Create `backend/src/tests/auth.test.ts` — full auth flow integration suite
- [x] 5.2 Add shared `getAuthHeader()` test helper (creates user, returns Authorization header)
- [x] 5.3 Refactor `integration.test.ts` — add auth headers to all protected route calls
- [x] 5.4 Add cross-user isolation tests (beans, brews, notes between two users)
- [x] 5.5 Add indirect note ownership tests (note via brew session join)
- [x] 5.6 Verify recipe routes return 200 without auth headers
