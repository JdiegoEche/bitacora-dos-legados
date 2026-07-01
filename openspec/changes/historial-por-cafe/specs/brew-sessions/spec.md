# Delta for Brew Sessions

## ADDED Requirements

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

## MODIFIED Requirements

### Requirement: BRS-REQ-1 — Create Brew Session

The system MUST accept a new brew session with recipe fields and persist it to SQLite. The UI form MUST enforce `coffeeBeanId` as required. After creation, the UI MUST redirect to `/bitacora/:id`.
(Previously: coffeeBeanId was optional in UI, redirect was to `/bitacora`)

#### Scenario: Create brew session successfully

- GIVEN valid recipe fields including method, grind, temperature, and coffee bean reference
- WHEN a POST request is sent to `/api/brews`
- THEN the system returns `201 Created` with the brew session object including its generated `id`
- AND the UI redirects to `/bitacora/{beanId}`

#### Scenario: Create brew session with missing required fields

- GIVEN a POST request missing `method` or `brew_time`
- WHEN the system validates the payload
- THEN the system returns `400 Bad Request` with an error describing the missing fields

### Requirement: BRS-REQ-5 — Landing Page Integration

The system MUST render bean cards at `/bitacora` (via `BitacoraHome`). Brew creation is accessible from bean context at `/bitacora/:id/brews/new`.
(Previously: `/bitacora` rendered BrewList with all brews)

#### Scenario: Direct /bitacora access renders bean cards

- GIVEN a user visits `/bitacora` directly
- WHEN the page loads
- THEN `BitacoraHome` renders bean cards and a "Crear café" button (not a flat brew list)

## MODIFIED UI Component Mapping

| Component | Route | Purpose |
|-----------|-------|---------|
| `BrewForm` | `/bitacora/:id/brews/new` | Form for all recipe fields; hides bean selector when `preSelectedBeanId` is set |
| `BrewDetail` | `/brews/:id` | Full recipe display + linked tasting notes (unchanged) |
| `BrewEdit` | `/brews/:id/edit` | Pre-filled form updating an existing brew (unchanged) |

## REMOVED Routes

### Route: `/brews/new`

(Reason: Brew creation is now only from bean context at `/bitacora/:id/brews/new`. Migration: any links to `/brews/new` redirect to `/bitacora`.)

### Component: `BrewList`

(Reason: The flat all-brews list is replaced by bean cards on `/bitacora` and per-bean brew history on bean detail.)
