# Manual E2E Smoke Test — Bitácora Café

> Run through these flows manually after PR 3 (Frontend Beans + Tasting Notes UI).
> Both the backend and frontend dev servers must be running.

## Setup

```bash
# Terminal 1: backend
cd backend && npm run dev

# Terminal 2: frontend
cd frontend && npm run dev
```

Open `http://localhost:5173` in a browser.

---

## Flow 1: Beans Page

### 1.1 Navigate to Beans
1. Click **Beans** in the header nav → `/beans` loads
2. **Expected**: see the seed beans (Ethiopia Yirgacheffe, Colombia La Esperanza, House Blend) listed in alphabetical order

### 1.2 Add a Bean
1. Click **+ Add Bean** → modal opens
2. Leave Name empty → try to submit → **Expected**: browser validation blocks (required field)
3. Fill: Name="Costa Rica La Minita", Roaster="Intelligentsia", Origin="Costa Rica", Roast Level="medium"
4. Click **Add Bean** → modal closes, table updates with new bean at correct alphabetical position

### 1.3 Edit a Bean
1. Click **Edit** on the newly created bean
2. Change Name to "Costa Rica La Minita Tarrazu"
3. Click **Update Bean** → modal closes, row shows updated name

### 1.4 Delete an Unreferenced Bean
1. Click **Delete** on "Costa Rica La Minita Tarrazu" (no brews reference it)
2. Confirm the dialog → row disappears

### 1.5 Delete a Referenced Bean (SET NULL)
1. Note: "Ethiopia Yirgacheffe" is referenced by the "V60" brew
2. Click **Delete** on "Ethiopia Yirgacheffe"
3. Confirm the dialog → row disappears from beans table
4. Navigate to `/` (brew list) → **Expected**: the V60 brew shows "—" for bean instead of "Ethiopia Yirgacheffe"
5. Click the V60 brew → **Expected**: detail page shows no coffee bean

---

## Flow 2: Brew Detail with Tasting Notes

### 2.1 View Brew Detail with Existing Notes
1. Navigate to `/` and click the V60 brew
2. **Expected**: detail page shows full recipe info
3. Scroll to **Tasting Notes** section → **Expected**: existing seed tasting notes are displayed

### 2.2 Add a Tasting Note
1. In the brew detail page, scroll to the tasting notes form
2. Fill: Aroma="earthy", Flavor="dark chocolate", Body="full", Acidity="low", Rating=4, Notes="Rich and satisfying"
3. Click **Add Note** → form clears, new note card appears in the list

### 2.3 Delete a Tasting Note
1. Click **Delete** on one of the tasting note cards
2. **Expected**: the note disappears, remaining notes stay

---

## Flow 3: Brew Form with Bean Select

### 3.1 Create Brew with Bean Selection
1. Navigate to `/brews/new`
2. Fill all required fields
3. In the **Coffee Bean** dropdown → **Expected**: remaining beans are listed (Colombia La Esperanza, House Blend)
4. Select a bean, set rating, fill notes
5. Submit → redirects to new brew detail

---

## Acceptance Criteria Checklist

| Criterion | Status |
|-----------|--------|
| Beans page loads with seed data, alphabetically sorted |  |
| Add bean creates new entry and closes modal |  |
| Edit bean updates fields and closes modal |  |
| Delete unreferenced bean removes it from table |  |
| Delete referenced bean sets FK to NULL on brews |  |
| Brew detail shows existing tasting notes |  |
| Add tasting note via form appears inline |  |
| Delete tasting note removes only that note |  |
| Brew form bean dropdown updates correctly |  |
| Navigation between pages works (brews ↔ beans) |  |

---

## Troubleshooting

- **Backend not responding**: check terminal for errors, verify `http://localhost:3001/api/health` returns `{"status":"ok"}`
- **Frontend proxy errors**: ensure backend is running on port 3001, check Vite proxy config in `frontend/vite.config.ts`
- **Database issues**: delete `database/cafe.db` and re-run `cd backend && npm run seed`
