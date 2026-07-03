# Delta for Brew Sessions

## MODIFIED Requirements

### Requirement: BRS-REQ-1 — Create Brew Session

The system MUST accept a new brew session with recipe fields, associate it with the authenticated user via `userId` from the JWT context, and persist it to SQLite. The UI form MUST enforce `coffeeBeanId` as required. After creation, the UI MUST redirect to `/bitacora/:id`.
(Previously: No userId — all brews were global)

**Data Model — ADDED field**: `brew_sessions` table:
| Field | Type | Notes |
|-------|------|-------|
| `user_id` | INTEGER (FK) | References `users.id`, NOT NULL |

#### Scenario: Create brew session successfully

- GIVEN the user is authenticated (JWT context provides `userId`)
- AND valid recipe fields including method, grind, temperature, and coffee bean reference
- WHEN a POST request is sent to `/api/brews`
- THEN the system returns `201 Created` with the brew session object including `userId`
- AND the UI redirects to `/bitacora/{beanId}`

#### Scenario: Unauthenticated creation rejected

- GIVEN no valid JWT is present
- WHEN a POST request is sent to `/api/brews`
- THEN the system returns `401 Unauthorized`

### Requirement: BRS-REQ-2 — Read Brew Sessions

The system MUST list all brew sessions for the authenticated user sorted by creation date descending, and MUST allow fetching a single session by ID scoped to the user.
(Previously: Listed all brews globally, no userId filter)

#### Scenario: List own brew sessions

- GIVEN the authenticated user has multiple brew sessions
- WHEN a GET request is sent to `/api/brews`
- THEN the system returns `200 OK` with only the user's brew sessions, newest first

#### Scenario: Get own brew session by ID

- GIVEN the authenticated user owns brew session ID 5
- WHEN a GET request is sent to `/api/brews/5`
- THEN the system returns `200 OK` with the full brew session object

#### Scenario: Get another user's brew session

- GIVEN brew session ID 10 belongs to a different user
- WHEN a GET request is sent to `/api/brews/10`
- THEN the system returns `404 Not Found`

### Requirement: BRS-REQ-3 — Update Brew Session

The system MUST allow updating editable fields of an existing brew session, only if the session belongs to the authenticated user.
(Previously: No ownership check)

#### Scenario: Update own brew session

- GIVEN the authenticated user owns brew session ID 5
- WHEN a PUT request is sent to `/api/brews/5` with updated `grind_size` and `water_temp`
- THEN the system returns `200 OK` with the updated object and `updated_at` refreshed

#### Scenario: Update another user's brew session

- GIVEN brew session ID 10 belongs to a different user
- WHEN a PUT request is sent to `/api/brews/10`
- THEN the system returns `404 Not Found`

### Requirement: BRS-REQ-4 — Delete Brew Session

The system MUST delete a brew session and its linked tasting notes, only if the session belongs to the authenticated user.
(Previously: No ownership check)

#### Scenario: Delete own brew session

- GIVEN the authenticated user owns brew session ID 5, which has 2 tasting notes
- WHEN a DELETE request is sent to `/api/brews/5`
- THEN the system returns `204 No Content`, brew session removed, and linked tasting notes cascade-deleted

#### Scenario: Delete another user's brew session

- GIVEN brew session ID 10 belongs to a different user
- WHEN a DELETE request is sent to `/api/brews/10`
- THEN the system returns `404 Not Found`
