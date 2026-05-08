import type { Json } from "@/integrations/supabase/types";
import {
  type ApprovalActionRow,
  type ApprovalActionType,
  type ApprovalInstanceRow,
  type ApprovalInstanceStatus,
  type ApprovalStepRow
} from "@/lib/coreEngineMeta";
import { coreDb } from "@/services/coreEngineClient";
import { recordAuditEvent } from "@/services/auditService";
import { createNotification } from "@/services/notificationEngineService";

interface ApprovalTemplateRow {
  id: string;
  name: string;
  module: string;
  steps: Json;
  is_active: boolean;
}

interface TemplateStep {
  step_order?: number;
  step_name?: string;
  assignee_role?: string;
  assignee_user_id?: string;
  action?: string;
}

export interface StartApprovalWorkflowInput {
  templateId: string;
  projectId?: string | null;
  moduleCode: string;
  entityType: string;
  entityId: string;
  title: string;
  requestedBy?: string | null;
  dueAt?: string | null;
  metadata?: Json;
}

export async function startApprovalWorkflow(input: StartApprovalWorkflowInput): Promise<ApprovalInstanceRow> {
  const template = await fetchApprovalTemplate(input.templateId);
  if (!template) throw new Error("Approval template not found");

  const steps = normalizeTemplateSteps(template.steps);
  if (steps.length === 0) throw new Error("Approval template has no steps");

  const { data: instance, error: instanceError } = await coreDb
    .from<ApprovalInstanceRow>("approval_instances")
    .insert({
      template_id: template.id,
      project_id: input.projectId ?? null,
      module_code: input.moduleCode,
      entity_type: input.entityType,
      entity_id: input.entityId,
      title: input.title,
      requested_by: input.requestedBy ?? null,
      current_step_order: steps[0].step_order,
      status: "submitted",
      submitted_at: new Date().toISOString(),
      due_at: input.dueAt ?? null,
      metadata: input.metadata ?? {}
    })
    .select("*")
    .single();
  if (instanceError) throw instanceError;
  if (!instance) throw new Error("Approval instance insert did not return a row");

  const stepRows = steps.map((step, index) => ({
    approval_instance_id: instance.id,
    step_order: step.step_order ?? index + 1,
    step_name: step.step_name ?? `Step ${index + 1}`,
    assignee_role: step.assignee_role ?? null,
    assignee_user_id: step.assignee_user_id ?? null,
    action: step.action ?? "approve",
    status: index === 0 ? "active" : "pending"
  }));

  const { error: stepsError } = await coreDb
    .from<ApprovalStepRow>("approval_steps")
    .insert(stepRows);
  if (stepsError) throw stepsError;

  await insertApprovalAction({
    approval_instance_id: instance.id,
    action_type: "submit",
    actor_id: input.requestedBy ?? null,
    from_status: "draft",
    to_status: "submitted",
    metadata: {}
  });

  await recordAuditEvent({
    moduleCode: input.moduleCode,
    entityType: input.entityType,
    entityId: input.entityId,
    actionType: "SUBMIT",
    actionLabel: "Submitted For Approval",
    projectId: input.projectId ?? null,
    newValues: instance as unknown as Json,
    statusFrom: "draft",
    statusTo: "submitted",
    severity: "high"
  });

  const firstAssignee = stepRows[0].assignee_user_id;
  if (firstAssignee) {
    await createNotification({
      recipientUserId: firstAssignee,
      actorId: input.requestedBy ?? null,
      type: "approval_required",
      priority: "high",
      title: `Approval required: ${input.title}`,
      body: `${input.entityType} is awaiting your approval.`,
      entityType: input.entityType,
      entityId: input.entityId,
      projectId: input.projectId ?? null,
      moduleCode: input.moduleCode,
      eventCode: "approval_required",
      kind: "action_required",
      metadata: { approval_instance_id: instance.id }
    });
  }

  return instance;
}

export async function approveStep(stepId: string, actorId: string, comment?: string): Promise<ApprovalInstanceRow> {
  return actOnStep(stepId, actorId, "approve", "approved", comment);
}

export async function rejectStep(stepId: string, actorId: string, comment: string): Promise<ApprovalInstanceRow> {
  return actOnStep(stepId, actorId, "reject", "rejected", comment);
}

