import * as React from "react";
import { manpowerService, TaskResource, LaborCatalog } from "@/services/manpowerService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, Users, Calculator } from "lucide-react";
import { toast } from "sonner";

interface Props {
  taskId: string;
  projectId: string;
  canEdit: boolean;
}

export function TaskResourcesTab({ taskId, projectId, canEdit }: Props) {
  const [resources, setResources] = React.useState<TaskResource[]>([]);
  const [catalog, setCatalog] = React.useState<LaborCatalog[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [newRes, setNewRes] = React.useState({
    labor_role_id: "",
    planned_count: "1",
    planned_man_hours: "0",
  });

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [resData, catData] = await Promise.all([
        manpowerService.listTaskResources(taskId),
        manpowerService.listLaborCatalog(projectId),
      ]);
      setResources(resData);
      setCatalog(catData);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [taskId, projectId]);

  React.useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    if (!newRes.labor_role_id) {
      toast.error("Select a labor role");
      return;
    }
    try {
      await manpowerService.upsertTaskResource({
        task_id: taskId,
        labor_role_id: newRes.labor_role_id,
        planned_count: parseInt(newRes.planned_count) || 1,
        planned_man_hours: parseFloat(newRes.planned_man_hours) || 0,
      });
      toast.success("Resource added");
      setNewRes({ labor_role_id: "", planned_count: "1", planned_man_hours: "0" });
      load();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await manpowerService.deleteTaskResource(id);
      toast.success("Resource removed");
      load();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const totalManHours = resources.reduce((sum, r) => sum + (Number(r.planned_man_hours) || 0), 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Manpower Requirements
              </CardTitle>
              <CardDescription>Assign specific labor roles and planned man-hours to this task</CardDescription>
            </div>
            <div className="flex flex-col items-end">
               <span className="text-2xl font-bold text-primary">{totalManHours}</span>
               <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Total Planned Man-Hours</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {canEdit && (
            <div className="grid grid-cols-1 md:grid-cols-[1fr_100px_120px_auto] gap-3 p-4 bg-muted/30 rounded-xl border mb-6">
              <div className="space-y-1.5">
                <Label className="text-xs">Labor Role</Label>
                <Select
                  value={newRes.labor_role_id}
                  onValueChange={(v) => setNewRes({ ...newRes, labor_role_id: v })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select role..." />
                  </SelectTrigger>
                  <SelectContent>
                    {catalog.map((r) => (
                      <SelectItem key={r.id} value={r.id}>{r.role_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Count</Label>
                <Input
                  type="number"
                  className="h-9"
                  value={newRes.planned_count}
                  onChange={(e) => setNewRes({ ...newRes, planned_count: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Planned MH</Label>
                <Input
                  type="number"
                  className="h-9"
                  value={newRes.planned_man_hours}
                  onChange={(e) => setNewRes({ ...newRes, planned_man_hours: e.target.value })}
                />
              </div>
              <div className="flex items-end">
                <Button className="h-9" onClick={handleAdd}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="py-8 text-center text-muted-foreground">Loading resources...</div>
          ) : resources.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground border-2 border-dashed rounded-lg">
              No manpower assigned to this task.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-center">Count</TableHead>
                  <TableHead className="text-right">Planned Man-Hours</TableHead>
                  <TableHead className="text-right">Actual Man-Hours</TableHead>
                  {canEdit && <TableHead className="w-[50px]"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {resources.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.role?.role_name || "Unknown"}</TableCell>
                    <TableCell className="text-center">{r.planned_count}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.planned_man_hours}h</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">{r.actual_man_hours || 0}h</TableCell>
                    {canEdit && (
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(r.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
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
