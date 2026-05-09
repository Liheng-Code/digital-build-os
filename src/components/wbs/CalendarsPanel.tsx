import * as React from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Trash2, Plus, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { useCalendars } from "@/hooks/useSchedulePhase1";
import {
  Calendar as Cal, CalendarException,
  upsertCalendar, deleteCalendar,
  listCalendarExceptions, upsertCalendarException, deleteCalendarException,
} from "@/services/scheduleService";

interface Props {
  projectId: string;
  canEdit: boolean;
}

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DEFAULT_MASK = 0b0011111; // Mon-Fri

function dayMaskToggle(mask: number, idx: number) {
  const bit = 1 << idx;
  return (mask & bit) ? mask & ~bit : mask | bit;
}

export function CalendarsPanel({ projectId, canEdit }: Props) {
  const { calendars, refresh } = useCalendars(projectId);
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Cal | null>(null);
  const [name, setName] = React.useState("");
  const [mask, setMask] = React.useState(DEFAULT_MASK);
  const [hpd, setHpd] = React.useState("8");
  const [tz, setTz] = React.useState("UTC");
  const [isDefault, setIsDefault] = React.useState(false);

  const startNew = () => {
    setEditing(null);
    setName(""); setMask(DEFAULT_MASK); setHpd("8"); setTz("UTC"); setIsDefault(false);
    setOpen(true);
  };
  const startEdit = (c: Cal) => {
    setEditing(c);
    setName(c.name); setMask(c.working_days); setHpd(String(c.hours_per_day));
    setTz(c.timezone); setIsDefault(c.is_default);
    setOpen(true);
  };

  const save = async () => {
    if (!name.trim()) { toast.error("Name required"); return; }
    try {
      await upsertCalendar({
        id: editing?.id,
        project_id: projectId,
        name: name.trim(),
        working_days: mask,
        hours_per_day: Number(hpd) || 8,
        timezone: tz || "UTC",
        is_default: isDefault,
      } as Partial<Cal> & { project_id: string; name: string });
      toast.success(editing ? "Calendar updated" : "Calendar created");
      setOpen(false); refresh();
    } catch (e) { toast.error((e as Error).message); }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <CalendarDays className="h-4 w-4" /> Calendars
        </CardTitle>
        {canEdit && (
          <Button size="sm" variant="outline" onClick={startNew}>
            <Plus className="h-3.5 w-3.5 mr-1.5" /> New
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {calendars.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            No calendars defined. Create one to control working days, hours and exception dates.
          </p>
        ) : (
          <div className="space-y-1">
            {calendars.map((c) => (
              <div key={c.id} className="flex items-center justify-between px-2 py-2 rounded hover:bg-muted/40">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{c.name}</span>
                    {c.is_default && <Badge variant="secondary" className="h-5 text-[10px]">Default</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {DAY_NAMES.filter((_, i) => c.working_days & (1 << i)).join(", ") || "No working days"}
                    {" · "}{c.hours_per_day}h/day · {c.timezone}
                  </div>
                </div>
                {canEdit && (
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" className="h-7 text-xs"
                      onClick={() => startEdit(c)}>Edit</Button>
                    <ExceptionsDialog calendar={c} />
                    <Button size="icon" variant="ghost" className="h-7 w-7"
                      onClick={async () => {
                        if (!confirm(`Delete calendar "${c.name}"?`)) return;
                        await deleteCalendar(c.id);
                        toast.success("Calendar deleted");
                        refresh();
                      }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit calendar" : "New calendar"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Site working week" />
              </div>
              <div>
                <Label>Working days</Label>
                <div className="flex gap-1 mt-1">
                  {DAY_NAMES.map((d, i) => {
                    const on = (mask & (1 << i)) !== 0;
                    return (
                      <button key={d} type="button"
                        onClick={() => setMask(dayMaskToggle(mask, i))}
                        className={`px-2.5 py-1 rounded text-xs font-medium border transition ${
                          on ? "bg-primary text-primary-foreground border-primary"
                             : "bg-background text-muted-foreground"
                        }`}>{d}</button>
                    );
                  })}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Hours per day</Label>
                  <Input type="number" min="1" max="24" step="0.5"
                    value={hpd} onChange={(e) => setHpd(e.target.value)} />
                </div>
                <div>
                  <Label>Timezone</Label>
                  <Input value={tz} onChange={(e) => setTz(e.target.value)} placeholder="UTC" />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Switch checked={isDefault} onCheckedChange={setIsDefault} />
                <Label className="cursor-pointer">Use as project default</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={save}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

function ExceptionsDialog({ calendar }: { calendar: Cal }) {
  const [open, setOpen] = React.useState(false);
  const [items, setItems] = React.useState<CalendarException[]>([]);
  const [date, setDate] = React.useState("");
  const [working, setWorking] = React.useState(false);
  const [label, setLabel] = React.useState("");

  const refresh = React.useCallback(async () => {
    setItems(await listCalendarExceptions(calendar.id));
  }, [calendar.id]);

  React.useEffect(() => { if (open) refresh(); }, [open, refresh]);

  const add = async () => {
    if (!date) { toast.error("Pick a date"); return; }
    try {
      await upsertCalendarException({
        calendar_id: calendar.id, exception_date: date,
        is_working: working, label: label || null, hours: working ? calendar.hours_per_day : 0,
      });
      setDate(""); setLabel(""); setWorking(false);
      refresh();
    } catch (e) { toast.error((e as Error).message); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="h-7 text-xs">Exceptions</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Exceptions for "{calendar.name}"</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-[1fr_auto_1fr_auto] gap-2 items-end">
          <div>
            <Label className="text-xs">Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="flex flex-col">
            <Label className="text-xs">Working?</Label>
            <Switch className="mt-2" checked={working} onCheckedChange={setWorking} />
          </div>
          <div>
            <Label className="text-xs">Label</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Eid" />
          </div>
          <Button size="sm" onClick={add}>Add</Button>
        </div>

        <div className="max-h-64 overflow-auto border rounded mt-2">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground italic p-4 text-center">No exceptions.</p>
          ) : items.map((ex) => (
            <div key={ex.id} className="flex items-center justify-between px-3 py-1.5 border-b last:border-0">
              <div className="text-sm">
                <span className="font-mono">{format(new Date(ex.exception_date), "dd MMM yyyy")}</span>
                <Badge variant={ex.is_working ? "default" : "secondary"} className="ml-2 h-5 text-[10px]">
                  {ex.is_working ? "Working" : "Non-working"}
                </Badge>
                {ex.label && <span className="ml-2 text-muted-foreground italic">{ex.label}</span>}
              </div>
              <Button size="icon" variant="ghost" className="h-7 w-7"
                onClick={async () => { await deleteCalendarException(ex.id); refresh(); }}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
