import { ArrowLeft, Loader2, MessageCircle, Search } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

interface ChatItem {
  transactionId: string;
  otherId: string;
  otherName: string;
  adTitle: string;
  lastMessage: string;
  lastTime: string;
  unreadCount: number;
  isSystem: boolean;
  status: string;
}

export function Messages() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => { void loadChats(); }, []);

  async function loadChats() {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) { setLoading(false); void navigate({ to: "/login" }); return; }
    const uid = userData.user.id;
    setUserId(uid);

    // Saare orders jin mein user shamil hai
    const { data: txs } = await supabase
      .from("transactions")
      .select("id, buyer_id, seller_id, ad_id, status, created_at")
      .or(`buyer_id.eq.${uid},seller_id.eq.${uid}`)
      .order("created_at", { ascending: false });

    const txList = txs ?? [];
    if (txList.length === 0) { setChats([]); setLoading(false); return; }

    const txIds = txList.map((t: any) => t.id);
    const adIds = [...new Set(txList.map((t: any) => t.ad_id).filter(Boolean))];
    const personIds = [...new Set(txList.flatMap((t: any) => [t.buyer_id, t.seller_id]))];

    // Ads, names, messages sab ek saath
    const [adsRes, peopleRes, msgsRes] = await Promise.all([
      adIds.length > 0 ? supabase.from("ads").select("id, title").in("id", adIds) : Promise.resolve({ data: [] }),
      supabase.from("profiles").select("id, display_name, full_name").in("id", personIds),
      supabase.from("order_messages").select("id, transaction_id, text, sender_id, is_read, is_system, created_at").in("transaction_id", txIds).order("created_at", { ascending: false }),
    ]);

    const adById: Record<string, any> = {};
    ((adsRes.data as any[]) ?? []).forEach((a: any) => { adById[a.id] = a; });
    const personById: Record<string, any> = {};
    ((peopleRes.data as any[]) ?? []).forEach((p: any) => { personById[p.id] = p; });
    const allMsgs = (msgsRes.data as any[]) ?? [];

    const items: ChatItem[] = txList.map((t: any) => {
      const isBuyer = t.buyer_id === uid;
      const otherId = isBuyer ? t.seller_id : t.buyer_id;
      const other = personById[otherId];
      const txMsgs = allMsgs.filter((m: any) => m.transaction_id === t.id);
      const last = txMsgs[0];
      const unread = txMsgs.filter((m: any) => m.sender_id !== uid && !m.is_read).length;
      return {
        transactionId: t.id,
        otherId,
        otherName: other?.display_name ?? other?.full_name ?? (isBuyer ? "Provider" : "Buyer"),
        adTitle: adById[t.ad_id]?.title ?? "Order",
        lastMessage: last ? last.text : "Order started — say hello!",
        lastTime: last ? last.created_at : t.created_at,
        unreadCount: unread,
        isSystem: last?.is_system ?? false,
        status: t.status,
      };
    });

    // Sab se naya upar
    items.sort((a, b) => new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime());
    setChats(items);
    setLoading(false);
  }

  const filtered = chats.filter((c) =>
    !search || c.otherName.toLowerCase().includes(search.toLowerCase()) || c.adTitle.toLowerCase().includes(search.toLowerCase())
  );

  function timeLabel(iso: string) {
    const d = new Date(iso);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString([], { month: "2-digit", day: "2-digit" });
  }

  const statusDot = (s: string) => {
    if (s === "completed") return "bg-green-400";
    if (s === "delivered") return "bg-purple-400";
    if (s === "disputed") return "bg-red-400";
    return "bg-[#D4AF37]";
  };

  if (loading) {
    return <div className="flex items-center justify-center py-24"><Loader2 className="animate-spin text-gray-300" size={28} /></div>;
  }

  return (
    <div className="flex flex-col pb-8">
      <div className="bg-white px-4 py-3 flex items-center gap-2 border-b border-gray-100">
        <button onClick={() => void navigate({ to: "/" })} className="p-1.5 rounded-full hover:bg-gray-100">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <span className="font-bold text-gray-800 text-sm">Messages</span>
      </div>

      {/* Search */}
      <div className="px-4 mt-3">
        <div className="flex items-center gap-2 bg-white rounded-2xl px-4 py-3 shadow-sm">
          <Search size={15} className="text-gray-400 flex-shrink-0" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or order..."
            className="flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400" />
        </div>
      </div>

      {/* Chat list */}
      <div className="px-4 mt-3 flex flex-col gap-2">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm py-14 text-center">
            <MessageCircle size={32} className="text-gray-200 mx-auto mb-2" />
            <div className="text-sm font-bold text-gray-400 mb-1">No conversations yet</div>
            <div className="text-xs text-gray-400">Chats open automatically when you place or receive an order.</div>
          </div>
        ) : (
          filtered.map((c) => (
            <button key={c.transactionId}
              onClick={() => void navigate({ to: "/orders" })}
              className="bg-white rounded-2xl p-3.5 shadow-sm text-left flex items-center gap-3">
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#004B49] to-[#00746f] flex items-center justify-center text-white font-black text-base">
                  {c.otherName[0]?.toUpperCase()}
                </div>
                <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${statusDot(c.status)}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-gray-800 text-sm truncate">{c.otherName}</span>
                  <span className="text-[10px] text-gray-400 flex-shrink-0">{timeLabel(c.lastTime)}</span>
                </div>
                <div className="text-[10px] text-gray-400 truncate">{c.adTitle}</div>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <span className={`text-xs truncate ${c.unreadCount > 0 ? "font-bold text-gray-700" : "text-gray-400"} ${c.isSystem ? "italic" : ""}`}>
                    {c.isSystem ? "🔔 " : ""}{c.lastMessage}
                  </span>
                  {c.unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-black min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1 flex-shrink-0">
                      {c.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
