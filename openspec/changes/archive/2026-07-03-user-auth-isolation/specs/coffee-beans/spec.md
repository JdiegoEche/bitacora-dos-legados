# Delta for Coffee Beans

## MODIFIED Requirements

### Requirement: CBR-REQ-1 — Create Coffee Bean

The system MUST accept a new coffee bean entry, associate it with the authenticated user via the JWT context's `userId`, and persist it to SQLite.
(Previously: No userId — all beans were global)

**Data Model — ADDED field**: `coffee_beans` table:
| Field | Type | Notes |
|-------|------|-------|
| `user_id` | INTEGER (FK) | References `users.id`, NOT NULL |

#### Scenario: Create coffee bean successfully

- GIVEN the user is authenticated (JWT context provides `userId`)
- AND valid bean data with `name` and `roaster`
- WHEN a POST request is sent to `/api/beans`
- THEN the system returns `201 Created` with the bean object including `userId`

#### Scenario: Unauthenticated creation rejected

- GIVEN no valid JWT is present
- WHEN a POST request is sent to `/api/beans`
- THEN the system returns `401 Unauthorized`

### Requirement: CBR-REQ-2 — Read Coffee Beans

The system MUST list all coffee beans for the authenticated user alphabetically by name, and MUST allow fetching a single bean by ID with aggregate stats scoped to the user.
(Previously: Listed all beans globally, no userId filter)

#### Scenario: List own beans

- GIVEN the authenticated user owns 5 coffee beans
- WHEN a GET request is sent to `/api/beans`
- THEN the system returns `200 OK` with only the user's beans sorted alphabetically

#### Scenario: Get own bean with stats

- GIVEN the authenticated user owns bean ID 3 with 4 brew sessions
- WHEN a GET request is sent to `/api/beans/3`
- THEN the system returns `200 OK` with the bean object including `avgRating`, `brewCount`, and `methodBreakdown`

#### Scenario: Get another user's bean

- GIVEN bean ID 10 belongs to a different user
- WHEN a GET request is sent to `/api/beans/10`
- THEN the system returns `404 Not Found`

### Requirement: CBR-REQ-3 — Update Coffee Bean

The system MUST allow editing bean fields, only if the bean belongs to the authenticated user.
(Previously: No ownership check)

#### Scenario: Update own bean

- GIVEN the authenticated user owns bean ID 3
- WHEN a PUT request is sent to `/api/beans/3` with updated `roast_level`
- THEN the system returns `200 OK` with the updated object

#### Scenario: Update another user's bean

- GIVEN bean ID 10 belongs to a different user
- WHEN a PUT request is sent to `/api/beans/10`
- THEN the system returns `404 Not Found`

### Requirement: CBR-REQ-4 — Delete Coffee Bean

The system MUST allow deleting a coffee bean only if it belongs to the authenticated user. Cascade behavior (setting `coffee_bean_id` to NULL on referenced brews) remains unchanged.
(Previously: No ownership check)

#### Scenario: Delete own unreferenced bean

- GIVEN the authenticated user owns bean ID 3 with no brew references
- WHEN a DELETE request is sent to `/api/beans/3`
- THEN the system returns `204 No Content`

#### Scenario: Delete own referenced bean

- GIVEN the authenticated user owns bean ID 3 referenced by 2 brew sessions
- WHEN a DELETE request is sent to `/api/beans/3`
- THEN the system returns `204 No Content` and referenced brew sessions have `coffee_bean_id` set to NULL

#### Scenario: Delete another user's bean

- GIVEN bean ID 10 belongs to a different user
- WHEN a DELETE request is sent to `/api/beans/10`
- THEN the system returns `404 Not Found`
