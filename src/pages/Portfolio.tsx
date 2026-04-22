import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { BarChart3, DollarSign, Building2, TrendingUp } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export default function Portfolio() {
  const [projects, setProjects] = useState<any[]>([]);
  useEffect(() => {
    document.title = "Portfolio — DCOS";
    supabase.from("projects").select("*").then(({ data }) => setProjects((data as any) ?? []));
  }, []);

  const byStatus = ["planning","design","procurement","construction","handover","dlp","closed","on_hold"].map(s => ({
    status: s,
    count: projects.filter(p => p.status === s).length,
    value: projects.filter(p => p.status === s).reduce((a, p) => a + Number(p.contract_value ?? 0), 0),
  }));

  const totalValue = projects.reduce((a, p) => a + Number(p.contract_value ?? 0), 0);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Portfolio</h1>
        <p className="text-muted-foreground">Executive view across all projects.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total projects" value={projects.length} icon={Building2} accent="primary" />
        <KpiCard label="Portfolio value" value={`${(totalValue / 1_000_000).toFixed(1)}M`} unit="USD" icon={DollarSign} accent="success" delta={6.4} />
        <KpiCard label="In construction" value={projects.filter(p => p.status === "construction").length} icon={TrendingUp} accent="primary" />
        <KpiCard label="On hold" value={projects.filter(p => p.status === "on_hold").length} icon={BarChart3} accent="warning" />
      </div>

      <Card className="shadow-card">
        <CardHeader><CardTitle className="text-base">Projects by status</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={byStatus}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="status" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
