import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import { ArrowLeft, Plus, Trash2, Send, Check, X, RotateCcw, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useDailyReport } from "@/hooks/useDailyReport";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  DSR_STATUS_LABELS, DSR_STATUS_TONE, DsrStatus,
  DSR_SITE_STATUS_LABELS, DsrSiteStatus,
  DSR_DELAY_CATEGORY_LABELS, DsrDelayCategory,
  DSR_SEVERITY_LABELS, DSR_SEVERITY_TONE, DsrSeverity,
} from "@/lib/dsrMeta";
import { DEPARTMENT_LABELS, Department } from "@/lib/departmentMeta";
import { toast } from "sonner";

type Row = Record<string, any>;

export default function DailyReportDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const { data, isLoading, refetch } = useDailyReport(id);
  const [tasks, setTasks] = useState<{ id: string; code: string | null; title: string }[]>([]);

  const report = data?.report;
  const isLocked = report?.status === "approved";
  const canEdit = !isLocked && (hasRole("admin") || hasRole("project_manager") || hasRole("engineer") || hasRole("supervisor"));
  const canApprove = hasRole("admin") || hasRole("project_manager");

  useEffect(() => {
    if (!report?.project_id) return;
    supabase
      .from("tasks")
      .select("id, code, title")
      .eq("project_id", report.project_id)
      .order("code")
      .then(({ data }) => setTasks(data ?? []));
  }, [report?.project_id]);

  if (isLoading || !report) {
    return <div className="text-muted-foreground">Loading…</div>;
  }

  const tone = DSR_STATUS_TONE[report.status as DsrStatus];

  // ----- mutations -----
  const updateReport = async (patch: Row) => {
    const { error } = await supabase.from("daily_site_reports").update(patch).eq("id", report.id);
    if (error) return toast.error(error.message);
    refetch();
  };

  const submitReport = async () => {
    await updateReport({ status: "submitted", submitted_by: user?.id, submitted_at: new Date().toISOString() });
    toast.success("Submitted for approval");
  };
  const approveReport = async () => {
    await updateReport({ status: "approved", reviewed_by: user?.id, reviewed_at: new Date().toISOString() });
    toast.success("Report approved — task progress updated");
  };
  const rejectReport = async () => {
    const reason = prompt("Rejection reason?");
    if (!reason) return;
    await updateReport({ status: "rejected", reviewed_by: user?.id, reviewed_at: new Date().toISOString(), rejection_reason: reason });
  };
  const reopenReport = async () => {
    await updateReport({ status: "draft", submitted_at: null, reviewed_at: null });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="ghost" size="sm" onClick={() => navigate("/daily-reports")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <h1 className="text-xl font-bold">
          {format(new Date(report.report_date), "EEEE, dd MMM yyyy")}
        </h1>
        <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium", tone.bg, tone.fg)}>
          <span className={cn("h-1.5 w-1.5 rounded-full", tone.dot)} />
          {DSR_STATUS_LABELS[report.status as DsrStatus]}
        </span>
        <div className="ml-auto flex gap-2">
          {report.status === "draft" && canEdit && (
            <Button onClick={submitReport}><Send className="h-4 w-4 mr-1" /> Submit</Button>
          )}
          {report.status === "rejected" && canEdit && (
            <Button onClick={submitReport}><Send className="h-4 w-4 mr-1" /> Resubmit</Button>
          )}
          {report.status === "submitted" && canApprove && (
            <>
              <Button variant="outline" onClick={rejectReport}><X className="h-4 w-4 mr-1" /> Reject</Button>
              <Button onClick={approveReport}><Check className="h-4 w-4 mr-1" /> Approve</Button>
            </>
          )}
          {report.status === "approved" && hasRole("admin") && (
            <Button variant="outline" onClick={reopenReport}><RotateCcw className="h-4 w-4 mr-1" /> Reopen</Button>
          )}
        </div>
      </div>

      {report.rejection_reason && report.status === "rejected" && (
        <div className="rounded-md border border-destructive/40 bg-destructive-soft text-destructive px-3 py-2 text-sm">
          <b>Rejected:</b> {report.rejection_reason}
        </div>
      )}

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="progress">Progress ({data?.progress.length ?? 0})</TabsTrigger>
          <TabsTrigger value="manpower">Manpower ({data?.manpower.length ?? 0})</TabsTrigger>
          <TabsTrigger value="equipment">Equipment ({data?.equipment.length ?? 0})</TabsTrigger>
          <TabsTrigger value="delays">Delays ({data?.delays.length ?? 0})</TabsTrigger>
          <TabsTrigger value="visitors">Visitors ({data?.visitors.length ?? 0})</TabsTrigger>
          <TabsTrigger value="photos">Photos ({data?.attachments.length ?? 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab report={report} canEdit={canEdit} onSave={updateReport} />
        </TabsContent>
        <TabsContent value="progress">
          <ProgressTab dsrId={report.id} rows={data!.progress} tasks={tasks} canEdit={canEdit} onChange={refetch} />
        </TabsContent>
        <TabsContent value="manpower">
          <ManpowerTab dsrId={report.id} rows={data!.manpower} canEdit={canEdit} onChange={refetch} />
        </TabsContent>
        <TabsContent value="equipment">
          <EquipmentTab dsrId={report.id} rows={data!.equipment} canEdit={canEdit} onChange={refetch} />
        </TabsContent>
        <TabsContent value="delays">
          <DelaysTab dsrId={report.id} rows={data!.delays} tasks={tasks} canEdit={canEdit} onChange={refetch} />
        </TabsContent>
        <TabsContent value="visitors">
          <VisitorsTab dsrId={report.id} rows={data!.visitors} canEdit={canEdit} onChange={refetch} />
        </TabsContent>
        <TabsContent value="photos">
          <PhotosTab dsrId={report.id} rows={data!.attachments} canEdit={canEdit} onChange={refetch} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ---------------- Overview ---------------- */

function OverviewTab({ report, canEdit, onSave }: { report: Row; canEdit: boolean; onSave: (p: Row) => void }) {
  const [local, setLocal] = useState({
    weather: report.weather ?? "",
    temperature_c: report.temperature_c ?? "",
    site_status: report.site_status as DsrSiteStatus,
    general_notes: report.general_notes ?? "",
  });
  useEffect(() => {
    setLocal({
      weather: report.weather ?? "",
      temperature_c: report.temperature_c ?? "",
      site_status: report.site_status,
      general_notes: report.general_notes ?? "",
    });
  }, [report.id]);

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Site overview</CardTitle></CardHeader>
      <CardContent className="grid md:grid-cols-2 gap-4">
        <div>
          <Label>Weather</Label>
          <Input disabled={!canEdit} value={local.weather} onChange={(e) => setLocal({ ...local, weather: e.target.value })}
            placeholder="e.g. Sunny, light rain in afternoon" />
        </div>
        <div>
          <Label>Temperature (°C)</Label>
          <Input type="number" disabled={!canEdit} value={local.temperature_c}
            onChange={(e) => setLocal({ ...local, temperature_c: e.target.value })} />
        </div>
        <div>
          <Label>Site status</Label>
          <Select disabled={!canEdit} value={local.site_status}
            onValueChange={(v) => setLocal({ ...local, site_status: v as DsrSiteStatus })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.keys(DSR_SITE_STATUS_LABELS) as DsrSiteStatus[]).map((s) => (
                <SelectItem key={s} value={s}>{DSR_SITE_STATUS_LABELS[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-2">
          <Label>General notes</Label>
          <Textarea rows={5} disabled={!canEdit} value={local.general_notes}
            onChange={(e) => setLocal({ ...local, general_notes: e.target.value })} />
        </div>
        {canEdit && (
          <div className="md:col-span-2">
            <Button onClick={() => onSave({
              weather: local.weather || null,
              temperature_c: local.temperature_c === "" ? null : Number(local.temperature_c),
              site_status: local.site_status,
              general_notes: local.general_notes || null,
            })}>Save</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ---------------- Generic helpers ---------------- */

async function deleteRow(table: string, id: string, onDone: () => void) {
  const { error } = await (supabase.from(table as any).delete().eq("id", id) as any);
  if (error) return toast.error(error.message);
  onDone();
}

/* ---------------- Progress ---------------- */

function ProgressTab({ dsrId, rows, tasks, canEdit, onChange }: {
  dsrId: string; rows: Row[]; tasks: { id: string; code: string | null; title: string }[];
  canEdit: boolean; onChange: () => void;
}) {
  const [draft, setDraft] = useState<Row>({ task_id: "", description: "", qty_today: 0, qty_unit: "", cumulative_pct: 0, manpower_count: 0, hours_spent: 0 });
  const add = async () => {
    if (!draft.task_id) return toast.error("Pick a task");
    const { error } = await supabase.from("daily_progress_entries").insert({ ...draft, dsr_id: dsrId });
    if (error) return toast.error(error.message);
    setDraft({ task_id: "", description: "", qty_today: 0, qty_unit: "", cumulative_pct: 0, manpower_count: 0, hours_spent: 0 });
    onChange();
  };
  const taskMap = useMemo(() => Object.fromEntries(tasks.map(t => [t.id, t])), [tasks]);

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Work performed today</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task</TableHead><TableHead>Description</TableHead>
              <TableHead>Qty today</TableHead><TableHead>Unit</TableHead>
              <TableHead>Cum %</TableHead><TableHead>Manpower</TableHead><TableHead>Hours</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && <TableRow><TableCell colSpan={8} className="text-muted-foreground text-center py-4">No progress entries.</TableCell></TableRow>}
            {rows.map((r) => {
              const t = taskMap[r.task_id];
              return (
                <TableRow key={r.id}>
                  <TableCell className="text-sm">{t ? `${t.code ?? ""} ${t.title}` : "—"}</TableCell>
                  <TableCell className="text-sm">{r.description}</TableCell>
                  <TableCell>{r.qty_today}</TableCell>
                  <TableCell>{r.qty_unit}</TableCell>
                  <TableCell>{r.cumulative_pct}%</TableCell>
                  <TableCell>{r.manpower_count}</TableCell>
                  <TableCell>{r.hours_spent}</TableCell>
                  <TableCell>
                    {canEdit && <Button size="icon" variant="ghost" onClick={() => deleteRow("daily_progress_entries", r.id, onChange)}><Trash2 className="h-4 w-4" /></Button>}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {canEdit && (
          <div className="grid grid-cols-1 md:grid-cols-7 gap-2 items-end border-t pt-3">
            <div className="md:col-span-2">
              <Label className="text-xs">Task</Label>
              <Select value={draft.task_id} onValueChange={(v) => setDraft({ ...draft, task_id: v })}>
                <SelectTrigger><SelectValue placeholder="Pick task" /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {tasks.map((t) => <SelectItem key={t.id} value={t.id}>{t.code ?? "—"} · {t.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2"><Label className="text-xs">Description</Label><Input value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></div>
            <div><Label className="text-xs">Qty</Label><Input type="number" value={draft.qty_today} onChange={(e) => setDraft({ ...draft, qty_today: Number(e.target.value) })} /></div>
            <div><Label className="text-xs">Unit</Label><Input value={draft.qty_unit} onChange={(e) => setDraft({ ...draft, qty_unit: e.target.value })} placeholder="m³, m²…" /></div>
            <div><Label className="text-xs">Cum %</Label><Input type="number" min={0} max={100} value={draft.cumulative_pct} onChange={(e) => setDraft({ ...draft, cumulative_pct: Number(e.target.value) })} /></div>
            <div><Label className="text-xs">Men</Label><Input type="number" value={draft.manpower_count} onChange={(e) => setDraft({ ...draft, manpower_count: Number(e.target.value) })} /></div>
            <div><Label className="text-xs">Hours</Label><Input type="number" value={draft.hours_spent} onChange={(e) => setDraft({ ...draft, hours_spent: Number(e.target.value) })} /></div>
            <div className="md:col-span-7"><Button onClick={add}><Plus className="h-4 w-4 mr-1" />Add entry</Button></div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ---------------- Manpower ---------------- */

function ManpowerTab({ dsrId, rows, canEdit, onChange }: { dsrId: string; rows: Row[]; canEdit: boolean; onChange: () => void }) {
  const [draft, setDraft] = useState<Row>({ department: "construction", trade_label: "", planned_count: 0, actual_count: 0, notes: "" });
  const add = async () => {
    const { error } = await supabase.from("daily_manpower").insert({ ...draft, dsr_id: dsrId });
    if (error) return toast.error(error.message);
    setDraft({ department: "construction", trade_label: "", planned_count: 0, actual_count: 0, notes: "" });
    onChange();
  };
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Manpower headcount</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Department</TableHead><TableHead>Trade</TableHead>
            <TableHead>Planned</TableHead><TableHead>Actual</TableHead><TableHead>Notes</TableHead><TableHead></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {rows.length === 0 && <TableRow><TableCell colSpan={6} className="text-muted-foreground text-center py-4">No entries.</TableCell></TableRow>}
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.department ? DEPARTMENT_LABELS[r.department as Department] : "—"}</TableCell>
                <TableCell>{r.trade_label}</TableCell>
                <TableCell>{r.planned_count}</TableCell>
                <TableCell className={r.actual_count < r.planned_count ? "text-destructive font-medium" : ""}>{r.actual_count}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{r.notes}</TableCell>
                <TableCell>{canEdit && <Button size="icon" variant="ghost" onClick={() => deleteRow("daily_manpower", r.id, onChange)}><Trash2 className="h-4 w-4" /></Button>}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {canEdit && (
          <div className="grid grid-cols-1 md:grid-cols-6 gap-2 items-end border-t pt-3">
            <div>
              <Label className="text-xs">Department</Label>
              <Select value={draft.department} onValueChange={(v) => setDraft({ ...draft, department: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(DEPARTMENT_LABELS) as Department[]).map((d) => <SelectItem key={d} value={d}>{DEPARTMENT_LABELS[d]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Trade</Label><Input value={draft.trade_label} onChange={(e) => setDraft({ ...draft, trade_label: e.target.value })} placeholder="Mason, Welder…" /></div>
            <div><Label className="text-xs">Planned</Label><Input type="number" value={draft.planned_count} onChange={(e) => setDraft({ ...draft, planned_count: Number(e.target.value) })} /></div>
            <div><Label className="text-xs">Actual</Label><Input type="number" value={draft.actual_count} onChange={(e) => setDraft({ ...draft, actual_count: Number(e.target.value) })} /></div>
            <div className="md:col-span-2"><Label className="text-xs">Notes</Label><Input value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} /></div>
            <div className="md:col-span-6"><Button onClick={add}><Plus className="h-4 w-4 mr-1" />Add</Button></div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ---------------- Equipment ---------------- */

function EquipmentTab({ dsrId, rows, canEdit, onChange }: { dsrId: string; rows: Row[]; canEdit: boolean; onChange: () => void }) {
  const [draft, setDraft] = useState<Row>({ equipment_name: "", quantity: 1, hours_operated: 0, idle_hours: 0, idle_reason: "" });
  const add = async () => {
    if (!draft.equipment_name) return toast.error("Equipment name required");
    const { error } = await supabase.from("daily_equipment").insert({ ...draft, dsr_id: dsrId });
    if (error) return toast.error(error.message);
    setDraft({ equipment_name: "", quantity: 1, hours_operated: 0, idle_hours: 0, idle_reason: "" });
    onChange();
  };
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Equipment on site</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Equipment</TableHead><TableHead>Qty</TableHead>
            <TableHead>Hours operated</TableHead><TableHead>Idle hrs</TableHead><TableHead>Idle reason</TableHead><TableHead></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {rows.length === 0 && <TableRow><TableCell colSpan={6} className="text-muted-foreground text-center py-4">No equipment.</TableCell></TableRow>}
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.equipment_name}</TableCell><TableCell>{r.quantity}</TableCell>
                <TableCell>{r.hours_operated}</TableCell><TableCell>{r.idle_hours}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{r.idle_reason}</TableCell>
                <TableCell>{canEdit && <Button size="icon" variant="ghost" onClick={() => deleteRow("daily_equipment", r.id, onChange)}><Trash2 className="h-4 w-4" /></Button>}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {canEdit && (
          <div className="grid grid-cols-1 md:grid-cols-6 gap-2 items-end border-t pt-3">
            <div className="md:col-span-2"><Label className="text-xs">Name</Label><Input value={draft.equipment_name} onChange={(e) => setDraft({ ...draft, equipment_name: e.target.value })} /></div>
            <div><Label className="text-xs">Qty</Label><Input type="number" value={draft.quantity} onChange={(e) => setDraft({ ...draft, quantity: Number(e.target.value) })} /></div>
            <div><Label className="text-xs">Hours</Label><Input type="number" value={draft.hours_operated} onChange={(e) => setDraft({ ...draft, hours_operated: Number(e.target.value) })} /></div>
            <div><Label className="text-xs">Idle</Label><Input type="number" value={draft.idle_hours} onChange={(e) => setDraft({ ...draft, idle_hours: Number(e.target.value) })} /></div>
            <div><Label className="text-xs">Idle reason</Label><Input value={draft.idle_reason} onChange={(e) => setDraft({ ...draft, idle_reason: e.target.value })} /></div>
            <div className="md:col-span-6"><Button onClick={add}><Plus className="h-4 w-4 mr-1" />Add</Button></div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ---------------- Delays ---------------- */

function DelaysTab({ dsrId, rows, tasks, canEdit, onChange }: {
  dsrId: string; rows: Row[]; tasks: { id: string; code: string | null; title: string }[]; canEdit: boolean; onChange: () => void;
}) {
  const [draft, setDraft] = useState<Row>({ category: "other", description: "", impacted_task_id: null, lost_hours: 0, severity: "low" });
  const add = async () => {
    if (!draft.description) return toast.error("Description required");
    const payload = { ...draft, dsr_id: dsrId, impacted_task_id: draft.impacted_task_id || null };
    const { error } = await supabase.from("daily_delays").insert(payload);
    if (error) return toast.error(error.message);
    setDraft({ category: "other", description: "", impacted_task_id: null, lost_hours: 0, severity: "low" });
    onChange();
  };
  const taskMap = Object.fromEntries(tasks.map(t => [t.id, t]));
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Delays & issues</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Category</TableHead><TableHead>Description</TableHead><TableHead>Impacted task</TableHead>
            <TableHead>Lost hrs</TableHead><TableHead>Severity</TableHead><TableHead></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {rows.length === 0 && <TableRow><TableCell colSpan={6} className="text-muted-foreground text-center py-4">No delays.</TableCell></TableRow>}
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{DSR_DELAY_CATEGORY_LABELS[r.category as DsrDelayCategory]}</TableCell>
                <TableCell className="text-sm">{r.description}</TableCell>
                <TableCell className="text-sm">{r.impacted_task_id ? (taskMap[r.impacted_task_id]?.title ?? "—") : "—"}</TableCell>
                <TableCell>{r.lost_hours}</TableCell>
                <TableCell><span className={cn("px-2 py-0.5 rounded text-xs", DSR_SEVERITY_TONE[r.severity as DsrSeverity])}>{DSR_SEVERITY_LABELS[r.severity as DsrSeverity]}</span></TableCell>
                <TableCell>{canEdit && <Button size="icon" variant="ghost" onClick={() => deleteRow("daily_delays", r.id, onChange)}><Trash2 className="h-4 w-4" /></Button>}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {canEdit && (
          <div className="grid grid-cols-1 md:grid-cols-6 gap-2 items-end border-t pt-3">
            <div>
              <Label className="text-xs">Category</Label>
              <Select value={draft.category} onValueChange={(v) => setDraft({ ...draft, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{(Object.keys(DSR_DELAY_CATEGORY_LABELS) as DsrDelayCategory[]).map((c) => <SelectItem key={c} value={c}>{DSR_DELAY_CATEGORY_LABELS[c]}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2"><Label className="text-xs">Description</Label><Input value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></div>
            <div>
              <Label className="text-xs">Impacted task</Label>
              <Select value={draft.impacted_task_id ?? "none"} onValueChange={(v) => setDraft({ ...draft, impacted_task_id: v === "none" ? null : v })}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value="none">— None —</SelectItem>
                  {tasks.map((t) => <SelectItem key={t.id} value={t.id}>{t.code ?? "—"} · {t.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Lost hrs</Label><Input type="number" value={draft.lost_hours} onChange={(e) => setDraft({ ...draft, lost_hours: Number(e.target.value) })} /></div>
            <div>
              <Label className="text-xs">Severity</Label>
              <Select value={draft.severity} onValueChange={(v) => setDraft({ ...draft, severity: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{(Object.keys(DSR_SEVERITY_LABELS) as DsrSeverity[]).map((s) => <SelectItem key={s} value={s}>{DSR_SEVERITY_LABELS[s]}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="md:col-span-6"><Button onClick={add}><Plus className="h-4 w-4 mr-1" />Add</Button></div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ---------------- Visitors ---------------- */

function VisitorsTab({ dsrId, rows, canEdit, onChange }: { dsrId: string; rows: Row[]; canEdit: boolean; onChange: () => void }) {
  const [draft, setDraft] = useState<Row>({ visitor_name: "", organization: "", purpose: "", time_in: "", time_out: "" });
  const add = async () => {
    if (!draft.visitor_name) return toast.error("Visitor name required");
    const payload = { ...draft, dsr_id: dsrId, time_in: draft.time_in || null, time_out: draft.time_out || null };
    const { error } = await supabase.from("daily_visitors").insert(payload);
    if (error) return toast.error(error.message);
    setDraft({ visitor_name: "", organization: "", purpose: "", time_in: "", time_out: "" });
    onChange();
  };
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Visitors</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Name</TableHead><TableHead>Organization</TableHead><TableHead>Purpose</TableHead>
            <TableHead>In</TableHead><TableHead>Out</TableHead><TableHead></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {rows.length === 0 && <TableRow><TableCell colSpan={6} className="text-muted-foreground text-center py-4">No visitors.</TableCell></TableRow>}
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.visitor_name}</TableCell><TableCell>{r.organization}</TableCell>
                <TableCell className="text-sm">{r.purpose}</TableCell>
                <TableCell>{r.time_in?.slice(0, 5)}</TableCell><TableCell>{r.time_out?.slice(0, 5)}</TableCell>
                <TableCell>{canEdit && <Button size="icon" variant="ghost" onClick={() => deleteRow("daily_visitors", r.id, onChange)}><Trash2 className="h-4 w-4" /></Button>}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {canEdit && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end border-t pt-3">
            <div><Label className="text-xs">Name</Label><Input value={draft.visitor_name} onChange={(e) => setDraft({ ...draft, visitor_name: e.target.value })} /></div>
            <div><Label className="text-xs">Organization</Label><Input value={draft.organization} onChange={(e) => setDraft({ ...draft, organization: e.target.value })} /></div>
            <div><Label className="text-xs">Purpose</Label><Input value={draft.purpose} onChange={(e) => setDraft({ ...draft, purpose: e.target.value })} /></div>
            <div><Label className="text-xs">In</Label><Input type="time" value={draft.time_in} onChange={(e) => setDraft({ ...draft, time_in: e.target.value })} /></div>
            <div><Label className="text-xs">Out</Label><Input type="time" value={draft.time_out} onChange={(e) => setDraft({ ...draft, time_out: e.target.value })} /></div>
            <div className="md:col-span-5"><Button onClick={add}><Plus className="h-4 w-4 mr-1" />Add</Button></div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ---------------- Photos ---------------- */

function PhotosTab({ dsrId, rows, canEdit, onChange }: { dsrId: string; rows: Row[]; canEdit: boolean; onChange: () => void }) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [urls, setUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      const map: Record<string, string> = {};
      for (const r of rows) {
        const { data } = await supabase.storage.from("dsr-attachments").createSignedUrl(r.storage_path, 3600);
        if (data?.signedUrl) map[r.id] = data.signedUrl;
      }
      setUrls(map);
    })();
  }, [rows.map((r) => r.id).join(",")]);

  const onUpload = async (file: File) => {
    if (!user) return;
    setUploading(true);
    const path = `${dsrId}/${Date.now()}-${file.name}`;
    const up = await supabase.storage.from("dsr-attachments").upload(path, file);
    if (up.error) { setUploading(false); return toast.error(up.error.message); }
    const { error } = await supabase.from("dsr_attachments").insert({
      dsr_id: dsrId, storage_path: path, file_name: file.name,
      mime_type: file.type, size_bytes: file.size, uploaded_by: user.id,
    });
    setUploading(false);
    if (error) return toast.error(error.message);
    onChange();
  };

  const onDelete = async (r: Row) => {
    await supabase.storage.from("dsr-attachments").remove([r.storage_path]);
    await deleteRow("dsr_attachments", r.id, onChange);
  };

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Photos & attachments</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {canEdit && (
          <div>
            <input id="dsr-file" type="file" multiple className="hidden" onChange={(e) => {
              Array.from(e.target.files ?? []).forEach(onUpload);
              e.target.value = "";
            }} />
            <Button asChild disabled={uploading}><label htmlFor="dsr-file"><Upload className="h-4 w-4 mr-1" />{uploading ? "Uploading…" : "Upload files"}</label></Button>
          </div>
        )}
        {rows.length === 0 && <div className="text-sm text-muted-foreground py-6 text-center">No attachments.</div>}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {rows.map((r) => {
            const isImage = (r.mime_type ?? "").startsWith("image/");
            return (
              <div key={r.id} className="border rounded-md p-2 group">
                {isImage && urls[r.id] ? (
                  <img src={urls[r.id]} alt={r.file_name} className="w-full h-32 object-cover rounded" />
                ) : (
                  <div className="w-full h-32 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">{r.mime_type ?? "file"}</div>
                )}
                <div className="mt-2 flex items-center justify-between gap-2">
                  <a href={urls[r.id]} target="_blank" rel="noreferrer" className="text-xs truncate hover:underline">{r.file_name}</a>
                  {canEdit && <Button size="icon" variant="ghost" onClick={() => onDelete(r)}><Trash2 className="h-4 w-4" /></Button>}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
