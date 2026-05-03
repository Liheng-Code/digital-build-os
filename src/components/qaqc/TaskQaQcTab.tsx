import { useState } from 'react';
import { useTaskQaQc } from '@/hooks/useQaQc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatIrStatus, formatNcrStatus, formatPunchListStatus, InspectionRequest } from '@/lib/qaqcMeta';
import { format } from 'date-fns';
import { RaiseIrDialog } from './RaiseIrDialog';
import { InspectIrDialog } from './InspectIrDialog';
import { AlertTriangle, ClipboardCheck, CheckSquare, Plus } from 'lucide-react';

export function TaskQaQcTab({ taskId }: { taskId: string }) {
  const { data, isLoading } = useTaskQaQc(taskId);
  const [selectedIr, setSelectedIr] = useState<InspectionRequest | null>(null);

  if (isLoading) return <div>Loading QA/QC data...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <RaiseIrDialog />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
              Inspections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.irs.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              NCRs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.ncrs.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
              Punch List
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.punchItems.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inspection History</CardTitle>
        </CardHeader>
        <CardContent>
          {data?.irs.length === 0 ? (
            <p className="text-sm text-muted-foreground italic py-4">No inspections recorded for this task.</p>
          ) : (
            <div className="space-y-4">
              {data?.irs.map((ir) => (
                <div 
                  key={ir.id} 
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => setSelectedIr(ir)}
                >
                  <div className="space-y-1">
                    <p className="font-medium text-sm">{ir.request_number}</p>
                    <p className="text-xs text-muted-foreground">
                      Requested: {format(new Date(ir.requested_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <Badge variant={ir.status === 'passed' ? 'default' : ir.status === 'failed' ? 'destructive' : 'secondary'}>
                    {formatIrStatus(ir.status)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {data?.ncrs && data.ncrs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Open NCRs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.ncrs.map((ncr) => (
                <div key={ncr.id} className="p-3 border border-destructive/50 rounded-lg bg-destructive-soft/10">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-bold text-sm text-destructive">{ncr.ncr_number}</p>
                    <Badge variant="outline">{formatNcrStatus(ncr.status)}</Badge>
                  </div>
                  <p className="text-sm">{ncr.issue_description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedIr && (
        <InspectIrDialog 
          ir={selectedIr} 
          open={!!selectedIr} 
          onOpenChange={(open) => !open && setSelectedIr(null)} 
        />
      )}
    </div>
  );
}
