-- Migration: 20260507001000_suppliers.sql
-- Suppliers table for BuildFlow Pro

-- Create Suppliers table
CREATE TABLE IF NOT EXISTS public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact_person text,
  email text,
  phone text,
  address text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blacklisted')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Suppliers (safe creation)
DO $$
BEGIN
  CREATE POLICY "Authenticated users can view suppliers"
    ON public.suppliers FOR SELECT
    TO authenticated
    USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
  CREATE POLICY "Procurement staff can manage suppliers"
    ON public.suppliers FOR ALL
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

-- Updated_at trigger for suppliers
CREATE OR REPLACE FUNCTION public.handle_suppliers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  CREATE TRIGGER handle_suppliers_updated_at
    BEFORE UPDATE ON public.suppliers
    FOR EACH ROW EXECUTE FUNCTION public.handle_suppliers_updated_at();
EXCEPTION WHEN others THEN null;
END $$;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_suppliers_status ON public.suppliers(status);
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON public.suppliers(name);

-- Comments for documentation
COMMENT ON TABLE public.suppliers IS 'Suppliers and vendors for procurement';
COMMENT ON COLUMN public.suppliers.status IS 'Supplier status: active, inactive, blacklisted';
