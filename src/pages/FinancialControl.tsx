import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useProjects } from '@/contexts/ProjectContext';
import { useProjectCostSummaries } from '@/hooks/useFinancials';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Activity, AlertTriangle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export default function FinancialControl() {
  const { activeProject } = useProjects();
  const { data: summaries, isLoading } = useProjectCostSummaries(activeProject?.id || '');

  const stats = useMemo(() => {
    if (!summaries) return { totalBac: 0, totalEv: 0, totalAc: 0, cpi: 0 };
    const totalBac = summaries.reduce((acc, s) => acc + s.bac, 0);
    const totalEv = summaries.reduce((acc, s) => acc + s.ev, 0);
    const totalAc = summaries.reduce((acc, s) => acc + s.ac_total, 0);
    const cpi = totalAc > 0 ? totalEv / totalAc : 0;
    return { totalBac, totalEv, totalAc, cpi };
  }, [summaries]);

  const chartData = useMemo(() => {
    // Conceptual daily S-Curve data (Simplified for demo)
    return [
      { name: 'Jan', pv: 4000, ev: 2400, ac: 2400 },
      { name: 'Feb', pv: 3000, ev: 1398, ac: 2210 },
      { name: 'Mar', pv: 2000, ev: 9800, ac: 2290 },
      { name: 'Apr', pv: 2780, ev: 3908, ac: 2000 },
      { name: 'May', pv: 1890, ev: 4800, ac: 2181 },
      { name: 'Jun', pv: 2390, ev: 3800, ac: 2500 },
      { name: 'Jul', pv: 3490, ev: 4300, ac: 2100 },
    ];
  }, []);

  if (!activeProject) return <div className="p-6">Select a project.</div>;
  if (isLoading) return <div className="p-6 text-center">Crunching numbers...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Control</h1>
          <p className="text-muted-foreground">Earned Value Management & Cost Forecasting</p>
        </div>
        <Button asChild variant="outline">
          <Link to="/financials/claims">
            <FileText className="h-4 w-4 mr-2" />
            Manage Claims
          </Link>
        </Button>
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

      <div className="grid gap-6 md:grid-cols-7">
        <Card className="md:col-span-4">
          <CardHeader>
            <CardTitle>Project S-Curve</CardTitle>
            <CardDescription>Planned vs Earned vs Actual Cost over time</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="pv" stroke="#94a3b8" name="Planned (PV)" strokeWidth={2} />
                <Line type="monotone" dataKey="ev" stroke="#2563eb" name="Earned (EV)" strokeWidth={3} />
                <Line type="monotone" dataKey="ac" stroke="#dc2626" name="Actual (AC)" strokeWidth={2} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Cost Alerts</CardTitle>
            <CardDescription>Top tasks exceeding material budget</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {summaries?.filter(s => s.ac_total > s.ev).slice(0, 5).map(s => (
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
    </div>
  );
}
