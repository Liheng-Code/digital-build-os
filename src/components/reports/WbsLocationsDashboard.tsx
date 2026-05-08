import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Loader2, ChevronRight, MapPin, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  WBS_NODE_TYPE_LABELS,
  type WbsNode,
  buildWbsTree,
  type WbsTreeNode,
} from "@/lib/wbsMeta";
import { fetchWbsNodeTypes } from "@/services/adminConfigService";

interface TaskRow {
  id: string;
  status: string;
  planned_end: string | null;
  actual_end: string | null;
  progress_pct: number | null;
  wbs_node_id: string | null;
}

type Health = "healthy" | "balanced" | "overloaded";

interface NodeStat {
  node: WbsTreeNode;
  total: number;
  open: number;
  inProgress: number;
  completed: number;
  overdue: number;
  blocked: number;
  completionPct: number;
  health: Health;
}

const CLOSED_STATES = new Set(["completed", "closed", "approved"]);

function classifyHealth(total: number, open: number, completionPct: number): Health {
  if (total === 0) return "healthy";
  // Hybrid: load + completion %
  if (open >= 10 && completionPct < 40) return "overloaded";
  if (open >= 5 && completionPct < 70) return "balanced";
  if (completionPct >= 70 || open <= 4) return "healthy";
  return "balanced";
}

const HEALTH_STYLES: Record<Health, { tile: string; tag: string; label: string }> = {
  overloaded: {
    tile: "bg-destructive/15 border-destructive/30 hover:bg-destructive/25",
    tag: "bg-destructive/20 text-destructive border-destructive/30",
    label: "Overloaded",
  },
  balanced: {
    tile: "bg-warning/15 border-warning/30 hover:bg-warning/25",
    tag: "bg-warning/20 text-warning-foreground border-warning/30",
    label: "Balanced",
  },
  healthy: {
    tile: "bg-success/15 border-success/30 hover:bg-success/25",
    tag: "bg-success/20 text-success border-success/30",
    label: "Healthy",
  },
};

