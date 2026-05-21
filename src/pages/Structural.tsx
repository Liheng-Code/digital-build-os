
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

export default function Structural() {
  const { activeProject } = useProjects();
  const [loading, setLoading] = React.useState(true);
  const [drawings, setDrawings] = React.useState<any[]>([]);
  const [bbs, setBbs] = React.useState<any[]>([]);
  const [inspections, setInspections] = React.useState<any[]>([]);
  const [activeTab, setActiveTab] = React.useState("dashboard");

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
          .order("created_at", { ascending: false })
      ]);

      setDrawings(drawingsRes.data || []);
      setBbs(bbsRes.data || []);
      setInspections(inspectionsRes.data || []);
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
          <Button variant="outline" className="gap-2">
            <Plus className="h-4 w-4" /> Add Drawing
          </Button>
          <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700">
            <Plus className="h-4 w-4" /> New BBS Entry
          </Button>
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
