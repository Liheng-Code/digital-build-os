import * as React from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProjects } from "@/contexts/ProjectContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Package, 
  CheckCircle2, 
  Clock, 
  FileText, 
  ShieldCheck, 
  Plus, 
  Download, 
  ArrowRight,
  AlertCircle,
  Loader2,
  Trash2,
  FileDown
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { storageService } from "@/services/storageService";

export default function Handover() {
  const { activeProject } = useProjects();
  const [packages, setPackages] = React.useState<any[]>([]);
  const [warranties, setWarranties] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState("packages");

  const loadData = async () => {
    if (!activeProject) return;
    setLoading(true);
    try {
      const [pkgsRes, warRes] = await Promise.all([
        supabase.from("handover_packages").select("*").eq("project_id", activeProject.id).order("created_at", { ascending: false }),
        supabase.from("warranty_register").select("*, stakeholders(name)").eq("project_id", activeProject.id).order("end_date")
      ]);
      setPackages(pkgsRes.data || []);
      setWarranties(warRes.data || []);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadData();
  }, [activeProject]);

  if (!activeProject) return <div className="p-8 text-muted-foreground">Select a project to view Project Closure.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Handover & Commissioning</h1>
          <p className="text-muted-foreground">Manage project completion, O&M manuals, and warranty registers.</p>
        </div>
        <div className="flex gap-2">
          <NewPackageDialog projectId={activeProject.id} onDone={loadData} />
          <NewWarrantyDialog projectId={activeProject.id} onDone={loadData} />
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Packages</p>
                <div className="text-2xl font-bold">{packages.length}</div>
              </div>
              <Package className="h-8 w-8 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Approved</p>
                <div className="text-2xl font-bold text-success">{packages.filter(p => p.status === 'approved').length}</div>
              </div>
              <CheckCircle2 className="h-8 w-8 text-success opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Active Warranties</p>
                <div className="text-2xl font-bold text-blue-600">{warranties.filter(w => w.status === 'active').length}</div>
              </div>
              <ShieldCheck className="h-8 w-8 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Completion</p>
                <div className="text-2xl font-bold">85%</div>
              </div>
              <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="packages" className="gap-2"><Package className="h-4 w-4" /> Handover Packages</TabsTrigger>
          <TabsTrigger value="warranties" className="gap-2"><ShieldCheck className="h-4 w-4" /> Warranty Register</TabsTrigger>
          <TabsTrigger value="docs" className="gap-2"><FileText className="h-4 w-4" /> Final Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="packages" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {packages.map(pkg => (
              <PackageCard key={pkg.id} pkg={pkg} onUpdate={loadData} />
            ))}
            {packages.length === 0 && !loading && (
              <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                No handover packages created yet.
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="warranties">
          <Card>
            <CardHeader><CardTitle className="text-base">Equipment & Material Warranties</CardTitle></CardHeader>
            <CardContent className="p-0 overflow-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="p-4 font-medium">Item Name</th>
                    <th className="p-4 font-medium">Provider</th>
                    <th className="p-4 font-medium">Start Date</th>
                    <th className="p-4 font-medium">End Date</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 text-right">Certificate</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {warranties.map(w => (
                    <tr key={w.id} className="hover:bg-muted/30">
                      <td className="p-4 font-medium">{w.item_name}</td>
                      <td className="p-4">{w.stakeholders?.name || "—"}</td>
                      <td className="p-4">{w.start_date ? format(new Date(w.start_date), "dd MMM yyyy") : "—"}</td>
                      <td className="p-4">{w.end_date ? format(new Date(w.end_date), "dd MMM yyyy") : "—"}</td>
                      <td className="p-4"><Badge variant={w.status === 'active' ? 'default' : 'secondary'}>{w.status}</Badge></td>
                      <td className="p-4 text-right">
                        {w.certificate_url && (
                          <Button variant="ghost" size="icon" onClick={() => storageService.downloadFile("design-files", w.certificate_url, `Warranty_${w.item_name}.pdf`)}>
                            <FileDown className="h-4 w-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {warranties.length === 0 && !loading && <tr><td colSpan={6} className="p-12 text-center text-muted-foreground italic">No warranties registered.</td></tr>}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="docs">
          <Card>
            <CardHeader><CardTitle className="text-base">Critical Closure Documents</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { title: "As-Built Drawing Set", status: "In Progress", color: "text-blue-600" },
                  { title: "Testing & Commissioning Reports", status: "Pending", color: "text-amber-600" },
                  { title: "O&M Manual Consolidated", status: "Not Started", color: "text-muted-foreground" },
                  { title: "Final Account Statement", status: "In Progress", color: "text-blue-600" },
                  { title: "Practical Completion Certificate", status: "Not Started", color: "text-muted-foreground" },
                  { title: "Final Snag List", status: "80% Clear", color: "text-success" }
                ].map(d => (
                  <div key={d.title} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium">{d.title}</span>
                    </div>
                    <Badge variant="outline" className={d.color}>{d.status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PackageCard({ pkg, onUpdate }: { pkg: any; onUpdate: () => void }) {
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);

  const loadItems = async () => {
    setLoading(true);
    const { data } = await supabase.from("handover_items").select("*").eq("package_id", pkg.id);
    setItems(data || []);
    setLoading(false);
  };

  const deletePkg = async () => {
    if (!confirm("Delete this package and all items?")) return;
    await supabase.from("handover_packages").delete().eq("id", pkg.id);
    onUpdate();
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <Badge className="capitalize" variant={pkg.status === 'approved' ? 'default' : 'secondary'}>{pkg.status}</Badge>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={deletePkg}><Trash2 className="h-4 w-4" /></Button>
        </div>
        <CardTitle className="text-lg mt-2">{pkg.title}</CardTitle>
        <CardDescription className="line-clamp-2">{pkg.description || "No description provided."}</CardDescription>
      </CardHeader>
      <CardContent>
        <Dialog open={isOpen} onOpenChange={(v) => { setIsOpen(v); if(v) loadItems(); }}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full gap-2">Manage Items <ArrowRight className="h-4 w-4" /></Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>{pkg.title} - Items</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <ScrollArea className="h-80 border rounded-md p-4">
                {loading ? <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin" /></div> : (
                  <div className="space-y-3">
                    {items.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-primary uppercase tracking-tighter">{item.item_type.replace('_', ' ')}</span>
                          <span className="font-medium">{item.title}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={item.status === 'verified' ? 'default' : 'outline'}>{item.status}</Badge>
                        </div>
                      </div>
                    ))}
                    {items.length === 0 && <div className="text-center py-8 text-muted-foreground italic">No items added to this package.</div>}
                  </div>
                )}
              </ScrollArea>
              <AddItemDialog packageId={pkg.id} onDone={loadItems} />
            </div>
            <DialogFooter>
              <Button onClick={() => setIsOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

function NewPackageDialog({ projectId, onDone }: { projectId: string; onDone: () => void }) {
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({ title: "", description: "" });
  const [submitting, setSubmitting] = React.useState(false);

  const handleSave = async () => {
    if (!form.title) return toast.error("Title is required");
    setSubmitting(true);
    const { error } = await supabase.from("handover_packages").insert({ ...form, project_id: projectId });
    if (!error) {
      toast.success("Package created");
      setOpen(false);
      onDone();
    } else toast.error(error.message);
    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> New Package</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Create Handover Package</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2"><Label>Package Title</Label><Input placeholder="e.g. Phase 1 Electrical Handover" value={form.title} onChange={e => setForm({...form, title: e.target.value})} /></div>
          <div className="grid gap-2"><Label>Description</Label><Textarea placeholder="Scope of handover..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
        </div>
        <DialogFooter><Button onClick={handleSave} disabled={submitting}>Create Package</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddItemDialog({ packageId, onDone }: { packageId: string; onDone: () => void }) {
  const [form, setForm] = React.useState({ title: "", item_type: "om_manual" });
  const [open, setOpen] = React.useState(false);

  const add = async () => {
    if (!form.title) return;
    await supabase.from("handover_items").insert({ ...form, package_id: packageId });
    setOpen(false);
    onDone();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="outline" size="sm" className="w-full gap-2"><Plus className="h-3 w-3" /> Add Item</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Handover Item</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2"><Label>Item Name</Label><Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} /></div>
          <div className="grid gap-2"><Label>Type</Label>
            <Select value={form.item_type} onValueChange={v => setForm({...form, item_type: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="om_manual">O&M Manual</SelectItem>
                <SelectItem value="as_built">As-Built Drawing</SelectItem>
                <SelectItem value="warranty">Warranty Cert</SelectItem>
                <SelectItem value="spare_part">Spare Parts List</SelectItem>
                <SelectItem value="training">Training Record</SelectItem>
                <SelectItem value="key">Key/Access Handover</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter><Button onClick={add}>Add to Package</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NewWarrantyDialog({ projectId, onDone }: { projectId: string; onDone: () => void }) {
  const [open, setOpen] = React.useState(false);
  const [stakeholders, setStakeholders] = React.useState<any[]>([]);
  const [form, setForm] = React.useState({ item_name: "", provider_id: "", start_date: "", duration_months: 12 });
  const [file, setFile] = React.useState<File | null>(null);

  React.useEffect(() => {
    if (open) {
      supabase.from("stakeholders").select("id, name").order("name").then(({ data }) => setStakeholders(data || []));
    }
  }, [open]);

  const save = async () => {
    if (!form.item_name) return;
    let url = "";
    if (file) {
      const { path } = await storageService.uploadFile(file, { bucket: "design-files", projectId, folder: "closure/warranties" });
      url = path;
    }
    const end = new Date(form.start_date);
    end.setMonth(end.getMonth() + Number(form.duration_months));

    await supabase.from("warranty_register").insert({
      ...form,
      project_id: projectId,
      certificate_url: url || null,
      end_date: end.toISOString().split('T')[0]
    });
    setOpen(false);
    onDone();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="outline" className="gap-2"><ShieldCheck className="h-4 w-4" /> Add Warranty</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New Warranty Entry</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2"><Label>Item/System Name</Label><Input value={form.item_name} onChange={e => setForm({...form, item_name: e.target.value})} /></div>
          <div className="grid gap-2"><Label>Provider</Label>
            <Select onValueChange={v => setForm({...form, provider_id: v})}>
              <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
              <SelectContent>{stakeholders.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2"><Label>Start Date</Label><Input type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} /></div>
            <div className="grid gap-2"><Label>Duration (Months)</Label><Input type="number" value={form.duration_months} onChange={e => setForm({...form, duration_months: Number(e.target.value)})} /></div>
          </div>
          <div className="grid gap-2"><Label>Certificate (PDF)</Label><Input type="file" onChange={e => setFile(e.target.files?.[0] || null)} /></div>
        </div>
        <DialogFooter><Button onClick={save}>Save Warranty</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
