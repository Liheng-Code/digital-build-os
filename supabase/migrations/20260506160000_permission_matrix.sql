
-- ============================================================
-- MODULE 5: DYNAMIC PERMISSION MATRIX
-- ============================================================

-- 1. Create the Permission Matrix table
CREATE TABLE public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role public.app_role NOT NULL,
  module TEXT NOT NULL, -- e.g. 'rfis', 'architecture', 'analytics', 'tasks'
  action TEXT NOT NULL, -- e.g. 'view', 'create', 'edit', 'delete', 'approve'
  is_allowed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (role, module, action)
);

-- 2. Populate with default permissions for current system
-- (Admins get everything)
DO $$
DECLARE
  r public.app_role;
  m TEXT;
  a TEXT;
  modules TEXT[] := ARRAY['projects', 'wbs', 'tasks', 'daily_reports', 'timesheets', 'approvals', 'rfis', 'architecture', 'analytics', 'financials', 'stakeholders', 'procurement'];
  actions TEXT[] := ARRAY['view', 'create', 'edit', 'delete', 'approve'];
BEGIN
  -- Give Admin full access to everything
  FOR m IN SELECT unnest(modules) LOOP
    FOR a IN SELECT unnest(actions) LOOP
      INSERT INTO public.role_permissions (role, module, action, is_allowed)
      VALUES ('admin', m, a, true)
      ON CONFLICT (role, module, action) DO UPDATE SET is_allowed = true;
    END LOOP;
  END LOOP;

  -- Default PM permissions (View all, Create most)
  FOR m IN SELECT unnest(modules) LOOP
    INSERT INTO public.role_permissions (role, module, action, is_allowed)
    VALUES ('project_manager', m, 'view', true)
    ON CONFLICT (role, module, action) DO UPDATE SET is_allowed = true;
  END LOOP;
END $$;

-- 3. Function to check permission in SQL (useful for RLS)
CREATE OR REPLACE FUNCTION public.check_permission(v_user_id UUID, v_module TEXT, v_action TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.role_permissions rp
    JOIN public.user_roles ur ON rp.role = ur.role
    WHERE ur.user_id = v_user_id
    AND rp.module = v_module
    AND rp.action = v_action
    AND rp.is_allowed = true
  );
END;
$$;

-- 4. Enable RLS and Audit
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage permissions" ON public.role_permissions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Everyone can view permissions" ON public.role_permissions FOR SELECT TO authenticated USING (true);

CREATE TRIGGER trg_role_permissions_updated_at BEFORE UPDATE ON public.role_permissions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_audit_role_permissions AFTER INSERT OR UPDATE OR DELETE ON public.role_permissions FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

COMMENT ON TABLE public.role_permissions IS 'Centralized matrix controlling role-based access to every module and action in DCOS.';
