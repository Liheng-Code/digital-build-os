
export type StakeholderType = 
  | 'client' 
  | 'project_manager' 
  | 'contractor' 
  | 'architect' 
  | 'subcontractor' 
  | 'supplier' 
  | 'authority' 
  | 'consultant' 
  | 'other';

export type StakeholderStatus = 'active' | 'inactive' | 'blacklisted';

export interface Stakeholder {
  id: string;
  type: StakeholderType;
  organization_name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  status: StakeholderStatus;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface StakeholderContact {
  id: string;
  stakeholder_id: string;
  full_name: string;
  job_title?: string | null;
  email?: string | null;
  phone?: string | null;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkflowResponsibility {
  executes_tasks: boolean;
  reviews_rfis: boolean;
  approves_inspections: boolean;
  receives_transmittals: boolean;
  procurement_involvement: boolean;
  safety_oversight: boolean;
}

export type ApprovalLevel = 'none' | 'review' | 'approve' | 'final';

export interface ProjectStakeholder {
  id: string;
  project_id: string;
  stakeholder_id: string;
  project_role?: string | null;
  discipline?: string | null;
  approval_authority: boolean; // Keep for legacy
  approval_level: ApprovalLevel;
  responsibilities: WorkflowResponsibility;
  access_level: 'full' | 'read_only' | 'restricted';
  restricted_wbs_ids?: string[] | null;
  added_at: string;
  // Joined fields
  stakeholder?: Stakeholder;
}

export const STAKEHOLDER_TYPE_LABELS: Record<StakeholderType, string> = {
  client: "Client / Owner",
  project_manager: "Project Manager (External)",
  contractor: "Main Contractor",
  architect: "Architect",
  subcontractor: "Subcontractor",
  supplier: "Supplier / Vendor",
  authority: "Authority / Government",
  consultant: "Consultant",
  other: "Other Stakeholder",
};

export const STAKEHOLDER_STATUS_COLORS: Record<StakeholderStatus, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  inactive: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  blacklisted: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export const PROJECT_ROLE_OPTIONS = [
  "Project Owner / Client",
  "Project Manager",
  "Contractor / Main Contractor",
  "Architects and Designers",
  "Subcontractors",
  "Suppliers / Vendors",
  "Regulatory Authorities",
  "Consultants",
  "Testing Agencies",
  "Utility Authorities",
  "Insurance / Bonding Parties",
  "Internal Company Departments",
] as const;

export const APPROVAL_LEVEL_LABELS: Record<ApprovalLevel, string> = {
  none: "No Approval Authority",
  review: "Review Only",
  approve: "Approve (Standard)",
  final: "Final Approval (Sign-off)",
};

export const WORKFLOW_LABELS: Record<keyof WorkflowResponsibility, string> = {
  executes_tasks: "Executes Site Tasks",
  reviews_rfis: "Reviews RFIs",
  approves_inspections: "Approves Inspections",
  receives_transmittals: "Receives Transmittals",
  procurement_involvement: "Procurement Involvement",
  safety_oversight: "Safety Oversight",
};

export const DEFAULT_RESPONSIBILITIES: WorkflowResponsibility = {
  executes_tasks: false,
  reviews_rfis: false,
  approves_inspections: false,
  receives_transmittals: true,
  procurement_involvement: false,
  safety_oversight: false,
};
