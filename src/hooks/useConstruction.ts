import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ConstructionTaskStatus, SiteIssueSeverity, InspectionResult, ConcreteGrade } from "@/lib/constructionMeta";

// Types
export interface ConstructionTask {
  id: string;
  project_id: string;
  wbs_node_id: string | null;
  task_code: string;
  title: string;
  description: string | null;
  status: ConstructionTaskStatus;
  priority: string;
  planned_start: string | null;
  planned_finish: string | null;
  actual_start: string | null;
  actual_finish: string | null;
  progress_pct: number;
  depends_on_task_id: string | null;
  assigned_to: string | null;
  assigned_by: string | null;
  assigned_at: string | null;
  submitted_at: string | null;
  submitted_by: string | null;
  approved_at: string | null;
  approved_by: string | null;
  rejection_reason: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  assigned_user_name?: string;
  wbs_path?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  assigned_user?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  wbs_node?: any;
}

export interface SiteIssue {
  id: string;
  project_id: string;
  wbs_node_id: string | null;
  issue_number: string;
  title: string;
  description: string;
  severity: SiteIssueSeverity;
  status: string;
  related_task_id: string | null;
  reported_by: string | null;
  reported_at: string;
  assigned_to: string | null;
  resolved_at: string | null;
  created_at: string;
}

export interface WorkInspectionRequest {
  id: string;
  project_id: string;
  wbs_node_id: string | null;
  inspection_number: string;
  title: string;
  description: string | null;
  construction_task_id: string | null;
  requested_by: string | null;
  requested_at: string;
  scheduled_date: string | null;
  inspector_id: string | null;
  result: InspectionResult | null;
  inspection_notes: string | null;
  status: string;
  created_at: string;
}

export interface ConcretePourRecord {
  id: string;
  project_id: string;
  wbs_node_id: string | null;
  pour_number: string;
  pour_date: string;
  concrete_grade: ConcreteGrade;
  custom_grade: string | null;
  quantity_m3: number | null;
  slump_mm: number | null;
  supervised_by: string | null;
  created_at: string;
}

// Query: List Construction Tasks
export function useConstructionTasks(projectId: string | null | undefined, filters?: {
  status?: ConstructionTaskStatus;
  wbsNodeId?: string;
  assignedTo?: string;
}) {
  return useQuery({
    queryKey: ["construction-tasks", projectId, filters],
    enabled: !!projectId,
    queryFn: async () => {
      let query = (supabase as any)
        .from("construction_tasks")
        .select(`
          *,
          assigned_user:assigned_to(full_name),
          wbs_node:wbs_node_id(full_path)
        `)
        .eq("project_id", projectId!)
        .order("task_code");

      if (filters?.status) query = query.eq("status", filters.status);
      if (filters?.wbsNodeId) query = query.eq("wbs_node_id", filters.wbsNodeId);
      if (filters?.assignedTo) query = query.eq("assigned_to", filters.assignedTo);

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).map((row: any) => ({
        ...row,
        assigned_user_name: row.assigned_user?.full_name,
        wbs_path: row.wbs_node?.full_path,
      })) as ConstructionTask[];
    },
  });
}

// Query: Single Construction Task
export function useConstructionTask(taskId: string | undefined) {
  return useQuery({
    queryKey: ["construction-task", taskId],
    enabled: !!taskId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("construction_tasks")
        .select(`*`)
        .eq("id", taskId!)
        .single();
      if (error) throw error;
      return data as ConstructionTask;
    },
  });
}

// Mutation: Update Task Status (per Module 14.3 flow)
export function useUpdateTaskStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      taskId,
      status,
      reason,
    }: {
      taskId: string;
      status: ConstructionTaskStatus;
      reason?: string;
    }) => {
      const patch: Record<string, any> = { status };
      
      // Set timestamp fields based on status transition
      if (status === 'assigned') patch.assigned_at = new Date().toISOString();
      if (status === 'in_progress') patch.actual_start = new Date().toISOString();
      if (status === 'completed') patch.actual_finish = new Date().toISOString();
      if (status === 'submitted_for_approval') patch.submitted_at = new Date().toISOString();
      if (status === 'approved') patch.approved_at = new Date().toISOString();
      if (status === 'rejected' && reason) patch.rejection_reason = reason;
      if (status === 'closed') patch.actual_finish = new Date().toISOString();

      const { error } = await (supabase as any)
        .from("construction_tasks")
        .update(patch)
        .eq("id", taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["construction-tasks"] });
      qc.invalidateQueries({ queryKey: ["construction-task"] });
    },
  });
}

