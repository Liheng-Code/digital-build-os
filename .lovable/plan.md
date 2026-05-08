## Problem

Pages **KPI Alerts** and **Report Schedules** crash with `Could not find the table 'public.kpi_alert_thresholds' in the schema cache`. The three backing tables were never created in the database, even though the frontend services and types already exist.

Missing tables:
- `public.kpi_alert_thresholds`
- `public.kpi_alert_events`
- `public.report_schedules`

## Fix

Create one migration that adds the three tables with the exact columns expected by `src/lib/reportingMeta.ts` and the services in `src/services/kpiAlertService.ts` / `src/services/reportScheduleService.ts`. Enable RLS using the existing `has_role` / project-membership patterns already used elsewhere in this app.

### Schema

`kpi_alert_thresholds`
- id uuid pk, project_id uuid (fk projects), kpi_name text, kpi_category text, operator text (gt|lt|gte|lte|eq), threshold_value numeric, severity text (info|warning|critical), enabled bool default true, label text, created_at, updated_at
- Unique (project_id, kpi_name, operator) — matches `upsert ... onConflict` in service

`kpi_alert_events`
- id uuid pk, project_id uuid, kpi_name text, kpi_category text, actual_value numeric, threshold_value numeric, operator text, severity text, message text, read_at timestamptz null, created_at

`report_schedules`
- id uuid pk, project_id uuid, report_type text, frequency text (daily|weekly|monthly|quarterly), day_of_week int null, day_of_month int null, recipients text[] default '{}', format text (pdf|csv|xlsx), enabled bool default true, label text, last_sent_at timestamptz null, created_at, updated_at

### Security

- Enable RLS on all three.
- SELECT/INSERT/UPDATE/DELETE: authenticated users who are members of the project (mirroring policies on other project-scoped tables) or have an admin role via `has_role`.
- Add `update_updated_at_column` triggers on the two tables that carry `updated_at`.
- Indexes on `project_id` and (events) `created_at desc`.

### No frontend changes

Service code, types and pages already match this schema, so once the migration runs both pages load normally.

## Verification

1. Run migration.
2. Open `/kpi-alerts` and `/report-schedules` — error gone, empty lists render.
3. Create one threshold and one schedule to confirm insert/update paths work.
