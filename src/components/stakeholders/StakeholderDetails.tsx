
import * as React from "react";
import { 
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription 
} from "@/components/ui/sheet";
import { 
  Stakeholder, 
  STAKEHOLDER_TYPE_LABELS, 
  STAKEHOLDER_STATUS_COLORS,
  PROJECT_ROLE_OPTIONS
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
  ChevronRight, Loader2
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
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface StakeholderDetailsProps {
  stakeholder: Stakeholder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StakeholderDetails({ stakeholder, open, onOpenChange }: StakeholderDetailsProps) {
  const [isContactDialogOpen, setIsContactDialogOpen] = React.useState(false);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = React.useState(false);
  const [isEditingNotes, setIsEditingNotes] = React.useState(false);
  const [notes, setNotes] = React.useState("");

  const stakeholderId = stakeholder?.id;
  const { contactsQuery, createContact, deleteContact } = useStakeholderContacts(stakeholderId);
  const { stakeholderProjectsQuery, linkProject, unlinkProject } = useStakeholderProjects(stakeholderId);
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

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          <SheetHeader className="space-y-4 pr-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-normal capitalize">
                  {STAKEHOLDER_TYPE_LABELS[stakeholder.type]}
                </Badge>
                <Badge className={cn("font-normal capitalize", STAKEHOLDER_STATUS_COLORS[stakeholder.status])}>
                  {stakeholder.status}
                </Badge>
              </div>
              <SheetTitle className="text-2xl font-bold">{stakeholder.organization_name}</SheetTitle>
              <SheetDescription className="flex items-center gap-2">
                <Building2 className="h-3 w-3" />
                ID: {stakeholder.id.slice(0, 8)}...
              </SheetDescription>
            </div>

            <div className="grid grid-cols-2 gap-4 py-4 border-y border-dashed">
              <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</span>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  {stakeholder.email || "—"}
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Phone</span>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  {stakeholder.phone || "—"}
                </div>
              </div>
              <div className="col-span-2 space-y-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Address</span>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  {stakeholder.address || "No address provided"}
                </div>
              </div>
            </div>
          </SheetHeader>

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
                <div className="grid gap-3">
                  {stakeholderProjectsQuery.data?.map((lp) => (
                    <Card key={lp.id}>
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">{lp.project.name}</span>
                            <span className="text-[10px] font-mono text-muted-foreground">{lp.project.code}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-[10px] py-0">{lp.project_role || "External Party"}</Badge>
                            {lp.approval_authority && (
                              <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px] py-0">Approver</Badge>
                            )}
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => {
                            if (confirm("Unlink this project?")) unlinkProject.mutate(lp.id);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
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
        </SheetContent>
      </Sheet>

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
            <div className="space-y-2">
              <Label>Stakeholder Role in Project</Label>
              <Select name="project_role" defaultValue={PROJECT_ROLE_OPTIONS[0]}>
                <SelectTrigger>
                  <SelectValue placeholder="Pick a role" />
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_ROLE_OPTIONS.map(role => (
                    <SelectItem key={role} value={role}>{role}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <input type="checkbox" name="approval_authority" id="approval_authority" className="h-4 w-4 rounded" />
              <Label htmlFor="approval_authority">Has approval authority</Label>
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
    </>
  );
}
