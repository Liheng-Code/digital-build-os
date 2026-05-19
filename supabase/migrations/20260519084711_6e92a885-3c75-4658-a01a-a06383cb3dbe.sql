-- Remove the duplicate 'Task assigned' notification path from notify_task_status_change.
-- The notify_task_assignment trigger on task_assignments is the single source of truth.
-- Also add card_message_id to telegram_conversation_state for in-place card editing.

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
  v_type public.notification_type;
  v_priority public.notification_priority := 'normal';
BEGIN
  IF NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;

  v_body := COALESCE(NEW.code || ' — ', '') || NEW.title;

  CASE NEW.status
    WHEN 'assigned' THEN
      -- Intentionally skipped: notify_task_assignment trigger handles this per assignee.
      NULL;

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

ALTER TABLE public.telegram_conversation_state
  ADD COLUMN IF NOT EXISTS card_message_id BIGINT;