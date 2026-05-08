import * as React from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Pencil, Loader2, Trash2 } from "lucide-react";

type AdminFormValue = string | number | boolean;
type AdminForm = Record<string, AdminFormValue>;
type AdminRow = Record<string, unknown>;

interface AdminQueryResult {
  data: AdminRow[] | null;
  error: { message: string } | null;
}

interface AdminSelectQuery extends PromiseLike<AdminQueryResult> {
  order(column: string): AdminSelectQuery;
}

interface AdminMutationQuery extends PromiseLike<Pick<AdminQueryResult, "error">> {
  eq(column: string, value: unknown): AdminMutationQuery;
}

interface AdminTableQuery {
  select(columns: string): AdminSelectQuery;
  insert(payload: AdminForm): PromiseLike<Pick<AdminQueryResult, "error">>;
  update(payload: Partial<AdminForm>): AdminMutationQuery;
  delete(): AdminMutationQuery;
}

interface AdminDbClient {
  from(table: string): AdminTableQuery;
}

const adminDb = supabase as unknown as AdminDbClient;

export interface ColumnDef {
  key: string;
  label: string;
  type?: "text" | "number" | "date" | "boolean" | "select" | "textarea";
  options?: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
}

interface Props {
  title: string;
  description: string;
  tableName: string;
  columns: ColumnDef[];
  orderBy?: string;
  idField?: string;
}

export function AdminDataTable({ title, description, tableName, columns, orderBy = "id", idField = "id" }: Props) {
  const [items, setItems] = React.useState<AdminRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [open, setOpen] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState<AdminForm>({});

  const load = React.useCallback(async () => {
    setLoading(true);
    const { data } = await adminDb
      .from(tableName)
      .select("*")
      .order(orderBy);
    setItems(data ?? []);
    setLoading(false);
  }, [tableName, orderBy]);

  React.useEffect(() => { load(); }, [load]);

  const resetForm = () => {
    const init: AdminForm = {};
    columns.forEach((c) => {
      init[c.key] = c.type === "boolean" ? false : "";
    });
    setForm(init);
    setEditId(null);
  };

  const openEdit = (row: AdminRow) => {
    const init: AdminForm = {};
    columns.forEach((c) => {
      const value = row[c.key];
      init[c.key] = c.type === "boolean" ? Boolean(value) : valueToFormValue(value);
    });
    setForm(init);
    setEditId(String(row[idField] ?? ""));
    setOpen(true);
  };

  const save = async () => {
    const missing = columns.find((c) => c.required && !form[c.key] && c.type !== "boolean");
    if (missing) {
      toast.error(`${missing.label} is required`);
      return;
    }
    setSaving(true);
    const payload = { ...form };
    if (editId) {
      const { error } = await adminDb.from(tableName).update(payload).eq(idField, editId);
      if (error) toast.error(error.message);
      else toast.success("Updated");
    } else {
      const { error } = await adminDb.from(tableName).insert(payload);
      if (error) toast.error(error.message);
      else toast.success("Created");
    }
    setSaving(false);
    setOpen(false);
    resetForm();
    load();
  };

  const toggleActive = async (row: AdminRow, value: boolean) => {
    const { error } = await adminDb.from(tableName).update({ is_active: value }).eq(idField, row[idField]);
    if (error) toast.error(error.message);
    else load();
  };

  const remove = async (id: string) => {
    const { error } = await adminDb.from(tableName).delete().eq(idField, id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); load(); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" />Add</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editId ? "Edit" : "New"} {title}</DialogTitle></DialogHeader>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {columns.filter(c => c.key !== "is_active").map((c) => (
                <div key={c.key}>
                  <Label>{c.label}</Label>
                  {c.type === "boolean" ? (
                    <Switch checked={!!form[c.key]} onCheckedChange={(v) => setForm({ ...form, [c.key]: v })} />
                  ) : c.type === "select" ? (
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={form[c.key] ?? ""}
                      onChange={(e) => setForm({ ...form, [c.key]: e.target.value })}
                    >
                      <option value="">Select...</option>
                      {c.options?.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  ) : c.type === "textarea" ? (
                    <textarea
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={form[c.key] ?? ""}
                      onChange={(e) => setForm({ ...form, [c.key]: e.target.value })}
                      placeholder={c.placeholder}
                    />
                  ) : (
                    <Input
                      type={c.type === "number" ? "number" : "text"}
                      value={form[c.key] ?? ""}
                      onChange={(e) => setForm({ ...form, [c.key]: c.type === "number" ? parseFloat(e.target.value) || 0 : e.target.value })}
                      placeholder={c.placeholder}
                    />
                  )}
                </div>
              ))}
              <Button onClick={save} disabled={saving} className="w-full">
                {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                Save
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : items.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">No {title.toLowerCase()} configured yet.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.filter(c => !c.key.startsWith("_")).map((c) => (
                    <TableHead key={c.key}>{c.label}</TableHead>
                  ))}
                  <TableHead className="w-28 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((row) => (
                  <TableRow key={String(row[idField])}>
                    {columns.filter(c => !c.key.startsWith("_")).map((c) => (
                      <TableCell key={c.key}>
                        {c.type === "boolean" ? (
                          <Switch checked={!!row[c.key]} onCheckedChange={(v) => toggleActive(row, v)} />
                        ) : c.key === "is_active" ? (
                          <span className={row[c.key] ? "text-success" : "text-muted-foreground"}>
                            {row[c.key] ? "Active" : "Inactive"}
                          </span>
                        ) : typeof row[c.key] === "number" ? (
                          <span className="num">{String(row[c.key])}</span>
                        ) : c.type === "date" && row[c.key] ? (
                          <span className="font-mono text-xs">{String(row[c.key]).slice(0, 10)}</span>
                        ) : (
                          <span className="text-sm">{formatCellValue(row[c.key])}</span>
                        )}
                      </TableCell>
                    ))}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(row)}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => remove(String(row[idField]))}>
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
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

function valueToFormValue(value: unknown): AdminFormValue {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  return "";
}

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return JSON.stringify(value);
}
