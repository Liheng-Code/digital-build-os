CREATE OR REPLACE FUNCTION public.post_task_progress_update(
  _task_id uuid,
  _progress_pct integer,
  _hours_worked numeric,
  _note text,
  _is_blocker boolean
)
RETURNS public.tasks
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _current public.tasks;
  _updated public.tasks;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT *
  INTO _current
  FROM public.tasks
  WHERE id = _task_id;

  IF _current.id IS NULL THEN
    RAISE EXCEPTION 'Task not found';
  END IF;

  IF NOT (
    has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'project_manager')
    OR has_role(auth.uid(), 'supervisor')
    OR EXISTS (
      SELECT 1
      FROM public.task_assignments assignment
      WHERE assignment.task_id = _task_id
        AND assignment.user_id = auth.uid()
        AND assignment.unassigned_at IS NULL
    )
  ) THEN
    RAISE EXCEPTION 'You do not have permission to post an update for this task';
  END IF;

  IF _progress_pct IS NULL OR _progress_pct < 0 OR _progress_pct > 100 THEN
    RAISE EXCEPTION 'Progress must be between 0 and 100';
  END IF;

  IF _hours_worked IS NULL OR _hours_worked < 0 THEN
    RAISE EXCEPTION 'Hours worked must be zero or greater';
  END IF;

  IF nullif(trim(coalesce(_note, '')), '') IS NULL
    AND _hours_worked = 0
    AND _progress_pct = _current.progress_pct THEN
    RAISE EXCEPTION 'Add a note, hours, or progress change';
  END IF;

  INSERT INTO public.task_updates (
    task_id,
    user_id,
    progress_pct,
    hours_worked,
    note,
    is_blocker
  )
  VALUES (
    _task_id,
    auth.uid(),
    _progress_pct,
    _hours_worked,
    nullif(trim(coalesce(_note, '')), ''),
    coalesce(_is_blocker, false)
  );

  UPDATE public.tasks
  SET
    progress_pct = _progress_pct,
    actual_hours = coalesce(actual_hours, 0) + _hours_worked
  WHERE id = _task_id
  RETURNING * INTO _updated;

  RETURN _updated;
END;
$$;

GRANT EXECUTE ON FUNCTION public.post_task_progress_update(
  uuid,
  integer,
  numeric,
  text,
  boolean
) TO authenticated;
