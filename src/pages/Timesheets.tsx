import * as React from "react";
import { format, startOfWeek, endOfWeek, addDays, parseISO } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProjects } from "@/contexts/ProjectContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TimesheetStatusBadge } from "@/components/timesheets/TimesheetStatusBadge";
import { formatHours, TimesheetFlag, TimesheetStatus } from "@/lib/timesheetMeta";
import { ChevronLeft, ChevronRight, Plus, Send, Trash2, AlertTriangle, Loader2, Clock, Pencil, Flag, ShieldAlert, Calendar, Users, CheckCircle2, File } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Entry {
  id: string;
  user_id: string;
  project_id: string;
  task_id: string | null;
  work_date: string;
  start_time: string | null;
  end_time: string | null;
  morning_start: string | null;
  morning_end: string | null;
  afternoon_start: string | null;
  afternoon_end: string | null;
  ot_start: string | null;
  ot_end: string | null;
  break_start: string | null;
  break_end: string | null;
  morning_task_id: string | null;
  afternoon_task_id: string | null;
  ot_task_id: string | null;
  break_task_id: string | null;
  morning_non_work: boolean;
  afternoon_non_work: boolean;
  ot_non_work: boolean;
  break_non_work: boolean;
  is_sunday: boolean;
  is_public_holiday: boolean;
  ticked_task_ids: string[];
  regular_hours: number;
  overtime_hours: number;
  notes: string | null;
  status: TimesheetStatus;
  flags: TimesheetFlag[];
  rejection_reason: string | null;
  attachments?: any[];
}

function diffHours(start: string | null, end: string | null): number {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const mins = (eh * 60 + em) - (sh * 60 + sm);
  return mins > 0 ? Math.round((mins / 60) * 100) / 100 : 0;
}

interface TaskOpt {
  id: string;
  title: string;
  code: string | null;
  wbs_node_id?: string | null;
  created_at?: string;
}

interface Member {
  id: string;
  full_name: string;
  job_title: string | null;
}

interface TaskInfo {
  id: string;
  title: string;
  code: string | null;
  wbs_path: string | null;
  wbs_code: string | null;
}

const WEEK_DAYS = 7;

