import * as React from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProjects } from "@/contexts/ProjectContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, FileText, Zap, Layers, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const DISCIPLINES = ["M","E","P","FF","ELV","HVAC","DR"];
const DISC_LABEL: Record<string,string> = { M:"Mechanical", E:"Electrical", P:"Plumbing", FF:"Fire Fighting", ELV:"ELV", HVAC:"HVAC", DR:"Drainage" };

export default function MEP() {
  const { activeProject } = useProjects();
  const [drawings, setDrawings] = React.useState<any[]>([]);
  const [equipment, setEquipment] = React.useState<any[]>([]);
  const [sleeves, setSleeves] = React.useState<any[]>([]);
  const [wbsNodes, setWbsNodes] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("dashboard");

  const [drawingOpen, setDrawingOpen] = React.useState(false);
  const [equipOpen, setEquipOpen] = React.useState(false);
  const [sleeveOpen, setSleeveOpen] = React.useState(false);

  const emptyDrawing = { wbs_node_id:"", drawing_number:"", title:"", discipline:"M", revision:"0", status:"issued_for_construction" };
  const emptyEquip = { wbs_node_id:"", tag_number:"", description:"", discipline:"M", make_model:"", duty:"", capacity:"", status:"pending" };
  const emptySleeve = { wbs_node_id:"", reference_no:"", discipline:"M", location_description:"", size_mm:"", element_type:"slab", coordination_status:"pending", comments:"" };

  const [newDrawing, setNewDrawing] = React.useState(emptyDrawing);
  const [newEquip, setNewEquip] = React.useState(emptyEquip);
  const [newSleeve, setNewSleeve] = React.useState(emptySleeve);

  const loadData = async () => {
    if (!activeProject) return;
    setLoading(true);
    try {
      const [dr, eq, sl, wbs] = await Promise.all([
        supabase.from("mep_drawings").select("*, wbs_nodes(name)").eq("project_id", activeProject.id).order("drawing_number"),
        supabase.from("mep_equipment_schedules").select("*, wbs_nodes(name)").eq("project_id", activeProject.id).order("tag_number"),
        supabase.from("mep_sleeve_openings").select("*, wbs_nodes(name)").eq("project_id", activeProject.id).order("reference_no"),
        supabase.from("wbs_nodes").select("*").eq("project_id", activeProject.id).order("name"),
      ]);
      setDrawings(dr.data || []);
      setEquipment(eq.data || []);
      setSleeves(sl.data || []);
      setWbsNodes(wbs.data || []);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  React.useEffect(() => { loadData(); }, [activeProject]);

  const handleAddDrawing = async () => {
    if (!newDrawing.drawing_number || !newDrawing.title) return toast.error("Drawing number and title are required");
    setSubmitting(true);
    try {
      const { error } = await supabase.from("mep_drawings").insert({ ...newDrawing, project_id: activeProject!.id, wbs_node_id: newDrawing.wbs_node_id || null });
      if (error) throw error;
      toast.success("MEP Drawing added"); setDrawingOpen(false); setNewDrawing(emptyDrawing); loadData();
    } catch (e: any) { toast.error(e.message); } finally { setSubmitting(false); }
  };

  const handleAddEquip = async () => {
    if (!newEquip.tag_number || !newEquip.description) return toast.error("Tag number and description are required");
    setSubmitting(true);
    try {
      const { error } = await supabase.from("mep_equipment_schedules").insert({ ...newEquip, project_id: activeProject!.id, wbs_node_id: newEquip.wbs_node_id || null });
      if (error) throw error;
      toast.success("Equipment added"); setEquipOpen(false); setNewEquip(emptyEquip); loadData();
    } catch (e: any) { toast.error(e.message); } finally { setSubmitting(false); }
  };

  const handleAddSleeve = async () => {
    if (!newSleeve.reference_no || !newSleeve.location_description) return toast.error("Reference no. and location are required");
    setSubmitting(true);
    try {
      const { error } = await supabase.from("mep_sleeve_openings").insert({ ...newSleeve, project_id: activeProject!.id, wbs_node_id: newSleeve.wbs_node_id || null });
      if (error) throw error;
      toast.success("Sleeve/Opening logged"); setSleeveOpen(false); setNewSleeve(emptySleeve); loadData();
    } catch (e: any) { toast.error(e.message); } finally { setSubmitting(false); }
  };

  if (!activeProject) return <div className="p-8 text-muted-foreground">Select a project to view MEP records.</div>;

  const pendingSleeves = sleeves.filter(s => s.coordination_status === "pending").length;
  const pendingEquip = equipment.filter(e => e.status === "pending").length;
  const ifcDrawings = drawings.filter(d => d.status === "issued_for_construction").length;

  const WbsSelect = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger><SelectValue placeholder="Select WBS Node (optional)" /></SelectTrigger>
      <SelectContent>{wbsNodes.map(n => <SelectItem key={n.id} value={n.id}>{n.name}</SelectItem>)}</SelectContent>
    </Select>
  );

  const DiscSelect = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent>{DISCIPLINES.map(d => <SelectItem key={d} value={d}>{DISC_LABEL[d]}</SelectItem>)}</SelectContent>
    </Select>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">MEP Engineering</h1>
          <p className="text-muted-foreground">Drawings, equipment schedules, and sleeve coordination for all MEP disciplines.</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={drawingOpen} onOpenChange={setDrawingOpen}>
            <DialogTrigger asChild><Button variant="outline" className="gap-2"><Plus className="h-4 w-4" /> Add Drawing</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add MEP Drawing</DialogTitle></DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2"><Label>WBS Location</Label><WbsSelect value={newDrawing.wbs_node_id} onChange={v => setNewDrawing({...newDrawing, wbs_node_id: v})} /></div>
                <div className="grid gap-2"><Label>Discipline</Label><DiscSelect value={newDrawing.discipline} onChange={v => setNewDrawing({...newDrawing, discipline: v})} /></div>
                <div className="grid gap-2"><Label>Drawing Number *</Label><Input placeholder="MEP-M-L01-001" value={newDrawing.drawing_number} onChange={e => setNewDrawing({...newDrawing, drawing_number: e.target.value})} /></div>
                <div className="grid gap-2"><Label>Title *</Label><Input placeholder="Drawing Title" value={newDrawing.title} onChange={e => setNewDrawing({...newDrawing, title: e.target.value})} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2"><Label>Revision</Label><Input placeholder="0" value={newDrawing.revision} onChange={e => setNewDrawing({...newDrawing, revision: e.target.value})} /></div>
                  <div className="grid gap-2"><Label>Status</Label>
                    <Select value={newDrawing.status} onValueChange={v => setNewDrawing({...newDrawing, status: v})}>
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
                <Button variant="outline" onClick={() => setDrawingOpen(false)} disabled={submitting}>Cancel</Button>
                <Button onClick={handleAddDrawing} disabled={submitting}>{submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save Drawing</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={equipOpen} onOpenChange={setEquipOpen}>
            <DialogTrigger asChild><Button variant="outline" className="gap-2"><Plus className="h-4 w-4" /> Add Equipment</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Equipment Schedule Entry</DialogTitle></DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2"><Label>WBS Location</Label><WbsSelect value={newEquip.wbs_node_id} onChange={v => setNewEquip({...newEquip, wbs_node_id: v})} /></div>
                <div className="grid gap-2"><Label>Discipline</Label><DiscSelect value={newEquip.discipline} onChange={v => setNewEquip({...newEquip, discipline: v})} /></div>
                <div className="grid gap-2"><Label>Tag Number *</Label><Input placeholder="AHU-L03-01" value={newEquip.tag_number} onChange={e => setNewEquip({...newEquip, tag_number: e.target.value})} /></div>
                <div className="grid gap-2"><Label>Description *</Label><Input placeholder="Air Handling Unit" value={newEquip.description} onChange={e => setNewEquip({...newEquip, description: e.target.value})} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2"><Label>Make/Model</Label><Input placeholder="Brand XY" value={newEquip.make_model} onChange={e => setNewEquip({...newEquip, make_model: e.target.value})} /></div>
                  <div className="grid gap-2"><Label>Capacity</Label><Input placeholder="10 kW" value={newEquip.capacity} onChange={e => setNewEquip({...newEquip, capacity: e.target.value})} /></div>
                </div>
                <div className="grid gap-2"><Label>Status</Label>
                  <Select value={newEquip.status} onValueChange={v => setNewEquip({...newEquip, status: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="submitted">Submitted</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEquipOpen(false)} disabled={submitting}>Cancel</Button>
                <Button onClick={handleAddEquip} disabled={submitting}>{submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save Equipment</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={sleeveOpen} onOpenChange={setSleeveOpen}>
            <DialogTrigger asChild><Button className="gap-2 bg-cyan-600 hover:bg-cyan-700"><Plus className="h-4 w-4" /> Log Sleeve</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Log Sleeve / Opening</DialogTitle></DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2"><Label>WBS Location</Label><WbsSelect value={newSleeve.wbs_node_id} onChange={v => setNewSleeve({...newSleeve, wbs_node_id: v})} /></div>
                <div className="grid gap-2"><Label>Discipline</Label><DiscSelect value={newSleeve.discipline} onChange={v => setNewSleeve({...newSleeve, discipline: v})} /></div>
                <div className="grid gap-2"><Label>Reference No. *</Label><Input placeholder="SLV-L03-M-001" value={newSleeve.reference_no} onChange={e => setNewSleeve({...newSleeve, reference_no: e.target.value})} /></div>
                <div className="grid gap-2"><Label>Location Description *</Label><Input placeholder="Grid B3, Level 3 Slab" value={newSleeve.location_description} onChange={e => setNewSleeve({...newSleeve, location_description: e.target.value})} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2"><Label>Size</Label><Input placeholder="200x200mm" value={newSleeve.size_mm} onChange={e => setNewSleeve({...newSleeve, size_mm: e.target.value})} /></div>
                  <div className="grid gap-2"><Label>Element Type</Label>
                    <Select value={newSleeve.element_type} onValueChange={v => setNewSleeve({...newSleeve, element_type: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="slab">Slab</SelectItem>
                        <SelectItem value="wall">Wall</SelectItem>
                        <SelectItem value="beam">Beam</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSleeveOpen(false)} disabled={submitting}>Cancel</Button>
                <Button onClick={handleAddSleeve} disabled={submitting}>{submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save Sleeve</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-cyan-50 border-cyan-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div><p className="text-[10px] font-bold text-cyan-800 uppercase tracking-wider">MEP Drawings</p><div className="text-2xl font-bold text-cyan-900">{drawings.length}</div></div>
              <FileText className="h-8 w-8 text-cyan-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div><p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">IFC Drawings</p><div className="text-2xl font-bold">{ifcDrawings}</div></div>
              <Layers className="h-8 w-8 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card className={pendingEquip > 0 ? "bg-amber-50 border-amber-100" : ""}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div><p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Pending Equipment</p><div className="text-2xl font-bold text-amber-900">{pendingEquip}</div></div>
              <Zap className="h-8 w-8 text-amber-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card className={pendingSleeves > 0 ? "bg-rose-50 border-rose-100" : ""}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div><p className="text-[10px] font-bold text-rose-800 uppercase tracking-wider">Open Sleeves</p><div className="text-2xl font-bold text-rose-900">{pendingSleeves}</div></div>
              <AlertCircle className="h-8 w-8 text-rose-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="drawings">Drawing Register</TabsTrigger>
          <TabsTrigger value="equipment">Equipment Schedule</TabsTrigger>
          <TabsTrigger value="sleeves">Sleeve / Opening Log</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-base">Latest MEP Drawings</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {drawings.slice(0,5).map(d => (
                    <div key={d.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded bg-cyan-50 flex items-center justify-center text-[10px] font-bold text-cyan-700">{d.discipline}</div>
                        <div><div className="text-[10px] font-mono text-muted-foreground">{d.drawing_number}</div><div className="text-sm font-semibold">{d.title}</div></div>
                      </div>
                      <Badge variant="outline" className="text-[10px]">REV {d.revision}</Badge>
                    </div>
                  ))}
                  {drawings.length === 0 && <p className="text-center py-6 text-sm text-muted-foreground">No MEP drawings found.</p>}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Pending Sleeve Coordinations</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {sleeves.filter(s => s.coordination_status === "pending").slice(0,5).map(s => (
                    <div key={s.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="text-sm font-semibold">{s.reference_no}</div>
                        <div className="text-[10px] text-muted-foreground">{s.location_description} • {s.discipline}</div>
                      </div>
                      <div className="flex gap-1">
                        <Badge variant={s.str_approved ? "default" : "secondary"} className="text-[10px]">STR</Badge>
                        <Badge variant={s.arc_approved ? "default" : "secondary"} className="text-[10px]">ARC</Badge>
                      </div>
                    </div>
                  ))}
                  {sleeves.filter(s => s.coordination_status === "pending").length === 0 && <p className="text-center py-6 text-sm text-muted-foreground">No pending sleeves.</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="drawings">
          <Card>
            <CardHeader><CardTitle>MEP Drawing Register</CardTitle><CardDescription>All MEP sub-discipline drawings.</CardDescription></CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="p-4 font-medium">Disc.</th>
                      <th className="p-4 font-medium">Drawing #</th>
                      <th className="p-4 font-medium">Title</th>
                      <th className="p-4 font-medium">WBS</th>
                      <th className="p-4 font-medium">Rev</th>
                      <th className="p-4 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {drawings.map(d => (
                      <tr key={d.id} className="hover:bg-muted/30">
                        <td className="p-4"><Badge className="bg-cyan-600 text-[10px]">{d.discipline}</Badge></td>
                        <td className="p-4 font-mono font-bold text-cyan-700">{d.drawing_number}</td>
                        <td className="p-4 font-medium">{d.title}</td>
                        <td className="p-4 text-muted-foreground text-xs">{d.wbs_nodes?.name ?? "—"}</td>
                        <td className="p-4"><Badge variant="outline">REV {d.revision}</Badge></td>
                        <td className="p-4"><Badge variant="secondary" className="text-[10px] uppercase">{d.status.replace(/_/g," ")}</Badge></td>
                      </tr>
                    ))}
                    {drawings.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No drawings found.</td></tr>}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="equipment">
          <Card>
            <CardHeader><CardTitle>Equipment Schedule</CardTitle><CardDescription>Tag-number based MEP equipment list.</CardDescription></CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="p-4 font-medium">Tag No.</th>
                      <th className="p-4 font-medium">Description</th>
                      <th className="p-4 font-medium">Disc.</th>
                      <th className="p-4 font-medium">Make/Model</th>
                      <th className="p-4 font-medium">Capacity</th>
                      <th className="p-4 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {equipment.map(eq => (
                      <tr key={eq.id} className="hover:bg-muted/30">
                        <td className="p-4 font-mono font-bold text-cyan-700">{eq.tag_number}</td>
                        <td className="p-4 font-medium">{eq.description}</td>
                        <td className="p-4"><Badge className="bg-cyan-600 text-[10px]">{eq.discipline}</Badge></td>
                        <td className="p-4 text-muted-foreground">{eq.make_model ?? "—"}</td>
                        <td className="p-4">{eq.capacity ?? "—"}</td>
                        <td className="p-4">
                          <Badge className={eq.status === "approved" ? "bg-emerald-600" : eq.status === "submitted" ? "bg-amber-500" : "bg-muted text-muted-foreground"}>
                            {eq.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                    {equipment.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No equipment found.</td></tr>}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sleeves">
          <Card>
            <CardHeader><CardTitle>Sleeve / Opening Coordination Log</CardTitle><CardDescription>Track STR and ARC approval status for MEP penetrations.</CardDescription></CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="p-4 font-medium">Ref No.</th>
                      <th className="p-4 font-medium">Location</th>
                      <th className="p-4 font-medium">Disc.</th>
                      <th className="p-4 font-medium">Element</th>
                      <th className="p-4 font-medium">Size</th>
                      <th className="p-4 font-medium">STR</th>
                      <th className="p-4 font-medium">ARC</th>
                      <th className="p-4 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {sleeves.map(s => (
                      <tr key={s.id} className="hover:bg-muted/30">
                        <td className="p-4 font-mono font-bold text-cyan-700">{s.reference_no}</td>
                        <td className="p-4 font-medium">{s.location_description}</td>
                        <td className="p-4"><Badge className="bg-cyan-600 text-[10px]">{s.discipline}</Badge></td>
                        <td className="p-4 capitalize">{s.element_type}</td>
                        <td className="p-4">{s.size_mm ?? "—"}</td>
                        <td className="p-4">{s.str_approved ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <AlertCircle className="h-4 w-4 text-amber-400" />}</td>
                        <td className="p-4">{s.arc_approved ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <AlertCircle className="h-4 w-4 text-amber-400" />}</td>
                        <td className="p-4">
                          <Badge className={s.coordination_status === "approved" ? "bg-emerald-600" : s.coordination_status === "rejected" ? "bg-destructive" : "bg-amber-500"}>
                            {s.coordination_status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                    {sleeves.length === 0 && <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">No sleeve/opening records found.</td></tr>}
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
