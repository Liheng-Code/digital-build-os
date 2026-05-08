// Edge function: process-core-engine-jobs
// Handles core engine background work: overdue task notifications,
// overdue approval reminders, and delivery-log retry bookkeeping.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

type Priority = "low" | "normal" | "high" | "critical";

interface TaskRow {
  id: string;
  code: string | null;
  title: string;
  project_id: string;
  planned_end: string | null;
  priority: Priority;
  wbs_node_id: string | null;
}

interface AssignmentRow {
  user_id: string;
}

interface ApprovalStepRow {
  id: string;
  approval_instance_id: string;
  assignee_user_id: string | null;
  due_at: string | null;
}

interface ApprovalInstanceRow {
  id: string;
  project_id: string | null;
  module_code: string;
  entity_type: string;
  entity_id: string;
  title: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const cronSecret = Deno.env.get("CRON_SECRET");
  if (cronSecret && req.headers.get("x-cron-secret") !== cronSecret) {
    return json({ error: "Unauthorized" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: "Missing Supabase service environment" }, 500);
  }

  const db = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const taskOverdue = await processOverdueTasks(db);
  const approvalOverdue = await processOverdueApprovals(db);
  const deliveryRetries = await processDeliveryRetries(db);

  return json({ taskOverdue, approvalOverdue, deliveryRetries });
});

async function processOverdueTasks(db: ReturnType<typeof createClient>): Promise<number> {
  const today = new Date().toISOString().slice(0, 10);
  const { data: tasks, error } = await db
    .from("tasks")
    .select("id, code, title, project_id, planned_end, priority, wbs_node_id")
    .lt("planned_end", today)
    .not("status", "in", "(approved,completed,closed)");
  if (error) throw error;

  let created = 0;
  for (const task of (tasks ?? []) as TaskRow[]) {
    const alreadySent = await hasNotificationToday(db, "task", task.id, "task_overdue");
    if (alreadySent) continue;

    const { data: assignments } = await db
      .from("task_assignments")
      .select("user_id")
      .eq("task_id", task.id)
      .is("unassigned_at", null);

    const recipients = new Set((assignments ?? []).map((row: AssignmentRow) => row.user_id));
    const { data: planners } = await db.rpc("get_project_planners", { _project_id: task.project_id });
    for (const planner of planners ?? []) recipients.add(String(planner));

    for (const recipient of recipients) {
      const notificationId = await insertNotification(db, {
        user_id: recipient,
        type: "task_overdue",
        priority: task.priority === "critical" ? "critical" : "high",
        title: `Task overdue: ${task.code ?? task.title}`,
        body: `${task.title} was due on ${task.planned_end}.`,
        entity_type: "task",
        entity_id: task.id,
        project_id: task.project_id,
        module_code: "TASK",
        event_code: "task_overdue",
        notification_kind: "escalation",
        action_url: `/tasks/${task.id}`,
        metadata: { planned_end: task.planned_end, wbs_node_id: task.wbs_node_id },
      });
      await insertDeliveryLog(db, notificationId);
      created += 1;
    }

    await recordSystemAudit(db, "TASK", "task", task.id, "SYSTEM_TRIGGER", "Task Overdue Notification Generated", task.project_id, task.wbs_node_id);
  }
  return created;
}

async function processOverdueApprovals(db: ReturnType<typeof createClient>): Promise<number> {
  const now = new Date().toISOString();
  const { data: steps, error } = await db
    .from("approval_steps")
    .select("id, approval_instance_id, assignee_user_id, due_at")
    .eq("status", "active")
    .lt("due_at", now);
  if (error) throw error;

  let created = 0;
  for (const step of (steps ?? []) as ApprovalStepRow[]) {
    if (!step.assignee_user_id) continue;
    const alreadySent = await hasNotificationToday(db, "approval_step", step.id, "approval_overdue");
    if (alreadySent) continue;

    const { data: instance } = await db
      .from("approval_instances")
      .select("id, project_id, module_code, entity_type, entity_id, title")
      .eq("id", step.approval_instance_id)
      .maybeSingle();
    if (!instance) continue;

    const approval = instance as ApprovalInstanceRow;
    const notificationId = await insertNotification(db, {
      user_id: step.assignee_user_id,
      type: "approval_overdue",
      priority: "critical",
      title: `Approval overdue: ${approval.title}`,
      body: `${approval.entity_type} approval is overdue.`,
      entity_type: "approval_step",
      entity_id: step.id,
      project_id: approval.project_id,
      module_code: approval.module_code,
      event_code: "approval_overdue",
      notification_kind: "escalation",
      metadata: { approval_instance_id: approval.id, due_at: step.due_at },
    });
    await insertDeliveryLog(db, notificationId);
    await recordSystemAudit(db, approval.module_code, approval.entity_type, approval.entity_id, "SYSTEM_TRIGGER", "Approval Overdue Notification Generated", approval.project_id, null);
    created += 1;
  }
  return created;
}

async function processDeliveryRetries(db: ReturnType<typeof createClient>): Promise<number> {
  const { data, error } = await db
    .from("notification_delivery_logs")
    .select("id, retry_count")
    .eq("delivery_status", "failed")
    .lt("retry_count", 3)
    .limit(100);
  if (error) throw error;

  for (const row of data ?? []) {
    await db
      .from("notification_delivery_logs")
      .update({
        delivery_status: "retried",
        retry_count: Number(row.retry_count ?? 0) + 1,
      })
      .eq("id", row.id);
  }
  return data?.length ?? 0;
}

async function hasNotificationToday(
  db: ReturnType<typeof createClient>,
  entityType: string,
  entityId: string,
  eventCode: string,
): Promise<boolean> {
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  const { data, error } = await db
    .from("notifications")
    .select("id")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .eq("event_code", eventCode)
    .gte("created_at", since.toISOString())
    .limit(1);
  if (error) throw error;
  return (data?.length ?? 0) > 0;
}

async function insertNotification(db: ReturnType<typeof createClient>, payload: Record<string, unknown>): Promise<string> {
  const { data, error } = await db
    .from("notifications")
    .insert(payload)
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

async function insertDeliveryLog(db: ReturnType<typeof createClient>, notificationId: string): Promise<void> {
  const { error } = await db
    .from("notification_delivery_logs")
    .insert({
      notification_id: notificationId,
      channel: "in_app",
      delivery_status: "sent",
      sent_at: new Date().toISOString(),
    });
  if (error) throw error;
}

async function recordSystemAudit(
  db: ReturnType<typeof createClient>,
  moduleCode: string,
  entityType: string,
  entityId: string,
  actionType: string,
  actionLabel: string,
  projectId: string | null,
  wbsNodeId: string | null,
): Promise<void> {
  await db.rpc("record_audit_event", {
    _module_code: moduleCode,
    _entity_type: entityType,
    _entity_id: entityId,
    _action_type: actionType,
    _action_label: actionLabel,
    _project_id: projectId,
    _wbs_node_id: wbsNodeId,
    _severity: "medium",
    _source_channel: "system",
    _is_system_generated: true,
  });
}

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
