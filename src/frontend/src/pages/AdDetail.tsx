import { useParams, useNavigate, Link } from "@tanstack/react-router";
import {
  ArrowLeft, Shield, Clock, CheckCircle, Lock,
  MessageCircle, Star, AlertTriangle, ChevronDown, ChevronUp, Wallet as WalletIcon, Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

interface AdData {
  id: string;
  title: string;
  description: string | null;
  country: string;
  visa_type: string;
  price: number;
  currency: string;
  processing_time: string | null;
  requirements: string[];
  steps: string[];
  provider_id: string;
  provider_name: string | null;
  provider_kyc_status: string | null;
}

const PROCESS_STEPS = [
  { title: "Submit Your Documents", desc: "Provider will tell you exactly which documents are needed. You upload them through the app." },
  { title: "Provider Reviews & Submits", desc: "Provider checks your documents and submits them to the embassy or relevant authority." },
  { title: "Application Processing", desc: "Embassy processes your application. Provider updates you at every stage." },
  { title: "Visa Decision", desc: "Visa approved or rejected. Provider shares official documents with you." },
  { title: "Case Closed & Payment Released", desc: "You confirm receipt of visa. Crossing releases Escrow funds to provider." },
];

export function AdDetail() {
  const { id } = useParams({ from: "/ads/$id" });
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [ad, setAd] = useState<AdData | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [existingTxId, setExistingTxId] = useState<string | null>(null);

  const [showEscrow, setShowEscrow] = useState(false);
  const [escrowStep, setEscrowStep] = useState(0);
  const [openStep, setOpenStep] = useState<number | null>(0);
  const [showInsufficientFunds, setShowInsufficientFunds] = useState(false);
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    void loadData();
  }, [id]);

  async function loadData() {
    setLoading(true);

    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id ?? null;
    setUserId(uid);

    if (uid) {
      const { data: profile } = await supabase.from("profiles").select("wallet_balance").eq("id", uid).single();
      setWalletBalance(Number(profile?.wallet_balance ?? 0));
    }

    const { data: adRow } = await supabase
      .from("ads")
      .select("id, title, description, country, visa_type, price, currency, processing_time, requirements, steps, provider_id, profiles:provider_id(full_name, kyc_status)")
      .eq("id", id)
      .single();

    if (adRow) {
      const row: any = adRow;
      setAd({
        id: row.id,
        title: row.title,
        description: row.description,
        country: row.country,
        visa_type: row.visa_type,
        price: Number(row.price),
        currency: row.currency,
        processing_time: row.processing_time,
        requirements: Array.isArray(row.requirements) ? row.requirements : [],
        steps: Array.isArray(row.steps) ? row.steps : [],
        provider_id: row.provider_id,
        provider_name: row.profiles?.full_name ?? null,
        provider_kyc_status: row.profiles?.kyc_status ?? null,
      });

      if (uid) {
        const { data: existingTx } = await supabase
          .from("transactions")
          .select("id")
          .eq("ad_id", row.id)
          .eq("buyer_id", uid)
          .maybeSingle();
        setExistingTxId(existingTx?.id ?? null);
      }
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-gray-300" size={28} />
      </div>
    );
  }

  if (!ad) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
        <div className="text-2xl mb-2">🔍</div>
        <div className="font-bold text-gray-700">Listing not found</div>
        <Link to="/ads" search={{ q: "", country: "", type: "" }}>
          <button className="mt-3 text-xs text-[#1a56f0] font-semibold">Back to listings</button>
        </Link>
      </div>
    );
  }

  const totalRequired = ad.price * 1.03 + 36;
  const hasEnoughBalance = walletBalance >= totalRequired;
  const verified = ad.provider_kyc_status === "approved";
  const orderPlaced = !!existingTxId;

  const handleBuyClick = () => {
    if (!userId) {
      void navigate({ to: "/login" });
      return;
    }
    if (orderPlaced) {
      void navigate({ to: "/transactions" });
      return;
    }
    if (!hasEnoughBalance) {
      setShowInsufficientFunds(true);
      return;
    }
    setShowEscrow(true);
    setEscrowStep(1);
  };

  const handleMessageClick = () => {
    if (!orderPlaced) {
      alert("You can only message the provider after placing an order. This protects both parties from fraud outside Escrow.");
      return;
    }
    void navigate({ to: "/messages" });
  };

  async function confirmEscrow() {
    if (!userId || !ad) return;
    setPlacing(true);

    const { data: txData, error: txError } = await supabase
      .from("transactions")
      .insert({
        buyer_id: userId,
        seller_id: ad.provider_id,
        ad_id: ad.id,
        amount: ad.price,
        buyer_fee: 36,
        seller_fee: 36,
        status: "escrow_active",
        current_step: 1,
      })
      .select("id")
      .single();

    if (txError || !txData) {
      alert("Failed to place order: " + (txError?.message ?? "unknown error"));
      setPlacing(false);
      return;
    }

    // Deduct from wallet balance and log the wallet transaction
    await supabase.from("profiles").update({ wallet_balance: walletBalance - totalRequired }).eq("id", userId);
    await supabase.from("wallet_transactions").insert({
      user_id: userId,
      type: "fee",
      amount: -totalRequired,
      status: "completed",
      notes: `Escrow deposit for order on "${ad.title}"`,
    });

    // Seed required documents from the ad's requirements list
    if (ad.requirements.length > 0) {
      await supabase.from("transaction_documents").insert(
        ad.requirements.map((name) => ({
          transaction_id: txData.id,
          name,
          is_additional: false,
        }))
      );
    }

    setExistingTxId(txData.id);
    setWalletBalance((b) => b - totalRequired);
    setEscrowStep(2);
    setPlacing(false);
  }

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

      {/* WALLET BALANCE STRIP */}
      {userId && (
        <div className="mx-4 mt-3">
          <Link to="/wallet">
            <div className={`rounded-xl p-3 flex items-center justify-between border ${
              hasEnoughBalance ? "bg-green-50 border-green-100" : "bg-amber-50 border-amber-100"
            }`}>
              <div className="flex items-center gap-2">
                <WalletIcon size={14} className={hasEnoughBalance ? "text-green-500" : "text-amber-500"} />
                <span className={`text-xs font-semibold ${hasEnoughBalance ? "text-green-600" : "text-amber-600"}`}>
                  Wallet Balance: ${walletBalance.toFixed(2)} USDT
                </span>
              </div>
              {!hasEnoughBalance && (
                <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">Top Up →</span>
              )}
            </div>
          </Link>
        </div>
      )}

      {/* PROVIDER CARD */}
      <div className="mx-4 mt-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1a56f0] to-purple-600 flex items-center justify-center text-white font-black text-lg flex-shrink-0">
              {ad.provider_name?.[0]?.toUpperCase() ?? "P"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-gray-800">{ad.provider_name ?? "Visa Provider"}</span>
                {verified && (
                  <span className="bg-green-50 text-green-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-100">✓ KYC Verified</span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1">
                <div className="flex items-center gap-1">
                  <Star size={12} className="text-amber-400 fill-amber-400" />
                  <span className="text-xs text-gray-400">No ratings yet</span>
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
              <div className="text-[10px] text-gray-400">{ad.currency}</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-3">
            <span className="bg-blue-50 text-blue-600 text-xs font-semibold px-2.5 py-1 rounded-full">🌍 {ad.country}</span>
            <span className="bg-purple-50 text-purple-600 text-xs font-semibold px-2.5 py-1 rounded-full">{ad.visa_type}</span>
            {ad.processing_time && (
              <span className="bg-amber-50 text-amber-600 text-xs font-semibold px-2.5 py-1 rounded-full">⏱ {ad.processing_time}</span>
            )}
          </div>

          {ad.description && <p className="text-sm text-gray-600 leading-relaxed">{ad.description}</p>}
        </div>
      </div>

      {/* STEP BY STEP PROCESS */}
      <div className="mx-4 mt-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="text-sm font-bold text-gray-800 mb-3">📋 Step-by-Step Process</div>
          <div className="flex flex-col gap-2">
            {(ad.steps.length > 0 ? ad.steps.map((s, i) => ({ title: s, desc: "" })) : PROCESS_STEPS).map((step, i) => (
              <div key={i} className="border border-gray-100 rounded-xl overflow-hidden">
                <button onClick={() => setOpenStep(openStep === i ? null : i)} className="w-full flex items-center justify-between px-3 py-3 text-left">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-[#1a56f0] text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">{i + 1}</div>
                    <span className="text-sm font-semibold text-gray-700">{step.title}</span>
                  </div>
                  {step.desc && (openStep === i ? <ChevronUp size={16} className="text-gray-400 flex-shrink-0" /> : <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />)}
                </button>
                {openStep === i && step.desc && (
                  <div className="px-4 pb-3 text-xs text-gray-500 leading-relaxed border-t border-gray-50">{step.desc}</div>
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
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-2.5 mb-3 flex gap-2">
            <Clock size={13} className="text-[#1a56f0] flex-shrink-0 mt-0.5" />
            <span className="text-[11px] text-blue-700">Provider must review each document within 24 hours of submission — guaranteed.</span>
          </div>
          {ad.requirements.length > 0 ? (
            <div className="flex flex-col gap-2">
              {ad.requirements.map((req, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle size={14} className="text-[#1a56f0] flex-shrink-0 mt-0.5" />
                  <span className="text-xs text-gray-600">{req}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-gray-400">Provider has not listed specific document requirements yet.</div>
          )}
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
              "Chat unlocks only after you place this order",
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <Lock size={11} className="text-[#1a56f0] flex-shrink-0 mt-0.5" />
                <span className="text-[11px] text-blue-800">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* INSUFFICIENT FUNDS MODAL */}
      {showInsufficientFunds && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowInsufficientFunds(false)} />
          <div className="relative bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <div className="text-center mb-4">
              <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <WalletIcon size={26} className="text-amber-500" />
              </div>
              <div className="font-black text-gray-800 text-lg mb-1">Insufficient Balance</div>
              <div className="text-sm text-gray-500 leading-relaxed">
                You need <span className="font-bold text-gray-800">${totalRequired.toFixed(2)} USDT</span> to place this order. Your current balance is <span className="font-bold text-gray-800">${walletBalance.toFixed(2)} USDT</span>.
              </div>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4 mb-4">
              <div className="flex justify-between text-sm mb-1.5"><span className="text-gray-500">Required</span><span className="font-bold text-gray-800">${totalRequired.toFixed(2)}</span></div>
              <div className="flex justify-between text-sm mb-1.5"><span className="text-gray-500">Your Balance</span><span className="font-bold text-gray-800">${walletBalance.toFixed(2)}</span></div>
              <div className="border-t border-gray-200 pt-1.5 flex justify-between text-sm">
                <span className="text-gray-500 font-bold">Top Up Needed</span>
                <span className="font-black text-amber-500">${(totalRequired - walletBalance).toFixed(2)}</span>
              </div>
            </div>
            <Link to="/wallet">
              <button className="w-full bg-[#1a56f0] text-white font-bold py-4 rounded-2xl text-sm mb-2">Add Funds to Wallet</button>
            </Link>
            <button onClick={() => setShowInsufficientFunds(false)} className="w-full bg-gray-50 text-gray-500 font-semibold py-3 rounded-2xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* ESCROW FLOW MODAL */}
      {showEscrow && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => !placing && setShowEscrow(false)} />
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
                  <div className="flex justify-between items-center mb-2"><span className="text-sm text-gray-500">Service Fee</span><span className="font-bold text-gray-800">${ad.price} USDT</span></div>
                  <div className="flex justify-between items-center mb-2"><span className="text-sm text-gray-500">Platform Fee (3%)</span><span className="font-bold text-gray-800">${(ad.price * 0.03).toFixed(2)} USDT</span></div>
                  <div className="flex justify-between items-center mb-2"><span className="text-sm text-gray-500">Crossing Fee (Buyer)</span><span className="font-bold text-gray-800">$36.00 USDT</span></div>
                  <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-700">Total Deposit</span>
                    <span className="font-black text-[#1a56f0] text-lg">${totalRequired.toFixed(2)} USDT</span>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-4 flex gap-2">
                  <AlertTriangle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  <span className="text-xs text-amber-700">Funds will be locked until you confirm visa receipt. Chat with provider unlocks immediately after this order.</span>
                </div>

                <button onClick={() => void confirmEscrow()} disabled={placing}
                  className="w-full bg-[#1a56f0] text-white font-bold py-4 rounded-2xl text-sm disabled:opacity-60">
                  {placing ? "Processing..." : "Confirm & Lock Funds in Escrow"}
                </button>
                <button onClick={() => !placing && setShowEscrow(false)} className="w-full mt-2 text-gray-400 text-sm py-2">Cancel</button>
              </>
            )}

            {escrowStep === 2 && (
              <>
                <div className="text-center mb-6">
                  <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle size={24} className="text-green-500" />
                  </div>
                  <div className="font-black text-gray-800 text-lg">Escrow Active! 🔒</div>
                  <div className="text-sm text-gray-500 mt-1">Your ${totalRequired.toFixed(2)} USDT is safely locked</div>
                </div>

                <div className="flex flex-col gap-3 mb-6">
                  {[
                    { done: true, t: "Payment locked in Escrow" },
                    { done: true, t: "Provider notified" },
                    { done: true, t: "Chat with provider unlocked ✓" },
                    { done: false, t: "Awaiting document submission" },
                    { done: false, t: "Visa confirmed → Payment released" },
                  ].map((s, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${s.done ? "bg-green-500" : "bg-gray-200"}`}>
                        {s.done ? <CheckCircle size={14} className="text-white" /> : <span className="text-[10px] text-gray-400 font-bold">{i + 1}</span>}
                      </div>
                      <span className={`text-sm ${s.done ? "text-gray-800 font-semibold" : "text-gray-400"}`}>{s.t}</span>
                    </div>
                  ))}
                </div>

                <Link to="/transactions">
                  <button className="w-full bg-[#1a56f0] text-white font-bold py-4 rounded-2xl text-sm flex items-center justify-center gap-2">
                    <MessageCircle size={18} /> View Transaction
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
          <button onClick={handleMessageClick}
            className={`flex-1 font-bold py-3.5 rounded-2xl text-sm flex items-center justify-center gap-2 ${
              orderPlaced ? "border-2 border-[#1a56f0] text-[#1a56f0]" : "border-2 border-gray-200 text-gray-400"
            }`}>
            {!orderPlaced && <Lock size={14} />}
            <MessageCircle size={16} /> Message
          </button>
          <button onClick={handleBuyClick}
            className="flex-1 bg-[#1a56f0] text-white font-bold py-3.5 rounded-2xl text-sm flex items-center justify-center gap-2">
            <Lock size={16} />
            {orderPlaced ? "View Order" : `Buy — $${ad.price} USDT`}
          </button>
        </div>
      </div>

    </div>
  );
}
