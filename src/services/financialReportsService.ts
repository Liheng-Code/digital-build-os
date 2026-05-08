import { supabase } from "@/integrations/supabase/client";

// ─── Budget vs Actual by Category ─────────────────────────

export interface BudgetVsActualRow {
  budgetId: string;
  budgetCode: string;
  budgetName: string;
  totalBudget: number;
  committed: number;
  spent: number;
  variance: number;
  variancePct: number;
  lineItemCount: number;
}

export async function fetchBudgetVsActualByCategory(projectId: string): Promise<BudgetVsActualRow[]> {
  const { data, error } = await (supabase as any)
    .from("project_budgets")
    .select("id, budget_code, budget_name, total_budget, committed_amount, spent_amount")
    .eq("project_id", projectId)
    .order("budget_code", { ascending: true });

  if (error) throw error;
  const budgets = (data ?? []) as Array<{
    id: string; budget_code: string; budget_name: string;
    total_budget: number | null; committed_amount: number | null; spent_amount: number | null;
  }>;

  const budgetIds = budgets.map((b) => b.id);
  const countMap = new Map<string, number>();
  if (budgetIds.length > 0) {
    const { data: items } = await (supabase as any)
      .from("budget_line_items")
      .select("budget_id, id")
      .in("budget_id", budgetIds);
    const rows = (items ?? []) as Array<{ budget_id: string; id: string }>;
    rows.forEach((r) => countMap.set(r.budget_id, (countMap.get(r.budget_id) ?? 0) + 1));
  }

  return budgets.map((b) => {
    const budget = b.total_budget ?? 0;
    const committed = b.committed_amount ?? 0;
    const spent = b.spent_amount ?? 0;
    const variance = budget - spent;
    const variancePct = budget > 0 ? Math.round((variance / budget) * 100) : 0;
    return {
      budgetId: b.id,
      budgetCode: b.budget_code,
      budgetName: b.budget_name,
      totalBudget: budget,
      committed,
      spent,
      variance,
      variancePct,
      lineItemCount: countMap.get(b.id) ?? 0,
    };
  });
}

// ─── Cost Variance by WBS ─────────────────────────────────

export interface CostVarianceWbsRow {
  wbsNodeId: string;
  wbsNodeName: string;
  bac: number;
  ev: number;
  ac: number;
  cpi: number;
  variance: number;
  variancePct: number;
}

export async function fetchCostVarianceByWbs(projectId: string): Promise<CostVarianceWbsRow[]> {
  const { data, error } = await (supabase as any)
    .from("project_cost_summaries")
    .select("wbs_node_id, bac, ev, ac_total, cpi, task_title")
    .eq("project_id", projectId)
    .order("ac_total", { ascending: false });

  if (error) throw error;
  const rows = (data ?? []) as Array<{
    wbs_node_id: string | null; bac: number | null; ev: number | null;
    ac_total: number | null; cpi: number | null; task_title: string | null;
  }>;

  const wbsNodeIds = rows.map((r) => r.wbs_node_id).filter(Boolean) as string[];
  const nameMap = new Map<string, string>();
  if (wbsNodeIds.length > 0) {
    const { data: nodes } = await (supabase as any)
      .from("wbs_nodes")
      .select("id, name")
      .in("id", wbsNodeIds);
    (nodes ?? []).forEach((n: { id: string; name: string }) => nameMap.set(n.id, n.name));
  }

  return rows.map((r) => {
    const bac = r.bac ?? 0;
    const ev = r.ev ?? 0;
    const ac = r.ac_total ?? 0;
    const cpi = r.cpi ?? (bac > 0 ? ev / bac : 1);
    const variance = ev - ac;
    const variancePct = ac > 0 ? Math.round((variance / ac) * 100) : 0;
    return {
      wbsNodeId: r.wbs_node_id ?? "",
      wbsNodeName: (r.wbs_node_id ? nameMap.get(r.wbs_node_id) : null) ?? r.task_title ?? "Unnamed",
      bac,
      ev,
      ac,
      cpi,
      variance,
      variancePct,
    };
  });
}

