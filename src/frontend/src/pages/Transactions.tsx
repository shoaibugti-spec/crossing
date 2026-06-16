import { ArrowLeft, Lock, CheckCircle, Clock, AlertTriangle, ChevronDown, ChevronUp, MessageCircle } from "lucide-react";
import { useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";

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
    steps: [
      { title: "Payment locked in Escrow", done: true, date: "June 10" },
      { title: "Documents submitted by buyer", done: true, date: "June 12" },
      { title: "Embassy application submitted", done: false, date: null },
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
    steps: [
      { title: "Payment locked in Escrow", done: true, date: "May 20" },
      { title: "Documents submitted by buyer", done: true, date: "May 21" },
      { title: "Embassy application submitted", done: true, date: "May 25" },
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
    currentStep: 3,
    date: "May 5, 2026",
    steps: [
      { title: "Payment locked in Escrow", done: true, date: "May 5" },
      { title: "Documents submitted by buyer", done: true, date: "May 6" },
      { title: "Embassy application submitted", done: true, date: "May 10" },
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

export function Transactions() {
  const navigate = useNavigate();
  const [open, setOpen] = useState<string | null>("TXN-001");
  const [tab, setTab] = useState<"all" | "active" | "completed">("all");

  const filtered = TRANSACTIONS.filter((t) => {
    if (tab === "active") return t.status === "in_progress";
    if (tab === "completed") return t.status === "completed";
    return true;
  });

  return (
    <div className="flex flex-col pb-8">

      {/* BACK */}
      <div className="bg-white px-4 py-3 flex items-center gap-2 border-b border-gray-100">
        <button onClick={() => void navigate({ to: "/" })} className="p-1.5 rounded-full hover:bg-gray-100">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <span className="font-bold text-gray-800 text-sm">My Transactions</span>
      </div>

      {/* TABS */}
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

      {/* SUMMARY */}
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

      {/* TRANSACTIONS */}
      <div className="mx-4 mt-4 flex flex-col gap-3">
        {filtered.map((tx) => {
          const s = STATUS[tx.status as keyof typeof STATUS];
          const isOpen = open === tx.id;

          return (
            <div key={tx.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">

              {/* HEADER */}
              <button
                onClick={() => setOpen(isOpen ? null : tx.id)}
                className="w-full px-4 py-4 flex items-start gap-3 text-left"
              >
                <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
                  {tx.status === "completed"
                    ? <CheckCircle size={18} className={s.color} />
                    : tx.status === "disputed"
                    ? <AlertTriangle size={18} className={s.color} />
                    : <Clock size={18} className={s.color} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-gray-800 text-sm truncate">{tx.title}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{tx.country} · {tx.provider}</div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${s.bg} ${s.color} ${s.border}`}>
                      {s.label}
                    </span>
                    <span className="text-[10px] text-gray-400">{tx.date}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-black text-gray-800">${tx.amount}</div>
                  <div className="text-[10px] text-gray-400">{tx.currency}</div>
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

                  {/* STEP TRACKER */}
                  <div className="mt-3 mb-3">
                    <div className="text-xs font-bold text-gray-600 mb-2">Case Progress</div>

                    {/* Progress Bar */}
                    <div className="flex gap-1 mb-3">
                      {tx.steps.map((_, i) => (
                        <div key={i} className={`flex-1 h-1.5 rounded-full ${
                          i < tx.currentStep ? "bg-[#1a56f0]" : "bg-gray-100"
                        }`} />
                      ))}
                    </div>

                    {/* Steps List */}
                    <div className="flex flex-col gap-2">
                      {tx.steps.map((step, i) => (
                        <div key={i} className="flex items-start gap-2.5">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                            step.done ? "bg-[#1a56f0]" : "bg-gray-100"
                          }`}>
                            {step.done
                              ? <CheckCircle size={12} className="text-white" />
                              : <span className="text-[9px] text-gray-400 font-bold">{i + 1}</span>}
                          </div>
                          <div className="flex-1">
                            <div className={`text-xs font-semibold ${step.done ? "text-gray-800" : "text-gray-400"}`}>
                              {step.title}
                            </div>
                            {step.date && (
                              <div className="text-[10px] text-gray-400">{step.date}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ACTIONS */}
                  <div className="flex gap-2 mt-3">
                    <Link to="/messages" className="flex-1">
                      <button className="w-full border border-[#1a56f0] text-[#1a56f0] text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5">
                        <MessageCircle size={14} />
                        Message
                      </button>
                    </Link>

                    {tx.status === "in_progress" && (
                      <button
                        onClick={() => alert("Please confirm only after you receive your visa documents.")}
                        className="flex-1 bg-green-500 text-white text-xs font-bold py-2.5 rounded-xl"
                      >
                        ✓ Confirm Visa Received
                      </button>
                    )}

                    {tx.status === "disputed" && (
                      <Link to="/disputes" className="flex-1">
                        <button className="w-full bg-red-500 text-white text-xs font-bold py-2.5 rounded-xl">
                          View Dispute
                        </button>
                      </Link>
                    )}

                    {tx.status === "completed" && (
                      <button
                        onClick={() => alert("Review submitted! Thank you.")}
                        className="flex-1 bg-amber-400 text-white text-xs font-bold py-2.5 rounded-xl"
                      >
                        ⭐ Leave Review
                      </button>
                    )}
                  </div>

                  {tx.status === "in_progress" && (
                    <div className="mt-2 bg-amber-50 border border-amber-100 rounded-xl p-2.5">
                      <div className="text-[11px] text-amber-700">
                        ⚠️ Only confirm visa received after you physically receive all visa documents. Escrow will release immediately after confirmation.
                      </div>
                    </div>
                  )}

                  <div className="mt-2 text-center">
                    <span className="text-[10px] text-gray-400">Transaction ID: {tx.id}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}
