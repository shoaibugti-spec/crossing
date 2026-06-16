import { Search, CheckCheck } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useState } from "react";

const CONVERSATIONS = [
  {
    id: "1",
    name: "ImmigrationPro",
    avatar: "IP",
    role: "Canada PR Provider",
    lastMsg: "Please send your passport copy and IELTS result.",
    time: "2m ago",
    unread: 3,
    online: true,
    verified: true,
    escrowActive: true,
    escrowAmount: 499,
  },
  {
    id: "2",
    name: "Global Edu",
    avatar: "GE",
    role: "UK Study Visa",
    lastMsg: "Your application has been submitted to the embassy ✓",
    time: "1h ago",
    unread: 0,
    online: true,
    verified: true,
    escrowActive: false,
    escrowAmount: 0,
  },
  {
    id: "3",
    name: "Rafique Jobs",
    avatar: "RJ",
    role: "UAE Work Visa",
    lastMsg: "Interview scheduled for next Tuesday at 3 PM",
    time: "Yesterday",
    unread: 1,
    online: false,
    verified: true,
    escrowActive: true,
    escrowAmount: 199,
  },
  {
    id: "4",
    name: "EuroPath Immigration",
    avatar: "EP",
    role: "Germany Work Visa",
    lastMsg: "I need your educational certificates translated to German",
    time: "Mon",
    unread: 0,
    online: false,
    verified: true,
    escrowActive: false,
    escrowAmount: 0,
  },
  {
    id: "5",
    name: "AusImmigration Pro",
    avatar: "AP",
    role: "Australia PR",
    lastMsg: "Your skills assessment has been approved! 🎉",
    time: "Sun",
    unread: 0,
    online: false,
    verified: true,
    escrowActive: false,
    escrowAmount: 0,
  },
];

const AVATAR_COLORS = [
  "from-[#1a56f0] to-purple-600",
  "from-green-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-blue-500 to-indigo-600",
  "from-rose-500 to-pink-600",
];

export function Messages() {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"all" | "active">("all");

  const filtered = CONVERSATIONS.filter((c) => {
    const matchSearch = !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.role.toLowerCase().includes(search.toLowerCase());
    const matchTab = tab === "all" || c.escrowActive;
    return matchSearch && matchTab;
  });

  return (
    <div className="flex flex-col pb-8">

      {/* SEARCH */}
      <div className="bg-white px-4 pt-4 pb-3 border-b border-gray-100">
        <div className="text-lg font-black text-gray-800 mb-3">Messages</div>
        <div className="flex items-center gap-2 bg-[#F2F3F7] rounded-2xl px-4 py-3">
          <Search size={16} className="text-gray-400 flex-shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
          />
        </div>

        {/* TABS */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mt-3">
          {(["all", "active"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                tab === t ? "bg-white text-gray-800 shadow-sm" : "text-gray-400"
              }`}
            >
              {t === "all" ? "All Messages" : "🔒 Escrow Active"}
            </button>
          ))}
        </div>
      </div>

      {/* CONVERSATION LIST */}
      <div className="flex flex-col">
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-3xl mb-3">💬</div>
            <div className="text-sm font-bold text-gray-400">No conversations yet</div>
            <div className="text-xs text-gray-300 mt-1">
              Message a provider from their listing
            </div>
          </div>
        ) : (
          filtered.map((conv, i) => (
            <Link key={conv.id} to="/messages/$id" params={{ id: conv.id }}>
              <div className="flex items-center gap-3 px-4 py-4 bg-white border-b border-gray-50 hover:bg-gray-50 transition-all">

                {/* AVATAR */}
                <div className="relative flex-shrink-0">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${AVATAR_COLORS[i % AVATAR_COLORS.length]} flex items-center justify-center text-white font-black text-sm`}>
                    {conv.avatar}
                  </div>
                  {conv.online && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                  )}
                </div>

                {/* CONTENT */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-gray-800 text-sm">{conv.name}</span>
                      {conv.verified && (
                        <span className="text-[#1a56f0] text-[10px]">✓</span>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-400 flex-shrink-0">{conv.time}</span>
                  </div>

                  <div className="text-xs text-gray-400 mb-1">{conv.role}</div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 flex-1 min-w-0">
                      {conv.unread === 0 && (
                        <CheckCheck size={12} className="text-[#1a56f0] flex-shrink-0" />
                      )}
                      <span className={`text-xs truncate ${conv.unread > 0 ? "text-gray-700 font-semibold" : "text-gray-400"}`}>
                        {conv.lastMsg}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {conv.escrowActive && (
                        <span className="bg-amber-50 text-amber-500 text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-amber-100">
                          🔒 ${conv.escrowAmount}
                        </span>
                      )}
                      {conv.unread > 0 && (
                        <span className="w-5 h-5 bg-[#1a56f0] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                          {conv.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

    </div>
  );
}
