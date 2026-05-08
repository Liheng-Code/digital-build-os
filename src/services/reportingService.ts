import { supabase } from "@/integrations/supabase/client";
import type {
  OrgKpiData,
  DeptKpiRow,
  MemberKpiRow,
  ProjectKpiSummary,
  FinancialKpiSummary,
  TaskProgressPoint,
  BuildingProgress,
  WbsNodePerformance,
} from "@/lib/reportingMeta";
import type { Department } from "@/lib/departmentMeta";

// ─── Org KPIs ─────────────────────────────────────────────

export async function fetchOrgKpiData(
  projectId: string,
  dateFrom?: string,
  dateTo?: string,
): Promise<OrgKpiData> {
  const today = new Date().toISOString().slice(0, 10);

  let tasksQ = (supabase as any)
    .from("tasks")
    .select("id, status, planned_end, actual_end, project_id, department")
    .eq("project_id", projectId);

  let tsQ = (supabase as any)
    .from("timesheet_entries")
    .select("user_id, project_id, regular_hours, overtime_hours, status, work_date")
    .eq("project_id", projectId);
  if (dateFrom) tsQ = tsQ.gte("work_date", dateFrom);
  if (dateTo) tsQ = tsQ.lte("work_date", dateTo);

  const [tRes, tsRes, plRes, mRes, prRes, dmRes] = await Promise.all([
    tasksQ,
    tsQ,
    (supabase as any).from("payroll_lines").select("total_pay, currency"),
    (supabase as any).from("project_members").select("user_id, project_id"),
    (supabase as any).from("profiles").select("id, full_name, job_title"),
    (supabase as any).from("department_members").select("user_id, department"),
  ]);

  const tasks = (tRes.data ?? []) as Array<{
    id: string; status: string; planned_end: string | null;
    actual_end: string | null; project_id: string; department: Department | null;
  }>;
  const ts = (tsRes.data ?? []) as Array<{
    user_id: string; regular_hours: number; overtime_hours: number;
    status: string; work_date: string;
  }>;
  const pl = (plRes.data ?? []) as Array<{ total_pay: number; currency: string }>;
  const projMembers = (mRes.data ?? []) as Array<{ user_id: string; project_id: string }>;
  const deptMembers = (dmRes.data ?? []) as Array<{ user_id: string; department: Department }>;

  const completed = tasks.filter((t) => t.status === "completed" || t.status === "closed").length;
  const inProgress = tasks.filter((t) => t.status === "in_progress").length;
  const overdue = tasks.filter(
    (t) =>
      t.planned_end &&
      t.planned_end < today &&
      !["completed", "closed", "approved"].includes(t.status),
  ).length;
  const onTime = tasks.filter(
    (t) =>
      (t.status === "completed" || t.status === "closed") &&
      t.planned_end &&
      t.actual_end &&
      new Date(t.actual_end) <= new Date(t.planned_end),
  ).length;
  const onTimeRate = completed > 0 ? Math.round((onTime / completed) * 100) : 0;
  const totalHours = ts.reduce(
    (s, e) => s + Number(e.regular_hours) + Number(e.overtime_hours), 0,
  );
  const approvedHours = ts
    .filter((e) => e.status === "approved")
    .reduce((s, e) => s + Number(e.regular_hours) + Number(e.overtime_hours), 0);
  const payrollTotal = pl.reduce((s, l) => s + Number(l.total_pay), 0);
  const payrollCurrency = pl[0]?.currency ?? "USD";

  const projectIds = new Set([projectId]);
  const memberIds = new Set(
    projMembers
      .filter((m) => projectIds.has(m.project_id))
      .map((m) => m.user_id),
  );

  return {
    totalProjects: 1,
    totalMembers: memberIds.size,
    totalTasks: tasks.length,
    completedTasks: completed,
    inProgressTasks: inProgress,
    overdueTasks: overdue,
    totalHours,
    approvedHours,
    payrollTotal,
    payrollCurrency,
    onTimeRate,
  };
}

// ─── Department KPIs ────────────────────────────────────────

