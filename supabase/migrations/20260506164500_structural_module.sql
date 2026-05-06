
-- ============================================================
-- MODULE 7: STRUCTURAL ENGINEERING
-- ============================================================

-- 1. Structural Drawings (STR)
CREATE TABLE public.structural_drawings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  wbs_node_id UUID REFERENCES public.wbs_nodes(id) ON DELETE SET NULL,
  drawing_number TEXT NOT NULL, -- e.g. STR-GA-L01-001
  title TEXT NOT NULL,
  revision TEXT NOT NULL DEFAULT '0',
  status TEXT NOT NULL DEFAULT 'issued_for_construction', -- IFC, Preliminary, Superseded
  file_url TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(project_id, drawing_number, revision)
);

-- 2. Bar Bending Schedule (BBS)
CREATE TABLE public.structural_rebar_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  wbs_node_id UUID NOT NULL REFERENCES public.wbs_nodes(id) ON DELETE CASCADE,
  drawing_id UUID REFERENCES public.structural_drawings(id) ON DELETE SET NULL,
  
  member_mark TEXT NOT NULL, -- e.g. B1, C1, S1
  bar_mark TEXT NOT NULL,
  diameter_mm INTEGER NOT NULL,
  shape_code TEXT NOT NULL, -- e.g. 00, 21, 31
  total_length_mm NUMERIC(10, 2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  total_weight_kg NUMERIC(12, 2) GENERATED ALWAYS AS (total_length_mm * quantity * 0.000001 * (diameter_mm * diameter_mm * 0.00617)) STORED,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Structural Inspections (Pre-pour / Concrete)
CREATE TYPE public.inspection_type AS ENUM ('rebar', 'formwork', 'pre_pour', 'concrete_cube_test');

CREATE TABLE public.structural_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  wbs_node_id UUID NOT NULL REFERENCES public.wbs_nodes(id) ON DELETE CASCADE,
  type public.inspection_type NOT NULL,
  subject TEXT NOT NULL,
  result TEXT NOT NULL DEFAULT 'pending', -- pending, passed, failed
  
  inspected_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  inspected_at TIMESTAMPTZ,
  
  comments TEXT,
  photo_urls TEXT[],
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. RLS Policies
ALTER TABLE public.structural_drawings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.structural_rebar_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.structural_inspections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view structural data" ON public.structural_drawings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authorized users can manage structural drawings" ON public.structural_drawings FOR ALL TO authenticated 
  USING (public.check_permission(auth.uid(), 'structural', 'view'));

CREATE POLICY "Authenticated users can view BBS" ON public.structural_rebar_schedules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authorized users can manage BBS" ON public.structural_rebar_schedules FOR ALL TO authenticated 
  USING (public.check_permission(auth.uid(), 'structural', 'view'));

CREATE POLICY "Authenticated users can view inspections" ON public.structural_inspections FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authorized users can log inspections" ON public.structural_inspections FOR ALL TO authenticated 
  USING (public.check_permission(auth.uid(), 'structural', 'view'));

-- 5. Audit Triggers
CREATE TRIGGER trg_audit_structural_drawings AFTER INSERT OR UPDATE OR DELETE ON public.structural_drawings FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();
CREATE TRIGGER trg_audit_structural_inspections AFTER INSERT OR UPDATE OR DELETE ON public.structural_inspections FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- 6. Comments
COMMENT ON TABLE public.structural_drawings IS 'Structural design drawings and revision control.';
COMMENT ON TABLE public.structural_rebar_schedules IS 'Reinforcement details (Bar Bending Schedules) per structural member.';
