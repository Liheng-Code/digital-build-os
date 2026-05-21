import * as React from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProjects } from "@/contexts/ProjectContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Download } from "lucide-react";
import { toast } from "sonner";
import { OrgKpis, type OrgKpiData } from "@/components/reports/OrgKpis";
import { type MemberRow } from "@/components/reports/MemberPerformanceTable";
import { MemberPerformanceCards } from "@/components/reports/MemberPerformanceCards";
import { MemberDetailSheet } from "@/components/reports/MemberDetailSheet";
import {
  DepartmentBreakdown,
  type DeptRow,
} from "@/components/reports/DepartmentBreakdown";
import { invokeXlsxDownload } from "@/lib/xlsxDownload";
import type { Department } from "@/lib/departmentMeta";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WbsLocationsDashboard } from "@/components/reports/WbsLocationsDashboard";

export default function Reports() {
  const { hasRole } = useAuth();
  const { activeProject } = useProjects();
  const isAdmin = hasRole("admin");
  const isPM = hasRole("project_manager");
  const canSeeWbs = isAdmin || isPM;
  const [loading, setLoading] = React.useState(true);
  const [exporting, setExporting] = React.useState(false);
  const projectId = activeProject?.id ?? null;
  const [dateFrom, setDateFrom] = React.useState<string>(defaultFrom());
  const [dateTo, setDateTo] = React.useState<string>(defaultTo());

  const [kpi, setKpi] = React.useState<OrgKpiData | null>(null);
  const [members, setMembers] = React.useState<MemberRow[]>([]);
  const [deptRows, setDeptRows] = React.useState<DeptRow[]>([]);
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
      const today = new Date().toISOString().slice(0, 10);

      let tasksQ = supabase
        .from("tasks")
        .select(
          "id, status, planned_end, actual_end, project_id, created_by, department",
        );
      tasksQ = tasksQ.eq("project_id", projectId);

      let tsQ = supabase
        .from("timesheet_entries")
        .select("user_id, project_id, regular_hours, overtime_hours, status, work_date");
      tsQ = tsQ.eq("project_id", projectId);
      if (dateFrom) tsQ = tsQ.gte("work_date", dateFrom);
      if (dateTo) tsQ = tsQ.lte("work_date", dateTo);

      const [tRes, tsRes, plRes, mRes, prRes, dmRes] = await Promise.all([
        tasksQ,
        tsQ,
        supabase.from("payroll_lines").select("total_pay, currency"),
        supabase.from("project_members").select("user_id, project_id"),
        supabase.from("profiles").select("id, full_name, job_title"),
        supabase.from("department_members").select("user_id, department"),
      ]);
      if (cancelled) return;

      const tasks = (tRes.data ?? []) as Array<{
        id: string;
        status: string;
        planned_end: string | null;
        actual_end: string | null;
        project_id: string;
        department: Department | null;
      }>;
      const ts = (tsRes.data ?? []) as Array<{
        user_id: string;
        project_id: string;
        regular_hours: number;
        overtime_hours: number;
        status: string;
        work_date: string;
      }>;
      const pl = (plRes.data ?? []) as Array<{ total_pay: number; currency: string }>;
      const projMembers = (mRes.data ?? []) as Array<{ user_id: string; project_id: string }>;
      const profiles = (prRes.data ?? []) as Array<{
        id: string;
        full_name: string;
        job_title: string | null;
      }>;
      const deptMembers = (dmRes.data ?? []) as Array<{
        user_id: string;
        department: Department;
      }>;

      // Org KPIs
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
        (s, e) => s + Number(e.regular_hours) + Number(e.overtime_hours),
        0,
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

      setKpi({
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
      });

      // ───── Department breakdown ─────
      type DeptAgg = {
        members: Set<string>;
        total: number;
        open: number;
        assigned: number;
        in_progress: number;
        pending_approval: number;
        approved: number;
        rejected: number;
        completed: number;
        closed: number;
        overdue: number;
        hours: number;
      };
      const deptAgg = new Map<Department | "unassigned", DeptAgg>();
      const ensureDept = (k: Department | "unassigned"): DeptAgg => {
        let a = deptAgg.get(k);
        if (!a) {
          a = {
            members: new Set(),
            total: 0,
            open: 0, assigned: 0, in_progress: 0, pending_approval: 0,
            approved: 0, rejected: 0, completed: 0, closed: 0,
            overdue: 0, hours: 0,
          };
          deptAgg.set(k, a);
        }
        return a;
      };

      const taskIds = tasks.map((t) => t.id);
      const { data: assignsData } = isAdmin && taskIds.length
        ? await supabase
            .from("task_assignments")
            .select("user_id, task_id")
            .in("task_id", taskIds)
            .is("unassigned_at", null)
        : { data: [] };
      if (cancelled) return;

      const assigns = (assignsData ?? []) as Array<{ user_id: string; task_id: string }>;
      const assignsByTask = new Map<string, string[]>();
      assigns.forEach((a) => {
        let arr = assignsByTask.get(a.task_id);
        if (!arr) { arr = []; assignsByTask.set(a.task_id, arr); }
        arr.push(a.user_id);
      });

      tasks.forEach((t) => {
        const k: Department | "unassigned" = t.department ?? "unassigned";
        const a = ensureDept(k);
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

      // Add explicit dept memberships even with 0 tasks
      deptMembers.forEach((dm) => {
        ensureDept(dm.department).members.add(dm.user_id);
      });

      // Hours per department: attribute timesheet hours to the user's primary dept (first match).
      const userDept = new Map<string, Department>();
      deptMembers.forEach((dm) => {
        if (!userDept.has(dm.user_id)) userDept.set(dm.user_id, dm.department);
      });
      ts.forEach((e) => {
        const k: Department | "unassigned" = userDept.get(e.user_id) ?? "unassigned";
        ensureDept(k).hours += Number(e.regular_hours) + Number(e.overtime_hours);
      });

      const ORDER: (Department | "unassigned")[] = [
        "architecture", "structure", "mep", "procurement", "construction", "unassigned",
      ];
      setDeptRows(
        ORDER.filter((k) => deptAgg.has(k)).map((k) => {
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
        }),
      );

      // ───── Per-member rows (admin only) ─────
      if (isAdmin) {
        const taskMap = new Map(tasks.map((t) => [t.id, t]));
        const profMap = new Map(profiles.map((p) => [p.id, p]));

        type Acc = {
          total: number; completed: number; in_progress: number; overdue: number; onTime: number;
          open: number; assigned: number; pending_approval: number; approved: number; rejected: number; closed: number;
          regH: number; otH: number; appH: number;
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

        // Group rows: emit one MemberRow per (user, department). Members in N depts → N rows.
        const userDepts = new Map<string, Department[]>();
        deptMembers.forEach((dm) => {
          let arr = userDepts.get(dm.user_id);
          if (!arr) { arr = []; userDepts.set(dm.user_id, arr); }
          if (!arr.includes(dm.department)) arr.push(dm.department);
        });

        const rows: MemberRow[] = [];
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

        setMembers(rows);
      }

      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId, dateFrom, dateTo, isAdmin]);

  const exportReport = async () => {
    if (!projectId) {
      toast.error("Select a project first");
      return;
    }
    setExporting(true);
    try {
      await invokeXlsxDownload(
        "export-member-report-xlsx",
        { project_id: projectId, date_from: dateFrom, date_to: dateTo },
        `member-report-${dateFrom}_to_${dateTo}.xlsx`,
      );
      toast.success("Excel report downloaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const projectLabel = React.useMemo(
    () => (activeProject ? `${activeProject.code} - ${activeProject.name}` : "No project selected"),
    [activeProject],
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end gap-3">
        <div className="mr-auto">
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-sm text-muted-foreground">
            Org-wide insights and per-member performance - {projectLabel}
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {canSeeWbs && <TabsTrigger value="wbs">WBS Locations</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview" className="flex flex-col gap-6 mt-4">
          <div className="flex flex-wrap items-end gap-3">
            <Filter label="From">
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-36"
              />
            </Filter>
            <Filter label="To">
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-36"
              />
            </Filter>
            {isAdmin && (
              <Button onClick={exportReport} disabled={exporting || !projectId} variant="default">
                {exporting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Export Excel
              </Button>
            )}
          </div>

          {loading || !kpi ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <OrgKpis data={kpi} />
              <DepartmentBreakdown rows={deptRows} />
              {isAdmin ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Per-member performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <MemberPerformanceCards rows={members} onSelect={setActive} />
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-6 text-sm text-muted-foreground">
                    Per-member breakdown is visible to admins only.
                  </CardContent>
                </Card>
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
    </div>
  );
}

function Filter({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      {children}
    </div>
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
