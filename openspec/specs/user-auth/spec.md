# User Auth Specification

## Purpose

Self-contained identity via magic links and JWT (`jose`). No OAuth, no passwords.

## Requirements

### Requirement: UAR-REQ-1 — Request Magic Link

The system MUST accept an email, upsert the user, generate a single-use magic link token, store its SHA-256 hash, and return success. The raw token MUST only appear in dev responses. Production SHOULD send an email.

**Data Model**: `users` table:
| Field | Type | Notes |
|-------|------|-------|
| `id` | INTEGER (PK) | Auto-increment |
| `email` | TEXT | Unique, NOT NULL |
| `created_at` | TEXT | ISO 8601 |

**Data Model**: `magic_link_tokens` table:
| Field | Type | Notes |
|-------|------|-------|
| `id` | INTEGER (PK) | Auto-increment |
| `user_id` | INTEGER (FK) | References `users.id` |
| `token_hash` | TEXT | SHA-256 of raw token, NOT NULL |
| `used` | INTEGER | Default 0 (unused) |
| `expires_at` | TEXT | ISO 8601, 15 min from creation |

#### Scenario: Request magic link (new or returning user)

- GIVEN an email address (registered or not)
- WHEN a POST request is sent to `/api/auth/request-magic-link` with `{ "email": "test@example.com" }`
- THEN the system upserts the user, creates a magic link token, stores its hash, and returns `200 OK`

### Requirement: UAR-REQ-2 — Verify Magic Link

The system MUST verify a raw token, match its hash to an unused row, mark it used (single-use), and issue a JWT signed with `jose` (HS256).

#### Scenario: Valid token verifies and issues JWT

- GIVEN a user with an unused magic link token
- WHEN a GET request is sent to `/api/auth/verify?token=<raw_token>`
- THEN the system hashes the token, matches an unused row, marks it used, and returns `200 OK` with `{ "token": "<jwt>" }` where the JWT payload includes `{ "userId": 1, "email": "test@example.com" }`

#### Scenario: Already-used token rejected

- GIVEN a used magic link token
- WHEN a GET request is sent to `/api/auth/verify?token=<used_token>`
- THEN the system returns `401 Unauthorized`

#### Scenario: Expired token rejected

- GIVEN a token past its 15-minute expiry
- WHEN the user attempts to verify it
- THEN the system returns `401 Unauthorized`

### Requirement: UAR-REQ-3 — JWT Structure

The system MUST issue JWTs signed with `jose` using HS256 and a server-side secret. JWT expiry MUST be 7 days. Payload MUST include `userId`, `email`, `iat`, and `exp`.

### Requirement: UAR-REQ-4 — Dev Magic Link Endpoint

The system MUST expose a dev-only endpoint that returns the full magic link URL directly.

#### Scenario: Dev endpoint returns link

- GIVEN a valid email
- WHEN a GET request is sent to `/api/auth/dev-magic-link?email=test@example.com`
- THEN the system creates the user and token, and returns `200 OK` with `{ "magicLink": "http://localhost:5173/auth/verify?token=<raw_token>" }`

### Requirement: UAR-REQ-5 — Get Current User

The system MUST expose a protected endpoint returning the authenticated user's profile.

#### Scenario: Authenticated user fetches profile

- GIVEN a user with a valid JWT
- WHEN a GET request to `/api/auth/me` includes `Authorization: Bearer <jwt>`
- THEN the system returns `200 OK` with `{ "id": 1, "email": "test@example.com" }`

#### Scenario: Unauthenticated request rejected

- WHEN a GET request to `/api/auth/me` has no Authorization header
- THEN the system returns `401 Unauthorized`

## API Contract

| Method | Path | Auth | Request | Response |
|--------|------|------|---------|----------|
| POST | `/api/auth/request-magic-link` | No | `{ email }` | `200` |
| GET | `/api/auth/verify?token=` | No | — | `200` → `{ token }`, `401` |
| GET | `/api/auth/dev-magic-link?email=` | No | — | `200` → `{ magicLink }` |
| GET | `/api/auth/me` | Yes | — | `200` → `User`, `401` |
