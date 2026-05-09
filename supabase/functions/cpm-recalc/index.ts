// CPM (Critical Path Method) recalculation edge function
// Computes ES/EF/LS/LF, total float, free float, and critical flag
// using topological order over task_predecessors (FS/SS/FF/SF + lag).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface TaskRow {
  id: string;
  planned_start: string | null;
  planned_end: string | null;
}
interface PredRow {
  task_id: string;
  predecessor_id: string;
  relation_type: "FS" | "SS" | "FF" | "SF";
  lag_days: number;
}

const DAY_MS = 86_400_000;
const toDate = (s: string | null) => (s ? new Date(s + "T00:00:00Z") : null);
const toIso = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * DAY_MS);
const dayDiff = (a: Date, b: Date) =>
  Math.round((b.getTime() - a.getTime()) / DAY_MS);
const maxDate = (a: Date | null, b: Date | null) =>
  !a ? b : !b ? a : a > b ? a : b;
const minDate = (a: Date | null, b: Date | null) =>
  !a ? b : !b ? a : a < b ? a : b;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { project_id } = await req.json();
    if (!project_id) {
      return new Response(JSON.stringify({ error: "project_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const [{ data: tasks }, { data: preds }] = await Promise.all([
      supabase
        .from("tasks")
        .select("id, planned_start, planned_end")
        .eq("project_id", project_id),
      supabase
        .from("task_predecessors")
        .select("task_id, predecessor_id, relation_type, lag_days")
        .in(
          "task_id",
          ((await supabase.from("tasks").select("id").eq("project_id", project_id))
            .data ?? []).map((r: { id: string }) => r.id),
        ),
    ]);

    const taskList = (tasks ?? []) as TaskRow[];
    const links = (preds ?? []) as PredRow[];

    // Duration map (calendar days, min 1)
    const dur = new Map<string, number>();
    const baseStart = new Map<string, Date>();
    const baseEnd = new Map<string, Date>();
    for (const t of taskList) {
      const s = toDate(t.planned_start);
      const e = toDate(t.planned_end);
      if (s && e) {
        dur.set(t.id, Math.max(1, dayDiff(s, e)));
        baseStart.set(t.id, s);
        baseEnd.set(t.id, e);
      }
    }

    // Predecessor map
    const predOf = new Map<string, PredRow[]>();
    const succOf = new Map<string, PredRow[]>();
    for (const l of links) {
      (predOf.get(l.task_id) ?? predOf.set(l.task_id, []).get(l.task_id)!).push(l);
      (succOf.get(l.predecessor_id) ?? succOf.set(l.predecessor_id, []).get(l.predecessor_id)!).push(l);
    }

    // Topological sort (Kahn) — fall back to any order if cycle
    const indeg = new Map<string, number>();
    taskList.forEach((t) => indeg.set(t.id, (predOf.get(t.id) ?? []).length));
    const queue: string[] = [];
    indeg.forEach((d, id) => { if (d === 0) queue.push(id); });
    const order: string[] = [];
    while (queue.length) {
      const id = queue.shift()!;
      order.push(id);
      for (const s of succOf.get(id) ?? []) {
        const next = (indeg.get(s.task_id) ?? 0) - 1;
        indeg.set(s.task_id, next);
        if (next === 0) queue.push(s.task_id);
      }
    }
    if (order.length < taskList.length) {
      // cycle — append remaining
      for (const t of taskList) if (!order.includes(t.id)) order.push(t.id);
    }

    // Forward pass
    const ES = new Map<string, Date>();
    const EF = new Map<string, Date>();
    for (const id of order) {
      const d = dur.get(id);
      if (d == null) continue;
      let es = baseStart.get(id)!;
      for (const p of predOf.get(id) ?? []) {
        const pES = ES.get(p.predecessor_id);
        const pEF = EF.get(p.predecessor_id);
        if (!pES || !pEF) continue;
        let candidate: Date;
        switch (p.relation_type) {
          case "FS": candidate = addDays(pEF, p.lag_days); break;
          case "SS": candidate = addDays(pES, p.lag_days); break;
          case "FF": candidate = addDays(pEF, p.lag_days - d); break;
          case "SF": candidate = addDays(pES, p.lag_days - d); break;
        }
        es = maxDate(es, candidate)!;
      }
      ES.set(id, es);
      EF.set(id, addDays(es, d));
    }

    // Project finish
    let projectFinish: Date | null = null;
    EF.forEach((v) => { projectFinish = maxDate(projectFinish, v); });

    // Backward pass
    const LS = new Map<string, Date>();
    const LF = new Map<string, Date>();
    for (let i = order.length - 1; i >= 0; i--) {
      const id = order[i];
      const d = dur.get(id);
      if (d == null) continue;
      const succs = succOf.get(id) ?? [];
      let lf: Date | null = null;
      if (succs.length === 0) {
        lf = projectFinish ?? EF.get(id) ?? null;
      } else {
        for (const s of succs) {
          const sLS = LS.get(s.task_id);
          const sLF = LF.get(s.task_id);
          const sDur = dur.get(s.task_id) ?? 1;
          if (!sLS || !sLF) continue;
          let candidate: Date;
          switch (s.relation_type) {
            case "FS": candidate = addDays(sLS, -s.lag_days); break;
            case "SS": candidate = addDays(addDays(sLS, -s.lag_days), d); break;
            case "FF": candidate = addDays(sLF, -s.lag_days); break;
            case "SF": candidate = addDays(addDays(sLF, -s.lag_days), d); break;
          }
          lf = minDate(lf, candidate);
        }
        if (!lf) lf = projectFinish;
      }
      if (!lf) continue;
      LF.set(id, lf);
      LS.set(id, addDays(lf, -d));
    }

    // Build rows
    const rows = taskList.map((t) => {
      const es = ES.get(t.id);
      const ef = EF.get(t.id);
      const ls = LS.get(t.id);
      const lf = LF.get(t.id);
      const totalFloat = es && ls ? dayDiff(es, ls) : null;
      // free float: min(succ.ES) - EF (for FS only, simplified)
      let freeFloat: number | null = null;
      if (ef) {
        const succs = succOf.get(t.id) ?? [];
        let earliestSucc: Date | null = null;
        for (const s of succs) {
          const sES = ES.get(s.task_id);
          if (sES) earliestSucc = minDate(earliestSucc, sES);
        }
        if (earliestSucc) freeFloat = dayDiff(ef, earliestSucc);
      }
      const isCritical = totalFloat !== null && totalFloat <= 0;
      return {
        task_id: t.id,
        project_id,
        early_start: es ? toIso(es) : null,
        early_finish: ef ? toIso(ef) : null,
        late_start: ls ? toIso(ls) : null,
        late_finish: lf ? toIso(lf) : null,
        total_float: totalFloat,
        free_float: freeFloat,
        is_critical: isCritical,
        calculated_at: new Date().toISOString(),
      };
    }).filter((r) => r.early_start && r.early_finish);

    // Replace cache
    await supabase.from("task_schedule_calc").delete().eq("project_id", project_id);
    if (rows.length) {
      const { error } = await supabase.from("task_schedule_calc").insert(rows);
      if (error) throw error;
    }

    const criticalCount = rows.filter((r) => r.is_critical).length;
    return new Response(
      JSON.stringify({
        ok: true,
        tasks: rows.length,
        critical: criticalCount,
        project_finish: projectFinish ? toIso(projectFinish) : null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
