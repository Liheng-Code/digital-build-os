import * as React from "react";
import { format, parseISO } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useProjects } from "@/contexts/ProjectContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Plus, CheckCheck, Loader2 } from "lucide-react";
import {
  AR_INVOICE_STATUS_LABELS,
  AR_INVOICE_STATUS_TONE,
  type ClientInvoice,
  type ArInvoiceStatus,
} from "@/lib/financialMeta";

export default function ClientInvoices() {
  const { activeProject } = useProjects();
  const [items, setItems] = React.useState<ClientInvoice[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [open, setOpen] = React.useState(false);
  const [payDialog, setPayDialog] = React.useState<string | null>(null);
  const [payAmount, setPayAmount] = React.useState("");
  const [payRef, setPayRef] = React.useState("");
  const [form, setForm] = React.useState({
    invoice_number: "",
    invoice_date: "",
    due_date: "",
    period_start: "",
    period_end: "",
    amount: 0,
    retention_pct: 0,
    notes: "",
  });

  const load = React.useCallback(async () => {
    if (!activeProject) { setItems([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from("client_invoices")
      .select("*")
      .eq("project_id", activeProject.id)
      .order("invoice_date", { ascending: false }) as any;
    setItems((data ?? []) as ClientInvoice[]);
    setLoading(false);
  }, [activeProject]);

  React.useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!activeProject) return;
    if (!form.invoice_number || form.amount <= 0) {
      toast.error("Invoice number and amount are required");
      return;
    }
    const { error } = await supabase.from("client_invoices").insert({
      project_id: activeProject.id,
      invoice_number: form.invoice_number,
      invoice_date: form.invoice_date || new Date().toISOString().split("T")[0],
      due_date: form.due_date || null,
      period_start: form.period_start || null,
      period_end: form.period_end || null,
      amount: form.amount,
      retention_pct: form.retention_pct || 0,
      notes: form.notes || null,
    }) as any;
    if (error) toast.error(error.message);
    else {
      toast.success("Client invoice created");
      setOpen(false);
      setForm({ invoice_number: "", invoice_date: "", due_date: "", period_start: "", period_end: "", amount: 0, retention_pct: 0, notes: "" });
      load();
    }
  };

  const updateStatus = async (id: string, status: ArInvoiceStatus) => {
    setBusy(id);
    const { error } = await supabase.from("client_invoices").update({ status }).eq("id", id) as any;
    setBusy(null);
    if (error) toast.error(error.message);
    else { toast.success(`Invoice ${status}`); load(); }
  };

  const recordPayment = async (invoiceId: string) => {
    const amt = parseFloat(payAmount);
    if (!amt || amt <= 0) { toast.error("Enter a valid amount"); return; }
    setBusy(invoiceId);
    const { error } = await supabase.from("client_invoice_payments").insert({
      client_invoice_id: invoiceId,
      payment_date: new Date().toISOString().split("T")[0],
      amount: amt,
      payment_ref: payRef || null,
    }) as any;
    setBusy(null);
    if (error) toast.error(error.message);
    else {
      toast.success("Payment recorded");
      setPayDialog(null);
      setPayAmount("");
      setPayRef("");
      load();
    }
  };

  if (!activeProject) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Client Invoices</h1>
        <Card><CardContent className="p-12 text-center text-muted-foreground">Select a project first.</CardContent></Card>
      </div>
    );
  }

  const totalOutstanding = items
    .filter((i) => i.status !== "paid" && i.status !== "cancelled")
    .reduce((s, i) => s + (i.total_amount - i.paid_amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Client Invoices</h1>
          <p className="text-muted-foreground">Accounts Receivable — billing and payment tracking</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-sm text-muted-foreground">Outstanding</span>
            <p className="text-xl font-bold text-destructive">${totalOutstanding.toLocaleString()}</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />New Invoice</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New Client Invoice</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Invoice Number</Label>
                  <Input value={form.invoice_number} onChange={(e) => setForm({ ...form, invoice_number: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Invoice Date</Label>
                    <Input type="date" value={form.invoice_date} onChange={(e) => setForm({ ...form, invoice_date: e.target.value })} />
                  </div>
                  <div>
                    <Label>Due Date</Label>
                    <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Period Start</Label>
                    <Input type="date" value={form.period_start} onChange={(e) => setForm({ ...form, period_start: e.target.value })} />
                  </div>
                  <div>
                    <Label>Period End</Label>
                    <Input type="date" value={form.period_end} onChange={(e) => setForm({ ...form, period_end: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label>Amount</Label>
                  <Input type="number" value={form.amount || ""} onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} />
                </div>
                <div>
                  <Label>Retention %</Label>
                  <Input type="number" value={form.retention_pct || ""} onChange={(e) => setForm({ ...form, retention_pct: parseFloat(e.target.value) || 0 })} />
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
                <Button onClick={create} className="w-full">Create</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : items.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCheck className="h-12 w-12 text-success mx-auto mb-2" />
              <p className="font-medium">No client invoices yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Retention</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-mono text-xs font-medium">{inv.invoice_number}</TableCell>
                    <TableCell className="text-sm">{format(parseISO(inv.invoice_date), "MMM d, yyyy")}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {inv.period_start ? format(parseISO(inv.period_start), "MMM d") : "—"} – {inv.period_end ? format(parseISO(inv.period_end), "MMM d") : "—"}
                    </TableCell>
                    <TableCell className="text-right num">${inv.total_amount.toLocaleString()}</TableCell>
                    <TableCell className="text-right num text-success">${inv.paid_amount.toLocaleString()}</TableCell>
                    <TableCell className="text-right num text-muted-foreground">${inv.retention_amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", AR_INVOICE_STATUS_TONE[inv.status]?.bg, AR_INVOICE_STATUS_TONE[inv.status]?.fg)}>
                        {AR_INVOICE_STATUS_LABELS[inv.status]}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {inv.status === "draft" && (
                          <Button size="sm" variant="outline" onClick={() => updateStatus(inv.id, "submitted")}>Submit</Button>
                        )}
                        {inv.status === "submitted" && (
                          <Button size="sm" variant="outline" onClick={() => updateStatus(inv.id, "certified")}>Certify</Button>
                        )}
                        {(inv.status === "certified" || inv.status === "partially_paid") && (
                          <Dialog open={payDialog === inv.id} onOpenChange={(v) => { setPayDialog(v ? inv.id : null); setPayAmount(""); setPayRef(""); }}>
                            <DialogTrigger asChild>
                              <Button size="sm" disabled={busy === inv.id}>Record Payment</Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader><DialogTitle>Record Payment — {inv.invoice_number}</DialogTitle></DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>Amount</Label>
                                  <Input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
                                </div>
                                <div>
                                  <Label>Reference</Label>
                                  <Input value={payRef} onChange={(e) => setPayRef(e.target.value)} placeholder="Check # / Transfer ref" />
                                </div>
                                <Button onClick={() => recordPayment(inv.id)} className="w-full">
                                  {busy === inv.id && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                  Record Payment
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
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
