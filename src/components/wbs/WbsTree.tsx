import { useState } from "react";
import { 
  ChevronRight, Folder, FolderOpen, Plus, FolderKanban,
  Building2, Layers, Box, DoorOpen, Compass, Briefcase, type LucideIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { WbsTreeNode, WBS_NODE_TYPE_LABELS } from "@/lib/wbsMeta";
import { WbsNodeStat } from "@/hooks/useWbsTree";

interface ProjectRoot {
  id: string;
  code: string;
  name: string;
  progress: number;
  taskCount: number;
}

interface Props {
  nodes: WbsTreeNode[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddChild?: (parentId: string | null) => void;
  canEdit: boolean;
  search: string;
  nodeStats: Map<string, WbsNodeStat>;
  onMove?: (id: string, direction: "up" | "down") => void;
  projectRoot?: ProjectRoot | null;
  nodeTypeLabels?: Record<string, string>;
}

export function WbsTree({
  nodes,
  selectedId,
  onSelect,
  onAddChild,
  canEdit,
  search,
  nodeStats,
  onMove,
  projectRoot,
  nodeTypeLabels = WBS_NODE_TYPE_LABELS,
}: Props) {
  const [projectOpen, setProjectOpen] = useState(true);
  return (
    <div className="text-sm">
      {canEdit && (
        <div className="px-2 py-2 border-b mb-1">
          <Button
            size="sm"
            variant="ghost"
            className="w-full justify-start gap-2"
            onClick={() => onAddChild?.(null)}
          >
            <Plus className="h-3.5 w-3.5" /> Add root node
          </Button>
        </div>
      )}

      {projectRoot ? (
        <ul className="space-y-0.5">
          <li>
            <div
              className="group flex items-start gap-1 px-1.5 py-1.5 rounded-md cursor-pointer hover:bg-primary/10 bg-primary/5 transition-colors"
              onClick={() => setProjectOpen((o) => !o)}
            >
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setProjectOpen((o) => !o); }}
                className="mt-0.5 h-4 w-4 inline-flex items-center justify-center shrink-0 text-muted-foreground hover:text-foreground"
                aria-label={projectOpen ? "Collapse" : "Expand"}
              >
                <ChevronRight className={cn("h-3.5 w-3.5 transition-transform", projectOpen && "rotate-90")} />
              </button>
              <FolderKanban className="mt-0.5 h-3.5 w-3.5 text-primary shrink-0" />
              <div className="flex-1 min-w-0 flex items-center gap-3 pr-2">
                <div className="flex items-baseline gap-1.5 min-w-0 flex-1">
                  <span className="font-mono text-[11px] text-muted-foreground shrink-0">{projectRoot.code}</span>
                  <span className="truncate text-[13px] font-semibold">{projectRoot.name}</span>
                  <span className="text-[10px] text-muted-foreground/70 hidden sm:inline shrink-0">Project</span>
                </div>
                <div className="flex items-center gap-1.5 w-24 shrink-0">
                  <div className="flex-1 h-1.5 rounded-full bg-muted/80 overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        projectRoot.progress >= 100
                          ? "bg-emerald-500"
                          : projectRoot.progress > 50
                            ? "bg-primary"
                            : projectRoot.progress > 0
                              ? "bg-primary/70"
                              : "bg-transparent",
                      )}
                      style={{ width: `${projectRoot.progress}%` }}
                    />
                  </div>
                  <span className="text-[10px] tabular-nums text-muted-foreground w-7 text-right shrink-0">
                    {projectRoot.progress}%
                  </span>
                </div>
              </div>
            </div>

            {projectOpen && (
              nodes.length === 0 ? (
                <div className="text-xs text-muted-foreground px-3 py-6 text-center">
                  No WBS nodes yet.
                  {canEdit && <div className="mt-1">Add your first building or zone.</div>}
                </div>
              ) : (
                <ul className="space-y-0.5">
                  {nodes.map((n) => (
                    <TreeRow
                      key={n.id}
                      node={n}
                      depth={1}
                      selectedId={selectedId}
                      onSelect={onSelect}
                      onAddChild={onAddChild}
                      canEdit={canEdit}
                      search={search.toLowerCase()}
                      nodeStats={nodeStats}
                      onMove={onMove}
                      nodeTypeLabels={nodeTypeLabels}
                    />
                  ))}
                </ul>
              )
            )}
          </li>
        </ul>
      ) : nodes.length === 0 ? (
        <div className="text-xs text-muted-foreground px-3 py-6 text-center">
          No WBS nodes yet.
          {canEdit && <div className="mt-1">Add your first building or zone.</div>}
        </div>
      ) : (
        <ul className="space-y-0.5">
          {nodes.map((n) => (
            <TreeRow
              key={n.id}
              node={n}
              depth={0}
              selectedId={selectedId}
              onSelect={onSelect}
              onAddChild={onAddChild}
              canEdit={canEdit}
              search={search.toLowerCase()}
              nodeStats={nodeStats}
              onMove={onMove}
              nodeTypeLabels={nodeTypeLabels}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

const NODE_ICONS: Record<string, LucideIcon> = {
  building: Building2,
  level: Layers,
  zone: Box,
  room: DoorOpen,
  element: Compass,
  package: Briefcase,
  system: Folder,
  area: Folder,
  other: Folder,
};

function TreeRow({
  node,
  depth,
  selectedId,
  onSelect,
  onAddChild,
  canEdit,
  search,
  nodeStats,
  onMove,
  nodeTypeLabels,
}: {
  node: WbsTreeNode;
  depth: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddChild?: (parentId: string | null) => void;
  canEdit: boolean;
  search: string;
  nodeStats: Map<string, WbsNodeStat>;
  onMove?: (id: string, direction: "up" | "down") => void;
  nodeTypeLabels: Record<string, string>;
}) {
  const [open, setOpen] = useState(true);
  const hasChildren = node.children.length > 0;
  const matches =
    !search ||
    node.name.toLowerCase().includes(search) ||
    node.code.toLowerCase().includes(search) ||
    node.path_text.toLowerCase().includes(search);

  const branchMatches = matches || branchHasMatch(node, search);
  if (!branchMatches) return null;

  const stat = nodeStats.get(node.id);
  const progress = stat?.avgProgress ?? 0;
  const taskCount = stat?.taskCount ?? 0;

  return (
    <li>
      <div
        role="button"
        tabIndex={0}
        onClick={() => onSelect(node.id)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSelect(node.id);
        }}
        className={cn(
          "group flex items-start gap-1 px-1.5 py-1.5 rounded-md cursor-pointer hover:bg-muted/60 transition-colors",
          selectedId === node.id &&
            "bg-accent text-accent-foreground hover:bg-accent",
        )}
        style={{ paddingLeft: `${depth * 14 + 6}px` }}
      >
        {/* Expand/collapse toggle */}
        {hasChildren ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpen((o) => !o);
            }}
            className="mt-0.5 h-4 w-4 inline-flex items-center justify-center shrink-0 text-muted-foreground hover:text-foreground"
            aria-label={open ? "Collapse" : "Expand"}
          >
            <ChevronRight
              className={cn(
                "h-3.5 w-3.5 transition-transform",
                open && "rotate-90",
              )}
            />
          </button>
        ) : (
          <span className="mt-0.5 h-4 w-4 inline-block shrink-0" />
        )}

        {/* Level-specific icon */}
        {(() => {
          const Icon = NODE_ICONS[node.node_type] || Folder;
          return <Icon className="mt-0.5 h-3.5 w-3.5 text-muted-foreground shrink-0" />;
        })()}

        {/* Content */}
        <div className="flex-1 min-w-0 flex items-center gap-3 pr-2">
          {/* Name & Code */}
          <div className="flex items-baseline gap-1.5 min-w-0 flex-1">
            <span className="font-mono text-[11px] text-muted-foreground shrink-0">
              {node.code}
            </span>
            <span className="truncate text-[13px]">{node.name}</span>
            <span className="text-[10px] text-muted-foreground/60 hidden sm:inline shrink-0">
              {nodeTypeLabels[node.node_type] ?? WBS_NODE_TYPE_LABELS[node.node_type]}
            </span>
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-1.5 w-24 shrink-0">
            <div className="flex-1 h-1.5 rounded-full bg-muted/80 overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  progress >= 100
                    ? "bg-emerald-500"
                    : progress > 50
                      ? "bg-primary"
                      : progress > 0
                        ? "bg-primary/70"
                        : "bg-transparent",
                )}
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[10px] tabular-nums text-muted-foreground w-7 text-right shrink-0">
              {progress}%
            </span>
          </div>
        </div>

        {/* Action buttons (Add child, Move Up, Move Down) */}
        {canEdit && (
          <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onMove?.(node.id, "up"); }}
              className="h-5 w-5 inline-flex items-center justify-center rounded hover:bg-background/60 text-muted-foreground"
              title="Move Up"
            >
              <ChevronRight className="h-3 w-3 -rotate-90" />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onMove?.(node.id, "down"); }}
              className="h-5 w-5 inline-flex items-center justify-center rounded hover:bg-background/60 text-muted-foreground"
              title="Move Down"
            >
              <ChevronRight className="h-3 w-3 rotate-90" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAddChild?.(node.id);
              }}
              className="h-5 w-5 inline-flex items-center justify-center rounded hover:bg-background/60 text-primary/80"
              aria-label="Add child"
              title="Add child"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {hasChildren && open && (
        <ul className="space-y-0.5">
          {node.children.map((c) => (
            <TreeRow
              key={c.id}
              node={c}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              onAddChild={onAddChild}
              canEdit={canEdit}
              search={search}
              nodeStats={nodeStats}
              onMove={onMove}
              nodeTypeLabels={nodeTypeLabels}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

function branchHasMatch(node: WbsTreeNode, search: string): boolean {
  if (!search) return true;
  if (
    node.name.toLowerCase().includes(search) ||
    node.code.toLowerCase().includes(search)
  )
    return true;
  return node.children.some((c) => branchHasMatch(c, search));
}
