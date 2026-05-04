CREATE OR REPLACE FUNCTION public.update_assigned_task_limited(
  _task_id uuid,
  _title text,
  _description text,
  _priority public.task_priority,
  _planned_end date,
  _estimated_hours numeric,
  _progress_pct integer
)
RETURNS public.tasks
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _updated public.tasks;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT (
    has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'project_manager')
    OR has_role(auth.uid(), 'engineer')
    OR has_role(auth.uid(), 'supervisor')
    OR EXISTS (
      SELECT 1
      FROM public.task_assignments assignment
      WHERE assignment.task_id = _task_id
        AND assignment.user_id = auth.uid()
        AND assignment.unassigned_at IS NULL
    )
  ) THEN
    RAISE EXCEPTION 'You do not have permission to edit this task';
  END IF;

  IF length(trim(coalesce(_title, ''))) < 2 THEN
    RAISE EXCEPTION 'Task title must be at least 2 characters';
  END IF;

  IF _estimated_hours IS NULL OR _estimated_hours < 0 THEN
    RAISE EXCEPTION 'Estimated hours must be zero or greater';
  END IF;

  IF _progress_pct IS NULL OR _progress_pct < 0 OR _progress_pct > 100 THEN
    RAISE EXCEPTION 'Progress must be between 0 and 100';
  END IF;

  UPDATE public.tasks
  SET
    title = trim(_title),
    description = nullif(trim(coalesce(_description, '')), ''),
    priority = _priority,
    planned_end = _planned_end,
    estimated_hours = _estimated_hours,
    progress_pct = _progress_pct
  WHERE id = _task_id
  RETURNING * INTO _updated;

  IF _updated.id IS NULL THEN
    RAISE EXCEPTION 'Task not found';
  END IF;

  RETURN _updated;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_assigned_task_limited(
  uuid,
  text,
  text,
  public.task_priority,
  date,
  numeric,
  integer
) TO authenticated;
