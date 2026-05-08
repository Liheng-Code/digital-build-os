/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProjects } from "@/contexts/ProjectContext";
import { DashboardPage, DashboardFilterBar, DashboardSection } from "@/components/reports/DashboardLayout";
import { KpiGrid } from "@/components/reports/KpiGrid";
import { KpiCard } from "@/components/reports/KpiCard";
import { TrendChart } from "@/components/reports/TrendChart";
import { ProgressGauge } from "@/components/reports/ProgressGauge";
import { ExportMenu } from "@/components/reports/ExportMenu";
import { fetchFinancialKpiSummary } from "@/services/reportingService";
import {
  fetchBudgetVsActualByCategory,
  fetchCostVarianceByWbs,
  fetchInvoiceAging,
  fetchVariationSummary,
  fetchCashFlowSummary,
  fetchFinancialHealthScore,
} from "@/services/financialReportsService";
import type { KpiTimeRange } from "@/lib/reportingMeta";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Building2,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  BarChart3,
  PieChart,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function FinancialReports() {
  const { projects, activeProject, setActiveProjectId } = useProjects();

  const [loading, setLoading] = React.useState(true);
  const [timeRange, setTimeRange] = React.useState<KpiTimeRange>("30d");
  const [dateFrom, setDateFrom] = React.useState<string>("");
  const [dateTo, setDateTo] = React.useState<string>("");

  const [data, setData] = React.useState<{
    kpi: Awaited<ReturnType<typeof fetchFinancialKpiSummary>> | null;
    health: Awaited<ReturnType<typeof fetchFinancialHealthScore>> | null;
    budgets: Awaited<ReturnType<typeof fetchBudgetVsActualByCategory>>;
    costVariance: Awaited<ReturnType<typeof fetchCostVarianceByWbs>>;
    aging: Awaited<ReturnType<typeof fetchInvoiceAging>>;
    variation: Awaited<ReturnType<typeof fetchVariationSummary>> | null;
    cashFlow: Awaited<ReturnType<typeof fetchCashFlowSummary>>;
  }>({
    kpi: null,
    health: null,
    budgets: [],
    costVariance: [],
    aging: [],
    variation: null,
    cashFlow: [],
  });

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!activeProject?.id) {
        setData({ kpi: null, health: null, budgets: [], costVariance: [], aging: [], variation: null, cashFlow: [] });
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const [kpi, health, budgets, costVariance, aging, variation, cashFlow] = await Promise.all([
          fetchFinancialKpiSummary(activeProject.id),
          fetchFinancialHealthScore(activeProject.id),
          fetchBudgetVsActualByCategory(activeProject.id),
          fetchCostVarianceByWbs(activeProject.id),
          fetchInvoiceAging(activeProject.id),
          fetchVariationSummary(activeProject.id),
          fetchCashFlowSummary(activeProject.id),
        ]);
        if (!cancelled) setData({ kpi, health, budgets, costVariance, aging, variation, cashFlow });
      } catch (err) {
        console.error("Failed to load financial reports", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [activeProject?.id]);

  const projectOptions = projects.map((p) => ({ value: p.id, label: p.name }));

  // Compute aging bucket aggregates
  const agingBuckets = React.useMemo(() => {
    const buckets: Record<string, { count: number; total: number }> = {
      "0-30": { count: 0, total: 0 },
      "31-60": { count: 0, total: 0 },
      "61-90": { count: 0, total: 0 },
      "90+": { count: 0, total: 0 },
    };
    data.aging.forEach((inv) => {
      buckets[inv.bucket].count += 1;
      buckets[inv.bucket].total += inv.outstanding;
    });
    return buckets;
  }, [data.aging]);

  // Budget vs Actual chart data
  const budgetChartData = React.useMemo(() =>
    data.budgets.map((b) => ({
      name: b.budgetCode,
      budget: b.totalBudget,
      actual: b.spent,
    })),
  [data.budgets]);

  // Cost Variance chart data
  const costVarChartData = React.useMemo(() =>
    data.costVariance.slice(0, 10).map((c) => ({
      name: c.wbsNodeName.length > 20 ? c.wbsNodeName.slice(0, 20) + "..." : c.wbsNodeName,
      BAC: c.bac,
      EV: c.ev,
      AC: c.ac,
    })),
  [data.costVariance]);

  const formatCurrency = (v: number, cur = "USD") =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(v);

  return (
    <DashboardPage
      title="Financial Reports"
      subtitle="Budget, cost, cash flow, and variation analysis"
      filterBar={
        <DashboardFilterBar
          projectOptions={projectOptions}
          projectValue={activeProject?.id ?? ""}
          onProjectChange={(v) => setActiveProjectId(v)}
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
          dateFrom={dateFrom}
          dateTo={dateTo}
          onDateFromChange={setDateFrom}
          onDateToChange={setDateTo}
          extraActions={
            <ExportMenu
              columns={[
                { key: "kpi", label: "KPI" },
                { key: "value", label: "Value" },
              ]}
              data={
                data.kpi
                  ? [
                      { kpi: "Total Budget", value: data.kpi.totalBudget },
                      { kpi: "Actual Cost", value: data.kpi.totalActual },
                      { kpi: "Committed", value: data.kpi.totalCommitted },
                      { kpi: "Paid", value: data.kpi.totalPaid },
                      { kpi: "Pending Invoices", value: data.kpi.pendingInvoiceAmount },
                      { kpi: "Variation Value", value: data.kpi.variationValue },
                      { kpi: "Forecast Final", value: data.kpi.forecastFinalCost },
                      { kpi: "Utilization (%)", value: data.kpi.budgetUtilizationPct },
                    ]
                  : []
              }
              filename="financial-reports"
              pageTitle="Financial Reports"
            />
          }
        />
      }
    >
      {/* Financial KPI Cards */}
      <DashboardSection loading={loading && !data.kpi}>
        {data.kpi && (
          <KpiGrid columns={4}>
            <KpiCard
              icon={DollarSign}
              label="Total Budget"
              value={formatCurrency(data.kpi.totalBudget, data.kpi.currency)}
            />
            <KpiCard
              icon={TrendingUp}
              label="Actual Spent"
              value={formatCurrency(data.kpi.totalActual, data.kpi.currency)}
              subtitle={`${data.kpi.budgetUtilizationPct}% utilized`}
              tone={data.kpi.budgetUtilizationPct > 90 ? "destructive" : data.kpi.budgetUtilizationPct > 75 ? "warning" : "default"}
            />
            <KpiCard
              icon={Building2}
              label="Committed"
              value={formatCurrency(data.kpi.totalCommitted, data.kpi.currency)}
            />
            <KpiCard
              icon={DollarSign}
              label="Paid"
              value={formatCurrency(data.kpi.totalPaid, data.kpi.currency)}
            />
            <KpiCard
              icon={FileText}
              label="Pending Invoices"
              value={formatCurrency(data.kpi.pendingInvoiceAmount, data.kpi.currency)}
              tone={data.kpi.pendingInvoiceAmount > 0 ? "warning" : "default"}
            />
            <KpiCard
              icon={BarChart3}
              label="Variation Value"
              value={formatCurrency(data.kpi.variationValue, data.kpi.currency)}
            />
            <KpiCard
              icon={TrendingDown}
              label="Forecast Final"
              value={formatCurrency(data.kpi.forecastFinalCost, data.kpi.currency)}
              tone={data.kpi.forecastFinalCost > data.kpi.totalBudget ? "destructive" : "default"}
            />
            <KpiCard
              icon={PieChart}
              label="Budget Utilization"
              value={`${data.kpi.budgetUtilizationPct}%`}
              tone={data.kpi.budgetUtilizationPct > 90 ? "destructive" : data.kpi.budgetUtilizationPct > 75 ? "warning" : "success"}
            />
          </KpiGrid>
        )}
      </DashboardSection>

      {/* Financial Health Score + Budget Gauge */}
      <div className="grid gap-6 lg:grid-cols-3">
        <DashboardSection title="Financial Health" loading={loading && !data.health}>
          {data.health && (
            <div className="flex flex-col items-center gap-4">
              <ProgressGauge
                value={data.health.overallScore}
                label="Overall Score"
                size="lg"
                tone={data.health.overallScore >= 70 ? "success" : data.health.overallScore >= 40 ? "warning" : "destructive"}
              />
              <div className="grid grid-cols-3 gap-4 w-full">
                <div className="text-center">
                  <p className="text-lg font-bold">{data.health.budgetUtilizationScore}</p>
                  <p className="text-[10px] text-muted-foreground">Budget</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold">{data.health.costEfficiencyScore}</p>
                  <p className="text-[10px] text-muted-foreground">Efficiency</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold">{data.health.liquidityScore}</p>
                  <p className="text-[10px] text-muted-foreground">Liquidity</p>
                </div>
              </div>
            </div>
          )}
        </DashboardSection>

        <DashboardSection
          title="Budget vs Actual"
          subtitle="By budget category"
          loading={loading && data.budgets.length === 0}
          className="lg:col-span-2"
        >
          {budgetChartData.length > 0 && (
            <TrendChart
              data={budgetChartData as unknown as Record<string, string | number>[]}
              series={[
                { dataKey: "budget", name: "Budget", color: "primary" },
                { dataKey: "actual", name: "Actual", color: "destructive" },
              ]}
              kind="bar"
              xAxisKey="name"
              height={280}
            />
          )}
        </DashboardSection>
      </div>

      {/* Cost Variance by WBS */}
      <DashboardSection
        title="Cost Variance by WBS"
        subtitle="BAC, EV, AC, and CPI per work package"
        loading={loading && data.costVariance.length === 0}
      >
        {data.costVariance.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 font-medium">WBS Node</th>
                  <th className="pb-2 font-medium text-right">BAC</th>
                  <th className="pb-2 font-medium text-right">EV</th>
                  <th className="pb-2 font-medium text-right">AC</th>
                  <th className="pb-2 font-medium text-right">CPI</th>
                  <th className="pb-2 font-medium text-right">Variance</th>
                  <th className="pb-2 font-medium text-right">Var %</th>
                </tr>
              </thead>
              <tbody>
                {data.costVariance.map((row) => (
                  <tr key={row.wbsNodeId} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="py-2 pr-4 font-medium">{row.wbsNodeName}</td>
                    <td className="py-2 text-right tabular-nums">{formatCurrency(row.bac)}</td>
                    <td className="py-2 text-right tabular-nums">{formatCurrency(row.ev)}</td>
                    <td className="py-2 text-right tabular-nums">{formatCurrency(row.ac)}</td>
                    <td className="py-2 text-right tabular-nums">
                      <span className={cn(row.cpi >= 1 ? "text-success" : "text-destructive")}>
                        {row.cpi.toFixed(2)}
                      </span>
                    </td>
                    <td className={cn("py-2 text-right tabular-nums", row.variance >= 0 ? "text-success" : "text-destructive")}>
                      {formatCurrency(row.variance)}
                    </td>
                    <td className={cn("py-2 text-right tabular-nums", row.variancePct >= 0 ? "text-success" : "text-destructive")}>
                      {row.variancePct}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DashboardSection>

      {/* Invoice Aging + Variation Summary */}
      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardSection
          title="Invoice Aging (AP)"
          subtitle="Outstanding invoices by aging bucket"
          loading={loading && data.aging.length === 0}
        >
          {data.aging.length > 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-3">
                {Object.entries(agingBuckets).map(([bucket, info]) => (
                  <div
                    key={bucket}
                    className={cn(
                      "rounded-lg border p-3 text-center",
                      bucket === "90+" && info.count > 0 ? "border-destructive" : "",
                    )}
                  >
                    <p className="text-lg font-bold">{formatCurrency(info.total)}</p>
                    <p className="text-xs text-muted-foreground">{bucket} days</p>
                    <p className="text-[10px] text-muted-foreground">{info.count} invoices</p>
                  </div>
                ))}
              </div>
              <div className="overflow-x-auto max-h-60 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-1 font-medium">Invoice</th>
                      <th className="pb-1 font-medium text-right">Outstanding</th>
                      <th className="pb-1 font-medium text-right">Days</th>
                      <th className="pb-1 font-medium text-right">Bucket</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.aging.slice(0, 15).map((inv) => (
                      <tr key={inv.invoiceId} className="border-b last:border-0 text-xs">
                        <td className="py-1.5 pr-2">{inv.invoiceNumber}</td>
                        <td className="py-1.5 text-right tabular-nums">{formatCurrency(inv.outstanding)}</td>
                        <td className="py-1.5 text-right tabular-nums">{inv.agingDays}</td>
                        <td className="py-1.5 text-right">
                          <span className={cn(
                            "inline-block rounded px-1.5 py-0.5 text-[10px] font-medium",
                            inv.bucket === "90+" ? "bg-destructive/10 text-destructive" :
                            inv.bucket === "61-90" ? "bg-warning/10 text-warning" :
                            "bg-muted text-muted-foreground",
                          )}>
                            {inv.bucket}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </DashboardSection>

        <DashboardSection
          title="Variation Orders"
          subtitle="Approved, pending, and rejected variations"
          loading={loading && !data.variation}
        >
          {data.variation && (
            <div className="space-y-4">
              <KpiGrid columns={3}>
                <KpiCard
                  icon={CheckCircle2}
                  label="Approved"
                  value={String(data.variation.totalApproved)}
                  subtitle={formatCurrency(data.variation.approvedAmount)}
                  tone="success"
                />
                <KpiCard
                  icon={Clock}
                  label="Pending"
                  value={String(data.variation.totalPending)}
                  subtitle={formatCurrency(data.variation.pendingAmount)}
                  tone="warning"
                />
                <KpiCard
                  icon={AlertTriangle}
                  label="Rejected"
                  value={String(data.variation.totalRejected)}
                  subtitle={formatCurrency(data.variation.rejectedAmount)}
                  tone="destructive"
                />
              </KpiGrid>

              {Object.keys(data.variation.countByStatus).length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">By Status</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(data.variation.countByStatus).map(([status, count]) => (
                      <span
                        key={status}
                        className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs"
                      >
                        <span className="capitalize">{status}</span>
                        <span className="font-bold">{count}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DashboardSection>
      </div>

      {/* Cash Flow */}
      <DashboardSection
        title="Cash Flow"
        subtitle="Forecast vs actual inflows and outflows"
        loading={loading && data.cashFlow.length === 0}
      >
        {data.cashFlow.length > 0 && (
          <TrendChart
            data={data.cashFlow as unknown as Record<string, string | number>[]}
            series={[
              { dataKey: "forecastInflow", name: "Forecast Inflow", color: "primary" },
              { dataKey: "actualInflow", name: "Actual Inflow", color: "success" },
              { dataKey: "forecastOutflow", name: "Forecast Outflow", color: "warning" },
              { dataKey: "actualOutflow", name: "Actual Outflow", color: "destructive" },
            ]}
            kind="bar"
            xAxisKey="period"
            height={300}
          />
        )}
      </DashboardSection>
    </DashboardPage>
  );
}
