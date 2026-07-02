# Manual E2E Smoke Test — Bitácora Café

> Run through these flows manually to verify the app works.
> Both the backend and frontend dev servers must be running.
>
> **Note**: the DB starts clean (no sample data) — only recipes are seeded.
> You'll need to add your own coffee beans and brew sessions first.

## Setup

```bash
# Terminal 1: backend
cd backend && npm run dev

# Terminal 2: frontend
cd frontend && npm run dev
```

Open `http://localhost:5173` in a browser.

---

## Flow 1: Add a Coffee Bean

1. Click **Beans** in the header nav → `/beans` loads
2. **Expected**: empty state "No hay cafés todavía"
3. Click **+ Añadir Café** → modal opens
4. Leave Name empty → try to submit → **Expected**: browser validation blocks (required field)
5. Fill: Name="Costa Rica La Minita", Roaster="Intelligentsia", Origin="Costa Rica", Roast Level="medium"
6. Click **Añadir Café** → modal closes, table shows the new bean

## Flow 2: Create a Brew Session

1. Navigate to `/bitacora`
2. Click **Nuevo registro** → form opens
3. Fill all required fields, select a bean if you added one
4. Submit → redirects to the new brew detail

## Flow 3: Browse Recipes

1. Navigate to `/recetas` → **Expected**: grid of 6 methods (V60, Switch, Origami, Kalita, Chemex, Aeropress)
2. Click any method → **Expected**: list of recipes with coffee dose, water, ratio, etc.
3. Click a recipe → **Expected**: detail view with preparation notes, parameters grid, pasos timeline, and profile

---

## Acceptance Criteria Checklist

| Criterion | Status |
|-----------|--------|
| Beans page shows empty state when no beans exist |  |
| Add bean creates new entry and closes modal |  |
| Brew form works with selected bean |  |
| Recipe grid shows all 6 methods |  |
| Recipe list shows correct count per method |  |
| Recipe detail shows preparation, params, steps, profile |  |
| Preparation text displays correctly when present |  |
| Params with empty values are hidden (not shown blank) |  |
| Navigation between pages works (bitácora ↔ recetas ↔ beans) |  |

---

## Troubleshooting

- **Backend not responding**: check terminal for errors, verify `http://localhost:3001/api/health` returns `{"status":"ok"}`
- **Frontend proxy errors**: ensure backend is running on port 3001, check Vite proxy config in `frontend/vite.config.ts`
- **Database issues**: delete `database/cafe.db` and re-run `cd backend && npm run seed`
