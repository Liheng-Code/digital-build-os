import * as React from "react";
import { format, parseISO } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useProjects } from "@/contexts/ProjectContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Plus, Loader2, CheckCheck } from "lucide-react";
import {
  PAYMENT_REQUEST_STATUS_LABELS,
  PAYMENT_REQUEST_STATUS_TONE,
  PAYMENT_REQUEST_TYPE_LABELS,
  type PaymentRequest,
  type PaymentRequestStatus,
} from "@/lib/financialMeta";

export default function PaymentRequests() {
  const { activeProject } = useProjects();
  const { user } = useAuth();
  const [items, setItems] = React.useState<PaymentRequest[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [open, setOpen] = React.useState(false);
  const [tab, setTab] = React.useState("all");
  const [form, setForm] = React.useState({
    request_number: "",
    request_type: "supplier",
    payee_name: "",
    amount: 0,
    due_date: "",
    description: "",
    notes: "",
  });

  const load = React.useCallback(async () => {
    if (!activeProject) { setItems([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from("payment_requests")
      .select("*")
      .eq("project_id", activeProject.id)
      .order("created_at", { ascending: false }) as any;
    setItems((data ?? []) as PaymentRequest[]);
    setLoading(false);
  }, [activeProject]);

  React.useEffect(() => { load(); }, [load]);

  const filtered = React.useMemo(() => {
    if (tab === "all") return items;
    return items.filter((i) => i.status === tab);
  }, [items, tab]);

  const create = async () => {
    if (!activeProject || !user) return;
    if (!form.request_number || !form.payee_name || form.amount <= 0) {
      toast.error("Number, payee, and amount are required");
      return;
    }
    const { error } = await supabase.from("payment_requests").insert({
      project_id: activeProject.id,
      request_number: form.request_number,
      request_type: form.request_type,
      payee_name: form.payee_name,
      amount: form.amount,
      due_date: form.due_date || null,
      description: form.description || null,
      notes: form.notes || null,
      requested_by: user.id,
      status: "draft",
    }) as any;
    if (error) toast.error(error.message);
    else {
      toast.success("Payment request created");
      setOpen(false);
      setForm({ request_number: "", request_type: "supplier", payee_name: "", amount: 0, due_date: "", description: "", notes: "" });
      load();
    }
  };

  const updateStatus = async (id: string, status: PaymentRequestStatus) => {
    setBusy(id);
    const updates: any = { status };
    if (status === "approved" && user) {
      updates.approved_by = user.id;
      updates.approved_at = new Date().toISOString();
    }
    if (status === "paid") {
      updates.paid_at = new Date().toISOString();
    }
    const { error } = await supabase.from("payment_requests").update(updates).eq("id", id) as any;
    setBusy(null);
    if (error) toast.error(error.message);
    else { toast.success(`Request ${status}`); load(); }
  };

  if (!activeProject) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Payment Requests</h1>
        <Card><CardContent className="p-12 text-center text-muted-foreground">Select a project first.</CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payment Requests</h1>
          <p className="text-muted-foreground">Supplier and subcontractor payment approvals</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />New Request</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Payment Request</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Request Number</Label>
                <Input value={form.request_number} onChange={(e) => setForm({ ...form, request_number: e.target.value })} placeholder="e.g. PR-001" />
              </div>
              <div>
                <Label>Type</Label>
                <Select value={form.request_type} onValueChange={(v) => setForm({ ...form, request_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="supplier">Supplier</SelectItem>
                    <SelectItem value="subcontractor">Subcontractor</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Payee Name</Label>
                <Input value={form.payee_name} onChange={(e) => setForm({ ...form, payee_name: e.target.value })} />
              </div>
              <div>
                <Label>Amount</Label>
                <Input type="number" value={form.amount || ""} onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} />
              </div>
              <div>
                <Label>Due Date</Label>
                <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <Button onClick={create} className="w-full">Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">All ({items.length})</TabsTrigger>
          <TabsTrigger value="draft">Draft</TabsTrigger>
          <TabsTrigger value="submitted">Submitted</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="paid">Paid</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-6 space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : filtered.length === 0 ? (
                <div className="p-12 text-center">
                  <CheckCheck className="h-12 w-12 text-success mx-auto mb-2" />
                  <p className="font-medium">No payment requests</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Number</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Payee</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono text-xs font-medium">{r.request_number}</TableCell>
                        <TableCell><Badge variant="outline">{PAYMENT_REQUEST_TYPE_LABELS[r.request_type as keyof typeof PAYMENT_REQUEST_TYPE_LABELS]}</Badge></TableCell>
                        <TableCell className="font-medium">{r.payee_name}</TableCell>
                        <TableCell className="text-right num">{r.currency} {r.amount.toLocaleString()}</TableCell>
                        <TableCell className="text-sm">{r.due_date ? format(parseISO(r.due_date), "MMM d, yyyy") : "—"}</TableCell>
                        <TableCell>
                          <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", PAYMENT_REQUEST_STATUS_TONE[r.status]?.bg, PAYMENT_REQUEST_STATUS_TONE[r.status]?.fg)}>
                            {PAYMENT_REQUEST_STATUS_LABELS[r.status]}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {r.status === "draft" && (
                              <Button size="sm" variant="outline" onClick={() => updateStatus(r.id, "submitted")}>
                                Submit
                              </Button>
                            )}
                            {r.status === "submitted" && (
                              <>
                                <Button size="sm" variant="outline" disabled={busy === r.id} onClick={() => updateStatus(r.id, "approved")}>
                                  {busy === r.id ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                                  Approve
                                </Button>
                                <Button size="sm" variant="destructive" disabled={busy === r.id} onClick={() => updateStatus(r.id, "cancelled")}>
                                  Reject
                                </Button>
                              </>
                            )}
                            {r.status === "approved" && (
                              <Button size="sm" disabled={busy === r.id} onClick={() => updateStatus(r.id, "paid")}>
                                {busy === r.id ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                                Mark Paid
                              </Button>
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
