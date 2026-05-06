
-- ============================================================
-- MODULE 19: SUBCONTRACTOR MANAGEMENT
-- ============================================================

-- 1. Subcontractor Profiles
CREATE TABLE IF NOT EXISTS public.subcontractors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  specialization TEXT NOT NULL, -- e.g. Tiling, Electrical, Structural
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  tax_id TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Subcontract Contracts
DO $$ BEGIN
    CREATE TYPE public.contract_status AS ENUM ('draft', 'active', 'suspended', 'completed', 'terminated');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.subcontract_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  subcontractor_id UUID NOT NULL REFERENCES public.subcontractors(id) ON DELETE CASCADE,
  contract_number TEXT NOT NULL, -- e.g. SC-2026-001
  subject TEXT NOT NULL,
  total_value NUMERIC(14, 2) NOT NULL DEFAULT 0,
  retention_percentage NUMERIC(4, 2) DEFAULT 5.0, -- 5% standard
  
  start_date DATE,
  end_date DATE,
  status public.contract_status NOT NULL DEFAULT 'draft',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(project_id, contract_number)
);

-- 3. Contract Items (WBS Link)
CREATE TABLE IF NOT EXISTS public.subcontract_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.subcontract_contracts(id) ON DELETE CASCADE,
  wbs_node_id UUID NOT NULL REFERENCES public.wbs_nodes(id) ON DELETE CASCADE,
  description TEXT,
  agreed_value NUMERIC(14, 2) NOT NULL DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Progress Claims
DO $$ BEGIN
    CREATE TYPE public.subcontract_claim_status AS ENUM ('draft', 'submitted', 'certified', 'paid', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.subcontract_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.subcontract_contracts(id) ON DELETE CASCADE,
  claim_number TEXT NOT NULL, -- e.g. CLM-01
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  claimed_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  certified_amount NUMERIC(14, 2) DEFAULT 0,
  retention_deducted NUMERIC(14, 2) DEFAULT 0,
  net_payable NUMERIC(14, 2) GENERATED ALWAYS AS (certified_amount - retention_deducted) STORED,
  
  status public.subcontract_claim_status NOT NULL DEFAULT 'draft',
  certified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  certified_at TIMESTAMPTZ,
  
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. RLS Policies
DO $$ BEGIN
    ALTER TABLE public.subcontractors ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.subcontract_contracts ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.subcontract_items ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.subcontract_claims ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Authenticated users can view subcontractors" ON public.subcontractors FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Admins can manage subcontractors" ON public.subcontractors FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Authenticated users can view contracts" ON public.subcontract_contracts FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Authorized users can manage contracts" ON public.subcontract_contracts FOR ALL TO authenticated 
      USING (public.check_permission(auth.uid(), 'subcontractors', 'view'));
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Authenticated users can view claims" ON public.subcontract_claims FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Authorized users can manage claims" ON public.subcontract_claims FOR ALL TO authenticated 
      USING (public.check_permission(auth.uid(), 'subcontractors', 'view'));
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 6. Audit Triggers
DO $$ BEGIN
    CREATE TRIGGER trg_audit_subcontractors AFTER INSERT OR UPDATE OR DELETE ON public.subcontractors FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    CREATE TRIGGER trg_audit_subcontract_contracts AFTER INSERT OR UPDATE OR DELETE ON public.subcontract_contracts FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 7. Comments
COMMENT ON TABLE public.subcontractors IS 'Project partner profiles and specializations.';
COMMENT ON TABLE public.subcontract_contracts IS 'Financial contracts linking subcontractors to project WBS nodes.';
