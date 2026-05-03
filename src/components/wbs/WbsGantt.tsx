import * as React from "react";
import { addDays, differenceInCalendarDays, format, isValid, max, min, parseISO, startOfDay } from "date-fns";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GanttRow } from "@/lib/wbsGanttRows";
import { NodeRollup, TaskScheduleLite, taskStatus } from "@/lib/scheduleMeta";
import { cn } from "@/lib/utils";

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
  bodyScrollRef?: RefObject<HTMLDivElement>;
  onBodyScroll?: (event: UIEvent<HTMLDivElement>) => void;
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

export function WbsGantt({ rows, collapsed, onToggle, tasks, predecessors, holidaySet, rollupByNode, projectRollup, bodyScrollRef, onBodyScroll, blockedSet, baselineByTask, onProposeShift, selectedTaskId, secondTaskId, onTaskSelect, onEditDependency }: Props) {
  const [zoom, setZoom] = React.useState<Zoom>("week");

  const range = React.useMemo(() => {
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

  const syncHeaderScroll = (event: UIEvent<HTMLDivElement>) => {
    if (!headerScrollRef.current) return;
    headerScrollRef.current.scrollLeft = event.currentTarget.scrollLeft;
  };

  return (
    <div className="h-full overflow-hidden bg-[radial-gradient(circle_at_top,hsl(var(--muted))/0.4,transparent_40%)]">
      <div className="flex h-full flex-col overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b bg-background/90 px-4" style={{ height: TITLE_H }}>
          <div>
            <div className="text-sm font-semibold text-foreground">Gantt Schedule</div>
            <div className="text-[11px] text-muted-foreground">Timeline grid, roll-up bars, and dependency paths</div>
          </div>

          <div className="flex items-center gap-1">
            <Button size="sm" variant="outline" onClick={jumpToToday} className="gap-1.5 rounded-full">
              <Calendar className="h-3.5 w-3.5" />
              Today
            </Button>
            {(["day", "week", "month"] as const).map((value) => (
              <Button
                key={value}
                size="sm"
                variant={zoom === value ? "default" : "outline"}
                className="rounded-full capitalize"
                onClick={() => setZoom(value)}
              >
                {value}
              </Button>
            ))}
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
                        const width = Math.max(dayWidth, (differenceInCalendarDays(end, start) + 1) * dayWidth);
                        const status = taskStatus(row.task, today);
                        const barTone =
                          status === "late" ? "border-destructive bg-destructive/70"
                          : status === "at_risk" ? "border-warning bg-warning/70"
                          : status === "done" ? "border-primary bg-primary/75"
                          : "border-success bg-success/70";

                        const isSecond = row.kind === "task" && row.task.id === secondTaskId;
                        
                        return (
                          <div
                            className={cn(
                              "absolute top-[8px] h-5 rounded-full border shadow-sm overflow-hidden cursor-pointer transition-all",
                              barTone,
                              isSelected && "ring-2 ring-primary ring-offset-1",
                              isSecond && "ring-2 ring-green-500 ring-offset-1 bg-green-500/20",
                            )}
                            style={{ left, width }}
                            title={`${row.task.title} ${format(start, "MMM d")} - ${format(end, "MMM d")}`}
                            onClick={() => onTaskSelect?.(row.task.id, false)}
                          >
                            <div
                              className="h-full bg-foreground/20"
                              style={{ width: `${Math.min(100, row.task.progress_pct)}%` }}
                            />
                          </div>
                        );
                      }

                      const rollup = row.kind === "project" ? projectRollup : rollupByNode?.get(row.id);
                      const start = safeDate(rollup?.plannedStart ?? null);
                      const end = safeDate(rollup?.plannedEnd ?? null);
                      if (!rollup || !start || !end || end < start) return null;

                      const left = differenceInCalendarDays(start, range.start) * dayWidth;
                      const width = Math.max(dayWidth, (differenceInCalendarDays(end, start) + 1) * dayWidth);
                      const topOffset =
                        row.kind === "project" ? 6
                        : row.node.node_type === "building" ? 7
                        : row.node.node_type === "level" ? 8
                        : row.node.node_type === "zone" ? 9
                        : 9;
                      const barHeight =
                        row.kind === "project" ? 22
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
                      const title =
                        row.kind === "project"
                          ? `${row.label} ${format(start, "MMM d")} - ${format(end, "MMM d")}`
                          : `${row.node.name} ${format(start, "MMM d")} - ${format(end, "MMM d")}`;
                      const progressWidth = Math.max(10, Math.min(width, (width * Math.min(100, rollup.progressPct)) / 100));
                      const progressText = `${Math.round(rollup.progressPct)}%`;

                        return (
                          <div
                            className={cn(
                              "absolute shadow-sm overflow-visible border",
                              summaryTone.shell,
                            )}
                            style={{ left, width, top: topOffset, height: barHeight }}
                            title={title}
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
                                {progressText}
                              </span>
                            )}
                          </div>
                        </div>
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

       </div>
     </div>
   );
 }
