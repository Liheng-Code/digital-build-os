# WBS Module — Phase 1: Scheduling Core

Scope: upgrade the existing WBS/Gantt to professional scheduling level. No resources, EVM, risk, or imports yet (those are Phase 2–4).

## Goals

1. Multiple named **baselines** with variance bars and SV/SPI per node
2. **Critical Path Method (CPM)** computation with critical-path highlight
3. Per-task **scheduling constraints** (ASAP, ALAP, SNET, FNLT, MSO, MFO) + deadlines
4. Project & resource **calendars** (working days, shifts, exception days) — beyond the current holiday set
5. **Inline drag-to-edit** on Gantt bars (move, resize, drag progress handle)
6. **Find / filter / saved views** (status, discipline, assignee, overdue, critical, behind baseline)

## Database changes

New tables (all RLS-enabled, project-scoped, admin/PM write):

- `calendars` — id, project_id, name, is_default, working_days (bit-mask Mon–Sun), work_hours_per_day, timezone
- `calendar_exceptions` — id, calendar_id, exception_date, is_working, hours, label
- `wbs_baselines` — id, project_id, label, captured_at, captured_by, notes, is_active
- `wbs_baseline_tasks` — id, baseline_id, task_id, planned_start, planned_end, estimated_hours, progress_pct
- `task_constraints` — task_id (PK), constraint_type enum, constraint_date, deadline_date, calendar_id
- `task_schedule_calc` — task_id (PK), early_start, early_finish, late_start, late_finish, total_float, free_float, is_critical, calculated_at
- `wbs_saved_views` — id, project_id, user_id, name, filters (jsonb), columns (jsonb), zoom, is_shared

New enum: `schedule_constraint_type` = ASAP | ALAP | SNET | SNLT | FNET | FNLT | MSO | MFO

New SQL functions:

- `cpm_recalc(_project_id uuid)` — forward + backward pass, writes `task_schedule_calc`
- `capture_baseline(_project_id uuid, _label text, _notes text)` → baseline_id
- `set_active_baseline(_baseline_id uuid)`
- `working_days_between(_calendar_id, _from, _to)` helper
- Trigger: on `task_predecessors` / `tasks.planned_*` change → mark project for CPM recalc (debounced via edge cron)

## Edge functions

- `cpm-recalc` — invoked on demand and nightly per project
- `baseline-capture` — server-side snapshot (atomic), returns baseline summary

## Frontend

New / extended files under `src/components/wbs/` and `src/pages/Wbs.tsx`:

- `BaselinePanel.tsx` — list, capture, activate, delete baselines; show variance summary
- `BaselineBar.tsx` — thin grey bar under each Gantt bar when an active baseline exists
- `CriticalPathToggle.tsx` — toolbar toggle; when on, critical bars render in destructive color, slack ribbon shown
- `TaskConstraintsField.tsx` — added inside `CreateTaskDialog` and task detail
- `CalendarsAdmin.tsx` (under Admin Configuration) — manage calendars and exceptions
- `WbsFilterBar.tsx` — status / discipline / assignee / overdue / critical / behind-baseline chips
- `SavedViewsMenu.tsx` — save / load / share view
- `WbsGantt.tsx` — extend with drag-move, drag-resize edges, drag-progress handle (writes via existing `tasks` update path)

New hooks:

- `useBaselines(projectId)`
- `useCpm(projectId)` — returns map taskId → { float, isCritical, ES/EF/LS/LF }
- `useCalendars(projectId)`
- `useSavedView(projectId, viewId)`

Service layer:

- `src/services/scheduleService.ts` — captureBaseline, listBaselines, setActiveBaseline, recalcCpm, listCalendars, upsertCalendar, upsertException, getConstraints, setConstraint
- Extend `src/services/wbsService.ts` for saved views

`src/lib/scheduleMeta.ts` — add `CONSTRAINT_TYPE_LABELS`, helpers `isCritical`, `varianceDays`, `calcSpi`

## UX details

- Critical path: red outline + bold; non-critical with slack get a faint trailing ribbon equal to total float
- Baseline bar: 4 px slate bar below main bar; tooltip shows planned vs baseline delta in days
- Drag interactions: 8 px hit area on each bar edge; ghost preview with snap-to-day; release shows confirm toast with undo
- Filter bar persists in URL query string so views are shareable
- Saved view: per-user private by default, "Share with project" makes it visible to all members

## Out of scope (Phase 1)

- Resources, leveling, histogram (Phase 2)
- EVM, S-curves, snapshots (Phase 2)
- Risk register, Monte Carlo (Phase 4)
- MS Project / Primavera import-export (Phase 3)
- Network/PERT view (Phase 4)
- Templates and activity library (Phase 3)

## Implementation order

1. Migration: enums, tables, RLS, indexes, helper functions
2. `cpm-recalc` edge function + manual "Recalculate" button
3. Baselines (DB → service → panel → bar rendering)
4. Constraints (DB → form field → CPM honors them)
5. Calendars admin + use in CPM working-day math
6. Critical-path toggle + slack ribbon
7. Drag-to-edit on Gantt bars
8. Filter bar + saved views
9. QA: test on a real project with 100+ tasks and a deep WBS

## Risks

- CPM on large projects may be slow in PL/pgSQL — fallback: run inside edge function with a recursive in-memory pass
- Drag-to-edit can clash with the existing click-to-link-tasks flow; will be gated behind an "Edit mode" toggle
- Baseline storage grows quickly — cap at 10 baselines per project, oldest archived
