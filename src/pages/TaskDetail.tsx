import * as React from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import { StatusBadge } from "@/components/StatusBadge";
import {
  TaskStatus, TaskPriority, TaskType,
  TASK_PRIORITY_LABELS, TASK_PRIORITY_TONE, TASK_TYPE_LABELS, TASK_STATUS_LABELS,
  ALLOWED_TRANSITIONS,
} from "@/lib/taskMeta";
import {
  ArrowLeft, Calendar, MapPin, Clock, AlertTriangle, Loader2, UserPlus, Send,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useTaskUnread } from "@/hooks/useTaskUnread";
import { Department } from "@/lib/departmentMeta";
import { DepartmentBadge } from "@/components/DepartmentBadge";
import { TaskQaQcTab } from "@/components/qaqc/TaskQaQcTab";
import { TaskMaterialsTab } from "@/components/procurement/TaskMaterialsTab";
import { TaskFinancialsTab } from "@/components/financials/TaskFinancialsTab";
import type { TablesUpdate } from "@/integrations/supabase/types";

interface Task {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  task_type: TaskType;
  location_zone: string | null;
  planned_start: string | null;
  planned_end: string | null;
  actual_start: string | null;
  actual_end: string | null;
  estimated_hours: number | null;
  actual_hours: number | null;
  progress_pct: number;
  created_at: string;
  rejection_reason: string | null;
  department: Department | null;
}

interface Assignment {
  id: string;
  user_id: string;
  assigned_at: string;
  unassigned_at: string | null;
}

interface TaskUpdate {
  id: string;
  user_id: string;
  progress_pct: number | null;
  hours_worked: number | null;
  note: string | null;
  is_blocker: boolean;
  created_at: string;
}

interface ProfileLite {
  id: string;
  full_name: string;
  job_title: string | null;
}

