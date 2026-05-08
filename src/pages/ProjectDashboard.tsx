/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProjects } from "@/contexts/ProjectContext";
import { DashboardPage, DashboardFilterBar, DashboardSection } from "@/components/reports/DashboardLayout";
import { KpiGrid } from "@/components/reports/KpiGrid";
import { KpiCard } from "@/components/reports/KpiCard";
import { TrendChart } from "@/components/reports/TrendChart";
import { ProgressGauge } from "@/components/reports/ProgressGauge";
import {
  fetchProjectKpiSummary,
  fetchFinancialKpiSummary,
  fetchDepartmentKpis,
  fetchMemberPerformance,
  fetchSCurveData,
  fetchBuildingProgress,
  fetchWbsNodePerformance,
} from "@/services/reportingService";
import { ExportMenu } from "@/components/reports/ExportMenu";
import { DepartmentBreakdown } from "@/components/reports/DepartmentBreakdown";
import { MemberPerformanceCards } from "@/components/reports/MemberPerformanceCards";
import type { KpiTimeRange } from "@/lib/reportingMeta";
import {
  AlertTriangle,
  Clock,
  DollarSign,
  Building2,
  FileText,
  ShieldAlert,
  ShoppingCart,
  CheckCircle2,
} from "lucide-react";

export default function ProjectDashboard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const { projects } = useProjects();
  const isPM = hasRole("admin") || hasRole("project_manager");

  const [loading, setLoading] = React.useState(true);
  const [timeRange, setTimeRange] = React.useState<KpiTimeRange>("30d");
  const [dateFrom, setDateFrom] = React.useState<string>("");
  const [dateTo, setDateTo] = React.useState<string>("");

  const [data, setData] = React.useState<{
    project: Awaited<ReturnType<typeof fetchProjectKpiSummary>> | null;
    financial: Awaited<ReturnType<typeof fetchFinancialKpiSummary>> | null;
    departments: Awaited<ReturnType<typeof fetchDepartmentKpis>>;
    members: Awaited<ReturnType<typeof fetchMemberPerformance>>;
    sCurve: Awaited<ReturnType<typeof fetchSCurveData>>;
    buildings: Awaited<ReturnType<typeof fetchBuildingProgress>>;
    wbsNodes: Awaited<ReturnType<typeof fetchWbsNodePerformance>>;
  }>({
    project: null,
    financial: null,
    departments: [],
    members: [],
    sCurve: [],
    buildings: [],
    wbsNodes: [],
  });

  const projectId = id ?? "";

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!projectId) { setLoading(false); return; }
      setLoading(true);
      try {
        const from = timeRange === "custom" ? dateFrom : undefined;
        const to = timeRange === "custom" ? dateTo : undefined;
        const [project, financial, departments, members, sCurve, buildings, wbsNodes] =
          await Promise.all([
            fetchProjectKpiSummary(projectId),
            fetchFinancialKpiSummary(projectId),
            fetchDepartmentKpis(projectId, from, to),
            fetchMemberPerformance(projectId, from, to),
            fetchSCurveData(projectId),
            fetchBuildingProgress(projectId),
            fetchWbsNodePerformance(projectId),
          ]);
        if (!cancelled) setData({ project, financial, departments, members, sCurve, buildings, wbsNodes });
      } catch (err) {
        console.error("Failed to load project dashboard", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [projectId, timeRange, dateFrom, dateTo]);

  const project = projects.find((p) => p.id === projectId);

  return (
    <DashboardPage
      title={project ? `${project.name} Dashboard` : "Project Dashboard"}
      subtitle="Project progress, cost, risk, and issue — daily control view"
      filterBar={
        <DashboardFilterBar
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
                data.project
                  ? [
                      { kpi: "Overall Progress (%)", value: data.project.overallProgressPct },
                      { kpi: "Delay (days)", value: data.project.delayDays },
                      { kpi: "Critical Tasks", value: data.project.criticalTasks },
                      { kpi: "Open Issues", value: data.project.openIssues },
                      { kpi: "Pending Approvals", value: data.project.pendingApprovals },
                      { kpi: "Cost Variance", value: data.project.costVariance },
                    ]
                  : []
              }
              filename={`project-${projectId}-dashboard`}
              pageTitle="Project Dashboard"
            />
          }
        />
      }
    >
      {/* Project Health Gauges */}
      <div className="grid gap-6 lg:grid-cols-3">
        <DashboardSection loading={loading && !data.project}>
          {data.project && (
            <div className="flex flex-col items-center">
              <ProgressGauge
                value={data.project.overallProgressPct}
                label="Overall Progress"
                size="lg"
                tone={data.project.overallProgressPct >= 80 ? "success" : data.project.overallProgressPct >= 40 ? "warning" : "destructive"}
              />
              <div className="mt-2 text-center">
                <p className="text-2xl font-bold">{data.project.delayDays}d</p>
                <p className="text-xs text-muted-foreground">Average delay</p>
              </div>
            </div>
          )}
        </DashboardSection>

        <DashboardSection title="Key Metrics" loading={loading && !data.project}>
          {data.project && (
            <KpiGrid columns={2}>
              <KpiCard
                icon={AlertTriangle}
                label="Critical Tasks"
                value={String(data.project.criticalTasks)}
                tone={data.project.criticalTasks > 5 ? "destructive" : "default"}
              />
              <KpiCard
                icon={FileText}
                label="Open Issues"
                value={String(data.project.openIssues)}
              />
              <KpiCard
                icon={CheckCircle2}
                label="Pending Approvals"
                value={String(data.project.pendingApprovals)}
              />
              <KpiCard
                icon={Clock}
                label="Planned vs Actual"
                value={`${data.project.plannedVsActualPct}%`}
                subtitle="Behind schedule"
                tone={data.project.plannedVsActualPct > 20 ? "destructive" : data.project.plannedVsActualPct > 5 ? "warning" : "success"}
              />
            </KpiGrid>
          )}
        </DashboardSection>

        <DashboardSection title="Risk Indicators" loading={loading && !data.project}>
          {data.project && (
            <KpiGrid columns={2}>
              <KpiCard
                icon={ShieldAlert}
                label="RFI Aging"
                value={`${data.project.rfiAgingDays}d`}
                subtitle="Average age"
                tone={data.project.rfiAgingDays > 14 ? "destructive" : data.project.rfiAgingDays > 7 ? "warning" : "default"}
              />
              <KpiCard
                icon={ShieldAlert}
                label="NCR Aging"
                value={`${data.project.ncrAgingDays}d`}
                subtitle="Average age"
                tone={data.project.ncrAgingDays > 14 ? "destructive" : data.project.ncrAgingDays > 7 ? "warning" : "default"}
              />
              <KpiCard
                icon={ShoppingCart}
                label="Procurement Delay"
                value={`${data.project.procurementDelayDays}d`}
                tone={data.project.procurementDelayDays > 14 ? "destructive" : data.project.procurementDelayDays > 7 ? "warning" : "default"}
              />
              <KpiCard
                icon={DollarSign}
                label="Cost Variance"
                value={`${data.project.costVariancePct}%`}
                subtitle={data.project.costVariance >= 0 ? "Under budget" : "Over budget"}
                tone={data.project.costVariancePct >= 0 ? "success" : "destructive"}
              />
            </KpiGrid>
          )}
        </DashboardSection>
      </div>

      {/* Financial KPIs */}
      <DashboardSection title="Financial Summary" loading={loading && !data.financial}>
        {data.financial && (
          <div className="space-y-4">
            <ProgressGauge
              value={data.financial.budgetUtilizationPct}
              label="Budget Utilization"
              size="md"
              tone={data.financial.budgetUtilizationPct > 90 ? "destructive" : data.financial.budgetUtilizationPct > 75 ? "warning" : "success"}
            />
            <KpiGrid columns={4}>
              <KpiCard
                icon={DollarSign}
                label="Total Budget"
                value={new Intl.NumberFormat("en-US", { style: "currency", currency: data.financial.currency, maximumFractionDigits: 0 }).format(data.financial.totalBudget)}
              />
              <KpiCard
                icon={DollarSign}
                label="Actual Spent"
                value={new Intl.NumberFormat("en-US", { style: "currency", currency: data.financial.currency, maximumFractionDigits: 0 }).format(data.financial.totalActual)}
              />
              <KpiCard
                icon={DollarSign}
                label="Committed"
                value={new Intl.NumberFormat("en-US", { style: "currency", currency: data.financial.currency, maximumFractionDigits: 0 }).format(data.financial.totalCommitted)}
              />
              <KpiCard
                icon={Building2}
                label="Forecast Final"
                value={new Intl.NumberFormat("en-US", { style: "currency", currency: data.financial.currency, maximumFractionDigits: 0 }).format(data.financial.forecastFinalCost)}
                tone={data.financial.forecastFinalCost > data.financial.totalBudget ? "destructive" : "default"}
              />
            </KpiGrid>
          </div>
        )}
      </DashboardSection>

      {/* S-Curve */}
      <DashboardSection title="Progress Trend (S-Curve)" loading={loading && data.sCurve.length === 0}>
        {data.sCurve.length > 0 && (
          <TrendChart
            data={data.sCurve as unknown as Record<string, string | number>[]}
            series={[
              { dataKey: "planned", name: "Planned", color: "primary" },
              { dataKey: "actual", name: "Actual", color: "success" },
            ]}
            kind="area"
            height={300}
          />
        )}
      </DashboardSection>

      {/* Department Breakdown + Building Progress */}
      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardSection
          title="Department Breakdown"
          subtitle="Task distribution by discipline"
          loading={loading && data.departments.length === 0}
        >
          {data.departments.length > 0 && (
            <DepartmentBreakdown
              rows={data.departments as any}
            />
          )}
        </DashboardSection>

        <DashboardSection
          title="Building Progress"
          subtitle="WBS buildings overview"
          loading={loading && data.buildings.length === 0}
        >
          {data.buildings.length > 0 && (
            <div className="space-y-3">
              {data.buildings.map((b) => (
                <div key={b.buildingName} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{b.buildingName}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${b.progressPct}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-12 text-right">
                      {b.progressPct}%
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {b.taskCount} tasks
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DashboardSection>
      </div>

      {/* Member Performance */}
      <DashboardSection
        title="Team Performance"
        subtitle="Member task completion and hours"
        loading={loading && data.members.length === 0}
      >
        {data.members.length > 0 && (
          <MemberPerformanceCards rows={data.members as any} onSelect={() => {}} />
        )}
      </DashboardSection>
    </DashboardPage>
  );
}
