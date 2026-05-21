import * as React from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ArrowUpDown, Download, Loader2, ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { invokeXlsxDownload } from "@/lib/xlsxDownload";

interface AuditRow {
  id: string;
  entity_type: string;
  entity_id: string | null;
  action: string;
  user_id: string | null;
  before_data: unknown;
  after_data: unknown;
  created_at: string;
}

interface ProfileLite {
  id: string;
  full_name: string;
}

const ACTION_COLORS: Record<string, string> = {
  create: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  update: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  delete: "bg-destructive/15 text-destructive",
};

const PAGE_SIZE = 200;
const MAX_ROWS = 2000;

type SortKey = "created_at" | "entity_type" | "action";

export default function AuditLog() {
  const { hasRole } = useAuth();
  const isAdmin = hasRole("admin");

  const [rows, setRows] = React.useState<AuditRow[]>([]);
  const [profiles, setProfiles] = React.useState<Record<string, string>>({});
  const [allActors, setAllActors] = React.useState<ProfileLite[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [exporting, setExporting] = React.useState(false);
  const [hasMore, setHasMore] = React.useState(true);

  const [entityFilter, setEntityFilter] = React.useState<string>("all");
  const [actionFilter, setActionFilter] = React.useState<string>("all");
  const [actorFilter, setActorFilter] = React.useState<string>("all");
  const [dateFrom, setDateFrom] = React.useState<string>("");
  const [dateTo, setDateTo] = React.useState<string>("");
  const [search, setSearch] = React.useState("");
  const [sortKey, setSortKey] = React.useState<SortKey>("created_at");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("desc");
  const [active, setActive] = React.useState<AuditRow | null>(null);

  // Load actor list once
  React.useEffect(() => {
    if (!isAdmin) return;
    supabase
      .from("profiles")
      .select("id, full_name")
      .order("full_name")
      .then(({ data }) => setAllActors((data ?? []) as ProfileLite[]));
  }, [isAdmin]);

  const fetchPage = async (offset: number): Promise<AuditRow[]> => {
    let q = supabase
      .from("audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);
    if (entityFilter !== "all") q = q.eq("entity_type", entityFilter);
    if (actionFilter !== "all") q = q.eq("action", actionFilter);
    if (actorFilter !== "all") q = q.eq("user_id", actorFilter);
    if (dateFrom) q = q.gte("created_at", dateFrom);
    if (dateTo) {
      // include the entire 'to' day
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      q = q.lte("created_at", end.toISOString());
    }
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as AuditRow[];
  };

  const hydrateProfiles = async (extra: AuditRow[]) => {
    const ids = Array.from(
      new Set(extra.map((r) => r.user_id).filter(Boolean) as string[]),
    ).filter((id) => !(id in profiles));
    if (!ids.length) return;
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", ids);
    setProfiles((prev) => {
      const next = { ...prev };
      (data ?? []).forEach((p: ProfileLite) => (next[p.id] = p.full_name));
      return next;
    });
  };

  // Load (or reload on filter change)
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
        await hydrateProfiles(first);
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
  }, [isAdmin, entityFilter, actionFilter, actorFilter, dateFrom, dateTo]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const next = await fetchPage(rows.length);
      setRows((prev) => [...prev, ...next]);
      setHasMore(next.length === PAGE_SIZE && rows.length + next.length < MAX_ROWS);
      await hydrateProfiles(next);
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
          user_id: actorFilter,
          date_from: dateFrom || null,
          date_to: dateTo
            ? new Date(new Date(dateTo).setHours(23, 59, 59, 999)).toISOString()
            : null,
          search: search || null,
        },
        `audit-log-${new Date().toISOString().slice(0, 10)}.xlsx`,
      );
      toast.success("Excel file downloaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const entityTypes = React.useMemo(
    () => Array.from(new Set(rows.map((r) => r.entity_type))).sort(),
    [rows],
  );

  const filtered = React.useMemo(() => {
    if (!search) return rows;
    const s = search.toLowerCase();
    return rows.filter((r) => {
      const haystack = `${r.entity_type} ${r.entity_id ?? ""} ${
        profiles[r.user_id ?? ""] ?? ""
      }`.toLowerCase();
      return haystack.includes(s);
    });
  }, [rows, search, profiles]);

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
            Append-only record of changes — sortable & filterable, exportable to Excel
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
                placeholder="entity, ID, actor…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-44"
              />
            </Filter>
            <Filter label="Actor">
              <Select value={actorFilter} onValueChange={setActorFilter}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All actors</SelectItem>
                  {allActors.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.full_name || "Unknown"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Filter>
            <Filter label="Entity">
              <Select value={entityFilter} onValueChange={setEntityFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All entities</SelectItem>
                  {entityTypes.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Filter>
            <Filter label="Action">
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All actions</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                </SelectContent>
              </Select>
            </Filter>
            <Filter label="From">
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-36"
              />
            </Filter>
            <Filter label="To">
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-36"
              />
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
                    <SortHead
                      label="When"
                      k="created_at"
                      sortKey={sortKey}
                      sortDir={sortDir}
                      onClick={flipSort}
                    />
                    <SortHead
                      label="Entity"
                      k="entity_type"
                      sortKey={sortKey}
                      sortDir={sortDir}
                      onClick={flipSort}
                    />
                    <SortHead
                      label="Action"
                      k="action"
                      sortKey={sortKey}
                      sortDir={sortDir}
                      onClick={flipSort}
                    />
                    <TableHead>Actor</TableHead>
                    <TableHead>Entity ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sorted.map((r) => (
                    <TableRow
                      key={r.id}
                      className="cursor-pointer"
                      onClick={() => setActive(r)}
                    >
                      <TableCell className="text-xs whitespace-nowrap">
                        {new Date(r.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="font-medium">{r.entity_type}</TableCell>
                      <TableCell>
                        <Badge
                          className={ACTION_COLORS[r.action] || ""}
                          variant="outline"
                        >
                          {r.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {profiles[r.user_id ?? ""] ??
                          (r.user_id ? "Unknown" : "System")}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground truncate max-w-[200px]">
                        {r.entity_id ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between pt-4 text-xs text-muted-foreground">
                <span>
                  Showing {sorted.length} of {rows.length} loaded
                  {search && " (filtered)"}
                </span>
                {hasMore ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadMore}
                    disabled={loadingMore}
                  >
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
            <SheetTitle>
              {active?.action} · {active?.entity_type}
            </SheetTitle>
            <SheetDescription>
              {active && new Date(active.created_at).toLocaleString()} ·{" "}
              {profiles[active?.user_id ?? ""] ?? "System"}
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-4 mt-4">
            {active?.before_data ? (
              <div>
                <div className="text-xs font-semibold text-muted-foreground mb-1">
                  Before
                </div>
                <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                  {JSON.stringify(active.before_data, null, 2)}
                </pre>
              </div>
            ) : null}
            {active?.after_data ? (
              <div>
                <div className="text-xs font-semibold text-muted-foreground mb-1">
                  After
                </div>
                <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                  {JSON.stringify(active.after_data, null, 2)}
                </pre>
              </div>
            ) : null}
          </div>
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

function SortHead({
  label,
  k,
  sortKey,
  sortDir,
  onClick,
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
      <button
        type="button"
        onClick={() => onClick(k)}
        className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
      >
        {label}
        <ArrowUpDown
          className={`h-3 w-3 ${active ? "opacity-100" : "opacity-30"} ${
            active && sortDir === "asc" ? "rotate-180" : ""
          }`}
        />
      </button>
    </TableHead>
  );
}
