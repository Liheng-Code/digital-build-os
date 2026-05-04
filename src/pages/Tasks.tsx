import { useEffect, useState, useCallback, useMemo, type ComponentType } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useProjects } from "@/contexts/ProjectContext";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/StatusBadge";
import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog";
import {
  TaskStatus, TaskPriority, TaskType,
  TASK_PRIORITY_LABELS, TASK_PRIORITY_TONE, TASK_TYPE_LABELS,
  KANBAN_COLUMNS, TASK_STATUS_LABELS,
} from "@/lib/taskMeta";
import {
  AlertTriangle,
  Bell,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Inbox,
  LayoutGrid,
  List,
  Search,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTaskUnread } from "@/hooks/useTaskUnread";
import { Department, DEPARTMENT_LABELS } from "@/lib/departmentMeta";
import { DepartmentBadge } from "@/components/DepartmentBadge";

interface TaskRow {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  task_type: TaskType;
  location_zone: string | null;
  planned_end: string | null;
  estimated_hours: number | null;
  progress_pct: number;
  department: Department | null;
}

const DASH = "-";

export default function Tasks() {
  const { activeProject } = useProjects();
  const { unreadByTaskId } = useTaskUnread();
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "all">("all");
  const [deptFilter, setDeptFilter] = useState<Department | "all">("all");

  const load = useCallback(async () => {
    if (!activeProject) {
      setTasks([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("tasks")
      .select("id, title, status, priority, task_type, location_zone, planned_end, estimated_hours, progress_pct, department")
      .eq("project_id", activeProject.id)
      .order("created_at", { ascending: false });
    setTasks((data ?? []) as TaskRow[]);
    setLoading(false);
  }, [activeProject]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => tasks.filter((t) => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
    if (deptFilter !== "all" && t.department !== deptFilter) return false;
    return true;
  }), [deptFilter, priorityFilter, search, statusFilter, tasks]);

  const summary = useMemo(() => {
    const unreadTotal = tasks.reduce((sum, task) => sum + (unreadByTaskId.get(task.id) ?? 0), 0);
    return {
      total: tasks.length,
      inProgress: tasks.filter((task) => task.status === "in_progress").length,
      risk: tasks.filter((task) => task.status === "blocked" || task.status === "rejected").length,
      pending: tasks.filter((task) => task.status === "pending_approval").length,
      completed: tasks.filter((task) => task.status === "approved" || task.status === "completed").length,
      unreadTotal,
    };
  }, [tasks, unreadByTaskId]);

  const activeFilterCount =
    (search ? 1 : 0) +
    (statusFilter !== "all" ? 1 : 0) +
    (priorityFilter !== "all" ? 1 : 0) +
    (deptFilter !== "all" ? 1 : 0);

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setPriorityFilter("all");
    setDeptFilter("all");
  };

  if (!activeProject) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Tasks</h1>
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            Select a project from the top bar to view tasks.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <ClipboardList className="h-4 w-4" />
            Work tracking
          </div>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{activeProject.code}</span>
            <span className="mx-2 text-muted-foreground/60">/</span>
            {activeProject.name}
          </p>
        </div>
        <CreateTaskDialog onCreated={load} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <SummaryCard loading={loading} label="All Tasks" value={summary.total} icon={Inbox} />
        <SummaryCard loading={loading} label="In Progress" value={summary.inProgress} icon={Clock3} tone="info" />
        <SummaryCard loading={loading} label="At Risk" value={summary.risk} icon={AlertTriangle} tone="risk" />
        <SummaryCard loading={loading} label="Pending Approval" value={summary.pending} icon={Bell} tone="warning" />
        <SummaryCard loading={loading} label="Approved / Done" value={summary.completed} icon={CheckCircle2} tone="success" />
        <SummaryCard loading={loading} label="Unread Updates" value={summary.unreadTotal} icon={Bell} tone="accent" />
      </div>

      <div className="rounded-lg border bg-card p-3 shadow-card">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search tasks by title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 pl-9"
            />
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:w-auto">
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as TaskStatus | "all")}>
              <SelectTrigger className="h-10 sm:w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {(Object.keys(TASK_STATUS_LABELS) as TaskStatus[]).map((s) => (
                  <SelectItem key={s} value={s}>{TASK_STATUS_LABELS[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as TaskPriority | "all")}>
              <SelectTrigger className="h-10 sm:w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All priorities</SelectItem>
                {(Object.keys(TASK_PRIORITY_LABELS) as TaskPriority[]).map((p) => (
                  <SelectItem key={p} value={p}>{TASK_PRIORITY_LABELS[p]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={deptFilter} onValueChange={(v) => setDeptFilter(v as Department | "all")}>
              <SelectTrigger className="h-10 sm:w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All departments</SelectItem>
                {(Object.keys(DEPARTMENT_LABELS) as Department[]).map((d) => (
                  <SelectItem key={d} value={d}>{DEPARTMENT_LABELS[d]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between gap-3 lg:min-w-[190px] lg:justify-end">
            <div className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{filtered.length}</span> of {tasks.length}
            </div>
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 px-2 text-xs">
                <X className="h-3.5 w-3.5" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      <Tabs defaultValue="list" className="space-y-3">
        <TabsList className="h-10">
          <TabsTrigger value="list" className="gap-2 px-4"><List className="h-4 w-4" /> List</TabsTrigger>
          <TabsTrigger value="kanban" className="gap-2 px-4"><LayoutGrid className="h-4 w-4" /> Kanban</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-0">
          <Card className="overflow-hidden shadow-card">
            <CardContent className="p-0">
              {loading ? (
                <div className="p-4 space-y-3">
                  {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
                </div>
              ) : filtered.length === 0 ? (
                <EmptyState activeFilterCount={activeFilterCount} />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead className="min-w-[300px]">Task</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="min-w-[160px]">Progress</TableHead>
                        <TableHead>Due</TableHead>
                        <TableHead className="text-right">Est. hrs</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((t) => {
                        const unread = unreadByTaskId.get(t.id) ?? 0;
                        return (
                          <TableRow
                            key={t.id}
                            className={cn(
                              "cursor-pointer transition-colors hover:bg-muted/40",
                              unread > 0 && "bg-info-soft/30 hover:bg-info-soft/40",
                            )}
                          >
                            <TableCell className="py-4">
                              <Link to={`/tasks/${t.id}`} className="group inline-flex max-w-[520px] items-start gap-2">
                                {unread > 0 && <UnreadBadge count={unread} className="mt-0.5" />}
                                <span>
                                  <span className="block font-medium leading-snug group-hover:text-primary">{t.title}</span>
                                  <span className="mt-1 block text-xs text-muted-foreground">
                                    {t.location_zone || TASK_TYPE_LABELS[t.task_type]}
                                  </span>
                                </span>
                              </Link>
                            </TableCell>
                            <TableCell>
                              {t.department ? <DepartmentBadge department={t.department} /> : <span className="text-muted-foreground">{DASH}</span>}
                            </TableCell>
                            <TableCell>
                              <PriorityPill priority={t.priority} />
                            </TableCell>
                            <TableCell><StatusBadge status={t.status} /></TableCell>
                            <TableCell>
                              <ProgressMeter value={t.progress_pct} />
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {t.planned_end ? (
                                <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                                  <Calendar className="h-3.5 w-3.5" />
                                  {t.planned_end}
                                </span>
                              ) : DASH}
                            </TableCell>
                            <TableCell className="text-right text-sm font-medium tabular-nums">{t.estimated_hours ?? 0}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kanban" className="mt-0">
          {loading ? (
            <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-[360px] rounded-lg" />)}
            </div>
          ) : filtered.length === 0 ? (
            <Card className="shadow-card">
              <EmptyState activeFilterCount={activeFilterCount} />
            </Card>
          ) : (
            <div className="overflow-x-auto pb-2">
              <div className="grid min-w-[1080px] grid-cols-6 gap-3">
                {KANBAN_COLUMNS.map((col) => {
                  const items = filtered.filter((t) => t.status === col);
                  return (
                    <section key={col} className="min-h-[420px] rounded-lg border bg-muted/35 p-2.5">
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <StatusBadge status={col} />
                        <span className="rounded-full bg-card px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground shadow-sm">
                          {items.length}
                        </span>
                      </div>
                      <div className="space-y-2.5">
                        {items.length === 0 ? (
                          <div className="rounded-md border border-dashed bg-card/60 p-4 text-center text-xs text-muted-foreground">
                            No tasks
                          </div>
                        ) : items.map((t) => {
                          const unread = unreadByTaskId.get(t.id) ?? 0;
                          return (
                            <Link
                              key={t.id}
                              to={`/tasks/${t.id}`}
                              className={cn(
                                "relative block rounded-md border bg-card p-3 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-elevated",
                                unread > 0 && "border-destructive/40 ring-1 ring-destructive/20",
                              )}
                            >
                              {unread > 0 && (
                                <UnreadBadge count={unread} className="absolute -right-1.5 -top-1.5 shadow" />
                              )}
                              <div className="line-clamp-3 text-sm font-medium leading-snug">{t.title}</div>
                              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                <PriorityPill priority={t.priority} compact />
                                {t.department ? (
                                  <DepartmentBadge department={t.department} size="xs" />
                                ) : (
                                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                                    {TASK_TYPE_LABELS[t.task_type]}
                                  </span>
                                )}
                              </div>
                              {t.location_zone && (
                                <div className="mt-2 line-clamp-2 text-xs text-muted-foreground">{t.location_zone}</div>
                              )}
                              <div className="mt-3">
                                <ProgressMeter value={t.progress_pct} compact />
                              </div>
                              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                                <span className="inline-flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {t.planned_end || DASH}
                                </span>
                                <span className="tabular-nums">{t.estimated_hours ?? 0}h</span>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </section>
                  );
                })}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  tone = "default",
  loading,
}: {
  label: string;
  value: number;
  icon: ComponentType<{ className?: string }>;
  tone?: "default" | "info" | "risk" | "warning" | "success" | "accent";
  loading: boolean;
}) {
  const toneClass = {
    default: "bg-primary/10 text-primary",
    info: "bg-info-soft text-info",
    risk: "bg-destructive-soft text-destructive",
    warning: "bg-warning-soft text-warning",
    success: "bg-success-soft text-success",
    accent: "bg-accent-soft text-accent-soft-foreground",
  }[tone];

  return (
    <Card className="shadow-card">
      <CardContent className="flex items-center justify-between gap-3 p-4">
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
          {loading ? (
            <Skeleton className="mt-2 h-7 w-14" />
          ) : (
            <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
          )}
        </div>
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-md", toneClass)}>
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

function PriorityPill({ priority, compact = false }: { priority: TaskPriority; compact?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        compact ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs",
        TASK_PRIORITY_TONE[priority],
      )}
    >
      {TASK_PRIORITY_LABELS[priority]}
    </span>
  );
}

function ProgressMeter({ value, compact = false }: { value: number; compact?: boolean }) {
  const safeValue = Math.min(Math.max(value ?? 0, 0), 100);

  return (
    <div className={cn("flex items-center", compact ? "gap-2" : "gap-2.5")}>
      <div className={cn("flex-1 overflow-hidden rounded-full bg-muted", compact ? "h-1.5" : "h-2")}>
        <div className="h-full rounded-full bg-primary" style={{ width: `${safeValue}%` }} />
      </div>
      <span className={cn("text-right tabular-nums text-muted-foreground", compact ? "w-8 text-[10px]" : "w-9 text-xs")}>
        {safeValue}%
      </span>
    </div>
  );
}

function UnreadBadge({ count, className }: { count: number; className?: string }) {
  return (
    <span
      aria-label={`${count} new`}
      className={cn(
        "inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-destructive-foreground",
        className,
      )}
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}

function EmptyState({ activeFilterCount }: { activeFilterCount: number }) {
  return (
    <div className="flex min-h-[260px] items-center justify-center p-10 text-center">
      <div>
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <Inbox className="h-5 w-5" />
        </div>
        <h2 className="mt-4 text-base font-semibold">
          {activeFilterCount > 0 ? "No tasks match your filters" : "No tasks yet"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {activeFilterCount > 0
            ? "Adjust the search or filter selections to widen the task list."
            : "Create a task to start tracking work for this project."}
        </p>
      </div>
    </div>
  );
}
