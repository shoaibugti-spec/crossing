import { ArrowLeft, AlertTriangle, CheckCircle, Clock, MessageCircle, Upload, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

interface Dispute {
  id: string;
  transaction_id: string;
  reason: string;
  status: string;
  created_at: string;
  admin_notes: string | null;
  transactions?: {
    amount: number;
    ads?: { title: string } | null;
    profiles?: { full_name: string } | null;
  } | null;
}

interface Transaction {
  id: string;
  amount: number;
  status: string;
  ads?: { title: string } | null;
  profiles?: { full_name: string } | null;
}

const REASONS = [
  "Provider stopped responding",
  "Documents submitted but no update",
  "Visa rejected — provider promised refund",
  "Fake or misleading listing",
  "Provider requested extra payment",
  "Other fraud or scam",
];

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; border: string }> = {
  open:            { label: "Open",         color: "text-blue-600",   bg: "bg-blue-50",    border: "border-blue-100" },
  under_review:    { label: "Under Review", color: "text-[#9c7a1f]",  bg: "bg-[#FBF3E1]", border: "border-[#D4AF37]/30" },
  resolved_buyer:  { label: "Resolved ✓",  color: "text-green-500",  bg: "bg-green-50",   border: "border-green-100" },
  resolved_seller: { label: "Resolved",    color: "text-green-500",  bg: "bg-green-50",   border: "border-green-100" },
  closed:          { label: "Closed",      color: "text-gray-400",   bg: "bg-gray-50",    border: "border-gray-100" },
};

