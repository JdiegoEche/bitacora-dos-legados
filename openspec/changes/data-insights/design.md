# Design: Data Insights

## Technical Approach

Two backend aggregation endpoints (`/api/stats/*`) behind `authMiddleware` that feed a `StatsPanel` inserted below `StatsSummary` in `BitacoraHome`. Parallel fetch via two `useQuery` calls. Tasting words processed in-memory in a new service; method popularity via Drizzle SQL aggregation. Chart.js + react-chartjs-2 for the method bar chart, lazy-loaded. Tasting words rendered as pure CSS horizontal bars — no chart library needed.

## Architecture Decisions

### Tasting Words: SQL vs In-memory

| Option | Tradeoff | Decision |
|--------|----------|----------|
| SQL (regex/string fns) | SQLite text processing is limited; no built-in tokenizer; stopword filtering is painful | ❌ |
| **In-memory** (fetch all notes, parse in JS) | Simple, testable, debuggable; <1000 notes per user → negligible perf cost | **✅ Adopted** |

### Chart Library

| Option | Tradeoff | Decision |
|--------|----------|----------|
| **Chart.js + react-chartjs-2** | ~40KB gzipped, mature, bar/radar support, dark theme, lazy-loadable | **✅ Adopted** |
| Recharts | ~70KB, React-native but heavier | ❌ |
| D3 | Full power but steep learning curve; overkill for 2 charts | ❌ |

### Endpoint Strategy

| Option | Tradeoff | Decision |
|--------|----------|----------|
| **Two endpoints** | Independent caching, parallel fetch, clear error isolation | **✅ Adopted** |
| Single aggregate endpoint | Larger payload, coupled fetching, harder to cache independently | ❌ |

### Component Structure

| Option | Tradeoff | Decision |
|--------|----------|----------|
| **Single StatsPanel** (parallel fetch + both sub-panels) | One loading state, clear composition, easy to render conditionally | **✅ Adopted** |
| Two standalone panels | Each fetches independently → N+1 query pattern; redundant boilerplate | ❌ |

## Data Flow

```
Browser                          Backend
  │                                │
  ├─ GET /api/stats/tasting-words  │
  │  (JWT in header)               ├─ authMiddleware → extract userId
  │                                ├─ statsService.getTastingWords(userId)
  │                                │   └─ SELECT aroma,flavor,body,acidity
  │                                │      FROM tasting_notes WHERE user_id = ?
  │                                │   └─ in-memory: normalize → split → filter
  │                                │      stopwords → count → top-5 per category
  │  ◄── {aroma:WordFreq[], ...}   │
  │                                │
  ├─ GET /api/stats/method-popularity │
  │  (JWT in header)               ├─ authMiddleware → extract userId
  │                                ├─ statsService.getMethodPopularity(userId)
  │                                │   └─ SELECT bs.method, COUNT(*) as count,
  │                                │      AVG(tn.rating) as avgRating
  │                                │      FROM brew_sessions bs
  │                                │      LEFT JOIN tasting_notes tn
  │                                │      ON bs.id = tn.brew_session_id
  │                                │      WHERE bs.user_id = ?
  │                                │      GROUP BY bs.method
  │                                │      ORDER BY count DESC
  │  ◄── [{method, count, avgRating}, ...] │
  │                                │
  └─ StatsPanel renders            │
     ├─ TastingWordsPanel          │
     │  └─ CSS bars per            │
     │     non-empty category      │
     └─ MethodChartPanel (lazy)    │
        └─ Chart.js <Bar>          │
           color-coded by rating   │
```

## API Contract

| Method | Path | Auth | Response |
|--------|------|------|----------|
| GET | `/api/stats/tasting-words` | JWT (401) | `200` → `{ aroma: WordFreq[], flavor: WordFreq[], body: WordFreq[], acidity: WordFreq[] }` |
| GET | `/api/stats/method-popularity` | JWT (401) | `200` → `MethodPopItem[]` |

```typescript
// Backend types (stats-service.ts)
interface WordFreq { word: string; count: number; }
interface TastingWordsResponse {
  aroma: WordFreq[]; flavor: WordFreq[]; body: WordFreq[]; acidity: WordFreq[];
}
interface MethodPopItem {
  method: string; count: number; avgRating: number | null;
}
```

### Tasting Words Algorithm (stats-service.ts)

```typescript
const STOPWORDS = new Set([
  'the','and','a','with','very','notes','like','slight','of','in','on','it',
  'is','was','has','have','some','but','not','too','also','more','than','an',
]);

function parseWords(text: string | null): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .trim()
    .split(/[,\s&]+| and /)
    .map(w => w.trim())
    .filter(w => w.length > 0 && !STOPWORDS.has(w));
}

function topWords(words: string[], limit = 5): WordFreq[] {
  const freq: Record<string, number> = {};
  for (const w of words) freq[w] = (freq[w] ?? 0) + 1;
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word, count]) => ({ word, count }));
}
```

### Chart.js Registration (chart-config.ts)

```typescript
import { Chart, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);
```

Registered once when the lazy module loads.

### Color Coding (avgRating tiers)

| Rating | Color |
|--------|-------|
| ≥ 4.0 | `#22c55e` (green) |
| 2.5–3.9 | `#eab308` (yellow) |
| < 2.5 | `#ef4444` (red) |
| null | `#a8a29e` (gray) |

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `backend/src/services/stats-service.ts` | Create | `getTastingWords()`, `getMethodPopularity()` |
| `backend/src/routes/stats.ts` | Create | Two GET routes with `authMiddleware` |
| `backend/src/index.ts` | Modify | Mount stats router at `/api/stats` |
| `backend/src/tests/stats.test.ts` | Create | Integration tests for both endpoints + 401 |
| `frontend/src/api/client.ts` | Modify | Add `statsApi` object |
| `frontend/src/types.ts` | Modify | Add `WordFreq`, `TastingWordsResponse`, `MethodPopItem` |
| `frontend/src/lib/chart-config.ts` | Create | Chart.js controller registration |
| `frontend/src/components/TastingWordsPanel.tsx` | Create | CSS horizontal bars, empty state |
| `frontend/src/components/MethodChartPanel.tsx` | Create | Chart.js Bar, lazy-loaded |
| `frontend/src/components/StatsPanel.tsx` | Create | Parallel fetch, renders sub-panels |
| `frontend/src/components/BitacoraHome.tsx` | Modify | Import + render `<StatsPanel />` below StatsSummary |
| `frontend/src/styles/index.css` | Modify | Add `.stats-panel`, `.word-bar`, `.chart-container` classes |
| `frontend/package.json` | Modify | Add `chart.js` + `react-chartjs-2` |

## Testing Strategy

| Layer | What | How |
|-------|------|-----|
| Backend unit | `parseWords()`, `topWords()`, stopword filtering | Pure function tests in `stats.test.ts` |
| Backend integ | Both endpoints with real DB, auth, edge cases | Vitest + temp SQLite + `app.request()` (follow existing `integration.test.ts` pattern) |
| Backend integ | 401 without JWT | Request without `Authorization` header → assert 401 |
| Frontend unit | StatsPanel renders both panels with mock data | `renderWithProviders`, `vi.spyOn(statsApi, ...)` |
| Frontend unit | Empty states per panel | Mock endpoints returning empty arrays |
| Frontend unit | BitacoraHome renders StatsPanel after StatsSummary | Assert DOM order |

## Migration / Rollout

No migration required. All additive — no schema changes, no data migrations, no feature flags needed.

## Open Questions

- None — spec and proposal fully resolve all tradeoffs.
