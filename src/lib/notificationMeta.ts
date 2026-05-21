import {
  Bell,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  PlayCircle,
  ClipboardCheck,
  ClipboardList,
  UserPlus,
  UserMinus,
  RefreshCw,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react";

export type NotificationType =
  | "task_assigned"
  | "task_unassigned"
  | "task_started"
  | "task_submitted_for_approval"
  | "task_approved"
  | "task_rejected"
  | "task_completed"
  | "task_closed"
  | "task_reopened"
  | "task_blocker_reported"
  | "timesheet_submitted"
  | "timesheet_approved"
  | "timesheet_rejected"
  | "timesheet_flagged";

export type NotificationPriority = "low" | "normal" | "high" | "critical";

/**
 * Notification types where the current user is the *direct* recipient of a
 * task workflow action (assigned to them, awaiting their approval, their
 * submission was approved/rejected, etc.). These drive the unread badge on
 * the Tasks nav item and on individual task rows/cards.
 */
export const DIRECT_TASK_NOTIFICATION_TYPES: NotificationType[] = [
  "task_assigned",
  "task_unassigned",
  "task_submitted_for_approval",
  "task_approved",
  "task_rejected",
  "task_reopened",
  "task_blocker_reported",
];

export function isDirectTaskNotification(n: Pick<NotificationRow, "type" | "entity_type">): boolean {
  return n.entity_type === "task" && DIRECT_TASK_NOTIFICATION_TYPES.includes(n.type);
}

export interface NotificationRow {
  id: string;
  user_id: string;
  actor_id: string | null;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  body: string | null;
  entity_type: string | null;
  entity_id: string | null;
  project_id: string | null;
  metadata: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

export const NOTIFICATION_ICON: Record<NotificationType, LucideIcon> = {
  task_assigned: UserPlus,
  task_unassigned: UserMinus,
  task_started: PlayCircle,
  task_submitted_for_approval: ClipboardCheck,
  task_approved: CheckCircle2,
  task_rejected: XCircle,
  task_completed: CheckCircle2,
  task_closed: ClipboardList,
  task_reopened: RefreshCw,
  task_blocker_reported: ShieldAlert,
  timesheet_submitted: Clock,
  timesheet_approved: CheckCircle2,
  timesheet_rejected: XCircle,
  timesheet_flagged: AlertTriangle,
};

export const PRIORITY_TONE: Record<NotificationPriority, string> = {
  low: "text-muted-foreground",
  normal: "text-info",
  high: "text-warning",
  critical: "text-destructive",
};

export const PRIORITY_DOT: Record<NotificationPriority, string> = {
  low: "bg-muted-foreground",
  normal: "bg-info",
  high: "bg-warning",
  critical: "bg-destructive",
};

export function getNotificationRoute(n: Pick<NotificationRow, "entity_type" | "entity_id">): string | null {
  if (!n.entity_type || !n.entity_id) return null;
  if (n.entity_type === "task") return `/tasks/${n.entity_id}`;
  if (n.entity_type === "timesheet_entry") return "/timesheets";
  return null;
}

export { Bell };

export function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(iso).toLocaleDateString();
}
