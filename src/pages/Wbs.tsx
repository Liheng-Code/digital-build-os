import * as React from "react";
import { useProjects } from "@/contexts/ProjectContext";
import { useAuth } from "@/contexts/AuthContext";
import { useWbsTree } from "@/hooks/useWbsTree";
import { useWbsSchedule } from "@/hooks/useWbsSchedule";
import { useProjectHolidays } from "@/hooks/useProjectHolidays";
import {
  ResizablePanelGroup, ResizablePanel, ResizableHandle,
} from "@/components/ui/resizable";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { WbsTree } from "@/components/wbs/WbsTree";
import { WbsNodeEditor } from "@/components/wbs/WbsNodeEditor";
import { WbsAssignmentsTab } from "@/components/wbs/WbsAssignmentsTab";
import { WbsFinancialsTab } from "@/components/financials/WbsFinancialsTab";
import { WbsScheduleCard } from "@/components/wbs/WbsScheduleCard";
import { WbsGanttTree } from "@/components/wbs/WbsGanttTree";
import { WbsGantt } from "@/components/wbs/WbsGantt";
import { TaskDependencyDialog, DependencyLink } from "@/components/wbs/TaskDependencyDialog";
import { buildGanttRows, GanttRow } from "@/lib/wbsGanttRows";
import {
  Search, PanelLeftClose, PanelLeftOpen, ChevronRight, LayoutList, GanttChartSquare,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { WBS_NODE_TYPE_LABELS } from "@/lib/wbsMeta";
import { supabase } from "@/integrations/supabase/client";
import { DepRelation } from "@/lib/scheduleMeta";
import { toast } from "sonner";

type EditMode =
  | { kind: "view" }
  | { kind: "edit"; nodeId: string }
  | { kind: "create"; parentId: string | null };

type MainView = "tree" | "gantt";

const STORAGE_KEY = "buildtrack.wbs.layout";

export default function WbsPage() {
  const { activeProject } = useProjects();
  const { roles } = useAuth();
  const projectId = activeProject?.id ?? null;
  const { nodes, tree, nodeStats, loading, refresh } = useWbsTree(projectId);
  const { tasks, rollupByNode, projectRollup } = useWbsSchedule(projectId, nodes);
  const { dateSet: holidaySet } = useProjectHolidays(projectId);

  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [mainView, setMainView] = React.useState<MainView>("tree");
  const [treeOpen, setTreeOpen] = React.useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).treeOpen ?? true : true;
  });
  const [mode, setMode] = React.useState<EditMode>({ kind: "view" });
  const [predecessors, setPredecessors] = React.useState<DependencyLink[]>([]);
  const [successors, setSuccessors] = React.useState<DependencyLink[]>([]);
  const [selectedTaskId, setSelectedTaskId] = React.useState<string | null>(null);
  const [secondTaskId, setSecondTaskId] = React.useState<string | null>(null);
  const [collapsed, setCollapsed] = React.useState<Set<string>>(new Set());
  const [editLink, setEditLink] = React.useState<DependencyLink | null>(null);
  const [editRelation, setEditRelation] = React.useState<DepRelation>("FS");
  const [editLag, setEditLag] = React.useState("0");

  const leftGanttBodyRef = React.useRef<HTMLDivElement>(null);
  const rightGanttBodyRef = React.useRef<HTMLDivElement>(null);
  const syncingPaneRef = React.useRef<"left" | "right" | null>(null);

  const canEdit = roles.includes("admin") || roles.includes("project_manager");
  const canManage = canEdit;

  const selectedNode = React.useMemo(
    () => nodes.find((n) => n.id === selectedId) ?? null,
    [nodes, selectedId],
  );

  const rows: GanttRow[] = React.useMemo(
    () => buildGanttRows({ nodes, tasks, collapsed, projectLabel: activeProject?.name ?? null, projectCode: activeProject?.code ?? null }),
    [nodes, tasks, collapsed, activeProject],
  );

  React.useEffect(() => {
    if (!projectId || tasks.length === 0) {
      setPredecessors([]);
      setSuccessors([]);
      return;
    }

    const ids = tasks.map((task) => task.id);
    Promise.all([
      supabase
        .from("task_predecessors")
        .select("task_id, predecessor_id, relation_type, lag_days")
        .in("task_id", ids),
      supabase
        .from("task_predecessors")
        .select("task_id, predecessor_id, relation_type, lag_days")
        .in("predecessor_id", ids),
    ]).then(([predResult, succResult]) => {
      setPredecessors(predResult.data ?? []);
      setSuccessors(succResult.data ?? []);
    });
  }, [projectId, tasks]);

  const toggleTree = () => {
    const next = !treeOpen;
    setTreeOpen(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ treeOpen: next }));
  };

  const toggleCollapse = (id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const syncGanttScroll = (source: "left" | "right", scrollTop: number) => {
    const target = source === "left" ? rightGanttBodyRef.current : leftGanttBodyRef.current;
    if (!target || target.scrollTop === scrollTop) return;
    syncingPaneRef.current = source;
    target.scrollTop = scrollTop;
    requestAnimationFrame(() => {
      syncingPaneRef.current = null;
    });
  };

  const handleLeftGanttScroll = (event: React.UIEvent<HTMLDivElement>) => {
    if (syncingPaneRef.current === "right") return;
    syncGanttScroll("left", event.currentTarget.scrollTop);
  };

  const handleRightGanttScroll = (event: React.UIEvent<HTMLDivElement>) => {
    if (syncingPaneRef.current === "left") return;
    syncGanttScroll("right", event.currentTarget.scrollTop);
  };

  const handleTaskSelect = (taskId: string, isCtrlClick?: boolean) => {
    if (taskId === selectedTaskId) {
      // Click same task again - deselect
      setSelectedTaskId(null);
      setSecondTaskId(null);
    } else if (!selectedTaskId) {
      // First selection - set as predecessor
      setSelectedTaskId(taskId);
      setSecondTaskId(null);
    } else if (!secondTaskId) {
      // Second click - set as successsor (DON'T open dialog)
      setSecondTaskId(taskId);
    } else {
      // Clicking another task when both are selected - reset
      setSelectedTaskId(taskId);
      setSecondTaskId(null);
    }
  };

  const handleMove = async (nodeId: string, direction: "up" | "down") => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;

    const siblings = nodes
      .filter((n) => n.parent_id === node.parent_id)
      .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));

    const idx = siblings.findIndex((n) => n.id === nodeId);
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === siblings.length - 1) return;

    const swapWith = siblings[direction === "up" ? idx - 1 : idx + 1];
    const updates = [
      { id: node.id, sort_order: swapWith.sort_order },
      { id: swapWith.id, sort_order: node.sort_order === swapWith.sort_order ? (direction === "up" ? swapWith.sort_order - 1 : swapWith.sort_order + 1) : node.sort_order },
    ];

    try {
      const { error } = await (supabase.rpc as any)("reorder_wbs_nodes", { _updates: updates });
      if (error) {
        for (const up of updates) {
          await supabase.from("wbs_nodes").update({ sort_order: up.sort_order }).eq("id", up.id);
        }
      }
      refresh();
    } catch (err) {
      toast.error("Failed to move node");
    }
  };

  const handleLinkTasks = async () => {
    if (!selectedTaskId || !secondTaskId || !projectId) {
      toast.error("Select two tasks to link");
      return;
    }

    // selectedTaskId = predecessor, secondTaskId = successsor
    const { error } = await supabase.from("task_predecessors").insert({
      task_id: secondTaskId,
      predecessor_id: selectedTaskId,
      relation_type: "FS",
      lag_days: 0,
    } as any);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Tasks linked (FS)");
    // Refresh dependencies
    const ids = tasks.map((t) => t.id);
    const [predResult, succResult] = await Promise.all([
      supabase.from("task_predecessors").select("task_id, predecessor_id, relation_type, lag_days").in("task_id", ids),
      supabase.from("task_predecessors").select("task_id, predecessor_id, relation_type, lag_days").in("predecessor_id", ids),
    ]);
    setPredecessors(predResult.data ?? []);
    setSuccessors(succResult.data ?? []);
    setSecondTaskId(null);
  };

  if (!activeProject) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Work Breakdown Structure</h1>
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            Select a project from the top bar to manage its WBS.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 h-[calc(100vh-9rem)] flex flex-col -mx-4 lg:-mx-6 px-2 lg:px-3 max-w-none">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Work Breakdown Structure</h1>
          <p className="text-muted-foreground">
            {activeProject.code} · {activeProject.name}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-xl border bg-muted/40 p-1">
            <Button
              size="sm"
              variant={mainView === "tree" ? "secondary" : "ghost"}
              className="h-8 rounded-lg px-3 text-xs"
              onClick={() => setMainView("tree")}
            >
              <LayoutList className="mr-1.5 h-3.5 w-3.5" />
              Tree
            </Button>
            <Button
              size="sm"
              variant={mainView === "gantt" ? "secondary" : "ghost"}
              className="h-8 rounded-lg px-3 text-xs"
              onClick={() => setMainView("gantt")}
            >
              <GanttChartSquare className="mr-1.5 h-3.5 w-3.5" />
              Gantt
            </Button>
          </div>

          {mainView === "tree" && (
            <Button variant="outline" size="sm" onClick={toggleTree}>
              {treeOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
              {treeOpen ? "Hide tree" : "Show tree"}
            </Button>
          )}
        </div>
      </div>

        {mainView === "gantt" ? (
        <div className="flex-1 min-h-0 overflow-hidden">
          <div className="h-full rounded-2xl border bg-card shadow-sm overflow-hidden">
            {/* Link Tasks Toolbar */}
            {canEdit && (selectedTaskId || secondTaskId) && (
              <div className="border-b p-2 flex items-center gap-2 bg-muted/30">
                <span className="text-xs text-muted-foreground">
                  {selectedTaskId && <span>Predecessor: {tasks.find(t => t.id === selectedTaskId)?.code || "Selected"}</span>}
                  {selectedTaskId && secondTaskId && <span className="mx-2">→</span>}
                  {secondTaskId && <span>Successor: {tasks.find(t => t.id === secondTaskId)?.code || "Selected"}</span>}
                </span>
                <Button
                  size="sm"
                  onClick={handleLinkTasks}
                  disabled={!selectedTaskId || !secondTaskId}
                  className="ml-auto text-xs h-7"
                >
                  Link Tasks (FS)
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => { setSelectedTaskId(null); setSecondTaskId(null); }}
                  className="text-xs h-7"
                >
                  Clear
                </Button>
              </div>
            )}
            <ResizablePanelGroup direction="horizontal" className="h-full">
              <ResizablePanel defaultSize={40} minSize={20} className="min-h-0 overflow-hidden">
                <WbsGanttTree
                  rows={rows}
                  collapsed={collapsed}
                  onToggle={toggleCollapse}
                  holidaySet={holidaySet}
                  rollupByNode={rollupByNode}
                  projectRollup={projectRollup}
                  bodyScrollRef={leftGanttBodyRef}
                  onBodyScroll={handleLeftGanttScroll}
                  selectedTaskId={selectedTaskId}
                  onTaskSelect={handleTaskSelect}
                />
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={60} minSize={40} className="min-h-0 overflow-hidden">
                <WbsGantt
                  rows={rows}
                  collapsed={collapsed}
                  onToggle={toggleCollapse}
                  tasks={tasks}
                  predecessors={predecessors}
                  holidaySet={holidaySet}
                  rollupByNode={rollupByNode}
                  projectRollup={projectRollup}
                  bodyScrollRef={rightGanttBodyRef}
                  onBodyScroll={handleRightGanttScroll}
                  selectedTaskId={selectedTaskId}
                  secondTaskId={secondTaskId}
                  onTaskSelect={handleTaskSelect}
                  onEditDependency={(link) => {
                    setEditLink(link);
                    setEditRelation(link.relation_type);
                    setEditLag(String(link.lag_days ?? 0));
                  }}
                />
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
          
          {/* Dependency Dialog */}
          <TaskDependencyDialog
            editLink={editLink}
            onEditChange={(link) => setEditLink(link)}
            onSave={async () => {
              if (!editLink) return;
              const { error } = await supabase
                .from("task_predecessors")
                .update({
                  relation_type: editRelation,
                  lag_days: Number(editLag) || 0,
                } as any)
                .eq("task_id", editLink.task_id)
                .eq("predecessor_id", editLink.predecessor_id);

              if (error) {
                toast.error(error.message);
                return;
              }

              toast.success("Dependency updated");
              setEditLink(null);
              // Refresh dependencies
              if (!projectId || tasks.length === 0) return;
              const ids = tasks.map((task) => task.id);
              const [predResult, succResult] = await Promise.all([
                supabase
                  .from("task_predecessors")
                  .select("task_id, predecessor_id, relation_type, lag_days")
                  .in("task_id", ids),
                supabase
                  .from("task_predecessors")
                  .select("task_id, predecessor_id, relation_type, lag_days")
                  .in("predecessor_id", ids),
              ]);
              setPredecessors(predResult.data ?? []);
              setSuccessors(succResult.data ?? []);
            }}
            onDelete={async () => {
              if (!editLink) return;
              const { error } = await supabase
                .from("task_predecessors")
                .delete()
                .eq("task_id", editLink.task_id)
                .eq("predecessor_id", editLink.predecessor_id);

              if (error) {
                toast.error(error.message);
                return;
              }

              toast.success("Dependency deleted");
              setEditLink(null);
              // Refresh dependencies
              if (!projectId || tasks.length === 0) return;
              const ids = tasks.map((task) => task.id);
              const [predResult, succResult] = await Promise.all([
                supabase
                  .from("task_predecessors")
                  .select("task_id, predecessor_id, relation_type, lag_days")
                  .in("task_id", ids),
                supabase
                  .from("task_predecessors")
                  .select("task_id, predecessor_id, relation_type, lag_days")
                  .in("predecessor_id", ids),
              ]);
              setPredecessors(predResult.data ?? []);
              setSuccessors(succResult.data ?? []);
            }}
            selectedTaskId={selectedTaskId}
            tasks={tasks}
            predecessors={predecessors}
            successors={successors}
            projectId={projectId}
            canEdit={canEdit}
            onSelectTask={(id) => setSelectedTaskId(id)}
            onCreateLink={async (predId, succId) => {
              const { error } = await supabase.from("task_predecessors").insert({
                task_id: succId,
                predecessor_id: predId,
                relation_type: "FS",
                lag_days: 0,
              } as any);
              if (error) { toast.error(error.message); return false; }
              toast.success("Dependency created (FS)");
              const ids = tasks.map((t) => t.id);
              const [predResult, succResult] = await Promise.all([
                supabase.from("task_predecessors").select("task_id, predecessor_id, relation_type, lag_days").in("task_id", ids),
                supabase.from("task_predecessors").select("task_id, predecessor_id, relation_type, lag_days").in("predecessor_id", ids),
              ]);
              setPredecessors(predResult.data ?? []);
              setSuccessors(succResult.data ?? []);
              return true;
            }}
          />
        </div>
      ) : (
        <Card className="flex-1 min-h-0 overflow-hidden">
          <ResizablePanelGroup direction="horizontal" className="h-full">
            {treeOpen && (
              <>
                <ResizablePanel defaultSize={25} minSize={20} maxSize={55} className="flex flex-col">
                  <div className="p-2 border-b">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search nodes..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 h-9"
                      />
                    </div>
                  </div>
                  <div className="flex-1 overflow-auto p-2">
                    {loading ? (
                      <div className="space-y-2 px-2">
                        {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                      </div>
                    ) : (
                      <WbsTree
                        nodes={tree}
                        selectedId={selectedId}
                        nodeStats={nodeStats}
                        projectRoot={
                          activeProject
                            ? {
                                id: activeProject.id,
                                code: activeProject.code,
                                name: activeProject.name,
                                progress: projectRollup?.progressPct ?? 0,
                                taskCount: tasks.length,
                              }
                            : null
                        }
                        onSelect={(id) => {
                          setSelectedId(id);
                          setMode({ kind: "view" });
                        }}
                        onAddChild={(parentId) => {
                          setSelectedId(parentId);
                          setMode({ kind: "create", parentId });
                        }}
                        onMove={handleMove}
                        canEdit={canEdit}
                        search={search}
                      />
                    )}
                  </div>
                </ResizablePanel>
                <ResizableHandle withHandle />
              </>
            )}

            <ResizablePanel defaultSize={treeOpen ? 75 : 100} minSize={40}>
              <div className="h-full overflow-auto p-2">
                {mode.kind === "create" ? (
                  <WbsNodeEditor
                    projectId={projectId!}
                    node={null}
                    parentId={mode.parentId}
                    parentPath={mode.parentId ? nodes.find((n) => n.id === mode.parentId)?.path_text ?? null : null}
                    canEdit={canEdit}
                    onSaved={async () => {
                      await refresh();
                      setMode({ kind: "view" });
                    }}
                    onDeleted={() => setMode({ kind: "view" })}
                    onCancel={() => setMode({ kind: "view" })}
                  />
                ) : selectedNode ? (
                  <div className="space-y-4">
                    <div className="flex items-center flex-wrap gap-1 text-sm text-muted-foreground">
                      {selectedNode.path.map((c, i) => (
                        <span key={i} className="inline-flex items-center gap-1">
                          {i > 0 && <ChevronRight className="h-3 w-3" />}
                          <span className={i === selectedNode.path.length - 1 ? "text-foreground font-medium" : ""}>
                            {c}
                          </span>
                        </span>
                      ))}
                    </div>

                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-2xl font-semibold">{selectedNode.name}</h2>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary">{WBS_NODE_TYPE_LABELS[selectedNode.node_type]}</Badge>
                          <span className="font-mono text-xs text-muted-foreground">{selectedNode.code}</span>
                          {(nodeStats.get(selectedNode.id)?.taskCount ?? 0) > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {nodeStats.get(selectedNode.id)!.taskCount} task
                              {nodeStats.get(selectedNode.id)!.taskCount === 1 ? "" : "s"}
                            </Badge>
                          )}
                        </div>
                      </div>
                      {canEdit && mode.kind !== "edit" && (
                        <Button variant="outline" onClick={() => setMode({ kind: "edit", nodeId: selectedNode.id })}>
                          Edit details
                        </Button>
                      )}
                    </div>

                    <Tabs defaultValue={mode.kind === "edit" ? "edit" : "details"}>
                      <TabsList>
                        <TabsTrigger value="details">Details</TabsTrigger>
                        <TabsTrigger value="financials">Financials</TabsTrigger>
                        <TabsTrigger value="edit">Edit</TabsTrigger>
                        <TabsTrigger value="permissions">Permissions</TabsTrigger>
                      </TabsList>

                      <TabsContent value="details" className="mt-4 space-y-4">
                        {rollupByNode?.has(selectedNode.id) && (
                          <WbsScheduleCard rollup={rollupByNode.get(selectedNode.id)} holidaySet={holidaySet} />
                        )}
                        <Card>
                          <CardContent className="p-6 space-y-3 text-sm">
                            <Row label="Type">{WBS_NODE_TYPE_LABELS[selectedNode.node_type]}</Row>
                            <Row label="Code"><span className="font-mono">{selectedNode.code}</span></Row>
                            <Row label="Full path"><span className="font-mono">{selectedNode.path_text}</span></Row>
                            <Row label="Depth">{selectedNode.depth}</Row>
                            <Row label="Description">
                              {selectedNode.description || <span className="text-muted-foreground italic">None</span>}
                            </Row>
                            {nodeStats.get(selectedNode.id) && (() => {
                              const stat = nodeStats.get(selectedNode.id)!;
                              return (
                                <>
                                  <Row label="Tasks">{stat.taskCount}</Row>
                                  <Row label="Progress">
                                    <div className="flex items-center gap-3">
                                      <div className="flex-1 max-w-[160px] h-2 rounded-full bg-muted overflow-hidden">
                                        <div className="h-full rounded-full bg-primary" style={{ width: `${stat.avgProgress}%` }} />
                                      </div>
                                      <span className="tabular-nums font-medium">{stat.avgProgress}%</span>
                                    </div>
                                  </Row>
                                </>
                              );
                            })()}
                          </CardContent>
                        </Card>
                      </TabsContent>
                      
                      <TabsContent value="financials" className="mt-4">
                        <WbsFinancialsTab nodeId={selectedNode.id} projectId={activeProject.id} />
                      </TabsContent>

                      <TabsContent value="edit" className="mt-4">
                        <WbsNodeEditor
                          projectId={projectId!}
                          node={selectedNode}
                          parentId={selectedNode.parent_id}
                          parentPath={null}
                          canEdit={canEdit}
                          onSaved={refresh}
                          onDeleted={async () => {
                            setSelectedId(null);
                            setMode({ kind: "view" });
                            await refresh();
                          }}
                          onCancel={() => setMode({ kind: "view" })}
                        />
                      </TabsContent>

                      <TabsContent value="permissions" className="mt-4">
                        <WbsAssignmentsTab
                          nodeId={selectedNode.id}
                          nodePath={selectedNode.path_text}
                          canManage={canManage}
                        />
                      </TabsContent>
                    </Tabs>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-center text-muted-foreground p-12">
                    <div>
                      <p>Select a node from the tree to view details</p>
                      {canEdit && tree.length === 0 && (
                        <Button className="mt-4" onClick={() => setMode({ kind: "create", parentId: null })}>
                          Create first WBS node
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </Card>
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-3">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div>{children}</div>
    </div>
  );
}
