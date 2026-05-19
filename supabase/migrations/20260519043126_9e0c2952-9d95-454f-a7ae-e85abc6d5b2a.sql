
-- 1. Remove the self-skip in create_notification so self-assignment also notifies
CREATE OR REPLACE FUNCTION public.create_notification(
  _user_id uuid, _type notification_type, _title text, _body text,
  _entity_type text, _entity_id uuid, _project_id uuid,
  _priority notification_priority DEFAULT 'normal'::notification_priority,
  _actor_id uuid DEFAULT NULL::uuid, _metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
begin
  if _user_id is null then return; end if;

  insert into public.notifications
    (user_id, actor_id, type, priority, title, body, entity_type, entity_id, project_id, metadata)
  values
    (_user_id, _actor_id, _type, _priority, _title, _body, _entity_type, _entity_id, _project_id, _metadata);
end;
$function$;

-- 2. Trigger that posts every new notification to the telegram-notify edge function via pg_net
CREATE OR REPLACE FUNCTION public.dispatch_notification_to_telegram()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
declare
  v_has_chat boolean;
begin
  select telegram_chat_id is not null into v_has_chat
  from public.profiles where id = NEW.user_id;

  if coalesce(v_has_chat, false) then
    perform net.http_post(
      url := 'https://xubtjpjmkdnxdwyvskoj.supabase.co/functions/v1/telegram-notify',
      headers := '{"Content-Type":"application/json"}'::jsonb,
      body := jsonb_build_object('notification_id', NEW.id)
    );
  end if;

  return NEW;
end;
$$;

DROP TRIGGER IF EXISTS trg_dispatch_notification_to_telegram ON public.notifications;
CREATE TRIGGER trg_dispatch_notification_to_telegram
AFTER INSERT ON public.notifications
FOR EACH ROW EXECUTE FUNCTION public.dispatch_notification_to_telegram();
