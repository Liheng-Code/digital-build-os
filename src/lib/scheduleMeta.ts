// Scheduling helpers for WBS Phase 1
import { differenceInCalendarDays, parseISO, isValid, addDays, format } from "date-fns";

export type DepRelation = "FS" | "SS" | "FF" | "SF";
export const DEP_RELATION_LABELS: Record<DepRelation, string> = {
  FS: "Finish → Start",
  SS: "Start → Start",
  FF: "Finish → Finish",
  SF: "Start → Finish",
};

export type ScheduleStatus = "not_started" | "on_track" | "at_risk" | "late" | "done";

export const SCHEDULE_STATUS_LABEL: Record<ScheduleStatus, string> = {
  not_started: "Not started",
  on_track: "On track",
  at_risk: "At risk",
  late: "Late",
  done: "Done",
};

/** Tailwind classes for status dot/pill, all using semantic tokens. */
export const SCHEDULE_STATUS_TONE: Record<ScheduleStatus, string> = {
  not_started: "bg-muted text-muted-foreground",
  on_track: "bg-success-soft text-success",
  at_risk: "bg-warning-soft text-warning",
  late: "bg-destructive/10 text-destructive",
  done: "bg-primary/10 text-primary",
};
export const SCHEDULE_STATUS_DOT: Record<ScheduleStatus, string> = {
  not_started: "bg-muted-foreground/40",
  on_track: "bg-success",
  at_risk: "bg-warning",
  late: "bg-destructive",
  done: "bg-primary",
};

export interface TaskScheduleLite {
  id: string;
  wbs_node_id: string | null;
  planned_start: string | null;
  planned_end: string | null;
  actual_start: string | null;
  actual_end: string | null;
  progress_pct: number;
  estimated_hours: number | null;
  status?: string;
}

export interface NodeRollup {
  totalTasks: number;
  plannedStart: string | null;
  plannedEnd: string | null;
  actualStart: string | null;
  actualEnd: string | null;
  progressPct: number; // 0..100, weighted by estimated_hours when available
  lateCount: number;
  status: ScheduleStatus;
}

const safe = (s: string | null | undefined): Date | null => {
  if (!s) return null;
  const d = parseISO(s);
  return isValid(d) ? d : null;
};

const toIso = (d: Date | null) => (d ? format(d, "yyyy-MM-dd") : null);

const minDate = (a: Date | null, b: Date | null) =>
  !a ? b : !b ? a : a < b ? a : b;
const maxDate = (a: Date | null, b: Date | null) =>
  !a ? b : !b ? a : a > b ? a : b;

/** Working-day count between two ISO dates (inclusive of start, exclusive of end+1).
 *  Phase 1 uses a 7-day calendar minus a holiday list — i.e. simple calendar days
 *  with holidays excluded. */
export function workingDaysBetween(
  startIso: string | null,
  endIso: string | null,
  holidayIsoSet?: Set<string>,
): number {
  const s = safe(startIso);
  const e = safe(endIso);
  if (!s || !e) return 0;
  const diff = differenceInCalendarDays(e, s);
  if (diff < 0) return 0;
  const holidays = holidayIsoSet ?? new Set<string>();
  let count = 0;
  for (let i = 0; i <= diff; i++) {
    const d = addDays(s, i);
    if (!holidays.has(format(d, "yyyy-MM-dd"))) count++;
  }
  return count;
}

export function taskStatus(t: TaskScheduleLite, today: Date = new Date()): ScheduleStatus {
  if (t.actual_end || t.progress_pct >= 100 || t.status === "completed" || t.status === "closed") {
    return "done";
  }
  const pe = safe(t.planned_end);
  const ps = safe(t.planned_start);
  const started = !!t.actual_start;
  if (pe && pe < today && !t.actual_end) return "late";
  if (started && ps && pe) {
    const total = differenceInCalendarDays(pe, ps) || 1;
    const elapsed = Math.max(0, Math.min(total, differenceInCalendarDays(today, ps)));
    const expected = (elapsed / total) * 100;
    if (t.progress_pct < expected - 10) return "at_risk";
    return "on_track";
  }
  if (started) return "on_track";
  return "not_started";
}

const SEVERITY: Record<ScheduleStatus, number> = {
  late: 5,
  at_risk: 4,
  on_track: 3,
  done: 2,
  not_started: 1,
};

/** Roll a list of tasks up into a single node summary. */
export function rollupTasks(tasks: TaskScheduleLite[], today: Date = new Date()): NodeRollup | null {
  if (tasks.length === 0) return null;
  let plannedStart: Date | null = null;
  let plannedEnd: Date | null = null;
  let actualStart: Date | null = null;
  let actualEnd: Date | null = null;
  let weightedProg = 0;
  let totalWeight = 0;
  let lateCount = 0;
  let worst: ScheduleStatus = "done";
  let allDone = true;

  for (const t of tasks) {
    plannedStart = minDate(plannedStart, safe(t.planned_start));
    plannedEnd = maxDate(plannedEnd, safe(t.planned_end));
    actualStart = minDate(actualStart, safe(t.actual_start));
    actualEnd = maxDate(actualEnd, safe(t.actual_end));
    const w = Math.max(0.0001, Number(t.estimated_hours ?? 0)) || 1;
    weightedProg += (Number(t.progress_pct) || 0) * w;
    totalWeight += w;

    const st = taskStatus(t, today);
    if (st !== "done") allDone = false;
    if (st === "late") lateCount++;
    if (SEVERITY[st] > SEVERITY[worst]) worst = st;
  }

  return {
    totalTasks: tasks.length,
    plannedStart: toIso(plannedStart),
    plannedEnd: toIso(plannedEnd),
    actualStart: toIso(actualStart),
    actualEnd: allDone ? toIso(actualEnd) : null,
    progressPct: totalWeight > 0 ? Math.round(weightedProg / totalWeight) : 0,
    lateCount,
    status: worst,
  };
}
