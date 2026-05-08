import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import type { KpiTimeRange } from "@/lib/reportingMeta";

// ─── Filter Bar ───────────────────────────────────────────

export interface FilterOption {
  value: string;
  label: string;
}

export interface DashboardFilterBarProps {
  projectOptions?: FilterOption[];
  projectValue?: string;
  onProjectChange?: (value: string) => void;
  periodOptions?: FilterOption[];
  periodValue?: string;
  onPeriodChange?: (value: string) => void;
  disciplineOptions?: FilterOption[];
  disciplineValue?: string;
  onDisciplineChange?: (value: string) => void;
  timeRange?: KpiTimeRange;
  onTimeRangeChange?: (range: KpiTimeRange) => void;
  dateFrom?: string;
  dateTo?: string;
  onDateFromChange?: (value: string) => void;
  onDateToChange?: (value: string) => void;
  extraActions?: React.ReactNode;
  className?: string;
}

const TIME_RANGE_OPTIONS: { value: KpiTimeRange; label: string }[] = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "custom", label: "Custom" },
];

export function DashboardFilterBar({
  projectOptions,
  projectValue,
  onProjectChange,
  periodOptions,
  periodValue,
  onPeriodChange,
  disciplineOptions,
  disciplineValue,
  onDisciplineChange,
  timeRange,
  onTimeRangeChange,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  extraActions,
  className,
}: DashboardFilterBarProps) {
  return (
    <div className={cn("flex flex-wrap items-end gap-3", className)}>
      {projectOptions && onProjectChange && (
        <FilterField label="Project">
          <Select value={projectValue} onValueChange={onProjectChange}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              {projectOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>
      )}

      {periodOptions && onPeriodChange && (
        <FilterField label="Period">
          <Select value={periodValue} onValueChange={onPeriodChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              {periodOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>
      )}

      {disciplineOptions && onDisciplineChange && (
        <FilterField label="Discipline">
          <Select value={disciplineValue} onValueChange={onDisciplineChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All disciplines" />
            </SelectTrigger>
            <SelectContent>
              {disciplineOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>
      )}

      {onTimeRangeChange && (
        <FilterField label="Time range">
          <Select
            value={timeRange ?? "30d"}
            onValueChange={(v) => onTimeRangeChange(v as KpiTimeRange)}
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_RANGE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>
      )}

      {timeRange === "custom" && (
        <>
          <FilterField label="From">
            <Input
              type="date"
              value={dateFrom ?? ""}
              onChange={(e) => onDateFromChange?.(e.target.value)}
              className="w-36"
            />
          </FilterField>
          <FilterField label="To">
            <Input
              type="date"
              value={dateTo ?? ""}
              onChange={(e) => onDateToChange?.(e.target.value)}
              className="w-36"
            />
          </FilterField>
        </>
      )}

      {extraActions && (
        <div className="flex items-center gap-2 ml-auto">
          {extraActions}
        </div>
      )}
    </div>
  );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

// ─── Dashboard Section ────────────────────────────────────

export interface DashboardSectionProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  loading?: boolean;
}

export function DashboardSection({
  title,
  subtitle,
  children,
  className,
  loading = false,
}: DashboardSectionProps) {
  if (loading) {
    return (
      <Card className={cn(className)}>
        {(title || subtitle) && (
          <CardHeader className="pb-2">
            {title && <CardTitle className="text-base">{title}</CardTitle>}
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </CardHeader>
        )}
        <CardContent>
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!children || (Array.isArray(children) && children.length === 0)) {
    return (
      <Card className={cn(className)}>
        {(title || subtitle) && (
          <CardHeader className="pb-2">
            {title && <CardTitle className="text-base">{title}</CardTitle>}
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </CardHeader>
        )}
        <CardContent>
          <div className="flex justify-center py-8 text-sm text-muted-foreground">
            No data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(className)}>
      {(title || subtitle) && (
        <CardHeader className="pb-2">
          {title && <CardTitle className="text-base">{title}</CardTitle>}
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </CardHeader>
      )}
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
}

// ─── Dashboard Page Shell ─────────────────────────────────

export interface DashboardPageProps {
  title: string;
  subtitle?: string;
  filterBar?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function DashboardPage({
  title,
  subtitle,
  filterBar,
  children,
  className,
}: DashboardPageProps) {
  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {filterBar}
      {children}
    </div>
  );
}
