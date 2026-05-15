# Stakeholder — Full Edit Functionality

## Problem
On `/stakeholders`, the "Edit" action in the row dropdown only opens the read-only details panel. There is no way to update an existing stakeholder's core fields (name, type, email, phone, address, status). Only the `notes` field is editable today.

The mutation `updateStakeholder` already exists in `useStakeholders` — it just isn't wired to a UI form.

## Goal
Add a working Edit dialog so users can update all stakeholder core fields, and wire it to:
- The "Edit" item in the row dropdown menu (`StakeholderList`)
- A new "Edit" button in the details panel header (`StakeholderDetails`)

## Scope
Frontend only. No schema or service changes.

## Changes

1. **Refactor `StakeholderDialog.tsx`** to support both Create and Edit modes
   - Accept an optional `stakeholder?: Stakeholder` prop
   - When provided: title becomes "Edit Stakeholder", form fields pre-fill from the stakeholder, includes a Status select (active / inactive / blacklisted), submits via `updateStakeholder.mutateAsync({ id, ...data })`
   - When omitted: existing create flow unchanged

2. **`StakeholderList.tsx`**
   - Add local state for the stakeholder being edited
   - "Edit" dropdown item opens the dialog in edit mode (instead of opening details)
   - Render `<StakeholderDialog>` in edit mode at the bottom

3. **`StakeholderDetails.tsx`**
   - Add an "Edit" button in the panel header (next to the close button)
   - Clicking it opens the same `StakeholderDialog` pre-filled for the current stakeholder
   - On save, panel reflects the updated values via existing react-query invalidation

## Out of scope
- Editing contacts / project assignments (already have their own dialogs)
- Bulk edit
- Changing the underlying create/update mutation behavior

## Technical notes
- Reuse the existing `stakeholderSchema` (zod) — extend it to optionally include `status` for edit
- Keep the `Add Stakeholder` button on the page header working as today
- All styling stays with semantic Tailwind tokens already used by the dialog
