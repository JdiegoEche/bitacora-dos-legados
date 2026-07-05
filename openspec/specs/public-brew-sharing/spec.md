# Public Brew Sharing Specification

## Purpose

The public brew sharing domain allows users to share brew sessions via a public link. Shared sessions are viewable without authentication and include all recipe data, bean info, and tasting notes.

## Requirements

### Requirement: PBS-REQ-1 — Share Data Model

`brew_sessions` MUST add `isPublic` (INTEGER, DEFAULT 0) and `shareToken` (TEXT, UNIQUE, nullable) columns.

### Requirement: PBS-REQ-2 — Toggle Share

PATCH `/api/brews/:id/share` MUST toggle `isPublic`. When enabling, `shareToken` is generated via `crypto.randomUUID()`. When disabling, `shareToken` is set to NULL. Auth-scoped: only the brew owner may toggle.

#### Scenario: Enable sharing

- GIVEN the authenticated user owns brew session ID 5 (isPublic = 0)
- WHEN PATCH `/api/brews/5/share` is sent with `{ "isPublic": true }`
- THEN `isPublic` is set to 1 and `shareToken` is set to a UUID string
- AND the response returns `{ isPublic: true, shareToken: "uuid" }`

#### Scenario: Disable sharing

- GIVEN brew session ID 5 is currently shared (isPublic = 1)
- WHEN PATCH `/api/brews/5/share` is sent with `{ "isPublic": false }`
- THEN `isPublic` is set to 0 and `shareToken` is set to NULL
- AND the response returns `{ isPublic: false, shareToken: null }`

#### Scenario: Toggle another user's brew

- GIVEN brew session ID 10 belongs to a different user
- WHEN PATCH `/api/brews/10/share` is sent
- THEN the system returns `404 Not Found`

### Requirement: PBS-REQ-3 — Public Brew Endpoint

GET `/api/public/brews/:shareToken` MUST return the brew session with its linked coffee bean and tasting notes. No authentication (JWT) is required.

#### Scenario: Access shared brew

- GIVEN brew session ID 5 has valid shareToken "abc-123"
- WHEN GET `/api/public/brews/abc-123` is sent without a JWT
- THEN the system returns `200` with the brew session, coffee bean, and tasting notes

#### Scenario: Invalid share token

- WHEN GET `/api/public/brews/invalid-token` is sent
- THEN the system returns `404 Not Found`

### Requirement: PBS-REQ-4 — Share Button in BrewDetail

BrewDetail MUST show a toggle button for sharing. When off, clicking enables and shows the public URL. When on, clicking confirms then disables.

#### Scenario: Toggle share from UI

- GIVEN the user views a non-shared brew in BrewDetail
- WHEN they click "Share"
- THEN the UI calls PATCH `/api/brews/:id/share` with `{ "isPublic": true }`
- AND shows the public link: `/shared/brews/{shareToken}`
- AND the button label changes to "Shared — click to disable"

### Requirement: PBS-REQ-5 — SharedBrewView Component

SharedBrewView at `/shared/brews/:shareToken` MUST render the full brew session including parameters, coffee bean, tasting notes, and rating. Layout matches BrewDetail but without edit/delete/share actions.

#### Scenario: Shared brew renders full layout

- GIVEN a user visits `/shared/brews/abc-123` (no auth)
- WHEN the page loads
- THEN it fetches GET `/api/public/brews/abc-123`
- AND renders brew parameters, bean info, tasting notes, and rating

#### Scenario: Invalid share token in UI

- GIVEN a user visits `/shared/brews/invalid`
- WHEN the API returns `404`
- THEN the page shows "Brew not found or not shared" message
