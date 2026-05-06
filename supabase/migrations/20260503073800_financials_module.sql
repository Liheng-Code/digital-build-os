-- Module 4: Financial Control, EVM, and Progress Claims

-- 1. Enums
DO $$ BEGIN
    CREATE TYPE public.claim_status AS ENUM ('draft', 'submitted', 'certified', 'paid', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Resource Rates
CREATE TABLE IF NOT EXISTS public.resource_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    resource_name TEXT NOT NULL,
    hourly_rate DECIMAL(12, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(project_id, resource_name)
);

-- 3. Progress Claims
CREATE TABLE IF NOT EXISTS public.progress_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    claim_number TEXT NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    status public.claim_status DEFAULT 'draft',
    total_amount_claimed DECIMAL(15, 2) DEFAULT 0,
    total_amount_certified DECIMAL(15, 2) DEFAULT 0,
    retention_pct DECIMAL(5, 2) DEFAULT 5.00,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.claim_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id UUID NOT NULL REFERENCES public.progress_claims(id) ON DELETE CASCADE,
    wbs_node_id UUID NOT NULL REFERENCES public.wbs_nodes(id),
    description TEXT,
    uom TEXT,
    planned_qty DECIMAL(12, 2),
    unit_rate DECIMAL(12, 2),
    prev_qty DECIMAL(12, 2) DEFAULT 0,
    curr_qty DECIMAL(12, 2) DEFAULT 0,
    total_to_date_qty DECIMAL(12, 2) GENERATED ALWAYS AS (prev_qty + curr_qty) STORED,
    certified_qty DECIMAL(12, 2) DEFAULT 0
);

-- 4. EVM Calculation View (EVM Engine)
-- Financial Summary View (EVM Engine)
-- Re-create view with correct table references from existing schema
DROP VIEW IF EXISTS public.project_cost_summaries CASCADE;

CREATE OR REPLACE VIEW public.project_cost_summaries AS
WITH task_budgets AS (
  -- Planned Value (PV) and Budget at Completion (BAC)
  -- Based on estimated hours and labor rates, plus materials from BOQ
  SELECT 
    t.id as task_id,
    t.project_id,
    t.wbs_node_id,
    t.title as task_title,
    COALESCE(t.estimated_hours, 0) * 50 as labor_budget, -- Default internal rate $50
    COALESCE((SELECT SUM(planned_qty * unit_cost) FROM public.boq_items WHERE task_id = t.id), 0) as material_budget
  FROM public.tasks t
),
actual_costs AS (
  -- Actual Cost (AC)
  SELECT 
    t.id as task_id,
    -- Labor Actuals from Timesheet Entries
    COALESCE((SELECT SUM((COALESCE(regular_hours, 0) + COALESCE(overtime_hours, 0)) * 50) FROM public.timesheet_entries WHERE task_id = t.id AND status = 'approved'), 0) as ac_labor,
    -- Material Actuals from Procurement
    COALESCE((SELECT SUM(quantity_received * unit_price) FROM public.procurement_items pi 
              JOIN public.procurement_orders po ON pi.order_id = po.id 
              WHERE pi.task_id = t.id AND po.status = 'received'), 0) as ac_materials
  FROM public.tasks t
),
earned_value AS (
  -- Earned Value (EV) = BAC * % Complete
  SELECT 
    t.id as task_id,
    (COALESCE(t.planned_hours, 0) * 50 + 
     COALESCE((SELECT SUM(quantity * unit_price) FROM public.material_requirements WHERE task_id = t.id), 0)) * 
     (COALESCE(t.progress_pct, 0) / 100.0) as ev
  FROM public.tasks t
)
SELECT 
  tb.project_id,
  tb.wbs_node_id,
  tb.task_id,
  tb.task_title,
  (tb.labor_budget + tb.material_budget) as bac,
  ev.ev,
  ac.ac_materials,
  ac.ac_labor,
  (ac.ac_materials + ac.ac_labor) as ac_total,
  CASE 
    WHEN (ac.ac_materials + ac.ac_labor) > 0 THEN ev.ev / (ac.ac_materials + ac.ac_labor)
    ELSE 1.0 
  END as cpi
FROM task_budgets tb
JOIN actual_costs ac ON tb.task_id = ac.task_id
JOIN earned_value ev ON tb.task_id = ev.task_id;

-- Ensure permissions are set for API access
GRANT SELECT ON public.project_cost_summaries TO authenticated, anon;

-- Ensure the view is accessible via API
GRANT SELECT ON public.project_cost_summaries TO authenticated, anon, service_role;


-- Grant access to authenticated users
GRANT SELECT ON public.project_cost_summaries TO authenticated, anon;

-- 5. RLS Policies
ALTER TABLE public.resource_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claim_items ENABLE ROW LEVEL SECURITY;

-- Select policies
DROP POLICY IF EXISTS "Authenticated users can view financials" ON public.resource_rates;
CREATE POLICY "Authenticated users can view financials" ON public.resource_rates FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can view claims" ON public.progress_claims;
CREATE POLICY "Authenticated users can view claims" ON public.progress_claims FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can view claim items" ON public.claim_items;
CREATE POLICY "Authenticated users can view claim items" ON public.claim_items FOR SELECT TO authenticated USING (true);

-- Manage policies
DROP POLICY IF EXISTS "Managers can manage rates" ON public.resource_rates;
CREATE POLICY "Managers can manage rates" ON public.resource_rates FOR ALL TO authenticated 
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'project_manager'));

DROP POLICY IF EXISTS "Managers can manage claims" ON public.progress_claims;
CREATE POLICY "Managers can manage claims" ON public.progress_claims FOR ALL TO authenticated 
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'project_manager'));