export async function fetchDepartmentKpis(
  projectId: string,
  dateFrom?: string,
  dateTo?: string,
): Promise<DeptKpiRow[]> {
  const today = new Date().toISOString().slice(0, 10);

  const [tRes, tsRes, dmRes] = await Promise.all([
    (supabase as any)
      .from("tasks")
      .select("id, status, planned_end, department")
      .eq("project_id", projectId),
    (() => {
      let q = (supabase as any)
        .from("timesheet_entries")
        .select("user_id, regular_hours, overtime_hours, status, work_date")
        .eq("project_id", projectId);
      if (dateFrom) q = q.gte("work_date", dateFrom);
      if (dateTo) q = q.lte("work_date", dateTo);
      return q;
    })(),
    (supabase as any).from("department_members").select("user_id, department"),
  ]);

  const tasks = (tRes.data ?? []) as Array<{
    id: string; status: string; planned_end: string | null; department: Department | null;
  }>;
  const ts = (tsRes.data ?? []) as Array<{
    user_id: string; regular_hours: number; overtime_hours: number; status: string;
  }>;
  const deptMembers = (dmRes.data ?? []) as Array<{ user_id: string; department: Department }>;

  type DeptAgg = {
    members: Set<string>; total: number; open: number; assigned: number;
    in_progress: number; pending_approval: number; approved: number;
    rejected: number; completed: number; closed: number; overdue: number; hours: number;
  };
  const deptAgg = new Map<Department | "unassigned", DeptAgg>();
  const ensure = (k: Department | "unassigned"): DeptAgg => {
    let a = deptAgg.get(k);
    if (!a) {
      a = {
        members: new Set(), total: 0, open: 0, assigned: 0, in_progress: 0,
        pending_approval: 0, approved: 0, rejected: 0, completed: 0, closed: 0,
        overdue: 0, hours: 0,
      };
      deptAgg.set(k, a);
    }
    return a;
  };

  const taskIds = tasks.map((t) => t.id);
  const { data: assignsData } = taskIds.length
    ? await (supabase as any)
        .from("task_assignments")
        .select("user_id, task_id")
        .in("task_id", taskIds)
        .is("unassigned_at", null)
    : { data: [] };
  const assigns = (assignsData ?? []) as Array<{ user_id: string; task_id: string }>;
  const assignsByTask = new Map<string, string[]>();
  assigns.forEach((a) => {
    let arr = assignsByTask.get(a.task_id);
    if (!arr) { arr = []; assignsByTask.set(a.task_id, arr); }
    arr.push(a.user_id);
  });

  tasks.forEach((t) => {
    const k: Department | "unassigned" = t.department ?? "unassigned";
    const a = ensure(k);
    a.total += 1;
    const isClosed = ["completed", "closed", "approved"].includes(t.status);
    if (t.planned_end && t.planned_end < today && !isClosed) a.overdue += 1;
    switch (t.status) {
      case "open": a.open += 1; break;
      case "assigned": a.assigned += 1; break;
      case "in_progress": a.in_progress += 1; break;
      case "pending_approval": a.pending_approval += 1; break;
      case "approved": a.approved += 1; break;
      case "rejected": a.rejected += 1; break;
      case "completed": a.completed += 1; break;
      case "closed": a.closed += 1; break;
    }
    (assignsByTask.get(t.id) ?? []).forEach((uid) => a.members.add(uid));
  });

  deptMembers.forEach((dm) => {
    ensure(dm.department).members.add(dm.user_id);
  });

  const userDept = new Map<string, Department>();
  deptMembers.forEach((dm) => {
    if (!userDept.has(dm.user_id)) userDept.set(dm.user_id, dm.department);
  });
  ts.forEach((e) => {
    const k: Department | "unassigned" = userDept.get(e.user_id) ?? "unassigned";
    ensure(k).hours += Number(e.regular_hours) + Number(e.overtime_hours);
  });

  const ORDER: (Department | "unassigned")[] = [
    "architecture", "structure", "mep", "procurement", "construction", "unassigned",
  ];

  return ORDER.filter((k) => deptAgg.has(k)).map((k) => {
    const a = deptAgg.get(k)!;
    return {
      department: k,
      members: a.members.size,
      total: a.total,
      open: a.open,
      assigned: a.assigned,
      in_progress: a.in_progress,
      pending_approval: a.pending_approval,
      approved: a.approved,
      rejected: a.rejected,
      completed: a.completed,
      closed: a.closed,
      overdue: a.overdue,
      hours: a.hours,
    };
  });
}

