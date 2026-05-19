-- Corrected create_notification function to include action_url for tasks
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
declare
  v_action_url text;
begin
  if _user_id is null then return; end if;

  -- Automatically generate the action_url for tasks
  if _entity_type = 'task' then
    v_action_url := 'http://localhost:8080/tasks/' || _entity_id;
  end if;

  insert into public.notifications
    (user_id, actor_id, type, priority, title, body, entity_type, entity_id, project_id, metadata, action_url)
  values
    (_user_id, _actor_id, _type, _priority, _title, _body, _entity_type, _entity_id, _project_id, _metadata, v_action_url);
end;
$function$;
