import * as React from "react";
import { format, parseISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, RefreshCw, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useCpm } from "@/hooks/useSchedulePhase1";
import { recalcCpm } from "@/services/scheduleService";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  projectId: string;
  canEdit: boolean;
}

export function CpmPanel({ projectId, canEdit }: Props) {
  const { byTask, refresh } = useCpm(projectId);
  const [busy, setBusy] = React.useState(false);

  const criticalCount = React.useMemo(
    () => Array.from(byTask.values()).filter((c) => c.is_critical).length,
    [byTask],
  );
  const projectFinish = React.useMemo(() => {
    let max: string | null = null;
    byTask.forEach((c) => {
      if (c.early_finish && (!max || c.early_finish > max)) max = c.early_finish;
    });
    return max;
  }, [byTask]);

  const lastRun = React.useMemo(() => {
    let max: string | null = null;
    byTask.forEach((c) => {
      if (c.calculated_at && (!max || c.calculated_at > max)) max = c.calculated_at;
    });
    return max;
  }, [byTask]);

  const handleRecalc = async () => {
    setBusy(true);
    try {
      // Try edge function first (full topological CPM); fall back to DB function
      const { data, error } = await supabase.functions.invoke("cpm-recalc", {
        body: { project_id: projectId },
      });
      if (error) throw error;
      toast.success(
        `CPM recalculated · ${data?.tasks ?? 0} tasks · ${data?.critical ?? 0} on critical path`,
      );
      refresh();
    } catch (e) {
      try {
        await recalcCpm(projectId);
        toast.success("CPM recalculated (basic mode)");
        refresh();
      } catch (e2) {
        toast.error((e2 as Error).message);
      }
    } finally { setBusy(false); }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-4 w-4" /> Critical Path
          {criticalCount > 0 && (
            <Badge variant="destructive" className="ml-1 gap-1">
              <AlertTriangle className="h-3 w-3" /> {criticalCount} critical
            </Badge>
          )}
        </CardTitle>
        {canEdit && (
          <Button size="sm" variant="outline" onClick={handleRecalc} disabled={busy}>
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${busy ? "animate-spin" : ""}`} />
            Recalculate
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <Stat label="Tasks scheduled" value={byTask.size} />
        <Stat label="On critical path" value={criticalCount} />
        <Stat label="Project finish (ES)" value={projectFinish ? format(parseISO(projectFinish), "dd MMM yyyy") : "—"} />
        <Stat label="Last calculated" value={lastRun ? format(parseISO(lastRun), "dd MMM yyyy HH:mm") : "Never"} />
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}
