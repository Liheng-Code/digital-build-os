import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProjects } from "@/contexts/ProjectContext";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import {
  TaskPriority, TaskType,
  TASK_PRIORITY_LABELS, TASK_TYPE_LABELS,
} from "@/lib/taskMeta";
import { WbsNodePicker } from "@/components/wbs/WbsNodePicker";
import { WbsTreeNode } from "@/lib/wbsMeta";
import {
  Department, DEPARTMENT_LABELS, DEPT_INITIAL_STAGE,
} from "@/lib/departmentMeta";
import { DisciplineMetaFields } from "@/components/tasks/DisciplineMetaFields";
import {
  TaskWorkflowType, TaskCategory,
  TASK_WORKFLOW_LABELS, TASK_CATEGORY_LABELS, CATEGORIES_BY_WORKFLOW,
} from "@/lib/taskCategoryMeta";
import { recordAuditEventSafe } from "@/services/auditService";
import { ConstraintType, CONSTRAINT_TYPE_LABELS } from "@/lib/scheduleMeta";

const taskSchema = z.object({
  title: z.string().trim().min(2).max(200),
  description: z.string().trim().max(4000).optional().or(z.literal("")),
  task_type: z.enum(["concrete","steel","mep","finishing","excavation","inspection","other"]),
  priority: z.enum(["low","medium","high","critical"]),
  planned_start: z.string().optional().or(z.literal("")),
  planned_end: z.string().optional().or(z.literal("")),
  estimated_hours: z.string().optional().or(z.literal("")),
});

