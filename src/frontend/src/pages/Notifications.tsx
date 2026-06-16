import { ArrowLeft, Bell, CheckCircle, Lock, MessageCircle, AlertTriangle, Star, Shield } from "lucide-react";
import { useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";

const NOTIFICATIONS = [
  {
    id: 1,
    type: "message",
    icon: MessageCircle,
    color: "bg-blue-50 text-blue-500",
    title: "New message from ImmigrationPro",
    desc: "Please send your passport copy and IELTS result to proceed.",
    time: "2 minutes ago",
    read: false,
    link: "/messages/1",
  },
  {
    id: 2,
    type: "escrow",
    icon: Lock,
    color: "bg-amber-50 text-amber-500",
    title: "Escrow Payment Locked",
    desc: "$499 USDT successfully locked for Canada PR service. Case #TXN-001 started.",
    time: "1 hour ago",
    read: false,
    link: "/transactions",
  },
  {
    id: 3,
    type: "kyc",
    icon: Shield,
    color: "bg-purple-50 text-purple-500",
    title: "KYC Level 3 Under Review",
    desc: "Your identity documents have been submitted. Admin will review within 24-48 hours.",
    time: "3 hours ago",
    read: false,
    link: "/kyc",
  },
  {
    id: 4,
    type: "review",
    icon: Star,
    color: "bg-amber-50 text-amber-500",
    title: "New Review Received",
    desc: "Ahmad M. gave you 5 stars — 'Excellent service! Very professional.'",
    time: "Yesterday",
    read: true,
    link: "/profile/me",
  },
  {
    id: 5,
    type: "success",
    icon: CheckCircle,
    color: "bg-green-50 text-green-500",
    title: "Visa Approved! 🎉",
    desc: "Your UK Student Visa has been approved. Documents shared by Global Edu.",
    time: "2 days ago",
    read: true,
    link: "/transactions",
  },
  {
    id: 6,
    type: "dispute",
    icon: AlertTriangle,
    color: "bg-red-50 text-red-500",
    title: "Dispute Update",
    desc: "Admin has reviewed your dispute #DSP-001. Provider has responded.",
    time: "3 days ago",
    read: true,
    link: "/disputes",
  },
  {
    id: 7,
    type: "message",
    icon: MessageCircle,
    color: "bg-blue-50 text-blue-500",
    title: "New message from Global Edu",
    desc: "Application submitted to university ✓ Awaiting their response.",
    time: "4 days ago",
    read: true,
    link: "/messages/2",
  },
  {
    id: 8,
    type: "escrow",
    icon: Lock,
    color: "bg-green-50 text-green-500",
    title: "Payment Released!",
    desc: "$299 USDT released to Global Edu after visa confirmation. Case closed.",
    time: "5 days ago",
    read: true,
    link: "/wallet",
  },
];

export function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(NOTIFICATIONS);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filtered = notifications.filter((n) =>
    filter === "all" ? true : !n.read
  );

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => n.id === id ? { ...n, read: true } : n)
    );
  };

  return (
    <div className="flex flex-col pb-8">

      {/* HEADER */}
      <div className="bg-white px-4 py-3 flex items-center gap-2 border-b border-gray-100">
        <button
          onClick={() => void navigate({ to: "/" })}
          className="p-1.5 rounded-full hover:bg-gray-100"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <span className="font-bold text-gray-800 text-sm flex-1">Notifications</span>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-xs font-semibold text-[#1a56f0]"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* TABS */}
      <div className="bg-white px-4 pb-3 border-b border-gray-100">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mt-3">
          {(["all", "unread"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                filter === t ? "bg-white text-gray-800 shadow-sm" : "text-gray-400"
              }`}
            >
              {t === "all" ? "All" : `Unread (${unreadCount})`}
            </button>
          ))}
        </div>
      </div>

      {/* LIST */}
      <div className="flex flex-col">
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <Bell size={36} className="text-gray-200 mx-auto mb-3" />
            <div className="text-sm font-bold text-gray-400">No notifications</div>
            <div className="text-xs text-gray-300 mt-1">You are all caught up!</div>
          </div>
        ) : (
          filtered.map((n) => (
            <Link
              key={n.id}
              to={n.link as "/"}
              onClick={() => markRead(n.id)}
            >
              <div className={`flex items-start gap-3 px-4 py-4 border-b border-gray-50 transition-all ${
                !n.read ? "bg-blue-50/30" : "bg-white"
              }`}>
                <div className={`w-10 h-10 rounded-2xl ${n.color} flex items-center justify-center flex-shrink-0`}>
                  <n.icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <span className={`text-sm leading-snug ${!n.read ? "font-bold text-gray-800" : "font-semibold text-gray-600"}`}>
                      {n.title}
                    </span>
                    {!n.read && (
                      <div className="w-2 h-2 bg-[#1a56f0] rounded-full flex-shrink-0 mt-1" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.desc}</p>
                  <div className="text-[10px] text-gray-400 mt-1">{n.time}</div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

    </div>
  );
}
