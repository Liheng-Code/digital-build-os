import * as React from "react";
import { format, parseISO, startOfMonth, endOfMonth } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PAYROLL_STATUS_LABELS, PAYROLL_STATUS_TONE, PayrollPeriodStatus,
  formatCurrency, formatHours,
} from "@/lib/timesheetMeta";
import {
  Plus, Calculator, Download, Lock, CheckCircle2, Loader2, DollarSign, FileSpreadsheet,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Period {
  id: string;
  name: string;
  period_start: string;
  period_end: string;
  status: PayrollPeriodStatus;
  notes: string | null;
}

interface Line {
  id: string;
  period_id: string;
  user_id: string;
  regular_hours: number;
  overtime_hours: number;
  hourly_rate: number;
  overtime_multiplier: number;
  regular_pay: number;
  overtime_pay: number;
  total_pay: number;
  currency: string;
  profile?: { full_name: string; employee_id: string | null };
}

interface PayRate {
  id: string;
  user_id: string;
  hourly_rate: number;
  overtime_multiplier: number;
  currency: string;
  effective_from: string;
  effective_to: string | null;
  profile?: { full_name: string; employee_id: string | null };
}

interface ProfileLite {
  id: string;
  full_name: string;
  employee_id: string | null;
}

export default function Payroll() {
  const { roles } = useAuth();
  const canManage = roles.includes("admin") || roles.includes("accountant");
  const [periods, setPeriods] = React.useState<Period[]>([]);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [lines, setLines] = React.useState<Line[]>([]);
  const [rates, setRates] = React.useState<PayRate[]>([]);
  const [profiles, setProfiles] = React.useState<ProfileLite[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);

  const [periodDialog, setPeriodDialog] = React.useState(false);
  const [newPeriod, setNewPeriod] = React.useState({
    name: format(new Date(), "MMMM yyyy"),
    period_start: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    period_end: format(endOfMonth(new Date()), "yyyy-MM-dd"),
  });

  const [rateDialog, setRateDialog] = React.useState(false);
  const [newRate, setNewRate] = React.useState({
    user_id: "",
    hourly_rate: 25,
    overtime_multiplier: 1.5,
    currency: "USD",
    effective_from: format(new Date(), "yyyy-MM-dd"),
  });

  const loadPeriods = React.useCallback(async () => {
    setLoading(true);
    const [periodsRes, profilesRes, ratesRes] = await Promise.all([
      supabase.from("payroll_periods").select("*").order("period_start", { ascending: false }),
      supabase.from("profiles").select("id, full_name, employee_id").order("full_name"),
      supabase.from("pay_rates").select("*").order("effective_from", { ascending: false }),
    ]);
    setPeriods((periodsRes.data ?? []) as Period[]);
    setProfiles((profilesRes.data ?? []) as ProfileLite[]);
    const profMap = new Map((profilesRes.data ?? []).map((p) => [p.id, p]));
    setRates(((ratesRes.data ?? []) as PayRate[]).map((r) => ({ ...r, profile: profMap.get(r.user_id) })));
    if (!activeId && periodsRes.data && periodsRes.data.length > 0) {
      setActiveId(periodsRes.data[0].id);
    }
    setLoading(false);
  }, [activeId]);

  React.useEffect(() => { loadPeriods(); }, [loadPeriods]);

  const loadLines = React.useCallback(async () => {
    if (!activeId) { setLines([]); return; }
    const { data } = await supabase
      .from("payroll_lines")
      .select("*")
      .eq("period_id", activeId)
      .order("total_pay", { ascending: false });
    const profMap = new Map(profiles.map((p) => [p.id, p]));
    setLines(((data ?? []) as Line[]).map((l) => ({ ...l, profile: profMap.get(l.user_id) })));
  }, [activeId, profiles]);

  React.useEffect(() => { loadLines(); }, [loadLines]);

  const activePeriod = periods.find((p) => p.id === activeId) ?? null;

  const totals = React.useMemo(() => ({
    reg: lines.reduce((s, l) => s + Number(l.regular_hours), 0),
    ot: lines.reduce((s, l) => s + Number(l.overtime_hours), 0),
    pay: lines.reduce((s, l) => s + Number(l.total_pay), 0),
  }), [lines]);

  const createPeriod = async () => {
    setBusy(true);
    const { data, error } = await supabase
      .from("payroll_periods")
      .insert(newPeriod)
      .select()
      .single();
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Period created");
    setPeriodDialog(false);
    setActiveId(data.id);
    loadPeriods();
  };

  const computePayroll = async () => {
    if (!activeId) return;
    setBusy(true);
    const { error } = await supabase.rpc("compute_payroll_lines", { _period_id: activeId });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Payroll computed from approved timesheets");
    loadLines();
  };

  const lockPeriod = async () => {
    if (!activeId || !activePeriod) return;
    setBusy(true);
    const { error } = await supabase
      .from("payroll_periods")
      .update({ status: "locked", locked_at: new Date().toISOString() })
      .eq("id", activeId);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Period locked");
    loadPeriods();
  };

  const markPaid = async () => {
    if (!activeId) return;
    setBusy(true);
    const { error } = await supabase
      .from("payroll_periods")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("id", activeId);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Period marked as paid");
    loadPeriods();
  };

  const exportXlsx = async () => {
    if (!activeId) return;
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("export-payroll-xlsx", {
        body: { period_id: activeId },
      });
      if (error) throw error;
      // The function returns base64-encoded xlsx
      const bin = atob((data as { file: string }).file);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const blob = new Blob([bytes], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `payroll-${activePeriod?.name.replace(/\s+/g, "-")}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Excel file downloaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed");
    } finally {
      setBusy(false);
    }
  };

  const saveRate = async () => {
    if (!newRate.user_id) { toast.error("Select an employee"); return; }
    setBusy(true);
    const { error } = await supabase.from("pay_rates").insert(newRate);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Pay rate added");
    setRateDialog(false);
    loadPeriods();
  };

  if (!canManage) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Payroll</h1>
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Restricted area</p>
            <p className="text-sm">Only admins and accountants can access payroll.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Payroll</h1>
          <p className="text-muted-foreground">Compute pay from approved timesheets and export to Excel</p>
        </div>
      </div>

      <Tabs defaultValue="periods" className="space-y-4">
        <TabsList>
          <TabsTrigger value="periods">Pay Periods</TabsTrigger>
          <TabsTrigger value="rates">Pay Rates</TabsTrigger>
        </TabsList>

        <TabsContent value="periods" className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Select value={activeId ?? ""} onValueChange={setActiveId}>
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Select pay period" />
              </SelectTrigger>
              <SelectContent>
                {periods.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} ({format(parseISO(p.period_start), "MMM d")} – {format(parseISO(p.period_end), "MMM d")})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => setPeriodDialog(true)}>
              <Plus className="h-4 w-4 mr-1" /> New Period
            </Button>
            {activePeriod && (
              <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", PAYROLL_STATUS_TONE[activePeriod.status])}>
                {PAYROLL_STATUS_LABELS[activePeriod.status]}
              </span>
            )}
            <div className="flex-1" />
            {activePeriod && activePeriod.status === "open" && (
              <>
                <Button variant="outline" onClick={computePayroll} disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Calculator className="h-4 w-4 mr-1" />}
                  Compute
                </Button>
                <Button variant="outline" onClick={lockPeriod} disabled={busy || lines.length === 0}>
                  <Lock className="h-4 w-4 mr-1" /> Lock
                </Button>
              </>
            )}
            {activePeriod?.status === "locked" && (
              <Button variant="outline" onClick={markPaid} disabled={busy}>
                <CheckCircle2 className="h-4 w-4 mr-1" /> Mark Paid
              </Button>
            )}
            {activePeriod && lines.length > 0 && (
              <Button onClick={exportXlsx} disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Download className="h-4 w-4 mr-1" />}
                Export Excel
              </Button>
            )}
          </div>

          {/* Totals */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Employees</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold num">{lines.length}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Regular Hours</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold num">{formatHours(totals.reg)}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Overtime Hours</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold num text-warning">{formatHours(totals.ot)}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Payroll</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold num text-success">{formatCurrency(totals.pay)}</div></CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-6 space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : lines.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">
                  <FileSpreadsheet className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No payroll lines yet</p>
                  <p className="text-sm">{activePeriod ? 'Click "Compute" to aggregate approved timesheets.' : "Create or select a pay period to begin."}</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead className="text-right">Regular</TableHead>
                      <TableHead className="text-right">OT</TableHead>
                      <TableHead className="text-right">Rate</TableHead>
                      <TableHead className="text-right">Regular Pay</TableHead>
                      <TableHead className="text-right">OT Pay</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lines.map((l) => (
                      <TableRow key={l.id}>
                        <TableCell>
                          <div className="font-medium">{l.profile?.full_name ?? "—"}</div>
                          <div className="text-xs text-muted-foreground">{l.profile?.employee_id ?? ""}</div>
                        </TableCell>
                        <TableCell className="text-right num">{formatHours(l.regular_hours)}</TableCell>
                        <TableCell className="text-right num text-warning">{formatHours(l.overtime_hours)}</TableCell>
                        <TableCell className="text-right num">{formatCurrency(l.hourly_rate, l.currency)}</TableCell>
                        <TableCell className="text-right num">{formatCurrency(l.regular_pay, l.currency)}</TableCell>
                        <TableCell className="text-right num">{formatCurrency(l.overtime_pay, l.currency)}</TableCell>
                        <TableCell className="text-right num font-semibold">{formatCurrency(l.total_pay, l.currency)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rates" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setRateDialog(true)}>
              <Plus className="h-4 w-4 mr-1" /> Add Pay Rate
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              {rates.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">No pay rates configured yet.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead className="text-right">Hourly Rate</TableHead>
                      <TableHead className="text-right">OT Multiplier</TableHead>
                      <TableHead>Currency</TableHead>
                      <TableHead>Effective From</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rates.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>
                          <div className="font-medium">{r.profile?.full_name ?? "—"}</div>
                          <div className="text-xs text-muted-foreground">{r.profile?.employee_id ?? ""}</div>
                        </TableCell>
                        <TableCell className="text-right num">{formatCurrency(r.hourly_rate, r.currency)}</TableCell>
                        <TableCell className="text-right num">{Number(r.overtime_multiplier).toFixed(2)}x</TableCell>
                        <TableCell>{r.currency}</TableCell>
                        <TableCell>{format(parseISO(r.effective_from), "MMM d, yyyy")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* New period dialog */}
      <Dialog open={periodDialog} onOpenChange={setPeriodDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Pay Period</DialogTitle>
            <DialogDescription>Define a pay period to aggregate hours.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={newPeriod.name} onChange={(e) => setNewPeriod({ ...newPeriod, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Start</Label>
                <Input type="date" value={newPeriod.period_start} onChange={(e) => setNewPeriod({ ...newPeriod, period_start: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>End</Label>
                <Input type="date" value={newPeriod.period_end} onChange={(e) => setNewPeriod({ ...newPeriod, period_end: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPeriodDialog(false)}>Cancel</Button>
            <Button onClick={createPeriod} disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New pay rate dialog */}
      <Dialog open={rateDialog} onOpenChange={setRateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Pay Rate</DialogTitle>
            <DialogDescription>Sets the hourly rate from this date forward.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Employee</Label>
              <Select value={newRate.user_id} onValueChange={(v) => setNewRate({ ...newRate, user_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {profiles.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.full_name} {p.employee_id ? `(${p.employee_id})` : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Hourly Rate</Label>
                <Input type="number" min={0} step={0.01} value={newRate.hourly_rate} onChange={(e) => setNewRate({ ...newRate, hourly_rate: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="space-y-1.5">
                <Label>OT Multiplier</Label>
                <Input type="number" min={1} step={0.1} value={newRate.overtime_multiplier} onChange={(e) => setNewRate({ ...newRate, overtime_multiplier: parseFloat(e.target.value) || 1.5 })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Currency</Label>
                <Input value={newRate.currency} onChange={(e) => setNewRate({ ...newRate, currency: e.target.value.toUpperCase() })} />
              </div>
              <div className="space-y-1.5">
                <Label>Effective From</Label>
                <Input type="date" value={newRate.effective_from} onChange={(e) => setNewRate({ ...newRate, effective_from: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRateDialog(false)}>Cancel</Button>
            <Button onClick={saveRate} disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
