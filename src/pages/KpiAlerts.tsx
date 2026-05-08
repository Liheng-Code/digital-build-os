import * as React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProjects } from "@/contexts/ProjectContext";
import { toast } from "sonner";
import {
  fetchKpiAlertThresholds,
  upsertKpiAlertThreshold,
  deleteKpiAlertThreshold,
  fetchKpiAlertEvents,
  markKpiAlertEventRead,
  markAllKpiAlertEventsRead,
  clearKpiAlertEvents,
  evaluateKpiAlerts,
} from "@/services/kpiAlertService";
import {
  ALL_KPI_NAMES,
  KPI_ALERT_SEVERITY_TONES,
  KPI_ALERT_SEVERITY_LABELS,
  KPI_ALERT_OPERATOR_LABELS,
  KPI_ALERT_CATEGORY_LABELS,
} from "@/lib/reportingMeta";
import type { KpiAlertThreshold, KpiAlertEvent, KpiAlertCategory } from "@/lib/reportingMeta";
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
  AlertTriangle,
  AlertCircle,
  Info,
  RefreshCw,
  CheckCheck,
  Eye,
  EyeOff,
} from "lucide-react";

export default function KpiAlerts() {
  const { user } = useAuth();
  const { activeProject } = useProjects();
  const [thresholds, setThresholds] = React.useState<KpiAlertThreshold[]>([]);
  const [events, setEvents] = React.useState<KpiAlertEvent[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [evaluating, setEvaluating] = React.useState(false);
  const [eventsTab, setEventsTab] = React.useState<"all" | "unread">("all");

  // Form state
  const [formKpi, setFormKpi] = React.useState("");
  const [formOperator, setFormOperator] = React.useState<"gt" | "lt">("gt");
  const [formValue, setFormValue] = React.useState("");
  const [formSeverity, setFormSeverity] = React.useState<"info" | "warning" | "critical">("warning");
  const [formEnabled, setFormEnabled] = React.useState(true);

  const loadData = React.useCallback(async () => {
    if (!activeProject?.id) return;
    setLoading(true);
    try {
      const [t, e] = await Promise.all([
        fetchKpiAlertThresholds(activeProject.id),
        fetchKpiAlertEvents(activeProject.id),
      ]);
      setThresholds(t);
      setEvents(e);
    } catch (err: any) {
      toast.error(err.message || "Failed to load KPI alerts");
    } finally {
      setLoading(false);
    }
  }, [activeProject?.id]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddThreshold = async () => {
    if (!activeProject?.id || !formKpi || !formValue) {
      toast.error("Please fill in all fields");
      return;
    }

    const kpiDef = ALL_KPI_NAMES.find((k) => k.name === formKpi);
    try {
      await upsertKpiAlertThreshold({
        project_id: activeProject.id,
        kpi_name: formKpi,
        kpi_category: kpiDef?.category ?? "project",
        operator: formOperator,
        threshold_value: Number(formValue),
        severity: formSeverity,
        enabled: formEnabled,
        label: kpiDef?.label ?? formKpi,
      });
      toast.success("Threshold added");
      setDialogOpen(false);
      resetForm();
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to save threshold");
    }
  };

  const handleDeleteThreshold = async (id: string) => {
    try {
      await deleteKpiAlertThreshold(id);
      toast.success("Threshold removed");
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete threshold");
    }
  };

  const handleEvaluate = async () => {
    if (!activeProject?.id) return;
    setEvaluating(true);
    try {
      const count = await evaluateKpiAlerts(activeProject.id, {});
      toast.success(count > 0 ? `${count} alert(s) generated` : "No thresholds breached");
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Evaluation failed");
    } finally {
      setEvaluating(false);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await markKpiAlertEventRead(id);
      setEvents((prev) =>
        prev.map((e) => (e.id === id ? { ...e, read_at: new Date().toISOString() } : e))
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to mark as read");
    }
  };

  const handleMarkAllRead = async () => {
    if (!activeProject?.id) return;
    try {
      await markAllKpiAlertEventsRead(activeProject.id);
      const now = new Date().toISOString();
      setEvents((prev) => prev.map((e) => (e.read_at ? e : { ...e, read_at: now })));
      toast.success("All marked as read");
    } catch (err: any) {
      toast.error(err.message || "Failed to mark all as read");
    }
  };

  const handleClearEvents = async () => {
    if (!activeProject?.id) return;
    try {
      await clearKpiAlertEvents(activeProject.id);
      setEvents([]);
      toast.success("Alert history cleared");
    } catch (err: any) {
      toast.error(err.message || "Failed to clear events");
    }
  };

  const resetForm = () => {
    setFormKpi("");
    setFormOperator("gt");
    setFormValue("");
    setFormSeverity("warning");
    setFormEnabled(true);
  };

  const unreadCount = events.filter((e) => !e.read_at).length;
  const filteredEvents = eventsTab === "unread" ? events.filter((e) => !e.read_at) : events;

  const SeverityIcon = ({ severity }: { severity: string }) => {
    switch (severity) {
      case "critical":
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      default:
        return <Info className="h-4 w-4 text-info" />;
    }
  };

  const kpisByCategory = React.useMemo(() => {
    const map: Record<KpiAlertCategory, { name: string; label: string }[]> = {
      project: [],
      department: [],
      financial: [],
    };
    for (const k of ALL_KPI_NAMES) {
      map[k.category].push(k);
    }
    return map;
  }, []);

  const existingKpiNames = React.useMemo(
    () => new Set(thresholds.map((t) => t.kpi_name)),
    [thresholds]
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">KPI Alerts</h1>
          <p className="text-muted-foreground">
            Configure threshold alerts for project KPIs
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleEvaluate} disabled={evaluating}>
            <RefreshCw className={`h-4 w-4 mr-2 ${evaluating ? "animate-spin" : ""}`} />
            Evaluate Now
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Threshold
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add KPI Threshold</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>KPI</Label>
                  <Select value={formKpi} onValueChange={setFormKpi}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select KPI..." />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(kpisByCategory).map(([cat, kpis]) => (
                        <React.Fragment key={cat}>
                          <SelectItem value="__header__" disabled>
                            {KPI_ALERT_CATEGORY_LABELS[cat as KpiAlertCategory]}
                          </SelectItem>
                          {kpis.map((k) => (
                            <SelectItem key={k.name} value={k.name}>
                              {k.label}
                            </SelectItem>
                          ))}
                        </React.Fragment>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Condition</Label>
                  <Select
                    value={formOperator}
                    onValueChange={(v) => setFormOperator(v as "gt" | "lt")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gt">{KPI_ALERT_OPERATOR_LABELS.gt}</SelectItem>
                      <SelectItem value="lt">{KPI_ALERT_OPERATOR_LABELS.lt}</SelectItem>
                      <SelectItem value="gte">{KPI_ALERT_OPERATOR_LABELS.gte}</SelectItem>
                      <SelectItem value="lte">{KPI_ALERT_OPERATOR_LABELS.lte}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Threshold Value</Label>
                  <Input
                    type="number"
                    value={formValue}
                    onChange={(e) => setFormValue(e.target.value)}
                    placeholder="e.g. 10"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Severity</Label>
                  <Select
                    value={formSeverity}
                    onValueChange={(v) => setFormSeverity(v as "info" | "warning" | "critical")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">{KPI_ALERT_SEVERITY_LABELS.info}</SelectItem>
                      <SelectItem value="warning">{KPI_ALERT_SEVERITY_LABELS.warning}</SelectItem>
                      <SelectItem value="critical">{KPI_ALERT_SEVERITY_LABELS.critical}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formEnabled}
                    onCheckedChange={setFormEnabled}
                    id="enabled-switch"
                  />
                  <Label htmlFor="enabled-switch">Enabled</Label>
                </div>
                <Button onClick={handleAddThreshold} className="w-full">
                  Save Threshold
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Threshold Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Threshold Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : thresholds.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No thresholds configured. Click "Add Threshold" to create one.
            </div>
          ) : (
            <div className="space-y-4">
              {(["project", "department", "financial"] as KpiAlertCategory[]).map((cat) => {
                const catThresholds = thresholds.filter((t) => t.kpi_category === cat);
                if (catThresholds.length === 0) return null;
                return (
                  <div key={cat}>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                      {KPI_ALERT_CATEGORY_LABELS[cat]}
                    </h3>
                    <div className="grid gap-3">
                      {catThresholds.map((t) => (
                        <div
                          key={t.id}
                          className="flex items-center justify-between p-3 rounded-lg border bg-card"
                        >
                          <div className="flex items-center gap-3">
                            <SeverityIcon severity={t.severity} />
                            <div>
                              <div className="font-medium">{t.label}</div>
                              <div className="text-sm text-muted-foreground">
                                {KPI_ALERT_OPERATOR_LABELS[t.operator]} {t.threshold_value}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={t.enabled ? "default" : "secondary"}
                              className="gap-1"
                            >
                              {t.enabled ? (
                                <><Eye className="h-3 w-3" /> Active</>
                              ) : (
                                <><EyeOff className="h-3 w-3" /> Disabled</>
                              )}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={
                                KPI_ALERT_SEVERITY_TONES[t.severity].fg
                              }
                            >
                              {KPI_ALERT_SEVERITY_LABELS[t.severity]}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteThreshold(t.id!)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alert History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Alert History</CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex bg-muted rounded-lg p-1">
              <button
                className={`px-3 py-1 rounded-md text-sm ${
                  eventsTab === "all" ? "bg-background shadow-sm" : ""
                }`}
                onClick={() => setEventsTab("all")}
              >
                All
              </button>
              <button
                className={`px-3 py-1 rounded-md text-sm ${
                  eventsTab === "unread" ? "bg-background shadow-sm" : ""
                }`}
                onClick={() => setEventsTab("unread")}
              >
                Unread {unreadCount > 0 && `(${unreadCount})`}
              </button>
            </div>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
                <CheckCheck className="h-4 w-4 mr-1" />
                Mark all read
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={handleClearEvents}>
              <Trash2 className="h-4 w-4 mr-1" />
              Clear
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No alert events yet. Threshold breaches will appear here.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>KPI</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.map((event) => (
                  <TableRow
                    key={event.id}
                    className={!event.read_at ? "font-medium" : ""}
                  >
                    <TableCell>
                      {!event.read_at && (
                        <span className="block h-2 w-2 rounded-full bg-primary" />
                      )}
                    </TableCell>
                    <TableCell>{event.kpi_name}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {event.message}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={KPI_ALERT_SEVERITY_TONES[event.severity].fg}
                      >
                        {KPI_ALERT_SEVERITY_LABELS[event.severity]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {event.created_at
                        ? new Date(event.created_at).toLocaleString()
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {!event.read_at && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkRead(event.id!)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Read
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
    </div>
  );
}
