import * as React from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { OrgChart } from "@/components/org/OrgChart";
import {
  ORG_REGISTRY, ORG_DEPARTMENTS, ORG_DEPT_LABELS, OrgDepartment, OrgMember, DEMO_PASSWORD,
} from "@/lib/orgMeta";

export function DemoLoginPanel() {
  const navigate = useNavigate();
  const [dept, setDept] = React.useState<OrgDepartment | "all">("all");
  const [signingIn, setSigningIn] = React.useState<string | null>(null);

  const handlePick = async (m: OrgMember) => {
    setSigningIn(m.employee_id);
    const { error } = await supabase.auth.signInWithPassword({
      email: m.email,
      password: DEMO_PASSWORD,
    });
    setSigningIn(null);
    if (error) {
      toast.error(`${error.message}. Ask an admin to seed demo users.`);
      return;
    }
    toast.success(`Signed in as ${m.full_name}`);
    navigate("/", { replace: true });
  };

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <div className="text-sm font-bold">Demo sign-in</div>
          <div className="text-xs text-muted-foreground">
            Pick a department and click any team member to sign in instantly
          </div>
        </div>
      </div>

      <div className="mb-4">
        <Select value={dept} onValueChange={(v) => setDept(v as typeof dept)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Filter by department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All departments</SelectItem>
            {ORG_DEPARTMENTS.filter((d) => d !== "management").map((d) => (
              <SelectItem key={d} value={d}>{ORG_DEPT_LABELS[d]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="max-h-[60vh] overflow-y-auto pr-1">
        <OrgChart
          members={ORG_REGISTRY}
          filterDepartment={dept}
          onMemberClick={handlePick}
          compact
          highlightId={signingIn}
        />
      </div>

      {signingIn && (
        <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" /> Signing in…
        </div>
      )}

      <p className="mt-3 text-center text-[10px] text-muted-foreground">
        Shared password: <span className="font-mono font-medium text-foreground">{DEMO_PASSWORD}</span>
      </p>
    </div>
  );
}
