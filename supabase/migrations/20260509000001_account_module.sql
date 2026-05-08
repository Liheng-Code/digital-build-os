-- Migration: 20260509000001_account_module.sql
-- Account / Finance Module (Module 16) for BuildFlow Pro

-- ============================================================
-- 1. ENUMS
-- ============================================================
DO $$ BEGIN
  CREATE TYPE public.account_type AS ENUM ('asset', 'liability', 'equity', 'income', 'expense');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_request_status AS ENUM ('draft', 'submitted', 'approved', 'paid', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.ar_invoice_status AS ENUM ('draft', 'submitted', 'certified', 'partially_paid', 'paid', 'overdue', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.vo_status AS ENUM ('draft', 'submitted', 'approved', 'rejected', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ============================================================
-- 2. CHART OF ACCOUNTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.chart_of_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_code text NOT NULL,
  account_name text NOT NULL,
  account_type public.account_type NOT NULL,
  parent_id uuid REFERENCES public.chart_of_accounts(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(account_code)
);

ALTER TABLE public.chart_of_accounts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  CREATE POLICY "Authenticated users can view COA"
    ON public.chart_of_accounts FOR SELECT
    USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
  CREATE POLICY "Admin can manage COA"
    ON public.chart_of_accounts FOR ALL
    USING (EXISTS (
      SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
    ));
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS idx_coa_type ON public.chart_of_accounts(account_type);
CREATE INDEX IF NOT EXISTS idx_coa_parent ON public.chart_of_accounts(parent_id);

-- Seed default COA entries
INSERT INTO public.chart_of_accounts (account_code, account_name, account_type) VALUES
  ('1000', 'Cash & Bank', 'asset'),
  ('1100', 'Accounts Receivable', 'asset'),
  ('1200', 'Inventory', 'asset'),
  ('1300', 'Fixed Assets', 'asset'),
  ('2000', 'Accounts Payable', 'liability'),
  ('2100', 'Accrued Expenses', 'liability'),
  ('2200', 'Retention Payable', 'liability'),
  ('3000', 'Owner Equity', 'equity'),
  ('3100', 'Retained Earnings', 'equity'),
  ('4000', 'Revenue - Construction', 'income'),
  ('4100', 'Revenue - Variations', 'income'),
  ('5000', 'Direct Costs - Materials', 'expense'),
  ('5100', 'Direct Costs - Labor', 'expense'),
  ('5200', 'Direct Costs - Equipment', 'expense'),
  ('5300', 'Subcontractor Costs', 'expense'),
  ('5400', 'Indirect Costs', 'expense'),
  ('5500', 'Admin Expenses', 'expense')
ON CONFLICT (account_code) DO NOTHING;

-- ============================================================
-- 3. PAYMENT REQUESTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.payment_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  request_number text NOT NULL,
  request_type text NOT NULL CHECK (request_type IN ('supplier', 'subcontractor', 'other')),
  payee_name text NOT NULL,
  payee_id uuid,
  description text,
  amount numeric(15,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  due_date date,
  status public.payment_request_status NOT NULL DEFAULT 'draft',
  invoice_id uuid,
  rejection_reason text,
  requested_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at timestamptz,
  paid_at timestamptz,
  payment_ref text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id, request_number)
);

ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  CREATE POLICY "Project members can view payment requests"
    ON public.payment_requests FOR SELECT
    USING (EXISTS (
      SELECT 1 FROM public.project_members
      WHERE project_members.project_id = payment_requests.project_id
      AND project_members.user_id = auth.uid()
    ));
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
  CREATE POLICY "Account/admin can manage payment requests"
    ON public.payment_requests FOR ALL
    USING (EXISTS (
      SELECT 1 FROM public.role_permissions rp
      JOIN public.user_roles ur ON rp.role = ur.role
      WHERE ur.user_id = auth.uid()
      AND rp.module = 'financials'
      AND rp.action IN ('create', 'approve')
      AND rp.is_allowed = true
    ));
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS idx_payment_requests_project ON public.payment_requests(project_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_status ON public.payment_requests(status);
CREATE INDEX IF NOT EXISTS idx_payment_requests_type ON public.payment_requests(request_type);

-- Payment Request Items
CREATE TABLE IF NOT EXISTS public.payment_request_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_request_id uuid NOT NULL REFERENCES public.payment_requests(id) ON DELETE CASCADE,
  description text NOT NULL,
  quantity numeric(10,2) DEFAULT 0,
  unit_price numeric(15,2) DEFAULT 0,
  total_price numeric(15,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  reference_type text,
  reference_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_request_items ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  CREATE POLICY "View payment request items"
    ON public.payment_request_items FOR SELECT
    USING (EXISTS (
      SELECT 1 FROM public.payment_requests pr
      JOIN public.project_members pm ON pm.project_id = pr.project_id
      WHERE pr.id = payment_request_items.payment_request_id
      AND pm.user_id = auth.uid()
    ));
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
  CREATE POLICY "Manage payment request items"
    ON public.payment_request_items FOR ALL
    USING (EXISTS (
      SELECT 1 FROM public.role_permissions rp
      JOIN public.user_roles ur ON rp.role = ur.role
      WHERE ur.user_id = auth.uid()
      AND rp.module = 'financials'
      AND rp.action = 'create'
      AND rp.is_allowed = true
    ));
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS idx_payment_request_items_request ON public.payment_request_items(payment_request_id);

-- ============================================================
-- 4. CLIENT INVOICES (AR / Accounts Receivable)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.client_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  invoice_number text NOT NULL,
  invoice_date date NOT NULL,
  due_date date,
  period_start date,
  period_end date,
  amount numeric(15,2) NOT NULL DEFAULT 0,
  tax_amount numeric(15,2) DEFAULT 0,
  total_amount numeric(15,2) GENERATED ALWAYS AS (amount + tax_amount) STORED,
  status public.ar_invoice_status NOT NULL DEFAULT 'draft',
  paid_amount numeric(15,2) DEFAULT 0,
  claim_id uuid REFERENCES public.progress_claims(id) ON DELETE SET NULL,
  client_id uuid,
  certified_amount numeric(15,2),
  retention_pct numeric(5,2) DEFAULT 0,
  retention_amount numeric(15,2) GENERATED ALWAYS AS (total_amount * (retention_pct / 100)) STORED,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id, invoice_number)
);

ALTER TABLE public.client_invoices ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  CREATE POLICY "Project members can view client invoices"
    ON public.client_invoices FOR SELECT
    USING (EXISTS (
      SELECT 1 FROM public.project_members
      WHERE project_members.project_id = client_invoices.project_id
      AND project_members.user_id = auth.uid()
    ));
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
  CREATE POLICY "Account/admin can manage client invoices"
    ON public.client_invoices FOR ALL
    USING (EXISTS (
      SELECT 1 FROM public.role_permissions rp
      JOIN public.user_roles ur ON rp.role = ur.role
      WHERE ur.user_id = auth.uid()
      AND rp.module = 'financials'
      AND rp.action IN ('create', 'approve')
      AND rp.is_allowed = true
    ));
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS idx_client_invoices_project ON public.client_invoices(project_id);
CREATE INDEX IF NOT EXISTS idx_client_invoices_status ON public.client_invoices(status);

-- Client Invoice Payments (track partial payments)
CREATE TABLE IF NOT EXISTS public.client_invoice_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_invoice_id uuid NOT NULL REFERENCES public.client_invoices(id) ON DELETE CASCADE,
  payment_date date NOT NULL,
  amount numeric(15,2) NOT NULL,
  payment_ref text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.client_invoice_payments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  CREATE POLICY "View invoice payments"
    ON public.client_invoice_payments FOR SELECT
    USING (EXISTS (
      SELECT 1 FROM public.client_invoices ci
      JOIN public.project_members pm ON pm.project_id = ci.project_id
      WHERE ci.id = client_invoice_payments.client_invoice_id
      AND pm.user_id = auth.uid()
    ));
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
  CREATE POLICY "Manage invoice payments"
    ON public.client_invoice_payments FOR ALL
    USING (EXISTS (
      SELECT 1 FROM public.role_permissions rp
      JOIN public.user_roles ur ON rp.role = ur.role
      WHERE ur.user_id = auth.uid()
      AND rp.module = 'financials'
      AND rp.action = 'create'
      AND rp.is_allowed = true
    ));
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS idx_client_invoice_payments_invoice ON public.client_invoice_payments(client_invoice_id);

-- ============================================================
-- 5. VARIATION ORDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.variation_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  wbs_node_id uuid REFERENCES public.wbs_nodes(id) ON DELETE SET NULL,
  vo_number text NOT NULL,
  title text NOT NULL,
  description text,
  amount_change numeric(15,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  status public.vo_status NOT NULL DEFAULT 'draft',
  budget_id uuid REFERENCES public.project_budgets(id) ON DELETE SET NULL,
  client_invoice_id uuid REFERENCES public.client_invoices(id) ON DELETE SET NULL,
  reason text,
  approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at timestamptz,
  rejection_reason text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id, vo_number)
);

ALTER TABLE public.variation_orders ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  CREATE POLICY "Project members can view VOs"
    ON public.variation_orders FOR SELECT
    USING (EXISTS (
      SELECT 1 FROM public.project_members
      WHERE project_members.project_id = variation_orders.project_id
      AND project_members.user_id = auth.uid()
    ));
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
  CREATE POLICY "Account/admin can manage VOs"
    ON public.variation_orders FOR ALL
    USING (EXISTS (
      SELECT 1 FROM public.role_permissions rp
      JOIN public.user_roles ur ON rp.role = ur.role
      WHERE ur.user_id = auth.uid()
      AND rp.module = 'financials'
      AND rp.action IN ('create', 'approve')
      AND rp.is_allowed = true
    ));
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS idx_variation_orders_project ON public.variation_orders(project_id);
CREATE INDEX IF NOT EXISTS idx_variation_orders_status ON public.variation_orders(status);

-- ============================================================
-- 6. CASH FLOW PROJECTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.cash_flow_projections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  period_date date NOT NULL,
  category text NOT NULL CHECK (category IN ('client_payment', 'supplier_payment', 'subcontractor_payment', 'payroll', 'overhead', 'other_inflow', 'other_outflow')),
  description text,
  forecast_amount numeric(15,2) NOT NULL DEFAULT 0,
  actual_amount numeric(15,2) DEFAULT 0,
  is_inflow boolean NOT NULL DEFAULT false,
  status text DEFAULT 'forecast' CHECK (status IN ('forecast', 'confirmed', 'actual')),
  linked_record_type text,
  linked_record_id uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cash_flow_projections ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  CREATE POLICY "Project members can view cash flow"
    ON public.cash_flow_projections FOR SELECT
    USING (EXISTS (
      SELECT 1 FROM public.project_members
      WHERE project_members.project_id = cash_flow_projections.project_id
      AND project_members.user_id = auth.uid()
    ));
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
  CREATE POLICY "Account/admin can manage cash flow"
    ON public.cash_flow_projections FOR ALL
    USING (EXISTS (
      SELECT 1 FROM public.role_permissions rp
      JOIN public.user_roles ur ON rp.role = ur.role
      WHERE ur.user_id = auth.uid()
      AND rp.module = 'financials'
      AND rp.action = 'create'
      AND rp.is_allowed = true
    ));
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS idx_cash_flow_project ON public.cash_flow_projections(project_id);
CREATE INDEX IF NOT EXISTS idx_cash_flow_period ON public.cash_flow_projections(period_date);
CREATE INDEX IF NOT EXISTS idx_cash_flow_category ON public.cash_flow_projections(category);

-- ============================================================
-- 7. RETENTION RELEASES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.retention_releases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  claim_id uuid REFERENCES public.progress_claims(id) ON DELETE SET NULL,
  client_invoice_id uuid REFERENCES public.client_invoices(id) ON DELETE SET NULL,
  release_number text NOT NULL,
  release_date date NOT NULL,
  retention_amount numeric(15,2) NOT NULL DEFAULT 0,
  released_amount numeric(15,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'released', 'cancelled')),
  released_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id, release_number)
);

