# Tasks: Data Insights

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~350–450 |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | single-pr |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | All backend + frontend for data insights | PR 1 | Single PR to main; additive, no schema changes |

## Phase 1: Backend — Service & Routes

- [x] **1.1** Create `backend/src/services/stats-service.ts` with `getTastingWords(userId)` and `getMethodPopularity(userId)`. Include pure functions `parseWords()` (split on `[,\s&]+` or ` and `, lowercase, stopword filter) and `topWords(words, limit=5)` (frequency map → sort → top N). Export `WordFreq`, `TastingWordsResponse`, `MethodPopItem` types.
- [x] **1.2** Create `backend/src/routes/stats.ts` with two GET routes mounted at `/stats/tasting-words` and `/stats/method-popularity`. Both use `authMiddleware` and deleguate to `statsService`. Follow existing route pattern (Hono router, `c.get('userId')`, `c.json()`).
- [x] **1.3** Modify `backend/src/index.ts` — add `import statsRouter from './routes/stats'` and mount `app.route('/api/stats', statsRouter)` after existing routes.
- [x] **1.4** Create `backend/src/tests/stats.test.ts` with integration tests following `integration.test.ts` pattern (temp SQLite, `app.request()`):
  - Pure function tests: `parseWords()` handles delimiters/stopwords/null; `topWords()` sorts and limits
  - `GET /api/stats/tasting-words` returns parsed words for user's notes
  - `GET /api/stats/method-popularity` returns methods sorted by count with avgRating
  - Both endpoints return 401 without JWT
  - Empty data edge cases per spec (DASH-REQ-1, DASH-REQ-2, DASH-REQ-3)

## Phase 2: Frontend — Wiring & Types

- [x] **2.1** Modify `frontend/package.json` — add `chart.js` and `react-chartjs-2` as dependencies.
- [x] **2.2** Modify `frontend/src/types.ts` — add `WordFreq { word, count }`, `TastingWordsResponse { aroma, flavor, body, acidity: WordFreq[] }`, `MethodPopItem { method, count, avgRating }`.
- [x] **2.3** Modify `frontend/src/api/client.ts` — add `statsApi` object with `getTastingWords()` → `GET /api/stats/tasting-words` and `getMethodPopularity()` → `GET /api/stats/method-popularity`. Follow existing `request<T>()` pattern.
- [x] **2.4** Create `frontend/src/lib/chart-config.ts` — import and register Chart.js components: `Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend)`. Called once when lazy module loads.

## Phase 3: Frontend — Components

- [x] **3.1** Create `frontend/src/components/TastingWordsPanel.tsx` — receives `TastingWordsResponse`, renders sections per non-empty category. Each word as horizontal bar proportional to count (pure CSS, `.word-bar`), labeled with word + frequency. Empty categories hidden. Empty state: "Agregá notas de cata para ver tu perfil sensorial". (DASH-REQ-5, DASH-REQ-7)
- [x] **3.2** Create `frontend/src/components/MethodChartPanel.tsx` — Chart.js `<Bar>` component. X = method name, Y = count. Bars color-coded by `avgRating`: green `#22c55e` (≥4.0), yellow `#eab308` (2.5–3.9), red `#ef4444` (<2.5), gray `#a8a29e` (null). Empty state: "Registrá preparaciones para ver tus métodos más usados". (DASH-REQ-5, DASH-REQ-6)
- [x] **3.3** Create `frontend/src/components/StatsPanel.tsx` — parallel fetch via `useQuery` for both endpoints, renders `<TastingWordsPanel>` and `<MethodChartPanel>`. Loading and error states for each panel independently. (DASH-REQ-4)
- [x] **3.4** Modify `frontend/src/components/BitacoraHome.tsx` — import `StatsPanel`, render below `<StatsSummary />` and above bean card grid. StatsPanel must not render during skeleton loading (guarded by existing `isLoading` check). (DASH-REQ-4)
- [x] **3.5** Modify `frontend/src/styles/index.css` — add `.stats-panel`, `.word-bar`, `.chart-container` CSS classes following existing design tokens and dark-theme compatibility.

## Implementation Order

Phase 1 (backend) must come first since frontend depends on the API shape and types. Phase 2 (wiring) enables Phase 3 (components). BitacoraHome modification (3.4) and CSS (3.5) are the final integration steps.

### Next Step

Ready for implementation (sdd-apply). Single PR to main.
