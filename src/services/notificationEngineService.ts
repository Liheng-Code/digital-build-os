import type { Json } from "@/integrations/supabase/types";
import {
  type NotificationChannel,
  type NotificationDeliveryLogRow,
  type NotificationKind,
  type NotificationStatus,
  type NotificationTemplateRow
} from "@/lib/coreEngineMeta";
import type { NotificationPriority, NotificationRow, NotificationType } from "@/lib/notificationMeta";
import { coreDb } from "@/services/coreEngineClient";
import { recordAuditEvent } from "@/services/auditService";

export interface CreateNotificationInput {
  recipientUserId: string;
  actorId?: string | null;
  type: NotificationType;
  priority?: NotificationPriority;
  title: string;
  body?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  projectId?: string | null;
  moduleCode?: string | null;
  eventCode?: string | null;
  kind?: NotificationKind;
  actionUrl?: string | null;
  status?: NotificationStatus;
  metadata?: Record<string, unknown>;
  channels?: NotificationChannel[];
}

export interface TemplateNotificationInput {
  templateCode: string;
  recipientUserId: string;
  actorId?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  projectId?: string | null;
  actionUrl?: string | null;
  variables?: Record<string, string | number | null | undefined>;
  metadata?: Record<string, unknown>;
  channels?: NotificationChannel[];
  kind?: NotificationKind;
}

import { supabase } from "@/integrations/supabase/client";

const TELEGRAM_EVENT_TYPES: NotificationType[] = [
  "task_assigned",
  "task_unassigned",
  "task_reopened",
  "task_submitted_for_approval",
  "task_approved",
  "task_rejected",
  "task_overdue",
  "task_blocker_reported",
];

export async function createNotification(input: CreateNotificationInput): Promise<NotificationRow> {
  const payload = {
    user_id: input.recipientUserId,
    actor_id: input.actorId ?? null,
    type: input.type,
    priority: input.priority ?? "normal",
    title: input.title,
    body: input.body ?? null,
    entity_type: input.entityType ?? null,
    entity_id: input.entityId ?? null,
    project_id: input.projectId ?? null,
    module_code: input.moduleCode ?? null,
    event_code: input.eventCode ?? input.type,
    notification_kind: input.kind ?? "information",
    action_url: input.actionUrl ?? null,
    status: input.status ?? "sent",
    metadata: (input.metadata ?? {}) as Json
  };

  const { data, error } = await coreDb
    .from<NotificationRow>("notifications")
    .insert(payload)
    .select("*")
    .single();
  if (error) throw error;
  if (!data) throw new Error("Notification insert did not return a row");

  const channels = input.channels?.length ? input.channels : ["in_app"];
  await Promise.all(channels.map((channel) => logNotificationDelivery({
    notificationId: data.id,
    channel,
    deliveryStatus: channel === "in_app" ? "sent" : "pending"
  })));

  await recordAuditEvent({
    moduleCode: input.moduleCode ?? "ADMIN",
    entityType: "notification",
    entityId: data.id,
    actionType: "NOTIFICATION_SENT",
    actionLabel: "Notification Sent",
    projectId: input.projectId ?? null,
    newValues: payload as Json,
    severity: input.priority === "critical" ? "high" : "low",
    isSystemGenerated: true
  });

  // Fire-and-forget Telegram mirror for in-scope event types
  if (TELEGRAM_EVENT_TYPES.includes(input.type)) {
    supabase.functions
      .invoke("telegram-notify", { body: { notification_id: data.id } })
      .catch((err) => console.warn("telegram-notify invoke failed:", err));
  }

  return data;
}

export async function createNotificationFromTemplate(input: TemplateNotificationInput): Promise<NotificationRow> {
  const template = await fetchNotificationTemplate(input.templateCode);
  if (!template) throw new Error(`Notification template not found: ${input.templateCode}`);

  return createNotification({
    recipientUserId: input.recipientUserId,
    actorId: input.actorId ?? null,
    type: template.event_code as NotificationType,
    priority: template.default_priority,
    title: renderTemplate(template.title_template, input.variables ?? {}),
    body: renderTemplate(template.message_template, input.variables ?? {}),
    entityType: input.entityType ?? null,
    entityId: input.entityId ?? null,
    projectId: input.projectId ?? null,
    moduleCode: template.module_code,
    eventCode: template.event_code,
    kind: input.kind ?? "information",
    actionUrl: input.actionUrl ?? null,
    metadata: input.metadata,
    channels: input.channels ?? template.supported_channels
  });
}

export async function fetchNotificationTemplate(templateCode: string): Promise<NotificationTemplateRow | null> {
  const { data, error } = await coreDb
    .from<NotificationTemplateRow>("notification_templates")
    .select("*")
    .eq("template_code", templateCode)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function logNotificationDelivery(input: {
  notificationId: string;
  channel: NotificationChannel;
  deliveryStatus: NotificationDeliveryLogRow["delivery_status"];
  providerResponse?: Json | null;
  failedReason?: string | null;
}): Promise<NotificationDeliveryLogRow> {
  const { data, error } = await coreDb
    .from<NotificationDeliveryLogRow>("notification_delivery_logs")
    .insert({
      notification_id: input.notificationId,
      channel: input.channel,
      delivery_status: input.deliveryStatus,
      provider_response: input.providerResponse ?? null,
      sent_at: input.deliveryStatus === "sent" ? new Date().toISOString() : null,
      failed_reason: input.failedReason ?? null
    })
    .select("*")
    .single();
  if (error) throw error;
  if (!data) throw new Error("Notification delivery log insert did not return a row");
  return data;
}

function renderTemplate(template: string, variables: Record<string, string | number | null | undefined>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const value = variables[key];
    return value === null || value === undefined ? "" : String(value);
  });
}
