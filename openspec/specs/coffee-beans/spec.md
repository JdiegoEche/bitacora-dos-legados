# Coffee Beans Specification

## Purpose

The coffee beans domain manages a user-maintained catalog of coffee beans. Each bean record stores the roaster, origin, and roast level. Beans are referenced by brew sessions as the ingredient source.

## Requirements

### Requirement: CBR-REQ-1 — Create Coffee Bean

The system MUST accept a new coffee bean entry, associate it with the authenticated user via the JWT context's `userId`, and persist it to SQLite.

**Data Model**: `coffee_beans` table:
| Field | Type | Notes |
|-------|------|-------|
| `id` | INTEGER (PK) | Auto-increment |
| `user_id` | INTEGER (FK) | References `users.id`, NOT NULL |
| `name` | TEXT | Bean name / blend name, NOT NULL |
| `roaster` | TEXT | Roastery or brand name, NOT NULL |
| `origin` | TEXT | Country or region of origin, nullable |
| `roast_level` | TEXT | e.g. "light", "medium", "dark", nullable |
| `created_at` | TEXT | ISO 8601 timestamp |
| `updated_at` | TEXT | ISO 8601 timestamp |

#### Scenario: Create coffee bean successfully

- GIVEN the user is authenticated (JWT context provides `userId`)
- AND valid bean data with `name` and `roaster`
- WHEN a POST request is sent to `/api/beans`
- THEN the system returns `201 Created` with the bean object including `userId`

#### Scenario: Create coffee bean missing required fields

- GIVEN a POST request without `name`
- WHEN the system validates the payload
- THEN the system returns `400 Bad Request` with validation error

#### Scenario: Unauthenticated creation rejected

- GIVEN no valid JWT is present
- WHEN a POST request is sent to `/api/beans`
- THEN the system returns `401 Unauthorized`

### Requirement: CBR-REQ-2 — Read Coffee Beans

The system MUST list all coffee beans for the authenticated user alphabetically by name, and MUST allow fetching a single bean by ID with aggregate stats scoped to the user.

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

## API Contract

| Method | Path | Request Body | Response |
|--------|------|-------------|----------|
| GET | `/api/beans` | — | `200` → `CoffeeBean[]` |
| GET | `/api/beans/:id` | — | `200` → `CoffeeBeanWithStats`, `404` |
| POST | `/api/beans` | `CreateCoffeeBean` | `201` → `CoffeeBean`, `400` |
| PUT | `/api/beans/:id` | `UpdateCoffeeBean` | `200` → `CoffeeBean`, `404`, `400` |
| DELETE | `/api/beans/:id` | — | `204`, `404` |

## UI Component Mapping

| Component | Location | Purpose |
|-----------|----------|---------|
| `BeanForm` | `/bitacora` → "Crear café" | Form to add name, roaster, origin, roast level; creates then redirects to `/bitacora/:id` |
| `BitacoraHome` | `/bitacora` | Bean cards grid + "Crear café" action |
| `BeanDetail` | `/bitacora/:id` | Bean info, aggregate stats, brew history with tasting notes |

## Acceptance Criteria

- [ ] Create bean with name+roaster → saved to SQLite
- [ ] Create without name → `400`
- [ ] List returns beans sorted alphabetically
- [ ] GET by ID returns bean fields + `avgRating`, `brewCount`, `methodBreakdown`
- [ ] Bean with no brews returns stats with `brewCount: 0`
- [ ] Creating a bean from `/bitacora` redirects to `/bitacora/:id` (not `/beans`)
- [ ] `/beans` route returns 404 or redirects
- [ ] PUT updates only provided fields
- [ ] DELETE removes unreferenced bean
- [ ] DELETE referenced bean sets FK to NULL on brews (no cascade-delete)
