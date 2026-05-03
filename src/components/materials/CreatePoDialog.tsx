import { useState, useMemo } from 'react';
import { useProjects } from '@/contexts/ProjectContext';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2, ShoppingBag } from "lucide-react";
import { useMaterialRequests, useCreatePurchaseOrder } from '@/hooks/useMaterials';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function CreatePoDialog() {
  const { activeProject } = useProjects();
  const [open, setOpen] = useState(false);
  const [mrId, setMrId] = useState<string>('');
  const [saving, setSaving] = useState(false);
  
  const { data: mrs } = useMaterialRequests(activeProject?.id || '');
  const selectedMr = useMemo(() => mrs?.find(m => m.id === mrId), [mrs, mrId]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!activeProject || !selectedMr) return;
    setSaving(true);

    const fd = new FormData(e.currentTarget);
    const po_number = fd.get('po_number') as string;
    const supplier_name = fd.get('supplier_name') as string;

    // 1. Create PO
    const { data: po, error: poError } = await supabase
      .from('purchase_orders')
      .insert({
        project_id: activeProject.id,
        po_number,
        supplier_name,
        po_date: new Date().toISOString().split('T')[0],
        status: 'issued',
        total_amount: 0 // Will be updated by items
      })
      .select()
      .single();

    if (poError) {
      toast.error('PO Error: ' + poError.message);
      setSaving(false);
      return;
    }

    // 2. Create PO Items from MR Items
    const poItems = selectedMr.items.map((item: any) => ({
      po_id: po.id,
      mr_item_id: item.id,
      material_name: item.material_name,
      uom: item.uom,
      order_qty: item.requested_qty,
      unit_price: 0 // User would normally fill this
    }));

    const { error: itemsError } = await supabase.from('purchase_order_items').insert(poItems);
    
    if (!itemsError) {
      // Update MR status to 'ordered'
      await supabase.from('material_requests').update({ status: 'ordered' }).eq('id', mrId);
      toast.success(`PO ${po_number} created from ${selectedMr.request_number}`);
      setOpen(false);
    } else {
      toast.error('Items Error: ' + itemsError.message);
    }

    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <ShoppingBag className="h-4 w-4 mr-2" />
          Create PO
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Purchase Order</DialogTitle>
          <DialogDescription>
            Convert an approved Material Request into a Purchase Order
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Select Material Request *</Label>
            <Select value={mrId} onValueChange={setMrId} required>
              <SelectTrigger>
                <SelectValue placeholder="Pick an approved MR" />
              </SelectTrigger>
              <SelectContent>
                {mrs?.filter(m => m.status === 'draft' || m.status === 'approved').map(m => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.request_number} ({m.items?.length} items)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedMr && (
            <>
              <div className="space-y-2">
                <Label htmlFor="po_number">PO Number *</Label>
                <Input id="po_number" name="po_number" placeholder="e.g. PO-SUPP-001" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier_name">Supplier Name *</Label>
                <Input id="supplier_name" name="supplier_name" placeholder="e.g. ABC Trading Co." required />
              </div>

              <div className="p-3 border rounded-lg bg-muted/20">
                <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Items to Order</p>
                <ul className="text-sm space-y-1">
                  {selectedMr.items.map((item: any) => (
                    <li key={item.id} className="flex justify-between">
                      <span>{item.material_name}</span>
                      <span className="font-medium">{item.requested_qty} {item.uom}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving || !mrId}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Generate PO
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