ALTER TABLE public.retention_releases ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  CREATE POLICY "Project members can view retentions"
    ON public.retention_releases FOR SELECT
    USING (EXISTS (
      SELECT 1 FROM public.project_members
      WHERE project_members.project_id = retention_releases.project_id
      AND project_members.user_id = auth.uid()
    ));
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
  CREATE POLICY "Account/admin can manage retentions"
    ON public.retention_releases FOR ALL
    USING (EXISTS (
      SELECT 1 FROM public.role_permissions rp
      JOIN public.user_roles ur ON rp.role = ur.role
      WHERE ur.user_id = auth.uid()
      AND rp.module = 'financials'
      AND rp.action = 'create'
      AND rp.is_allowed = true
    ));
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS idx_retention_releases_project ON public.retention_releases(project_id);

-- ============================================================
-- 8. UPDATED_AT TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_account_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER handle_coa_updated_at BEFORE UPDATE ON public.chart_of_accounts FOR EACH ROW EXECUTE FUNCTION public.handle_account_updated_at();
EXCEPTION WHEN others THEN null;
END $$;

DO $$ BEGIN
  CREATE TRIGGER handle_payment_requests_updated_at BEFORE UPDATE ON public.payment_requests FOR EACH ROW EXECUTE FUNCTION public.handle_account_updated_at();
