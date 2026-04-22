import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FolderKanban, DollarSign, TrendingUp, AlertTriangle, HardHat, ClipboardCheck,
  ArrowUpRight, Activity, Layers,
} from "lucide-react";
import { Link } from "react-router-dom";
import { ROLE_LABELS } from "@/lib/modules";

type ProjectRow = {
  id: string; name: string; code: string; status: string;
  progress_pct: number | null; contract_value: number | null; currency: string | null;
  client_name: string | null;
};

const statusColor: Record<string, string> = {
  planning: "bg-info/15 text-info border-info/30",
  design: "bg-accent/15 text-accent border-accent/30",
  procurement: "bg-warning/15 text-warning border-warning/30",
  construction: "bg-primary/15 text-primary border-primary/30",
  handover: "bg-success/15 text-success border-success/30",
  dlp: "bg-muted text-muted-foreground border-border",
  closed: "bg-muted text-muted-foreground border-border",
  on_hold: "bg-destructive/15 text-destructive border-destructive/30",
};

export default function Dashboard() {
  const { profile, roles } = useAuth();
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Dashboard — DCOS";
    supabase.from("projects").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      setProjects((data as any) ?? []);
      setLoading(false);
    });
  }, []);

  const total = projects.length;
  const active = projects.filter(p => ["design","procurement","construction"].includes(p.status)).length;
  const totalValue = projects.reduce((s, p) => s + Number(p.contract_value ?? 0), 0);
  const avgProgress = total ? projects.reduce((s, p) => s + Number(p.progress_pct ?? 0), 0) / total : 0;

  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  })();

  const isExec = roles.includes("executive");
  const isField = roles.includes("site_engineer");

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Hero */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">
            {roles.map(r => ROLE_LABELS[r]).join(" · ") || "Member"}
          </p>
          <h1 className="text-3xl font-bold tracking-tight">
            {greeting}, <span className="text-gradient">{profile?.full_name?.split(" ")[0] ?? "there"}</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's what's happening across your portfolio today.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/portfolio">View portfolio <ArrowUpRight className="h-4 w-4 ml-1" /></Link>
          </Button>
          <Button asChild className="gradient-primary text-primary-foreground hover:opacity-90 shadow-elegant">
            <Link to="/projects">Open projects</Link>
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Active projects" value={active} icon={FolderKanban} accent="primary" delta={12.4} />
        <KpiCard label="Portfolio value" value={`${(totalValue / 1_000_000).toFixed(1)}M`} unit={projects[0]?.currency ?? "USD"} icon={DollarSign} accent="success" delta={8.1} />
        <KpiCard label="Avg progress" value={avgProgress.toFixed(0)} unit="%" icon={TrendingUp} accent="primary" delta={2.3} />
        <KpiCard label="Open NCRs" value="0" icon={AlertTriangle} accent="warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Projects list */}
        <Card className="lg:col-span-2 shadow-card">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Recent projects</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Your active and recently updated projects</p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/projects">All projects <ArrowUpRight className="h-3.5 w-3.5 ml-1" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-12 text-center text-sm text-muted-foreground">Loading…</div>
            ) : projects.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="h-12 w-12 mx-auto rounded-full bg-primary/10 grid place-items-center">
                  <FolderKanban className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">No projects yet</p>
                  <p className="text-sm text-muted-foreground">Create your first project to get started.</p>
                </div>
                <Button asChild className="gradient-primary text-primary-foreground">
                  <Link to="/projects">Create project</Link>
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {projects.slice(0, 6).map((p) => (
                  <Link
                    key={p.id}
                    to={`/projects/${p.id}`}
                    className="flex items-center gap-4 p-4 hover:bg-surface-1 transition-colors group"
                  >
                    <div className="h-10 w-10 rounded-lg bg-surface-2 border border-border grid place-items-center shrink-0 group-hover:border-primary/40 transition-colors">
                      <Layers className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{p.name}</span>
                        <span className="text-[10px] font-mono text-muted-foreground">{p.code}</span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{p.client_name ?? "No client"}</p>
                    </div>
                    <Badge variant="outline" className={statusColor[p.status]}>
                      {p.status.replace("_", " ")}
                    </Badge>
                    <div className="hidden md:flex flex-col items-end w-32 shrink-0">
                      <span className="text-xs font-mono-tabular">{Number(p.progress_pct ?? 0).toFixed(0)}%</span>
                      <div className="h-1.5 w-full bg-surface-2 rounded-full overflow-hidden mt-1">
                        <div className="h-full gradient-primary" style={{ width: `${p.progress_pct ?? 0}%` }} />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Side cards */}
        <div className="space-y-6">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" /> Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {["Project Alpha created", "RFI #142 submitted", "Daily report logged"].map((a, i) => (
                <div key={i} className="flex items-start gap-3 text-sm">
                  <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                  <div className="flex-1">
                    <p>{a}</p>
                    <p className="text-xs text-muted-foreground">{i + 1}h ago</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                {isField ? <HardHat className="h-4 w-4 text-warning" /> : <ClipboardCheck className="h-4 w-4 text-success" />}
                {isField ? "Today's field tasks" : isExec ? "Board snapshot" : "Quick actions"}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>Module-specific widgets will appear here as each module comes online in subsequent iterations.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
