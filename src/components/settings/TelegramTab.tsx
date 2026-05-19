import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, CheckCircle2, Copy, ExternalLink, Unlink } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  getTelegramStatus,
  generateLinkCode,
  unlinkTelegram,
  TELEGRAM_BOT_USERNAME,
  type TelegramStatus,
} from "@/services/telegramLinkService";

export function TelegramTab() {
  const { user } = useAuth();
  const [status, setStatus] = React.useState<TelegramStatus | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [generating, setGenerating] = React.useState(false);
  const [code, setCode] = React.useState<string | null>(null);
  const [deepLink, setDeepLink] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      setStatus(await getTelegramStatus(user.id));
    } catch (e: any) {
      toast.error(e.message ?? "Failed to load status");
    } finally {
      setLoading(false);
    }
  }, [user]);

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
  );
}
