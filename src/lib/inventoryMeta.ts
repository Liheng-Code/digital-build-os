// Inventory / Stock Module Meta - Module 19
// Aligned with DCOS System Architecture Module Design R0, Section 19

// Inventory Item Categories (matches DB enum inventory_item_category)
export type InventoryItemCategory = 
  | 'raw_material' 
  | 'finished_good' 
  | 'tool' 
  | 'equipment' 
  | 'consumable' 
  | 'spare_part';

// Stock Transaction Types (matches DB enum stock_transaction_type)
export type StockTransactionType = 
  | 'receipt' 
  | 'issue' 
  | 'transfer_in' 
  | 'transfer_out' 
  | 'adjustment_add' 
  | 'adjustment_subtract';

// Material Request Statuses (matches DB enum material_request_status)
export type MaterialRequestStatus = 
  | 'draft' 
  | 'pending_approval' 
  | 'approved' 
  | 'rejected' 
  | 'fulfilled' 
  | 'cancelled';

// Stock Receipt Statuses (matches DB enum stock_receipt_status)
export type StockReceiptStatus = 
  | 'pending_inspection' 
  | 'inspected' 
  | 'accepted' 
  | 'rejected';

// Stock Issue Statuses (matches DB enum stock_issue_status)
export type StockIssueStatus = 
  | 'pending_approval' 
  | 'approved' 
  | 'issued' 
  | 'returned';

// Stock Transfer Statuses (matches DB enum stock_transfer_status)
export type StockTransferStatus = 
  | 'pending_approval' 
  | 'approved' 
  | 'in_transit' 
  | 'completed';

// Stock Adjustment Types (matches DB enum stock_adjustment_type)
export type StockAdjustmentType = 'add' | 'subtract';

// Inventory Item Category Labels (Section 19.2)
export const INVENTORY_ITEM_CATEGORY_LABELS: Record<InventoryItemCategory, string> = {
  raw_material: 'Raw Material',
  finished_good: 'Finished Good',
  tool: 'Tool',
  equipment: 'Equipment',
  consumable: 'Consumable',
  spare_part: 'Spare Part',
};

// Inventory Item Category Tones (shadcn/ui color patterns)
export const INVENTORY_ITEM_CATEGORY_TONE: Record<InventoryItemCategory, string> = {
  raw_material: 'bg-blue-100 text-blue-800',
  finished_good: 'bg-green-100 text-green-800',
  tool: 'bg-purple-100 text-purple-800',
  equipment: 'bg-orange-100 text-orange-800',
  consumable: 'bg-yellow-100 text-yellow-800',
  spare_part: 'bg-gray-100 text-gray-800',
};

// Material Request Status Labels (Section 19.3)
export const MATERIAL_REQUEST_STATUS_LABELS: Record<MaterialRequestStatus, string> = {
  draft: 'Draft',
  pending_approval: 'Pending Approval',
  approved: 'Approved',
  rejected: 'Rejected',
  fulfilled: 'Fulfilled',
  cancelled: 'Cancelled',
};

// Material Request Status Tones
export const MATERIAL_REQUEST_STATUS_TONE: Record<MaterialRequestStatus, { bg: string; fg: string; dot: string }> = {
  draft:                  { bg: 'bg-neutral-status-soft', fg: 'text-neutral-status', dot: 'bg-neutral-status' },
  pending_approval:       { bg: 'bg-warning-soft', fg: 'text-warning', dot: 'bg-warning' },
  approved:               { bg: 'bg-success-soft', fg: 'text-success', dot: 'bg-success' },
  rejected:               { bg: 'bg-destructive-soft', fg: 'text-destructive', dot: 'bg-destructive' },
  fulfilled:              { bg: 'bg-primary-soft', fg: 'text-primary', dot: 'bg-primary' },
  cancelled:              { bg: 'bg-muted', fg: 'text-muted-foreground', dot: 'bg-muted-foreground' },
};

// Stock Receipt Status Labels
export const STOCK_RECEIPT_STATUS_LABELS: Record<StockReceiptStatus, string> = {
  pending_inspection: 'Pending Inspection',
  inspected: 'Inspected',
  accepted: 'Accepted',
  rejected: 'Rejected',
};

