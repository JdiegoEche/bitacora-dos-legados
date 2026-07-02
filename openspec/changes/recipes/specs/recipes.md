# Recipes Specification

## Purpose

The recipes domain provides a read-only catalog of filter-coffee recipes organized by method. This completes the "study → brew → log" workflow — users browse iconic recipes, then log their own brew sessions referencing what they learned.

## Requirements

### REQ-RCP-1: Data Model

The system MUST store recipes and their steps in two related tables.

**`recipes` table:**

| Field | Type | Notes |
|-------|------|-------|
| `id` | INTEGER (PK) | Auto-increment |
| `method` | TEXT NOT NULL | Slug: `v60`, `aeropress`, `chemex`, `kalitawave`, `origami`, `switch` |
| `name` | TEXT NOT NULL | Recipe title |
| `coffeeDose` | INTEGER NOT NULL | Grams |
| `waterDose` | INTEGER NOT NULL | ml |
| `ratio` | TEXT NOT NULL | e.g. "1:16.7" |
| `temperature` | TEXT NOT NULL | e.g. "96–100 °C" |
| `grindSize` | TEXT NOT NULL | e.g. "Media-fina" |
| `totalTime` | TEXT NOT NULL | e.g. "2:45–3:30" |
| `profile` | TEXT NOT NULL | Flavor profile |
| `createdAt` | TEXT | ISO 8601 |

**`recipeSteps` table:**

| Field | Type | Notes |
|-------|------|-------|
| `id` | INTEGER (PK) | Auto-increment |
| `recipeId` | INTEGER (FK) | References `recipes.id`, ON DELETE CASCADE |
| `stepOrder` | INTEGER NOT NULL | 1-based ordering |
| `instruction` | TEXT NOT NULL | Step description |
| `waterAtStep` | INTEGER | Water amount in ml at this step, nullable |

#### Scenario: Migration creates tables

- GIVEN the migration runs on an empty database
- WHEN Drizzle pushes the schema
- THEN `recipes` and `recipeSteps` tables exist with correct columns, types, and FK

### REQ-RCP-2: List Recipes — `GET /api/recipes`

The system MUST return recipes filtered by the optional `method` query parameter. Steps MUST be excluded from list responses.

#### Scenario: All recipes

- GIVEN 26+ recipes exist across 6 methods
- WHEN GET `/api/recipes` is called
- THEN the system returns `200` with `Recipe[]` containing id, method, name, coffeeDose, waterDose, ratio, temperature, grindSize, totalTime, profile
- AND no recipe includes steps

#### Scenario: Filter by method

- GIVEN 9 V60 recipes exist
- WHEN GET `/api/recipes?method=v60` is called
- THEN the system returns `200` with exactly 9 recipes, all with `method: "v60"`

#### Scenario: No results for unknown method

- WHEN GET `/api/recipes?method=nonexistent` is called
- THEN the system returns `200` with an empty array

#### Scenario: Invalid method parameter

- WHEN GET `/api/recipes?method=` is called with an empty string
- THEN the system returns `400` with a validation error

### REQ-RCP-3: Get Recipe Detail — `GET /api/recipes/:id`

The system MUST return a single recipe with its steps array ordered by `stepOrder`.

#### Scenario: Existing recipe with steps

- GIVEN recipe ID 1 exists with 5 ordered steps
- WHEN GET `/api/recipes/1` is called
- THEN the system returns `200` with all recipe fields
- AND `steps` is a non-empty `RecipeStep[]` ordered by `stepOrder`, each with `instruction` and optional `waterAtStep`

#### Scenario: Non-existent recipe

- WHEN GET `/api/recipes/999` is called
- THEN the system returns `404`

### REQ-RCP-4: Seed Data

The system MUST parse `filter-coffeMD/*.md` files at seed time, extracting recipes and steps for all 6 methods.

#### Scenario: Seed loads all recipes

- GIVEN 6 markdown files containing 26+ total recipes
- WHEN `db/seed.ts` executes
- THEN all recipes and their steps are persisted to `recipes` and `recipeSteps`

#### Scenario: Idempotent seed

- GIVEN the seed has already populated the database
- WHEN the seed runs again
- THEN no duplicate recipes exist (seed truncates then re-inserts per method)

### REQ-RCP-5: Frontend Routes

The frontend MUST expose three routes under `/recetas`.

#### Scenario: Method grid at `/recetas`

- GIVEN a user visits `/recetas`
- THEN `RecipeMethodGrid` renders 6 SVG method icons in a responsive grid
- AND clicking an icon navigates to `/recetas/{method}`

#### Scenario: Recipe list for a method

- GIVEN a user visits `/recetas/v60`
- THEN `RecipeList` renders recipe cards with name, dose, ratio, temperature, grind, and time
- AND clicking a card navigates to `/recetas/v60/{id}`

#### Scenario: Empty method

- GIVEN no recipes exist for "chemex"
- WHEN a user visits `/recetas/chemex`
- THEN `RecipeList` shows an empty state message

#### Scenario: Recipe detail

- GIVEN a user visits `/recetas/v60/1`
- THEN `RecipeDetail` renders all recipe fields and ordered steps

### REQ-RCP-6: Navbar Integration

The navbar MUST include a "Recetas" link.

#### Scenario: Nav link renders

- GIVEN `Layout` renders
- THEN a "Recetas" link appears adjacent to "Bitácora" in the nav

### REQ-RCP-7: API Client and Types

The frontend MUST expose a `recipesApi` object and interfaces for recipes.

#### Scenario: Types defined

- GIVEN `frontend/src/types.ts`
- THEN it exports `Recipe` (list fields) and `RecipeDetail` (extends Recipe + `steps: RecipeStep[]`)

#### Scenario: recipesApi.list with method filter

- GIVEN `recipesApi.list("v60")` is called
- THEN it calls `GET /api/recipes?method=v60` and returns `Recipe[]`
- AND `recipesApi.list()` (no argument) fetches all recipes

## API Contract

| Method | Path | Query | Response |
|--------|------|-------|----------|
| GET | `/api/recipes` | `?method=` (optional string) | `200` → `Recipe[]`, `400` on invalid param |
| GET | `/api/recipes/:id` | — | `200` → `RecipeDetail`, `404` |

## UI Component Mapping

| Component | Route | Purpose |
|-----------|-------|---------|
| `RecipeMethodGrid` | `/recetas` | 6 SVG method icons in responsive grid |
| `RecipeList` | `/recetas/:method` | Recipe cards with brew parameters |
| `RecipeDetail` | `/recetas/:method/:id` | Full recipe info + ordered steps |
