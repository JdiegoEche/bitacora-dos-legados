# Design: historial-por-cafe

## Technical Approach

Replace flat all-brews list with bean-centric navigation. Backend adds a new endpoint (`GET /api/beans/:id/brews`) and enriches `GET /api/beans/:id` with aggregate stats. Frontend adds 3 routes, removes 3 routes, and introduces `BitacoraHome` (bean card grid) + `BeanDetail` (stats + brew history). `BrewForm` gets an optional `preSelectedBeanId` prop to hide bean selector and auto-assign. BeanSelect is inlined into BrewForm (component removed).

## Architecture Decisions

### Decision: Stats computed in service layer, not SQL views

| Option | Tradeoff | Decision |
|--------|----------|----------|
| SQL aggregation in route handler | Fast but couples HTTP to raw SQL | ❌ |
| Drizzle query builder in service | Reuses existing patterns, testable | ✅ |
| DB views / triggers | Opaque, breaks pattern of thin ORM | ❌ |

**Rationale**: `beanService.getByIdWithStats(id)` uses Drizzle sub-queries (COUNT, AVG, GROUP BY) alongside the existing fetch. Same pattern as `brewService.getById` — one method, one responsibility.

### Decision: `preSelectedBeanId` as optional prop, not route-reading hook

| Option | Tradeoff | Decision |
|--------|----------|----------|
| BrewForm reads `useParams` internally | Tight coupling to routing | ❌ |
| Prop from parent / tiny wrapper component | Reusable in both routes and edit mode | ✅ |

**Rationale**: BrewEdit uses BrewForm without a preselected bean. A read-from-route approach would break edit mode. Prop keeps it pure.

### Decision: BrewForm inlines bean selector, BeanSelect removed

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Keep BeanSelect for edit mode | Dead component in new-creation flow | ❌ |
| Inline `<select>` in BrewForm | Single component, no dead imports, edit mode works | ✅ |

**Rationale**: When `preSelectedBeanId` is set → hide selector. When not set (edit mode) → render inline `<select>` fetching beans via `useQuery`. No separate component needed.

## Data Flow

```
┌─────────────────────────────┐
│        BitacoraHome         │
│  /bitacora                  │
│  GET /api/beans → cards     │
│  click card → /bitacora/:id │
│  "Crear café" → BeanForm    │
│    → POST /api/beans        │
│    → navigate /bitacora/:id │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│           BeanDetail                │
│  /bitacora/:id                      │
│                                     │
│  parallel:                          │
│  ┌─ GET /api/beans/:id  (withStats) │
│  │   returns {..., avgRating,       │
│  │     brewCount, methodBreakdown}   │
│  └─ GET /api/beans/:id/brews        │
│      returns BrewSessionWithNotes[] │
│                                     │
│  "Nueva preparación"                │
│    → /bitacora/:id/brews/new        │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│           BrewForm                  │
│  /bitacora/:id/brews/new            │
│  preSelectedBeanId={id}             │
│  → hides bean selector              │
│  → POST /api/brews {coffeeBeanId:id}│
│  → invalidate ['bean-brews', id]    │
│  → navigate /bitacora/:id           │
└─────────────────────────────────────┘
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `backend/src/types/index.ts` | Modify | Add `CoffeeBeanWithStats`, `BrewSessionWithNotes` |
| `backend/src/services/bean-service.ts` | Modify | Add `getByIdWithStats()`, `getBrewsByBeanId()` |
| `backend/src/routes/beans.ts` | Modify | New `GET /:id/brews` route; update `GET /:id` to use `getByIdWithStats` |
| `backend/src/tests/integration.test.ts` | Modify | Add tests for stats + brews endpoint |
| `frontend/src/types.ts` | Modify | Add `CoffeeBeanWithStats`, `BrewSessionWithNotes` |
| `frontend/src/api/client.ts` | Modify | `beansApi.getById` returns `CoffeeBeanWithStats`; add `getBrewsByBean` |
| `frontend/src/App.tsx` | Modify | Add 3 routes, remove 3 routes, add `BrewRoute` wrapper |
| `frontend/src/components/BrewForm.tsx` | Modify | Add `preSelectedBeanId` prop, inline bean selector, conditional redirect |
| `frontend/src/components/BeanForm.tsx` | Modify | Add `onCreated` callback prop for post-creation navigation |
| `frontend/src/components/BitacoraHome.tsx` | Create | Bean card grid + "Crear café" with BeanForm modal |
| `frontend/src/components/BeanDetail.tsx` | Create | Bean info, stats, brew history with tasting notes |
| `frontend/src/components/BeanList.tsx` | Delete | Replaced by BitacoraHome |
| `frontend/src/components/BeanSelect.tsx` | Delete | Inlined into BrewForm |
| `frontend/src/components/BrewList.tsx` | Delete | Replaced by BitacoraHome + BeanDetail |

## Interfaces / Contracts

```typescript
// --- Backend types (backend/src/types/index.ts) ---

