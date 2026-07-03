## Exploration: User Auth + Data Isolation

### Current State

The app has **zero auth**. Every table — `coffee_beans`, `brew_sessions`, `tasting_notes` — is fully shared. Any request to any endpoint returns ALL data with no user scoping. The `recipes` table (catalog) is read-only and also public, which is fine since it should stay that way.

**Architecture patterns observed:**
- **Backend**: Hono 4.6 with flat route handlers → service layer with Drizzle queries. Each service function selects/inserts/updates by ID directly. No middleware for auth, no request context beyond what Hono provides by default.
- **Frontend**: React 18 with React Router 6 — flat route tree, no auth guards. API client (`client.ts`) uses vanilla `fetch` with hardcoded `API_BASE`, no token injection. No auth context/provider exists.
- **DB**: SQLite via better-sqlite3 + Drizzle ORM. Schema uses `$defaultFn` and `$onUpdateFn` for timestamps. FK cascade/set-null already configured.
- **Tests**: Integration tests build a fresh Hono app per suite with temp SQLite DB. No auth in tests currently — they call `app.request()` directly.

**What needs to change:**
1. New `users` table and schema
2. New auth routes + middleware + services
3. `userId` column on `coffee_beans`, `brew_sessions`, `tasting_notes`
4. All existing service functions need `userId` filter
5. Recipe routes stay untouched (public)
6. Frontend: auth context, login page, protected routes, token injection in API client

### Affected Areas

- `backend/src/db/schema.ts` — ADD `users` table; ADD `userId` FK to `coffee_beans`, `brew_sessions`, `tasting_notes` — Drizzle `sqliteTable` migration
- `backend/src/db/connection.ts` — No change needed (DB config stays same)
- `backend/src/types/index.ts` — ADD `User` select/insert types; UPDATE `CoffeeBean`, `BrewSession`, `TastingNote` types to include `userId`
- `backend/src/lib/validators.ts` — ADD auth schemas (email, magic link request, etc.)
- `backend/src/lib/auth.ts` (NEW) — JWT utils (sign, verify, decode) using `jose`
- `backend/src/middleware/auth.ts` (NEW) — Hono middleware to extract JWT, verify, inject `userId` into `c.set()`
- `backend/src/routes/auth.ts` (NEW) — POST `/api/auth/magic-link` (send link), POST `/api/auth/verify` (exchange token→JWT), GET `/api/auth/me` (current user)
- `backend/src/services/auth-service.ts` (NEW) — Token generation, email sending (console/ethereal/Resend), user CRUD
- `backend/src/services/brew-service.ts` — ADD `userId` filter to ALL queries
- `backend/src/services/bean-service.ts` — ADD `userId` filter to ALL queries
- `backend/src/services/note-service.ts` — ADD `userId` filter to ALL queries
- `backend/src/services/recipe-service.ts` — NO CHANGE (public catalog)
- `backend/src/routes/brews.ts`, `beans.ts`, `notes.ts` — ADD auth middleware; ROUTE-level user extraction
- `backend/src/index.ts` — REGISTER auth routes; ADD auth middleware to protected routes
- `backend/src/tests/integration.test.ts` — REFACTOR to create users + get JWT before CRUD tests; ADD auth-specific tests
- `backend/src/tests/auth.test.ts` (NEW) — Magic link flow, JWT verification, data isolation tests
- `backend/src/db/seed.ts` — ADD seed user for dev
- `frontend/src/types.ts` — ADD `User` interface
- `frontend/src/api/client.ts` — REFACTOR `request()` to accept optional Bearer token; ADD `authApi` (requestMagicLink, verifyToken, getMe)
- `frontend/src/contexts/AuthContext.tsx` (NEW) — React context with `user`, `login()`, `logout()`, `isAuthenticated`, token storage (localStorage)
- `frontend/src/components/LoginPage.tsx` (NEW) — Email input → "check your email" state → magic link verification
- `frontend/src/components/ProtectedRoute.tsx` (NEW) — Route guard component (redirect to login if unauthenticated)
- `frontend/src/components/Layout.tsx` — ADD auth UI (login/logout link, user indicator)
- `frontend/src/App.tsx` — ADD auth routes, WRAP protected routes with `ProtectedRoute`
- `frontend/src/main.tsx` — ADD `AuthProvider` wrapping the app
- `frontend/src/__tests__/` — ADD auth context tests, login page tests
- `backend/package.json` — ADD deps: `jose`, `nodemailer` (dev), `@types/nodemailer` (dev); maybe `resend` (prod)

### Approaches

1. **Custom DIY with Hono + jose + Drizzle** — Build everything from scratch using:
   - `jose` (JOSE) for JWT signing/verification (ESM-native, no `jsonwebtoken` baggage)
   - `crypto.randomBytes` for magic link tokens (Node built-in)
   - `nodemailer` with `nodemailer.createTestAccount()` for dev email (ethereal capture)
   - Drizzle for `users` table and token storage
   - Hono middleware for JWT extraction
   - Follows existing codebase patterns exactly
   - Pros: Full control, zero magic, matches existing architecture exactly, no framework lock-in, easy to test in isolation, `jose` is the standard JWT library for ESM/browser
   - Cons: More lines of code to write; need to handle token cleanup/expiry manually
   - Effort: Medium

