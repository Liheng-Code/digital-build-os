import * as React from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProjects } from "@/contexts/ProjectContext";
import { useWbsTree } from "@/hooks/useWbsTree";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Package, 
  ShoppingCart, 
  Plus, 
  Search, 
  Filter, 
  ArrowRight, 
  ClipboardList, 
  CheckCircle2, 
  Clock,
  Building,
  Layers,
  ArrowUpRight,
  Loader2
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

export default function Procurement() {
  const { activeProject } = useProjects();
  const [loading, setLoading] = React.useState(true);
  const [prs, setPrs] = React.useState<any[]>([]);
  const [catalog, setCatalog] = React.useState<any[]>([]);
  const [activeTab, setActiveTab] = React.useState("dashboard");

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
          <Button variant="outline" className="gap-2">
            <ClipboardList className="h-4 w-4" /> Material Catalog
          </Button>
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> New PR
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="mto">MTO from RDS</TabsTrigger>
          <TabsTrigger value="prs">Purchase Requisitions</TabsTrigger>
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
