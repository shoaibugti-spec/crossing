import { ArrowLeft, ChevronRight, Plus, X, Shield, Lock, CheckCircle, Loader2, Globe, Building2, Eye, EyeOff } from "lucide-react";
import { useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

const PROVIDER_FEE = 6;
const BUYER_FEE = 3;
const SUBMISSION_FEE = 36;

interface UserStatus {
  kycStatus: string;
  businessStatus: string;
  walletBalance: number;
}

interface ServiceRow {
  id: string;
  origin_country: string;
  destination_country: string;
  visa_category: string;
  min_price: number;
  max_price: number;
  active_count: number;
}

export function PostAd() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [req, setReq] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [status, setStatus] = useState<UserStatus>({ kycStatus: "none", businessStatus: "none", walletBalance: 0 });
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [selectedService, setSelectedService] = useState<ServiceRow | null>(null);

  const [form, setForm] = useState({
    title: "", price: "",
    currency: "USDT", processingTime: "", description: "",
    requirements: [] as string[],
    isPublic: true,
  });

  useEffect(() => {
    void loadStatus();
  }, []);

  async function loadStatus() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setLoading(false);
      void navigate({ to: "/login" });
      return;
    }
    setUserId(userData.user.id);

    const { data: profile } = await supabase
      .from("profiles")
      .select("kyc_status, business_status, wallet_balance")
      .eq("id", userData.user.id)
      .single();

    setStatus({
      kycStatus: profile?.kyc_status ?? "none",
      businessStatus: profile?.business_status ?? "none",
      walletBalance: Number(profile?.wallet_balance ?? 0),
    });

    const { data: svcRows } = await supabase
      .from("provider_services")
      .select("id, origin_country, destination_country, visa_category, min_price, max_price, active_count")
      .eq("provider_id", userData.user.id)
      .eq("status", "approved");

    setServices(svcRows ?? []);
    setLoading(false);
  }

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));
  const addReq = () => {
    if (!req.trim()) return;
    setForm((f) => ({ ...f, requirements: [...f.requirements, req.trim()] }));
    setReq("");
  };
  const removeReq = (i: number) =>
    setForm((f) => ({ ...f, requirements: f.requirements.filter((_, idx) => idx !== i) }));

  async function handleSubmit() {
    if (!userId || !selectedService) return;

    if (status.walletBalance < SUBMISSION_FEE) {
      alert(`You need $${SUBMISSION_FEE} USDT in your wallet to publish this ad. Please top up first.`);
      void navigate({ to: "/wallet" });
      return;
    }

    setSubmitting(true);

    const providerPrice = Number(form.price) || 0;

    const { error } = await supabase.from("ads").insert({
      provider_id: userId,
      provider_service_id: selectedService.id,
      title: form.title,
      description: form.description,
      country: selectedService.destination_country,
      visa_type: selectedService.visa_category,
      price: providerPrice,
      currency: form.currency,
      processing_time: form.processingTime,
      requirements: form.requirements,
      provider_fee: PROVIDER_FEE,
      buyer_fee: BUYER_FEE,
      is_public: form.isPublic,
      status: form.isPublic ? "active" : "suspended",
    });

    if (error) {
      alert("Failed to submit listing: " + error.message);
      setSubmitting(false);
      return;
    }

    // Deduct $36 submission fee from wallet
    const newBal = status.walletBalance - SUBMISSION_FEE;
    await supabase.from("profiles").update({ wallet_balance: newBal }).eq("id", userId);
    await supabase.from("wallet_transactions").insert({
      user_id: userId,
      type: "fee",
      amount: -SUBMISSION_FEE,
      status: "completed",
      notes: `Ad submission fee — "${form.title}"`,
    });

    // Mark service fee as paid
    await supabase.from("provider_services").update({ fee_paid: true }).eq("id", selectedService.id);

    await supabase.from("notifications").insert({
      user_id: userId,
      type: "success",
      title: form.isPublic ? "✅ Ad Published!" : "📝 Ad Saved (Private)",
      body: form.isPublic ? `"${form.title}" is now live on the marketplace.` : `"${form.title}" is saved as private. Make it public anytime from My Ads.`,
      link: "/my-ads",
      is_read: false,
    });

    setSubmitting(false);
    void navigate({ to: "/my-ads" });
  }

  const totalSteps = 5;
  const progress = (step / totalSteps) * 100;
  const providerPrice = Number(form.price) || 0;
  const providerReceives = providerPrice;
  const providerSubmitsAt = providerPrice + PROVIDER_FEE;
  const buyerPays = providerPrice + PROVIDER_FEE + BUYER_FEE;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-gray-300" size={28} />
      </div>
    );
  }

  const kycDone = status.kycStatus === "approved";
  const businessDone = status.businessStatus === "approved";

  // ── GATE 1: KYC + Business must both be approved ──
  if (!kycDone || !businessDone) {
    return (
      <div className="flex flex-col pb-8">
        <div className="bg-white px-4 py-3 flex items-center gap-2 border-b border-gray-100">
          <button onClick={() => void navigate({ to: "/" })} className="p-1.5 rounded-full hover:bg-gray-100">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <span className="font-bold text-gray-800 text-sm">Post a Listing</span>
        </div>
        <div className="mx-4 mt-5 flex flex-col gap-3">
          <div className="text-center py-2">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-2">
              <Lock size={26} className="text-red-400" />
            </div>
            <div className="font-black text-gray-800 text-lg">Verification Required</div>
            <div className="text-xs text-gray-500 mt-1">Complete all verification levels before posting ads</div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-50">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${kycDone ? "bg-green-50" : "bg-red-50"}`}>
                {kycDone ? <CheckCircle size={20} className="text-green-500" /> : <Shield size={20} className="text-red-400" />}
              </div>
              <div className="flex-1">
                <div className="font-bold text-gray-800 text-sm">Level 3 — Identity (KYC)</div>
                <div className={`text-xs font-semibold mt-0.5 ${kycDone ? "text-green-500" : "text-red-400"}`}>
                  {kycDone ? "✓ Verified" : status.kycStatus === "pending" ? "⏳ Under review" : "⚠ Not completed"}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${businessDone ? "bg-green-50" : "bg-gray-50"}`}>
                {businessDone ? <CheckCircle size={20} className="text-green-500" /> : <Building2 size={20} className="text-gray-300" />}
              </div>
              <div className="flex-1">
                <div className="font-bold text-gray-800 text-sm">Level 4 — Business</div>
                <div className={`text-xs font-semibold mt-0.5 ${businessDone ? "text-green-500" : status.businessStatus === "pending" ? "text-[#9c7a1f]" : "text-gray-400"}`}>
                  {businessDone ? "✓ Verified" : status.businessStatus === "pending" ? "⏳ Under review" : !kycDone ? "Locked — finish KYC first" : "⚠ Not completed"}
                </div>
              </div>
            </div>
          </div>

          <Link to="/kyc">
            <button className="w-full bg-[#004B49] text-white font-bold py-3.5 rounded-2xl text-sm">
              Complete Verification →
            </button>
          </Link>
        </div>
      </div>
    );
  }

  // ── GATE 2: No approved services yet ──
  if (services.length === 0) {
    return (
      <div className="flex flex-col pb-8">
        <div className="bg-white px-4 py-3 flex items-center gap-2 border-b border-gray-100">
          <button onClick={() => void navigate({ to: "/" })} className="p-1.5 rounded-full hover:bg-gray-100">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <span className="font-bold text-gray-800 text-sm">Post a Listing</span>
        </div>
        <div className="mx-4 mt-5 flex flex-col gap-3">
          <div className="text-center py-2">
            <div className="w-14 h-14 bg-[#FBF3E1] rounded-full flex items-center justify-center mx-auto mb-2">
              <Globe size={26} className="text-[#9c7a1f]" />
            </div>
            <div className="font-black text-gray-800 text-lg">Setup Your Services First</div>
            <div className="text-xs text-gray-500 mt-1">Add your visa routes and prices. Once a service is approved by admin, you can post ads under it.</div>
          </div>
          <Link to="/setup-services">
            <button className="w-full bg-[#004B49] text-white font-bold py-3.5 rounded-2xl text-sm">
              Setup My Services →
            </button>
          </Link>
        </div>
      </div>
    );
  }

  // ── POST AD WIZARD ──
  return (
    <div className="flex flex-col pb-8">
      <div className="bg-white px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <button onClick={() => step > 1 ? setStep(step - 1) : void navigate({ to: "/" })} className="p-1.5 rounded-full hover:bg-gray-100">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <span className="font-bold text-gray-800 text-sm flex-1">Post a Visa Listing</span>
          <span className="text-xs text-gray-400">{step}/{totalSteps}</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-[#004B49] rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex justify-between mt-1.5">
          {["Service","Basic","Details","Pricing","Review"].map((l, i) => (
            <span key={l} className={`text-[10px] font-semibold ${i + 1 === step ? "text-[#004B49]" : "text-gray-300"}`}>{l}</span>
          ))}
        </div>
      </div>

      <div className="px-4 mt-4">

        {/* STEP 1 — Select Service */}
        {step === 1 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="text-sm font-bold text-gray-800 mb-1">Select Service Slot</div>
            <div className="text-xs text-gray-500 mb-4">Choose which approved service this ad will be listed under</div>
            <div className="flex flex-col gap-3">
              {services.map((s) => {
                const isSelected = selectedService?.id === s.id;
                return (
                  <button key={s.id} type="button"
                    onClick={() => setSelectedService(s)}
                    className={`border-2 rounded-2xl p-4 text-left transition-all ${isSelected ? "border-[#004B49] bg-[#E8F0EF]" : "border-gray-100 bg-white"}`}>
                    <div className="font-bold text-gray-800 text-sm mb-1">
                      {s.origin_country} → {s.destination_country}
                    </div>
                    <div className="text-xs text-gray-500 mb-2">{s.visa_category}</div>
                    <span className="bg-[#E8F0EF] text-[#004B49] text-[11px] font-semibold px-2.5 py-1 rounded-full">
                      ${s.min_price}–${s.max_price} per client
                    </span>
                    {isSelected && (
                      <div className="flex items-center gap-1 mt-2">
                        <CheckCircle size={12} className="text-[#004B49]" />
                        <span className="text-[11px] font-bold text-[#004B49]">Selected</span>
                      </div>
                    )}
                  </button>
                );
              })}
              <Link to="/setup-services">
                <button className="w-full border-2 border-dashed border-gray-200 rounded-2xl py-3 text-xs font-semibold text-gray-400 flex items-center justify-center gap-2 hover:border-[#004B49]/40">
                  <Plus size={14} /> Add Another Service
                </button>
              </Link>
            </div>
          </div>
        )}

        {/* STEP 2 — Basic */}
        {step === 2 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="text-sm font-bold text-gray-800 mb-1">Basic Information</div>
            {selectedService && (
              <div className="bg-[#E8F0EF] rounded-xl p-2.5 mb-4 flex items-center gap-2">
                <Globe size={13} className="text-[#004B49] flex-shrink-0" />
                <span className="text-xs text-[#004B49] font-semibold">
                  {selectedService.origin_country} → {selectedService.destination_country} · {selectedService.visa_category}
                </span>
              </div>
            )}
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Listing Title *</label>
              <input value={form.title} onChange={(e) => set("title", e.target.value)}
                placeholder={`e.g. ${selectedService?.visa_category ?? "Visa"} Service — ${selectedService?.destination_country ?? "Destination"}`}
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-[#004B49]" />
            </div>
          </div>
        )}

        {/* STEP 3 — Details */}
        {step === 3 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="text-sm font-bold text-gray-800 mb-4">Service Details</div>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Processing Time *</label>
                <input value={form.processingTime} onChange={(e) => set("processingTime", e.target.value)}
                  placeholder="e.g. 4-6 weeks"
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-[#004B49]" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Description *</label>
                <textarea value={form.description} onChange={(e) => set("description", e.target.value)}
                  placeholder="Describe your service in detail..." rows={5}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-[#004B49] resize-none" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Required Documents</label>
                <div className="flex gap-2 mb-2">
                  <input value={req} onChange={(e) => setReq(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addReq()}
                    placeholder="e.g. Valid Passport"
                    className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#004B49]" />
                  <button onClick={addReq} className="w-10 h-10 bg-[#004B49] rounded-xl flex items-center justify-center flex-shrink-0">
                    <Plus size={18} className="text-white" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {["Valid Passport","Bank Statements","Employment Letter","Photographs","Travel Insurance","Educational Certificates","Police Clearance","Medical Certificate"].map((s) => (
                    <button key={s} onClick={() => setForm((f) => ({ ...f, requirements: [...f.requirements, s] }))}
                      className="text-[10px] bg-[#E8F0EF] border border-[#004B49]/15 text-[#004B49] px-2 py-1 rounded-full font-medium">+ {s}</button>
                  ))}
                </div>
                {form.requirements.map((r, i) => (
                  <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 mb-1.5">
                    <span className="w-4 h-4 rounded-full bg-[#004B49]/10 text-[#004B49] text-[9px] font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                    <span className="flex-1 text-sm text-gray-700">{r}</span>
                    <button onClick={() => removeReq(i)}><X size={13} className="text-gray-400" /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 4 — Pricing */}
        {step === 4 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="text-sm font-bold text-gray-800 mb-4">Pricing</div>
            {selectedService && (
              <div className="bg-gray-50 rounded-xl p-3 mb-3 text-xs text-gray-500">
                Your approved range: <span className="font-bold text-gray-800">${selectedService.min_price} – ${selectedService.max_price}</span>
              </div>
            )}
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Your Price (what you receive) *</label>
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-3">
                  <span className="text-gray-400 font-bold text-sm">$</span>
                  <input type="number" value={form.price} onChange={(e) => set("price", e.target.value)}
                    placeholder={String(selectedService?.min_price ?? "100")}
                    className="flex-1 bg-transparent text-sm text-gray-800 outline-none font-bold" />
                </div>
              </div>

              {providerPrice > 0 && (
                <div className="bg-[#E8F0EF] border border-[#004B49]/15 rounded-xl p-3.5">
                  <div className="text-[10px] font-black text-[#004B49] uppercase tracking-wider mb-2">Fee Breakdown</div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-gray-600">You receive</span>
                    <span className="font-bold text-gray-800">${providerReceives.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-gray-600">You submit at (+$6 provider fee)</span>
                    <span className="font-bold text-[#9c7a1f]">${providerSubmitsAt.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-[#004B49]/10 pt-1.5 mt-1 flex justify-between text-xs">
                    <span className="font-bold text-gray-700">Buyer pays (+$3 buyer fee)</span>
                    <span className="font-black text-[#004B49]">${buyerPays.toFixed(2)}</span>
                  </div>
                  <div className="text-[10px] text-gray-500 mt-2">Tip: buyers compare prices — lower yours to stay competitive.</div>
                </div>
              )}

              <div className="bg-[#FBF3E1] border border-[#D4AF37]/30 rounded-xl p-3 flex gap-2">
                <span className="text-[#9c7a1f] flex-shrink-0">💳</span>
                <div className="text-[11px] text-[#9c7a1f]">
                  A one-time <span className="font-bold">${SUBMISSION_FEE} USDT</span> submission fee is charged from your wallet when you publish. Refunded if you delete the ad. Your balance: <span className="font-bold">${status.walletBalance.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5 — Review + Public/Private */}
        {step === 5 && (
          <div className="flex flex-col gap-3">
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="text-sm font-bold text-gray-800 mb-3">Review Your Listing</div>
              {selectedService && (
                <div className="bg-[#E8F0EF] rounded-xl p-2.5 mb-3 flex items-center gap-2">
                  <Globe size={13} className="text-[#004B49] flex-shrink-0" />
                  <span className="text-xs text-[#004B49] font-semibold">
                    {selectedService.origin_country} → {selectedService.destination_country} · {selectedService.visa_category}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-bold text-gray-800">{form.title || "Untitled"}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{form.processingTime && `⏱ ${form.processingTime}`}</div>
                </div>
                <div className="text-right">
                  <div className="font-black text-[#004B49] text-lg">${buyerPays.toFixed(2)}</div>
                  <div className="text-[10px] text-gray-400">Buyer pays</div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-2.5 mb-3 flex justify-between text-xs">
                <span className="text-gray-500">You receive</span>
                <span className="font-bold text-gray-700">${providerReceives.toFixed(2)}</span>
              </div>
              {form.requirements.length > 0 && (
                <div>
                  <div className="text-xs font-bold text-gray-600 mb-1.5">📄 Required Docs ({form.requirements.length})</div>
                  {form.requirements.map((r, i) => (
                    <div key={i} className="text-xs text-gray-500 flex items-center gap-1.5 mb-1">
                      <span className="w-1 h-1 rounded-full bg-[#004B49] flex-shrink-0" />{r}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Public / Private toggle */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="text-sm font-bold text-gray-800 mb-3">Visibility</div>
              <div className="flex flex-col gap-2">
                <button onClick={() => set("isPublic", true)}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${form.isPublic ? "border-[#004B49] bg-[#E8F0EF]" : "border-gray-100 bg-gray-50"}`}>
                  <Eye size={20} className={form.isPublic ? "text-[#004B49]" : "text-gray-400"} />
                  <div className="flex-1 text-left">
                    <div className="text-sm font-bold text-gray-800">Public</div>
                    <div className="text-[11px] text-gray-500">Visible to all buyers on the marketplace</div>
                  </div>
                  {form.isPublic && <CheckCircle size={18} className="text-[#004B49]" />}
                </button>
                <button onClick={() => set("isPublic", false)}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${!form.isPublic ? "border-[#004B49] bg-[#E8F0EF]" : "border-gray-100 bg-gray-50"}`}>
                  <EyeOff size={20} className={!form.isPublic ? "text-[#004B49]" : "text-gray-400"} />
                  <div className="flex-1 text-left">
                    <div className="text-sm font-bold text-gray-800">Private</div>
                    <div className="text-[11px] text-gray-500">Hidden — no new buyers can find or order it</div>
                  </div>
                  {!form.isPublic && <CheckCircle size={18} className="text-[#004B49]" />}
                </button>
              </div>
            </div>

            <div className="bg-[#FBF3E1] border border-[#D4AF37]/30 rounded-2xl p-4">
              <div className="text-sm font-bold text-[#9c7a1f] mb-1">💳 ${SUBMISSION_FEE} USDT will be charged</div>
              <div className="text-xs text-[#9c7a1f]">Deducted from your wallet on publish. Fully refunded if you delete this ad later.</div>
            </div>
          </div>
        )}

        <button
          onClick={() => {
            if (step === 1 && !selectedService) { alert("Please select a service slot first"); return; }
            if (step === 2 && !form.title.trim()) { alert("Please enter a listing title"); return; }
            if (step === 3 && !form.description.trim()) { alert("Please enter a description"); return; }
            if (step === 4 && (!form.price || providerPrice <= 0)) { alert("Please enter your price"); return; }
            step < totalSteps ? setStep(step + 1) : void handleSubmit();
          }}
          disabled={submitting}
          className="w-full mt-4 bg-[#004B49] text-white font-bold py-4 rounded-2xl text-sm flex items-center justify-center gap-2 disabled:opacity-60">
          {submitting ? "Publishing..." : step < totalSteps ? <><span>Continue</span><ChevronRight size={16} /></> : <span>Publish Ad — ${SUBMISSION_FEE} 🚀</span>}
        </button>
      </div>
    </div>
  );
}
