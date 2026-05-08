// Procurement Module Meta — Unified types for Procurement & MTO, RFQs, POs, Invoices, GRNs, Budgets, Inventory & Stock, Subcontractors

// ============================================================
// 1. Status Type Unions
// ============================================================

// Purchase Requisition
export type PrStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'cancelled';

// RFQ
export type RfqStatus = 'draft' | 'issued' | 'closed' | 'cancelled';

// Quotation
export type QuotationStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

// Purchase Order
export type PoStatus = 'draft' | 'submitted' | 'review' | 'finance_approved' | 'issued' | 'partially_delivered' | 'completed' | 'cancelled';

// GRN
export type GrnDeliveryStatus = 'pending' | 'partially_received' | 'completed' | 'rejected';
export type GrnPoMatchStatus = 'pending' | 'matched' | 'mismatch_quantity' | 'mismatch_price' | 'no_po';
export type GrnItemQuantityMatchStatus = 'pending' | 'matched' | 'mismatch' | 'no_po_item';
export type GrnItemQualityStatus = 'pending' | 'passed' | 'failed';

// Supplier Invoice
export type InvoiceStatus = 'draft' | 'submitted' | 'under_review' | 'approved_for_payment' | 'rejected' | 'paid' | 'cancelled';
export type InvoicePaymentStatus = 'unpaid' | 'partially_paid' | 'paid';
export type InvoiceMatchStatus = 'pending' | 'matched' | 'mismatch' | 'no_po_item';
export type InvoicePoMatchStatus = 'pending' | 'matched' | 'mismatch_quantity' | 'mismatch_price' | 'mismatch_both';
export type InvoiceGrnMatchStatus = 'pending' | 'matched' | 'mismatch_quantity' | 'no_grn';

// Budget
export type BudgetStatus = 'active' | 'closed' | 'cancelled';

// Material Request (inventory)
export type MaterialRequestStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'ordered' | 'fulfilled' | 'cancelled';

// MTO
export type MtoStatus = 'pending' | 'approved' | 'ordered';

// Inventory Items
export type InventoryItemCategory = 'raw_material' | 'finished_good' | 'tool' | 'equipment' | 'consumable' | 'spare_part';
export type StockTransactionType = 'receipt' | 'issue' | 'transfer_in' | 'transfer_out' | 'adjustment_add' | 'adjustment_subtract';
export type StockReceiptStatus = 'pending_inspection' | 'inspected' | 'accepted' | 'rejected';
export type StockIssueStatus = 'pending_approval' | 'approved' | 'issued' | 'returned';
export type StockTransferStatus = 'pending_approval' | 'approved' | 'in_transit' | 'completed';
export type StockAdjustmentType = 'add' | 'subtract';

// Subcontractors
export type SubcontractorStatus = 'active' | 'inactive' | 'blacklisted';
export type ContractStatus = 'draft' | 'active' | 'completed' | 'terminated';

// RFQ Supplier response
export type RfqSupplierResponseStatus = 'pending' | 'responded' | 'declined';

// ============================================================
// 2. Interface Definitions
// ============================================================

// --- Purchase Requisition ---
export interface PurchaseRequisition {
  id: string;
  project_id: string;
  pr_number: string;
  subject: string;
  description: string | null;
  required_date: string | null;
  total_estimate: number;
  status: PrStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  pr_items?: PrItem[];
}

export interface PrItem {
  id: string;
  pr_id: string;
  material_id: string | null;
  description: string | null;
  quantity: number;
  unit_price: number;
  total_price: number | null;
}

// --- Material Catalog ---
export interface MaterialCatalogItem {
  id: string;
  code: string;
  name: string;
  category: string;
  unit: string;
  default_price: number;
}

// --- MTO (Material Take-Off) ---
export interface RdsMaterialTakeoff {
  id: string;
  project_id: string;
  wbs_node_id: string;
  material_id: string;
  quantity: number;
  status: MtoStatus;
  created_at: string;
}

// --- RFQ ---
export interface RFQ {
  id: string;
  project_id: string;
  pr_id: string | null;
  rfq_number: string;
  issue_date: string;
  due_date: string;
  status: RfqStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  purchase_requisitions?: { pr_number: string };
  rfq_suppliers?: RFQSupplier[];
  _count?: { rfq_suppliers: number; supplier_quotations: number };
}

