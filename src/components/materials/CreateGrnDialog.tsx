import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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
import { Truck, Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function CreateGrnDialog() {
  const { user } = useAuth();
  const { activeProject } = useProjects();
  const [open, setOpen] = useState(false);
  const [poId, setPoId] = useState<string>('');
  const [pos, setPos] = useState<any[]>([]);
  const [poItems, setPoItems] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  
  // Fetch POs
  useEffect(() => {
    if (open && activeProject) {
      supabase.from('purchase_orders')
        .select('*')
        .eq('project_id', activeProject.id)
        .neq('status', 'completed')
        .then(({ data }) => setPos(data || []));
    }
  }, [open, activeProject]);

  // Fetch Items when PO selected
  useEffect(() => {
    if (poId) {
      supabase.from('purchase_order_items')
        .select('*')
        .eq('po_id', poId)
        .then(({ data }) => setPoItems(data || []));
    } else {
      setPoItems([]);
    }
  }, [poId]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!activeProject || !user || !poId) return;
    setSaving(true);

    const fd = new FormData(e.currentTarget);
    const grn_number = fd.get('grn_number') as string;
    const delivery_note_ref = fd.get('delivery_note_ref') as string;

    // 1. Create GRN
    const { data: grn, error: grnError } = await supabase
      .from('grns')
      .insert({
        project_id: activeProject.id,
        po_id: poId,
        grn_number,
        received_by: user.id,
        delivery_date: new Date().toISOString().split('T')[0],
        delivery_note_ref
      })
      .select()
      .single();

    if (grnError) {
      toast.error('GRN Error: ' + grnError.message);
      setSaving(false);
      return;
    }

    // 2. Create GRN Items (Receiving full quantity for simplicity)
    const grnItems = poItems.map(item => ({
      grn_id: grn.id,
      po_item_id: item.id,
      material_name: item.material_name,
      uom: item.uom,
      received_qty: item.order_qty,
      accepted_qty: item.order_qty,
      rejected_qty: 0
    }));

    const { error: itemsError } = await supabase.from('grn_items').insert(grnItems);
    
    if (!itemsError) {
      // Update PO status to 'completed' (simplified)
      await supabase.from('purchase_orders').update({ status: 'completed' }).eq('id', poId);
      toast.success(`GRN ${grn_number} recorded. Stock updated.`);
      setOpen(false);
    } else {
      toast.error('GRN Items Error: ' + itemsError.message);
    }

    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Truck className="h-4 w-4 mr-2" />
          Receive Delivery
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Goods Received Note (GRN)</DialogTitle>
          <DialogDescription>
            Record arrival of materials and update warehouse stock
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Select Purchase Order *</Label>
            <Select value={poId} onValueChange={setPoId} required>
              <SelectTrigger>
                <SelectValue placeholder="Which PO are you receiving?" />
              </SelectTrigger>
              <SelectContent>
                {pos.map(po => (
                  <SelectItem key={po.id} value={po.id}>
                    {po.po_number} ({po.supplier_name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {poId && (
            <>
              <div className="space-y-2">
                <Label htmlFor="grn_number">GRN / Receipt Number *</Label>
                <Input id="grn_number" name="grn_number" placeholder="e.g. GRN-2026-101" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="delivery_note_ref">Delivery Note Reference</Label>
                <Input id="delivery_note_ref" name="delivery_note_ref" placeholder="e.g. DN-12345" />
              </div>

              <div className="p-3 border rounded-lg bg-green-50/50">
                <p className="text-xs font-medium text-green-800 uppercase mb-2">Receiving Items</p>
                <ul className="text-sm space-y-1">
                  {poItems.map((item: any) => (
                    <li key={item.id} className="flex justify-between items-center">
                      <span>{item.material_name}</span>
                      <Badge variant="secondary">{item.order_qty} {item.uom}</Badge>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={saving || !poId}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Complete Receipt
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
