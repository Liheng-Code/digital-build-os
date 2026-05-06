
-- ============================================================
-- STAKEHOLDERS MODULE
-- ============================================================

-- Stakeholder Type Enum
DO $$ BEGIN
  CREATE TYPE public.stakeholder_type AS ENUM (
    'client',
    'project_manager',
    'contractor',
    'architect',
    'subcontractor',
    'supplier',
    'authority',
    'consultant',
    'other'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Stakeholders Table
CREATE TABLE IF NOT EXISTS public.stakeholders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type public.stakeholder_type NOT NULL,
  organization_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blacklisted')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Stakeholder Contacts Table
CREATE TABLE IF NOT EXISTS public.stakeholder_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stakeholder_id UUID NOT NULL REFERENCES public.stakeholders(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  job_title TEXT,
  email TEXT,
  phone TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Project Stakeholders Junction Table
CREATE TABLE IF NOT EXISTS public.project_stakeholders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  stakeholder_id UUID NOT NULL REFERENCES public.stakeholders(id) ON DELETE CASCADE,
  project_role TEXT,
  approval_authority BOOLEAN NOT NULL DEFAULT false,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, stakeholder_id)
);

-- Enable RLS
ALTER TABLE public.stakeholders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stakeholder_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_stakeholders ENABLE ROW LEVEL SECURITY;

-- Triggers for updated_at
CREATE TRIGGER update_stakeholders_updated_at
  BEFORE UPDATE ON public.stakeholders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_stakeholder_contacts_updated_at
  BEFORE UPDATE ON public.stakeholder_contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies

-- Stakeholders
CREATE POLICY "Authenticated users can view stakeholders"
  ON public.stakeholders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and PMs can manage stakeholders"
  ON public.stakeholders FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'project_manager')
  );

-- Stakeholder Contacts
CREATE POLICY "Authenticated users can view stakeholder contacts"
  ON public.stakeholder_contacts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and PMs can manage stakeholder contacts"
  ON public.stakeholder_contacts FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'project_manager')
  );

-- Project Stakeholders
CREATE POLICY "Authenticated users can view project stakeholders"
  ON public.project_stakeholders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and PMs can manage project stakeholders"
  ON public.project_stakeholders FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'project_manager')
  );
