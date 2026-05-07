-- Migration: 20260507040000_budget_control.sql
-- Budget Control & Validation for BuildFlow Pro

-- 1. Create Project Budgets table
CREATE TABLE IF NOT EXISTS public.project_budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  budget_code text NOT NULL,
  budget_name text NOT NULL,
  total_budget numeric(15,2) NOT NULL DEFAULT 0,
  committed_amount numeric(15,2) NOT NULL DEFAULT 0,
  spent_amount numeric(15,2) NOT NULL DEFAULT 0,
  currency text DEFAULT 'USD',
  fiscal_year integer,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id, budget_code)
);

-- 2. Create Budget Line Items (WBS-based)
CREATE TABLE IF NOT EXISTS public.budget_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id uuid NOT NULL REFERENCES public.project_budgets(id) ON DELETE CASCADE,
  wbs_node_id uuid REFERENCES public.wbs_nodes(id) ON DELETE SET NULL,
  cost_code text,
  description text NOT NULL,
  planned_amount numeric(15,2) NOT NULL DEFAULT 0,
  committed_amount numeric(15,2) NOT NULL DEFAULT 0,
  actual_amount numeric(15,2) NOT NULL DEFAULT 0,
  variance numeric(15,2) GENERATED ALWAYS AS (planned_amount - actual_amount) STORED,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Add budget_code to purchase_requisitions
ALTER TABLE public.purchase_requisitions 
  ADD COLUMN IF NOT EXISTS budget_code text;

-- 4. Add budget validation function
CREATE OR REPLACE FUNCTION public.check_budget_available(
  p_budget_code text,
  p_project_id uuid,
  p_requested_amount numeric
) RETURNS TABLE (
  is_available boolean,
  available_amount numeric,
  budget_total numeric,
  committed_total numeric,
  spent_total numeric
) AS $$
DECLARE
  v_budget_total numeric(15,2);
  v_committed numeric(15,2);
  v_spent numeric(15,2);
BEGIN
  -- Get budget totals
  SELECT 
    COALESCE(SUM(total_budget), 0),
    COALESCE(SUM(committed_amount), 0),
    COALESCE(SUM(spent_amount), 0)
  INTO v_budget_total, v_committed, v_spent
  FROM public.project_budgets
  WHERE project_id = p_project_id 
    AND (budget_code = p_budget_code OR p_budget_code IS NULL);
  
  RETURN QUERY SELECT 
    (v_budget_total - v_committed - v_spent) >= p_requested_amount AS is_available,
    (v_budget_total - v_committed - v_spent) AS available_amount,
    v_budget_total AS budget_total,
    v_committed AS committed_total,
    v_spent AS spent_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create function to update budget when PR is approved
CREATE OR REPLACE FUNCTION public.update_budget_commitment()
RETURNS TRIGGER AS $$
DECLARE
  v_budget_code text;
  v_total numeric(15,2);
BEGIN
  -- Only act on status change to 'approved'
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    -- Get budget code and total from PR
    v_budget_code := NEW.budget_code;
    
    IF v_budget_code IS NOT NULL THEN
      -- Update committed amount in project_budgets
      UPDATE public.project_budgets 
      SET 
        committed_amount = COALESCE(committed_amount, 0) + NEW.total_estimate,
        updated_at = now()
      WHERE project_id = NEW.project_id 
        AND budget_code = v_budget_code;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Create trigger on PR status change
CREATE OR REPLACE TRIGGER update_budget_on_pr_approval
  AFTER UPDATE ON public.purchase_requisitions
  FOR EACH ROW EXECUTE FUNCTION public.update_budget_commitment();

-- 7. Create function to update actual spend when invoice is paid
CREATE OR REPLACE FUNCTION public.update_budget_spending()
RETURNS TRIGGER AS $$
DECLARE
  v_po_record record;
  v_budget_code text;
BEGIN
  -- Only act on status change to 'paid'
  IF NEW.status = 'paid' AND OLD.status != 'paid' THEN
    -- Get PO and then PR to find budget code
    SELECT po.*, pr.budget_code INTO v_po_record
    FROM public.purchase_orders po
    LEFT JOIN public.purchase_requisitions pr ON pr.id = po.rfq_id -- This needs adjustment based on your actual relationship
    WHERE po.id = NEW.po_id;
    
    IF v_po_record.budget_code IS NOT NULL THEN
      -- Update spent amount in project_budgets
      UPDATE public.project_budgets 
      SET 
        spent_amount = COALESCE(spent_amount, 0) + NEW.total_amount,
        updated_at = now()
      WHERE project_id = NEW.project_id 
        AND budget_code = v_po_record.budget_code;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Enable Row Level Security
ALTER TABLE public.project_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_line_items ENABLE ROW LEVEL SECURITY;

-- 9. RLS Policies for Budgets
CREATE POLICY "Project members can view budgets"
  ON public.project_budgets FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_members.project_id = project_budgets.project_id
    AND project_members.user_id = auth.uid()
  ));

CREATE POLICY "Admins and PMs can manage budgets"
  ON public.project_budgets FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.role_permissions rp
    JOIN public.user_roles ur ON rp.role = ur.role
    WHERE ur.user_id = auth.uid()
    AND rp.module = 'procurement'
    AND rp.action = 'create'
    AND rp.is_allowed = true
  ));

-- 10. RLS Policies for Budget Line Items
CREATE POLICY "Project members can view budget line items"
  ON public.budget_line_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.project_budgets pb
    JOIN public.project_members pm ON pm.project_id = pb.project_id
    WHERE pb.id = budget_line_items.budget_id
    AND pm.user_id = auth.uid()
  ));

CREATE POLICY "Admins and PMs can manage budget line items"
  ON public.budget_line_items FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.role_permissions rp
    JOIN public.user_roles ur ON rp.role = ur.role
    WHERE ur.user_id = auth.uid()
    AND rp.module = 'procurement'
    AND rp.action = 'create'
    AND rp.is_allowed = true
  ));

-- 11. Updated_at triggers
CREATE OR REPLACE FUNCTION public.handle_budget_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_project_budgets_updated_at
  BEFORE UPDATE ON public.project_budgets
  FOR EACH ROW EXECUTE FUNCTION public.handle_budget_updated_at();

CREATE TRIGGER handle_budget_line_items_updated_at
  BEFORE UPDATE ON public.budget_line_items
  FOR EACH ROW EXECUTE FUNCTION public.handle_budget_updated_at();

-- 12. Performance indexes
CREATE INDEX IF NOT EXISTS idx_project_budgets_project_id ON public.project_budgets(project_id);
CREATE INDEX IF NOT EXISTS idx_budget_line_items_budget_id ON public.budget_line_items(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_line_items_wbs_node_id ON public.budget_line_items(wbs_node_id);

-- 13. Comments
COMMENT ON TABLE public.project_budgets IS 'Project-level budget control';
COMMENT ON TABLE public.budget_line_items IS 'Budget breakdown by WBS node';
COMMENT ON COLUMN public.purchase_requisitions.budget_code IS 'Links PR to budget code for tracking';
COMMENT ON FUNCTION public.check_budget_available IS 'Check if requested amount is within available budget';
