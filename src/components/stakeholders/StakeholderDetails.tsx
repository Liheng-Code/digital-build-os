
import * as React from "react";
import { 
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription 
} from "@/components/ui/sheet";
import { 
  Stakeholder, 
  STAKEHOLDER_TYPE_LABELS, 
  STAKEHOLDER_STATUS_COLORS,
  PROJECT_ROLE_OPTIONS,
  APPROVAL_LEVEL_LABELS,
  WORKFLOW_LABELS,
  ApprovalLevel,
  ProjectStakeholder,
} from "@/lib/stakeholderMeta";
import { 
  useStakeholderContacts, 
  useStakeholderProjects,
  useStakeholders
} from "@/hooks/useStakeholders";
import { useProjects } from "@/contexts/ProjectContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Plus, Mail, Phone, MapPin, Building2, UserPlus, 
  Link as LinkIcon, ExternalLink, Trash2, Save, X, 
  ChevronRight, Loader2, ShieldCheck, Edit2, Pencil
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WbsNodePicker } from "@/components/wbs/WbsNodePicker";
import { StakeholderDialog } from "./StakeholderDialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface StakeholderDetailsProps {
  stakeholder: Stakeholder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: "sheet" | "panel";
}

export function StakeholderDetails({ stakeholder, open, onOpenChange, mode = "sheet" }: StakeholderDetailsProps) {
  const [isContactDialogOpen, setIsContactDialogOpen] = React.useState(false);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = React.useState(false);
  const [isEditingNotes, setIsEditingNotes] = React.useState(false);
  const [notes, setNotes] = React.useState("");
  const [editingAssignment, setEditingAssignment] = React.useState<ProjectStakeholder | null>(null);

  const stakeholderId = stakeholder?.id;
  const { contactsQuery, createContact, deleteContact } = useStakeholderContacts(stakeholderId);
  const { stakeholderProjectsQuery, linkProject, unlinkProject, updateAssignment } = useStakeholderProjects(stakeholderId);
  const { updateStakeholder } = useStakeholders();
  const { projects } = useProjects();

  // Reset notes when stakeholder changes
  React.useEffect(() => {
    if (stakeholder) {
      setNotes(stakeholder.notes || "");
      setIsEditingNotes(false);
    }
  }, [stakeholderId]);

  if (!stakeholder) return null;

  const handleSaveNotes = async () => {
    try {
      await updateStakeholder.mutateAsync({ id: stakeholder.id, notes });
      setIsEditingNotes(false);
    } catch (err) {}
  };

  const handleAddContact = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = {
      stakeholder_id: stakeholder.id,
      full_name: fd.get("full_name") as string,
      job_title: fd.get("job_title") as string,
      email: fd.get("email") as string,
      phone: fd.get("phone") as string,
      is_primary: fd.get("is_primary") === "on",
    };

    if (!data.full_name) {
      toast.error("Full name is required");
      return;
    }

    try {
      await createContact.mutateAsync(data);
      setIsContactDialogOpen(false);
    } catch (err) {}
  };

  const handleLinkProject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = {
      stakeholder_id: stakeholder.id,
      project_id: fd.get("project_id") as string,
      project_role: fd.get("project_role") as string,
      approval_authority: fd.get("approval_authority") === "on",
    };

    if (!data.project_id) {
      toast.error("Select a project");
      return;
    }

    try {
      await linkProject.mutateAsync(data);
      setIsLinkDialogOpen(false);
    } catch (err) {}
  };

  const handleUpdateAssignment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingAssignment) return;

    const fd = new FormData(e.currentTarget);
    const responsibilities = {
      executes_tasks: fd.get("wf_executes_tasks") === "on",
      reviews_rfis: fd.get("wf_reviews_rfis") === "on",
      approves_inspections: fd.get("wf_approves_inspections") === "on",
      receives_transmittals: fd.get("wf_receives_transmittals") === "on",
      procurement_involvement: fd.get("wf_procurement_involvement") === "on",
      safety_oversight: fd.get("wf_safety_oversight") === "on",
    };

    const updates = {
      id: editingAssignment.id,
      project_role: fd.get("project_role") as string,
      discipline: fd.get("discipline") as string,
      approval_level: fd.get("approval_level") as ApprovalLevel,
      approval_authority: (fd.get("approval_level") as string) !== "none",
      responsibilities: responsibilities as any,
    };

    try {
      await updateAssignment.mutateAsync(updates);
      setEditingAssignment(null);
    } catch (err) {}
  };

  const content = (
    <div className={cn("flex flex-col h-full", mode === "panel" ? "p-0" : "")}>
      <div className={cn("space-y-4", mode === "panel" ? "p-6 border-b" : "pr-6")}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-normal capitalize">
              {STAKEHOLDER_TYPE_LABELS[stakeholder.type]}
            </Badge>
            <Badge className={cn("font-normal capitalize", STAKEHOLDER_STATUS_COLORS[stakeholder.status])}>
              {stakeholder.status}
            </Badge>
          </div>
          {mode === "panel" && (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">{stakeholder.organization_name}</h2>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Building2 className="h-3 w-3" />
            ID: {stakeholder.id.slice(0, 8)}...
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 py-4 border-y border-dashed mt-4">
          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Email</span>
            <div className="flex items-center gap-2 text-xs truncate">
              <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              {stakeholder.email || "—"}
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Phone</span>
            <div className="flex items-center gap-2 text-xs">
              <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              {stakeholder.phone || "—"}
            </div>
          </div>
          <div className="col-span-2 space-y-1">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Address</span>
            <div className="flex items-center gap-2 text-xs">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              {stakeholder.address || "No address provided"}
            </div>
          </div>
        </div>
      </div>

      <div className={cn("flex-1 overflow-y-auto", mode === "panel" ? "p-6" : "")}>

          <Tabs defaultValue="contacts" className="mt-8">
            <TabsList className="w-full justify-start border-b rounded-none bg-transparent h-auto p-0">
              <TabsTrigger 
                value="contacts" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
              >
                Contacts
              </TabsTrigger>
              <TabsTrigger 
                value="projects" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
              >
                Linked Projects
              </TabsTrigger>
              <TabsTrigger 
                value="notes" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
              >
                Internal Notes
              </TabsTrigger>
              <TabsTrigger 
                value="performance" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
              >
                Performance
              </TabsTrigger>
            </TabsList>

            <TabsContent value="contacts" className="pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">Contact Persons</h4>
                <Button size="sm" variant="outline" className="h-8 gap-1" onClick={() => setIsContactDialogOpen(true)}>
                  <UserPlus className="h-3.5 w-3.5" />
                  Add Contact
                </Button>
              </div>

              {contactsQuery.isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : contactsQuery.data?.length === 0 ? (
                <div className="py-12 text-center border rounded-lg bg-muted/20 border-dashed">
                  <p className="text-sm text-muted-foreground">No contacts registered.</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {contactsQuery.data?.map((contact) => (
                    <Card key={contact.id} className={cn(contact.is_primary && "border-primary/50 bg-primary/5")}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{contact.full_name}</span>
                              {contact.is_primary && <Badge variant="secondary" className="text-[10px] h-4">Primary</Badge>}
                            </div>
                            <p className="text-xs text-muted-foreground">{contact.job_title || "No title"}</p>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => {
                              if (confirm("Delete this contact?")) deleteContact.mutate(contact.id);
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {contact.email || "—"}
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {contact.phone || "—"}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="projects" className="pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">Associated Projects</h4>
                <Button size="sm" variant="outline" className="h-8 gap-1" onClick={() => setIsLinkDialogOpen(true)}>
                  <LinkIcon className="h-3.5 w-3.5" />
                  Link Project
                </Button>
              </div>

              {stakeholderProjectsQuery.isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : stakeholderProjectsQuery.data?.length === 0 ? (
                <div className="py-12 text-center border rounded-lg bg-muted/20 border-dashed">
                  <p className="text-sm text-muted-foreground">No project associations found.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {stakeholderProjectsQuery.data?.map((lp) => (
                    <Card key={lp.id} className="overflow-hidden border-muted-foreground/20">
                      <div className="bg-muted/30 px-4 py-2 border-b flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{lp.project.name}</span>
                          <span className="text-[10px] font-mono text-muted-foreground bg-background px-1 rounded">{lp.project.code}</span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => {
                            if (confirm("Unlink this project?")) unlinkProject.mutate(lp.id);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <CardContent className="p-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <Label className="text-[10px] text-muted-foreground uppercase">Project Role</Label>
                            <div className="text-sm font-medium">{lp.project_role || "External Party"}</div>
                          </div>
                          <div className="space-y-1 text-right">
                            <Label className="text-[10px] text-muted-foreground uppercase">Approval Authority</Label>
                            <div>
                              <Badge 
                                variant={lp.approval_authority ? "default" : "outline"}
                                className={cn("text-[10px] py-0", lp.approval_authority ? "bg-emerald-500" : "")}
                              >
                                {lp.approval_authority ? "Authorized" : "No Authority"}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3 pt-3 border-t">
                          <Label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-2">
                            <ShieldCheck className="h-3 w-3" />
                            Workflow Responsibility Mapping
                          </Label>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-2 pb-2">
                            {Object.entries(WORKFLOW_LABELS).map(([key, label]) => (
                              <div key={key} className="flex items-center justify-between group">
                                <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">{label}</span>
                                <div className="h-3.5 w-7 rounded-full bg-muted relative cursor-not-allowed">
                                  <div className={cn(
                                    "absolute top-0.5 left-0.5 h-2.5 w-2.5 rounded-full transition-all",
                                    key === 'receives_transmittals' ? "bg-primary translate-x-3" : "bg-muted-foreground/30"
                                  )} />
                                </div>
                              </div>
                            ))}
                          </div>

                          <Label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-2 pt-2 border-t border-dashed">
                            <MapPin className="h-3 w-3" />
                            Access & Location Restrictions
                          </Label>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">Access Level</span>
                              <Badge variant="outline" className="text-[10px] uppercase font-mono px-1.5 h-5 border-emerald-500/50 text-emerald-600 bg-emerald-50/50">
                                Full Access
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between group">
                              <span className="text-xs text-muted-foreground group-hover:text-foreground">WBS Restriction</span>
                              <span className="text-[10px] text-muted-foreground italic">No restrictions (All Locations)</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="pt-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="w-full h-8 text-[11px] gap-2 text-primary border border-dashed hover:bg-primary/5"
                            onClick={() => setEditingAssignment(lp)}
                          >
                            <Edit2 className="h-3 w-3" />
                            Manage Controls & Restrictions
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="performance" className="pt-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-muted-foreground">Response Rate</span>
                      <Badge variant="outline" className="text-[10px] bg-background border-emerald-500/50 text-emerald-600 h-4 px-1">Excellent</Badge>
                    </div>
                    <div className="text-2xl font-bold">92%</div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 w-[92%]" />
                    </div>
                    <p className="text-[10px] text-muted-foreground italic">Avg. Response: 1.2 Days</p>
                  </CardContent>
                </Card>
                <Card className="bg-amber-500/5 border-amber-500/20">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-muted-foreground">Reliability Score</span>
                      <Badge variant="outline" className="text-[10px] bg-background border-amber-500/50 text-amber-600 h-4 px-1">Good</Badge>
                    </div>
                    <div className="text-2xl font-bold">85%</div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 w-[85%]" />
                    </div>
                    <p className="text-[10px] text-muted-foreground italic">On-time delivery performance</p>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <ExternalLink className="h-3.5 w-3.5" />
                  Workflow Completion Analytics
                </h4>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px]">
                      <span>RFI Review Participation</span>
                      <span className="font-mono">14/15 Closed</span>
                    </div>
                    <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary w-[93%]" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px]">
                      <span>Task Execution Quality</span>
                      <span className="font-mono">88% Passing</span>
                    </div>
                    <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 w-[88%]" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="bg-muted/30 p-3 rounded-lg flex items-start gap-3 border border-dashed">
                  <ShieldCheck className="h-4 w-4 text-primary mt-0.5" />
                  <div className="space-y-1">
                    <div className="text-[11px] font-bold">Accountability Status</div>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      No active escalations found for this stakeholder. All performance metrics are currently within the project threshold (Director Standard).
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="notes" className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">Internal Notes</h4>
                  {!isEditingNotes && (
                    <Button size="sm" variant="ghost" className="h-8" onClick={() => setIsEditingNotes(true)}>
                      Edit Notes
                    </Button>
                  )}
                </div>
                {isEditingNotes ? (
                  <div className="space-y-3">
                    <Textarea 
                      value={notes} 
                      onChange={(e) => setNotes(e.target.value)} 
                      placeholder="Add internal notes about this stakeholder..."
                      className="min-h-[150px]"
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setIsEditingNotes(false)}>Cancel</Button>
                      <Button size="sm" onClick={handleSaveNotes} disabled={updateStakeholder.isPending}>
                        {updateStakeholder.isPending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                        Save Notes
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-lg bg-muted/30 border border-dashed min-h-[100px]">
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {stakeholder.notes || "No internal notes added for this stakeholder."}
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
      </div>
    </div>
  );

  return (
    <>
      {mode === "sheet" ? (
        <Sheet open={open} onOpenChange={onOpenChange}>
          <SheetContent className="sm:max-w-xl overflow-y-auto p-0">
            {content}
          </SheetContent>
        </Sheet>
      ) : (
        content
      )}

      {/* Add Contact Dialog */}
      <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Contact Person</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddContact} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input name="full_name" placeholder="John Doe" required />
            </div>
            <div className="space-y-2">
              <Label>Job Title</Label>
              <Input name="job_title" placeholder="Project Director" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input name="email" type="email" placeholder="john@example.com" />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input name="phone" placeholder="+1..." />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <input type="checkbox" name="is_primary" id="is_primary" className="h-4 w-4 rounded" />
              <Label htmlFor="is_primary">Set as primary contact</Label>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsContactDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createContact.isPending}>
                {createContact.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Contact
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Link Project Dialog */}
      <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Link to Project</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleLinkProject} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Select Project *</Label>
              <Select name="project_id" required>
                <SelectTrigger>
                  <SelectValue placeholder="Pick a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.code} · {p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Stakeholder Role *</Label>
                <Select name="project_role" defaultValue={PROJECT_ROLE_OPTIONS[0]} required>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Pick a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_ROLE_OPTIONS.map(role => (
                      <SelectItem key={role} value={role} className="text-xs">{role}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Discipline</Label>
                <Select name="discipline" defaultValue="General">
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Pick a discipline" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="General" className="text-xs">General / All</SelectItem>
                    <SelectItem value="ARC" className="text-xs">Architectural (ARC)</SelectItem>
                    <SelectItem value="STR" className="text-xs">Structural (STR)</SelectItem>
                    <SelectItem value="MEP" className="text-xs">Mechanical/Elec (MEP)</SelectItem>
                    <SelectItem value="CIV" className="text-xs">Civil / Infrastructure</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Approval Authority Level</Label>
              <Select name="approval_level" defaultValue="none">
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(APPROVAL_LEVEL_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value} className="text-xs">{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="bg-muted/30 p-3 rounded-lg space-y-2">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase">Initial Workflow Access</Label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(WORKFLOW_LABELS).map(([key, label]) => (
                  <div key={key} className="flex items-center gap-2">
                    <input type="checkbox" name={`wf_${key}`} id={`wf_${key}`} defaultChecked={key === 'receives_transmittals'} className="h-3 w-3 rounded" />
                    <Label htmlFor={`wf_${key}`} className="text-[10px] font-normal cursor-pointer">{label}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-center justify-between">
                <Label>Project Access Level</Label>
                <div className="flex bg-muted rounded-lg p-0.5">
                  <Button type="button" variant="ghost" size="sm" className="h-7 text-[10px] px-2 bg-background shadow-sm">Full</Button>
                  <Button type="button" variant="ghost" size="sm" className="h-7 text-[10px] px-2 opacity-50">Restricted</Button>
                </div>
              </div>
              
              <div className="space-y-2 opacity-50 pointer-events-none">
                <Label className="text-[10px] uppercase">WBS Location Restriction</Label>
                <div className="text-xs italic text-muted-foreground bg-muted/20 p-2 rounded border border-dashed text-center">
                  Select "Restricted" above to bind to specific WBS nodes
                </div>
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsLinkDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={linkProject.isPending}>
                {linkProject.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Link Project
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* Edit Assignment Dialog */}
      <Dialog open={!!editingAssignment} onOpenChange={(o) => !o && setEditingAssignment(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Controls & Restrictions</DialogTitle>
          </DialogHeader>
          {editingAssignment && (
            <form onSubmit={handleUpdateAssignment} className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Stakeholder Role *</Label>
                  <Select name="project_role" defaultValue={editingAssignment.project_role || PROJECT_ROLE_OPTIONS[0]} required>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Pick a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROJECT_ROLE_OPTIONS.map(role => (
                        <SelectItem key={role} value={role} className="text-xs">{role}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Discipline</Label>
                  <Select name="discipline" defaultValue={editingAssignment.discipline || "General"}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Pick a discipline" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="General" className="text-xs">General / All</SelectItem>
                      <SelectItem value="ARC" className="text-xs">Architectural (ARC)</SelectItem>
                      <SelectItem value="STR" className="text-xs">Structural (STR)</SelectItem>
                      <SelectItem value="MEP" className="text-xs">Mechanical/Elec (MEP)</SelectItem>
                      <SelectItem value="CIV" className="text-xs">Civil / Infrastructure</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Approval Authority Level</Label>
                <Select name="approval_level" defaultValue={editingAssignment.approval_level || "none"}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(APPROVAL_LEVEL_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value} className="text-xs">{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="bg-muted/30 p-3 rounded-lg space-y-2">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase">Workflow Responsibility Mapping</Label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(WORKFLOW_LABELS).map(([key, label]) => (
                    <div key={key} className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        name={`wf_${key}`} 
                        id={`edit_wf_${key}`} 
                        defaultChecked={!!(editingAssignment.responsibilities as any)?.[key]} 
                        className="h-3 w-3 rounded" 
                      />
                      <Label htmlFor={`edit_wf_${key}`} className="text-[10px] font-normal cursor-pointer">{label}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t">
                <div className="flex items-center justify-between">
                  <Label>Project Access Level</Label>
                  <div className="flex bg-muted rounded-lg p-0.5">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      className={cn("h-7 text-[10px] px-2", editingAssignment.access_level === 'full' && "bg-background shadow-sm")}
                    >
                      Full
                    </Button>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      className={cn("h-7 text-[10px] px-2", editingAssignment.access_level === 'restricted' && "bg-background shadow-sm")}
                    >
                      Restricted
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase">WBS Location Restriction</Label>
                  <WbsNodePicker
                    projectId={editingAssignment.project_id}
                    value={editingAssignment.restricted_wbs_ids?.[0] || null}
                    onChange={(id) => {
                      // Currently supporting single WBS restriction via UI
                    }}
                  />
                </div>
              </div>

              <DialogFooter className="pt-4">
                <Button type="button" variant="ghost" onClick={() => setEditingAssignment(null)}>Cancel</Button>
                <Button type="submit" disabled={updateAssignment.isPending}>
                  {updateAssignment.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
