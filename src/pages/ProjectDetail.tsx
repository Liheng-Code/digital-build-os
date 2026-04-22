import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, MapPin, User, DollarSign, Layers, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ProjectDetail() {
  const { id } = useParams();
  const [p, setP] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    supabase.from("projects").select("*").eq("id", id).maybeSingle().then(({ data }) => {
      setP(data);
      setLoading(false);
      if (data) document.title = `${data.name} — DCOS`;
    });
  }, [id]);

  if (loading) return <div className="p-12 text-center text-muted-foreground">Loading…</div>;
  if (!p) return <div className="p-12 text-center text-muted-foreground">Project not found.</div>;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/projects"><ArrowLeft className="h-4 w-4" /> All projects</Link>
      </Button>

      <Card className="p-6 shadow-card relative overflow-hidden">
        <div className="absolute inset-0 opacity-50" style={{ background: "var(--gradient-glow)" }} />
        <div className="relative flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{p.code}</p>
            <h1 className="text-3xl font-bold tracking-tight mt-1">{p.name}</h1>
            <p className="text-muted-foreground mt-1">{p.description}</p>
            <div className="flex flex-wrap gap-3 mt-4 text-sm">
              {p.client_name && <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-muted-foreground" />{p.client_name}</span>}
              {p.location && <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-muted-foreground" />{p.location}</span>}
              {p.start_date && <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-muted-foreground" />{p.start_date}</span>}
              <span className="flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5 text-muted-foreground" />{p.currency} {Number(p.contract_value ?? 0).toLocaleString()}</span>
            </div>
          </div>
          <div className="text-right">
            <Badge variant="outline" className="bg-primary/15 text-primary border-primary/30 mb-3">{p.status.replace("_"," ")}</Badge>
            <div className="text-3xl font-mono-tabular font-bold">{Number(p.progress_pct ?? 0).toFixed(0)}<span className="text-base text-muted-foreground">%</span></div>
            <p className="text-xs text-muted-foreground">Overall progress</p>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="hierarchy">WBS Hierarchy</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid lg:grid-cols-3 gap-4">
            <Card className="shadow-card">
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Layers className="h-4 w-4 text-primary" /> Hierarchy</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground">Buildings, levels, zones, rooms — coming in next iteration.</CardContent>
            </Card>
            <Card className="shadow-card">
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> Documents</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground">Document control with 300+ types — coming soon.</CardContent>
            </Card>
            <Card className="shadow-card">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Activity</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground">No recent activity.</CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="hierarchy"><Card className="p-12 text-center text-muted-foreground">WBS editor lands in iteration 2.</Card></TabsContent>
        <TabsContent value="team"><Card className="p-12 text-center text-muted-foreground">Team management coming soon.</Card></TabsContent>
        <TabsContent value="settings"><Card className="p-12 text-center text-muted-foreground">Project settings coming soon.</Card></TabsContent>
      </Tabs>
    </div>
  );
}
