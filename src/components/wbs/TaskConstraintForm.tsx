import * as React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  CONSTRAINT_TYPE_LABELS, ScheduleConstraintType,
  TaskConstraint, getConstraint, upsertConstraint, deleteConstraint,
} from "@/services/scheduleService";

interface Props {
  taskId: string;
  onSaved?: () => void;
}

export function TaskConstraintForm({ taskId, onSaved }: Props) {
  const [type, setType] = React.useState<ScheduleConstraintType>("ASAP");
  const [date, setDate] = React.useState("");
  const [deadline, setDeadline] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    getConstraint(taskId).then((c) => {
      if (cancelled) return;
      if (c) {
        setType(c.constraint_type);
        setDate(c.constraint_date ?? "");
        setDeadline(c.deadline_date ?? "");
      }
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [taskId]);

  const needsDate = type !== "ASAP" && type !== "ALAP";

  const save = async () => {
    try {
      await upsertConstraint({
        task_id: taskId,
        constraint_type: type,
        constraint_date: needsDate ? (date || null) : null,
        deadline_date: deadline || null,
        calendar_id: null,
      } as TaskConstraint);
      toast.success("Constraint saved");
      onSaved?.();
    } catch (e) { toast.error((e as Error).message); }
  };

  const clear = async () => {
    try {
      await deleteConstraint(taskId);
      setType("ASAP"); setDate(""); setDeadline("");
      toast.success("Constraint cleared");
      onSaved?.();
    } catch (e) { toast.error((e as Error).message); }
  };

  if (loading) return <div className="text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-3 border rounded-lg p-3 bg-muted/30">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Schedule constraint
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Type</Label>
          <Select value={type} onValueChange={(v) => setType(v as ScheduleConstraintType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(CONSTRAINT_TYPE_LABELS).map(([k, label]) => (
                <SelectItem key={k} value={k}>{k} — {label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {needsDate && (
          <div>
            <Label className="text-xs">Constraint date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        )}
        <div>
          <Label className="text-xs">Deadline (optional)</Label>
          <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" size="sm" onClick={clear}>Clear</Button>
        <Button size="sm" onClick={save}>Save constraint</Button>
      </div>
    </div>
  );
}
