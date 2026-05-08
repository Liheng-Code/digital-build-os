import { supabase } from "@/integrations/supabase/client";
import type { LeaveRequest, LeaveType, LeaveBalance } from "@/lib/hrMeta";
import { openModuleApproval, closeModuleApproval } from "@/services/moduleApprovalService";
import { recordAuditEventSafe } from "@/services/auditService";

export const fetchLeaveTypes = async (): Promise<LeaveType[]> => {
  const { data, error } = await supabase
    .from("leave_types")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");
  if (error) throw error;
  return (data ?? []) as unknown as LeaveType[];
};

export const fetchAllLeaveTypes = async (): Promise<LeaveType[]> => {
  const { data, error } = await supabase
    .from("leave_types")
    .select("*")
    .order("sort_order");
  if (error) throw error;
  return (data ?? []) as unknown as LeaveType[];
};

export const fetchLeaveBalances = async (userId: string, year?: number): Promise<LeaveBalance[]> => {
  const q = supabase
    .from("leave_balances")
    .select("*, leave_type:leave_types(*)")
    .eq("user_id", userId);
  if (year) q.eq("year", year);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as LeaveBalance[];
};

export const fetchMyLeaveRequests = async (userId: string): Promise<LeaveRequest[]> => {
  const { data, error } = await supabase
    .from("leave_requests")
    .select("*, leave_type:leave_types(*), profile:profiles(full_name, employee_id)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as LeaveRequest[];
};

export const fetchPendingLeaveRequests = async (): Promise<LeaveRequest[]> => {
  const { data, error } = await supabase
    .from("leave_requests")
    .select("*, leave_type:leave_types(*), profile:profiles(full_name, employee_id)")
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as LeaveRequest[];
};

export const fetchLeaveRequests = async (): Promise<LeaveRequest[]> => {
  const { data, error } = await supabase
    .from("leave_requests")
    .select("*, leave_type:leave_types(*), profile:profiles(full_name, employee_id)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as LeaveRequest[];
};

export const createLeaveRequest = async (req: {
  user_id: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
}): Promise<LeaveRequest> => {
  const { data, error } = await supabase
    .from("leave_requests")
    .insert({ ...req, status: "pending" })
    .select("*, leave_type:leave_types(*)")
    .single();
  if (error) throw error;
  const row = data as unknown as LeaveRequest;
  await openModuleApproval({
    moduleCode: "HR",
    entityType: "leave_request",
    entityId: row.id,
    title: `${row.leave_type?.name ?? "Leave"} ${row.start_date} to ${row.end_date}`,
    requestedBy: row.user_id,
    approverRoles: ["project_manager", "supervisor", "admin"],
    metadata: {
      leave_type_id: row.leave_type_id,
      start_date: row.start_date,
      end_date: row.end_date,
      total_days: row.total_days
    }
  });
  return data as unknown as LeaveRequest;
};

export const updateLeaveStatus = async (
  id: string,
  status: "approved" | "rejected",
  approvedBy: string,
  rejectionReason?: string,
): Promise<void> => {
  const before = (await supabase
    .from("leave_requests")
    .select("*")
    .eq("id", id)
    .single()).data as unknown as LeaveRequest | null;
  const updates: Partial<LeaveRequest> = { status, approved_by: approvedBy, approved_at: new Date().toISOString() };
  if (rejectionReason) updates.rejection_reason = rejectionReason;
  const { error } = await supabase.from("leave_requests").update(updates).eq("id", id);
  if (error) throw error;
  await closeModuleApproval({
    moduleCode: "HR",
    entityType: "leave_request",
    entityId: id,
    actorId: approvedBy,
    decision: status,
    comment: rejectionReason ?? null
  });
  if (!before) {
    await recordAuditEventSafe({
      moduleCode: "HR",
      entityType: "leave_request",
      entityId: id,
      actionType: status === "approved" ? "APPROVE" : "REJECT",
      actionLabel: status === "approved" ? "Leave Approved" : "Leave Rejected",
      statusTo: status,
      comment: rejectionReason ?? null,
      severity: "high"
    });
  }
};

export const cancelLeaveRequest = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from("leave_requests")
    .update({ status: "cancelled" })
    .eq("id", id);
  if (error) throw error;
};
