import { supabase } from "@/integrations/supabase/client";

export type ScheduleConstraintType =
  | "ASAP" | "ALAP" | "SNET" | "SNLT" | "FNET" | "FNLT" | "MSO" | "MFO";

export const CONSTRAINT_TYPE_LABELS: Record<ScheduleConstraintType, string> = {
  ASAP: "As Soon As Possible",
  ALAP: "As Late As Possible",
  SNET: "Start No Earlier Than",
  SNLT: "Start No Later Than",
  FNET: "Finish No Earlier Than",
  FNLT: "Finish No Later Than",
  MSO:  "Must Start On",
  MFO:  "Must Finish On",
};

export interface Calendar {
  id: string;
  project_id: string;
  name: string;
  is_default: boolean;
  working_days: number;
  hours_per_day: number;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface CalendarException {
  id: string;
  calendar_id: string;
  exception_date: string;
  is_working: boolean;
  hours: number | null;
  label: string | null;
}

export interface WbsBaseline {
  id: string;
  project_id: string;
  label: string;
  notes: string | null;
  is_active: boolean;
  captured_by: string | null;
  captured_at: string;
}

export interface BaselineTask {
  id: string;
  baseline_id: string;
  task_id: string;
  planned_start: string | null;
  planned_end: string | null;
  estimated_hours: number | null;
  progress_pct: number | null;
}

export interface TaskConstraint {
  task_id: string;
  constraint_type: ScheduleConstraintType;
  constraint_date: string | null;
  deadline_date: string | null;
  calendar_id: string | null;
}

export interface TaskScheduleCalc {
  task_id: string;
  project_id: string;
  early_start: string | null;
  early_finish: string | null;
  late_start: string | null;
  late_finish: string | null;
  total_float: number | null;
  free_float: number | null;
  is_critical: boolean;
  calculated_at: string;
}

const sb = supabase as any;

// ---------- Calendars ----------
export async function listCalendars(projectId: string): Promise<Calendar[]> {
  const { data, error } = await sb
    .from("calendars").select("*")
    .eq("project_id", projectId)
    .order("is_default", { ascending: false })
    .order("name");
  if (error) throw error;
  return (data ?? []) as Calendar[];
}

export async function upsertCalendar(payload: Partial<Calendar> & { project_id: string; name: string }) {
  const { data, error } = await sb.from("calendars").upsert(payload).select().single();
  if (error) throw error;
  return data as Calendar;
}

export async function deleteCalendar(id: string) {
  const { error } = await sb.from("calendars").delete().eq("id", id);
  if (error) throw error;
}

export async function listCalendarExceptions(calendarId: string): Promise<CalendarException[]> {
  const { data, error } = await sb
    .from("calendar_exceptions").select("*")
    .eq("calendar_id", calendarId)
    .order("exception_date");
  if (error) throw error;
  return (data ?? []) as CalendarException[];
}

export async function upsertCalendarException(payload: Partial<CalendarException> & { calendar_id: string; exception_date: string }) {
  const { data, error } = await sb.from("calendar_exceptions").upsert(payload).select().single();
  if (error) throw error;
  return data as CalendarException;
}

export async function deleteCalendarException(id: string) {
  const { error } = await sb.from("calendar_exceptions").delete().eq("id", id);
  if (error) throw error;
}

// ---------- Baselines ----------
export async function listBaselines(projectId: string): Promise<WbsBaseline[]> {
  const { data, error } = await sb
    .from("wbs_baselines").select("*")
    .eq("project_id", projectId)
    .order("captured_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as WbsBaseline[];
}

export async function captureBaseline(projectId: string, label: string, notes?: string): Promise<string> {
  const { data, error } = await sb.rpc("capture_baseline", {
    _project_id: projectId, _label: label, _notes: notes ?? null,
  });
  if (error) throw error;
  return data as string;
}

export async function setActiveBaseline(baselineId: string) {
  const { error } = await sb.rpc("set_active_baseline", { _baseline_id: baselineId });
  if (error) throw error;
}

export async function deleteBaseline(id: string) {
  const { error } = await sb.from("wbs_baselines").delete().eq("id", id);
  if (error) throw error;
}

export async function listBaselineTasks(baselineId: string): Promise<BaselineTask[]> {
  const { data, error } = await sb
    .from("wbs_baseline_tasks").select("*")
    .eq("baseline_id", baselineId);
  if (error) throw error;
  return (data ?? []) as BaselineTask[];
}

// ---------- Constraints ----------
export async function getConstraint(taskId: string): Promise<TaskConstraint | null> {
  const { data, error } = await sb
    .from("task_constraints").select("*")
    .eq("task_id", taskId).maybeSingle();
  if (error) throw error;
  return (data ?? null) as TaskConstraint | null;
}

export async function upsertConstraint(payload: TaskConstraint) {
  const { data, error } = await sb.from("task_constraints").upsert(payload).select().single();
  if (error) throw error;
  return data as TaskConstraint;
}

export async function deleteConstraint(taskId: string) {
  const { error } = await sb.from("task_constraints").delete().eq("task_id", taskId);
  if (error) throw error;
}

// ---------- CPM ----------
export async function recalcCpm(projectId: string) {
  const { error } = await sb.rpc("cpm_recalc", { _project_id: projectId });
  if (error) throw error;
}

export async function listScheduleCalc(projectId: string): Promise<TaskScheduleCalc[]> {
  const { data, error } = await sb
    .from("task_schedule_calc").select("*")
    .eq("project_id", projectId);
  if (error) throw error;
  return (data ?? []) as TaskScheduleCalc[];
}

// ---------- Saved views ----------
export interface WbsSavedView {
  id: string;
  project_id: string;
  user_id: string;
  name: string;
  filters: Record<string, unknown>;
  columns: string[];
  zoom: string | null;
  is_shared: boolean;
  created_at: string;
  updated_at: string;
}

export async function listSavedViews(projectId: string): Promise<WbsSavedView[]> {
  const { data, error } = await sb
    .from("wbs_saved_views").select("*")
    .eq("project_id", projectId)
    .order("name");
  if (error) throw error;
  return (data ?? []) as WbsSavedView[];
}

export async function upsertSavedView(payload: Partial<WbsSavedView> & { project_id: string; user_id: string; name: string }) {
  const { data, error } = await sb.from("wbs_saved_views").upsert(payload).select().single();
  if (error) throw error;
  return data as WbsSavedView;
}

export async function deleteSavedView(id: string) {
  const { error } = await sb.from("wbs_saved_views").delete().eq("id", id);
  if (error) throw error;
}