export interface RFQSupplier {
  id: string;
  rfq_id: string;
  supplier_id: string;
  invitation_date: string | null;
  response_status: RfqSupplierResponseStatus;
  notes: string | null;
  suppliers?: Supplier;
}

export interface SupplierQuotation {
  id: string;
  rfq_id: string;
  supplier_id: string;
  quotation_number: string | null;
  quotation_date: string;
  total_amount: number;
  status: QuotationStatus;
  attachment_url: string | null;
  notes: string | null;
  created_at: string;
  suppliers?: { id: string; name: string };
  quotation_items?: QuotationItem[];
}

export interface QuotationItem {
  id: string;
  quotation_id: string;
  item_description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  technical_compliance: string | null;
  pr_item_id: string | null;
}

// --- Supplier ---
export interface Supplier {
  id: string;
  name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  status: string;
}

// --- Purchase Order ---
export interface PurchaseOrder {
  id: string;
  project_id: string;
  rfq_id: string | null;
  quotation_id: string | null;
  po_number: string;
  supplier_id: string;
  status: PoStatus;
  po_date: string;
  delivery_terms: string | null;
  payment_terms: string | null;
  total_amount: number;
  currency: string | null;
  expected_delivery: string | null;
  actual_delivery: string | null;
  created_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  suppliers?: Supplier;
  rfq?: { rfq_number: string };
  supplier_quotations?: { quotation_number: string | null };
  po_items?: POItem[];
}

export interface POItem {
  id: string;
  po_id: string;
  quotation_item_id: string | null;
  pr_item_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  delivered_quantity: number;
  created_at: string;
}

// --- GRN (Goods Received Note) ---
export interface GRN {
  id: string;
  po_id: string;
  project_id: string;
  grn_number: string;
  delivery_note_number: string | null;
  vehicle_number: string | null;
  driver_name: string | null;
  driver_phone: string | null;
  received_by: string | null;
  delivery_date: string;
  actual_delivery_date: string | null;
  inspection_required: boolean | null;
  inspection_passed: boolean | null;
  inspection_notes: string | null;
  delivery_status: GrnDeliveryStatus;
  po_match_status: GrnPoMatchStatus;
  created_at: string;
  purchase_orders?: { po_number: string; total_amount: number; suppliers?: { name: string } };
  grn_items?: GRNItem[];
}

export interface GRNItem {
  id: string;
  grn_id: string;
  po_item_id: string | null;
  material_name: string;
  uom: string;
  received_qty: number;
  accepted_qty: number;
  rejected_qty: number;
  po_quantity: number | null;
  quantity_match_status: GrnItemQuantityMatchStatus;
  quality_status: GrnItemQualityStatus;
  rejected_reason: string | null;
}

// --- Supplier Invoice ---
export interface SupplierInvoice {
  id: string;
  project_id: string;
  po_id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string | null;
  amount: number;
  tax_amount: number;
  total_amount: number;
  status: InvoiceStatus;
  payment_status: InvoicePaymentStatus;
  paid_amount: number;
  supplier_id: string | null;
  submitted_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  po_match_status: InvoicePoMatchStatus;
  grn_match_status: InvoiceGrnMatchStatus;
  notes: string | null;
  attachment_url: string | null;
  created_at: string;
  updated_at: string;
  suppliers?: { id: string; name: string };
  purchase_orders?: { po_number: string; total_amount: number };
  invoice_items?: InvoiceItem[];
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  po_item_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  match_status: InvoiceMatchStatus;
  created_at: string;
}

// --- Budget ---
export interface ProjectBudget {
  id: string;
  project_id: string;
  budget_code: string;
  budget_name: string;
  total_budget: number;
  committed_amount: number;
  spent_amount: number;
  currency: string | null;
  fiscal_year: number | null;
  notes: string | null;
  status: BudgetStatus;
  created_at: string;
  updated_at: string;
  budget_line_items?: BudgetLineItem[];
}

