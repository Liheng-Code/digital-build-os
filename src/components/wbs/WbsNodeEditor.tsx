import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { WbsNode, WbsNodeType, WBS_NODE_TYPE_LABELS } from "@/lib/wbsMeta";
import { recordAuditEventSafe } from "@/services/auditService";

interface Props {
  projectId: string;
  node: WbsNode | null;            // null when creating
  parentId: string | null;          // for create mode
  parentPath: string | null;
  parentType?: WbsNodeType | null;
  nodeTypeOptions?: WbsNodeType[];
  nodeTypeLabels?: Record<string, string>;
  canEdit: boolean;
  onSaved: () => void;
  onDeleted: () => void;
  onCancel: () => void;
}

export function WbsNodeEditor({
  projectId, node, parentId, parentPath, parentType, nodeTypeOptions, nodeTypeLabels, canEdit, onSaved, onDeleted, onCancel,
}: Props) {
  const { user } = useAuth();
  const isCreate = !node;
  const [code, setCode] = useState(node?.code ?? "");
  const [name, setName] = useState(node?.name ?? "");
  const [type, setType] = useState<WbsNodeType>(node?.node_type ?? "zone");
  const [description, setDescription] = useState(node?.description ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const typeOptions = nodeTypeOptions?.length
    ? nodeTypeOptions
    : (Object.keys(WBS_NODE_TYPE_LABELS) as WbsNodeType[]);
  const labels = nodeTypeLabels ?? WBS_NODE_TYPE_LABELS;

  useEffect(() => {
    setCode(node?.code ?? "");
    setName(node?.name ?? "");
    setDescription(node?.description ?? "");
    
    if (node) {
      setType(node.node_type);
    } else {
      // Suggest next type in hierarchy
      if (parentType === "building") setType("level");
      else if (parentType === "level") setType("zone");
      else if (parentType === "zone") setType("room");
      else if (parentType === "room") setType("element");
      else if (!parentType) setType("building"); // Root default
      else setType("other");
    }
  }, [node, parentType]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) {
      toast.error("Code and name are required");
      return;
    }
    setSaving(true);
    if (isCreate) {
      const { data, error } = await supabase.from("wbs_nodes").insert({
        project_id: projectId,
        parent_id: parentId,
        code: code.trim(),
        name: name.trim(),
        node_type: type,
        description: description.trim() || null,
        created_by: user?.id ?? null,
      }).select("id").single();
      setSaving(false);
      if (error) {
        toast.error(error.message.includes("duplicate") ? "Code already exists in this project" : error.message);
        return;
      }
      toast.success("Node created");
      await recordAuditEventSafe({
        moduleCode: "WBS",
        entityType: "wbs_node",
        entityId: data?.id ?? code.trim(),
        actionType: "CREATE",
        actionLabel: "WBS Node Created",
        projectId,
        newValues: {
          parent_id: parentId,
          code: code.trim(),
          name: name.trim(),
          node_type: type,
          description: description.trim() || null
        },
        severity: "medium"
      });
      onSaved();
    } else {
      const before = node!;
      const { error } = await supabase
        .from("wbs_nodes")
        .update({
          code: code.trim(),
          name: name.trim(),
          node_type: type,
          description: description.trim() || null,
        })
        .eq("id", node!.id);
      setSaving(false);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Node updated");
      await recordAuditEventSafe({
        moduleCode: "WBS",
        entityType: "wbs_node",
        entityId: before.id,
        actionType: "UPDATE",
        actionLabel: "WBS Node Updated",
        projectId,
        oldValues: before,
        newValues: {
          code: code.trim(),
          name: name.trim(),
          node_type: type,
          description: description.trim() || null
        },
        changedFields: ["code", "name", "node_type", "description"],
        severity: "medium"
      });
      onSaved();
    }
  };

  const onDelete = async () => {
    if (!node) return;
    setDeleting(true);
    const { error } = await supabase.from("wbs_nodes").delete().eq("id", node.id);
    setDeleting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Node deleted");
    await recordAuditEventSafe({
      moduleCode: "WBS",
      entityType: "wbs_node",
      entityId: node.id,
      actionType: "DELETE",
      actionLabel: "WBS Node Deleted",
      projectId,
      oldValues: node,
      severity: "critical"
    });
    onDeleted();
  };

  return (
    <Card className="border-0 shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0 pb-4">
        <CardTitle>{isCreate ? "New WBS node" : "Edit node"}</CardTitle>
        <CardDescription>
          {isCreate
            ? parentPath
              ? <>Adding child under <span className="font-mono">{parentPath}</span></>
              : "Adding a top-level node"
            : <span className="font-mono text-xs">{node?.path_text}</span>}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="code">Code *</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="BLDG-1"
                disabled={!canEdit}
                maxLength={60}
                required
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Building 1 - Tower"
                disabled={!canEdit}
                maxLength={200}
                required
              />
            </div>
          </div>
          <div>
            <Label htmlFor="type">Type *</Label>
            <Select value={type} onValueChange={(v) => setType(v as WbsNodeType)} disabled={!canEdit}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {typeOptions.map((t) => (
                  <SelectItem key={t} value={t}>{labels[t] ?? WBS_NODE_TYPE_LABELS[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={1000}
              disabled={!canEdit}
            />
          </div>

          {canEdit && (
            <div className="flex items-center justify-between gap-2">
              {!isCreate && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="outline" className="border-destructive text-destructive hover:bg-destructive-soft">
                      <Trash2 className="h-4 w-4" /> Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this WBS node?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Children will need to be re-linked. Tasks attached to this node or any descendant must be moved first.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={onDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              <div className="flex gap-2 ml-auto">
                <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                <Button type="submit" disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {isCreate ? "Create" : "Save changes"}
                </Button>
              </div>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
