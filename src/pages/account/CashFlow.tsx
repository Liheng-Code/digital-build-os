import * as React from "react";
import { format, parseISO } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useProjects } from "@/contexts/ProjectContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Plus, CheckCheck, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import {
  CASH_FLOW_CATEGORY_LABELS,
  CASH_FLOW_ITEM_STATUS_LABELS,
  type CashFlowProjection,
  type CashFlowCategory,
} from "@/lib/financialMeta";

export default function CashFlow() {
  const { activeProject } = useProjects();
  const [items, setItems] = React.useState<CashFlowProjection[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({
    period_date: "",
    category: "client_payment" as CashFlowCategory,
    description: "",
    forecast_amount: 0,
    is_inflow: true,
    notes: "",
  });

  const load = React.useCallback(async () => {
    if (!activeProject) { setItems([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from("cash_flow_projections")
      .select("*")
      .eq("project_id", activeProject.id)
      .order("period_date", { ascending: true }) as any;
    setItems((data ?? []) as CashFlowProjection[]);
    setLoading(false);
  }, [activeProject]);

  React.useEffect(() => { load(); }, [load]);

  const summary = React.useMemo(() => {
    const inflow = items.filter((i) => i.is_inflow).reduce((s, i) => s + (i.status === "actual" ? i.actual_amount : i.forecast_amount), 0);
    const outflow = items.filter((i) => !i.is_inflow).reduce((s, i) => s + (i.status === "actual" ? i.actual_amount : i.forecast_amount), 0);
    return { inflow, outflow, net: inflow - outflow };
  }, [items]);

  const create = async () => {
    if (!activeProject) return;
    if (!form.period_date || form.forecast_amount <= 0) {
      toast.error("Period date and amount are required");
      return;
    }
    const { error } = await supabase.from("cash_flow_projections").insert({
      project_id: activeProject.id,
      period_date: form.period_date,
      category: form.category,
      description: form.description || null,
      forecast_amount: form.forecast_amount,
      is_inflow: form.is_inflow,
      notes: form.notes || null,
    }) as any;
    if (error) toast.error(error.message);
    else {
      toast.success("Cash flow item added");
      setOpen(false);
      setForm({ period_date: "", category: "client_payment", description: "", forecast_amount: 0, is_inflow: true, notes: "" });
      load();
    }
  };

  if (!activeProject) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Cash Flow</h1>
        <Card><CardContent className="p-12 text-center text-muted-foreground">Select a project first.</CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cash Flow</h1>
          <p className="text-muted-foreground">Forecast and track project cash flows</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Add Item</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Cash Flow Item</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Period Date</Label>
                <Input type="date" value={form.period_date} onChange={(e) => setForm({ ...form, period_date: e.target.value })} />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v: CashFlowCategory) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CASH_FLOW_CATEGORY_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Direction</Label>
                <Select value={form.is_inflow ? "inflow" : "outflow"} onValueChange={(v) => setForm({ ...form, is_inflow: v === "inflow" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inflow">Inflow (Receiving)</SelectItem>
                    <SelectItem value="outflow">Outflow (Paying)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Forecast Amount</Label>
                <Input type="number" value={form.forecast_amount || ""} onChange={(e) => setForm({ ...form, forecast_amount: parseFloat(e.target.value) || 0 })} />
              </div>
              <div>
                <Label>Description</Label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <Button onClick={create} className="w-full">Add</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Forecast Inflow</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-success">${summary.inflow.toLocaleString()}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Forecast Outflow</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-destructive">${summary.outflow.toLocaleString()}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Net Position</CardTitle></CardHeader>
          <CardContent>
            <p className={cn("text-2xl font-bold", summary.net >= 0 ? "text-success" : "text-destructive")}>
              ${summary.net.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : items.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCheck className="h-12 w-12 text-success mx-auto mb-2" />
              <p className="font-medium">No cash flow items</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Forecast</TableHead>
                  <TableHead className="text-right">Actual</TableHead>
                  <TableHead>Direction</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((cf) => (
                  <TableRow key={cf.id}>
                    <TableCell className="text-sm">{format(parseISO(cf.period_date), "MMM yyyy")}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{CASH_FLOW_CATEGORY_LABELS[cf.category]}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{cf.description || "—"}</TableCell>
                    <TableCell className="text-right num">${cf.forecast_amount.toLocaleString()}</TableCell>
                    <TableCell className="text-right num">{cf.actual_amount ? `$${cf.actual_amount.toLocaleString()}` : "—"}</TableCell>
                    <TableCell>
                      <span className={cn("inline-flex items-center gap-1 text-xs", cf.is_inflow ? "text-success" : "text-destructive")}>
                        {cf.is_inflow ? <ArrowUpCircle className="h-3 w-3" /> : <ArrowDownCircle className="h-3 w-3" />}
                        {cf.is_inflow ? "In" : "Out"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={cf.status === "actual" ? "default" : cf.status === "confirmed" ? "secondary" : "outline"}>
                        {CASH_FLOW_ITEM_STATUS_LABELS[cf.status]}
                      </Badge>
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
