-- ENUMS
CREATE TYPE public.mr_status AS ENUM ('draft', 'pending_approval', 'approved', 'rejected', 'ordered', 'fulfilled');
CREATE TYPE public.po_status AS ENUM ('draft', 'issued', 'partially_received', 'completed', 'cancelled');

-- BOQ ITEMS
CREATE TABLE public.boq_items (
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
CREATE INDEX idx_boq_items_project ON public.boq_items(project_id);
CREATE INDEX idx_boq_items_task ON public.boq_items(task_id);

ALTER TABLE public.boq_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view boq_items" ON public.boq_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Planners can manage boq_items" ON public.boq_items FOR ALL TO authenticated USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'project_manager') OR has_role(auth.uid(),'engineer'));

-- MATERIAL REQUESTS (MR)
CREATE TABLE public.material_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  request_number text NOT NULL, -- e.g., MR-2026-001
  requested_by uuid NOT NULL REFERENCES public.profiles(id),
  request_date date NOT NULL DEFAULT CURRENT_DATE,
  required_date date NOT NULL,
  status public.mr_status NOT NULL DEFAULT 'draft',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_mr_project ON public.material_requests(project_id);

ALTER TABLE public.material_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view material_requests" ON public.material_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create material_requests" ON public.material_requests FOR INSERT TO authenticated WITH CHECK (requested_by = auth.uid());
CREATE POLICY "Users can update own draft MRs" ON public.material_requests FOR UPDATE TO authenticated USING (requested_by = auth.uid() AND status = 'draft');
CREATE POLICY "PMs can approve MRs" ON public.material_requests FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'project_manager'));

-- MATERIAL REQUEST ITEMS
CREATE TABLE public.material_request_items (
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
CREATE INDEX idx_mr_items_mr ON public.material_request_items(mr_id);

ALTER TABLE public.material_request_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view mr_items" ON public.material_request_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage own MR items" ON public.material_request_items FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.material_requests WHERE id = mr_id AND requested_by = auth.uid() AND status = 'draft'));
CREATE POLICY "PMs can update MR items" ON public.material_request_items FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'project_manager'));

-- PURCHASE ORDERS (PO)
CREATE TABLE public.purchase_orders (
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
CREATE INDEX idx_po_project ON public.purchase_orders(project_id);

ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view POs" ON public.purchase_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins and PMs manage POs" ON public.purchase_orders FOR ALL TO authenticated USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'project_manager'));

-- PO ITEMS
CREATE TABLE public.purchase_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id uuid NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  mr_item_id uuid REFERENCES public.material_request_items(id) ON DELETE SET NULL,
  material_name text NOT NULL,
  uom text NOT NULL,
  order_qty numeric(12,2) NOT NULL,
  unit_price numeric(12,2) NOT NULL DEFAULT 0,
  total_price numeric(15,2) GENERATED ALWAYS AS (order_qty * unit_price) STORED
);
CREATE INDEX idx_po_items_po ON public.purchase_order_items(po_id);

ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view PO items" ON public.purchase_order_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins and PMs manage PO items" ON public.purchase_order_items FOR ALL TO authenticated USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'project_manager'));

-- GRNS (Goods Received Notes)
CREATE TABLE public.grns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id uuid REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  grn_number text NOT NULL,
  received_by uuid NOT NULL REFERENCES public.profiles(id),
  delivery_date date NOT NULL DEFAULT CURRENT_DATE,
  delivery_note_ref text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_grns_po ON public.grns(po_id);
CREATE INDEX idx_grns_project ON public.grns(project_id);

ALTER TABLE public.grns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view GRNs" ON public.grns FOR SELECT TO authenticated USING (true);
CREATE POLICY "Storekeepers/PMs manage GRNs" ON public.grns FOR ALL TO authenticated USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'project_manager') OR has_role(auth.uid(),'supervisor'));

-- GRN ITEMS
CREATE TABLE public.grn_items (
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
CREATE INDEX idx_grn_items_grn ON public.grn_items(grn_id);

ALTER TABLE public.grn_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view GRN items" ON public.grn_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Storekeepers/PMs manage GRN items" ON public.grn_items FOR ALL TO authenticated USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'project_manager') OR has_role(auth.uid(),'supervisor'));

-- STOCK BALANCES
CREATE TABLE public.stock_balances (
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

-- MATERIAL ISSUES (Issue to task)
CREATE TABLE public.material_issues (
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
CREATE INDEX idx_mi_task ON public.material_issues(task_id);
CREATE INDEX idx_mi_project ON public.material_issues(project_id);

ALTER TABLE public.material_issues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view material issues" ON public.material_issues FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can issue material" ON public.material_issues FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'project_manager') OR has_role(auth.uid(),'supervisor'));

-- TRIGGERS & FUNCTIONS
-- 1. GRN Item acceptance increases stock
CREATE OR REPLACE FUNCTION public.process_grn_stock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_project_id uuid;
  v_unit_cost numeric;
BEGIN
  -- Get project_id from GRN
  SELECT project_id INTO v_project_id FROM public.grns WHERE id = NEW.grn_id;
  
  -- Get unit cost from PO item
  SELECT unit_price INTO v_unit_cost FROM public.purchase_order_items WHERE id = NEW.po_item_id;
  IF v_unit_cost IS NULL THEN
    v_unit_cost := 0;
  END IF;

  -- Upsert stock balance
  INSERT INTO public.stock_balances (project_id, material_name, uom, qty_on_hand, avg_unit_cost, last_updated)
  VALUES (v_project_id, NEW.material_name, NEW.uom, NEW.accepted_qty, v_unit_cost, now())
  ON CONFLICT (project_id, material_name)
  DO UPDATE SET
    avg_unit_cost = CASE 
      WHEN (public.stock_balances.qty_on_hand + EXCLUDED.qty_on_hand) > 0 THEN
        ((public.stock_balances.qty_on_hand * public.stock_balances.avg_unit_cost) + (EXCLUDED.qty_on_hand * EXCLUDED.avg_unit_cost)) / (public.stock_balances.qty_on_hand + EXCLUDED.qty_on_hand)
      ELSE 0
    END,
    qty_on_hand = public.stock_balances.qty_on_hand + EXCLUDED.qty_on_hand,
    last_updated = now();

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_process_grn_stock
  AFTER INSERT ON public.grn_items
  FOR EACH ROW EXECUTE FUNCTION public.process_grn_stock();

-- 2. Material issue decreases stock
CREATE OR REPLACE FUNCTION public.process_material_issue()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_stock_qty numeric;
  v_avg_cost numeric;
BEGIN
  -- Get current stock
  SELECT qty_on_hand, avg_unit_cost INTO v_stock_qty, v_avg_cost
  FROM public.stock_balances
  WHERE project_id = NEW.project_id AND material_name = NEW.material_name
  FOR UPDATE;

  IF NOT FOUND OR v_stock_qty < NEW.qty_issued THEN
    RAISE EXCEPTION 'Insufficient stock for %', NEW.material_name;
  END IF;

  -- Set unit cost at issue to current avg cost
  NEW.unit_cost_at_issue := v_avg_cost;

  -- Update stock
  UPDATE public.stock_balances
  SET qty_on_hand = qty_on_hand - NEW.qty_issued,
      last_updated = now()
  WHERE project_id = NEW.project_id AND material_name = NEW.material_name;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_process_material_issue
  BEFORE INSERT ON public.material_issues
  FOR EACH ROW EXECUTE FUNCTION public.process_material_issue();
