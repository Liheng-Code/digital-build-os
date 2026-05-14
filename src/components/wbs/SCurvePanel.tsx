import * as React from "react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine 
} from "recharts";
import { format, addDays, eachDayOfInterval, isWithinInterval, parseISO, startOfDay, differenceInCalendarDays } from "date-fns";
import { TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TaskScheduleLite } from "@/lib/scheduleMeta";

interface Props {
  tasks: TaskScheduleLite[];
}

export function SCurvePanel({ tasks }: Props) {
  const [data, setData] = React.useState<any[]>([]);

  const generateData = React.useCallback(() => {
    if (tasks.length === 0) {
      setData([]);
      return;
    }

    // 1. Determine Project Range
    let pStart = new Date(8640000000000000);
    let pEnd = new Date(-8640000000000000);

    tasks.forEach(t => {
      const s = t.planned_start ? parseISO(t.planned_start) : null;
      const e = t.planned_end ? parseISO(t.planned_end) : null;
      if (s && s < pStart) pStart = s;
      if (e && e > pEnd) pEnd = e;
    });

    if (pStart.getTime() > pEnd.getTime()) {
      pStart = startOfDay(new Date());
      pEnd = addDays(pStart, 30);
    } else {
        pStart = startOfDay(pStart);
        pEnd = startOfDay(addDays(pEnd, 1));
    }

    const today = startOfDay(new Date());
    const interval = eachDayOfInterval({ start: pStart, end: pEnd });
    
    // To keep chart readable if range is huge, sample weekly
    const sampledDays = interval.length > 90 
      ? interval.filter((_, i) => i % 7 === 0 || i === interval.length - 1)
      : interval;

    const chartData = sampledDays.map(day => {
      let cumulativePV = 0;
      let cumulativeEV = 0;
      let cumulativeAC = 0;

      tasks.forEach(t => {
        const ps = t.planned_start ? startOfDay(parseISO(t.planned_start)) : null;
        const pe = t.planned_end ? startOfDay(parseISO(t.planned_end)) : null;
        const bc = Number(t.budgeted_cost ?? 0);
        const ac = Number(t.actual_cost ?? 0);
        const prog = (Number(t.progress_pct) || 0) / 100;

        // Cumulative PV for this day
        if (ps && pe) {
            if (day >= pe) {
                cumulativePV += bc;
            } else if (day > ps) {
                const total = differenceInCalendarDays(pe, ps) || 1;
                const elapsed = differenceInCalendarDays(day, ps);
                cumulativePV += bc * (elapsed / total);
            }
        }

        // EV and AC are typically reported as "to-date"
        // In a real system, we'd need historical progress logs to show EV/AC growth over time.
        // For this prototype, we'll only show EV/AC lines up to "Today" using current values.
        if (day <= today) {
            cumulativeEV += bc * prog;
            cumulativeAC += ac;
        }
      });

      return {
        date: format(day, "MMM dd"),
        fullDate: format(day, "yyyy-MM-dd"),
        pv: Math.round(cumulativePV),
        ev: day <= today ? Math.round(cumulativeEV) : null,
        ac: day <= today ? Math.round(cumulativeAC) : null,
      };
    });

    setData(chartData);
  }, [tasks]);

  React.useEffect(() => { generateData(); }, [generateData]);

  const todayStr = format(new Date(), "MMM dd");

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Project S-Curve (EVM)
            </CardTitle>
            <CardDescription>Cumulative Planned Value vs. Earned Value and Actual Cost</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={generateData}>Refresh</Button>
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-[350px] flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-xl">
            No data available for S-Curve.
          </div>
        ) : (
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                <XAxis 
                  dataKey="date" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  minTickGap={30}
                />
                <YAxis 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  formatter={(v: any) => [`$${v.toLocaleString()}`, ""]}
                  contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '20px' }} />
                <ReferenceLine x={todayStr} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" label={{ position: 'top', value: 'Today', fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                
                <Line 
                  type="monotone" 
                  dataKey="pv" 
                  name="Planned Value (PV)" 
                  stroke="hsl(var(--muted-foreground))" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="ev" 
                  name="Earned Value (EV)" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="ac" 
                  name="Actual Cost (AC)" 
                  stroke="hsl(var(--destructive))" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
