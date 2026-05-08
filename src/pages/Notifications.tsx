import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNotifications } from "@/hooks/useNotifications";
import {
  NOTIFICATION_ICON,
  PRIORITY_TONE,
  formatRelativeTime,
  getNotificationRoute,
  NotificationRow,
} from "@/lib/notificationMeta";
import { cn } from "@/lib/utils";

type Tab = "all" | "unread" | "tasks" | "timesheets";
type CoreTab = "all" | "unread" | "action_required" | "critical";

export default function Notifications() {
  const navigate = useNavigate();
  const { notifications, unreadCount, markRead, markAllRead, remove } = useNotifications(50);
  const [tab, setTab] = React.useState<CoreTab>("all");
  const [moduleFilter, setModuleFilter] = React.useState("all");
  const [legacyTypeFilter, setLegacyTypeFilter] = React.useState<Tab>("all");
  const [search, setSearch] = React.useState("");

  const modules = React.useMemo(
    () => Array.from(new Set(notifications.map((n) => n.module_code).filter(Boolean) as string[])).sort(),
    [notifications],
  );

  const filtered = notifications.filter((n) => {
    if (tab === "unread") return !n.read_at;
    if (tab === "action_required") return n.notification_kind === "action_required";
    if (tab === "critical") return n.priority === "critical";
    if (moduleFilter !== "all" && n.module_code !== moduleFilter) return false;
    if (legacyTypeFilter === "tasks" && !n.type.startsWith("task_")) return false;
    if (legacyTypeFilter === "timesheets" && !n.type.startsWith("timesheet_")) return false;
    if (search) {
      const haystack = `${n.title} ${n.body ?? ""} ${n.event_code ?? ""}`.toLowerCase();
      if (!haystack.includes(search.toLowerCase())) return false;
    }
    return true;
  });

  const onOpen = (n: NotificationRow) => {
    if (!n.read_at) markRead(n.id);
    const route = getNotificationRoute(n);
    if (route) navigate(route);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {unreadCount > 0
              ? `${unreadCount} unread of ${notifications.length}`
              : `${notifications.length} total`}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => markAllRead()}
          disabled={unreadCount === 0}
          className="gap-2"
        >
          <CheckCheck className="h-4 w-4" />
          Mark all read
        </Button>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as CoreTab)}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">
            Unread{unreadCount > 0 ? ` (${unreadCount})` : ""}
          </TabsTrigger>
          <TabsTrigger value="action_required">Action Required</TabsTrigger>
          <TabsTrigger value="critical">Critical</TabsTrigger>
        </TabsList>

        <div className="mt-4 flex flex-wrap gap-2">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search notifications..."
            className="w-full sm:w-64"
          />
          <Select value={moduleFilter} onValueChange={setModuleFilter}>
            <SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All modules</SelectItem>
              {modules.map((module) => (
                <SelectItem key={module} value={module}>{module}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={legacyTypeFilter} onValueChange={(value) => setLegacyTypeFilter(value as Tab)}>
            <SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="tasks">Tasks</SelectItem>
              <SelectItem value="timesheets">Timesheets</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <TabsContent value={tab} className="mt-4">
          <Card>
            {filtered.length === 0 ? (
              <div className="px-4 py-16 text-center text-sm text-muted-foreground">
                Nothing here yet.
              </div>
            ) : (
              <ul className="divide-y">
                {filtered.map((n) => {
                  const Icon = NOTIFICATION_ICON[n.type] ?? Bell;
                  const unread = !n.read_at;
                  return (
                    <li
                      key={n.id}
                      className={cn(
                        "flex gap-3 px-4 py-3 hover:bg-muted/40 transition-colors",
                        unread && "bg-info-soft/20",
                      )}
                    >
                      <div
                        className={cn(
                          "mt-0.5 h-9 w-9 shrink-0 rounded-md bg-muted flex items-center justify-center",
                          PRIORITY_TONE[n.priority],
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <button
                        type="button"
                        onClick={() => onOpen(n)}
                        className="flex-1 min-w-0 text-left"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium leading-snug">
                            {n.title}
                          </span>
                          {unread && (
                            <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                          )}
                        </div>
                        {n.body && (
                          <div className="text-xs text-muted-foreground mt-0.5 whitespace-pre-line">
                            {n.body}
                          </div>
                        )}
                        <div className="text-[11px] text-muted-foreground mt-1">
                          {formatRelativeTime(n.created_at)}
                          {n.module_code ? ` / ${n.module_code}` : ""}
                          {n.notification_kind ? ` / ${n.notification_kind.replace(/_/g, " ")}` : ""}
                        </div>
                      </button>
                      <div className="flex items-start gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => remove(n.id)}
                          aria-label="Delete notification"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      <Separator />
      <p className="text-[11px] text-muted-foreground">
        Notifications cover task workflow events (assignment, status changes, blockers) and
        timesheet submissions, approvals, rejections, and flags.
      </p>
    </div>
  );
}
