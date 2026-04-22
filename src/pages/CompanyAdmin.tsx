import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS } from "@/lib/modules";
import { Building2 } from "lucide-react";

export default function CompanyAdmin() {
  const { profile } = useAuth();
  const [company, setCompany] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);

  useEffect(() => {
    document.title = "Company — DCOS";
    if (!profile?.company_id) return;
    supabase.from("companies").select("*").eq("id", profile.company_id).maybeSingle().then(({ data }) => setCompany(data));
    supabase.from("profiles").select("id, full_name, email, job_title").eq("company_id", profile.company_id).then(async ({ data }) => {
      const { data: rs } = await supabase.from("user_roles").select("user_id, role").eq("company_id", profile.company_id);
      const byUser: Record<string, string[]> = {};
      (rs ?? []).forEach((r: any) => { (byUser[r.user_id] ||= []).push(r.role); });
      setMembers((data ?? []).map((m: any) => ({ ...m, roles: byUser[m.id] ?? [] })));
    });
  }, [profile?.company_id]);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Company</h1>
        <p className="text-muted-foreground">Manage your workspace, members, and settings.</p>
      </div>

      <Card className="shadow-card">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" /> Workspace</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><p className="text-xs text-muted-foreground">Name</p><p className="font-medium mt-1">{company?.name ?? "—"}</p></div>
          <div><p className="text-xs text-muted-foreground">Code</p><p className="font-mono mt-1">{company?.code ?? "—"}</p></div>
          <div><p className="text-xs text-muted-foreground">Country</p><p className="mt-1">{company?.country ?? "—"}</p></div>
          <div><p className="text-xs text-muted-foreground">Currency</p><p className="font-mono mt-1">{company?.currency ?? "—"}</p></div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader><CardTitle className="text-base">Members</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {members.map(m => (
              <div key={m.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">{m.full_name ?? m.email}</p>
                  <p className="text-xs text-muted-foreground">{m.email}</p>
                </div>
                <div className="flex gap-1">
                  {m.roles.length === 0 && <Badge variant="outline" className="text-muted-foreground">No role</Badge>}
                  {m.roles.map((r: string) => <Badge key={r} variant="secondary">{ROLE_LABELS[r]}</Badge>)}
                </div>
              </div>
            ))}
            {members.length === 0 && <p className="p-6 text-sm text-muted-foreground text-center">No members yet.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
