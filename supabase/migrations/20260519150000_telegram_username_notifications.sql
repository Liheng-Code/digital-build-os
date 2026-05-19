-- Add telegram_username to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS telegram_username TEXT;

-- Update notify_task_assignment trigger function
CREATE OR REPLACE FUNCTION public.notify_task_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_task record;
  v_body text;
  v_telegram text;
  v_metadata jsonb;
BEGIN
  SELECT id, code, title, project_id INTO v_task FROM public.tasks WHERE id = COALESCE(NEW.task_id, OLD.task_id);
  v_body := COALESCE(v_task.code || ' — ', '') || v_task.title;

  -- Fetch telegram username of the assignee
  SELECT telegram_username INTO v_telegram FROM public.profiles WHERE id = NEW.user_id;

  IF v_telegram IS NOT NULL AND v_telegram <> '' THEN
    IF left(v_telegram, 1) <> '@' THEN
      v_telegram := '@' || v_telegram;
    END IF;
    v_body := v_body || E'\n' || v_telegram;
    v_metadata := jsonb_build_object('assignee_telegram', v_telegram);
  ELSE
    v_metadata := '{}'::jsonb;
  END IF;

  IF TG_OP = 'INSERT' THEN
    PERFORM public.create_notification(
      NEW.user_id, 'task_assigned', 'You were assigned a task', v_body,
      'task', v_task.id, v_task.project_id, 'normal', v_actor, v_metadata);
  ELSIF TG_OP = 'UPDATE' AND OLD.unassigned_at IS NULL AND NEW.unassigned_at IS NOT NULL THEN
    PERFORM public.create_notification(
      NEW.user_id, 'task_unassigned', 'You were unassigned from a task', v_body,
      'task', v_task.id, v_task.project_id, 'low', v_actor, '{}'::jsonb);
  END IF;

  RETURN NEW;
END;
$$;

-- Update notify_task_status_change trigger function
CREATE OR REPLACE FUNCTION public.notify_task_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_assignee uuid;
  v_planner uuid;
  v_title text;
  v_body text;
  v_body_tg text;
  v_telegram text;
  v_metadata jsonb;
  v_type public.notification_type;
  v_priority public.notification_priority := 'normal';
BEGIN
  IF NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;

  v_body := COALESCE(NEW.code || ' — ', '') || NEW.title;

  CASE NEW.status
    WHEN 'assigned' THEN
      v_type := 'task_assigned';
      v_title := 'Task assigned';
      FOR v_assignee IN
        SELECT user_id FROM public.task_assignments
        WHERE task_id = NEW.id AND unassigned_at IS NULL
      LOOP
        -- Fetch telegram username of the assignee
        SELECT telegram_username INTO v_telegram FROM public.profiles WHERE id = v_assignee;

        IF v_telegram IS NOT NULL AND v_telegram <> '' THEN
          IF left(v_telegram, 1) <> '@' THEN
            v_telegram := '@' || v_telegram;
          END IF;
          v_body_tg := v_body || E'\n' || v_telegram;
          v_metadata := jsonb_build_object('assignee_telegram', v_telegram);
        ELSE
          v_body_tg := v_body;
          v_metadata := '{}'::jsonb;
        END IF;

        PERFORM public.create_notification(
          v_assignee, v_type, v_title, v_body_tg, 'task', NEW.id, NEW.project_id, 'normal', v_actor, v_metadata);
      END LOOP;

    WHEN 'in_progress' THEN
      IF OLD.status = 'rejected' THEN
        v_type := 'task_reopened';
        v_title := 'Task reopened';
      ELSE
        v_type := 'task_started';
        v_title := 'Task started';
      END IF;
      PERFORM public.create_notification(
        NEW.created_by, v_type, v_title, v_body, 'task', NEW.id, NEW.project_id, 'normal', v_actor, '{}'::jsonb);
      FOR v_planner IN SELECT * FROM public.get_project_planners(NEW.project_id) LOOP
        PERFORM public.create_notification(
          v_planner, v_type, v_title, v_body, 'task', NEW.id, NEW.project_id, 'normal', v_actor, '{}'::jsonb);
      END LOOP;

    WHEN 'pending_approval' THEN
      v_type := 'task_submitted_for_approval';
      v_title := 'Task awaiting approval';
      v_priority := 'high';
      FOR v_planner IN SELECT * FROM public.get_project_planners(NEW.project_id) LOOP
        PERFORM public.create_notification(
          v_planner, v_type, v_title, v_body, 'task', NEW.id, NEW.project_id, v_priority, v_actor, '{}'::jsonb);
      END LOOP;

    WHEN 'approved' THEN
      v_type := 'task_approved';
      v_title := 'Task approved';
      FOR v_assignee IN
        SELECT user_id FROM public.task_assignments
        WHERE task_id = NEW.id AND unassigned_at IS NULL
      LOOP
        PERFORM public.create_notification(
          v_assignee, v_type, v_title, v_body, 'task', NEW.id, NEW.project_id, 'normal', v_actor, '{}'::jsonb);
      END LOOP;
      PERFORM public.create_notification(
        NEW.created_by, v_type, v_title, v_body, 'task', NEW.id, NEW.project_id, 'normal', v_actor, '{}'::jsonb);

    WHEN 'rejected' THEN
      v_type := 'task_rejected';
      v_title := 'Task rejected';
      v_priority := 'high';
      FOR v_assignee IN
        SELECT user_id FROM public.task_assignments
        WHERE task_id = NEW.id AND unassigned_at IS NULL
      LOOP
        PERFORM public.create_notification(
          v_assignee, v_type, v_title,
          COALESCE('Reason: ' || NEW.rejection_reason || E'\n', '') || v_body,
          'task', NEW.id, NEW.project_id, v_priority, v_actor,
          jsonb_build_object('rejection_reason', NEW.rejection_reason));
      END LOOP;

    WHEN 'completed' THEN
      v_type := 'task_completed';
      v_title := 'Task completed';
      PERFORM public.create_notification(
        NEW.created_by, v_type, v_title, v_body, 'task', NEW.id, NEW.project_id, 'normal', v_actor, '{}'::jsonb);
      FOR v_planner IN SELECT * FROM public.get_project_planners(NEW.project_id) LOOP
        PERFORM public.create_notification(
          v_planner, v_type, v_title, v_body, 'task', NEW.id, NEW.project_id, 'normal', v_actor, '{}'::jsonb);
      END LOOP;

    WHEN 'closed' THEN
      v_type := 'task_closed';
      v_title := 'Task closed';
      FOR v_assignee IN
        SELECT user_id FROM public.task_assignments
        WHERE task_id = NEW.id AND unassigned_at IS NULL
      LOOP
        PERFORM public.create_notification(
          v_assignee, v_type, v_title, v_body, 'task', NEW.id, NEW.project_id, 'low', v_actor, '{}'::jsonb);
      END LOOP;
      PERFORM public.create_notification(
        NEW.created_by, v_type, v_title, v_body, 'task', NEW.id, NEW.project_id, 'low', v_actor, '{}'::jsonb);

    ELSE
      NULL;
  END CASE;

  RETURN NEW;
END;
$$;
