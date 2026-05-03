## Module 1 — Daily Site Report (DSR) & Progress Tracking

The daily execution layer that ties planning (WBS/schedule) to labor (timesheets) and feeds real `progress_pct`, `actual_start/end`, and reporting.

---

### 1. Scope

One **Daily Site Report** per project per calendar day, owned by the site supervisor/engineer. Contains:
- Site conditions (weather, temperature, site status: working / partial / closed)
- Manpower headcount by department/trade (planned vs actual)
- Equipment on site (name, qty, hours operated, idle reason)
- Visitors / inspections occurred
- Work performed — line items linked to **WBS nodes or tasks**, with quantity installed today + % complete
- Delays & issues (category, description, impacted task, lost hours)
- Photos / attachments
- Supervisor notes
- Submit → review → approve workflow (draft / submitted / approved / rejected)
- PDF export + sign-off

When a DSR is **approved**, progress entries automatically:
- Update `tasks.progress_pct` (highest of submitted % so far)
- Set `tasks.actual_start` if first progress > 0
- Set `tasks.actual_end` when % reaches 100

---

### 2. Database

New tables (all with RLS, project-scoped):

```text
daily_site_reports
  id, project_id, report_date (unique per project),
  weather, temperature_c, site_status (working|partial|closed),
  general_notes, status (draft|submitted|approved|rejected),
  submitted_by, submitted_at, reviewed_by, reviewed_at, rejection_reason,
  created_by, created_at, updated_at

daily_manpower
  id, dsr_id, department (enum), trade_label,
  planned_count, actual_count, notes

daily_equipment
  id, dsr_id, equipment_name, quantity,
  hours_operated, idle_hours, idle_reason

daily_progress_entries
  id, dsr_id, task_id (nullable), wbs_node_id (nullable),
  description, qty_today numeric, qty_unit text,
  progress_pct_today int, cumulative_pct int,
  manpower_count int, hours_spent numeric, notes
  -- check: at least one of task_id / wbs_node_id is set

daily_delays
  id, dsr_id, category (weather|material|inspection|design|labor|equipment|other),
  description, impacted_task_id (nullable),
  lost_hours numeric, severity (low|med|high)

daily_visitors
  id, dsr_id, visitor_name, organization, purpose, time_in, time_out

dsr_attachments
  id, dsr_id, storage_path, file_name, mime_type, size_bytes,
  caption, related_task_id (nullable), uploaded_by, created_at
```

**Trigger** on `daily_progress_entries` (when parent DSR moves to `approved`):
- update `tasks.progress_pct = greatest(current, cumulative_pct)`
- set `actual_start` if null and cumulative_pct > 0 (use DSR `report_date`)
- set `actual_end = report_date::timestamptz` when cumulative_pct = 100
- write a row into `task_status_history` if implied status change (in_progress / pending_approval)
- insert into `schedule_calculation_logs` so the audit trail is unified

**Storage bucket**: `dsr-attachments` (private), RLS keyed on project membership.

**RLS summary**:
- View: any authenticated project member
- Insert / edit (draft): admin, project_manager, engineer, supervisor (and only on their project)
- Approve / reject: admin, project_manager
- Once `approved`, becomes immutable (only admin can reopen)

---

### 3. Pages & components

**New route** `/daily-reports` (and `/daily-reports/:id`):
- List page: table of DSRs for active project, filters (date range, status, author), "+ New report" button. Calendar heatmap toggle showing days with/without report.
- Detail page: full editor with tabs — *Overview · Manpower · Equipment · Progress · Delays · Visitors · Photos*. Sticky header with status badge, submit/approve actions.

**New components** under `src/components/dsr/`:
- `DsrHeader.tsx` — date picker, weather, site status, status badge, action buttons
- `DsrManpowerTab.tsx` — editable table grouped by department (auto-pulls planned headcount from active task assignments for the day as default)
- `DsrEquipmentTab.tsx` — editable table
- `DsrProgressTab.tsx` — line items: pick WBS node or task (uses existing `WbsNodePicker`), enter qty + cumulative %; shows previous cumulative for context
- `DsrDelaysTab.tsx` — categorized delay list
- `DsrVisitorsTab.tsx` — simple list
- `DsrAttachmentsTab.tsx` — drag-drop uploader with captions, gallery view
- `DsrApprovalBar.tsx` — submit / approve / reject with reason
- `DsrPdfExportButton.tsx` — generates printable PDF (browser print stylesheet first; edge function later if needed)

**Edited**:
- `src/App.tsx` — add `/daily-reports` and `/daily-reports/:id` routes
- `src/components/AppLayout.tsx` — add "Daily Reports" nav entry (icon: ClipboardCheck)
- `src/pages/TaskDetail.tsx` — add "Recent progress" panel showing latest DSR entries for this task
- `src/pages/Wbs.tsx` — show today's DSR progress overlay on Gantt (small dots on bars where progress was logged)
- `src/pages/Index.tsx` (Dashboard) — KPI tile: "DSRs this week", "Days missed"

**Hooks** under `src/hooks/`:
- `useDailyReport(dsrId)` — fetches DSR + all child rows in parallel
- `useDsrList(projectId, filters)`
- `useTodayDsr(projectId)` — returns today's DSR if exists, else stub for quick-create
- `useTaskProgressHistory(taskId)` — for TaskDetail panel

**Utilities** under `src/lib/`:
- `dsrMeta.ts` — status labels/tones, delay category labels, validation helpers
- `dsrPdf.ts` — print-friendly HTML composition

---

### 4. Validation

- One DSR per (project_id, report_date) — enforced by unique index
- `cumulative_pct` per task must be monotonic across DSRs (guard in trigger; reject save with clear error if a later date tries to lower it)
- Cannot submit with zero progress entries AND zero manpower (forces meaningful content)
- Attachments capped per DSR (e.g. 50 files, 25 MB each)
- Cross-check toast on submit: if DSR `actual_count` (manpower) ≠ count of timesheets logged that day, show non-blocking warning

---

### 5. Permissions matrix

| Action | admin | PM | engineer | supervisor | worker | accountant |
|---|---|---|---|---|---|---|
| View DSR | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create / edit draft | ✅ | ✅ | ✅ | ✅ | — | — |
| Submit | ✅ | ✅ | ✅ | ✅ | — | — |
| Approve / reject | ✅ | ✅ | — | — | — | — |
| Reopen approved | ✅ | — | — | — | — | — |
| Delete | ✅ | ✅ (own project) | — | — | — | — |

---

### 6. Out of scope (this round)

- Mobile-native offline capture (web responsive only for now)
- Auto-weather pull from external API
- Toolbox-talks / safety incident module (separate future module)
- Multi-day bulk progress entry

---

### 7. Delivery order

1. Migration (tables, enums, indexes, trigger, RLS, storage bucket)
2. Hooks + meta utilities
3. List page + detail shell with status workflow
4. Tabs in order: Overview → Progress → Manpower → Delays → Equipment → Visitors → Attachments
5. Approval flow + trigger wiring to `tasks`
6. Dashboard tile, TaskDetail panel, Gantt overlay
7. PDF export
8. QA pass & permissions verification

Estimated: one substantial implementation pass, then a follow-up for polish & PDF.
