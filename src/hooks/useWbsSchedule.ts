import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { WbsNode } from "@/lib/wbsMeta";
import { TaskScheduleLite, NodeRollup, rollupTasks } from "@/lib/scheduleMeta";

export type ScheduleTask = TaskScheduleLite & { title: string; code: string | null };

interface UseSchedule {
  tasks: ScheduleTask[];
  rollupByNode: Map<string, NodeRollup>;
  projectRollup: NodeRollup | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

/** Fetches all tasks for a project and builds a per-WBS-node rollup
 *  (a node's rollup includes tasks attached to it AND its descendants). */
export function useWbsSchedule(projectId: string | null | undefined, nodes: WbsNode[]): UseSchedule {
  const [tasks, setTasks] = useState<ScheduleTask[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!projectId) {
      setTasks([]);
      return;
    }
    setLoading(true);
    // Fetch only necessary fields for 10,000 rows to minimize payload
    const { data, error } = await supabase
      .from("tasks")
      .select("id, title, code, wbs_node_id, planned_start, planned_end, actual_start, actual_end, progress_pct, estimated_hours, status, constraint_type, constraint_date, deadline_date, budgeted_cost, actual_cost")
      .eq("project_id", projectId);
    if (!error) {
      setTasks((data ?? []) as unknown as ScheduleTask[]);
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const rollupByNode = useMemo(() => {
    const result = new Map<string, NodeRollup>();
    if (nodes.length === 0 || tasks.length === 0) return result;

    // 1. Map tasks to their direct WBS node
    const directTasksByNode = new Map<string, TaskScheduleLite[]>();
    for (const t of tasks) {
      if (!t.wbs_node_id) continue;
      const arr = directTasksByNode.get(t.wbs_node_id) ?? [];
      arr.push(t);
      directTasksByNode.set(t.wbs_node_id, arr);
    }

    // 2. Prepare aggregated task lists for each node
    const aggregatedTasks = new Map<string, TaskScheduleLite[]>();
    
    // 3. Sort nodes by depth descending (bottom-up processing)
    const sortedNodes = [...nodes].sort((a, b) => b.depth - a.depth);
    
    // 4. Group nodes by parent for efficient access
    const childrenOf = new Map<string | null, string[]>();
    for (const n of nodes) {
      const arr = childrenOf.get(n.parent_id) ?? [];
      arr.push(n.id);
      childrenOf.set(n.parent_id, arr);
    }

    // 5. Aggregate tasks bottom-up
    for (const n of sortedNodes) {
      const own = directTasksByNode.get(n.id) ?? [];
      const childrenIds = childrenOf.get(n.id) ?? [];
      
      let all = [...own];
      for (const childId of childrenIds) {
        const childTasks = aggregatedTasks.get(childId) ?? [];
        all = all.concat(childTasks);
      }
      
      aggregatedTasks.set(n.id, all);
      
      const r = rollupTasks(all);
      if (r) result.set(n.id, r);
    }

    return result;
  }, [nodes, tasks]);

  const projectRollup = useMemo(() => rollupTasks(tasks), [tasks]);

  return { tasks, rollupByNode, projectRollup, loading, refresh };
}
