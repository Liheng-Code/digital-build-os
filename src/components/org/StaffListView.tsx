import * as React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Download, Mail, Phone, Pencil } from "lucide-react";
import { OrgMemberRow, OrgDepartmentRow } from "@/services/organizationService";
import { getInitials, ORG_DEPT_TONE, OrgDepartment } from "@/lib/orgMeta";
import { ROLE_LABELS } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface Props {
  members: OrgMemberRow[];
  departments: OrgDepartmentRow[];
  onEdit?: (m: OrgMemberRow) => void;
  canEdit?: boolean;
}

export function StaffListView({ members, departments, onEdit, canEdit }: Props) {
  const [search, setSearch] = React.useState("");
  const [dept, setDept] = React.useState<string>("all");
  const [status, setStatus] = React.useState<string>("all");

  const memberById = React.useMemo(() => {
    const map: Record<string, OrgMemberRow> = {};
    members.forEach((m) => { if (m.employee_id) map[m.employee_id] = m; });
    return map;
  }, [members]);

  const STATUS_OPTIONS = ["active", "probation", "on_leave", "inactive", "terminated", "resigned"];

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return members.filter((m) => {
      if (dept !== "all" && m.department !== dept) return false;
      if (status !== "all" && m.employment_status !== status) return false;
      if (!q) return true;
      return (
        m.full_name.toLowerCase().includes(q) ||
        (m.employee_id ?? "").toLowerCase().includes(q) ||
        (m.email ?? "").toLowerCase().includes(q) ||
        (m.job_title ?? "").toLowerCase().includes(q)
      );
    });
  }, [members, search, dept, status]);

  const exportCsv = () => {
    const cols = ["employee_id", "full_name", "job_title", "department", "status", "level", "email", "phone", "report_to", "roles"];
    const rows = filtered.map((m) => [
      m.employee_id ?? "",
      m.full_name,
      m.job_title ?? "",
      m.department ?? "",
      m.employment_status ?? "active",
      m.level ?? "",
      m.email ?? "",
      m.phone ?? "",
      m.report_to_employee_id ? `${m.report_to_employee_id} ${memberById[m.report_to_employee_id]?.full_name ?? ""}`.trim() : "",
      m.roles.join("|"),
    ]);
    const csv = [cols.join(","), ...rows.map((r) => r.map((c) => `"${(c ?? "").toString().replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `staff-list-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, ID, email, job title..." className="pl-8" />
        </div>
        <Select value={dept} onValueChange={setDept}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Department" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All departments</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d.key} value={d.key}>{d.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>{s.replace(/_/g, " ").charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={exportCsv} className="gap-2">
          <Download className="h-4 w-4" /> CSV
        </Button>
        <Badge variant="outline">{filtered.length} of {members.length}</Badge>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="w-[60px]"></TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Reports to</TableHead>
              <TableHead>Roles</TableHead>
              {canEdit && <TableHead className="w-[60px]"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canEdit ? 12 : 11} className="text-center text-sm text-muted-foreground py-10">
                  No staff match the filters.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((m) => {
                const tone = m.department && (m.department in ORG_DEPT_TONE) ? ORG_DEPT_TONE[m.department as OrgDepartment] : null;
                const reportTo = m.report_to_employee_id ? memberById[m.report_to_employee_id] : null;
                return (
                  <TableRow key={m.id}>
                    <TableCell>
                      <div className={cn("flex h-9 w-9 items-center justify-center overflow-hidden rounded-full text-xs font-semibold uppercase", !m.avatar_url && (tone?.chip ?? "bg-muted"))}>
                        {m.avatar_url
                          ? <img src={m.avatar_url} alt={m.full_name} className="h-full w-full object-cover" loading="lazy" />
                          : getInitials(m.full_name)}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{m.employee_id ?? "—"}</TableCell>
                    <TableCell className="font-medium">{m.full_name}</TableCell>
                    <TableCell className="text-sm">{m.job_title ?? "—"}</TableCell>
                    <TableCell>
                      {m.department ? (
                        <Badge variant="secondary" className="text-xs">
                          {departments.find((d) => d.key === m.department)?.label ?? m.department}
                        </Badge>
                      ) : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={m.employment_status === "active" ? "success" : m.employment_status === "resigned" ? "destructive" : "outline"} className="text-[10px] capitalize">
                        {m.employment_status?.replace(/_/g, " ") ?? "active"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{m.level ?? "—"}</TableCell>
                    <TableCell className="text-xs">
                      {m.email ? (
                        <a href={`mailto:${m.email}`} className="inline-flex items-center gap-1 hover:underline">
                          <Mail className="h-3 w-3" /> {m.email}
                        </a>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-xs">
                      {m.phone ? (
                        <a href={`tel:${m.phone}`} className="inline-flex items-center gap-1 hover:underline">
                          <Phone className="h-3 w-3" /> {m.phone}
                        </a>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-xs">
                      {reportTo ? (
                        <span><span className="font-mono text-muted-foreground">{reportTo.employee_id}</span> {reportTo.full_name}</span>
                      ) : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {m.roles.length === 0 ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : m.roles.map((r) => (
                          <Badge key={r} variant="outline" className="text-[10px]">
                            {ROLE_LABELS[r as keyof typeof ROLE_LABELS] ?? r}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    {canEdit && (
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => onEdit?.(m)} aria-label="Edit member">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
