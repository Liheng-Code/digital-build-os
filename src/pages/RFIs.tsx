import * as React from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProjects } from "@/contexts/ProjectContext";
import { useWbsTree } from "@/hooks/useWbsTree";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  HelpCircle, 
  MessageSquare, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  Filter, 
  Search,
  ChevronRight,
  FileText,
  Calendar,
  User,
  Paperclip,
  Loader2,
  ArrowRight,
  Layers
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

type RFIStatus = 'open' | 'answered' | 'closed' | 'void' | 'draft';
type RFIPriority = 'low' | 'medium' | 'high' | 'urgent';

interface RFI {
  id: string;
  rfi_number: string;
  subject: string;
  question: string;
  discipline: string;
  status: RFIStatus;
  priority: RFIPriority;
  due_date: string | null;
  created_at: string;
  wbs_node_id: string | null;
  assigned_to_stakeholder_id: string | null;
  schedule_impact: boolean;
  cost_impact: boolean;
}

export default function RFIs() {
  const { activeProject } = useProjects();
  const { nodes: wbsNodes } = useWbsTree(activeProject?.id);
  
  const [rfis, setRfis] = React.useState<RFI[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [selectedRfi, setSelectedRfi] = React.useState<RFI | null>(null);
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [stakeholders, setStakeholders] = React.useState<any[]>([]);

  const loadData = async () => {
    if (!activeProject) return;
    setLoading(true);
    try {
      const [rfisRes, stakeholdersRes] = await Promise.all([
        supabase
          .from("rfis")
          .select("*")
          .eq("project_id", activeProject.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("stakeholders")
          .select("id, organization_name, contact_person")
          .eq("project_id", activeProject.id)
      ]);

      if (rfisRes.error) throw rfisRes.error;
      setRfis(rfisRes.data as RFI[]);
      setStakeholders(stakeholdersRes.data || []);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadData();
  }, [activeProject]);

  const filteredRfis = rfis.filter(r => 
    r.subject.toLowerCase().includes(search.toLowerCase()) ||
    r.rfi_number.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status: RFIStatus) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'answered': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'closed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (!activeProject) {
    return <div className="p-8 text-muted-foreground">Select a project to view RFIs.</div>;
  }

  return (
    <div className="flex h-[calc(100vh-10rem)] gap-4">
      {/* RFI List */}
      <div className="w-1/3 flex flex-col gap-4 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search RFIs..." 
              className="pl-8" 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 shrink-0">
                <Plus className="h-4 w-4" /> New RFI
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <CreateRfiForm 
                projectId={activeProject.id} 
                wbsNodes={wbsNodes} 
                stakeholders={stakeholders}
                onSuccess={() => {
                  setIsCreateOpen(false);
                  loadData();
                }}
              />
            </DialogContent>
          </Dialog>
        </div>

        <Card className="flex-1 overflow-hidden flex flex-col">
          <CardHeader className="pb-3 flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">RFI Register</CardTitle>
              <CardDescription>Track technical site queries</CardDescription>
            </div>
            <Badge variant="outline">{filteredRfis.length}</Badge>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="divide-y divide-border">
                {filteredRfis.map(rfi => (
                  <button
                    key={rfi.id}
                    onClick={() => setSelectedRfi(rfi)}
                    className={`w-full text-left p-4 hover:bg-muted transition-colors flex flex-col gap-2 ${
                      selectedRfi?.id === rfi.id ? "bg-muted" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-mono font-bold text-primary">{rfi.rfi_number}</span>
                      <Badge variant="outline" className={`text-[10px] uppercase ${getStatusColor(rfi.status)}`}>
                        {rfi.status}
                      </Badge>
                    </div>
                    <h3 className="text-sm font-semibold truncate leading-none">{rfi.subject}</h3>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(rfi.created_at), "MMM d")}
                      </div>
                      <div className="flex items-center gap-1">
                        <Filter className="h-3 w-3" />
                        {rfi.discipline}
                      </div>
                      {rfi.schedule_impact && (
                        <Badge variant="destructive" className="h-4 text-[8px] px-1">DELAY</Badge>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* RFI Detail View */}
      <div className="flex-1 min-w-0">
        {!selectedRfi ? (
          <Card className="h-full flex items-center justify-center border-dashed">
            <div className="text-center">
              <HelpCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-muted-foreground">Select an RFI from the register to view the discussion.</p>
            </div>
          </Card>
        ) : (
          <RfiDetailView 
            rfi={selectedRfi} 
            wbsNodes={wbsNodes}
            stakeholders={stakeholders}
            onUpdate={() => {
              loadData();
              // Update selected RFI reference
            }}
          />
        )}
      </div>
    </div>
  );
}

function CreateRfiForm({ projectId, wbsNodes, stakeholders, onSuccess }: any) {
  const [submitting, setSubmitting] = React.useState(false);
  const [formData, setFormData] = React.useState({
    subject: "",
    question: "",
    suggested_solution: "",
    discipline: "ARC",
    priority: "medium" as RFIPriority,
    wbs_node_id: "",
    assigned_to_stakeholder_id: "",
    due_date: "",
    schedule_impact: false,
    cost_impact: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // 1. Generate RFI Number
      const { count } = await supabase
        .from("rfis")
        .select("*", { count: "exact", head: true })
        .eq("project_id", projectId)
        .eq("discipline", formData.discipline);
      
      const rfiNum = `RFI-${formData.discipline}-${((count || 0) + 1).toString().padStart(3, '0')}`;

      const { error } = await supabase.from("rfis").insert({
        ...formData,
        project_id: projectId,
        rfi_number: rfiNum,
        status: "open",
        wbs_node_id: formData.wbs_node_id || null,
        assigned_to_stakeholder_id: formData.assigned_to_stakeholder_id || null,
        due_date: formData.due_date || null
      });

      if (error) throw error;
      toast.success(`RFI ${rfiNum} created successfully`);
      onSuccess();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>Raise New Request for Information</DialogTitle>
      </DialogHeader>
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-2">
          <Label>Subject</Label>
          <Input 
            required 
            placeholder="Technical query summary" 
            value={formData.subject}
            onChange={e => setFormData(p => ({...p, subject: e.target.value}))}
          />
        </div>
        <div className="space-y-2">
          <Label>Discipline</Label>
          <Select value={formData.discipline} onValueChange={v => setFormData(p => ({...p, discipline: v}))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ARC">Architecture</SelectItem>
              <SelectItem value="STR">Structural</SelectItem>
              <SelectItem value="MEP">Mechanical/Electrical</SelectItem>
              <SelectItem value="SITE">Site / General</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Priority</Label>
          <Select value={formData.priority} onValueChange={v => setFormData(p => ({...p, priority: v as RFIPriority}))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Location (WBS)</Label>
          <Select value={formData.wbs_node_id} onValueChange={v => setFormData(p => ({...p, wbs_node_id: v}))}>
            <SelectTrigger><SelectValue placeholder="Select WBS node" /></SelectTrigger>
            <SelectContent>
              {wbsNodes.map((n: any) => (
                <SelectItem key={n.id} value={n.id}>{n.name} ({n.code})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Assign To (Stakeholder)</Label>
          <Select value={formData.assigned_to_stakeholder_id} onValueChange={v => setFormData(p => ({...p, assigned_to_stakeholder_id: v}))}>
            <SelectTrigger><SelectValue placeholder="Select consultant" /></SelectTrigger>
            <SelectContent>
              {stakeholders.map((s: any) => (
                <SelectItem key={s.id} value={s.id}>{s.organization_name} - {s.contact_person}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2 space-y-2">
          <Label>Question / Clarification Needed</Label>
          <Textarea 
            required 
            placeholder="Describe the technical issue in detail..." 
            className="min-h-[100px]"
            value={formData.question}
            onChange={e => setFormData(p => ({...p, question: e.target.value}))}
          />
        </div>
        <div className="col-span-2 space-y-2">
          <Label>Suggested Solution (Optional)</Label>
          <Textarea 
            placeholder="Propose a solution to save time..." 
            value={formData.suggested_solution}
            onChange={e => setFormData(p => ({...p, suggested_solution: e.target.value}))}
          />
        </div>
        <div className="flex items-center gap-6 pt-2">
          <div className="flex items-center gap-2">
            <Checkbox 
              id="impact_sched" 
              checked={formData.schedule_impact} 
              onCheckedChange={v => setFormData(p => ({...p, schedule_impact: !!v}))} 
            />
            <Label htmlFor="impact_sched" className="text-xs cursor-pointer">Schedule Impact</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox 
              id="impact_cost" 
              checked={formData.cost_impact} 
              onCheckedChange={v => setFormData(p => ({...p, cost_impact: !!v}))} 
            />
            <Label htmlFor="impact_cost" className="text-xs cursor-pointer">Cost Impact</Label>
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Issue RFI"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function RfiDetailView({ rfi, wbsNodes, stakeholders, onUpdate }: any) {
  const [responses, setResponses] = React.useState<any[]>([]);
  const [newResponse, setNewResponse] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const loadResponses = async () => {
    const { data } = await supabase
      .from("rfi_responses")
      .select("*, profiles(full_name)")
      .eq("rfi_id", rfi.id)
      .order("created_at", { ascending: true });
    setResponses(data || []);
  };

  React.useEffect(() => {
    loadResponses();
  }, [rfi.id]);

  const handleAddResponse = async () => {
    if (!newResponse.trim()) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("rfi_responses").insert({
        rfi_id: rfi.id,
        response: newResponse,
        responded_by: (await supabase.auth.getUser()).data.user?.id
      });
      if (error) throw error;
      setNewResponse("");
      loadResponses();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const closeRfi = async () => {
    try {
      const { error } = await supabase
        .from("rfis")
        .update({ status: "closed", closed_at: new Date().toISOString() })
        .eq("id", rfi.id);
      if (error) throw error;
      toast.success("RFI closed successfully");
      onUpdate();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const wbsNode = wbsNodes.find((n: any) => n.id === rfi.wbs_node_id);
  const stakeholder = stakeholders.find((s: any) => s.id === rfi.assigned_to_stakeholder_id);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="border-b bg-muted/30">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono">{rfi.rfi_number}</Badge>
              <Badge variant="secondary">{rfi.discipline}</Badge>
            </div>
            <CardTitle className="text-xl">{rfi.subject}</CardTitle>
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mt-2">
              <div className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Due: {rfi.due_date || "Not set"}</div>
              <div className="flex items-center gap-1"><Layers className="h-3 w-3" /> Location: {wbsNode ? `${wbsNode.name} (${wbsNode.code})` : "General"}</div>
              <div className="flex items-center gap-1"><User className="h-3 w-3" /> Assigned: {stakeholder?.organization_name || "Unassigned"}</div>
            </div>
          </div>
          <div className="flex gap-2">
            {rfi.status !== "closed" && (
              <Button variant="outline" size="sm" onClick={closeRfi} className="text-emerald-600 hover:text-emerald-700">
                <CheckCircle2 className="h-4 w-4 mr-2" /> Mark Resolved
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <div className="flex-1 flex overflow-hidden">
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-8">
            {/* The Question */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-primary uppercase tracking-wider">
                <HelpCircle className="h-4 w-4" /> The Question
              </div>
              <div className="bg-muted/50 p-4 rounded-lg border">
                <p className="text-sm whitespace-pre-wrap">{rfi.question}</p>
              </div>
              {rfi.suggested_solution && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-muted-foreground uppercase">Suggested Solution</div>
                  <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 italic">
                    <p className="text-sm text-blue-900">{rfi.suggested_solution}</p>
                  </div>
                </div>
              )}
            </div>

            <hr />

            {/* The Discussion Thread */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-sm font-bold text-primary uppercase tracking-wider">
                <MessageSquare className="h-4 w-4" /> Discussion Thread
              </div>
              
              <div className="space-y-4">
                {responses.map((res) => (
                  <div key={res.id} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span className="font-bold text-foreground">{res.profiles?.full_name || "Unknown"}</span>
                      <span>{format(new Date(res.created_at), "MMM d, h:mm a")}</span>
                    </div>
                    <div className="bg-white p-3 border rounded-md text-sm shadow-sm">
                      {res.response}
                    </div>
                  </div>
                ))}
                {responses.length === 0 && (
                  <div className="text-center py-8 text-sm text-muted-foreground italic border border-dashed rounded-lg">
                    No responses yet. Consultants are notified of this query.
                  </div>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>

      <div className="p-4 border-t bg-muted/10">
        <div className="flex gap-2">
          <Textarea 
            placeholder="Add to the discussion..." 
            className="min-h-[80px]"
            value={newResponse}
            onChange={e => setNewResponse(e.target.value)}
          />
          <Button 
            className="self-end" 
            onClick={handleAddResponse}
            disabled={submitting || !newResponse.trim()}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </Card>
  );
}
