import { ArrowLeft, Bell, CheckCircle, Lock, MessageCircle, AlertTriangle, Star, Shield, Loader2, Wallet, FileText, Zap } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

function getIcon(type: string) {
  switch (type) {
    case "message":   return { icon: MessageCircle, color: "bg-[#E8F0EF] text-[#004B49]" };
    case "escrow":    return { icon: Lock,          color: "bg-[#FBF3E1] text-[#9c7a1f]" };
    case "kyc":       return { icon: Shield,        color: "bg-purple-50 text-purple-500" };
    case "review":    return { icon: Star,          color: "bg-[#FBF3E1] text-[#9c7a1f]" };
    case "success":   return { icon: CheckCircle,   color: "bg-green-50 text-green-500" };
    case "dispute":   return { icon: AlertTriangle, color: "bg-red-50 text-red-500" };
    case "wallet":    return { icon: Wallet,        color: "bg-green-50 text-green-600" };
    case "document":  return { icon: FileText,      color: "bg-blue-50 text-blue-500" };
    case "promo":     return { icon: Zap,           color: "bg-[#FBF3E1] text-[#D4AF37]" };
    default:          return { icon: Bell,          color: "bg-gray-50 text-gray-400" };
  }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} minute${mins > 1 ? "s" : ""} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

export function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    void loadNotifications();
    void subscribeRealtime();
  }, []);

  async function loadNotifications() {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) { setLoading(false); return; }

    const { data } = await supabase
      .from("notifications")
      .select("id, type, title, body, link, is_read, created_at")
      .eq("user_id", userData.user.id)
      .order("created_at", { ascending: false });

    setNotifications(data ?? []);
    setLoading(false);

    // سب unread mark as read نہیں کرتے — صرف page visit پر auto-mark نہیں
  }

  async function subscribeRealtime() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    supabase
      .channel(`notif_page_${userData.user.id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userData.user.id}`,
      }, (payload) => {
        const n = payload.new as Notification;
        setNotifications((prev) => [n, ...prev]);
      })
      .subscribe();
  }

  async function markAllRead() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userData.user.id)
      .eq("is_read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  async function markRead(id: string) {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const filtered = notifications.filter((n) => filter === "all" ? true : !n.is_read);

  // group by date
  function getDateLabel(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return "This Week";
    return "Earlier";
  }

  const grouped: { label: string; items: Notification[] }[] = [];
  for (const n of filtered) {
    const label = getDateLabel(n.created_at);
    const existing = grouped.find((g) => g.label === label);
    if (existing) existing.items.push(n);
    else grouped.push({ label, items: [n] });
  }

  return (
    <div className="flex flex-col pb-8">

      {/* HEADER */}
      <div className="bg-white px-4 py-3 flex items-center gap-2 border-b border-gray-100 sticky top-0 z-10">
        <button onClick={() => void navigate({ to: "/" })} className="p-1.5 rounded-full hover:bg-gray-100">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <span className="font-bold text-gray-800 text-sm flex-1">Notifications</span>
        {unreadCount > 0 && (
          <div className="flex items-center gap-2">
            <span className="bg-red-500 text-white text-[10px] font-black rounded-full px-2 py-0.5">
              {unreadCount} new
            </span>
            <button onClick={() => void markAllRead()} className="text-xs font-semibold text-[#004B49]">
              Mark all read
            </button>
          </div>
        )}
      </div>

      {/* TABS */}
      <div className="bg-white px-4 pb-3 border-b border-gray-100">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mt-3">
          {(["all", "unread"] as const).map((t) => (
            <button key={t} onClick={() => setFilter(t)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                filter === t ? "bg-white text-gray-800 shadow-sm" : "text-gray-400"
              }`}>
              {t === "all" ? `All (${notifications.length})` : `Unread (${unreadCount})`}
            </button>
          ))}
        </div>
      </div>

      {/* LIST */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-gray-300" size={28} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
            <Bell size={28} className="text-gray-200" />
          </div>
          <div className="text-sm font-bold text-gray-400">
            {filter === "unread" ? "No unread notifications" : "No notifications yet"}
          </div>
          <div className="text-xs text-gray-300 mt-1">
            {filter === "unread" ? "You're all caught up! ✅" : "Complete your profile to get started"}
          </div>
          {filter === "all" && (
            <button onClick={() => void navigate({ to: "/kyc" })}
              className="mt-4 bg-[#004B49] text-white text-xs font-bold px-5 py-2.5 rounded-xl mx-auto block">
              Complete KYC →
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col">
          {grouped.map((group) => (
            <div key={group.label}>
              <div className="px-4 py-2 bg-gray-50/80 border-b border-gray-100">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{group.label}</span>
              </div>
              {group.items.map((n) => {
                const { icon: Icon, color } = getIcon(n.type);
                return (
                  <button key={n.id}
                    onClick={() => {
                      void markRead(n.id);
                      if (n.link) void navigate({ to: n.link as "/" });
                    }}
                    className={`flex items-start gap-3 px-4 py-4 border-b border-gray-50 text-left w-full transition-all active:bg-gray-50 ${
                      !n.is_read ? "bg-[#E8F0EF]/40" : "bg-white"
                    }`}>
                    <div className={`w-11 h-11 rounded-2xl ${color} flex items-center justify-center flex-shrink-0`}>
                      <Icon size={19} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <span className={`text-sm leading-snug ${!n.is_read ? "font-bold text-gray-800" : "font-semibold text-gray-600"}`}>
                          {n.title}
                        </span>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          {!n.is_read && <div className="w-2 h-2 bg-[#D4AF37] rounded-full" />}
                          <span className="text-[10px] text-gray-300 whitespace-nowrap">{timeAgo(n.created_at)}</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.body}</p>
                      {n.link && (
                        <div className="mt-1.5">
                          <span className="text-[10px] font-bold text-[#004B49] bg-[#E8F0EF] px-2 py-0.5 rounded-full">
                            Tap to view →
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