// Mutation: Update Task Progress
export function useUpdateTaskProgress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, progressPct }: { taskId: string; progressPct: number }) => {
      const { error } = await (supabase as any)
        .from("construction_tasks")
        .update({ progressPct: progressPct })
        .eq("id", taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["construction-tasks"] });
      qc.invalidateQueries({ queryKey: ["construction-task"] });
    },
  });
}

// Query: Site Issues
export function useSiteIssues(projectId: string | null | undefined) {
  return useQuery({
    queryKey: ["site-issues", projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("site_issue_logs")
        .select("*")
        .eq("project_id", projectId!)
        .order("reported_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as SiteIssue[];
    },
  });
}

// Query: Inspection Requests
export function useInspectionRequests(projectId: string | null | undefined) {
  return useQuery({
    queryKey: ["inspection-requests", projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("work_inspection_requests")
        .select("*")
        .eq("project_id", projectId!)
        .order("requested_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as WorkInspectionRequest[];
    },
  });
}

// Query: Concrete Pour Records
export function useConcretePours(projectId: string | null | undefined) {
  return useQuery({
    queryKey: ["concrete-pours", projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("concrete_pour_records")
        .select("*")
        .eq("project_id", projectId!)
        .order("pour_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ConcretePourRecord[];
    },
  });
}

// Query: Construction Dashboard KPIs (per Module 14.5)
export function useConstructionDashboard(projectId: string | null | undefined) {
  return useQuery({
    queryKey: ["construction-dashboard", projectId],
    enabled: !!projectId,
    queryFn: async () => {
      if (!projectId) return null;

      const [
        tasksRes,
        issuesRes,
        inspectionsRes,
        poursRes,
      ] = await Promise.all([
        (supabase as any).from("construction_tasks").select("status, progress_pct, assigned_to").eq("project_id", projectId),
        (supabase as any).from("site_issue_logs").select("severity, status").eq("project_id", projectId),
        (supabase as any).from("work_inspection_requests").select("status, result").eq("project_id", projectId),
        (supabase as any).from("concrete_pour_records").select("quantity_m3, pour_date").eq("project_id", projectId),
      ]);

      const tasks = tasksRes.data ?? [];
      const issues = issuesRes.data ?? [];
      const inspections = inspectionsRes.data ?? [];
      const pours = poursRes.data ?? [];

      const today = new Date();
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);

      return {
        totalTasks: tasks.length,
        activeTasks: tasks.filter(t => ['assigned', 'in_progress', 'on_hold'].includes(t.status)).length,
        completedTasks: tasks.filter(t => ['completed', 'approved', 'closed'].includes(t.status)).length,
        overdueTasks: tasks.filter(t => {
          if (!t.planned_finish) return false;
          return new Date(t.planned_finish) < today && !['completed', 'approved', 'closed'].includes(t.status);
        }).length,
        avgProgress: tasks.length > 0 
          ? Math.round(tasks.reduce((sum, t) => sum + (t.progress_pct || 0), 0) / tasks.length)
          : 0,
        openIssues: issues.filter(i => i.status === 'open' || i.status === 'in_progress').length,
        criticalIssues: issues.filter(i => i.severity === 'critical' || i.severity === 'high').length,
        pendingInspections: inspections.filter(i => i.status === 'pending' || i.status === 'in_progress').length,
        passedInspections: inspections.filter(i => i.result === 'pass').length,
        totalConcreteM3: pours.reduce((sum, p) => sum + (p.quantity_m3 || 0), 0),
        recentPours: pours.filter(p => new Date(p.pour_date) >= weekAgo).length,
      };
    },
  });
}
