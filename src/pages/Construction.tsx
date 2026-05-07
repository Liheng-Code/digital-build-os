import * as React from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useProjects } from "@/contexts/ProjectContext";
import { useAuth } from "@/contexts/AuthContext";
import { useConstructionTasks, useSiteIssues, useInspectionRequests, useConcretePours, useConstructionDashboard } from "@/hooks/useConstruction";
import { 
  CONSTRUCTION_TASK_STATUS_LABELS, 
  CONSTRUCTION_TASK_STATUS_TONE, 
  CONSTRUCTION_TASK_PRIORITY_LABELS,
  TASK_STATUS_FLOW,
  type ConstructionTaskStatus,
} from "@/lib/constructionMeta";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  HardHat, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Loader2,
  ClipboardCheck,
  AlertTriangle,
  FileCheck,
  Waves,
  Camera,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { WbsNodePicker } from "@/components/wbs/WbsNodePicker";

// KPI Card Component
function KpiCard({ label, value, icon: Icon, tone }: { label: string; value: number | string; icon: any; tone?: string }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={cn("p-2 rounded-md", tone || "bg-primary/10")}>
          <Icon className={cn("h-5 w-5", tone ? "text-white" : "text-primary")} />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// Status Badge Component
function TaskStatusBadge({ status }: { status: ConstructionTaskStatus }) {
  const tone = CONSTRUCTION_TASK_STATUS_TONE[status];
  const label = CONSTRUCTION_TASK_STATUS_LABELS[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium", tone.bg, tone.fg)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", tone.dot)} />
      {label}
    </span>
  );
}

// Priority Badge Component
function PriorityBadge({ priority }: { priority: string }) {
  const colorMap: Record<string, string> = {
    low: "bg-muted text-muted-foreground",
    medium: "bg-info-soft text-info",
    high: "bg-warning-soft text-warning",
    critical: "bg-destructive-soft text-destructive",
  };
  return (
    <Badge className={cn("text-xs", colorMap[priority] || "bg-muted")}>
      {CONSTRUCTION_TASK_PRIORITY_LABELS[priority as keyof typeof CONSTRUCTION_TASK_PRIORITY_LABELS] || priority}
    </Badge>
  );
}

