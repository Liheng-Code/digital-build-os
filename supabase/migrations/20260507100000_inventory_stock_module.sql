-- Module 19: Inventory / Stock Module Migration
-- Aligned with DCOS System Architecture Module Design R0 Section 19

-- Create enums
CREATE TYPE inventory_item_category AS ENUM ('raw_material', 'finished_good', 'tool', 'equipment', 'consumable', 'spare_part');
CREATE TYPE stock_transaction_type AS ENUM ('receipt', 'issue', 'transfer_in', 'transfer_out', 'adjustment_add', 'adjustment_subtract');
CREATE TYPE material_request_status AS ENUM ('draft', 'pending_approval', 'approved', 'rejected', 'fulfilled', 'cancelled');
CREATE TYPE stock_receipt_status AS ENUM ('pending_inspection', 'inspected', 'accepted', 'rejected');
CREATE TYPE stock_issue_status AS ENUM ('pending_approval', 'approved', 'issued', 'returned');
CREATE TYPE stock_transfer_status AS ENUM ('pending_approval', 'approved', 'in_transit', 'completed');
CREATE TYPE stock_adjustment_type AS ENUM ('add', 'subtract');

-- Inventory Items Master Table
CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category inventory_item_category NOT NULL,
  unit_of_measure VARCHAR(20) NOT NULL,
  reorder_level DECIMAL(10,2) DEFAULT 0,
  max_stock_level DECIMAL(10,2),
  storage_location VARCHAR(100),
  wbs_node_id UUID REFERENCES wbs_nodes(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Stock Receipts (from PO/GRN)
CREATE TABLE IF NOT EXISTS stock_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_number VARCHAR(50) NOT NULL UNIQUE,
  po_id UUID REFERENCES purchase_orders(id) ON DELETE SET NULL,
  grn_id UUID REFERENCES grns(id) ON DELETE SET NULL,
  receipt_date DATE NOT NULL,
  status stock_receipt_status DEFAULT 'pending_inspection',
  supplier_name VARCHAR(255),
  delivery_note_number VARCHAR(100),
  inspected_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  inspection_date DATE,
  accepted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  acceptance_date DATE,
  notes TEXT,
  wbs_node_id UUID REFERENCES wbs_nodes(id) ON DELETE RESTRICT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Stock Receipt Items
CREATE TABLE IF NOT EXISTS stock_receipt_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_receipt_id UUID REFERENCES stock_receipts(id) ON DELETE CASCADE NOT NULL,
  inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE RESTRICT NOT NULL,
  quantity_received DECIMAL(10,2) NOT NULL,
  accepted_quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
  rejected_quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
  unit_cost DECIMAL(10,2),
  wbs_node_id UUID REFERENCES wbs_nodes(id) ON DELETE RESTRICT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Material Requests (from Site)
CREATE TABLE IF NOT EXISTS material_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number VARCHAR(50) NOT NULL UNIQUE,
  request_date DATE NOT NULL,
  required_by_date DATE NOT NULL,
  status material_request_status DEFAULT 'draft',
  requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approval_date DATE,
  wbs_node_id UUID REFERENCES wbs_nodes(id) ON DELETE RESTRICT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Material Request Items
CREATE TABLE IF NOT EXISTS material_request_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_request_id UUID REFERENCES material_requests(id) ON DELETE CASCADE NOT NULL,
  inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE RESTRICT NOT NULL,
  quantity_requested DECIMAL(10,2) NOT NULL,
  quantity_issued DECIMAL(10,2) DEFAULT 0,
  wbs_node_id UUID REFERENCES wbs_nodes(id) ON DELETE RESTRICT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Stock Issues (to Site/WBS)
CREATE TABLE IF NOT EXISTS stock_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_number VARCHAR(50) NOT NULL UNIQUE,
  material_request_id UUID REFERENCES material_requests(id) ON DELETE SET NULL,
  issue_date DATE NOT NULL,
  status stock_issue_status DEFAULT 'pending_approval',
  issued_to VARCHAR(255) NOT NULL,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approval_date DATE,
  issued_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  wbs_node_id UUID REFERENCES wbs_nodes(id) ON DELETE RESTRICT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Stock Issue Items
CREATE TABLE IF NOT EXISTS stock_issue_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_issue_id UUID REFERENCES stock_issues(id) ON DELETE CASCADE NOT NULL,
  inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE RESTRICT NOT NULL,
  quantity_issued DECIMAL(10,2) NOT NULL,
  unit_cost DECIMAL(10,2),
  wbs_node_id UUID REFERENCES wbs_nodes(id) ON DELETE RESTRICT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Stock Transfers (between locations/WBS)
CREATE TABLE IF NOT EXISTS stock_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_number VARCHAR(50) NOT NULL UNIQUE,
  from_storage_location VARCHAR(100) NOT NULL,
  to_storage_location VARCHAR(100) NOT NULL,
  transfer_date DATE NOT NULL,
  status stock_transfer_status DEFAULT 'pending_approval',
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approval_date DATE,
  from_wbs_node_id UUID REFERENCES wbs_nodes(id) ON DELETE RESTRICT NOT NULL,
  to_wbs_node_id UUID REFERENCES wbs_nodes(id) ON DELETE RESTRICT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Stock Transfer Items
CREATE TABLE IF NOT EXISTS stock_transfer_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_transfer_id UUID REFERENCES stock_transfers(id) ON DELETE CASCADE NOT NULL,
  inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE RESTRICT NOT NULL,
  quantity_transferred DECIMAL(10,2) NOT NULL,
  unit_cost DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Stock Adjustments
CREATE TABLE IF NOT EXISTS stock_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adjustment_number VARCHAR(50) NOT NULL UNIQUE,
  adjustment_date DATE NOT NULL,
  adjustment_type stock_adjustment_type NOT NULL,
  reason TEXT NOT NULL,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  wbs_node_id UUID REFERENCES wbs_nodes(id) ON DELETE RESTRICT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Stock Adjustment Items
CREATE TABLE IF NOT EXISTS stock_adjustment_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_adjustment_id UUID REFERENCES stock_adjustments(id) ON DELETE CASCADE NOT NULL,
  inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE RESTRICT NOT NULL,
  quantity_adjusted DECIMAL(10,2) NOT NULL,
  unit_cost DECIMAL(10,2),
  wbs_node_id UUID REFERENCES wbs_nodes(id) ON DELETE RESTRICT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Stock Balance Materialized View (fixed to avoid cartesian product)
CREATE OR REPLACE VIEW stock_balances AS
WITH receipt_totals AS (
  SELECT 
    sri.inventory_item_id,
    COALESCE(SUM(CASE WHEN sr.status = 'accepted' THEN sri.accepted_quantity ELSE 0 END), 0) AS total_receipts
  FROM stock_receipt_items sri
  LEFT JOIN stock_receipts sr ON sri.stock_receipt_id = sr.id
  GROUP BY sri.inventory_item_id
),
issue_totals AS (
  SELECT 
    sii.inventory_item_id,
    COALESCE(SUM(CASE WHEN si.status = 'issued' THEN sii.quantity_issued ELSE 0 END), 0) AS total_issues
  FROM stock_issue_items sii
  LEFT JOIN stock_issues si ON sii.stock_issue_id = si.id
  GROUP BY sii.inventory_item_id
),
transfer_in_totals AS (
  SELECT 
    sti.inventory_item_id,
    COALESCE(SUM(CASE WHEN st.status = 'completed' THEN sti.quantity_transferred ELSE 0 END), 0) AS total_transfers_in
  FROM stock_transfer_items sti
  LEFT JOIN stock_transfers st ON sti.stock_transfer_id = st.id
  WHERE st.to_wbs_node_id IS NOT NULL
  GROUP BY sti.inventory_item_id
),
transfer_out_totals AS (
  SELECT 
    sti.inventory_item_id,
    COALESCE(SUM(CASE WHEN st.status = 'completed' THEN sti.quantity_transferred ELSE 0 END), 0) AS total_transfers_out
  FROM stock_transfer_items sti
  LEFT JOIN stock_transfers st ON sti.stock_transfer_id = st.id
  WHERE st.from_wbs_node_id IS NOT NULL
  GROUP BY sti.inventory_item_id
),
adjustment_add_totals AS (
  SELECT 
    sai.inventory_item_id,
    COALESCE(SUM(CASE WHEN sa.adjustment_type = 'add' THEN sai.quantity_adjusted ELSE 0 END), 0) AS total_adjustments_add
  FROM stock_adjustment_items sai
  LEFT JOIN stock_adjustments sa ON sai.stock_adjustment_id = sa.id
  GROUP BY sai.inventory_item_id
),
adjustment_subtract_totals AS (
  SELECT 
    sai.inventory_item_id,
    COALESCE(SUM(CASE WHEN sa.adjustment_type = 'subtract' THEN sai.quantity_adjusted ELSE 0 END), 0) AS total_adjustments_subtract
  FROM stock_adjustment_items sai
  LEFT JOIN stock_adjustments sa ON sai.stock_adjustment_id = sa.id
  GROUP BY sai.inventory_item_id
)
SELECT 
  i.id AS inventory_item_id,
  i.code AS item_code,
  i.name AS item_name,
  i.unit_of_measure,
  COALESCE(rt.total_receipts, 0) AS total_receipts,
  COALESCE(it.total_issues, 0) AS total_issues,
  COALESCE(tin.total_transfers_in, 0) AS total_transfers_in,
  COALESCE(tout.total_transfers_out, 0) AS total_transfers_out,
  COALESCE(aa.total_adjustments_add, 0) AS total_adjustments_add,
  COALESCE(asub.total_adjustments_subtract, 0) AS total_adjustments_subtract,
  (COALESCE(rt.total_receipts, 0) 
   + COALESCE(tin.total_transfers_in, 0)
   + COALESCE(aa.total_adjustments_add, 0)
   - COALESCE(it.total_issues, 0)
   - COALESCE(tout.total_transfers_out, 0)
   - COALESCE(asub.total_adjustments_subtract, 0)
  ) AS current_balance
FROM inventory_items i
LEFT JOIN receipt_totals rt ON i.id = rt.inventory_item_id
LEFT JOIN issue_totals it ON i.id = it.inventory_item_id
LEFT JOIN transfer_in_totals tin ON i.id = tin.inventory_item_id
LEFT JOIN transfer_out_totals tout ON i.id = tout.inventory_item_id
LEFT JOIN adjustment_add_totals aa ON i.id = aa.inventory_item_id
LEFT JOIN adjustment_subtract_totals asub ON i.id = asub.inventory_item_id;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_inventory_items_wbs_node_id ON inventory_items(wbs_node_id);
CREATE INDEX IF NOT EXISTS idx_stock_receipts_po_id ON stock_receipts(po_id);
CREATE INDEX IF NOT EXISTS idx_stock_receipts_wbs_node_id ON stock_receipts(wbs_node_id);
CREATE INDEX IF NOT EXISTS idx_stock_receipt_items_receipt_id ON stock_receipt_items(stock_receipt_id);
CREATE INDEX IF NOT EXISTS idx_stock_receipt_items_item_id ON stock_receipt_items(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_material_requests_wbs_node_id ON material_requests(wbs_node_id);
CREATE INDEX IF NOT EXISTS idx_material_request_items_request_id ON material_request_items(material_request_id);
CREATE INDEX IF NOT EXISTS idx_material_request_items_item_id ON material_request_items(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_stock_issues_wbs_node_id ON stock_issues(wbs_node_id);
CREATE INDEX IF NOT EXISTS idx_stock_issue_items_issue_id ON stock_issue_items(stock_issue_id);
CREATE INDEX IF NOT EXISTS idx_stock_issue_items_item_id ON stock_issue_items(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_stock_transfers_wbs_node_id ON stock_transfers(from_wbs_node_id, to_wbs_node_id);
CREATE INDEX IF NOT EXISTS idx_stock_transfer_items_transfer_id ON stock_transfer_items(stock_transfer_id);
CREATE INDEX IF NOT EXISTS idx_stock_transfer_items_item_id ON stock_transfer_items(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_stock_adjustments_wbs_node_id ON stock_adjustments(wbs_node_id);
CREATE INDEX IF NOT EXISTS idx_stock_adjustment_items_adjustment_id ON stock_adjustment_items(stock_adjustment_id);
CREATE INDEX IF NOT EXISTS idx_stock_adjustment_items_item_id ON stock_adjustment_items(inventory_item_id);

-- Enable RLS
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_receipt_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_request_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_issue_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transfer_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_adjustment_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Authenticated users full access for now)
CREATE POLICY "Allow authenticated read inventory_items" ON inventory_items FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated insert inventory_items" ON inventory_items FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update inventory_items" ON inventory_items FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read stock_receipts" ON stock_receipts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated insert stock_receipts" ON stock_receipts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update stock_receipts" ON stock_receipts FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read stock_receipt_items" ON stock_receipt_items FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated insert stock_receipt_items" ON stock_receipt_items FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update stock_receipt_items" ON stock_receipt_items FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read material_requests" ON material_requests FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated insert material_requests" ON material_requests FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update material_requests" ON material_requests FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read material_request_items" ON material_request_items FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated insert material_request_items" ON material_request_items FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update material_request_items" ON material_request_items FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read stock_issues" ON stock_issues FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated insert stock_issues" ON stock_issues FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update stock_issues" ON stock_issues FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read stock_issue_items" ON stock_issue_items FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated insert stock_issue_items" ON stock_issue_items FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update stock_issue_items" ON stock_issue_items FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read stock_transfers" ON stock_transfers FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated insert stock_transfers" ON stock_transfers FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update stock_transfers" ON stock_transfers FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read stock_transfer_items" ON stock_transfer_items FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated insert stock_transfer_items" ON stock_transfer_items FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update stock_transfer_items" ON stock_transfer_items FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read stock_adjustments" ON stock_adjustments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated insert stock_adjustments" ON stock_adjustments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update stock_adjustments" ON stock_adjustments FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read stock_adjustment_items" ON stock_adjustment_items FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated insert stock_adjustment_items" ON stock_adjustment_items FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update stock_adjustment_items" ON stock_adjustment_items FOR UPDATE USING (auth.role() = 'authenticated');

-- Updated_at Triggers (reuse existing function from construction module)
CREATE OR REPLACE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON inventory_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_stock_receipts_updated_at BEFORE UPDATE ON stock_receipts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_stock_receipt_items_updated_at BEFORE UPDATE ON stock_receipt_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_material_requests_updated_at BEFORE UPDATE ON material_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_material_request_items_updated_at BEFORE UPDATE ON material_request_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_stock_issues_updated_at BEFORE UPDATE ON stock_issues FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_stock_issue_items_updated_at BEFORE UPDATE ON stock_issue_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_stock_transfers_updated_at BEFORE UPDATE ON stock_transfers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_stock_transfer_items_updated_at BEFORE UPDATE ON stock_transfer_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_stock_adjustments_updated_at BEFORE UPDATE ON stock_adjustments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_stock_adjustment_items_updated_at BEFORE UPDATE ON stock_adjustment_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