export function Disputes() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"active" | "new">("active");
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [selectedTxn, setSelectedTxn] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) { setLoading(false); return; }
    setUserId(userData.user.id);

    const { data: disputesData } = await supabase
      .from("disputes")
      .select("id, transaction_id, reason, status, created_at, admin_notes, transactions(amount, ads(title), profiles:seller_id(full_name))")
      .eq("filed_by", userData.user.id)
      .order("created_at", { ascending: false });
    setDisputes(disputesData ?? []);

    const { data: txnsData } = await supabase
      .from("transactions")
      .select("id, amount, status, ads(title), profiles:seller_id(full_name)")
      .eq("buyer_id", userData.user.id)
      .in("status", ["escrow_active", "in_progress"]);
    setTransactions(txnsData ?? []);
    if (txnsData && txnsData.length > 0) setSelectedTxn(txnsData[0].id);

    setLoading(false);
  }

  async function submitDispute() {
    if (!reason || !details || !selectedTxn || !userId) return;
    setSubmitting(true);

    const txn = transactions.find((t) => t.id === selectedTxn);

    const { error } = await supabase.from("disputes").insert({
      transaction_id: selectedTxn,
      filed_by: userId,
      reason,
      details,
      status: "open",
    });

    if (error) {
      alert("Failed to submit dispute: " + error.message);
      setSubmitting(false);
      return;
    }

    // Update transaction status
    await supabase.from("transactions").update({ status: "disputed" }).eq("id", selectedTxn);

    setSubmitting(false);
    setSubmitted(true);
    await loadData();
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    return `${days} days ago`;
  }

  return (
    <div className="flex flex-col pb-8">

      {/* HEADER */}
      <div className="bg-white px-4 py-3 flex items-center gap-2 border-b border-gray-100">
        <button onClick={() => void navigate({ to: "/" })} className="p-1.5 rounded-full hover:bg-gray-100">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <span className="font-bold text-gray-800 text-sm">Dispute Center</span>
      </div>

      {/* TABS */}
      <div className="bg-white px-4 pb-3 border-b border-gray-100">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mt-3">
          {(["active", "new"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                tab === t ? "bg-white text-gray-800 shadow-sm" : "text-gray-400"
              }`}>
              {t === "active" ? "My Disputes" : "File New Dispute"}
            </button>
          ))}
        </div>
      </div>

      {/* MY DISPUTES */}
      {tab === "active" && (
        <div className="mx-4 mt-4 flex flex-col gap-3">

          <div className="bg-[#E8F0EF] border border-[#004B49]/15 rounded-2xl p-4">
            <div className="text-xs font-bold text-[#004B49] mb-1">🛡️ Escrow Protection Active</div>
            <div className="text-xs text-[#004B49]">Your funds are safely held in Escrow. They will not be released to the provider until your dispute is resolved.</div>
          </div>

          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-gray-300" size={28} /></div>
          ) : disputes.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle size={36} className="text-gray-200 mx-auto mb-3" />
              <div className="text-sm font-bold text-gray-400">No active disputes</div>
              <div className="text-xs text-gray-300 mt-1">All your transactions are running smoothly</div>
            </div>
          ) : (
            disputes.map((d) => {
              const s = STATUS_MAP[d.status] ?? STATUS_MAP["open"];
              const isOpen = openId === d.id;
              const txn = d.transactions;

              return (
                <div key={d.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <button onClick={() => setOpenId(isOpen ? null : d.id)}
                    className="w-full px-4 py-4 flex items-start gap-3 text-left">
                    <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                      <AlertTriangle size={18} className="text-red-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-gray-800 text-sm truncate">
                        {(txn?.ads as any)?.title ?? "Transaction"}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {(txn?.profiles as any)?.full_name ?? "Provider"}
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${s.bg} ${s.color} ${s.border}`}>
                          {s.label}
                        </span>
                        <span className="text-[10px] text-gray-400">{timeAgo(d.created_at)}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-black text-gray-800">${txn?.amount ?? "—"}</div>
                      <div className="text-[10px] text-gray-400">Locked</div>
                      <div className="mt-1">
                        {isOpen ? <ChevronUp size={14} className="text-gray-400 ml-auto" /> : <ChevronDown size={14} className="text-gray-400 ml-auto" />}
                      </div>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 border-t border-gray-50">

                      <div className="mt-3 bg-gray-50 rounded-xl p-3 mb-3">
                        <div className="text-[10px] font-bold text-gray-400 mb-1">Dispute Reason</div>
                        <div className="text-xs text-gray-700">{d.reason}</div>
                      </div>

                      {d.admin_notes && (
                        <div className="bg-[#E8F0EF] border border-[#004B49]/15 rounded-xl p-3 mb-3">
                          <div className="text-[10px] font-bold text-[#004B49] mb-1">Admin Notes</div>
                          <div className="text-xs text-[#004B49]">{d.admin_notes}</div>
                        </div>
                      )}

                      <div className="mb-3">
                        <div className="text-xs font-bold text-gray-600 mb-2">Case Timeline</div>
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-2.5 items-start">
                            <div className="flex flex-col items-center">
                              <div className="w-5 h-5 rounded-full bg-[#004B49]/10 flex items-center justify-center flex-shrink-0">
                                <div className="w-2 h-2 rounded-full bg-[#004B49]" />
                              </div>
                            </div>
                            <div className="pb-1">
                              <div className="text-xs text-gray-700 font-medium">Dispute filed</div>
                              <div className="text-[10px] text-gray-400 mt-0.5">{new Date(d.created_at).toLocaleDateString()} · You</div>
                            </div>
                          </div>
                          <div className="flex gap-2.5 items-start">
                            <div className="w-5 h-5 rounded-full bg-[#004B49]/10 flex items-center justify-center flex-shrink-0">
                              <div className="w-2 h-2 rounded-full bg-[#9c7a1f]" />
                            </div>
                            <div className="pb-1">
                              <div className="text-xs text-gray-700 font-medium">
                                Status: {s.label}
                              </div>
                              <div className="text-[10px] text-gray-400 mt-0.5">Crossingate Admin</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => void navigate({ to: "/messages" })}
                          className="flex-1 border border-[#004B49] text-[#004B49] text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5">
                          <MessageCircle size={14} /> Message Admin
                        </button>
                        <button
                          onClick={() => alert("Escalation request sent to senior admin.")}
                          className="flex-1 bg-red-500 text-white text-xs font-bold py-2.5 rounded-xl">
                          Escalate Case
                        </button>
                      </div>

                      <div className="mt-2 text-center">
                        <span className="text-[10px] text-gray-400">Case ID: {d.id.slice(0, 8).toUpperCase()} · Txn: {d.transaction_id.slice(0, 8).toUpperCase()}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* FILE NEW DISPUTE */}
      {tab === "new" && (
        <div className="mx-4 mt-4">
          {submitted ? (
            <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
              <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
                <CheckCircle size={26} className="text-green-500" />
              </div>
              <div className="font-black text-gray-800 text-lg mb-1">Dispute Filed!</div>
              <div className="text-sm text-gray-500 mb-4">
                Admin will review your case within 24 hours. Your Escrow funds remain locked and safe.
              </div>
              <button onClick={() => { setSubmitted(false); setTab("active"); setReason(""); setDetails(""); }}
                className="bg-[#004B49] text-white font-bold py-3 px-6 rounded-2xl text-sm">
                View My Disputes
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">

              <div className="bg-[#FBF3E1] border border-[#D4AF37]/30 rounded-2xl p-4 flex gap-2">
                <AlertTriangle size={16} className="text-[#9c7a1f] flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-[#9c7a1f] mb-0.5">Before filing a dispute</div>
                  <div className="text-xs text-[#9c7a1f]">Try messaging the provider first. Most issues are resolved through direct communication.</div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="text-sm font-bold text-gray-800 mb-4">File a Dispute</div>

                <div className="mb-4">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Select Transaction</label>
                  {loading ? (
                    <div className="flex justify-center py-4"><Loader2 className="animate-spin text-gray-300" size={20} /></div>
                  ) : transactions.length === 0 ? (
                    <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-500 text-center">
                      No active transactions found. You can only file a dispute for active orders.
                    </div>
                  ) : (
                    <select value={selectedTxn} onChange={(e) => setSelectedTxn(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-[#004B49]">
                      {transactions.map((t) => (
                        <option key={t.id} value={t.id}>
                          {(t.ads as any)?.title ?? "Transaction"} — ${t.amount}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="mb-4">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Reason</label>
                  <div className="flex flex-col gap-2">
                    {REASONS.map((r) => (
                      <button key={r} onClick={() => setReason(r)}
                        className={`text-left px-3 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                          reason === r ? "bg-[#004B49]/5 border-[#004B49] text-[#004B49]" : "bg-gray-50 border-gray-100 text-gray-600"
                        }`}>
                        {reason === r ? "✓ " : ""}{r}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Details</label>
                  <textarea value={details} onChange={(e) => setDetails(e.target.value)}
                    placeholder="Describe exactly what happened, when it happened, and what you expect..."
                    rows={4}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-[#004B49] resize-none" />
                </div>

                <button
                  onClick={() => void submitDispute()}
                  disabled={!reason || !details || !selectedTxn || submitting || transactions.length === 0}
                  className="w-full bg-red-500 text-white font-bold py-4 rounded-2xl text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting ? <><Loader2 size={16} className="animate-spin" /> Submitting...</> : "Submit Dispute"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
