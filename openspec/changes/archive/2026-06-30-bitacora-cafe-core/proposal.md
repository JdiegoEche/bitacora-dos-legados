# Proposal: Bitácora Café Core

## Intent

Coffee enthusiasts lack a structured, self-hosted way to log brew recipes and tasting notes across devices. This change builds the MVP backend + frontend for tracking brew sessions, recipes, and observations — with SQLite portability and a REST API designed for future mobile expansion.

## Scope

### In Scope
- REST API (Hono + TypeScript) — brew session and tasting note CRUD
- React + Vite frontend — brew form, history list, detail view, edit/delete
- SQLite database with Drizzle ORM — schema, migrations, seed data
- Single-user local app (no auth)

### Out of Scope
- User auth / multi-user — file-based single-user for MVP
- Mobile app — deferred to future React Native change
- Charts, analytics, photo attachments, social sharing
- Brew method presets or advanced recipe calculations

## Capabilities

### New Capabilities
- `brew-sessions`: CRUD for brew sessions with recipe metadata (coffee, grind, temp, time, method, notes)
- `tasting-notes`: CRUD for tasting observations linked to a brew (aroma, flavor, body, acidity, rating, free text)
- `coffee-beans`: CRUD for coffee bean catalog (name, roaster, origin, roast level)

### Modified Capabilities
None — first change in the project.

## Approach

Monorepo with `backend/` (Hono + TypeScript + Drizzle + better-sqlite3) and `frontend/` (React + Vite + TypeScript). API-first design — all frontend state comes from REST calls, enabling mobile reuse later. No auth layer for MVP.

```
bitacora-dos-legados/
├── backend/          # Hono API server, Drizzle schema, migrations
├── frontend/         # React + Vite SPA
└── database/         # SQLite file, migration scripts
```

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `backend/` | New | Hono server, route handlers, Drizzle models |
| `frontend/` | New | React SPA: brew list, form, detail, notes |
| `database/` | New | SQLite file, Drizzle migrations |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| SQLite path/config issues on deploy | Low | Configurable path via env var |
| Future mobile needs divergent API shape | Low | REST-first keeps backend neutral |
| MVP scope creep (overbuilding features) | Med | Strict in/out scope; defer non-essentials |

## Rollback Plan

First deploy: delete project folder and re-clone from git. SQLite file is user data — back up `database/*.db` before any destructive migration.

## Dependencies

- Node.js 20+
- npm, pnpm, or yarn

## Success Criteria

- [ ] CREATE a brew session via UI → saved to SQLite, visible in list
- [ ] VIEW brew history → sorted by date, shows key recipe fields
- [ ] VIEW single brew detail → full recipe + linked tasting notes
- [ ] EDIT a brew session → changes persist after page reload
- [ ] DELETE a brew session → removed from list and SQLite
- [ ] ADD tasting notes to a brew → linked correctly
- [ ] DELETE tasting notes → removed independently of brew
- [ ] Backend API responds to all CRUD endpoints (200/404/validation)
