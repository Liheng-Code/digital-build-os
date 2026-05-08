import * as React from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Search, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ROLE_LABELS, AppRole } from "@/contexts/AuthContext";
import { EMPLOYMENT_STATUS_LABELS, EmploymentStatus } from "@/lib/hrMeta";
import { cn } from "@/lib/utils";

interface Person {
  id: string;
  full_name: string;
  employee_id: string | null;
  job_title: string | null;
  phone: string | null;
  email: string | null;
  department: string | null;
  employment_status: string | null;
  hire_date: string | null;
  roles: string[];
}

export default function People() {
  const { hasRole } = useAuth();
  const isAdmin = hasRole("admin");
  const [people, setPeople] = React.useState<Person[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");

  const load = async () => {
    setLoading(true);
    const [profilesRes, rolesRes] = await Promise.all([
      supabase.from("profiles").select("*").order("full_name"),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    const rolesByUser: Record<string, string[]> = {};
    (rolesRes.data ?? []).forEach((r: any) => {
      rolesByUser[r.user_id] = [...(rolesByUser[r.user_id] ?? []), r.role];
    });
    setPeople((profilesRes.data ?? []).map((p: any) => ({
      ...p,
      roles: rolesByUser[p.id] ?? [],
    })));
    setLoading(false);
  };

  React.useEffect(() => { load(); }, []);

  const filtered = search
    ? people.filter((p) =>
        [p.full_name, p.employee_id, p.job_title, p.department, p.email]
          .some((f) => f?.toLowerCase().includes(search.toLowerCase())),
      )
    : people;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">People</h1>
        <p className="text-muted-foreground">Employee directory</p>
      </div>

      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, ID, title, department..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="font-medium">No employees found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Job Title</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Roles</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.full_name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{p.employee_id ?? "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{p.job_title ?? "—"}</TableCell>
                    <TableCell className="text-sm">{p.department ?? "—"}</TableCell>
                    <TableCell>
                      <span className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                        p.employment_status === "active" ? "bg-success-soft text-success" :
                        p.employment_status === "probation" ? "bg-warning-soft text-warning" :
                        "bg-muted text-muted-foreground",
                      )}>
                        {p.employment_status ? EMPLOYMENT_STATUS_LABELS[p.employment_status as EmploymentStatus] ?? p.employment_status : "Active"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {p.roles.map((r) => (
                          <Badge key={r} variant="secondary" className="text-[10px]">
                            {ROLE_LABELS[r as AppRole] ?? r}
                          </Badge>
                        ))}
                        {p.roles.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
