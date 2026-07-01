# Bean History Specification

## Purpose

The bean history domain provides bean-centric drill-down: brew sessions grouped by bean, aggregate stats (avg rating, method breakdown, brew count), and a dedicated detail view at `/bitacora/:id`.

## Requirements

### Requirement: BHR-REQ-1 — Read Brew History for a Bean

The system MUST provide an endpoint returning all brew sessions for a given bean, newest first, each with a tasting notes summary.

#### Scenario: Get brew history for bean

- GIVEN bean with ID 3 has 4 brew sessions, two with tasting notes
- WHEN a GET request is sent to `/api/beans/3/brews`
- THEN the system returns `200 OK` with brew sessions ordered by `created_at` descending, each including `tastingNotesSummary` (a concatenated excerpt of notes text)

#### Scenario: Get brew history for bean with no brews

- GIVEN bean with ID 7 exists but has no brew sessions
- WHEN a GET request is sent to `/api/beans/7/brews`
- THEN the system returns `200 OK` with an empty array

#### Scenario: Get brew history for non-existent bean

- WHEN a GET request is sent to `/api/beans/999/brews`
- THEN the system returns `404 Not Found`

### Requirement: BHR-REQ-2 — Display Bean Detail View

The system MUST render a bean detail page at `/bitacora/:id` showing bean info, aggregate stats, and chronological brew history with tasting notes summaries.

#### Scenario: View bean detail with stats and history

- GIVEN a user navigates to `/bitacora/3` and bean 3 has 4 brews with avg rating 3.5
- WHEN the page loads
- THEN the user sees bean name/roaster/origin, stats (`avgRating: 3.5`, `brewCount: 4`, method breakdown), and a list of brew sessions newest-first with tasting note excerpts

#### Scenario: View bean detail for bean with no brews

- GIVEN a user navigates to `/bitacora/7` and bean 7 has no brew sessions
- WHEN the page loads
- THEN the user sees bean info, stats showing `brewCount: 0`, and empty brew history with a "Nueva preparación" action

## API Contract

| Method | Path | Request Body | Response |
|--------|------|-------------|----------|
| GET | `/api/beans/:id/brews` | — | `200` → `BrewSessionWithNotes[]`, `404` |

## Acceptance Criteria

- [ ] `GET /api/beans/:id/brews` returns brews newest-first with tasting note excerpts
- [ ] Bean with no brews returns empty array (not 404)
- [ ] Non-existent bean returns 404
- [ ] Bean detail shows avg rating, method breakdown, brew count
- [ ] Brew history lists sessions chronologically with tasting notes
