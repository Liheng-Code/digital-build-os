import { useState, useMemo } from 'react';
import { useProjects } from '@/contexts/ProjectContext';
import { useWbsTree } from '@/hooks/useWbsTree';
import { useWbsSchedule } from '@/hooks/useWbsSchedule';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Loader2, Calculator } from "lucide-react";
import { useCreateClaim } from '@/hooks/useFinancials';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function CreateClaimDialog() {
  const { activeProject } = useProjects();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const { nodes } = useWbsTree(activeProject?.id);
  const { tasks } = useWbsSchedule(activeProject?.id, nodes);
  
  const createClaimMutation = useCreateClaim();

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!activeProject) return;
    setSaving(true);

    const fd = new FormData(e.currentTarget);
    const claim_number = fd.get('claim_number') as string;
    const period_start = fd.get('period_start') as string;
    const period_end = fd.get('period_end') as string;

    // 1. Create Claim Header
    const claim = await createClaimMutation.mutateAsync({
      project_id: activeProject.id,
      claim_number,
      period_start,
      period_end,
      status: 'draft',
      total_amount_claimed: 0
    });

    if (claim) {
      // 2. Generate Items (Simplified: one item per task with >0 progress)
      const claimItems = tasks
        .filter(t => t.progress_pct > 0)
        .map(t => ({
          claim_id: claim.id,
          wbs_node_id: t.wbs_node_id,
          description: t.title,
          uom: 'Item',
          curr_qty: t.progress_pct / 100,
          unit_rate: 0 // In real app, pull from contract BOQ
        }));

      if (claimItems.length > 0) {
        const { error } = await supabase.from('claim_items').insert(claimItems);
        if (error) toast.error('Failed to create items: ' + error.message);
      }
      
      setOpen(false);
    }
    
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Claim
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Generate Progress Claim</DialogTitle>
          <DialogDescription>
            Create a new valuation based on current site progress.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="claim_number">Claim Number *</Label>
            <Input id="claim_number" name="claim_number" placeholder="e.g. CLAIM-2026-001" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="period_start">Start Date *</Label>
              <Input id="period_start" name="period_start" type="date" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="period_end">End Date *</Label>
              <Input id="period_end" name="period_end" type="date" required />
            </div>
          </div>

          <div className="p-4 border rounded-lg bg-blue-50/50 flex gap-3 items-start">
            <Calculator className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900">Auto-Generate Items</p>
              <p className="text-xs text-blue-700">
                This will automatically pull all tasks with active progress into the claim for your certification.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Generate Draft
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
