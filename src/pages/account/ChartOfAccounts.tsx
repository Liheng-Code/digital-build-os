import * as React from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Plus, Pencil, Check, X } from "lucide-react";
import { ACCOUNT_TYPE_LABELS, type AccountType, type ChartOfAccount } from "@/lib/financialMeta";

export default function ChartOfAccounts() {
  const { roles } = useAuth();
  const isAdmin = roles.includes("admin");
  const [accounts, setAccounts] = React.useState<ChartOfAccount[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [open, setOpen] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({
    account_code: "",
    account_name: "",
    account_type: "expense" as AccountType,
    description: "",
  });

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("chart_of_accounts")
      .select("*")
      .order("account_code") as any;
    setAccounts((data ?? []) as ChartOfAccount[]);
    setLoading(false);
  };

  React.useEffect(() => { load(); }, []);

  const grouped = React.useMemo(() => {
    const g: Record<string, ChartOfAccount[]> = {};
    for (const a of accounts) {
      const key = a.account_type;
      if (!g[key]) g[key] = [];
      g[key].push(a);
    }
    return g;
  }, [accounts]);

  const resetForm = () => {
    setForm({ account_code: "", account_name: "", account_type: "expense", description: "" });
    setEditId(null);
  };

  const save = async () => {
    if (!form.account_code || !form.account_name) {
      toast.error("Code and name are required");
      return;
    }
    const payload: any = { ...form };
    if (editId) {
      await supabase.from("chart_of_accounts").update(payload).eq("id", editId) as any;
      toast.success("Account updated");
    } else {
      await supabase.from("chart_of_accounts").insert(payload) as any;
      toast.success("Account created");
    }
    setOpen(false);
    resetForm();
    load();
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("chart_of_accounts").update({ is_active: !current }).eq("id", id) as any;
    load();
  };

  const openEdit = (acct: ChartOfAccount) => {
    setForm({
      account_code: acct.account_code,
      account_name: acct.account_name,
      account_type: acct.account_type,
      description: acct.description || "",
    });
    setEditId(acct.id);
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Chart of Accounts</h1>
          <p className="text-muted-foreground">Manage financial account codes and types</p>
        </div>
        {isAdmin && (
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Add Account</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editId ? "Edit Account" : "New Account"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Account Code</Label>
                  <Input value={form.account_code} onChange={(e) => setForm({ ...form, account_code: e.target.value })} placeholder="e.g. 6000" />
                </div>
                <div>
                  <Label>Account Name</Label>
                  <Input value={form.account_name} onChange={(e) => setForm({ ...form, account_name: e.target.value })} placeholder="e.g. Equipment Costs" />
                </div>
                <div>
                  <Label>Account Type</Label>
                  <Select value={form.account_type} onValueChange={(v: AccountType) => setForm({ ...form, account_type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ACCOUNT_TYPE_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
                <Button onClick={save} className="w-full">Save</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([type, items]) => (
            <Card key={type}>
              <CardHeader>
                <CardTitle className="text-lg capitalize">{ACCOUNT_TYPE_LABELS[type as AccountType]}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="text-left px-4 py-2 font-medium">Code</th>
                      <th className="text-left px-4 py-2 font-medium">Name</th>
                      <th className="text-left px-4 py-2 font-medium">Description</th>
                      <th className="text-center px-4 py-2 font-medium">Status</th>
                      {isAdmin && <th className="text-right px-4 py-2 font-medium">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((a) => (
                      <tr key={a.id} className="border-b last:border-0">
                        <td className="px-4 py-2 font-mono text-xs">{a.account_code}</td>
                        <td className="px-4 py-2 font-medium">{a.account_name}</td>
                        <td className="px-4 py-2 text-muted-foreground">{a.description || "—"}</td>
                        <td className="px-4 py-2 text-center">
                          <Badge variant={a.is_active ? "default" : "secondary"}>
                            {a.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        {isAdmin && (
                          <td className="px-4 py-2 text-right">
                            <div className="flex justify-end gap-1">
                              <Button size="sm" variant="ghost" onClick={() => openEdit(a)}>
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => toggleActive(a.id, a.is_active)}>
                                {a.is_active ? <X className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                              </Button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
