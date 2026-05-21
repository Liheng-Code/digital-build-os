import * as React from "react";
import { Link } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useProjects } from "@/contexts/ProjectContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/StatusBadge";
import { TimesheetStatusBadge } from "@/components/timesheets/TimesheetStatusBadge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  TaskStatus, TaskPriority, TaskType,
  TASK_PRIORITY_LABELS, TASK_PRIORITY_TONE, TASK_TYPE_LABELS,
} from "@/lib/taskMeta";
import { formatHours } from "@/lib/timesheetMeta";
import { CheckCheck, Clock, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useApprovalUnread } from "@/hooks/useApprovalUnread";

interface Pending {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  task_type: TaskType;
  progress_pct: number;
  estimated_hours: number | null;
  actual_hours: number | null;
  updated_at: string;
}

interface PendingTimesheet {
  id: string;
  user_id: string;
  work_date: string;
  regular_hours: number;
  overtime_hours: number;
  notes: string | null;
  project_id: string;
  flags: { type: string; message: string }[];
  profile?: { full_name: string; employee_id: string | null };
  project?: { code: string };
}

export default function Approvals() {
  const { activeProject, projects } = useProjects();
  const { roles } = useAuth();
  const [tab, setTab] = React.useState("tasks");
  const {
    taskApprovalCount,
    timesheetApprovalCount,
  } = useApprovalUnread();

  // Tasks
  const [items, setItems] = React.useState<Pending[]>([]);
  const [loadingTasks, setLoadingTasks] = React.useState(true);
  const [busy, setBusy] = React.useState<string | null>(null);

  // Timesheets
  const [tsItems, setTsItems] = React.useState<PendingTimesheet[]>([]);
  const [loadingTs, setLoadingTs] = React.useState(true);
  const [tsBusy, setTsBusy] = React.useState<string | null>(null);
  const [rejectingId, setRejectingId] = React.useState<string | null>(null);
  const [rejectReason, setRejectReason] = React.useState("");

  const canApprove = roles.some((r) =>
    ["admin", "project_manager", "supervisor", "qaqc_inspector"].includes(r),
  );
  const canApproveTs = roles.some((r) => ["admin", "project_manager", "supervisor"].includes(r));

  const loadTasks = React.useCallback(async () => {
    if (!activeProject) { setItems([]); setLoadingTasks(false); return; }
    setLoadingTasks(true);
    const { data } = await supabase
      .from("tasks")
      .select("id, title, status, priority, task_type, progress_pct, estimated_hours, actual_hours, updated_at")
      .eq("project_id", activeProject.id)
      .eq("status", "pending_approval")
      .order("updated_at", { ascending: true });
    setItems((data ?? []) as Pending[]);
    setLoadingTasks(false);
  }, [activeProject]);

  const loadTimesheets = React.useCallback(async () => {
    setLoadingTs(true);
    const { data } = await supabase
      .from("timesheet_entries")
      .select("id, user_id, work_date, regular_hours, overtime_hours, notes, project_id, flags")
      .eq("status", "submitted")
      .order("work_date", { ascending: true });
    const userIds = Array.from(new Set((data ?? []).map((t) => t.user_id)));
    const profilesRes = userIds.length
      ? await supabase.from("profiles").select("id, full_name, employee_id").in("id", userIds)
      : { data: [] };
    const profMap = new Map((profilesRes.data ?? []).map((p) => [p.id, p]));
    const projMap = new Map(projects.map((p) => [p.id, p]));
    setTsItems(((data ?? []) as unknown as PendingTimesheet[]).map((t) => ({
      ...t,
      profile: profMap.get(t.user_id),
      project: projMap.get(t.project_id),
    })));
    setLoadingTs(false);
  }, [projects]);

  React.useEffect(() => { loadTasks(); }, [loadTasks]);
  React.useEffect(() => { loadTimesheets(); }, [loadTimesheets]);

  // NOTE: We intentionally do NOT auto-mark approval notifications as read
  // when a tab is opened — the sidebar "Approvals" badge and tab badges
  // should persist as a visible reminder until the approver actually acts on
  // the items (approve/reject) or clears them from the notification bell.

  const approve = async (id: string) => {
    setBusy(id);
    const { error } = await supabase.from("tasks").update({ status: "approved" }).eq("id", id);
    setBusy(null);
    if (error) toast.error(error.message);
    else { toast.success("Approved"); loadTasks(); }
  };

  const approveAndComplete = async (id: string) => {
    setBusy(id);
    const { error: e1 } = await supabase.from("tasks").update({ status: "approved" }).eq("id", id);
    if (!e1) {
      await supabase.from("tasks").update({
        status: "completed", progress_pct: 100, actual_end: new Date().toISOString(),
      }).eq("id", id);
    }
    setBusy(null);
    if (e1) toast.error(e1.message);
    else { toast.success("Approved & completed"); loadTasks(); }
  };

  const approveTs = async (id: string) => {
    setTsBusy(id);
    const { error } = await supabase.from("timesheet_entries").update({ status: "approved" }).eq("id", id);
    setTsBusy(null);
    if (error) toast.error(error.message);
    else { toast.success("Timesheet approved"); loadTimesheets(); }
  };

  const rejectTs = async (id: string) => {
    if (!rejectReason.trim()) { toast.error("Reason required"); return; }
    setTsBusy(id);
    const { error } = await supabase
      .from("timesheet_entries")
      .update({ status: "rejected", rejection_reason: rejectReason })
      .eq("id", id);
    setTsBusy(null);
    if (error) toast.error(error.message);
    else {
      toast.success("Timesheet rejected");
      setRejectingId(null);
      setRejectReason("");
      loadTimesheets();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Approvals</h1>
        <p className="text-muted-foreground">Review pending tasks and timesheets</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="tasks">
            Tasks
            {taskApprovalCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-semibold leading-none">
                {taskApprovalCount > 9 ? "9+" : taskApprovalCount}
              </span>
            )}
            {taskApprovalCount === 0 && items.length > 0 && (
              <span className="ml-2 rounded-full bg-warning text-warning-foreground px-1.5 text-[10px]">{items.length}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="timesheets">
            Timesheets
            {timesheetApprovalCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-semibold leading-none">
                {timesheetApprovalCount > 9 ? "9+" : timesheetApprovalCount}
              </span>
            )}
            {timesheetApprovalCount === 0 && tsItems.length > 0 && (
              <span className="ml-2 rounded-full bg-warning text-warning-foreground px-1.5 text-[10px]">{tsItems.length}</span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="mt-4">
          {!activeProject ? (
            <Card><CardContent className="p-12 text-center text-muted-foreground">Select a project first.</CardContent></Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                {loadingTasks ? (
                  <div className="p-6 space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
                ) : items.length === 0 ? (
                  <div className="p-12 text-center">
                    <CheckCheck className="h-12 w-12 text-success mx-auto mb-2" />
                    <p className="font-medium">All caught up</p>
                    <p className="text-sm text-muted-foreground">No tasks pending approval.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Task</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Hours</TableHead>
                        <TableHead>Progress</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((t) => (
                        <TableRow key={t.id}>
                          <TableCell>
                            <Link to={`/tasks/${t.id}`} className="font-medium hover:text-primary">{t.title}</Link>
                            <div className="mt-1"><StatusBadge status={t.status} /></div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{TASK_TYPE_LABELS[t.task_type]}</TableCell>
                          <TableCell>
                            <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", TASK_PRIORITY_TONE[t.priority])}>
                              {TASK_PRIORITY_LABELS[t.priority]}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm">
                            <span className="inline-flex items-center gap-1 text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span className="num">{t.actual_hours ?? 0}</span> / <span className="num">{t.estimated_hours ?? 0}</span>
                            </span>
                          </TableCell>
                          <TableCell className="w-32">
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 bg-muted rounded-full overflow-hidden flex-1">
                                <div className="h-full bg-primary" style={{ width: `${t.progress_pct}%` }} />
                              </div>
                              <span className="text-xs num text-muted-foreground w-8 text-right">{t.progress_pct}%</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {canApprove ? (
                              <div className="flex justify-end gap-2">
                                <Button size="sm" variant="outline" disabled={busy === t.id} onClick={() => approve(t.id)}>
                                  {busy === t.id && <Loader2 className="h-3 w-3 animate-spin" />}
                                  Approve
                                </Button>
                                <Button size="sm" disabled={busy === t.id} onClick={() => approveAndComplete(t.id)}>
                                  Approve & complete
                                </Button>
                              </div>
                            ) : (
                              <Button size="sm" variant="ghost" asChild>
                                <Link to={`/tasks/${t.id}`}>Review</Link>
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="timesheets" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {loadingTs ? (
                <div className="p-6 space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : tsItems.length === 0 ? (
                <div className="p-12 text-center">
                  <CheckCheck className="h-12 w-12 text-success mx-auto mb-2" />
                  <p className="font-medium">All caught up</p>
                  <p className="text-sm text-muted-foreground">No timesheets pending review.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Employee</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead className="text-right">Reg</TableHead>
                      <TableHead className="text-right">OT</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tsItems.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">{format(parseISO(t.work_date), "MMM d")}</TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">{t.profile?.full_name ?? "—"}</div>
                          <div className="text-xs text-muted-foreground">{t.profile?.employee_id ?? ""}</div>
                        </TableCell>
                        <TableCell className="text-sm">{t.project?.code ?? "—"}</TableCell>
                        <TableCell className="text-right num">{formatHours(t.regular_hours)}</TableCell>
                        <TableCell className="text-right num text-warning">{formatHours(t.overtime_hours)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[280px] truncate">{t.notes || "—"}</TableCell>
                        <TableCell className="text-right">
                          {canApproveTs && (
                            rejectingId === t.id ? (
                              <div className="flex gap-1 justify-end">
                                <Input
                                  className="h-8 w-40"
                                  placeholder="Reason"
                                  value={rejectReason}
                                  onChange={(e) => setRejectReason(e.target.value)}
                                  autoFocus
                                />
                                <Button size="sm" variant="destructive" onClick={() => rejectTs(t.id)} disabled={tsBusy === t.id}>
                                  Confirm
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => { setRejectingId(null); setRejectReason(""); }}>
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex gap-2 justify-end">
                                <Button size="sm" variant="outline" onClick={() => setRejectingId(t.id)}>Reject</Button>
                                <Button size="sm" disabled={tsBusy === t.id} onClick={() => approveTs(t.id)}>
                                  {tsBusy === t.id && <Loader2 className="h-3 w-3 animate-spin" />}
                                  Approve
                                </Button>
                              </div>
                            )
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
