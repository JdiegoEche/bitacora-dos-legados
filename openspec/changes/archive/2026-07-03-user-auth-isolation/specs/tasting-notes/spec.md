# Delta for Tasting Notes

## ADDED Requirements

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

## MODIFIED Requirements

### Requirement: TNR-REQ-3 — Delete Tasting Note

The system MUST allow deleting a single tasting note independently of its parent brew, only if the parent brew session belongs to the authenticated user.
(Previously: No ownership check)

#### Scenario: Delete own tasting note

- GIVEN the authenticated user owns the parent brew of tasting note ID 12
- WHEN a DELETE request is sent to `/api/notes/12`
- THEN the system returns `204 No Content` and the parent brew still exists with its remaining notes

#### Scenario: Delete another user's tasting note

- GIVEN tasting note ID 15's parent brew belongs to a different user
- WHEN a DELETE request is sent to `/api/notes/15`
- THEN the system returns `404 Not Found`
