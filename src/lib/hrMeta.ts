export type LeaveStatusCode = "annual" | "sick" | "personal" | "maternity" | "paternity" | "bereavement" | "compassionate" | "study" | "unpaid" | "other";

export type LeaveStatus = "draft" | "pending" | "approved" | "rejected" | "cancelled";

export type AttendanceStatus = "present" | "absent" | "late" | "half_day" | "holiday" | "on_leave";

export type EmploymentStatus = "active" | "probation" | "inactive" | "terminated";

export interface LeaveType {
  id: string;
  code: LeaveStatusCode;
  name: string;
  description: string | null;
  default_days_per_year: number;
  is_paid: boolean;
  requires_attachment: boolean;
  requires_approval: boolean;
  min_days: number;
  max_consecutive_days: number | null;
  sort_order: number;
  is_active: boolean;
}

export interface LeaveBalance {
  id: string;
  user_id: string;
  leave_type_id: string;
  year: number;
  total_days: number;
  used_days: number;
  pending_days: number;
  carried_over_days: number;
  leave_type?: LeaveType;
}

export interface LeaveRequest {
  id: string;
  user_id: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  status: LeaveStatus;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  attachment_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  leave_type?: LeaveType;
  profile?: { full_name: string; employee_id: string | null };
  approver?: { full_name: string };
}

export interface AttendanceRecord {
  id: string;
  user_id: string;
  date: string;
  clock_in: string | null;
  clock_out: string | null;
  status: AttendanceStatus;
  notes: string | null;
  profile?: { full_name: string; employee_id: string | null };
}

export interface Holiday {
  id: string;
  project_id: string | null;
  name: string;
  date: string;
  is_recurring: boolean;
}

export const LEAVE_STATUS_LABELS: Record<LeaveStatus, string> = {
  draft: "Draft",
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

export const LEAVE_STATUS_TONE: Record<LeaveStatus, { bg: string; fg: string; dot: string }> = {
  draft: { bg: "bg-neutral-status-soft", fg: "text-neutral-status", dot: "bg-neutral-status" },
  pending: { bg: "bg-info-soft", fg: "text-info", dot: "bg-info" },
  approved: { bg: "bg-success-soft", fg: "text-success", dot: "bg-success" },
  rejected: { bg: "bg-destructive-soft", fg: "text-destructive", dot: "bg-destructive" },
  cancelled: { bg: "bg-muted", fg: "text-muted-foreground", dot: "bg-muted-foreground" },
};

export const LEAVE_TYPE_LABELS: Record<LeaveStatusCode, string> = {
  annual: "Annual Leave",
  sick: "Sick Leave",
  personal: "Personal Leave",
  maternity: "Maternity Leave",
  paternity: "Paternity Leave",
  bereavement: "Bereavement Leave",
  compassionate: "Compassionate Leave",
  study: "Study Leave",
  unpaid: "Unpaid Leave",
  other: "Other",
};

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: "Present",
  absent: "Absent",
  late: "Late",
  half_day: "Half Day",
  holiday: "Holiday",
  on_leave: "On Leave",
};

export const ATTENDANCE_STATUS_TONE: Record<AttendanceStatus, string> = {
  present: "bg-success-soft text-success",
  absent: "bg-destructive-soft text-destructive",
  late: "bg-warning-soft text-warning",
  half_day: "bg-info-soft text-info",
  holiday: "bg-muted text-muted-foreground",
  on_leave: "bg-info-soft text-info",
};

export const EMPLOYMENT_STATUS_LABELS: Record<EmploymentStatus, string> = {
  active: "Active",
  probation: "Probation",
  inactive: "Inactive",
  terminated: "Terminated",
};