2. **Hono JWT Middleware + custom auth service** — Use `@hono/jwt` middleware for JWT verification + custom auth routes/services:
   - `@hono/jwt` provides JWT middleware (jwt(), verify()) for route protection
   - Custom auth service for magic link flow
   - Same email approach (nodemailer/ethereal/dev)
   - Pros: Less boilerplate for JWT verification in middleware, follows Hono's middleware pattern
   - Cons: `@hono/jwt` wraps `jose` anyway (extra abstraction layer); less control over JWT payload shape; adds another dependency on Hono's ecosystem
   - Effort: Low-Medium

3. **Lucia Auth with custom magic link** — Use Lucia v3 for session management:
   - Lucia provides session CRUD, cookies, CSRF protection
   - Need to build magic link on top (Lucia doesn't have it built-in)
   - Pros: Battle-tested session management, built-in cookie handling
   - Cons: Overkill for magic-link-only flow; Lucia v3 is session-based (not JWT), adds cookie/session overhead; doesn't match the existing JWT direction; would fight Hono's patterns; significant conceptual overhead for a simple use case
   - Effort: High

### Recommendation

**Approach 1 — Custom DIY with Hono + jose + Drizzle.**

Here's why:

1. **Minimal deps**: Only `jose` (3KB gzip) and `nodemailer` (dev-only) need to be added. That's it. No framework lock-in.

2. **Follows existing patterns perfectly**: The codebase already uses raw Hono, Drizzle queries, and Zod validators. A custom auth service will look exactly like `brew-service.ts` or `bean-service.ts`. The auth middleware will be a simple Hono middleware function, same pattern as the existing `cors()`.

3. **JWT fits the data isolation model perfectly**: JWT is stateless → no session lookups on every request. The `userId` is embedded in the token. The auth middleware just verifies the JWT and injects `userId` into `c.set('userId', ...)`. Every protected route handler reads it. This is the simplest possible model for per-request data scoping.

4. **Ethereal/Nodemailer for dev**: `nodemailer.createTestAccount()` gives free disposable email capture. For dev convenience, also provide `GET /api/auth/dev-magic-link?email=x` that returns the link directly (avoids checking email during development).

5. **Migration path**: The schema additions are additive (new `userId` columns with defaults for existing data). Can be done as a Drizzle migration.

**Architecture decision: `userId` as middleware-injected, not route-injected**

The auth middleware will:
1. Extract `Bearer <token>` from `Authorization` header
2. Verify JWT with `jose.jwtVerify()`
3. Store `userId` in Hono context: `c.set('userId', userId)`
4. Route handlers access it via `c.get('userId')`

Route structure:
```
/api/auth/magic-link  POST  → sends email    [PUBLIC]
/api/auth/verify      POST  → exchanges token→JWT  [PUBLIC]
/api/auth/me          GET   → current user   [PROTECTED]
/api/brews/*          *     → scoped by user  [PROTECTED - new]
/api/beans/*          *     → scoped by user  [PROTECTED - new]
/api/notes/*          *     → scoped by user  [PROTECTED - new]
/api/recipes/*        *     → no auth        [PUBLIC - unchanged]
```

**Data isolation strategy: filter, don't subquery**

For every service function that reads/writes owned data, add `.where(eq(table.userId, userId))`. This is a mechanical change: each existing `eq(table.id, id)` gets an additional `.where(eq(table.userId, userId))`. The `create` functions get `userId` injected from context, not from request body (prevent spoofing).

**Frontend data flow:**
- `AuthContext` stores `{ user, token }` in state + localStorage
- `request()` in `client.ts` reads token from store (via closure or passed param)
- `ProtectedRoute` component wraps route elements in `App.tsx`
- Login redirects to `/login` → after verify → redirect to `/bitacora`
- Recipe routes (`/recetas/*`) are ALWAYS accessible without auth

### Risks

- **Existing data migration**: Existing rows in `coffee_beans`, `brew_sessions`, `tasting_notes` have no `userId`. Need to either backfill with a default user or prompt existing users on first login. For a single-user app transitioning to multi-user, a migration script to assign all existing data to the first registered user is the pragmatic path.
- **Test refactoring**: Every integration test that calls `app.request()` for protected routes now needs a valid JWT. Need a test helper `getAuthHeader()` that creates a user and returns `Authorization: Bearer <token>`. This is mechanical but touches every test case.
- **Magic link token reuse**: Magic links are single-use. Need to ensure the token row is deleted/invalidated after successful verification. Must also handle race conditions (user clicks link twice).
- **Email deliverability in dev**: Users will need to check the console or ethereal URL. The `GET /api/auth/dev-magic-link?email=x` endpoint mitigates this for development.
- **No password reset**: Since there are no passwords, there's nothing to reset. If email is unreachable, the user is locked out. Need a backdoor for dev (the dev-magic-link endpoint).
- **Recipe catalog stays public**: Must ensure `recipe-router` has NO auth middleware applied. Clear separation in `index.ts` by route group.

### Ready for Proposal

Yes. The scope is well-defined, the approach is clear, and the risks are understood. The orchestrator should proceed to `sdd-propose` to formalize the change proposal and capture business context.