EXCEPTION WHEN others THEN null;
END $$;

DO $$ BEGIN
  CREATE TRIGGER handle_client_invoices_updated_at BEFORE UPDATE ON public.client_invoices FOR EACH ROW EXECUTE FUNCTION public.handle_account_updated_at();
EXCEPTION WHEN others THEN null;
END $$;

DO $$ BEGIN
  CREATE TRIGGER handle_variation_orders_updated_at BEFORE UPDATE ON public.variation_orders FOR EACH ROW EXECUTE FUNCTION public.handle_account_updated_at();
EXCEPTION WHEN others THEN null;
END $$;

DO $$ BEGIN
  CREATE TRIGGER handle_cash_flow_updated_at BEFORE UPDATE ON public.cash_flow_projections FOR EACH ROW EXECUTE FUNCTION public.handle_account_updated_at();
EXCEPTION WHEN others THEN null;
END $$;

DO $$ BEGIN
  CREATE TRIGGER handle_retention_releases_updated_at BEFORE UPDATE ON public.retention_releases FOR EACH ROW EXECUTE FUNCTION public.handle_account_updated_at();
EXCEPTION WHEN others THEN null;
END $$;

-- ============================================================
-- 9. FUNCTION: Update client invoice paid_amount on payment
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_client_invoice_paid_amount()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.client_invoices
  SET paid_amount = (
    SELECT COALESCE(SUM(amount), 0)
    FROM public.client_invoice_payments
    WHERE client_invoice_id = NEW.client_invoice_id
  )
  WHERE id = NEW.client_invoice_id;

  -- Auto-update status to paid if fully paid
  UPDATE public.client_invoices
  SET status = CASE
    WHEN paid_amount >= total_amount THEN 'paid'::public.ar_invoice_status
    WHEN paid_amount > 0 THEN 'partially_paid'::public.ar_invoice_status
    ELSE status
  END
  WHERE id = NEW.client_invoice_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER handle_client_invoice_payment_insert
    AFTER INSERT ON public.client_invoice_payments
    FOR EACH ROW EXECUTE FUNCTION public.update_client_invoice_paid_amount();
EXCEPTION WHEN others THEN null;
END $$;

-- ============================================================
-- 10. COMMENTS
-- ============================================================
COMMENT ON TABLE public.chart_of_accounts IS 'Chart of Accounts for financial reporting';
COMMENT ON TABLE public.payment_requests IS 'Payment requests for suppliers, subcontractors, and other payees';
COMMENT ON TABLE public.client_invoices IS 'Client invoices / Accounts Receivable for project billing';
COMMENT ON TABLE public.client_invoice_payments IS 'Track partial payments against client invoices';
COMMENT ON TABLE public.variation_orders IS 'Variation Orders tracking budget changes';
COMMENT ON TABLE public.cash_flow_projections IS 'Cash flow forecasting and actual tracking';
COMMENT ON TABLE public.retention_releases IS 'Retention release tracking for client contracts';
