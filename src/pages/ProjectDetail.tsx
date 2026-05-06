
import * as React from "react";
import { useProjects, PROJECT_STATUS_LABELS } from "@/contexts/ProjectContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, MapPin, Calendar, Info, 
  Users, Wallet, FileText, ChevronLeft
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ProjectStakeholdersTab } from "@/components/projects/ProjectStakeholdersTab";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  DialogDescription, DialogFooter 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { useStakeholders } from "@/hooks/useStakeholders";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

const STATUS_TONE: Record<string, string> = {
  planning: "bg-neutral-status-soft text-neutral-status",
  active: "bg-success-soft text-success",
  on_hold: "bg-warning-soft text-warning",
  completed: "bg-info-soft text-info",
  cancelled: "bg-destructive-soft text-destructive",
};

export default function ProjectDetails() {
  const { activeProject, refresh } = useProjects();
  const { stakeholdersQuery } = useStakeholders();
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [selectedClientId, setSelectedClientId] = React.useState<string | undefined>(undefined);

  const clients = React.useMemo(() => 
    stakeholdersQuery.data?.filter(s => s.type === "client") || [],
    [stakeholdersQuery.data]
  );

  React.useEffect(() => {
    if (activeProject) {
      setSelectedClientId(activeProject.client_id || undefined);
    }
  }, [activeProject, isEditDialogOpen]);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!activeProject) return;

    const fd = new FormData(e.currentTarget);
    const updates = {
      name: fd.get("name") as string,
      client_id: selectedClientId || null,
      status: fd.get("status") as any,
      location: fd.get("location") as string || null,
      start_date: fd.get("start_date") as string || null,
      end_date: fd.get("end_date") as string || null,
      budget: fd.get("budget") ? Number(fd.get("budget")) : null,
      description: fd.get("description") as string || null,
    };

    setIsSaving(true);
    const { error } = await supabase
      .from("projects")
      .update(updates)
      .eq("id", activeProject.id);
    
    setIsSaving(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Project updated successfully");
      setIsEditDialogOpen(false);
      await refresh();
    }
  };

  if (!activeProject) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Building2 className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
        <h2 className="text-xl font-semibold">No project selected</h2>
        <p className="text-muted-foreground max-w-sm mt-2">
          Please select a project from the project switcher in the sidebar to view details.
        </p>
        <Button asChild className="mt-6" variant="outline">
          <Link to="/projects">View all projects</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <Link to="/projects" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 w-fit">
          <ChevronLeft className="h-3 w-3" /> Back to projects
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-widest">
                {activeProject.code}
              </Badge>
              <Badge className={STATUS_TONE[activeProject.status]}>
                {PROJECT_STATUS_LABELS[activeProject.status]}
              </Badge>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{activeProject.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsEditDialogOpen(true)}>
              Edit Project
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-background border-b rounded-none w-full justify-start h-auto p-0 gap-6">
          <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 pb-2 h-auto font-semibold">
            Overview
          </TabsTrigger>
          <TabsTrigger value="stakeholders" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 pb-2 h-auto font-semibold">
            Stakeholders
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 pt-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs flex items-center gap-2 capitalize">
                  <Building2 className="h-3 w-3" /> Client Organization
                </CardDescription>
                <CardTitle className="text-lg">
                  {activeProject.client?.organization_name || activeProject.client_name || "Internal / None"}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs flex items-center gap-2 capitalize">
                  <MapPin className="h-3 w-3" /> Site Location
                </CardDescription>
                <CardTitle className="text-lg">{activeProject.location || "Not specified"}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs flex items-center gap-2 capitalize">
                  <Wallet className="h-3 w-3" /> Budget
                </CardDescription>
                <CardTitle className="text-lg">
                  {activeProject.budget ? `$${activeProject.budget.toLocaleString()}` : "—"}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm text-muted-foreground">Start Date</span>
                  <span className="text-sm font-medium">{activeProject.start_date || "—"}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm text-muted-foreground">Completion Date</span>
                  <span className="text-sm font-medium">{activeProject.end_date || "—"}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {activeProject.description || "No project description provided."}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="stakeholders" className="pt-4">
          <ProjectStakeholdersTab projectId={activeProject.id} />
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Project Details</DialogTitle>
            <DialogDescription>
              Update the core information for {activeProject.name}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1">
                <Label>Code</Label>
                <Input value={activeProject.code} disabled className="bg-muted" />
              </div>
              <div className="col-span-2">
                <Label htmlFor="name">Name *</Label>
                <Input id="name" name="name" defaultValue={activeProject.name} required />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="client_id">Client Organization</Label>
                <Select 
                  name="client_id" 
                  defaultValue={activeProject.client_id || "none"}
                  onValueChange={(val) => setSelectedClientId(val === "none" ? undefined : val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Internal / None</SelectItem>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.organization_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status">Status *</Label>
                <Select name="status" defaultValue={activeProject.status}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(PROJECT_STATUS_LABELS) as any[]).map((s) => (
                      <SelectItem key={s} value={s}>{PROJECT_STATUS_LABELS[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="location">Site Location</Label>
              <Input id="location" name="location" defaultValue={activeProject.location || ""} />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="start_date">Start Date</Label>
                <Input id="start_date" name="start_date" type="date" defaultValue={activeProject.start_date || ""} />
              </div>
              <div>
                <Label htmlFor="end_date">End Date</Label>
                <Input id="end_date" name="end_date" type="date" defaultValue={activeProject.end_date || ""} />
              </div>
              <div>
                <Label htmlFor="budget">Budget</Label>
                <Input id="budget" name="budget" type="number" step="0.01" defaultValue={activeProject.budget || ""} />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" defaultValue={activeProject.description || ""} rows={3} />
            </div>

            <DialogFooter className="pt-4 border-t">
              <Button type="button" variant="ghost" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
