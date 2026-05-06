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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ShieldCheck, Trash2, Plus } from "lucide-react";
import { useAuth, AppRole, ROLE_LABELS } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Member {
  id: string;
  full_name: string;
  employee_id: string | null;
  job_title: string | null;
  roles: AppRole[];
}

const ALL_ROLES: AppRole[] = [
  "admin",
  "project_manager",
  "engineer",
  "supervisor",
  "worker",
  "qaqc_inspector",
  "accountant",
];

export default function Team() {
  const { hasRole } = useAuth();
  const isAdmin = hasRole("admin");
  const [members, setMembers] = React.useState<Member[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [addingFor, setAddingFor] = React.useState<string | null>(null);
  const [newRole, setNewRole] = React.useState<AppRole>("worker");

  const load = async () => {
    setLoading(true);
    const [profilesRes, rolesRes] = await Promise.all([
      supabase.from("profiles").select("id,full_name,employee_id,job_title").order("full_name"),
      supabase.from("user_roles").select("user_id,role"),
    ]);
    const rolesByUser: Record<string, AppRole[]> = {};
    (rolesRes.data ?? []).forEach((r: any) => {
      rolesByUser[r.user_id] = [...(rolesByUser[r.user_id] ?? []), r.role];
    });
    const list: Member[] = (profilesRes.data ?? []).map((p: any) => ({
      ...p,
      roles: rolesByUser[p.id] ?? [],
    }));
    setMembers(list);
    setLoading(false);
  };

  React.useEffect(() => {
    if (isAdmin) load();
    else setLoading(false);
  }, [isAdmin]);

  const handleAddRole = async (userId: string) => {
    const member = members.find((m) => m.id === userId);
    if (member?.roles.includes(newRole)) {
      toast.error("User already has this role");
      return;
    }
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: newRole });
    if (error) toast.error(error.message);
    else {
      toast.success(`Added ${ROLE_LABELS[newRole]}`);
      setAddingFor(null);
      load();
    }
  };

  const handleRemoveRole = async (userId: string, role: AppRole) => {
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role", role);
    if (error) toast.error(error.message);
    else {
      toast.success(`Removed ${ROLE_LABELS[role]}`);
      load();
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
      <div>
        <h1 className="text-2xl font-bold">Team & Roles</h1>
        <p className="text-sm text-muted-foreground">Assign roles that govern access across the app</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Members</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead className="text-right">Add role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.full_name || "—"}</TableCell>
                    <TableCell>{m.employee_id || "—"}</TableCell>
                    <TableCell>{m.job_title || "—"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {m.roles.length === 0 ? (
                          <span className="text-xs text-muted-foreground">No roles</span>
                        ) : (
                          m.roles.map((r) => (
                            <Badge key={r} variant="secondary" className="gap-1">
                              {ROLE_LABELS[r]}
                              <button
                                onClick={() => handleRemoveRole(m.id, r)}
                                className="hover:text-destructive"
                                title="Remove"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {addingFor === m.id ? (
                        <div className="flex items-center justify-end gap-1">
                          <Select value={newRole} onValueChange={(v) => setNewRole(v as AppRole)}>
                            <SelectTrigger className="w-40 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ALL_ROLES.map((r) => (
                                <SelectItem key={r} value={r}>
                                  {ROLE_LABELS[r]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button size="sm" onClick={() => handleAddRole(m.id)}>
                            Add
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setAddingFor(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setAddingFor(m.id)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add role
                        </Button>
                      )}
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
