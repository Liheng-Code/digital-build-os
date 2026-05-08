
-- KPI alert thresholds
CREATE TABLE public.kpi_alert_thresholds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  kpi_name text NOT NULL,
  kpi_category text NOT NULL,
  operator text NOT NULL CHECK (operator IN ('gt','lt','gte','lte','eq')),
  threshold_value numeric NOT NULL,
  severity text NOT NULL CHECK (severity IN ('info','warning','critical')),
  enabled boolean NOT NULL DEFAULT true,
  label text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, kpi_name, operator)
);
CREATE INDEX idx_kpi_alert_thresholds_project ON public.kpi_alert_thresholds(project_id);
ALTER TABLE public.kpi_alert_thresholds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view kpi thresholds"
  ON public.kpi_alert_thresholds FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins and PMs manage kpi thresholds insert"
  ON public.kpi_alert_thresholds FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'project_manager'::app_role));
CREATE POLICY "Admins and PMs manage kpi thresholds update"
  ON public.kpi_alert_thresholds FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'project_manager'::app_role));
CREATE POLICY "Admins and PMs manage kpi thresholds delete"
  ON public.kpi_alert_thresholds FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'project_manager'::app_role));

CREATE TRIGGER trg_kpi_alert_thresholds_updated_at
  BEFORE UPDATE ON public.kpi_alert_thresholds
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- KPI alert events
CREATE TABLE public.kpi_alert_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  kpi_name text NOT NULL,
  kpi_category text NOT NULL,
  actual_value numeric NOT NULL,
  threshold_value numeric NOT NULL,
  operator text NOT NULL,
  severity text NOT NULL,
  message text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_kpi_alert_events_project ON public.kpi_alert_events(project_id, created_at DESC);
ALTER TABLE public.kpi_alert_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view kpi events"
  ON public.kpi_alert_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert kpi events"
  ON public.kpi_alert_events FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update kpi events"
  ON public.kpi_alert_events FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admins and PMs can delete kpi events"
  ON public.kpi_alert_events FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'project_manager'::app_role));

-- Report schedules
CREATE TABLE public.report_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  report_type text NOT NULL,
  frequency text NOT NULL CHECK (frequency IN ('daily','weekly','monthly','quarterly')),
  day_of_week integer,
  day_of_month integer,
  recipients text[] NOT NULL DEFAULT '{}',
  format text NOT NULL CHECK (format IN ('pdf','csv','xlsx')),
  enabled boolean NOT NULL DEFAULT true,
  label text NOT NULL,
  last_sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_report_schedules_project ON public.report_schedules(project_id);
ALTER TABLE public.report_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view report schedules"
  ON public.report_schedules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins and PMs manage report schedules insert"
  ON public.report_schedules FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'project_manager'::app_role));
CREATE POLICY "Admins and PMs manage report schedules update"
  ON public.report_schedules FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'project_manager'::app_role));
CREATE POLICY "Admins and PMs manage report schedules delete"
  ON public.report_schedules FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'project_manager'::app_role));

CREATE TRIGGER trg_report_schedules_updated_at
  BEFORE UPDATE ON public.report_schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
