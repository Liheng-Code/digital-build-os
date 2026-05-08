import * as React from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet";
import { ArrowUpDown, Download, Loader2, ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { invokeXlsxDownload } from "@/lib/xlsxDownload";
import type { AuditLogV2Row, AuditSeverity } from "@/lib/coreEngineMeta";
import { AUDIT_SEVERITY_LABELS } from "@/lib/coreEngineMeta";
import type { Json } from "@/integrations/supabase/types";

interface CoreQueryResult<T> {
  data: T[] | null;
  error: { message: string } | null;
}

interface CoreQuery<T> extends PromiseLike<CoreQueryResult<T>> {
  eq(column: string, value: unknown): CoreQuery<T>;
  gte(column: string, value: unknown): CoreQuery<T>;
  lte(column: string, value: unknown): CoreQuery<T>;
  order(column: string, options?: { ascending?: boolean }): CoreQuery<T>;
  range(from: number, to: number): CoreQuery<T>;
  in(column: string, values: unknown[]): CoreQuery<T>;
}

interface CoreTable<T> {
  select(columns: string): CoreQuery<T>;
}

interface CoreClient {
  from<T>(table: string): CoreTable<T>;
}

const auditDb = supabase as unknown as CoreClient;

const PAGE_SIZE = 200;
const MAX_ROWS = 2000;

type SortKey = "created_at" | "module_code" | "action_type" | "severity";

const SEVERITY_STYLES: Record<AuditSeverity, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-info-soft text-info",
  high: "bg-warning-soft text-warning",
  critical: "bg-destructive-soft text-destructive"
};

