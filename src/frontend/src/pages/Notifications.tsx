import { ArrowLeft, Bell, CheckCircle, Lock, MessageCircle, AlertTriangle, Star, Shield, Loader2 } from "lucide-react";
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
    case "message": return { icon: MessageCircle, color: "bg-[#E8F0EF] text-[#004B49]" };
    case "escrow": return { icon: Lock, color: "bg-[#FBF3E1] text-[#9c7a1f]" };
    case "kyc": return { icon: Shield, color: "bg-purple-50 text-purple-500" };
    case "review": return { icon: Star, color: "bg-[#FBF3E1] text-[#9c7a1f]" };
    case "success": return { icon: CheckCircle, color: "bg-green-50 text-green-500" };
    case "dispute": return { icon: AlertTriangle, color: "bg-red-50 text-red-500" };
    default: return { icon: Bell, color: "bg-gray-50 text-gray-400" };
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
  }

  async function markAllRead() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", userData.user.id).eq("is_read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  async function markRead(id: string) {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const filtered = notifications.filter((n) => filter === "all" ? true : !n.is_read);

  return (
    <div className="flex flex-col pb-8">

      {/* HEADER */}
      <div className="bg-white px-4 py-3 flex items-center gap-2 border-b border-gray-100">
        <button onClick={() => void navigate({ to: "/" })} className="p-1.5 rounded-full hover:bg-gray-100">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <span className="font-bold text-gray-800 text-sm flex-1">Notifications</span>
        {unreadCount > 0 && (
          <button onClick={() => void markAllRead()} className="text-xs font-semibold text-[#004B49]">
            Mark all read
          </button>
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
              {t === "all" ? "All" : `Unread (${unreadCount})`}
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
          <Bell size={36} className="text-gray-200 mx-auto mb-3" />
          <div className="text-sm font-bold text-gray-400">
            {filter === "unread" ? "No unread notifications" : "No notifications yet"}
          </div>
          <div className="text-xs text-gray-300 mt-1">You are all caught up!</div>
        </div>
      ) : (
        <div className="flex flex-col">
          {filtered.map((n) => {
            const { icon: Icon, color } = getIcon(n.type);
            return (
              <button key={n.id}
                onClick={() => {
                  void markRead(n.id);
                  if (n.link) void navigate({ to: n.link as "/" });
                }}
                className={`flex items-start gap-3 px-4 py-4 border-b border-gray-50 text-left w-full transition-all ${
                  !n.is_read ? "bg-[#E8F0EF]/40" : "bg-white"
                }`}>
                <div className={`w-10 h-10 rounded-2xl ${color} flex items-center justify-center flex-shrink-0`}>
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <span className={`text-sm leading-snug ${!n.is_read ? "font-bold text-gray-800" : "font-semibold text-gray-600"}`}>
                      {n.title}
                    </span>
                    {!n.is_read && <div className="w-2 h-2 bg-[#D4AF37] rounded-full flex-shrink-0 mt-1" />}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.body}</p>
                  <div className="text-[10px] text-gray-400 mt-1">{timeAgo(n.created_at)}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