// ─── Member Performance ─────────────────────────────────────

export async function fetchMemberPerformance(
  projectId: string,
  dateFrom?: string,
  dateTo?: string,
): Promise<MemberKpiRow[]> {
  const today = new Date().toISOString().slice(0, 10);

  const [tRes, tsRes, prRes, dmRes] = await Promise.all([
    (supabase as any)
      .from("tasks")
      .select("id, status, planned_end, actual_end")
      .eq("project_id", projectId),
    (() => {
      let q = (supabase as any)
        .from("timesheet_entries")
        .select("user_id, regular_hours, overtime_hours, status")
        .eq("project_id", projectId);
      if (dateFrom) q = q.gte("work_date", dateFrom);
      if (dateTo) q = q.lte("work_date", dateTo);
      return q;
    })(),
    (supabase as any).from("profiles").select("id, full_name, job_title"),
    (supabase as any).from("department_members").select("user_id, department"),
  ]);

  const tasks = (tRes.data ?? []) as Array<{
    id: string; status: string; planned_end: string | null; actual_end: string | null;
  }>;
  const ts = (tsRes.data ?? []) as Array<{
    user_id: string; regular_hours: number; overtime_hours: number; status: string;
  }>;
  const profiles = (prRes.data ?? []) as Array<{
    id: string; full_name: string; job_title: string | null;
  }>;
  const deptMembers = (dmRes.data ?? []) as Array<{ user_id: string; department: Department }>;

  const taskMap = new Map(tasks.map((t) => [t.id, t]));
  const profMap = new Map(profiles.map((p) => [p.id, p]));

  const taskIds = tasks.map((t) => t.id);
  const { data: assignsData } = taskIds.length
    ? await (supabase as any)
        .from("task_assignments")
        .select("user_id, task_id")
        .in("task_id", taskIds)
        .is("unassigned_at", null)
    : { data: [] };
  const assigns = (assignsData ?? []) as Array<{ user_id: string; task_id: string }>;

  type Acc = {
    total: number; completed: number; in_progress: number; overdue: number; onTime: number;
    open: number; assigned: number; pending_approval: number; approved: number;
    rejected: number; closed: number; regH: number; otH: number; appH: number;
  };
  const agg = new Map<string, Acc>();
  const ensure = (uid: string): Acc => {
    let a = agg.get(uid);
    if (!a) {
      a = {
        total: 0, completed: 0, in_progress: 0, overdue: 0, onTime: 0,
        open: 0, assigned: 0, pending_approval: 0, approved: 0, rejected: 0, closed: 0,
        regH: 0, otH: 0, appH: 0,
      };
      agg.set(uid, a);
    }
    return a;
  };

  assigns.forEach((a) => {
    const t = taskMap.get(a.task_id);
    if (!t) return;
    const acc = ensure(a.user_id);
    acc.total += 1;
    const isClosed = ["completed", "closed", "approved"].includes(t.status);
    if (t.planned_end && t.planned_end < today && !isClosed) acc.overdue += 1;
    switch (t.status) {
      case "open": acc.open += 1; break;
      case "assigned": acc.assigned += 1; break;
      case "in_progress": acc.in_progress += 1; break;
      case "pending_approval": acc.pending_approval += 1; break;
      case "approved": acc.approved += 1; break;
      case "rejected": acc.rejected += 1; break;
      case "completed": acc.completed += 1; break;
      case "closed": acc.closed += 1; break;
    }
    if (
      (t.status === "completed" || t.status === "closed") &&
      t.planned_end && t.actual_end &&
      new Date(t.actual_end) <= new Date(t.planned_end)
    ) {
      acc.onTime += 1;
    }
  });

  ts.forEach((e) => {
    const acc = ensure(e.user_id);
    acc.regH += Number(e.regular_hours);
    acc.otH += Number(e.overtime_hours);
    if (e.status === "approved") acc.appH += Number(e.regular_hours) + Number(e.overtime_hours);
  });

  const userDepts = new Map<string, Department[]>();
  deptMembers.forEach((dm) => {
    let arr = userDepts.get(dm.user_id);
    if (!arr) { arr = []; userDepts.set(dm.user_id, arr); }
    if (!arr.includes(dm.department)) arr.push(dm.department);
  });

  const rows: MemberKpiRow[] = [];
  Array.from(agg.entries()).forEach(([uid, a]) => {
    const p = profMap.get(uid);
    const completedDone = a.completed + a.closed;
    const base = {
      user_id: uid,
      full_name: p?.full_name ?? "Unknown",
      job_title: p?.job_title ?? null,
      total_tasks: a.total,
      open: a.open,
      assigned: a.assigned,
      in_progress: a.in_progress,
      pending_approval: a.pending_approval,
      approved: a.approved,
      rejected: a.rejected,
      completed: completedDone,
      closed: a.closed,
      overdue: a.overdue,
      on_time_rate: completedDone > 0 ? a.onTime / completedDone : 0,
      completion_rate: a.total > 0 ? completedDone / a.total : 0,
      regular_hours: a.regH,
      overtime_hours: a.otH,
      approved_hours: a.appH,
    };
    const depts = userDepts.get(uid);
    if (depts && depts.length > 0) {
      depts.forEach((d) => rows.push({ ...base, department: d }));
    } else {
      rows.push({ ...base, department: null });
    }
  });

  return rows;
}

