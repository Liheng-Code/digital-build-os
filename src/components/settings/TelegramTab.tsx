import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Send, CheckCircle2, Copy, ExternalLink, Unlink, Clock } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  getTelegramStatus,
  generateLinkCode,
  unlinkTelegram,
  TELEGRAM_BOT_USERNAME,
  type TelegramStatus,
} from "@/services/telegramLinkService";
import {
  getBriefPrefs,
  upsertBriefPrefs,
} from "@/services/telegramBriefService";

const FALLBACK_TZS = [
  "UTC",
  "Asia/Kuala_Lumpur",
  "Asia/Singapore",
  "Asia/Bangkok",
  "Asia/Jakarta",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "America/New_York",
  "America/Los_Angeles",
];

function getTimezones(): string[] {
  try {
    const zones = (Intl as any).supportedValuesOf?.("timeZone") as string[] | undefined;
    if (zones && zones.length) return zones;
  } catch {}
  return FALLBACK_TZS;
}

function detectTz(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

function toTimeInput(v: string | null): string {
  if (!v) return "";
  // accept HH:MM or HH:MM:SS
  return v.slice(0, 5);
}

function toDbTime(v: string): string | null {
  if (!v) return null;
  const m = v.match(/^(\d{2}):(\d{2})$/);
  if (!m) return null;
  // snap minutes to nearest 15
  const h = m[1];
  const min = Math.round(parseInt(m[2], 10) / 15) * 15;
  const mm = String(min === 60 ? 0 : min).padStart(2, "0");
  return `${h}:${mm}:00`;
}

export function TelegramTab() {
  const { user } = useAuth();
  const [status, setStatus] = React.useState<TelegramStatus | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [generating, setGenerating] = React.useState(false);
  const [code, setCode] = React.useState<string | null>(null);
  const [deepLink, setDeepLink] = React.useState<string | null>(null);

  // Brief prefs state
  const [morningEnabled, setMorningEnabled] = React.useState(false);
  const [morningTime, setMorningTime] = React.useState("08:00");
  const [eveningEnabled, setEveningEnabled] = React.useState(false);
  const [eveningTime, setEveningTime] = React.useState("18:00");
  const [timezone, setTimezone] = React.useState<string>(detectTz());
  const [initialPrefs, setInitialPrefs] = React.useState<string>("");
  const [savingPrefs, setSavingPrefs] = React.useState(false);

  const timezones = React.useMemo(() => getTimezones(), []);

  const currentPrefsKey = JSON.stringify({
    morningEnabled,
    morningTime,
    eveningEnabled,
    eveningTime,
    timezone,
  });
  const dirty = currentPrefsKey !== initialPrefs;

  const loadPrefs = React.useCallback(async () => {
    if (!user) return;
    try {
      const p = await getBriefPrefs(user.id);
      const mEn = !!p?.morning_at;
      const eEn = !!p?.evening_at;
      const mT = toTimeInput(p?.morning_at ?? null) || "08:00";
      const eT = toTimeInput(p?.evening_at ?? null) || "18:00";
      const tz = p?.timezone || detectTz();
      setMorningEnabled(mEn);
      setMorningTime(mT);
      setEveningEnabled(eEn);
      setEveningTime(eT);
      setTimezone(tz);
      setInitialPrefs(
        JSON.stringify({
          morningEnabled: mEn,
          morningTime: mT,
          eveningEnabled: eEn,
          eveningTime: eT,
          timezone: tz,
        })
      );
    } catch (e: any) {
      // non-fatal
      console.error(e);
    }
  }, [user]);

  const load = React.useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const s = await getTelegramStatus(user.id);
      setStatus(s);
      if (s?.linked) await loadPrefs();
    } catch (e: any) {
      toast.error(e.message ?? "Failed to load status");
    } finally {
      setLoading(false);
    }
  }, [user, loadPrefs]);

  React.useEffect(() => {
    load();
    const t = setInterval(load, 5000); // poll while linking
    return () => clearInterval(t);
  }, [load]);

  const onGenerate = async () => {
    if (!user) return;
    setGenerating(true);
    try {
      const res = await generateLinkCode(user.id);
      setCode(res.code);
      setDeepLink(res.deepLink);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to generate code");
    } finally {
      setGenerating(false);
    }
  };

  const onUnlink = async () => {
    if (!user) return;
    if (!confirm("Unlink your Telegram account? You will stop receiving alerts.")) return;
    try {
      await unlinkTelegram(user.id);
      setCode(null);
      setDeepLink(null);
      toast.success("Telegram unlinked");
      load();
    } catch (e: any) {
      toast.error(e.message ?? "Failed to unlink");
    }
  };

  const onSavePrefs = async () => {
    if (!user) return;
    setSavingPrefs(true);
    try {
      await upsertBriefPrefs(user.id, {
        morning_at: morningEnabled ? toDbTime(morningTime) : null,
        evening_at: eveningEnabled ? toDbTime(eveningTime) : null,
        timezone,
      });
      toast.success("Brief preferences saved");
      setInitialPrefs(currentPrefsKey);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to save");
    } finally {
      setSavingPrefs(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Send className="h-4 w-4" />
            Telegram Alerts
          </CardTitle>
          <CardDescription>
            Receive DCOS task and system alerts in Telegram via{" "}
            <span className="font-mono">@{TELEGRAM_BOT_USERNAME}</span>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status?.linked ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <span className="font-medium">Connected</span>
                {status.username && (
                  <Badge variant="secondary">@{status.username}</Badge>
                )}
              </div>
              {status.linked_at && (
                <p className="text-xs text-muted-foreground">
                  Linked on {new Date(status.linked_at).toLocaleString()}
                </p>
              )}
              <Button variant="outline" size="sm" onClick={onUnlink} className="gap-2">
                <Unlink className="h-3.5 w-3.5" /> Unlink
              </Button>
            </div>
          ) : code && deepLink ? (
            <div className="space-y-3">
              <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                <p className="text-sm font-medium">Your one-time code (valid 10 min):</p>
                <div className="flex items-center gap-2">
                  <code className="text-2xl font-bold tracking-wider bg-background px-3 py-1.5 rounded border">
                    {code}
                  </code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      navigator.clipboard.writeText(code);
                      toast.success("Code copied");
                    }}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <ol className="text-sm space-y-2 list-decimal list-inside text-muted-foreground">
                <li>
                  Open the bot:{" "}
                  <a
                    href={deepLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary inline-flex items-center gap-1 hover:underline"
                  >
                    @{TELEGRAM_BOT_USERNAME} <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
                <li>
                  Send your code: <code className="bg-muted px-1.5 py-0.5 rounded">{code}</code>
                </li>
                <li>This page will update automatically once linked.</li>
              </ol>
              <Button variant="outline" size="sm" onClick={onGenerate} disabled={generating}>
                {generating && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
                Generate new code
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Link your Telegram account to receive real-time alerts when tasks are assigned,
                approved, rejected, overdue, or blocked.
              </p>
              <Button onClick={onGenerate} disabled={generating} className="gap-2">
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Link Telegram
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {status?.linked && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Daily Briefs
            </CardTitle>
            <CardDescription>
              Get a morning summary of what's due and an evening wrap of what got done.
              Times use your selected timezone, in 15-minute increments.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Morning brief */}
            <div className="flex items-center justify-between gap-3 rounded-md border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="morning-toggle" className="text-sm font-medium">
                  Morning Brief
                </Label>
                <p className="text-xs text-muted-foreground">
                  Due today + overdue tasks
                </p>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="time"
                  step={900}
                  value={morningTime}
                  onChange={(e) => setMorningTime(e.target.value)}
                  disabled={!morningEnabled}
                  className="h-9 rounded-md border border-input bg-background px-2 text-sm disabled:opacity-50"
                />
                <Switch
                  id="morning-toggle"
                  checked={morningEnabled}
                  onCheckedChange={setMorningEnabled}
                />
              </div>
            </div>

            {/* Evening wrap */}
            <div className="flex items-center justify-between gap-3 rounded-md border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="evening-toggle" className="text-sm font-medium">
                  Evening Wrap
                </Label>
                <p className="text-xs text-muted-foreground">
                  Today's completed + progress summary
                </p>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="time"
                  step={900}
                  value={eveningTime}
                  onChange={(e) => setEveningTime(e.target.value)}
                  disabled={!eveningEnabled}
                  className="h-9 rounded-md border border-input bg-background px-2 text-sm disabled:opacity-50"
                />
                <Switch
                  id="evening-toggle"
                  checked={eveningEnabled}
                  onCheckedChange={setEveningEnabled}
                />
              </div>
            </div>

            {/* Timezone */}
            <div className="space-y-2">
              <Label htmlFor="tz-select" className="text-sm font-medium">
                Timezone
              </Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger id="tz-select" className="w-full">
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {timezones.map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {tz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Detected: <span className="font-mono">{detectTz()}</span>
              </p>
            </div>

            <div className="flex justify-end">
              <Button onClick={onSavePrefs} disabled={!dirty || savingPrefs} className="gap-2">
                {savingPrefs && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Save preferences
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
