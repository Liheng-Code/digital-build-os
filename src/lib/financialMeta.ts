export type ClaimStatus = 'draft' | 'submitted' | 'certified' | 'paid' | 'rejected';
export type AccountType = 'asset' | 'liability' | 'equity' | 'income' | 'expense';
export type PaymentRequestStatus = 'draft' | 'submitted' | 'approved' | 'paid' | 'cancelled';
export type PaymentRequestType = 'supplier' | 'subcontractor' | 'other';
export type ArInvoiceStatus = 'draft' | 'submitted' | 'certified' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled';
export type VoStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'cancelled';
export type CashFlowCategory = 'client_payment' | 'supplier_payment' | 'subcontractor_payment' | 'payroll' | 'overhead' | 'other_inflow' | 'other_outflow';
export type CashFlowItemStatus = 'forecast' | 'confirmed' | 'actual';
export type RetentionStatus = 'pending' | 'released' | 'cancelled';

export interface ResourceRate {
  id: string;
  project_id: string;
  resource_name: string;
  hourly_rate: number;
}

export interface ProgressClaim {
  id: string;
  project_id: string;
  claim_number: string;
  period_start: string;
  period_end: string;
  status: ClaimStatus;
  total_amount_claimed: number;
  total_amount_certified: number;
  retention_pct: number;
  remarks: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClaimItem {
  id: string;
  claim_id: string;
  wbs_node_id: string;
  description: string;
  uom: string;
  planned_qty: number;
  unit_rate: number;
  prev_qty: number;
  curr_qty: number;
  total_to_date_qty: number;
  certified_qty: number;
}

export interface ProjectCostSummary {
  project_id: string;
  wbs_node_id: string;
  task_id: string;
  task_title: string;
  bac: number; // Budget at Completion
  ev: number;  // Earned Value
  ac_materials: number;
  ac_labor: number;
  ac_total: number;
  cpi: number; // Cost Performance Index
}

// === Chart of Accounts ===
export interface ChartOfAccount {
  id: string;
  account_code: string;
  account_name: string;
  account_type: AccountType;
  parent_id: string | null;
  is_active: boolean;
  description: string | null;
  created_at: string;
  updated_at: string;
}

// === Payment Requests ===
export interface PaymentRequest {
  id: string;
  project_id: string;
  request_number: string;
  request_type: PaymentRequestType;
  payee_name: string;
  payee_id: string | null;
  description: string | null;
  amount: number;
  currency: string;
  due_date: string | null;
  status: PaymentRequestStatus;
  invoice_id: string | null;
  rejection_reason: string | null;
  requested_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  paid_at: string | null;
  payment_ref: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  items?: PaymentRequestItem[];
}

export interface PaymentRequestItem {
  id: string;
  payment_request_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  reference_type: string | null;
  reference_id: string | null;
  created_at: string;
}

// === Client Invoices (AR) ===
export interface ClientInvoice {
  id: string;
  project_id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string | null;
  period_start: string | null;
  period_end: string | null;
  amount: number;
  tax_amount: number;
  total_amount: number;
  status: ArInvoiceStatus;
  paid_amount: number;
  claim_id: string | null;
  client_id: string | null;
  certified_amount: number | null;
  retention_pct: number;
  retention_amount: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  payments?: ClientInvoicePayment[];
}

export interface ClientInvoicePayment {
  id: string;
  client_invoice_id: string;
  payment_date: string;
  amount: number;
  payment_ref: string | null;
  notes: string | null;
  created_at: string;
}

// === Variation Orders ===
export interface VariationOrder {
  id: string;
  project_id: string;
  wbs_node_id: string | null;
  vo_number: string;
  title: string;
  description: string | null;
  amount_change: number;
  currency: string;
  status: VoStatus;
  budget_id: string | null;
  client_invoice_id: string | null;
  reason: string | null;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// === Cash Flow ===
export interface CashFlowProjection {
  id: string;
  project_id: string;
  period_date: string;
  category: CashFlowCategory;
  description: string | null;
  forecast_amount: number;
  actual_amount: number;
  is_inflow: boolean;
  status: CashFlowItemStatus;
  linked_record_type: string | null;
  linked_record_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// === Retention Releases ===
export interface RetentionRelease {
  id: string;
  project_id: string;
  claim_id: string | null;
  client_invoice_id: string | null;
  release_number: string;
  release_date: string;
  retention_amount: number;
  released_amount: number;
  status: RetentionStatus;
  released_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const CLAIM_STATUS_COLORS: Record<ClaimStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  submitted: 'bg-blue-100 text-blue-700',
  certified: 'bg-green-100 text-green-700',
  paid: 'bg-green-600 text-white',
  rejected: 'bg-destructive text-destructive-foreground',
};

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  asset: 'Asset',
  liability: 'Liability',
  equity: 'Equity',
  income: 'Income',
  expense: 'Expense',
};

export const PAYMENT_REQUEST_STATUS_LABELS: Record<PaymentRequestStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  approved: 'Approved',
  paid: 'Paid',
  cancelled: 'Cancelled',
};

export const PAYMENT_REQUEST_TYPE_LABELS: Record<PaymentRequestType, string> = {
  supplier: 'Supplier',
  subcontractor: 'Subcontractor',
  other: 'Other',
};

export const PAYMENT_REQUEST_STATUS_TONE: Record<PaymentRequestStatus, { bg: string; fg: string; dot: string }> = {
  draft: { bg: 'bg-neutral-status-soft', fg: 'text-neutral-status', dot: 'bg-neutral-status' },
  submitted: { bg: 'bg-info-soft', fg: 'text-info', dot: 'bg-info' },
  approved: { bg: 'bg-success-soft', fg: 'text-success', dot: 'bg-success' },
  paid: { bg: 'bg-success-soft', fg: 'text-success', dot: 'bg-success' },
  cancelled: { bg: 'bg-muted', fg: 'text-muted-foreground', dot: 'bg-muted-foreground' },
};

export const AR_INVOICE_STATUS_LABELS: Record<ArInvoiceStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  certified: 'Certified',
  partially_paid: 'Partially Paid',
  paid: 'Paid',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
};

