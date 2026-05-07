import * as React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useConstructionTask, useUpdateTaskStatus, useUpdateTaskProgress } from "@/hooks/useConstruction";
import { 
  CONSTRUCTION_TASK_STATUS_LABELS, 
  CONSTRUCTION_TASK_STATUS_TONE, 
  CONSTRUCTION_TASK_PRIORITY_LABELS,
  TASK_STATUS_FLOW,
  type ConstructionTaskStatus,
} from "@/lib/constructionMeta";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  CheckCircle2, 
  Play, 
  Pause, 
  XCircle, 
  Send, 
  Calendar,
  Clock,
  User,
  BarChart3,
  Camera,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

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

export default function ConstructionTaskDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  
  const { data: task, isLoading, refetch } = useConstructionTask(id);
  const updateStatus = useUpdateTaskStatus();
  const updateProgress = useUpdateTaskProgress();
  
  const [progressInput, setProgressInput] = React.useState("");
  const [showStatusActions, setShowStatusActions] = React.useState(false);

  const canEdit = hasRole("admin") || hasRole("project_manager") || hasRole("engineer") || hasRole("supervisor");
  const canApprove = hasRole("admin") || hasRole("project_manager");

  // Get available status transitions
  const availableTransitions = task ? TASK_STATUS_FLOW[task.status] || [] : [];

  const handleStatusChange = async (newStatus: ConstructionTaskStatus) => {
    if (!task) return;
    
    let reason: string | undefined;
    if (newStatus === 'rejected') {
      reason = prompt("Enter rejection reason:");
      if (!reason) return;
    }

    try {
      await updateStatus.mutateAsync({ 
        taskId: task.id, 
        status: newStatus, 
        reason 
      });
      toast.success(`Task status updated to ${CONSTRUCTION_TASK_STATUS_LABELS[newStatus]}`);
      setShowStatusActions(false);
      refetch();
    } catch (e: any) {
      toast.error(e.message || "Failed to update status");
    }
  };

  const handleProgressUpdate = async () => {
    if (!task || !progressInput) return;
    const pct = parseFloat(progressInput);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      toast.error("Please enter a valid progress percentage (0-100)");
      return;
    }
    try {
      await updateProgress.mutateAsync({ taskId: task.id, progressPct: pct });
      toast.success(`Progress updated to ${pct}%`);
      refetch();
    } catch (e: any) {
      toast.error(e.message || "Failed to update progress");
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  if (!task) {
    return <div className="p-8 text-muted-foreground">Task not found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/construction")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{task.title}</h1>
            <p className="text-sm text-muted-foreground">
              {task.task_code} • {task.wbs_path || "No WBS"} • Created {format(new Date(task.created_at), "MMM dd, yyyy")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <TaskStatusBadge status={task.status} />
          <Badge className={cn(
            task.priority === 'critical' && "bg-destructive-soft text-destructive",
            task.priority === 'high' && "bg-warning-soft text-warning",
            task.priority === 'medium' && "bg-info-soft text-info",
          )}>
            {CONSTRUCTION_TASK_PRIORITY_LABELS[task.priority]}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Task Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Description</Label>
                  <p className="text-sm mt-1">{task.description || "No description"}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Planned Start</Label>
                    <p className="text-sm flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> 
                      {task.planned_start ? format(new Date(task.planned_start), "MMM dd, yyyy") : "-"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Planned Finish</Label>
                    <p className="text-sm flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> 
                      {task.planned_finish ? format(new Date(task.planned_finish), "MMM dd, yyyy") : "-"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Actual Start</Label>
                    <p className="text-sm flex items-center gap-1">
                      <Play className="h-3 w-3" /> 
                      {task.actual_start ? format(new Date(task.actual_start), "MMM dd, yyyy") : "-"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Actual Finish</Label>
                    <p className="text-sm flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> 
                      {task.actual_finish ? format(new Date(task.actual_finish), "MMM dd, yyyy") : "-"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Assignment & Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Assigned To</Label>
                  <p className="text-sm flex items-center gap-1">
                    <User className="h-3 w-3" /> 
                    {task.assigned_user_name || "Not assigned"}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Current Status</Label>
                  <div className="mt-1">
                    <TaskStatusBadge status={task.status} />
                  </div>
                </div>
                {task.rejection_reason && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Rejection Reason</Label>
                    <p className="text-sm text-destructive mt-1">{task.rejection_reason}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Progress Tab */}
        <TabsContent value="progress" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-5 w-5" /> Progress Update
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Current Progress: {task.progress_pct}%</Label>
                  {canEdit && (
                    <div className="flex items-center gap-2">
                      <Input 
                        type="number" 
                        min="0" 
                        max="100" 
                        value={progressInput} 
                        onChange={e => setProgressInput(e.target.value)}
                        className="w-20 h-8"
                        placeholder="0-100"
                      />
                      <Button size="sm" onClick={handleProgressUpdate} disabled={!progressInput}>
                        Update
                      </Button>
                    </div>
                  )}
                </div>
                <div className="w-full h-4 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-500" 
                    style={{ width: `${task.progress_pct || 0}%` }} 
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Actions Tab */}
        <TabsContent value="actions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Status Actions</CardTitle>
              <CardDescription>
                Current status: <TaskStatusBadge status={task.status} />
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!showStatusActions ? (
                <Button onClick={() => setShowStatusActions(true)}>
                  Change Status
                </Button>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm font-medium">Select new status:</p>
                  <div className="flex flex-wrap gap-2">
                    {availableTransitions.map(status => (
                      <Button
                        key={status}
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange(status)}
                        disabled={updateStatus.isPending}
                      >
                        {status === 'in_progress' && <Play className="h-3 w-3 mr-1" />}
                        {status === 'completed' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                        {status === 'submitted_for_approval' && <Send className="h-3 w-3 mr-1" />}
                        {status === 'approved' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                        {status === 'rejected' && <XCircle className="h-3 w-3 mr-1" />}
                        {status === 'on_hold' && <Pause className="h-3 w-3 mr-1" />}
                        {CONSTRUCTION_TASK_STATUS_LABELS[status]}
                      </Button>
                    ))}
                    <Button variant="ghost" size="sm" onClick={() => setShowStatusActions(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
