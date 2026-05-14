import * as React from "react";
import {
  ORG_REGISTRY, ORG_DEPT_LABELS, ORG_DEPT_TONE, OrgDepartment, OrgMember, membersByDepartment,
} from "@/lib/orgMeta";
import { OrgMemberCard } from "./OrgMemberCard";
import { Building2, HardHat, ShoppingCart, Users, Calculator, Layout, Wrench, Plus, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const DEPT_ICONS: Record<OrgDepartment, React.ComponentType<{ className?: string }>> = {
  management: Building2,
  architecture: Layout,
  structural: Wrench,
  procurement: ShoppingCart,
  construction: HardHat,
  hr: Users,
  accounting: Calculator,
  mep: Zap,
};

interface Props {
  members?: OrgMember[];
  onMemberClick?: (m: OrgMember) => void;
  filterDepartment?: OrgDepartment | "all";
  compact?: boolean;
  highlightId?: string | null;
  avatarMap?: Record<string, string | null | undefined>;
  onAddMember?: (department: OrgDepartment) => void;
  onAddReport?: (m: OrgMember) => void;
}

const ORDER_STORAGE_KEY = "org-chart-dept-order-v1";
const DEFAULT_DEPT_ORDER: OrgDepartment[] = ["architecture", "structural", "procurement", "construction", "hr", "accounting", "mep"];

function loadSavedOrder(): OrgDepartment[] {
  try {
    const raw = localStorage.getItem(ORDER_STORAGE_KEY);
    if (!raw) return DEFAULT_DEPT_ORDER;
    const parsed = JSON.parse(raw) as OrgDepartment[];
    const valid = parsed.filter((d) => DEFAULT_DEPT_ORDER.includes(d));
    DEFAULT_DEPT_ORDER.forEach((d) => { if (!valid.includes(d)) valid.push(d); });
    return valid;
  } catch {
    return DEFAULT_DEPT_ORDER;
  }
}

export function OrgChart({ members = ORG_REGISTRY, onMemberClick, filterDepartment = "all", compact, highlightId, avatarMap = {}, onAddMember, onAddReport }: Props) {
  const visible = filterDepartment === "all" ? members : members.filter((m) => m.department === filterDepartment || m.department === "management");
  const grouped = membersByDepartment(visible);

  // Top management chain (L1 → L2 → L3)
  const mgmt = grouped.management;

  const [deptOrder, setDeptOrder] = React.useState<OrgDepartment[]>(loadSavedOrder);
  const [dragKey, setDragKey] = React.useState<OrgDepartment | null>(null);
  const [overKey, setOverKey] = React.useState<OrgDepartment | null>(null);

  React.useEffect(() => {
    localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(deptOrder));
  }, [deptOrder]);

  const visibleDepts = filterDepartment === "all"
    ? deptOrder
    : deptOrder.filter((d) => d === filterDepartment);

  const handleDragStart = (dept: OrgDepartment) => (e: React.DragEvent) => {
    setDragKey(dept);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", dept);
  };
  const handleDragOver = (dept: OrgDepartment) => (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (overKey !== dept) setOverKey(dept);
  };
  const handleDrop = (dept: OrgDepartment) => (e: React.DragEvent) => {
    e.preventDefault();
    const from = dragKey;
    setDragKey(null);
    setOverKey(null);
    if (!from || from === dept) return;
    setDeptOrder((prev) => {
      const next = prev.filter((d) => d !== from);
      const idx = next.indexOf(dept);
      next.splice(idx, 0, from);
      return next;
    });
  };
  const handleDragEnd = () => { setDragKey(null); setOverKey(null); };

  return (
    <div className="space-y-6">
      {/* Top management chain */}
      {mgmt.length > 0 && (
        <div className="flex flex-col items-center gap-2">
          {mgmt.map((m, i) => (
            <React.Fragment key={m.employee_id}>
              <div className="w-full max-w-md">
                <OrgMemberCard member={m} onClick={onMemberClick} compact={compact} highlight={highlightId === m.employee_id} avatarUrl={avatarMap[m.employee_id]} onAddReport={onAddReport} />
              </div>
              {i < mgmt.length - 1 && <div className="h-4 w-px bg-border" aria-hidden />}
            </React.Fragment>
          ))}
          {visibleDepts.length > 0 && <div className="h-4 w-px bg-border" aria-hidden />}
        </div>
      )}

      {/* Department columns (drag to reorder) */}
      {visibleDepts.length > 0 && (
        <div
          className={cn(
            "grid gap-4",
            visibleDepts.length === 1
              ? "grid-cols-1 max-w-md mx-auto"
              : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6",
          )}
        >
          {visibleDepts.map((dept) => {
            const tone = ORG_DEPT_TONE[dept];
            const Icon = DEPT_ICONS[dept];
            const list = grouped[dept];
            const isDragging = dragKey === dept;
            const isOver = overKey === dept && dragKey !== dept;
            return (
              <div
                key={dept}
                draggable={filterDepartment === "all"}
                onDragStart={handleDragStart(dept)}
                onDragOver={handleDragOver(dept)}
                onDrop={handleDrop(dept)}
                onDragEnd={handleDragEnd}
                onDragLeave={() => overKey === dept && setOverKey(null)}
                className={cn(
                  "flex flex-col rounded-lg border bg-card overflow-hidden transition-all",
                  filterDepartment === "all" && "cursor-grab active:cursor-grabbing",
                  isDragging && "opacity-50 scale-[0.98]",
                  isOver && "ring-2 ring-primary ring-offset-1",
                )}
              >
                <div className={cn("flex items-center gap-2 px-3 py-2.5", tone.headerBg, tone.headerFg)}>
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-bold tracking-wide">{ORG_DEPT_LABELS[dept]}</span>
                  <div className="ml-auto flex items-center gap-1">
                    <span className="text-xs opacity-80">{list.length}</span>
                    {onAddMember && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onAddMember(dept); }}
                        className="p-1 hover:bg-white/20 rounded transition-colors"
                        title={`Add member to ${ORG_DEPT_LABELS[dept]}`}
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex-1 space-y-2 p-2">
                  {list.length === 0 ? (
                    <div className="py-6 text-center text-xs text-muted-foreground">No members</div>
                  ) : (
                    list.map((m) => (
                      <OrgMemberCard key={m.employee_id} member={m} onClick={onMemberClick} compact highlight={highlightId === m.employee_id} avatarUrl={avatarMap[m.employee_id]} onAddReport={onAddReport} />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