// ─── Project KPI Summary ────────────────────────────────────

export async function fetchProjectKpiSummary(projectId: string): Promise<ProjectKpiSummary> {
  const today = new Date().toISOString().slice(0, 10);

  const [tRes, costRes, poRes, prRes] = await Promise.all([
    (supabase as any)
      .from("tasks")
      .select("id, status, priority, planned_end, actual_end, progress_pct, category")
      .eq("project_id", projectId),
    (supabase as any)
      .from("project_cost_summaries")
      .select("bac, ac_total, cpi"),
    (supabase as any)
      .from("purchase_orders")
      .select("status, created_at, po_date, total_amount")
      .eq("project_id", projectId),
    (supabase as any)
      .from("purchase_requisitions")
      .select("status, created_at, required_date")
      .eq("project_id", projectId),
  ]);

  const tasks = (tRes.data ?? []) as Array<{
    id: string; status: string; priority: string; planned_end: string | null;
    actual_end: string | null; progress_pct: number; category: string | null;
  }>;
  const costRows = (costRes.data ?? []) as Array<{
    bac: number | null; ac_total: number | null; cpi: number | null;
  }>;
  const pos = (poRes.data ?? []) as Array<{
    status: string; created_at: string; po_date: string; total_amount: number;
  }>;
  const prs = (prRes.data ?? []) as Array<{
    status: string; created_at: string; required_date: string | null;
  }>;

  // Overall progress: average of all tasks
  const overallProgressPct = tasks.length > 0
    ? Math.round(tasks.reduce((s, t) => s + t.progress_pct, 0) / tasks.length)
    : 0;

  // Planned vs actual: tasks starting late or ending late
  const plannedVsActualPct = (() => {
    const delayed = tasks.filter(
      (t) => t.planned_end && t.planned_end < today && t.status !== "completed" && t.status !== "closed",
    ).length;
    return tasks.length > 0 ? Math.round((delayed / tasks.length) * 100) : 0;
  })();

  // Delay days: average overdue days for overdue tasks
  const overdueTasks = tasks.filter(
    (t) => t.planned_end && t.planned_end < today &&
      !["completed", "closed", "approved"].includes(t.status),
  );
  const delayDays = overdueTasks.length > 0
    ? Math.round(
        overdueTasks.reduce((s, t) => {
          const diff = (new Date(today).getTime() - new Date(t.planned_end!).getTime()) / (1000 * 60 * 60 * 24);
          return s + Math.max(0, diff);
        }, 0) / overdueTasks.length,
      )
    : 0;

  // Critical tasks: overdue high/critical priority
  const criticalTasks = overdueTasks.filter(
    (t) => t.priority === "high" || t.priority === "critical",
  ).length;

  // Open issues
  const openIssues = tasks.filter(
    (t) => t.status === "open" || t.status === "assigned",
  ).length;

  // Pending approvals
  const pendingApprovals = tasks.filter(
    (t) => t.status === "pending_approval",
  ).length;

  // Cost variance from project_cost_summaries view
  const totalBac = costRows.reduce((s, r) => s + (r.bac ?? 0), 0);
  const totalAc = costRows.reduce((s, r) => s + (r.ac_total ?? 0), 0);
  const costVariance = totalBac - totalAc;
  const costVariancePct = totalBac > 0 ? Math.round((costVariance / totalBac) * 100) : 0;

  // Procurement delay: PO/PRs that are still pending beyond expected dates
  const pendingPRs = prs.filter((p) => p.status === "submitted" || p.status === "draft");
  const overduePRs = pendingPRs.filter(
    (p) => p.required_date && p.required_date < today,
  );
  const procurementDelayDays = overduePRs.length > 0
    ? Math.round(
        overduePRs.reduce((s, p) => {
          const diff = (new Date(today).getTime() - new Date(p.required_date!).getTime()) / (1000 * 60 * 60 * 24);
          return s + Math.max(0, diff);
        }, 0) / overduePRs.length,
      )
    : 0;

  // RFI aging: tasks with RFA categories (test_report_rfa, material_rfa, method_statement_rfa)
  const rfiTasks = tasks.filter(
    (t) => t.category === "test_report_rfa" || t.category === "material_rfa" || t.category === "method_statement_rfa" || t.category === "as_built_drawing_rfa",
  );
  const openRfiTasks = rfiTasks.filter(
    (t) => !["completed", "closed", "approved"].includes(t.status),
  );
  const rfiAgingDays = openRfiTasks.length > 0
    ? Math.round(
        openRfiTasks.reduce((s, t) => {
          if (t.planned_end) {
            const diff = (new Date(today).getTime() - new Date(t.planned_end).getTime()) / (1000 * 60 * 60 * 24);
            return s + Math.max(0, diff);
          }
          return s;
        }, 0) / openRfiTasks.length,
      )
    : 0;

  // NCR aging: tasks with ncr category
  const ncrTasks = tasks.filter((t) => t.category === "ncr");
  const openNcrTasks = ncrTasks.filter(
    (t) => !["completed", "closed", "approved"].includes(t.status),
  );
  const ncrAgingDays = openNcrTasks.length > 0
    ? Math.round(
        openNcrTasks.reduce((s, t) => {
          if (t.planned_end) {
            const diff = (new Date(today).getTime() - new Date(t.planned_end).getTime()) / (1000 * 60 * 60 * 24);
            return s + Math.max(0, diff);
          }
          return s;
        }, 0) / openNcrTasks.length,
      )
    : 0;

  return {
    overallProgressPct,
    plannedVsActualPct,
    delayDays,
    criticalTasks,
    openIssues,
    pendingApprovals,
    costVariance,
    costVariancePct,
    procurementDelayDays,
    rfiAgingDays,
    ncrAgingDays,
  };
}

