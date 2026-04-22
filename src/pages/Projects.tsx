import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, FolderKanban, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

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

export default function Projects() {
  const { profile, roles } = useAuth();
  const canCreate = roles.includes("admin") || roles.includes("project_manager");
  const [rows, setRows] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  // form
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [client, setClient] = useState("");
  const [location, setLocation] = useState("");
  const [value, setValue] = useState("");
  const [status, setStatus] = useState("planning");
  const [description, setDescription] = useState("");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("projects").select("*").order("created_at", { ascending: false });
    setRows((data as any[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { document.title = "Projects — DCOS"; load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.company_id) return;
    setBusy(true);
    const { error } = await supabase.from("projects").insert({
      company_id: profile.company_id,
      code: code.toUpperCase(),
      name, client_name: client, location, description,
      contract_value: value ? Number(value) : 0,
      status: status as any,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Project created");
    setOpen(false);
    setCode(""); setName(""); setClient(""); setLocation(""); setValue(""); setDescription(""); setStatus("planning");
    load();
  };

  const filtered = rows.filter(r =>
    !q || r.name?.toLowerCase().includes(q.toLowerCase()) || r.code?.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">All construction projects across your company.</p>
        </div>
        <div className="flex gap-2 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9 w-64" />
          </div>
          {canCreate && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-primary text-primary-foreground hover:opacity-90 shadow-elegant">
                  <Plus className="h-4 w-4" /> New project
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle>Create project</DialogTitle></DialogHeader>
                <form onSubmit={create} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Project code</Label>
                      <Input required maxLength={12} value={code} onChange={(e) => setCode(e.target.value)} placeholder="P001" className="font-mono uppercase" />
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["planning","design","procurement","construction","handover","dlp","on_hold","closed"].map(s => (
                            <SelectItem key={s} value={s}>{s.replace("_"," ")}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Tower One Mixed-Use Development" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Client</Label>
                      <Input value={client} onChange={(e) => setClient(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Location</Label>
                      <Input value={location} onChange={(e) => setLocation(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Contract value</Label>
                    <Input type="number" min="0" step="0.01" value={value} onChange={(e) => setValue(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={busy} className="gradient-primary text-primary-foreground">
                      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {loading ? (
        <Card className="p-12 grid place-items-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></Card>
      ) : filtered.length === 0 ? (
        <Card className="p-16 text-center space-y-3">
          <div className="h-14 w-14 mx-auto rounded-full bg-primary/10 grid place-items-center">
            <FolderKanban className="h-7 w-7 text-primary" />
          </div>
          <div>
            <p className="font-medium text-lg">No projects yet</p>
            <p className="text-sm text-muted-foreground">{canCreate ? "Create your first project above." : "Ask an admin to create a project."}</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(p => (
            <Link key={p.id} to={`/projects/${p.id}`}>
              <Card className="p-5 shadow-card hover:border-primary/40 hover:shadow-glow transition-all group h-full">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="min-w-0">
                    <p className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider">{p.code}</p>
                    <h3 className="font-semibold text-lg leading-tight mt-1 group-hover:text-primary transition-colors truncate">{p.name}</h3>
                    {p.client_name && <p className="text-sm text-muted-foreground mt-1 truncate">{p.client_name}</p>}
                  </div>
                  <Badge variant="outline" className={statusColor[p.status]}>{p.status.replace("_"," ")}</Badge>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-mono-tabular">{Number(p.progress_pct ?? 0).toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-surface-2 rounded-full overflow-hidden">
                      <div className="h-full gradient-primary" style={{ width: `${p.progress_pct ?? 0}%` }} />
                    </div>
                  </div>
                  <div className="flex justify-between text-sm pt-1">
                    <span className="text-muted-foreground">Contract</span>
                    <span className="font-mono-tabular font-medium">
                      {p.currency ?? "USD"} {Number(p.contract_value ?? 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
