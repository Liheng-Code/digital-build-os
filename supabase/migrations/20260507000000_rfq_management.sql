-- Migration: 20260507000000_rfq_management.sql
-- RFQ Management Tables for BuildFlow Pro

-- Enable required extensions (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create sequence for RFQ number generation (safe creation)
DO $$
BEGIN
  CREATE SEQUENCE public.rfq_number_seq START 1;
EXCEPTION WHEN duplicate_table THEN null;
END $$;

-- 1. RFQ Main Table
CREATE TABLE IF NOT EXISTS public.rfq (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    pr_id uuid REFERENCES public.purchase_requisitions(id) ON DELETE SET NULL,
    rfq_number text NOT NULL UNIQUE DEFAULT 'RFQ-' || to_char(now(), 'YYYYMMDD-') || nextval('rfq_number_seq'),
    issue_date date NOT NULL DEFAULT CURRENT_DATE,
    due_date date NOT NULL,
    status text NOT NULL CHECK (status IN ('draft', 'issued', 'closed', 'cancelled')) DEFAULT 'draft',
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. RFQ Suppliers (invited suppliers)
CREATE TABLE IF NOT EXISTS public.rfq_suppliers (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    rfq_id uuid NOT NULL REFERENCES public.rfq(id) ON DELETE CASCADE,
    supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
    invitation_date date,
    response_status text NOT NULL CHECK (response_status IN ('pending', 'responded', 'declined')) DEFAULT 'pending',
    notes text,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Supplier Quotations
CREATE TABLE IF NOT EXISTS public.supplier_quotations (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    rfq_id uuid NOT NULL REFERENCES public.rfq(id) ON DELETE CASCADE,
    supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
    quotation_number text,
    quotation_date date NOT NULL,
    total_amount numeric(15,2) NOT NULL DEFAULT 0,
    status text NOT NULL CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')) DEFAULT 'draft',
    attachment_url text,
    notes text,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(rfq_id, supplier_id)
);

-- 4. Quotation Line Items
CREATE TABLE IF NOT EXISTS public.quotation_items (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    quotation_id uuid NOT NULL REFERENCES public.supplier_quotations(id) ON DELETE CASCADE,
    item_description text NOT NULL,
    quantity numeric(10,2) NOT NULL DEFAULT 0,
    unit_price numeric(15,2) NOT NULL DEFAULT 0,
    total_price numeric(15,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    technical_compliance text,
    pr_item_id uuid REFERENCES public.pr_items(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.rfq ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfq_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies (safe creation)
DO $$
BEGIN
  CREATE POLICY "Project members can view RFQs"
    ON public.rfq FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.project_members
        WHERE project_members.project_id = rfq.project_id
        AND project_members.user_id = auth.uid()
    ));
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
  CREATE POLICY "Project members can create RFQs"
    ON public.rfq FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.project_members
        WHERE project_members.project_id = rfq.project_id
        AND project_members.user_id = auth.uid()
    ));
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
  CREATE POLICY "Procurement staff can update RFQs"
    ON public.rfq FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM public.role_permissions rp
        JOIN public.user_roles ur ON rp.role = ur.role
        WHERE ur.user_id = auth.uid()
        AND rp.module = 'procurement'
        AND rp.action = 'create'
        AND rp.is_allowed = true
    ));
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Updated_at trigger for RFQ
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  CREATE TRIGGER handle_rfq_updated_at
    BEFORE UPDATE ON public.rfq
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION WHEN others THEN null;
END $$;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_rfq_project_id ON public.rfq(project_id);
CREATE INDEX IF NOT EXISTS idx_rfq_status ON public.rfq(status);
CREATE INDEX IF NOT EXISTS idx_rfq_suppliers_rfq_id ON public.rfq_suppliers(rfq_id);
CREATE INDEX IF NOT EXISTS idx_supplier_quotations_rfq_id ON public.supplier_quotations(rfq_id);
CREATE INDEX IF NOT EXISTS idx_quotation_items_quotation_id ON public.quotation_items(quotation_id);

-- Comments
COMMENT ON TABLE public.rfq IS 'Request for Quotation (RFQ) main table - manages supplier bidding process';
COMMENT ON TABLE public.rfq_suppliers IS 'Suppliers invited to quote for an RFQ';
COMMENT ON TABLE public.supplier_quotations IS 'Supplier quotation responses to RFQs';
COMMENT ON TABLE public.quotation_items IS 'Line items in supplier quotations';