// ─── Financial KPI Summary ──────────────────────────────────

export async function fetchFinancialKpiSummary(projectId: string): Promise<FinancialKpiSummary> {
  const currency = "USD";

  const [budgetRes, invRes, claimRes, poRes] = await Promise.all([
    (supabase as any)
      .from("project_budgets")
      .select("total_budget, committed_amount, spent_amount")
      .eq("project_id", projectId),
    (supabase as any)
      .from("supplier_invoices")
      .select("status, total_amount, paid_amount, payment_status")
      .eq("project_id", projectId),
    (supabase as any)
      .from("progress_claims")
      .select("total_amount_claimed, total_amount_certified, status")
      .eq("project_id", projectId),
    (supabase as any)
      .from("purchase_orders")
      .select("status, total_amount")
      .eq("project_id", projectId),
  ]);

  const budgets = (budgetRes.data ?? []) as Array<{
    total_budget: number | null; committed_amount: number | null; spent_amount: number | null;
  }>;
  const invoices = (invRes.data ?? []) as Array<{
    status: string; total_amount: number; paid_amount: number; payment_status: string;
  }>;
  const claims = (claimRes.data ?? []) as Array<{
    total_amount_claimed: number | null; total_amount_certified: number | null; status: string | null;
  }>;
  const pos = (poRes.data ?? []) as Array<{
    status: string; total_amount: number;
  }>;

  const totalBudget = budgets.reduce((s, b) => s + (b.total_budget ?? 0), 0);
  const totalCommitted = budgets.reduce((s, b) => s + (b.committed_amount ?? 0), 0);
  const totalActual = budgets.reduce((s, b) => s + (b.spent_amount ?? 0), 0);

  const totalPaid = invoices
    .filter((i) => i.payment_status === "paid" || i.payment_status === "partially_paid")
    .reduce((s, i) => s + (i.paid_amount ?? 0), 0);

  const pendingInvoiceAmount = invoices
    .filter((i) => i.status !== "paid" && i.status !== "cancelled")
    .reduce((s, i) => s + (i.total_amount - (i.paid_amount ?? 0)), 0);

  // Variation value from certified claims
  const certifiedClaims = claims.filter(
    (c) => c.status === "certified" || c.status === "paid",
  );
  const variationValue = certifiedClaims.reduce(
    (s, c) => s + (c.total_amount_certified ?? c.total_amount_claimed ?? 0), 0,
  );

  // Forecast final cost: total actual + total committed (POs) - already in actual
  const poCommitted = pos
    .filter((p) => p.status !== "cancelled")
    .reduce((s, p) => s + p.total_amount, 0);
  const forecastFinalCost = Math.max(totalActual, poCommitted) + Math.max(0, pendingInvoiceAmount);

  const budgetUtilizationPct = totalBudget > 0
    ? Math.round((totalActual / totalBudget) * 100)
    : 0;

  return {
    totalBudget,
    totalActual,
    totalCommitted,
    totalPaid,
    pendingInvoiceAmount,
    variationValue,
    forecastFinalCost,
    budgetUtilizationPct,
    currency,
  };
}

