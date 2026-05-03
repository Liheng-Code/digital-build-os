import { useMemo } from 'react';
import { useProjectCostSummaries } from '@/hooks/useFinancials';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { DollarSign, Activity, TrendingUp } from 'lucide-react';

export function WbsFinancialsTab({ nodeId, projectId }: { nodeId: string; projectId: string }) {
  const { data: allSummaries, isLoading } = useProjectCostSummaries(projectId);

  const nodeStats = useMemo(() => {
    if (!allSummaries) return null;
    // Note: In a real app, we would also rollup child nodes. 
    // For this demo, we'll rollup tasks directly linked to this node.
    const summaries = allSummaries.filter(s => s.wbs_node_id === nodeId);
    
    const bac = summaries.reduce((acc, s) => acc + s.bac, 0);
    const ev = summaries.reduce((acc, s) => acc + s.ev, 0);
    const ac = summaries.reduce((acc, s) => acc + s.ac_total, 0);
    const cpi = ac > 0 ? ev / ac : 0;
    
    return { bac, ev, ac, cpi, count: summaries.length };
  }, [allSummaries, nodeId]);

  if (isLoading) return <div>Loading financials...</div>;
  if (!nodeStats || nodeStats.count === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground italic">
          No financial data available for this node. Ensure tasks are linked and BOQ is defined.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-3 w-3" /> Budget (BAC)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">${nodeStats.bac.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground flex items-center gap-2">
              <Activity className="h-3 w-3" /> Earned Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">${nodeStats.ev.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-3 w-3" /> Actual Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">${nodeStats.ac.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance Index</CardTitle>
          <CardDescription>Efficiency of work performed for this zone</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-4xl font-black">{nodeStats.cpi.toFixed(2)}</div>
              <p className="text-sm text-muted-foreground">Cost Performance Index (CPI)</p>
            </div>
            <div className={`text-sm font-bold px-2 py-1 rounded ${nodeStats.cpi >= 1 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {nodeStats.cpi >= 1 ? 'UNDER BUDGET' : 'OVER BUDGET'}
            </div>
          </div>
          <Progress value={Math.min(nodeStats.cpi * 50, 100)} className={nodeStats.cpi >= 1 ? 'bg-green-100' : 'bg-red-100'} />
        </CardContent>
      </Card>
    </div>
  );
}
