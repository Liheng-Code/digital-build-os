import * as React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProjects } from "@/contexts/ProjectContext";
import { DashboardPage, DashboardFilterBar, DashboardSection } from "@/components/reports/DashboardLayout";
import { KpiGrid } from "@/components/reports/KpiGrid";
import { KpiCard } from "@/components/reports/KpiCard";
import { TrendChart } from "@/components/reports/TrendChart";
import { ProgressGauge } from "@/components/reports/ProgressGauge";
import {
  fetchOrgKpiData,
  fetchProjectKpiSummary,
  fetchFinancialKpiSummary,
  fetchSCurveData,
} from "@/services/reportingService";
import type { KpiTimeRange } from "@/lib/reportingMeta";
import { ExportMenu } from "@/components/reports/ExportMenu";
import {
  BarChart3,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Users,
  Building2,
} from "lucide-react";

export default function ExecutiveDashboard() {
  const { hasRole } = useAuth();
  const { projects, activeProject, setActiveProjectId } = useProjects();
  const isAdmin = hasRole("admin");

  const [loading, setLoading] = React.useState(true);
  const [timeRange, setTimeRange] = React.useState<KpiTimeRange>("30d");
  const [dateFrom, setDateFrom] = React.useState<string>("");
  const [dateTo, setDateTo] = React.useState<string>("");

  const [kpi, setKpi] = React.useState<{
    org: Awaited<ReturnType<typeof fetchOrgKpiData>> | null;
    project: Awaited<ReturnType<typeof fetchProjectKpiSummary>> | null;
    financial: Awaited<ReturnType<typeof fetchFinancialKpiSummary>> | null;
    sCurve: Awaited<ReturnType<typeof fetchSCurveData>>;
  }>({ org: null, project: null, financial: null, sCurve: [] });

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!activeProject?.id) {
        setKpi({ org: null, project: null, financial: null, sCurve: [] });
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const from = timeRange === "custom" ? dateFrom : undefined;
        const to = timeRange === "custom" ? dateTo : undefined;
        const [org, project, financial, sCurve] = await Promise.all([
          fetchOrgKpiData(activeProject.id, from, to),
          fetchProjectKpiSummary(activeProject.id),
          fetchFinancialKpiSummary(activeProject.id),
          fetchSCurveData(activeProject.id),
        ]);
        if (!cancelled) setKpi({ org, project, financial, sCurve });
      } catch (err) {
        console.error("Failed to load executive dashboard", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [activeProject?.id, timeRange, dateFrom, dateTo]);

  const projectOptions = projects.map((p) => ({ value: p.id, label: p.name }));

  return (
    <DashboardPage
      title="Executive Portfolio Dashboard"
      subtitle="Cross-project health, financials, and risk — Board / CEO view"
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
                kpi.org
                  ? [
                      { kpi: "Total Projects", value: kpi.org.totalProjects },
                      { kpi: "Active Members", value: kpi.org.totalMembers },
                      { kpi: "Total Tasks", value: kpi.org.totalTasks },
                      { kpi: "Completed", value: kpi.org.completedTasks },
                      { kpi: "In Progress", value: kpi.org.inProgressTasks },
                      { kpi: "Overdue", value: kpi.org.overdueTasks },
                      { kpi: "On-Time Rate (%)", value: kpi.org.onTimeRate },
                      { kpi: "Total Hours", value: kpi.org.totalHours },
                    ]
                  : []
              }
              filename="executive-dashboard"
              pageTitle="Executive Portfolio Dashboard"
            />
          }
        />
      }
    >
      {/* Org KPIs */}
      <DashboardSection loading={loading && !kpi.org}>
        {kpi.org && (
          <KpiGrid columns={4}>
            <KpiCard
              icon={Users}
              label="Active Members"
              value={String(kpi.org.totalMembers)}
              subtitle={`${kpi.org.totalTasks} tasks total`}
            />
            <KpiCard
              icon={CheckCircle2}
              label="Completed Tasks"
              value={`${kpi.org.completedTasks}/${kpi.org.totalTasks}`}
              subtitle={`${kpi.org.onTimeRate}% on-time`}
            />
            <KpiCard
              icon={Clock}
              label="Hours Logged"
              value={kpi.org.totalHours.toFixed(1)}
              subtitle={`${kpi.org.approvedHours.toFixed(1)} approved`}
            />
            <KpiCard
              icon={AlertTriangle}
              label="Overdue Tasks"
              value={String(kpi.org.overdueTasks)}
              subtitle={`${kpi.org.inProgressTasks} in progress`}
              tone={kpi.org.overdueTasks > 5 ? "destructive" : kpi.org.overdueTasks > 0 ? "warning" : "default"}
            />
          </KpiGrid>
        )}
      </DashboardSection>

      {/* Project KPIs + Financial KPIs */}
      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardSection title="Project Health" loading={loading && !kpi.project}>
          {kpi.project && (
            <div className="space-y-6">
              <div className="flex items-center justify-around">
                <ProgressGauge
                  value={kpi.project.overallProgressPct}
                  label="Overall Progress"
                  size="lg"
                  tone={kpi.project.overallProgressPct >= 80 ? "success" : kpi.project.overallProgressPct >= 40 ? "warning" : "destructive"}
                />
                <ProgressGauge
                  value={100 - kpi.project.plannedVsActualPct}
                  label="On Schedule"
                  size="lg"
                  tone={kpi.project.plannedVsActualPct <= 20 ? "success" : kpi.project.plannedVsActualPct <= 50 ? "warning" : "destructive"}
                  max={100}
                />
              </div>
              <KpiGrid columns={2}>
                <KpiCard
                  icon={AlertTriangle}
                  label="Delay Days"
                  value={`${kpi.project.delayDays}d`}
                  subtitle={`${kpi.project.criticalTasks} critical`}
                  tone={kpi.project.delayDays > 14 ? "destructive" : kpi.project.delayDays > 3 ? "warning" : "default"}
                />
                <KpiCard
                  icon={BarChart3}
                  label="Cost Variance"
                  value={`${kpi.project.costVariancePct}%`}
                  subtitle={kpi.project.costVariance >= 0 ? "Under budget" : "Over budget"}
                  tone={kpi.project.costVariancePct >= 0 ? "success" : "destructive"}
                />
                <KpiCard
                  icon={AlertTriangle}
                  label="Open Issues"
                  value={String(kpi.project.openIssues)}
                  subtitle={`${kpi.project.pendingApprovals} pending`}
                  tone={kpi.project.openIssues > 20 ? "destructive" : kpi.project.openIssues > 5 ? "warning" : "default"}
                />
                <KpiCard
                  icon={Clock}
                  label="RFI / NCR Aging"
                  value={`${kpi.project.rfiAgingDays}d / ${kpi.project.ncrAgingDays}d`}
                  subtitle="Average age"
                />
              </KpiGrid>
            </div>
          )}
        </DashboardSection>

        <DashboardSection title="Financial Overview" loading={loading && !kpi.financial}>
          {kpi.financial && (
            <div className="space-y-4">
              <ProgressGauge
                value={kpi.financial.budgetUtilizationPct}
                label="Budget Utilization"
                size="lg"
                tone={kpi.financial.budgetUtilizationPct > 90 ? "destructive" : kpi.financial.budgetUtilizationPct > 75 ? "warning" : "success"}
              />
              <KpiGrid columns={2}>
                <KpiCard
                  icon={DollarSign}
                  label="Total Budget"
                  value={new Intl.NumberFormat("en-US", { style: "currency", currency: kpi.financial.currency, maximumFractionDigits: 0 }).format(kpi.financial.totalBudget)}
                />
                <KpiCard
                  icon={TrendingUp}
                  label="Actual Spent"
                  value={new Intl.NumberFormat("en-US", { style: "currency", currency: kpi.financial.currency, maximumFractionDigits: 0 }).format(kpi.financial.totalActual)}
                />
                <KpiCard
                  icon={DollarSign}
                  label="Committed"
                  value={new Intl.NumberFormat("en-US", { style: "currency", currency: kpi.financial.currency, maximumFractionDigits: 0 }).format(kpi.financial.totalCommitted)}
                />
                <KpiCard
                  icon={Building2}
                  label="Forecast Final"
                  value={new Intl.NumberFormat("en-US", { style: "currency", currency: kpi.financial.currency, maximumFractionDigits: 0 }).format(kpi.financial.forecastFinalCost)}
                  tone={kpi.financial.forecastFinalCost > kpi.financial.totalBudget ? "destructive" : "default"}
                />
              </KpiGrid>
            </div>
          )}
        </DashboardSection>
      </div>

      {/* S-Curve */}
      <DashboardSection title="Progress Trend (S-Curve)" loading={loading && kpi.sCurve.length === 0}>
        {kpi.sCurve.length > 0 && (
          <TrendChart
            data={kpi.sCurve as unknown as Record<string, string | number>[]}
            series={[
              { dataKey: "planned", name: "Planned", color: "primary" },
              { dataKey: "actual", name: "Actual", color: "success" },
            ]}
            kind="area"
            height={300}
          />
        )}
      </DashboardSection>
    </DashboardPage>
  );
}
