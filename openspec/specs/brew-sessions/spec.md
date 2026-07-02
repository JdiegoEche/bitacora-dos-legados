# Brew Sessions Specification

## Purpose

The brew sessions domain tracks individual coffee brewing sessions — recipe metadata, method, and results. Each brew session references a coffee bean from the catalog and records the parameters that influence extraction quality.

## Requirements

### Requirement: BRS-REQ-1 — Create Brew Session

The system MUST accept a new brew session with recipe fields and persist it to SQLite. The UI form MUST enforce `coffeeBeanId` as required. After creation, the UI MUST redirect to `/bitacora/:id`.

**Data Model**: `brew_sessions` table:
| Field | Type | Notes |
|-------|------|-------|
| `id` | INTEGER (PK) | Auto-increment |
| `coffee_bean_id` | INTEGER (FK) | References `coffee_beans.id`, nullable |
| `grind_size` | TEXT | e.g. "medium", "fine", "coarse" |
| `water_temp` | INTEGER | Temperature in Celsius |
| `brew_time` | INTEGER | Total brew time in seconds |
| `method` | TEXT | e.g. "V60", "Aeropress", "French Press" |
| `coffee_dose` | INTEGER | Coffee dose in grams |
| `water_dose` | INTEGER | Water dose in ml |
| `notes` | TEXT | Free-text brew notes, nullable |
| `rating` | INTEGER | 1–5 rating, nullable |
| `created_at` | TEXT | ISO 8601 timestamp |
| `updated_at` | TEXT | ISO 8601 timestamp |

#### Scenario: Create brew session successfully

- GIVEN valid recipe fields including method, grind, temperature, and coffee bean reference
- WHEN a POST request is sent to `/api/brews`
- THEN the system returns `201 Created` with the brew session object including its generated `id`
- AND the UI redirects to `/bitacora/{beanId}`

#### Scenario: Create brew session with missing required fields

- GIVEN a POST request missing `method` or `brew_time`
- WHEN the system validates the payload
- THEN the system returns `400 Bad Request` with an error describing the missing fields

### Requirement: BRS-REQ-2 — Read Brew Sessions

The system MUST list all brew sessions sorted by creation date descending, and MUST allow fetching a single session by ID.

#### Scenario: List brew sessions

- GIVEN multiple brew sessions exist in the database
- WHEN a GET request is sent to `/api/brews`
- THEN the system returns `200 OK` with an array of brew sessions, newest first

#### Scenario: Get single brew session

- GIVEN a brew session with ID 5 exists
- WHEN a GET request is sent to `/api/brews/5`
- THEN the system returns `200 OK` with the full brew session object including linked tasting notes

#### Scenario: Get non-existent brew session

- WHEN a GET request is sent to `/api/brews/999`
- THEN the system returns `404 Not Found`

### Requirement: BRS-REQ-3 — Update Brew Session

The system MUST allow updating all editable fields of an existing brew session.

#### Scenario: Update brew session fields

- GIVEN a brew session with ID 5 exists
- WHEN a PUT request is sent to `/api/brews/5` with updated `grind_size` and `water_temp`
- THEN the system returns `200 OK` with the updated object and `updated_at` refreshed

### Requirement: BRS-REQ-4 — Delete Brew Session

The system MUST delete a brew session and its linked tasting notes.

#### Scenario: Delete brew session

- GIVEN a brew session with ID 5 exists and has 2 tasting notes
- WHEN a DELETE request is sent to `/api/brews/5`
- THEN the system returns `204 No Content`, the brew session is removed, and all linked tasting notes are cascade-deleted

### Requirement: BRS-REQ-6 — BrewForm preSelectedBeanId Prop

The BrewForm component MUST accept an optional `preSelectedBeanId` prop. When set, the bean selector MUST be hidden and `coffeeBeanId` MUST be auto-assigned from the prop value. The form MUST still allow submission without a bean selector visible.

#### Scenario: BrewForm with preselected bean

- GIVEN a user navigates to `/bitacora/3/brews/new` (preSelectedBeanId=3)
- WHEN BrewForm renders
- THEN the bean selector is hidden and the brew is created with `coffeeBeanId: 3`

#### Scenario: BrewForm without preselected bean (legacy)

- GIVEN a user navigates to a brew creation route without preSelectedBeanId
- WHEN BrewForm renders
- THEN the bean selector is displayed normally

## API Contract

| Method | Path | Request Body | Response |
|--------|------|-------------|----------|
| GET | `/api/brews` | — | `200` → `BrewSession[]` |
| GET | `/api/brews/:id` | — | `200` → `BrewSession` + `TastingNote[]`, `404` |
| POST | `/api/brews` | `CreateBrewSession` | `201` → `BrewSession`, `400` |
| PUT | `/api/brews/:id` | `UpdateBrewSession` | `200` → `BrewSession`, `404`, `400` |
| DELETE | `/api/brews/:id` | — | `204`, `404` |

## UI Component Mapping

| Component | Route | Purpose |
|-----------|-------|---------|
| `BrewForm` | `/bitacora/:id/brews/new` | Form for all recipe fields; hides bean selector when `preSelectedBeanId` is set |
| `BrewDetail` | `/brews/:id` | Full recipe display + linked tasting notes |
| `BrewEdit` | `/brews/:id/edit` | Pre-filled form updating an existing brew |

### Requirement: BRS-REQ-5 — Landing Page Integration

The system MUST render bean cards at `/bitacora` (via `BitacoraHome`). Brew creation is accessible from bean context at `/bitacora/:id/brews/new`. (Previously: `/bitacora` rendered BrewList with all brews)

#### Scenario: Direct /bitacora access renders bean cards

- GIVEN a user visits `/bitacora` directly
- WHEN the page loads
- THEN `BitacoraHome` renders bean cards and a "Crear café" button (not a flat brew list)

## Acceptance Criteria

- [ ] Create a brew via POST → saved to SQLite, returned with ID
- [ ] List endpoint returns all brews newest-first
- [ ] GET by ID returns the brew with nested tasting notes
- [ ] PUT updates only provided fields; `updated_at` changes
- [ ] DELETE removes brew AND cascades to linked notes
- [ ] Invalid payloads return `400` with descriptive error
