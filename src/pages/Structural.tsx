
import * as React from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProjects } from "@/contexts/ProjectContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Box, 
  Layers, 
  FileText, 
  ClipboardCheck, 
  Plus, 
  Search, 
  Filter, 
  HardHat, 
  Activity, 
  BarChart3,
  Loader2,
  ChevronRight,
  Download,
  Eye,
  History,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Structural() {
  const { activeProject } = useProjects();
  const [loading, setLoading] = React.useState(true);
  const [drawings, setDrawings] = React.useState<any[]>([]);
  const [bbs, setBbs] = React.useState<any[]>([]);
  const [inspections, setInspections] = React.useState<any[]>([]);
  const [wbsNodes, setWbsNodes] = React.useState<any[]>([]);
  const [activeTab, setActiveTab] = React.useState("dashboard");

  // Form states
  const [isDrawingOpen, setIsDrawingOpen] = React.useState(false);
  const [isBbsOpen, setIsBbsOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [newDrawing, setNewDrawing] = React.useState({ wbs_node_id: "", drawing_number: "", title: "", revision: "0", status: "issued_for_construction" });
  const [newBbs, setNewBbs] = React.useState({ wbs_node_id: "", drawing_id: "", member_mark: "", bar_mark: "", diameter_mm: "", shape_code: "", total_length_mm: "", quantity: "" });

  const loadData = async () => {
    if (!activeProject) return;
    setLoading(true);
    try {
      const [drawingsRes, bbsRes, inspectionsRes] = await Promise.all([
        supabase
          .from("structural_drawings")
          .select("*")
          .eq("project_id", activeProject.id)
          .order("drawing_number", { ascending: true }),
        supabase
          .from("structural_rebar_schedules")
          .select("*, wbs_nodes(name)")
          .eq("project_id", activeProject.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("structural_inspections")
          .select("*, wbs_nodes(name)")
          .eq("project_id", activeProject.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("wbs_nodes")
          .select("*")
          .eq("project_id", activeProject.id)
          .order("name", { ascending: true })
      ]);

      setDrawings(drawingsRes.data || []);
      setBbs(bbsRes.data || []);
      setInspections(inspectionsRes.data || []);
      setWbsNodes(wbsRes.data || []);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDrawing = async () => {
    if (!newDrawing.drawing_number || !newDrawing.title) return toast.error("Please fill required fields");
    setSubmitting(true);
    try {
      const { error } = await supabase.from("structural_drawings").insert({
        project_id: activeProject.id,
        wbs_node_id: newDrawing.wbs_node_id || null,
        drawing_number: newDrawing.drawing_number,
        title: newDrawing.title,
        revision: newDrawing.revision,
        status: newDrawing.status
      });
      if (error) throw error;
      toast.success("Drawing added successfully");
      setIsDrawingOpen(false);
      setNewDrawing({ wbs_node_id: "", drawing_number: "", title: "", revision: "0", status: "issued_for_construction" });
      loadData();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddBbs = async () => {
    if (!newBbs.wbs_node_id || !newBbs.member_mark || !newBbs.bar_mark || !newBbs.diameter_mm || !newBbs.shape_code || !newBbs.total_length_mm || !newBbs.quantity) {
      return toast.error("Please fill all required fields");
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("structural_rebar_schedules").insert({
        project_id: activeProject.id,
        wbs_node_id: newBbs.wbs_node_id,
        drawing_id: newBbs.drawing_id || null,
        member_mark: newBbs.member_mark,
        bar_mark: newBbs.bar_mark,
        diameter_mm: parseInt(newBbs.diameter_mm),
        shape_code: newBbs.shape_code,
        total_length_mm: parseFloat(newBbs.total_length_mm),
        quantity: parseInt(newBbs.quantity)
      });
      if (error) throw error;
      toast.success("BBS Entry added successfully");
      setIsBbsOpen(false);
      setNewBbs({ wbs_node_id: "", drawing_id: "", member_mark: "", bar_mark: "", diameter_mm: "", shape_code: "", total_length_mm: "", quantity: "" });
      loadData();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  React.useEffect(() => {
    loadData();
  }, [activeProject]);

  if (!activeProject) {
    return <div className="p-8 text-muted-foreground">Select a project to view Structural records.</div>;
  }

  const totalRebarWeight = bbs.reduce((acc, item) => acc + (item.total_weight_kg || 0), 0);
  const pendingInspections = inspections.filter(i => i.result === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Structural Engineering</h1>
          <p className="text-muted-foreground">Design control, Bar Bending Schedules, and site inspections.</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isDrawingOpen} onOpenChange={setIsDrawingOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Plus className="h-4 w-4" /> Add Drawing
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Structural Drawing</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>WBS Location</Label>
                  <Select value={newDrawing.wbs_node_id} onValueChange={(val) => setNewDrawing({ ...newDrawing, wbs_node_id: val })}>
                    <SelectTrigger><SelectValue placeholder="Select WBS Node" /></SelectTrigger>
                    <SelectContent>
                      {wbsNodes.map(node => (
                        <SelectItem key={node.id} value={node.id}>{node.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Drawing Number</Label>
                  <Input placeholder="e.g. STR-GA-L01-001" value={newDrawing.drawing_number} onChange={e => setNewDrawing({ ...newDrawing, drawing_number: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Title</Label>
                  <Input placeholder="Drawing Title" value={newDrawing.title} onChange={e => setNewDrawing({ ...newDrawing, title: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Revision</Label>
                    <Input placeholder="0" value={newDrawing.revision} onChange={e => setNewDrawing({ ...newDrawing, revision: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Status</Label>
                    <Select value={newDrawing.status} onValueChange={(val) => setNewDrawing({ ...newDrawing, status: val })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="issued_for_construction">IFC</SelectItem>
                        <SelectItem value="preliminary">Preliminary</SelectItem>
                        <SelectItem value="superseded">Superseded</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDrawingOpen(false)} disabled={submitting}>
                  Cancel
                </Button>
                <Button disabled={submitting} onClick={handleAddDrawing}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Drawing
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isBbsOpen} onOpenChange={setIsBbsOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                <Plus className="h-4 w-4" /> New BBS Entry
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Bar Bending Schedule Entry</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>WBS Location (Required)</Label>
                  <Select value={newBbs.wbs_node_id} onValueChange={(val) => setNewBbs({ ...newBbs, wbs_node_id: val })}>
                    <SelectTrigger><SelectValue placeholder="Select WBS Node" /></SelectTrigger>
                    <SelectContent>
                      {wbsNodes.map(node => (
                        <SelectItem key={node.id} value={node.id}>{node.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Reference Drawing</Label>
                  <Select value={newBbs.drawing_id} onValueChange={(val) => setNewBbs({ ...newBbs, drawing_id: val })}>
                    <SelectTrigger><SelectValue placeholder="Select Drawing (Optional)" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {drawings.map(d => (
                        <SelectItem key={d.id} value={d.id}>{d.drawing_number} - {d.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Member Mark</Label>
                    <Input placeholder="e.g. C1" value={newBbs.member_mark} onChange={e => setNewBbs({ ...newBbs, member_mark: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Bar Mark</Label>
                    <Input placeholder="e.g. 01" value={newBbs.bar_mark} onChange={e => setNewBbs({ ...newBbs, bar_mark: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Diameter (mm)</Label>
                    <Input type="number" placeholder="16" value={newBbs.diameter_mm} onChange={e => setNewBbs({ ...newBbs, diameter_mm: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Shape Code</Label>
                    <Input placeholder="21" value={newBbs.shape_code} onChange={e => setNewBbs({ ...newBbs, shape_code: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Cut Length (mm)</Label>
                    <Input type="number" placeholder="3500" value={newBbs.total_length_mm} onChange={e => setNewBbs({ ...newBbs, total_length_mm: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Quantity</Label>
                    <Input type="number" placeholder="10" value={newBbs.quantity} onChange={e => setNewBbs({ ...newBbs, quantity: e.target.value })} />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsBbsOpen(false)} disabled={submitting}>
                  Cancel
                </Button>
                <Button disabled={submitting} onClick={handleAddBbs}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save BBS Entry
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-indigo-50 border-indigo-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider">Total Rebar Weight</p>
                <div className="text-2xl font-bold text-indigo-900">{(totalRebarWeight / 1000).toFixed(2)} Tons</div>
              </div>
              <Box className="h-8 w-8 text-indigo-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Approved Drawings</p>
                <div className="text-2xl font-bold">{drawings.length}</div>
              </div>
              <Layers className="h-8 w-8 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card className={pendingInspections > 0 ? "bg-amber-50 border-amber-100" : ""}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Pending Inspections</p>
                <div className="text-2xl font-bold text-amber-900">{pendingInspections}</div>
              </div>
              <ClipboardCheck className="h-8 w-8 text-amber-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Concrete Cube Tests</p>
                <div className="text-2xl font-bold">{inspections.filter(i => i.type === 'concrete_cube_test').length}</div>
              </div>
              <Activity className="h-8 w-8 text-emerald-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="drawings">Drawing Register</TabsTrigger>
          <TabsTrigger value="bbs">Rebar Schedule (BBS)</TabsTrigger>
          <TabsTrigger value="inspections">Inspections</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Eye className="h-4 w-4 text-primary" /> Latest Drawings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {drawings.slice(0, 4).map(d => (
                    <div key={d.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded bg-indigo-50 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div>
                          <div className="text-[10px] font-mono font-bold text-muted-foreground">{d.drawing_number}</div>
                          <div className="text-sm font-semibold">{d.title}</div>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px]">REV {d.revision}</Badge>
                    </div>
                  ))}
                  {drawings.length === 0 && <div className="text-center py-6 text-sm text-muted-foreground">No drawings found.</div>}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <History className="h-4 w-4 text-amber-500" /> Recent Inspections
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {inspections.slice(0, 4).map(i => (
                    <div key={i.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`h-9 w-9 rounded flex items-center justify-center ${
                          i.result === 'passed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                        }`}>
                          {i.result === 'passed' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                        </div>
                        <div>
                          <div className="text-sm font-semibold">{i.subject}</div>
                          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{i.wbs_nodes?.name} • {i.type.replace('_', ' ')}</div>
                        </div>
                      </div>
                      <Badge className={i.result === 'passed' ? 'bg-emerald-600' : 'bg-amber-500'}>{i.result}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="drawings">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>STR Drawing Register</CardTitle>
                <CardDescription>Master list of structural design sheets.</CardDescription>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search drawings..." className="pl-8 h-9 w-[240px]" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="p-4 font-medium">Drawing #</th>
                      <th className="p-4 font-medium">Title</th>
                      <th className="p-4 font-medium">Rev</th>
                      <th className="p-4 font-medium">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {drawings.map(d => (
                      <tr key={d.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-4 font-mono font-bold text-indigo-600">{d.drawing_number}</td>
                        <td className="p-4 font-medium">{d.title}</td>
                        <td className="p-4"><Badge variant="outline">REV {d.revision}</Badge></td>
                        <td className="p-4">
                          <Badge variant="secondary" className="text-[10px] uppercase">IFC</Badge>
                        </td>
                        <td className="p-4 text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Download className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bbs">
          <Card>
            <CardHeader>
              <CardTitle>Reinforcement Schedule (BBS)</CardTitle>
              <CardDescription>Bar bending details and tonnage tracking.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="p-4 font-medium">Location</th>
                      <th className="p-4 font-medium">Member</th>
                      <th className="p-4 font-medium">Bar Mark</th>
                      <th className="p-4 font-medium">Size (mm)</th>
                      <th className="p-4 font-medium">Shape</th>
                      <th className="p-4 font-medium text-right">Weight (kg)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {bbs.map(item => (
                      <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-4 font-medium">{item.wbs_nodes?.name}</td>
                        <td className="p-4 font-bold">{item.member_mark}</td>
                        <td className="p-4 font-mono">{item.bar_mark}</td>
                        <td className="p-4">T{item.diameter_mm}</td>
                        <td className="p-4 font-mono">{item.shape_code}</td>
                        <td className="p-4 text-right font-bold">{(item.total_weight_kg || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                    {bbs.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-muted-foreground">No reinforcement schedules found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
