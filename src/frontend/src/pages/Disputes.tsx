import { ArrowLeft, AlertTriangle, CheckCircle, Clock, MessageCircle, Upload, ChevronDown, ChevronUp } from "lucide-react";
import { useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";

const DISPUTES = [
  {
    id: "DSP-001",
    txnId: "TXN-003",
    title: "UAE Work Visa — IT Sector",
    provider: "Dubai Visa Center",
    amount: 199,
    status: "under_review",
    reason: "Provider stopped responding after document submission",
    filedDate: "May 15, 2026",
    updates: [
      { date: "May 15", text: "Dispute filed by buyer", by: "You" },
      { date: "May 16", text: "Admin notified provider — awaiting response", by: "Crossing" },
      { date: "May 18", text: "Provider responded — case under review", by: "Crossing" },
    ],
  },
];

const REASONS = [
  "Provider stopped responding",
  "Documents submitted but no update",
  "Visa rejected — provider promised refund",
  "Fake or misleading listing",
  "Provider requested extra payment",
  "Other fraud or scam",
];

export function Disputes() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"active" | "new">("active");
  const [openId, setOpenId] = useState<string | null>("DSP-001");
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const STATUS = {
    under_review: { label: "Under Review", color: "text-amber-500", bg: "bg-amber-50", border: "border-amber-100" },
    resolved:     { label: "Resolved",     color: "text-green-500", bg: "bg-green-50",  border: "border-green-100" },
    closed:       { label: "Closed",       color: "text-gray-400",  bg: "bg-gray-50",   border: "border-gray-100" },
  };

  return (
    <div className="flex flex-col pb-8">

      {/* BACK */}
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

      {/* ACTIVE DISPUTES */}
      {tab === "active" && (
        <div className="mx-4 mt-4 flex flex-col gap-3">

          {/* INFO BOX */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
            <div className="text-xs font-bold text-[#1a56f0] mb-1">🛡️ Escrow Protection Active</div>
            <div className="text-xs text-blue-700">
              Your funds are safely held in Escrow. They will not be released to the provider until your dispute is resolved.
            </div>
          </div>

          {DISPUTES.map((d) => {
            const s = STATUS[d.status as keyof typeof STATUS];
            const isOpen = openId === d.id;

            return (
              <div key={d.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">

                {/* HEADER */}
                <button
                  onClick={() => setOpenId(isOpen ? null : d.id)}
                  className="w-full px-4 py-4 flex items-start gap-3 text-left"
                >
                  <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle size={18} className="text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-800 text-sm truncate">{d.title}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{d.provider}</div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${s.bg} ${s.color} ${s.border}`}>
                        {s.label}
                      </span>
                      <span className="text-[10px] text-gray-400">Filed {d.filedDate}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-black text-gray-800">${d.amount}</div>
                    <div className="text-[10px] text-gray-400">Locked</div>
                    <div className="mt-1">
                      {isOpen
                        ? <ChevronUp size={14} className="text-gray-400 ml-auto" />
                        : <ChevronDown size={14} className="text-gray-400 ml-auto" />}
                    </div>
                  </div>
                </button>

                {/* EXPANDED */}
                {isOpen && (
                  <div className="px-4 pb-4 border-t border-gray-50">

                    {/* REASON */}
                    <div className="mt-3 bg-gray-50 rounded-xl p-3 mb-3">
                      <div className="text-[10px] font-bold text-gray-400 mb-1">Dispute Reason</div>
                      <div className="text-xs text-gray-700">{d.reason}</div>
                    </div>

                    {/* TIMELINE */}
                    <div className="mb-3">
                      <div className="text-xs font-bold text-gray-600 mb-2">Case Timeline</div>
                      <div className="flex flex-col gap-2">
                        {d.updates.map((u, i) => (
                          <div key={i} className="flex gap-2.5 items-start">
                            <div className="flex flex-col items-center">
                              <div className="w-5 h-5 rounded-full bg-[#1a56f0]/10 flex items-center justify-center flex-shrink-0">
                                <div className="w-2 h-2 rounded-full bg-[#1a56f0]" />
                              </div>
                              {i < d.updates.length - 1 && (
                                <div className="w-px h-4 bg-gray-100 mt-0.5" />
                              )}
                            </div>
                            <div className="pb-1">
                              <div className="text-xs text-gray-700 font-medium">{u.text}</div>
                              <div className="text-[10px] text-gray-400 mt-0.5">{u.date} · {u.by}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* UPLOAD EVIDENCE */}
                    <div className="mb-3">
                      <div className="text-xs font-bold text-gray-600 mb-2">Add Evidence</div>
                      <button
                        onClick={() => alert("File picker opening...")}
                        className="w-full border-2 border-dashed border-gray-200 rounded-xl py-3 flex items-center justify-center gap-2 hover:border-[#1a56f0]/40 transition-all"
                      >
                        <Upload size={16} className="text-gray-300" />
                        <span className="text-xs text-gray-400">Upload screenshots or documents</span>
                      </button>
                    </div>

                    {/* ACTIONS */}
                    <div className="flex gap-2">
                      <Link to="/messages" className="flex-1">
                        <button className="w-full border border-[#1a56f0] text-[#1a56f0] text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5">
                          <MessageCircle size={14} />
                          Message Admin
                        </button>
                      </Link>
                      <button
                        onClick={() => alert("Escalation request sent to senior admin.")}
                        className="flex-1 bg-red-500 text-white text-xs font-bold py-2.5 rounded-xl"
                      >
                        Escalate Case
                      </button>
                    </div>

                    <div className="mt-2 text-center">
                      <span className="text-[10px] text-gray-400">Case ID: {d.id} · Transaction: {d.txnId}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {DISPUTES.length === 0 && (
            <div className="text-center py-12">
              <CheckCircle size={36} className="text-gray-200 mx-auto mb-3" />
              <div className="text-sm font-bold text-gray-400">No active disputes</div>
              <div className="text-xs text-gray-300 mt-1">All your transactions are running smoothly</div>
            </div>
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
              <button
                onClick={() => { setSubmitted(false); setTab("active"); }}
                className="bg-[#1a56f0] text-white font-bold py-3 px-6 rounded-2xl text-sm"
              >
                View My Disputes
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">

              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-2">
                <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-amber-700 mb-0.5">Before filing a dispute</div>
                  <div className="text-xs text-amber-600">Try messaging the provider first. Most issues are resolved through direct communication.</div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="text-sm font-bold text-gray-800 mb-4">File a Dispute</div>

                <div className="mb-4">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Select Transaction</label>
                  <select className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-[#1a56f0]">
                    <option>TXN-003 — UAE Work Visa ($199)</option>
                    <option>TXN-001 — Canada PR ($499)</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Reason</label>
                  <div className="flex flex-col gap-2">
                    {REASONS.map((r) => (
                      <button key={r} onClick={() => setReason(r)}
                        className={`text-left px-3 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                          reason === r
                            ? "bg-[#1a56f0]/5 border-[#1a56f0] text-[#1a56f0]"
                            : "bg-gray-50 border-gray-100 text-gray-600"
                        }`}>
                        {reason === r ? "✓ " : ""}{r}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Details</label>
                  <textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Describe exactly what happened, when it happened, and what you expect..."
                    rows={4}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-[#1a56f0] resize-none"
                  />
                </div>

                <div className="mb-4">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Evidence (Optional)</label>
                  <button
                    onClick={() => alert("File picker opening...")}
                    className="w-full border-2 border-dashed border-gray-200 rounded-xl py-4 flex flex-col items-center gap-1.5 hover:border-[#1a56f0]/40"
                  >
                    <Upload size={20} className="text-gray-300" />
                    <span className="text-xs text-gray-400">Upload screenshots or documents</span>
                  </button>
                </div>

                <button
                  onClick={() => reason && details ? setSubmitted(true) : alert("Please select a reason and add details")}
                  className="w-full bg-red-500 text-white font-bold py-4 rounded-2xl text-sm"
                >
                  Submit Dispute
                </button>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
