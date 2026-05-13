import * as React from "react";
import { Link2, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { DepRelation, DEP_RELATION_LABELS } from "@/lib/scheduleMeta";
import { format, parseISO, isValid } from "date-fns";
import { TaskScheduleLite } from "@/lib/scheduleMeta";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DependencyGraphPanel } from "@/components/wbs/DependencyGraphPanel";

export interface DependencyLink {
  task_id: string;
  predecessor_id: string;
  relation_type: DepRelation;
  lag_days: number;
}

interface GraphTask extends TaskScheduleLite {
  title: string;
  code: string | null;
}

interface TaskDependencyDialogProps {
  editLink: DependencyLink | null;
  onEditChange: (link: DependencyLink | null) => void;
  onSave: () => Promise<void>;
  onDelete: () => Promise<void>;
  selectedTaskId: string | null;
  tasks: GraphTask[];
  predecessors: DependencyLink[];
  successors: DependencyLink[];
  projectId: string | null;
  canEdit: boolean;
  onSelectTask?: (taskId: string) => void;
  onCreateLink?: (predecessorId: string, successorId: string) => Promise<boolean> | boolean;
}

function getTaskById(tasks: GraphTask[], id: string): GraphTask | undefined {
  return tasks.find((t) => t.id === id);
}

function fmtDate(s: string | null): string {
  if (!s) return "-";
  const d = parseISO(s);
  return isValid(d) ? format(d, "dd MMM") : "-";
}

