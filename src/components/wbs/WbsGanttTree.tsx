import { RefObject, UIEvent, useLayoutEffect, useRef, useState } from "react";
import { format, isValid, parseISO } from "date-fns";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useVirtualizer } from "@tanstack/react-virtual";
import { GanttRow } from "@/lib/wbsGanttRows";
import { cn } from "@/lib/utils";
import {
  NodeRollup,
  SCHEDULE_STATUS_DOT,
  SCHEDULE_STATUS_LABEL,
  SCHEDULE_STATUS_TONE,
  taskStatus,
  workingDaysBetween,
} from "@/lib/scheduleMeta";

interface Props {
  rows: GanttRow[];
  collapsed: Set<string>;
  onToggle: (id: string) => void;
  holidaySet: Set<string>;
  rollupByNode?: Map<string, NodeRollup>;
  projectRollup?: NodeRollup | null;
  bodyScrollRef: RefObject<HTMLDivElement>;
  onBodyScroll?: (event: UIEvent<HTMLDivElement>) => void;
  selectedTaskId?: string | null;
  onTaskSelect?: (taskId: string, isCtrlClick?: boolean) => void;
}

const ROW_H = 36;
const TITLE_H = 52;
const HEADER_H = 56;

const fmtDate = (s: string | null) => {
  if (!s) return "-";
  const d = parseISO(s);
  return isValid(d) ? format(d, "dd MMM") : "-";
};

