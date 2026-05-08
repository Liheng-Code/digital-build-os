import { supabase } from "@/integrations/supabase/client";
import type { ReportSchedule } from "@/lib/reportingMeta";

export async function fetchReportSchedules(projectId: string): Promise<ReportSchedule[]> {
  const { data, error } = await (supabase as any)
    .from("report_schedules")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function upsertReportSchedule(
  schedule: Partial<ReportSchedule> & { project_id: string }
): Promise<ReportSchedule> {
  const { data, error } = await (supabase as any)
    .from("report_schedules")
    .upsert(schedule)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteReportSchedule(id: string): Promise<void> {
  const { error } = await (supabase as any)
    .from("report_schedules")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function toggleReportSchedule(id: string, enabled: boolean): Promise<void> {
  const { error } = await (supabase as any)
    .from("report_schedules")
    .update({ enabled, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
}
