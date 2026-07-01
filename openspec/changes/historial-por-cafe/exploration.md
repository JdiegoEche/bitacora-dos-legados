## Exploration: historial-por-cafe

### Current State

**Data Model:**
- Three entities: `coffee_beans` (FK referenced by brews), `brew_sessions` (FK `coffee_bean_id` → `coffee_beans.id`, nullable, SET NULL on delete), `tasting_notes` (FK `brew_session_id` → `brew_sessions.id`, CASCADE on delete)
- Relations already defined in Drizzle: `coffeeBeansRelations` has `brewSessions: many(brewSessions)`, `brewSessionsRelations` has `coffeeBean: one(coffeeBeans)` and `tastingNotes: many(tastingNotes)`
- Backend types include `CoffeeBeanWithBrews` (bean + `brewSessions: BrewSession[]`) but it's unused

**API Endpoints (current):**
| Endpoint | Method | Purpose |
|---|---|---|
| `/api/beans` | GET | List beans alphabetically |
| `/api/beans/:id` | GET | Single bean (no brew data) |
| `/api/beans/:id` | PUT/DELETE | Update/delete bean |
| `/api/brews` | GET | List all brews newest-first |
| `/api/brews/:id` | GET | Single brew with coffeeBean + tastingNotes |
| `/api/brews` | POST | Create brew (accepts optional `coffeeBeanId`) |
| `/api/brews/:brewId/notes` | GET/POST | Tasting notes for a brew |

**Frontend Routes (current):**
| Route | Component | Purpose |
|---|---|---|
| `/` | LandingPage | Home |
| `/bitacora` | BrewList | All brews table |
| `/brews/new` | BrewForm | Create brew (with BeanSelect dropdown) |
| `/brews/:id` | BrewDetail | Single brew detail + tasting notes |
| `/brews/:id/edit` | BrewEdit | Edit brew (pre-filled form) |
| `/beans` | BeanList | Table of all beans with Edit/Delete — no links to detail |

**Key observation:** There is NO bean detail page today. `BeanList` actions are only Edit (opens BeanForm modal) and Delete. Brews are created independently from beans. The `coffeeBeanId` field in the brew form is an optional dropdown (`BeanSelect`).

### Affected Areas

- `backend/src/routes/beans.ts` — needs new endpoint `GET /api/beans/:id/brews`
- `backend/src/services/bean-service.ts` — needs new method `getBrewsByBeanId(id)` (or in brew-service)
- `backend/src/routes/brews.ts` — no changes strictly needed (existing POST already accepts `coffeeBeanId`)
- `backend/src/lib/validators.ts` — no changes needed (existing schemas cover the data)
- `frontend/src/App.tsx` — needs new routes: `/beans/:id`, `/beans/:id/brews/new`
- `frontend/src/api/client.ts` — needs `beansApi.getBrewsByBean(id)` method
- `frontend/src/types.ts` — may need `BeanWithBrews` type
- `frontend/src/components/BrewForm.tsx` — needs `preSelectedBeanId` prop to hide BeanSelect
- `frontend/src/components/BeanList.tsx` — rows need links to `/beans/:id`
- `frontend/src/components/Layout.tsx` — navigation unchanged
- `frontend/src/components/BrewEdit.tsx` — may need to pass `beanId` context if editing from bean page
- `backend/src/tests/integration.test.ts` — new tests for the bean brews endpoint

### Approaches

1. **Approach A: Dedicated bean detail route with nested brew creation (RECOMMENDED)**
   - New route `/beans/:id` → `BeanDetail` component showing bean info + chronologically ordered brew history table
   - New route `/beans/:id/brews/new` → `BrewForm` with `preSelectedBeanId` prop, hides BeanSelect dropdown
   - New API: `GET /api/beans/:id/brews` → returns `BrewSession[]` for that bean (newest first)
   - `BeanList` rows become clickable links to `/beans/:id`
   - `BrewForm` stays reusable: with `preSelectedBeanId` → auto-fills and hides bean selector; without → shows dropdown (current behavior)
   - Pros:
     - Clean, deep-linkable URLs
     - Reuses `BrewForm` with minimal changes (one optional prop)
     - Separates concerns: `BeanDetail` is a new component, no refactoring of existing ones
     - RESTful: `/api/beans/:id/brews` is the natural resource path
     - Works with existing POST `/api/brews` — just passes `coffeeBeanId` from context
   - Cons:
     - One additional API endpoint and service method
     - Navigation jumps from bean page to a different URL to create brew (user leaves context)
   - Effort: **Medium** — 8-10 files touched, mostly additive

