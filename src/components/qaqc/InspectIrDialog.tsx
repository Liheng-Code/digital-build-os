import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { 
  useIrResults, 
  useUpdateIrResult, 
  useUpdateIrStatus 
} from '@/hooks/useQaQc';
import { InspectionRequest, IrStatus, ChecklistResult } from '@/lib/qaqcMeta';
import { Badge } from '@/components/ui/badge';

interface InspectIrDialogProps {
  ir: InspectionRequest;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InspectIrDialog({ ir, open, onOpenChange }: InspectIrDialogProps) {
  const { user } = useAuth();
  const [remarks, setRemarks] = useState(ir.remarks || '');
  const [finalStatus, setFinalStatus] = useState<IrStatus>(ir.status);
  
  const { data: results, isLoading } = useIrResults(ir.id);
  const updateResultMutation = useUpdateIrResult();
  const updateStatusMutation = useUpdateIrStatus();

  const handleUpdateResult = async (resultId: string, status: ChecklistResult | null) => {
    await updateResultMutation.mutateAsync({ id: resultId, status });
  };

  const handleUpdateComment = async (resultId: string, comments: string) => {
    await updateResultMutation.mutateAsync({ id: resultId, status: null, comments });
  };

  const handleSubmit = async () => {
    await updateStatusMutation.mutateAsync({
      id: ir.id,
      status: finalStatus,
      remarks,
      inspected_by: user?.id
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Inspect Request: {ir.request_number}</DialogTitle>
          <DialogDescription>
            {ir.task?.title ? `Task: ${ir.task.title}` : `Location: ${ir.location}`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : results?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground italic">
              No checklist items associated with this request.
            </div>
          ) : (
            <div className="space-y-4">
              {results?.map((res) => (
                <div key={res.id} className="p-4 border rounded-lg space-y-3 bg-muted/30">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <p className="font-medium text-sm">
                        {res.checklist_item?.item_text}
                        {res.checklist_item?.is_required && <span className="text-destructive ml-1">*</span>}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        size="sm"
                        variant={res.status === 'pass' ? 'default' : 'outline'}
                        className={res.status === 'pass' ? 'bg-green-600 hover:bg-green-700' : ''}
                        onClick={() => handleUpdateResult(res.id, 'pass')}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" /> Pass
                      </Button>
                      <Button
                        size="sm"
                        variant={res.status === 'fail' ? 'destructive' : 'outline'}
                        onClick={() => handleUpdateResult(res.id, 'fail')}
                      >
                        <XCircle className="h-4 w-4 mr-1" /> Fail
                      </Button>
                      <Button
                        size="sm"
                        variant={res.status === 'n/a' ? 'secondary' : 'outline'}
                        onClick={() => handleUpdateResult(res.id, 'n/a')}
                      >
                        N/A
                      </Button>
                    </div>
                  </div>
                  <Input 
                    placeholder="Add comment..." 
                    defaultValue={res.comments || ''}
                    onBlur={(e) => handleUpdateComment(res.id, e.target.value)}
                    className="text-xs"
                  />
                </div>
              ))}
            </div>
          )}

          <div className="pt-4 border-t space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Final Inspection Result</Label>
                <Select value={finalStatus} onValueChange={(v) => setFinalStatus(v as IrStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="passed">Passed</SelectItem>
                    <SelectItem value="passed_with_remarks">Passed with Remarks</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="scheduled">Scheduled (Keep Open)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Inspector Remarks</Label>
                <Textarea 
                  value={remarks} 
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Summary of inspection..."
                  rows={2}
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button onClick={handleSubmit} disabled={updateStatusMutation.isPending}>
            {updateStatusMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Save & Complete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
