# Coffee Beans Specification

## Purpose

The coffee beans domain manages a user-maintained catalog of coffee beans. Each bean record stores the roaster, origin, and roast level. Beans are referenced by brew sessions as the ingredient source.

## Requirements

### Requirement: CBR-REQ-1 — Create Coffee Bean

The system MUST accept a new coffee bean entry and persist it to SQLite.

**Data Model**: `coffee_beans` table:
| Field | Type | Notes |
|-------|------|-------|
| `id` | INTEGER (PK) | Auto-increment |
| `name` | TEXT | Bean name / blend name, NOT NULL |
| `roaster` | TEXT | Roastery or brand name, NOT NULL |
| `origin` | TEXT | Country or region of origin, nullable |
| `roast_level` | TEXT | e.g. "light", "medium", "dark", nullable |
| `created_at` | TEXT | ISO 8601 timestamp |
| `updated_at` | TEXT | ISO 8601 timestamp |

#### Scenario: Create coffee bean successfully

- GIVEN valid bean data with `name` and `roaster`
- WHEN a POST request is sent to `/api/beans`
- THEN the system returns `201 Created` with the bean object including its generated `id`

#### Scenario: Create coffee bean missing required fields

- GIVEN a POST request without `name`
- WHEN the system validates the payload
- THEN the system returns `400 Bad Request` with validation error

### Requirement: CBR-REQ-2 — Read Coffee Beans

The system MUST list all coffee beans alphabetically by name, and MUST allow fetching a single bean by ID.

#### Scenario: List all beans

- GIVEN 5 coffee beans exist in the database
- WHEN a GET request is sent to `/api/beans`
- THEN the system returns `200 OK` with an array of beans sorted alphabetically by name

#### Scenario: Get single bean

- GIVEN a coffee bean with ID 3 exists
- WHEN a GET request is sent to `/api/beans/3`
- THEN the system returns `200 OK` with the full bean object

### Requirement: CBR-REQ-3 — Update Coffee Bean

The system MUST allow editing bean fields.

#### Scenario: Update bean fields

- GIVEN a coffee bean with ID 3 exists
- WHEN a PUT request is sent to `/api/beans/3` with updated `roast_level`
- THEN the system returns `200 OK` with the updated object and `updated_at` refreshed

### Requirement: CBR-REQ-4 — Delete Coffee Bean

The system MUST allow deleting a coffee bean. If brew sessions reference it, the `coffee_bean_id` MUST be set to NULL rather than blocking deletion.

#### Scenario: Delete bean with no existing references

- GIVEN a coffee bean with ID 3 exists and no brew references it
- WHEN a DELETE request is sent to `/api/beans/3`
- THEN the system returns `204 No Content`

#### Scenario: Delete bean referenced by brews

- GIVEN a coffee bean with ID 3 is referenced by 2 brew sessions
- WHEN a DELETE request is sent to `/api/beans/3`
- THEN the system returns `204 No Content` and the referenced brew sessions have `coffee_bean_id` set to NULL

## API Contract

| Method | Path | Request Body | Response |
|--------|------|-------------|----------|
| GET | `/api/beans` | — | `200` → `CoffeeBean[]` |
| GET | `/api/beans/:id` | — | `200` → `CoffeeBean`, `404` |
| POST | `/api/beans` | `CreateCoffeeBean` | `201` → `CoffeeBean`, `400` |
| PUT | `/api/beans/:id` | `UpdateCoffeeBean` | `200` → `CoffeeBean`, `404`, `400` |
| DELETE | `/api/beans/:id` | — | `204`, `404` |

## UI Component Mapping

| Component | Location | Purpose |
|-----------|----------|---------|
| `BeanSelect` | Inside `BrewForm` | Dropdown listing all beans; option to add new bean |
| `BeanForm` | Modal or separate page | Form to add/edit name, roaster, origin, roast level |
| `BeanList` | `/beans` | Table of all beans with edit/delete actions |

## Acceptance Criteria

- [ ] Create bean with name+roaster → saved to SQLite
- [ ] Create without name → `400`
- [ ] List returns beans sorted alphabetically
- [ ] GET by ID returns full object
- [ ] PUT updates only provided fields
- [ ] DELETE removes unreferenced bean
- [ ] DELETE referenced bean sets FK to NULL on brews (no cascade-delete)
