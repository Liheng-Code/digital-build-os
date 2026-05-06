import * as React from "react";
import { Link } from "react-router-dom";
import { useProjects, PROJECT_STATUS_LABELS, Project } from "@/contexts/ProjectContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, MapPin, Calendar, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const projectSchema = z.object({
  code: z.string().trim().min(2).max(20),
  name: z.string().trim().min(2).max(120),
  client_name: z.string().trim().max(120).optional().or(z.literal("")),
  location: z.string().trim().max(200).optional().or(z.literal("")),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  status: z.enum(["planning", "active", "on_hold", "completed", "cancelled"]),
  start_date: z.string().optional().or(z.literal("")),
  end_date: z.string().optional().or(z.literal("")),
  budget: z.string().optional().or(z.literal("")),
});

const STATUS_TONE: Record<Project["status"], string> = {
  planning: "bg-neutral-status-soft text-neutral-status",
  active: "bg-success-soft text-success",
  on_hold: "bg-warning-soft text-warning",
  completed: "bg-info-soft text-info",
  cancelled: "bg-destructive-soft text-destructive",
};

export default function Projects() {
  const { projects, loading, refresh, setActiveProjectId } = useProjects();
  const { roles, user } = useAuth();
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const canCreate = roles.includes("admin") || roles.includes("project_manager");

  const onCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = projectSchema.safeParse({
      code: fd.get("code"),
      name: fd.get("name"),
      client_name: fd.get("client_name") || "",
      location: fd.get("location") || "",
      description: fd.get("description") || "",
      status: fd.get("status"),
      start_date: fd.get("start_date") || "",
      end_date: fd.get("end_date") || "",
      budget: fd.get("budget") || "",
    });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setSaving(true);
    const { data, error } = await supabase
      .from("projects")
      .insert({
        code: parsed.data.code,
        name: parsed.data.name,
        client_name: parsed.data.client_name || null,
        location: parsed.data.location || null,
        description: parsed.data.description || null,
        status: parsed.data.status,
        start_date: parsed.data.start_date || null,
        end_date: parsed.data.end_date || null,
        budget: parsed.data.budget ? Number(parsed.data.budget) : null,
        created_by: user?.id,
      })
      .select()
      .single();
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Project created");
    setOpen(false);
    await refresh();
    if (data) setActiveProjectId(data.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground">
            All construction projects across the company.
          </p>
        </div>
        {canCreate && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4" /> New Project</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create project</DialogTitle>
                <DialogDescription>
                  Set up a new construction project. You can edit details later.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={onCreate} className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1">
                    <Label htmlFor="code">Code *</Label>
                    <Input id="code" name="code" placeholder="PRJ-001" required maxLength={20} />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input id="name" name="name" placeholder="Riverside Tower Phase 1" required maxLength={120} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="client_name">Client</Label>
                    <Input id="client_name" name="client_name" maxLength={120} />
                  </div>
                  <div>
                    <Label htmlFor="status">Status *</Label>
                    <Select name="status" defaultValue="planning">
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(Object.keys(PROJECT_STATUS_LABELS) as Project["status"][]).map((s) => (
                          <SelectItem key={s} value={s}>{PROJECT_STATUS_LABELS[s]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" name="location" placeholder="Site address" maxLength={200} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label htmlFor="start_date">Start date</Label>
                    <Input id="start_date" name="start_date" type="date" />
                  </div>
                  <div>
                    <Label htmlFor="end_date">End date</Label>
                    <Input id="end_date" name="end_date" type="date" />
                  </div>
                  <div>
                    <Label htmlFor="budget">Budget</Label>
                    <Input id="budget" name="budget" type="number" step="0.01" min="0" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" maxLength={2000} rows={3} />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={saving}>
                    {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                    Create
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : projects.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-muted-foreground">No projects yet.</p>
              {canCreate && (
                <Button className="mt-4" onClick={() => setOpen(true)}>
                  <Plus className="h-4 w-4" /> Create first project
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Timeline</TableHead>
                  <TableHead>Location</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((p) => (
                  <TableRow
                    key={p.id}
                    className="cursor-pointer"
                    onClick={() => setActiveProjectId(p.id)}
                  >
                    <TableCell className="font-mono text-sm font-medium">{p.code}</TableCell>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-muted-foreground">{p.client_name || "—"}</TableCell>
                    <TableCell>
                      <Badge className={STATUS_TONE[p.status]} variant="secondary">
                        {PROJECT_STATUS_LABELS[p.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {p.start_date || p.end_date ? (
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {p.start_date ?? "?"} → {p.end_date ?? "?"}
                        </span>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {p.location ? (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {p.location}
                        </span>
                      ) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