export const AR_INVOICE_STATUS_TONE: Record<ArInvoiceStatus, { bg: string; fg: string; dot: string }> = {
  draft: { bg: 'bg-neutral-status-soft', fg: 'text-neutral-status', dot: 'bg-neutral-status' },
  submitted: { bg: 'bg-info-soft', fg: 'text-info', dot: 'bg-info' },
  certified: { bg: 'bg-success-soft', fg: 'text-success', dot: 'bg-success' },
  partially_paid: { bg: 'bg-info-soft', fg: 'text-info', dot: 'bg-info' },
  paid: { bg: 'bg-success-soft', fg: 'text-success', dot: 'bg-success' },
  overdue: { bg: 'bg-destructive-soft', fg: 'text-destructive', dot: 'bg-destructive' },
  cancelled: { bg: 'bg-muted', fg: 'text-muted-foreground', dot: 'bg-muted-foreground' },
};

export const VO_STATUS_LABELS: Record<VoStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  approved: 'Approved',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
};

export const VO_STATUS_TONE: Record<VoStatus, { bg: string; fg: string; dot: string }> = {
  draft: { bg: 'bg-neutral-status-soft', fg: 'text-neutral-status', dot: 'bg-neutral-status' },
  submitted: { bg: 'bg-info-soft', fg: 'text-info', dot: 'bg-info' },
  approved: { bg: 'bg-success-soft', fg: 'text-success', dot: 'bg-success' },
  rejected: { bg: 'bg-destructive-soft', fg: 'text-destructive', dot: 'bg-destructive' },
  cancelled: { bg: 'bg-muted', fg: 'text-muted-foreground', dot: 'bg-muted-foreground' },
};

export const CASH_FLOW_CATEGORY_LABELS: Record<CashFlowCategory, string> = {
  client_payment: 'Client Payment',
  supplier_payment: 'Supplier Payment',
  subcontractor_payment: 'Subcontractor Payment',
  payroll: 'Payroll',
  overhead: 'Overhead',
  other_inflow: 'Other Inflow',
  other_outflow: 'Other Outflow',
};

export const CASH_FLOW_ITEM_STATUS_LABELS: Record<CashFlowItemStatus, string> = {
  forecast: 'Forecast',
  confirmed: 'Confirmed',
  actual: 'Actual',
};

export const RETENTION_STATUS_LABELS: Record<RetentionStatus, string> = {
  pending: 'Pending',
  released: 'Released',
  cancelled: 'Cancelled',
};
