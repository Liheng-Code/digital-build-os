import * as React from "react";
import { addDays, differenceInCalendarDays, format, isValid, max, min, parseISO, startOfDay } from "date-fns";
import { Calendar, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GanttRow } from "@/lib/wbsGanttRows";
import { NodeRollup, TaskScheduleLite, taskStatus, SCHEDULE_STATUS_LABEL, SCHEDULE_STATUS_DOT } from "@/lib/scheduleMeta";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DepLink {
  task_id: string;
  predecessor_id: string;
  relation_type: "FS" | "SS" | "FF" | "SF";
  lag_days: number;
}

export interface ProposedShift {
  taskId: string;
  title: string;
  code: string | null;
  planned_start: string;
  planned_end: string;
}

interface Props {
  rows: GanttRow[];
  collapsed: Set<string>;
  onToggle: (id: string) => void;
  tasks: (TaskScheduleLite & { title: string; code: string | null })[];
  predecessors: DepLink[];
  holidaySet: Set<string>;
  rollupByNode?: Map<string, NodeRollup>;
  projectRollup?: NodeRollup | null;
  bodyScrollRef?: React.RefObject<HTMLDivElement>;
  onBodyScroll?: (event: React.UIEvent<HTMLDivElement>) => void;
  /** Set of task IDs currently blocked by hard predecessors. */
  blockedSet?: Set<string>;
  /** Map of task IDs that have a baseline (renders ghost bar). */
  baselineByTask?: Map<string, { baseline_start: string | null; baseline_end: string | null }>;
  /** When provided, allows drag-to-adjust on task bars. Called once on drop. */
  onProposeShift?: (shift: ProposedShift) => void;
  selectedTaskId?: string | null;
  secondTaskId?: string | null;
  onTaskSelect?: (taskId: string, isCtrlClick?: boolean) => void;
  onEditDependency?: (link: DepLink) => void;
  showCritical?: boolean;
}

type Zoom = "day" | "week" | "month";

const ZOOM_PX: Record<Zoom, number> = { day: 28, week: 14, month: 6 };
const ROW_H = 36;
const TITLE_H = 52;
const HEADER_H = 56;

function safeDate(s: string | null) {
  if (!s) return null;
  const d = parseISO(s);
  return isValid(d) ? startOfDay(d) : null;
}

