# Delta for coffee-beans

## ADDED Requirements

### Requirement: CBR-REQ-5 — Edit Bean from UI

The system MUST provide an Edit button in `BeanDetail` that opens `BeanForm` as a modal with pre-filled current data. The modal MUST support Save (calls PUT) and Cancel (closes without changes).

(Previously: no in-app edit UI existed for beans — only direct API access via PUT)

#### Scenario: Open edit modal with pre-filled data

- GIVEN the user views a bean in BeanDetail
- WHEN they click "Edit"
- THEN a modal opens with BeanForm pre-filled with the bean's current name, roaster, origin, and roast level

#### Scenario: Save edit from modal

- GIVEN the edit modal is open with modified fields
- WHEN the user submits the form
- THEN the UI calls PUT `/api/beans/:id` with the updated data
- AND the modal closes
- AND BeanDetail refreshes with updated data

#### Scenario: Cancel edit

- GIVEN the edit modal is open
- WHEN the user clicks "Cancel"
- THEN the modal closes without saving

### Requirement: CBR-REQ-6 — Delete Bean from UI

The system MUST provide a Delete button in `BeanDetail` that calls `window.confirm()` then `beansApi.delete()`. On success, the UI navigates to `/bitacora` and shows a success toast.

(Previously: no in-app delete UI existed for beans — only direct API access via DELETE)

#### Scenario: Confirm and delete bean

- GIVEN the user views a bean in BeanDetail
- WHEN they click "Delete"
- THEN `window.confirm("Are you sure you want to delete this bean?")` is shown
- AND if confirmed, DELETE `/api/beans/:id` is called
- AND on `204` response, the UI navigates to `/bitacora`
- AND `toast.success()` is called

#### Scenario: Cancel delete

- GIVEN the "Delete" confirm dialog is shown
- WHEN the user clicks "Cancel"
- THEN the delete is not performed
- AND the user remains on BeanDetail

## MODIFIED Acceptance Criteria

- [ ] All existing backend CRUD criteria remain (create, list, get, update, delete)
- [ ] Edit button in BeanDetail opens BeanForm as modal with pre-filled data
- [ ] Save in edit modal calls PUT, refreshes detail, closes modal
- [ ] Cancel in edit modal closes without changes
- [ ] Delete button in BeanDetail shows window.confirm(), calls API on confirm, redirects to /bitacora on success
- [ ] Cancel in delete confirm stays on BeanDetail without deleting
- [ ] Success toast shown after delete completes
