
-- ============================================================
-- ARCHITECTURE MODULE (RDS & SCHEDULES)
-- ============================================================

-- 1. Room Data Sheets (RDS)
CREATE TABLE public.architecture_room_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wbs_node_id UUID NOT NULL REFERENCES public.wbs_nodes(id) ON DELETE CASCADE,
  floor_finish TEXT,
  wall_finish TEXT,
  ceiling_finish TEXT,
  skirting_finish TEXT,
  cornice_finish TEXT,
  mep_requirements JSONB DEFAULT '{}'::jsonb, -- {power_points: 2, light_types: [], data: true}
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(wbs_node_id)
);

-- 2. Door Schedule
CREATE TABLE public.architecture_door_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wbs_node_id UUID NOT NULL REFERENCES public.wbs_nodes(id) ON DELETE CASCADE,
  mark_number TEXT NOT NULL, -- e.g. D-01
  door_type TEXT, -- e.g. Single Swing Timber
  width_mm INTEGER,
  height_mm INTEGER,
  thickness_mm INTEGER,
  hardware_set TEXT,
  fire_rating TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(wbs_node_id, mark_number)
);

-- 3. Window Schedule
CREATE TABLE public.architecture_window_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wbs_node_id UUID NOT NULL REFERENCES public.wbs_nodes(id) ON DELETE CASCADE,
  mark_number TEXT NOT NULL, -- e.g. W-01
  window_type TEXT,
  width_mm INTEGER,
  height_mm INTEGER,
  glazing_type TEXT,
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(wbs_node_id, mark_number)
);

-- 4. RLS Policies
ALTER TABLE public.architecture_room_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.architecture_door_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.architecture_window_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view architecture data" 
  ON public.architecture_room_data FOR SELECT TO authenticated USING (true);
CREATE POLICY "Designers can modify architecture data" 
  ON public.architecture_room_data FOR ALL TO authenticated 
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'project_manager') OR has_role(auth.uid(), 'engineer'));

CREATE POLICY "Authenticated users can view door schedule" 
  ON public.architecture_door_schedule FOR SELECT TO authenticated USING (true);
CREATE POLICY "Designers can modify door schedule" 
  ON public.architecture_door_schedule FOR ALL TO authenticated 
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'project_manager') OR has_role(auth.uid(), 'engineer'));

CREATE POLICY "Authenticated users can view window schedule" 
  ON public.architecture_window_schedule FOR SELECT TO authenticated USING (true);
CREATE POLICY "Designers can modify window schedule" 
  ON public.architecture_window_schedule FOR ALL TO authenticated 
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'project_manager') OR has_role(auth.uid(), 'engineer'));

-- 5. Audit Triggers
CREATE TRIGGER trg_audit_arch_room AFTER INSERT OR UPDATE OR DELETE ON public.architecture_room_data FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();
CREATE TRIGGER trg_audit_arch_door AFTER INSERT OR UPDATE OR DELETE ON public.architecture_door_schedule FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();
CREATE TRIGGER trg_audit_arch_window AFTER INSERT OR UPDATE OR DELETE ON public.architecture_window_schedule FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- 6. Updated At Triggers
CREATE TRIGGER trg_arch_room_updated_at BEFORE UPDATE ON public.architecture_room_data FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_arch_door_updated_at BEFORE UPDATE ON public.architecture_door_schedule FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_arch_window_updated_at BEFORE UPDATE ON public.architecture_window_schedule FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Add comments
COMMENT ON TABLE public.architecture_room_data IS 'Detailed design requirements for each room in the project.';
COMMENT ON TABLE public.architecture_door_schedule IS 'Technical schedule of doors associated with rooms.';
