import * as React from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProjects } from "@/contexts/ProjectContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Truck, 
  Activity, 
  Clock, 
  AlertCircle, 
  BarChart3, 
  Calendar,
  Filter,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function EquipmentTracking() {
  const { activeProject } = useProjects();
  const [loading, setLoading] = React.useState(true);
  const [equipmentLogs, setEquipmentLogs] = React.useState<any[]>([]);
  const [stats, setStats] = React.useState({
    totalOperating: 0,
    totalIdle: 0,
    utilization: 0,
    activeMachinery: 0
  });

  const loadData = async () => {
    if (!activeProject) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("daily_equipment")
        .select(`
          *,
          daily_site_reports (
            report_date,
            project_id
          )
        `)
        .filter("daily_site_reports.project_id", "eq", activeProject.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Filter out logs that might be from other projects (due to filter limitation on joined tables in some versions)
      const projectLogs = (data || []).filter(log => log.daily_site_reports?.project_id === activeProject.id);
      setEquipmentLogs(projectLogs);

      // Calculate stats
      const op = projectLogs.reduce((acc, curr) => acc + (Number(curr.hours_operated) * Number(curr.quantity)), 0);
      const idle = projectLogs.reduce((acc, curr) => acc + (Number(curr.idle_hours) * Number(curr.quantity)), 0);
      const uniqueMachinery = new Set(projectLogs.map(l => l.equipment_name)).size;

      setStats({
        totalOperating: op,
        totalIdle: idle,
        utilization: op + idle > 0 ? (op / (op + idle)) * 100 : 0,
        activeMachinery: uniqueMachinery
      });

    } catch (e: any) {
      console.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadData();
  }, [activeProject]);

  if (!activeProject) {
    return <div className="p-8 text-muted-foreground">Select a project to view Equipment Tracking.</div>;
  }

  // Data for Charts
  const chartData = React.useMemo(() => {
    const daily: Record<string, any> = {};
    equipmentLogs.slice(0, 30).forEach(log => {
      const date = format(new Date(log.daily_site_reports?.report_date || log.created_at), "MMM dd");
      if (!daily[date]) daily[date] = { name: date, operating: 0, idle: 0 };
      daily[date].operating += Number(log.hours_operated);
      daily[date].idle += Number(log.idle_hours);
    });
    return Object.values(daily).reverse();
  }, [equipmentLogs]);

  const pieData = [
    { name: 'Operating', value: stats.totalOperating },
    { name: 'Idle', value: stats.totalIdle },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Equipment Tracking</h1>
          <p className="text-muted-foreground text-sm">
            Plant utilization and machinery logs based on Daily Site Reports.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="h-8 gap-1">
            <Calendar className="h-3 w-3" /> Last 30 Days
          </Badge>
          <Badge variant="outline" className="h-8 gap-1">
            <Filter className="h-3 w-3" /> All Equipment
          </Badge>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Operating Hours</p>
                <h3 className="text-2xl font-bold mt-1">{stats.totalOperating.toFixed(1)} <span className="text-sm font-normal text-muted-foreground">hrs</span></h3>
              </div>
              <div className="bg-primary/10 p-2 rounded-full">
                <Activity className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Idle Hours</p>
                <h3 className="text-2xl font-bold mt-1 text-orange-600">{stats.totalIdle.toFixed(1)} <span className="text-sm font-normal text-muted-foreground">hrs</span></h3>
              </div>
              <div className="bg-orange-50 p-2 rounded-full">
                <Clock className="h-5 w-5 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Utilization Rate</p>
                <h3 className="text-2xl font-bold mt-1 text-emerald-600">{stats.utilization.toFixed(1)}%</h3>
              </div>
              <div className="bg-emerald-50 p-2 rounded-full text-emerald-600">
                <BarChart3 className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-indigo-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Unique Machinery</p>
                <h3 className="text-2xl font-bold mt-1">{stats.activeMachinery}</h3>
              </div>
              <div className="bg-indigo-50 p-2 rounded-full">
                <Truck className="h-5 w-5 text-indigo-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Charts */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Utilization Trend</CardTitle>
            <CardDescription>Daily operating vs idle hours (last 30 entries)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  />
                  <Legend verticalAlign="top" align="right" height={36}/>
                  <Bar dataKey="operating" name="Operating" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="idle" name="Idle" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Hours Distribution</CardTitle>
            <CardDescription>Operating vs Idle Split</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    <Cell fill="#3b82f6" />
                    <Cell fill="#f97316" />
                  </Pie>
                  <RechartsTooltip />
                  <Legend verticalAlign="bottom" />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 text-center">
              <p className="text-sm font-medium">Efficiency Focus</p>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.utilization > 70 
                  ? "High utilization detected. Monitor maintenance needs." 
                  : "Consider consolidating machinery to reduce idle time."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Recent Equipment Logs</CardTitle>
          <CardDescription>Detailed logs from daily site reports</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader className="bg-muted/50 sticky top-0 z-10">
                <TableRow>
                  <TableHead className="w-[120px]">Date</TableHead>
                  <TableHead>Equipment</TableHead>
                  <TableHead className="text-center">Qty</TableHead>
                  <TableHead className="text-center">Operating</TableHead>
                  <TableHead className="text-center">Idle</TableHead>
                  <TableHead>Utilization</TableHead>
                  <TableHead>Reason for Idle</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {equipmentLogs.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground italic">
                      No equipment logs found for this project.
                    </TableCell>
                  </TableRow>
                )}
                {equipmentLogs.map((log) => {
                  const logUtil = log.hours_operated + log.idle_hours > 0 
                    ? (log.hours_operated / (log.hours_operated + log.idle_hours)) * 100 
                    : 0;
                  
                  return (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs font-medium">
                        {log.daily_site_reports?.report_date ? format(new Date(log.daily_site_reports.report_date), "dd MMM yyyy") : "—"}
                      </TableCell>
                      <TableCell className="font-semibold">{log.equipment_name}</TableCell>
                      <TableCell className="text-center">{log.quantity}</TableCell>
                      <TableCell className="text-center font-mono text-emerald-600">{log.hours_operated}h</TableCell>
                      <TableCell className="text-center font-mono text-orange-600">{log.idle_hours}h</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden hidden md:block">
                            <div 
                              className={`h-full ${logUtil > 70 ? 'bg-emerald-500' : logUtil > 40 ? 'bg-amber-500' : 'bg-orange-500'}`} 
                              style={{ width: `${logUtil}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono">{logUtil.toFixed(0)}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground italic">
                        {log.idle_reason || "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
