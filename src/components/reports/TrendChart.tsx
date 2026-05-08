import * as React from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  type TooltipProps,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { KpiTimeRange } from "@/lib/reportingMeta";

export type ChartKind = "line" | "bar" | "area";

export interface TrendSeries {
  dataKey: string;
  name: string;
  color: string;
}

export interface TrendChartProps {
  title?: string;
  data: Record<string, string | number>[];
  series: TrendSeries[];
  kind?: ChartKind;
  timeRange?: KpiTimeRange;
  onTimeRangeChange?: (range: KpiTimeRange) => void;
  xAxisKey?: string;
  height?: number;
  className?: string;
  loading?: boolean;
}

const TIME_RANGES: { key: KpiTimeRange; label: string }[] = [
  { key: "7d", label: "7D" },
  { key: "30d", label: "30D" },
  { key: "90d", label: "90D" },
];

const CHART_THEME: Record<string, string> = {
  primary: "var(--color-primary)",
  success: "var(--color-success)",
  warning: "var(--color-warning)",
  destructive: "var(--color-destructive)",
  info: "var(--color-info)",
  muted: "var(--color-muted-foreground)",
};

function resolveColor(color: string): string {
  return CHART_THEME[color] ?? color;
}

function ChartTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-background p-2 shadow-sm">
      <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-xs" style={{ color: entry.color }}>
          {entry.name}: {typeof entry.value === "number" ? entry.value.toLocaleString() : entry.value}
        </p>
      ))}
    </div>
  );
}

export function TrendChart({
  title,
  data,
  series,
  kind = "line",
  timeRange,
  onTimeRangeChange,
  xAxisKey = "period",
  height = 300,
  className,
  loading = false,
}: TrendChartProps) {
  if (loading) {
    return (
      <Card className={cn(className)}>
        <CardHeader className="pb-2">
          {title && <CardTitle className="text-base">{title}</CardTitle>}
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2 h-[300px]">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 bg-muted rounded-t animate-pulse"
                style={{ height: `${30 + Math.random() * 70}%` }}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 8, right: 8, bottom: 0, left: 0 },
    };

    switch (kind) {
      case "bar":
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey={xAxisKey} tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
            <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
            <Tooltip content={<ChartTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {series.map((s) => (
              <Bar
                key={s.dataKey}
                dataKey={s.dataKey}
                name={s.name}
                fill={resolveColor(s.color)}
                radius={[2, 2, 0, 0]}
              />
            ))}
          </BarChart>
        );
      case "area":
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey={xAxisKey} tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
            <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
            <Tooltip content={<ChartTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {series.map((s) => (
              <Area
                key={s.dataKey}
                type="monotone"
                dataKey={s.dataKey}
                name={s.name}
                stroke={resolveColor(s.color)}
                fill={resolveColor(s.color)}
                fillOpacity={0.1}
              />
            ))}
          </AreaChart>
        );
      default:
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey={xAxisKey} tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
            <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
            <Tooltip content={<ChartTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {series.map((s) => (
              <Line
                key={s.dataKey}
                type="monotone"
                dataKey={s.dataKey}
                name={s.name}
                stroke={resolveColor(s.color)}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        );
    }
  };

  return (
    <Card className={cn(className)}>
      {(title || onTimeRangeChange) && (
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          {title && <CardTitle className="text-base">{title}</CardTitle>}
          {onTimeRangeChange && (
            <div className="flex gap-1">
              {TIME_RANGES.map((r) => (
                <Button
                  key={r.key}
                  variant={timeRange === r.key ? "default" : "outline"}
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => onTimeRangeChange(r.key)}
                >
                  {r.label}
                </Button>
              ))}
            </div>
          )}
        </CardHeader>
      )}
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          {renderChart()}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
