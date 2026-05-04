import { useEffect, useState, useCallback, useMemo, type ComponentType } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProjects } from "@/contexts/ProjectContext";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/StatusBadge";
import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog";
import { DisciplineMetaFields } from "@/components/tasks/DisciplineMetaFields";
import {
  TaskStatus, TaskPriority, TaskType,
  TASK_PRIORITY_LABELS, TASK_PRIORITY_TONE, TASK_TYPE_LABELS,
  KANBAN_COLUMNS, TASK_STATUS_LABELS,
} from "@/lib/taskMeta";
import {
  TaskWorkflowType, TaskCategory,
  TASK_WORKFLOW_LABELS, TASK_CATEGORY_LABELS, CATEGORIES_BY_WORKFLOW,
} from "@/lib/taskCategoryMeta";
import {
  AlertTriangle,
  Bell,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Edit3,
  Inbox,
  LayoutGrid,
  Loader2,
  List,
  MoreHorizontal,
  Trash2,
  Search,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTaskUnread } from "@/hooks/useTaskUnread";
import { Department, DEPARTMENT_LABELS, DEPT_INITIAL_STAGE } from "@/lib/departmentMeta";
import { DepartmentBadge } from "@/components/DepartmentBadge";
import { toast } from "sonner";
import { WbsNodePicker } from "@/components/wbs/WbsNodePicker";
import { WbsTreeNode } from "@/lib/wbsMeta";
import type { Json } from "@/integrations/supabase/types";

interface TaskRow {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  task_type: TaskType;
  location_zone: string | null;
  planned_start: string | null;
  planned_end: string | null;
  estimated_hours: number | null;
  progress_pct: number;
  department: Department | null;
  discipline_meta: Json;
  workflow_type: TaskWorkflowType | null;
  category: TaskCategory | null;
  wbs_node_id: string | null;
  task_assignments?: TaskAssignmentLite[];
}

interface TaskAssignmentLite {
  user_id: string;
  unassigned_at: string | null;
}

type EditTaskForm = {
  title: string;
  description: string;
  task_type: TaskType;
  priority: TaskPriority;
  department: Department | "";
  meta: Record<string, string>;
  workflow_type: TaskWorkflowType | "";
  category: TaskCategory | "";
  wbs_node_id: string | null;
  wbs_path: string;
  planned_start: string;
  planned_end: string;
  estimated_hours: string;
  progress_pct: string;
};

const DASH = "-";

