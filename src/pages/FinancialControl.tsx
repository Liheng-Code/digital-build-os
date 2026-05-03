import * as React from 'react';
import { Link } from 'react-router-dom';
import { useProjects } from '@/contexts/ProjectContext';
import { useProjectCostSummaries } from '@/hooks/useFinancials';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, Activity, AlertTriangle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export default function FinancialControl() {
  const { activeProject } = useProjects();
  const { data: summaries, isLoading, error } = useProjectCostSummaries(activeProject?.id || '');

  const stats = React.useMemo(() => {
    if (!summaries) return { totalBac: 0, totalEv: 0, totalAc: 0, cpi: 0 };
    const totalBac = summaries.reduce((acc, s) => acc + (s.bac || 0), 0);
    const totalEv = summaries.reduce((acc, s) => acc + (s.ev || 0), 0);
    const totalAc = summaries.reduce((acc, s) => acc + (s.ac_total || 0), 0);
    const cpi = totalAc > 0 ? totalEv / totalAc : 0;
    return { totalBac, totalEv, totalAc, cpi };
  }, [summaries]);

  if (!activeProject) return <div className="p-6">Select a project.</div>;
  if (isLoading) return <div className="p-6 text-center">Crunching numbers...</div>;
  if (error) return (
    <div className="p-6 text-center space-y-4">
      <div className="text-destructive font-bold text-xl">Data Error</div>
      <p className="text-muted-foreground">{(error as any).message || "Failed to load project financials."}</p>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Control</h1>
          <p className="text-muted-foreground">Earned Value Management & Cost Forecasting</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/financials/claims">
              <FileText className="h-4 w-4 mr-2" />
              Manage Claims
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cost Performance Index (CPI)</CardTitle>
            <Activity className={cn("h-4 w-4", stats.cpi >= 1 ? "text-green-500" : "text-destructive")} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.cpi.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {stats.cpi >= 1 ? "Under budget" : "Over budget"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Earned Value (EV)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalEv.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Work performed to date</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actual Cost (AC)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalAc.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total spent to date</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Completion</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalBac > 0 ? ((stats.totalEv / stats.totalBac) * 100).toFixed(0) : 0}%
            </div>
            <Progress value={stats.totalBac > 0 ? (stats.totalEv / stats.totalBac) * 100 : 0} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cost Alerts</CardTitle>
          <CardDescription>Tasks exceeding material budget</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {summaries?.filter(s => s.ac_total > s.ev).map(s => (
              <div key={s.task_id} className="flex items-center gap-3">
                <div className="p-2 bg-destructive/10 rounded-full">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{s.task_title}</p>
                  <p className="text-xs text-muted-foreground">CPI: {s.cpi.toFixed(2)} · Variance: -${(s.ac_total - s.ev).toLocaleString()}</p>
                </div>
              </div>
            ))}
            {summaries?.filter(s => s.ac_total > s.ev).length === 0 && (
              <p className="text-sm text-muted-foreground italic text-center py-8">No current budget variances detected.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
