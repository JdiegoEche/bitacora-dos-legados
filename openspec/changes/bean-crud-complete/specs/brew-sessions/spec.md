# Delta for brew-sessions

## ADDED Requirements

### Requirement: BRS-REQ-7 — Share Brew Session

The system MUST allow users to toggle public sharing on their brew sessions. When enabled, a unique `shareToken` is generated via `crypto.randomUUID()`. A public endpoint serves all brew data including linked coffee bean, tasting notes, and rating without authentication.

#### Scenario: Enable sharing

- GIVEN the authenticated user owns brew session ID 5
- WHEN PATCH `/api/brews/5/share` is sent with `{ "isPublic": true }`
- THEN `isPublic` is set to 1 and `shareToken` is generated
- AND the response returns `{ isPublic: true, shareToken: "uuid" }`

#### Scenario: Disable sharing

- GIVEN brew session ID 5 is currently shared
- WHEN PATCH `/api/brews/5/share` is sent with `{ "isPublic": false }`
- THEN `isPublic` is set to 0 and `shareToken` is cleared to NULL

#### Scenario: Unauthorized toggle

- GIVEN brew session ID 10 belongs to a different user
- WHEN PATCH `/api/brews/10/share` is sent
- THEN the system returns `404 Not Found`

#### Scenario: Public access to shared brew

- GIVEN brew session ID 5 has valid shareToken "abc-123"
- WHEN GET `/api/public/brews/abc-123` is sent without JWT
- THEN the system returns `200` with brew session, coffee bean, and tasting notes

#### Scenario: Public access with invalid token

- WHEN GET `/api/public/brews/invalid-token` is sent
- THEN the system returns `404 Not Found`

## MODIFIED API Contract

| Method | Path | Request Body | Response |
|--------|------|-------------|----------|
| GET | `/api/brews` | — | `200` → `BrewSession[]` |
| GET | `/api/brews/:id` | — | `200` → `BrewSession` + `TastingNote[]`, `404` |
| POST | `/api/brews` | `CreateBrewSession` | `201` → `BrewSession`, `400` |
| PUT | `/api/brews/:id` | `UpdateBrewSession` | `200` → `BrewSession`, `404`, `400` |
| DELETE | `/api/brews/:id` | — | `204`, `404` |
| PATCH | `/api/brews/:id/share` | `{ isPublic: boolean }` | `200` → `{ isPublic, shareToken }`, `404` |
| GET | `/api/public/brews/:shareToken` | — | `200` → `BrewSession` + `CoffeeBean` + `TastingNote[]`, `404` |

## MODIFIED UI Component Mapping

| Component | Route | Purpose |
|-----------|-------|---------|
| `BrewForm` | `/bitacora/:id/brews/new` | Form for all recipe fields; hides bean selector when `preSelectedBeanId` is set |
| `BrewDetail` | `/brews/:id` | Full recipe display + linked tasting notes + Share toggle button |
| `BrewEdit` | `/brews/:id/edit` | Pre-filled form updating an existing brew |
| `SharedBrewView` | `/shared/brews/:shareToken` | Public read-only view of a shared brew; shows full brew + bean + notes (no auth) |

## MODIFIED Acceptance Criteria

- [ ] Create a brew via POST → saved to SQLite, returned with ID
- [ ] List endpoint returns all brews newest-first
- [ ] GET by ID returns the brew with nested tasting notes
- [ ] PUT updates only provided fields; `updated_at` changes
- [ ] DELETE removes brew AND cascades to linked notes
- [ ] Invalid payloads return `400` with descriptive error
- [ ] PATCH /api/brews/:id/share toggles isPublic and generates/clears shareToken
- [ ] GET /api/public/brews/:shareToken returns brew + bean + notes without auth
- [ ] Share button in BrewDetail toggles on/off and shows the public URL
- [ ] SharedBrewView at /shared/brews/:shareToken renders full brew layout matching BrewDetail (no edit/delete actions)
- [ ] Invalid shareToken returns 404 with friendly "Brew not found or not shared" message
