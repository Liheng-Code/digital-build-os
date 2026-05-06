
-- ============================================================
-- MODULE 8: MEP DESIGN MODULE
-- Covers: Mechanical, Electrical, Plumbing, Fire Fighting, ELV, HVAC
-- ============================================================

-- 1. MEP Drawings Register
CREATE TABLE public.mep_drawings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  wbs_node_id UUID REFERENCES public.wbs_nodes(id) ON DELETE SET NULL,

  drawing_number TEXT NOT NULL,    -- e.g. MEP-M-L01-001
  title TEXT NOT NULL,
  discipline TEXT NOT NULL DEFAULT 'M', -- M, E, P, FF, ELV, HVAC, DR
  revision TEXT NOT NULL DEFAULT '0',
  status TEXT NOT NULL DEFAULT 'issued_for_construction', -- issued_for_construction, preliminary, superseded
  file_url TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(project_id, drawing_number, revision)
);

-- 2. Equipment Schedule
CREATE TABLE public.mep_equipment_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  wbs_node_id UUID REFERENCES public.wbs_nodes(id) ON DELETE SET NULL,

  tag_number TEXT NOT NULL,        -- e.g. AHU-L03-01, DB-L02-MAIN
  description TEXT NOT NULL,
  discipline TEXT NOT NULL DEFAULT 'M',
  make_model TEXT,
  duty TEXT,                       -- Primary, standby, duty/standby
  capacity TEXT,                   -- e.g. 10kW, 500 l/s
  status TEXT NOT NULL DEFAULT 'pending', -- pending, submitted, approved

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(project_id, tag_number)
);

-- 3. Sleeve & Opening Coordination Log
CREATE TABLE public.mep_sleeve_openings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  wbs_node_id UUID REFERENCES public.wbs_nodes(id) ON DELETE SET NULL,

  reference_no TEXT NOT NULL,      -- e.g. SLV-L03-MEP-001
  discipline TEXT NOT NULL DEFAULT 'M',
  location_description TEXT NOT NULL,
  size_mm TEXT,                    -- e.g. 200x200 or DN150
  element_type TEXT NOT NULL DEFAULT 'slab', -- slab, wall, beam
  str_approved BOOLEAN NOT NULL DEFAULT false,
  arc_approved BOOLEAN NOT NULL DEFAULT false,
  coordination_status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected

  comments TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Enable RLS
ALTER TABLE public.mep_drawings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mep_equipment_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mep_sleeve_openings ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies — MEP Drawings
CREATE POLICY "Authenticated users can view MEP drawings"
  ON public.mep_drawings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authorized users can manage MEP drawings"
  ON public.mep_drawings FOR ALL TO authenticated
  USING (public.check_permission(auth.uid(), 'mep', 'view'));

-- 6. RLS Policies — Equipment Schedules
CREATE POLICY "Authenticated users can view MEP equipment"
  ON public.mep_equipment_schedules FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authorized users can manage MEP equipment"
  ON public.mep_equipment_schedules FOR ALL TO authenticated
  USING (public.check_permission(auth.uid(), 'mep', 'view'));

-- 7. RLS Policies — Sleeve / Openings
CREATE POLICY "Authenticated users can view MEP sleeves"
  ON public.mep_sleeve_openings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authorized users can manage MEP sleeves"
  ON public.mep_sleeve_openings FOR ALL TO authenticated
  USING (public.check_permission(auth.uid(), 'mep', 'view'));

-- 8. Audit Triggers
CREATE TRIGGER trg_audit_mep_drawings
  AFTER INSERT OR UPDATE OR DELETE ON public.mep_drawings
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

CREATE TRIGGER trg_audit_mep_equipment
  AFTER INSERT OR UPDATE OR DELETE ON public.mep_equipment_schedules
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

CREATE TRIGGER trg_audit_mep_sleeves
  AFTER INSERT OR UPDATE OR DELETE ON public.mep_sleeve_openings
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- 9. Updated-at triggers
CREATE TRIGGER trg_mep_drawings_updated_at
  BEFORE UPDATE ON public.mep_drawings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_mep_equipment_updated_at
  BEFORE UPDATE ON public.mep_equipment_schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_mep_sleeves_updated_at
  BEFORE UPDATE ON public.mep_sleeve_openings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 10. Seed mep permissions into role_permissions (admin + PM)
DO $$
DECLARE
  a TEXT;
  actions TEXT[] := ARRAY['view', 'create', 'edit', 'delete', 'approve'];
BEGIN
  FOR a IN SELECT unnest(actions) LOOP
    INSERT INTO public.role_permissions (role, module, action, is_allowed)
    VALUES ('admin', 'mep', a, true)
    ON CONFLICT (role, module, action) DO UPDATE SET is_allowed = true;
  END LOOP;

  INSERT INTO public.role_permissions (role, module, action, is_allowed)
  VALUES ('project_manager', 'mep', 'view', true)
  ON CONFLICT (role, module, action) DO UPDATE SET is_allowed = true;
END $$;

-- 11. Comments
COMMENT ON TABLE public.mep_drawings IS 'MEP design drawing register covering all sub-disciplines (M/E/P/FF/ELV/HVAC).';
COMMENT ON TABLE public.mep_equipment_schedules IS 'Equipment tag schedule with duty, capacity, and approval tracking.';
COMMENT ON TABLE public.mep_sleeve_openings IS 'Sleeve and structural opening coordination log between MEP, STR, and ARC.';
