import { supabase } from "@/integrations/supabase/client";
import type { AttendanceRecord } from "@/lib/hrMeta";

export const fetchMyAttendanceRecords = async (userId: string, month: string): Promise<AttendanceRecord[]> => {
  const { data, error } = await supabase
    .from("attendance_records")
    .select("*")
    .eq("user_id", userId)
    .gte("date", `${month}-01`)
    .lte("date", `${month}-31`)
    .order("date");
  if (error) throw error;
  return (data ?? []) as unknown as AttendanceRecord[];
};

export const upsertAttendance = async (record: {
  user_id: string;
  date: string;
  clock_in?: string | null;
  clock_out?: string | null;
  status: string;
  notes?: string | null;
}): Promise<void> => {
  const { error } = await supabase.from("attendance_records").upsert(record, {
    onConflict: "user_id, date",
  });
  if (error) throw error;
};

export const clockIn = async (userId: string): Promise<void> => {
  const today = new Date().toISOString().split("T")[0];
  const now = new Date().toTimeString().split(" ")[0].slice(0, 5);
  await upsertAttendance({
    user_id: userId,
    date: today,
    clock_in: now,
    status: "present",
  });
};

export const clockOut = async (userId: string): Promise<void> => {
  const today = new Date().toISOString().split("T")[0];
  const now = new Date().toTimeString().split(" ")[0].slice(0, 5);
  const { data } = await supabase
    .from("attendance_records")
    .select("id")
    .eq("user_id", userId)
    .eq("date", today)
    .single();
  if (data) {
    const { error } = await supabase
      .from("attendance_records")
      .update({ clock_out: now })
      .eq("id", data.id);
    if (error) throw error;
  }
};

export const fetchTodayStatus = async (userId: string): Promise<AttendanceRecord | null> => {
  const today = new Date().toISOString().split("T")[0];
  const { data, error } = await supabase
    .from("attendance_records")
    .select("*")
    .eq("user_id", userId)
    .eq("date", today)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as AttendanceRecord | null;
};
