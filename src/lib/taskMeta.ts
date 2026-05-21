export type TaskStatus =
  | "open"
  | "assigned"
  | "in_progress"
  | "pending_approval"
  | "approved"
  | "rejected"
  | "completed"
  | "closed"
  | "blocked";

export type TaskPriority = "low" | "medium" | "high" | "critical";

export type TaskType =
  | "concrete"
  | "steel"
  | "mep"
  | "finishing"
  | "excavation"
  | "inspection"
  | "other";

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  open: "Open",
  assigned: "Assigned",
  in_progress: "In Progress",
  pending_approval: "Pending Approval",
  approved: "Approved",
  rejected: "Rejected",
  completed: "Completed",
  closed: "Closed",
  blocked: "Blocked",
};

/** Token names from index.css (e.g. neutral-status / info / warning / success / destructive) */
export const TASK_STATUS_TONE: Record<
  TaskStatus,
  { bg: string; fg: string; dot: string }
> = {
  open: { bg: "bg-neutral-status-soft", fg: "text-neutral-status", dot: "bg-neutral-status" },
  assigned: { bg: "bg-info-soft", fg: "text-info", dot: "bg-info" },
  in_progress: { bg: "bg-info-soft", fg: "text-info", dot: "bg-info" },
  pending_approval: { bg: "bg-warning-soft", fg: "text-warning", dot: "bg-warning" },
  approved: { bg: "bg-success-soft", fg: "text-success", dot: "bg-success" },
  rejected: { bg: "bg-destructive-soft", fg: "text-destructive", dot: "bg-destructive" },
  completed: { bg: "bg-success-soft", fg: "text-success", dot: "bg-success" },
  closed: { bg: "bg-muted", fg: "text-muted-foreground", dot: "bg-muted-foreground" },
  blocked: { bg: "bg-destructive-soft", fg: "text-destructive", dot: "bg-destructive" },
};

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export const TASK_PRIORITY_TONE: Record<TaskPriority, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-info-soft text-info",
  high: "bg-warning-soft text-warning",
  critical: "bg-destructive-soft text-destructive",
};

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  concrete: "Concrete",
  steel: "Steel",
  mep: "MEP",
  finishing: "Finishing",
  excavation: "Excavation",
  inspection: "Inspection",
  other: "Other",
};

/** Allowed status transitions, mirrored from the DB trigger. */
export const ALLOWED_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  open: ["assigned", "closed"],
  assigned: ["in_progress", "open", "closed"],
  in_progress: ["pending_approval", "assigned", "closed"],
  pending_approval: ["approved", "rejected"],
  approved: ["completed", "closed"],
  rejected: ["in_progress", "assigned"],
  completed: ["closed"],
  closed: [],
  blocked: ["assigned", "open"],
};

export const KANBAN_COLUMNS: TaskStatus[] = [
  "open",
  "assigned",
  "in_progress",
  "pending_approval",
  "approved",
  "completed",
];