// ─── Task Progress Summary (S-Curve data) ────────────────────

export async function fetchTaskProgressSummary(projectId: string): Promise<{
  overallProgress: number;
  activeTasks: number;
  completedTasks: number;
  criticalAlerts: number;
}> {
  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await (supabase as any)
    .from("tasks")
    .select("id, status, progress_pct, planned_end, estimated_hours")
    .eq("project_id", projectId);

  if (error) throw error;
  const tasks = (data ?? []) as Array<{
    id: string; status: string; progress_pct: number;
    planned_end: string | null; estimated_hours: number | null;
  }>;

  const total = tasks.length;
  if (total === 0) {
    return { overallProgress: 0, activeTasks: 0, completedTasks: 0, criticalAlerts: 0 };
  }

  const weightedSum = tasks.reduce(
    (s, t) => s + t.progress_pct * (t.estimated_hours ?? 1), 0,
  );
  const totalWeight = tasks.reduce((s, t) => s + (t.estimated_hours ?? 1), 0);
  const overallProgress = Math.round(weightedSum / totalWeight);

  const activeTasks = tasks.filter((t) => t.progress_pct > 0 && t.progress_pct < 100).length;
  const completedTasks = tasks.filter((t) => t.progress_pct >= 100).length;
  const criticalAlerts = tasks.filter(
    (t) => t.planned_end && t.planned_end < today && t.progress_pct < 100,
  ).length;

  return { overallProgress, activeTasks, completedTasks, criticalAlerts };
}

// ─── S-Curve Data ───────────────────────────────────────────

