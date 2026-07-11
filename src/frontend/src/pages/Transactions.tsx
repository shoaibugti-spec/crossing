import { ArrowLeft, Loader2, Send, CheckCircle, Shield, Clock, Star, X, Globe, FileText, Upload, Package, Camera } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabaseClient";

const FEEDBACK_TAGS = ["Fast Service", "Trusted", "Safe", "Responsive", "Professional", "Great Communication", "Affordable", "Reliable"];

interface OrderMsg {
  id: string; text: string; sender_id: string; created_at: string;
}
interface OrderDoc {
  id: string; doc_name: string; doc_url: string; uploaded_by: string; created_at: string;
}

export function Transactions() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [selected, setSelected] = useState<any | null>(null);
  const [messages, setMessages] = useState<OrderMsg[]>([]);
  const [orderDocs, setOrderDocs] = useState<OrderDoc[]>([]);
  const [msgText, setMsgText] = useState("");
  const [sending, setSending] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [showDocs, setShowDocs] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Tracking modal (provider)
  const [showTracking, setShowTracking] = useState(false);
  const [trackingInput, setTrackingInput] = useState("");

  // Feedback modal
  const [showFeedback, setShowFeedback] = useState(false);
  const [fbRating, setFbRating] = useState<"positive" | "negative">("positive");
  const [fbTags, setFbTags] = useState<string[]>([]);
  const [fbComment, setFbComment] = useState("");

  useEffect(() => { void loadOrders(); }, []);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  function showToast(m: string) { setToast(m); setTimeout(() => setToast(""), 2500); }

  async function loadOrders() {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) { setLoading(false); void navigate({ to: "/login" }); return; }
    const uid = userData.user.id;
    setUserId(uid);

    const { data: txs } = await supabase
      .from("transactions")
      .select("id, buyer_id, seller_id, ad_id, amount, buyer_fee, total_paid, status, tracking_number, created_at")
      .or(`buyer_id.eq.${uid},seller_id.eq.${uid}`)
      .order("created_at", { ascending: false });

    const txList = txs ?? [];
    const adIds = [...new Set(txList.map((t: any) => t.ad_id).filter(Boolean))];
    const personIds = [...new Set(txList.flatMap((t: any) => [t.buyer_id, t.seller_id]))];

    const adById: Record<string, any> = {};
    if (adIds.length > 0) {
      const { data: adData } = await supabase.from("ads").select("id, title, country, visa_type, requirements, provider_service_id").in("id", adIds);
      (adData ?? []).forEach((a: any) => { adById[a.id] = a; });
    }

    const personById: Record<string, any> = {};
    if (personIds.length > 0) {
      const { data: pData } = await supabase.from("profiles").select("id, display_name, full_name").in("id", personIds);
      (pData ?? []).forEach((p: any) => { personById[p.id] = p; });
    }

    const enriched = txList.map((t: any) => ({
      ...t,
      ads: adById[t.ad_id] ?? null,
      buyer: personById[t.buyer_id] ?? null,
      seller: personById[t.seller_id] ?? null,
    }));

    setOrders(enriched);
    setLoading(false);
  }

  async function openOrder(order: any) {
    if (order.status === "completed") {
      const { data: existing } = await supabase.from("reviews").select("id").eq("transaction_id", order.id).eq("buyer_id", userId).maybeSingle();
      order._reviewed = !!existing;
    }
    setSelected(order);
    setTrackingInput(order.tracking_number ?? "");

    const { data } = await supabase
      .from("order_messages")
      .select("id, text, sender_id, created_at")
      .eq("transaction_id", order.id)
      .order("created_at", { ascending: true });
    setMessages((data ?? []) as OrderMsg[]);

    const { data: docs } = await supabase
      .from("order_documents")
      .select("id, doc_name, doc_url, uploaded_by, created_at")
      .eq("transaction_id", order.id)
      .order("created_at", { ascending: true });
    setOrderDocs((docs ?? []) as OrderDoc[]);

    supabase.channel(`order_${order.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "order_messages", filter: `transaction_id=eq.${order.id}` }, (payload) => {
        const m = payload.new as OrderMsg;
        setMessages((prev) => prev.find((x) => x.id === m.id) ? prev : [...prev, m]);
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "order_documents", filter: `transaction_id=eq.${order.id}` }, (payload) => {
        const d = payload.new as OrderDoc;
        setOrderDocs((prev) => prev.find((x) => x.id === d.id) ? prev : [...prev, d]);
      })
      .subscribe();
  }

  async function sendMsg() {
    if (!msgText.trim() || !selected || !userId || sending) return;
    setSending(true);
    const text = msgText.trim();
    setMsgText("");
    await supabase.from("order_messages").insert({ transaction_id: selected.id, sender_id: userId, text });
    const otherId = userId === selected.buyer_id ? selected.seller_id : selected.buyer_id;
    await supabase.from("notifications").insert({
      user_id: otherId, type: "message", title: "💬 New Message",
      body: `About "${(selected.ads as any)?.title ?? "your order"}"`, link: "/orders", is_read: false,
    });
    setSending(false);
  }

  // ── Buyer uploads a required document ──
  async function uploadDoc(docName: string, file: File) {
    if (!selected || !userId) return;
    setUploadingDoc(docName);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${selected.id}/${Date.now()}-${docName.replace(/[^a-zA-Z0-9]/g, "_")}.${ext}`;
      const { error: upErr } = await supabase.storage.from("order-docs").upload(path, file, { contentType: file.type || "image/jpeg" });
      if (upErr) throw upErr;
      const url = supabase.storage.from("order-docs").getPublicUrl(path).data.publicUrl;

      await supabase.from("order_documents").insert({
        transaction_id: selected.id,
        uploaded_by: userId,
        doc_name: docName,
        doc_url: url,
      });

      const otherId = userId === selected.buyer_id ? selected.seller_id : selected.buyer_id;
      await supabase.from("notifications").insert({
        user_id: otherId, type: "message", title: "📄 Document Uploaded",
        body: `"${docName}" uploaded for "${(selected.ads as any)?.title}".`, link: "/orders", is_read: false,
      });
      showToast(`✅ ${docName} uploaded`);
    } catch (err: any) {
      alert("Upload failed: " + (err.message ?? "unknown"));
    } finally {
      setUploadingDoc(null);
    }
  }

  // ── Provider saves tracking number + marks delivered ──
  async function saveTrackingAndDeliver() {
    if (!selected) return;
    if (!trackingInput.trim()) { showToast("⚠️ Tracking number likhen"); return; }
    setProcessing(true);
    await supabase.from("transactions").update({ status: "delivered", tracking_number: trackingInput.trim() }).eq("id", selected.id);
    await supabase.from("notifications").insert({
      user_id: selected.buyer_id, type: "success", title: "📬 Visa Sent!",
      body: `Tracking: ${trackingInput.trim()}. Confirm once you receive your visa.`, link: "/orders", is_read: false,
    });
    setSelected({ ...selected, status: "delivered", tracking_number: trackingInput.trim() });
    setOrders((p) => p.map((o) => o.id === selected.id ? { ...o, status: "delivered", tracking_number: trackingInput.trim() } : o));
    setShowTracking(false);
    setProcessing(false);
    showToast("✅ Visa marked as sent");
  }

  // ── Buyer confirms receipt → release payment + restore ad capacity ──
  async function confirmReceiveVisa() {
    if (!selected) return;
    if (!confirm("Kya aap ne apna visa receive kar liya hai? Confirm karne par payment provider ko release ho jayegi.")) return;
    setProcessing(true);
    const providerAmount = Number(selected.amount);

    await supabase.from("transactions").update({ status: "completed" }).eq("id", selected.id);

    // Release payment + update provider stats
    const { data: prof } = await supabase.from("profiles")
      .select("wallet_balance, total_visas_delivered, total_valuation")
      .eq("id", selected.seller_id).single();
    const newBal = Number(prof?.wallet_balance ?? 0) + providerAmount;
    const newVisas = Number(prof?.total_visas_delivered ?? 0) + 1;
    const newVal = Number(prof?.total_valuation ?? 0) + providerAmount;
    await supabase.from("profiles").update({
      wallet_balance: newBal, total_visas_delivered: newVisas, total_valuation: newVal,
    }).eq("id", selected.seller_id);

    await supabase.from("wallet_transactions").insert({
      user_id: selected.seller_id, type: "earning", amount: providerAmount, status: "completed",
      notes: `Visa payment released — "${(selected.ads as any)?.title ?? "order"}"`,
    });

    // Restore capacity: active_count kam karein, ad wapis public karein
    const serviceId = (selected.ads as any)?.provider_service_id;
    if (serviceId) {
      const { data: svc } = await supabase.from("provider_services").select("active_count, capacity").eq("id", serviceId).single();
      const newCount = Math.max(0, Number(svc?.active_count ?? 1) - 1);
      await supabase.from("provider_services").update({ active_count: newCount }).eq("id", serviceId);
      if (newCount < Number(svc?.capacity ?? 1)) {
        await supabase.from("ads").update({ is_public: true }).eq("id", selected.ad_id);
      }
    }

    await supabase.from("notifications").insert({
      user_id: selected.seller_id, type: "wallet", title: "💰 Payment Released!",
      body: `$${providerAmount.toFixed(2)} released to your wallet. Congratulations on another delivery! 🎉`, link: "/wallet", is_read: false,
    });

    setSelected({ ...selected, status: "completed" });
    setOrders((p) => p.map((o) => o.id === selected.id ? { ...o, status: "completed" } : o));
    setProcessing(false);
    setShowFeedback(true);
  }

  async function submitFeedback() {
    if (!selected || !userId) return;
    setProcessing(true);

    await supabase.from("reviews").insert({
      transaction_id: selected.id, provider_id: selected.seller_id, buyer_id: userId,
      rating: fbRating, tags: fbTags, comment: fbComment.trim() || null, visa_amount: Number(selected.amount),
    });

    const { data: prof } = await supabase.from("profiles")
      .select("positive_feedback_count, negative_feedback_count").eq("id", selected.seller_id).single();
    if (fbRating === "positive") {
      await supabase.from("profiles").update({ positive_feedback_count: Number(prof?.positive_feedback_count ?? 0) + 1 }).eq("id", selected.seller_id);
    } else {
      await supabase.from("profiles").update({ negative_feedback_count: Number(prof?.negative_feedback_count ?? 0) + 1 }).eq("id", selected.seller_id);
    }

    await supabase.from("notifications").insert({
      user_id: selected.seller_id, type: "success", title: "⭐ New Review!",
      body: `A buyer left you a ${fbRating} review.`, link: "/my-ads", is_read: false,
    });

    setProcessing(false);
    setShowFeedback(false);
    selected._reviewed = true;
    showToast("⭐ Thank you for your feedback!");
  }

  const statusInfo = (s: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      escrow_active: { label: "In Escrow", cls: "bg-[#FBF3E1] text-[#9c7a1f]" },
      in_progress: { label: "In Progress", cls: "bg-blue-50 text-blue-600" },
      delivered: { label: "Visa Sent", cls: "bg-purple-50 text-purple-600" },
      completed: { label: "Completed", cls: "bg-green-50 text-green-600" },
      disputed: { label: "Disputed", cls: "bg-red-50 text-red-500" },
    };
    return map[s] ?? { label: s, cls: "bg-gray-100 text-gray-500" };
  };

  const totalSpent = orders.filter((o) => o.buyer_id === userId).reduce((sum, o) => sum + Number(o.total_paid ?? o.amount ?? 0), 0);
  const inEscrow = orders.filter((o) => (o.status === "escrow_active" || o.status === "in_progress" || o.status === "delivered")).reduce((sum, o) => sum + Number(o.amount ?? 0), 0);
  const completedTotal = orders.filter((o) => o.status === "completed").reduce((sum, o) => sum + Number(o.amount ?? 0), 0);

  const filtered = orders.filter((o) => {
    if (filter === "active") return ["escrow_active", "in_progress", "delivered"].includes(o.status);
    if (filter === "completed") return o.status === "completed";
    return true;
  });

  if (loading) {
    return <div className="flex items-center justify-center py-24"><Loader2 className="animate-spin text-gray-300" size={28} /></div>;
  }

  // ═══════════ CHAT / ORDER DETAIL VIEW ═══════════
  if (selected) {
    const isBuyer = userId === selected.buyer_id;
    const other = isBuyer ? (selected.seller as any) : (selected.buyer as any);
    const otherName = other?.display_name ?? other?.full_name ?? (isBuyer ? "Provider" : "Buyer");
    const adInfo = selected.ads as any;
    const requirements: string[] = adInfo?.requirements ?? [];

    const uploadedByName = (docName: string) => orderDocs.find((d) => d.doc_name === docName);

    return (
      <div className="flex flex-col h-screen">
        {toast && (
          <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[100] bg-gray-900 text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-2xl">{toast}</div>
        )}

        {/* Header */}
        <div className="bg-white px-4 py-3 flex items-center gap-3 border-b border-gray-100 flex-shrink-0">
          <button onClick={() => setSelected(null)} className="text-gray-400 text-xl">‹</button>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#004B49] to-[#00746f] flex items-center justify-center text-white text-xs font-bold">
            {otherName[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm text-gray-800 truncate">{otherName}</div>
            <div className="text-[10px] text-gray-400 truncate">{adInfo?.title}</div>
          </div>
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${statusInfo(selected.status).cls}`}>
            {statusInfo(selected.status).label}
          </span>
        </div>

        {/* Order info bar */}
        <div className="bg-[#E8F0EF] px-4 py-2 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] text-[#004B49]">
            <Globe size={11} /> {adInfo?.country} · {adInfo?.visa_type}
          </div>
          <div className="text-[11px] font-bold text-[#004B49]">${Number(selected.amount).toFixed(2)}</div>
        </div>

        {/* Tracking number bar (agar hai) */}
        {selected.tracking_number && (
          <div className="bg-purple-50 border-b border-purple-100 px-4 py-2 flex items-center gap-2 flex-shrink-0">
            <Package size={13} className="text-purple-500 flex-shrink-0" />
            <span className="text-[11px] text-purple-700 font-bold">Tracking: {selected.tracking_number}</span>
          </div>
        )}

        {/* ══ DOCUMENTS SECTION ══ */}
        {requirements.length > 0 && selected.status !== "completed" && (
          <div className="bg-white border-b border-gray-100 flex-shrink-0">
            <button onClick={() => setShowDocs(!showDocs)}
              className="w-full px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText size={14} className="text-[#004B49]" />
                <span className="text-xs font-bold text-gray-800">Required Documents ({orderDocs.length}/{requirements.length})</span>
              </div>
              <span className="text-gray-400 text-xs">{showDocs ? "▲" : "▼"}</span>
            </button>
            {showDocs && (
              <div className="px-4 pb-3 flex flex-col gap-2">
                {requirements.map((docName) => {
                  const uploaded = uploadedByName(docName);
                  return (
                    <div key={docName} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${uploaded ? "bg-green-100" : "bg-gray-200"}`}>
                        {uploaded ? <CheckCircle size={13} className="text-green-500" /> : <FileText size={11} className="text-gray-400" />}
                      </div>
                      <span className="flex-1 text-xs font-semibold text-gray-700 truncate">{docName}</span>
                      {uploaded ? (
                        <a href={uploaded.doc_url} target="_blank" rel="noopener noreferrer"
                          className="text-[10px] font-bold text-[#004B49] bg-[#E8F0EF] px-2.5 py-1 rounded-lg flex-shrink-0">
                          View
                        </a>
                      ) : isBuyer ? (
                        <label className="text-[10px] font-bold text-white bg-[#004B49] px-2.5 py-1 rounded-lg flex-shrink-0 cursor-pointer flex items-center gap-1">
                          {uploadingDoc === docName ? <Loader2 size={10} className="animate-spin" /> : <Upload size={10} />}
                          Upload
                          <input type="file" accept="image/*,application/pdf" className="hidden"
                            onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadDoc(docName, f); }} />
                        </label>
                      ) : (
                        <span className="text-[10px] text-gray-400 flex-shrink-0">Waiting...</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2 bg-gray-50/60">
          <div className="bg-white border border-gray-100 rounded-xl p-3 text-center mb-1">
            <Shield size={16} className="text-[#004B49] mx-auto mb-1" />
            <div className="text-[11px] text-gray-500">
              Payment is held safely in escrow.
              {isBuyer ? " Upload your documents above, then wait for your visa. Confirm only when you receive it." : " Review buyer documents above, process the visa, then send it with a tracking number."}
            </div>
          </div>
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.sender_id === userId ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm ${m.sender_id === userId ? "bg-[#004B49] text-white rounded-br-sm" : "bg-white text-gray-800 border border-gray-100 rounded-bl-sm"}`}>
                {m.text}
                <div className={`text-[8px] mt-1 ${m.sender_id === userId ? "text-white/50" : "text-gray-400"}`}>
                  {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Action bar */}
        {selected.status !== "completed" && selected.status !== "disputed" && (
          <div className="px-4 py-2 bg-white border-t border-gray-100 flex-shrink-0">
            {!isBuyer && (selected.status === "escrow_active" || selected.status === "in_progress") && (
              <button onClick={() => setShowTracking(true)} disabled={processing}
                className="w-full bg-[#9c7a1f] text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-60">
                <Package size={15} /> Visa Done — Send with Tracking
              </button>
            )}
            {isBuyer && selected.status === "delivered" && (
              <button onClick={() => void confirmReceiveVisa()} disabled={processing}
                className="w-full bg-[#004B49] text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-60">
                {processing ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />} ✅ Receive Visa — Release Payment
              </button>
            )}
            {isBuyer && (selected.status === "escrow_active" || selected.status === "in_progress") && (
              <div className="text-center text-[11px] text-gray-400 py-1">Provider is processing your visa...</div>
            )}
            {!isBuyer && selected.status === "delivered" && (
              <div className="text-center text-[11px] text-gray-400 py-1">Waiting for buyer to confirm receipt...</div>
            )}
          </div>
        )}

        {selected.status === "completed" && isBuyer && !selected._reviewed && (
          <div className="px-4 py-2 bg-white border-t border-gray-100 flex-shrink-0">
            <button onClick={() => setShowFeedback(true)}
              className="w-full bg-[#D4AF37] text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2">
              <Star size={15} /> Leave Feedback
            </button>
          </div>
        )}

        {selected.status === "completed" && (
          <div className="px-4 py-2 bg-green-50 border-t border-green-100 flex-shrink-0 text-center">
            <span className="text-xs font-bold text-green-600">✅ Order Completed — Payment Released</span>
          </div>
        )}

        {/* Message input */}
        {selected.status !== "completed" && (
          <div className="px-3 py-2.5 bg-white border-t border-gray-100 flex items-center gap-2 flex-shrink-0">
            <input value={msgText} onChange={(e) => setMsgText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void sendMsg()}
              placeholder="Type a message..."
              className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#004B49]" />
            <button onClick={() => void sendMsg()} disabled={!msgText.trim() || sending}
              className="w-10 h-10 bg-[#004B49] rounded-xl flex items-center justify-center disabled:opacity-50">
              {sending ? <Loader2 size={15} className="animate-spin text-white" /> : <Send size={15} className="text-white" />}
            </button>
          </div>
        )}

        {/* ══ TRACKING MODAL (Provider) ══ */}
        {showTracking && (
          <div className="fixed inset-0 z-[90] flex flex-col justify-end">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowTracking(false)} />
            <div className="relative bg-white rounded-t-3xl px-5 pt-4 pb-8">
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-3" />
              <div className="flex items-center justify-between mb-4">
                <span className="font-black text-gray-800">📦 Send Visa</span>
                <button onClick={() => setShowTracking(false)} className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center">
                  <X size={16} className="text-gray-500" />
                </button>
              </div>
              <div className="text-xs text-gray-500 mb-3">Visa mukammal ho gaya? Tracking/reference number likhen — buyer isi se apna visa verify karega.</div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Tracking / Reference Number *</div>
              <input value={trackingInput} onChange={(e) => setTrackingInput(e.target.value)}
                placeholder="e.g. TCS-12345678 or Visa Ref#"
                autoFocus
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-3 text-sm outline-none focus:border-[#004B49] mb-4" />
              <button onClick={() => void saveTrackingAndDeliver()} disabled={!trackingInput.trim() || processing}
                className="w-full bg-[#004B49] text-white font-bold py-3.5 rounded-2xl text-sm disabled:opacity-50">
                {processing ? "Sending..." : "✅ Confirm — Visa Sent"}
              </button>
            </div>
          </div>
        )}

        {/* ══ FEEDBACK MODAL ══ */}
        {showFeedback && (
          <div className="fixed inset-0 z-[90] flex flex-col justify-end">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowFeedback(false)} />
            <div className="relative bg-white rounded-t-3xl px-5 pt-4 pb-8 max-h-[85vh] overflow-y-auto">
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-3" />
              <div className="flex items-center justify-between mb-4">
                <span className="font-black text-gray-800">Rate Your Experience</span>
                <button onClick={() => setShowFeedback(false)} className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center">
                  <X size={16} className="text-gray-500" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4">
                <button onClick={() => setFbRating("positive")}
                  className={`py-4 rounded-2xl border-2 transition-all ${fbRating === "positive" ? "border-green-400 bg-green-50" : "border-gray-100 bg-gray-50"}`}>
                  <div className="text-2xl mb-1">👍</div>
                  <div className={`text-sm font-bold ${fbRating === "positive" ? "text-green-600" : "text-gray-500"}`}>Positive</div>
                </button>
                <button onClick={() => setFbRating("negative")}
                  className={`py-4 rounded-2xl border-2 transition-all ${fbRating === "negative" ? "border-red-400 bg-red-50" : "border-gray-100 bg-gray-50"}`}>
                  <div className="text-2xl mb-1">👎</div>
                  <div className={`text-sm font-bold ${fbRating === "negative" ? "text-red-500" : "text-gray-500"}`}>Negative</div>
                </button>
              </div>

              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">What stood out? (tap all that apply)</div>
              <div className="flex flex-wrap gap-2 mb-4">
                {FEEDBACK_TAGS.map((t) => (
                  <button key={t} onClick={() => setFbTags((p) => p.includes(t) ? p.filter((x) => x !== t) : [...p, t])}
                    className={`text-xs font-semibold px-3 py-2 rounded-full border transition-all ${fbTags.includes(t) ? "bg-[#004B49] text-white border-[#004B49]" : "bg-gray-50 text-gray-600 border-gray-100"}`}>
                    {fbTags.includes(t) ? "✓ " : ""}{t}
                  </button>
                ))}
              </div>

              <textarea value={fbComment} onChange={(e) => setFbComment(e.target.value)}
                placeholder="Write a short review (optional)..." rows={3}
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#004B49] mb-4" />

              <button onClick={() => void submitFeedback()} disabled={processing}
                className="w-full bg-[#004B49] text-white font-bold py-3.5 rounded-2xl text-sm disabled:opacity-60">
                {processing ? "Submitting..." : "Submit Feedback"}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ═══════════ ORDERS LIST ═══════════
  return (
    <div className="flex flex-col pb-8">
      {toast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[100] bg-gray-900 text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-2xl">{toast}</div>
      )}

      <div className="bg-white px-4 py-3 flex items-center gap-2 border-b border-gray-100">
        <button onClick={() => void navigate({ to: "/" })} className="p-1.5 rounded-full hover:bg-gray-100">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <span className="font-bold text-gray-800 text-sm">My Orders</span>
      </div>

      <div className="grid grid-cols-3 gap-2 px-4 mt-4">
        <div className="bg-white rounded-2xl p-3 shadow-sm text-center">
          <div className="font-black text-gray-800 text-lg">${totalSpent.toFixed(0)}</div>
          <div className="text-[10px] text-gray-400">Total Spent</div>
        </div>
        <div className="bg-[#FBF3E1] rounded-2xl p-3 text-center">
          <div className="font-black text-[#9c7a1f] text-lg">${inEscrow.toFixed(0)}</div>
          <div className="text-[10px] text-gray-500">In Escrow</div>
        </div>
        <div className="bg-green-50 rounded-2xl p-3 text-center">
          <div className="font-black text-green-600 text-lg">${completedTotal.toFixed(0)}</div>
          <div className="text-[10px] text-gray-500">Completed</div>
        </div>
      </div>

      <div className="flex gap-2 px-4 mt-4">
        {(["all", "active", "completed"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold capitalize transition-all ${filter === f ? "bg-[#004B49] text-white" : "bg-white text-gray-500 border border-gray-100"}`}>
            {f}
          </button>
        ))}
      </div>

      <div className="px-4 mt-4 flex flex-col gap-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm py-12 text-center">
            <div className="text-3xl mb-2">📦</div>
            <div className="text-sm font-bold text-gray-400 mb-1">No orders yet</div>
            <div className="text-xs text-gray-400">Place an order on a listing to see it here.</div>
          </div>
        ) : (
          filtered.map((o) => {
            const isBuyer = userId === o.buyer_id;
            const other = isBuyer ? (o.seller as any) : (o.buyer as any);
            const otherName = other?.display_name ?? other?.full_name ?? (isBuyer ? "Provider" : "Buyer");
            const adInfo = o.ads as any;
            const si = statusInfo(o.status);
            return (
              <button key={o.id} onClick={() => void openOrder(o)} className="bg-white rounded-2xl p-4 shadow-sm text-left">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#004B49] to-[#00746f] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {otherName[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-800 text-sm truncate">{adInfo?.title ?? "Order"}</div>
                    <div className="text-[11px] text-gray-400">{isBuyer ? "Provider" : "Buyer"}: {otherName}</div>
                  </div>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full flex-shrink-0 ${si.cls}`}>{si.label}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-gray-400 flex items-center gap-1">
                    <Clock size={10} /> {new Date(o.created_at).toLocaleDateString()}
                  </span>
                  <span className="text-sm font-black text-[#004B49]">${Number(o.amount).toFixed(2)}</span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
