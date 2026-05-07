-- ============================================================
-- MODULE 9: PROCUREMENT & MATERIAL TAKE-OFF (MTO)
-- ============================================================

-- 1. Material Catalog (Master list of items)
CREATE TABLE IF NOT EXISTS public.material_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE, -- e.g. MAT-TIL-001
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- Finishing, Structural, MEP, etc.
  unit TEXT NOT NULL, -- sqm, kg, bag, m, etc.
  default_price NUMERIC(14,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Purchase Requisitions (PR) - Create ENUM safely
DO $$ 
BEGIN
  CREATE TYPE public.pr_status AS ENUM ('draft', 'submitted', 'approved', 'rejected', 'ordered', 'received', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.purchase_requisitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  pr_number TEXT NOT NULL, -- e.g. PR-B01-001
  subject TEXT NOT NULL,
  description TEXT,
  status public.pr_status NOT NULL DEFAULT 'draft',
  requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  required_date DATE,
  total_estimate NUMERIC(14,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE(project_id, pr_number)
);

-- 3. PR Items (Individual lines in a PR)
CREATE TABLE IF NOT EXISTS public.pr_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pr_id UUID NOT NULL REFERENCES public.purchase_requisitions(id) ON DELETE CASCADE,
  material_id UUID REFERENCES public.material_catalog(id) ON DELETE SET NULL,
  wbs_node_id UUID REFERENCES public.wbs_nodes(id) ON DELETE SET NULL,
  description TEXT,
  quantity NUMERIC(14,2) NOT NULL,
  unit_price NUMERIC(14,2) NOT NULL,
  total_price NUMERIC(14,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Material Take-offs (From RDS or Site to PR)
CREATE TABLE IF NOT EXISTS public.rds_material_takeoffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  wbs_node_id UUID NOT NULL REFERENCES public.wbs_nodes(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES public.material_catalog(id) ON DELETE CASCADE,
  quantity NUMERIC(14,2) NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, pr_created, fulfilled
  linked_pr_id UUID REFERENCES public.purchase_requisitions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. RLS Policies
ALTER TABLE public.material_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_requisitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pr_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rds_material_takeoffs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view material catalog" ON public.material_catalog FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage material catalog" ON public.material_catalog FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view PRs" ON public.purchase_requisitions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authorized users can manage PRs" ON public.purchase_requisitions FOR ALL TO authenticated USING (public.check_permission(auth.uid(), 'procurement', 'view'));

CREATE POLICY "Authenticated users can view PR items" ON public.pr_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authorized users can manage PR items" ON public.pr_items FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can view MTOs" ON public.rds_material_takeoffs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authorized users can manage MTOs" ON public.rds_material_takeoffs FOR ALL TO authenticated USING (true);

-- 6. Audit Triggers
DO $$
BEGIN
  CREATE TRIGGER trg_audit_material_catalog AFTER INSERT OR UPDATE OR DELETE ON public.material_catalog FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();
EXCEPTION WHEN others THEN null;
END $$;

DO $$
BEGIN
  CREATE TRIGGER trg_audit_purchase_requisitions AFTER INSERT OR UPDATE OR DELETE ON public.purchase_requisitions FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();
EXCEPTION WHEN others THEN null;
END $$;

-- 7. Initial Data (Sample Materials)
INSERT INTO public.material_catalog (code, name, category, unit, default_price) VALUES
('MAT-CON-001', 'Cement Bag (50kg)', 'Structural', 'bag', 6.50),
('MAT-FIN-001', 'Ceramic Tile 60x60 (Cream)', 'Finishing', 'sqm', 12.00),
('MAT-FIN-002', 'Emulsion Paint (White) 20L', 'Finishing', 'drum', 45.00),
('MAT-STR-001', 'Deformed Rebar 12mm', 'Structural', 'ton', 750.00)
ON CONFLICT (code) DO NOTHING;
