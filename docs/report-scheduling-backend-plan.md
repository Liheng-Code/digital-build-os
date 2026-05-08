# Report Scheduling Backend — Implementation Plan

## Overview

Build a Supabase Edge Function (`process-report-schedules`) that runs hourly via `pg_cron`, detects due report schedules, generates report data, formats it as CSV/XLSX/HTML, and emails recipients via Resend.

## Files to Create / Modify

| # | File | Action | Approx. Lines |
|---|------|--------|--------------|
| 1 | `supabase/functions/process-report-schedules/index.ts` | **CREATE** | ~500 |
| 2 | `supabase/migrations/20260509000000_report_scheduler_cron.sql` | **CREATE** | ~30 |
| 3 | `supabase/config.toml` | **UPDATE** | +4 |

No frontend changes needed — `ReportSchedules.tsx` already reads/writes `last_sent_at`.

## Edge Function Architecture

```
Deno.serve(async (req) => {
  1. Auth: verify x-cron-secret header
  2. Create admin supabase client (SERVICE_ROLE_KEY)
  3. Query enabled report_schedules, filter to due ones
  4. For each due schedule:
     a. Generate report data via handler based on report_type
     b. Format output (CSV inline | XLSX via ExcelJS | HTML email)
     c. Send email via Resend API
     d. UPDATE report_schedules SET last_sent_at = now()
  5. Return summary: { processed: N, results: [...] }
})
```

### Due Schedule Detection

```sql
SELECT * FROM report_schedules
WHERE enabled = true
  AND (last_sent_at IS NULL OR
       CASE frequency
         WHEN 'daily'    THEN last_sent_at < now() - interval '24 hours'
         WHEN 'weekly'   THEN last_sent_at < now() - interval '7 days'
         WHEN 'monthly'  THEN last_sent_at < now() - interval '28 days'
         WHEN 'quarterly' THEN last_sent_at < now() - interval '90 days'
       END)
```

### Report Handlers (4 types)

Each mirrors the query patterns from `src/services/reportingService.ts`:

| Handler | Data Queried |
|---------|-------------|
| `handleExecutiveDashboard` | tasks, timesheet_entries, payroll_lines, profiles — org-wide KPIs |
| `handleProjectDashboard` | tasks, purchase_orders, purchase_requisitions, cost summaries — project KPIs |
| `handleFinancialReport` | project_budgets, supplier_invoices, progress_claims, purchase_orders — financial KPIs |
| `handleKpiAlertsSummary` | kpi_alert_events — recent alert breaches |

### Output Formats

| Format | Approach |
|--------|----------|
| **CSV** | Inline string building (no deps) |
| **XLSX** | ExcelJS workbook (already used in 3 existing Edge Functions) |
| **PDF** | **HTML email** — no PDF generation; report data is rendered as a styled inline HTML table in the email body |

### Email Delivery

- **Provider**: Resend (REST API via `fetch()`)
- **Env var**: `RESEND_API_KEY`
- **Auth**: API key stored in Supabase Edge Function secrets

### Cron Setup

```sql
SELECT cron.schedule(
  'process-report-schedules',
  '0 * * * *',  -- every hour at :00
  $$SELECT net.http_post(
    url := 'https://xubtjpjmkdnxdwyvskoj.supabase.co/functions/v1/process-report-schedules',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', current_setting('app.settings.cron_secret')
    ),
    body := '{}'::jsonb
  ) AS request_id;$$
);
```

### Environment Variables

```
RESEND_API_KEY=<from Resend dashboard>
CRON_SECRET=<shared secret for cron auth>
```

### Dependencies (Edge Function — Deno runtime)

```typescript
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import * as ExcelJS from "https://esm.sh/exceljs@4.4.0";
import { encode as b64encode } from "https://deno.land/std@0.224.0/encoding/base64.ts";
```

## Implementation Order

1. Create `supabase/functions/process-report-schedules/index.ts`
2. Create `supabase/migrations/20260509000000_report_scheduler_cron.sql`
3. Update `supabase/config.toml`
4. Verify: `npm run build` + `npm run lint`
5. Deploy: `supabase functions deploy process-report-schedules`
6. Set secrets: `supabase secrets set RESEND_API_KEY=<key> CRON_SECRET=<secret>`
