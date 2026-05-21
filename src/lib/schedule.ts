// Pure scheduling utilities: cascade calculation + blocked status.
// All functions are deterministic and unit-testable.

import { addDays, differenceInCalendarDays, format, isValid, parseISO } from "date-fns";
import type { DepRelation } from "@/lib/scheduleMeta";

export interface SchedTask {
  id: string;
  planned_start: string | null;
  planned_end: string | null;
  status?: string;
  actual_end?: string | null;
  progress_pct?: number;
}

export interface DepLink {
  task_id: string;
  predecessor_id: string;
  relation_type: DepRelation;
  lag_days: number;
  is_hard_block?: boolean;
}

export interface ShiftedTask {
  id: string;
  oldStart: string | null;
  oldEnd: string | null;
  newStart: string;
  newEnd: string;
  shiftDays: number;
}

const safeISO = (s: string | null | undefined): Date | null => {
  if (!s) return null;
  const d = parseISO(s);
  return isValid(d) ? d : null;
};
const toIso = (d: Date) => format(d, "yyyy-MM-dd");

/** Calendar-day duration including both endpoints. */
export function durationDays(start: string | null, end: string | null): number {
  const s = safeISO(start);
  const e = safeISO(end);
  if (!s || !e) return 0;
  return Math.max(1, differenceInCalendarDays(e, s) + 1);
}

/** Earliest legal start for a successor given one predecessor. Returns null if dates incomplete. */
export function constraintStart(
  pred: SchedTask,
  rel: DepRelation,
  lag: number,
): Date | null {
  const ps = safeISO(pred.planned_start);
  const pe = safeISO(pred.planned_end);
  if (rel === "FS") return pe ? addDays(pe, lag + 1) : null;
  if (rel === "SS") return ps ? addDays(ps, lag) : null;
  if (rel === "FF") return null; // FF/SF constrain end, handled separately
  if (rel === "SF") return null;
  return null;
}

/** Earliest legal finish for FF/SF (returns null otherwise). */
export function constraintFinish(
  pred: SchedTask,
  rel: DepRelation,
  lag: number,
): Date | null {
  const ps = safeISO(pred.planned_start);
  const pe = safeISO(pred.planned_end);
  if (rel === "FF") return pe ? addDays(pe, lag) : null;
  if (rel === "SF") return ps ? addDays(ps, lag) : null;
  return null;
}

/** Cascade a date change starting from `changedTaskIds` through their successors.
 *  Returns the proposed updated map (only tasks that need to move). */
