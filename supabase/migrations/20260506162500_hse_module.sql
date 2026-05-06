
-- ============================================================
-- MODULE 14: SAFETY & HSE (HEALTH, SAFETY, ENVIRONMENT)
-- ============================================================

-- 1. Safety Enums
CREATE TYPE public.permit_type AS ENUM ('hot_work', 'working_at_height', 'excavation', 'confined_space', 'electrical', 'lifting', 'general');
CREATE TYPE public.safety_status AS ENUM ('draft', 'pending', 'approved', 'rejected', 'expired', 'closed');
CREATE TYPE public.incident_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE public.incident_type AS ENUM ('near_miss', 'first_aid', 'lost_time_injury', 'property_damage', 'environmental');

-- 2. Safety Permits (PTW - Permit to Work)
CREATE TABLE public.safety_permits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  wbs_node_id UUID REFERENCES public.wbs_nodes(id) ON DELETE SET NULL,
  permit_number TEXT NOT NULL, -- e.g. PTW-HW-001
  type public.permit_type NOT NULL DEFAULT 'general',
  subject TEXT NOT NULL,
  description TEXT,
  status public.safety_status NOT NULL DEFAULT 'pending',
  
  valid_from TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ NOT NULL,
  
  requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(project_id, permit_number)
);

-- 3. Safety Incidents
CREATE TABLE public.safety_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  wbs_node_id UUID REFERENCES public.wbs_nodes(id) ON DELETE SET NULL,
  incident_number TEXT NOT NULL, -- e.g. INC-001
  type public.incident_type NOT NULL,
  severity public.incident_severity NOT NULL DEFAULT 'medium',
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  immediate_action_taken TEXT,
  
  incident_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  reported_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  status TEXT NOT NULL DEFAULT 'open', -- open, investigating, closed
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(project_id, incident_number)
);

-- 4. Toolbox Talks (TBT)
CREATE TABLE public.safety_toolbox_talks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  wbs_node_id UUID REFERENCES public.wbs_nodes(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  topic TEXT NOT NULL,
  conducted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  conducted_at DATE NOT NULL DEFAULT CURRENT_DATE,
  attendee_count INTEGER DEFAULT 0,
  
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. RLS Policies
ALTER TABLE public.safety_permits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_toolbox_talks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view safety records" ON public.safety_permits FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authorized users can manage safety permits" ON public.safety_permits FOR ALL TO authenticated 
  USING (public.check_permission(auth.uid(), 'hse', 'view'));

CREATE POLICY "Authenticated users can view incidents" ON public.safety_incidents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authorized users can report incidents" ON public.safety_incidents FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can view toolbox talks" ON public.safety_toolbox_talks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authorized users can log toolbox talks" ON public.safety_toolbox_talks FOR ALL TO authenticated USING (true);

-- 6. Audit Triggers
CREATE TRIGGER trg_audit_safety_permits AFTER INSERT OR UPDATE OR DELETE ON public.safety_permits FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();
CREATE TRIGGER trg_audit_safety_incidents AFTER INSERT OR UPDATE OR DELETE ON public.safety_incidents FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- 7. Add Comments
COMMENT ON TABLE public.safety_permits IS 'Permit to Work (PTW) tracking for high-risk site activities.';
COMMENT ON TABLE public.safety_incidents IS 'Formal record of site accidents, near-misses, and environmental issues.';
