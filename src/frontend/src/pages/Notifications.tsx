import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  Bell,
  CheckCheck,
  CreditCard,
  Info,
  MessageCircle,
  Shield,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { NotificationType } from "../backend.d";
import { MOCK_NOTIFICATIONS } from "../lib/mockData";

const typeConfig: Record<
  NotificationType,
  { icon: typeof Bell; color: string; bg: string }
> = {
  [NotificationType.message]: {
    icon: MessageCircle,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  [NotificationType.kycUpdate]: {
    icon: Shield,
    color: "text-green-600",
    bg: "bg-green-50",
  },
  [NotificationType.transaction]: {
    icon: CreditCard,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  [NotificationType.dispute]: {
    icon: AlertTriangle,
    color: "text-red-600",
    bg: "bg-red-50",
  },
  [NotificationType.systemNotification]: {
    icon: Info,
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
};

export function Notifications() {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    toast.success("All notifications marked as read");
  };

  const markRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Notifications
          </h1>
          {unreadCount > 0 && (
            <p className="text-muted-foreground text-sm mt-1">
              {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={markAllRead}
            className="gap-1.5"
            data-ocid="notifications.mark_all_button"
          >
            <CheckCheck size={14} />
            Mark all read
          </Button>
        )}
      </div>

      {notifications.length > 0 ? (
        <div className="space-y-2">
          {notifications.map((notif, i) => {
            const config = typeConfig[notif.type];
            const Icon = config.icon;

            return (
              <button
                type="button"
                key={notif.id}
                className={cn(
                  "w-full text-left transition-all",
                  !notif.read && "cursor-pointer",
                )}
                onClick={() => !notif.read && markRead(notif.id)}
                data-ocid={`notifications.item.${i + 1}`}
              >
                <Card
                  className={cn(
                    "border-border/60 hover:shadow-card transition-shadow",
                    !notif.read && "border-primary/30 bg-primary/[0.02]",
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "w-9 h-9 rounded-full flex items-center justify-center shrink-0",
                          config.bg,
                        )}
                      >
                        <Icon size={16} className={config.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={cn(
                              "text-sm font-medium line-clamp-1",
                              !notif.read
                                ? "text-foreground"
                                : "text-foreground/80",
                            )}
                          >
                            {notif.title}
                          </p>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {notif.timestamp}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
                          {notif.message}
                        </p>
                      </div>
                      {!notif.read && (
                        <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </button>
            );
          })}
        </div>
      ) : (
        <div
          className="flex flex-col items-center justify-center py-20 text-center"
          data-ocid="notifications.empty_state"
        >
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
            <Bell size={24} className="text-muted-foreground" />
          </div>
          <h3 className="font-display font-semibold text-lg text-foreground mb-1">
            All caught up!
          </h3>
          <p className="text-sm text-muted-foreground">No new notifications.</p>
        </div>
      )}
    </div>
  );
}
