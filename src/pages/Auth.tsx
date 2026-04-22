import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Building2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export default function Auth() {
  const { session, loading } = useAuth();
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);

  // sign in
  const [siEmail, setSiEmail] = useState("");
  const [siPwd, setSiPwd] = useState("");
  // sign up
  const [suName, setSuName] = useState("");
  const [suEmail, setSuEmail] = useState("");
  const [suPwd, setSuPwd] = useState("");

  useEffect(() => {
    document.title = "Sign in — DCOS";
  }, []);

  if (loading) return null;
  if (session) return <Navigate to="/" replace />;

  const onSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: siEmail, password: siPwd });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back");
    nav("/", { replace: true });
  };

  const onSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: suEmail,
      password: suPwd,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { full_name: suName },
      },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Account created — let's set up your company");
    nav("/onboarding", { replace: true });
  };

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden bg-sidebar">
        <div className="absolute inset-0 opacity-60" style={{ background: "var(--gradient-glow)" }} />
        <div className="relative z-10 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg gradient-primary grid place-items-center shadow-glow">
            <Building2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-semibold tracking-tight text-lg">DCOS</span>
        </div>
        <div className="relative z-10 space-y-4">
          <h1 className="text-4xl font-bold leading-tight">
            The <span className="text-gradient">Operating System</span><br />for modern construction.
          </h1>
          <p className="text-muted-foreground max-w-md">
            From design to defect liability — projects, BOQs, RFIs, BIM, payroll, and dashboards
            for every level from board to field.
          </p>
          <div className="flex gap-2 pt-4 text-xs font-mono text-muted-foreground">
            <span className="px-2 py-1 rounded bg-surface-2 border border-border">20+ modules</span>
            <span className="px-2 py-1 rounded bg-surface-2 border border-border">95 tables</span>
            <span className="px-2 py-1 rounded bg-surface-2 border border-border">6 dashboard levels</span>
          </div>
        </div>
        <p className="relative z-10 text-xs text-muted-foreground">© DCOS — Digital Construction Operating System</p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6">
        <Card className="w-full max-w-md p-8 shadow-card animate-fade-in">
          <div className="lg:hidden mb-6 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg gradient-primary grid place-items-center">
              <Building2 className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold tracking-tight">DCOS</span>
          </div>

          <Tabs defaultValue="signin">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="mt-6">
              <form onSubmit={onSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="si-email">Work email</Label>
                  <Input id="si-email" type="email" required value={siEmail} onChange={(e) => setSiEmail(e.target.value)} placeholder="you@company.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="si-pwd">Password</Label>
                  <Input id="si-pwd" type="password" required value={siPwd} onChange={(e) => setSiPwd(e.target.value)} />
                </div>
                <Button type="submit" disabled={busy} className="w-full gradient-primary text-primary-foreground hover:opacity-90 shadow-elegant">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-6">
              <form onSubmit={onSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="su-name">Full name</Label>
                  <Input id="su-name" required value={suName} onChange={(e) => setSuName(e.target.value)} placeholder="Jane Doe" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="su-email">Work email</Label>
                  <Input id="su-email" type="email" required value={suEmail} onChange={(e) => setSuEmail(e.target.value)} placeholder="you@company.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="su-pwd">Password</Label>
                  <Input id="su-pwd" type="password" required minLength={8} value={suPwd} onChange={(e) => setSuPwd(e.target.value)} />
                  <p className="text-xs text-muted-foreground">At least 8 characters. We check against known leaked passwords.</p>
                </div>
                <Button type="submit" disabled={busy} className="w-full gradient-primary text-primary-foreground hover:opacity-90 shadow-elegant">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
