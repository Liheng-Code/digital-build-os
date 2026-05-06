
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

const STATUS_TONE: Record<string, string> = {
  planning: "bg-neutral-status-soft text-neutral-status",
  active: "bg-success-soft text-success",
  on_hold: "bg-warning-soft text-warning",
  completed: "bg-info-soft text-info",
  cancelled: "bg-destructive-soft text-destructive",
};

export default function ProjectDetails() {
  const { activeProject } = useProjects();

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
            <Button variant="outline" size="sm">Edit Project</Button>
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
    </div>
  );
}
