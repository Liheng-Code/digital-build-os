import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useProjects } from "@/contexts/ProjectContext";
import { useAuth } from "@/contexts/AuthContext";
import { useProjectCostSummaries } from "@/hooks/useFinancials";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/StatusBadge";
import { TaskStatus, TASK_STATUS_LABELS } from "@/lib/taskMeta";
import {
  ClipboardList,
  CheckSquare,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  FolderKanban,
} from "lucide-react";

interface TaskCount {
  status: TaskStatus;
  count: number;
}

const Index = () => {
  const { activeProject, projects } = useProjects();
  const { profile, user, roles } = useAuth();
  const [counts, setCounts] = useState<TaskCount[]>([]);
  const [myTaskCount, setMyTaskCount] = useState(0);
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [loading, setLoading] = useState(true);
  const { data: summaries } = useProjectCostSummaries(activeProject?.id || "");

  useEffect(() => {
    const load = async () => {
      if (!activeProject || !user) {
        setLoading(false);
        return;
      }
      setLoading(true);

      const { data: tasks } = await supabase
        .from("tasks")
        .select("status")
        .eq("project_id", activeProject.id);

      const map = new Map<TaskStatus, number>();
      (tasks ?? []).forEach((t) => {
        map.set(t.status as TaskStatus, (map.get(t.status as TaskStatus) ?? 0) + 1);
      });
      const arr: TaskCount[] = Array.from(map.entries()).map(([status, count]) => ({
        status,
        count,
      }));
      setCounts(arr);
      setPendingApprovals(map.get("pending_approval") ?? 0);

      const { data: assignments } = await supabase
        .from("task_assignments")
        .select("task_id, tasks!inner(project_id, status)")
        .eq("user_id", user.id)
        .is("unassigned_at", null);

      const mine = (assignments ?? []).filter(
        (a: any) =>
          a.tasks?.project_id === activeProject.id &&
          !["completed", "closed"].includes(a.tasks?.status),
      );
      setMyTaskCount(mine.length);

      setLoading(false);
    };
    load();
  }, [activeProject, user]);

  const totalTasks = counts.reduce((s, c) => s + c.count, 0);
  const completed = (counts.find((c) => c.status === "completed")?.count ?? 0)
    + (counts.find((c) => c.status === "closed")?.count ?? 0);
  const completion = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;
  
  // Safe calculation in case view is missing or query fails
  const totalSpend = useMemo(() => {
    if (!summaries) return 0;
    try {
      return summaries.reduce((acc, s) => acc + (s.ac_total || 0), 0);
    } catch (e) {
      console.error("Error calculating spend:", e);
      return 0;
    }
  }, [summaries]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  };

  if (projects.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Welcome to BuildTrack</h1>
          <p className="text-muted-foreground">Get started by creating your first project.</p>
        </div>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft">
              <FolderKanban className="h-6 w-6 text-accent" />
            </div>
            <h2 className="text-lg font-semibold mb-2">No projects yet</h2>
            <p className="text-sm text-muted-foreground max-w-sm mb-4">
              Projects scope every task, timesheet, and document in BuildTrack.
              Create one to get started.
            </p>
            {(roles.includes("admin") || roles.includes("project_manager")) ? (
              <Button asChild>
                <Link to="/projects">Create your first project</Link>
              </Button>
            ) : (
              <p className="text-xs text-muted-foreground">Ask an admin or project manager to set one up.</p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          {greeting()}, {profile?.full_name?.split(" ")[0] || "there"}
        </h1>
        <p className="text-muted-foreground">
          {activeProject
            ? <>Viewing <span className="font-medium text-foreground">{activeProject.code}</span> · {activeProject.name}</>
            : "Select a project from the top bar."}
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          icon={<ClipboardList className="h-5 w-5" />}
          label="Total tasks"
          value={loading ? null : totalTasks}
          tone="primary"
        />
        <KPICard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Completion"
          value={loading ? null : `${completion}%`}
          tone="success"
        />
        <KPICard
          icon={<CheckSquare className="h-5 w-5" />}
          label="My active tasks"
          value={loading ? null : myTaskCount}
          tone="info"
          to="/tasks"
        />
        <KPICard
          icon={<TrendingDown className="h-5 w-5" />}
          label="Project Spend"
          value={loading ? null : `$${totalSpend.toLocaleString()}`}
          tone="warning"
          to="/financials"
        />
      </div>

      {/* Status breakdown */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Task status breakdown</CardTitle>
            <CardDescription>Distribution across the project lifecycle</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/tasks">View tasks <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
            </div>
          ) : counts.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No tasks in this project yet.{" "}
              <Link to="/tasks" className="text-primary hover:underline">Create the first one</Link>.
            </p>
          ) : (
            <div className="space-y-3">
              {counts
                .sort((a, b) => b.count - a.count)
                .map((c) => {
                  const pct = totalTasks > 0 ? (c.count / totalTasks) * 100 : 0;
                  return (
                    <div key={c.status}>
                      <div className="flex items-center justify-between mb-1">
                        <StatusBadge status={c.status} />
                        <span className="text-sm font-medium num">{c.count}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

function KPICard({
  icon, label, value, tone, to,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string | null;
  tone: "primary" | "success" | "info" | "warning";
  to?: string;
}) {
  const toneClasses = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success-soft text-success",
    info: "bg-info-soft text-info",
    warning: "bg-warning-soft text-warning",
  }[tone];

  const inner = (
    <Card className="hover:shadow-elevated transition-shadow">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${toneClasses}`}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
          <div className="text-2xl font-bold num">
            {value === null ? <Skeleton className="h-7 w-16 mt-1" /> : value}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return to ? <Link to={to}>{inner}</Link> : inner;
}

export default Index;