2. **Approach B: Bean detail with inline brew history + modal for new brew**
   - New route `/beans/:id` → `BeanDetail` showing bean info + inline brew history + "New Brew" button
   - "New Brew" opens a modal containing `BrewForm` with preselected bean
   - Modal replaces navigation for brew creation when coming from bean context
   - Pros:
     - User never leaves the bean page — feels cohesive
     - No new route needed for brew creation from bean
   - Cons:
     - Modal complexity: form state inside overlay, close/confirm behavior
     - Brew form includes tasting notes section? Or is that a separate step? Unclear
     - Not deep-linkable for "create brew for this bean" — can't share URL
     - More complex state management: modal open/close, invalidation of brew list on close
     - If form is complex (and it IS — 10+ fields), a modal feels cramped on mobile
   - Effort: **Medium-High** — more frontend complexity, less reusable components

3. **Approach C: Bean detail + query param redirect to existing brew form**
   - New route `/beans/:id` → `BeanDetail` with brew history
   - "New Brew" button links to `/brews/new?beanId=X`
   - `BrewForm` reads `beanId` from query param via `useSearchParams()`, preselects the bean and hides the dropdown
   - Pros:
     - Reuses existing `/brews/new` route completely
     - No new route for brew creation
     - Minimal changes to `BrewForm` (just read query param)
   - Cons:
     - Query params are less explicit than path params — easy to lose on redirect
     - After saving, user lands on `/brews/:id` — no clear way to navigate back to the bean they came from (need a "Back to bean" link)
     - Less RESTful, feels like a hack
   - Effort: **Low-Medium** — fewer routing changes but less clean UX
   - Risk: query params are more fragile; if user refreshes or shares the URL the bean context is lost

### Recommendation

**Approach A** is the most solid: it's clean, RESTful, keeps components reusable, and sets up a clear pattern for future features (e.g., bean stats, average rating per bean). The extra route is worth the clarity.

Specific design decisions:
1. `GET /api/beans/:id/brews` returns `BrewSession[]` (basic list, not detail) — for the history table we just need method, date, rating, grind params
2. `BrewForm` gets a new optional prop `preSelectedBeanId?: number` — when set, it skips `BeanSelect` and auto-associates the brew
3. The `BeanDetail` component contains: bean header info + brew history table (reuses BrewList pattern) + "New Brew" button
4. After creating a brew from bean context, redirect to `/brews/:id` (brew detail) with a back link to the bean

### Risks

- **brewTime type mismatch**: In the schema `brew_time` is INTEGER (seconds), but the frontend and `CreateBrewData` type define it as `string`. The validator also expects `brewTime: z.string()`. This looks like an existing inconsistency — it's NOT caused by this change, but could cause confusion during implementation.
- **Existing tests**: The integration tests in `integration.test.ts` create brews via `POST /api/brews` without a `coffeeBeanId` (optional). The existing tests should still pass. New tests must be added for `GET /api/beans/:id/brews`.
- **No database migration needed**: The schema already supports the relation. The `coffee_bean_id` FK exists, is nullable, and Drizzle relations are defined. No schema changes required.
- **SET NULL on delete is fine**: When a bean is deleted, its brews become unlinked (`coffee_bean_id = NULL`). They simply won't appear in the bean's brew history anymore — acceptable behavior.
- **Backward compatibility**: The existing `/bitacora` (all brews) and `/brews/new` (with dropdown) remain fully functional. Brews without a `coffeeBeanId` are simply not shown on any bean's history.
- **BrewForm reuse**: The form's `toPayload()` already sends `coffeeBeanId` to the API. When `preSelectedBeanId` is set, it just uses that value directly instead of reading from the dropdown — zero backend changes.

### Ready for Proposal

Yes. All the information needed to write a proposal is here. The change is well-scoped, backward-compatible, and affects a predictable set of files. No architecture blockers.
