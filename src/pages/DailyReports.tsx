import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Plus, ClipboardCheck, CalendarDays } from "lucide-react";
import { useProjects } from "@/contexts/ProjectContext";
import { useAuth } from "@/contexts/AuthContext";
import { useDsrList } from "@/hooks/useDailyReport";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { DSR_STATUS_LABELS, DSR_STATUS_TONE, DsrStatus } from "@/lib/dsrMeta";
import { toast } from "sonner";

export default function DailyReports() {
  const { activeProject } = useProjects();
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const { data: rows = [], isLoading, refetch } = useDsrList(activeProject?.id);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const canCreate =
    hasRole("admin") || hasRole("project_manager") || hasRole("engineer") || hasRole("supervisor");

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (search && !r.report_date.includes(search) && !(r.weather ?? "").toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [rows, statusFilter, search]);

  const stats = useMemo(() => {
    const week = new Date();
    week.setDate(week.getDate() - 7);
    const recent = rows.filter((r) => new Date(r.report_date) >= week);
    return {
      total: rows.length,
      thisWeek: recent.length,
      pending: rows.filter((r) => r.status === "submitted").length,
      approved: rows.filter((r) => r.status === "approved").length,
    };
  }, [rows]);

  const onCreateToday = async () => {
    if (!activeProject || !user) return;
    const today = format(new Date(), "yyyy-MM-dd");
    const existing = rows.find((r) => r.report_date === today);
    if (existing) {
      navigate(`/daily-reports/${existing.id}`);
      return;
    }
    const { data, error } = await supabase
      .from("daily_site_reports")
      .insert({
        project_id: activeProject.id,
        report_date: today,
        site_status: "working",
        status: "draft",
        created_by: user.id,
      })
      .select("id")
      .single();
    if (error) {
      toast.error(error.message);
      return;
    }
    refetch();
    navigate(`/daily-reports/${data.id}`);
  };

  if (!activeProject) {
    return <div className="text-muted-foreground">Select a project to view daily reports.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6" /> Daily Site Reports
          </h1>
          <p className="text-sm text-muted-foreground">
            Capture daily site progress, manpower, equipment, delays and photos.
          </p>
        </div>
        {canCreate && (
          <Button onClick={onCreateToday}>
            <Plus className="h-4 w-4 mr-1" /> New / Open today's report
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Total reports" value={stats.total} />
        <KpiCard label="This week" value={stats.thisWeek} />
        <KpiCard label="Awaiting approval" value={stats.pending} />
        <KpiCard label="Approved" value={stats.approved} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-3 flex-wrap space-y-0">
          <CardTitle className="text-base">Reports</CardTitle>
          <div className="ml-auto flex gap-2 items-center">
            <Input
              placeholder="Search date or weather…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-56"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {(Object.keys(DSR_STATUS_LABELS) as DsrStatus[]).map((s) => (
                  <SelectItem key={s} value={s}>{DSR_STATUS_LABELS[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Site</TableHead>
                <TableHead>Weather</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="text-right">Open</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow><TableCell colSpan={6} className="text-muted-foreground py-6">Loading…</TableCell></TableRow>
              )}
              {!isLoading && filtered.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-muted-foreground py-10 text-center">
                  <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  No reports yet. Click <b>New / Open today's report</b> to start.
                </TableCell></TableRow>
              )}
              {filtered.map((r) => {
                const tone = DSR_STATUS_TONE[r.status as DsrStatus];
                return (
                  <TableRow key={r.id} className="cursor-pointer" onClick={() => navigate(`/daily-reports/${r.id}`)}>
                    <TableCell className="font-medium">{format(new Date(r.report_date), "EEE, dd MMM yyyy")}</TableCell>
                    <TableCell>
                      <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium", tone.bg, tone.fg)}>
                        <span className={cn("h-1.5 w-1.5 rounded-full", tone.dot)} />
                        {DSR_STATUS_LABELS[r.status as DsrStatus]}
                      </span>
                    </TableCell>
                    <TableCell className="capitalize">{r.site_status}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{r.weather ?? "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {r.submitted_at ? format(new Date(r.submitted_at), "dd MMM HH:mm") : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost">Open</Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
        <div className="text-2xl font-bold mt-1">{value}</div>
      </CardContent>
    </Card>
  );
}
