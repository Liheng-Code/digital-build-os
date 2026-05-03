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
import { useCreateNCR } from '@/hooks/useQaQc';
import { useWbsSchedule } from '@/hooks/useWbsSchedule';
import { useWbsTree } from '@/hooks/useWbsTree';

export function CreateNcrDialog() {
  const { user } = useAuth();
  const { activeProject } = useProjects();
  const [open, setOpen] = useState(false);
  const [taskId, setTaskId] = useState<string>('');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  
  const { nodes } = useWbsTree(activeProject?.id);
  const { tasks } = useWbsSchedule(activeProject?.id, nodes);
  
  const createMutation = useCreateNCR();

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!activeProject) return;

    const fd = new FormData(e.currentTarget);
    const ncr_number = fd.get('ncr_number') as string;
    const issue_description = fd.get('issue_description') as string;

    await createMutation.mutateAsync({
      project_id: activeProject.id,
      task_id: taskId || null,
      ncr_number,
      issue_description,
      severity,
      reported_by: user?.id,
      status: 'open'
    });

    setOpen(false);
    setTaskId('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="border-amber-500 text-amber-600 hover:bg-amber-50">
          <Plus className="h-4 w-4 mr-2" />
          New NCR
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Non-Conformance Report (NCR)</DialogTitle>
          <DialogDescription>
            Report a critical quality deviation for {activeProject?.name}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ncr_number">NCR Number *</Label>
            <Input id="ncr_number" name="ncr_number" placeholder="e.g. NCR-STR-001" required />
          </div>

          <div className="space-y-2">
            <Label>Link to Task</Label>
            <Select value={taskId} onValueChange={setTaskId}>
              <SelectTrigger>
                <SelectValue placeholder="Select the affected task" />
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
            <Label>Severity</Label>
            <Select value={severity} onValueChange={(v: any) => setSeverity(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="issue_description">Issue Description *</Label>
            <Textarea 
              id="issue_description" 
              name="issue_description" 
              placeholder="Describe the non-conformance in detail..." 
              required
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" className="bg-amber-600 hover:bg-amber-700" disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Create NCR
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
