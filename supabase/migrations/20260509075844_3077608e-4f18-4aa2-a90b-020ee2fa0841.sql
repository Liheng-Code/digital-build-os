-- Enums
DO $$ BEGIN
  CREATE TYPE public.schedule_constraint_type AS ENUM ('ASAP','ALAP','SNET','SNLT','FNET','FNLT','MSO','MFO');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Calendars
CREATE TABLE public.calendars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  working_days smallint NOT NULL DEFAULT 62, -- bitmask Mon=1<<0 .. Sun=1<<6; default Mon-Fri=0b0011111=31, but use 62 for Sun-Thu (Mon=2..Fri=32)
  hours_per_day numeric(4,2) NOT NULL DEFAULT 8,
  timezone text NOT NULL DEFAULT 'UTC',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id, name)
);
CREATE INDEX calendars_project_idx ON public.calendars(project_id);

CREATE TABLE public.calendar_exceptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_id uuid NOT NULL REFERENCES public.calendars(id) ON DELETE CASCADE,
  exception_date date NOT NULL,
  is_working boolean NOT NULL DEFAULT false,
  hours numeric(4,2),
  label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(calendar_id, exception_date)
);
CREATE INDEX calendar_exceptions_calendar_idx ON public.calendar_exceptions(calendar_id);

-- Baselines
CREATE TABLE public.wbs_baselines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  label text NOT NULL,
  notes text,
  is_active boolean NOT NULL DEFAULT false,
  captured_by uuid,
  captured_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id, label)
);
CREATE INDEX wbs_baselines_project_idx ON public.wbs_baselines(project_id);
CREATE UNIQUE INDEX wbs_baselines_one_active_per_project
  ON public.wbs_baselines(project_id) WHERE is_active = true;

CREATE TABLE public.wbs_baseline_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  baseline_id uuid NOT NULL REFERENCES public.wbs_baselines(id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  planned_start date,
  planned_end date,
  estimated_hours numeric(8,2),
  progress_pct integer,
  UNIQUE(baseline_id, task_id)
);
CREATE INDEX wbs_baseline_tasks_baseline_idx ON public.wbs_baseline_tasks(baseline_id);
CREATE INDEX wbs_baseline_tasks_task_idx ON public.wbs_baseline_tasks(task_id);

-- Constraints
CREATE TABLE public.task_constraints (
  task_id uuid PRIMARY KEY REFERENCES public.tasks(id) ON DELETE CASCADE,
  constraint_type public.schedule_constraint_type NOT NULL DEFAULT 'ASAP',
  constraint_date date,
  deadline_date date,
  calendar_id uuid REFERENCES public.calendars(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- CPM cache
CREATE TABLE public.task_schedule_calc (
  task_id uuid PRIMARY KEY REFERENCES public.tasks(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  early_start date,
  early_finish date,
  late_start date,
  late_finish date,
  total_float integer,
  free_float integer,
  is_critical boolean NOT NULL DEFAULT false,
  calculated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX task_schedule_calc_project_idx ON public.task_schedule_calc(project_id);
CREATE INDEX task_schedule_calc_critical_idx ON public.task_schedule_calc(project_id) WHERE is_critical;

-- Saved views
CREATE TABLE public.wbs_saved_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  name text NOT NULL,
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  columns jsonb NOT NULL DEFAULT '[]'::jsonb,
  zoom text,
  is_shared boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX wbs_saved_views_project_idx ON public.wbs_saved_views(project_id);
CREATE INDEX wbs_saved_views_user_idx ON public.wbs_saved_views(user_id);

-- updated_at triggers
CREATE TRIGGER calendars_set_updated_at BEFORE UPDATE ON public.calendars
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER task_constraints_set_updated_at BEFORE UPDATE ON public.task_constraints
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER wbs_saved_views_set_updated_at BEFORE UPDATE ON public.wbs_saved_views
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wbs_baselines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wbs_baseline_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_constraints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_schedule_calc ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wbs_saved_views ENABLE ROW LEVEL SECURITY;

-- Helper macro: planners (admin or PM)
-- Calendars
CREATE POLICY "view calendars" ON public.calendars FOR SELECT TO authenticated USING (true);
CREATE POLICY "manage calendars" ON public.calendars FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'project_manager'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'project_manager'::app_role));

CREATE POLICY "view calendar exceptions" ON public.calendar_exceptions FOR SELECT TO authenticated USING (true);
CREATE POLICY "manage calendar exceptions" ON public.calendar_exceptions FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'project_manager'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'project_manager'::app_role));

-- Baselines
CREATE POLICY "view baselines" ON public.wbs_baselines FOR SELECT TO authenticated USING (true);
CREATE POLICY "manage baselines" ON public.wbs_baselines FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'project_manager'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'project_manager'::app_role));

CREATE POLICY "view baseline tasks" ON public.wbs_baseline_tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "manage baseline tasks" ON public.wbs_baseline_tasks FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'project_manager'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'project_manager'::app_role));

-- Constraints
CREATE POLICY "view task constraints" ON public.task_constraints FOR SELECT TO authenticated USING (true);
CREATE POLICY "manage task constraints" ON public.task_constraints FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'project_manager'::app_role) OR has_role(auth.uid(),'engineer'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'project_manager'::app_role) OR has_role(auth.uid(),'engineer'::app_role));