export default function TaskDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, roles } = useAuth();
  const { markTaskRead } = useTaskUnread();
  const [task, setTask] = React.useState<Task | null>(null);
  const [assignments, setAssignments] = React.useState<Assignment[]>([]);
  const [updates, setUpdates] = React.useState<TaskUpdate[]>([]);
  const [profiles, setProfiles] = React.useState<Record<string, ProfileLite>>({});
  const [loading, setLoading] = React.useState(true);
  const [transitioning, setTransitioning] = React.useState(false);
  const [rejecting, setRejecting] = React.useState(false);
  const [rejectReason, setRejectReason] = React.useState("");
  const [posting, setPosting] = React.useState(false);

  // Auto-clear unread task notifications when this detail page opens
  React.useEffect(() => {
    if (id) markTaskRead(id);
  }, [id, markTaskRead]);

  const canPlan = roles.some((r) =>
    ["admin", "project_manager", "engineer", "supervisor"].includes(r),
  );
  const canApprove = roles.some((r) =>
    ["admin", "project_manager", "supervisor", "qaqc_inspector"].includes(r),
  );

  const isAssignedToMe = !!user && assignments.some(
    (a) => a.user_id === user.id && !a.unassigned_at,
  );

  const load = React.useCallback(async (showLoading = true) => {
    if (!id) return;
    if (showLoading) setLoading(true);
    const [taskRes, asgRes, updRes] = await Promise.all([
      supabase.from("tasks").select("*").eq("id", id).maybeSingle(),
      supabase.from("task_assignments").select("*").eq("task_id", id),
      supabase.from("task_updates").select("*").eq("task_id", id).order("created_at", { ascending: false }),
    ]);
    if (taskRes.error || !taskRes.data) {
      toast.error("Task not found");
      setLoading(false);
      return;
    }
    setTask(taskRes.data as Task);
    setAssignments((asgRes.data ?? []) as Assignment[]);
    setUpdates((updRes.data ?? []) as TaskUpdate[]);

    // Load profiles for everyone involved
    const ids = new Set<string>();
    ((asgRes.data ?? []) as Assignment[]).forEach((a) => ids.add(a.user_id));
    ((updRes.data ?? []) as TaskUpdate[]).forEach((u) => ids.add(u.user_id));
    if (ids.size > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, full_name, job_title")
        .in("id", Array.from(ids));
      const map: Record<string, ProfileLite> = {};
      (profs ?? []).forEach((p) => { map[p.id] = p as ProfileLite; });
      setProfiles(map);
    }
    if (showLoading) setLoading(false);
  }, [id]);

  React.useEffect(() => { load(); }, [load]);

  const transitionTo = async (next: TaskStatus, reason?: string) => {
    if (!task) return;
    setTransitioning(true);
    const patch: TablesUpdate<"tasks"> = { status: next };
    if (next === "rejected" && reason) patch.rejection_reason = reason;
    if (next === "in_progress" && !task.actual_start) patch.actual_start = new Date().toISOString();
    if (next === "completed") {
      patch.actual_end = new Date().toISOString();
      patch.progress_pct = 100;
    }
    const { error } = await supabase.from("tasks").update(patch).eq("id", task.id);
    setTransitioning(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Status updated to ${TASK_STATUS_LABELS[next]}`);
    await load();
  };

  const postUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!task || !user) return;
    const fd = new FormData(e.currentTarget);
    const note = String(fd.get("note") || "").trim();
    const hours = Number(fd.get("hours") || 0);
    const progress = Number(fd.get("progress") || task.progress_pct);
    const blocker = fd.get("blocker") === "on";

    if (!note && !hours && progress === task.progress_pct) {
      toast.error("Add a note, hours, or progress change");
      return;
    }

    setPosting(true);
    const { data: updatedTask, error } = await supabase.rpc("post_task_progress_update", {
      _task_id: task.id,
      _progress_pct: progress,
      _hours_worked: hours,
      _note: note,
      _is_blocker: blocker,
    });
    setPosting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setTask(updatedTask as Task);
    toast.success("Update posted");
    (e.currentTarget as HTMLFormElement).reset();
    await load(false);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!task) {
    return <div className="text-muted-foreground">Task not found.</div>;
  }

  const allowedNext = ALLOWED_TRANSITIONS[task.status];
  const activeAssignees = assignments.filter((a) => !a.unassigned_at);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
          <Link to="/tasks"><ArrowLeft className="h-4 w-4" /> Back to tasks</Link>
        </Button>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold">{task.title}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <StatusBadge status={task.status} />
              <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", TASK_PRIORITY_TONE[task.priority])}>
                {TASK_PRIORITY_LABELS[task.priority]}
              </span>
              <Badge variant="secondary">{TASK_TYPE_LABELS[task.task_type]}</Badge>
              {task.department && <DepartmentBadge department={task.department} />}
            </div>
          </div>

          {/* Status transitions */}
          {allowedNext.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {allowedNext.map((next) => {
                const isApproval = next === "approved" || next === "rejected";
                if (isApproval && !canApprove) return null;
                if (!isApproval && !canPlan && !isAssignedToMe) return null;

                if (next === "rejected") {
                  return (
                    <Dialog key={next} open={rejecting} onOpenChange={setRejecting}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="border-destructive text-destructive hover:bg-destructive-soft">
                          Reject
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Reject task</DialogTitle>
                        </DialogHeader>
                        <Textarea
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="Reason for rejection..."
                          maxLength={1000}
                          rows={4}
                        />
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setRejecting(false)}>Cancel</Button>
                          <Button
                            variant="destructive"
                            disabled={!rejectReason.trim() || transitioning}
                            onClick={async () => {
                              await transitionTo("rejected", rejectReason.trim());
                              setRejecting(false);
                              setRejectReason("");
                            }}
                          >
                            Reject task
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  );
                }

                return (
                  <Button
                    key={next}
                    size="sm"
                    variant={next === "approved" || next === "completed" ? "default" : "outline"}
                    disabled={transitioning}
                    onClick={() => transitionTo(next)}
                  >
                    {transitioning && <Loader2 className="h-3 w-3 animate-spin" />}
                    Move to {TASK_STATUS_LABELS[next]}
                  </Button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {task.rejection_reason && task.status === "rejected" && (
        <Card className="border-destructive">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <div className="font-medium text-destructive">Rejected</div>
              <div className="text-sm text-muted-foreground">{task.rejection_reason}</div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="qaqc">QA / QC</TabsTrigger>
              <TabsTrigger value="materials">Materials</TabsTrigger>
              <TabsTrigger value="financials">Financials</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {task.description || <span className="text-muted-foreground italic">No description</span>}
                  </p>
                </CardContent>
              </Card>

              {/* Post update */}
              {(isAssignedToMe || canPlan) && !["completed", "closed"].includes(task.status) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Post an update</CardTitle>
                    <CardDescription>Log progress, hours, or report a blocker.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={postUpdate} className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="progress">Progress %</Label>
                          <Input
                            id="progress" name="progress" type="number" min={0} max={100}
                            key={`progress-${task.progress_pct}`}
                            defaultValue={task.progress_pct}
                          />
                        </div>
                        <div>
                          <Label htmlFor="hours">Hours worked</Label>
                          <Input id="hours" name="hours" type="number" min={0} step="0.25" defaultValue={0} />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="note">Note</Label>
                        <Textarea id="note" name="note" rows={2} maxLength={2000} placeholder="Progress notes, photos coming next..." />
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Checkbox id="blocker" name="blocker" />
                          <span>Flag as blocker</span>
                        </label>
                        <Button type="submit" disabled={posting}>
                          {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                          Post update
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              {/* Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Activity</CardTitle>
                  <CardDescription>{updates.length} update{updates.length === 1 ? "" : "s"}</CardDescription>
                </CardHeader>
                <CardContent>
                  {updates.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4">No updates yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {updates.map((u) => {
                        const p = profiles[u.user_id];
                        return (
                          <div key={u.id} className="flex gap-3">
                            <Avatar className="h-8 w-8 shrink-0">
                              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                {(p?.full_name || "?").split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-baseline gap-2">
                                <span className="font-medium text-sm">{p?.full_name || "Unknown"}</span>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(u.created_at), "MMM d, h:mm a")}
                                </span>
                                {u.is_blocker && (
                                  <Badge variant="secondary" className="bg-destructive-soft text-destructive">
                                    <AlertTriangle className="h-3 w-3" /> Blocker
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-foreground mt-1">
                                {u.note || <span className="italic text-muted-foreground">No note</span>}
                              </div>
                              <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                                {u.progress_pct !== null && <span>Progress: {u.progress_pct}%</span>}
                                {u.hours_worked ? <span>+{u.hours_worked}h</span> : null}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="qaqc">
              <TaskQaQcTab taskId={task.id} />
            </TabsContent>

            <TabsContent value="materials" className="mt-4">
              <TaskMaterialsTab taskId={task.id} projectId={task.project_id} />
            </TabsContent>
            
            <TabsContent value="financials" className="mt-4">
              <TaskFinancialsTab taskId={task.id} projectId={task.project_id} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Side column */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <DetailRow icon={<Calendar />} label="Planned">
                {task.planned_start || "?"} → {task.planned_end || "?"}
              </DetailRow>
              <DetailRow icon={<MapPin />} label="Location">
                {task.location_zone || "—"}
              </DetailRow>
              <DetailRow icon={<Clock />} label="Hours">
                {task.actual_hours ?? 0} / {task.estimated_hours ?? 0} estimated
              </DetailRow>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Progress</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${task.progress_pct}%` }} />
                  </div>
                  <span className="num text-sm font-medium">{task.progress_pct}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <AssignmentsCard
            taskId={task.id}
            assignments={activeAssignees}
            profiles={profiles}
            canAssign={canPlan}
            onChange={load}
          />
        </div>
      </div>
    </div>
  );
}

function DetailRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <div className="h-4 w-4 text-muted-foreground mt-0.5 [&_svg]:h-4 [&_svg]:w-4">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div>{children}</div>
      </div>
    </div>
  );
}

function AssignmentsCard({
  taskId, assignments, profiles, canAssign, onChange,
}: {
  taskId: string;
  assignments: Assignment[];
  profiles: Record<string, ProfileLite>;
  canAssign: boolean;
  onChange: () => void;
}) {
  const { user } = useAuth();
  const [open, setOpen] = React.useState(false);
  const [allUsers, setAllUsers] = React.useState<ProfileLite[]>([]);
  const [picked, setPicked] = React.useState<string>("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    supabase.from("profiles").select("id, full_name, job_title").order("full_name").then(({ data }) => {
      setAllUsers((data ?? []) as ProfileLite[]);
    });
  }, [open]);

  const assignedIds = new Set(assignments.map((a) => a.user_id));

  const assign = async () => {
    if (!picked) return;
    setSaving(true);
    const { error } = await supabase.from("task_assignments").insert({
      task_id: taskId,
      user_id: picked,
      assigned_by: user?.id,
    });
    if (!error) {
      // bump task to assigned if currently open
      await supabase
        .from("tasks")
        .update({ status: "assigned" })
        .eq("id", taskId)
        .eq("status", "open");
    }
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Assigned");
    setOpen(false);
    setPicked("");
    onChange();
  };

  const unassign = async (assignmentId: string) => {
    const { error } = await supabase
      .from("task_assignments")
      .update({ unassigned_at: new Date().toISOString() })
      .eq("id", assignmentId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Unassigned");
    onChange();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Assignees</CardTitle>
          <CardDescription>{assignments.length} assigned</CardDescription>
        </div>
        {canAssign && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline"><UserPlus className="h-4 w-4" /></Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign team member</DialogTitle>
              </DialogHeader>
              <Select value={picked} onValueChange={setPicked}>
                <SelectTrigger><SelectValue placeholder="Select a person..." /></SelectTrigger>
                <SelectContent>
                  {allUsers
                    .filter((u) => !assignedIds.has(u.id))
                    .map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.full_name}{u.job_title ? ` · ${u.job_title}` : ""}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={assign} disabled={!picked || saving}>
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Assign
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        {assignments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No one assigned yet.</p>
        ) : (
          <div className="space-y-2">
            {assignments.map((a) => {
              const p = profiles[a.user_id];
              return (
                <div key={a.id} className="flex items-center gap-2">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-primary text-primary-foreground text-[10px]">
                      {(p?.full_name || "?").split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{p?.full_name || a.user_id.slice(0, 8)}</div>
                    {p?.job_title && <div className="text-xs text-muted-foreground truncate">{p.job_title}</div>}
                  </div>
                  {canAssign && (
                    <Button size="sm" variant="ghost" onClick={() => unassign(a.id)}>
                      Remove
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
