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
    const { data, error } = await supabase
      .from("tasks")
      .select("id, title, code, wbs_node_id, planned_start, planned_end, actual_start, actual_end, progress_pct, estimated_hours, status")
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
    if (nodes.length === 0) return result;

    // Build child-of map
    const childrenOf = new Map<string | null, string[]>();
    for (const n of nodes) {
      const arr = childrenOf.get(n.parent_id) ?? [];
      arr.push(n.id);
      childrenOf.set(n.parent_id, arr);
    }

    // Tasks grouped by direct WBS node id
    const tasksByNode = new Map<string, TaskScheduleLite[]>();
    for (const t of tasks) {
      if (!t.wbs_node_id) continue;
      const arr = tasksByNode.get(t.wbs_node_id) ?? [];
      arr.push(t);
      tasksByNode.set(t.wbs_node_id, arr);
    }

    // Recursive: gather tasks under each node (own + descendants)
    const gather = (nodeId: string): TaskScheduleLite[] => {
      const own = tasksByNode.get(nodeId) ?? [];
      const kids = childrenOf.get(nodeId) ?? [];
      const all = [...own];
      for (const k of kids) all.push(...gather(k));
      return all;
    };

    for (const n of nodes) {
      const all = gather(n.id);
      const r = rollupTasks(all);
      if (r) result.set(n.id, r);
    }
    return result;
  }, [nodes, tasks]);

  const projectRollup = useMemo(() => rollupTasks(tasks), [tasks]);

  return { tasks, rollupByNode, projectRollup, loading, refresh };
}
