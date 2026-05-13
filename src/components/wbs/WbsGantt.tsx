import * as React from "react";
import { addDays, differenceInCalendarDays, format, isValid, max, min, parseISO, startOfDay } from "date-fns";
import { Calendar, Info, GripVertical, Pencil, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GanttRow } from "@/lib/wbsGanttRows";
import { NodeRollup, TaskScheduleLite, taskStatus, SCHEDULE_STATUS_LABEL, SCHEDULE_STATUS_DOT, CpmMap, ConstraintType, CONSTRAINT_TYPE_LABELS } from "@/lib/scheduleMeta";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
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
  /** CPM computation results: map of taskId → {es, ef, ls, lf, totalFloat, isCritical}. */
  cpmMap?: CpmMap;
  /** Edit mode toggle for drag-to-edit. */
  editMode?: boolean;
  onEditModeChange?: (v: boolean) => void;
  /** Create a dependency link (drag-and-drop). Relation derived from drag-from-end → drop-on-end. */
  onCreateLink?: (predecessorId: string, taskId: string, relation: "FS" | "SS" | "FF" | "SF") => void;
}

type LinkEnd = "start" | "finish";

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

export function WbsGantt({ rows, collapsed, onToggle, tasks, predecessors, holidaySet, rollupByNode, projectRollup, bodyScrollRef, onBodyScroll, blockedSet, baselineByTask, onProposeShift, selectedTaskId, secondTaskId, onTaskSelect, onEditDependency, showCritical: initialShowCritical = false, cpmMap, editMode = false, onEditModeChange, onCreateLink }: Props) {
  const [zoom, setZoom] = React.useState<Zoom>("week");
  const [showCritical, setShowCritical] = React.useState(initialShowCritical);
  const [tooltip, setTooltip] = React.useState<{
    title: string;
    code?: string | null;
    start: Date | null;
    end: Date | null;
    progress: number;
    status: string;
    isMilestone?: boolean;
    isSummary?: boolean;
    x: number;
    y: number;
  } | null>(null);
  const [activeTooltip, setActiveTooltip] = React.useState<string | null>(null);

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

  const today = startOfDay(new Date());

  // Critical Path set based on CPM map or simple heuristic fallback
  const criticalSet = React.useMemo(() => {
    if (!showCritical || tasks.length === 0) return new Set<string>();
    if (cpmMap && cpmMap.size > 0) {
      const set = new Set<string>();
      for (const [id, r] of cpmMap) {
        if (r.isCritical) set.add(id);
      }
      return set;
    }
    // Fallback heuristic when no CPM map available
    const set = new Set<string>();
    const taskMap = new Map(tasks.map(t => [t.id, t]));
    let projectFinish = 0;
    tasks.forEach(t => {
      const end = safeDate(t.planned_end)?.getTime() ?? 0;
      if (end > projectFinish) projectFinish = end;
    });
    tasks.forEach(t => {
      const isLate = taskStatus(t, today) === "late";
      if (isLate || (t.planned_end && safeDate(t.planned_end)!.getTime() > projectFinish - 86400000 * 3)) {
        set.add(t.id);
      }
    });
    return set;
  }, [showCritical, tasks, cpmMap, today]);

  const totalDays = differenceInCalendarDays(range.end, range.start) + 1;
  const dayWidth = ZOOM_PX[zoom];
  const chartWidth = totalDays * dayWidth;

  // ── Drag-to-edit state ────────────────────────────────────────────────
  const [dragState, setDragState] = React.useState<{
    type: "move" | "resize-left" | "resize-right";
    taskId: string;
    startX: number;
    origStart: string;
    origEnd: string;
    currentStart: string;
    currentEnd: string;
  } | null>(null);

  const handleDragStart = React.useCallback((e: React.MouseEvent, taskId: string, type: "move" | "resize-left" | "resize-right") => {
    if (!editMode || !onProposeShift) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.planned_start || !task.planned_end) return;
    e.preventDefault();
    setDragState({
      type,
      taskId,
      startX: e.clientX,
      origStart: task.planned_start,
      origEnd: task.planned_end,
      currentStart: task.planned_start,
      currentEnd: task.planned_end,
    });
  }, [editMode, onProposeShift, tasks]);

  const handleDragMove = React.useCallback((e: MouseEvent) => {
    if (!dragState) return;
    const dx = e.clientX - dragState.startX;
    const dayDelta = Math.round(dx / dayWidth);
    if (dayDelta === 0) return;
    const task = tasks.find(t => t.id === dragState.taskId);
    if (!task || !task.planned_start || !task.planned_end) return;
    const origStart = parseISO(task.planned_start);
    const origEnd = parseISO(task.planned_end);
    let newStart: Date;
    let newEnd: Date;
    if (dragState.type === "move") {
      newStart = addDays(origStart, dayDelta);
      newEnd = addDays(origEnd, dayDelta);
    } else if (dragState.type === "resize-left") {
      newStart = addDays(origStart, dayDelta);
      newEnd = origEnd;
      if (newStart >= origEnd) newStart = addDays(origEnd, -1);
    } else {
      newStart = origStart;
      newEnd = addDays(origEnd, dayDelta);
      if (newEnd <= origStart) newEnd = addDays(origStart, 1);
    }
    setDragState(prev => prev ? { ...prev, currentStart: format(newStart, "yyyy-MM-dd"), currentEnd: format(newEnd, "yyyy-MM-dd") } : null);
  }, [dragState, dayWidth, tasks]);

  const handleDragEnd = React.useCallback(() => {
    if (!dragState || !onProposeShift) return;
    if (dragState.currentStart !== dragState.origStart || dragState.currentEnd !== dragState.origEnd) {
      onProposeShift({
        taskId: dragState.taskId,
        title: tasks.find(t => t.id === dragState.taskId)?.title ?? "",
        code: tasks.find(t => t.id === dragState.taskId)?.code ?? null,
        planned_start: dragState.currentStart,
        planned_end: dragState.currentEnd,
      });
    }
    setDragState(null);
  }, [dragState, onProposeShift, tasks]);

  React.useEffect(() => {
    if (!dragState) return;
    const onMove = (e: MouseEvent) => handleDragMove(e);
    const onUp = () => handleDragEnd();
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragState, handleDragMove, handleDragEnd]);

  // ── Link drag-and-drop state ──────────────────────────────────────────
  const chartRef = React.useRef<HTMLDivElement>(null);
  const [linkDrag, setLinkDrag] = React.useState<{
    fromTaskId: string;
    fromEnd: LinkEnd;
    fromX: number;
    fromY: number;
    cursorX: number;
    cursorY: number;
  } | null>(null);

  const handleLinkStart = React.useCallback((e: React.MouseEvent, taskId: string, end: LinkEnd) => {
    if (editMode || !onCreateLink) return;
    e.preventDefault();
    e.stopPropagation();
    const chart = chartRef.current;
    if (!chart) return;
    const rect = chart.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setLinkDrag({ fromTaskId: taskId, fromEnd: end, fromX: x, fromY: y, cursorX: x, cursorY: y });
  }, [editMode, onCreateLink]);

  React.useEffect(() => {
    if (!linkDrag) return;
    const onMove = (e: MouseEvent) => {
      const chart = chartRef.current;
      if (!chart) return;
      const rect = chart.getBoundingClientRect();
      setLinkDrag(prev => prev ? { ...prev, cursorX: e.clientX - rect.left, cursorY: e.clientY - rect.top } : null);
    };
    const onUp = (e: MouseEvent) => {
      const target = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
      const handle = target?.closest("[data-link-handle]") as HTMLElement | null;
      const drag = linkDrag;
      setLinkDrag(null);
      if (!drag || !handle || !onCreateLink) return;
      const toTaskId = handle.getAttribute("data-task-id");
      const toEnd = handle.getAttribute("data-link-handle") as LinkEnd | null;
      if (!toTaskId || !toEnd) return;
      if (toTaskId === drag.fromTaskId) {
        toast.error("Cannot link a task to itself");
        return;
      }
      // Map (fromEnd, toEnd) → relation
      // predecessor end → successor end
      const map: Record<string, "FS" | "SS" | "FF" | "SF"> = {
        "finish:start": "FS",
        "start:start": "SS",
        "finish:finish": "FF",
        "start:finish": "SF",
      };
      const relation = map[`${drag.fromEnd}:${toEnd}`];
      if (!relation) return;
      onCreateLink(drag.fromTaskId, toTaskId, relation);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [linkDrag, onCreateLink]);

  const taskRowIndex = React.useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach((row, index) => {
      if (row.kind === "task") map.set(row.id, index);
    });
    return map;
  }, [rows]);

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
    <>
      <div className="h-full overflow-hidden bg-background flex flex-col">
        <div className="flex flex-col overflow-hidden flex-1">
          <div className="flex items-center justify-between gap-3 border-b bg-background/95 px-4 backdrop-blur-sm z-30" style={{ height: TITLE_H }}>
            <div className="flex items-center gap-4">
                <div>
                 <div className="text-sm font-semibold text-foreground">Gantt Schedule</div>
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

              {onEditModeChange && (
                <Button
                  size="sm"
                  variant={editMode ? "default" : "outline"}
                  className={cn("h-8 rounded-lg px-3 text-xs gap-1.5", editMode && "bg-primary/10 border-primary/30 text-primary hover:bg-primary/20")}
                  onClick={() => onEditModeChange(!editMode)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  {editMode ? "Editing" : "Edit"}
                </Button>
              )}

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

                          const status = taskStatus(row.task, today);
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
                           const bStart = safeDate(baseline?.baseline_start ?? null);
                           const bEnd = safeDate(baseline?.baseline_end ?? null);
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
                            const isDragging = dragState?.taskId === row.task.id;
                            return (
                              <div className="absolute inset-0">
                                    {baselineEl}
                                    <div
                                      className={cn(
                                        "absolute top-[50%] -translate-y-[50%] h-4 w-4 rotate-45 border-2 shadow-sm cursor-pointer transition-all z-20",
                                        barTone,
                                        isSelected && "ring-2 ring-primary ring-offset-2 scale-110",
                                        isSecond && "ring-2 ring-green-500 ring-offset-2 bg-green-500/20 scale-110",
                                        isDragging && "opacity-50",
                                      )}
                                      style={{ left: left + dayWidth / 2 - 8 }}
                                      onClick={() => onTaskSelect?.(row.task.id, false)}
                                      onMouseDown={(e) => handleDragStart(e, row.task.id, "move")}
                                    />
                                    {row.task.constraint_type && (
                                      <div
                                        className="absolute top-0 text-[9px] font-bold text-warning"
                                        style={{ left: left + dayWidth / 2 + 12 }}
                                        title={`${CONSTRAINT_TYPE_LABELS[row.task.constraint_type as ConstraintType]}${row.task.constraint_date ? `: ${row.task.constraint_date}` : ""}`}
                                      >
                                        ●
                                      </div>
                                    )}
                                  </div>);
                          }

                          const isDragging = dragState?.taskId === row.task.id;
                          const cpmEntry = cpmMap?.get(row.task.id);
                          const totalFloat = cpmEntry?.totalFloat ?? 0;
                          const slackWidth = showCritical && !isCritical && totalFloat > 0 ? totalFloat * dayWidth : 0;
                          const ghostLeft = isDragging && dragState
                            ? differenceInCalendarDays(parseISO(dragState.currentStart), range.start) * dayWidth
                            : left;
                          const ghostWidth = isDragging && dragState
                            ? (differenceInCalendarDays(parseISO(dragState.currentEnd), parseISO(dragState.currentStart)) + 1) * dayWidth
                            : width;

                          return (
                            <div className="absolute inset-0">
                                  {baselineEl}
                                  {/* Slack ribbon */}
                                  {slackWidth > 0 && (
                                    <div
                                      className="absolute top-[12px] h-3 rounded-r-full border-l-0 border border-muted-foreground/20 bg-muted-foreground/5 pointer-events-none z-[5]"
                                      style={{ left: left + width, width: slackWidth }}
                                      title={`Slack: ${totalFloat} day${totalFloat !== 1 ? "s" : ""}`}
                                    />
                                  )}
                                  {/* Drag ghost preview */}
                                  {isDragging && (ghostLeft !== left || ghostWidth !== width) && (
                                    <div
                                      className="absolute top-[8px] h-5 rounded-full border-2 border-dashed border-primary/40 bg-primary/10 pointer-events-none z-20"
                                      style={{ left: ghostLeft, width: Math.max(dayWidth, ghostWidth) }}
                                    />
                                  )}
                                  {/* Constraint indicator */}
                                  {row.task.constraint_type && (
                                    <div
                                      className="absolute -top-0.5 text-[10px] font-bold text-warning z-20 cursor-help"
                                      style={{ left: left + width + 4 }}
                                      title={`${CONSTRAINT_TYPE_LABELS[row.task.constraint_type as ConstraintType]}${row.task.constraint_date ? `: ${row.task.constraint_date}` : ""}`}
                                    >
                                      ⚑
                                    </div>
                                  )}
                                  {/* Task bar */}
                                  <div
                                    className={cn(
                                      "absolute top-[8px] h-5 rounded-full border shadow-sm overflow-hidden transition-all z-10",
                                      barTone,
                                      isSelected && "ring-2 ring-primary ring-offset-1 scale-[1.02]",
                                      isSecond && "ring-2 ring-green-500 ring-offset-1 bg-green-500/20 scale-[1.02]",
                                      isDragging && "opacity-50",
                                      editMode && "cursor-grab active:cursor-grabbing",
                                    )}
                                    style={{ left, width: Math.max(dayWidth, width) }}
                                    onClick={() => onTaskSelect?.(row.task.id, false)}
                                    onMouseDown={(e) => handleDragStart(e, row.task.id, "move")}
                                  >
                                    <div
                                      className="h-full bg-foreground/20"
                                      style={{ width: `${Math.min(100, row.task.progress_pct)}%` }}
                                    />
                                    {/* Drag handles (visible in edit mode) */}
                                    {editMode && (
                                      <>
                                        <div
                                          className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize z-20 hover:bg-foreground/10 rounded-l-full"
                                          onMouseDown={(e) => { e.stopPropagation(); handleDragStart(e, row.task.id, "resize-left"); }}
                                        />
                                        <div
                                          className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize z-20 hover:bg-foreground/10 rounded-r-full"
                                          onMouseDown={(e) => { e.stopPropagation(); handleDragStart(e, row.task.id, "resize-right"); }}
                                        />
                                      </>
                                    )}
                                  </div>
                                </div>);
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
                              </div>);
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
    </>


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