async function actOnStep(
  stepId: string,
  actorId: string,
  actionType: ApprovalActionType,
  stepStatus: "approved" | "rejected",
  comment?: string
): Promise<ApprovalInstanceRow> {
  const step = await fetchApprovalStep(stepId);
  if (!step) throw new Error("Approval step not found");
  if (step.status !== "active") throw new Error("Only active approval steps can be actioned");

  const instance = await fetchApprovalInstance(step.approval_instance_id);
  if (!instance) throw new Error("Approval instance not found");

  const now = new Date().toISOString();
  const { error: stepError } = await coreDb
    .from<ApprovalStepRow>("approval_steps")
    .update({
      status: stepStatus,
      acted_by: actorId,
      acted_at: now,
      comment: comment ?? null
    })
    .eq("id", stepId);
  if (stepError) throw stepError;

  await insertApprovalAction({
    approval_instance_id: instance.id,
    approval_step_id: step.id,
    action_type: actionType,
    actor_id: actorId,
    from_status: step.status,
    to_status: stepStatus,
    comment: comment ?? null,
    metadata: {}
  });

  if (stepStatus === "rejected") {
    return updateApprovalInstanceStatus(instance, "rejected", now, comment);
  }

  const nextStep = await fetchNextPendingStep(instance.id, step.step_order);
  if (!nextStep) {
    return updateApprovalInstanceStatus(instance, "approved", now, comment);
  }

  const { error: nextStepError } = await coreDb
    .from<ApprovalStepRow>("approval_steps")
    .update({ status: "active" })
    .eq("id", nextStep.id);
  if (nextStepError) throw nextStepError;

  const { data: updated, error: instanceError } = await coreDb
    .from<ApprovalInstanceRow>("approval_instances")
    .update({
      status: "in_review",
      current_step_order: nextStep.step_order
    })
    .eq("id", instance.id)
    .select("*")
    .single();
  if (instanceError) throw instanceError;
  if (!updated) throw new Error("Approval instance update did not return a row");

  if (nextStep.assignee_user_id) {
    await createNotification({
      recipientUserId: nextStep.assignee_user_id,
      actorId,
      type: "approval_required",
      priority: "high",
      title: `Approval required: ${updated.title}`,
      body: `${updated.entity_type} is awaiting your approval.`,
      entityType: updated.entity_type,
      entityId: updated.entity_id,
      projectId: updated.project_id,
      moduleCode: updated.module_code,
      eventCode: "approval_required",
      kind: "action_required",
      metadata: { approval_instance_id: updated.id, approval_step_id: nextStep.id }
    });
  }

  return updated;
}

async function updateApprovalInstanceStatus(
  instance: ApprovalInstanceRow,
  status: ApprovalInstanceStatus,
  completedAt: string,
  comment?: string
): Promise<ApprovalInstanceRow> {
  const { data, error } = await coreDb
    .from<ApprovalInstanceRow>("approval_instances")
    .update({
      status,
      completed_at: completedAt
    })
    .eq("id", instance.id)
    .select("*")
    .single();
  if (error) throw error;
  if (!data) throw new Error("Approval instance update did not return a row");

  await recordAuditEvent({
    moduleCode: instance.module_code,
    entityType: instance.entity_type,
    entityId: instance.entity_id,
    actionType: status === "approved" ? "APPROVE" : "REJECT",
    actionLabel: status === "approved" ? "Approved" : "Rejected",
    projectId: instance.project_id,
    oldValues: instance as unknown as Json,
    newValues: data as unknown as Json,
    changedFields: ["status", "completed_at"],
    statusFrom: instance.status,
    statusTo: status,
    comment: comment ?? null,
    severity: "high"
  });

  return data;
}

async function fetchApprovalTemplate(templateId: string): Promise<ApprovalTemplateRow | null> {
  const { data, error } = await coreDb
    .from<ApprovalTemplateRow>("approval_templates")
    .select("*")
    .eq("id", templateId)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function fetchApprovalInstance(instanceId: string): Promise<ApprovalInstanceRow | null> {
  const { data, error } = await coreDb
    .from<ApprovalInstanceRow>("approval_instances")
    .select("*")
    .eq("id", instanceId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function fetchApprovalStep(stepId: string): Promise<ApprovalStepRow | null> {
  const { data, error } = await coreDb
    .from<ApprovalStepRow>("approval_steps")
    .select("*")
    .eq("id", stepId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function fetchNextPendingStep(instanceId: string, currentOrder: number): Promise<ApprovalStepRow | null> {
  const { data, error } = await coreDb
    .from<ApprovalStepRow>("approval_steps")
    .select("*")
    .eq("approval_instance_id", instanceId)
    .eq("status", "pending")
    .order("step_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).find((step) => step.step_order > currentOrder) ?? null;
}

async function insertApprovalAction(payload: Partial<ApprovalActionRow>): Promise<void> {
  const { error } = await coreDb.from<ApprovalActionRow>("approval_actions").insert(payload);
  if (error) throw error;
}

function normalizeTemplateSteps(value: Json): TemplateStep[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is TemplateStep => item !== null && typeof item === "object");
}
