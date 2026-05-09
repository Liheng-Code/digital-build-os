import * as React from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TASK_STATUS_LABELS, TaskStatus } from "@/lib/taskMeta";

export interface WbsFilters {
  status?: string[];
  department?: string[];
  critical?: boolean;
  overdue?: boolean;
  search?: string;
}

interface Props {
  filters: WbsFilters;
  onChange: (filters: WbsFilters) => void;
  departmentOptions?: { value: string; label: string }[];
}

export function WbsFilterBar({ filters, onChange, departmentOptions }: Props) {
  const activeCount = (filters.status?.length ?? 0) + (filters.department?.length ?? 0) + (filters.critical ? 1 : 0) + (filters.overdue ? 1 : 0);

  const clearAll = () => onChange({});

  return (
    <div className="flex items-center gap-2 flex-wrap px-4 py-2 border-b bg-muted/20">
      {/* Status filter */}
      <Select
        value={filters.status?.[0] ?? ""}
        onValueChange={(v) => {
          if (!v) {
            const { status, ...rest } = filters;
            onChange(rest);
          } else {
            onChange({ ...filters, status: [v] });
          }
        }}
      >
        <SelectTrigger className="h-7 w-[130px] text-xs">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All statuses</SelectItem>
          {(Object.keys(TASK_STATUS_LABELS) as TaskStatus[]).map((s) => (
            <SelectItem key={s} value={s}>{TASK_STATUS_LABELS[s]}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Department filter */}
      {departmentOptions && departmentOptions.length > 0 && (
        <Select
          value={filters.department?.[0] ?? ""}
          onValueChange={(v) => {
            if (!v) {
              const { department, ...rest } = filters;
              onChange(rest);
            } else {
              onChange({ ...filters, department: [v] });
            }
          }}
        >
          <SelectTrigger className="h-7 w-[130px] text-xs">
            <SelectValue placeholder="All departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All departments</SelectItem>
            {departmentOptions.map((d) => (
              <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Critical toggle */}
      <Button
        size="sm"
        variant={filters.critical ? "destructive" : "outline"}
        className={cn("h-7 text-xs rounded-lg px-2.5", filters.critical && "bg-destructive/10 border-destructive/30")}
        onClick={() => onChange({ ...filters, critical: !filters.critical })}
      >
        Critical
      </Button>

      {/* Overdue toggle */}
      <Button
        size="sm"
        variant={filters.overdue ? "destructive" : "outline"}
        className={cn("h-7 text-xs rounded-lg px-2.5", filters.overdue && "bg-destructive/10 border-destructive/30")}
        onClick={() => onChange({ ...filters, overdue: !filters.overdue })}
      >
        Overdue
      </Button>

      {/* Active filter count */}
      {activeCount > 0 && (
        <div className="flex items-center gap-1 ml-auto">
          <Badge variant="secondary" className="text-xs h-6 px-2 gap-1">
            {activeCount} active
            <button onClick={clearAll} className="hover:text-foreground">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        </div>
      )}
    </div>
  );
}

/** Hook to manage filter state from URL search params. */
export function useWbsFilters(): [WbsFilters, (f: WbsFilters) => void] {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = React.useMemo<WbsFilters>(() => {
    const f: WbsFilters = {};
    const status = searchParams.get("status");
    if (status) f.status = status.split(",");
    const department = searchParams.get("department");
    if (department) f.department = department.split(",");
    if (searchParams.get("critical") === "true") f.critical = true;
    if (searchParams.get("overdue") === "true") f.overdue = true;
    const search = searchParams.get("search");
    if (search) f.search = search;
    return f;
  }, [searchParams]);

  const setFilters = React.useCallback((f: WbsFilters) => {
    const params = new URLSearchParams();
    if (f.status?.length) params.set("status", f.status.join(","));
    if (f.department?.length) params.set("department", f.department.join(","));
    if (f.critical) params.set("critical", "true");
    if (f.overdue) params.set("overdue", "true");
    if (f.search) params.set("search", f.search);
    setSearchParams(params, { replace: true });
  }, [setSearchParams]);

  return [filters, setFilters];
}
