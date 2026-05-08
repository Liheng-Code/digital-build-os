import type { Json } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import type {
  ApprovalActionRow,
  ApprovalInstanceRow,
  ApprovalStepRow,
  CoreModuleCode
} from "@/lib/coreEngineMeta";
import { coreDb } from "@/services/coreEngineClient";
import { recordAuditEventSafe } from "@/services/auditService";
import { createNotification } from "@/services/notificationEngineService";

type ApprovalDecision = "approved" | "rejected";

interface UserRoleRow {
  user_id: string;
  role: string;
}

interface ProjectMemberRow {
  user_id: string;
}

interface ApproverRpcClient {
  rpc(
    fn: "get_module_approvers",
    args: { _project_id: string | null; _roles: string[] }
  ): Promise<{ data: string[] | null; error: { message: string } | null }>;
}

export interface OpenModuleApprovalInput {
  projectId?: string | null;
  moduleCode: CoreModuleCode;
  entityType: string;
  entityId: string;
  title: string;
  requestedBy?: string | null;
  approverRoles: string[];
  metadata?: Json;
}

export interface CloseModuleApprovalInput {
  moduleCode: CoreModuleCode;
  entityType: string;
  entityId: string;
  actorId?: string | null;
  decision: ApprovalDecision;
  comment?: string | null;
}

export async function openModuleApproval(input: OpenModuleApprovalInput): Promise<void> {
  const existing = await fetchOpenInstance(input.entityType, input.entityId);
  if (existing) return;

  const approver = await resolveApprover(input.projectId ?? null, input.approverRoles, input.requestedBy ?? null);
  const now = new Date().toISOString();
  const { data: instance, error: instanceError } = await coreDb
    .from<ApprovalInstanceRow>("approval_instances")
    .insert({
      project_id: input.projectId ?? null,
      module_code: input.moduleCode,
      entity_type: input.entityType,
      entity_id: input.entityId,
      title: input.title,
      requested_by: input.requestedBy ?? null,
      current_step_order: 1,
      status: "submitted",
      submitted_at: now,
      metadata: input.metadata ?? {}
    })
    .select("*")
    .single();
  if (instanceError) throw instanceError;
  if (!instance) throw new Error("Approval instance insert did not return a row");

  const { data: step, error: stepError } = await coreDb
    .from<ApprovalStepRow>("approval_steps")
    .insert({
      approval_instance_id: instance.id,
      step_order: 1,
      step_name: "Review",
      assignee_role: input.approverRoles.join(","),
      assignee_user_id: approver,
      action: "approve",
      status: "active"
    })
    .select("*")
    .single();
  if (stepError) throw stepError;

  await coreDb.from<ApprovalActionRow>("approval_actions").insert({
    approval_instance_id: instance.id,
    approval_step_id: step?.id ?? null,
    action_type: "submit",
    actor_id: input.requestedBy ?? null,
    from_status: "draft",
    to_status: "submitted",
    metadata: { approver_roles: input.approverRoles } as unknown as Json
  });

  await recordAuditEventSafe({
    moduleCode: input.moduleCode,
    entityType: input.entityType,
    entityId: input.entityId,
    actionType: "SUBMIT",
    actionLabel: "Submitted For Approval",
    projectId: input.projectId ?? null,
    statusFrom: "draft",
    statusTo: "submitted",
    newValues: input.metadata ?? {},
    severity: "high"
  });

  if (approver) {
    await createNotification({
      recipientUserId: approver,
      actorId: input.requestedBy ?? null,
      type: "approval_required",
      priority: "high",
      title: `Approval required: ${input.title}`,
      body: `${input.entityType} is awaiting approval.`,
      entityType: input.entityType,
      entityId: input.entityId,
      projectId: input.projectId ?? null,
      moduleCode: input.moduleCode,
      eventCode: "approval_required",
      kind: "action_required",
      metadata: { approval_instance_id: instance.id, approval_step_id: step?.id ?? null }
    });
  }
}