export function CreateTaskDialog({ onCreated }: { onCreated?: () => void }) {
  const { user } = useAuth();
  const { activeProject } = useProjects();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [plannedStart, setPlannedStart] = useState("");
  const [plannedEnd, setPlannedEnd] = useState("");
  const [estimatedHours, setEstimatedHours] = useState("");
  const [wbsNodeId, setWbsNodeId] = useState<string | null>(null);
  const [wbsNode, setWbsNode] = useState<WbsTreeNode | null>(null);
  const [department, setDepartment] = useState<Department | "">("");
  const [meta, setMeta] = useState<Record<string, string>>({});
  const [workflowType, setWorkflowType] = useState<TaskWorkflowType | "">("");
  const [category, setCategory] = useState<TaskCategory | "">("");
  const [constraintType, setConstraintType] = useState<ConstraintType | "">("");
  const [constraintDate, setConstraintDate] = useState("");

  const updatePlannedHours = (start: string, end: string) => {
    setPlannedStart(start);
    setPlannedEnd(end);

    if (!start || !end) {
      setEstimatedHours("");
      return;
    }

    const startDate = new Date(`${start}T00:00:00Z`);
    const endDate = new Date(`${end}T00:00:00Z`);
    const diffDays = Math.floor((endDate.getTime() - startDate.getTime()) / 86_400_000) + 1;

    setEstimatedHours(diffDays > 0 ? String(diffDays * 8) : "");
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!activeProject) {
      toast.error("Select a project first");
      return;
    }
    if (!wbsNodeId || !wbsNode) {
      toast.error("Pick a WBS location for this task");
      return;
    }
    if (!department) {
      toast.error("Pick a department for this task");
      return;
    }
    if (!workflowType) {
      toast.error("Pick a Task Type (workflow)");
      return;
    }
    if (!category) {
      toast.error("Pick a Task Category");
      return;
    }
    const fd = new FormData(e.currentTarget);
    const parsed = taskSchema.safeParse({
      title: fd.get("title"),
      description: fd.get("description") || "",
      task_type: fd.get("task_type"),
      priority: fd.get("priority"),
      planned_start: fd.get("planned_start") || "",
      planned_end: fd.get("planned_end") || "",
      estimated_hours: fd.get("estimated_hours") || "",
    });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setSaving(true);
    const taskPayload = {
      project_id: activeProject.id,
      title: parsed.data.title,
      description: parsed.data.description || null,
      task_type: parsed.data.task_type as TaskType,
      priority: parsed.data.priority as TaskPriority,
      wbs_node_id: wbsNodeId,
      // Mirror WBS path into legacy location_zone so older list views still display nicely
      location_zone: wbsNode.path_text,
      department: department as Department,
      dept_status: DEPT_INITIAL_STAGE[department as Department],
      discipline_meta: meta,
      workflow_type: workflowType as TaskWorkflowType,
      category: category as TaskCategory,
      planned_start: parsed.data.planned_start || null,
      planned_end: parsed.data.planned_end || null,
      estimated_hours: parsed.data.estimated_hours ? Number(parsed.data.estimated_hours) : 0,
      constraint_type: constraintType || null,
      constraint_date: constraintDate || null,
      created_by: user?.id,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: createdTask, error } = await supabase.from("tasks").insert(taskPayload as any).select("id").single();
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Task created");
    await recordAuditEventSafe({
      moduleCode: "TASK",
      entityType: "task",
      entityId: createdTask?.id ?? parsed.data.title,
      actionType: "CREATE",
      actionLabel: "Task Created",
      projectId: activeProject.id,
      wbsNodeId,
      newValues: taskPayload,
      severity: "medium"
    });
    setOpen(false);
    setWbsNodeId(null);
    setWbsNode(null);
    setDepartment("");
    setMeta({});
    setWorkflowType("");
    setCategory("");
    setPlannedStart("");
    setPlannedEnd("");
    setEstimatedHours("");
    setConstraintType("");
    setConstraintDate("");
    onCreated?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={!activeProject}>
          <Plus className="h-4 w-4" /> New Task
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create task</DialogTitle>
          <DialogDescription>
            Add a new task to {activeProject?.code} · {activeProject?.name}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input id="title" name="title" required maxLength={200} />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" rows={3} maxLength={4000} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="task_type">Discipline Type *</Label>
              <Select name="task_type" defaultValue="other">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(TASK_TYPE_LABELS) as TaskType[]).map((t) => (
                    <SelectItem key={t} value={t}>{TASK_TYPE_LABELS[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="priority">Priority *</Label>
              <Select name="priority" defaultValue="medium">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(TASK_PRIORITY_LABELS) as TaskPriority[]).map((p) => (
                    <SelectItem key={p} value={p}>{TASK_PRIORITY_LABELS[p]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="department">Department *</Label>
            <Select value={department} onValueChange={(v) => { setDepartment(v as Department); setMeta({}); }}>
              <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
              <SelectContent>
                {(Object.keys(DEPARTMENT_LABELS) as Department[]).map((d) => (
                  <SelectItem key={d} value={d}>{DEPARTMENT_LABELS[d]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Task Type *</Label>
              <Select
                value={workflowType}
                onValueChange={(v) => {
                  setWorkflowType(v as TaskWorkflowType);
                  setCategory(""); // reset category when workflow changes
                }}
              >
                <SelectTrigger><SelectValue placeholder="Select task type" /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(TASK_WORKFLOW_LABELS) as TaskWorkflowType[]).map((w) => (
                    <SelectItem key={w} value={w}>{TASK_WORKFLOW_LABELS[w]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Task Category *</Label>
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as TaskCategory)}
                disabled={!workflowType}
              >
                <SelectTrigger>
                  <SelectValue placeholder={workflowType ? "Select category" : "Pick task type first"} />
                </SelectTrigger>
                <SelectContent>
                  {workflowType &&
                    CATEGORIES_BY_WORKFLOW[workflowType as TaskWorkflowType].map((c) => (
                      <SelectItem key={c} value={c}>{TASK_CATEGORY_LABELS[c]}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {department && (
            <DisciplineMetaFields
              department={department as Department}
              value={meta}
              onChange={setMeta}
            />
          )}
          <div>
            <Label>WBS location *</Label>
            {activeProject && (
              <WbsNodePicker
                projectId={activeProject.id}
                value={wbsNodeId}
                onChange={(id, n) => { setWbsNodeId(id); setWbsNode(n); }}
                required
              />
            )}
            {wbsNode && (
              <p className="text-[11px] text-muted-foreground mt-1 font-mono">{wbsNode.path_text}</p>
            )}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="planned_start">Planned start</Label>
              <Input
                id="planned_start"
                name="planned_start"
                type="date"
                value={plannedStart}
                onChange={(e) => updatePlannedHours(e.target.value, plannedEnd)}
              />
            </div>
            <div>
              <Label htmlFor="planned_end">Planned end</Label>
              <Input
                id="planned_end"
                name="planned_end"
                type="date"
                value={plannedEnd}
                onChange={(e) => updatePlannedHours(plannedStart, e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="estimated_hours">Est. hours</Label>
              <Input
                id="estimated_hours"
                name="estimated_hours"
                type="number"
                step="0.5"
                min="0"
                value={estimatedHours}
                readOnly
                className="bg-muted/60"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Scheduling constraint</Label>
              <Select value={constraintType} onValueChange={(v) => setConstraintType(v as ConstraintType)}>
                <SelectTrigger><SelectValue placeholder="None (ASAP)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None (ASAP)</SelectItem>
                  {(Object.keys(CONSTRAINT_TYPE_LABELS) as ConstraintType[]).map((ct) => (
                    <SelectItem key={ct} value={ct}>{CONSTRAINT_TYPE_LABELS[ct]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {constraintType && constraintType !== "ASAP" && constraintType !== "ALAP" && (
              <div>
                <Label>Constraint date</Label>
                <Input
                  type="date"
                  value={constraintDate}
                  onChange={(e) => setConstraintDate(e.target.value)}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
