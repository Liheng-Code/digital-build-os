import { useState } from 'react';
import { useProjects } from '@/contexts/ProjectContext';
import { useBoqItems } from '@/hooks/useMaterials';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Loader2, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function BoqManager() {
  const { activeProject } = useProjects();
  const { data: boq, isLoading, refetch } = useBoqItems(activeProject?.id || '');
  
  const [saving, setSaving] = useState(false);
  const [newItems, setNewItems] = useState<any[]>([]);

  const addNewLine = () => {
    setNewItems([...newItems, { material_name: '', uom: '', planned_qty: 0, unit_cost: 0 }]);
  };

  const updateNewItem = (index: number, field: string, value: any) => {
    const updated = [...newItems];
    updated[index][field] = value;
    setNewItems(updated);
  };

  const handleSave = async () => {
    if (!activeProject || newItems.length === 0) return;
    setSaving(true);
    
    const itemsToInsert = newItems.map(item => ({
      project_id: activeProject.id,
      material_name: item.material_name,
      uom: item.uom,
      planned_qty: Number(item.planned_qty),
      unit_cost: Number(item.unit_cost)
    }));

    const { error } = await supabase.from('boq_items').insert(itemsToInsert);
    
    setSaving(false);
    if (error) {
      toast.error('Failed to save BOQ: ' + error.message);
      return;
    }
    
    toast.success('BOQ updated successfully');
    setNewItems([]);
    refetch();
  };

  if (isLoading) return <div>Loading BOQ...</div>;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Bill of Quantities (BOQ)</CardTitle>
            <CardDescription>Planned materials and estimated costs for this project.</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={addNewLine}>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
            {newItems.length > 0 && (
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Save Changes
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground text-left">
                <tr>
                  <th className="p-3 font-medium">Material Name</th>
                  <th className="p-3 font-medium">UOM</th>
                  <th className="p-3 font-medium text-right">Planned Qty</th>
                  <th className="p-3 font-medium text-right">Unit Cost</th>
                  <th className="p-3 font-medium text-right">Total Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {boq?.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3 font-medium">{item.material_name}</td>
                    <td className="p-3">{item.uom}</td>
                    <td className="p-3 text-right">{item.planned_qty.toLocaleString()}</td>
                    <td className="p-3 text-right">${item.unit_cost.toLocaleString()}</td>
                    <td className="p-3 text-right font-semibold">${item.total_cost.toLocaleString()}</td>
                  </tr>
                ))}
                {newItems.map((item, index) => (
                  <tr key={index} className="bg-primary/5">
                    <td className="p-2">
                      <Input 
                        className="h-8" 
                        placeholder="Material name..." 
                        value={item.material_name}
                        onChange={(e) => updateNewItem(index, 'material_name', e.target.value)}
                      />
                    </td>
                    <td className="p-2">
                      <Input 
                        className="h-8 w-20" 
                        placeholder="UOM" 
                        value={item.uom}
                        onChange={(e) => updateNewItem(index, 'uom', e.target.value)}
                      />
                    </td>
                    <td className="p-2">
                      <Input 
                        className="h-8 w-24 text-right" 
                        type="number" 
                        value={item.planned_qty}
                        onChange={(e) => updateNewItem(index, 'planned_qty', e.target.value)}
                      />
                    </td>
                    <td className="p-2">
                      <Input 
                        className="h-8 w-24 text-right" 
                        type="number" 
                        value={item.unit_cost}
                        onChange={(e) => updateNewItem(index, 'unit_cost', e.target.value)}
                      />
                    </td>
                    <td className="p-3 text-right font-semibold">
                      ${(item.planned_qty * item.unit_cost).toLocaleString()}
                    </td>
                  </tr>
                ))}
                {(!boq || boq.length === 0) && newItems.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground italic">
                      No items in BOQ. Click "Add Item" to start planning.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
