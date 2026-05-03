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
import { Loader2, PackageOpen } from "lucide-react";
import { useIssueMaterial, useStockBalances } from '@/hooks/useMaterials';
import { useWbsSchedule } from '@/hooks/useWbsSchedule';
import { useWbsTree } from '@/hooks/useWbsTree';

export function IssueMaterialDialog() {
  const { user } = useAuth();
  const { activeProject } = useProjects();
  const [open, setOpen] = useState(false);
  const [taskId, setTaskId] = useState<string>('');
  const [stockId, setStockId] = useState<string>('');
  const [qty, setQty] = useState<string>('');
  
  const { nodes } = useWbsTree(activeProject?.id);
  const { tasks } = useWbsSchedule(activeProject?.id, nodes);
  const { data: stock } = useStockBalances(activeProject?.id || '');
  
  const issueMutation = useIssueMaterial();

  const selectedStock = useMemo(() => stock?.find(s => s.id === stockId), [stock, stockId]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!activeProject || !user || !selectedStock || !taskId) return;

    await issueMutation.mutateAsync({
      project_id: activeProject.id,
      task_id: taskId,
      material_name: selectedStock.material_name,
      qty_issued: Number(qty),
      issued_by: user.id,
      notes: (new FormData(e.currentTarget)).get('notes') as string || undefined
    });

    setOpen(false);
    setTaskId('');
    setStockId('');
    setQty('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <PackageOpen className="h-4 w-4 mr-2" />
          Issue to Task
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Issue Material to Task</DialogTitle>
          <DialogDescription>
            Record material consumption for a specific activity
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Select Task *</Label>
            <Select value={taskId} onValueChange={setTaskId} required>
              <SelectTrigger>
                <SelectValue placeholder="Which task is this for?" />
              </SelectTrigger>
              <SelectContent>
                {tasks.map(t => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.code ? `[${t.code}] ` : ''}{t.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Select Material from Stock *</Label>
            <Select value={stockId} onValueChange={setStockId} required>
              <SelectTrigger>
                <SelectValue placeholder="Pick material" />
              </SelectTrigger>
              <SelectContent>
                {stock?.map(s => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.material_name} ({s.qty_on_hand} {s.uom} available)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedStock && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quantity to Issue *</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    type="number" 
                    value={qty} 
                    onChange={(e) => setQty(e.target.value)} 
                    max={selectedStock.qty_on_hand}
                    min={0.01}
                    step="any"
                    required
                  />
                  <span className="text-sm text-muted-foreground">{selectedStock.uom}</span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" placeholder="Batch number, delivery ref, etc." rows={2} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={issueMutation.isPending || !taskId || !stockId || !qty}>
              {issueMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Record Issue
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
