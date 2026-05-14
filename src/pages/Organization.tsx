import * as React from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, AppRole, ROLE_LABELS } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, Network, ShieldCheck, Mail, Phone, ArrowUp, Trash2, Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { OrgChart } from "@/components/org/OrgChart";
import {
  ORG_REGISTRY, ORG_DEPARTMENTS, ORG_DEPT_LABELS, OrgDepartment, OrgMember, getInitials, ORG_DEPT_TONE,
} from "@/lib/orgMeta";
import Permissions from "./Permissions";

const ALL_ROLES: AppRole[] = [
  "admin", "project_manager", "engineer", "supervisor", "worker", "qaqc_inspector", "accountant",
];

type ProfileRow = { id: string; full_name: string; employee_id: string | null };

export default function Organization() {
  const { hasRole } = useAuth();
  const isAdmin = hasRole("admin");
  const [dept, setDept] = React.useState<OrgDepartment | "all">("all");
  const [selected, setSelected] = React.useState<OrgMember | null>(null);
  const [seeding, setSeeding] = React.useState(false);

  // Map employee_id -> auth user id (for role management)
  const [profileMap, setProfileMap] = React.useState<Record<string, ProfileRow>>({});
  const [rolesByUser, setRolesByUser] = React.useState<Record<string, AppRole[]>>({});
  const [newRole, setNewRole] = React.useState<AppRole>("worker");

  const loadProfiles = React.useCallback(async () => {
    const [profilesRes, rolesRes] = await Promise.all([
      supabase.from("profiles").select("id, full_name, employee_id").not("employee_id", "is", null),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    const map: Record<string, ProfileRow> = {};
    (profilesRes.data ?? []).forEach((p: any) => { if (p.employee_id) map[p.employee_id] = p; });
    setProfileMap(map);
    const roleMap: Record<string, AppRole[]> = {};
    (rolesRes.data ?? []).forEach((r: any) => {
      roleMap[r.user_id] = [...(roleMap[r.user_id] ?? []), r.role];
    });
    setRolesByUser(roleMap);
  }, []);

  React.useEffect(() => { loadProfiles(); }, [loadProfiles]);

  const seededCount = Object.keys(profileMap).length;
  const totalRegistry = ORG_REGISTRY.length;

  const onSeed = async () => {
    setSeeding(true);
    const { data, error } = await supabase.functions.invoke("seed-org-users");
    setSeeding(false);
    if (error || !(data as any)?.success) {
      toast.error((data as any)?.error || error?.message || "Seed failed");
      return;
    }
    toast.success(`Seeded ${(data as any).count} staff accounts`);
    loadProfiles();
  };

  const selectedProfile = selected ? profileMap[selected.employee_id] : null;
  const selectedUserId = selectedProfile?.id;
  const selectedRoles = selectedUserId ? rolesByUser[selectedUserId] ?? [] : [];

  const onAddRole = async () => {
    if (!selectedUserId) return;
    if (selectedRoles.includes(newRole)) { toast.error("User already has this role"); return; }
    const { error } = await supabase.from("user_roles").insert({ user_id: selectedUserId, role: newRole });
    if (error) toast.error(error.message);
    else { toast.success(`Added ${ROLE_LABELS[newRole]}`); loadProfiles(); }
  };

  const onRemoveRole = async (role: AppRole) => {
    if (!selectedUserId) return;
    const { error } = await supabase.from("user_roles").delete().eq("user_id", selectedUserId).eq("role", role);
    if (error) toast.error(error.message);
    else { toast.success(`Removed ${ROLE_LABELS[role]}`); loadProfiles(); }
  };

  const reportsTo = selected?.report_to ? ORG_REGISTRY.find((m) => m.employee_id === selected.report_to) : null;
  const directReports = selected ? ORG_REGISTRY.filter((m) => m.report_to === selected.employee_id) : [];

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
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Organization</h1>
          <p className="text-sm text-muted-foreground">
            Internal organization chart, member roles, and module permissions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1.5">
            <Users className="h-3 w-3" /> {seededCount}/{totalRegistry} seeded
          </Badge>
          {seededCount < totalRegistry && (
            <Button onClick={onSeed} disabled={seeding} size="sm" className="gap-2">
              {seeding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              Seed staff accounts
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="chart">
        <TabsList>
          <TabsTrigger value="chart" className="gap-2"><Network className="h-4 w-4" /> Org Chart</TabsTrigger>
          <TabsTrigger value="permissions" className="gap-2"><ShieldCheck className="h-4 w-4" /> Permissions Matrix</TabsTrigger>
        </TabsList>

        <TabsContent value="chart" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b bg-muted/20">
              <div>
                <CardTitle className="text-base">Internal Organization Chart</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">Click a card to view contact info and edit roles.</p>
              </div>
              <div className="w-56">
                <Select value={dept} onValueChange={(v) => setDept(v as typeof dept)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All departments</SelectItem>
                    {ORG_DEPARTMENTS.filter((d) => d !== "management").map((d) => (
                      <SelectItem key={d} value={d}>{ORG_DEPT_LABELS[d]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <OrgChart filterDepartment={dept} onMemberClick={setSelected} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="mt-4">
          <Permissions />
        </TabsContent>
      </Tabs>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-full font-bold ${ORG_DEPT_TONE[selected.department].chip}`}>
                    {getInitials(selected.full_name)}
                  </div>
                  <div>
                    <SheetTitle className="text-left">{selected.full_name}</SheetTitle>
                    <SheetDescription className="text-left">
                      <span className="font-mono text-xs">{selected.employee_id}</span> · {selected.position}
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              <div className="mt-4 space-y-4 text-sm">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{ORG_DEPT_LABELS[selected.department]}</Badge>
                  <Badge variant="outline">{selected.level}</Badge>
                </div>

                <div className="rounded-lg border p-3 space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <a href={`mailto:${selected.email}`} className="hover:underline">{selected.email}</a>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <a href={`tel:${selected.phone}`} className="hover:underline">{selected.phone}</a>
                  </div>
                </div>

                {reportsTo && (
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
                      <ArrowUp className="h-3 w-3" /> Reports to
                    </div>
                    <div className="rounded-md bg-muted/50 px-3 py-2 text-sm">
                      <span className="font-mono text-xs text-muted-foreground">{reportsTo.employee_id}</span>{" "}
                      <span className="font-medium">{reportsTo.full_name}</span> — {reportsTo.position}
                    </div>
                  </div>
                )}

                {directReports.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                      Direct reports ({directReports.length})
                    </div>
                    <div className="space-y-1">
                      {directReports.map((r) => (
                        <div key={r.employee_id} className="rounded-md bg-muted/30 px-3 py-1.5 text-sm">
                          <span className="font-mono text-xs text-muted-foreground">{r.employee_id}</span>{" "}
                          <span className="font-medium">{r.full_name}</span> · <span className="text-muted-foreground">{r.position}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-t pt-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">App roles</div>
                  {!selectedUserId ? (
                    <p className="text-xs text-muted-foreground italic">
                      Not seeded yet. Click "Seed staff accounts" above to create this user.
                    </p>
                  ) : (
                    <>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {selectedRoles.length === 0 ? (
                          <span className="text-xs text-muted-foreground">No roles</span>
                        ) : (
                          selectedRoles.map((r) => (
                            <Badge key={r} variant="secondary" className="gap-1">
                              {ROLE_LABELS[r]}
                              <button
                                onClick={() => onRemoveRole(r)}
                                className="hover:text-destructive"
                                title="Remove role"
                                aria-label={`Remove ${ROLE_LABELS[r]} role`}
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Select value={newRole} onValueChange={(v) => setNewRole(v as AppRole)}>
                          <SelectTrigger className="flex-1 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ALL_ROLES.map((r) => (
                              <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button size="sm" onClick={onAddRole} className="gap-1">
                          <Plus className="h-3.5 w-3.5" /> Add
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
