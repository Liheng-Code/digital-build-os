import * as React from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProjects } from "@/contexts/ProjectContext";
import { useWbsTree } from "@/hooks/useWbsTree";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Package, ShoppingCart, Plus, Search, Filter, ArrowRight, ClipboardList, CheckCircle2, Clock, Building, Layers, ArrowUpRight, Loader2, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { format } from "date-fns";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function Procurement() {
  const { activeProject } = useProjects();
  const [loading, setLoading] = React.useState(true);
  const [prs, setPrs] = React.useState<any[]>([]);
  const [catalog, setCatalog] = React.useState<any[]>([]);
  const [activeTab, setActiveTab] = React.useState("dashboard");
  const [isCatalogOpen, setIsCatalogOpen] = React.useState(false);
  const [isCreatePrOpen, setIsCreatePrOpen] = React.useState(false);

  const loadData = async () => {
    if (!activeProject) return;
    setLoading(true);
    try {
      const [prsRes, catalogRes] = await Promise.all([
        supabase
          .from("purchase_requisitions")
          .select("*, pr_items(count)")
          .eq("project_id", activeProject.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("material_catalog")
          .select("*")
          .order("name", { ascending: true })
      ]);

      setPrs(prsRes.data || []);
      setCatalog(catalogRes.data || []);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadData();
  }, [activeProject]);

  if (!activeProject) {
    return <div className="p-8 text-muted-foreground">Select a project to view procurement.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Procurement & MTO</h1>
          <p className="text-muted-foreground">Manage material catalog, requisitions, and take-offs.</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCatalogOpen} onOpenChange={setIsCatalogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <ClipboardList className="h-4 w-4" /> Material Catalog
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <MaterialCatalogManager catalog={catalog} onRefresh={loadData} />
            </DialogContent>
          </Dialog>

          <Dialog open={isCreatePrOpen} onOpenChange={setIsCreatePrOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> New PR
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <CreatePrForm 
                projectId={activeProject.id} 
                catalog={catalog} 
                onSuccess={() => {
                  setIsCreatePrOpen(false);
                  loadData();
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="mto">MTO from RDS</TabsTrigger>
            <TabsTrigger value="prs">Purchase Requisitions</TabsTrigger>
            <TabsTrigger value="rfqs">RFQs</TabsTrigger>
          </TabsList>
           
          <TabsContent value="dashboard" className="space-y-4">
            <div className="grid md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase">Pending PRs</p>
                      <div className="text-2xl font-bold">{prs.filter(p => p.status === 'submitted').length}</div>
                    </div>
                    <Clock className="h-8 w-8 text-amber-500 opacity-20" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase">Total Approved</p>
                      <div className="text-2xl font-bold">{prs.filter(p => p.status === 'approved').length}</div>
                    </div>
                    <CheckCircle2 className="h-8 w-8 text-emerald-500 opacity-20" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase">Catalogue Items</p>
                      <div className="text-2xl font-bold">{catalog.length}</div>
                    </div>
                    <Package className="h-8 w-8 text-blue-500 opacity-20" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase">Budget Utilized</p>
                      <div className="text-2xl font-bold text-emerald-600">
                        ${prs.filter(p => p.status === 'approved').reduce((acc, p) => acc + (p.total_estimate || 0), 0).toLocaleString()}
                      </div>
                    </div>
                    <ArrowUpRight className="h-8 w-8 text-emerald-500 opacity-20" />
                  </div>
                </CardContent>
              </Card>
            </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Requisitions</CardTitle>
              <CardDescription>Latest material purchase requests for this project.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {prs.slice(0, 5).map(pr => (
                  <div key={pr.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center">
                        <ShoppingCart className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-primary">{pr.pr_number}</span>
                          <Badge variant="outline" className="text-[10px] uppercase">{pr.status}</Badge>
                        </div>
                        <h4 className="text-sm font-semibold">{pr.subject}</h4>
                        <p className="text-[10px] text-muted-foreground">Requested: {format(new Date(pr.created_at), "MMM d, yyyy")}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold">${(pr.total_estimate || 0).toLocaleString()}</div>
                      <Button variant="ghost" size="sm" className="h-8 px-2 text-[10px]">View Details</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mto">
          <MtoFromRds activeProject={activeProject} catalog={catalog} />
        </TabsContent>

        <TabsContent value="prs">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>PR Register</CardTitle>
                <CardDescription>Full history of material requisitions.</CardDescription>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search PRs..." className="pl-8 h-9 w-[200px]" />
                </div>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="h-4 w-4" /> Filter
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Detailed table would go here */}
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <ClipboardList className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                <p className="text-muted-foreground">Detailed PR register table under development.</p>
              </div>
            </CardContent>
          </Card>
          </TabsContent>

          <TabsContent value="rfqs" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Request for Quotation (RFQ)</CardTitle>
                    <CardDescription>Manage supplier bidding and quotation process</CardDescription>
                  </div>
                  <Button asChild className="gap-2">
                    <Link to="/procurement/rfqs">
                      <FileText className="h-4 w-4" /> View All RFQs
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                  Click "View All RFQs" to manage your Request for Quotations, invite suppliers, and compare quotations.
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
    </div>
  );
}

function MtoFromRds({ activeProject, catalog }: any) {
  const { nodes: wbsNodes, loading: wbsLoading } = useWbsTree(activeProject?.id);
  const [rdsData, setRdsData] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedRoom, setSelectedRoom] = React.useState<any | null>(null);

  const loadRds = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("architecture_room_data")
      .select("*")
      .eq("project_id", activeProject.id);
    setRdsData(data || []);
    setLoading(false);
  };

  React.useEffect(() => {
    loadRds();
  }, [activeProject.id]);

  const roomsWithData = wbsNodes.filter(n => rdsData.some(r => r.wbs_node_id === n.id));

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <Card className="md:col-span-1">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Building className="h-4 w-4" /> Rooms with Design Data
          </CardTitle>
          <CardDescription>Select a room to see its finishes.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            <div className="divide-y">
              {roomsWithData.map(room => (
                <button
                  key={room.id}
                  onClick={() => setSelectedRoom(room)}
                  className={`w-full text-left p-4 hover:bg-muted transition-colors flex items-center justify-between ${
                    selectedRoom?.id === room.id ? "bg-muted" : ""
                  }`}
                >
                  <div>
                    <div className="text-[10px] font-mono font-bold text-primary">{room.code}</div>
                    <div className="text-sm font-semibold">{room.name}</div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
              {roomsWithData.length === 0 && !wbsLoading && (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  No Room Data Sheets found. Go to Architecture module to add design data.
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        {!selectedRoom ? (
          <CardContent className="h-[500px] flex items-center justify-center text-center">
            <div>
              <Layers className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-muted-foreground">Select a room from the left to start Material Take-off.</p>
            </div>
          </CardContent>
        ) : (
          <MtoDetailView room={selectedRoom} rds={rdsData.find(r => r.wbs_node_id === selectedRoom.id)} catalog={catalog} />
        )}
      </Card>
    </div>
  );
}

function MtoDetailView({ room, rds, catalog }: any) {
  const [requesting, setRequesting] = React.useState(false);

  const finishes = [
    { type: "Floor", finish: rds.floor_finish },
    { type: "Wall", finish: rds.wall_finish },
    { type: "Ceiling", finish: rds.ceiling_finish }
  ].filter(f => f.finish && f.finish !== 'None');

  const handleRequest = async (finish: string) => {
    setRequesting(true);
    try {
      // Find matching material in catalog (simple matching for demo)
      const material = catalog.find((m: any) => finish.toLowerCase().includes(m.name.toLowerCase()));
      
      if (!material) {
        toast.error(`No matching material found in catalog for "${finish}". Please select manually.`);
        return;
      }

      const { error } = await supabase.from("rds_material_takeoffs").insert({
        project_id: room.project_id,
        wbs_node_id: room.id,
        material_id: material.id,
        quantity: 1, // Placeholder: in real system we'd use area from RDS
      });

      if (error) throw error;
      toast.success(`Request created for ${material.name}`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setRequesting(false);
    }
  };

  return (
    <>
      <CardHeader className="border-b bg-muted/30">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[10px] font-mono font-bold text-primary">{room.code}</div>
            <CardTitle>{room.name}</CardTitle>
            <CardDescription>Room Data Take-off</CardDescription>
          </div>
          <Badge variant="outline">MTO Ready</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-6">
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Design Finishes</h4>
            <div className="grid gap-4">
              {finishes.map(f => (
                <div key={f.type} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase">{f.type}</div>
                    <div className="text-sm font-semibold">{f.finish}</div>
                  </div>
                  <Button size="sm" className="gap-2" onClick={() => handleRequest(f.finish)} disabled={requesting}>
                    {requesting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                    Request Material
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg">
            <div className="flex gap-3">
              <ClipboardList className="h-5 w-5 text-blue-600" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-blue-900 uppercase">Pro Tip</p>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  The system automatically cross-references your RDS finishes with the Material Catalog. 
                  Approved requests will be grouped into a **Purchase Requisition (PR)**.
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </>
  );
}

function MaterialCatalogManager({ catalog, onRefresh }: any) {
  const [submitting, setSubmitting] = React.useState(false);
  const [newItem, setNewItem] = React.useState({
    code: "",
    name: "",
    category: "Finishing",
    unit: "sqm",
    default_price: 0
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.from("material_catalog").insert(newItem);
      if (error) throw error;
      toast.success("Material added to catalog");
      setNewItem({ code: "", name: "", category: "Finishing", unit: "sqm", default_price: 0 });
      onRefresh();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <DialogHeader>
        <DialogTitle>Material Catalog</DialogTitle>
        <CardDescription>Master list of materials available for project procurement.</CardDescription>
      </DialogHeader>

      <form onSubmit={handleAdd} className="grid grid-cols-5 gap-3 items-end bg-muted/30 p-4 rounded-lg border">
        <div className="space-y-2">
          <Label className="text-[10px] uppercase">Code</Label>
          <Input required placeholder="MAT-001" value={newItem.code} onChange={e => setNewItem(p => ({...p, code: e.target.value}))} />
        </div>
        <div className="space-y-2 col-span-2">
          <Label className="text-[10px] uppercase">Material Name</Label>
          <Input required placeholder="e.g. Ceramic Tile" value={newItem.name} onChange={e => setNewItem(p => ({...p, name: e.target.value}))} />
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] uppercase">Unit</Label>
          <Input required placeholder="sqm" value={newItem.unit} onChange={e => setNewItem(p => ({...p, unit: e.target.value}))} />
        </div>
        <Button type="submit" disabled={submitting}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />} Add
        </Button>
      </form>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead className="text-right">Est. Price</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {catalog.map((item: any) => (
              <TableRow key={item.id}>
                <TableCell className="font-mono text-[10px] font-bold">{item.code}</TableCell>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell>{item.unit}</TableCell>
                <TableCell className="text-right">${(item.default_price || 0).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function CreatePrForm({ projectId, catalog, onSuccess }: any) {
  const [submitting, setSubmitting] = React.useState(false);
  const [formData, setFormData] = React.useState({
    subject: "",
    description: "",
    required_date: "",
  });
  
  const [items, setItems] = React.useState<any[]>([
    { material_id: "", quantity: 1, unit_price: 0 }
  ]);

  const addItem = () => {
    setItems([...items, { material_id: "", quantity: 1, unit_price: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const next = [...items];
    next[index][field] = value;
    
    // Auto-populate price if material selected
    if (field === 'material_id') {
      const mat = catalog.find((m: any) => m.id === value);
      if (mat) next[index].unit_price = mat.default_price || 0;
    }
    
    setItems(next);
  };

  const totalEstimate = items.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.some(i => !i.material_id)) {
      toast.error("Please select a material for all items");
      return;
    }

    setSubmitting(true);
    try {
      // 1. Get next PR number
      const { count } = await supabase
        .from("purchase_requisitions")
        .select("*", { count: "exact", head: true })
        .eq("project_id", projectId);
      
      const prNum = `PR-${(count || 0 + 1).toString().padStart(3, '0')}`;

      // 2. Create PR
      const { data: pr, error: prErr } = await supabase
        .from("purchase_requisitions")
        .insert({
          project_id: projectId,
          pr_number: prNum,
          subject: formData.subject,
          description: formData.description,
          required_date: formData.required_date || null,
          total_estimate: totalEstimate,
          status: "draft"
        })
        .select()
        .single();

      if (prErr) throw prErr;

      // 3. Create Items
      const prItems = items.map(item => ({
        pr_id: pr.id,
        material_id: item.material_id,
        quantity: item.quantity,
        unit_price: item.unit_price
      }));

      const { error: itemsErr } = await supabase.from("pr_items").insert(prItems);
      if (itemsErr) throw itemsErr;

      toast.success(`PR ${prNum} created successfully`);
      onSuccess();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <DialogHeader>
        <DialogTitle>New Purchase Requisition</DialogTitle>
        <CardDescription>Request materials for the project site.</CardDescription>
      </DialogHeader>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-2">
          <Label>Subject / Purpose</Label>
          <Input required placeholder="e.g. Ground Floor Tiling Materials" value={formData.subject} onChange={e => setFormData(p => ({...p, subject: e.target.value}))} />
        </div>
        <div className="space-y-2">
          <Label>Required Date</Label>
          <Input type="date" value={formData.required_date} onChange={e => setFormData(p => ({...p, required_date: e.target.value}))} />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-bold uppercase text-muted-foreground">Requisition Items</Label>
          <Button type="button" variant="outline" size="sm" onClick={addItem} className="h-7 text-[10px] gap-1">
            <Plus className="h-3 w-3" /> Add Item
          </Button>
        </div>

        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="grid grid-cols-12 gap-2 items-end border p-3 rounded-md bg-muted/10">
              <div className="col-span-5 space-y-1">
                <Label className="text-[10px]">Material</Label>
                <Select value={item.material_id} onValueChange={v => updateItem(index, 'material_id', v)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select material" /></SelectTrigger>
                  <SelectContent>
                    {catalog.map((m: any) => (
                      <SelectItem key={m.id} value={m.id}>{m.name} ({m.unit})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="text-[10px]">Qty</Label>
                <Input type="number" className="h-8 text-xs" value={item.quantity} onChange={e => updateItem(index, 'quantity', parseFloat(e.target.value))} />
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="text-[10px]">Est. Price</Label>
                <Input type="number" className="h-8 text-xs" value={item.unit_price} onChange={e => updateItem(index, 'unit_price', parseFloat(e.target.value))} />
              </div>
              <div className="col-span-2 text-right py-2">
                <div className="text-[10px] font-bold text-muted-foreground">Total</div>
                <div className="text-xs font-bold">${(item.quantity * item.unit_price).toLocaleString()}</div>
              </div>
              <div className="col-span-1">
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeItem(index)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border-2 border-dashed">
        <div className="text-sm font-medium text-muted-foreground uppercase">Estimated Total</div>
        <div className="text-2xl font-bold text-primary">${totalEstimate.toLocaleString()}</div>
      </div>

      <DialogFooter>
        <Button type="submit" disabled={submitting} className="w-full h-11 text-base">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Raise Requisition"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function Trash2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      <line x1="10" x2="10" y1="11" y2="17" />
      <line x1="14" x2="14" y1="11" y2="17" />
    </svg>
  );
}

function ChevronRight(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}