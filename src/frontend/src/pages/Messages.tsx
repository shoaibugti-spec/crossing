import { Search, CheckCheck, Lock, Loader2 } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

interface ConversationRow {
  transactionId: string;
  name: string;
  initial: string;
  role: string;
  lastMsg: string;
  time: string;
  unread: number;
  verified: boolean;
  escrowActive: boolean;
  escrowAmount: number;
}

const AVATAR_COLORS = [
  "from-[#004B49] to-[#00746f]",
  "from-green-500 to-teal-600",
  "from-[#D4AF37] to-[#9c7a1f]",
];

export function Messages() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"all" | "active">("all");
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<ConversationRow[]>([]);

  useEffect(() => {
    void loadConversations();
  }, []);

  async function loadConversations() {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setLoading(false);
      void navigate({ to: "/login" });
      return;
    }
    const uid = userData.user.id;

    const { data: txs } = await supabase
      .from("transactions")
      .select(`
        id, status, amount, buyer_id, seller_id,
        ads:ad_id(title),
        buyer:buyer_id(full_name, kyc_status),
        seller:seller_id(full_name, kyc_status)
      `)
      .or(`buyer_id.eq.${uid},seller_id.eq.${uid}`)
      .order("created_at", { ascending: false });

    if (!txs) {
      setLoading(false);
      return;
    }

    const rows: ConversationRow[] = [];
    for (const row of txs as any[]) {
      const isBuyer = row.buyer_id === uid;
      const counterparty = isBuyer ? row.seller : row.buyer;

      const { data: lastMessage } = await supabase
        .from("messages")
        .select("content, created_at, sender_id")
        .eq("transaction_id", row.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const { count: unreadCount } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("transaction_id", row.id)
        .neq("sender_id", uid);

      rows.push({
        transactionId: row.id,
        name: counterparty?.full_name ?? "User",
        initial: (counterparty?.full_name ?? "U")[0]?.toUpperCase() ?? "U",
        role: row.ads?.title ?? "Visa Order",
        lastMsg: lastMessage?.content ?? "No messages yet — say hello!",
        time: lastMessage ? new Date(lastMessage.created_at).toLocaleDateString() : "",
        unread: unreadCount ?? 0,
        verified: counterparty?.kyc_status === "approved",
        escrowActive: row.status === "escrow_active" || row.status === "in_progress",
        escrowAmount: Number(row.amount),
      });
    }

    setConversations(rows);
    setLoading(false);
  }

  const filtered = conversations.filter((c) => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.role.toLowerCase().includes(search.toLowerCase());
    const matchTab = tab === "all" || c.escrowActive;
    return matchSearch && matchTab;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-gray-300" size={28} />
      </div>
    );
  }

  return (
    <div className="flex flex-col pb-8">

      {/* SEARCH */}
      <div className="bg-white px-4 pt-4 pb-3 border-b border-gray-100">
        <div className="text-lg font-black text-gray-800 mb-3">Messages</div>
        <div className="flex items-center gap-2 bg-[#F4F6F6] rounded-2xl px-4 py-3">
          <Search size={16} className="text-gray-400 flex-shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
          />
        </div>

        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mt-3">
          {(["all", "active"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${tab === t ? "bg-white text-gray-800 shadow-sm" : "text-gray-400"}`}>
              {t === "all" ? "All Messages" : "🔒 Escrow Active"}
            </button>
          ))}
        </div>
      </div>

      {/* INFO BANNER */}
      <div className="mx-4 mt-3">
        <div className="bg-[#E8F0EF] border border-[#004B49]/15 rounded-xl px-3 py-2.5 flex gap-2">
          <Lock size={13} className="text-[#004B49] flex-shrink-0 mt-0.5" />
          <span className="text-[11px] text-[#004B49]">
            Chat unlocks only after placing an order. This protects both buyers and providers from outside-app fraud.
          </span>
        </div>
      </div>

      {/* CONVERSATION LIST */}
      <div className="flex flex-col mt-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <Lock size={32} className="text-gray-200 mx-auto mb-3" />
            <div className="text-sm font-bold text-gray-400">
              {conversations.length === 0 ? "No conversations yet" : "No matches"}
            </div>
            <div className="text-xs text-gray-300 mt-1 px-8">
              Browse listings and place an order to unlock chat with a provider
            </div>
            <Link to="/ads" search={{ q: "", country: "", type: "" }}>
              <button className="mt-4 bg-[#004B49] text-white text-xs font-bold px-4 py-2.5 rounded-xl">
                Browse Visa Listings
              </button>
            </Link>
          </div>
        ) : (
          filtered.map((conv, i) => (
            <Link key={conv.transactionId} to="/messages/$id" params={{ id: conv.transactionId }}>
              <div className="flex items-center gap-3 px-4 py-4 bg-white border-b border-gray-50 hover:bg-gray-50 transition-all">

                <div className="relative flex-shrink-0">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${AVATAR_COLORS[i % AVATAR_COLORS.length]} flex items-center justify-center text-white font-black text-sm`}>
                    {conv.initial}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-gray-800 text-sm">{conv.name}</span>
                      {conv.verified && <span className="text-[#D4AF37] text-[10px]">✓</span>}
                    </div>
                    <span className="text-[10px] text-gray-400 flex-shrink-0">{conv.time}</span>
                  </div>

                  <div className="text-xs text-gray-400 mb-1">{conv.role}</div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 flex-1 min-w-0">
                      {conv.unread === 0 && <CheckCheck size={12} className="text-[#004B49] flex-shrink-0" />}
                      <span className={`text-xs truncate ${conv.unread > 0 ? "text-gray-700 font-semibold" : "text-gray-400"}`}>
                        {conv.lastMsg}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {conv.escrowActive && (
                        <span className="bg-[#FBF3E1] text-[#9c7a1f] text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-[#D4AF37]/30">
                          🔒 ${conv.escrowAmount}
                        </span>
                      )}
                      {conv.unread > 0 && (
                        <span className="w-5 h-5 bg-[#004B49] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
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
