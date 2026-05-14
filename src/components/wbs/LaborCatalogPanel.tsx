import * as React from "react";
import { manpowerService, LaborCatalog } from "@/services/manpowerService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

interface Props {
  projectId: string;
  canEdit: boolean;
}

export function LaborCatalogPanel({ projectId, canEdit }: Props) {
  const [roles, setRoles] = React.useState<LaborCatalog[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<LaborCatalog | null>(null);

  const [form, setForm] = React.useState({
    role_name: "",
    standard_rate: "0",
    description: "",
  });

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await manpowerService.listLaborCatalog(projectId);
      setRoles(data);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  React.useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    try {
      await manpowerService.upsertLaborRole({
        id: selected?.id,
        project_id: projectId,
        role_name: form.role_name,
        standard_rate: parseFloat(form.standard_rate) || 0,
        description: form.description,
      });
      toast.success(selected ? "Role updated" : "Role created");
      setOpen(false);
      load();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? This will remove this role from all assigned tasks.")) return;
    try {
      await manpowerService.deleteLaborRole(id);
      toast.success("Role deleted");
      load();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Manpower Catalog
          </CardTitle>
          <CardDescription>Define standardized labor roles and rates for this project</CardDescription>
        </div>
        {canEdit && (
          <Button size="sm" onClick={() => {
            setSelected(null);
            setForm({ role_name: "", standard_rate: "0", description: "" });
            setOpen(true);
          }}>
            <Plus className="h-4 w-4 mr-1" />
            Add Role
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-8 text-center text-muted-foreground">Loading catalog...</div>
        ) : roles.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground border-2 border-dashed rounded-lg">
            No labor roles defined. Add roles like "Foreman", "Welder", etc.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role Name</TableHead>
                <TableHead>Std. Rate ($/hr)</TableHead>
                <TableHead>Description</TableHead>
                {canEdit && <TableHead className="w-[100px]"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.role_name}</TableCell>
                  <TableCell className="font-mono text-sm">${r.standard_rate}</TableCell>
                  <TableCell className="text-muted-foreground text-sm max-w-xs truncate">{r.description || "-"}</TableCell>
                  {canEdit && (
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                          setSelected(r);
                          setForm({
                            role_name: r.role_name,
                            standard_rate: String(r.standard_rate),
                            description: r.description || "",
                          });
                          setOpen(true);
                        }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(r.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selected ? "Edit Role" : "Add Labor Role"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Role Name</Label>
              <Input
                placeholder="e.g. Foreman, Welder, Electrician"
                value={form.role_name}
                onChange={(e) => setForm({ ...form, role_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Standard Rate ($/hr)</Label>
              <Input
                type="number"
                value={form.standard_rate}
                onChange={(e) => setForm({ ...form, standard_rate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Description (Optional)</Label>
              <Input
                placeholder="Detailed scope or grade"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Role</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
