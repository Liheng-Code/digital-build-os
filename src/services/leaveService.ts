import { supabase } from "@/integrations/supabase/client";
import type { LeaveRequest, LeaveType, LeaveBalance } from "@/lib/hrMeta";

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
    .insert(req)
    .select("*, leave_type:leave_types(*)")
    .single();
  if (error) throw error;
  return data as unknown as LeaveRequest;
};

export const updateLeaveStatus = async (
  id: string,
  status: "approved" | "rejected",
  approvedBy: string,
  rejectionReason?: string,
): Promise<void> => {
  const updates: any = { status, approved_by: approvedBy, approved_at: new Date().toISOString() };
  if (rejectionReason) updates.rejection_reason = rejectionReason;
  const { error } = await supabase.from("leave_requests").update(updates).eq("id", id);
  if (error) throw error;
};

export const cancelLeaveRequest = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from("leave_requests")
    .update({ status: "cancelled" })
    .eq("id", id);
  if (error) throw error;
};
