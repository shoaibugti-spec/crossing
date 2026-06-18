import { ArrowLeft, Lock, CheckCircle, Clock, AlertTriangle, ChevronDown, ChevronUp, MessageCircle, FileText, Calendar, Upload, Plus, Timer, Loader2 } from "lucide-react";
import { useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

interface DocRow {
  id: string;
  name: string;
  is_additional: boolean;
  status: string;
  submitted_at: string | null;
  review_deadline: string | null;
}

interface TxRow {
  id: string;
  amount: number;
  status: string;
  current_step: number;
  appointment_date: string | null;
  appointment_time: string | null;
  appointment_location: string | null;
  appointment_voucher: string | null;
  created_at: string;
  buyer_id: string;
  seller_id: string;
  ad_title: string;
  ad_country: string;
  counterparty_name: string;
  docs: DocRow[];
}

const STATUS_DISPLAY: Record<string, { label: string; color: string; bg: string; border: string }> = {
  escrow_active: { label: "Escrow Active", color: "text-[#9c7a1f]", bg: "bg-[#FBF3E1]", border: "border-[#D4AF37]/30" },
  in_progress:   { label: "In Progress",   color: "text-[#9c7a1f]", bg: "bg-[#FBF3E1]", border: "border-[#D4AF37]/30" },
  completed:     { label: "Completed",     color: "text-green-500", bg: "bg-green-50", border: "border-green-100" },
  disputed:      { label: "Disputed",      color: "text-red-500",   bg: "bg-red-50",   border: "border-red-100" },
  cancelled:     { label: "Cancelled",     color: "text-gray-400",  bg: "bg-gray-50",  border: "border-gray-200" },
};

const PROGRESS_STEPS = [
  "Payment locked in Escrow",
  "Documents submitted",
  "Embassy appointment scheduled",
  "Visa decision received",
  "Visa confirmed — payment released",
];

function formatCountdown(ms: number) {
  if (ms <= 0) return "Overdue";
  const h = Math.floor(ms / (1000 * 60 * 60));
  const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  return `${h}h ${m}m left`;
}

export function Transactions() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<TxRow[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [tab, setTab] = useState<"all" | "active" | "completed">("all");
  const [activeTab, setActiveTab] = useState<Record<string, string>>({});
  const [voucherInput, setVoucherInput] = useState("");
  const [showVoucherInput, setShowVoucherInput] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const [showOverdueDispute, setShowOverdueDispute] = useState<{ tx: string; doc: string } | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<TxRow | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void loadData();
    const interval = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  async function loadData() {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setLoading(false);
      void navigate({ to: "/login" });
      return;
    }
    const uid = userData.user.id;
    setUserId(uid);

    const { data: txs } = await supabase
      .from("transactions")
      .select(`
        id, amount, status, current_step, appointment_date, appointment_time, appointment_location, appointment_voucher, created_at, buyer_id, seller_id,
        ads:ad_id(title, country),
        buyer:buyer_id(full_name),
        seller:seller_id(full_name)
      `)
      .or(`buyer_id.eq.${uid},seller_id.eq.${uid}`)
      .order("created_at", { ascending: false });

    if (!txs) { setLoading(false); return; }

    const mapped: TxRow[] = [];
    for (const row of txs as any[]) {
      const { data: docs } = await supabase
        .from("transaction_documents")
        .select("id, name, is_additional, status, submitted_at, review_deadline")
        .eq("transaction_id", row.id);

      mapped.push({
        id: row.id,
        amount: Number(row.amount),
        status: row.status,
        current_step: row.current_step,
        appointment_date: row.appointment_date,
        appointment_time: row.appointment_time,
        appointment_location: row.appointment_location,
        appointment_voucher: row.appointment_voucher,
        created_at: row.created_at,
        buyer_id: row.buyer_id,
        seller_id: row.seller_id,
        ad_title: row.ads?.title ?? "Visa Listing",
        ad_country: row.ads?.country ?? "",
        counterparty_name: uid === row.buyer_id ? (row.seller?.full_name ?? "Provider") : (row.buyer?.full_name ?? "Buyer"),
        docs: docs ?? [],
      });
    }

    setTransactions(mapped);
    setLoading(false);
  }

  async function submitDoc(txId: string, docId: string) {
    const deadline = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString();
    await supabase.from("transaction_documents").update({
      status: "submitted",
      submitted_at: new Date().toISOString(),
      review_deadline: deadline,
    }).eq("id", docId);

    setTransactions((prev) => prev.map((t) =>
      t.id === txId ? { ...t, docs: t.docs.map((d) => d.id === docId ? { ...d, status: "submitted", submitted_at: new Date().toISOString(), review_deadline: deadline } : d) } : t
    ));
  }

  async function submitVoucher(txId: string) {
    if (!voucherInput.trim()) return;
    await supabase.from("transactions").update({ appointment_voucher: voucherInput.trim() }).eq("id", txId);
    setTransactions((prev) => prev.map((t) => t.id === txId ? { ...t, appointment_voucher: voucherInput.trim() } : t));
    setVoucherInput("");
    setShowVoucherInput(null);
  }

  async function confirmVisaReceived(tx: TxRow) {
    setBusy(true);
    await supabase.from("transactions").update({
      status: "completed",
      current_step: 5,
      completed_at: new Date().toISOString(),
    }).eq("id", tx.id);

    const { data: sellerProfile } = await supabase.from("profiles").select("wallet_balance").eq("id", tx.seller_id).single();
    const sellerNewBalance = Number(sellerProfile?.wallet_balance ?? 0) + (tx.amount - 36);
    await supabase.from("profiles").update({ wallet_balance: sellerNewBalance }).eq("id", tx.seller_id);
    await supabase.from("wallet_transactions").insert({
      user_id: tx.seller_id,
      type: "earning",
      amount: tx.amount - 36,
      status: "completed",
      notes: `Payment released — ${tx.ad_title}`,
    });

    setTransactions((prev) => prev.map((t) => t.id === tx.id ? { ...t, status: "completed", current_step: 5 } : t));
    setShowConfirmModal(null);
    setBusy(false);
  }

  const filtered = transactions.filter((t) => {
    if (tab === "active") return t.status === "escrow_active" || t.status === "in_progress";
    if (tab === "completed") return t.status === "completed";
    return true;
  });

  const totalSpent = transactions.filter((t) => t.buyer_id === userId).reduce((s, t) => s + t.amount + 36, 0);
  const inEscrow = transactions.filter((t) => t.buyer_id === userId && (t.status === "escrow_active" || t.status === "in_progress")).reduce((s, t) => s + t.amount + 36, 0);
  const completedTotal = transactions.filter((t) => t.buyer_id === userId && t.status === "completed").reduce((s, t) => s + t.amount + 36, 0);

  const getTabForTx = (txId: string) => activeTab[txId] || "docs";
  const setTabForTx = (txId: string, t: string) => setActiveTab((prev) => ({ ...prev, [txId]: t }));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-gray-300" size={28} />
      </div>
    );
  }

  return (
    <div className="flex flex-col pb-8">

      <div className="bg-white px-4 py-3 flex items-center gap-2 border-b border-gray-100">
        <button onClick={() => void navigate({ to: "/" })} className="p-1.5 rounded-full hover:bg-gray-100">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <span className="font-bold text-gray-800 text-sm">My Transactions</span>
      </div>

      <div className="bg-white px-4 pb-3 border-b border-gray-100">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mt-3">
          {(["all", "active", "completed"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${tab === t ? "bg-white text-gray-800 shadow-sm" : "text-gray-400"}`}>
              {t === "all" ? "All" : t === "active" ? "Active" : "Completed"}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-4 mt-4">
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Total Spent", value: `$${totalSpent.toFixed(0)}`, icon: Lock, color: "text-[#004B49]", bg: "bg-[#E8F0EF]" },
            { label: "In Escrow", value: `$${inEscrow.toFixed(0)}`, icon: Clock, color: "text-[#9c7a1f]", bg: "bg-[#FBF3E1]" },
            { label: "Completed", value: `$${completedTotal.toFixed(0)}`, icon: CheckCircle, color: "text-green-500", bg: "bg-green-50" },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className={`${bg} rounded-2xl p-3 flex flex-col gap-1`}>
              <Icon size={16} className={color} />
              <div className={`font-black text-sm ${color}`}>{value}</div>
              <div className="text-[10px] text-gray-500">{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-4 mt-4 flex flex-col gap-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-10 text-center">
            <div className="text-2xl mb-2">🔄</div>
            <div className="text-sm font-bold text-gray-400">No transactions yet</div>
            <div className="text-xs text-gray-300 mt-1">Place an order on a listing to see it here</div>
          </div>
        ) : (
          filtered.map((tx) => {
            const s = STATUS_DISPLAY[tx.status] ?? STATUS_DISPLAY.escrow_active;
            const isOpen = open === tx.id;
            const currentTab = getTabForTx(tx.id);
            const isBuyer = tx.buyer_id === userId;
            const pendingDocs = tx.docs.filter((d) => d.status === "not_submitted").length;
            const overdueReviews = tx.docs.filter((d) => d.status === "submitted" && d.review_deadline && now > new Date(d.review_deadline).getTime()).length;

            return (
              <div key={tx.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">

                <button onClick={() => setOpen(isOpen ? null : tx.id)} className="w-full px-4 py-4 flex items-start gap-3 text-left">
                  <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
                    {tx.status === "completed" ? <CheckCircle size={18} className={s.color} />
                      : tx.status === "disputed" ? <AlertTriangle size={18} className={s.color} />
                      : <Clock size={18} className={s.color} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-800 text-sm truncate">{tx.ad_title}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{tx.ad_country} · {tx.counterparty_name}</div>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${s.bg} ${s.color} ${s.border}`}>{s.label}</span>
                      {pendingDocs > 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-500 border border-red-100">{pendingDocs} docs pending</span>
                      )}
                      {overdueReviews > 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600 border border-red-200 animate-pulse">⚠ {overdueReviews} review overdue!</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-black text-gray-800">${tx.amount}</div>
                    <div className="text-[10px] text-gray-400">USDT</div>
                    {isOpen ? <ChevronUp size={14} className="text-gray-400 ml-auto mt-1" /> : <ChevronDown size={14} className="text-gray-400 ml-auto mt-1" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-gray-50">

                    <div className="flex border-b border-gray-100">
                      {[
                        { key: "docs", label: "📄 Documents" },
                        { key: "appointment", label: "📅 Appointment" },
                        { key: "progress", label: "📊 Progress" },
                      ].map((t) => (
                        <button key={t.key} onClick={() => setTabForTx(tx.id, t.key)}
                          className={`flex-1 py-2.5 text-xs font-bold transition-all ${currentTab === t.key ? "text-[#004B49] border-b-2 border-[#004B49]" : "text-gray-400"}`}>
                          {t.label}
                        </button>
                      ))}
                    </div>

                    <div className="px-4 py-3">

                      {currentTab === "docs" && (
                        <div>
                          <div className="bg-[#E8F0EF] border border-[#004B49]/15 rounded-xl p-2.5 mb-3 flex gap-2">
                            <Timer size={13} className="text-[#004B49] flex-shrink-0 mt-0.5" />
                            <span className="text-[11px] text-[#004B49]">Provider must review each document within <span className="font-bold">24 hours</span> of submission.</span>
                          </div>

                          {tx.docs.length === 0 ? (
                            <div className="text-xs text-gray-400 text-center py-4">No documents required for this listing.</div>
                          ) : (
                            <div className="flex flex-col gap-2">
                              {tx.docs.filter((d) => !d.is_additional).map((doc) => {
                                const isOverdue = doc.status === "submitted" && doc.review_deadline && now > new Date(doc.review_deadline).getTime();
                                const timeLeft = doc.review_deadline ? new Date(doc.review_deadline).getTime() - now : 0;
                                return (
                                  <div key={doc.id} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${isOverdue ? "bg-red-50 border border-red-200" : "bg-gray-50"}`}>
                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${isOverdue ? "bg-red-100" : "bg-[#E8F0EF]"}`}>
                                      <FileText size={13} className={isOverdue ? "text-red-500" : "text-[#004B49]"} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="text-xs font-semibold text-gray-700 truncate">{doc.name}</div>
                                      <div className={`text-[10px] font-semibold mt-0.5 ${
                                        doc.status === "verified" ? "text-green-500" : isOverdue ? "text-red-500" : doc.status === "submitted" ? "text-[#9c7a1f]" : "text-red-400"
                                      }`}>
                                        {doc.status === "verified" ? "✓ Verified"
                                          : isOverdue ? "⚠ Review overdue — file dispute"
                                          : doc.status === "submitted" ? `⏳ Under review · ${formatCountdown(timeLeft)}`
                                          : "⚠ Not submitted"}
                                      </div>
                                    </div>
                                    {doc.status === "not_submitted" && isBuyer && (
                                      <button onClick={() => void submitDoc(tx.id, doc.id)}
                                        className="bg-[#004B49] text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 flex-shrink-0">
                                        <Upload size={10} /> Upload
                                      </button>
                                    )}
                                    {isOverdue && isBuyer && (
                                      <button onClick={() => setShowOverdueDispute({ tx: tx.id, doc: doc.name })}
                                        className="bg-red-500 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg flex-shrink-0">
                                        File Dispute
                                      </button>
                                    )}
                                  </div>
                                );
                              })}

                              {tx.docs.filter((d) => d.is_additional).length > 0 && (
                                <>
                                  <div className="text-xs font-bold text-gray-600 mt-2 mb-1">Additional (Requested by Provider)</div>
                                  {tx.docs.filter((d) => d.is_additional).map((doc) => (
                                    <div key={doc.id} className="flex items-center gap-3 bg-[#FBF3E1] border border-[#D4AF37]/30 rounded-xl px-3 py-2.5">
                                      <div className="w-7 h-7 bg-[#D4AF37]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <Plus size={13} className="text-[#9c7a1f]" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="text-xs font-semibold text-gray-700 truncate">{doc.name}</div>
                                        <div className="text-[10px] text-[#9c7a1f] font-semibold mt-0.5">{doc.status === "submitted" ? "✓ Submitted" : "⚠ Requested by provider"}</div>
                                      </div>
                                      {doc.status === "not_submitted" && isBuyer && (
                                        <button onClick={() => void submitDoc(tx.id, doc.id)}
                                          className="bg-[#D4AF37] text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 flex-shrink-0">
                                          <Upload size={10} /> Upload
                                        </button>
                                      )}
                                    </div>
                                  ))}
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {currentTab === "appointment" && (
                        <div>
                          {tx.appointment_date ? (
                            <>
                              <div className="bg-[#E8F0EF] border border-[#004B49]/15 rounded-2xl p-4 mb-3">
                                <div className="flex items-center gap-2 mb-3">
                                  <Calendar size={16} className="text-[#004B49]" />
                                  <span className="text-sm font-bold text-[#004B49]">Embassy Appointment</span>
                                </div>
                                <div className="flex flex-col gap-2">
                                  <div className="flex justify-between"><span className="text-xs text-gray-500">Date</span><span className="text-xs font-bold text-gray-800">{tx.appointment_date}</span></div>
                                  <div className="flex justify-between"><span className="text-xs text-gray-500">Time</span><span className="text-xs font-bold text-gray-800">{tx.appointment_time}</span></div>
                                  <div className="flex justify-between"><span className="text-xs text-gray-500">Location</span><span className="text-xs font-bold text-gray-800 text-right max-w-[60%]">{tx.appointment_location}</span></div>
                                </div>
                              </div>
                              <div className="text-xs font-bold text-gray-600 mb-2">Appointment Voucher</div>
                              {tx.appointment_voucher ? (
                                <div className="bg-green-50 border border-green-100 rounded-xl p-3 flex items-center gap-2">
                                  <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                                  <div>
                                    <div className="text-xs font-bold text-green-700">Voucher Confirmed</div>
                                    <div className="text-[11px] text-green-600 font-mono mt-0.5">{tx.appointment_voucher}</div>
                                  </div>
                                </div>
                              ) : isBuyer ? (
                                showVoucherInput === tx.id ? (
                                  <div className="flex gap-2">
                                    <input value={voucherInput} onChange={(e) => setVoucherInput(e.target.value)} placeholder="Enter voucher/reference number"
                                      className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 text-xs outline-none focus:border-[#004B49]" />
                                    <button onClick={() => void submitVoucher(tx.id)} className="bg-[#004B49] text-white text-xs font-bold px-3 py-2.5 rounded-xl">Submit</button>
                                  </div>
                                ) : (
                                  <button onClick={() => setShowVoucherInput(tx.id)}
                                    className="w-full border-2 border-dashed border-gray-200 rounded-xl py-3 text-xs text-gray-400 font-semibold hover:border-[#004B49]/40 transition-all">
                                    + Add Appointment Voucher
                                  </button>
                                )
                              ) : (
                                <div className="text-xs text-gray-400 text-center py-2">Waiting for buyer to confirm voucher</div>
                              )}
                            </>
                          ) : (
                            <div className="text-center py-6">
                              <Calendar size={28} className="text-gray-200 mx-auto mb-2" />
                              <div className="text-sm font-bold text-gray-400">No Appointment Yet</div>
                              <div className="text-xs text-gray-300 mt-1">Provider will schedule the embassy appointment</div>
                            </div>
                          )}
                        </div>
                      )}

                      {currentTab === "progress" && (
                        <div>
                          <div className="flex gap-1 mb-4">
                            {PROGRESS_STEPS.map((_, i) => (
                              <div key={i} className={`flex-1 h-1.5 rounded-full ${i < tx.current_step ? "bg-[#004B49]" : "bg-gray-100"}`} />
                            ))}
                          </div>
                          <div className="flex flex-col gap-3">
                            {PROGRESS_STEPS.map((title, i) => (
                              <div key={i} className="flex items-start gap-3">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${i < tx.current_step ? "bg-[#004B49]" : "bg-gray-100"}`}>
                                  {i < tx.current_step ? <CheckCircle size={13} className="text-white" /> : <span className="text-[9px] text-gray-400 font-bold">{i + 1}</span>}
                                </div>
                                <div className={`text-xs font-semibold ${i < tx.current_step ? "text-gray-800" : "text-gray-400"}`}>{title}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 mt-4">
                        <Link to="/messages" className="flex-1">
                          <button className="w-full border border-[#004B49] text-[#004B49] text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5">
                            <MessageCircle size={14} /> Chat
                          </button>
                        </Link>
                        {(tx.status === "escrow_active" || tx.status === "in_progress") && isBuyer && (
                          <button onClick={() => setShowConfirmModal(tx)} className="flex-1 bg-green-500 text-white text-xs font-bold py-2.5 rounded-xl">
                            ✓ Visa Received
                          </button>
                        )}
                        {tx.status === "disputed" && (
                          <Link to="/disputes" className="flex-1">
                            <button className="w-full bg-red-500 text-white text-xs font-bold py-2.5 rounded-xl">View Dispute</button>
                          </Link>
                        )}
                        {tx.status === "completed" && isBuyer && (
                          <button onClick={() => alert("Review system coming soon")} className="flex-1 bg-[#D4AF37] text-white text-xs font-bold py-2.5 rounded-xl">⭐ Leave Review</button>
                        )}
                      </div>
                      <div className="mt-2 text-center"><span className="text-[10px] text-gray-400 font-mono">ID: {tx.id.slice(0, 8)}</span></div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* OVERDUE DISPUTE MODAL */}
      {showOverdueDispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowOverdueDispute(null)} />
          <div className="relative bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <div className="text-center mb-4">
              <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertTriangle size={26} className="text-red-500" />
              </div>
              <div className="font-black text-gray-800 text-lg mb-1">Review Overdue</div>
              <div className="text-sm text-gray-500 leading-relaxed">
                Provider failed to review <span className="font-bold text-gray-800">{showOverdueDispute.doc}</span> within the 24-hour SLA.
              </div>
            </div>
            <Link to="/disputes">
              <button className="w-full bg-red-500 text-white font-bold py-4 rounded-2xl text-sm mb-2">File Dispute Now</button>
            </Link>
            <button onClick={() => setShowOverdueDispute(null)} className="w-full bg-gray-50 text-gray-500 font-semibold py-3 rounded-2xl text-sm">Give More Time</button>
          </div>
        </div>
      )}

      {/* CONFIRM MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <div className="text-center mb-4">
              <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle size={28} className="text-green-500" />
              </div>
              <div className="font-black text-gray-800 text-lg mb-1">Confirm Visa Received?</div>
              <div className="text-sm text-gray-500 leading-relaxed">
                Confirming will release <span className="font-bold text-gray-800">${(showConfirmModal.amount - 36).toFixed(2)} USDT</span> from Escrow to {showConfirmModal.counterparty_name} immediately.
              </div>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-4">
              <div className="text-xs text-red-600 font-semibold">⚠️ Only confirm after you physically receive your visa documents. This cannot be undone.</div>
            </div>
            <button onClick={() => void confirmVisaReceived(showConfirmModal)} disabled={busy}
              className="w-full bg-green-500 text-white font-bold py-4 rounded-2xl text-sm mb-2 disabled:opacity-60">
              {busy ? "Processing..." : "✓ Yes, I Received My Visa"}
            </button>
            <button onClick={() => setShowConfirmModal(null)} className="w-full bg-gray-50 text-gray-500 font-semibold py-3 rounded-2xl text-sm">Cancel</button>
          </div>
        </div>
      )}

    </div>
  );
}
