import { WbsNode } from "@/lib/wbsMeta";
import { TaskScheduleLite } from "@/lib/scheduleMeta";

export type GanttRow =
  | { kind: "project"; id: string; label: string; code: string; depth: number; hasChildren: boolean }
  | { kind: "node"; id: string; node: WbsNode; depth: number; hasChildren: boolean }
  | { kind: "task"; id: string; task: TaskScheduleLite & { title: string; code: string | null }; depth: number };

interface BuildRowsArgs {
  nodes: WbsNode[];
  tasks: (TaskScheduleLite & { title: string; code: string | null })[];
  collapsed: Set<string>;
  projectLabel?: string | null;
  projectCode?: string | null;
}

export function buildGanttRows({ nodes, tasks, collapsed, projectLabel, projectCode }: BuildRowsArgs): GanttRow[] {
  const childrenOf = new Map<string | null, WbsNode[]>();
  for (const n of nodes) {
    const arr = childrenOf.get(n.parent_id) ?? [];
    arr.push(n);
    childrenOf.set(n.parent_id, arr);
  }
  for (const arr of childrenOf.values()) {
    arr.sort((a, b) =>
      a.sort_order !== b.sort_order ? a.sort_order - b.sort_order : a.name.localeCompare(b.name)
    );
  }

  const tasksByNode = new Map<string, typeof tasks>();
  for (const t of tasks) {
    if (!t.wbs_node_id) continue;
    const arr = tasksByNode.get(t.wbs_node_id) ?? [];
    arr.push(t);
    tasksByNode.set(t.wbs_node_id, arr);
  }

  const rows: GanttRow[] = [];
  const safeCollapsed = collapsed ?? new Set<string>();
  if (projectLabel && (nodes.length > 0 || tasks.length > 0)) {
    const projectCollapsed = safeCollapsed.has("__project__");
    rows.push({ kind: "project", id: "__project__", label: projectLabel, code: projectCode ?? "PRJ", depth: 0, hasChildren: true });
    if (projectCollapsed) return rows;
  }
  const walk = (parentId: string | null, depth: number) => {
    const kids = childrenOf.get(parentId) ?? [];
    for (const n of kids) {
      const nodeTasks = tasksByNode.get(n.id) ?? [];
      const childNodes = childrenOf.get(n.id) ?? [];
      const hasChildren = childNodes.length > 0 || nodeTasks.length > 0;

      rows.push({ kind: "node", id: n.id, node: n, depth, hasChildren });
      if (safeCollapsed.has(n.id)) continue;

      walk(n.id, depth + 1);
      for (const t of nodeTasks) {
        rows.push({ kind: "task", id: t.id, task: t, depth: depth + 1 });
      }
    }
  };
  walk(null, projectLabel ? 1 : 0);
  return rows;
}
