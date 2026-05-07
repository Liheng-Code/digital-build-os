
-- ============================================================
-- MODULE 9: CONSTRUCTION MANAGEMENT MODULE
-- Aligned with DCOS System Architecture Module Design R0
-- Section 14: Module 9 — Construction Management Module
-- ============================================================

-- 1. Construction Enums (per Module 14.3 Task Status Flow)
CREATE TYPE public.construction_task_status AS ENUM (
  'open', 
  'assigned', 
  'in_progress', 
  'completed', 
  'submitted_for_approval', 
  'approved', 
  'closed', 
  'rejected', 
  'on_hold'
);

CREATE TYPE public.construction_task_priority AS ENUM ('low', 'medium', 'high', 'critical');

CREATE TYPE public.site_issue_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE public.site_issue_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');

CREATE TYPE public.inspection_result AS ENUM ('pass', 'fail', 'conditional_pass');
CREATE TYPE public.concrete_grade AS ENUM ('C20', 'C25', 'C30', 'C35', 'C40', 'C45', 'C50', 'Other');

-- 2. Construction Tasks (per Module 14.2 Main Features, 14.3 Status Flow)
-- Extends generic tasks with construction-specific fields
CREATE TABLE public.construction_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  wbs_node_id UUID REFERENCES public.wbs_nodes(id) ON DELETE SET NULL,
  
  task_code TEXT NOT NULL, -- e.g. CON-B01-L05-T001
  title TEXT NOT NULL,
  description TEXT,
  
  status public.construction_task_status NOT NULL DEFAULT 'open',
  priority public.construction_task_priority NOT NULL DEFAULT 'medium',
  
  planned_start DATE,
  planned_finish DATE,
  actual_start DATE,
  actual_finish DATE,
  
  progress_pct NUMERIC(5,2) DEFAULT 0 CHECK (progress_pct BETWEEN 0 AND 100),
  
  -- Dependency (per Module 14.4: check dependency)
  depends_on_task_id UUID REFERENCES public.construction_tasks(id) ON DELETE SET NULL,
  
  -- Assignment
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ,
  
  -- Approval workflow (per Module 14.3, Section 24.1)
  submitted_at TIMESTAMPTZ,
  submitted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  rejection_reason TEXT,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- WBS progress roll-up (per Module 8.4, 8.6)
  UNIQUE(project_id, task_code)
);

-- 3. Site Issue Log (per Module 14.2: "Issue log")
CREATE TABLE public.site_issue_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  wbs_node_id UUID REFERENCES public.wbs_nodes(id) ON DELETE SET NULL,
  
  issue_number TEXT NOT NULL, -- e.g. ISS-B01-001
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  
  severity public.site_issue_severity NOT NULL DEFAULT 'medium',
  status public.site_issue_status NOT NULL DEFAULT 'open',
  
  -- Link to related records
  related_task_id UUID REFERENCES public.construction_tasks(id) ON DELETE SET NULL,
  related_inspection_id UUID, -- Will reference work_inspection_requests after creation
  
  reported_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  
  -- Auto-create NCR in QA/QC (per Module 12 integration)
  qaqc_ncr_id UUID, -- Will reference qaqc_ncrs after creation
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(project_id, issue_number)
);

-- 4. Work Inspection Requests (per Module 14.2: "Work inspection request")
CREATE TABLE public.work_inspection_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  wbs_node_id UUID REFERENCES public.wbs_nodes(id) ON DELETE SET NULL,
  
  inspection_number TEXT NOT NULL, -- e.g. IR-B01-L05-001
  title TEXT NOT NULL,
  description TEXT,
  
  -- Link to construction task (per Module 14.4: submit→QA/QC inspection)
  construction_task_id UUID REFERENCES public.construction_tasks(id) ON DELETE SET NULL,
  
  -- QA/QC Integration (per Module 12.3 QA/QC Workflow)
  -- Links to ITP (Inspection and Test Plan)
  qaqc_itp_id UUID, -- Will reference qaqc_itps after creation
  
  requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  scheduled_date DATE,
  inspector_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  result public.inspection_result,
  inspection_notes TEXT,
  inspected_at TIMESTAMPTZ,
  
  -- If failed → auto-create NCR (per Module 12 integration)
  qaqc_ncr_id UUID, -- Will reference qaqc_ncrs after creation
  
  status TEXT NOT NULL DEFAULT 'pending', -- pending, in_progress, completed, cancelled
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(project_id, inspection_number)
);

