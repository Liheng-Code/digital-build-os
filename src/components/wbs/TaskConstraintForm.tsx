import * as React from "react";
import { z } from "zod";
import { Loader2 } from "lucide-react";
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

const CONSTRAINT_TYPES: ScheduleConstraintType[] = [
  "ASAP", "ALAP", "SNET", "SNLT", "FNET", "FNLT", "MSO", "MFO",
];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const isoDate = z.string().regex(DATE_RE, "Use YYYY-MM-DD").refine(
  (s) => !Number.isNaN(new Date(s + "T00:00:00").getTime()),
  "Invalid date",
);

const baseSchema = z.object({
  constraint_type: z.enum(CONSTRAINT_TYPES as [ScheduleConstraintType, ...ScheduleConstraintType[]]),
  constraint_date: z.string().optional().nullable(),
  deadline_date: z.string().optional().nullable(),
});

const schema = baseSchema.superRefine((val, ctx) => {
  const needsDate = val.constraint_type !== "ASAP" && val.constraint_type !== "ALAP";
  const cd = val.constraint_date?.trim() || null;
  const dd = val.deadline_date?.trim() || null;

  if (needsDate) {
    if (!cd) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["constraint_date"],
        message: `${val.constraint_type} requires a constraint date`,
      });
    } else {
      const r = isoDate.safeParse(cd);
      if (!r.success) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["constraint_date"], message: r.error.issues[0].message });
      }
    }
  } else if (cd) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["constraint_date"],
      message: `${val.constraint_type} must not have a constraint date`,
    });
  }

  if (dd) {
    const r = isoDate.safeParse(dd);
    if (!r.success) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["deadline_date"], message: r.error.issues[0].message });
    } else if (cd && DATE_RE.test(cd)) {
      // Deadline must be on/after the constraint date for "start/finish no earlier" + Must-start/finish anchors
      const startAnchored = val.constraint_type === "SNET" || val.constraint_type === "MSO" ||
                            val.constraint_type === "FNET" || val.constraint_type === "MFO";
      if (startAnchored && new Date(dd) < new Date(cd)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["deadline_date"],
          message: "Deadline must be on or after the constraint date",
        });
      }
      // For SNLT/FNLT, deadline before constraint date is suspicious but allowed only if >= constraint date
      if ((val.constraint_type === "SNLT" || val.constraint_type === "FNLT") && new Date(dd) < new Date(cd)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["deadline_date"],
          message: "Deadline cannot be earlier than the constraint date",
        });
      }
    }
  }
});

export function TaskConstraintForm({ taskId, onSaved }: Props) {
  const [type, setType] = React.useState<ScheduleConstraintType>("ASAP");
  const [date, setDate] = React.useState("");
  const [deadline, setDeadline] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

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

  const isValid = React.useMemo(() => {
    return schema.safeParse({
      constraint_type: type,
      constraint_date: date || null,
      deadline_date: deadline || null,
    }).success;
  }, [type, date, deadline]);

  // Live-clear constraint date when switching to ASAP/ALAP
  React.useEffect(() => {
    if (!needsDate && date) setDate("");
  }, [needsDate]); // eslint-disable-line react-hooks/exhaustive-deps

  const validate = () => {
    const result = schema.safeParse({
      constraint_type: type,
      constraint_date: date || null,
      deadline_date: deadline || null,
    });
    if (result.success) { setErrors({}); return true; }
    const errs: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const k = issue.path[0]?.toString() ?? "_";
      if (!errs[k]) errs[k] = issue.message;
    }
    setErrors(errs);
    return false;
  };

  const save = async () => {
    if (!validate()) {
      toast.error("Please fix the highlighted fields");
      return;
    }
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
      setType("ASAP"); setDate(""); setDeadline(""); setErrors({});
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
      {Object.keys(errors).length > 0 && (
        <div
          role="alert"
          aria-live="polite"
          className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive"
        >
          <div className="font-semibold mb-1">
            Please fix {Object.keys(errors).length} issue{Object.keys(errors).length > 1 ? "s" : ""} before saving:
          </div>
          <ul className="list-disc pl-4 space-y-0.5">
            {Object.entries(errors).map(([field, msg]) => {
              const label =
                field === "constraint_type" ? "Type"
                : field === "constraint_date" ? "Constraint date"
                : field === "deadline_date" ? "Deadline"
                : field;
              return <li key={field}><span className="font-medium">{label}:</span> {msg}</li>;
            })}
          </ul>
        </div>
      )}
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
          {errors.constraint_type && (
            <p className="text-xs text-destructive mt-1">{errors.constraint_type}</p>
          )}
        </div>
        {needsDate && (
          <div>
            <Label className="text-xs">Constraint date</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              aria-invalid={!!errors.constraint_date}
            />
            {errors.constraint_date && (
              <p className="text-xs text-destructive mt-1">{errors.constraint_date}</p>
            )}
          </div>
        )}
        <div>
          <Label className="text-xs">Deadline (optional)</Label>
          <Input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            aria-invalid={!!errors.deadline_date}
          />
          {errors.deadline_date && (
            <p className="text-xs text-destructive mt-1">{errors.deadline_date}</p>
          )}
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" size="sm" onClick={clear}>Clear</Button>
        <Button size="sm" onClick={save} disabled={!isValid}>Save constraint</Button>
      </div>
    </div>
  );
}
