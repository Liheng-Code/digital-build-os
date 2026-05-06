
import * as React from "react";
import { useProjectStakeholders, useStakeholders } from "@/hooks/useStakeholders";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Building2, Plus, Trash2, Mail, Phone, 
  ExternalLink, UserPlus, Link as LinkIcon,
  ShieldCheck, Loader2
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { PROJECT_ROLE_OPTIONS, STAKEHOLDER_TYPE_LABELS } from "@/lib/stakeholderMeta";

interface ProjectStakeholdersTabProps {
  projectId: string;
}

export function ProjectStakeholdersTab({ projectId }: ProjectStakeholdersTabProps) {
  const { projectStakeholdersQuery, linkStakeholder } = useProjectStakeholders(projectId);
  const { stakeholdersQuery } = useStakeholders();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedStakeholderId, setSelectedStakeholderId] = React.useState<string | undefined>(undefined);

  const availableStakeholders = React.useMemo(() => {
    const existingIds = new Set(projectStakeholdersQuery.data?.map(s => s.stakeholder_id));
    return stakeholdersQuery.data?.filter(s => !existingIds.has(s.id)) || [];
  }, [stakeholdersQuery.data, projectStakeholdersQuery.data]);

  const handleLink = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = {
      project_id: projectId,
      stakeholder_id: selectedStakeholderId,
      project_role: fd.get("project_role") as string,
      approval_authority: fd.get("approval_authority") === "on",
    };

    if (!data.stakeholder_id) return;
    
    await linkStakeholder.mutateAsync(data);
    setIsDialogOpen(false);
    setSelectedStakeholderId(undefined);
  };

  if (projectStakeholdersQuery.isLoading) {
    return <div className="space-y-3"><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Project Stakeholders</h3>
          <p className="text-sm text-muted-foreground">Manage external parties associated with this project.</p>
        </div>
        <Button size="sm" onClick={() => setIsDialogOpen(true)} className="gap-2">
          <UserPlus className="h-4 w-4" />
          Link Stakeholder
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {projectStakeholdersQuery.data?.map((ps) => (
          <Card key={ps.id} className="overflow-hidden">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] font-normal uppercase tracking-wider">
                      {STAKEHOLDER_TYPE_LABELS[ps.stakeholder?.type || 'other']}
                    </Badge>
                    {ps.approval_authority && (
                      <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px] py-0">
                        <ShieldCheck className="h-3 w-3 mr-1" /> Approver
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-base">{ps.stakeholder?.organization_name}</CardTitle>
                  <p className="text-xs font-medium text-primary uppercase tracking-tighter">
                    {ps.project_role || "External Party"}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="mt-3 grid gap-1.5 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Mail className="h-3 w-3" />
                  {ps.stakeholder?.email || "—"}
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-3 w-3" />
                  {ps.stakeholder?.phone || "—"}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {projectStakeholdersQuery.data?.length === 0 && (
          <div className="col-span-full py-12 text-center border-2 border-dashed rounded-lg bg-muted/20">
            <Building2 className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-20" />
            <p className="text-sm text-muted-foreground">No stakeholders linked to this project yet.</p>
            <Button variant="ghost" size="sm" className="mt-2" onClick={() => setIsDialogOpen(true)}>
              Link your first stakeholder
            </Button>
          </div>
        )}
      </div>

      {/* Link Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Link Stakeholder to Project</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleLink} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Select Organization *</Label>
              <Select onValueChange={setSelectedStakeholderId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Pick a stakeholder" />
                </SelectTrigger>
                <SelectContent>
                  {availableStakeholders.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.organization_name} ({STAKEHOLDER_TYPE_LABELS[s.type]})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Role in this Project</Label>
              <Select name="project_role" defaultValue={PROJECT_ROLE_OPTIONS[0]}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROJECT_ROLE_OPTIONS.map(role => (
                    <SelectItem key={role} value={role}>{role}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <input type="checkbox" name="approval_authority" id="approval_authority_tab" className="h-4 w-4 rounded" />
              <Label htmlFor="approval_authority_tab">This party has approval authority</Label>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={linkStakeholder.isPending}>
                {linkStakeholder.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Link to Project
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