export interface BudgetLineItem {
  id: string;
  budget_id: string;
  wbs_node_id: string | null;
  cost_code: string | null;
  description: string;
  planned_amount: number;
  committed_amount: number;
  actual_amount: number;
  variance: number;
  created_at: string;
}

export interface BudgetCheckResult {
  is_available: boolean;
  available_amount: number;
  budget_total: number;
  committed_total: number;
  spent_total: number;
}

// --- Material Request (Inventory) ---
export interface MaterialRequest {
  id: string;
  request_number: string;
  request_date: string;
  required_by_date: string;
  status: MaterialRequestStatus;
  requested_by: string;
  approved_by: string | null;
  approval_date: string | null;
  wbs_node_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  requested_by_name?: string;
  wbs_path?: string;
  items?: MaterialRequestItem[];
}

export interface MaterialRequestItem {
  id: string;
  material_request_id: string;
  inventory_item_id: string;
  quantity_requested: number;
  quantity_issued: number;
  wbs_node_id: string | null;
  created_at: string;
  updated_at: string;
  item_code?: string;
  item_name?: string;
  unit_of_measure?: string;
}

// --- BOQ ---
export interface BoqItem {
  id: string;
  project_id: string;
  task_id: string | null;
  material_name: string;
  uom: string;
  planned_qty: number;
  unit_cost: number;
  total_cost: number;
  created_at: string;
  updated_at: string;
}

// --- Stock Balance ---
export interface StockBalance {
  inventory_item_id: string;
  item_code: string;
  item_name: string;
  unit_of_measure: string;
  total_receipts: number;
  total_issues: number;
  total_transfers_in: number;
  total_transfers_out: number;
  total_adjustments_add: number;
  total_adjustments_subtract: number;
  current_balance: number;
}

// --- Inventory Items ---
export interface InventoryItem {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: InventoryItemCategory;
  unit_of_measure: string;
  reorder_level: number;
  max_stock_level: number | null;
  storage_location: string | null;
  wbs_node_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// --- Stock Receipt ---
export interface StockReceipt {
  id: string;
  receipt_number: string;
  po_id: string | null;
  grn_id: string | null;
  receipt_date: string;
  status: StockReceiptStatus;
  supplier_name: string | null;
  delivery_note_number: string | null;
  inspected_by: string | null;
  inspection_date: string | null;
  accepted_by: string | null;
  acceptance_date: string | null;
  notes: string | null;
  wbs_node_id: string;
  created_at: string;
  updated_at: string;
  po_number?: string;
  grn_number?: string;
}

export interface StockReceiptItem {
  id: string;
  stock_receipt_id: string;
  inventory_item_id: string;
  quantity_received: number;
  accepted_quantity: number;
  rejected_quantity: number;
  unit_cost: number | null;
  wbs_node_id: string;
  created_at: string;
  updated_at: string;
  item_code?: string;
  item_name?: string;
  unit_of_measure?: string;
}

// --- Stock Issue ---
export interface StockIssue {
  id: string;
  issue_number: string;
  material_request_id: string | null;
  issue_date: string;
  status: StockIssueStatus;
  issued_to: string;
  approved_by: string | null;
  approval_date: string | null;
  issued_by: string | null;
  wbs_node_id: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  request_number?: string;
}

export interface StockIssueItem {
  id: string;
  stock_issue_id: string;
  inventory_item_id: string;
  quantity_issued: number;
  unit_cost: number | null;
  wbs_node_id: string;
  created_at: string;
  updated_at: string;
  item_code?: string;
  item_name?: string;
  unit_of_measure?: string;
}

// --- Stock Transfer ---
export interface StockTransfer {
  id: string;
  transfer_number: string;
  from_storage_location: string;
  to_storage_location: string;
  transfer_date: string;
  status: StockTransferStatus;
  approved_by: string | null;
  approval_date: string | null;
  from_wbs_node_id: string;
  to_wbs_node_id: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface StockTransferItem {
  id: string;
  stock_transfer_id: string;
  inventory_item_id: string;
  quantity_transferred: number;
  unit_cost: number | null;
  created_at: string;
  updated_at: string;
  item_code?: string;
  item_name?: string;
  unit_of_measure?: string;
}

// --- Stock Adjustment ---
export interface StockAdjustment {
  id: string;
  adjustment_number: string;
  adjustment_date: string;
  adjustment_type: StockAdjustmentType;
  reason: string;
  approved_by: string | null;
  wbs_node_id: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface StockAdjustmentItem {
  id: string;
  stock_adjustment_id: string;
  inventory_item_id: string;
  quantity_adjusted: number;
  unit_cost: number | null;
  wbs_node_id: string;
  created_at: string;
  updated_at: string;
  item_code?: string;
  item_name?: string;
  unit_of_measure?: string;
}

// --- Subcontractor ---
export interface Subcontractor {
  id: string;
  company_name: string;
  specialization: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  rating: number;
  status: SubcontractorStatus;
  created_at: string;
}

export interface SubcontractContract {
  id: string;
  project_id: string;
  subcontractor_id: string;
  contract_number: string;
  subject: string;
  total_value: number;
  retention_percentage: number;
  start_date: string | null;
  end_date: string | null;
  status: ContractStatus;
  created_at: string;
  updated_at: string;
  subcontractors?: { company_name: string; specialization: string };
}

export interface SubcontractClaim {
  id: string;
  contract_id: string;
  claim_number: string;
  period_start: string;
  period_end: string;
  claimed_amount: number;
  certified_amount: number;
  status: string;
  notes: string | null;
  created_at: string;
  subcontract_contracts?: { contract_number: string; subcontractors?: { company_name: string } };
}

// ============================================================
// 3. Label Maps
// ============================================================

export const PR_STATUS_LABELS: Record<PrStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  approved: 'Approved',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
};

export const RFQ_STATUS_LABELS: Record<RfqStatus, string> = {
  draft: 'Draft',
  issued: 'Issued',
  closed: 'Closed',
  cancelled: 'Cancelled',
};

export const QUOTATION_STATUS_LABELS: Record<QuotationStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  approved: 'Approved',
  rejected: 'Rejected',
};

export const PO_STATUS_LABELS: Record<PoStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  review: 'Under Review',
  finance_approved: 'Finance Approved',
  issued: 'Issued',
  partially_delivered: 'Partially Delivered',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const GRN_DELIVERY_STATUS_LABELS: Record<GrnDeliveryStatus, string> = {
  pending: 'Pending',
  partially_received: 'Partially Received',
  completed: 'Completed',
  rejected: 'Rejected',
};

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  under_review: 'Under Review',
  approved_for_payment: 'Approved for Payment',
  rejected: 'Rejected',
  paid: 'Paid',
  cancelled: 'Cancelled',
};

