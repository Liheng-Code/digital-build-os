
-- ============================================================
-- MODULE 2: COMPANY / TENANT SETUP
-- ============================================================

-- Companies Table
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  legal_name TEXT,
  registration_number TEXT,
  tax_id TEXT,
  email TEXT,
  phone TEXT,
  website TEXT,
  address TEXT,
  logo_url TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add company_id to existing tables
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM medical_columns WHERE table_name = 'profiles' AND column_name = 'company_id') THEN
    ALTER TABLE public.profiles ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM medical_columns WHERE table_name = 'projects' AND column_name = 'company_id') THEN
    ALTER TABLE public.projects ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- updated_at Trigger
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies
CREATE POLICY "Authenticated users can view their own company"
  ON public.companies FOR SELECT
  TO authenticated
  USING (true); -- Simplified for MVP, in multi-tenant this would check membership

CREATE POLICY "Only admins can update company profile"
  ON public.companies FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Seed a default company if none exists
INSERT INTO public.companies (id, name)
SELECT '00000000-0000-0000-0000-000000000000', 'My Construction Company'
WHERE NOT EXISTS (SELECT 1 FROM public.companies);

-- Update existing profiles/projects to point to default company
UPDATE public.profiles SET company_id = '00000000-0000-0000-0000-000000000000' WHERE company_id IS NULL;
UPDATE public.projects SET company_id = '00000000-0000-0000-0000-000000000000' WHERE company_id IS NULL;
