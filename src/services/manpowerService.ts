import { supabase } from "@/integrations/supabase/client";

export interface LaborCatalog {
  id: string;
  project_id: string;
  role_name: string;
  standard_rate: number;
  description: string | null;
  created_at?: string;
}

export interface TaskResource {
  id: string;
  task_id: string;
  labor_role_id: string;
  planned_count: number;
  planned_man_hours: number;
  actual_man_hours: number;
  notes: string | null;
  role?: LaborCatalog;
}

export const manpowerService = {
  // Labor Catalog
  async listLaborCatalog(projectId: string): Promise<LaborCatalog[]> {
    const { data, error } = await supabase
      .from("labor_catalogs")
      .select("*")
      .eq("project_id", projectId)
      .order("role_name");
    if (error) throw error;
    return data || [];
  },

  async upsertLaborRole(role: Partial<LaborCatalog> & { project_id: string }): Promise<LaborCatalog> {
    const { data, error } = await supabase
      .from("labor_catalogs")
      .upsert(role)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteLaborRole(id: string): Promise<void> {
    const { error } = await supabase
      .from("labor_catalogs")
      .delete()
      .eq("id", id);
    if (error) throw error;
  },

  // Task Resources
  async listTaskResources(taskId: string): Promise<TaskResource[]> {
    const { data, error } = await supabase
      .from("task_resources")
      .select("*, role:labor_catalogs(*)")
      .eq("task_id", taskId);
    if (error) throw error;
    return (data || []) as unknown as TaskResource[];
  },

  async upsertTaskResource(resource: Partial<TaskResource> & { task_id: string; labor_role_id: string }): Promise<TaskResource> {
    const { data, error } = await supabase
      .from("task_resources")
      .upsert(resource)
      .select("*, role:labor_catalogs(*)")
      .single();
    if (error) throw error;
    return data as unknown as TaskResource;
  },

  async deleteTaskResource(id: string): Promise<void> {
    const { error } = await supabase
      .from("task_resources")
      .delete()
      .eq("id", id);
    if (error) throw error;
  },

  // Analytics: Daily/Weekly Manpower Rollup for Histogram
  async getProjectManpowerHistogram(projectId: string): Promise<any[]> {
    // This would typically be a complex query or a RPC call.
    // For now, we'll fetch all task resources for the project and roll them up in JS.
    const { data, error } = await supabase
      .from("task_resources")
      .select(`
        planned_count,
        planned_man_hours,
        tasks (
          id,
          planned_start,
          planned_end
        )
      `)
      .filter("tasks.project_id", "eq", projectId);
    
    if (error) throw error;
    return data || [];
  }
};