// Stock Receipt Status Tones
export const STOCK_RECEIPT_STATUS_TONE: Record<StockReceiptStatus, { bg: string; fg: string; dot: string }> = {
  pending_inspection:      { bg: 'bg-warning-soft', fg: 'text-warning', dot: 'bg-warning' },
  inspected:               { bg: 'bg-info-soft', fg: 'text-info', dot: 'bg-info' },
  accepted:                { bg: 'bg-success-soft', fg: 'text-success', dot: 'bg-success' },
  rejected:                { bg: 'bg-destructive-soft', fg: 'text-destructive', dot: 'bg-destructive' },
};

// Stock Issue Status Labels
export const STOCK_ISSUE_STATUS_LABELS: Record<StockIssueStatus, string> = {
  pending_approval: 'Pending Approval',
  approved: 'Approved',
  issued: 'Issued',
  returned: 'Returned',
};

// Stock Issue Status Tones
export const STOCK_ISSUE_STATUS_TONE: Record<StockIssueStatus, { bg: string; fg: string; dot: string }> = {
  pending_approval:       { bg: 'bg-warning-soft', fg: 'text-warning', dot: 'bg-warning' },
  approved:               { bg: 'bg-success-soft', fg: 'text-success', dot: 'bg-success' },
  issued:                 { bg: 'bg-primary-soft', fg: 'text-primary', dot: 'bg-primary' },
  returned:               { bg: 'bg-info-soft', fg: 'text-info', dot: 'bg-info' },
};

// Stock Transfer Status Labels
export const STOCK_TRANSFER_STATUS_LABELS: Record<StockTransferStatus, string> = {
  pending_approval: 'Pending Approval',
  approved: 'Approved',
  in_transit: 'In Transit',
  completed: 'Completed',
};

// Stock Transfer Status Tones
export const STOCK_TRANSFER_STATUS_TONE: Record<StockTransferStatus, { bg: string; fg: string; dot: string }> = {
  pending_approval:       { bg: 'bg-warning-soft', fg: 'text-warning', dot: 'bg-warning' },
  approved:               { bg: 'bg-success-soft', fg: 'text-success', dot: 'bg-success' },
  in_transit:             { bg: 'bg-info-soft', fg: 'text-info', dot: 'bg-info' },
  completed:              { bg: 'bg-primary-soft', fg: 'text-primary', dot: 'bg-primary' },
};

// Stock Adjustment Type Labels
export const STOCK_ADJUSTMENT_TYPE_LABELS: Record<StockAdjustmentType, string> = {
  add: 'Add Stock',
  subtract: 'Subtract Stock',
};

// Stock Flow (Section 19.3)
// PO approved → material delivered → store receives → inspection → stock increases → site requests issue → store issues → stock decreases → consumption links to WBS
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

// Material Request Status Flow
export const MATERIAL_REQUEST_STATUS_FLOW: Record<MaterialRequestStatus, MaterialRequestStatus[]> = {
  draft: ['pending_approval', 'cancelled'],
  pending_approval: ['approved', 'rejected'],
  approved: ['fulfilled', 'cancelled'],
  rejected: ['draft'],
  fulfilled: [],
  cancelled: [],
};

// Stock Receipt Status Flow
export const STOCK_RECEIPT_STATUS_FLOW: Record<StockReceiptStatus, StockReceiptStatus[]> = {
  pending_inspection: ['inspected', 'rejected'],
  inspected: ['accepted', 'rejected'],
  accepted: [],
  rejected: ['pending_inspection'],
};

// Stock Issue Status Flow
export const STOCK_ISSUE_STATUS_FLOW: Record<StockIssueStatus, StockIssueStatus[]> = {
  pending_approval: ['approved', 'returned'],
  approved: ['issued', 'returned'],
  issued: [],
  returned: ['pending_approval'],
};

// Stock Transfer Status Flow
export const STOCK_TRANSFER_STATUS_FLOW: Record<StockTransferStatus, StockTransferStatus[]> = {
  pending_approval: ['approved'],
  approved: ['in_transit'],
  in_transit: ['completed'],
  completed: [],
};

// Dashboard KPI Definitions
export type InventoryKPIType = 
  | 'total_items' 
  | 'total_stock_value' 
  | 'low_stock_items' 
  | 'pending_receipts' 
  | 'pending_issues' 
  | 'aging_stock';

export const INVENTORY_KPI_LABELS: Record<InventoryKPIType, string> = {
  total_items: 'Total Inventory Items',
  total_stock_value: 'Total Stock Value',
  low_stock_items: 'Low Stock Items',
  pending_receipts: 'Pending Receipts',
  pending_issues: 'Pending Issues',
  aging_stock: 'Aging Stock (90+ Days)',
};
