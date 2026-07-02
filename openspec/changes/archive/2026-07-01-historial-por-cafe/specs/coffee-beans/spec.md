# Delta for Coffee Beans

## MODIFIED Requirements

### Requirement: CBR-REQ-2 — Read Coffee Beans

The system MUST list all coffee beans alphabetically by name, and MUST allow fetching a single bean by ID with aggregate stats (avg rating, method breakdown, brew count).
(Previously: single bean endpoint returned bean fields only)

#### Scenario: List all beans

- GIVEN 5 coffee beans exist in the database
- WHEN a GET request is sent to `/api/beans`
- THEN the system returns `200 OK` with an array of beans sorted alphabetically by name

#### Scenario: Get single bean with stats

- GIVEN a coffee bean with ID 3 has 4 brew sessions rated [4, 5, 3, 4] across V60 and Aeropress methods
- WHEN a GET request is sent to `/api/beans/3`
- THEN the system returns `200 OK` with the bean object including `avgRating: 4`, `brewCount: 4`, and `methodBreakdown` mapping methods to counts

## REMOVED Routes

### Route: `/beans` page

(Reason: Bean list is replaced by bean cards on `/bitacora`. Migration: users navigate to `/bitacora` to see beans as entry-point cards.)

### Component: `BeanList`, `BeanSelect`

(Reason: `BeanList` replaced by `BitacoraHome` bean cards. `BeanSelect` replaced by inline bean context in `BrewForm` via `preSelectedBeanId`.)

## MODIFIED UI Component Mapping

| Component | Location | Purpose |
|-----------|----------|---------|
| `BeanForm` | `/bitacora` → "Crear café" | Form to add name, roaster, origin, roast level; creates then redirects to `/bitacora/:id` |
| `BitacoraHome` | `/bitacora` | Bean cards grid + "Crear café" action |
| `BeanDetail` | `/bitacora/:id` | Bean info, aggregate stats, brew history with tasting notes |

## MODIFIED API Contract

| Method | Path | Request Body | Response |
|--------|------|-------------|----------|
| GET | `/api/beans/:id` | — | `200` → `CoffeeBeanWithStats`, `404` |

## MODIFIED Acceptance Criteria

- [ ] GET by ID returns bean fields + `avgRating`, `brewCount`, `methodBreakdown`
- [ ] Bean with no brews returns stats with `brewCount: 0`
- [ ] Creating a bean from `/bitacora` redirects to `/bitacora/:id` (not `/beans`)
- [ ] `/beans` route returns 404 or redirects