export const INVOICE_PAYMENT_STATUS_LABELS: Record<InvoicePaymentStatus, string> = {
  unpaid: 'Unpaid',
  partially_paid: 'Partially Paid',
  paid: 'Paid',
};

export const MATERIAL_REQUEST_STATUS_LABELS: Record<MaterialRequestStatus, string> = {
  draft: 'Draft',
  pending_approval: 'Pending Approval',
  approved: 'Approved',
  rejected: 'Rejected',
  ordered: 'Ordered',
  fulfilled: 'Fulfilled',
  cancelled: 'Cancelled',
};

export const INVENTORY_ITEM_CATEGORY_LABELS: Record<InventoryItemCategory, string> = {
  raw_material: 'Raw Material',
  finished_good: 'Finished Good',
  tool: 'Tool',
  equipment: 'Equipment',
  consumable: 'Consumable',
  spare_part: 'Spare Part',
};

export const STOCK_RECEIPT_STATUS_LABELS: Record<StockReceiptStatus, string> = {
  pending_inspection: 'Pending Inspection',
  inspected: 'Inspected',
  accepted: 'Accepted',
  rejected: 'Rejected',
};

export const STOCK_ISSUE_STATUS_LABELS: Record<StockIssueStatus, string> = {
  pending_approval: 'Pending Approval',
  approved: 'Approved',
  issued: 'Issued',
  returned: 'Returned',
};

export const STOCK_TRANSFER_STATUS_LABELS: Record<StockTransferStatus, string> = {
  pending_approval: 'Pending Approval',
  approved: 'Approved',
  in_transit: 'In Transit',
  completed: 'Completed',
};

