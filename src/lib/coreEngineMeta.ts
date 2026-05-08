import type { Json } from "@/integrations/supabase/types";

export type AuditSeverity = "low" | "medium" | "high" | "critical";
export type AuditSourceChannel = "web" | "mobile" | "system" | "api" | "telegram";

export type AuditActionType =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "ARCHIVE"
  | "RESTORE"
  | "SUBMIT"
  | "APPROVE"
  | "REJECT"
  | "CLOSE"
  | "REOPEN"
  | "ASSIGN"
  | "REASSIGN"
  | "UPLOAD"
  | "DOWNLOAD"
  | "EXPORT"
  | "IMPORT"
  | "LOGIN"
  | "LOGOUT"
  | "FAILED_LOGIN"
  | "PASSWORD_CHANGE"
  | "ROLE_CHANGE"
  | "PERMISSION_CHANGE"
  | "STATUS_CHANGE"
  | "WORKFLOW_CHANGE"
  | "CONFIG_CHANGE"
  | "SYSTEM_TRIGGER"
  | "NOTIFICATION_SENT"
  | "NOTIFICATION_FAILED";

export type CoreModuleCode =
  | "AUTH"
  | "ADMIN"
  | "PROJECT"
  | "WBS"
  | "TASK"
  | "DOC"
  | "RFI"
  | "PROC"
  | "INV"
  | "CON"
  | "QAQC"
  | "HSE"
  | "HR"
  | "ACC"
  | "REPORT";

export type NotificationChannel = "in_app" | "email" | "telegram" | "push" | "sms";
export type NotificationStatus =
  | "generated"
  | "queued"
  | "sent"
  | "delivered"
  | "read"
  | "actioned"
  | "failed"
  | "cancelled";
export type NotificationKind =
  | "information"
  | "action_required"
  | "reminder"
  | "escalation"
  | "system_alert"
  | "digest";
export type NotificationDeliveryStatus =
  | "pending"
  | "sent"
  | "failed"
  | "retried"
  | "failed_permanently";

export type ApprovalInstanceStatus =
  | "draft"
  | "submitted"
  | "in_review"
  | "approved"
  | "rejected"
  | "cancelled"
  | "closed";
export type ApprovalStepStatus = "pending" | "active" | "approved" | "rejected" | "skipped" | "cancelled";
export type ApprovalActionType = "submit" | "approve" | "reject" | "delegate" | "comment" | "cancel" | "close";

export interface AuditLogV2Row {
  id: string;
  tenant_id: string | null;
  project_id: string | null;
  wbs_node_id: string | null;
  module_code: CoreModuleCode | string;
  entity_type: string;
  entity_id: string | null;
  action_type: AuditActionType | string;
  action_label: string;
  user_id: string | null;
  user_name_snapshot: string | null;
  user_role_snapshot: string | null;
  department_snapshot: string | null;
  old_values: Json | null;
  new_values: Json | null;
  changed_fields: Json;
  status_from: string | null;
  status_to: string | null;
  comment: string | null;
  reason_code: string | null;
  ip_address: string | null;
  user_agent: string | null;
  device_type: string | null;
  source_channel: AuditSourceChannel;
  severity: AuditSeverity;
  is_system_generated: boolean;
  correlation_id: string | null;
  created_at: string;
}

export interface NotificationTemplateRow {
  id: string;
  template_code: string;
  title_template: string;
  message_template: string;
  module_code: CoreModuleCode | string;
  event_code: string;
  default_priority: "low" | "normal" | "high" | "critical";
  supported_channels: NotificationChannel[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationDeliveryLogRow {
  id: string;
  notification_id: string;
  channel: NotificationChannel;
  delivery_status: NotificationDeliveryStatus;
  provider_response: Json | null;
  retry_count: number;
  sent_at: string | null;
  failed_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApprovalInstanceRow {
  id: string;
  template_id: string | null;
  project_id: string | null;
  module_code: CoreModuleCode | string;
  entity_type: string;
  entity_id: string;
  title: string;
  requested_by: string | null;
  current_step_order: number | null;
  status: ApprovalInstanceStatus;
  submitted_at: string | null;
  completed_at: string | null;
  due_at: string | null;
  metadata: Json;
  created_at: string;
  updated_at: string;
}

export interface ApprovalStepRow {
  id: string;
  approval_instance_id: string;
  step_order: number;
  step_name: string;
  assignee_role: string | null;
  assignee_user_id: string | null;
  action: string;
  status: ApprovalStepStatus;
  due_at: string | null;
  acted_by: string | null;
  acted_at: string | null;
  comment: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApprovalActionRow {
  id: string;
  approval_instance_id: string;
  approval_step_id: string | null;
  action_type: ApprovalActionType;
  actor_id: string | null;
  from_status: string | null;
  to_status: string | null;
  comment: string | null;
  metadata: Json;
  created_at: string;
}

export const AUDIT_SEVERITY_LABELS: Record<AuditSeverity, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical"
};

export const APPROVAL_STATUS_LABELS: Record<ApprovalInstanceStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  in_review: "In Review",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
  closed: "Closed"
};
