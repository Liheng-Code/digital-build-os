import { useNavigate } from "react-router-dom";
import { Bell, Check, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useNotifications } from "@/hooks/useNotifications";
import { useTaskUnread } from "@/hooks/useTaskUnread";
import {
  NOTIFICATION_ICON,
  PRIORITY_TONE,
  formatRelativeTime,
  getNotificationRoute,
  NotificationRow,
} from "@/lib/notificationMeta";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const navigate = useNavigate();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications(20);
  const { markTaskRead } = useTaskUnread();

  const handleClick = (n: NotificationRow) => {
    if (!n.read_at) markRead(n.id);
    // If this is a task notification, also clear sibling unread alerts for the
    // same task so the per-task badge & nav badge stay in sync.
    if (n.entity_type === "task" && n.entity_id) {
      markTaskRead(n.entity_id);
    }
    const route = getNotificationRoute(n);
    if (route) navigate(route);
  };

  const badgeText = unreadCount > 9 ? "9+" : String(unreadCount);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
          className="relative h-9 w-9"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-semibold flex items-center justify-center leading-none">
              {badgeText}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[380px] p-0">
        <div className="flex items-center justify-between px-3 py-2.5">
          <div className="text-sm font-semibold">Notifications</div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1"
            disabled={unreadCount === 0}
            onClick={() => markAllRead()}
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read
          </Button>
        </div>
        <Separator />
        <ScrollArea className="max-h-[420px]">
          {notifications.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">
              No notifications yet.
            </div>
          ) : (
            <ul className="divide-y">
              {notifications.map((n) => {
                const Icon = NOTIFICATION_ICON[n.type] ?? Bell;
                const unread = !n.read_at;
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => handleClick(n)}
                      className={cn(
                        "w-full text-left flex gap-3 px-3 py-2.5 hover:bg-muted/50 transition-colors",
                        unread && "bg-info-soft/30",
                      )}
                    >
                      <div
                        className={cn(
                          "mt-0.5 h-8 w-8 shrink-0 rounded-md bg-muted flex items-center justify-center",
                          PRIORITY_TONE[n.priority],
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium leading-snug truncate">
                              {n.title}
                            </div>
                            {n.body && (
                              <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5 whitespace-pre-line">
                                {n.body}
                              </div>
                            )}
                            <div className="text-[10px] text-muted-foreground mt-1">
                              {formatRelativeTime(n.created_at)}
                            </div>
                          </div>
                          {unread && (
                            <span className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />
                          )}
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>
        <Separator />
        <div className="p-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center text-xs"
            onClick={() => navigate("/notifications")}
          >
            View all notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