export function cascade(
  tasks: SchedTask[],
  deps: DepLink[],
  proposed: Map<string, { planned_start: string; planned_end: string }>,
): ShiftedTask[] {
  const taskMap = new Map<string, SchedTask>();
  for (const t of tasks) taskMap.set(t.id, { ...t });
  // Apply proposed changes upfront
  for (const [id, p] of proposed) {
    const t = taskMap.get(id);
    if (t) {
      t.planned_start = p.planned_start;
      t.planned_end = p.planned_end;
    }
  }

  // Index successors by predecessor
  const successorsOf = new Map<string, DepLink[]>();
  for (const d of deps) {
    const arr = successorsOf.get(d.predecessor_id) ?? [];
    arr.push(d);
    successorsOf.set(d.predecessor_id, arr);
  }

  const original = new Map<string, SchedTask>();
  for (const t of tasks) original.set(t.id, t);

  // BFS over successors
  const queue: string[] = [...proposed.keys()];
  const seen = new Set<string>();
  const result = new Map<string, ShiftedTask>();

  // Seed result with the proposed (user-driven) shifts
  for (const [id, p] of proposed) {
    const orig = original.get(id);
    if (!orig) continue;
    const oldStart = orig.planned_start;
    const oldEnd = orig.planned_end;
    const shift = oldStart && p.planned_start
      ? differenceInCalendarDays(parseISO(p.planned_start), parseISO(oldStart))
      : 0;
    result.set(id, {
      id,
      oldStart,
      oldEnd,
      newStart: p.planned_start,
      newEnd: p.planned_end,
      shiftDays: shift,
    });
  }

  let safety = 0;
  while (queue.length && safety++ < 5000) {
    const predId = queue.shift()!;
    const links = successorsOf.get(predId) ?? [];
    const pred = taskMap.get(predId);
    if (!pred) continue;

    for (const link of links) {
      const succ = taskMap.get(link.task_id);
      if (!succ) continue;
      const ss = safeISO(succ.planned_start);
      const se = safeISO(succ.planned_end);
      if (!ss || !se) continue;
      const succDur = differenceInCalendarDays(se, ss);

      const cStart = constraintStart(pred, link.relation_type, link.lag_days);
      const cFinish = constraintFinish(pred, link.relation_type, link.lag_days);

      let newStart = ss;
      let newEnd = se;

      if (cStart && cStart > newStart) {
        newStart = cStart;
        newEnd = addDays(newStart, succDur);
      }
      if (cFinish && cFinish > newEnd) {
        newEnd = cFinish;
        newStart = addDays(newEnd, -succDur);
      }

      if (newStart.getTime() === ss.getTime() && newEnd.getTime() === se.getTime()) {
        continue; // no shift needed
      }

      const newStartIso = toIso(newStart);
      const newEndIso = toIso(newEnd);

      // If we already have a planned shift for this successor, keep the LATER one.
      const existing = result.get(succ.id);
      if (existing) {
        if (parseISO(existing.newStart) >= newStart) continue;
      }

      const orig = original.get(succ.id)!;
      const shift = differenceInCalendarDays(newStart, parseISO(orig.planned_start!));

      result.set(succ.id, {
        id: succ.id,
        oldStart: orig.planned_start,
        oldEnd: orig.planned_end,
        newStart: newStartIso,
        newEnd: newEndIso,
        shiftDays: shift,
      });

      succ.planned_start = newStartIso;
      succ.planned_end = newEndIso;
      taskMap.set(succ.id, succ);

      if (!seen.has(succ.id)) {
        seen.add(succ.id);
        queue.push(succ.id);
      }
    }
  }

  return [...result.values()];
}

const COMPLETE_STATES = new Set(["completed", "approved", "closed"]);

/** A task is blocked if any HARD predecessor isn't done. Soft predecessors only warn. */
export function isTaskBlocked(
  taskId: string,
  deps: DepLink[],
  taskById: Map<string, SchedTask>,
): { blocked: boolean; blockingIds: string[] } {
  const incoming = deps.filter((d) => d.task_id === taskId && d.is_hard_block);
  const blockingIds: string[] = [];
  for (const d of incoming) {
    const pred = taskById.get(d.predecessor_id);
    if (!pred) continue;
    const done = pred.status && COMPLETE_STATES.has(pred.status);
    if (!done) blockingIds.push(d.predecessor_id);
  }
  return { blocked: blockingIds.length > 0, blockingIds };
}

/** Build a map of taskId → blockingIds for a whole project. */
export function computeBlockedness(
  tasks: SchedTask[],
  deps: DepLink[],
): Map<string, string[]> {
  const byId = new Map<string, SchedTask>();
  for (const t of tasks) byId.set(t.id, t);
  const out = new Map<string, string[]>();
  for (const t of tasks) {
    const r = isTaskBlocked(t.id, deps, byId);
    if (r.blocked) out.set(t.id, r.blockingIds);
  }
  return out;
}

/** Working-day delay between planned end and today (or actual end). Positive = late. */
export function delayDays(task: SchedTask, today: Date = new Date()): number {
  const pe = safeISO(task.planned_end);
  if (!pe) return 0;
  const ae = safeISO(task.actual_end ?? null);
  if (ae) return Math.max(0, differenceInCalendarDays(ae, pe));
  if (task.status && COMPLETE_STATES.has(task.status)) return 0;
  return Math.max(0, differenceInCalendarDays(today, pe));
}