-- 5. Concrete Pour Records (per Module 14.2: "Concrete pour record")
CREATE TABLE public.concrete_pour_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  wbs_node_id UUID REFERENCES public.wbs_nodes(id) ON DELETE SET NULL,
  
  pour_number TEXT NOT NULL, -- e.g. POUR-B01-L05-001
  pour_date DATE NOT NULL,
  
  concrete_grade public.concrete_grade NOT NULL DEFAULT 'C30',
  custom_grade TEXT, -- If grade = 'Other'
  
  quantity_m3 NUMERIC(10,2),
  slump_mm INTEGER,
  temperature_celsius NUMERIC(4,1),
  
  -- Test cylinders
  cylinder_count INTEGER DEFAULT 0,
  cylinder_ids TEXT[], -- Array of cylinder IDs for tracking
  
  -- Link to task
  construction_task_id UUID REFERENCES public.construction_tasks(id) ON DELETE SET NULL,
  
  -- Weather conditions
  weather_condition TEXT,
  ambient_temperature NUMERIC(4,1),
  
  supervised_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(project_id, pour_number)
);

-- 6. Site Photo Log (per Module 14.2: "Site photo log")
CREATE TABLE public.site_photo_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  wbs_node_id UUID REFERENCES public.wbs_nodes(id) ON DELETE SET NULL,
  
  photo_date DATE NOT NULL DEFAULT CURRENT_DATE,
  file_path TEXT NOT NULL, -- Supabase Storage path
  file_name TEXT NOT NULL,
  file_size_bytes BIGINT,
  mime_type TEXT,
  
  -- Link to various records
  construction_task_id UUID REFERENCES public.construction_tasks(id) ON DELETE SET NULL,
  daily_report_id UUID REFERENCES public.daily_site_reports(id) ON DELETE SET NULL,
  inspection_id UUID REFERENCES public.work_inspection_requests(id) ON DELETE SET NULL,
  pour_id UUID REFERENCES public.concrete_pour_records(id) ON DELETE SET NULL,
  
  description TEXT,
  tags TEXT[], -- e.g. ['progress', 'safety', 'pour', 'inspection']
  
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(file_path)
);

-- 7. Material Usage Logs (Construction-specific, per Module 14.2: "Material usage")
-- Links to Procurement Module (PO) and Inventory Module (stock issues)
CREATE TABLE public.construction_material_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  wbs_node_id UUID REFERENCES public.wbs_nodes(id) ON DELETE SET NULL,
  
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Material info
  material_name TEXT NOT NULL,
  quantity NUMERIC(10,2) NOT NULL,
  uom TEXT NOT NULL, -- Unit of Measure
  
  -- Links to other modules (per Module 9 Cross-Module Integration)
  po_id UUID, -- References procurement PO (Module 13)
  grn_id UUID, -- References GRN (Goods Received Note)
  stock_issue_id UUID, -- References inventory stock issue (Module 19)
  
  -- Link to task
  construction_task_id UUID REFERENCES public.construction_tasks(id) ON DELETE SET NULL,
  daily_report_id UUID REFERENCES public.daily_site_reports(id) ON DELETE SET NULL,
  
  used_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Indexes for performance
CREATE INDEX idx_construction_tasks_project ON public.construction_tasks(project_id);
CREATE INDEX idx_construction_tasks_wbs ON public.construction_tasks(wbs_node_id);
CREATE INDEX idx_construction_tasks_status ON public.construction_tasks(status);
CREATE INDEX idx_construction_tasks_assigned ON public.construction_tasks(assigned_to);
CREATE INDEX idx_construction_tasks_depends ON public.construction_tasks(depends_on_task_id);

