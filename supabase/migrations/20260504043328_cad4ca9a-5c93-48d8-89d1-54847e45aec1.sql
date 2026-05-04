-- ============================================================
-- Consolidated re-application: Materials, QA/QC, Financials modules
-- Original 3 migrations failed (financials view referenced non-existent
-- tables) and rolled back. Re-applying with fixes.
-- ============================================================

-- ============= MATERIALS MODULE =============
DO $$ BEGIN
  CREATE TYPE public.mr_status AS ENUM ('draft', 'pending_approval', 'approved', 'rejected', 'ordered', 'fulfilled');
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE TYPE public.po_status AS ENUM ('draft', 'issued', 'partially_received', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.boq_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  task_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE,
  material_name text NOT NULL,
  uom text NOT NULL,
  planned_qty numeric(12,2) NOT NULL DEFAULT 0,
  unit_cost numeric(12,2) NOT NULL DEFAULT 0,
  total_cost numeric(12,2) GENERATED ALWAYS AS (planned_qty * unit_cost) STORED,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_boq_items_project ON public.boq_items(project_id);
CREATE INDEX IF NOT EXISTS idx_boq_items_task ON public.boq_items(task_id);
ALTER TABLE public.boq_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view boq_items" ON public.boq_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Planners can manage boq_items" ON public.boq_items FOR ALL TO authenticated USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'project_manager') OR has_role(auth.uid(),'engineer'));

CREATE TABLE IF NOT EXISTS public.material_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  request_number text NOT NULL,
  requested_by uuid NOT NULL REFERENCES public.profiles(id),
  request_date date NOT NULL DEFAULT CURRENT_DATE,
  required_date date NOT NULL,
  status public.mr_status NOT NULL DEFAULT 'draft',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mr_project ON public.material_requests(project_id);
ALTER TABLE public.material_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view material_requests" ON public.material_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create material_requests" ON public.material_requests FOR INSERT TO authenticated WITH CHECK (requested_by = auth.uid());
CREATE POLICY "Users can update own draft MRs" ON public.material_requests FOR UPDATE TO authenticated USING (requested_by = auth.uid() AND status = 'draft');
CREATE POLICY "PMs can approve MRs" ON public.material_requests FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'project_manager'));

CREATE TABLE IF NOT EXISTS public.material_request_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mr_id uuid NOT NULL REFERENCES public.material_requests(id) ON DELETE CASCADE,
  boq_id uuid REFERENCES public.boq_items(id) ON DELETE SET NULL,
  task_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL,
  material_name text NOT NULL,
  uom text NOT NULL,
  requested_qty numeric(12,2) NOT NULL,
  approved_qty numeric(12,2),
  notes text
);
CREATE INDEX IF NOT EXISTS idx_mr_items_mr ON public.material_request_items(mr_id);
ALTER TABLE public.material_request_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view mr_items" ON public.material_request_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage own MR items" ON public.material_request_items FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.material_requests WHERE id = mr_id AND requested_by = auth.uid() AND status = 'draft'));
CREATE POLICY "PMs can update MR items" ON public.material_request_items FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'project_manager'));

CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  po_number text NOT NULL,
  supplier_name text NOT NULL,
  po_date date NOT NULL DEFAULT CURRENT_DATE,
  status public.po_status NOT NULL DEFAULT 'draft',
  total_amount numeric(15,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_po_project ON public.purchase_orders(project_id);
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view POs" ON public.purchase_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins and PMs manage POs" ON public.purchase_orders FOR ALL TO authenticated USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'project_manager'));

CREATE TABLE IF NOT EXISTS public.purchase_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id uuid NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  mr_item_id uuid REFERENCES public.material_request_items(id) ON DELETE SET NULL,
  material_name text NOT NULL,
  uom text NOT NULL,
  order_qty numeric(12,2) NOT NULL,
  unit_price numeric(12,2) NOT NULL DEFAULT 0,
  total_price numeric(15,2) GENERATED ALWAYS AS (order_qty * unit_price) STORED
);
CREATE INDEX IF NOT EXISTS idx_po_items_po ON public.purchase_order_items(po_id);
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view PO items" ON public.purchase_order_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins and PMs manage PO items" ON public.purchase_order_items FOR ALL TO authenticated USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'project_manager'));

CREATE TABLE IF NOT EXISTS public.grns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id uuid REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  grn_number text NOT NULL,
  received_by uuid NOT NULL REFERENCES public.profiles(id),
  delivery_date date NOT NULL DEFAULT CURRENT_DATE,
  delivery_note_ref text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_grns_po ON public.grns(po_id);
CREATE INDEX IF NOT EXISTS idx_grns_project ON public.grns(project_id);
ALTER TABLE public.grns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view GRNs" ON public.grns FOR SELECT TO authenticated USING (true);
CREATE POLICY "Storekeepers/PMs manage GRNs" ON public.grns FOR ALL TO authenticated USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'project_manager') OR has_role(auth.uid(),'supervisor'));

