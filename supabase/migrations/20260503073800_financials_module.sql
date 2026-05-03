-- Module 4: Financial Control, EVM, and Progress Claims

-- 1. Enums
CREATE TYPE public.claim_status AS ENUM ('draft', 'submitted', 'certified', 'paid', 'rejected');

-- 2. Resource Rates
CREATE TABLE public.resource_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    resource_name TEXT NOT NULL, -- e.g. "Civil Engineer", "Excavator", "Electrician"
    hourly_rate DECIMAL(12, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(project_id, resource_name)
);

-- 3. Progress Claims
CREATE TABLE public.progress_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    claim_number TEXT NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    status claim_status DEFAULT 'draft',
    total_amount_claimed DECIMAL(15, 2) DEFAULT 0,
    total_amount_certified DECIMAL(15, 2) DEFAULT 0,
    retention_pct DECIMAL(5, 2) DEFAULT 5.00,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.claim_items (
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

-- 4. EVM Calculation View (Conceptual)
-- This view aggregates Material Issues and (future) Labor costs
CREATE OR REPLACE VIEW public.project_cost_summaries AS
WITH material_costs AS (
    SELECT 
        project_id,
        task_id,
        SUM(qty_issued * unit_cost_at_issue) as total_material_cost
    FROM public.material_issues
    GROUP BY project_id, task_id
),
planned_values AS (
    SELECT
        project_id,
        id as task_id,
        (progress_pct / 100.0) * (
            SELECT COALESCE(SUM(total_cost), 0) 
            FROM public.boq_items 
            WHERE task_id = tasks.id
        ) as earned_value,
        (
            SELECT COALESCE(SUM(total_cost), 0) 
            FROM public.boq_items 
            WHERE task_id = tasks.id
        ) as budget_at_completion
    FROM public.tasks
)
SELECT 
    t.project_id,
    t.id as task_id,
    t.title as task_title,
    COALESCE(pv.budget_at_completion, 0) as bac,
    COALESCE(pv.earned_value, 0) as ev,
    COALESCE(mc.total_material_cost, 0) as ac_materials,
    -- Simplified AC (just materials for now, labor can be added later)
    COALESCE(mc.total_material_cost, 0) as ac_total,
    CASE 
        WHEN COALESCE(mc.total_material_cost, 0) > 0 THEN pv.earned_value / mc.total_material_cost
        ELSE 0 
    END as cpi
FROM public.tasks t
LEFT JOIN material_costs mc ON t.id = mc.task_id
LEFT JOIN planned_values pv ON t.id = pv.task_id;

-- 5. RLS Policies
ALTER TABLE public.resource_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claim_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view financials" ON public.resource_rates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view claims" ON public.progress_claims FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view claim items" ON public.claim_items FOR SELECT TO authenticated USING (true);

-- Restrict management to Admins/PMs
CREATE POLICY "Managers can manage rates" ON public.resource_rates FOR ALL TO authenticated 
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'project_manager'));

CREATE POLICY "Managers can manage claims" ON public.progress_claims FOR ALL TO authenticated 
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'project_manager'));
