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
  AlertCircle,
  Settings,
  Zap,
  MessageSquare
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { storageService } from "@/services/storageService";
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
import { Textarea } from "@/components/ui/textarea";

export default function Structural() {
  const { activeProject } = useProjects();
  const [loading, setLoading] = React.useState(true);
  const [drawings, setDrawings] = React.useState<any[]>([]);
  const [bbs, setBbs] = React.useState<any[]>([]);
  const [inspections, setInspections] = React.useState<any[]>([]);
  const [calcNotes, setCalcNotes] = React.useState<any[]>([]);
  const [models, setModels] = React.useState<any[]>([]);
  const [queries, setQueries] = React.useState<any[]>([]);
  const [designCriteria, setDesignCriteria] = React.useState<any[]>([]);
  const [loadSummaries, setLoadSummaries] = React.useState<any[]>([]);
  const [rebarReviews, setRebarReviews] = React.useState<any[]>([]);
  const [wbsNodes, setWbsNodes] = React.useState<any[]>([]);
  const [activeTab, setActiveTab] = React.useState("dashboard");

  // Form states
  const [isDrawingOpen, setIsDrawingOpen] = React.useState(false);
  const [isBbsOpen, setIsBbsOpen] = React.useState(false);
  const [isCalcOpen, setIsCalcOpen] = React.useState(false);
  const [isModelOpen, setIsModelOpen] = React.useState(false);
  const [isQueryOpen, setIsQueryOpen] = React.useState(false);
  const [isCriteriaOpen, setIsCriteriaOpen] = React.useState(false);
  const [isLoadSummaryOpen, setIsLoadSummaryOpen] = React.useState(false);
  const [isRebarReviewOpen, setIsRebarReviewOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [file, setFile] = React.useState<File | null>(null);

  const [newDrawing, setNewDrawing] = React.useState({ wbs_node_id: "", drawing_number: "", title: "", revision: "0", status: "issued_for_construction" });
  const [newBbs, setNewBbs] = React.useState({ wbs_node_id: "", drawing_id: "", member_mark: "", bar_mark: "", diameter_mm: "", shape_code: "", total_length_mm: "", quantity: "" });
  const [newCalc, setNewCalc] = React.useState({ wbs_node_id: "", reference_number: "", title: "", author: "", revision: "0", status: "draft" });
  const [newModel, setNewModel] = React.useState({ software: "ETABS", model_name: "", version: "1.0", status: "active" });
  const [newQuery, setNewQuery] = React.useState({ wbs_node_id: "", query_number: "", subject: "", description: "", status: "open" });
  const [newCriteria, setNewCriteria] = React.useState({ parameter_name: "", parameter_value: "", unit: "", source: "" });
  const [newLoad, setNewLoad] = React.useState({ wbs_node_id: "", load_case: "Dead", magnitude_kn_m2: "", description: "" });
  const [newReview, setNewReview] = React.useState({ wbs_node_id: "", submittal_number: "", drawing_reference: "", status: "under_review" });

  const loadData = async () => {
    if (!activeProject) return;
    setLoading(true);
    try {
      const [drawingsRes, bbsRes, inspectionsRes, calcRes, modelsRes, queriesRes, criteriaRes, loadRes, reviewsRes, wbsRes] = await Promise.all([
        supabase.from("structural_drawings").select("*").eq("project_id", activeProject.id).order("drawing_number"),
        supabase.from("structural_rebar_schedules").select("*, wbs_nodes(name)").eq("project_id", activeProject.id).order("created_at", { ascending: false }),
        supabase.from("structural_inspections").select("*, wbs_nodes(name)").eq("project_id", activeProject.id).order("created_at", { ascending: false }),
        supabase.from("structural_calculation_notes").select("*, wbs_nodes(name)").eq("project_id", activeProject.id).order("created_at", { ascending: false }),
        supabase.from("structural_model_register").select("*").eq("project_id", activeProject.id).order("model_name"),
        supabase.from("structural_technical_queries").select("*, wbs_nodes(name)").eq("project_id", activeProject.id).order("query_number"),
        supabase.from("structural_design_criteria").select("*").eq("project_id", activeProject.id).order("parameter_name"),
        supabase.from("structural_load_summaries").select("*, wbs_nodes(name)").eq("project_id", activeProject.id).order("load_case"),
        supabase.from("structural_rebar_reviews").select("*, wbs_nodes(name)").eq("project_id", activeProject.id).order("submittal_number"),
        supabase.from("wbs_nodes").select("*").eq("project_id", activeProject.id).order("name")
      ]);

      setDrawings(drawingsRes.data || []);
      setBbs(bbsRes.data || []);
      setInspections(inspectionsRes.data || []);
      setCalcNotes(calcRes.data || []);
      setModels(modelsRes.data || []);
      setQueries(queriesRes.data || []);
      setDesignCriteria(criteriaRes.data || []);
      setLoadSummaries(loadRes.data || []);
      setRebarReviews(reviewsRes.data || []);
      setWbsNodes(wbsRes.data || []);
    } catch (e: any) { toast.error(e.message); } finally { setLoading(false); }
  };

  const handleAddDrawing = async () => {
    if (!newDrawing.drawing_number || !newDrawing.title) return toast.error("Please fill required fields");
    setSubmitting(true);
    try {
      const { error } = await supabase.from("structural_drawings").insert({ project_id: activeProject!.id, ...newDrawing, wbs_node_id: newDrawing.wbs_node_id || null });
      if (error) throw error;
      toast.success("Drawing added"); setIsDrawingOpen(false); loadData();
    } catch (e: any) { toast.error(e.message); } finally { setSubmitting(false); }
  };

  const handleAddBbs = async () => {
    if (!newBbs.wbs_node_id || !newBbs.member_mark || !newBbs.bar_mark) return toast.error("Fill required fields");
    setSubmitting(true);
    try {
      const { error } = await supabase.from("structural_rebar_schedules").insert({ project_id: activeProject!.id, ...newBbs });
      if (error) throw error;
      toast.success("BBS Entry added"); setIsBbsOpen(false); loadData();
    } catch (e: any) { toast.error(e.message); } finally { setSubmitting(false); }
  };

  const handleAddCalc = async () => {
    if (!newCalc.reference_number || !newCalc.title) return toast.error("Fill required fields");
    setSubmitting(true);
    try {
      let fileUrl = "";
      if (file) {
        const { path } = await storageService.uploadFile(file, {
          bucket: "design-files",
          projectId: activeProject!.id,
          folder: "structural/calculations"
        });
        fileUrl = path;
      }

      const { error } = await supabase.from("structural_calculation_notes").insert({
        project_id: activeProject!.id,
        ...newCalc,
        file_url: fileUrl || null,
        wbs_node_id: newCalc.wbs_node_id || null
      });
      if (error) throw error;
      toast.success("Calculation Note added");
      setIsCalcOpen(false);
      setFile(null);
      loadData();
    } catch (e: any) { toast.error(e.message); } finally { setSubmitting(false); }
  };

  React.useEffect(() => { loadData(); }, [activeProject]);

  if (!activeProject) return <div className="p-8 text-muted-foreground">Select a project to view Structural records.</div>;

  const totalRebarWeight = bbs.reduce((acc, item) => acc + (item.total_weight_kg || 0), 0);
  const pendingInspections = inspections.filter(i => i.result === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight">Structural Engineering</h1><p className="text-muted-foreground">Design control, rebar reviews, and calculations.</p></div>
        <div className="flex flex-wrap gap-2 justify-end max-w-2xl">
          <Dialog open={isCriteriaOpen} onOpenChange={setIsCriteriaOpen}>
            <DialogTrigger asChild><Button variant="outline" className="gap-2"><Settings className="h-4 w-4" /> Criteria</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Design Criteria</DialogTitle></DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2"><Label>Parameter</Label><Input placeholder="Basic Wind Speed" value={newCriteria.parameter_name} onChange={e => setNewCriteria({...newCriteria, parameter_name: e.target.value})} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2"><Label>Value</Label><Input placeholder="45" value={newCriteria.parameter_value} onChange={e => setNewCriteria({...newCriteria, parameter_value: e.target.value})} /></div>
                  <div className="grid gap-2"><Label>Unit</Label><Input placeholder="m/s" value={newCriteria.unit} onChange={e => setNewCriteria({...newCriteria, unit: e.target.value})} /></div>
                </div>
              </div>
              <DialogFooter><Button onClick={async () => {
                const { error } = await supabase.from("structural_design_criteria").insert({...newCriteria, project_id: activeProject.id});
                if (!error) { toast.success("Criteria saved"); setIsCriteriaOpen(false); loadData(); }
              }}>Save</Button></DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isRebarReviewOpen} onOpenChange={setIsRebarReviewOpen}>
            <DialogTrigger asChild><Button className="gap-2 bg-indigo-600 hover:bg-indigo-700"><ClipboardCheck className="h-4 w-4" /> Rebar Review</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New Rebar Submittal Review</DialogTitle></DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2"><Label>Submittal No.</Label><Input placeholder="STR-REBAR-SUB-001" value={newReview.submittal_number} onChange={e => setNewReview({...newReview, submittal_number: e.target.value})} /></div>
                <div className="grid gap-2"><Label>WBS Location</Label><Select onValueChange={v => setNewReview({...newReview, wbs_node_id: v})}><SelectTrigger><SelectValue placeholder="Select WBS" /></SelectTrigger><SelectContent>{wbsNodes.map(n => <SelectItem key={n.id} value={n.id}>{n.name}</SelectItem>)}</SelectContent></Select></div>
                <div className="grid gap-2"><Label>Drawing Ref</Label><Input placeholder="ARC-GA-L01-100" value={newReview.drawing_reference} onChange={e => setNewReview({...newReview, drawing_reference: e.target.value})} /></div>
              </div>
              <DialogFooter><Button onClick={async () => {
                const { error } = await supabase.from("structural_rebar_reviews").insert({...newReview, project_id: activeProject.id});
                if (!error) { toast.success("Review logged"); setIsRebarReviewOpen(false); loadData(); }
              }}>Save Review</Button></DialogFooter>
            </DialogContent>
          </Dialog>

          {/* ... Other buttons kept simple for brevity or same as before ... */}
          <Button variant="outline" className="gap-2" onClick={() => setIsDrawingOpen(true)}><Plus className="h-4 w-4" /> Drawing</Button>
          <Button variant="outline" className="gap-2" onClick={() => setIsCalcOpen(true)}><FileText className="h-4 w-4" /> Calc</Button>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-indigo-50 border-indigo-100"><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider">Total Rebar</p><div className="text-2xl font-bold text-indigo-900">{(totalRebarWeight/1000).toFixed(2)} T</div></div><Box className="h-8 w-8 text-indigo-600 opacity-20" /></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Drawings</p><div className="text-2xl font-bold">{drawings.length}</div></div><Layers className="h-8 w-8 text-primary opacity-20" /></div></CardContent></Card>
        <Card className={rebarReviews.filter(r => r.status === 'under_review').length > 0 ? "bg-amber-50 border-amber-100" : ""}><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Open Reviews</p><div className="text-2xl font-bold text-amber-900">{rebarReviews.filter(r => r.status === 'under_review').length}</div></div><ClipboardCheck className="h-8 w-8 text-amber-600 opacity-20" /></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Calc Notes</p><div className="text-2xl font-bold">{calcNotes.length}</div></div><FileText className="h-8 w-8 text-emerald-500 opacity-20" /></div></CardContent></Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="basis">Design Basis</TabsTrigger>
          <TabsTrigger value="drawings">Drawings</TabsTrigger>
          <TabsTrigger value="rebar">Rebar (BBS & Review)</TabsTrigger>
          <TabsTrigger value="calc">Calculations</TabsTrigger>
          <TabsTrigger value="models">Models</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <div className="grid md:grid-cols-2 gap-6">
            <Card><CardHeader><CardTitle className="text-base">Structural Design Criteria</CardTitle></CardHeader>
            <CardContent><div className="space-y-2">{designCriteria.slice(0,5).map(c => (
              <div key={c.id} className="flex justify-between p-2 border rounded-md">
                <span className="text-sm font-medium">{c.parameter_name}</span>
                <span className="text-sm font-mono">{c.parameter_value} {c.unit}</span>
              </div>
            ))}</div></CardContent></Card>
            <Card><CardHeader><CardTitle className="text-base">Recent Rebar Reviews</CardTitle></CardHeader>
            <CardContent><div className="space-y-2">{rebarReviews.slice(0,5).map(r => (
              <div key={r.id} className="flex justify-between items-center p-2 border rounded-md">
                <div><div className="text-xs font-bold">{r.submittal_number}</div><div className="text-[10px] text-muted-foreground">{r.wbs_nodes?.name}</div></div>
                <Badge variant={r.status === 'approved' ? 'default' : 'secondary'}>{r.status.replace(/_/g, ' ')}</Badge>
              </div>
            ))}</div></CardContent></Card>
          </div>
        </TabsContent>

        <TabsContent value="basis">
          <div className="grid md:grid-cols-2 gap-6">
            <Card><CardHeader className="flex flex-row items-center justify-between"><CardTitle>Design Criteria</CardTitle><Button size="sm" variant="ghost" onClick={() => setIsCriteriaOpen(true)}><Plus className="h-4 w-4" /></Button></CardHeader>
            <CardContent><table className="w-full text-sm"><thead><tr className="border-b"><th className="text-left p-2">Parameter</th><th className="text-right p-2">Value</th></tr></thead><tbody>
              {designCriteria.map(c => <tr key={c.id} className="border-b"><td className="p-2">{c.parameter_name}</td><td className="p-2 text-right font-mono">{c.parameter_value} {c.unit}</td></tr>)}
            </tbody></table></CardContent></Card>
            
            <Card><CardHeader className="flex flex-row items-center justify-between"><CardTitle>Load Summary</CardTitle>
              <Dialog open={isLoadSummaryOpen} onOpenChange={setIsLoadSummaryOpen}><DialogTrigger asChild><Button size="sm" variant="ghost"><Plus className="h-4 w-4" /></Button></DialogTrigger>
              <DialogContent><DialogHeader><DialogTitle>Add Load Summary</DialogTitle></DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2"><Label>Load Case</Label><Select onValueChange={v => setNewLoad({...newLoad, load_case: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Dead">Dead</SelectItem><SelectItem value="Live">Live</SelectItem><SelectItem value="Wind">Wind</SelectItem><SelectItem value="Seismic">Seismic</SelectItem></SelectContent></Select></div>
                  <div className="grid gap-2"><Label>Magnitude (kN/m²)</Label><Input type="number" value={newLoad.magnitude_kn_m2} onChange={e => setNewLoad({...newLoad, magnitude_kn_m2: e.target.value})} /></div>
                  <div className="grid gap-2"><Label>Description</Label><Input value={newLoad.description} onChange={e => setNewLoad({...newLoad, description: e.target.value})} /></div>
                </div>
                <DialogFooter><Button onClick={async () => {
                  const { error } = await supabase.from("structural_load_summaries").insert({...newLoad, project_id: activeProject.id, magnitude_kn_m2: parseFloat(newLoad.magnitude_kn_m2)});
                  if (!error) { toast.success("Load saved"); setIsLoadSummaryOpen(false); loadData(); }
                }}>Save</Button></DialogFooter>
              </DialogContent></Dialog></CardHeader>
            <CardContent><table className="w-full text-sm"><thead><tr className="border-b"><th className="text-left p-2">Case</th><th className="text-right p-2">kN/m²</th></tr></thead><tbody>
              {loadSummaries.map(l => <tr key={l.id} className="border-b"><td className="p-2">{l.load_case}</td><td className="p-2 text-right font-mono">{l.magnitude_kn_m2}</td></tr>)}
            </tbody></table></CardContent></Card>
          </div>
        </TabsContent>

        <TabsContent value="rebar">
          <Tabs defaultValue="reviews">
            <TabsList><TabsTrigger value="reviews">Shop Drawing Reviews</TabsTrigger><TabsTrigger value="bbs">BBS Data</TabsTrigger></TabsList>
            <TabsContent value="reviews">
              <Card><CardContent className="pt-6"><table className="w-full text-sm text-left"><thead><tr className="border-b"><th className="p-2">Submittal #</th><th className="p-2">Location</th><th className="p-2">Status</th></tr></thead><tbody>
                {rebarReviews.map(r => <tr key={r.id} className="border-b"><td className="p-2 font-mono font-bold">{r.submittal_number}</td><td className="p-2">{r.wbs_nodes?.name}</td><td className="p-2"><Badge variant={r.status === 'approved' ? 'default' : 'secondary'}>{r.status.replace(/_/g, ' ')}</Badge></td></tr>)}
              </tbody></table></CardContent></Card>
            </TabsContent>
            <TabsContent value="bbs">
              <Card><CardContent className="pt-6"><table className="w-full text-sm text-left"><thead><tr className="border-b"><th className="p-2">Location</th><th className="p-2">Member</th><th className="p-2 text-right">Weight (kg)</th></tr></thead><tbody>
                {bbs.map(b => <tr key={b.id} className="border-b"><td className="p-2">{b.wbs_nodes?.name}</td><td className="p-2 font-bold">{b.member_mark}</td><td className="p-2 text-right font-mono">{b.total_weight_kg?.toFixed(2)}</td></tr>)}
              </tbody></table></CardContent></Card>
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="calc">
          <Card><CardContent className="pt-6"><table className="w-full text-sm text-left"><thead><tr className="border-b"><th className="p-2">Reference</th><th className="p-2">Title</th><th className="p-2">Rev</th><th className="p-2">Status</th><th className="p-4 text-right">Actions</th></tr></thead><tbody>
            {calcNotes.map(c => <tr key={c.id} className="border-b">
              <td className="p-2 font-mono">{c.reference_number}</td>
              <td className="p-2 font-medium">{c.title}</td>
              <td className="p-2">{c.revision}</td>
              <td className="p-2"><Badge variant="outline">{c.status}</Badge></td>
              <td className="p-4 text-right">
                {c.file_url && (
                  <Button variant="ghost" size="icon" onClick={() => storageService.downloadFile("design-files", c.file_url, `${c.reference_number}.pdf`)}>
                    <Download className="h-4 w-4" />
                  </Button>
                )}
              </td>
            </tr>)}
          </tbody></table></CardContent></Card>
        </TabsContent>
        
        <TabsContent value="models">
          <Card><CardContent className="pt-6"><table className="w-full text-sm text-left"><thead><tr className="border-b"><th className="p-2">Software</th><th className="p-2">Model Name</th><th className="p-2">Version</th><th className="p-2">Status</th></tr></thead><tbody>
            {models.map(m => <tr key={m.id} className="border-b"><td className="p-2"><Badge variant="secondary">{m.software}</Badge></td><td className="p-2 font-medium">{m.model_name}</td><td className="p-2">{m.version}</td><td className="p-2"><Badge>{m.status}</Badge></td></tr>)}
          </tbody></table></CardContent></Card>
        </TabsContent>
      </Tabs>

      {/* Calc Dialog */}
      <Dialog open={isCalcOpen} onOpenChange={setIsCalcOpen}>
        <DialogContent><DialogHeader><DialogTitle>Add Calculation Note</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2"><Label>Ref Number</Label><Input placeholder="STR-CALC-001" value={newCalc.reference_number} onChange={e => setNewCalc({...newCalc, reference_number: e.target.value})} /></div>
            <div className="grid gap-2"><Label>Title</Label><Input placeholder="Foundation Design" value={newCalc.title} onChange={e => setNewCalc({...newCalc, title: e.target.value})} /></div>
            <div className="grid gap-2"><Label>File (PDF)</Label><Input type="file" onChange={e => setFile(e.target.files?.[0] || null)} /></div>
          </div>
          <DialogFooter><Button onClick={handleAddCalc} disabled={submitting}>{submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Legacy Dialogs kept for compatibility or updated to same simple style ... */}
      <Dialog open={isDrawingOpen} onOpenChange={setIsDrawingOpen}>
        <DialogContent><DialogHeader><DialogTitle>Add Structural Drawing</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2"><Label>Drawing Number</Label><Input value={newDrawing.drawing_number} onChange={e => setNewDrawing({...newDrawing, drawing_number: e.target.value})} /></div>
            <div className="grid gap-2"><Label>Title</Label><Input value={newDrawing.title} onChange={e => setNewDrawing({...newDrawing, title: e.target.value})} /></div>
          </div>
          <DialogFooter><Button onClick={handleAddDrawing}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
