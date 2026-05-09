import * as React from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProjects } from "@/contexts/ProjectContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Search,
  Filter,
  User,
  Building2,
  Calendar,
  MessageSquare,
  Camera,
  MoreVertical,
  Check,
  X
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { storageService } from "@/services/storageService";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const STATUS_LABELS: Record<string, string> = {
  reported: "Reported",
  in_progress: "In Progress",
  fixed: "Fixed",
  verified: "Verified",
  closed: "Closed"
};

const PRIORITY_TONE: Record<string, string> = {
  low: "bg-slate-100 text-slate-700",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700"
};

export default function DLP() {
  const { activeProject } = useProjects();
  const [defects, setDefects] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState("all");

  const loadData = async () => {
    if (!activeProject) return;
    setLoading(true);
    try {
      let query = supabase
        .from("dlp_defects")
        .select("*, stakeholders(name), wbs_nodes(name)")
        .eq("project_id", activeProject.id)
        .order("created_at", { ascending: false });

      if (filter !== "all") query = query.eq("status", filter);

      const { data, error } = await query;
      if (error) throw error;
      setDefects(data || []);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadData();
  }, [activeProject, filter]);

  const updateStatus = async (id: string, status: string) => {
    const patch: any = { status, updated_at: new Date().toISOString() };
    if (status === 'fixed') patch.fixed_at = new Date().toISOString();
    if (status === 'verified') patch.verified_at = new Date().toISOString();

    const { error } = await supabase.from("dlp_defects").update(patch).eq("id", id);
    if (!error) {
      toast.success(`Defect updated to ${status}`);
      loadData();
    }
  };

  if (!activeProject) return <div className="p-8 text-muted-foreground">Select a project to view DLP records.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Defect Liability (DLP)</h1>
          <p className="text-muted-foreground">Post-handover defect tracking and maintenance control.</p>
        </div>
        <NewDefectDialog projectId={activeProject.id} onDone={loadData} />
      </div>

      <div className="flex items-center gap-4 bg-muted/30 p-2 rounded-lg">
        <div className="flex items-center gap-2 px-2 border-r">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</span>
        </div>
        <div className="flex gap-1">
          {["all", "reported", "in_progress", "fixed", "verified", "closed"].map(s => (
            <Button 
              key={s} 
              variant={filter === s ? "default" : "ghost"} 
              size="sm" 
              onClick={() => setFilter(s)}
              className="capitalize text-xs h-8"
            >
              {s.replace('_', ' ')}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {defects.map(defect => (
          <Card key={defect.id} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row">
                <div className="md:w-48 bg-muted/20 flex items-center justify-center p-4 border-r">
                  {defect.file_url ? (
                    <img src={defect.file_url} className="w-full aspect-square object-cover rounded-md shadow-sm" />
                  ) : (
                    <div className="w-full aspect-square bg-muted flex items-center justify-center rounded-md border-2 border-dashed">
                      <AlertTriangle className="h-10 w-10 text-muted-foreground/20" />
                    </div>
                  )}
                </div>
                <div className="flex-1 p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge className="capitalize" variant="outline">{defect.status.replace('_', ' ')}</Badge>
                        <Badge className={PRIORITY_TONE[defect.priority]}>{defect.priority} Priority</Badge>
                      </div>
                      <h3 className="text-lg font-bold mt-2">{defect.description}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Building2 className="h-3 w-3" /> {defect.wbs_nodes?.name || "Global"} · {format(new Date(defect.created_at), "dd MMM yyyy")}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => updateStatus(defect.id, 'in_progress')}>Mark In Progress</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateStatus(defect.id, 'fixed')}>Mark Fixed</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateStatus(defect.id, 'verified')}>Mark Verified</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateStatus(defect.id, 'closed')}>Close Ticket</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Assigned To</p>
                      <p className="text-sm font-medium flex items-center gap-1"><User className="h-3 w-3" /> {defect.stakeholders?.name || "Unassigned"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Due Date</p>
                      <p className="text-sm font-medium flex items-center gap-1"><Calendar className="h-3 w-3" /> {defect.due_date ? format(new Date(defect.due_date), "dd MMM") : "—"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Fixed Date</p>
                      <p className="text-sm font-medium flex items-center gap-1 text-emerald-600">{defect.fixed_at ? format(new Date(defect.fixed_at), "dd MMM") : "Pending"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Verification</p>
                      <p className="text-sm font-medium flex items-center gap-1 text-blue-600">{defect.verified_at ? <><CheckCircle2 className="h-3 w-3" /> Verified</> : "Pending"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {defects.length === 0 && !loading && (
          <div className="py-20 text-center text-muted-foreground bg-muted/10 border-2 border-dashed rounded-xl">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-10" />
            <p className="text-lg font-medium">No defects reported.</p>
            <p className="text-sm">Great job! The project is clear of active snags.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function NewDefectDialog({ projectId, onDone }: { projectId: string; onDone: () => void }) {
  const [open, setOpen] = React.useState(false);
  const [stakeholders, setStakeholders] = React.useState<any[]>([]);
  const [wbsNodes, setWbsNodes] = React.useState<any[]>([]);
  const [form, setForm] = React.useState({ description: "", contractor_id: "", wbs_node_id: "", priority: "medium", due_date: "" });
  const [file, setFile] = React.useState<File | null>(null);

  React.useEffect(() => {
    if (open) {
      Promise.all([
        supabase.from("stakeholders").select("id, name").order("name"),
        supabase.from("wbs_nodes").select("id, name").eq("project_id", projectId).order("name")
      ]).then(([s, w]) => {
        setStakeholders(s.data || []);
        setWbsNodes(w.data || []);
      });
    }
  }, [open]);

  const save = async () => {
    if (!form.description) return;
    let url = "";
    if (file) {
      const { path } = await storageService.uploadFile(file, { bucket: "design-files", projectId, folder: "dlp/defects" });
      url = path;
    }

    await supabase.from("dlp_defects").insert({
      ...form,
      project_id: projectId,
      file_url: url || null
    });
    setOpen(false);
    onDone();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> Report Defect</Button></DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Report DLP Defect</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2"><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Describe the defect..." /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2"><Label>Location (WBS)</Label>
              <Select onValueChange={v => setForm({...form, wbs_node_id: v})}>
                <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
                <SelectContent>{wbsNodes.map(n => <SelectItem key={n.id} value={n.id}>{n.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-2"><Label>Assigned Contractor</Label>
              <Select onValueChange={v => setForm({...form, contractor_id: v})}>
                <SelectTrigger><SelectValue placeholder="Select contractor" /></SelectTrigger>
                <SelectContent>{stakeholders.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2"><Label>Priority</Label>
              <Select defaultValue="medium" onValueChange={v => setForm({...form, priority: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2"><Label>Fix By Date</Label><Input type="date" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})} /></div>
          </div>
          <div className="grid gap-2"><Label>Photo Evidence</Label><Input type="file" onChange={e => setFile(e.target.files?.[0] || null)} /></div>
        </div>
        <DialogFooter><Button onClick={save}>Log Defect</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