export default function Construction() {
  const { activeProject } = useProjects();
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = React.useState("dashboard");
  const [taskStatusFilter, setTaskStatusFilter] = React.useState<string>("all");
  const [search, setSearch] = React.useState("");
  const [isCreateTaskOpen, setIsCreateTaskOpen] = React.useState(false);

  // Data queries
  const { data: tasks = [], isLoading: tasksLoading, refetch: refetchTasks } = useConstructionTasks(activeProject?.id, {
    status: taskStatusFilter !== "all" ? taskStatusFilter as ConstructionTaskStatus : undefined,
  });
  
  const { data: issues = [], isLoading: issuesLoading } = useSiteIssues(activeProject?.id);
  const { data: inspections = [], isLoading: inspectionsLoading } = useInspectionRequests(activeProject?.id);
  const { data: pours = [], isLoading: poursLoading } = useConcretePours(activeProject?.id);
  const { data: dash, isLoading: dashLoading } = useConstructionDashboard(activeProject?.id);

  const canCreate = hasRole("admin") || hasRole("project_manager") || hasRole("engineer") || hasRole("supervisor");
  const canApprove = hasRole("admin") || hasRole("project_manager");

  // Filter tasks based on search
  const filteredTasks = React.useMemo(() => {
    return tasks.filter(t => {
      if (search && !t.title.toLowerCase().includes(search.toLowerCase()) && !(t.task_code || "").toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [tasks, search]);

  // Create Task Form State
  const [newTask, setNewTask] = React.useState({
    title: "",
    description: "",
    priority: "medium",
    wbs_node_id: "",
    planned_start: "",
    planned_finish: "",
  });

  const handleCreateTask = async () => {
    if (!activeProject || !user || !newTask.title) return;
    
    const { error } = await supabase
      .from("construction_tasks")
      .insert({
        project_id: activeProject.id,
        wbs_node_id: newTask.wbs_node_id || null,
        task_code: `CON-${format(new Date(), "yyyyMMdd")}-${Date.now().toString().slice(-3)}`,
        title: newTask.title,
        description: newTask.description || null,
        priority: newTask.priority,
        planned_start: newTask.planned_start || null,
        planned_finish: newTask.planned_finish || null,
        created_by: user.id,
        status: "open",
      });
    
    if (error) {
      toast.error(error.message);
      return;
    }
    
    toast.success("Construction task created");
    setIsCreateTaskOpen(false);
    setNewTask({ title: "", description: "", priority: "medium", wbs_node_id: "", planned_start: "", planned_finish: "" });
    refetchTasks();
  };

  if (!activeProject) {
    return <div className="p-8 text-muted-foreground">Select a project to view Construction Management.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <HardHat className="h-6 w-6" /> Construction Management
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage site execution, tasks, progress, and inspections per Module 9
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setIsCreateTaskOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> New Task
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full max-w-3xl">
          <TabsTrigger value="dashboard" className="flex items-center gap-1">
            <BarChart3 className="h-4 w-4" /> Dashboard
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex items-center gap-1">
            <ClipboardCheck className="h-4 w-4" /> Tasks
          </TabsTrigger>
          <TabsTrigger value="inspections" className="flex items-center gap-1">
            <FileCheck className="h-4 w-4" /> Inspections
          </TabsTrigger>
          <TabsTrigger value="issues" className="flex items-center gap-1">
            <AlertTriangle className="h-4 w-4" /> Issues
          </TabsTrigger>
          <TabsTrigger value="pours" className="flex items-center gap-1">
            <Waves className="h-4 w-4" /> Concrete Pours
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-4">
          {dashLoading ? (
            <div className="flex items-center justify-center h-32"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <KpiCard label="Active Tasks" value={dash?.activeTasks || 0} icon={ClipboardCheck} tone="bg-primary" />
                <KpiCard label="Completed" value={dash?.completedTasks || 0} icon={CheckCircle2} tone="bg-success" />
                <KpiCard label="Overdue" value={dash?.overdueTasks || 0} icon={AlertCircle} tone="bg-destructive" />
                <KpiCard label="Open Issues" value={dash?.openIssues || 0} icon={AlertTriangle} tone="bg-warning" />
                <KpiCard label="Avg Progress" value={`${dash?.avgProgress || 0}%`} icon={BarChart3} tone="bg-info" />
                <KpiCard label="Critical Issues" value={dash?.criticalIssues || 0} icon={AlertCircle} tone="bg-destructive" />
                <KpiCard label="Pending Inspections" value={dash?.pendingInspections || 0} icon={FileCheck} tone="bg-warning" />
                <KpiCard label="Concrete (m³)" value={dash?.totalConcreteM3?.toFixed(1) || "0"} icon={Waves} tone="bg-primary" />
              </div>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Recent Tasks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Task</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Progress</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTasks.slice(0, 5).map(task => (
                          <TableRow key={task.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/construction/tasks/${task.id}`)}>
                            <TableCell>
                              <div>
                                <p className="font-medium text-sm">{task.title}</p>
                                <p className="text-xs text-muted-foreground">{task.task_code}</p>
                              </div>
                            </TableCell>
                            <TableCell><TaskStatusBadge status={task.status} /></TableCell>
                            <TableCell>{task.progress_pct}%</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Recent Issues</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Issue</TableHead>
                          <TableHead>Severity</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {issues.slice(0, 5).map(issue => (
                          <TableRow key={issue.id}>
                            <TableCell>
                              <p className="font-medium text-sm">{issue.title}</p>
                              <p className="text-xs text-muted-foreground">{issue.issue_number}</p>
                            </TableCell>
                            <TableCell>
                              <Badge className={cn(
                                issue.severity === 'critical' && "bg-destructive-soft text-destructive",
                                issue.severity === 'high' && "bg-warning-soft text-warning",
                                issue.severity === 'medium' && "bg-info-soft text-info",
                              )}>
                                {issue.severity}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{issue.status}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search tasks..." 
                value={search} 
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={taskStatusFilter} onValueChange={setTaskStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.entries(CONSTRUCTION_TASK_STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tasks Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task Code</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>WBS Path</TableHead>
                    <TableHead>Due Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasksLoading ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                  ) : filteredTasks.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No tasks found</TableCell></TableRow>
                  ) : (
                    filteredTasks.map(task => (
                      <TableRow 
                        key={task.id} 
                        className="cursor-pointer hover:bg-muted/50" 
                        onClick={() => navigate(`/construction/tasks/${task.id}`)}
                      >
                        <TableCell className="font-mono text-xs">{task.task_code}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{task.title}</p>
                            {task.description && <p className="text-xs text-muted-foreground truncate max-w-xs">{task.description}</p>}
                          </div>
                        </TableCell>
                        <TableCell><TaskStatusBadge status={task.status} /></TableCell>
                        <TableCell><PriorityBadge priority={task.priority} /></TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-primary" style={{ width: `${task.progress_pct || 0}%` }} />
                            </div>
                            <span className="text-xs">{task.progress_pct || 0}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-xs truncate">{task.wbs_path || "-"}</TableCell>
                        <TableCell>{task.planned_finish ? format(new Date(task.planned_finish), "MMM dd") : "-"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inspections Tab */}
        <TabsContent value="inspections" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Work Inspection Requests</CardTitle>
              <CardDescription>Inspection requests per Module 14.2</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Inspection #</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>WBS</TableHead>
                    <TableHead>Scheduled</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inspectionsLoading ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                  ) : inspections.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No inspections found</TableCell></TableRow>
                  ) : (
                    inspections.map(insp => (
                      <TableRow key={insp.id}>
                        <TableCell className="font-mono text-xs">{insp.inspection_number}</TableCell>
                        <TableCell>
                          <p className="font-medium text-sm">{insp.title}</p>
                          {insp.description && <p className="text-xs text-muted-foreground truncate max-w-xs">{insp.description}</p>}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{insp.wbs_node_id ? "Yes" : "-"}</TableCell>
                        <TableCell>{insp.scheduled_date ? format(new Date(insp.scheduled_date), "MMM dd") : "-"}</TableCell>
                        <TableCell>
                          {insp.result ? (
                            <Badge className={cn(
                              insp.result === 'pass' && "bg-success-soft text-success",
                              insp.result === 'fail' && "bg-destructive-soft text-destructive",
                              insp.result === 'conditional_pass' && "bg-warning-soft text-warning",
                            )}>
                              {insp.result}
                            </Badge>
                          ) : "-"}
                        </TableCell>
                        <TableCell><Badge variant="outline">{insp.status}</Badge></TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Issues Tab */}
        <TabsContent value="issues" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Site Issue Log</CardTitle>
              <CardDescription>Issues per Module 14.2</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Issue #</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reported</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {issuesLoading ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                  ) : issues.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No issues found</TableCell></TableRow>
                  ) : (
                    issues.map(issue => (
                      <TableRow key={issue.id}>
                        <TableCell className="font-mono text-xs">{issue.issue_number}</TableCell>
                        <TableCell>
                          <p className="font-medium text-sm">{issue.title}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-xs">{issue.description}</p>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn(
                            issue.severity === 'critical' && "bg-destructive-soft text-destructive",
                            issue.severity === 'high' && "bg-warning-soft text-warning",
                            issue.severity === 'medium' && "bg-info-soft text-info",
                            issue.severity === 'low' && "bg-muted text-muted-foreground",
                          )}>
                            {issue.severity}
                          </Badge>
                        </TableCell>
                        <TableCell><Badge variant="outline">{issue.status}</Badge></TableCell>
                        <TableCell>{format(new Date(issue.reported_at), "MMM dd")}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Concrete Pours Tab */}
        <TabsContent value="pours" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Concrete Pour Records</CardTitle>
              <CardDescription>Pour records per Module 14.2</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pour #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Quantity (m³)</TableHead>
                    <TableHead>Slump (mm)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {poursLoading ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                  ) : pours.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No pour records found</TableCell></TableRow>
                  ) : (
                    pours.map(pour => (
                      <TableRow key={pour.id}>
                        <TableCell className="font-mono text-xs">{pour.pour_number}</TableCell>
                        <TableCell>{format(new Date(pour.pour_date), "MMM dd, yyyy")}</TableCell>
                        <TableCell><Badge variant="outline">{pour.concrete_grade}</Badge></TableCell>
                        <TableCell>{pour.quantity_m3 || "-"}</TableCell>
                        <TableCell>{pour.slump_mm || "-"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Task Dialog */}
      <Dialog open={isCreateTaskOpen} onOpenChange={setIsCreateTaskOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Construction Task</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Task Title *</Label>
              <Input 
                id="title" 
                value={newTask.title} 
                onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                placeholder="e.g., Pour Level 5 Slab"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                value={newTask.description} 
                onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                placeholder="Task details..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Priority</Label>
                <Select value={newTask.priority} onValueChange={v => setNewTask({ ...newTask, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>WBS Node</Label>
                <WbsNodePicker 
                  value={newTask.wbs_node_id} 
                  onChange={v => setNewTask({ ...newTask, wbs_node_id: v || "" })}
                  projectId={activeProject?.id}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Planned Start</Label>
                <Input 
                  type="date" 
                  value={newTask.planned_start} 
                  onChange={e => setNewTask({ ...newTask, planned_start: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Planned Finish</Label>
                <Input 
                  type="date" 
                  value={newTask.planned_finish} 
                  onChange={e => setNewTask({ ...newTask, planned_finish: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateTaskOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateTask}>Create Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
