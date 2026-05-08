-- Enable pg_cron extension for scheduled job execution
create extension if not exists pg_cron with schema pg_catalog;

-- Store the cron secret in a custom parameter (set via supabase secrets)
-- The cron job calls the edge function with this secret for authentication
select set_config('app.settings.cron_secret', 'CHANGE_ME_TO_A_RANDOM_SECRET', false) where not exists (
  select 1 from pg_settings where name = 'app.settings.cron_secret' and setting != ''
);

-- Register the cron job to run every hour at the 0th minute
select cron.schedule(
  'process-report-schedules',
  '0 * * * *',
  $$
  select net.http_post(
    url := 'https://xubtjpjmkdnxdwyvskoj.supabase.co/functions/v1/process-report-schedules',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', current_setting('app.settings.cron_secret')
    ),
    body := '{}'::jsonb
  ) as request_id;
  $$
);
