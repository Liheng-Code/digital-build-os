// Pure scheduling utilities: cascade calculation + blocked status + CPM.
// All functions are deterministic and unit-testable.

import { addDays, differenceInCalendarDays, format, isValid, parseISO, startOfDay, max, min } from "date-fns";
import type { DepRelation, ConstraintType, CpmResult, CpmMap, CpmTask } from "@/lib/scheduleMeta";

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

// ─── CPM (Critical Path Method) ────────────────────────────────────────────

interface CpmEdge {
  from: string;
  to: string;
  rel: DepRelation;
  lag: number;
}

/**
 * Compute forward/backward pass CPM for a set of tasks and dependencies.
 * Returns a Map of taskId → { es, ef, ls, lf, totalFloat, freeFloat, isCritical }.
 */
export function computeCpm(
  tasks: CpmTask[],
  deps: DepLink[],
  projectStartDate?: Date,
  projectEndDate?: Date,
): CpmMap {
  const DAY_MS = 86400000;
  const toDate = (s: string | null | undefined): Date | null => {
    if (!s) return null;
    const d = parseISO(s);
    return isValid(d) ? startOfDay(d) : null;
  };

  const taskMap = new Map<string, CpmTask>();
  for (const t of tasks) taskMap.set(t.id, t);

  // Build adjacency
  const incoming = new Map<string, CpmEdge[]>();   // edges where this task is successor
  const outgoing = new Map<string, CpmEdge[]>();   // edges where this task is predecessor
  for (const d of deps) {
    const edge: CpmEdge = { from: d.predecessor_id, to: d.task_id, rel: d.relation_type, lag: d.lag_days ?? 0 };
    const inc = incoming.get(d.task_id) ?? [];
    inc.push(edge);
    incoming.set(d.task_id, inc);
    const out = outgoing.get(d.predecessor_id) ?? [];
    out.push(edge);
    outgoing.set(d.predecessor_id, out);
  }

  // Topological sort (Kahn's algorithm)
  const inDegree = new Map<string, number>();
  for (const t of tasks) inDegree.set(t.id, 0);
  for (const d of deps) {
    inDegree.set(d.task_id, (inDegree.get(d.task_id) ?? 0) + 1);
  }

  const order: string[] = [];
  const queue: string[] = [];
  for (const [id, deg] of inDegree) {
    if (deg === 0) queue.push(id);
  }
  while (queue.length > 0) {
    const id = queue.shift()!;
    order.push(id);
    for (const edge of outgoing.get(id) ?? []) {
      const newDeg = (inDegree.get(edge.to) ?? 1) - 1;
      inDegree.set(edge.to, newDeg);
      if (newDeg === 0) queue.push(edge.to);
    }
  }

  // Initialize CPM results
  const result = new Map<string, CpmResult>();

  const initDate = (s: string | null | undefined): Date => {
    const d = toDate(s);
    return d ?? (projectStartDate ?? startOfDay(new Date()));
  };

  for (const t of tasks) {
    const start = initDate(t.planned_start);
    const end = initDate(t.planned_end);
    const dur = Math.max(1, differenceInCalendarDays(end, start));
    result.set(t.id, {
      es: start,
      ef: end,
      ls: start,
      lf: end,
      totalFloat: 0,
      freeFloat: 0,
      isCritical: false,
    });
  }

  // ── Forward Pass ──────────────────────────────────────────────────────
  for (const id of order) {
    const r = result.get(id)!;
    const task = taskMap.get(id)!;
    const predEdges = incoming.get(id) ?? [];

    if (predEdges.length > 0) {
      let earliestStart = r.es;
      let earliestFinish = r.ef;

      for (const edge of predEdges) {
        const pred = result.get(edge.from);
        if (!pred) continue;

        if (edge.rel === "FS") {
          const cand = addDays(pred.ef, edge.lag + 1);
          if (cand > earliestStart) earliestStart = cand;
        } else if (edge.rel === "SS") {
          const cand = addDays(pred.es, edge.lag);
          if (cand > earliestStart) earliestStart = cand;
        } else if (edge.rel === "FF") {
          const cand = addDays(pred.ef, edge.lag);
          if (cand > earliestFinish) earliestFinish = cand;
        } else if (edge.rel === "SF") {
          const cand = addDays(pred.es, edge.lag);
          if (cand > earliestFinish) earliestFinish = cand;
        }
      }

      // Recompute duration after constraint from predecessors
      const dur = Math.max(1, differenceInCalendarDays(r.ef, r.es));
      // If finish was pushed by FF/SF, push start accordingly
      if (earliestFinish > r.ef) {
        earliestStart = addDays(earliestFinish, -(dur - 1));
      }
      // If start was pushed by FS/SS, push finish accordingly
      if (earliestStart > r.es) {
        earliestFinish = addDays(earliestStart, dur - 1);
      }

      r.es = earliestStart;
      r.ef = earliestFinish;
    }

    // Apply forward-pass constraints
    if (task.constraint_type) {
      const cd = toDate(task.constraint_date);
      if (cd) {
        if (task.constraint_type === "SNET") {
          if (cd > r.es) {
            const dur = Math.max(1, differenceInCalendarDays(r.ef, r.es));
            r.es = cd;
            r.ef = addDays(cd, dur - 1);
          }
        } else if (task.constraint_type === "FNET") {
          if (cd > r.ef) {
            const dur = Math.max(1, differenceInCalendarDays(r.ef, r.es));
            r.ef = cd;
            r.es = addDays(cd, -(dur - 1));
          }
        } else if (task.constraint_type === "MSO") {
          const dur = Math.max(1, differenceInCalendarDays(r.ef, r.es));
          r.es = cd;
          r.ef = addDays(cd, dur - 1);
        } else if (task.constraint_type === "MFO") {
          const dur = Math.max(1, differenceInCalendarDays(r.ef, r.es));
          r.ef = cd;
          r.es = addDays(cd, -(dur - 1));
        }
      }
    }
  }

  // ── Backward Pass ─────────────────────────────────────────────────────
  // Initialize LF/LS to project end or last task's EF
  let projectEnd = projectEndDate;
  if (!projectEnd) {
    for (const r of result.values()) {
      if (!projectEnd || r.ef > projectEnd) projectEnd = r.ef;
    }
  }
  if (!projectEnd) projectEnd = startOfDay(new Date());

  for (const r of result.values()) {
    r.lf = projectEnd;
    const dur = Math.max(1, differenceInCalendarDays(r.ef, r.es));
    r.ls = addDays(projectEnd, -(dur - 1));
  }

  // Process in reverse topological order
  for (let i = order.length - 1; i >= 0; i--) {
    const id = order[i];
    const r = result.get(id)!;
    const task = taskMap.get(id)!;
    const succEdges = outgoing.get(id) ?? [];

    if (succEdges.length > 0) {
      let latestStart = r.ls;
      let latestFinish = r.lf;

      for (const edge of succEdges) {
        const succ = result.get(edge.to);
        if (!succ) continue;

        if (edge.rel === "FS") {
          const cand = addDays(succ.ls, -(edge.lag + 1));
          if (cand < latestFinish) latestFinish = cand;
        } else if (edge.rel === "SS") {
          const cand = addDays(succ.ls, -edge.lag);
          if (cand < latestStart) latestStart = cand;
        } else if (edge.rel === "FF") {
          const cand = addDays(succ.lf, -edge.lag);
          if (cand < latestFinish) latestFinish = cand;
        } else if (edge.rel === "SF") {
          const cand = addDays(succ.lf, -edge.lag);
          if (cand < latestStart) latestStart = cand;
        }
      }

      const dur = Math.max(1, differenceInCalendarDays(r.ef, r.es));
      if (latestFinish < r.lf) {
        latestStart = addDays(latestFinish, -(dur - 1));
      }
      if (latestStart < r.ls) {
        latestFinish = addDays(latestStart, dur - 1);
      }

      r.ls = latestStart;
      r.lf = latestFinish;
    }

    // Apply backward-pass constraints
    if (task.constraint_type) {
      const cd = toDate(task.constraint_date);
      if (cd) {
        if (task.constraint_type === "SNLT") {
          if (cd < r.ls) {
            const dur = Math.max(1, differenceInCalendarDays(r.ef, r.es));
            r.ls = cd;
            r.lf = addDays(cd, dur - 1);
          }
        } else if (task.constraint_type === "FNLT") {
          if (cd < r.lf) {
            const dur = Math.max(1, differenceInCalendarDays(r.ef, r.es));
            r.lf = cd;
            r.ls = addDays(cd, -(dur - 1));
          }
        } else if (task.constraint_type === "MSO") {
          const dur = Math.max(1, differenceInCalendarDays(r.ef, r.es));
          r.ls = r.es;
          r.lf = r.ef;
        } else if (task.constraint_type === "MFO") {
          const dur = Math.max(1, differenceInCalendarDays(r.ef, r.es));
          r.lf = r.ef;
          r.ls = r.es;
        }
      }
    }
  }

  // ── Compute float & critical ─────────────────────────────────────────
  for (const [id, r] of result) {
    r.totalFloat = differenceInCalendarDays(r.lf, r.ef);
    r.isCritical = r.totalFloat <= 0;

    // Free float: earliest successor ES minus EF - 1
    const succEdges = outgoing.get(id) ?? [];
    let minSuccEs: Date | null = null;
    for (const edge of succEdges) {
      const succ = result.get(edge.to);
      if (!succ) continue;
      if (!minSuccEs || succ.es < minSuccEs) minSuccEs = succ.es;
    }
    if (minSuccEs) {
      r.freeFloat = Math.max(0, differenceInCalendarDays(minSuccEs, r.ef) - 1);
    } else {
      r.freeFloat = r.totalFloat;
    }
  }

  return result;
}
