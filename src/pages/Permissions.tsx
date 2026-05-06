import * as React from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Loader2, Save, RefreshCw, Lock, Check } from "lucide-react";
import { toast } from "sonner";
import { AppRole, ROLE_LABELS } from "@/contexts/AuthContext";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

const MODULES = [
  'projects', 'wbs', 'tasks', 'daily_reports', 'timesheets', 
  'approvals', 'rfis', 'architecture', 'analytics', 
  'financials', 'stakeholders', 'procurement', 'hse', 'subcontractors', 'structural'
];

const ACTIONS = ['view', 'create', 'edit', 'delete', 'approve'];

export default function Permissions() {
  const [permissions, setPermissions] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const loadData = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("role_permissions")
      .select("*");
    setPermissions(data || []);
    setLoading(false);
  };

  React.useEffect(() => {
    loadData();
  }, []);

  const togglePermission = async (role: AppRole, module: string, action: string, current: boolean) => {
    if (role === 'admin') return; // Cannot edit admin permissions (safety)
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from("role_permissions")
        .upsert({ 
          role, 
          module, 
          action, 
          is_allowed: !current,
          updated_at: new Date().toISOString()
        }, { onConflict: 'role,module,action' });

      if (error) throw error;
      
      // Update local state
      setPermissions(prev => {
        const index = prev.findIndex(p => p.role === role && p.module === module && p.action === action);
        if (index > -1) {
          const next = [...prev];
          next[index] = { ...next[index], is_allowed: !current };
          return next;
        } else {
          return [...prev, { role, module, action, is_allowed: !current }];
        }
      });
      
      toast.success("Permission updated");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const isAllowed = (role: AppRole, module: string, action: string) => {
    const p = permissions.find(p => p.role === role && p.module === module && p.action === action);
    return p?.is_allowed || false;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Permission Matrix</h1>
        <p className="text-muted-foreground">Manage granular access control for all DCOS modules.</p>
      </div>

      <Card>
        <CardHeader className="border-b bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-primary" />
              <CardTitle className="text-base uppercase tracking-wider">Access Rights Matrix</CardTitle>
            </div>
            <Button variant="outline" size="sm" onClick={loadData} className="gap-2">
              <RefreshCw className="h-3 w-3" /> Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-muted/50 border-b">
                <th className="p-4 font-bold text-xs uppercase text-muted-foreground sticky left-0 bg-muted/50 z-10 w-48 border-r">Role / Module</th>
                {ACTIONS.map(action => (
                  <th key={action} className="p-4 font-bold text-xs uppercase text-muted-foreground text-center border-r last:border-r-0">
                    {action}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {Object.entries(ROLE_LABELS).map(([roleKey, roleLabel]) => (
                <React.Fragment key={roleKey}>
                  <tr className="bg-primary/5">
                    <td colSpan={ACTIONS.length + 1} className="p-2 px-4 text-xs font-bold text-primary uppercase flex items-center gap-2 border-b">
                      <ShieldCheck className="h-3 w-3" /> {roleLabel} {roleKey === 'admin' && "(Full System Access)"}
                    </td>
                  </tr>
                  {MODULES.map(module => (
                    <tr key={`${roleKey}-${module}`} className="group hover:bg-muted/30 transition-colors">
                      <td className="p-4 py-3 text-xs font-medium sticky left-0 bg-white group-hover:bg-muted/30 z-10 border-r capitalize">
                        {module.replace('_', ' ')}
                      </td>
                      {ACTIONS.map(action => {
                        const active = isAllowed(roleKey as AppRole, module, action);
                        const disabled = roleKey === 'admin';
                        return (
                          <td key={action} className="p-0 text-center border-r last:border-r-0">
                            <button
                              disabled={disabled || saving}
                              onClick={() => togglePermission(roleKey as AppRole, module, action, active)}
                              className={`w-full h-full p-4 flex items-center justify-center transition-colors ${
                                active 
                                  ? "bg-emerald-50 hover:bg-emerald-100/50" 
                                  : "hover:bg-muted/50 opacity-20"
                              } ${disabled ? "cursor-not-allowed opacity-100" : ""}`}
                            >
                              {active ? (
                                <div className="h-4 w-4 bg-emerald-500 rounded flex items-center justify-center text-white">
                                  <Check className="h-3 w-3" />
                                </div>
                              ) : (
                                <div className="h-4 w-4 border border-muted-foreground rounded" />
                              )}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
