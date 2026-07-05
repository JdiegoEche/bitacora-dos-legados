# Data Insights Specification

## Purpose

Aggregate stats + Chart.js panels so users see tasting patterns and method preferences at a glance. StatsPanel renders below StatsSummary in BitacoraHome. Auth-scoped (userId from JWT).

## ADDED Requirements

### Requirement: DASH-REQ-1 — Tasting Words Endpoint

`GET /api/stats/tasting-words` MUST parse TEXT fields (aroma, flavor, body, acidity), split by delimiters, normalize (lowercase, trim), and return top-5 words per category. Response: `{ aroma: WordFreq[], flavor: WordFreq[], body: WordFreq[], acidity: WordFreq[] }` (`WordFreq = { word: string, count: number }`).

- GIVEN notes with aroma "floral, jasmine" and "floral, rose" → WHEN GET returns `[{word:"floral",count:2},{word:"jasmine",count:1},{word:"rose",count:1}]`
- GIVEN no tasting notes → WHEN GET returns all empty arrays
- GIVEN 7 distinct aroma words → WHEN GET returns max 5 entries sorted by count desc

### Requirement: DASH-REQ-2 — Method Popularity Endpoint

`GET /api/stats/method-popularity` MUST return `{ method, count, avgRating }[]` sorted by count desc. `avgRating` SHALL be AVG of `tastingNotes.rating` (INTEGER), NOT `brewSessions.rating` (TEXT). Methods with no notes get `null` avgRating.

- GIVEN 3 V60 (avg 4.0) + 2 Aeropress (avg 3.5) → WHEN GET returns V60 first: `{method:"V60",count:3,avgRating:4.0}`
- GIVEN French Press brew with no notes → WHEN GET includes `{method:"French Press",count:1,avgRating:null}`
- GIVEN no brews → WHEN GET returns `[]`

### Requirement: DASH-REQ-3 — Auth Scoping

All `/api/stats/*` MUST require JWT. Unauthenticated requests MUST return `401`.

- WHEN GET `/api/stats/tasting-words` without JWT → `401`
- WHEN GET `/api/stats/method-popularity` without JWT → `401`

### Requirement: DASH-REQ-4 — StatsPanel in BitacoraHome

StatsPanel MUST render below `<StatsSummary />`. It MUST fetch both endpoints in parallel via `useQuery`.

- GIVEN beans loaded → WHEN BitacoraHome renders → StatsSummary first, StatsPanel below, both queries fire in parallel
- GIVEN skeleton loading → neither StatsSummary nor StatsPanel renders

### Requirement: DASH-REQ-5 — Empty States

Charts MUST show placeholders (not render charts) when their data is empty. Each panel handles empty independently.

- GIVEN tasting-words returns empty arrays → shows "Add notes to see your tasting profile"
- GIVEN method-popularity returns `[]` → shows "Log your first brew to see insights"

### Requirement: DASH-REQ-6 — Method Popularity Bar Chart

StatsPanel MUST render a Chart.js `<Bar>` (react-chartjs-2): method on X, count on Y, bars color-coded by avgRating (green ≥4.0, yellow 2.5–3.9, red <2.5, gray for null).

- GIVEN 3 methods with different ratings → WHEN StatsPanel renders → Bar chart with rating-tier colors

### Requirement: DASH-REQ-7 — Tasting Words Display

Non-empty categories MUST render as sections with horizontal bars proportional to word count, labeled with word + frequency. Empty categories MUST be hidden.

- GIVEN data for aroma and flavor only → sections render for those two, body and acidity hidden

## ADDED API Contract

| Method | Path | Auth | Response |
|--------|------|------|----------|
| GET | `/api/stats/tasting-words` | JWT | `200` → `{ aroma: WordFreq[], flavor: WordFreq[], body: WordFreq[], acidity: WordFreq[] }` |
| GET | `/api/stats/method-popularity` | JWT | `200` → `{ method, count, avgRating }[]` |

## ADDED UI Component Mapping

| Component | Parent | Purpose |
|-----------|--------|---------|
| `StatsPanel` | `BitacoraHome` | Parallel fetch, renders both chart panels |
| `TastingWordsPanel` | `StatsPanel` | Horizontal bars per word category |
| `MethodChartPanel` | `StatsPanel` | Chart.js Bar chart, color-coded |

## MODIFIED Areas

- **BitacoraHome**: Insert `<StatsPanel />` between StatsSummary and bean card grid
- **API client**: Export `statsApi` with `getTastingWords()`, `getMethodPopularity()`
- **Dependencies**: Add `chart.js` + `react-chartjs-2` to package.json

## ADDED Acceptance Criteria

- [ ] Tasting-words returns top-5 parsed from TEXT, scoped to user
- [ ] Method-popularity sorted by count desc, avgRating from tastingNotes
- [ ] Both endpoints return 401 without JWT
- [ ] StatsPanel below StatsSummary, parallel queries
- [ ] Empty placeholders per chart (independent)
- [ ] Bar chart color-coded by avgRating tier
- [ ] Tasting words as horizontal bars, empty categories hidden
- [ ] Chart.js lazy-loaded to avoid initial bundle bloat
