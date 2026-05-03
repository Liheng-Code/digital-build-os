-- ENUMS
CREATE TYPE public.ir_status AS ENUM ('draft', 'requested', 'scheduled', 'passed', 'failed', 'passed_with_remarks');
CREATE TYPE public.checklist_result AS ENUM ('pass', 'fail', 'n/a');
CREATE TYPE public.ncr_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE public.ncr_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
CREATE TYPE public.punch_list_status AS ENUM ('open', 'resolved', 'verified');

-- CHECKLISTS
CREATE TABLE public.inspection_checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  task_type public.task_type NOT NULL,
  name text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.inspection_checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id uuid NOT NULL REFERENCES public.inspection_checklists(id) ON DELETE CASCADE,
  order_index integer NOT NULL DEFAULT 0,
  item_text text NOT NULL,
  is_required boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- INSPECTION REQUESTS (IR)
CREATE TABLE public.inspection_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  task_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL,
  request_number text NOT NULL,
  location text,
  status public.ir_status NOT NULL DEFAULT 'draft',
  requested_by uuid REFERENCES public.profiles(id),
  inspected_by uuid REFERENCES public.profiles(id),
  requested_date timestamptz NOT NULL DEFAULT now(),
  inspection_date timestamptz,
  remarks text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.inspection_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_request_id uuid NOT NULL REFERENCES public.inspection_requests(id) ON DELETE CASCADE,
  checklist_item_id uuid NOT NULL REFERENCES public.inspection_checklist_items(id) ON DELETE CASCADE,
  status public.checklist_result,
  comments text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(inspection_request_id, checklist_item_id)
);

-- NCRs
CREATE TABLE public.ncrs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  task_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL,
  inspection_request_id uuid REFERENCES public.inspection_requests(id) ON DELETE SET NULL,
  ncr_number text NOT NULL,
  issue_description text NOT NULL,
  severity public.ncr_severity NOT NULL DEFAULT 'medium',
  status public.ncr_status NOT NULL DEFAULT 'open',
  reported_by uuid REFERENCES public.profiles(id),
  assigned_to uuid REFERENCES public.profiles(id),
  corrective_action text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- PUNCH LIST
CREATE TABLE public.punch_list_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  task_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL,
  inspection_request_id uuid REFERENCES public.inspection_requests(id) ON DELETE SET NULL,
  location text,
  description text NOT NULL,
  status public.punch_list_status NOT NULL DEFAULT 'open',
  created_by uuid REFERENCES public.profiles(id),
  resolved_by uuid REFERENCES public.profiles(id),
  verified_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- UPDATE TRIGGERS
CREATE TRIGGER update_inspection_checklists_updated_at
BEFORE UPDATE ON public.inspection_checklists
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inspection_requests_updated_at
BEFORE UPDATE ON public.inspection_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inspection_results_updated_at
BEFORE UPDATE ON public.inspection_results
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ncrs_updated_at
BEFORE UPDATE ON public.ncrs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_punch_list_items_updated_at
BEFORE UPDATE ON public.punch_list_items
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- Trigger to auto-create punch list
CREATE OR REPLACE FUNCTION public.process_failed_inspection()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.status IN ('failed', 'passed_with_remarks') AND OLD.status NOT IN ('failed', 'passed_with_remarks') THEN
    INSERT INTO public.punch_list_items (
      project_id, task_id, inspection_request_id, location, description, status, created_by
    ) VALUES (
      NEW.project_id, NEW.task_id, NEW.id, NEW.location, 
      'Auto-generated from IR ' || NEW.request_number || ' (' || NEW.status || ')', 
      'open', NEW.inspected_by
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_process_failed_inspection
AFTER UPDATE OF status ON public.inspection_requests
FOR EACH ROW EXECUTE FUNCTION public.process_failed_inspection();


-- Trigger to block successor tasks
CREATE OR REPLACE FUNCTION public.validate_task_successor_holds()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  has_hold boolean;
BEGIN
  IF NEW.status IN ('in_progress', 'completed') AND OLD.status NOT IN ('in_progress', 'completed') THEN
    SELECT EXISTS (
      SELECT 1 
      FROM public.task_predecessors tp
      WHERE tp.task_id = NEW.id
      AND (
        EXISTS (
          SELECT 1 FROM public.inspection_requests ir 
          WHERE ir.task_id = tp.predecessor_id AND ir.status = 'failed'
        )
        OR
        EXISTS (
          SELECT 1 FROM public.ncrs n 
          WHERE n.task_id = tp.predecessor_id AND n.status IN ('open', 'in_progress')
        )
        OR
        EXISTS (
          SELECT 1 FROM public.punch_list_items p 
          WHERE p.task_id = tp.predecessor_id AND p.status = 'open'
        )
      )
    ) INTO has_hold;

    IF has_hold THEN
      RAISE EXCEPTION 'Cannot start or complete task: A predecessor has an unresolved QA/QC hold (Failed IR, Open NCR, or Open Punch List).';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_task_successor_holds
BEFORE UPDATE OF status ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.validate_task_successor_holds();


-- RLS POLICIES
ALTER TABLE public.inspection_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ncrs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.punch_list_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view QAQC" ON public.inspection_checklists FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can view QAQC" ON public.inspection_checklist_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can view QAQC" ON public.inspection_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can view QAQC" ON public.inspection_results FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can view QAQC" ON public.ncrs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can view QAQC" ON public.punch_list_items FOR SELECT TO authenticated USING (true);

-- Allow all authenticated users to create/update IRs and Punch lists
-- (In a real app, you'd restrict 'approve' to qaqc_inspector, but keeping it open for now)
CREATE POLICY "Users can manage QAQC" ON public.inspection_checklists FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Users can manage QAQC" ON public.inspection_checklist_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Users can manage QAQC" ON public.inspection_requests FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Users can manage QAQC" ON public.inspection_results FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Users can manage QAQC" ON public.ncrs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Users can manage QAQC" ON public.punch_list_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
