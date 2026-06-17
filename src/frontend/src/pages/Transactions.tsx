import { ArrowLeft, Lock, CheckCircle, Clock, AlertTriangle, ChevronDown, ChevronUp, MessageCircle, FileText, Shield, Calendar, Upload, Plus, Timer } from "lucide-react";
import { useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";

const TRANSACTIONS = [
  {
    id: "TXN-001",
    title: "Canada PR — Express Entry",
    provider: "ImmigrationPro",
    country: "🇨🇦 Canada",
    amount: 499,
    currency: "USDT",
    status: "in_progress",
    currentStep: 2,
    date: "June 10, 2026",
    requiredDocs: [
      { id: "d1", name: "Passport (All Pages)", required: true, submitted: true, verified: true, submittedAt: null, reviewDeadline: null },
      { id: "d2", name: "IELTS Result", required: true, submitted: true, verified: false, submittedAt: Date.now() - 1000 * 60 * 60 * 18, reviewDeadline: Date.now() + 1000 * 60 * 60 * 6 },
      { id: "d3", name: "Educational Certificate", required: true, submitted: true, verified: false, submittedAt: Date.now() - 1000 * 60 * 60 * 23, reviewDeadline: Date.now() + 1000 * 60 * 60 * 1 },
      { id: "d4", name: "Work Experience Letter", required: true, submitted: false, verified: false, submittedAt: null, reviewDeadline: null },
      { id: "d5", name: "Police Clearance Certificate", required: true, submitted: false, verified: false, submittedAt: null, reviewDeadline: null },
    ],
    additionalDocs: [
      { id: "ad1", name: "Bank Statement (6 months)", addedBy: "ImmigrationPro", submitted: false, submittedAt: null, reviewDeadline: null },
    ],
    appointment: { set: true, date: "July 5, 2026", time: "10:30 AM", location: "Canadian Embassy, Islamabad", voucher: null },
    steps: [
      { title: "Payment locked in Escrow", done: true, date: "June 10" },
      { title: "Documents submitted", done: true, date: "June 12" },
      { title: "Embassy appointment scheduled", done: true, date: "June 14" },
      { title: "Visa decision received", done: false, date: null },
      { title: "Visa confirmed — payment released", done: false, date: null },
    ],
  },
  {
    id: "TXN-002",
    title: "UK Student Visa",
    provider: "Global Edu",
    country: "🇬🇧 United Kingdom",
    amount: 299,
    currency: "USDT",
    status: "completed",
    currentStep: 5,
    date: "May 20, 2026",
    requiredDocs: [],
    additionalDocs: [],
    appointment: { set: true, date: "June 1, 2026", time: "2:00 PM", location: "UK VFS, Karachi", voucher: "VFS-UK-2026-4412" },
    steps: [
      { title: "Payment locked in Escrow", done: true, date: "May 20" },
      { title: "Documents submitted", done: true, date: "May 21" },
      { title: "Embassy appointment scheduled", done: true, date: "May 25" },
      { title: "Visa decision received", done: true, date: "June 1" },
      { title: "Visa confirmed — payment released", done: true, date: "June 2" },
    ],
  },
  {
    id: "TXN-003",
    title: "UAE Work Visa — IT Sector",
    provider: "Dubai Visa Center",
    country: "🇦🇪 UAE",
    amount: 199,
    currency: "USDT",
    status: "disputed",
    currentStep: 2,
    date: "May 5, 2026",
    requiredDocs: [
      { id: "d6", name: "Job Offer Letter", required: true, submitted: true, verified: false, submittedAt: Date.now() - 1000 * 60 * 60 * 30, reviewDeadline: Date.now() - 1000 * 60 * 60 * 6 },
    ],
    additionalDocs: [],
    appointment: { set: false, date: null, time: null, location: null, voucher: null },
    steps: [
      { title: "Payment locked in Escrow", done: true, date: "May 5" },
      { title: "Documents submitted", done: true, date: "May 6" },
      { title: "Embassy appointment scheduled", done: false, date: null },
      { title: "Visa decision received", done: false, date: null },
      { title: "Visa confirmed — payment released", done: false, date: null },
    ],
  },
];

const STATUS = {
  in_progress: { label: "In Progress", color: "text-amber-500", bg: "bg-amber-50", border: "border-amber-100" },
  completed:   { label: "Completed",   color: "text-green-500", bg: "bg-green-50",  border: "border-green-100" },
  disputed:    { label: "Disputed",    color: "text-red-500",   bg: "bg-red-50",    border: "border-red-100" },
};

function formatCountdown(ms: number) {
  if (ms <= 0) return "Overdue";
  const h = Math.floor(ms / (1000 * 60 * 60));
  const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  return `${h}h ${m}m left`;
}

export function Transactions() {
  const navigate = useNavigate();
  const [open, setOpen] = useState<string | null>("TXN-001");
  const [tab, setTab] = useState<"all" | "active" | "completed">("all");
  const [activeTab, setActiveTab] = useState<Record<string, string>>({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [transactions, setTransactions] = useState(TRANSACTIONS);
  const [voucherInput, setVoucherInput] = useState("");
  const [showVoucherInput, setShowVoucherInput] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const [showOverdueDispute, setShowOverdueDispute] = useState<{tx: string, doc: string} | null>(null);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  const filtered = transactions.filter((t) => {
    if (tab === "active") return t.status === "in_progress";
    if (tab === "completed") return t.status === "completed";
    return true;
  });

  const submitDoc = (txId: string, docId: string) => {
    const deadline = Date.now() + 1000 * 60 * 60 * 24; // 24 hours from now
    setTransactions((prev) => prev.map((t) =>
      t.id === txId ? {
        ...t,
        requiredDocs: t.requiredDocs.map((d) =>
          d.id === docId ? { ...d, submitted: true, submittedAt: Date.now(), reviewDeadline: deadline } : d
        ),
        additionalDocs: t.additionalDocs.map((d) =>
          d.id === docId ? { ...d, submitted: true, submittedAt: Date.now(), reviewDeadline: deadline } : d
        ),
      } : t
    ));
  };

  const submitVoucher = (txId: string) => {
    if (!voucherInput.trim()) return;
    setTransactions((prev) => prev.map((t) =>
      t.id === txId ? { ...t, appointment: { ...t.appointment, voucher: voucherInput.trim() } } : t
    ));
    setVoucherInput("");
    setShowVoucherInput(null);
  };

  const getTabForTx = (txId: string) => activeTab[txId] || "docs";
  const setTabForTx = (txId: string, tab: string) => setActiveTab((prev) => ({ ...prev, [txId]: tab }));

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
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                tab === t ? "bg-white text-gray-800 shadow-sm" : "text-gray-400"
              }`}>
              {t === "all" ? "All" : t === "active" ? "Active" : "Completed"}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-4 mt-4">
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Total Spent", value: "$997", icon: Lock, color: "text-[#1a56f0]", bg: "bg-blue-50" },
            { label: "In Escrow", value: "$499", icon: Clock, color: "text-amber-500", bg: "bg-amber-50" },
            { label: "Completed", value: "$498", icon: CheckCircle, color: "text-green-500", bg: "bg-green-50" },
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
        {filtered.map((tx) => {
          const s = STATUS[tx.status as keyof typeof STATUS];
          const isOpen = open === tx.id;
          const currentTab = getTabForTx(tx.id);
          const allDocs = [...tx.requiredDocs, ...tx.additionalDocs];
          const pendingDocs = allDocs.filter((d) => !d.submitted).length;
          const overdueReviews = allDocs.filter((d) => d.submitted && !d.verified && d.reviewDeadline && now > d.reviewDeadline).length;

          return (
            <div key={tx.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">

              <button onClick={() => setOpen(isOpen ? null : tx.id)} className="w-full px-4 py-4 flex items-start gap-3 text-left">
                <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
                  {tx.status === "completed" ? <CheckCircle size={18} className={s.color} />
                    : tx.status === "disputed" ? <AlertTriangle size={18} className={s.color} />
                    : <Clock size={18} className={s.color} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-gray-800 text-sm truncate">{tx.title}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{tx.country} · {tx.provider}</div>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${s.bg} ${s.color} ${s.border}`}>{s.label}</span>
                    {pendingDocs > 0 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-500 border border-red-100">
                        {pendingDocs} docs pending
                      </span>
                    )}
                    {overdueReviews > 0 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600 border border-red-200 animate-pulse">
                        ⚠ {overdueReviews} review overdue!
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-black text-gray-800">${tx.amount}</div>
                  <div className="text-[10px] text-gray-400">{tx.currency}</div>
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
                        className={`flex-1 py-2.5 text-xs font-bold transition-all ${
                          currentTab === t.key ? "text-[#1a56f0] border-b-2 border-[#1a56f0]" : "text-gray-400"
                        }`}>
                        {t.label}
                      </button>
                    ))}
                  </div>

                  <div className="px-4 py-3">

                    {currentTab === "docs" && (
                      <div>
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-2.5 mb-3 flex gap-2">
                          <Timer size={13} className="text-[#1a56f0] flex-shrink-0 mt-0.5" />
                          <span className="text-[11px] text-blue-700">
                            Provider must review each document within <span className="font-bold">24 hours</span> of submission. Auto-dispute option available if overdue.
                          </span>
                        </div>

                        <div className="text-xs font-bold text-gray-600 mb-2">Required Documents</div>
                        <div className="flex flex-col gap-2 mb-3">
                          {tx.requiredDocs.map((doc) => {
                            const isOverdue = doc.submitted && !doc.verified && doc.reviewDeadline && now > doc.reviewDeadline;
                            const timeLeft = doc.reviewDeadline ? doc.reviewDeadline - now : 0;
                            return (
                              <div key={doc.id} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${
                                isOverdue ? "bg-red-50 border border-red-200" : "bg-gray-50"
                              }`}>
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                  isOverdue ? "bg-red-100" : "bg-blue-50"
                                }`}>
                                  <FileText size={13} className={isOverdue ? "text-red-500" : "text-[#1a56f0]"} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs font-semibold text-gray-700 truncate">{doc.name}</div>
                                  <div className={`text-[10px] font-semibold mt-0.5 ${
                                    doc.verified ? "text-green-500"
                                    : isOverdue ? "text-red-500"
                                    : doc.submitted ? "text-amber-500"
                                    : "text-red-400"
                                  }`}>
                                    {doc.verified ? "✓ Verified"
                                      : isOverdue ? "⚠ Review overdue — file dispute"
                                      : doc.submitted ? `⏳ Under review · ${formatCountdown(timeLeft)}`
                                      : "⚠ Not submitted"}
                                  </div>
                                </div>
                                {!doc.submitted && tx.status === "in_progress" && (
                                  <button onClick={() => submitDoc(tx.id, doc.id)}
                                    className="bg-[#1a56f0] text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 flex-shrink-0">
                                    <Upload size={10} /> Upload
                                  </button>
                                )}
                                {isOverdue && (
                                  <button onClick={() => setShowOverdueDispute({ tx: tx.id, doc: doc.name })}
                                    className="bg-red-500 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg flex-shrink-0">
                                    File Dispute
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {tx.additionalDocs.length > 0 && (
                          <>
                            <div className="text-xs font-bold text-gray-600 mb-2">
                              Additional (Requested by {tx.provider})
                            </div>
                            <div className="flex flex-col gap-2 mb-3">
                              {tx.additionalDocs.map((doc) => (
                                <div key={doc.id} className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
                                  <div className="w-7 h-7 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Plus size={13} className="text-amber-600" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-xs font-semibold text-gray-700 truncate">{doc.name}</div>
                                    <div className="text-[10px] text-amber-500 font-semibold mt-0.5">
                                      {doc.submitted ? "✓ Submitted" : "⚠ Requested by provider"}
                                    </div>
                                  </div>
                                  {!doc.submitted && tx.status === "in_progress" && (
                                    <button onClick={() => submitDoc(tx.id, doc.id)}
                                      className="bg-amber-500 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 flex-shrink-0">
                                      <Upload size={10} /> Upload
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {currentTab === "appointment" && (
                      <div>
                        {tx.appointment.set ? (
                          <>
                            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-3">
                              <div className="flex items-center gap-2 mb-3">
                                <Calendar size={16} className="text-[#1a56f0]" />
                                <span className="text-sm font-bold text-[#1a56f0]">Embassy Appointment</span>
                              </div>
                              <div className="flex flex-col gap-2">
                                <div className="flex justify-between"><span className="text-xs text-gray-500">Date</span><span className="text-xs font-bold text-gray-800">{tx.appointment.date}</span></div>
                                <div className="flex justify-between"><span className="text-xs text-gray-500">Time</span><span className="text-xs font-bold text-gray-800">{tx.appointment.time}</span></div>
                                <div className="flex justify-between"><span className="text-xs text-gray-500">Location</span><span className="text-xs font-bold text-gray-800 text-right max-w-[60%]">{tx.appointment.location}</span></div>
                              </div>
                            </div>
                            <div className="text-xs font-bold text-gray-600 mb-2">Appointment Voucher</div>
                            {tx.appointment.voucher ? (
                              <div className="bg-green-50 border border-green-100 rounded-xl p-3 flex items-center gap-2">
                                <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                                <div>
                                  <div className="text-xs font-bold text-green-700">Voucher Confirmed</div>
                                  <div className="text-[11px] text-green-600 font-mono mt-0.5">{tx.appointment.voucher}</div>
                                </div>
                              </div>
                            ) : (
                              <div>
                                {showVoucherInput === tx.id ? (
                                  <div className="flex gap-2">
                                    <input value={voucherInput} onChange={(e) => setVoucherInput(e.target.value)}
                                      placeholder="Enter voucher/reference number"
                                      className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 text-xs outline-none focus:border-[#1a56f0]" />
                                    <button onClick={() => submitVoucher(tx.id)} className="bg-[#1a56f0] text-white text-xs font-bold px-3 py-2.5 rounded-xl">Submit</button>
                                  </div>
                                ) : (
                                  <button onClick={() => setShowVoucherInput(tx.id)}
                                    className="w-full border-2 border-dashed border-gray-200 rounded-xl py-3 text-xs text-gray-400 font-semibold hover:border-[#1a56f0]/40 transition-all">
                                    + Add Appointment Voucher
                                  </button>
                                )}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-center py-6">
                            <Calendar size={28} className="text-gray-200 mx-auto mb-2" />
                            <div className="text-sm font-bold text-gray-400">No Appointment Yet</div>
                            <div className="text-xs text-gray-300 mt-1">Provider will schedule your embassy appointment</div>
                          </div>
                        )}
                      </div>
                    )}

                    {currentTab === "progress" && (
                      <div>
                        <div className="flex gap-1 mb-4">
                          {tx.steps.map((_, i) => (
                            <div key={i} className={`flex-1 h-1.5 rounded-full ${i < tx.currentStep ? "bg-[#1a56f0]" : "bg-gray-100"}`} />
                          ))}
                        </div>
                        <div className="flex flex-col gap-3">
                          {tx.steps.map((step, i) => (
                            <div key={i} className="flex items-start gap-3">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${step.done ? "bg-[#1a56f0]" : "bg-gray-100"}`}>
                                {step.done ? <CheckCircle size={13} className="text-white" /> : <span className="text-[9px] text-gray-400 font-bold">{i + 1}</span>}
                              </div>
                              <div className="flex-1">
                                <div className={`text-xs font-semibold ${step.done ? "text-gray-800" : "text-gray-400"}`}>{step.title}</div>
                                {step.date && <div className="text-[10px] text-gray-400 mt-0.5">{step.date}</div>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 mt-4">
                      <Link to={`/messages/1`} className="flex-1">
                        <button className="w-full border border-[#1a56f0] text-[#1a56f0] text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5">
                          <MessageCircle size={14} /> Chat with Provider
                        </button>
                      </Link>
                      {tx.status === "in_progress" && !confirmed && (
                        <button onClick={() => setShowConfirmModal(true)}
                          className="flex-1 bg-green-500 text-white text-xs font-bold py-2.5 rounded-xl">✓ Visa Received</button>
                      )}
                      {tx.status === "in_progress" && confirmed && (
                        <div className="flex-1 bg-green-50 border border-green-100 text-green-600 text-xs font-bold py-2.5 rounded-xl text-center">✅ Payment Released</div>
                      )}
                      {tx.status === "disputed" && (
                        <Link to="/disputes" className="flex-1">
                          <button className="w-full bg-red-500 text-white text-xs font-bold py-2.5 rounded-xl">View Dispute</button>
                        </Link>
                      )}
                      {tx.status === "completed" && (
                        <button onClick={() => alert("Review submitted! Thank you.")} className="flex-1 bg-amber-400 text-white text-xs font-bold py-2.5 rounded-xl">⭐ Leave Review</button>
                      )}
                    </div>
                    <div className="mt-2 text-center"><span className="text-[10px] text-gray-400">ID: {tx.id}</span></div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
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
                Provider failed to review <span className="font-bold text-gray-800">{showOverdueDispute.doc}</span> within the 24-hour SLA. You can file a dispute now.
              </div>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-4">
              <div className="text-[11px] text-red-600 font-semibold">
                Your Escrow funds remain fully protected. Filing a dispute alerts Crossing admin to investigate immediately.
              </div>
            </div>
            <Link to="/disputes">
              <button className="w-full bg-red-500 text-white font-bold py-4 rounded-2xl text-sm mb-2">File Dispute Now</button>
            </Link>
            <button onClick={() => setShowOverdueDispute(null)} className="w-full bg-gray-50 text-gray-500 font-semibold py-3 rounded-2xl text-sm">
              Give More Time
            </button>
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
                Confirming will release <span className="font-bold text-gray-800">$499 USDT</span> from Escrow to ImmigrationPro immediately.
              </div>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-4">
              <div className="text-xs text-red-600 font-semibold">⚠️ Only confirm after you physically receive your visa documents. This cannot be undone.</div>
            </div>
            <button onClick={() => { setConfirmed(true); setShowConfirmModal(false); }}
              className="w-full bg-green-500 text-white font-bold py-4 rounded-2xl text-sm mb-2">✓ Yes, I Received My Visa</button>
            <button onClick={() => setShowConfirmModal(false)} className="w-full bg-gray-50 text-gray-500 font-semibold py-3 rounded-2xl text-sm">Cancel</button>
          </div>
        </div>
      )}

    </div>
  );
}
