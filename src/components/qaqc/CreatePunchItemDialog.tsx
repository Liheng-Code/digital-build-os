import { useState } from 'react';
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
import { useCreatePunchItem } from '@/hooks/useQaQc';
import { useWbsSchedule } from '@/hooks/useWbsSchedule';
import { useWbsTree } from '@/hooks/useWbsTree';

export function CreatePunchItemDialog() {
  const { user } = useAuth();
  const { activeProject } = useProjects();
  const [open, setOpen] = useState(false);
  const [taskId, setTaskId] = useState<string>('');
  
  const { nodes } = useWbsTree(activeProject?.id);
  const { tasks } = useWbsSchedule(activeProject?.id, nodes);
  
  const createMutation = useCreatePunchItem();

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!activeProject) return;

    const fd = new FormData(e.currentTarget);
    const description = fd.get('description') as string;
    const location = fd.get('location') as string;

    await createMutation.mutateAsync({
      project_id: activeProject.id,
      task_id: taskId || null,
      description,
      location,
      created_by: user?.id,
      status: 'open'
    });

    setOpen(false);
    setTaskId('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Add Punch Item
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Punch List Item</DialogTitle>
          <DialogDescription>
            Record a minor defect or incomplete work item
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea 
              id="description" 
              name="description" 
              placeholder="What needs to be fixed?" 
              required
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Related Task</Label>
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
            <Label htmlFor="location">Specific Location</Label>
            <Input id="location" name="location" placeholder="e.g. Column B3, North Side" />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Add Item
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
