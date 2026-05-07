-- Migration: 20260507020000_supplier_invoices.sql
-- Supplier Invoices (3-Way Match) for BuildFlow Pro

-- 1. Create ENUM for invoice status (safely)
DO $$ 
BEGIN
  CREATE TYPE public.invoice_status AS ENUM ('draft', 'submitted', 'under_review', 'approved_for_payment', 'rejected', 'paid', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 2. Create Supplier Invoices table
CREATE TABLE IF NOT EXISTS public.supplier_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  po_id uuid NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  invoice_number text NOT NULL,
  invoice_date date NOT NULL,
  due_date date,
  amount numeric(15,2) NOT NULL,
  tax_amount numeric(15,2) DEFAULT 0,
  total_amount numeric(15,2) GENERATED ALWAYS AS (amount + tax_amount) STORED,
  status public.invoice_status NOT NULL DEFAULT 'draft',
  payment_status text DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partially_paid', 'paid')),
  paid_amount numeric(15,2) DEFAULT 0,
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,
  submitted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at timestamptz,
  po_match_status text DEFAULT 'pending' CHECK (po_match_status IN ('pending', 'matched', 'mismatch_quantity', 'mismatch_price', 'mismatch_both')),
  grn_match_status text DEFAULT 'pending' CHECK (grn_match_status IN ('pending', 'matched', 'mismatch_quantity', 'no_grn')),
  notes text,
  attachment_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(po_id, invoice_number)
);

-- 3. Create Invoice Items table
CREATE TABLE IF NOT EXISTS public.invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.supplier_invoices(id) ON DELETE CASCADE,
  po_item_id uuid REFERENCES public.po_items(id) ON DELETE SET NULL,
  description text NOT NULL,
  quantity numeric(10,2) NOT NULL DEFAULT 0,
  unit_price numeric(15,2) NOT NULL DEFAULT 0,
  total_price numeric(15,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  match_status text DEFAULT 'pending' CHECK (match_status IN ('pending', 'matched', 'mismatch', 'no_po_item')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Enable Row Level Security
ALTER TABLE public.supplier_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for Supplier Invoices
CREATE POLICY "Project members can view invoices"
  ON public.supplier_invoices FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_members.project_id = supplier_invoices.project_id
    AND project_members.user_id = auth.uid()
  ));

CREATE POLICY "Project members can manage invoices"
  ON public.supplier_invoices FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.role_permissions rp
    JOIN public.user_roles ur ON rp.role = ur.role
    WHERE ur.user_id = auth.uid()
    AND rp.module = 'procurement'
    AND rp.action = 'create'
    AND rp.is_allowed = true
  ));

-- 6. RLS Policies for Invoice Items
CREATE POLICY "Project members can view invoice items"
  ON public.invoice_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.supplier_invoices si
    JOIN public.project_members pm ON pm.project_id = si.project_id
    WHERE si.id = invoice_items.invoice_id
    AND pm.user_id = auth.uid()
  ));

CREATE POLICY "Project members can manage invoice items"
  ON public.invoice_items FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.role_permissions rp
    JOIN public.user_roles ur ON rp.role = ur.role
    WHERE ur.user_id = auth.uid()
    AND rp.module = 'procurement'
    AND rp.action = 'create'
    AND rp.is_allowed = true
  ));

-- 7. Updated_at trigger for invoices
CREATE OR REPLACE FUNCTION public.handle_invoice_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  CREATE TRIGGER handle_supplier_invoices_updated_at
    BEFORE UPDATE ON public.supplier_invoices
    FOR EACH ROW EXECUTE FUNCTION public.handle_invoice_updated_at();
EXCEPTION WHEN others THEN null;
END $$;

-- 8. Performance indexes
CREATE INDEX IF NOT EXISTS idx_supplier_invoices_project_id ON public.supplier_invoices(project_id);
CREATE INDEX IF NOT EXISTS idx_supplier_invoices_po_id ON public.supplier_invoices(po_id);
CREATE INDEX IF NOT EXISTS idx_supplier_invoices_status ON public.supplier_invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON public.invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_po_item_id ON public.invoice_items(po_item_id);

-- 9. Function to validate 3-way match on invoice submission
CREATE OR REPLACE FUNCTION public.validate_invoice_match()
RETURNS TRIGGER AS $$
DECLARE
  po_item record;
  invoice_item record;
BEGIN
  FOR invoice_item IN SELECT * FROM public.invoice_items WHERE invoice_id = NEW.id LOOP
    IF invoice_item.po_item_id IS NOT NULL THEN
      SELECT * INTO po_item FROM public.po_items WHERE id = invoice_item.po_item_id;
      IF invoice_item.quantity != po_item.quantity THEN
        UPDATE public.invoice_items SET match_status = 'mismatch' WHERE id = invoice_item.id;
      ELSE
        UPDATE public.invoice_items SET match_status = 'matched' WHERE id = invoice_item.id;
      END IF;
    ELSE
      UPDATE public.invoice_items SET match_status = 'no_po_item' WHERE id = invoice_item.id;
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Comments for documentation
COMMENT ON TABLE public.supplier_invoices IS 'Supplier invoices for 3-way matching with PO and GRN';
COMMENT ON TABLE public.invoice_items IS 'Individual line items in supplier invoices';
COMMENT ON COLUMN public.supplier_invoices.po_match_status IS 'Status of PO matching';
COMMENT ON COLUMN public.supplier_invoices.grn_match_status IS 'Status of GRN matching';
COMMENT ON COLUMN public.invoice_items.match_status IS 'Match status against PO items';
