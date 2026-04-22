import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Loader2, Building2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function Onboarding() {
  const { user, profile, roles, loading, refresh } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [country, setCountry] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [role, setRole] = useState<"admin" | "project_manager" | "site_engineer" | "executive">("admin");
  const [busy, setBusy] = useState(false);

  useEffect(() => { document.title = "Set up your company — DCOS"; }, []);

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  if (profile?.company_id && roles.length > 0) return <Navigate to="/" replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      // 1. Create company
      const { data: company, error: cErr } = await supabase
        .from("companies")
        .insert({ name, code: code.toUpperCase(), country, currency })
        .select()
        .single();
      if (cErr) throw cErr;

      // 2. Attach profile
      const { error: pErr } = await supabase
        .from("profiles")
        .update({ company_id: company.id, full_name: profile?.full_name ?? user.email })
        .eq("id", user.id);
      if (pErr) throw pErr;

      // 3. Self-assign role (first user is allowed)
      const { error: rErr } = await supabase
        .from("user_roles")
        .insert({ user_id: user.id, company_id: company.id, role });
      if (rErr) throw rErr;

      await refresh();
      toast.success("Company ready — welcome to DCOS");
      nav("/", { replace: true });
    } catch (err: any) {
      toast.error(err.message ?? "Could not finish setup");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-lg p-8 shadow-card animate-fade-in">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-lg gradient-primary grid place-items-center shadow-glow">
            <Building2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-semibold text-lg">Set up your company</h1>
            <p className="text-sm text-muted-foreground">A workspace for all your projects, teams and data.</p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="cname">Company name</Label>
              <Input id="cname" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Construction Sdn Bhd" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ccode">Short code</Label>
              <Input id="ccode" required maxLength={8} value={code} onChange={(e) => setCode(e.target.value)} placeholder="ACME" className="font-mono uppercase" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ccountry">Country</Label>
              <Input id="ccountry" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Malaysia" />
            </div>
            <div className="space-y-2">
              <Label>Base currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["USD","EUR","GBP","MYR","SGD","IDR","THB","PHP","VND","AED","SAR","INR"].map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Your role</Label>
              <Select value={role} onValueChange={(v: any) => setRole(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrator</SelectItem>
                  <SelectItem value="project_manager">Project Manager</SelectItem>
                  <SelectItem value="executive">Executive</SelectItem>
                  <SelectItem value="site_engineer">Site Engineer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button type="submit" disabled={busy} className="w-full gradient-primary text-primary-foreground hover:opacity-90 shadow-elegant">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create workspace"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
