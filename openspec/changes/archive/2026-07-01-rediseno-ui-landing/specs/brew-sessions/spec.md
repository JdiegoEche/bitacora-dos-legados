# Delta for Brew Sessions

## ADDED Requirements

### Requirement: BREW-REQ-5 — Landing Page Redirect

The system MUST redirect requests to `/` to `/bitacora` using client-side navigation (no full page reload). Direct access to `/bitacora` MUST render BrewList normally.

#### Scenario: Root path redirects to /bitacora

- GIVEN a user visits `/`
- WHEN the router processes the path
- THEN the user is redirected to `/bitacora` without a full page reload

#### Scenario: Direct /bitacora access renders BrewList

- GIVEN a user visits `/bitacora` directly
- WHEN the page loads
- THEN the BrewList component renders without redirect

## MODIFIED

### UI Component Mapping

The `BrewList` route changes from `/` to `/bitacora`. The updated table replaces the original:

| Component | Route | Purpose |
|-----------|-------|---------|
| `BrewList` | `/bitacora` | Table of brews sorted by date; each row shows method, bean, rating |
| `BrewForm` | `/brews/new` | Form for all recipe fields; includes bean selector |
| `BrewDetail` | `/brews/:id` | Full recipe display + linked tasting notes |
| `BrewEdit` | `/brews/:id/edit` | Pre-filled form updating an existing brew |