export function WbsGanttTree({
  rows,
  collapsed = new Set<string>(),
  onToggle,
  holidaySet,
  rollupByNode,
  projectRollup,
  bodyScrollRef,
  onBodyScroll,
  selectedTaskId,
  onTaskSelect,
}: Props) {
  const today = new Date();
  const [scrollbarWidth, setScrollbarWidth] = useState(0);
  const headerRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => bodyScrollRef.current,
    estimateSize: () => ROW_H,
    overscan: 10,
  });

  // Sync header padding to match body scrollbar, observe resize
  useLayoutEffect(() => {
    const body = bodyScrollRef?.current;
    if (!body) return;

    const updateScrollbarWidth = () => {
      const width = body.offsetWidth - body.clientWidth;
      setScrollbarWidth(width);
    };

    updateScrollbarWidth();

    const observer = new ResizeObserver(updateScrollbarWidth);
    observer.observe(body);

    return () => observer.disconnect();
  }, [bodyScrollRef]);

  return (
    <div className="h-full min-h-0 overflow-hidden bg-[linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted))/0.35)]">
      <div className="flex items-center border-b bg-background/90 px-4" style={{ height: TITLE_H }}>
        <div>
          <div className="text-sm font-semibold text-foreground">WBS Schedule</div>
          <div className="text-[11px] text-muted-foreground">Hierarchy, duration, dates, progress, and status</div>
        </div>
      </div>
      <div
        ref={headerRef}
        className="border-b bg-muted/70 grid items-center text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground"
        style={{ height: HEADER_H, gridTemplateColumns: "80px minmax(200px,1fr) 66px 76px 76px 100px 80px 80px 80px 80px 50px 50px", paddingRight: scrollbarWidth }}
      >
        <div className="px-3 border-r h-full flex items-center">WBS</div>
        <div className="px-4 border-r h-full flex items-center">Task / Node Name</div>
        <div className="px-2 text-right border-r h-full flex items-center justify-end">Dur</div>
        <div className="px-2 text-right border-r h-full flex items-center justify-end">Start</div>
        <div className="px-2 text-right border-r h-full flex items-center justify-end">Finish</div>
        <div className="px-3 border-r h-full flex items-center">Status</div>
        <div className="px-3 text-right border-r h-full flex items-center justify-end">Prog</div>
        <div className="px-2 text-right border-r h-full flex items-center justify-end">PV ($)</div>
        <div className="px-2 text-right border-r h-full flex items-center justify-end">EV ($)</div>
        <div className="px-2 text-right border-r h-full flex items-center justify-end">AC ($)</div>
        <div className="px-2 text-center border-r h-full flex items-center justify-center">SPI</div>
        <div className="px-2 text-center h-full flex items-center justify-center">CPI</div>
      </div>

      <div ref={bodyScrollRef} onScroll={onBodyScroll} className="h-[calc(100%-108px)] overflow-auto">
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualItem) => {
            const r = rows[virtualItem.index];
            const index = virtualItem.index;
            let start: string | null = null;
            let end: string | null = null;
            let progress = 0;
            let statusKey: ReturnType<typeof taskStatus> = "not_started";
            
            // EVM defaults
            let pv = 0;
            let ev = 0;
            let ac = 0;
            let spi = 1;
            let cpi = 1;

            if (r.kind === "project") {
              if (projectRollup) {
                start = projectRollup.plannedStart;
                end = projectRollup.plannedEnd;
                progress = projectRollup.progressPct;
                statusKey = projectRollup.status;
                pv = projectRollup.plannedValue;
                ev = projectRollup.earnedValue;
                ac = projectRollup.actualCost;
                spi = projectRollup.spi;
                cpi = projectRollup.cpi;
              }
            } else if (r.kind === "task") {
              start = r.task.planned_start;
              end = r.task.planned_end;
              progress = r.task.progress_pct ?? 0;
              statusKey = taskStatus(r.task, today);
              pv = Number(r.task.budgeted_cost ?? 0);
              ev = pv * (progress / 100);
              ac = Number(r.task.actual_cost ?? 0);
              // Simplified individual task SPI/CPI
              spi = 1; // Need interpolated PV to calculate properly per task
              cpi = ac > 0 ? ev / ac : 1;
            } else {
              const rollup = rollupByNode?.get(r.id);
              if (rollup) {
                start = rollup.plannedStart;
                end = rollup.plannedEnd;
                progress = rollup.progressPct;
                statusKey = rollup.status;
                pv = rollup.plannedValue;
                ev = rollup.earnedValue;
                ac = rollup.actualCost;
                spi = rollup.spi;
                cpi = rollup.cpi;
              }
            }

            const duration = workingDaysBetween(start, end, holidaySet);
            const isSelected = r.kind === "task" && r.task.id === selectedTaskId;

            return (
              <div
                key={virtualItem.key}
                className={cn(
                  "grid items-center text-sm border-b border-border/60 group absolute left-0 w-full",
                  index % 2 === 0 ? "bg-background/80" : "bg-muted/10",
                  r.kind === "project" && "bg-primary/8",
                  r.kind === "node" && "bg-muted/35",
                  isSelected && "ring-2 ring-primary ring-inset bg-primary/5",
                )}
                style={{
                  height: ROW_H,
                  gridTemplateColumns: "80px minmax(200px,1fr) 66px 76px 76px 100px 80px 80px 80px 80px 50px 50px",
                  top: 0,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
                onClick={() => {
                  if (r.kind === "task" && onTaskSelect) {
                    onTaskSelect(r.task.id, false);
                  }
                }}
              >
                 {/* WBS CODE COLUMN */}
                 <div className="px-3 border-r h-full flex items-center font-mono text-[10px] text-muted-foreground truncate bg-muted/5 group-hover:bg-muted/20 transition-colors">
                   {r.kind === "project" ? r.code : r.kind === "node" ? r.node.code : r.task.code || "-"}
                 </div>

                {/* NAME COLUMN WITH INDENTATION */}
                 <div
                   className="flex items-center gap-1.5 min-w-0 pr-2 border-r h-full"
                   style={{ paddingLeft: r.depth * 16 + 8 }}
                 >
                   {/* ... name column content ... */}
                   {r.kind === "project" ? (
                     <>
                       <button
                         type="button"
                         onClick={(e) => {
                           e.stopPropagation();
                           onToggle(r.id);
                         }}
                         className="h-5 w-5 rounded-md inline-flex items-center justify-center text-muted-foreground hover:bg-background hover:text-foreground shrink-0 transition-colors"
                       >
                         <ChevronRight
                           className={cn(
                             "h-3.5 w-3.5 transition-transform",
                             !collapsed.has(r.id) && "rotate-90",
                           )}
                         />
                       </button>
                       <span className="truncate font-bold text-primary">{r.label}</span>
                     </>
                   ) : r.kind === "node" ? (
                    <>
                      {r.hasChildren ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggle(r.id);
                          }}
                          className="h-5 w-5 rounded-md inline-flex items-center justify-center text-muted-foreground hover:bg-background hover:text-foreground shrink-0 transition-colors"
                        >
                          <ChevronRight
                            className={cn(
                              "h-3.5 w-3.5 transition-transform",
                              !collapsed.has(r.id) && "rotate-90",
                            )}
                          />
                        </button>
                      ) : (
                        <span className="h-5 w-5 shrink-0" />
                      )}
                      <span className={cn(
                        "truncate font-semibold",
                        r.node.node_type === "building" && "text-foreground",
                        r.node.node_type === "level" && "text-foreground/95",
                        r.node.node_type === "zone" && "text-foreground/90",
                      )}>
                        {r.node.name}
                      </span>
                    </>
                  ) : (
                    <Link
                      to={`/tasks/${r.task.id}`}
                      className="ml-6 truncate hover:text-primary transition-colors flex items-center h-full min-w-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="truncate">{r.task.title}</span>
                    </Link>
                  )}
                </div>

                <div className="px-2 text-right tabular-nums text-xs text-muted-foreground border-r h-full flex items-center justify-end">
                  {duration > 0 ? duration : "-"}
                </div>

                <div className="px-2 text-right tabular-nums text-xs text-muted-foreground border-r h-full flex items-center justify-end">
                  {fmtDate(start)}
                </div>

                <div className="px-2 text-right tabular-nums text-xs text-muted-foreground border-r h-full flex items-center justify-end">
                  {fmtDate(end)}
                </div>

                <div className="px-3 border-r h-full flex items-center">
                  <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium", SCHEDULE_STATUS_TONE[statusKey])}>
                    <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", SCHEDULE_STATUS_DOT[statusKey])} />
                    <span className="truncate">{SCHEDULE_STATUS_LABEL[statusKey]}</span>
                  </span>
                </div>

                 <div className="px-3 flex items-center justify-end h-full tabular-nums text-xs font-medium border-r">
                   <span>{Math.round(progress)}%</span>
                 </div>

                 {/* EVM COLUMNS */}
                 <div className="px-2 text-right tabular-nums text-[11px] text-muted-foreground border-r h-full flex items-center justify-end">
                   {pv > 0 ? pv.toLocaleString(undefined, { maximumFractionDigits: 0 }) : "-"}
                 </div>
                 <div className="px-2 text-right tabular-nums text-[11px] text-muted-foreground border-r h-full flex items-center justify-end">
                   {ev > 0 ? ev.toLocaleString(undefined, { maximumFractionDigits: 0 }) : "-"}
                 </div>
                 <div className="px-2 text-right tabular-nums text-[11px] text-muted-foreground border-r h-full flex items-center justify-end">
                   {ac > 0 ? ac.toLocaleString(undefined, { maximumFractionDigits: 0 }) : "-"}
                 </div>
                 <div className={cn("px-2 text-center tabular-nums text-[11px] font-bold border-r h-full flex items-center justify-center", spi < 0.9 ? "text-destructive" : spi < 1.0 ? "text-warning" : "text-success")}>
                   {spi.toFixed(2)}
                 </div>
                 <div className={cn("px-2 text-center tabular-nums text-[11px] font-bold h-full flex items-center justify-center", cpi < 0.9 ? "text-destructive" : cpi < 1.0 ? "text-warning" : "text-success")}>
                   {cpi.toFixed(2)}
                 </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
