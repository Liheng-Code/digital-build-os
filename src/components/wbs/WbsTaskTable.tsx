import * as React from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronUp, ChevronDown, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { WbsNode } from "@/lib/wbsMeta";
import { TaskScheduleLite, taskStatus, SCHEDULE_STATUS_LABEL, SCHEDULE_STATUS_TONE } from "@/lib/scheduleMeta";
import { buildNodePathMap } from "@/lib/wbsMeta";
import { format, parseISO, isValid, differenceInCalendarDays } from "date-fns";

type SortField = "wbs" | "days" | "start" | "finish" | "status" | "progress";
type SortDir = "asc" | "desc";

interface TaskRow {
  id: string;
  code: string | null;
  title: string;
  wbsNodeId: string | null;
  building: string;
  level: string;
  fullPath: string;
  plannedStart: string | null;
  plannedEnd: string | null;
  days: number | null;
  status: ReturnType<typeof taskStatus>;
  progress: number;
}

interface Props {
  nodes: WbsNode[];
  tasks: (TaskScheduleLite & { title: string; code: string | null })[];
}

export function WbsTaskTable({ nodes, tasks }: Props) {
  const [sortField, setSortField] = React.useState<SortField>("start");
  const [sortDir, setSortDir] = React.useState<SortDir>("asc");
  const [filterBuilding, setFilterBuilding] = React.useState<string>("all");
  const [filterLevel, setFilterLevel] = React.useState<string>("all");
  const [filterStatus, setFilterStatus] = React.useState<string>("all");
  const [search, setSearch] = React.useState("");

  const pathMap = React.useMemo(() => buildNodePathMap(nodes), [nodes]);

  const buildings = React.useMemo(() => {
    const set = new Set<string>();
    for (const n of nodes) {
      if (n.node_type === "building") set.add(n.name);
    }
    return [...set].sort();
  }, [nodes]);

  const levels = React.useMemo(() => {
    const set = new Set<string>();
    for (const n of nodes) {
      if (n.node_type === "level") set.add(n.name);
    }
    return [...set].sort();
  }, [nodes]);

  const taskRows: TaskRow[] = React.useMemo(() => {
    const today = new Date();
    return tasks.map((t) => {
      const pathInfo = t.wbs_node_id ? pathMap.get(t.wbs_node_id) : undefined;
      const ps = t.planned_start ? parseISO(t.planned_start) : null;
      const pe = t.planned_end ? parseISO(t.planned_end) : null;
      const days =
        ps && pe && isValid(ps) && isValid(pe)
          ? differenceInCalendarDays(parseISO(t.planned_end!), parseISO(t.planned_start!)) + 1
          : null;
      return {
        id: t.id,
        code: t.code,
        title: t.title,
        wbsNodeId: t.wbs_node_id,
        building: pathInfo?.building ?? "",
        level: pathInfo?.level ?? "",
        fullPath: pathInfo?.fullPath ? `${pathInfo.fullPath} > ${t.title}` : t.title,
        plannedStart: t.planned_start,
        plannedEnd: t.planned_end,
        days,
        status: taskStatus(t, today),
        progress: t.progress_pct,
      };
    });
  }, [tasks, pathMap]);

  const filtered = React.useMemo(() => {
    let rows = taskRows;
    if (filterBuilding !== "all") rows = rows.filter((r) => r.building === filterBuilding);
    if (filterLevel !== "all") rows = rows.filter((r) => r.level === filterLevel);
    if (filterStatus !== "all") rows = rows.filter((r) => r.status === filterStatus);
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.code?.toLowerCase().includes(q) ||
          r.fullPath.toLowerCase().includes(q),
      );
    }
    return rows;
  }, [taskRows, filterBuilding, filterLevel, filterStatus, search]);

  const sorted = React.useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      switch (sortField) {
        case "wbs":
          return dir * a.fullPath.localeCompare(b.fullPath);
        case "days":
          return dir * ((a.days ?? 0) - (b.days ?? 0));
        case "start":
          return dir * ((a.plannedStart ?? "") > (b.plannedStart ?? "") ? 1 : -1);
        case "finish":
          return dir * ((a.plannedEnd ?? "") > (b.plannedEnd ?? "") ? 1 : -1);
        case "status":
          return dir * a.status.localeCompare(b.status);
        case "progress":
          return dir * (a.progress - b.progress);
        default:
          return 0;
      }
    });
  }, [filtered, sortField, sortDir]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="inline h-3 w-3 ml-1 opacity-40" />;
    return sortDir === "asc" ? (
      <ChevronUp className="inline h-3 w-3 ml-1" />
    ) : (
      <ChevronDown className="inline h-3 w-3 ml-1" />
    );
  };

  const statusOptions: ReturnType<typeof taskStatus>[] = [
    "not_started",
    "on_track",
    "at_risk",
    "late",
    "done",
  ];

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 w-[200px]"
        />
        <Select value={filterBuilding} onValueChange={setFilterBuilding}>
          <SelectTrigger className="h-8 w-[150px]">
            <SelectValue placeholder="Building" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Buildings</SelectItem>
            {buildings.map((b) => (
              <SelectItem key={b} value={b}>{b}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterLevel} onValueChange={setFilterLevel}>
          <SelectTrigger className="h-8 w-[150px]">
            <SelectValue placeholder="Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            {levels.map((l) => (
              <SelectItem key={l} value={l}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="h-8 w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {statusOptions.map((s) => (
              <SelectItem key={s} value={s}>{SCHEDULE_STATUS_LABEL[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(filterBuilding !== "all" || filterLevel !== "all" || filterStatus !== "all" || search) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFilterBuilding("all");
              setFilterLevel("all");
              setFilterStatus("all");
              setSearch("");
            }}
          >
            Clear
          </Button>
        )}
        <span className="ml-auto text-xs text-muted-foreground">
          {sorted.length} task{sorted.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-auto" style={{ maxHeight: "calc(100vh - 16rem)" }}>
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-muted/80 backdrop-blur z-10">
              <tr className="border-b">
                <th
                  className="text-left px-3 py-2 font-medium cursor-pointer hover:text-foreground"
                  onClick={() => toggleSort("wbs")}
                >
                  WBS / Task <SortIcon field="wbs" />
                </th>
                <th
                  className="text-center px-3 py-2 font-medium cursor-pointer hover:text-foreground w-20"
                  onClick={() => toggleSort("days")}
                >
                  Days <SortIcon field="days" />
                </th>
                <th
                  className="text-center px-3 py-2 font-medium cursor-pointer hover:text-foreground w-28"
                  onClick={() => toggleSort("start")}
                >
                  Start <SortIcon field="start" />
                </th>
                <th
                  className="text-center px-3 py-2 font-medium cursor-pointer hover:text-foreground w-28"
                  onClick={() => toggleSort("finish")}
                >
                  Finish <SortIcon field="finish" />
                </th>
                <th
                  className="text-center px-3 py-2 font-medium cursor-pointer hover:text-foreground w-28"
                  onClick={() => toggleSort("status")}
                >
                  Status <SortIcon field="status" />
                </th>
                <th
                  className="text-center px-3 py-2 font-medium cursor-pointer hover:text-foreground w-32"
                  onClick={() => toggleSort("progress")}
                >
                  Progress <SortIcon field="progress" />
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-muted-foreground">
                    No tasks match the current filters
                  </td>
                </tr>
              )}
              {sorted.map((row) => (
                <tr key={row.id} className="border-b hover:bg-muted/30">
                  <td className="px-3 py-2">
                    <Link
                      to={`/tasks/${row.id}`}
                      className="hover:text-primary inline-flex items-center gap-2"
                    >
                      {row.code && (
                        <span className="font-mono text-[11px] text-muted-foreground">{row.code}</span>
                      )}
                      <span className="truncate" title={row.fullPath}>{row.fullPath}</span>
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-center text-muted-foreground">
                    {row.days ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-center text-muted-foreground">
                    {row.plannedStart ? format(parseISO(row.plannedStart), "MMM d, yyyy") : "—"}
                  </td>
                  <td className="px-3 py-2 text-center text-muted-foreground">
                    {row.plannedEnd ? format(parseISO(row.plannedEnd), "MMM d, yyyy") : "—"}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <Badge variant="secondary" className={cn("text-xs", SCHEDULE_STATUS_TONE[row.status])}>
                      {SCHEDULE_STATUS_LABEL[row.status]}
                    </Badge>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${Math.min(100, row.progress)}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-10 text-right">
                        {row.progress}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
