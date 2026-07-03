# Proposal: User Auth + Data Isolation

## Intent

Multi-user app with no auth — every request returns ALL data. Users cannot own content. Auth is prerequisite for multi-user features.

## Scope

### In Scope
- Users table, magic link auth, JWT issuance
- `userId` FK on `coffee_beans`, `brew_sessions`, `tasting_notes`
- Auth middleware protecting `/api/brews`, `/api/beans`, `/api/notes`
- Frontend: AuthContext, LoginPage, ProtectedRoute, token injection
- Dev endpoint to skip email

### Out of Scope
- OAuth, password reset, admin roles
- Email production setup
- User profile management
- Recipe catalog (stays public)

## Capabilities

### New Capabilities
- `user-auth`: magic link flow, JWT with `jose`, auth middleware, session endpoints
- `user-data-isolation`: userId scoping via middleware-injected context

### Modified Capabilities
- `brew-sessions`: ADD `userId` requirement to all CRUD
- `coffee-beans`: ADD `userId` requirement to all CRUD
- `tasting-notes`: ADD `userId` requirement to all CRUD

## Approach

Custom auth with `jose` + Drizzle. Magic link: email → store token → verify → issue JWT. Hono middleware extracts Bearer token, verifies, injects `userId`. Service queries filter by `userId`. Recipe routes skip middleware (public). Frontend stores JWT in localStorage, AuthContext wraps app, ProtectedRoute guards `/bitacora/*`. Dev endpoint returns link directly.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `backend/src/db/schema.ts` | Modified | ADD users table; userId FK on 3 tables |
| `backend/src/lib/auth.ts` | New | JWT utils (jose) |
| `backend/src/middleware/auth.ts` | New | JWT → userId extraction |
| `backend/src/routes/auth.ts` | New | Magic link, verify, me |
| `backend/src/services/*` | Modified | userId query filters |
| `frontend/src/contexts/AuthContext.tsx` | New | Auth state + token storage |
| `frontend/src/components/LoginPage.tsx` | New | Login form |
| `frontend/src/components/ProtectedRoute.tsx` | New | Redirect if unauthenticated |
| `frontend/src/api/client.ts` | Modified | Bearer token injection |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Magic link double-click race | Low | Mark token used on first verify |
| Email dependency in dev | Low | Dev endpoint returns link directly |
| Test refactoring scope | Med | Shared `getAuthHeader()` helper |
| Existing data has no userId | Low | Start fresh (demo data) |

## Rollback Plan

Revert Drizzle migration. Restore original services. Remove auth components. Recipe routes untouched.

## Dependencies

- `jose` — prod dependency
- `nodemailer` + `@types/nodemailer` — dev dependency

## Success Criteria

- [ ] User registers via magic link → receives JWT
- [ ] Authenticated user sees only their data
- [ ] Unauthenticated requests to protected routes → 401
- [ ] Recipe catalog works without auth
- [ ] Integration tests pass with auth headers
- [ ] Dev endpoint generates valid magic links
