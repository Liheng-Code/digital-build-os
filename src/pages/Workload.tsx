import * as React from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProjects } from "@/contexts/ProjectContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { TaskPriority } from "@/lib/taskMeta";
import { cn } from "@/lib/utils";

interface Row {
  user_id: string;
  full_name: string;
  job_title: string | null;
  active_tasks: number;
  estimated_hours: number;
  weighted_load: number;
}

const PRIORITY_WEIGHT: Record<TaskPriority, number> = {
  low: 1, medium: 2, high: 3, critical: 5,
};

const CAPACITY_HOURS = 40; // weekly threshold

export default function Workload() {
  const { activeProject } = useProjects();
  const [rows, setRows] = React.useState<Row[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const load = async () => {
      if (!activeProject) { setRows([]); setLoading(false); return; }
      setLoading(true);

      // Fetch active assignments + their tasks for this project
      const { data: asg } = await supabase
        .from("task_assignments")
        .select("user_id, tasks!inner(id, project_id, status, priority, estimated_hours)")
        .is("unassigned_at", null);

      const filtered = (asg ?? []).filter(
        (a: any) =>
          a.tasks?.project_id === activeProject.id &&
          !["completed", "closed", "rejected"].includes(a.tasks?.status),
      );

      const map = new Map<string, { active: number; hours: number; weighted: number }>();
      filtered.forEach((a: any) => {
        const cur = map.get(a.user_id) ?? { active: 0, hours: 0, weighted: 0 };
        cur.active += 1;
        cur.hours += Number(a.tasks?.estimated_hours ?? 0);
        cur.weighted += Number(a.tasks?.estimated_hours ?? 0) * PRIORITY_WEIGHT[a.tasks?.priority as TaskPriority];
        map.set(a.user_id, cur);
      });

      const ids = Array.from(map.keys());
      let profiles: any[] = [];
      if (ids.length > 0) {
        const { data } = await supabase
          .from("profiles")
          .select("id, full_name, job_title")
          .in("id", ids);
        profiles = data ?? [];
      }

      const result: Row[] = profiles.map((p) => {
        const m = map.get(p.id)!;
        return {
          user_id: p.id,
          full_name: p.full_name,
          job_title: p.job_title,
          active_tasks: m.active,
          estimated_hours: m.hours,
          weighted_load: m.weighted,
        };
      }).sort((a, b) => b.weighted_load - a.weighted_load);

      setRows(result);
      setLoading(false);
    };
    load();
  }, [activeProject]);

  const max = React.useMemo(() => Math.max(CAPACITY_HOURS, ...rows.map((r) => r.estimated_hours)), [rows]);

  if (!activeProject) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Workload</h1>
        <Card><CardContent className="p-12 text-center text-muted-foreground">Select a project first.</CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Workload</h1>
        <p className="text-muted-foreground">
          Capacity across the team · {activeProject.code} · weekly threshold {CAPACITY_HOURS}h
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Capacity heatmap</CardTitle>
          <CardDescription>
            Hours estimated on active tasks. Weighted load factors in priority (critical = 5×).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No active assignments yet on this project.
            </p>
          ) : (
            <div className="space-y-4">
              {rows.map((r) => {
                const pct = Math.min(100, (r.estimated_hours / max) * 100);
                const over = r.estimated_hours > CAPACITY_HOURS;
                const tone = over
                  ? "bg-destructive"
                  : r.estimated_hours > CAPACITY_HOURS * 0.8
                    ? "bg-warning"
                    : "bg-success";
                return (
                  <div key={r.user_id} className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {r.full_name.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between mb-1">
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{r.full_name}</div>
                          {r.job_title && <div className="text-xs text-muted-foreground truncate">{r.job_title}</div>}
                        </div>
                        <div className="text-sm flex items-center gap-3 shrink-0">
                          <span className={cn("num font-medium", over && "text-destructive")}>
                            {r.estimated_hours.toFixed(1)}h
                          </span>
                          <span className="text-xs text-muted-foreground num">
                            {r.active_tasks} task{r.active_tasks === 1 ? "" : "s"}
                          </span>
                          <span className="text-xs text-muted-foreground num">
                            load {r.weighted_load.toFixed(0)}
                          </span>
                        </div>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden relative">
                        <div className={cn("h-full transition-all", tone)} style={{ width: `${pct}%` }} />
                        {/* Capacity line */}
                        <div
                          className="absolute top-0 bottom-0 w-px bg-foreground/40"
                          style={{ left: `${(CAPACITY_HOURS / max) * 100}%` }}
                          title={`${CAPACITY_HOURS}h capacity`}
                        />
                      </div>
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
}
