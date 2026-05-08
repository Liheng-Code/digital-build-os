import type { Json } from "@/integrations/supabase/types";
import {
  type AuditActionType,
  type AuditSeverity,
  type AuditSourceChannel,
  type CoreModuleCode
} from "@/lib/coreEngineMeta";
import { coreDb } from "@/services/coreEngineClient";

export interface AuditEventInput {
  moduleCode: CoreModuleCode | string;
  entityType: string;
  entityId: string;
  actionType: AuditActionType | string;
  actionLabel?: string;
  projectId?: string | null;
  wbsNodeId?: string | null;
  oldValues?: Json | null;
  newValues?: Json | null;
  changedFields?: string[];
  statusFrom?: string | null;
  statusTo?: string | null;
  comment?: string | null;
  reasonCode?: string | null;
  severity?: AuditSeverity;
  sourceChannel?: AuditSourceChannel;
  correlationId?: string | null;
  isSystemGenerated?: boolean;
}

export async function recordAuditEvent(input: AuditEventInput): Promise<string | null> {
  const { data, error } = await coreDb.rpc<string>("record_audit_event", {
    _module_code: input.moduleCode,
    _entity_type: input.entityType,
    _entity_id: input.entityId,
    _action_type: input.actionType,
    _action_label: input.actionLabel ?? titleCase(input.actionType),
    _project_id: input.projectId ?? null,
    _wbs_node_id: input.wbsNodeId ?? null,
    _old_values: input.oldValues ?? null,
    _new_values: input.newValues ?? null,
    _changed_fields: input.changedFields ?? [],
    _status_from: input.statusFrom ?? null,
    _status_to: input.statusTo ?? null,
    _comment: input.comment ?? null,
    _reason_code: input.reasonCode ?? null,
    _severity: input.severity ?? inferSeverity(input.actionType),
    _source_channel: input.sourceChannel ?? "web",
    _correlation_id: input.correlationId ?? null,
    _is_system_generated: input.isSystemGenerated ?? false
  });
  if (error) throw error;
  return data;
}

export async function recordAuditEventSafe(input: AuditEventInput): Promise<void> {
  try {
    await recordAuditEvent(input);
  } catch {
    // Audit failures should not block the user-facing business action.
  }
}

export function diffValues(
  before: Record<string, unknown> | null | undefined,
  after: Record<string, unknown> | null | undefined
): string[] {
  const keys = new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]);
  return Array.from(keys).filter((key) => JSON.stringify(before?.[key]) !== JSON.stringify(after?.[key]));
}

export function inferSeverity(actionType: string): AuditSeverity {
  const action = actionType.toUpperCase();
  if (["DELETE", "PERMISSION_CHANGE", "ROLE_CHANGE", "FAILED_LOGIN"].includes(action)) return "critical";
  if (["APPROVE", "REJECT", "EXPORT", "DOWNLOAD"].includes(action)) return "high";
  if (["CREATE", "UPDATE", "SUBMIT", "ASSIGN", "REASSIGN", "STATUS_CHANGE"].includes(action)) return "medium";
  return "low";
}

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
