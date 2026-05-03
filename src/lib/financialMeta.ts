export type ClaimStatus = 'draft' | 'submitted' | 'certified' | 'paid' | 'rejected';

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
  bac: number; -- Budget at Completion
  ev: number;  -- Earned Value
  ac_materials: number;
  ac_total: number;
  cpi: number; -- Cost Performance Index
}

export const CLAIM_STATUS_COLORS: Record<ClaimStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  submitted: 'bg-blue-100 text-blue-700',
  certified: 'bg-green-100 text-green-700',
  paid: 'bg-green-600 text-white',
  rejected: 'bg-destructive text-destructive-foreground',
};
