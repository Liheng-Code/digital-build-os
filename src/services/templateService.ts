import { supabase } from "@/integrations/supabase/client";
import { WbsNodeType } from "@/lib/wbsMeta";

export interface WbsTemplate {
  id: string;
  name: string;
  description: string | null;
  industry_type: string | null;
  is_public: boolean;
  created_at?: string;
}

export interface WbsTemplateNode {
  id: string;
  template_id: string;
  parent_id: string | null;
  name: string;
  node_type: WbsNodeType;
  sort_order: number;
  depth: number;
  path: string[];
}

export interface WbsTemplateTask {
  id: string;
  template_node_id: string;
  title: string;
  default_duration_days: number;
  estimated_hours: number;
  description: string | null;
  category: string | null;
}

export const templateService = {
  // Templates
  async listTemplates(): Promise<WbsTemplate[]> {
    const { data, error } = await supabase
      .from("wbs_templates")
      .select("*")
      .order("name");
    if (error) throw error;
    return data || [];
  },

  async createTemplate(template: Partial<WbsTemplate>): Promise<WbsTemplate> {
    const { data, error } = await supabase
      .from("wbs_templates")
      .insert(template)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Full Template Tree (for import)
  async getTemplateTree(templateId: string) {
    const [nodesRes, tasksRes] = await Promise.all([
      supabase
        .from("wbs_template_nodes")
        .select("*")
        .eq("template_id", templateId)
        .order("sort_order"),
      supabase
        .from("wbs_template_tasks")
        .select("*, wbs_template_nodes(template_id)")
        .filter("wbs_template_nodes.template_id", "eq", templateId)
    ]);

    if (nodesRes.error) throw nodesRes.error;
    if (tasksRes.error) throw tasksRes.error;

    return {
      nodes: nodesRes.data as WbsTemplateNode[],
      tasks: tasksRes.data as unknown as WbsTemplateTask[],
    };
  },

  /** Instantiates a template into a specific project node. */
  async instantiateTemplate(
    templateId: string, 
    projectId: string, 
    targetParentId: string | null = null,
    startDate: string = new Date().toISOString().split('T')[0]
  ): Promise<void> {
    const { nodes, tasks } = await this.getTemplateTree(templateId);
    
    // Map template node IDs to new project node IDs
    const idMap = new Map<string, string>();
    
    // Sort nodes by depth to ensure parents are created first
    const sortedNodes = [...nodes].sort((a, b) => a.depth - b.depth);

    for (const tNode of sortedNodes) {
      const parentId = tNode.parent_id ? idMap.get(tNode.parent_id) : targetParentId;
      
      const { data, error } = await supabase
        .from("wbs_nodes")
        .insert({
          project_id: projectId,
          parent_id: parentId,
          name: tNode.name,
          node_type: tNode.node_type,
          sort_order: tNode.sort_order,
        })
        .select()
        .single();
      
      if (error) throw error;
      idMap.set(tNode.id, data.id);

      // Create tasks for this node
      const nodeTasks = tasks.filter(tk => tk.template_node_id === tNode.id);
      if (nodeTasks.length > 0) {
        const { error: tError } = await supabase
          .from("tasks")
          .insert(nodeTasks.map(tk => ({
            project_id: projectId,
            wbs_node_id: data.id,
            title: tk.title,
            estimated_hours: tk.estimated_hours,
            planned_start: startDate,
            planned_end: new Date(new Date(startDate).getTime() + (tk.default_duration_days || 1) * 86400000).toISOString().split('T')[0],
            status: "not_started"
          })));
        if (tError) throw tError;
      }
    }
  }
};