export function TaskDependencyDialog({
  editLink,
  onEditChange,
  onSave,
  onDelete,
  selectedTaskId,
  tasks,
  predecessors,
  successors,
  projectId,
  canEdit,
  onSelectTask,
  onCreateLink,
}: TaskDependencyDialogProps) {
  const [editRelation, setEditRelation] = React.useState<DepRelation>("FS");
  const [editLag, setEditLag] = React.useState("0");
  const [saving, setSaving] = React.useState(false);

  const selectedTask = React.useMemo(() => getTaskById(tasks, selectedTaskId ?? ""), [tasks, selectedTaskId]);

  const predLinks = React.useMemo(() => {
    if (!selectedTaskId) return [];
    return predecessors.filter((p) => p.task_id === selectedTaskId);
  }, [predecessors, selectedTaskId]);

  const succLinks = React.useMemo(() => {
    if (!selectedTaskId) return [];
    return successors.filter((s) => s.predecessor_id === selectedTaskId);
  }, [successors, selectedTaskId]);

  const handleSave = async () => {
    setSaving(true);
    await onSave();
    setSaving(false);
  };

  const handleDelete = async () => {
    setSaving(true);
    await onDelete();
    setSaving(false);
  };

  if (!selectedTaskId || !selectedTask) {
    return null;
  }

  return (
    <>
      {/* Edit Dialog */}
      <Dialog open={!!editLink} onOpenChange={(o) => { if (!o) onEditChange(null); }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-primary" />
              <div>
                <div className="text-base">Edit Dependency</div>
                <div className="text-xs text-muted-foreground font-normal">
                  {editLink && (
                    <>
                      {getTaskById(tasks, editLink.predecessor_id)?.code} → {getTaskById(tasks, editLink.task_id)?.code}
                    </>
                  )}
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-auto p-4 space-y-4">
            {editLink && (
              <div className="grid grid-cols-[120px_1fr] gap-3 items-center">
                <span className="text-xs text-muted-foreground">Predecessor:</span>
                <span className="text-sm">{getTaskById(tasks, editLink.predecessor_id)?.title}</span>

                <span className="text-xs text-muted-foreground">Successor:</span>
                <span className="text-sm">{getTaskById(tasks, editLink.task_id)?.title}</span>

                <span className="text-xs text-muted-foreground">Type:</span>
                <Select value={editRelation} onValueChange={(v) => { setEditRelation(v as DepRelation); onEditChange?.({ ...editLink, relation_type: v as DepRelation }); }}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(DEP_RELATION_LABELS).map((k) => (
                      <SelectItem key={k} value={k} className="text-sm">
                        <span className="font-mono">{k}</span>
                        <span className="text-xs text-muted-foreground ml-2">{DEP_RELATION_LABELS[k as DepRelation]}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <span className="text-xs text-muted-foreground">Lag (days):</span>
                <Input
                  type="number"
                  value={editLag}
                  onChange={(e) => { setEditLag(e.target.value); onEditChange?.({ ...editLink, lag_days: Number(e.target.value) || 0 }); }}
                  className="h-8 w-24 px-2 text-sm border rounded text-center"
                />
              </div>
            )}

            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} disabled={saving} className="text-sm">
                {saving ? "Saving..." : "OK"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => onEditChange(null)} className="text-sm">
                Cancel
              </Button>
              <Button size="sm" variant="destructive" onClick={handleDelete} disabled={saving} className="text-sm ml-auto">
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dependencies List View */}
      <div className="space-y-6 p-1">
        {/* Visual graph */}
        <DependencyGraphPanel
          selectedTaskId={selectedTaskId}
          tasks={tasks}
          predecessors={predecessors}
          successors={successors}
          onNodeClick={onSelectTask}
          onCreateLink={onCreateLink}
          canEdit={canEdit}
        />

        {/* Predecessors Section */}
        <div>
          <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
            Predecessors ({predLinks.length})
          </h4>

          {predLinks.length > 0 ? (
            <div className="space-y-2">
              {predLinks.map((link) => {
                const predTask = getTaskById(tasks, link.predecessor_id);
                if (!predTask) return null;
                return (
                  <div
                    key={link.predecessor_id}
                    className="flex items-start gap-3 p-3 border rounded-md bg-background hover:bg-muted/30 transition-colors cursor-pointer group"
                     onClick={() => { if (canEdit) onEditChange(link); }}
                   >
                     <div className="flex-1">
                       <div className="flex items-center gap-1.5 mb-1">
                         {predTask.code && (
                           <span className="font-mono text-xs text-muted-foreground">{predTask.code}</span>
                         )}
                         <span className="text-sm font-medium truncate">{predTask.title}</span>
                       </div>
                       <div className="flex items-center gap-2">
                         <Badge variant="outline" className="font-mono text-[10px] h-5">
                           {link.relation_type}
                         </Badge>
                         {link.lag_days !== 0 && (
                           <span className="text-xs text-muted-foreground">
                             {link.lag_days > 0 ? `+${link.lag_days}` : link.lag_days}d
                           </span>
                         )}
                         <span className="text-xs text-muted-foreground tabular-nums">
                           {fmtDate(predTask.planned_start)} → {fmtDate(predTask.planned_end)}
                         </span>
                       </div>
                     </div>
                     {canEdit && (
                       <Button
                         size="sm"
                         variant="ghost"
                         className="opacity-0 group-hover:opacity-100 transition-opacity"
                         onClick={(e) => { e.stopPropagation(); onEditChange(link); }}
                       >
                         Edit
                       </Button>
                     )}
                   </div>
                 );
               })}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">No predecessors. Use "Link Tasks" button to add.</p>
          )}
        </div>

        {/* Successors Section */}
        <div>
          <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
            Successors ({succLinks.length})
          </h4>

          {succLinks.length > 0 ? (
            <div className="space-y-2">
              {succLinks.map((link) => {
                const succTask = getTaskById(tasks, link.task_id);
                if (!succTask) return null;
                return (
                  <div
                    key={link.task_id}
                    className="flex items-start gap-3 p-3 border rounded-md bg-background hover:bg-muted/30 transition-colors cursor-pointer group"
                     onClick={() => { if (canEdit) onEditChange(link); }}
                   >
                     <div className="flex-1">
                       <div className="flex items-center gap-1.5 mb-1">
                         {succTask.code && (
                           <span className="font-mono text-xs text-muted-foreground">{succTask.code}</span>
                         )}
                         <span className="text-sm font-medium truncate">{succTask.title}</span>
                       </div>
                       <div className="flex items-center gap-2">
                         <Badge variant="outline" className="font-mono text-[10px] h-5">
                           {link.relation_type}
                         </Badge>
                         {link.lag_days !== 0 && (
                           <span className="text-xs text-muted-foreground">
                             {link.lag_days > 0 ? `+${link.lag_days}` : link.lag_days}d
                           </span>
                         )}
                         <span className="text-xs text-muted-foreground tabular-nums">
                           {fmtDate(succTask.planned_start)} → {fmtDate(succTask.planned_end)}
                         </span>
                       </div>
                     </div>
                     {canEdit && (
                       <Button
                         size="sm"
                         variant="ghost"
                         className="opacity-0 group-hover:opacity-100 transition-opacity"
                         onClick={(e) => { e.stopPropagation(); onEditChange(link); }}
                       >
                         Edit
                       </Button>
                     )}
                   </div>
                 );
               })}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">No successors. Use "Link Tasks" button to add.</p>
          )}
        </div>
      </div>
    </>
  );
}
