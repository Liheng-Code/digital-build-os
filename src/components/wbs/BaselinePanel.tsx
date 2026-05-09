import * as React from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { CheckCircle2, Trash2, Camera, Star } from "lucide-react";
import { toast } from "sonner";
import { useBaselines } from "@/hooks/useSchedulePhase1";
import {
  captureBaseline, setActiveBaseline, deleteBaseline,
} from "@/services/scheduleService";

interface Props {
  projectId: string;
  canEdit: boolean;
}

export function BaselinePanel({ projectId, canEdit }: Props) {
  const { baselines, activeBaseline, refresh } = useBaselines(projectId);
  const [open, setOpen] = React.useState(false);
  const [label, setLabel] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const handleCapture = async () => {
    if (!label.trim()) { toast.error("Label is required"); return; }
    setBusy(true);
    try {
      const id = await captureBaseline(projectId, label.trim(), notes.trim() || undefined);
      await setActiveBaseline(id);
      toast.success(`Baseline "${label}" captured and activated`);
      setLabel(""); setNotes(""); setOpen(false);
      refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally { setBusy(false); }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Camera className="h-4 w-4" /> Baselines
          {activeBaseline && (
            <Badge variant="secondary" className="ml-2 gap-1">
              <Star className="h-3 w-3" /> {activeBaseline.label}
            </Badge>
          )}
        </CardTitle>
        {canEdit && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Camera className="h-3.5 w-3.5 mr-1.5" /> Capture
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Capture baseline</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Label</label>
                  <Input value={label} onChange={(e) => setLabel(e.target.value)}
                    placeholder="e.g. BL0 — Approved 09 May 2026" />
                </div>
                <div>
                  <label className="text-sm font-medium">Notes (optional)</label>
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={handleCapture} disabled={busy}>
                  {busy ? "Capturing…" : "Capture & activate"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        {baselines.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            No baselines yet. Capture one to start tracking schedule variance.
          </p>
        ) : (
          <div className="space-y-1">
            {baselines.map((b) => (
              <div key={b.id} className="flex items-center justify-between gap-2 px-2 py-2 rounded hover:bg-muted/40">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{b.label}</span>
                    {b.is_active && (
                      <Badge variant="default" className="h-5 text-[10px] gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Active
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(b.captured_at), "dd MMM yyyy HH:mm")}
                    {b.notes && <span className="ml-2 italic">· {b.notes}</span>}
                  </div>
                </div>
                {canEdit && (
                  <div className="flex items-center gap-1">
                    {!b.is_active && (
                      <Button size="sm" variant="ghost" className="h-7 text-xs"
                        onClick={async () => {
                          await setActiveBaseline(b.id);
                          toast.success("Baseline activated");
                          refresh();
                        }}>
                        Activate
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" className="h-7 w-7"
                      onClick={async () => {
                        if (!confirm(`Delete baseline "${b.label}"?`)) return;
                        await deleteBaseline(b.id);
                        toast.success("Baseline deleted");
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
      </CardContent>
    </Card>
  );
}
