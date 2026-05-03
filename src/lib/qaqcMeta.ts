import { AppRole } from '@/contexts/AuthContext';

export type IrStatus = 'draft' | 'requested' | 'scheduled' | 'passed' | 'failed' | 'passed_with_remarks';
export type ChecklistResult = 'pass' | 'fail' | 'n/a';
export type NcrSeverity = 'low' | 'medium' | 'high' | 'critical';
export type NcrStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type PunchListStatus = 'open' | 'resolved' | 'verified';

export interface InspectionChecklist {
  id: string;
  project_id: string;
  task_type: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface InspectionChecklistItem {
  id: string;
  checklist_id: string;
  order_index: number;
  item_text: string;
  is_required: boolean;
  created_at: string;
}

export interface InspectionRequest {
  id: string;
  project_id: string;
  task_id: string | null;
  request_number: string;
  location: string | null;
  status: IrStatus;
  requested_by: string | null;
  inspected_by: string | null;
  requested_date: string;
  inspection_date: string | null;
  remarks: string | null;
  created_at: string;
  updated_at: string;
  // Joins
  requested_by_profile?: { full_name: string | null } | null;
  inspected_by_profile?: { full_name: string | null } | null;
  task?: { title: string; code: string | null } | null;
}

export interface InspectionResult {
  id: string;
  inspection_request_id: string;
  checklist_item_id: string;
  status: ChecklistResult | null;
  comments: string | null;
  created_at: string;
  updated_at: string;
}

export interface NCR {
  id: string;
  project_id: string;
  task_id: string | null;
  inspection_request_id: string | null;
  ncr_number: string;
  issue_description: string;
  severity: NcrSeverity;
  status: NcrStatus;
  reported_by: string | null;
  assigned_to: string | null;
  corrective_action: string | null;
  created_at: string;
  updated_at: string;
  // Joins
  reported_by_profile?: { full_name: string | null } | null;
  assigned_to_profile?: { full_name: string | null } | null;
  task?: { title: string; code: string | null } | null;
}

export interface PunchListItem {
  id: string;
  project_id: string;
  task_id: string | null;
  inspection_request_id: string | null;
  location: string | null;
  description: string;
  status: PunchListStatus;
  created_by: string | null;
  resolved_by: string | null;
  verified_by: string | null;
  created_at: string;
  updated_at: string;
  // Joins
  created_by_profile?: { full_name: string | null } | null;
  task?: { title: string; code: string | null } | null;
}

export function formatIrStatus(status: IrStatus): string {
  switch (status) {
    case 'draft': return 'Draft';
    case 'requested': return 'Requested';
    case 'scheduled': return 'Scheduled';
    case 'passed': return 'Passed';
    case 'failed': return 'Failed';
    case 'passed_with_remarks': return 'Passed w/ Remarks';
    default: return status;
  }
}

export function formatNcrStatus(status: NcrStatus): string {
  return status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export function formatPunchListStatus(status: PunchListStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}
