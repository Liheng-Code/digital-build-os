import { useState } from 'react';
import { useProjects } from '@/contexts/ProjectContext';
import { useChecklists, useCreateChecklist, useCreateChecklistItem } from '@/hooks/useQaQc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TASK_TYPE_LABELS, TaskType } from '@/lib/taskMeta';
import { Plus, Trash2, ListChecks, Loader2 } from 'lucide-react';

export function ChecklistSetup() {
  const { activeProject } = useProjects();
  const { data: checklists, isLoading } = useChecklists(activeProject?.id || '');
  const createChecklist = useCreateChecklist();
  const createItem = useCreateChecklistItem();
  
  const [newChecklistName, setNewChecklistName] = useState('');
  const [newChecklistType, setNewChecklistType] = useState<TaskType>('other');
  const [selectedChecklistId, setSelectedChecklistId] = useState<string | null>(null);
  const [newItemText, setNewItemText] = useState('');

  const handleCreateChecklist = async () => {
    if (!activeProject || !newChecklistName) return;
    await createChecklist.mutateAsync({
      project_id: activeProject.id,
      name: newChecklistName,
      task_type: newChecklistType
    });
    setNewChecklistName('');
  };

  const handleAddItem = async () => {
    if (!selectedChecklistId || !newItemText) return;
    await createItem.mutateAsync({
      checklist_id: selectedChecklistId,
      item_text: newItemText,
      order_index: 0 // Simplification
    });
    setNewItemText('');
  };

  if (isLoading) return <div>Loading templates...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Create Template</CardTitle>
            <CardDescription>Add a new checklist template</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Template Name</Label>
              <Input 
                value={newChecklistName} 
                onChange={(e) => setNewChecklistName(e.target.value)}
                placeholder="e.g. Concrete Pour"
              />
            </div>
            <div className="space-y-2">
              <Label>Task Type</Label>
              <Select value={newChecklistType} onValueChange={(v) => setNewChecklistType(v as TaskType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(TASK_TYPE_LABELS) as TaskType[]).map(t => (
                    <SelectItem key={t} value={t}>{TASK_TYPE_LABELS[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={handleCreateChecklist} disabled={createChecklist.isPending}>
              {createChecklist.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Create Template
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Templates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {checklists?.map(c => (
              <Button 
                key={c.id} 
                variant={selectedChecklistId === c.id ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setSelectedChecklistId(c.id)}
              >
                <ListChecks className="h-4 w-4 mr-2" />
                {c.name}
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="md:col-span-2">
        {selectedChecklistId ? (
          <Card>
            <CardHeader>
              <CardTitle>Checklist Items</CardTitle>
              <CardDescription>Define the steps for this inspection</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input 
                  value={newItemText} 
                  onChange={(e) => setNewItemText(e.target.value)}
                  placeholder="Add inspection item..."
                />
                <Button onClick={handleAddItem} disabled={createItem.isPending}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-2">
                {/* Note: We should fetch items here, but useChecklists fetch is flat. 
                    In a real app, we'd have useChecklistItems(id). 
                    For this demo, we'll assume the items are populated via invalidation. */}
                <p className="text-sm text-muted-foreground italic">
                  Note: In this prototype, items are added to the template and will appear in future IRs using this template.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="h-full flex items-center justify-center border rounded-lg border-dashed text-muted-foreground p-12">
            Select a template to manage items
          </div>
        )}
      </div>
    </div>
  );
}