export default function Tasks() {
  const { user, roles } = useAuth();
  const { activeProject } = useProjects();
  const { unreadByTaskId } = useTaskUnread();
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingAction, setSavingAction] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskRow | null>(null);
  const [deletingTask, setDeletingTask] = useState<TaskRow | null>(null);
  const [editForm, setEditForm] = useState<EditTaskForm>({
    title: "",
    description: "",
    task_type: "other",
    priority: "medium",
    department: "",
    meta: {},
    workflow_type: "",
    category: "",
    wbs_node_id: null,
    wbs_path: "",
    planned_start: "",
    planned_end: "",
    estimated_hours: "0",
    progress_pct: "0",
  });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "all">("all");
  const [deptFilter, setDeptFilter] = useState<Department | "all">("all");

  const canPlan = roles.some((r) =>
    ["admin", "project_manager", "engineer", "supervisor"].includes(r),
  );
  const canDeleteTasks = roles.some((r) => ["admin", "project_manager"].includes(r));

  const load = useCallback(async () => {
    if (!activeProject) {
      setTasks([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("tasks")
      .select("id, title, description, status, priority, task_type, location_zone, planned_start, planned_end, estimated_hours, progress_pct, department, discipline_meta, workflow_type, category, wbs_node_id, task_assignments(user_id, unassigned_at)")
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

  const isAssignedToMe = (task: TaskRow) =>
    !!user && (task.task_assignments ?? []).some(
      (assignment) => assignment.user_id === user.id && !assignment.unassigned_at,
    );

  const canEditTask = (task: TaskRow) => canPlan || isAssignedToMe(task);

  const openEditTask = (task: TaskRow) => {
    setEditingTask(task);
    setEditForm({
      title: task.title,
      description: task.description ?? "",
      task_type: task.task_type,
      priority: task.priority,
      department: task.department ?? "",
      meta: isStringRecord(task.discipline_meta) ? task.discipline_meta : {},
      workflow_type: task.workflow_type ?? "",
      category: task.category ?? "",
      wbs_node_id: task.wbs_node_id,
      wbs_path: task.location_zone ?? "",
      planned_start: task.planned_start ?? "",
      planned_end: task.planned_end ?? "",
      estimated_hours: String(task.estimated_hours ?? 0),
      progress_pct: String(task.progress_pct ?? 0),
    });
  };

  const updateEditPlannedHours = (start: string, end: string) => {
    setEditForm((prev) => {
      if (!start || !end) {
        return { ...prev, planned_start: start, planned_end: end, estimated_hours: "" };
      }

      const startDate = new Date(`${start}T00:00:00Z`);
      const endDate = new Date(`${end}T00:00:00Z`);
      const diffDays = Math.floor((endDate.getTime() - startDate.getTime()) / 86_400_000) + 1;

      return {
        ...prev,
        planned_start: start,
        planned_end: end,
        estimated_hours: diffDays > 0 ? String(diffDays * 8) : "",
      };
    });
  };

  const saveTaskEdit = async () => {
    if (!editingTask) return;
    const title = editForm.title.trim();
    const estimatedHours = Number(editForm.estimated_hours || 0);
    const progressPct = Number(editForm.progress_pct || 0);

    if (title.length < 2) {
      toast.error("Task title must be at least 2 characters");
      return;
    }
    if (!Number.isFinite(estimatedHours) || estimatedHours < 0) {
      toast.error("Estimated hours must be zero or greater");
      return;
    }
    if (!Number.isInteger(progressPct) || progressPct < 0 || progressPct > 100) {
      toast.error("Progress must be a whole number from 0 to 100");
      return;
    }
    if (canPlan) {
      if (!editForm.wbs_node_id || !editForm.wbs_path) {
        toast.error("Pick a WBS location for this task");
        return;
      }
      if (!editForm.department) {
        toast.error("Pick a department for this task");
        return;
      }
      if (!editForm.workflow_type) {
        toast.error("Pick a Task Type (workflow)");
        return;
      }
      if (!editForm.category) {
        toast.error("Pick a Task Category");
        return;
      }
    }

    setSavingAction(true);
    const limitedPatch = {
      title,
      description: editForm.description.trim() || null,
      priority: editForm.priority,
      planned_start: editForm.planned_start || null,
      planned_end: editForm.planned_end || null,
      estimated_hours: estimatedHours,
      progress_pct: progressPct,
    };
    const plannerPatch = {
      ...limitedPatch,
      task_type: editForm.task_type,
      wbs_node_id: editForm.wbs_node_id,
      location_zone: editForm.wbs_path,
      department: editForm.department || null,
      dept_status: editForm.department ? DEPT_INITIAL_STAGE[editForm.department] : null,
      discipline_meta: editForm.meta,
      workflow_type: editForm.workflow_type || null,
      category: editForm.category || null,
    };

    const result = canPlan
      ? await supabase.from("tasks").update(plannerPatch).eq("id", editingTask.id)
      : await supabase.rpc("update_assigned_task_limited", {
        _task_id: editingTask.id,
        _title: limitedPatch.title,
        _description: limitedPatch.description,
        _priority: limitedPatch.priority,
        _planned_start: limitedPatch.planned_start,
        _planned_end: limitedPatch.planned_end,
        _estimated_hours: limitedPatch.estimated_hours,
        _progress_pct: limitedPatch.progress_pct,
      });

    setSavingAction(false);
    if (result.error) {
      toast.error(result.error.message);
      return;
    }
    toast.success("Task updated");
    setEditingTask(null);
    await load();
  };

  const deleteTask = async () => {
    if (!deletingTask) return;
    setSavingAction(true);
    const { error } = await supabase.from("tasks").delete().eq("id", deletingTask.id);
    setSavingAction(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Task deleted");
    setDeletingTask(null);
    await load();
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
                        <TableHead className="w-[72px] text-right">Actions</TableHead>
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
                            <TableCell className="text-right">
                              <TaskActions
                                task={t}
                                canEdit={canEditTask(t)}
                                canDelete={canDeleteTasks}
                                onEdit={openEditTask}
                                onDelete={setDeletingTask}
                              />
                            </TableCell>
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

      <Dialog open={!!editingTask} onOpenChange={(open) => !open && setEditingTask(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit task</DialogTitle>
            <DialogDescription>
              Update this task using the same structure as the New Task form.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={editForm.title}
                maxLength={200}
                onChange={(event) => setEditForm((prev) => ({ ...prev, title: event.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                rows={3}
                maxLength={4000}
                onChange={(event) => setEditForm((prev) => ({ ...prev, description: event.target.value }))}
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label>Discipline Type</Label>
                <Select
                  value={editForm.task_type}
                  disabled={!canPlan}
                  onValueChange={(value) => setEditForm((prev) => ({ ...prev, task_type: value as TaskType }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(TASK_TYPE_LABELS) as TaskType[]).map((type) => (
                      <SelectItem key={type} value={type}>{TASK_TYPE_LABELS[type]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Priority</Label>
                <Select
                  value={editForm.priority}
                  onValueChange={(value) => setEditForm((prev) => ({ ...prev, priority: value as TaskPriority }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(TASK_PRIORITY_LABELS) as TaskPriority[]).map((priority) => (
                      <SelectItem key={priority} value={priority}>{TASK_PRIORITY_LABELS[priority]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Department</Label>
              <Select
                value={editForm.department}
                disabled={!canPlan}
                onValueChange={(value) => {
                  setEditForm((prev) => ({
                    ...prev,
                    department: value as Department,
                    meta: prev.department === value ? prev.meta : {},
                  }));
                }}
              >
                <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(DEPARTMENT_LABELS) as Department[]).map((department) => (
                    <SelectItem key={department} value={department}>{DEPARTMENT_LABELS[department]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {editForm.department && (
              <fieldset disabled={!canPlan} className={!canPlan ? "opacity-70" : ""}>
                <DisciplineMetaFields
                  department={editForm.department}
                  value={editForm.meta}
                  onChange={(meta) => setEditForm((prev) => ({ ...prev, meta }))}
                />
              </fieldset>
            )}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label>Task Type</Label>
                <Select
                  value={editForm.workflow_type}
                  disabled={!canPlan}
                  onValueChange={(value) => {
                    setEditForm((prev) => ({
                      ...prev,
                      workflow_type: value as TaskWorkflowType,
                      category: "",
                    }));
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="Select task type" /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(TASK_WORKFLOW_LABELS) as TaskWorkflowType[]).map((workflowType) => (
                      <SelectItem key={workflowType} value={workflowType}>{TASK_WORKFLOW_LABELS[workflowType]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Task Category</Label>
                <Select
                  value={editForm.category}
                  disabled={!canPlan || !editForm.workflow_type}
                  onValueChange={(value) => setEditForm((prev) => ({ ...prev, category: value as TaskCategory }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={editForm.workflow_type ? "Select category" : "Pick task type first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {editForm.workflow_type &&
                      CATEGORIES_BY_WORKFLOW[editForm.workflow_type].map((category) => (
                        <SelectItem key={category} value={category}>{TASK_CATEGORY_LABELS[category]}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>WBS location</Label>
              {activeProject && canPlan ? (
                <WbsNodePicker
                  projectId={activeProject.id}
                  value={editForm.wbs_node_id}
                  onChange={(id, node: WbsTreeNode | null) => {
                    setEditForm((prev) => ({
                      ...prev,
                      wbs_node_id: id,
                      wbs_path: node?.path_text ?? prev.wbs_path,
                    }));
                  }}
                  required
                />
              ) : (
                <Input value={editForm.wbs_path || DASH} readOnly className="bg-muted/60" />
              )}
              {editForm.wbs_path && (
                <p className="mt-1 font-mono text-[11px] text-muted-foreground">{editForm.wbs_path}</p>
              )}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <Label htmlFor="edit-planned-start">Planned start</Label>
                <Input
                  id="edit-planned-start"
                  type="date"
                  value={editForm.planned_start}
                  onChange={(event) => updateEditPlannedHours(event.target.value, editForm.planned_end)}
                />
              </div>
              <div>
                <Label htmlFor="edit-planned-end">Planned end</Label>
                <Input
                  id="edit-planned-end"
                  type="date"
                  value={editForm.planned_end}
                  onChange={(event) => updateEditPlannedHours(editForm.planned_start, event.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="edit-estimated-hours">Est. hours</Label>
                <Input
                  id="edit-estimated-hours"
                  type="number"
                  min="0"
                  step="0.5"
                  value={editForm.estimated_hours}
                  readOnly
                  className="bg-muted/60"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-progress">Progress %</Label>
              <Input
                id="edit-progress"
                type="number"
                min="0"
                max="100"
                step="1"
                value={editForm.progress_pct}
                onChange={(event) => setEditForm((prev) => ({ ...prev, progress_pct: event.target.value }))}
              />
            </div>
            {!canPlan && (
              <p className="text-xs text-muted-foreground">
                Some planning fields are locked for assignees. Managers can edit the full task setup.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditingTask(null)} disabled={savingAction}>
              Cancel
            </Button>
            <Button type="button" onClick={saveTaskEdit} disabled={savingAction}>
              {savingAction && <Loader2 className="h-4 w-4 animate-spin" />}
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingTask} onOpenChange={(open) => !open && setDeletingTask(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete task?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deletingTask?.title}". Related assignments and task updates are removed by the database cascade.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={savingAction}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={savingAction}
              onClick={(event) => {
                event.preventDefault();
                deleteTask();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {savingAction && <Loader2 className="h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function TaskActions({
  task,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: {
  task: TaskRow;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (task: TaskRow) => void;
  onDelete: (task: TaskRow) => void;
}) {
  if (!canEdit && !canDelete) {
    return <span className="text-muted-foreground">{DASH}</span>;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open task actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        {canEdit && (
          <DropdownMenuItem onClick={() => onEdit(task)}>
            <Edit3 className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
        )}
        {canDelete && (
          <DropdownMenuItem
            onClick={() => onDelete(task)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function isStringRecord(value: Json): value is Record<string, string> {
  return !!value && !Array.isArray(value) && typeof value === "object" &&
    Object.values(value).every((item) => typeof item === "string");
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
