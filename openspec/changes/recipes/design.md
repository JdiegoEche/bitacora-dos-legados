# Design: Recipe Book (Recetario)

## Technical Approach

Add a read-only recipe catalog to complete the "study → brew → log" flow. Backend: `recipes` table with steps as JSON column, Hono routes, markdown seed script. Frontend: 3 components under `/recetas`, inline SVG icons, TanStack Query. Follow existing patterns from beans/brews — no architectural changes.

## Architecture Decisions

### 1. Steps: JSON column vs separate `recipeSteps` table

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Separate table (spec says) | Normalized FK + cascade, JOIN required, more seed complexity, queries always coupled | ❌ Rejected |
| JSON text column | Single query, simpler seed, no migration for steps table, Zod validates shape | ✅ **Chosen** |

**Rationale**: Steps are never queried independently, never updated via API, and always fetched with the recipe. A separate table adds zero querying benefit. JSON column keeps seed and service code simple. The spec's table design is over-engineered for read-only, always-coupled data.

### 2. Seed approach

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Runtime markdown parser | Flexible, no pre-processing, depends on markdown structure stability | ✅ **Chosen** |
| Static JSON data | Simpler but duplicates source of truth, brittle when .md files change | ❌ Rejected |

**Approach**: Seed script parses `filter-coffeMD/*.md` with regex extracting `## Title` → params table → section blocks → profile. Maps to `InsertRecipe` shape. Runs via `npx tsx src/db/seed.ts`. Idempotent: truncates `recipes` before insert.

### 3. API Design

Follow existing pattern: Hono router → `zValidator` for query/params → service method → JSON response.

- `GET /api/recipes?method=v60` — `recipeService.list(method?)`
- `GET /api/recipes/:id` — `recipeService.getById(id)` → 404 if missing

### 4. Frontend component tree

Follow presentational + container pattern. Components under `frontend/src/components/recipes/`:

- `RecipeMethodGrid` — `/recetas`, SVG icon grid → links to `/recetas/:method`
- `RecipeList` — `/recetas/:method`, recipe cards with params → links to `/recetas/:method/:id`
- `RecipeDetail` — `/recetas/:method/:id`, full recipe + steps

### 5. SVG Icons

Inline React components in `components/icons/MethodIcons.tsx`. Six icons (V60, Aeropress, Chemex, Kalita, Origami, Switch). No icon library dependency. Each is a `<svg>` wrapped in a component, typed as `React.FC<React.SVGProps<SVGSVGElement>>`.

## Data Flow

```
Browser                    API Server
  │                          │
  ├─ /recetas ────────────── GET /api/recipes (no filter)
  │                          │─ recipeService.list() → db.select().from(recipes)
  │                          │─ returns Recipe[] (no steps)
  │◄─────────────────────────┘
  │
  ├─ /recetas/v60 ────────── GET /api/recipes?method=v60
  │                          │─ recipeService.list("v60") → filter + order
  │                          │─ returns Recipe[] (no steps)
  │◄─────────────────────────┘
  │
  ├─ /recetas/v60/1 ──────── GET /api/recipes/1
  │                          │─ recipeService.getById(1) → single + parse JSON steps
  │                          │─ returns RecipeDetail (with steps[])
  │◄─────────────────────────┘
```

## Data Model

```typescript
// backend/src/db/schema.ts  —  recipes table
export const recipes = sqliteTable('recipes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  method: text('method').notNull(),    // slug: v60|aeropress|chemex|kalitawave|origami|switch
  name: text('name').notNull(),
  coffeeDose: integer('coffee_dose').notNull(),
  waterDose: integer('water_dose').notNull(),
  ratio: text('ratio').notNull(),       // "1:16.7"
  temperature: text('temperature').notNull(),
  grindSize: text('grind_size').notNull(),
  totalTime: text('total_time').notNull(),
  profile: text('profile').notNull(),
  steps: text('steps').notNull(),       // JSON — array of { stepOrder, instruction, waterAtStep? }
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});

// Zod schema for steps validation (backend/src/lib/validators.ts)
const recipeStepSchema = z.object({
  stepOrder: z.number().int().positive(),
  instruction: z.string().min(1),
  waterAtStep: z.number().int().positive().optional(),
});
export const recipeStepsSchema = z.array(recipeStepSchema);
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `backend/src/db/schema.ts` | Modify | Add `recipes` table with `steps` as TEXT (JSON) |
| `backend/src/lib/validators.ts` | Modify | Add `methodQuerySchema`, `recipeStepSchema` |
| `backend/src/services/recipe-service.ts` | **Create** | `list(method?)`, `getById(id)` |
| `backend/src/routes/recipes.ts` | **Create** | GET `/`, GET `/:id` with zValidator |
| `backend/src/index.ts` | Modify | Register `app.route('/api/recipes', recipeRouter)` |
| `backend/src/db/seed.ts` | Modify | Parse `filter-coffeMD/*.md`, insert recipes |
| `backend/src/types/index.ts` | Modify | Add `Recipe`, `RecipeDetail`, `RecipeStep` types |
| `frontend/src/types.ts` | Modify | Add `Recipe`, `RecipeDetail`, `RecipeStep` interfaces |
| `frontend/src/api/client.ts` | Modify | Add `recipesApi.list(method?)`, `recipesApi.getById(id)` |
| `frontend/src/components/icons/MethodIcons.tsx` | **Create** | 6 SVG icon components |
| `frontend/src/components/recipes/RecipeMethodGrid.tsx` | **Create** | Method selector grid |
| `frontend/src/components/recipes/RecipeList.tsx` | **Create** | Recipe cards for a method |
| `frontend/src/components/recipes/RecipeDetail.tsx` | **Create** | Full recipe with steps |
| `frontend/src/App.tsx` | Modify | Add `/recetas` routes |
| `frontend/src/components/Layout.tsx` | Modify | Add "Recetas" nav link |

## Interfaces / Contracts

```typescript
// Backend types (backend/src/types/index.ts)
export type Recipe = InferSelectModel<typeof recipes>;
export type CreateRecipe = InferInsertModel<typeof recipes>;

export interface RecipeStep {
  stepOrder: number;
  instruction: string;
  waterAtStep?: number;
}

export interface RecipeDetail extends Recipe {
  steps: RecipeStep[];
}

// Frontend types (frontend/src/types.ts)
export interface Recipe {
  id: number;
  method: string;
  name: string;
  coffeeDose: number;
  waterDose: number;
  ratio: string;
  temperature: string;
  grindSize: string;
  totalTime: string;
  profile: string;
}

export interface RecipeDetail extends Recipe {
  steps: RecipeStep[];
}

export interface RecipeStep {
  stepOrder: number;
  instruction: string;
  waterAtStep?: number;
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit (service) | `list()` filtering, `getById()` null case | Mock DB or integration test with in-memory SQLite |
| Integration (API) | GET `/api/recipes`, GET with `?method=`, GET `/:id` (found + 404) | `sublime` integration helper, seeded test data |
| Frontend | Component renders with/without data | Vitest + React Testing Library |

## Migration / Rollout

No migration required. Seed script populates from markdown. Old databases get a new `recipes` table via Drizzle push. Frontend routes are additive — no breaking changes.

## Open Questions

None.
