import * as React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProjects } from "@/contexts/ProjectContext";
import { DashboardPage, DashboardFilterBar, DashboardSection } from "@/components/reports/DashboardLayout";
import { KpiGrid } from "@/components/reports/KpiGrid";
import { KpiCard } from "@/components/reports/KpiCard";
import { ProgressGauge } from "@/components/reports/ProgressGauge";
import {
  fetchProjectKpiSummary,
  fetchFinancialKpiSummary,
  fetchTaskProgressSummary,
} from "@/services/reportingService";
import { ExportMenu } from "@/components/reports/ExportMenu";
import {
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Clock,
} from "lucide-react";

export default function ClientDashboard() {
  const { projects, activeProject, setActiveProjectId } = useProjects();

  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState<{
    project: Awaited<ReturnType<typeof fetchProjectKpiSummary>> | null;
    financial: Awaited<ReturnType<typeof fetchFinancialKpiSummary>> | null;
    progress: Awaited<ReturnType<typeof fetchTaskProgressSummary>> | null;
  }>({ project: null, financial: null, progress: null });

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!activeProject?.id) {
        setData({ project: null, financial: null, progress: null });
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const [project, financial, progress] = await Promise.all([
          fetchProjectKpiSummary(activeProject.id),
          fetchFinancialKpiSummary(activeProject.id),
          fetchTaskProgressSummary(activeProject.id),
        ]);
        if (!cancelled) setData({ project, financial, progress });
      } catch (err) {
        console.error("Failed to load client dashboard", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [activeProject?.id]);

  const projectOptions = projects.map((p) => ({ value: p.id, label: p.name }));

  return (
    <DashboardPage
      title="Project Overview"
      subtitle="Approval and progress view — Client / Consultant"
      filterBar={
        <DashboardFilterBar
          projectOptions={projectOptions}
          projectValue={activeProject?.id ?? ""}
          onProjectChange={(v) => setActiveProjectId(v)}
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
                      { kpi: "Open Issues", value: data.project.openIssues },
                      { kpi: "Pending Approvals", value: data.project.pendingApprovals },
                    ]
                  : []
              }
              filename={`client-${activeProject?.id}-dashboard`}
              pageTitle="Project Overview"
            />
          }
        />
      }
    >
      {/* Progress Gauges */}
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
            </div>
          )}
        </DashboardSection>

        <DashboardSection title="Project Health" loading={loading && !data.project}>
          {data.project && (
            <KpiGrid columns={2}>
              <KpiCard
                icon={AlertTriangle}
                label="Delay"
                value={`${data.project.delayDays} days`}
                tone={data.project.delayDays > 14 ? "destructive" : data.project.delayDays > 3 ? "warning" : "success"}
              />
              <KpiCard
                icon={CheckCircle2}
                label="Completion"
                value={`${data.project.overallProgressPct}%`}
              />
              <KpiCard
                icon={Clock}
                label="Open Issues"
                value={String(data.project.openIssues)}
              />
              <KpiCard
                icon={CheckCircle2}
                label="Pending Approvals"
                value={String(data.project.pendingApprovals)}
              />
            </KpiGrid>
          )}
        </DashboardSection>

        <DashboardSection title="Financial Summary" loading={loading && !data.financial}>
          {data.financial && (
            <ProgressGauge
              value={data.financial.budgetUtilizationPct}
              label="Budget Utilization"
              size="md"
              tone={data.financial.budgetUtilizationPct > 90 ? "destructive" : data.financial.budgetUtilizationPct > 75 ? "warning" : "success"}
            />
          )}
        </DashboardSection>
      </div>
    </DashboardPage>
  );
}
