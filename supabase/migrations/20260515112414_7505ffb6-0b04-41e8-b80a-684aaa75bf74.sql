
CREATE TABLE IF NOT EXISTS public.labor_catalogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  role_name TEXT NOT NULL,
  standard_rate NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, role_name)
);

CREATE TABLE IF NOT EXISTS public.task_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  labor_role_id UUID NOT NULL REFERENCES public.labor_catalogs(id) ON DELETE CASCADE,
  planned_count INTEGER NOT NULL DEFAULT 1,
  planned_man_hours NUMERIC NOT NULL DEFAULT 0,
  actual_man_hours NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(task_id, labor_role_id)
);

CREATE INDEX IF NOT EXISTS idx_labor_catalogs_project ON public.labor_catalogs(project_id);
CREATE INDEX IF NOT EXISTS idx_task_resources_task ON public.task_resources(task_id);
CREATE INDEX IF NOT EXISTS idx_task_resources_role ON public.task_resources(labor_role_id);

ALTER TABLE public.labor_catalogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view labor catalogs" ON public.labor_catalogs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins and PMs manage labor catalogs" ON public.labor_catalogs FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'project_manager'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'project_manager'::app_role));

CREATE POLICY "Authenticated can view task resources" ON public.task_resources FOR SELECT TO authenticated USING (true);
CREATE POLICY "Planners manage task resources" ON public.task_resources FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'project_manager'::app_role) OR has_role(auth.uid(), 'engineer'::app_role) OR has_role(auth.uid(), 'supervisor'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'project_manager'::app_role) OR has_role(auth.uid(), 'engineer'::app_role) OR has_role(auth.uid(), 'supervisor'::app_role));

CREATE TRIGGER update_labor_catalogs_updated_at BEFORE UPDATE ON public.labor_catalogs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_task_resources_updated_at BEFORE UPDATE ON public.task_resources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