export function WbsLocationsDashboard({
  projectId,
  projectLabel,
}: {
  projectId: string;
  projectLabel: string;
}) {
  const [nodes, setNodes] = useState<WbsNode[]>([]);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [nodeTypeLabels, setNodeTypeLabels] =
    useState<Record<string, string>>(WBS_NODE_TYPE_LABELS);

  useEffect(() => {
    let cancelled = false;
    fetchWbsNodeTypes()
      .then((types) => {
        if (cancelled || types.length === 0) return;
        setNodeTypeLabels({
          ...WBS_NODE_TYPE_LABELS,
          ...Object.fromEntries(types.map((type) => [type.code, type.name])),
        });
      })
      .catch(() => {
        // Keep local fallback labels if the admin config table is unavailable.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Load WBS + tasks for project
  useEffect(() => {
    if (!projectId || projectId === "all") {
      setNodes([]);
      setTasks([]);
      setSelectedNodeId(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [nRes, tRes] = await Promise.all([
        supabase
          .from("wbs_nodes")
          .select("*")
          .eq("project_id", projectId)
          .order("sort_order"),
        supabase
          .from("tasks")
          .select("id, status, planned_end, actual_end, progress_pct, wbs_node_id")
          .eq("project_id", projectId),
      ]);
      if (cancelled) return;
      setNodes((nRes.data ?? []) as WbsNode[]);
      setTasks((tRes.data ?? []) as TaskRow[]);
      setSelectedNodeId(null);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const tree = useMemo(() => buildWbsTree(nodes), [nodes]);
  const nodeMap = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  // Build a fast lookup: nodeId -> all descendant ids (incl. self)
  const descendants = useMemo(() => {
    const map = new Map<string, Set<string>>();
    const childrenOf = new Map<string, string[]>();
    nodes.forEach((n) => {
      if (n.parent_id) {
        const arr = childrenOf.get(n.parent_id) ?? [];
        arr.push(n.id);
        childrenOf.set(n.parent_id, arr);
      }
    });
    const collect = (id: string): Set<string> => {
      if (map.has(id)) return map.get(id)!;
      const out = new Set<string>([id]);
      (childrenOf.get(id) ?? []).forEach((c) => {
        collect(c).forEach((x) => out.add(x));
      });
      map.set(id, out);
      return out;
    };
    nodes.forEach((n) => collect(n.id));
    return map;
  }, [nodes]);

  // Tasks per node id (direct attachment)
  const tasksByNode = useMemo(() => {
    const m = new Map<string, TaskRow[]>();
    tasks.forEach((t) => {
      if (!t.wbs_node_id) return;
      const arr = m.get(t.wbs_node_id) ?? [];
      arr.push(t);
      m.set(t.wbs_node_id, arr);
    });
    return m;
  }, [tasks]);

  // Resolve children to display: one level below selected (or roots if none selected)
  const childrenToShow: WbsTreeNode[] = useMemo(() => {
    if (!selectedNodeId) return tree;
    const findIn = (arr: WbsTreeNode[]): WbsTreeNode | null => {
      for (const n of arr) {
        if (n.id === selectedNodeId) return n;
        const f = findIn(n.children);
        if (f) return f;
      }
      return null;
    };
    const found = findIn(tree);
    return found?.children ?? [];
  }, [tree, selectedNodeId]);

  // Compute aggregated stats for each child (rolling up all descendants)
  const today = new Date().toISOString().slice(0, 10);
  const childStats: NodeStat[] = useMemo(() => {
    return childrenToShow.map((child) => {
      const ids = descendants.get(child.id) ?? new Set([child.id]);
      let total = 0,
        open = 0,
        inProgress = 0,
        completed = 0,
        overdue = 0,
        blocked = 0,
        progressSum = 0;
      ids.forEach((id) => {
        (tasksByNode.get(id) ?? []).forEach((t) => {
          total += 1;
          progressSum += Number(t.progress_pct ?? 0);
          const isClosed = CLOSED_STATES.has(t.status);
          if (isClosed) completed += 1;
          else if (t.status === "in_progress") inProgress += 1;
          else open += 1;
          if (t.status === "rejected") blocked += 1;
          if (t.planned_end && t.planned_end < today && !isClosed) overdue += 1;
        });
      });
      const completionPct = total > 0 ? Math.round(progressSum / total) : 0;
      const health = classifyHealth(total, open + inProgress, completionPct);
      return { node: child, total, open, inProgress, completed, overdue, blocked, completionPct, health };
    });
  }, [childrenToShow, descendants, tasksByNode, today]);

  // Top KPIs (entire project, not just selected scope, to mirror reference)
  const kpi = useMemo(() => {
    let total = 0,
      completed = 0,
      blocked = 0,
      overdue = 0;
    tasks.forEach((t) => {
      total += 1;
      const isClosed = CLOSED_STATES.has(t.status);
      if (isClosed) completed += 1;
      if (t.status === "rejected") blocked += 1;
      if (t.planned_end && t.planned_end < today && !isClosed) overdue += 1;
    });
    return { total, completed, blocked, overdue };
  }, [tasks, today]);

  // Breadcrumb of current selection
  const breadcrumb = useMemo(() => {
    if (!selectedNodeId) return [] as WbsNode[];
    const trail: WbsNode[] = [];
    let cur = nodeMap.get(selectedNodeId);
    while (cur) {
      trail.unshift(cur);
      cur = cur.parent_id ? nodeMap.get(cur.parent_id) : undefined;
    }
    return trail;
  }, [selectedNodeId, nodeMap]);

  // Sidebar groupings: roots, then dynamic levels under selection (mirrors reference Building/Levels/Zones)
  const sidebarGroups = useMemo(() => {
    const groups: { title: string; items: WbsTreeNode[]; activeId: string | null }[] = [];
    if (tree.length) {
      groups.push({
        title: tree[0]?.node_type ? `${nodeTypeLabels[tree[0].node_type].toUpperCase()}S` : "ROOTS",
        items: tree,
        activeId: breadcrumb[0]?.id ?? null,
      });
    }
    // Walk down the breadcrumb adding a group per level
    breadcrumb.forEach((node, idx) => {
      const tn = (() => {
        const find = (arr: WbsTreeNode[]): WbsTreeNode | null => {
          for (const n of arr) {
            if (n.id === node.id) return n;
            const f = find(n.children);
            if (f) return f;
          }
          return null;
        };
        return find(tree);
      })();
      if (tn && tn.children.length) {
        const childType = tn.children[0].node_type;
        groups.push({
          title: `${nodeTypeLabels[childType].toUpperCase()}S`,
          items: tn.children,
          activeId: breadcrumb[idx + 1]?.id ?? null,
        });
      }
    });
    return groups;
  }, [tree, breadcrumb, nodeTypeLabels]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold">WBS Location Control</h2>
        <p className="text-sm text-muted-foreground">
          Drill into the work breakdown to spot overloaded or neglected zones.
          {projectLabel ? ` ${projectLabel}` : ""}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !projectId || projectId === "all" ? (
        <Card>
          <CardContent className="py-8 text-sm text-muted-foreground">
            Select a single project from the top project filter to view its WBS dashboard.
          </CardContent>
        </Card>
      ) : nodes.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-sm text-muted-foreground">
            This project has no WBS nodes yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4">
          {/* SIDEBAR */}
          <Card className="h-fit">
            <CardContent className="p-3 flex flex-col gap-3">
              {sidebarGroups.map((grp, gi) => (
                <div key={gi}>
                  <h3 className="text-xs font-semibold text-muted-foreground tracking-wider mb-1.5 px-1">
                    {grp.title}
                  </h3>
                  <div className="flex flex-col gap-1">
                    {grp.items.map((it) => {
                      const isActive = grp.activeId === it.id;
                      return (
                        <button
                          key={it.id}
                          onClick={() => setSelectedNodeId(it.id)}
                          className={cn(
                            "w-full text-left text-sm rounded-md px-2.5 py-1.5 transition-colors",
                            "border border-transparent",
                            isActive
                              ? "bg-primary/15 text-primary border-primary/30 font-medium"
                              : "hover:bg-muted",
                          )}
                        >
                          <span className="text-xs text-muted-foreground mr-2">
                            {it.code}
                          </span>
                          {it.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              {selectedNodeId && (
                <button
                  onClick={() => setSelectedNodeId(null)}
                  className="text-xs text-muted-foreground hover:text-foreground mt-2 px-1 text-left"
                >
                  ← Reset to root
                </button>
              )}
            </CardContent>
          </Card>

          {/* MAIN */}
          <div className="flex flex-col gap-4 min-w-0">
            {/* Breadcrumb */}
            {breadcrumb.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
                <MapPin className="h-3.5 w-3.5" />
                {breadcrumb.map((n, i) => (
                  <span key={n.id} className="flex items-center gap-1.5">
                    {i > 0 && <ChevronRight className="h-3 w-3" />}
                    <span className={cn(i === breadcrumb.length - 1 && "text-foreground font-medium")}>
                      {n.name}
                    </span>
                  </span>
                ))}
              </div>
            )}

            {/* KPI row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <KpiCard label="Total Tasks" value={kpi.total} />
              <KpiCard label="Completed" value={kpi.completed} tone="success" />
              <KpiCard label="Overdue" value={kpi.overdue} tone="warning" icon={AlertTriangle} />
              <KpiCard label="Blocked" value={kpi.blocked} tone="destructive" icon={AlertTriangle} />
            </div>

            {/* Heatmap */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  🔥 Zone Heatmap
                  <span className="text-xs font-normal text-muted-foreground">
                    {childStats.length} {childStats.length === 1 ? "node" : "nodes"} · click to drill in
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {childStats.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No child nodes at this level. Pick a parent on the left.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
                    {childStats.map((s) => {
                      const styles = HEALTH_STYLES[s.health];
                      const hasChildren = (s.node.children?.length ?? 0) > 0;
                      return (
                        <button
                          key={s.node.id}
                          onClick={() => hasChildren && setSelectedNodeId(s.node.id)}
                          disabled={!hasChildren}
                          className={cn(
                            "rounded-lg border p-3 text-left transition-colors",
                            styles.tile,
                            !hasChildren && "cursor-default opacity-90",
                          )}
                          title={hasChildren ? "Drill in" : "No child nodes"}
                        >
                          <div className="text-xs text-muted-foreground mb-0.5">
                            {nodeTypeLabels[s.node.node_type]} · {s.node.code}
                          </div>
                          <div className="text-sm font-semibold truncate">{s.node.name}</div>
                          <div className="text-2xl font-bold mt-1">{s.total}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {s.completionPct}% complete
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Distribution table */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">📍 Task Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {childStats.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No data.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Node</TableHead>
                        <TableHead className="text-right">Tasks</TableHead>
                        <TableHead className="text-right">In Prog.</TableHead>
                        <TableHead className="text-right">Done</TableHead>
                        <TableHead className="text-right">Overdue</TableHead>
                        <TableHead className="w-[180px]">Progress</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {childStats.map((s) => {
                        const styles = HEALTH_STYLES[s.health];
                        return (
                          <TableRow
                            key={s.node.id}
                            className={cn(
                              (s.node.children?.length ?? 0) > 0 && "cursor-pointer",
                            )}
                            onClick={() =>
                              (s.node.children?.length ?? 0) > 0 &&
                              setSelectedNodeId(s.node.id)
                            }
                          >
                            <TableCell>
                              <div className="font-medium">{s.node.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {nodeTypeLabels[s.node.node_type]} · {s.node.code}
                              </div>
                            </TableCell>
                            <TableCell className="text-right tabular-nums">{s.total}</TableCell>
                            <TableCell className="text-right tabular-nums">{s.inProgress}</TableCell>
                            <TableCell className="text-right tabular-nums">{s.completed}</TableCell>
                            <TableCell className="text-right tabular-nums">
                              {s.overdue > 0 ? (
                                <span className="text-destructive font-medium">{s.overdue}</span>
                              ) : (
                                s.overdue
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Progress value={s.completionPct} className="h-2" />
                                <span className="text-xs tabular-nums w-9 text-right">
                                  {s.completionPct}%
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={cn("border", styles.tag)}>
                                {styles.label}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Legend */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-success/60" /> Healthy
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-warning/60" /> Balanced
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-destructive/60" /> Overloaded
              </span>
              <span className="flex items-center gap-1.5 ml-auto">
                <CheckCircle2 className="h-3 w-3" /> Health = open task load + completion %
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({
  label,
  value,
  tone,
  icon: Icon,
}: {
  label: string;
  value: number;
  tone?: "success" | "warning" | "destructive";
  icon?: React.ComponentType<{ className?: string }>;
}) {
  const toneClass =
    tone === "success"
      ? "text-success"
      : tone === "warning"
        ? "text-warning"
        : tone === "destructive"
          ? "text-destructive"
          : "text-primary";
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{label}</span>
          {Icon && <Icon className={cn("h-3.5 w-3.5", toneClass)} />}
        </div>
        <div className={cn("text-2xl font-bold mt-1 tabular-nums", toneClass)}>{value}</div>
      </CardContent>
    </Card>
  );
}
