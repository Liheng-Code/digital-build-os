import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { WbsNode, buildWbsTree, WbsTreeNode } from "@/lib/wbsMeta";

export interface WbsNodeStat {
  avgProgress: number;
  taskCount: number;
  minStart: string | null;
  maxEnd: string | null;
}

export function useWbsTree(projectId: string | null | undefined) {
  const [nodes, setNodes] = useState<WbsNode[]>([]);
  const [tree, setTree] = useState<WbsTreeNode[]>([]);
  const [nodeStats, setNodeStats] = useState<Map<string, WbsNodeStat>>(new Map());
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!projectId) {
      setNodes([]);
      setTree([]);
      setNodeStats(new Map());
      return;
    }
    setLoading(true);

    const [nodesRes, tasksRes] = await Promise.all([
      supabase
        .from("wbs_nodes")
        .select("*")
        .eq("project_id", projectId)
        .order("sort_order", { ascending: true }),
      supabase
        .from("tasks")
        .select("wbs_node_id, progress_pct, planned_start, planned_end, estimated_hours")
        .eq("project_id", projectId)
        .not("wbs_node_id", "is", null),
    ]);

    if (!nodesRes.error) {
      const rows = (nodesRes.data ?? []) as WbsNode[];
      setNodes(rows);
      setTree(buildWbsTree(rows));
    }

    if (!tasksRes.error && !nodesRes.error) {
      const statsMap = new Map<string, WbsNodeStat>();
      const taskData = tasksRes.data ?? [];
      const nodeRows = (nodesRes.data ?? []) as WbsNode[];

      // 1. Group direct tasks by WBS node id
      const directTasksByNode = new Map<string, typeof taskData>();
      taskData.forEach((t) => {
        if (!t.wbs_node_id) return;
        const arr = directTasksByNode.get(t.wbs_node_id) ?? [];
        arr.push(t);
        directTasksByNode.set(t.wbs_node_id, arr);
      });

      // 2. Children map for bottom-up traversal
      const childrenOf = new Map<string | null, string[]>();
      for (const n of nodeRows) {
        const arr = childrenOf.get(n.parent_id) ?? [];
        arr.push(n.id);
        childrenOf.set(n.parent_id, arr);
      }

      // 3. Aggregate task lists bottom-up
      const aggregatedTasks = new Map<string, typeof taskData>();
      const sortedNodes = [...nodeRows].sort((a, b) => b.depth - a.depth);

      for (const n of sortedNodes) {
        const own = directTasksByNode.get(n.id) ?? [];
        const kids = childrenOf.get(n.id) ?? [];
        let all = [...own];
        for (const k of kids) {
          const childTasks = aggregatedTasks.get(k) ?? [];
          all = all.concat(childTasks);
        }
        aggregatedTasks.set(n.id, all);

        if (all.length > 0) {
          let weighted = 0;
          let totalW = 0;
          for (const t of all) {
            const w = Math.max(0.0001, Number(t.estimated_hours ?? 0)) || 1;
            weighted += (Number(t.progress_pct) || 0) * w;
            totalW += w;
          }
          const avgProgress = totalW > 0 ? Math.round(weighted / totalW) : 0;
          const starts = all.map((t) => t.planned_start).filter(Boolean) as string[];
          const ends = all.map((t) => t.planned_end).filter(Boolean) as string[];
          statsMap.set(n.id, {
            avgProgress,
            taskCount: all.length,
            minStart: starts.length ? [...starts].sort()[0] : null,
            maxEnd: ends.length ? [...ends].sort().at(-1)! : null,
          });
        }
      }

      setNodeStats(statsMap);
    }

    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  return { nodes, tree, nodeStats, loading, refresh: load };
}