CREATE TABLE IF NOT EXISTS public.grn_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grn_id uuid NOT NULL REFERENCES public.grns(id) ON DELETE CASCADE,
  po_item_id uuid REFERENCES public.purchase_order_items(id) ON DELETE SET NULL,
  material_name text NOT NULL,
  uom text NOT NULL,
  received_qty numeric(12,2) NOT NULL,
  accepted_qty numeric(12,2) NOT NULL,
  rejected_qty numeric(12,2) NOT NULL DEFAULT 0,
  notes text
);
CREATE INDEX IF NOT EXISTS idx_grn_items_grn ON public.grn_items(grn_id);
ALTER TABLE public.grn_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view GRN items" ON public.grn_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Storekeepers/PMs manage GRN items" ON public.grn_items FOR ALL TO authenticated USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'project_manager') OR has_role(auth.uid(),'supervisor'));

CREATE TABLE IF NOT EXISTS public.stock_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  material_name text NOT NULL,
  uom text NOT NULL,
  qty_on_hand numeric(12,2) NOT NULL DEFAULT 0,
  avg_unit_cost numeric(12,2) NOT NULL DEFAULT 0,
  last_updated timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id, material_name)
);
ALTER TABLE public.stock_balances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view stock balances" ON public.stock_balances FOR SELECT TO authenticated USING (true);
CREATE POLICY "System can manage stock balances" ON public.stock_balances FOR ALL TO authenticated USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'project_manager') OR has_role(auth.uid(),'supervisor'));

CREATE TABLE IF NOT EXISTS public.material_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  material_name text NOT NULL,
  issued_by uuid NOT NULL REFERENCES public.profiles(id),
  issue_date timestamptz NOT NULL DEFAULT now(),
  qty_issued numeric(12,2) NOT NULL,
  unit_cost_at_issue numeric(12,2) NOT NULL DEFAULT 0,
  notes text
);
CREATE INDEX IF NOT EXISTS idx_mi_task ON public.material_issues(task_id);
CREATE INDEX IF NOT EXISTS idx_mi_project ON public.material_issues(project_id);
ALTER TABLE public.material_issues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view material issues" ON public.material_issues FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can issue material" ON public.material_issues FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'project_manager') OR has_role(auth.uid(),'supervisor'));

-- ============= QA/QC MODULE =============
DO $$ BEGIN CREATE TYPE public.ir_status AS ENUM ('draft','requested','scheduled','passed','failed','passed_with_remarks'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE public.checklist_result AS ENUM ('pass','fail','n/a'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE public.ncr_severity AS ENUM ('low','medium','high','critical'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE public.ncr_status AS ENUM ('open','in_progress','resolved','closed'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE public.punch_list_status AS ENUM ('open','resolved','verified'); EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.inspection_checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  task_type public.task_type NOT NULL,
  name text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.inspection_checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id uuid NOT NULL REFERENCES public.inspection_checklists(id) ON DELETE CASCADE,
  order_index integer NOT NULL DEFAULT 0,
  item_text text NOT NULL,
  is_required boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.inspection_requests (
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
CREATE TABLE IF NOT EXISTS public.inspection_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_request_id uuid NOT NULL REFERENCES public.inspection_requests(id) ON DELETE CASCADE,
  checklist_item_id uuid NOT NULL REFERENCES public.inspection_checklist_items(id) ON DELETE CASCADE,
  status public.checklist_result,
  comments text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(inspection_request_id, checklist_item_id)
);
CREATE TABLE IF NOT EXISTS public.ncrs (
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
CREATE TABLE IF NOT EXISTS public.punch_list_items (
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

CREATE TRIGGER update_inspection_checklists_updated_at BEFORE UPDATE ON public.inspection_checklists FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_inspection_requests_updated_at BEFORE UPDATE ON public.inspection_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_inspection_results_updated_at BEFORE UPDATE ON public.inspection_results FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_ncrs_updated_at BEFORE UPDATE ON public.ncrs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_punch_list_items_updated_at BEFORE UPDATE ON public.punch_list_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.inspection_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ncrs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.punch_list_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view checklists" ON public.inspection_checklists FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated view checklist items" ON public.inspection_checklist_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated view IRs" ON public.inspection_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated view results" ON public.inspection_results FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated view NCRs" ON public.ncrs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated view punch" ON public.punch_list_items FOR SELECT TO authenticated USING (true);

CREATE POLICY "Manage checklists" ON public.inspection_checklists FOR ALL TO authenticated USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'project_manager') OR has_role(auth.uid(),'engineer'));
CREATE POLICY "Manage checklist items" ON public.inspection_checklist_items FOR ALL TO authenticated USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'project_manager') OR has_role(auth.uid(),'engineer'));
CREATE POLICY "Manage IRs" ON public.inspection_requests FOR ALL TO authenticated USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'project_manager') OR has_role(auth.uid(),'engineer') OR has_role(auth.uid(),'supervisor'));
CREATE POLICY "Manage results" ON public.inspection_results FOR ALL TO authenticated USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'project_manager') OR has_role(auth.uid(),'engineer') OR has_role(auth.uid(),'supervisor'));
CREATE POLICY "Manage NCRs" ON public.ncrs FOR ALL TO authenticated USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'project_manager') OR has_role(auth.uid(),'engineer') OR has_role(auth.uid(),'supervisor'));
CREATE POLICY "Manage punch" ON public.punch_list_items FOR ALL TO authenticated USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'project_manager') OR has_role(auth.uid(),'engineer') OR has_role(auth.uid(),'supervisor'));

