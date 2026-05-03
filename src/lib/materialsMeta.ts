export type MrStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'ordered' | 'fulfilled';
export type PoStatus = 'draft' | 'issued' | 'partially_received' | 'completed' | 'cancelled';

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

export interface MaterialRequest {
  id: string;
  project_id: string;
  request_number: string;
  requested_by: string;
  request_date: string;
  required_date: string;
  status: MrStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface MaterialRequestItem {
  id: string;
  mr_id: string;
  boq_id: string | null;
  task_id: string | null;
  material_name: string;
  uom: string;
  requested_qty: number;
  approved_qty: number | null;
  notes: string | null;
}

export interface PurchaseOrder {
  id: string;
  project_id: string;
  po_number: string;
  supplier_name: string;
  po_date: string;
  status: PoStatus;
  total_amount: number;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrderItem {
  id: string;
  po_id: string;
  mr_item_id: string | null;
  material_name: string;
  uom: string;
  order_qty: number;
  unit_price: number;
  total_price: number;
}

export interface Grn {
  id: string;
  po_id: string | null;
  project_id: string;
  grn_number: string;
  received_by: string;
  delivery_date: string;
  delivery_note_ref: string | null;
  created_at: string;
}

export interface GrnItem {
  id: string;
  grn_id: string;
  po_item_id: string | null;
  material_name: string;
  uom: string;
  received_qty: number;
  accepted_qty: number;
  rejected_qty: number;
  notes: string | null;
}

export interface StockBalance {
  id: string;
  project_id: string;
  material_name: string;
  uom: string;
  qty_on_hand: number;
  avg_unit_cost: number;
  last_updated: string;
}

export interface MaterialIssue {
  id: string;
  project_id: string;
  task_id: string;
  material_name: string;
  issued_by: string;
  issue_date: string;
  qty_issued: number;
  unit_cost_at_issue: number;
  notes: string | null;
}

export const formatMrStatus = (status: MrStatus) => {
  return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

export const formatPoStatus = (status: PoStatus) => {
  return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};
