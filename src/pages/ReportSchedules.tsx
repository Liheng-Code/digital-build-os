import * as React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProjects } from "@/contexts/ProjectContext";
import { toast } from "sonner";
import {
  fetchReportSchedules,
  upsertReportSchedule,
  deleteReportSchedule,
  toggleReportSchedule,
} from "@/services/reportScheduleService";
import {
  REPORT_TYPE_OPTIONS,
  REPORT_FREQUENCY_LABELS,
  REPORT_SCHEDULE_FORMAT_LABELS,
  FREQUENCY_DAY_OPTIONS,
} from "@/lib/reportingMeta";
import type { ReportSchedule, ReportFrequency, ReportScheduleFormat } from "@/lib/reportingMeta";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Trash2,
  Calendar,
  Clock,
  Mail,
  FileText,
} from "lucide-react";

export default function ReportSchedules() {
  const { user } = useAuth();
  const { activeProject } = useProjects();
  const [schedules, setSchedules] = React.useState<ReportSchedule[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);

  const [formLabel, setFormLabel] = React.useState("");
  const [formReportType, setFormReportType] = React.useState("");
  const [formFrequency, setFormFrequency] = React.useState<ReportFrequency>("weekly");
  const [formDayOfWeek, setFormDayOfWeek] = React.useState("1");
  const [formDayOfMonth, setFormDayOfMonth] = React.useState("1");
  const [formRecipients, setFormRecipients] = React.useState("");
  const [formFormat, setFormFormat] = React.useState<ReportScheduleFormat>("pdf");
  const [formEnabled, setFormEnabled] = React.useState(true);

  const loadData = React.useCallback(async () => {
    if (!activeProject?.id) return;
    setLoading(true);
    try {
      const s = await fetchReportSchedules(activeProject.id);
      setSchedules(s);
    } catch (err: any) {
      toast.error(err.message || "Failed to load schedules");
    } finally {
      setLoading(false);
    }
  }, [activeProject?.id]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = async () => {
    if (!activeProject?.id || !formLabel || !formReportType || !formRecipients) {
      toast.error("Please fill in all required fields");
      return;
    }

    const recipients = formRecipients
      .split(/[,\n]/)
      .map((e) => e.trim())
      .filter(Boolean);

    if (recipients.length === 0) {
      toast.error("Enter at least one recipient email");
      return;
    }

    try {
      await upsertReportSchedule({
        id: editingId ?? undefined,
        project_id: activeProject.id,
        label: formLabel,
        report_type: formReportType,
        frequency: formFrequency,
        day_of_week: formFrequency === "weekly" ? Number(formDayOfWeek) : null,
        day_of_month: formFrequency === "monthly" ? Number(formDayOfMonth) : null,
        recipients,
        format: formFormat,
        enabled: formEnabled,
      });
      toast.success(editingId ? "Schedule updated" : "Schedule created");
      setDialogOpen(false);
      resetForm();
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to save schedule");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteReportSchedule(id);
      toast.success("Schedule deleted");
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete schedule");
    }
  };

  const handleToggle = async (id: string, enabled: boolean) => {
    try {
      await toggleReportSchedule(id, enabled);
      setSchedules((prev) =>
        prev.map((s) => (s.id === id ? { ...s, enabled } : s))
      );
      toast.success(enabled ? "Schedule enabled" : "Schedule disabled");
    } catch (err: any) {
      toast.error(err.message || "Failed to toggle schedule");
    }
  };

  const handleEdit = (s: ReportSchedule) => {
    setEditingId(s.id ?? null);
    setFormLabel(s.label);
    setFormReportType(s.report_type);
    setFormFrequency(s.frequency);
    setFormDayOfWeek(String(s.day_of_week ?? 1));
    setFormDayOfMonth(String(s.day_of_month ?? 1));
    setFormRecipients(s.recipients.join(", "));
    setFormFormat(s.format);
    setFormEnabled(s.enabled);
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormLabel("");
    setFormReportType("");
    setFormFrequency("weekly");
    setFormDayOfWeek("1");
    setFormDayOfMonth("1");
    setFormRecipients("");
    setFormFormat("pdf");
    setFormEnabled(true);
  };

  const frequencySummary = (s: ReportSchedule): string => {
    switch (s.frequency) {
      case "daily":
        return "Every day";
      case "weekly": {
        const opt = FREQUENCY_DAY_OPTIONS.weekly.find((d) => d.value === s.day_of_week);
        return `Weekly on ${opt?.label ?? "unknown"}`;
      }
      case "monthly":
        return `Monthly on day ${s.day_of_month}`;
      case "quarterly":
        return "Every quarter";
    }
  };

  const reportTypeLabel = (type: string): string => {
    return REPORT_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type;
  };

  const formatLabel = (fmt: string): string => {
    return REPORT_SCHEDULE_FORMAT_LABELS[fmt as ReportScheduleFormat] ?? fmt;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Report Schedules</h1>
          <p className="text-muted-foreground">
            Configure automated report delivery via email
          </p>
        </div>
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Schedule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Schedule" : "New Schedule"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Label *</Label>
                <Input
                  value={formLabel}
                  onChange={(e) => setFormLabel(e.target.value)}
                  placeholder="e.g. Weekly Executive Summary"
                />
              </div>
              <div className="space-y-2">
                <Label>Report Type *</Label>
                <Select value={formReportType} onValueChange={setFormReportType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select report..." />
                  </SelectTrigger>
                  <SelectContent>
                    {REPORT_TYPE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Frequency *</Label>
                <Select
                  value={formFrequency}
                  onValueChange={(v) => setFormFrequency(v as ReportFrequency)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(REPORT_FREQUENCY_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {formFrequency === "weekly" && (
                <div className="space-y-2">
                  <Label>Day of Week</Label>
                  <Select value={formDayOfWeek} onValueChange={setFormDayOfWeek}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FREQUENCY_DAY_OPTIONS.weekly.map((d) => (
                        <SelectItem key={d.value} value={String(d.value)}>
                          {d.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {formFrequency === "monthly" && (
                <div className="space-y-2">
                  <Label>Day of Month</Label>
                  <Select value={formDayOfMonth} onValueChange={setFormDayOfMonth}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FREQUENCY_DAY_OPTIONS.monthly.map((d) => (
                        <SelectItem key={d.value} value={String(d.value)}>
                          {d.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label>Format</Label>
                <Select
                  value={formFormat}
                  onValueChange={(v) => setFormFormat(v as ReportScheduleFormat)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(REPORT_SCHEDULE_FORMAT_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Recipients *</Label>
                <Input
                  value={formRecipients}
                  onChange={(e) => setFormRecipients(e.target.value)}
                  placeholder="email1@example.com, email2@example.com"
                />
                <p className="text-xs text-muted-foreground">
                  Comma or newline separated email addresses
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formEnabled}
                  onCheckedChange={setFormEnabled}
                  id="schedule-enabled-switch"
                />
                <Label htmlFor="schedule-enabled-switch">Active</Label>
              </div>
              <Button onClick={handleSave} className="w-full">
                {editingId ? "Update Schedule" : "Create Schedule"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Scheduled Reports</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : schedules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No schedules configured. Click "New Schedule" to create one.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Label</TableHead>
                  <TableHead>Report</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Format</TableHead>
                  <TableHead>Recipients</TableHead>
                  <TableHead>Last Sent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.label}</TableCell>
                    <TableCell>{reportTypeLabel(s.report_type)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {frequencySummary(s)}
                      </div>
                    </TableCell>
                    <TableCell>{formatLabel(s.format)}</TableCell>
                    <TableCell className="max-w-[160px] truncate">
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3 shrink-0" />
                        <span className="text-sm">{s.recipients.join(", ")}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {s.last_sent_at
                        ? new Date(s.last_sent_at).toLocaleDateString()
                        : "Never"}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={s.enabled}
                        onCheckedChange={(v) => handleToggle(s.id!, v)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(s)}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(s.id!)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