CREATE INDEX idx_site_issue_logs_project ON public.site_issue_logs(project_id);
CREATE INDEX idx_site_issue_logs_wbs ON public.site_issue_logs(wbs_node_id);
CREATE INDEX idx_site_issue_logs_status ON public.site_issue_logs(status);
CREATE INDEX idx_site_issue_logs_severity ON public.site_issue_logs(severity);

CREATE INDEX idx_work_inspection_requests_project ON public.work_inspection_requests(project_id);
CREATE INDEX idx_work_inspection_requests_task ON public.work_inspection_requests(construction_task_id);
CREATE INDEX idx_work_inspection_requests_status ON public.work_inspection_requests(status);

CREATE INDEX idx_concrete_pour_records_project ON public.concrete_pour_records(project_id);
CREATE INDEX idx_concrete_pour_records_wbs ON public.concrete_pour_records(wbs_node_id);
CREATE INDEX idx_concrete_pour_records_date ON public.concrete_pour_records(pour_date);

CREATE INDEX idx_site_photo_logs_project ON public.site_photo_logs(project_id);
CREATE INDEX idx_site_photo_logs_wbs ON public.site_photo_logs(wbs_node_id);
CREATE INDEX idx_site_photo_logs_date ON public.site_photo_logs(photo_date);

CREATE INDEX idx_construction_material_usage_project ON public.construction_material_usage(project_id);
CREATE INDEX idx_construction_material_usage_wbs ON public.construction_material_usage(wbs_node_id);
CREATE INDEX idx_construction_material_usage_date ON public.construction_material_usage(usage_date);

-- 9. RLS (Row Level Security) Policies
ALTER TABLE public.construction_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_issue_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_inspection_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concrete_pour_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_photo_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.construction_material_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies using existing check_permission function (per Module 9, Section 9)
CREATE POLICY "Users can view construction tasks" ON public.construction_tasks 
  FOR SELECT TO authenticated USING (public.check_permission(auth.uid(), 'construction', 'view'));

CREATE POLICY "Authorized users can manage construction tasks" ON public.construction_tasks 
  FOR ALL TO authenticated USING (public.check_permission(auth.uid(), 'construction', 'view'));

CREATE POLICY "Users can view site issues" ON public.site_issue_logs 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authorized users can manage site issues" ON public.site_issue_logs 
  FOR ALL TO authenticated USING (public.check_permission(auth.uid(), 'construction', 'view'));

CREATE POLICY "Users can view inspection requests" ON public.work_inspection_requests 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authorized users can manage inspections" ON public.work_inspection_requests 
  FOR ALL TO authenticated USING (public.check_permission(auth.uid(), 'construction', 'view'));

CREATE POLICY "Users can view concrete pours" ON public.concrete_pour_records 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authorized users can manage concrete pours" ON public.concrete_pour_records 
  FOR ALL TO authenticated USING (public.check_permission(auth.uid(), 'construction', 'view'));

CREATE POLICY "Users can view site photos" ON public.site_photo_logs 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authorized users can upload photos" ON public.site_photo_logs 
  FOR ALL TO authenticated USING (public.check_permission(auth.uid(), 'construction', 'view'));

CREATE POLICY "Users can view material usage" ON public.construction_material_usage 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authorized users can log material usage" ON public.construction_material_usage 
  FOR ALL TO authenticated USING (public.check_permission(auth.uid(), 'construction', 'view'));