export type CoffeeBeanWithStats = CoffeeBean & {
  avgRating: number | null;
  brewCount: number;
  methodBreakdown: Record<string, number>;
};

export type BrewSessionWithNotes = BrewSession & {
  tastingNotesSummary: string | null;
};

// --- New service methods ---

// bean-service.ts
getByIdWithStats(id: number): Promise<CoffeeBeanWithStats | null>
getBrewsByBeanId(id: number): Promise<BrewSessionWithNotes[]>

// --- API contract ---

// GET /api/beans/:id
// Response 200: CoffeeBeanWithStats
// { ..., "avgRating": 4, "brewCount": 4,
//   "methodBreakdown": { "V60": 3, "Aeropress": 1 } }

// GET /api/beans/:id/brews
// Response 200: BrewSessionWithNotes[]
// [{ ..., "tastingNotesSummary": "aroma: floral, flavor: berry" }]
// Response 404: { error: "Coffee bean not found" }
// Empty array when bean has no brews (not 404)
```

```typescript
// --- Frontend types (frontend/src/types.ts) ---

export interface CoffeeBeanWithStats extends CoffeeBean {
  avgRating: number | null;
  brewCount: number;
  methodBreakdown: Record<string, number>;
}

export interface BrewSessionWithNotes extends BrewSession {
  tastingNotesSummary: string | null;
}

// --- BrewForm prop ---
interface BrewFormProps {
  brewId?: number;
  initialData?: CreateBrewData;
  preSelectedBeanId?: number; // NEW
}

// --- BeanForm prop ---
interface BeanFormProps {
  bean?: CoffeeBean;
  onClose: () => void;
  onCreated?: (bean: CoffeeBean) => void; // NEW
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Backend unit | `getBrewsByBeanId` returns brews newest-first with notes summary | Mock DB, assert ordering and summary shape |
| Backend unit | `getByIdWithStats` computes correct avg, count, breakdown | Mock 3 brews with different methods/ratings |
| Backend integration | `GET /api/beans/:id` returns stats fields | Full app request, verify JSON shape |
| Backend integration | `GET /api/beans/:id/brews` returns 200 array for valid bean, 404 for missing, empty for no-brews | Full app request, 3 scenarios |
| Frontend | `BitacoraHome` renders bean cards from query | Component test with mock data |
| Frontend | `BeanDetail` shows stats + brew history | Component test with mock data |
| Frontend | `BrewForm` hides selector when `preSelectedBeanId` set | RTL, assert BeanSelect not present |
| Existing | All 43 existing tests still pass | `vitest run` before commit |

## Migration / Rollout

No data migration required. Schema already supports all relations. Old routes (`/beans`, `/brews/new`, old `/bitacora`) are replaced — any bookmarked links will 404 (catch-all redirects to `/`). No feature flags.

## Open Questions

- None. All decisions are scoped by specs.
