import * as React from "react";
import { Plus } from "lucide-react";
import { OrgMember, ORG_DEPT_TONE, getInitials } from "@/lib/orgMeta";
import { cn } from "@/lib/utils";

interface Props {
  member: OrgMember;
  onClick?: (m: OrgMember) => void;
  compact?: boolean;
  highlight?: boolean;
  avatarUrl?: string | null;
  onAddReport?: (m: OrgMember) => void;
}

export function OrgMemberCard({ member, onClick, compact, highlight, avatarUrl, onAddReport }: Props) {
  const tone = ORG_DEPT_TONE[member.department] ?? ORG_DEPT_TONE.management;
  return (
    <button
      type="button"
      onClick={() => onClick?.(member)}
      className={cn(
        "group relative w-full rounded-lg border bg-card text-left shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1",
        highlight && "ring-2 ring-primary",
        compact ? "p-2" : "p-3",
      )}
    >
      <span className={cn("absolute left-0 top-0 h-full w-1 rounded-l-lg", tone.bar)} aria-hidden />
      <div className="flex items-center gap-3 pl-1">
        <div
          className={cn(
            "flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold uppercase",
            !avatarUrl && tone.chip,
            compact ? "h-9 w-9 text-xs" : "h-11 w-11 text-sm",
          )}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt={member.full_name} className="h-full w-full object-cover" loading="lazy" />
          ) : (
            getInitials(member.full_name)
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className={cn("inline-flex items-center rounded px-1.5 py-0.5 font-mono text-[10px] font-bold", tone.chip)}>
              {member.employee_id}
            </span>
            <span className="truncate text-[10px] uppercase tracking-wider text-muted-foreground">
              {member.position}
            </span>
          </div>
          <div className={cn("truncate font-semibold text-foreground", compact ? "text-sm" : "text-base")}>
            {member.full_name}
          </div>
        </div>
        {onAddReport && (
          <div 
            onClick={(e) => { e.stopPropagation(); onAddReport(member); }}
            className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-muted rounded-md transition-all cursor-pointer"
            title={`Add report to ${member.full_name}`}
          >
            <Plus className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        )}
      </div>
    </button>
  );
}
