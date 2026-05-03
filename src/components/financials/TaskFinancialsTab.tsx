import { useMemo } from 'react';
import { useProjectCostSummaries } from '@/hooks/useFinancials';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, Wallet, Users } from 'lucide-react';

export function TaskFinancialsTab({ taskId, projectId }: { taskId: string; projectId: string }) {
  const { data: summaries, isLoading } = useProjectCostSummaries(projectId);
  
  const stats = useMemo(() => 
    summaries?.find(s => s.task_id === taskId), 
  [summaries, taskId]);

  if (isLoading) return <div>Loading costs...</div>;
  if (!stats) return <div>No financial baseline found for this task.</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground flex items-center gap-2">
              <Wallet className="h-3 w-3" /> Material Spend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.ac_materials.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Based on actual issues from stock</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground flex items-center gap-2">
              <Users className="h-3 w-3" /> Labor Spend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.ac_labor.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Based on approved timesheet hours</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Budget vs Actual</CardTitle>
          <CardDescription>Comparison of planned cost vs real spend</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <p className="text-sm font-medium">Budget at Completion (BAC)</p>
                <p className="text-2xl font-bold text-muted-foreground">${stats.bac.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">Actual Total Cost (AC)</p>
                <p className={cn("text-2xl font-bold", stats.ac_total > stats.bac ? "text-destructive" : "text-green-600")}>
                  ${stats.ac_total.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground mb-1">Earned Value (EV)</p>
                <p className="text-xl font-bold">${stats.ev.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground mb-1">Cost Variance</p>
                <p className={cn("text-xl font-bold", stats.ev - stats.ac_total < 0 ? "text-destructive" : "text-green-600")}>
                  ${(stats.ev - stats.ac_total).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