export default function Timesheets() {
  const { user } = useAuth();
  const { projects, activeProject } = useProjects();
  const [weekStart, setWeekStart] = React.useState<Date>(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [entries, setEntries] = React.useState<Entry[]>([]);
  const [tasks, setTasks] = React.useState<TaskOpt[]>([]);
  const [members, setMembers] = React.useState<Member[]>([]);
  const [taskInfo, setTaskInfo] = React.useState<Map<string, TaskInfo>>(new Map());
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Entry | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [taskFilter, setTaskFilter] = React.useState<"all" | "today" | "yesterday">("all");
  const [stagedFiles, setStagedFiles] = React.useState<File[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const weekEnd = React.useMemo(() => endOfWeek(weekStart, { weekStartsOn: 1 }), [weekStart]);

  const load = React.useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const startStr = format(weekStart, "yyyy-MM-dd");
    const endStr = format(weekEnd, "yyyy-MM-dd");
    const { data } = await supabase
      .from("timesheet_entries")
      .select("*")
      .eq("user_id", user.id)
      .gte("work_date", startStr)
      .lte("work_date", endStr)
      .order("work_date", { ascending: true });
    setEntries((data ?? []) as unknown as Entry[]);
    setLoading(false);
  }, [user, weekStart, weekEnd]);

  React.useEffect(() => { load(); }, [load]);

  // Resolve task + WBS info for all entries shown this week
  React.useEffect(() => {
    const ids = Array.from(new Set(entries.map((e) => e.task_id).filter(Boolean))) as string[];
    if (ids.length === 0) { setTaskInfo(new Map()); return; }
    (async () => {
      const { data: ts } = await supabase
        .from("tasks")
        .select("id, title, code, wbs_node_id")
        .in("id", ids);
      const wbsIds = Array.from(new Set((ts ?? []).map((t) => t.wbs_node_id).filter(Boolean))) as string[];
      let wbsMap = new Map<string, { code: string; path_text: string }>();
      if (wbsIds.length > 0) {
        const { data: ws } = await supabase
          .from("wbs_nodes")
          .select("id, code, path_text")
          .in("id", wbsIds);
        for (const w of ws ?? []) wbsMap.set(w.id, { code: w.code, path_text: w.path_text });
      }
      const map = new Map<string, TaskInfo>();
      for (const t of ts ?? []) {
        const w = t.wbs_node_id ? wbsMap.get(t.wbs_node_id) : null;
        map.set(t.id, {
          id: t.id, title: t.title, code: t.code,
          wbs_code: w?.code ?? null,
          wbs_path: w?.path_text ?? null,
        });
      }
      setTaskInfo(map);
    })();
  }, [entries]);

  // Load members
  React.useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, job_title")
        .order("full_name");
      setMembers((data ?? []) as Member[]);
    })();
  }, []);

  // Load tasks for the selected member in the project
  React.useEffect(() => {
    if (!editing?.user_id || !editing?.project_id) return;
    (async () => {
      // 1. Get task IDs assigned to this member
      const { data: assignments } = await supabase
        .from("task_assignments")
        .select("task_id")
        .eq("user_id", editing.user_id)
        .is("unassigned_at", null);
      
      const assignedIds = (assignments ?? []).map(a => a.task_id);
      
      if (assignedIds.length === 0) {
        setTasks([]);
        return;
      }

      // 2. Fetch the actual tasks
      const { data } = await supabase
        .from("tasks")
        .select("id, title, code, created_at")
        .eq("project_id", editing.project_id)
        .in("id", assignedIds)
        .order("created_at", { ascending: false });
      
      setTasks((data ?? []) as TaskOpt[]);
    })();
  }, [editing?.user_id, editing?.project_id]);

  const totals = React.useMemo(() => {
    const reg = entries.reduce((s, e) => s + Number(e.regular_hours), 0);
    const ot = entries.reduce((s, e) => s + Number(e.overtime_hours), 0);
    return { reg, ot, total: reg + ot };
  }, [entries]);

  const dayTotals = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const e of entries) {
      const k = e.work_date;
      map.set(k, (map.get(k) ?? 0) + Number(e.regular_hours) + Number(e.overtime_hours));
    }
    return map;
  }, [entries]);

  const openCreate = (date?: Date) => {
    const d = date ?? new Date();
    const isSun = d.getDay() === 0;
    setStagedFiles([]);
    setEditing({
      id: "",
      user_id: user!.id,
      project_id: activeProject?.id ?? "",
      task_id: null,
      work_date: format(d, "yyyy-MM-dd"),
      start_time: null,
      end_time: null,
      morning_start: "08:00",
      morning_end: "12:00",
      afternoon_start: "13:00",
      afternoon_end: "17:00",
      ot_start: null,
      ot_end: null,
      break_start: null,
      break_end: null,
      morning_task_id: null,
      afternoon_task_id: null,
      ot_task_id: null,
      break_task_id: null,
      morning_non_work: false,
      afternoon_non_work: false,
      ot_non_work: false,
      break_non_work: false,
      is_sunday: isSun,
      is_public_holiday: false,
      ticked_task_ids: [],
      regular_hours: 8,
      overtime_hours: 0,
      notes: "",
      status: "draft",
      flags: [],
      rejection_reason: null,
    });
    setDialogOpen(true);
  };

  const openEdit = (e: Entry) => {
    setEditing({ ...e });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!editing || !user) return;
    if (!editing.project_id) { toast.error("Pick a project"); return; }
    
    const morningH = editing.morning_non_work ? 0 : diffHours(editing.morning_start, editing.morning_end);
    const afternoonH = editing.afternoon_non_work ? 0 : diffHours(editing.afternoon_start, editing.afternoon_end);
    const otH = editing.ot_non_work ? 0 : diffHours(editing.ot_start, editing.ot_end);
    const breakH = editing.break_non_work ? 0 : diffHours(editing.break_start, editing.break_end);
    
    const reg = morningH + afternoonH;
    const total = reg + otH + breakH;
    
    if (total <= 0) { toast.error("Enter at least one valid time block"); return; }
    
    setSubmitting(true);
    const allStarts = [editing.morning_start, editing.afternoon_start, editing.ot_start, editing.break_start].filter(Boolean) as string[];
    const allEnds = [editing.morning_end, editing.afternoon_end, editing.ot_end, editing.break_end].filter(Boolean) as string[];
    const startTime = allStarts.length ? allStarts.sort()[0] : null;
    const endTime = allEnds.length ? allEnds.sort().slice(-1)[0] : null;

    const payload = {
      user_id: editing.user_id,
      project_id: editing.project_id,
      task_id: editing.morning_task_id || editing.task_id || null, // fallback
      work_date: editing.work_date,
      start_time: startTime,
      end_time: endTime,
      morning_start: editing.morning_start || null,
      morning_end: editing.morning_end || null,
      afternoon_start: editing.afternoon_start || null,
      afternoon_end: editing.afternoon_end || null,
      ot_start: editing.ot_start || null,
      ot_end: editing.ot_end || null,
      break_start: editing.break_start || null,
      break_end: editing.break_end || null,
      morning_task_id: editing.morning_task_id || null,
      afternoon_task_id: editing.afternoon_task_id || null,
      ot_task_id: editing.ot_task_id || null,
      break_task_id: editing.break_task_id || null,
      morning_non_work: editing.morning_non_work,
      afternoon_non_work: editing.afternoon_non_work,
      ot_non_work: editing.ot_non_work,
      break_non_work: editing.break_non_work,
      is_sunday: editing.is_sunday,
      is_public_holiday: editing.is_public_holiday,
      ticked_task_ids: editing.ticked_task_ids,
      regular_hours: reg,
      overtime_hours: otH,
      notes: editing.notes || null,
      status: editing.status,
    };
    const op = editing.id
      ? supabase.from("timesheet_entries").update(payload as any).eq("id", editing.id)
      : supabase.from("timesheet_entries").insert(payload as any);
    const { error } = await op;
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success(editing.id ? "Entry updated" : "Entry added");
    setDialogOpen(false);
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("timesheet_entries").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Entry deleted"); load(); }
  };

  const submitAll = async () => {
    const draftIds = entries.filter((e) => e.status === "draft" || e.status === "rejected").map((e) => e.id);
    if (draftIds.length === 0) { toast.info("No draft entries to submit"); return; }
    const { error } = await supabase
      .from("timesheet_entries")
      .update({ status: "submitted" })
      .in("id", draftIds);
    if (error) toast.error(error.message);
    else { toast.success(`${draftIds.length} entries submitted`); load(); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Timesheets</h1>
          <p className="text-muted-foreground">Log your daily hours by project and task</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setWeekStart(addDays(weekStart, -7))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-sm font-medium px-3 min-w-[220px] text-center">
            {format(weekStart, "MMM d")} – {format(weekEnd, "MMM d, yyyy")}
          </div>
          <Button variant="outline" size="icon" onClick={() => setWeekStart(addDays(weekStart, 7))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}>
            This Week
          </Button>
          <Button onClick={() => openCreate()}>
            <Plus className="h-4 w-4 mr-1" /> Add Entry
          </Button>
          <Button variant="default" onClick={submitAll} className="bg-success hover:bg-success/90 text-success-foreground">
            <Send className="h-4 w-4 mr-1" /> Submit Week
          </Button>
        </div>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Regular Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold num">{formatHours(totals.reg)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overtime Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold num text-warning">{formatHours(totals.ot)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Week Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold num">{formatHours(totals.total)}</div>
            <p className="text-xs text-muted-foreground mt-1">Standard week: 40h</p>
          </CardContent>
        </Card>
      </div>

      {/* Day overview */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: WEEK_DAYS }).map((_, i) => {
              const d = addDays(weekStart, i);
              const key = format(d, "yyyy-MM-dd");
              const hours = dayTotals.get(key) ?? 0;
              const isWeekend = i === 5 || i === 6;
              return (
                <button
                  key={key}
                  onClick={() => openCreate(d)}
                  className={cn(
                    "rounded-lg border p-3 text-left hover:bg-accent transition-colors",
                    isWeekend && "bg-muted/30",
                    hours > 0 && "border-primary/40",
                  )}
                >
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{format(d, "EEE")}</div>
                  <div className="text-lg font-semibold">{format(d, "d")}</div>
                  <div className="text-xs num text-muted-foreground mt-1">
                    <Clock className="h-3 w-3 inline mr-0.5" />
                    {formatHours(hours)}h
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Entries */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : entries.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Clock className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="font-medium">No entries this week</p>
              <p className="text-sm">Click a day above or "Add Entry" to log time.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Task</TableHead>
                  <TableHead>WBS Location</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead className="text-right">Regular</TableHead>
                  <TableHead className="text-right">OT</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Flags</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((e) => {
                  const project = projects.find((p) => p.id === e.project_id);
                  const editable = e.status === "draft" || e.status === "rejected";
                  const ti = e.task_id ? taskInfo.get(e.task_id) : null;
                  return (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium">
                        {format(parseISO(e.work_date), "EEE, MMM d")}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">{project?.code ?? "—"}</div>
                      </TableCell>
                      <TableCell>
                        {ti ? (
                          <div>
                            {ti.code && <div className="text-[11px] text-muted-foreground num">{ti.code}</div>}
                            <div className="text-sm truncate max-w-[220px]">{ti.title}</div>
                          </div>
                        ) : <span className="text-xs text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>
                        {ti?.wbs_path ? (
                          <div>
                            {ti.wbs_code && <div className="text-[11px] text-muted-foreground num">{ti.wbs_code}</div>}
                            <div className="text-xs truncate max-w-[200px]" title={ti.wbs_path}>{ti.wbs_path}</div>
                          </div>
                        ) : <span className="text-xs text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>
                        <div className="text-xs text-muted-foreground truncate max-w-[220px]" title={e.notes ?? ""}>
                          {e.notes || "—"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right num">{formatHours(e.regular_hours)}</TableCell>
                      <TableCell className="text-right num text-warning">{formatHours(e.overtime_hours)}</TableCell>
                      <TableCell>
                        <TimesheetStatusBadge status={e.status} />
                        {e.status === "rejected" && e.rejection_reason && (
                          <div className="text-[10px] text-destructive mt-1 max-w-[200px]">{e.rejection_reason}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        {e.flags?.length > 0 ? (
                          <TooltipProvider delayDuration={150}>
                            <div className="flex flex-wrap gap-1">
                              {e.flags.slice(0, 2).map((f, i) => {
                                const sev = (f as { severity?: string }).severity ?? "warning";
                                const isError = sev === "error" || sev === "critical";
                                const Icon = isError ? ShieldAlert : AlertTriangle;
                                const cls = isError
                                  ? "bg-destructive/10 text-destructive ring-1 ring-destructive/20"
                                  : "bg-warning-soft text-warning ring-1 ring-warning/20";
                                return (
                                  <Tooltip key={i}>
                                    <TooltipTrigger asChild>
                                      <span className={cn(
                                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide cursor-help",
                                        cls,
                                      )}>
                                        <Icon className="h-2.5 w-2.5" />
                                        {f.type.replace(/_/g, " ")}
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="max-w-[240px]">
                                      <p className="text-xs">{f.message || f.type.replace(/_/g, " ")}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                );
                              })}
                              {e.flags.length > 2 && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="inline-flex items-center rounded-full bg-muted text-muted-foreground px-2 py-0.5 text-[10px] font-medium cursor-help">
                                      +{e.flags.length - 2}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-[240px]">
                                    <ul className="text-xs space-y-0.5">
                                      {e.flags.slice(2).map((f, i) => (
                                        <li key={i}>• {f.message || f.type.replace(/_/g, " ")}</li>
                                      ))}
                                    </ul>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </TooltipProvider>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/60">
                            <Flag className="h-3 w-3" /> Clean
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {editable ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => openEdit(e)}
                              className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md border bg-background text-xs font-medium hover:bg-accent hover:text-accent-foreground transition-colors shadow-sm"
                              aria-label="Edit entry"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => remove(e.id)}
                              className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md border border-destructive/20 bg-background text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors shadow-sm"
                              aria-label="Delete entry"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        ) : (
                          <span className="inline-flex items-center h-8 px-2.5 rounded-md bg-muted text-[11px] text-muted-foreground italic">Locked</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden border-none shadow-2xl bg-slate-50 dark:bg-slate-900 flex flex-col max-h-[95vh]">
          <DialogHeader className="p-5 bg-slate-900 text-white shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-lg font-bold flex items-center gap-2">
                  <Clock className="h-5 w-5 text-sky-400" />
                  Hybrid Time Entry
                </DialogTitle>
                <DialogDescription className="text-slate-400 text-xs mt-0.5">
                  Log daily hours with multi-period task tracking and holiday support.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {editing && (
            <div className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
              {/* Meta Row: Date, Project, Member */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Date
                  </Label>
                  <Input
                    type="date"
                    className="bg-white dark:bg-slate-800 border-slate-200"
                    value={editing.work_date}
                    max={format(new Date(), "yyyy-MM-dd")}
                    onChange={(e) => {
                      const d = parseISO(e.target.value);
                      setEditing({ ...editing, work_date: e.target.value, is_sunday: d.getDay() === 0 });
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                    <Plus className="h-3 w-3" /> Project
                  </Label>
                  <Select
                    value={editing.project_id}
                    onValueChange={(v) => setEditing({ ...editing, project_id: v })}
                  >
                    <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-200">
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.code} · {p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                    <Users className="h-3 w-3" /> Member
                  </Label>
                  <Select
                    value={editing.user_id}
                    onValueChange={(v) => setEditing({ ...editing, user_id: v })}
                  >
                    <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-200">
                      <SelectValue placeholder="Select member" />
                    </SelectTrigger>
                    <SelectContent>
                      {members.map((m) => (
                        <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Holiday Toggles Bar */}
              <div className="flex items-center gap-6 p-4 rounded-xl bg-amber-50 border border-amber-100 dark:bg-amber-950/20 dark:border-amber-900/30">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_sunday"
                    className="h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                    checked={editing.is_sunday}
                    onChange={(e) => setEditing({ ...editing, is_sunday: e.target.checked })}
                  />
                  <Label htmlFor="is_sunday" className="text-sm font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-red-600 text-[10px]">-</span>
                    SUNDAY <span className="text-[10px] font-normal text-amber-700/70 opacity-70">(premium rate applies)</span>
                  </Label>
                </div>
                <div className="flex items-center gap-2 border-l border-amber-200 dark:border-amber-900/50 pl-6">
                  <input
                    type="checkbox"
                    id="is_public_holiday"
                    className="h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                    checked={editing.is_public_holiday}
                    onChange={(e) => setEditing({ ...editing, is_public_holiday: e.target.checked })}
                  />
                  <Label htmlFor="is_public_holiday" className="text-sm font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-100 text-orange-600 text-[10px]">🎉</span>
                    PUBLIC HOLIDAY <span className="text-[10px] font-normal text-amber-700/70 opacity-70">(holiday rate + premium)</span>
                  </Label>
                </div>
                <div className="ml-auto flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full dark:bg-emerald-950/30">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Regular working day
                </div>
              </div>

              {/* Task Ticking Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    📋 Tasks with tick (select tasks for this entry)
                  </Label>
                  <div className="flex gap-1">
                    <Button 
                      variant={taskFilter === "all" ? "default" : "outline"} 
                      size="sm" className="h-7 text-[10px] px-2.5 bg-slate-600"
                      onClick={() => setTaskFilter("all")}
                    >All Tasks</Button>
                    <Button 
                      variant={taskFilter === "today" ? "default" : "outline"} 
                      size="sm" className="h-7 text-[10px] px-2.5"
                      onClick={() => setTaskFilter("today")}
                    >Today</Button>
                    <Button 
                      variant={taskFilter === "yesterday" ? "default" : "outline"} 
                      size="sm" className="h-7 text-[10px] px-2.5"
                      onClick={() => setTaskFilter("yesterday")}
                    >Yesterday</Button>
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 p-4 min-h-[80px]">
                  <div className="flex flex-wrap gap-3">
                    {tasks.filter(t => {
                      if (taskFilter === "all") return true;
                      const date = t.created_at ? format(parseISO(t.created_at), "yyyy-MM-dd") : "";
                      const today = format(new Date(), "yyyy-MM-dd");
                      const yesterday = format(addDays(new Date(), -1), "yyyy-MM-dd");
                      return taskFilter === "today" ? date === today : date === yesterday;
                    }).map((t) => (
                      <div key={t.id} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-100 hover:border-slate-300 transition-colors cursor-pointer group">
                        <input
                          type="checkbox"
                          className="h-3.5 w-3.5 rounded border-slate-300 text-sky-600"
                          checked={editing.ticked_task_ids.includes(t.id)}
                          onChange={(e) => {
                            const ids = e.target.checked 
                              ? [...editing.ticked_task_ids, t.id]
                              : editing.ticked_task_ids.filter(id => id !== t.id);
                            setEditing({ ...editing, ticked_task_ids: ids });
                          }}
                        />
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          {t.code ? `${t.code} · ` : ""}{t.title}
                        </span>
                      </div>
                    ))}
                    {tasks.length === 0 && <p className="text-xs text-slate-400 italic">No tasks found for this project</p>}
                  </div>
                  <p className="text-[10px] text-sky-600 mt-3 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3" /> Tick tasks – they appear in period dropdowns
                  </p>
                </div>
              </div>

              {/* Periods Table */}
              <div className="space-y-3">
                <div className="grid grid-cols-12 gap-4 px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <div className="col-span-3">Period</div>
                  <div className="col-span-3">Assigned Task</div>
                  <div className="col-span-2">Start</div>
                  <div className="col-span-2">End</div>
                  <div className="col-span-1 text-center">Hours</div>
                  <div className="col-span-1 text-center">Non Work</div>
                </div>

                <div className="space-y-2">
                  {[
                    { id: "morning", label: "Morning (AM)", start: "morning_start", end: "morning_end", task: "morning_task_id", nonWork: "morning_non_work" },
                    { id: "afternoon", label: "Afternoon (PM)", start: "afternoon_start", end: "afternoon_end", task: "afternoon_task_id", nonWork: "afternoon_non_work" },
                    { id: "ot", label: "Overtime (OT)", start: "ot_start", end: "ot_end", task: "ot_task_id", nonWork: "ot_non_work" },
                    { id: "break", label: "Break / Non Work (N/W)", start: "break_start", end: "break_end", task: "break_task_id", nonWork: "break_non_work" },
                  ].map((p) => {
                    const h = editing[p.nonWork as keyof Entry] ? 0 : diffHours(editing[p.start as keyof Entry] as string, editing[p.end as keyof Entry] as string);
                    const tickedTasks = tasks.filter(t => editing.ticked_task_ids.includes(t.id));
                    
                    return (
                      <div key={p.id} className="grid grid-cols-12 items-center gap-4 bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
                        <div className="col-span-3 pl-3">
                          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 tracking-tight">{p.label}</span>
                        </div>
                        <div className="col-span-3">
                          <Select
                            value={editing[p.task as keyof Entry] as string || "none"}
                            onValueChange={(v) => setEditing({ ...editing, [p.task]: v === "none" ? null : v })}
                          >
                            <SelectTrigger className="h-10 bg-slate-50 dark:bg-slate-900 border-slate-100">
                              <SelectValue placeholder="Tick tasks above" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">— Select a ticked task —</SelectItem>
                              {tickedTasks.map((t) => (
                                <SelectItem key={t.id} value={t.id}>{t.code ? `${t.code} · ` : ""}{t.title}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="time"
                            className="h-10 bg-slate-50 dark:bg-slate-900 border-slate-100 text-xs"
                            value={editing[p.start as keyof Entry] as string || ""}
                            onChange={(e) => setEditing({ ...editing, [p.start]: e.target.value })}
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="time"
                            className="h-10 bg-slate-50 dark:bg-slate-900 border-slate-100 text-xs"
                            value={editing[p.end as keyof Entry] as string || ""}
                            onChange={(e) => setEditing({ ...editing, [p.end]: e.target.value })}
                          />
                        </div>
                        <div className="col-span-1 text-center text-sm font-bold text-slate-700 dark:text-slate-300">
                          {h.toFixed(2)}h
                        </div>
                        <div className="col-span-1 text-center">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-slate-300 text-sky-600"
                            checked={editing[p.nonWork as keyof Entry] as boolean}
                            onChange={(e) => setEditing({ ...editing, [p.nonWork]: e.target.checked })}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Totals Bar */}
              {(() => {
                const morningH = editing.morning_non_work ? 0 : diffHours(editing.morning_start, editing.morning_end);
                const afternoonH = editing.afternoon_non_work ? 0 : diffHours(editing.afternoon_start, editing.afternoon_end);
                const otH = editing.ot_non_work ? 0 : diffHours(editing.ot_start, editing.ot_end);
                const breakH = editing.break_non_work ? 0 : diffHours(editing.break_start, editing.break_end);
                const reg = morningH + afternoonH;
                const total = reg + otH + breakH;
                
                return (
                  <div className="grid grid-cols-4 gap-4 p-4 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200">
                    <div className="flex flex-col items-center border-r border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <Calendar className="h-3 w-3" /> Regular
                      </span>
                      <span className="text-xl font-black text-slate-800 dark:text-slate-100">{reg.toFixed(2)}h</span>
                    </div>
                    <div className="flex flex-col items-center border-r border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <Clock className="h-3 w-3" /> Overtime
                      </span>
                      <span className="text-xl font-black text-slate-800 dark:text-slate-100">{otH.toFixed(2)}h</span>
                    </div>
                    <div className="flex flex-col items-center border-r border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <Trash2 className="h-3 w-3" /> Break
                      </span>
                      <span className="text-xl font-black text-slate-800 dark:text-slate-100">{breakH.toFixed(2)}h</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-bold text-sky-600 uppercase tracking-widest flex items-center gap-2">
                        <CheckCircle2 className="h-3 w-3" /> Total
                      </span>
                      <span className="text-2xl font-black text-sky-600">{total.toFixed(2)}h</span>
                    </div>
                  </div>
                );
              })()}

              {/* Attachments Section */}
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  📎 Attachments (images / PDF)
                </Label>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  multiple 
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setStagedFiles(prev => [...prev, ...files]);
                  }}
                />
                
                {stagedFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {stagedFiles.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 bg-sky-50 dark:bg-sky-900/30 border border-sky-100 px-3 py-1.5 rounded-lg text-xs">
                        <File className="h-3 w-3 text-sky-600" />
                        <span className="max-w-[120px] truncate text-sky-900 dark:text-sky-200">{f.name}</span>
                        <button 
                          onClick={() => setStagedFiles(prev => prev.filter((_, idx) => idx !== i))}
                          className="hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center bg-white dark:bg-slate-800/30 hover:border-sky-400 transition-colors cursor-pointer group"
                >
                  <div className="flex flex-col items-center gap-1">
                    <div className="h-8 w-8 rounded-full bg-sky-50 flex items-center justify-center text-sky-500 group-hover:scale-110 transition-transform">
                      <Plus className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-semibold text-slate-600 group-hover:text-sky-600">Add files</span>
                    <span className="text-[9px] text-slate-400">JPG, PNG, PDF (Max 10MB)</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  📝 Notes
                </Label>
                <Textarea
                  className="bg-white dark:bg-slate-800 border-slate-200"
                  rows={4}
                  value={editing.notes ?? ""}
                  onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                  placeholder="Work description, progress..."
                />
              </div>
            </div>
          )}

          <DialogFooter className="p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 gap-3">
            <Button variant="ghost" className="font-bold text-slate-500" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={submitting} className="bg-slate-900 text-white dark:bg-sky-600 dark:hover:bg-sky-500 px-8 py-6 rounded-xl font-bold text-base shadow-xl hover:scale-105 active:scale-95 transition-all">
              {submitting && <Loader2 className="h-5 w-5 mr-2 animate-spin" />}
              Save Entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