-- 10. Trigger for updated_at columns
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_construction_tasks_updated_at BEFORE UPDATE ON public.construction_tasks 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_site_issue_logs_updated_at BEFORE UPDATE ON public.site_issue_logs 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_work_inspection_requests_updated_at BEFORE UPDATE ON public.work_inspection_requests 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_concrete_pour_records_updated_at BEFORE UPDATE ON public.concrete_pour_records 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_construction_material_usage_updated_at BEFORE UPDATE ON public.construction_material_usage 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 11. Audit Trail Triggers (per Section 24.3/24.4)
CREATE TRIGGER trg_audit_construction_tasks AFTER INSERT OR UPDATE OR DELETE ON public.construction_tasks 
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

CREATE TRIGGER trg_audit_site_issue_logs AFTER INSERT OR UPDATE OR DELETE ON public.site_issue_logs 
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

CREATE TRIGGER trg_audit_work_inspection_requests AFTER INSERT OR UPDATE OR DELETE ON public.work_inspection_requests 
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

CREATE TRIGGER trg_audit_concrete_pour_records AFTER INSERT OR UPDATE OR DELETE ON public.concrete_pour_records 
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- 12. WBS Progress Roll-up Trigger (per Module 8.4, 8.6, uses existing function)
-- Link construction task progress to WBS progress roll-up
CREATE OR REPLACE FUNCTION public.trg_fn_construction_task_progress_rollup()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.progress_pct IS DISTINCT FROM NEW.progress_pct) OR (TG_OP = 'INSERT') THEN
    IF NEW.wbs_node_id IS NOT NULL THEN
      PERFORM public.wbs_roll_up_node_progress(NEW.wbs_node_id);
    END IF;
  ELSIF (TG_OP = 'DELETE' AND OLD.wbs_node_id IS NOT NULL) THEN
    PERFORM public.wbs_roll_up_node_progress(OLD.wbs_node_id);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_construction_task_progress_rollup
AFTER INSERT OR UPDATE OF progress_pct OR DELETE ON public.construction_tasks
FOR EACH ROW EXECUTE FUNCTION public.trg_fn_construction_task_progress_rollup();

-- 13. Task Status Flow Validation (per Module 14.3)
CREATE OR REPLACE FUNCTION public.validate_construction_task_status_transition()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent progress update if status is not appropriate
  IF NEW.progress_pct > 0 AND OLD.status IN ('open', 'closed') THEN
    RAISE EXCEPTION 'Cannot update progress for task with status %', OLD.status;
  END IF;
  
  -- Cannot submit if progress < 100%
  IF NEW.status = 'submitted_for_approval' AND NEW.progress_pct < 100 THEN
    RAISE EXCEPTION 'Cannot submit task for approval with progress less than 100%%';
  END IF;
  
  -- Check dependency: cannot start if dependency not completed
  IF NEW.status = 'in_progress' AND NEW.depends_on_task_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.construction_tasks 
      WHERE id = NEW.depends_on_task_id 
      AND status IN ('completed', 'approved', 'closed')
    ) THEN
      RAISE EXCEPTION 'Cannot start task: dependency task is not completed';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_task_status BEFORE UPDATE ON public.construction_tasks
  FOR EACH ROW EXECUTE FUNCTION public.validate_construction_task_status_transition();

-- 14. Comments for documentation
COMMENT ON TABLE public.construction_tasks IS 'Construction site tasks per Module 9. Implements status flow: Open→Assigned→In Progress→Completed→Submitted→Approved→Closed';
COMMENT ON TABLE public.site_issue_logs IS 'Site issue log per Module 14.2. Can auto-create QA/QC NCR when critical.';
COMMENT ON TABLE public.work_inspection_requests IS 'Work inspection requests per Module 14.2. Links to QA/QC ITP, triggers NCR if failed.';
COMMENT ON TABLE public.concrete_pour_records IS 'Concrete pour records per Module 14.2. Tracks pour details, test cylinders, weather.';
COMMENT ON TABLE public.site_photo_logs IS 'Site photo log per Module 14.2. Photos linked to tasks, reports, inspections, pours.';
COMMENT ON TABLE public.construction_material_usage IS 'Material usage logs per Module 14.2. Links to Procurement PO and Inventory stock issues.';