// ─── Invoice Aging (AP) ──────────────────────────────────

export interface InvoiceAgingRow {
  invoiceId: string;
  invoiceNumber: string;
  supplierName: string;
  amount: number;
  paidAmount: number;
  outstanding: number;
  invoiceDate: string;
  dueDate: string | null;
  agingDays: number;
  bucket: "0-30" | "31-60" | "61-90" | "90+";
  status: string;
}

export async function fetchInvoiceAging(projectId: string): Promise<InvoiceAgingRow[]> {
  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await (supabase as any)
    .from("supplier_invoices")
    .select("id, invoice_number, total_amount, paid_amount, invoice_date, due_date, status, payment_status")
    .eq("project_id", projectId)
    .order("invoice_date", { ascending: false });

  if (error) throw error;
  const invoices = (data ?? []) as Array<{
    id: string; invoice_number: string; total_amount: number; paid_amount: number;
    invoice_date: string; due_date: string | null; status: string; payment_status: string;
  }>;

  return invoices
    .filter((inv) => inv.payment_status !== "paid")
    .map((inv) => {
      const outstanding = inv.total_amount - (inv.paid_amount ?? 0);
      const dueDate = inv.due_date ?? inv.invoice_date;
      const agingDays = Math.max(0, Math.round(
        (new Date(today).getTime() - new Date(dueDate).getTime()) / (1000 * 60 * 60 * 24),
      ));
      let bucket: InvoiceAgingRow["bucket"] = "0-30";
      if (agingDays > 90) bucket = "90+";
      else if (agingDays > 60) bucket = "61-90";
      else if (agingDays > 30) bucket = "31-60";

      return {
        invoiceId: inv.id,
        invoiceNumber: inv.invoice_number,
        supplierName: "",
        amount: inv.total_amount,
        paidAmount: inv.paid_amount ?? 0,
        outstanding,
        invoiceDate: inv.invoice_date,
        dueDate,
        agingDays,
        bucket,
        status: inv.status,
      };
    });
}

// ─── Variation Order Summary ─────────────────────────────

export interface VariationSummary {
  totalApproved: number;
  totalPending: number;
  totalRejected: number;
  approvedAmount: number;
  pendingAmount: number;
  rejectedAmount: number;
  countByStatus: Record<string, number>;
}

export async function fetchVariationSummary(projectId: string): Promise<VariationSummary> {
  const { data, error } = await (supabase as any)
    .from("variation_orders")
    .select("status, amount_change")
    .eq("project_id", projectId);

  if (error) throw error;
  const vos = (data ?? []) as Array<{ status: string; amount_change: number }>;

  const countByStatus: Record<string, number> = {};
  let totalApproved = 0, totalPending = 0, totalRejected = 0;
  let approvedAmount = 0, pendingAmount = 0, rejectedAmount = 0;

  vos.forEach((vo) => {
    countByStatus[vo.status] = (countByStatus[vo.status] ?? 0) + 1;
    if (vo.status === "approved") {
      totalApproved++;
      approvedAmount += Number(vo.amount_change);
    } else if (vo.status === "submitted" || vo.status === "draft") {
      totalPending++;
      pendingAmount += Number(vo.amount_change);
    } else if (vo.status === "rejected" || vo.status === "cancelled") {
      totalRejected++;
      rejectedAmount += Number(vo.amount_change);
    }
  });

  return { totalApproved, totalPending, totalRejected, approvedAmount, pendingAmount, rejectedAmount, countByStatus };
}

// ─── Cash Flow Summary ───────────────────────────────────

export interface CashFlowSummaryRow {
  period: string;
  forecastInflow: number;
  forecastOutflow: number;
  actualInflow: number;
  actualOutflow: number;
}

