import * as React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProjects } from "@/contexts/ProjectContext";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DashboardPage,
  DashboardFilterBar,
  DashboardSection,
  ExportMenu,
  OrgKpis,
  DepartmentBreakdown,
  MemberPerformanceCards,
  MemberDetailSheet,
  WbsLocationsDashboard,
} from "@/components/reports";
import type { MemberRow } from "@/components/reports/MemberPerformanceTable";
import type { DeptRow } from "@/components/reports/DepartmentBreakdown";
import type { ExportColumn } from "@/lib/exportUtils";
import type { OrgKpiData, KpiTimeRange } from "@/lib/reportingMeta";
import {
  fetchOrgKpiData,
  fetchDepartmentKpis,
  fetchMemberPerformance,
} from "@/services/reportingService";

export default function Reports() {
  const { hasRole } = useAuth();
  const { activeProject } = useProjects();
  const isAdmin = hasRole("admin");
  const isPM = hasRole("project_manager");
  const canSeeWbs = isAdmin || isPM;
  const projectId = activeProject?.id ?? null;
  const [loading, setLoading] = React.useState(true);
  const [timeRange, setTimeRange] = React.useState<KpiTimeRange>("custom");
  const [dateFrom, setDateFrom] = React.useState<string>(defaultFrom());
  const [dateTo, setDateTo] = React.useState<string>(defaultTo());

  const [kpi, setKpi] = React.useState<OrgKpiData | null>(null);
  const [deptRows, setDeptRows] = React.useState<DeptRow[]>([]);
  const [members, setMembers] = React.useState<MemberRow[]>([]);
  const [active, setActive] = React.useState<MemberRow | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!projectId) {
        setKpi(null);
        setMembers([]);
        setDeptRows([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const [orgData, deptData, memberData] = await Promise.all([
          fetchOrgKpiData(projectId, dateFrom, dateTo),
          fetchDepartmentKpis(projectId, dateFrom, dateTo),
          isAdmin ? fetchMemberPerformance(projectId, dateFrom, dateTo) : Promise.resolve([]),
        ]);
        if (cancelled) return;
        setKpi(orgData);
        setDeptRows(deptData);
        if (isAdmin) setMembers(memberData);
      } catch (err) {
        if (!cancelled) toast.error("Failed to load report data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId, dateFrom, dateTo, isAdmin]);

  const projectLabel = React.useMemo(
    () => (activeProject ? `${activeProject.code} - ${activeProject.name}` : "No project selected"),
    [activeProject],
  );

  const exportColumns: ExportColumn[] = [
    { key: "full_name", label: "Name" },
    { key: "total_tasks", label: "Total Tasks" },
    { key: "completed", label: "Completed" },
    { key: "overdue", label: "Overdue" },
    { key: "on_time_rate", label: "On-Time Rate" },
    { key: "approved_hours", label: "Approved Hours" },
  ];

  const filterBar = (
    <DashboardFilterBar
      timeRange={timeRange}
      onTimeRangeChange={setTimeRange}
      dateFrom={dateFrom}
      dateTo={dateTo}
      onDateFromChange={setDateFrom}
      onDateToChange={setDateTo}
      extraActions={
        isAdmin && projectId ? (
          <ExportMenu
            columns={exportColumns}
            data={members as unknown as Record<string, unknown>[]}
            filename={`member-report-${dateFrom}_to_${dateTo}`}
            pageTitle="Member Performance Report"
            showXlsx
            xlsxFnName="export-member-report-xlsx"
            xlsxBody={{ project_id: projectId, date_from: dateFrom, date_to: dateTo }}
            disabled={loading}
          />
        ) : undefined
      }
    />
  );

  return (
    <DashboardPage
      title="Reports"
      subtitle={`Org-wide insights and per-member performance - ${projectLabel}`}
      filterBar={filterBar}
    >
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {canSeeWbs && <TabsTrigger value="wbs">WBS Locations</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview" className="flex flex-col gap-6 mt-4">
          {loading || !kpi ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <OrgKpis data={kpi} />
              <DepartmentBreakdown rows={deptRows} />
              {isAdmin ? (
                <DashboardSection title="Per-member performance">
                  <MemberPerformanceCards rows={members} onSelect={setActive} />
                </DashboardSection>
              ) : (
                <DashboardSection>
                  <p className="py-2 text-sm text-muted-foreground">
                    Per-member breakdown is visible to admins only.
                  </p>
                </DashboardSection>
              )}
            </>
          )}
        </TabsContent>

        {canSeeWbs && (
          <TabsContent value="wbs" className="mt-4">
            <WbsLocationsDashboard projectId={projectId ?? ""} projectLabel={projectLabel} />
          </TabsContent>
        )}
      </Tabs>

      <MemberDetailSheet
        member={active}
        open={!!active}
        onOpenChange={(o) => !o && setActive(null)}
      />
    </DashboardPage>
  );
}

function defaultFrom(): string {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
}

function defaultTo(): string {
  return new Date().toISOString().slice(0, 10);
}