export const STOCK_ADJUSTMENT_TYPE_LABELS: Record<StockAdjustmentType, string> = {
  add: 'Add Stock',
  subtract: 'Subtract Stock',
};

export const SUBCONTRACTOR_STATUS_LABELS: Record<SubcontractorStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
  blacklisted: 'Blacklisted',
};

export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  draft: 'Draft',
  active: 'Active',
  completed: 'Completed',
  terminated: 'Terminated',
};

export const RFQ_SUPPLIER_RESPONSE_LABELS: Record<RfqSupplierResponseStatus, string> = {
  pending: 'Pending',
  responded: 'Responded',
  declined: 'Declined',
};

// ============================================================
// 4. Tone Maps (for status badges)
// ============================================================

export type StatusTone = { bg: string; fg: string; dot: string };

export const PR_STATUS_TONE: Record<PrStatus, StatusTone> = {
  draft:                  { bg: 'bg-neutral-status-soft', fg: 'text-neutral-status', dot: 'bg-neutral-status' },
  submitted:              { bg: 'bg-info-soft', fg: 'text-info', dot: 'bg-info' },
  approved:               { bg: 'bg-success-soft', fg: 'text-success', dot: 'bg-success' },
  rejected:               { bg: 'bg-destructive-soft', fg: 'text-destructive', dot: 'bg-destructive' },
  cancelled:              { bg: 'bg-muted', fg: 'text-muted-foreground', dot: 'bg-muted-foreground' },
};

export const RFQ_STATUS_TONE: Record<RfqStatus, StatusTone> = {
  draft:                  { bg: 'bg-neutral-status-soft', fg: 'text-neutral-status', dot: 'bg-neutral-status' },
  issued:                 { bg: 'bg-info-soft', fg: 'text-info', dot: 'bg-info' },
  closed:                 { bg: 'bg-success-soft', fg: 'text-success', dot: 'bg-success' },
  cancelled:              { bg: 'bg-muted', fg: 'text-muted-foreground', dot: 'bg-muted-foreground' },
};

export const QUOTATION_STATUS_TONE: Record<QuotationStatus, StatusTone> = {
  draft:                  { bg: 'bg-neutral-status-soft', fg: 'text-neutral-status', dot: 'bg-neutral-status' },
  submitted:              { bg: 'bg-info-soft', fg: 'text-info', dot: 'bg-info' },
  approved:               { bg: 'bg-success-soft', fg: 'text-success', dot: 'bg-success' },
  rejected:               { bg: 'bg-destructive-soft', fg: 'text-destructive', dot: 'bg-destructive' },
};

export const PO_STATUS_TONE: Record<PoStatus, StatusTone> = {
  draft:                  { bg: 'bg-neutral-status-soft', fg: 'text-neutral-status', dot: 'bg-neutral-status' },
  submitted:              { bg: 'bg-info-soft', fg: 'text-info', dot: 'bg-info' },
  review:                 { bg: 'bg-warning-soft', fg: 'text-warning', dot: 'bg-warning' },
  finance_approved:       { bg: 'bg-success-soft', fg: 'text-success', dot: 'bg-success' },
  issued:                 { bg: 'bg-primary-soft', fg: 'text-primary', dot: 'bg-primary' },
  partially_delivered:    { bg: 'bg-info-soft', fg: 'text-info', dot: 'bg-info' },
  completed:              { bg: 'bg-success-soft', fg: 'text-success', dot: 'bg-success' },
  cancelled:              { bg: 'bg-muted', fg: 'text-muted-foreground', dot: 'bg-muted-foreground' },
};

export const GRN_DELIVERY_STATUS_TONE: Record<GrnDeliveryStatus, StatusTone> = {
  pending:                { bg: 'bg-warning-soft', fg: 'text-warning', dot: 'bg-warning' },
  partially_received:     { bg: 'bg-info-soft', fg: 'text-info', dot: 'bg-info' },
  completed:              { bg: 'bg-success-soft', fg: 'text-success', dot: 'bg-success' },
  rejected:               { bg: 'bg-destructive-soft', fg: 'text-destructive', dot: 'bg-destructive' },
};

