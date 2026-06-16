import { useParams, useNavigate, Link } from "@tanstack/react-router";
import {
  ArrowLeft, Shield, Clock, CheckCircle, Lock,
  MessageCircle, Star, AlertTriangle, ChevronDown, ChevronUp,
} from "lucide-react";
import { useState } from "react";
import { MOCK_ADS } from "../lib/mockData";

export function AdDetail() {
  const { id } = useParams({ from: "/ads/$id" });
  const navigate = useNavigate();
  const ad = MOCK_ADS.find((a) => a.id === id) ?? MOCK_ADS[0];

  const [showEscrow, setShowEscrow] = useState(false);
  const [escrowStep, setEscrowStep] = useState(0);
  const [openStep, setOpenStep] = useState<number | null>(0);

  const steps = [
    { title: "Submit Your Documents", desc: "Provider will tell you exactly which documents are needed. You upload them through the app." },
    { title: "Provider Reviews & Submits", desc: "Provider checks your documents and submits them to the embassy or relevant authority." },
    { title: "Application Processing", desc: "Embassy processes your application. Provider updates you at every stage." },
    { title: "Visa Decision", desc: "Visa approved or rejected. Provider shares official documents with you." },
    { title: "Case Closed & Payment Released", desc: "You confirm receipt of visa. Crossing releases Escrow funds to provider." },
  ];

  const handleEscrowDeposit = () => {
    setShowEscrow(true);
    setEscrowStep(1);
  };

  return (
    <div className="flex flex-col pb-8">

      {/* BACK */}
      <div className="bg-white px-4 py-3 flex items-center gap-2 border-b border-gray-100">
        <button onClick={() => void navigate({ to: "/ads", search: { q: "", country: "", type: "" } })}
          className="p-1.5 rounded-full hover:bg-gray-100">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <span className="font-bold text-gray-800 text-sm">Listing Detail</span>
      </div>

      {/* PROVIDER CARD */}
      <div className="mx-4 mt-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1a56f0] to-purple-600 flex items-center justify-center text-white font-black text-lg flex-shrink-0">
              {ad.sellerName?.[0] ?? "P"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-gray-800">{ad.sellerName ?? "Visa Provider"}</span>
                <span className="bg-green-50 text-green-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-100">
                  ✓ KYC Verified
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1">
                <div className="flex items-center gap-1">
                  <Star size={12} className="text-amber-400 fill-amber-400" />
                  <span className="text-xs font-semibold text-gray-600">{ad.rating ?? "4.8"}</span>
                  <span className="text-xs text-gray-400">({ad.reviewCount ?? 24} reviews)</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock size={11} />
                  <span>Replies in 2h</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* LISTING INFO */}
      <div className="mx-4 mt-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-start justify-between gap-2 mb-3">
            <h1 className="font-black text-gray-800 text-base leading-snug flex-1">{ad.title}</h1>
            <div className="text-right flex-shrink-0">
              <div className="text-xl font-black text-[#1a56f0]">${ad.price}</div>
              <div className="text-[10px] text-gray-400">USDT</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-3">
            <span className="bg-blue-50 text-blue-600 text-xs font-semibold px-2.5 py-1 rounded-full">
              🌍 {ad.country}
            </span>
            <span className="bg-purple-50 text-purple-600 text-xs font-semibold px-2.5 py-1 rounded-full">
              {ad.visaType ?? ad.category}
            </span>
            <span className="bg-amber-50 text-amber-600 text-xs font-semibold px-2.5 py-1 rounded-full">
              ⏱ {ad.processingTime ?? "4-6 weeks"}
            </span>
          </div>

          <p className="text-sm text-gray-600 leading-relaxed">{ad.description}</p>
        </div>
      </div>

      {/* STEP BY STEP PROCESS */}
      <div className="mx-4 mt-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="text-sm font-bold text-gray-800 mb-3">📋 Step-by-Step Process</div>
          <div className="flex flex-col gap-2">
            {steps.map((step, i) => (
              <div key={i} className="border border-gray-100 rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenStep(openStep === i ? null : i)}
                  className="w-full flex items-center justify-between px-3 py-3 text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-[#1a56f0] text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </div>
                    <span className="text-sm font-semibold text-gray-700">{step.title}</span>
                  </div>
                  {openStep === i
                    ? <ChevronUp size={16} className="text-gray-400 flex-shrink-0" />
                    : <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />}
                </button>
                {openStep === i && (
                  <div className="px-4 pb-3 text-xs text-gray-500 leading-relaxed border-t border-gray-50">
                    {step.desc}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* REQUIREMENTS */}
      <div className="mx-4 mt-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="text-sm font-bold text-gray-800 mb-3">📄 Required Documents</div>
          <div className="flex flex-col gap-2">
            {(ad.requirements ?? [
              "Valid Passport (min 6 months validity)",
              "Passport-size photographs (white background)",
              "Bank statements (last 3 months)",
              "Employment letter or business proof",
              "Travel insurance",
            ]).map((req: string, i: number) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle size={14} className="text-[#1a56f0] flex-shrink-0 mt-0.5" />
                <span className="text-xs text-gray-600">{req}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ESCROW EXPLAINER */}
      <div className="mx-4 mt-3">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100">
          <div className="flex items-center gap-2 mb-2">
            <Shield size={16} className="text-[#1a56f0]" />
            <span className="text-sm font-bold text-[#1a56f0]">Escrow Protected Payment</span>
          </div>
          <div className="flex flex-col gap-2">
            {[
              "You deposit USDT — funds go to Crossing Escrow",
              "Provider never receives money until visa is confirmed",
              "If visa fails or fraud — full refund guaranteed",
              "Case closes only after YOU confirm visa received",
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <Lock size={11} className="text-[#1a56f0] flex-shrink-0 mt-0.5" />
                <span className="text-[11px] text-blue-800">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ESCROW FLOW MODAL */}
      {showEscrow && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowEscrow(false)} />
          <div className="relative w-full max-w-lg mx-auto bg-white rounded-t-3xl p-6 pb-10">

            {escrowStep === 1 && (
              <>
                <div className="text-center mb-6">
                  <div className="w-14 h-14 rounded-full bg-[#1a56f0]/10 flex items-center justify-center mx-auto mb-3">
                    <Lock size={24} className="text-[#1a56f0]" />
                  </div>
                  <div className="font-black text-gray-800 text-lg">Deposit to Escrow</div>
                  <div className="text-sm text-gray-500 mt-1">Your funds are 100% safe until visa confirmed</div>
                </div>

                <div className="bg-gray-50 rounded-2xl p-4 mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-500">Service Fee</span>
                    <span className="font-bold text-gray-800">${ad.price} USDT</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-500">Platform Fee (3%)</span>
                    <span className="font-bold text-gray-800">${(Number(ad.price) * 0.03).toFixed(2)} USDT</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-700">Total Deposit</span>
                    <span className="font-black text-[#1a56f0] text-lg">${(Number(ad.price) * 1.03).toFixed(2)} USDT</span>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-4 flex gap-2">
                  <AlertTriangle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  <span className="text-xs text-amber-700">Funds will be locked until you confirm visa receipt. Provider cannot access them before that.</span>
                </div>

                <button
                  onClick={() => setEscrowStep(2)}
                  className="w-full bg-[#1a56f0] text-white font-bold py-4 rounded-2xl text-sm"
                >
                  Confirm & Lock Funds in Escrow
                </button>
                <button onClick={() => setShowEscrow(false)} className="w-full mt-2 text-gray-400 text-sm py-2">
                  Cancel
                </button>
              </>
            )}

            {escrowStep === 2 && (
              <>
                <div className="text-center mb-6">
                  <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle size={24} className="text-green-500" />
                  </div>
                  <div className="font-black text-gray-800 text-lg">Escrow Active! 🔒</div>
                  <div className="text-sm text-gray-500 mt-1">Your ${(Number(ad.price) * 1.03).toFixed(2)} USDT is safely locked</div>
                </div>

                <div className="flex flex-col gap-3 mb-6">
                  {[
                    { done: true, t: "Payment locked in Escrow" },
                    { done: true, t: "Provider notified" },
                    { done: false, t: "Awaiting document submission" },
                    { done: false, t: "Visa processing" },
                    { done: false, t: "Visa confirmed → Payment released" },
                  ].map((s, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${s.done ? "bg-green-500" : "bg-gray-200"}`}>
                        {s.done
                          ? <CheckCircle size={14} className="text-white" />
                          : <span className="text-[10px] text-gray-400 font-bold">{i + 1}</span>}
                      </div>
                      <span className={`text-sm ${s.done ? "text-gray-800 font-semibold" : "text-gray-400"}`}>{s.t}</span>
                    </div>
                  ))}
                </div>

                <Link to="/messages">
                  <button className="w-full bg-[#1a56f0] text-white font-bold py-4 rounded-2xl text-sm flex items-center justify-center gap-2">
                    <MessageCircle size={18} />
                    Message Provider Now
                  </button>
                </Link>
                <Link to="/transactions">
                  <button className="w-full mt-2 bg-gray-50 text-gray-600 font-semibold py-3 rounded-2xl text-sm">
                    View Transaction
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      {/* BOTTOM ACTIONS */}
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 z-30">
        <div className="max-w-lg mx-auto flex gap-3">
          <Link to="/messages" className="flex-1">
            <button className="w-full border-2 border-[#1a56f0] text-[#1a56f0] font-bold py-3.5 rounded-2xl text-sm flex items-center justify-center gap-2">
              <MessageCircle size={16} />
              Message
            </button>
          </Link>
          <button
            onClick={handleEscrowDeposit}
            className="flex-2 flex-1 bg-[#1a56f0] text-white font-bold py-3.5 rounded-2xl text-sm flex items-center justify-center gap-2"
          >
            <Lock size={16} />
            Buy — ${ad.price} USDT
          </button>
        </div>
      </div>

    </div>
  );
}
