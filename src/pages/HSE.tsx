
import * as React from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProjects } from "@/contexts/ProjectContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ShieldCheck, 
  AlertTriangle, 
  FileCheck, 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Activity,
  Calendar,
  Loader2,
  HardHat
} from "lucide-react";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";
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

export default function HSE() {
  const { activeProject } = useProjects();
  const [loading, setLoading] = React.useState(true);
  const [permits, setPermits] = React.useState<any[]>([]);
  const [incidents, setIncidents] = React.useState<any[]>([]);
  const [tbt, setTbt] = React.useState<any[]>([]);
  const [activeTab, setActiveTab] = React.useState("dashboard");

  const loadData = async () => {
    if (!activeProject) return;
    setLoading(true);
    try {
      const [permitsRes, incidentsRes, tbtRes] = await Promise.all([
        supabase
          .from("safety_permits")
          .select("*")
          .eq("project_id", activeProject.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("safety_incidents")
          .select("*")
          .eq("project_id", activeProject.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("safety_toolbox_talks")
          .select("*")
          .eq("project_id", activeProject.id)
          .order("created_at", { ascending: false })
      ]);

      setPermits(permitsRes.data || []);
      setIncidents(incidentsRes.data || []);
      setTbt(tbtRes.data || []);
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
    return <div className="p-8 text-muted-foreground">Select a project to view Safety records.</div>;
  }

  // Calculate KPIs
  const lastIncident = incidents.length > 0 
    ? new Date(incidents.sort((a,b) => new Date(b.incident_date).getTime() - new Date(a.incident_date).getTime())[0].incident_date) 
    : new Date(activeProject.created_at);
  const safeDays = Math.max(0, differenceInDays(new Date(), lastIncident));
  const openPermits = permits.filter(p => p.status === 'pending' || p.status === 'approved').length;
  const criticalIncidents = incidents.filter(i => i.severity === 'critical' || i.severity === 'high').length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Safety & HSE</h1>
          <p className="text-muted-foreground">Health, Safety, and Environment management system.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 border-red-200 text-red-700 hover:bg-red-50">
            <AlertTriangle className="h-4 w-4" /> Report Incident
          </Button>
          <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4" /> New PTW Permit
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-emerald-50 border-emerald-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-emerald-800 uppercase">Days Since Last Incident</p>
                <div className="text-3xl font-bold text-emerald-900">{safeDays}</div>
              </div>
              <ShieldCheck className="h-10 w-10 text-emerald-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Active Permits</p>
                <div className="text-3xl font-bold">{openPermits}</div>
              </div>
              <FileCheck className="h-10 w-10 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card className={criticalIncidents > 0 ? "bg-red-50 border-red-100" : ""}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Total Incidents</p>
                <div className="text-3xl font-bold text-red-700">{incidents.length}</div>
              </div>
              <AlertCircle className="h-10 w-10 text-red-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Toolbox Talks (MTD)</p>
                <div className="text-3xl font-bold">{tbt.length}</div>
              </div>
              <Users className="h-10 w-10 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="permits">Permits to Work</TabsTrigger>
          <TabsTrigger value="incidents">Incident Register</TabsTrigger>
          <TabsTrigger value="tbt">Toolbox Talks</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-500" /> Pending Permits
                </CardTitle>
                <CardDescription>Permits awaiting safety officer approval.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {permits.filter(p => p.status === 'pending').slice(0, 3).map(p => (
                    <div key={p.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex gap-3">
                        <div className="h-9 w-9 rounded bg-amber-50 flex items-center justify-center">
                          <HardHat className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                          <div className="text-[10px] font-mono font-bold text-muted-foreground">{p.permit_number}</div>
                          <div className="text-sm font-semibold">{p.subject}</div>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-[10px] uppercase">{p.type}</Badge>
                    </div>
                  ))}
                  {permits.filter(p => p.status === 'pending').length === 0 && (
                    <div className="text-center py-6 text-sm text-muted-foreground">No pending permits.</div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4 text-red-500" /> Recent Incidents
                </CardTitle>
                <CardDescription>Latest reported safety occurrences.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {incidents.slice(0, 3).map(i => (
                    <div key={i.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex gap-3">
                        <div className={`h-9 w-9 rounded flex items-center justify-center ${
                          i.severity === 'critical' ? 'bg-red-100' : 'bg-orange-50'
                        }`}>
                          <AlertTriangle className={`h-5 w-5 ${
                            i.severity === 'critical' ? 'text-red-600' : 'text-orange-600'
                          }`} />
                        </div>
                        <div>
                          <div className="text-[10px] font-mono font-bold text-muted-foreground">{i.incident_number}</div>
                          <div className="text-sm font-semibold">{i.subject}</div>
                          <div className="text-[10px] text-muted-foreground">{format(new Date(i.incident_date), "MMM d, yyyy HH:mm")}</div>
                        </div>
                      </div>
                      <Badge className={i.severity === 'critical' ? 'bg-red-600' : ''}>{i.severity}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="permits">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>PTW Register</CardTitle>
                <CardDescription>Digital Permit to Work tracking.</CardDescription>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search permits..." className="pl-8 h-9 w-[200px]" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="p-3 text-left font-medium">Permit #</th>
                      <th className="p-3 text-left font-medium">Type</th>
                      <th className="p-3 text-left font-medium">Subject</th>
                      <th className="p-3 text-left font-medium">Validity</th>
                      <th className="p-3 text-left font-medium">Status</th>
                      <th className="p-3 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {permits.map(p => (
                      <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3 font-mono font-bold text-primary">{p.permit_number}</td>
                        <td className="p-3">
                          <Badge variant="outline" className="text-[10px] uppercase">{p.type.replace('_', ' ')}</Badge>
                        </td>
                        <td className="p-3 font-medium">{p.subject}</td>
                        <td className="p-3 text-xs text-muted-foreground">
                          {format(new Date(p.valid_from), "MMM d")} - {format(new Date(p.valid_until), "MMM d")}
                        </td>
                        <td className="p-3">
                          <Badge className={
                            p.status === 'approved' ? 'bg-emerald-600' : 
                            p.status === 'pending' ? 'bg-amber-500' : 
                            'bg-muted-foreground'
                          }>
                            {p.status}
                          </Badge>
                        </td>
                        <td className="p-3 text-right">
                          <Button variant="ghost" size="sm" className="h-8 text-xs">Details</Button>
                        </td>
                      </tr>
                    ))}
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
