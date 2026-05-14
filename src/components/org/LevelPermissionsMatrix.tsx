import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  PERMISSION_MATRIX, ORG_LEVELS, ORG_LEVEL_LABELS, OrgLevel,
  PERM_LABELS, PERM_TONE, PermCode, APPROVAL_NOTES,
} from "@/lib/permissionMatrix";

interface Props {
  /** Optional: highlight a specific level column (e.g. for a selected member). */
  highlightLevel?: OrgLevel | null;
}

const LEGEND: PermCode[] = ["V", "C", "E", "D", "S", "A", "R"];

function PermBadge({ code }: { code: PermCode | null }) {
  if (!code) return <span className="text-muted-foreground/50">—</span>;
  return (
    <span className={cn("inline-block min-w-[28px] rounded-full px-2 py-0.5 text-[11px] font-bold tracking-wide", PERM_TONE[code])}>
      {code}
    </span>
  );
}

export function LevelPermissionsMatrix({ highlightLevel = null }: Props) {
  return (
    <div className="space-y-4">
      {/* Legend */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-2 pt-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mr-2">Legend</span>
          {LEGEND.map((c) => (
            <span key={c} className="inline-flex items-center gap-1.5 rounded-full border bg-muted/30 px-2.5 py-1 text-xs">
              <PermBadge code={c} /> {PERM_LABELS[c]}
            </span>
          ))}
          <span className="inline-flex items-center gap-1.5 rounded-full border bg-muted/30 px-2.5 py-1 text-xs">
            <span className="text-muted-foreground/50">—</span> No access
          </span>
        </CardContent>
      </Card>

      {/* Level chips */}
      <div className="flex flex-wrap gap-2">
        {ORG_LEVELS.map((lvl) => (
          <Badge
            key={lvl}
            variant={highlightLevel === lvl ? "default" : "outline"}
            className="gap-1.5 px-3 py-1 text-xs"
          >
            <span className="font-mono font-bold">{lvl}</span>
            <span className="font-medium">{ORG_LEVEL_LABELS[lvl]}</span>
          </Badge>
        ))}
      </div>

      {/* Module matrices */}
      <div className="grid gap-4">
        {PERMISSION_MATRIX.map((mod) => (
          <Card key={mod.key} className="overflow-hidden">
            <CardHeader className="bg-muted/30 py-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="text-lg">{mod.icon}</span>
                <span>{mod.label}</span>
                {mod.subtitle && (
                  <Badge variant="secondary" className="ml-auto text-[10px] font-normal">
                    {mod.subtitle}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-background">
                    <TableHead className="w-[40%]">Action</TableHead>
                    {ORG_LEVELS.map((lvl) => (
                      <TableHead
                        key={lvl}
                        className={cn(
                          "text-center text-xs",
                          highlightLevel === lvl && "bg-primary/10 text-primary",
                        )}
                      >
                        {lvl}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mod.actions.map((a) => (
                    <TableRow key={a.action}>
                      <TableCell className="font-medium text-sm">{a.action}</TableCell>
                      {ORG_LEVELS.map((lvl) => (
                        <TableCell
                          key={lvl}
                          className={cn(
                            "text-center",
                            highlightLevel === lvl && "bg-primary/5",
                          )}
                        >
                          <PermBadge code={a.perms[lvl]} />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Governance notes */}
      <Card>
        <CardContent className="grid gap-3 pt-4 sm:grid-cols-3">
          {APPROVAL_NOTES.map((n) => (
            <div key={n.title} className="rounded-lg border bg-muted/20 p-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{n.title}</div>
              <div className="text-xs leading-relaxed">{n.text}</div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
