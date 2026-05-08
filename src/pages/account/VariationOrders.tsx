import * as React from "react";
import { format, parseISO } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useProjects } from "@/contexts/ProjectContext";
import { useAuth } from "@/contexts/AuthContext";
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
import { Plus, CheckCheck, Loader2, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import {
  VO_STATUS_LABELS,
  VO_STATUS_TONE,
  type VariationOrder,
  type VoStatus,
} from "@/lib/financialMeta";

export default function VariationOrders() {
  const { activeProject } = useProjects();
  const { roles } = useAuth();
  const isAdmin = roles.includes("admin");
  const [items, setItems] = React.useState<VariationOrder[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({
    vo_number: "",
    title: "",
    description: "",
    amount_change: 0,
    reason: "",
  });

  const load = React.useCallback(async () => {
    if (!activeProject) { setItems([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from("variation_orders")
      .select("*")
      .eq("project_id", activeProject.id)
      .order("created_at", { ascending: false }) as any;
    setItems((data ?? []) as VariationOrder[]);
    setLoading(false);
  }, [activeProject]);

  React.useEffect(() => { load(); }, [load]);

  const totalVariations = items.reduce((s, i) => s + i.amount_change, 0);

  const create = async () => {
    if (!activeProject) return;
    if (!form.vo_number || !form.title) {
      toast.error("VO number and title are required");
      return;
    }
    const { error } = await supabase.from("variation_orders").insert({
      project_id: activeProject.id,
      vo_number: form.vo_number,
      title: form.title,
      description: form.description || null,
      amount_change: form.amount_change,
      reason: form.reason || null,
    }) as any;
    if (error) toast.error(error.message);
    else {
      toast.success("Variation order created");
      setOpen(false);
      setForm({ vo_number: "", title: "", description: "", amount_change: 0, reason: "" });
      load();
    }
  };

  const updateStatus = async (id: string, status: VoStatus) => {
    setBusy(id);
    const updates: any = { status };
    if (status === "approved") {
      updates.approved_at = new Date().toISOString();
    }
    const { error } = await supabase.from("variation_orders").update(updates).eq("id", id) as any;
    setBusy(null);
    if (error) toast.error(error.message);
    else { toast.success(`VO ${status}`); load(); }
  };

  if (!activeProject) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Variation Orders</h1>
        <Card><CardContent className="p-12 text-center text-muted-foreground">Select a project first.</CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Variation Orders</h1>
          <p className="text-muted-foreground">Track budget changes and scope variations</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-sm text-muted-foreground">Total Variations</span>
            <p className={cn("text-xl font-bold", totalVariations >= 0 ? "text-success" : "text-destructive")}>
              {totalVariations >= 0 ? "+" : ""}${totalVariations.toLocaleString()}
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />New VO</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New Variation Order</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>VO Number</Label>
                  <Input value={form.vo_number} onChange={(e) => setForm({ ...form, vo_number: e.target.value })} placeholder="e.g. VO-001" />
                </div>
                <div>
                  <Label>Title</Label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
                <div>
                  <Label>Amount Change (+/-)</Label>
                  <Input type="number" value={form.amount_change || ""} onChange={(e) => setForm({ ...form, amount_change: parseFloat(e.target.value) || 0 })} />
                </div>
                <div>
                  <Label>Reason</Label>
                  <Textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
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
              <p className="font-medium">No variation orders</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>VO #</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount Change</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((vo) => (
                  <TableRow key={vo.id}>
                    <TableCell className="font-mono text-xs font-medium">{vo.vo_number}</TableCell>
                    <TableCell className="font-medium">{vo.title}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{vo.description || "—"}</TableCell>
                    <TableCell className="text-right">
                      <span className={cn("inline-flex items-center gap-1 font-medium", vo.amount_change >= 0 ? "text-success" : "text-destructive")}>
                        {vo.amount_change >= 0 ? <ArrowUpCircle className="h-3 w-3" /> : <ArrowDownCircle className="h-3 w-3" />}
                        ${Math.abs(vo.amount_change).toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">{vo.reason || "—"}</TableCell>
                    <TableCell>
                      <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", VO_STATUS_TONE[vo.status]?.bg, VO_STATUS_TONE[vo.status]?.fg)}>
                        {VO_STATUS_LABELS[vo.status]}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">{format(parseISO(vo.created_at), "MMM d")}</TableCell>
                    <TableCell className="text-right">
                      {isAdmin && vo.status === "draft" && (
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="outline" onClick={() => updateStatus(vo.id, "submitted")}>Submit</Button>
                        </div>
                      )}
                      {isAdmin && vo.status === "submitted" && (
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="outline" disabled={busy === vo.id} onClick={() => updateStatus(vo.id, "approved")}>
                            {busy === vo.id ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                            Approve
                          </Button>
                          <Button size="sm" variant="destructive" disabled={busy === vo.id} onClick={() => updateStatus(vo.id, "rejected")}>
                            Reject
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
    </div>
  );
}
