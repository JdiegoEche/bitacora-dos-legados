# Design: User Auth + Data Isolation

## Technical Approach

Custom auth layer: `jose` (HS256 JWT) + Drizzle persistence. Magic links only — no passwords. Auth middleware injects `userId` via `c.set()`, services scope queries by `userId`. Recipes stay public (no middleware). Frontend stores JWT in localStorage, AuthContext wraps app per ThemeContext pattern.

## Architecture Decisions

| Decision | Choice | Alternatives | Rationale |
|----------|--------|-------------|-----------|
| JWT vs sessions | Stateless JWT | DB sessions | No session lookup per request; simpler for SPA API. 7-day expiry, no refresh token in v1 |
| JWT library | `jose` | `@hono/jwt` | `jose` is standalone, more maintained; `@hono/jwt` wraps it anyway, adds unnecessary abstraction |
| Token storage | SHA-256 hash in DB | Raw token in DB | Raw token never stored — hash only. `crypto.randomBytes(32)` → hex, hash stored, raw returned once |
| Dev workflow | `GET /api/auth/dev-magic-link?email=` | Set up SMTP | Returns full magic link URL directly; 0 email infra in dev. Guarded by `NODE_ENV !== 'production'` |
| Tasting note ownership | Indirect via brew session join | Direct `userId` on notes | Notes already cascade-delete with brew. Join through `brew_sessions.user_id` avoids redundant FK |
| Recipes | No auth middleware | Apply middleware universally | Per spec: recipes are a public catalog. Middleware scoped to `/api/brews`, `/api/beans`, `/api/notes` only |

## Data Flow

```
Magic Link:
  Client                  Backend                      DB
    │ POST /api/auth/      │ upsert user                │
    │ request-magic-link   │─── store token_hash ──────→│
    │ ← { ok: true }       │ (raw token in dev response)│
    │                       │                            │
    │ GET /api/auth/       │ hash(token), match unused  │
    │ verify?token=raw     │─── mark used ────────────→│
    │ ← { token: <jwt> }   │ sign JWT with jose         │

Protected Request:
  Client → Authorization: Bearer <jwt>
    → authMiddleware: jose.jwtVerify → c.set('userId', id)
    → Service: db.select().where(eq(table.userId, userId))
    → Response scoped to user

Frontend:
  LoginPage → POST /api/auth/request-magic-link
           → GET /api/auth/verify?token= → localStorage.setItem('token', jwt)
  AuthContext reads token from localStorage on init
  api/client.ts reads token from localStorage, injects Authorization header
  ProtectedRoute checks AuthContext → redirect to /login if no user
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `backend/src/db/schema.ts` | Modify | ADD `users` table + `magic_link_tokens` table; ADD `userId` FK to `coffee_beans`, `brew_sessions`, `tasting_notes` |
| `backend/src/db/migrations/` | Create | Drizzle migration for new tables + columns |
| `backend/src/lib/auth.ts` | Create | `signJWT(userId, email)`, `verifyJWT(token)`, `generateToken()`, `hashToken(raw)` with `jose` |
| `backend/src/middleware/auth.ts` | Create | Extract Bearer → `verifyJWT` → `c.set('userId', payload.userId)` → `next()`. `401` on failure |
| `backend/src/routes/auth.ts` | Create | `POST /api/auth/request-magic-link`, `GET /api/auth/verify`, `GET /api/auth/dev-magic-link`, `GET /api/auth/me` |
| `backend/src/services/auth-service.ts` | Create | `upsertUser(email)`, `createMagicLink(userId)`, `verifyToken(token)`, `getUser(id)` |
| `backend/src/services/brew-service.ts` | Modify | ALL queries add `.where(eq(brewSessions.userId, userId))`; `create` gets `userId` from caller |
| `backend/src/services/bean-service.ts` | Modify | ALL queries add `.where(eq(coffeeBeans.userId, userId))` |
| `backend/src/services/note-service.ts` | Modify | `brewExists` → `brewBelongsToUser(brewId, userId)` joining through `brew_sessions.userId`; delete/CRUD check ownership |
| `backend/src/routes/brews.ts` | Modify | Apply `authMiddleware` to routes; pass `userId` from `c.get('userId')` to services |
| `backend/src/routes/beans.ts` | Modify | Same as brews |
| `backend/src/routes/notes.ts` | Modify | Apply `authMiddleware` to note routes; pass `userId` to ownership checks |
| `backend/src/index.ts` | Modify | Import `authRouter`, mount at `app.route('/api/auth', authRouter)` |
| `backend/src/types.ts` | Create (if missing) | ADD `User` type; extend Hono `ContextVariableMap` with `{ userId: number }` |
| `backend/src/tests/auth.test.ts` | Create | Auth flow + data isolation integration tests |
| `backend/src/tests/integration.test.ts` | Modify | Refactor to use `getAuthHeader()` helper; add auth headers to existing tests |
| `backend/package.json` | Modify | ADD `jose` (prod), `nodemailer` + `@types/nodemailer` (dev) |
| `frontend/src/contexts/AuthContext.tsx` | Create | React context with `user`, `token`, `login(email)`, `logout()`, `isAuthenticated` |
| `frontend/src/components/LoginPage.tsx` | Create | Email form → `POST /api/auth/request-magic-link` → show verification link (dev) or "check email" |
| `frontend/src/components/ProtectedRoute.tsx` | Create | Read `useAuth()`, redirect to `/login` if not authenticated |
| `frontend/src/App.tsx` | Modify | Wrap with `<AuthProvider>`; add `/login` and `/auth/verify` routes; wrap `/bitacora/*` in `<ProtectedRoute>` |
| `frontend/src/api/client.ts` | Modify | Export `setAuthToken(token)` / `clearAuthToken()`; `request()` injects `Authorization: Bearer` header |
| `frontend/src/components/Layout.tsx` | Modify | Show user email + logout button in nav when authenticated |
| `frontend/src/types.ts` | Modify | ADD `User` type (`id`, `email`, `createdAt`) |

## Interfaces / Contracts

```typescript
// Hono context extension (backend/src/types.ts)
declare module 'hono' {
  interface ContextVariableMap {
    userId: number;
  }
}

// JWT payload
interface JwtPayload {
  userId: number;
  email: string;
  iat: number;
  exp: number;
}

// API contracts
POST /api/auth/request-magic-link  { email: string } → 200 { ok: true }
GET  /api/auth/verify?token=hex                     → 200 { token: "<jwt>" } | 401
GET  /api/auth/dev-magic-link?email=                 → 200 { magicLink: "..." }
GET  /api/auth/me          Authorization: Bearer     → 200 User | 401
```

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Unit | JWT sign/verify, token hash/validate, expiry checks | Pure function tests, no DB |
| Integration — Auth | Full magic link flow, dev endpoint, me endpoint, token expiry, double-use rejection | `app.request()` with temp SQLite, same pattern as existing `integration.test.ts` |
| Integration — Isolation | User A cannot see/update/delete User B's data; tasting note ownership via brew join | Two users created via `getAuthHeader()`, cross-user requests return 404 |
| Integration — Public | Recipe routes return 200 without auth | Existing recipe tests, no auth header needed |

`getAuthHeader()` helper: creates user via auth service, returns `{ Authorization: 'Bearer <jwt>' }`. All existing tests refactored to use it.

## Migration / Rollout

Drizzle migration creates `users` and `magic_link_tokens` tables, adds `user_id` columns with `NOT NULL`. Existing data has no `userId` — seed script updated to assign all existing rows to a default user. Feature flag: none (atomic migration).

## Open Questions

None.
