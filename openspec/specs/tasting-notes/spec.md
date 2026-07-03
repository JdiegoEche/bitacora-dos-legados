# Tasting Notes Specification

## Purpose

Tasting notes capture subjective sensory observations for a brew session — aroma, flavor, body, acidity, and overall rating. Multiple notes can be attached to the same brew session, and notes are cascade-deleted when the parent brew is removed.

## Requirements

### Requirement: TNR-REQ-1 — Create Tasting Note

The system MUST accept a tasting note linked to an existing brew session and persist it to SQLite.

**Data Model**: `tasting_notes` table:
| Field | Type | Notes |
|-------|------|-------|
| `id` | INTEGER (PK) | Auto-increment |
| `brew_session_id` | INTEGER (FK) | References `brew_sessions.id`, NOT NULL |
| `aroma` | TEXT | Free-text aroma description, nullable |
| `flavor` | TEXT | Free-text flavor description, nullable |
| `body` | TEXT | Free-text body description, nullable |
| `acidity` | TEXT | Free-text acidity description, nullable |
| `rating` | INTEGER | 1–5 overall rating, nullable |
| `free_text` | TEXT | General tasting notes, nullable |
| `created_at` | TEXT | ISO 8601 timestamp |

#### Scenario: Create tasting note for existing brew

- GIVEN a brew session with ID 5 exists
- WHEN a POST request is sent to `/api/brews/5/notes` with `{ "aroma": "floral", "flavor": "berry", "rating": 4 }`
- THEN the system returns `201 Created` with the tasting note object including its `id` and `brew_session_id: 5`

#### Scenario: Create tasting note for non-existent brew

- WHEN a POST request is sent to `/api/brews/999/notes`
- THEN the system returns `404 Not Found`

### Requirement: TNR-REQ-2 — List Tasting Notes for a Brew

The system MUST return all tasting notes for a given brew session.

#### Scenario: List notes for brew

- GIVEN brew session 5 has 3 tasting notes
- WHEN a GET request is sent to `/api/brews/5/notes`
- THEN the system returns `200 OK` with an array of 3 notes, oldest first

### Requirement: TNR-REQ-3 — Delete Tasting Note

The system MUST allow deleting a single tasting note independently of its parent brew, only if the parent brew session belongs to the authenticated user.

#### Scenario: Delete own tasting note

- GIVEN the authenticated user owns the parent brew of tasting note ID 12
- WHEN a DELETE request is sent to `/api/notes/12`
- THEN the system returns `204 No Content` and the parent brew still exists with its remaining notes

#### Scenario: Delete another user's tasting note

- GIVEN tasting note ID 15's parent brew belongs to a different user
- WHEN a DELETE request is sent to `/api/notes/15`
- THEN the system returns `404 Not Found`

#### Scenario: Delete non-existent note

- WHEN a DELETE request is sent to `/api/notes/999`
- THEN the system returns `404 Not Found`

### Requirement: TNR-REQ-4 — Cascade Delete on Brew Removal

The system MUST automatically delete all linked tasting notes when the parent brew session is deleted.

#### Scenario: Notes cascade on brew delete

- GIVEN brew session 5 has 3 tasting notes
- WHEN the brew session is deleted via `DELETE /api/brews/5`
- THEN all 3 notes are removed from the `tasting_notes` table

### Requirement: TNR-REQ-5 — Ownership via Brew Session Join

The system MUST verify that a tasting note is accessible only when the parent brew session belongs to the authenticated user. Ownership is indirect: the note's `brew_session_id` joins to `brew_sessions.user_id`.

#### Scenario: Create note for own brew

- GIVEN the authenticated user owns brew session ID 5
- WHEN a POST request is sent to `/api/brews/5/notes` with valid note data
- THEN the system returns `201 Created`

#### Scenario: Create note for another user's brew

- GIVEN brew session ID 10 belongs to a different user
- WHEN a POST request is sent to `/api/brews/10/notes`
- THEN the system returns `404 Not Found`

#### Scenario: List notes for own brew

- GIVEN the authenticated user owns brew session ID 5 which has 3 tasting notes
- WHEN a GET request is sent to `/api/brews/5/notes`
- THEN the system returns `200 OK` with the 3 notes

#### Scenario: List notes for another user's brew

- GIVEN brew session ID 10 belongs to a different user
- WHEN a GET request is sent to `/api/brews/10/notes`
- THEN the system returns `404 Not Found`

## API Contract

| Method | Path | Request Body | Response |
|--------|------|-------------|----------|
| GET | `/api/brews/:brewId/notes` | — | `200` → `TastingNote[]` |
| POST | `/api/brews/:brewId/notes` | `CreateTastingNote` | `201` → `TastingNote`, `404` |
| DELETE | `/api/notes/:id` | — | `204`, `404` |

## UI Component Mapping

| Component | Location | Purpose |
|-----------|----------|---------|
| `TastingNotesList` | Inside `BrewDetail` | Shows all notes for the brew |
| `TastingNoteForm` | Inside `BrewDetail` or modal | Add aroma/flavor/body fields + rating |
| `TastingNoteCard` | Inside list | Displays a single note with delete action |

## Acceptance Criteria

- [ ] Create note for existing brew → saved with correct `brew_session_id`
- [ ] Create note for deleted brew → `404`
- [ ] List notes for brew → all notes returned oldest-first
- [ ] Delete single note → brew session unaffected
- [ ] Delete brew → all its notes cascade-deleted
