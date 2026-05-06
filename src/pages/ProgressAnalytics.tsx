import * as React from "react";
import { useProjects } from "@/contexts/ProjectContext";
import { useWbsTree } from "@/hooks/useWbsTree";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from "recharts";
import { 
  TrendingUp, 
  Target, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Calendar,
  Layers,
  Building,
  RefreshCw
} from "lucide-react";
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths, isBefore, isAfter } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function ProgressAnalytics() {
  const { activeProject } = useProjects();
  const { nodes: wbsNodes, loading: wbsLoading } = useWbsTree(activeProject?.id);
  
  const [tasks, setTasks] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [syncing, setSyncing] = React.useState(false);

  const loadTasks = async () => {
    if (!activeProject) return;
    const { data } = await supabase
      .from("tasks")
      .select("id, title, planned_start_date, planned_end_date, actual_start_date, actual_end_date, progress_pct, wbs_node_id")
      .eq("project_id", activeProject.id);
    setTasks(data || []);
    setLoading(false);
  };

  const handleSync = async () => {
    if (!activeProject) return;
    setSyncing(true);
    try {
      const { error } = await supabase.rpc('sync_all_wbs_progress', { v_project_id: activeProject.id });
      if (error) throw error;
      toast.success("Progress synchronized successfully");
      await loadTasks();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSyncing(false);
    }
  };

  React.useEffect(() => {
    loadTasks();
  }, [activeProject]);

  // S-Curve Data Generation (Simplified)
  const sCurveData = React.useMemo(() => {
    if (!tasks.length) return [];
    
    // Define interval (last 6 months to next 3 months)
    const start = subMonths(new Date(), 6);
    const end = startOfMonth(new Date()); // Current month
    const interval = eachMonthOfInterval({ start, end });

    return interval.map(date => {
      const monthStr = format(date, "MMM yy");
      
      // Actual: Average progress of tasks at this point (Simplified)
      // In a real system, we'd query history. Here we simulate based on actual_end_date
      const actualProgress = tasks.reduce((acc, t) => {
        if (t.actual_end_date && isBefore(new Date(t.actual_end_date), date)) return acc + 100;
        if (t.actual_start_date && isBefore(new Date(t.actual_start_date), date)) return acc + (t.progress_pct || 0);
        return acc;
      }, 0) / tasks.length;

      // Planned: Based on planned_end_date
      const plannedProgress = tasks.reduce((acc, t) => {
        if (t.planned_end_date && isBefore(new Date(t.planned_end_date), date)) return acc + 100;
        return acc;
      }, 0) / tasks.length;

      return {
        name: monthStr,
        actual: Math.round(actualProgress),
        planned: Math.round(plannedProgress),
      };
    });
  }, [tasks]);

  // Progress by Building
  const buildingData = React.useMemo(() => {
    return wbsNodes
      .filter(n => n.node_type === 'building')
      .map(n => ({
        name: n.name,
        progress: (n as any).progress_pct || 0,
      }));
  }, [wbsNodes]);

  if (!activeProject) {
    return <div className="p-8 text-muted-foreground">Select a project to view analytics.</div>;
  }

  if (loading || wbsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const overallProgress = Math.round(
    wbsNodes.filter(n => !n.parent_id).reduce((acc, n) => acc + ((n as any).progress_pct || 0), 0) / 
    (wbsNodes.filter(n => !n.parent_id).length || 1)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Progress & Analytics</h1>
          <p className="text-muted-foreground">Real-time performance roll-up from WBS hierarchy.</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleSync} 
          disabled={syncing}
          className="gap-2"
        >
          {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Sync Progress
        </Button>
      </div>

      {/* KPI Overviews */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Overall Progress</p>
                <div className="text-2xl font-bold">{overallProgress}%</div>
              </div>
              <TrendingUp className="h-8 w-8 text-primary opacity-20" />
            </div>
            <div className="mt-4 h-2 w-full bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary" style={{ width: `${overallProgress}%` }} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active Tasks</p>
                <div className="text-2xl font-bold">{tasks.filter(t => t.progress_pct > 0 && t.progress_pct < 100).length}</div>
              </div>
              <Layers className="h-8 w-8 text-blue-500 opacity-20" />
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">Across all project buildings</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Completed</p>
                <div className="text-2xl font-bold text-emerald-600">{tasks.filter(t => t.progress_pct === 100).length}</div>
              </div>
              <CheckCircle2 className="h-8 w-8 text-emerald-500 opacity-20" />
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">Tasks at 100% completion</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Critical Alerts</p>
                <div className="text-2xl font-bold text-destructive">
                  {tasks.filter(t => isAfter(new Date(), new Date(t.planned_end_date)) && t.progress_pct < 100).length}
                </div>
              </div>
              <AlertCircle className="h-8 w-8 text-destructive opacity-20" />
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">Overdue tasks requiring attention</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* S-Curve */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Project S-Curve
            </CardTitle>
            <CardDescription>Cumulative Planned vs Actual Progress (%)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sCurveData}>
                  <defs>
                    <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                  <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis fontSize={10} axisLine={false} tickLine={false} unit="%" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#1e293b", border: "none", borderRadius: "8px", color: "#fff" }}
                    itemStyle={{ fontSize: "12px" }}
                  />
                  <Legend iconType="circle" />
                  <Area 
                    type="monotone" 
                    dataKey="planned" 
                    stroke="#94a3b8" 
                    fill="transparent" 
                    strokeWidth={2} 
                    strokeDasharray="5 5" 
                    name="Baseline (Planned)"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="actual" 
                    stroke="#0ea5e9" 
                    fillOpacity={1} 
                    fill="url(#colorActual)" 
                    strokeWidth={3} 
                    name="Live (Actual)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Building Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building className="h-4 w-4 text-primary" />
              Building Progress
            </CardTitle>
            <CardDescription>Completion % by primary structure</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={buildingData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.1} />
                  <XAxis type="number" fontSize={10} axisLine={false} tickLine={false} hide />
                  <YAxis dataKey="name" type="category" fontSize={10} axisLine={false} tickLine={false} width={80} />
                  <Tooltip cursor={{fill: 'transparent'}} />
                  <Bar dataKey="progress" fill="#0ea5e9" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Level Breakdown heatmap */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            WBS Node Performance
          </CardTitle>
          <CardDescription>Top performing and lagging WBS locations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {wbsNodes
              .filter(n => n.node_type === 'level' || n.node_type === 'zone')
              .slice(0, 10)
              .map(node => (
                <div key={node.id} className="p-3 border rounded-lg flex flex-col gap-2">
                  <div className="text-[10px] font-mono text-muted-foreground uppercase truncate">{node.code}</div>
                  <div className="text-xs font-bold truncate">{node.name}</div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm font-bold text-primary">{(node as any).progress_pct || 0}%</span>
                    <Badge variant={((node as any).progress_pct || 0) > 80 ? "default" : "outline"} className="text-[9px] h-4">
                      {((node as any).progress_pct || 0) > 80 ? "Active" : "Pending"}
                    </Badge>
                  </div>
                  <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${((node as any).progress_pct || 0) > 50 ? 'bg-emerald-500' : 'bg-amber-500'}`} 
                      style={{ width: `${(node as any).progress_pct || 0}%` }} 
                    />
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
