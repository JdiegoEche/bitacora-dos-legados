# User Data Isolation Specification

## Purpose

User data isolation ensures authenticated users only access their own data. An auth middleware extracts the JWT from `Authorization: Bearer`, verifies it with `jose`, and injects `userId` into the request context. Owned endpoints filter queries by this `userId`. Recipe routes remain public and untouched.

## Requirements

### Requirement: UDI-REQ-1 — Auth Middleware

The system MUST provide Hono middleware that extracts a Bearer token, verifies the JWT via `jose`, and injects the decoded `userId` into the request context. Missing or invalid tokens MUST return `401 Unauthorized`.

#### Scenario: Valid JWT proceeds

- GIVEN a request with `Authorization: Bearer <valid_jwt>` to a protected route
- WHEN the middleware processes the request
- THEN the request context contains `userId` matching the JWT payload, and the request proceeds to the handler

#### Scenario: Missing Authorization header

- GIVEN a request with no Authorization header to a protected route
- WHEN the middleware inspects the request
- THEN the system returns `401 Unauthorized`

#### Scenario: Expired or malformed JWT

- GIVEN a request with an expired or malformed token
- WHEN the middleware attempts verification
- THEN the system returns `401 Unauthorized`

### Requirement: UDI-REQ-2 — Read Isolation

The system MUST filter all list and get queries for owned resources by `userId`. A user MUST NOT see another user's data.

#### Scenario: User lists own beans only

- GIVEN User A owns 3 beans, User B owns 2 beans
- WHEN User A sends GET `/api/beans` with User A's valid JWT
- THEN the response contains only User A's 3 beans

#### Scenario: Direct access to another user's resource

- GIVEN User B owns brew session ID 10
- WHEN User A sends GET `/api/brews/10` with User A's valid JWT
- THEN the system returns `404 Not Found` (scoped query yields no match)

### Requirement: UDI-REQ-3 — Write Isolation

The system MUST verify ownership on update and delete. A user MUST NOT modify or delete another user's data.

#### Scenario: Cross-user update rejected

- GIVEN User B owns coffee bean ID 3
- WHEN User A sends PUT `/api/beans/3` with User A's valid JWT
- THEN the system returns `404 Not Found`

#### Scenario: Cross-user delete rejected

- GIVEN User B owns brew session ID 5
- WHEN User A sends DELETE `/api/brews/5` with User A's valid JWT
- THEN the system returns `404 Not Found`

### Requirement: UDI-REQ-4 — Tasting Note Ownership (Indirect)

The system MUST verify that a tasting note belongs to the authenticated user by joining through the parent brew session's `userId`.

#### Scenario: Delete own tasting note

- GIVEN a tasting note ID 12 linked to brew session 5, which belongs to User A
- WHEN User A sends DELETE `/api/notes/12` with User A's valid JWT
- THEN the system returns `204 No Content`

#### Scenario: Delete another user's tasting note

- GIVEN a tasting note ID 15 linked to brew session 7, which belongs to User B
- WHEN User A sends DELETE `/api/notes/15` with User A's valid JWT
- THEN the system returns `404 Not Found`

### Requirement: UDI-REQ-5 — Public Routes Unchanged

The system MUST NOT apply auth middleware or userId filtering to recipe catalog routes.

#### Scenario: Unauthenticated recipe access succeeds

- GIVEN a recipe resource exists
- WHEN an unauthenticated GET request is sent to a recipe route
- THEN the system returns `200 OK` with the recipe data

## Middleware Contract

| Middleware | Route Scope | Behavior |
|------------|-------------|----------|
| `authMiddleware` | `/api/brews/*`, `/api/beans/*`, `/api/notes/*`, `/api/auth/me` | Extract JWT → inject `userId` → `401` on failure |
| None | `/api/recipes/*` | No auth, no userId filter |
