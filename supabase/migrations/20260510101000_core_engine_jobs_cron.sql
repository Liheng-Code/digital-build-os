-- Enable pg_cron and pg_net for scheduled Edge Function execution.
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

-- Store the cron secret in a custom parameter when it is not configured yet.
-- Replace this value in the hosted project before relying on the schedule.
select set_config('app.settings.cron_secret', 'CHANGE_ME_TO_A_RANDOM_SECRET', false) where not exists (
  select 1 from pg_settings where name = 'app.settings.cron_secret' and setting != ''
);

-- Run core engine jobs every 30 minutes:
-- - overdue task notifications
-- - overdue approval reminders
-- - delivery retry bookkeeping
select cron.schedule(
  'process-core-engine-jobs',
  '*/30 * * * *',
  $$
  select net.http_post(
    url := 'https://xubtjpjmkdnxdwyvskoj.supabase.co/functions/v1/process-core-engine-jobs',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', current_setting('app.settings.cron_secret')
    ),
    body := '{}'::jsonb
  ) as request_id;
  $$
);
