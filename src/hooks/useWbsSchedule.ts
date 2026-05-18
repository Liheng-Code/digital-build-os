import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
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

export function useWbsSchedule(projectId: string | null | undefined, nodes: WbsNode[]): UseSchedule {
  const query = useQuery<ScheduleTask[]>({
    queryKey: ["wbs", "schedule-tasks", projectId ?? null],
    enabled: !!projectId,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("id, title, code, wbs_node_id, planned_start, planned_end, actual_start, actual_end, progress_pct, estimated_hours, status, constraint_type, constraint_date, deadline_date")
        .eq("project_id", projectId!);
      if (error) throw error;
      // Default missing cost columns to null so client code that reads them stays safe.
      return ((data ?? []) as unknown as ScheduleTask[]).map((t) => ({
        ...t,
        budgeted_cost: (t as { budgeted_cost?: number | null }).budgeted_cost ?? null,
        actual_cost: (t as { actual_cost?: number | null }).actual_cost ?? null,
      }));
    },
  });

  const tasks = query.data ?? [];

  const rollupByNode = useMemo(() => {
    const result = new Map<string, NodeRollup>();
    if (nodes.length === 0 || tasks.length === 0) return result;

    const directTasksByNode = new Map<string, TaskScheduleLite[]>();
    for (const t of tasks) {
      if (!t.wbs_node_id) continue;
      const arr = directTasksByNode.get(t.wbs_node_id) ?? [];
      arr.push(t);
      directTasksByNode.set(t.wbs_node_id, arr);
    }

    const aggregatedTasks = new Map<string, TaskScheduleLite[]>();
    const sortedNodes = [...nodes].sort((a, b) => b.depth - a.depth);

    const childrenOf = new Map<string | null, string[]>();
    for (const n of nodes) {
      const arr = childrenOf.get(n.parent_id) ?? [];
      arr.push(n.id);
      childrenOf.set(n.parent_id, arr);
    }

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

  const refresh = useMemo(() => async () => { await query.refetch(); }, [query]);

  return { tasks, rollupByNode, projectRollup, loading: query.isLoading, refresh };
}
