import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, Trash2, Plus, Search, Sparkles } from "lucide-react";
import {
  Department, DEPARTMENT_LABELS, DeptRole, DEPT_ROLE_LABELS,
} from "@/lib/departmentMeta";
import { DepartmentBadge } from "@/components/DepartmentBadge";

interface Row {
  id: string;
  user_id: string;
  department: Department;
  role_in_dept: DeptRole;
  created_at: string;
}
interface ProfileLite {
  id: string;
  full_name: string;
  job_title: string | null;
}

export function DepartmentMembersTab() {
  const [rows, setRows] = useState<Row[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileLite>>({});
  const [allUsers, setAllUsers] = useState<ProfileLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [filter, setFilter] = useState("");

  const [userId, setUserId] = useState("");
  const [department, setDepartment] = useState<Department | "">("");
  const [role, setRole] = useState<DeptRole>("member");

  const load = async () => {
    setLoading(true);
    const [memRes, profRes] = await Promise.all([
      supabase.from("department_members")
        .select("id,user_id,department,role_in_dept,created_at")
        .order("created_at", { ascending: false }),
      supabase.from("profiles").select("id, full_name, job_title").order("full_name"),
    ]);
    const map: Record<string, ProfileLite> = {};
    (profRes.data ?? []).forEach((p) => { map[p.id] = p as ProfileLite; });
    setProfiles(map);
    setAllUsers((profRes.data ?? []) as ProfileLite[]);
    setRows((memRes.data ?? []) as Row[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const onAdd = async () => {
    if (!userId || !department) {
      toast.error("Pick a user and a department");
      return;
    }
    setAdding(true);
    const { error } = await supabase.from("department_members").insert({
      user_id: userId,
      department: department as Department,
      role_in_dept: role,
    });
    setAdding(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Member added");
    setUserId(""); setDepartment(""); setRole("member");
    load();
  };

  const onRemove = async (id: string) => {
    const { error } = await supabase.from("department_members").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Member removed");
    load();
  };

  const onSeed = async () => {
    setSeeding(true);
    const { data, error } = await supabase.functions.invoke("seed-departments-demo");
    setSeeding(false);
    if (error) { toast.error(error.message); return; }
    const created = (data?.users ?? []).filter((u: { status: string }) => u.status === "created").length;
    const exists = (data?.users ?? []).filter((u: { status: string }) => u.status === "exists").length;
    toast.success(
      `Demo data seeded — ${created} new approver(s), ${exists} already existed. ` +
      `Password for demo accounts: ${data?.password ?? "Demo1234!"}`,
      { duration: 8000 },
    );
    load();
  };

  const visible = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const p = profiles[r.user_id];
      return (
        (p?.full_name ?? "").toLowerCase().includes(q) ||
        DEPARTMENT_LABELS[r.department].toLowerCase().includes(q)
      );
    });
  }, [rows, profiles, filter]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="space-y-1.5">
          <CardTitle className="text-base">Department members</CardTitle>
          <CardDescription>
            Assign users to a department. Approvers can move tasks into the approved/issued/PO/site-approved stages of their department.
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={onSeed} disabled={seeding} className="shrink-0">
          {seeding ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
          Seed demo data
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add form */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <Label>User</Label>
            <Select value={userId} onValueChange={setUserId}>
              <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
              <SelectContent>
                {allUsers.map((u) => (
                  <SelectItem key={u.id} value={u.id}>{u.full_name || u.id.slice(0, 8)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Department</Label>
            <Select value={department} onValueChange={(v) => setDepartment(v as Department)}>
              <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
              <SelectContent>
                {(Object.keys(DEPARTMENT_LABELS) as Department[]).map((d) => (
                  <SelectItem key={d} value={d}>{DEPARTMENT_LABELS[d]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as DeptRole)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(DEPT_ROLE_LABELS) as DeptRole[]).map((r) => (
                  <SelectItem key={r} value={r}>{DEPT_ROLE_LABELS[r]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button onClick={onAdd} disabled={adding} className="w-full">
              {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add
            </Button>
          </div>
        </div>

        {/* Filter */}
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filter by user or department..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Role</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">Loading...</TableCell></TableRow>
            ) : visible.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">No department members yet.</TableCell></TableRow>
            ) : visible.map((r) => {
              const p = profiles[r.user_id];
              return (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="font-medium">{p?.full_name || r.user_id.slice(0, 8)}</div>
                    {p?.job_title && <div className="text-xs text-muted-foreground">{p.job_title}</div>}
                  </TableCell>
                  <TableCell><DepartmentBadge department={r.department} /></TableCell>
                  <TableCell className="text-sm">{DEPT_ROLE_LABELS[r.role_in_dept]}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => onRemove(r.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
