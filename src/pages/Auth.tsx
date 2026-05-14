import * as React from "react";
import { useNavigate, Link } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { HardHat, Loader2 } from "lucide-react";
import { DemoLoginPanel } from "@/components/org/DemoLoginPanel";
import { ORG_REGISTRY, ORG_DEPT_LABELS, DEMO_PASSWORD } from "@/lib/orgMeta";

const signInSchema = z.object({
  email: z.string().trim().email({ message: "Invalid email address" }).max(255),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }).max(72),
});

const signUpSchema = signInSchema.extend({
  fullName: z.string().trim().min(2, { message: "Full name is required" }).max(100),
});

const DEMO_ACCOUNTS = ORG_REGISTRY.map((m) => ({
  email: m.email,
  name: m.full_name,
  role: `${ORG_DEPT_LABELS[m.department]} · ${m.position}`,
}));

export default function Auth() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const [tab, setTab] = React.useState<"signin" | "signup">("signin");

  React.useEffect(() => {
    if (!authLoading && user) navigate("/", { replace: true });
  }, [user, authLoading, navigate]);

  const onSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const result = signInSchema.safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
    });
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: result.data.email,
      password: result.data.password,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Signed in");
    navigate("/", { replace: true });
  };

  const fillDemoCredentials = (email: string) => {
    const emailInput = document.getElementById("signin-email") as HTMLInputElement;
    const passwordInput = document.getElementById("signin-password") as HTMLInputElement;
    if (emailInput && passwordInput) {
      emailInput.value = email;
      passwordInput.value = DEMO_PASSWORD;
      passwordInput.focus();
    }
  };

  const onSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const result = signUpSchema.safeParse({
      fullName: formData.get("fullName"),
      email: formData.get("email"),
      password: formData.get("password"),
    });
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: result.data.email,
      password: result.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { full_name: result.data.fullName },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Account created. You can sign in now.");
    setTab("signin");
  };

  const onForgotPassword = async () => {
    const email = (document.getElementById("signin-email") as HTMLInputElement)?.value;
    if (!email) {
      toast.error("Enter your email above first");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(error.message);
    else toast.success("Password reset email sent");
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-[1fr_minmax(420px,560px)] bg-background">
      <h1 className="sr-only">BuildTrack — Sign in</h1>
      {/* Brand panel — now hosts the demo org chart */}
      <div className="hidden lg:flex flex-col bg-gradient-primary text-primary-foreground p-8 overflow-y-auto">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <HardHat className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold tracking-tight">BuildTrack</span>
        </div>

        <div className="space-y-4 max-w-md">
          <h1 className="text-4xl font-bold leading-tight">
            Digital Construction Operating System Control, end-to-end.
          </h1>
          <p className="text-base text-primary-foreground/80">
            Tasks, timesheets, approvals, and audit-ready reporting — built for
            project managers, engineers, and supervisors who need the truth
            about their job sites.
          </p>
        </div>

        <div className="text-sm text-primary-foreground/60">
          © {new Date().getFullYear()} BuildTrack. Internal company use.
        </div>
      </div>

      {/* Auth panel */}
      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="mb-6 flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <HardHat className="h-5 w-5" />
            </div>
            <span className="font-bold">BuildTrack</span>
          </div>

          <Card className="border-border shadow-elevated">
            <CardHeader>
              <CardTitle>Welcome</CardTitle>
              <CardDescription>Sign in to your account or request access from your admin.</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={tab} onValueChange={(v) => setTab(v as "signin" | "signup")}>
                <TabsList className="grid grid-cols-2 w-full">
                  <TabsTrigger value="signin">Sign in</TabsTrigger>
                  <TabsTrigger value="signup">Sign up</TabsTrigger>
                </TabsList>

                <TabsContent value="signin">
                  <form onSubmit={onSignIn} className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email">Email</Label>
                      <Input id="signin-email" name="email" type="email" required autoComplete="email" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="signin-password">Password</Label>
                        <button
                          type="button"
                          onClick={onForgotPassword}
                          className="text-xs text-muted-foreground hover:text-primary underline-offset-2 hover:underline"
                        >
                          Forgot?
                        </button>
                      </div>
                      <Input id="signin-password" name="password" type="password" required autoComplete="current-password" />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Sign in
                    </Button>
                  </form>

                  {/* Demo Accounts Section */}
                  <div className="mt-6 pt-6 border-t border-border">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Demo Accounts</p>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {DEMO_ACCOUNTS.map((account) => (
                        <button
                          key={account.email}
                          type="button"
                          onClick={() => fillDemoCredentials(account.email)}
                          className="w-full text-left p-2.5 rounded-md bg-muted/50 hover:bg-muted transition-colors group"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{account.name}</p>
                              <p className="text-xs text-muted-foreground">{account.email}</p>
                            </div>
                            <Badge variant="secondary" className="text-[10px]">{account.role}</Badge>
                          </div>
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-3 text-center">Password for all: <span className="font-mono font-medium text-foreground">{DEMO_PASSWORD}</span></p>
                  </div>
                </TabsContent>

                <TabsContent value="signup">
                  <form onSubmit={onSignUp} className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Full name</Label>
                      <Input id="signup-name" name="fullName" type="text" required maxLength={100} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input id="signup-email" name="email" type="email" required maxLength={255} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <Input id="signup-password" name="password" type="password" required minLength={6} maxLength={72} />
                      <p className="text-xs text-muted-foreground">
                        New accounts start as <span className="font-medium">Worker</span>. An admin can change your role.
                      </p>
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Create account
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
