# Proposal: Data Insights

## Intent

BitacoraHome shows bean counts and a card grid — no trend visualization. Add aggregate charts so users can see tasting patterns and method preferences at a glance, without mentally computing stats from raw logs.

## Scope

### In Scope
- Tasting Radar Chart: 4-axis average ratings (aroma, flavor, body, acidity)
- Method Popularity Bar Chart: count + avg rating per method, sorted by count
- StatsPanel in BitacoraHome, below StatsSummary bentobox
- 2 auth-scoped backend aggregation endpoints
- Chart.js + react-chartjs-2 dependency

### Out of Scope
- Date/bean/roast filters, per-bean stats, line charts, CSV export
- Roast-level normalization, chart configurability

## Capabilities

### New Capabilities
- `data-insights`: Aggregate stats API and Chart.js-powered StatsPanel.

### Modified Capabilities
- `tasting-notes`: MAY add `aromaRating`…`acidityRating` INTEGER 1–5 columns (design decision — see Risks).

## Approach

1. **Backend**: `stats-service.ts` with 2 aggregation queries. `routes/stats.ts` mounted at `/api/stats` with `authMiddleware`.
   - `GET /api/stats/tasting-radar` → AVG rating per axis
   - `GET /api/stats/method-popularity` → COUNT + AVG(rating) GROUP BY method

2. **Frontend**: `StatsPanel` component fetching both endpoints in parallel via `useQuery`. Renders `<Radar>` + `<Bar>` via react-chartjs-2. Inserted in BitacoraHome after StatsSummary.

3. **Charts**: register Chart.js controllers once. Responsive, dark-theme-compatible.

## Affected Areas

| Area | Impact | |
|------|--------|-|
| `backend/src/services/stats-service.ts` | **New** | Aggregation queries |
| `backend/src/routes/stats.ts` | **New** | 2 auth-scoped GET routes |
| `backend/src/index.ts` | Modified | Mount stats router |
| `frontend/src/components/StatsPanel.tsx` | **New** | Radar + Bar chart layout |
| `frontend/src/components/BitacoraHome.tsx` | Modified | Render StatsPanel |
| `frontend/src/api/client.ts` | Modified | Add statsApi |
| `frontend/package.json` | Modified | Add chart.js deps |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| aroma/flavor/body/acidity are TEXT, not INT — can't average | High | Design decision: add INT rating columns via migration OR use overall `rating` only |
| Chart.js adds ~60KB gzipped | Medium | Lazy load StatsPanel |
| Empty radar data (no notes) | Medium | Placeholder: "Add notes to see your profile" |
| Empty method chart (no brews) | Medium | Placeholder: "Log your first brew to see insights" |

## Rollback

Remove `statsApi`, `StatsPanel`, stats router, `stats-service.ts`. All additive — no destructive changes unless INT columns added.

## Dependencies

- `chart.js` + `react-chartjs-2`
- Schema decision: INT rating columns vs. using `rating` only

## Success Criteria

- [ ] Radar chart shows 4-axis avg from tasting notes
- [ ] Bar chart shows method count + avg rating by popularity
- [ ] Both charts auth-scoped
- [ ] StatsPanel renders below StatsSummary
- [ ] Empty state placeholders shown when no data
- [ ] Existing tests pass, new endpoint tests added
