import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, GripVertical } from "lucide-react";
import { toast } from "sonner";
import {
  OrgDepartmentRow,
  createDepartment, updateDepartment, deleteDepartment,
} from "@/services/organizationService";

const COLOR_TOKENS = [
  { value: "primary", label: "Primary (blue)" },
  { value: "info", label: "Info (sky)" },
  { value: "success", label: "Success (green)" },
  { value: "warning", label: "Warning (amber)" },
  { value: "accent", label: "Accent" },
  { value: "destructive", label: "Destructive (red)" },
  { value: "neutral-status", label: "Neutral" },
];

const ICONS = ["building", "layout", "wrench", "shopping-cart", "hard-hat", "users", "calculator", "briefcase", "settings", "shield"];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  departments: OrgDepartmentRow[];
  onChanged: () => void;
}

interface FormState {
  id?: string;
  key: string;
  label: string;
  color_token: string;
  icon_key: string;
  sort_order: number;
  is_active: boolean;
}

const empty: FormState = { key: "", label: "", color_token: "primary", icon_key: "building", sort_order: 99, is_active: true };

export function DepartmentManagerDialog({ open, onOpenChange, departments, onChanged }: Props) {
  const [form, setForm] = React.useState<FormState>(empty);
  const [editing, setEditing] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  const reset = () => { setForm(empty); setEditing(null); };

  const onEdit = (d: OrgDepartmentRow) => {
    setEditing(d.id);
    setForm({ id: d.id, key: d.key, label: d.label, color_token: d.color_token, icon_key: d.icon_key, sort_order: d.sort_order, is_active: d.is_active });
  };

  const onSave = async () => {
    if (!form.key.trim() || !form.label.trim()) { toast.error("Key and label are required"); return; }
    setSaving(true);
    try {
      if (editing) {
        await updateDepartment(editing, form);
        toast.success("Department updated");
      } else {
        await createDepartment({
          key: form.key.toLowerCase().replace(/[^a-z0-9_]/g, "_"),
          label: form.label,
          color_token: form.color_token,
          icon_key: form.icon_key,
          sort_order: form.sort_order,
          is_active: form.is_active,
        });
        toast.success("Department created");
      }
      reset();
      onChanged();
    } catch (e: any) {
      toast.error(e.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (d: OrgDepartmentRow) => {
    if (!confirm(`Delete department "${d.label}"? Members keep their department key but it won't appear in lists.`)) return;
    try {
      await deleteDepartment(d.id);
      toast.success("Department deleted");
      onChanged();
    } catch (e: any) {
      toast.error(e.message ?? "Delete failed");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Departments</DialogTitle>
          <DialogDescription>Add, edit, or remove departments. Members reference these by key.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border">
            <div className="max-h-64 overflow-y-auto divide-y">
              {departments.map((d) => (
                <div key={d.id} className="flex items-center gap-3 px-3 py-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <span className={`inline-block h-3 w-3 rounded-full bg-${d.color_token}`} />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{d.label}</div>
                    <div className="text-xs text-muted-foreground font-mono">{d.key} · order {d.sort_order} {!d.is_active && "· inactive"}</div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => onEdit(d)} aria-label={`Edit ${d.label}`}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onDelete(d)} aria-label={`Delete ${d.label}`}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
            <div className="text-sm font-semibold">{editing ? "Edit department" : "Add a new department"}</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="dept-key">Key (lowercase, no spaces)</Label>
                <Input id="dept-key" value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} placeholder="e.g. legal" disabled={!!editing} />
              </div>
              <div>
                <Label htmlFor="dept-label">Label</Label>
                <Input id="dept-label" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="e.g. Legal Affairs" />
              </div>
              <div>
                <Label>Color</Label>
                <Select value={form.color_token} onValueChange={(v) => setForm({ ...form, color_token: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COLOR_TOKENS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Icon</Label>
                <Select value={form.icon_key} onValueChange={(v) => setForm({ ...form, icon_key: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ICONS.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="dept-order">Sort order</Label>
                <Input id="dept-order" type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
              </div>
              <div className="flex items-center justify-between gap-3 pt-6">
                <Label htmlFor="dept-active">Active</Label>
                <Switch id="dept-active" checked={form.is_active} onCheckedChange={(c) => setForm({ ...form, is_active: c })} />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              {editing && <Button variant="ghost" onClick={reset}>Cancel</Button>}
              <Button onClick={onSave} disabled={saving} className="gap-1">
                <Plus className="h-4 w-4" /> {editing ? "Save changes" : "Add department"}
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
