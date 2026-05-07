-- Migration: 20260507010000_purchase_orders.sql
-- Purchase Order (PO) Management for BuildFlow Pro

-- 1. Create ENUM for PO status (safely)
DO $$ 
BEGIN
  CREATE TYPE public.po_status AS ENUM ('draft', 'submitted', 'review', 'finance_approved', 'issued', 'partially_delivered', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 2. Create Purchase Orders table
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  rfq_id uuid REFERENCES public.rfq(id) ON DELETE SET NULL,
  quotation_id uuid REFERENCES public.supplier_quotations(id) ON DELETE SET NULL,
  po_number text NOT NULL UNIQUE DEFAULT 'PO-' || to_char(now(), 'YYYYMMDD-') || nextval('po_number_seq'),
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
  status public.po_status NOT NULL DEFAULT 'draft',
  po_date date NOT NULL DEFAULT CURRENT_DATE,
  delivery_terms text DEFAULT 'Standard',
  payment_terms text DEFAULT 'Net 30',
  total_amount numeric(15,2) NOT NULL DEFAULT 0,
  currency text DEFAULT 'USD',
  expected_delivery date,
  actual_delivery date,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  notes text
);

-- Create sequence for PO number generation (safe)
DO $$
BEGIN
  CREATE SEQUENCE public.po_number_seq START 1;
EXCEPTION WHEN duplicate_table THEN null;
END $$;

-- 3. Create PO Items table
CREATE TABLE IF NOT EXISTS public.po_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id uuid NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  quotation_item_id uuid REFERENCES public.quotation_items(id) ON DELETE SET NULL,
  pr_item_id uuid REFERENCES public.pr_items(id) ON DELETE SET NULL,
  description text NOT NULL,
  quantity numeric(10,2) NOT NULL DEFAULT 0,
  unit_price numeric(15,2) NOT NULL DEFAULT 0,
  total_price numeric(15,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  delivered_quantity numeric(10,2) DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Enable Row Level Security
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.po_items ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for Purchase Orders
CREATE POLICY "Project members can view POs"
  ON public.purchase_orders FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_members.project_id = purchase_orders.project_id
    AND project_members.user_id = auth.uid()
  ));

CREATE POLICY "Procurement staff can manage POs"
  ON public.purchase_orders FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.role_permissions rp
    JOIN public.user_roles ur ON rp.role = ur.role
    WHERE ur.user_id = auth.uid()
    AND rp.module = 'procurement'
    AND rp.action = 'create'
    AND rp.is_allowed = true
  ));

-- 6. RLS Policies for PO Items
CREATE POLICY "Project members can view PO items"
  ON public.po_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.purchase_orders po
    JOIN public.project_members pm ON pm.project_id = po.project_id
    WHERE po.id = po_items.po_id
    AND pm.user_id = auth.uid()
  ));

CREATE POLICY "Procurement staff can manage PO items"
  ON public.po_items FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.role_permissions rp
    JOIN public.user_roles ur ON rp.role = ur.role
    WHERE ur.user_id = auth.uid()
    AND rp.module = 'procurement'
    AND rp.action = 'create'
    AND rp.is_allowed = true
  ));

-- 7. Updated_at trigger for PO
CREATE OR REPLACE FUNCTION public.handle_po_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  CREATE TRIGGER handle_po_updated_at
    BEFORE UPDATE ON public.purchase_orders
    FOR EACH ROW EXECUTE FUNCTION public.handle_po_updated_at();
EXCEPTION WHEN others THEN null;
END $$;

-- 8. Performance indexes
CREATE INDEX IF NOT EXISTS idx_purchase_orders_project_id ON public.purchase_orders(project_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON public.purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_id ON public.purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_po_items_po_id ON public.po_items(po_id);

-- 9. Comments for documentation
COMMENT ON TABLE public.purchase_orders IS 'Purchase Orders - formal contracts with suppliers';
COMMENT ON TABLE public.po_items IS 'Individual line items in Purchase Orders';
COMMENT ON COLUMN public.purchase_orders.rfq_id IS 'Link to RFQ that generated this PO';
COMMENT ON COLUMN public.purchase_orders.quotation_id IS 'Selected supplier quotation';
COMMENT ON COLUMN public.purchase_orders.delivery_terms IS 'e.g., FOB, CIF, EXW';
COMMENT ON COLUMN public.purchase_orders.payment_terms IS 'e.g., Net 30, Net 60, COD';
COMMENT ON COLUMN public.po_items.delivered_quantity IS 'Track partial deliveries';