export async function fetchSCurveData(projectId: string, months = 6): Promise<TaskProgressPoint[]> {
  const { data, error } = await (supabase as any)
    .from("tasks")
    .select("id, planned_start, planned_end, actual_start, actual_end, estimated_hours")
    .eq("project_id", projectId)
    .not("planned_start", "is", null);

  if (error) throw error;
  const tasks = (data ?? []) as Array<{
    id: string; planned_start: string; planned_end: string | null;
    actual_start: string | null; actual_end: string | null; estimated_hours: number | null;
  }>;

  const points: TaskProgressPoint[] = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    const period = d.toISOString().slice(0, 7);

    const planned = tasks
      .filter((t) => t.planned_start <= monthEnd.toISOString())
      .reduce((s, t) => s + (t.estimated_hours ?? 1), 0);

    const actual = tasks
      .filter(
        (t) =>
          t.actual_start &&
          new Date(t.actual_start) <= monthEnd &&
          t.actual_end &&
          new Date(t.actual_end) >= d,
      )
      .reduce((s, t) => s + (t.estimated_hours ?? 1), 0);

    points.push({ period, planned, actual });
  }

  return points;
}

// ─── Building Progress ──────────────────────────────────────

export async function fetchBuildingProgress(projectId: string): Promise<BuildingProgress[]> {
  const { data, error } = await (supabase as any)
    .from("wbs_nodes")
    .select("id, name, node_type, progress_pct")
    .eq("project_id", projectId)
    .eq("node_type", "building")
    .order("name", { ascending: true });

  if (error) throw error;
  const buildings = (data ?? []) as Array<{
    id: string; name: string; node_type: string; progress_pct: number;
  }>;

  const buildingIds = buildings.map((b) => b.id);
  if (buildingIds.length === 0) return [];

  const { data: taskData, error: taskError } = await (supabase as any)
    .from("tasks")
    .select("wbs_node_id, id")
    .eq("project_id", projectId)
    .in("wbs_node_id", buildingIds);

  if (taskError) throw taskError;
  const taskRows = (taskData ?? []) as Array<{ wbs_node_id: string; id: string }>;
  const taskCountByBuilding = new Map<string, number>();
  taskRows.forEach((r) => {
    taskCountByBuilding.set(r.wbs_node_id, (taskCountByBuilding.get(r.wbs_node_id) ?? 0) + 1);
  });

  return buildings.map((b) => ({
    buildingName: b.name,
    progressPct: b.progress_pct,
    taskCount: taskCountByBuilding.get(b.id) ?? 0,
  }));
}

// ─── WBS Node Performance ───────────────────────────────────

export async function fetchWbsNodePerformance(
  projectId: string,
  limit = 10,
): Promise<WbsNodePerformance[]> {
  const { data, error } = await (supabase as any)
    .from("wbs_nodes")
    .select("id, name, node_type, path_text, progress_pct")
    .eq("project_id", projectId)
    .in("node_type", ["level", "zone"])
    .order("progress_pct", { ascending: false })
    .limit(limit);

  if (error) throw error;
  const nodes = (data ?? []) as Array<{
    id: string; name: string; node_type: string;
    path_text: string | null; progress_pct: number;
  }>;

  const nodeIds = nodes.map((n) => n.id);
  if (nodeIds.length === 0) return [];

  const { data: taskData } = await (supabase as any)
    .from("tasks")
    .select("wbs_node_id, id")
    .eq("project_id", projectId)
    .in("wbs_node_id", nodeIds);

  const taskRows = (taskData ?? []) as Array<{ wbs_node_id: string; id: string }>;
  const taskCountByNode = new Map<string, number>();
  taskRows.forEach((r) => {
    taskCountByNode.set(r.wbs_node_id, (taskCountByNode.get(r.wbs_node_id) ?? 0) + 1);
  });

  return nodes.map((n) => ({
    nodeId: n.id,
    nodeName: n.name,
    nodeType: n.node_type,
    path: n.path_text ?? "",
    progressPct: n.progress_pct,
    taskCount: taskCountByNode.get(n.id) ?? 0,
  }));
}