export const INVOICE_STATUS_TONE: Record<InvoiceStatus, StatusTone> = {
  draft:                  { bg: 'bg-neutral-status-soft', fg: 'text-neutral-status', dot: 'bg-neutral-status' },
  submitted:              { bg: 'bg-info-soft', fg: 'text-info', dot: 'bg-info' },
  under_review:           { bg: 'bg-warning-soft', fg: 'text-warning', dot: 'bg-warning' },
  approved_for_payment:   { bg: 'bg-success-soft', fg: 'text-success', dot: 'bg-success' },
  rejected:               { bg: 'bg-destructive-soft', fg: 'text-destructive', dot: 'bg-destructive' },
  paid:                   { bg: 'bg-success-soft', fg: 'text-success', dot: 'bg-success' },
  cancelled:              { bg: 'bg-muted', fg: 'text-muted-foreground', dot: 'bg-muted-foreground' },
};

export const MATERIAL_REQUEST_STATUS_TONE: Record<MaterialRequestStatus, StatusTone> = {
  draft:                  { bg: 'bg-neutral-status-soft', fg: 'text-neutral-status', dot: 'bg-neutral-status' },
  pending_approval:       { bg: 'bg-warning-soft', fg: 'text-warning', dot: 'bg-warning' },
  approved:               { bg: 'bg-success-soft', fg: 'text-success', dot: 'bg-success' },
  rejected:               { bg: 'bg-destructive-soft', fg: 'text-destructive', dot: 'bg-destructive' },
  ordered:                { bg: 'bg-info-soft', fg: 'text-info', dot: 'bg-info' },
  fulfilled:              { bg: 'bg-primary-soft', fg: 'text-primary', dot: 'bg-primary' },
  cancelled:              { bg: 'bg-muted', fg: 'text-muted-foreground', dot: 'bg-muted-foreground' },
};

export const STOCK_RECEIPT_STATUS_TONE: Record<StockReceiptStatus, StatusTone> = {
  pending_inspection:     { bg: 'bg-warning-soft', fg: 'text-warning', dot: 'bg-warning' },
  inspected:              { bg: 'bg-info-soft', fg: 'text-info', dot: 'bg-info' },
  accepted:               { bg: 'bg-success-soft', fg: 'text-success', dot: 'bg-success' },
  rejected:               { bg: 'bg-destructive-soft', fg: 'text-destructive', dot: 'bg-destructive' },
};

export const STOCK_ISSUE_STATUS_TONE: Record<StockIssueStatus, StatusTone> = {
  pending_approval:       { bg: 'bg-warning-soft', fg: 'text-warning', dot: 'bg-warning' },
  approved:               { bg: 'bg-success-soft', fg: 'text-success', dot: 'bg-success' },
  issued:                 { bg: 'bg-primary-soft', fg: 'text-primary', dot: 'bg-primary' },
  returned:               { bg: 'bg-info-soft', fg: 'text-info', dot: 'bg-info' },
};

export const STOCK_TRANSFER_STATUS_TONE: Record<StockTransferStatus, StatusTone> = {
  pending_approval:       { bg: 'bg-warning-soft', fg: 'text-warning', dot: 'bg-warning' },
  approved:               { bg: 'bg-success-soft', fg: 'text-success', dot: 'bg-success' },
  in_transit:             { bg: 'bg-info-soft', fg: 'text-info', dot: 'bg-info' },
  completed:              { bg: 'bg-primary-soft', fg: 'text-primary', dot: 'bg-primary' },
};

export const CONTRACT_STATUS_TONE: Record<ContractStatus, StatusTone> = {
  draft:                  { bg: 'bg-neutral-status-soft', fg: 'text-neutral-status', dot: 'bg-neutral-status' },
  active:                 { bg: 'bg-success-soft', fg: 'text-success', dot: 'bg-success' },
  completed:              { bg: 'bg-primary-soft', fg: 'text-primary', dot: 'bg-primary' },
  terminated:             { bg: 'bg-destructive-soft', fg: 'text-destructive', dot: 'bg-destructive' },
};

// ============================================================
// 5. Status Flow / Transition Maps
// ============================================================

export const PR_STATUS_FLOW: Record<PrStatus, PrStatus[]> = {
  draft: ['submitted', 'cancelled'],
  submitted: ['approved', 'rejected'],
  approved: ['cancelled'],
  rejected: ['draft'],
  cancelled: [],
};

