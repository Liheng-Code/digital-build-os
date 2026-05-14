import * as React from "react";
import { manpowerService } from "@/services/manpowerService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine 
} from "recharts";
import { format, addDays, eachDayOfInterval, isWithinInterval, parseISO, startOfDay, min, max } from "date-fns";
import { ChartBar, Calendar } from "lucide-react";
import { toast } from "sonner";

interface Props {
  projectId: string;
}

export function ManpowerHistogramPanel({ projectId }: Props) {
  const [data, setData] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [range, setRange] = React.useState({ start: new Date(), end: addDays(new Date(), 30) });

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const resources = await manpowerService.getProjectManpowerHistogram(projectId);
      
      if (resources.length === 0) {
        setData([]);
        setLoading(false);
        return;
      }

      // Find project date range
      let pStart = new Date(8640000000000000);
      let pEnd = new Date(-8640000000000000);

      resources.forEach((r: any) => {
        const s = r.tasks?.planned_start ? parseISO(r.tasks.planned_start) : null;
        const e = r.tasks?.planned_end ? parseISO(r.tasks.planned_end) : null;
        if (s && s < pStart) pStart = s;
        if (e && e > pEnd) pEnd = e;
      });

      if (pStart.getTime() > pEnd.getTime()) {
        pStart = startOfDay(new Date());
        pEnd = addDays(pStart, 30);
      } else {
          pStart = addDays(pStart, -2);
          pEnd = addDays(pEnd, 7);
      }

      setRange({ start: pStart, end: pEnd });

      const days = eachDayOfInterval({ start: pStart, end: pEnd });
      const chartData = days.map(day => {
        let totalCount = 0;
        let totalMH = 0;
        
        resources.forEach((r: any) => {
          const s = r.tasks?.planned_start ? startOfDay(parseISO(r.tasks.planned_start)) : null;
          const e = r.tasks?.planned_end ? startOfDay(parseISO(r.tasks.planned_end)) : null;
          
          if (s && e && isWithinInterval(day, { start: s, end: e })) {
            totalCount += (r.planned_count || 0);
            // Rough estimate: MH spread evenly across duration
            // (Not perfect but good for visualization)
          }
        });

        return {
          date: format(day, "MMM dd"),
          fullDate: format(day, "yyyy-MM-dd"),
          count: totalCount,
        };
      });

      setData(chartData);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  React.useEffect(() => { load(); }, [load]);

  const todayStr = format(new Date(), "MMM dd");

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <ChartBar className="h-5 w-5 text-primary" />
              Manpower Histogram
            </CardTitle>
            <CardDescription>Daily total manpower allocation across all tasks</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={load}>Refresh</Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground italic">
            Generating histogram...
          </div>
        ) : data.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-xl">
            No manpower data found for this project.
          </div>
        ) : (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis 
                  dataKey="date" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  interval={Math.floor(data.length / 10)}
                />
                <YAxis 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  label={{ value: 'Headcount', angle: -90, position: 'insideLeft', fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                <ReferenceLine x={todayStr} stroke="hsl(var(--primary))" strokeDasharray="3 3" label={{ position: 'top', value: 'Today', fill: 'hsl(var(--primary))', fontSize: 10 }} />
                <Bar 
                  dataKey="count" 
                  name="Total Headcount" 
                  fill="hsl(var(--primary))" 
                  radius={[4, 4, 0, 0]} 
                  opacity={0.8}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
