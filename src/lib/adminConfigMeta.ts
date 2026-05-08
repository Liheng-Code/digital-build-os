export interface Discipline {
  id: string;
  code: string;
  name: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProjectType {
  id: string;
  code: string;
  name: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WbsNodeType {
  id: string;
  code: string;
  name: string;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DocumentType {
  id: string;
  code: string;
  name: string;
  category: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CostCode {
  id: string;
  code: string;
  name: string;
  parent_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MaterialCode {
  id: string;
  code: string;
  name: string;
  unit: string | null;
  category: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EquipmentType {
  id: string;
  code: string;
  name: string;
  category: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PublicHoliday {
  id: string;
  holiday_date: string;
  label: string;
  is_recurring_yearly: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationRule {
  id: string;
  event_code: string;
  event_label: string | null;
  recipient_strategy: string;
  channels: string;
  priority: string;
  escalation_enabled: boolean;
  escalation_after_hours: number | null;
  escalation_roles: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApprovalTemplate {
  id: string;
  name: string;
  module: string;
  steps: ApprovalStep[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApprovalStep {
  step_order: number;
  step_name: string;
  assignee_role: string;
  action: string;
}

export interface ChecklistTemplate {
  id: string;
  name: string;
  category: "QAQC" | "HSE";
  items: ChecklistItem[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChecklistItem {
  item_name: string;
  required: boolean;
}

export interface LaborRate {
  id: string;
  labor_code: string;
  name: string;
  hourly_rate: number;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const CONFIG_TAB_LABELS: Record<string, string> = {
  disciplines: "Disciplines",
  project_types: "Project Types",
  wbs_node_types: "WBS Node Types",
  document_types: "Document Types",
  cost_codes: "Cost Codes",
  material_codes: "Material Codes",
  equipment_types: "Equipment Types",
  public_holidays: "Public Holidays",
  notification_rules: "Notification Rules",
  approval_templates: "Approval Templates",
  checklist_templates: "Checklist Templates",
  labor_rates: "Labor Rates",
};
