
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

export interface ProjectStakeholder {
  id: string;
  project_id: string;
  stakeholder_id: string;
  project_role?: string | null;
  approval_authority: boolean;
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