export async function closeModuleApproval(input: CloseModuleApprovalInput): Promise<void> {
  const instance = await fetchOpenInstance(input.entityType, input.entityId);
  if (!instance) {
    await recordAuditEventSafe({
      moduleCode: input.moduleCode,
      entityType: input.entityType,
      entityId: input.entityId,
      actionType: input.decision === "approved" ? "APPROVE" : "REJECT",
      actionLabel: input.decision === "approved" ? "Approved" : "Rejected",
      statusTo: input.decision,
      comment: input.comment ?? null,
      severity: "high"
    });
    return;
  }

  const { data: steps, error: stepsError } = await coreDb
    .from<ApprovalStepRow>("approval_steps")
    .select("*")
    .eq("approval_instance_id", instance.id)
    .eq("status", "active")
    .limit(1);
  if (stepsError) throw stepsError;

  const step = steps?.[0] ?? null;
  const now = new Date().toISOString();
  if (step) {
    const { error: stepError } = await coreDb
      .from<ApprovalStepRow>("approval_steps")
      .update({
        status: input.decision,
        acted_by: input.actorId ?? null,
        acted_at: now,
        comment: input.comment ?? null
      })
      .eq("id", step.id);
    if (stepError) throw stepError;
  }

  await coreDb.from<ApprovalActionRow>("approval_actions").insert({
    approval_instance_id: instance.id,
    approval_step_id: step?.id ?? null,
    action_type: input.decision === "approved" ? "approve" : "reject",
    actor_id: input.actorId ?? null,
    from_status: instance.status,
    to_status: input.decision,
    comment: input.comment ?? null,
    metadata: {}
  });

  const { error: instanceError } = await coreDb
    .from<ApprovalInstanceRow>("approval_instances")
    .update({
      status: input.decision,
      completed_at: now
    })
    .eq("id", instance.id);
  if (instanceError) throw instanceError;

  await recordAuditEventSafe({
    moduleCode: input.moduleCode,
    entityType: input.entityType,
    entityId: input.entityId,
    actionType: input.decision === "approved" ? "APPROVE" : "REJECT",
    actionLabel: input.decision === "approved" ? "Approved" : "Rejected",
    projectId: instance.project_id,
    oldValues: instance as unknown as Json,
    newValues: { status: input.decision, completed_at: now },
    changedFields: ["status", "completed_at"],
    statusFrom: instance.status,
    statusTo: input.decision,
    comment: input.comment ?? null,
    severity: "high"
  });
}

async function fetchOpenInstance(entityType: string, entityId: string): Promise<ApprovalInstanceRow | null> {
  const { data, error } = await coreDb
    .from<ApprovalInstanceRow>("approval_instances")
    .select("*")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("created_at", { ascending: false })
    .limit(5);
  if (error) throw error;
  return (data ?? []).find((row) => row.status === "submitted" || row.status === "in_review") ?? null;
}

async function resolveApprover(projectId: string | null, roles: string[], requesterId: string | null): Promise<string | null> {
  const rpcClient = supabase as unknown as ApproverRpcClient;
  const { data: rpcApprovers, error: rpcError } = await rpcClient.rpc("get_module_approvers", {
    _project_id: projectId,
    _roles: roles
  });
  if (!rpcError) {
    return (rpcApprovers ?? []).find((userId) => userId !== requesterId) ?? rpcApprovers?.[0] ?? null;
  }

  let eligibleProjectUsers: Set<string> | null = null;
  if (projectId) {
    const { data: members, error: memberError } = await coreDb
      .from<ProjectMemberRow>("project_members")
      .select("user_id")
      .eq("project_id", projectId);
    if (memberError) throw memberError;
    eligibleProjectUsers = new Set((members ?? []).map((member) => member.user_id));
  }

  const { data: roleRows, error: roleError } = await coreDb
    .from<UserRoleRow>("user_roles")
    .select("user_id, role")
    .in("role", roles);
  if (roleError) throw roleError;

  const candidates = (roleRows ?? [])
    .map((row) => row.user_id)
    .filter((userId) => userId !== requesterId)
    .filter((userId) => !eligibleProjectUsers || eligibleProjectUsers.has(userId));

  return candidates[0] ?? null;
}
