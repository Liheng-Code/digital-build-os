
-- Add new notification type for task receipt acknowledgements
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'task_received';

-- Allow the new 'received' transitions in the task status machine
CREATE OR REPLACE FUNCTION public.validate_task_status_transition()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  allowed boolean := false;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status NOT IN ('open','assigned') THEN
      RAISE EXCEPTION 'New tasks must start as open or assigned (got %)', NEW.status;
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;

  allowed := CASE
    WHEN OLD.status = 'open' AND NEW.status IN ('assigned','closed') THEN true
    WHEN OLD.status = 'assigned' AND NEW.status IN ('received','in_progress','open','closed') THEN true
    WHEN OLD.status = 'received' AND NEW.status IN ('in_progress','assigned','closed') THEN true
    WHEN OLD.status = 'in_progress' AND NEW.status IN ('pending_approval','assigned','closed') THEN true
    WHEN OLD.status = 'pending_approval' AND NEW.status IN ('approved','rejected') THEN true
    WHEN OLD.status = 'approved' AND NEW.status IN ('completed','closed') THEN true
    WHEN OLD.status = 'rejected' AND NEW.status IN ('in_progress','assigned') THEN true
    WHEN OLD.status = 'completed' AND NEW.status IN ('closed') THEN true
    ELSE false
  END;

  IF NOT allowed THEN
    RAISE EXCEPTION 'Invalid status transition: % -> %', OLD.status, NEW.status;
  END IF;

  IF NEW.status IN ('approved','rejected') THEN
    IF NOT (
      has_role(auth.uid(),'admin') OR
      has_role(auth.uid(),'project_manager') OR
      has_role(auth.uid(),'supervisor') OR
      has_role(auth.uid(),'qaqc_inspector')
    ) THEN
      RAISE EXCEPTION 'Only supervisors/PMs/admins/QA can approve or reject';
    END IF;
    NEW.approved_by := auth.uid();
    NEW.approved_at := now();
  END IF;

  INSERT INTO public.task_status_history(task_id, from_status, to_status, changed_by)
  VALUES (NEW.id, OLD.status, NEW.status, auth.uid());

  RETURN NEW;
END;
$function$;