export async function fetchCashFlowSummary(projectId: string, months = 6): Promise<CashFlowSummaryRow[]> {
  const { data, error } = await (supabase as any)
    .from("cash_flow_projections")
    .select("period_date, category, forecast_amount, actual_amount, is_inflow, status")
    .eq("project_id", projectId)
    .gte("period_date", new Date(Date.now() - months * 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));

  if (error) throw error;
  const items = (data ?? []) as Array<{
    period_date: string; category: string; forecast_amount: number;
    actual_amount: number; is_inflow: boolean; status: string;
  }>;

  const grouped = new Map<string, CashFlowSummaryRow>();
  items.forEach((item) => {
    const period = item.period_date.slice(0, 7);
    let row = grouped.get(period);
    if (!row) {
      row = { period, forecastInflow: 0, forecastOutflow: 0, actualInflow: 0, actualOutflow: 0 };
      grouped.set(period, row);
    }
    if (item.is_inflow) {
      row.forecastInflow += Number(item.forecast_amount);
      row.actualInflow += Number(item.actual_amount);
    } else {
      row.forecastOutflow += Number(item.forecast_amount);
      row.actualOutflow += Number(item.actual_amount);
    }
  });

  return Array.from(grouped.values()).sort((a, b) => a.period.localeCompare(b.period));
}

// ─── Financial Health Score ──────────────────────────────

export interface FinancialHealthScore {
  budgetUtilizationScore: number;
  costEfficiencyScore: number;
  liquidityScore: number;
  overallScore: number;
}

export async function fetchFinancialHealthScore(projectId: string): Promise<FinancialHealthScore> {
  const [budgetRes, costRes, invRes] = await Promise.all([
    (supabase as any)
      .from("project_budgets")
      .select("total_budget, spent_amount")
      .eq("project_id", projectId),
    (supabase as any)
      .from("project_cost_summaries")
      .select("bac, ev, ac_total")
      .eq("project_id", projectId),
    (supabase as any)
      .from("supplier_invoices")
      .select("total_amount, paid_amount, payment_status")
      .eq("project_id", projectId),
  ]);

  const budgets = (budgetRes.data ?? []) as Array<{ total_budget: number | null; spent_amount: number | null }>;
  const costs = (costRes.data ?? []) as Array<{ bac: number | null; ev: number | null; ac_total: number | null }>;
  const invoices = (invRes.data ?? []) as Array<{ total_amount: number; paid_amount: number; payment_status: string }>;

  const totalBudget = budgets.reduce((s, b) => s + (b.total_budget ?? 0), 0);
  const totalSpent = budgets.reduce((s, b) => s + (b.spent_amount ?? 0), 0);
  const budgetUtilPct = totalBudget > 0 ? totalSpent / totalBudget : 0;
  const budgetUtilizationScore = Math.round(Math.max(0, 100 - budgetUtilPct * 100));

  const totalEv = costs.reduce((s, c) => s + (c.ev ?? 0), 0);
  const totalAc = costs.reduce((s, c) => s + (c.ac_total ?? 0), 0);
  const avgCpi = totalAc > 0 ? totalEv / totalAc : 1;
  const costEfficiencyScore = Math.round(Math.min(100, avgCpi * 100));

  const totalInvoiceAmount = invoices.reduce((s, i) => s + i.total_amount, 0);
  const totalPaid = invoices
    .filter((i) => i.payment_status === "paid")
    .reduce((s, i) => s + (i.paid_amount ?? 0), 0);
  const unpaidRatio = totalInvoiceAmount > 0 ? (totalInvoiceAmount - totalPaid) / totalInvoiceAmount : 0;
  const liquidityScore = Math.round(Math.max(0, 100 - unpaidRatio * 100));

  const overallScore = Math.round((budgetUtilizationScore + costEfficiencyScore + liquidityScore) / 3);

  return { budgetUtilizationScore, costEfficiencyScore, liquidityScore, overallScore };
}
