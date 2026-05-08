import * as React from "react";
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
import { toast } from "sonner";
import { Plus, Pencil, CheckCheck } from "lucide-react";

interface ResourceRate {
  id: string;
  project_id: string;
  resource_name: string;
  hourly_rate: number;
}

export default function ResourceRates() {
  const { activeProject } = useProjects();
  const [items, setItems] = React.useState<ResourceRate[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [open, setOpen] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({ resource_name: "", hourly_rate: 0 });

  const load = React.useCallback(async () => {
    if (!activeProject) { setItems([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from("resource_rates")
      .select("*")
      .eq("project_id", activeProject.id)
      .order("resource_name") as any;
    setItems((data ?? []) as ResourceRate[]);
    setLoading(false);
  }, [activeProject]);

  React.useEffect(() => { load(); }, [load]);

  const resetForm = () => { setForm({ resource_name: "", hourly_rate: 0 }); setEditId(null); };

  const save = async () => {
    if (!activeProject) return;
    if (!form.resource_name || form.hourly_rate <= 0) {
      toast.error("Name and rate are required");
      return;
    }
    const payload = { project_id: activeProject.id, resource_name: form.resource_name, hourly_rate: form.hourly_rate };
    if (editId) {
      const { error } = await supabase.from("resource_rates").update(payload).eq("id", editId) as any;
      if (error) toast.error(error.message);
      else toast.success("Rate updated");
    } else {
      const { error } = await supabase.from("resource_rates").insert(payload) as any;
      if (error) toast.error(error.message);
      else toast.success("Rate created");
    }
    setOpen(false);
    resetForm();
    load();
  };

  const openEdit = (r: ResourceRate) => {
    setForm({ resource_name: r.resource_name, hourly_rate: r.hourly_rate });
    setEditId(r.id);
    setOpen(true);
  };

  if (!activeProject) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Resource Rates</h1>
        <Card><CardContent className="p-12 text-center text-muted-foreground">Select a project first.</CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Resource Rates</h1>
          <p className="text-muted-foreground">Hourly rates for labor and equipment costing</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Add Rate</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editId ? "Edit Rate" : "New Rate"}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Resource Name</Label>
                <Input value={form.resource_name} onChange={(e) => setForm({ ...form, resource_name: e.target.value })} placeholder="e.g. General Laborer" />
              </div>
              <div>
                <Label>Hourly Rate ($)</Label>
                <Input type="number" value={form.hourly_rate || ""} onChange={(e) => setForm({ ...form, hourly_rate: parseFloat(e.target.value) || 0 })} />
              </div>
              <Button onClick={save} className="w-full">Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : items.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCheck className="h-12 w-12 text-success mx-auto mb-2" />
              <p className="font-medium">No resource rates configured</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Resource</TableHead>
                  <TableHead className="text-right">Hourly Rate</TableHead>
                  <TableHead className="text-right w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.resource_name}</TableCell>
                    <TableCell className="text-right num">${r.hourly_rate.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(r)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
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