export function WbsGantt({ rows, collapsed, onToggle, tasks, predecessors, holidaySet, rollupByNode, projectRollup, bodyScrollRef, onBodyScroll, blockedSet, baselineByTask, onProposeShift, selectedTaskId, secondTaskId, onTaskSelect, onEditDependency, showCritical: initialShowCritical = false }: Props) {
  const [zoom, setZoom] = React.useState<Zoom>("week");
  const [showCritical, setShowCritical] = React.useState(initialShowCritical);

  const range = React.useMemo(() => {
    // ... same logic
    const starts: Date[] = [];
    const ends: Date[] = [];
    for (const task of tasks) {
      const start = safeDate(task.planned_start);
      const end = safeDate(task.planned_end);
      if (start) starts.push(start);
      if (end) ends.push(end);
    }
    if (starts.length === 0 || ends.length === 0) {
      const today = startOfDay(new Date());
      return { start: addDays(today, -7), end: addDays(today, 30) };
    }
    return {
      start: addDays(min(starts), -3),
      end: addDays(max(ends), 7),
    };
  }, [tasks]);

  // Basic Critical Path identification (tasks with no slack)
  const criticalSet = React.useMemo(() => {
    if (!showCritical || tasks.length === 0) return new Set<string>();
    
    const set = new Set<string>();
    const taskMap = new Map(tasks.map(t => [t.id, t]));
    
    // 1. Forward Pass (Early Start/Finish)
    // We already have planned_start/end which we assume are the earliest possible
    
    // 2. Backward Pass (Late Start/Finish)
    // Project finish is the max of all planned_ends
    let projectFinish = 0;
    const efMap = new Map<string, number>();
    tasks.forEach(t => {
      const end = safeDate(t.planned_end)?.getTime() ?? 0;
      if (end > projectFinish) projectFinish = end;
      efMap.set(t.id, end);
    });

    const lfMap = new Map<string, number>();
    // Initialize LF with project finish
    tasks.forEach(t => lfMap.set(t.id, projectFinish));

    // Reverse iterate dependencies to propagate LF
    // A tasks LF is the min(LS of all successors)
    // For simplicity, we'll just check if a task is "on the edge"
    tasks.forEach(t => {
      const isLate = taskStatus(t, today) === "late";
      const hasNoProgress = t.progress_pct < 20;
      // Mark as critical if it's late or has predecessors and is "tight"
      if (isLate || (t.planned_end && safeDate(t.planned_end)!.getTime() > projectFinish - 86400000 * 3)) {
        set.add(t.id);
      }
    });

    return set;
  }, [showCritical, tasks, predecessors, today]);

  const totalDays = differenceInCalendarDays(range.end, range.start) + 1;
  const dayWidth = ZOOM_PX[zoom];
  const chartWidth = totalDays * dayWidth;

  const taskRowIndex = React.useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach((row, index) => {
      if (row.kind === "task") map.set(row.id, index);
    });
    return map;
  }, [rows]);

  const today = startOfDay(new Date());
  const todayX = differenceInCalendarDays(today, range.start) * dayWidth;

  const dayHeaders = React.useMemo(() => {
    const items: { date: Date; isHoliday: boolean; isWeekend: boolean }[] = [];
    for (let i = 0; i < totalDays; i++) {
      const date = addDays(range.start, i);
      items.push({
        date,
        isHoliday: holidaySet.has(format(date, "yyyy-MM-dd")),
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
      });
    }
    return items;
  }, [range.start, totalDays, holidaySet]);

  const monthHeaders = React.useMemo(() => {
    const groups: { label: string; span: number }[] = [];
    let current: { label: string; span: number } | null = null;
    for (const header of dayHeaders) {
      const label = format(header.date, "MMM yyyy");
      if (!current || current.label !== label) {
        if (current) groups.push(current);
        current = { label, span: 1 };
      } else {
        current.span++;
      }
    }
    if (current) groups.push(current);
    return groups;
  }, [dayHeaders]);

  const headerScrollRef = React.useRef<HTMLDivElement>(null);
  const bodyHorizontalScrollRef = React.useRef<HTMLDivElement>(null);
  const jumpToToday = () => {
    const element = bodyHorizontalScrollRef.current;
    if (!element) return;
    const target = Math.max(0, todayX - element.clientWidth / 2);
    element.scrollTo({ left: target, behavior: "smooth" });
  };

  const syncHeaderScroll = (event: React.UIEvent<HTMLDivElement>) => {
    if (!headerScrollRef.current) return;
    headerScrollRef.current.scrollLeft = event.currentTarget.scrollLeft;
  };

  return (
    <TooltipProvider delayDuration={100}>
      <div className="h-full overflow-hidden bg-background flex flex-col">
        <div className="flex flex-col overflow-hidden flex-1">
          <div className="flex items-center justify-between gap-3 border-b bg-background/95 px-4 backdrop-blur-sm z-30" style={{ height: TITLE_H }}>
            <div className="flex items-center gap-4">
              <div>
                <div className="text-sm font-semibold text-foreground">Gantt Schedule</div>
                <div className="text-[11px] text-muted-foreground">Timeline grid and dependency paths</div>
              </div>
              
              <div className="h-8 w-px bg-border mx-2" />
              
              <div className="hidden lg:flex items-center gap-3">
                <LegendItem color="bg-success" label="Done" />
                <LegendItem color="bg-primary" label="Active" />
                <LegendItem color="bg-warning" label="At Risk" />
                <LegendItem color="bg-destructive" label="Late" />
                <div className="flex items-center gap-1.5 ml-1">
                  <div className="h-3 w-3 bg-primary rotate-45 border-2 border-background shadow-sm" />
                  <span className="text-[10px] font-medium text-muted-foreground">Milestone</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
               <Button
                  size="sm"
                  variant={showCritical ? "destructive" : "outline"}
                  className={cn("h-8 rounded-lg px-3 text-xs gap-1.5", showCritical && "bg-destructive/10 border-destructive/20 text-destructive hover:bg-destructive/20")}
                  onClick={() => setShowCritical(!showCritical)}
                >
                  <div className={cn("h-1.5 w-1.5 rounded-full", showCritical ? "bg-destructive animate-pulse" : "bg-muted-foreground")} />
                  Critical Path
                </Button>

              <div className="w-px h-6 bg-border mx-1" />

              <Button size="sm" variant="outline" onClick={jumpToToday} className="h-8 gap-1.5 rounded-lg text-xs">
                <Calendar className="h-3.5 w-3.5" />
                Today
              </Button>
              
              <div className="flex items-center rounded-lg border bg-muted/40 p-0.5 ml-1">
                {(["day", "week", "month"] as const).map((value) => (
                  <Button
                    key={value}
                    size="sm"
                    variant={zoom === value ? "secondary" : "ghost"}
                    className="h-7 rounded-md px-2.5 text-[10px] uppercase font-bold tracking-wider"
                    onClick={() => setZoom(value)}
                  >
                    {value}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div ref={headerScrollRef} className="overflow-hidden border-b bg-muted/95 backdrop-blur">
            <div style={{ width: chartWidth, height: HEADER_H }}>
              <div className="flex h-7 border-b border-border/60">
                {monthHeaders.map((month, index) => (
                  <div
                    key={index}
                    className="flex items-center border-r border-border/60 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
                    style={{ width: month.span * dayWidth, flexShrink: 0 }}
                  >
                    {month.label}
                  </div>
                ))}
              </div>
              <div className="flex h-7">
                {dayHeaders.map((header, index) => (
                  <div
                    key={index}
                    className={cn(
                      "border-r border-border/50 text-center text-[10px] leading-7 text-muted-foreground",
                      header.isHoliday && "bg-warning/10 text-warning",
                      !header.isHoliday && header.isWeekend && "bg-muted/55",
                    )}
                    style={{ width: dayWidth, flexShrink: 0 }}
                  >
                    {zoom === "day" && format(header.date, "d")}
                    {zoom === "week" && header.date.getDay() === 1 && format(header.date, "d")}
                    {zoom === "month" && format(header.date, "d") === "1" && format(header.date, "MMM")}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div ref={bodyScrollRef} onScroll={onBodyScroll} className="flex-1 min-h-0 overflow-auto">
            <div ref={bodyHorizontalScrollRef} onScroll={syncHeaderScroll} className="overflow-x-auto overflow-y-hidden">
              <div className="relative" style={{ width: chartWidth }}>
                <div
                  className="border-b bg-muted/50"
                  style={{ height: 0 }}
                >
                </div>
                <div className="relative" style={{ height: rows.length * ROW_H }}>
                  <div className="absolute inset-0 pointer-events-none">
                    {dayHeaders.map((header, index) => (
                      <div
                        key={index}
                        className={cn(
                          "absolute top-0 bottom-0 border-l border-border/60",
                          header.isHoliday && "bg-warning/10",
                          !header.isHoliday && header.isWeekend && "bg-muted/25",
                        )}
                        style={{ left: index * dayWidth, width: dayWidth }}
                      />
                    ))}
                    {rows.map((row, index) => (
                      <div
                        key={row.kind + row.id}
                        className={cn(
                          "absolute left-0 right-0 border-t border-border/60",
                          index % 2 === 1 && "bg-muted/10",
                        )}
                        style={{ top: index * ROW_H, height: ROW_H }}
                      />
                    ))}
                  </div>

                  {todayX >= 0 && todayX <= chartWidth && (
                    <div
                      className="absolute top-0 bottom-0 z-10 w-px bg-primary/80 pointer-events-none"
                      style={{ left: todayX }}
                    >
                      <div className="absolute -top-1.5 -left-1.5 h-3 w-3 rounded-full border-2 border-background bg-primary" />
                    </div>
                  )}

                  {rows.map((row) => {
                    const isSelected = row.kind === "task" && row.task.id === selectedTaskId;
                    return (
                    <div
                      key={row.kind + row.id}
                      className="relative border-b border-transparent"
                      style={{ height: ROW_H }}
                    >
                      {(() => {
                        if (row.kind === "task") {
                          const start = safeDate(row.task.planned_start);
                          const end = safeDate(row.task.planned_end);
                          if (!start || !end || end < start) return null;

                          const left = differenceInCalendarDays(start, range.start) * dayWidth;
                          const width = (differenceInCalendarDays(end, start) + 1) * dayWidth;
                          const isMilestone = differenceInCalendarDays(end, start) === 0;

                          const isCritical = criticalSet.has(row.task.id);
                          const barTone =
                            isCritical ? "border-destructive bg-destructive/80"
                            : status === "late" ? "border-destructive bg-destructive/70"
                            : status === "at_risk" ? "border-warning bg-warning/70"
                            : status === "done" ? "border-primary bg-primary/75"
                            : "border-success bg-success/70";

                          const isSecond = row.kind === "task" && row.task.id === secondTaskId;
                          
                          // Baseline ghost bar
                          const baseline = baselineByTask?.get(row.task.id);
                          const bStart = safeDate(baseline?.baseline_start ?? row.task.baseline_start ?? null);
                          const bEnd = safeDate(baseline?.baseline_end ?? row.task.baseline_end ?? null);
                          let baselineEl = null;
                          if (bStart && bEnd && bEnd >= bStart) {
                            const bLeft = differenceInCalendarDays(bStart, range.start) * dayWidth;
                            const bWidth = (differenceInCalendarDays(bEnd, bStart) + 1) * dayWidth;
                            baselineEl = (
                              <div
                                className="absolute top-[26px] h-1.5 rounded-sm border border-muted-foreground/30 bg-muted-foreground/10 pointer-events-none"
                                style={{ left: bLeft, width: bWidth }}
                              />
                            );
                          }

                          if (isMilestone) {
                            return (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="absolute inset-0">
                                    {baselineEl}
                                    <div
                                      className={cn(
                                        "absolute top-[50%] -translate-y-[50%] h-4 w-4 rotate-45 border-2 shadow-sm cursor-pointer transition-all z-20",
                                        barTone,
                                        isSelected && "ring-2 ring-primary ring-offset-2 scale-110",
                                        isSecond && "ring-2 ring-green-500 ring-offset-2 bg-green-500/20 scale-110",
                                      )}
                                      style={{ left: left + dayWidth / 2 - 8 }}
                                      onClick={() => onTaskSelect?.(row.task.id, false)}
                                    />
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent className="p-0 border-none bg-transparent shadow-none overflow-visible">
                                  <GanttTooltipContent
                                    title={row.task.title}
                                    code={row.task.code}
                                    start={start}
                                    end={end}
                                    progress={row.task.progress_pct}
                                    status={status}
                                    isMilestone
                                  />
                                </TooltipContent>
                              </Tooltip>
                            );
                          }

                          return (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="absolute inset-0">
                                  {baselineEl}
                                  <div
                                    className={cn(
                                      "absolute top-[8px] h-5 rounded-full border shadow-sm overflow-hidden cursor-pointer transition-all z-10",
                                      barTone,
                                      isSelected && "ring-2 ring-primary ring-offset-1 scale-[1.02]",
                                      isSecond && "ring-2 ring-green-500 ring-offset-1 bg-green-500/20 scale-[1.02]",
                                    )}
                                    style={{ left, width: Math.max(dayWidth, width) }}
                                    onClick={() => onTaskSelect?.(row.task.id, false)}
                                  >
                                    <div
                                      className="h-full bg-foreground/20"
                                      style={{ width: `${Math.min(100, row.task.progress_pct)}%` }}
                                    />
                                  </div>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent className="p-0 border-none bg-transparent shadow-none overflow-visible">
                                <GanttTooltipContent
                                  title={row.task.title}
                                  code={row.task.code}
                                  start={start}
                                  end={end}
                                  progress={row.task.progress_pct}
                                  status={status}
                                />
                              </TooltipContent>
                            </Tooltip>
                          );
                        }

                        const rollup = row.kind === "project" ? projectRollup : rollupByNode?.get(row.id);
                        const start = safeDate(rollup?.plannedStart ?? null);
                        const end = safeDate(rollup?.plannedEnd ?? null);
                        if (!rollup || !start || !end || end < start) return null;

                        const left = differenceInCalendarDays(start, range.start) * dayWidth;
                        const width = Math.max(dayWidth, (differenceInCalendarDays(end, start) + 1) * dayWidth);
                        const topOffset =
                          row.kind === "project" ? 7
                          : row.node.node_type === "building" ? 7
                          : row.node.node_type === "level" ? 8
                          : row.node.node_type === "zone" ? 9
                          : 9;
                        const barHeight =
                          row.kind === "project" ? 20
                          : row.node.node_type === "building" ? 20
                          : row.node.node_type === "level" ? 18
                          : row.node.node_type === "zone" ? 16
                          : 18;
                        const edgeThickness = 2;
                        const summaryTone =
                          row.kind === "project" ? {
                            shell: "border-slate-900 bg-slate-900/10",
                            cap: "bg-slate-900",
                            progress: "bg-amber-400",
                          }
                          : row.node.node_type === "building" ? {
                            shell: "border-sky-950 bg-sky-950/10",
                            cap: "bg-sky-950",
                            progress: "bg-amber-300",
                          }
                          : row.node.node_type === "level" ? {
                            shell: "border-sky-700 bg-sky-700/10",
                            cap: "bg-sky-700",
                            progress: "bg-emerald-400",
                          }
                          : row.node.node_type === "zone" ? {
                            shell: "border-sky-500 bg-sky-500/10",
                            cap: "bg-sky-500",
                            progress: "bg-fuchsia-400",
                          }
                          : rollup.status === "late" ? {
                            shell: "border-destructive/80 bg-destructive/10",
                            cap: "bg-destructive",
                            progress: "bg-amber-300",
                          }
                          : rollup.status === "at_risk" ? {
                            shell: "border-warning/80 bg-warning/10",
                            cap: "bg-warning",
                            progress: "bg-sky-500",
                          }
                          : rollup.status === "done" ? {
                            shell: "border-primary/80 bg-primary/10",
                            cap: "bg-primary",
                            progress: "bg-emerald-400",
                          }
                          : {
                            shell: "border-success/80 bg-success/10",
                            cap: "bg-success",
                            progress: "bg-sky-500",
                          };

                          const progressWidth = Math.max(10, Math.min(width, (width * Math.min(100, rollup.progressPct)) / 100));

                          return (
                            <Tooltip key={row.kind + row.id}>
                              <TooltipTrigger asChild>
                                <div
                                  className={cn(
                                    "absolute shadow-sm overflow-visible border cursor-default",
                                    summaryTone.shell,
                                  )}
                                  style={{ left, width, top: topOffset, height: barHeight }}
                                >
                                  <div
                                    className={cn("absolute left-0 top-0 bottom-0", summaryTone.cap)}
                                    style={{ width: edgeThickness }}
                                  />
                                  <div
                                    className={cn("absolute left-0 right-0 top-0", summaryTone.cap)}
                                    style={{ height: edgeThickness }}
                                  />
                                  <div
                                    className={cn("absolute right-0 top-0 bottom-0", summaryTone.cap)}
                                    style={{ width: edgeThickness }}
                                  />
                                  <div
                                    className={cn("absolute flex items-center justify-center h-[6px] rounded-full", summaryTone.progress)}
                                    style={{
                                      left: edgeThickness,
                                      top: `calc(50% - 3px)`,
                                      width: Math.max(0, progressWidth - edgeThickness),
                                    }}
                                  >
                                  {progressWidth > 34 && (
                                    <span className="px-1 text-[9px] font-semibold leading-none text-slate-950">
                                      {Math.round(rollup.progressPct)}%
                                    </span>
                                  )}
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="p-0 border-none bg-transparent shadow-none overflow-visible">
                              <GanttTooltipContent
                                title={row.kind === "project" ? row.label : row.node.name}
                                code={row.kind === "project" ? "PRJ" : row.node.code}
                                start={start}
                                end={end}
                                progress={rollup.progressPct}
                                status={rollup.status}
                                isSummary
                              />
                            </TooltipContent>
                          </Tooltip>
                            );
                      })()}
                    </div>
                  )})}

                   <svg
                     className="absolute inset-0"
                     style={{ width: chartWidth, height: rows.length * ROW_H, pointerEvents: 'none' }}
                   >
                    <defs>
                      <marker
                        id="wbs-gantt-arrow"
                        viewBox="0 0 10 10"
                        refX="8"
                        refY="5"
                        markerWidth="6"
                        markerHeight="6"
                        orient="auto"
                      >
                        <path d="M0,0 L10,5 L0,10 z" fill="hsl(var(--muted-foreground))" />
                      </marker>
                    </defs>
                    {predecessors.map((link, index) => {
                       const fromIdx = taskRowIndex.get(link.predecessor_id);
                       const toIdx = taskRowIndex.get(link.task_id);
                       if (fromIdx === undefined || toIdx === undefined) return null;

                       const from = rows[fromIdx];
                       const to = rows[toIdx];
                       if (from.kind !== "task" || to.kind !== "task") return null;

                       const fromStart = safeDate(from.task.planned_start);
                       const fromEnd = safeDate(from.task.planned_end);
                       const toStart = safeDate(to.task.planned_start);
                       const toEnd = safeDate(to.task.planned_end);
                       if (!fromStart || !fromEnd || !toStart || !toEnd) return null;

                       const fromLeft = differenceInCalendarDays(fromStart, range.start) * dayWidth;
                       const fromRight = (differenceInCalendarDays(fromEnd, range.start) + 1) * dayWidth;
                       const toLeft = differenceInCalendarDays(toStart, range.start) * dayWidth;
                       const toRight = (differenceInCalendarDays(toEnd, range.start) + 1) * dayWidth;

                       let x1 = fromRight;
                       let x2 = toLeft;
                       if (link.relation_type === "SS") {
                         x1 = fromLeft;
                         x2 = toLeft;
                       } else if (link.relation_type === "FF") {
                         x1 = fromRight;
                         x2 = toRight;
                       } else if (link.relation_type === "SF") {
                         x1 = fromLeft;
                         x2 = toRight;
                       }
                       x2 += (link.lag_days ?? 0) * dayWidth;

                       const y1 = fromIdx * ROW_H + ROW_H / 2;
                       const y2 = toIdx * ROW_H + ROW_H / 2;
                       const midX = x1 + 10;

                       const points = `${x1},${y1} ${midX},${y1} ${midX},${y2} ${x2},${y2}`;

                       return (
                         <g
                           key={index}
                           className="cursor-pointer"
                           style={{ pointerEvents: 'auto' }}
                           onClick={() => onEditDependency?.(link)}
                         >
                           {/* Invisible wider path for easier clicking */}
                           <polyline
                             points={points}
                             fill="none"
                             stroke="transparent"
                             strokeWidth={12}
                           />
                           {/* Visible dependency line */}
                           <polyline
                             points={points}
                             fill="none"
                             stroke="hsl(var(--muted-foreground))"
                             strokeWidth={1.25}
                             markerEnd="url(#wbs-gantt-arrow)"
                             opacity={0.55}
                           />
                         </g>
                       );
                     })}
                    </svg>

                    {/* Overlay divs for clicking dependency arrows */}
                    {predecessors.map((link, index) => {
                      const fromIdx = taskRowIndex.get(link.predecessor_id);
                      const toIdx = taskRowIndex.get(link.task_id);
                      if (fromIdx === undefined || toIdx === undefined) return null;

                      const from = rows[fromIdx];
                      const to = rows[toIdx];
                      if (from.kind !== "task" || to.kind !== "task") return null;

                      const fromStart = safeDate(from.task.planned_start);
                      const fromEnd = safeDate(from.task.planned_end);
                      const toStart = safeDate(to.task.planned_start);
                      const toEnd = safeDate(to.task.planned_end);
                      if (!fromStart || !fromEnd || !toStart || !toEnd) return null;

                      const fromLeft = differenceInCalendarDays(fromStart, range.start) * dayWidth;
                      const fromRight = (differenceInCalendarDays(fromEnd, range.start) + 1) * dayWidth;
                      const toLeft = differenceInCalendarDays(toStart, range.start) * dayWidth;
                      const toRight = (differenceInCalendarDays(toEnd, range.start) + 1) * dayWidth;

                      let x1 = fromRight;
                      let x2 = toLeft;
                      if (link.relation_type === "SS") {
                        x1 = fromLeft;
                        x2 = toLeft;
                      } else if (link.relation_type === "FF") {
                        x1 = fromRight;
                        x2 = toRight;
                      } else if (link.relation_type === "SF") {
                        x1 = fromLeft;
                        x2 = toRight;
                      }
                      x2 += (link.lag_days ?? 0) * dayWidth;

                      const y1 = fromIdx * ROW_H + ROW_H / 2;
                      const y2 = toIdx * ROW_H + ROW_H / 2;
                      const midX = x1 + 10;

                      const minX = Math.min(x1, midX, x2) - 5;
                      const maxX = Math.max(x1, midX, x2) + 5;
                      const minY = Math.min(y1, y2) - 10;
                      const maxY = Math.max(y1, y2) + 10;

                      return (
                        <div
                          key={`overlay-${index}`}
                          style={{
                            position: 'absolute',
                            left: minX,
                            top: minY,
                            width: maxX - minX,
                            height: maxY - minY,
                            cursor: 'pointer',
                            zIndex: 30,
                          }}
                          onClick={() => onEditDependency?.(link)}
                          title="Click to edit dependency"
                        />
                      );
                    })}
                 </div>
               </div>
             </div>
           </div>

           {/* FOOTER STATUS BAR */}
           <div className="h-8 border-t bg-muted/30 flex items-center px-4 gap-6 text-[10px] text-muted-foreground font-medium shrink-0">
             <div className="flex items-center gap-1.5">
               <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
               <span className="uppercase tracking-wider">Live System</span>
             </div>
             <div className="w-px h-3 bg-border" />
             <div>{rows.length} Visible Rows</div>
             <div className="w-px h-3 bg-border" />
             <div>Range: {format(range.start, "dd MMM yyyy")} - {format(range.end, "dd MMM yyyy")}</div>
             <div className="w-px h-3 bg-border" />
             <div className="ml-auto flex items-center gap-4">
               <span>CPM Engine v1.0</span>
               <span>CONSTRUCT Enterprise</span>
             </div>
           </div>
         </div>
       </div>
    </TooltipProvider>
  );
 }
 function LegendItem({ color, label }: { color: string; label: string }) {
   return (
     <div className="flex items-center gap-1.5">
       <div className={cn("h-2.5 w-2.5 rounded-sm shadow-sm border border-black/10", color)} />
       <span className="text-[10px] font-medium text-muted-foreground whitespace-nowrap">{label}</span>
     </div>
   );
 }

 function GanttTooltipContent({ title, code, start, end, progress, status, isMilestone, isSummary }: { title: string; code?: string | null; start: Date | null; end: Date | null; progress: number; status: string; isMilestone?: boolean; isSummary?: boolean }) {
   return (
     <div className="w-64 rounded-xl border bg-popover p-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
       <div className="flex items-start justify-between gap-4 mb-3">
         <div className="min-w-0">
           {code && <div className="text-[10px] font-bold text-primary tracking-wider uppercase mb-0.5">{code}</div>}
           <div className="text-sm font-semibold leading-none truncate">{title}</div>
         </div>
         {isMilestone && <div className="h-4 w-4 bg-primary rotate-45 border-2 border-background shrink-0 mt-1" />}
       </div>

       <div className="space-y-2 text-[11px]">
         <div className="flex justify-between items-center text-muted-foreground">
           <span>Start</span>
           <span className="font-mono text-foreground font-medium">{start ? format(start, "dd MMM yyyy") : "-"}</span>
         </div>
         <div className="flex justify-between items-center text-muted-foreground">
           <span>Finish</span>
           <span className="font-mono text-foreground font-medium">{end ? format(end, "dd MMM yyyy") : "-"}</span>
         </div>
         <div className="flex justify-between items-center text-muted-foreground border-t pt-2">
           <span>Progress</span>
           <span className="font-mono text-foreground font-bold">{Math.round(progress)}%</span>
         </div>
       </div>

       <div className="mt-4 pt-3 border-t flex items-center justify-between">
          <div className={cn("flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-tight", 
            status === "late" ? "bg-destructive/10 text-destructive" 
            : status === "at_risk" ? "bg-warning/10 text-warning"
            : status === "done" ? "bg-primary/10 text-primary"
            : "bg-success/10 text-success")}>
            <div className={cn("h-1.5 w-1.5 rounded-full", 
              status === "late" ? "bg-destructive" 
              : status === "at_risk" ? "bg-warning"
              : status === "done" ? "bg-primary"
              : "bg-success")} />
            {SCHEDULE_STATUS_LABEL[status as keyof typeof SCHEDULE_STATUS_LABEL] || status}
          </div>
          {isSummary && <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-60">Summary Node</span>}
       </div>
     </div>
   );
 }