export default function AuditLog() {
  const { hasRole } = useAuth();
  const isAdmin = hasRole("admin");

  const [rows, setRows] = React.useState<AuditLogV2Row[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [exporting, setExporting] = React.useState(false);
  const [hasMore, setHasMore] = React.useState(true);

  const [moduleFilter, setModuleFilter] = React.useState("all");
  const [entityFilter, setEntityFilter] = React.useState("all");
  const [actionFilter, setActionFilter] = React.useState("all");
  const [severityFilter, setSeverityFilter] = React.useState<AuditSeverity | "all">("all");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [sortKey, setSortKey] = React.useState<SortKey>("created_at");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("desc");
  const [active, setActive] = React.useState<AuditLogV2Row | null>(null);

  const fetchPage = async (offset: number): Promise<AuditLogV2Row[]> => {
    let q = auditDb
      .from<AuditLogV2Row>("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);
    if (moduleFilter !== "all") q = q.eq("module_code", moduleFilter);
    if (entityFilter !== "all") q = q.eq("entity_type", entityFilter);
    if (actionFilter !== "all") q = q.eq("action_type", actionFilter);
    if (severityFilter !== "all") q = q.eq("severity", severityFilter);
    if (statusFilter !== "all") q = q.eq("status_to", statusFilter);
    if (dateFrom) q = q.gte("created_at", dateFrom);
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      q = q.lte("created_at", end.toISOString());
    }
    const { data, error } = await q;
    if (error) throw error;
    return data ?? [];
  };

  React.useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const first = await fetchPage(0);
        if (cancelled) return;
        setRows(first);
        setHasMore(first.length === PAGE_SIZE);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to load audit log");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, moduleFilter, entityFilter, actionFilter, severityFilter, statusFilter, dateFrom, dateTo]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const next = await fetchPage(rows.length);
      setRows((prev) => [...prev, ...next]);
      setHasMore(next.length === PAGE_SIZE && rows.length + next.length < MAX_ROWS);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load more");
    } finally {
      setLoadingMore(false);
    }
  };

  const exportXlsx = async () => {
    setExporting(true);
    try {
      await invokeXlsxDownload(
        "export-audit-xlsx",
        {
          entity_type: entityFilter,
          action: actionFilter,
          module_code: moduleFilter,
          severity: severityFilter,
          date_from: dateFrom || null,
          date_to: dateTo
            ? new Date(new Date(dateTo).setHours(23, 59, 59, 999)).toISOString()
            : null,
          search: search || null
        },
        `audit-log-${new Date().toISOString().slice(0, 10)}.xlsx`
      );
      toast.success("Excel file downloaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const moduleCodes = React.useMemo(
    () => Array.from(new Set(rows.map((r) => r.module_code))).sort(),
    [rows]
  );

  const entityTypes = React.useMemo(
    () => Array.from(new Set(rows.map((r) => r.entity_type))).sort(),
    [rows]
  );

  const actionTypes = React.useMemo(
    () => Array.from(new Set(rows.map((r) => r.action_type))).sort(),
    [rows]
  );

  const statuses = React.useMemo(
    () => Array.from(new Set(rows.map((r) => r.status_to).filter(Boolean) as string[])).sort(),
    [rows]
  );

  const filtered = React.useMemo(() => {
    if (!search) return rows;
    const s = search.toLowerCase();
    return rows.filter((r) =>
      [
        r.module_code,
        r.entity_type,
        r.entity_id ?? "",
        r.action_label,
        r.user_name_snapshot ?? "",
        r.comment ?? ""
      ].join(" ").toLowerCase().includes(s)
    );
  }, [rows, search]);

  const sorted = React.useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      const av = a[sortKey] ?? "";
      const bv = b[sortKey] ?? "";
      const cmp = String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [filtered, sortKey, sortDir]);

  const flipSort = (k: SortKey) => {
    if (sortKey === k) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortKey(k);
      setSortDir("desc");
    }
  };

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          <ShieldCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
          Admins only.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end gap-3">
        <div className="mr-auto">
          <h1 className="text-2xl font-bold">Audit Log</h1>
          <p className="text-sm text-muted-foreground">
            Cross-module traceability for data, workflow, approval, document, and admin events.
          </p>
        </div>
        <Button onClick={exportXlsx} disabled={exporting}>
          {exporting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Export Excel
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-end gap-2">
            <CardTitle className="text-base mr-auto self-center">Events</CardTitle>
            <Filter label="Search">
              <Input
                placeholder="record, actor, comment..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-48"
              />
            </Filter>
            <Filter label="Module">
              <OptionSelect value={moduleFilter} onValueChange={setModuleFilter} allLabel="All modules" values={moduleCodes} className="w-36" />
            </Filter>
            <Filter label="Entity">
              <OptionSelect value={entityFilter} onValueChange={setEntityFilter} allLabel="All entities" values={entityTypes} className="w-40" />
            </Filter>
            <Filter label="Action">
              <OptionSelect value={actionFilter} onValueChange={setActionFilter} allLabel="All actions" values={actionTypes} className="w-40" />
            </Filter>
            <Filter label="Severity">
              <Select value={severityFilter} onValueChange={(v) => setSeverityFilter(v as AuditSeverity | "all")}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All severity</SelectItem>
                  {(Object.keys(AUDIT_SEVERITY_LABELS) as AuditSeverity[]).map((severity) => (
                    <SelectItem key={severity} value={severity}>{AUDIT_SEVERITY_LABELS[severity]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Filter>
            <Filter label="Status To">
              <OptionSelect value={statusFilter} onValueChange={setStatusFilter} allLabel="All statuses" values={statuses} className="w-40" />
            </Filter>
            <Filter label="From">
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-36" />
            </Filter>
            <Filter label="To">
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-36" />
            </Filter>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : sorted.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">No events.</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortHead label="Time" k="created_at" sortKey={sortKey} sortDir={sortDir} onClick={flipSort} />
                    <TableHead>User</TableHead>
                    <SortHead label="Module" k="module_code" sortKey={sortKey} sortDir={sortDir} onClick={flipSort} />
                    <SortHead label="Action" k="action_type" sortKey={sortKey} sortDir={sortDir} onClick={flipSort} />
                    <TableHead>Record</TableHead>
                    <TableHead>Status Change</TableHead>
                    <SortHead label="Severity" k="severity" sortKey={sortKey} sortDir={sortDir} onClick={flipSort} />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sorted.map((r) => (
                    <TableRow key={r.id} className="cursor-pointer" onClick={() => setActive(r)}>
                      <TableCell className="text-xs whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</TableCell>
                      <TableCell className="text-sm">{r.user_name_snapshot ?? (r.is_system_generated ? "System" : "Unknown")}</TableCell>
                      <TableCell className="font-medium">{r.module_code}</TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">{r.action_label}</div>
                        <div className="text-xs text-muted-foreground">{r.action_type}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{r.entity_type}</div>
                        <div className="text-xs font-mono text-muted-foreground truncate max-w-[180px]">{r.entity_id ?? "-"}</div>
                      </TableCell>
                      <TableCell className="text-xs">
                        {r.status_from || r.status_to ? `${r.status_from ?? "-"} -> ${r.status_to ?? "-"}` : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge className={SEVERITY_STYLES[r.severity]}>{AUDIT_SEVERITY_LABELS[r.severity]}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between pt-4 text-xs text-muted-foreground">
                <span>Showing {sorted.length} of {rows.length} loaded{search && " (filtered)"}</span>
                {hasMore ? (
                  <Button variant="outline" size="sm" onClick={loadMore} disabled={loadingMore}>
                    {loadingMore && <Loader2 className="h-3 w-3 mr-2 animate-spin" />}
                    Load more
                  </Button>
                ) : (
                  rows.length > 0 && <span>End of results</span>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Sheet open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{active?.action_label}</SheetTitle>
            <SheetDescription>
              {active && new Date(active.created_at).toLocaleString()} / {active?.module_code} / {active?.entity_type}
            </SheetDescription>
          </SheetHeader>
          {active && (
            <div className="grid gap-4 mt-4">
              <Card>
                <CardContent className="p-4 grid gap-2 text-sm">
                  <Row label="Actor">{active.user_name_snapshot ?? (active.is_system_generated ? "System" : "Unknown")}</Row>
                  <Row label="Role">{active.user_role_snapshot ?? "-"}</Row>
                  <Row label="Status">{active.status_from || active.status_to ? `${active.status_from ?? "-"} -> ${active.status_to ?? "-"}` : "-"}</Row>
                  <Row label="Source">{active.source_channel}</Row>
                  <Row label="Comment">{active.comment ?? "-"}</Row>
                </CardContent>
              </Card>

              <BeforeAfterTable before={active.old_values} after={active.new_values} changedFields={active.changed_fields} />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Filter({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

function OptionSelect({
  value,
  onValueChange,
  allLabel,
  values,
  className
}: {
  value: string;
  onValueChange: (value: string) => void;
  allLabel: string;
  values: string[];
  className?: string;
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={className}><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{allLabel}</SelectItem>
        {values.map((item) => (
          <SelectItem key={item} value={item}>{item}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function SortHead({
  label,
  k,
  sortKey,
  sortDir,
  onClick
}: {
  label: string;
  k: SortKey;
  sortKey: SortKey;
  sortDir: "asc" | "desc";
  onClick: (k: SortKey) => void;
}) {
  const active = sortKey === k;
  return (
    <TableHead>
      <button type="button" onClick={() => onClick(k)} className="inline-flex items-center gap-1 hover:text-foreground transition-colors">
        {label}
        <ArrowUpDown className={`h-3 w-3 ${active ? "opacity-100" : "opacity-30"} ${active && sortDir === "asc" ? "rotate-180" : ""}`} />
      </button>
    </TableHead>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[130px_1fr] gap-3">
      <span className="text-xs uppercase text-muted-foreground">{label}</span>
      <span>{children}</span>
    </div>
  );
}

function BeforeAfterTable({
  before,
  after,
  changedFields
}: {
  before: Json | null;
  after: Json | null;
  changedFields: Json;
}) {
  const beforeRecord = isRecord(before) ? before : {};
  const afterRecord = isRecord(after) ? after : {};
  const fields = Array.isArray(changedFields) && changedFields.length > 0
    ? changedFields.map(String)
    : Array.from(new Set([...Object.keys(beforeRecord), ...Object.keys(afterRecord)]));

  if (fields.length === 0) {
    return (
      <Card>
        <CardContent className="p-4 text-sm text-muted-foreground">No before/after values recorded.</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Before / After</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Field</TableHead>
              <TableHead>Before</TableHead>
              <TableHead>After</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.map((field) => (
              <TableRow key={field}>
                <TableCell className="font-medium">{field}</TableCell>
                <TableCell className="text-xs font-mono max-w-[220px] break-words">{formatJsonValue(beforeRecord[field])}</TableCell>
                <TableCell className="text-xs font-mono max-w-[220px] break-words">{formatJsonValue(afterRecord[field])}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function isRecord(value: Json | null): value is Record<string, Json | undefined> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function formatJsonValue(value: Json | undefined): string {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}
