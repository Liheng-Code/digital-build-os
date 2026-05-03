import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProjects } from '@/contexts/ProjectContext';
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
import { useCreateIR, useChecklists } from '@/hooks/useQaQc';
import { useWbsSchedule } from '@/hooks/useWbsSchedule';
import { useWbsTree } from '@/hooks/useWbsTree';

export function RaiseIrDialog() {
  const { user } = useAuth();
  const { activeProject } = useProjects();
  const [open, setOpen] = useState(false);
  const [taskId, setTaskId] = useState<string>('');
  const [checklistId, setChecklistId] = useState<string>('');
  
  const { nodes } = useWbsTree(activeProject?.id);
  const { tasks, loading: tasksLoading } = useWbsSchedule(activeProject?.id, nodes);
  const { data: checklists, isLoading: checklistsLoading } = useChecklists(activeProject?.id || '');
  
  const createMutation = useCreateIR();

  const selectedTask = useMemo(() => tasks.find(t => t.id === taskId), [tasks, taskId]);

  const filteredChecklists = useMemo(() => {
    if (!selectedTask || !checklists) return checklists || [];
    return checklists.filter(c => c.task_type === (selectedTask as any).task_type || !c.task_type);
  }, [selectedTask, checklists]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!activeProject) return;

    const fd = new FormData(e.currentTarget);
    const location = fd.get('location') as string;
    const request_number = fd.get('request_number') as string;
    const remarks = fd.get('remarks') as string;

    await createMutation.mutateAsync({
      project_id: activeProject.id,
      task_id: taskId || null,
      request_number,
      location: location || selectedTask?.wbs_node_id || null,
      remarks,
      requested_by: user?.id,
      status: 'requested',
      checklist_id: checklistId || undefined
    });

    setOpen(false);
    setTaskId('');
    setChecklistId('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Raise IR
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Raise Inspection Request</DialogTitle>
          <DialogDescription>
            Create a new inspection request for {activeProject?.name}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="request_number">IR Number *</Label>
            <Input id="request_number" name="request_number" placeholder="e.g. IR-CIV-001" required />
          </div>

          <div className="space-y-2">
            <Label>Link to Task</Label>
            <Select value={taskId} onValueChange={setTaskId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a task (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {tasks.map(t => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.code ? `[${t.code}] ` : ''}{t.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Inspection Checklist</Label>
            <Select value={checklistId} onValueChange={setChecklistId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a checklist template" />
              </SelectTrigger>
              <SelectContent>
                {filteredChecklists.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location / Zone</Label>
            <Input id="location" name="location" placeholder="e.g. Area A, Floor 2" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks</Label>
            <Textarea id="remarks" name="remarks" placeholder="Any special instructions..." />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Submit Request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