export const RFQ_STATUS_FLOW: Record<RfqStatus, RfqStatus[]> = {
  draft: ['issued', 'cancelled'],
  issued: ['closed', 'cancelled'],
  closed: [],
  cancelled: [],
};

export const QUOTATION_STATUS_FLOW: Record<QuotationStatus, QuotationStatus[]> = {
  draft: ['submitted', 'rejected'],
  submitted: ['approved', 'rejected'],
  approved: [],
  rejected: [],
};

export const PO_STATUS_FLOW: Record<PoStatus, PoStatus[]> = {
  draft: ['submitted', 'cancelled'],
  submitted: ['review', 'cancelled'],
  review: ['finance_approved', 'cancelled'],
  finance_approved: ['issued'],
  issued: ['partially_delivered', 'completed', 'cancelled'],
  partially_delivered: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

export const MATERIAL_REQUEST_STATUS_FLOW: Record<MaterialRequestStatus, MaterialRequestStatus[]> = {
  draft: ['pending_approval', 'cancelled'],
  pending_approval: ['approved', 'rejected'],
  approved: ['ordered', 'fulfilled', 'cancelled'],
  rejected: ['draft'],
  ordered: ['fulfilled', 'cancelled'],
  fulfilled: [],
  cancelled: [],
};

export const STOCK_RECEIPT_STATUS_FLOW: Record<StockReceiptStatus, StockReceiptStatus[]> = {
  pending_inspection: ['inspected', 'rejected'],
  inspected: ['accepted', 'rejected'],
  accepted: [],
  rejected: ['pending_inspection'],
};

export const STOCK_ISSUE_STATUS_FLOW: Record<StockIssueStatus, StockIssueStatus[]> = {
  pending_approval: ['approved', 'returned'],
  approved: ['issued', 'returned'],
  issued: [],
  returned: ['pending_approval'],
};

export const STOCK_TRANSFER_STATUS_FLOW: Record<StockTransferStatus, StockTransferStatus[]> = {
  pending_approval: ['approved'],
  approved: ['in_transit'],
  in_transit: ['completed'],
  completed: [],
};

// ============================================================
// 6. Stock Flow Steps
// ============================================================

export const STOCK_FLOW_STEPS = [
  { step: 1, label: 'PO Approved', module: 'Procurement', action: 'Link to PO' },
  { step: 2, label: 'Material Delivered', module: 'Procurement', action: 'GRN Created' },
  { step: 3, label: 'Store Receives', module: 'Inventory', action: 'Stock Receipt Created' },
  { step: 4, label: 'Inspection', module: 'Inventory', action: 'Receipt Inspected' },
  { step: 5, label: 'Stock Increases', module: 'Inventory', action: 'Receipt Accepted' },
  { step: 6, label: 'Site Requests Issue', module: 'Inventory', action: 'Material Request Created' },
  { step: 7, label: 'Store Issues', module: 'Inventory', action: 'Stock Issue Created' },
  { step: 8, label: 'Stock Decreases', module: 'Inventory', action: 'Issue Issued' },
  { step: 9, label: 'Consumption Links to WBS', module: 'Construction', action: 'WBS Node Linked' },
] as const;

// ============================================================
// 7. KPI Types
// ============================================================

export type ProcurementKPIType = 'pending_prs' | 'total_approved' | 'catalog_items' | 'budget_utilized';
export type InventoryKPIType = 'total_items' | 'total_stock_value' | 'low_stock_items' | 'pending_receipts' | 'pending_issues' | 'aging_stock';

export const INVENTORY_KPI_LABELS: Record<InventoryKPIType, string> = {
  total_items: 'Total Inventory Items',
  total_stock_value: 'Total Stock Value',
  low_stock_items: 'Low Stock Items',
  pending_receipts: 'Pending Receipts',
  pending_issues: 'Pending Issues',
  aging_stock: 'Aging Stock (90+ Days)',
};

// ============================================================
// 8. Format Helpers
// ============================================================

export function formatStatus(status: string): string {
  return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

export function formatDate(date: string | null, fmt: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' }): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-US', fmt);
}