-- CPM cache (read all; write via service role / SQL function)
CREATE POLICY "view schedule calc" ON public.task_schedule_calc FOR SELECT TO authenticated USING (true);
CREATE POLICY "manage schedule calc" ON public.task_schedule_calc FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'project_manager'::app_role) OR has_role(auth.uid(),'engineer'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'project_manager'::app_role) OR has_role(auth.uid(),'engineer'::app_role));

-- Saved views
CREATE POLICY "view saved views" ON public.wbs_saved_views FOR SELECT TO authenticated
  USING (is_shared OR user_id = auth.uid());
CREATE POLICY "insert saved views" ON public.wbs_saved_views FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "update own saved views" ON public.wbs_saved_views FOR UPDATE TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "delete own saved views" ON public.wbs_saved_views FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ============================================
-- Functions
-- ============================================

-- Working day check for a calendar
CREATE OR REPLACE FUNCTION public.is_working_day(_calendar_id uuid, _d date)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE
  cal record;
  exc record;
  dow int;
  bit int;
BEGIN
  SELECT * INTO cal FROM calendars WHERE id = _calendar_id;
  IF cal IS NULL THEN
    -- Default: Mon-Fri working
    dow := EXTRACT(ISODOW FROM _d)::int; -- 1=Mon..7=Sun
    RETURN dow BETWEEN 1 AND 5;
  END IF;
  SELECT * INTO exc FROM calendar_exceptions WHERE calendar_id=_calendar_id AND exception_date=_d;
  IF exc IS NOT NULL THEN RETURN exc.is_working; END IF;
  dow := EXTRACT(ISODOW FROM _d)::int; -- 1..7
  bit := 1 << (dow - 1);
  RETURN (cal.working_days::int & bit) <> 0;
END;
$$;

-- Add working days to a date
CREATE OR REPLACE FUNCTION public.add_working_days(_calendar_id uuid, _start date, _days int)
RETURNS date LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE
  d date := _start;
  remaining int := _days;
BEGIN
  IF _days <= 0 THEN RETURN _start; END IF;
  WHILE remaining > 0 LOOP
    d := d + 1;
    IF is_working_day(_calendar_id, d) THEN remaining := remaining - 1; END IF;
  END LOOP;
  RETURN d;
END;
$$;

-- Capture a baseline (snapshot all tasks in a project)
CREATE OR REPLACE FUNCTION public.capture_baseline(_project_id uuid, _label text, _notes text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  bid uuid;
BEGIN
  INSERT INTO wbs_baselines(project_id, label, notes, captured_by)
    VALUES (_project_id, _label, _notes, auth.uid())
    RETURNING id INTO bid;
  INSERT INTO wbs_baseline_tasks(baseline_id, task_id, planned_start, planned_end, estimated_hours, progress_pct)
    SELECT bid, id, planned_start, planned_end, estimated_hours, progress_pct
    FROM tasks WHERE project_id = _project_id;
  RETURN bid;
END;
$$;

-- Set active baseline (only one per project)
CREATE OR REPLACE FUNCTION public.set_active_baseline(_baseline_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  pid uuid;
BEGIN
  SELECT project_id INTO pid FROM wbs_baselines WHERE id = _baseline_id;
  IF pid IS NULL THEN RAISE EXCEPTION 'Baseline not found'; END IF;
  UPDATE wbs_baselines SET is_active = false WHERE project_id = pid;
  UPDATE wbs_baselines SET is_active = true WHERE id = _baseline_id;
END;
$$;

-- CPM recalc (in-database PL/pgSQL implementation)
CREATE OR REPLACE FUNCTION public.cpm_recalc(_project_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  proj_finish date;
BEGIN
  -- Wipe existing cache for this project
  DELETE FROM task_schedule_calc WHERE project_id = _project_id;

  -- Forward pass: seed early_start/early_finish from planned dates as a simple baseline.
  -- (A full topological CPM is implemented in the edge function; this DB function gives
  -- a reasonable cache so the UI works even when the edge function hasn't run.)
  INSERT INTO task_schedule_calc(task_id, project_id, early_start, early_finish, late_start, late_finish, total_float, free_float, is_critical)
  SELECT
    t.id,
    t.project_id,
    t.planned_start,
    t.planned_end,
    t.planned_start,
    t.planned_end,
    0,
    0,
    false
  FROM tasks t
  WHERE t.project_id = _project_id
    AND t.planned_start IS NOT NULL
    AND t.planned_end IS NOT NULL;

  -- Mark tasks with no successors and latest finish as critical fallback
  SELECT MAX(planned_end) INTO proj_finish FROM tasks WHERE project_id = _project_id;
  IF proj_finish IS NOT NULL THEN
    UPDATE task_schedule_calc tsc
       SET is_critical = true
      FROM tasks t
     WHERE tsc.task_id = t.id
       AND t.project_id = _project_id
       AND t.planned_end = proj_finish;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_working_day(uuid, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_working_days(uuid, date, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.capture_baseline(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_active_baseline(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cpm_recalc(uuid) TO authenticated;