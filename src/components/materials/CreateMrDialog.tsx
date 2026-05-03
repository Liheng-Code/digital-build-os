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
import { Plus, Trash2, Loader2 } from "lucide-react";
import { useCreateMaterialRequest, useBoqItems } from '@/hooks/useMaterials';

interface LineItem {
  id: string;
  material_name: string;
  uom: string;
  requested_qty: number;
}

export function CreateMrDialog() {
  const { user } = useAuth();
  const { activeProject } = useProjects();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<LineItem[]>([
    { id: crypto.randomUUID(), material_name: '', uom: '', requested_qty: 0 }
  ]);
  
  const createMutation = useCreateMaterialRequest();

  const addItem = () => {
    setItems([...items, { id: crypto.randomUUID(), material_name: '', uom: '', requested_qty: 0 }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof LineItem, value: any) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!activeProject || !user) return;

    const fd = new FormData(e.currentTarget);
    const request_number = fd.get('request_number') as string;
    const required_date = fd.get('required_date') as string;
    const notes = fd.get('notes') as string;

    await createMutation.mutateAsync({
      mr: {
        project_id: activeProject.id,
        request_number,
        requested_by: user.id,
        request_date: new Date().toISOString(),
        required_date,
        notes: notes || null
      },
      items: items.map(item => ({
        material_name: item.material_name,
        uom: item.uom,
        requested_qty: Number(item.requested_qty),
        boq_id: null,
        task_id: null,
        notes: null,
        approved_qty: null
      }))
    });

    setOpen(false);
    setItems([{ id: crypto.randomUUID(), material_name: '', uom: '', requested_qty: 0 }]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Request
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Raise Material Request (MR)</DialogTitle>
          <DialogDescription>
            Request materials for {activeProject?.name}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="request_number">MR Number *</Label>
              <Input id="request_number" name="request_number" placeholder="e.g. MR-2026-001" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="required_date">Required Date *</Label>
              <Input id="required_date" name="required_date" type="date" required />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Line Items</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="h-3 w-3 mr-1" /> Add Item
              </Button>
            </div>
            
            <div className="space-y-2 border rounded-lg p-4 bg-muted/20">
              {items.map((item, index) => (
                <div key={item.id} className="grid grid-cols-12 gap-2 items-end pb-2 border-b last:border-0 last:pb-0">
                  <div className="col-span-6 space-y-1">
                    {index === 0 && <Label className="text-[10px] text-muted-foreground uppercase">Material Description</Label>}
                    <Input 
                      placeholder="e.g. Cement, Grade 43" 
                      value={item.material_name}
                      onChange={(e) => updateItem(item.id, 'material_name', e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    {index === 0 && <Label className="text-[10px] text-muted-foreground uppercase">UOM</Label>}
                    <Input 
                      placeholder="Bags" 
                      value={item.uom}
                      onChange={(e) => updateItem(item.id, 'uom', e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-span-3 space-y-1">
                    {index === 0 && <Label className="text-[10px] text-muted-foreground uppercase">Quantity</Label>}
                    <Input 
                      type="number" 
                      placeholder="0" 
                      value={item.requested_qty || ''}
                      onChange={(e) => updateItem(item.id, 'requested_qty', e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-span-1 pb-1">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="text-destructive h-9 w-9" 
                      onClick={() => removeItem(item.id)}
                      disabled={items.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes / Special Instructions</Label>
            <Textarea id="notes" name="notes" placeholder="e.g. Delivery needed by 10 AM..." rows={2} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Create Request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
