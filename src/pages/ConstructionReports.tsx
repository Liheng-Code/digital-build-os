import * as React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useProjects } from "@/contexts/ProjectContext";
import { useAuth } from "@/contexts/AuthContext";
import { useConstructionTasks, useSiteIssues, useConcretePours } from "@/hooks/useConstruction";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  BarChart3, 
  Download, 
  FileBarChart, 
  FileLineChart, 
  Truck, 
  AlertTriangle, 
  Users, 
  HardHat,
} from "lucide-react";
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

// Report types per Module 14.5
type ReportType = 
  | "daily_progress" 
  | "weekly_progress" 
  | "monthly_progress" 
  | "manpower_histogram" 
  | "equipment_utilization" 
  | "material_consumption" 
  | "delay_report" 
  | "issue_aging";

const REPORT_LABELS: Record<ReportType, string> = {
  daily_progress: "Daily Progress Report",
  weekly_progress: "Weekly Progress Report",
  monthly_progress: "Monthly Progress Report",
  manpower_histogram: "Manpower Histogram",
  equipment_utilization: "Equipment Utilization",
  material_consumption: "Material Consumption",
  delay_report: "Delay Report",
  issue_aging: "Issue Aging Report",
};

export default function ConstructionReports() {
  const { projectId } = useParams<{ projectId?: string }>();
  const { activeProject } = useProjects();
  const { hasRole } = useAuth();
  const navigate = useNavigate();
  
  const [activeReport, setActiveReport] = React.useState<ReportType>("daily_progress");
  const [dateRange, setDateRange] = React.useState({
    from: format(subDays(new Date(), 7), "yyyy-MM-dd"),
    to: format(new Date(), "yyyy-MM-dd"),
  });

  const { data: tasks = [] } = useConstructionTasks(activeProject?.id);
  const { data: issues = [] } = useSiteIssues(activeProject?.id);
  const { data: pours = [] } = useConcretePours(activeProject?.id);

  const canExport = hasRole("admin") || hasRole("project_manager");

  // Daily Progress Data
  const dailyProgressData = React.useMemo(() => {
    const from = new Date(dateRange.from);
    const to = new Date(dateRange.to);
    const days: { date: string; completed: number; inProgress: number; total: number }[] = [];
    
    for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
      const dateStr = format(d, "yyyy-MM-dd");
      const dayTasks = tasks.filter(t => 
        t.status === 'completed' && t.actual_finish === dateStr
      );
      const inProgress = tasks.filter(t => 
        t.status === 'in_progress' && 
        t.actual_start && t.actual_start <= dateStr && 
        (!t.actual_finish || t.actual_finish > dateStr)
      );
      
      days.push({
        date: format(d, "MM/dd"),
        completed: dayTasks.length,
        inProgress: inProgress.length,
        total: dayTasks.reduce((sum, t) => sum + (t.progress_pct || 0), 0) / (dayTasks.length || 1),
      });
    }
    return days;
  }, [tasks, dateRange]);

  // Manpower Histogram Data (placeholder - needs actual manpower logs)
  const manpowerData = React.useMemo(() => {
    return [
      { category: "Skilled Workers", count: 45 },
      { category: "Unskilled Workers", count: 78 },
      { category: "Engineers", count: 12 },
      { category: "Supervisors", count: 8 },
      { category: "Safety Officers", count: 3 },
      { category: "Equipment Operators", count: 15 },
    ];
  }, []);

  // Delay Report Data
  const delayData = React.useMemo(() => {
    const today = new Date();
    return tasks
      .filter(t => {
        if (!t.planned_finish) return false;
        return new Date(t.planned_finish) < today && 
               !['completed', 'approved', 'closed'].includes(t.status);
      })
      .map(t => ({
        task_code: t.task_code,
        title: t.title,
        planned_finish: t.planned_finish,
        days_delayed: Math.floor((today.getTime() - new Date(t.planned_finish!).getTime()) / (1000 * 60 * 60 * 24)),
        status: t.status,
      }))
      .sort((a, b) => b.days_delayed - a.days_delayed);
  }, [tasks]);

  // Issue Aging Data
  const issueAgingData = React.useMemo(() => {
    const today = new Date();
    return issues
      .filter(i => i.status === 'open' || i.status === 'in_progress')
      .map(i => ({
        issue_number: i.issue_number,
        title: i.title,
        reported_at: i.reported_at,
        days_open: Math.floor((today.getTime() - new Date(i.reported_at).getTime()) / (1000 * 60 * 60 * 24)),
        severity: i.severity,
      }))
      .sort((a, b) => b.days_open - a.days_open);
  }, [issues]);

  // Equipment Utilization Data (placeholder)
  const equipmentData = React.useMemo(() => {
    return [
      { equipment: "Excavator", utiliation: 85, hours: 170 },
      { equipment: "Crane", utiliation: 72, hours: 144 },
      { equipment: "Bulldozer", utiliation: 90, hours: 180 },
      { equipment: "Concrete Mixer", utiliation: 65, hours: 130 },
      { equipment: "Generator", utiliation: 95, hours: 190 },
    ];
  }, []);

  const handleExport = async (format: 'pdf' | 'excel') => {
    toast.success(`Exporting ${REPORT_LABELS[activeReport]} as ${format.toUpperCase()}...`);
    // TODO: Implement actual export logic
  };

  if (!activeProject) {
    return <div className="p-8 text-muted-foreground">Select a project to view reports.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" /> Construction Reports
          </h1>
          <p className="text-sm text-muted-foreground">
            Module 14.5 Key Reports for {activeProject.project_name}
          </p>
        </div>
        {canExport && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleExport('excel')}>
              <Download className="h-4 w-4 mr-1" /> Export Excel
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
              <Download className="h-4 w-4 mr-1" /> Export PDF
            </Button>
          </div>
        )}
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Label>From:</Label>
              <Input 
                type="date" 
                value={dateRange.from} 
                onChange={e => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                className="w-40 h-8"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label>To:</Label>
              <Input 
                type="date" 
                value={dateRange.to} 
                onChange={e => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                className="w-40 h-8"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeReport} onValueChange={v => setActiveReport(v as ReportType)}>
        <TabsList className="grid grid-cols-4 w-full max-w-4xl">
          <TabsTrigger value="daily_progress" className="text-xs">Daily Progress</TabsTrigger>
          <TabsTrigger value="weekly_progress" className="text-xs">Weekly</TabsTrigger>
          <TabsTrigger value="monthly_progress" className="text-xs">Monthly</TabsTrigger>
          <TabsTrigger value="manpower_histogram" className="text-xs">Manpower</TabsTrigger>
          <TabsTrigger value="equipment_utilization" className="text-xs">Equipment</TabsTrigger>
          <TabsTrigger value="material_consumption" className="text-xs">Material</TabsTrigger>
          <TabsTrigger value="delay_report" className="text-xs">Delays</TabsTrigger>
          <TabsTrigger value="issue_aging" className="text-xs">Issue Aging</TabsTrigger>
        </TabsList>

        {/* Daily Progress Report */}
        <TabsContent value="daily_progress" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileLineChart className="h-5 w-5" /> Daily Progress Report
              </CardTitle>
              <CardDescription>
                Task completion and progress from {dateRange.from} to {dateRange.to}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyProgressData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="completed" fill="#22c55e" name="Completed Tasks" />
                    <Bar dataKey="inProgress" fill="#3b82f6" name="In Progress" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4">
                <h4 className="font-medium mb-2">Summary</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold">{dailyProgressData.reduce((s, d) => s + d.completed, 0)}</p>
                    <p className="text-xs text-muted-foreground">Total Completed</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold">{dailyProgressData.reduce((s, d) => s + d.inProgress, 0)}</p>
                    <p className="text-xs text-muted-foreground">In Progress</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold">
                      {Math.round(dailyProgressData.reduce((s, d) => s + d.total, 0) / (dailyProgressData.length || 1))}%
                    </p>
                    <p className="text-xs text-muted-foreground">Avg Progress</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Manpower Histogram */}
        <TabsContent value="manpower_histogram" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-5 w-5" /> Manpower Histogram
              </CardTitle>
              <CardDescription>
                Current manpower distribution by category
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={manpowerData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="category" type="category" width={150} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" name="Count">
                      {manpowerData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#3b82f6" : "#22c55e"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4">
                <p className="text-sm text-muted-foreground">
                  Total Manpower: {manpowerData.reduce((s, d) => s + d.count, 0)} workers
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Equipment Utilization */}
        <TabsContent value="equipment_utilization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Truck className="h-5 w-5" /> Equipment Utilization
              </CardTitle>
              <CardDescription>
                Equipment utilization rates and operating hours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {equipmentData.map((eq, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{eq.equipment}</span>
                      <span className={eq.utiliation >= 80 ? "text-green-600" : eq.utiliation >= 60 ? "text-yellow-600" : "text-red-600"}>
                        {eq.utiliation}% ({eq.hours} hrs)
                      </span>
                    </div>
                    <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${eq.utiliation >= 80 ? "bg-green-500" : eq.utiliation >= 60 ? "bg-yellow-500" : "bg-red-500"}`}
                        style={{ width: `${eq.utiliation}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Delay Report */}
        <TabsContent value="delay_report" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" /> Delay Report
              </CardTitle>
              <CardDescription>
                Tasks with overdue completion dates
              </CardDescription>
            </CardHeader>
            <CardContent>
              {delayData.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No delayed tasks found.</p>
              ) : (
                <div className="space-y-3">
                  {delayData.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{item.task_code} - {item.title}</p>
                        <p className="text-xs text-muted-foreground">
                          Planned Finish: {item.planned_finish}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-red-600">{item.days_delayed}</p>
                        <p className="text-xs text-muted-foreground">days delayed</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Issue Aging Report */}
        <TabsContent value="issue_aging" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" /> Issue Aging Report
              </CardTitle>
              <CardDescription>
                Open issues sorted by age (longest open first)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {issueAgingData.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No open issues found.</p>
              ) : (
                <div className="space-y-3">
                  {issueAgingData.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{item.issue_number} - {item.title}</p>
                        <p className="text-xs text-muted-foreground">
                          Reported: {format(new Date(item.reported_at), "MMM dd, yyyy")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-2xl font-bold ${item.days_open > 30 ? "text-red-600" : item.days_open > 14 ? "text-yellow-600" : "text-green-600"}`}>
                          {item.days_open}
                        </p>
                        <p className="text-xs text-muted-foreground">days open</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Weekly/Monthly Progress - Placeholder */}
        <TabsContent value="weekly_progress" className="space-y-4">
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <FileBarChart className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Weekly Progress Report</p>
              <p className="text-xs">Aggregated weekly progress summary</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monthly_progress" className="space-y-4">
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <FileBarChart className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Monthly Progress Report</p>
              <p className="text-xs">Monthly progress summary with variance analysis</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="material_consumption" className="space-y-4">
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <HardHat className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Material Consumption Report</p>
              <p className="text-xs">Material usage by WBS and date range</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