-- ============= FINANCIALS MODULE =============
DO $$ BEGIN CREATE TYPE public.claim_status AS ENUM ('draft','submitted','certified','paid','rejected'); EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.resource_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  resource_name text NOT NULL,
  hourly_rate numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(project_id, resource_name)
);

CREATE TABLE IF NOT EXISTS public.progress_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  claim_number text NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  status public.claim_status DEFAULT 'draft',
  total_amount_claimed numeric(15,2) DEFAULT 0,
  total_amount_certified numeric(15,2) DEFAULT 0,
  retention_pct numeric(5,2) DEFAULT 5.00,
  remarks text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.claim_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id uuid NOT NULL REFERENCES public.progress_claims(id) ON DELETE CASCADE,
  wbs_node_id uuid NOT NULL REFERENCES public.wbs_nodes(id),
  description text,
  uom text,
  planned_qty numeric(12,2),
  unit_rate numeric(12,2),
  prev_qty numeric(12,2) DEFAULT 0,
  curr_qty numeric(12,2) DEFAULT 0,
  total_to_date_qty numeric(12,2) GENERATED ALWAYS AS (COALESCE(prev_qty,0) + COALESCE(curr_qty,0)) STORED,
  certified_qty numeric(12,2) DEFAULT 0
);

-- EVM view (fixed: uses existing tables only — boq_items, grns/grn_items, timesheet_entries)
DROP VIEW IF EXISTS public.project_cost_summaries CASCADE;
CREATE VIEW public.project_cost_summaries AS
WITH task_budgets AS (
  SELECT t.id AS task_id, t.project_id, t.wbs_node_id, t.title AS task_title,
    COALESCE(t.estimated_hours,0) * 50 AS labor_budget,
    COALESCE((SELECT SUM(planned_qty * unit_cost) FROM public.boq_items WHERE task_id = t.id),0) AS material_budget
  FROM public.tasks t
),
actual_costs AS (
  SELECT t.id AS task_id,
    COALESCE((SELECT SUM(COALESCE(regular_hours,0) + COALESCE(overtime_hours,0)) * 50 FROM public.timesheet_entries WHERE task_id = t.id AND status = 'approved'),0) AS ac_labor,
    COALESCE((SELECT SUM(gi.accepted_qty * COALESCE(poi.unit_price,0))
              FROM public.grn_items gi
              LEFT JOIN public.purchase_order_items poi ON poi.id = gi.po_item_id
              JOIN public.grns g ON g.id = gi.grn_id
              WHERE g.project_id = t.project_id),0) AS ac_materials
  FROM public.tasks t
),
earned_value AS (
  SELECT t.id AS task_id,
    (COALESCE(t.estimated_hours,0) * 50 +
     COALESCE((SELECT SUM(planned_qty * unit_cost) FROM public.boq_items WHERE task_id = t.id),0)
    ) * (COALESCE(t.progress_pct,0) / 100.0) AS ev
  FROM public.tasks t
)
SELECT tb.project_id, tb.wbs_node_id, tb.task_id, tb.task_title,
  (tb.labor_budget + tb.material_budget) AS bac,
  ev.ev, ac.ac_materials, ac.ac_labor,
  (ac.ac_materials + ac.ac_labor) AS ac_total,
  CASE WHEN (ac.ac_materials + ac.ac_labor) > 0 THEN ev.ev / (ac.ac_materials + ac.ac_labor) ELSE 1.0 END AS cpi
FROM task_budgets tb
JOIN actual_costs ac ON tb.task_id = ac.task_id
JOIN earned_value ev ON tb.task_id = ev.task_id;

GRANT SELECT ON public.project_cost_summaries TO authenticated, anon, service_role;

ALTER TABLE public.resource_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claim_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View resource rates" ON public.resource_rates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage rates" ON public.resource_rates FOR ALL TO authenticated USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'project_manager'));
CREATE POLICY "View claims" ON public.progress_claims FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage claims" ON public.progress_claims FOR ALL TO authenticated USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'project_manager'));
CREATE POLICY "View claim items" ON public.claim_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage claim items" ON public.claim_items FOR ALL TO authenticated USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'project_manager'));