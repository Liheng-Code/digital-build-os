import * as React from "react";
import { Link } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { useQuery } from "@tanstack/react-query";
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
import { LEAVE_STATUS_LABELS, LEAVE_STATUS_TONE, type LeaveRequest } from "@/lib/hrMeta";
import { fetchPendingLeaveRequests, updateLeaveStatus } from "@/services/leaveService";
import { closeModuleApproval } from "@/services/moduleApprovalService";
import { updatePRStatus } from "@/services/procurementService";
import { updatePOStatus, type PurchaseOrder } from "@/services/poService";
import { updatePaymentRequestStatus } from "@/services/paymentService";
import {
  PAYMENT_REQUEST_STATUS_LABELS,
  PAYMENT_REQUEST_STATUS_TONE,
  type PaymentRequest
} from "@/lib/financialMeta";
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

interface PendingPr {
  id: string;
  pr_number: string;
  subject: string;
  total_estimate: number | null;
  status: string;
  created_at: string;
}

interface PendingPo {
  id: string;
  po_number: string;
  status: PurchaseOrder["status"];
  total_amount: number;
  currency: string | null;
  suppliers?: { name: string } | null;
}

export default function Approvals() {
  const { activeProject, projects } = useProjects();
  const { roles } = useAuth();
  const [tab, setTab] = React.useState("tasks");
  const {
    taskApprovalCount,
    timesheetApprovalCount,
  } = useApprovalUnread();

  const projectId = activeProject?.id ?? null;

  // Tasks
  const tasksQuery = useQuery({
    queryKey: ["approvals", "tasks", projectId],
    enabled: !!projectId,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("id, title, status, priority, task_type, progress_pct, estimated_hours, actual_hours, updated_at")
        .eq("project_id", projectId!)
        .eq("status", "pending_approval")
        .order("updated_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Pending[];
    },
  });
  const items = tasksQuery.data ?? [];
  const loadingTasks = tasksQuery.isLoading;
  const loadTasks = React.useCallback(() => { tasksQuery.refetch(); }, [tasksQuery]);
  const [busy, setBusy] = React.useState<string | null>(null);

  // Timesheets
  const projectsMapKey = React.useMemo(() => projects.map((p) => p.id).join(","), [projects]);
  const timesheetsQuery = useQuery({
    queryKey: ["approvals", "timesheets", projectsMapKey],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("timesheet_entries")
        .select("id, user_id, work_date, regular_hours, overtime_hours, notes, project_id, flags")
        .eq("status", "submitted")
        .order("work_date", { ascending: true });
      if (error) throw error;
      const userIds = Array.from(new Set((data ?? []).map((t) => t.user_id)));
      const profilesRes = userIds.length
        ? await supabase.from("profiles").select("id, full_name, employee_id").in("id", userIds)
        : { data: [] as { id: string; full_name: string; employee_id: string | null }[] };
      const profMap = new Map((profilesRes.data ?? []).map((p) => [p.id, p]));
      const projMap = new Map(projects.map((p) => [p.id, p]));
      return ((data ?? []) as unknown as PendingTimesheet[]).map((t) => ({
        ...t,
        profile: profMap.get(t.user_id),
        project: projMap.get(t.project_id),
      }));
    },
  });
  const tsItems = timesheetsQuery.data ?? [];
  const loadingTs = timesheetsQuery.isLoading;
  const loadTimesheets = React.useCallback(() => { timesheetsQuery.refetch(); }, [timesheetsQuery]);
  const [tsBusy, setTsBusy] = React.useState<string | null>(null);
  const [rejectingId, setRejectingId] = React.useState<string | null>(null);
  const [rejectReason, setRejectReason] = React.useState("");

  // Leave
  const leaveQuery = useQuery({
    queryKey: ["approvals", "leave"],
    staleTime: 60_000,
    queryFn: async () => {
      try {
        return await fetchPendingLeaveRequests();
      } catch {
        toast.error("Failed to load leave requests");
        return [] as LeaveRequest[];
      }
    },
  });
  const leaveItems = leaveQuery.data ?? [];
  const loadingLeave = leaveQuery.isLoading;
  const loadLeave = React.useCallback(() => { leaveQuery.refetch(); }, [leaveQuery]);
  const [leaveBusy, setLeaveBusy] = React.useState<string | null>(null);

  // Procurement / Finance
  const commercialQuery = useQuery({
    queryKey: ["approvals", "commercial", projectId],
    enabled: !!projectId,
    staleTime: 60_000,
    queryFn: async () => {
      const [prsRes, posRes, paymentsRes] = await Promise.all([
        supabase
          .from("purchase_requisitions")
          .select("id, pr_number, subject, total_estimate, status, created_at")
          .eq("project_id", projectId!)
          .eq("status", "submitted")
          .order("created_at", { ascending: true }),
        (supabase as any)
          .from("purchase_orders")
          .select("id, po_number, status, total_amount, currency, suppliers(name)")
          .eq("project_id", projectId!)
          .in("status", ["submitted", "review"])
          .order("created_at", { ascending: true }),
        (supabase as any)
          .from("payment_requests")
          .select("*")
          .eq("project_id", projectId!)
          .eq("status", "submitted")
          .order("created_at", { ascending: true })
      ]);
      return {
        prs: (prsRes.data ?? []) as PendingPr[],
        pos: (posRes.data ?? []) as unknown as PendingPo[],
        payments: (paymentsRes.data ?? []) as unknown as PaymentRequest[],
      };
    },
  });
  const prItems = commercialQuery.data?.prs ?? [];
  const poItems = commercialQuery.data?.pos ?? [];
  const paymentItems = commercialQuery.data?.payments ?? [];
  const loadingCommercial = commercialQuery.isLoading;
  const loadCommercial = React.useCallback(() => { commercialQuery.refetch(); }, [commercialQuery]);
  const [commercialBusy, setCommercialBusy] = React.useState<string | null>(null);

  const canApprove = roles.some((r) =>
    ["admin", "project_manager", "supervisor", "qaqc_inspector"].includes(r),
  );
  const canApproveTs = roles.some((r) => ["admin", "project_manager", "supervisor"].includes(r));
  const canApproveLeave = roles.some((r) => ["admin", "project_manager", "supervisor"].includes(r));
  const canApproveCommercial = roles.some((r) => ["admin", "project_manager", "supervisor", "accountant"].includes(r));


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
    const actorId = (await supabase.auth.getUser()).data.user?.id;
    setTsBusy(id);
    try {
      const { error } = await supabase.from("timesheet_entries").update({ status: "approved" }).eq("id", id);
      if (error) throw error;
      await closeModuleApproval({
        moduleCode: "HR",
        entityType: "timesheet_entry",
        entityId: id,
        actorId: actorId ?? null,
        decision: "approved"
      });
      toast.success("Timesheet approved");
      loadTimesheets();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to approve timesheet");
    } finally {
      setTsBusy(null);
    }
  };

  const rejectTs = async (id: string) => {
    if (!rejectReason.trim()) { toast.error("Reason required"); return; }
    setTsBusy(id);
    try {
      const { error } = await supabase
        .from("timesheet_entries")
        .update({ status: "rejected", rejection_reason: rejectReason })
        .eq("id", id);
      if (error) throw error;
      const actorId = (await supabase.auth.getUser()).data.user?.id;
      await closeModuleApproval({
        moduleCode: "HR",
        entityType: "timesheet_entry",
        entityId: id,
        actorId: actorId ?? null,
        decision: "rejected",
        comment: rejectReason
      });
      toast.success("Timesheet rejected");
      setRejectingId(null);
      setRejectReason("");
      loadTimesheets();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to reject timesheet");
    } finally {
      setTsBusy(null);
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
          <TabsTrigger value="leave">
            Leave
            {leaveItems.length > 0 && (
              <span className="ml-2 rounded-full bg-warning text-warning-foreground px-1.5 text-[10px]">{leaveItems.length}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="procurement">
            PR / PO
            {prItems.length + poItems.length > 0 && (
              <span className="ml-2 rounded-full bg-warning text-warning-foreground px-1.5 text-[10px]">{prItems.length + poItems.length}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="payments">
            Payments
            {paymentItems.length > 0 && (
              <span className="ml-2 rounded-full bg-warning text-warning-foreground px-1.5 text-[10px]">{paymentItems.length}</span>
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

        <TabsContent value="leave" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {loadingLeave ? (
                <div className="p-6 space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : leaveItems.length === 0 ? (
                <div className="p-12 text-center">
                  <CheckCheck className="h-12 w-12 text-success mx-auto mb-2" />
                  <p className="font-medium">All caught up</p>
                  <p className="text-sm text-muted-foreground">No leave requests pending approval.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Leave Type</TableHead>
                      <TableHead>Dates</TableHead>
                      <TableHead>Days</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaveItems.map((l) => (
                      <TableRow key={l.id}>
                        <TableCell className="font-medium">{l.profile?.full_name ?? "—"}</TableCell>
                        <TableCell className="text-sm">{l.leave_type?.name ?? "—"}</TableCell>
                        <TableCell className="text-sm">
                          {format(parseISO(l.start_date), "MMM d")} – {format(parseISO(l.end_date), "MMM d")}
                        </TableCell>
                        <TableCell className="num">{l.total_days}</TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{l.reason || "—"}</TableCell>
                        <TableCell>
                          <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", LEAVE_STATUS_TONE[l.status].bg, LEAVE_STATUS_TONE[l.status].fg)}>
                            {LEAVE_STATUS_LABELS[l.status]}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {canApproveLeave && (
                            <div className="flex gap-2 justify-end">
                              <Button size="sm" variant="outline" disabled={leaveBusy === l.id} onClick={() => rejectLeave(l.id)}>
                                {leaveBusy === l.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                                Reject
                              </Button>
                              <Button size="sm" disabled={leaveBusy === l.id} onClick={() => approveLeave(l.id)}>
                                {leaveBusy === l.id && <Loader2 className="h-3 w-3 animate-spin" />}
                                Approve
                              </Button>
                            </div>
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

        <TabsContent value="procurement" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {loadingCommercial ? (
                <div className="p-6 space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : prItems.length + poItems.length === 0 ? (
                <div className="p-12 text-center">
                  <CheckCheck className="h-12 w-12 text-success mx-auto mb-2" />
                  <p className="font-medium">All caught up</p>
                  <p className="text-sm text-muted-foreground">No PRs or POs pending approval.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Number</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {prItems.map((pr) => (
                      <TableRow key={`pr-${pr.id}`}>
                        <TableCell className="text-xs font-medium">PR</TableCell>
                        <TableCell className="font-mono text-xs">{pr.pr_number}</TableCell>
                        <TableCell className="font-medium">{pr.subject}</TableCell>
                        <TableCell className="text-right num">{Number(pr.total_estimate ?? 0).toLocaleString()}</TableCell>
                        <TableCell><span className="text-xs uppercase">{pr.status}</span></TableCell>
                        <TableCell className="text-right">
                          {canApproveCommercial && (
                            <div className="flex gap-2 justify-end">
                              <Button size="sm" variant="outline" disabled={commercialBusy === pr.id} onClick={() => rejectPr(pr.id)}>Reject</Button>
                              <Button size="sm" disabled={commercialBusy === pr.id} onClick={() => approvePr(pr.id)}>
                                {commercialBusy === pr.id && <Loader2 className="h-3 w-3 animate-spin" />}
                                Approve
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {poItems.map((po) => (
                      <TableRow key={`po-${po.id}`}>
                        <TableCell className="text-xs font-medium">PO</TableCell>
                        <TableCell className="font-mono text-xs">{po.po_number}</TableCell>
                        <TableCell className="font-medium">{po.suppliers?.name ?? "Supplier"}</TableCell>
                        <TableCell className="text-right num">{po.currency ?? "USD"} {Number(po.total_amount ?? 0).toLocaleString()}</TableCell>
                        <TableCell><span className="text-xs uppercase">{po.status}</span></TableCell>
                        <TableCell className="text-right">
                          {canApproveCommercial && (
                            <div className="flex gap-2 justify-end">
                              <Button size="sm" variant="outline" disabled={commercialBusy === po.id} onClick={() => advancePo(po.id, "cancelled")}>Reject</Button>
                              <Button size="sm" disabled={commercialBusy === po.id} onClick={() => advancePo(po.id, po.status === "submitted" ? "review" : "finance_approved")}>
                                {commercialBusy === po.id && <Loader2 className="h-3 w-3 animate-spin" />}
                                {po.status === "submitted" ? "Review" : "Finance approve"}
                              </Button>
                            </div>
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

        <TabsContent value="payments" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {loadingCommercial ? (
                <div className="p-6 space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : paymentItems.length === 0 ? (
                <div className="p-12 text-center">
                  <CheckCheck className="h-12 w-12 text-success mx-auto mb-2" />
                  <p className="font-medium">All caught up</p>
                  <p className="text-sm text-muted-foreground">No payment requests pending approval.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Number</TableHead>
                      <TableHead>Payee</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentItems.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-mono text-xs">{payment.request_number}</TableCell>
                        <TableCell className="font-medium">{payment.payee_name}</TableCell>
                        <TableCell className="text-right num">{payment.currency} {Number(payment.amount ?? 0).toLocaleString()}</TableCell>
                        <TableCell>
                          <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", PAYMENT_REQUEST_STATUS_TONE[payment.status]?.bg, PAYMENT_REQUEST_STATUS_TONE[payment.status]?.fg)}>
                            {PAYMENT_REQUEST_STATUS_LABELS[payment.status]}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {canApproveCommercial && (
                            <div className="flex gap-2 justify-end">
                              <Button size="sm" variant="outline" disabled={commercialBusy === payment.id} onClick={() => rejectPayment(payment.id)}>Reject</Button>
                              <Button size="sm" disabled={commercialBusy === payment.id} onClick={() => approvePayment(payment.id)}>
                                {commercialBusy === payment.id && <Loader2 className="h-3 w-3 animate-spin" />}
                                Approve
                              </Button>
                            </div>
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
