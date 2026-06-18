import { ArrowLeft, ChevronRight, Plus, X, Shield, Lock, CheckCircle, Loader2 } from "lucide-react";
import { useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

const VISA_TYPES = [
  "Work Visa","Study Visa","Tourist Visa","Business Visa","Family Visa",
  "Sponsorship","PR / Immigration","Transit Visa","Medical Visa",
  "Religious Visa","Diplomatic Visa","Seasonal Work","Working Holiday",
];

const COUNTRY_LIST = ["Saudi Arabia","UAE","United Kingdom","Germany","Canada","Australia","USA","Turkey","Malaysia","Pakistan","Romania","Poland","Portugal","Spain","France","Italy","Netherlands","Sweden","Norway","Denmark","Finland","Ireland","Switzerland","Austria","Belgium","Czech Republic","Hungary","Bulgaria","Croatia","Greece","Cyprus","Malta","Slovakia","Slovenia","Estonia","Latvia","Lithuania","Iceland","Luxembourg","Serbia","Albania","Bosnia","Kosovo","Montenegro","North Macedonia","Moldova","Ukraine","Russia","Georgia","Armenia","Azerbaijan","Kazakhstan","Uzbekistan","China","Japan","South Korea","Vietnam","Thailand","Indonesia","Philippines","Bangladesh","Nepal","Sri Lanka","Singapore","Taiwan","Mongolia","India","Egypt","Morocco","Tunisia","Algeria","Libya","Sudan","Ethiopia","Kenya","Nigeria","Ghana","South Africa","Tanzania","Uganda","Rwanda","Senegal","Cameroon","Mozambique","Zambia","Zimbabwe","Angola","Somalia","Mauritius","Seychelles","Brazil","Argentina","Colombia","Chile","Peru","Venezuela","Ecuador","Bolivia","Mexico","Panama","Costa Rica","Guatemala","Honduras","El Salvador","Nicaragua","Cuba","Dominican Republic","Jamaica","Trinidad and Tobago","Bahamas","Barbados","New Zealand","Fiji","Papua New Guinea"];

interface UserStatus {
  kycLevel: number;
  deposit: number;
}

export function PostAd() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [req, setReq] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [status, setStatus] = useState<UserStatus>({ kycLevel: 0, deposit: 0 });

  const [form, setForm] = useState({
    title: "", country: "", visaType: "", price: "",
    currency: "USDT", processingTime: "", description: "",
    requirements: [] as string[],
    steps: ["", "", "", "", ""],
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
      .select("kyc_level, security_deposit")
      .eq("id", userData.user.id)
      .single();

    setStatus({
      kycLevel: profile?.kyc_level ?? 0,
      deposit: Number(profile?.security_deposit ?? 0),
    });
    setLoading(false);
  }

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const addReq = () => {
    if (!req.trim()) return;
    setForm((f) => ({ ...f, requirements: [...f.requirements, req.trim()] }));
    setReq("");
  };
  const removeReq = (i: number) =>
    setForm((f) => ({ ...f, requirements: f.requirements.filter((_, idx) => idx !== i) }));
  const setStepText = (i: number, val: string) => {
    const steps = [...form.steps];
    steps[i] = val;
    setForm((f) => ({ ...f, steps }));
  };

  async function handleSubmit() {
    if (!userId) return;
    setSubmitting(true);

    const { error } = await supabase.from("ads").insert({
      provider_id: userId,
      title: form.title,
      description: form.description,
      country: form.country,
      visa_type: form.visaType,
      price: Number(form.price) || 0,
      currency: form.currency,
      processing_time: form.processingTime,
      requirements: form.requirements,
      steps: form.steps.filter((s) => s.trim() !== ""),
      status: "pending_review",
    });

    setSubmitting(false);

    if (error) {
      alert("Failed to submit listing: " + error.message);
      return;
    }

    void navigate({ to: "/my-ads" });
  }

  const totalSteps = 5;
  const progress = (step / totalSteps) * 100;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-gray-300" size={28} />
      </div>
    );
  }

  // ── GATE: KYC + DEPOSIT ──
  if (status.kycLevel < 3 || status.deposit < 2000) {
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
            <div className="font-black text-gray-800 text-lg">Two Requirements Needed</div>
            <div className="text-xs text-gray-500 mt-1">Complete both to start posting listings</div>
          </div>

          {/* KYC CARD */}
          <div className={`bg-white rounded-2xl p-4 shadow-sm border-2 ${status.kycLevel >= 3 ? "border-green-200" : "border-red-100"}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${status.kycLevel >= 3 ? "bg-green-50" : "bg-red-50"}`}>
                {status.kycLevel >= 3
                  ? <CheckCircle size={20} className="text-green-500" />
                  : <Lock size={20} className="text-red-400" />}
              </div>
              <div className="flex-1">
                <div className="font-bold text-gray-800 text-sm">Identity Verification (KYC)</div>
                <div className={`text-xs font-semibold mt-0.5 ${status.kycLevel >= 3 ? "text-green-500" : "text-red-400"}`}>
                  {status.kycLevel >= 3 ? "✓ Completed" : "⚠ Not completed — Required"}
                </div>
              </div>
              {status.kycLevel >= 3 && (
                <span className="text-[10px] font-bold text-green-500 bg-green-50 px-2 py-0.5 rounded-full">Done ✓</span>
              )}
            </div>
            {status.kycLevel < 3 && (
              <Link to="/kyc">
                <button className="w-full bg-[#004B49] text-white font-bold py-3 rounded-xl text-sm">
                  Complete KYC →
                </button>
              </Link>
            )}
          </div>

          {/* DEPOSIT CARD */}
          <div className={`bg-white rounded-2xl p-4 shadow-sm border-2 ${status.deposit >= 2000 ? "border-green-200" : "border-[#D4AF37]/40"}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${status.deposit >= 2000 ? "bg-green-50" : "bg-[#FBF3E1]"}`}>
                {status.deposit >= 2000
                  ? <CheckCircle size={20} className="text-green-500" />
                  : <Shield size={20} className="text-[#9c7a1f]" />}
              </div>
              <div className="flex-1">
                <div className="font-bold text-gray-800 text-sm">Security Deposit</div>
                <div className={`text-xs font-semibold mt-0.5 ${status.deposit >= 2000 ? "text-green-500" : "text-[#9c7a1f]"}`}>
                  {status.deposit >= 2000 ? "✓ $2,000 USDT Deposited" : `⚠ $${status.deposit} / $2,000 USDT deposited`}
                </div>
              </div>
            </div>

            {status.deposit < 2000 && (
              <>
                <div className="bg-gray-50 rounded-xl p-3 mb-3">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs text-gray-500">Required Deposit</span>
                    <span className="font-black text-gray-800">$2,000 USDT</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Remaining</span>
                    <span className="font-bold text-[#9c7a1f]">${2000 - status.deposit} USDT</span>
                  </div>
                  <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#D4AF37] rounded-full transition-all" style={{ width: `${(status.deposit / 2000) * 100}%` }} />
                  </div>
                </div>
                <Link to="/wallet">
                  <button className="w-full bg-[#D4AF37] text-white font-bold py-3 rounded-xl text-sm">
                    Deposit $2,000 USDT →
                  </button>
                </Link>
              </>
            )}
          </div>

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
          {["Basic","Details","Pricing","Process","Review"].map((l, i) => (
            <span key={l} className={`text-[10px] font-semibold ${i + 1 === step ? "text-[#004B49]" : "text-gray-300"}`}>{l}</span>
          ))}
        </div>
      </div>

      <div className="px-4 mt-4">
        {step === 1 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="text-sm font-bold text-gray-800 mb-4">Basic Information</div>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Listing Title *</label>
                <input value={form.title} onChange={(e) => set("title", e.target.value)}
                  placeholder="e.g. Canada Work Permit for Engineers"
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-[#004B49]" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Destination Country *</label>
                <select value={form.country} onChange={(e) => set("country", e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-[#004B49]">
                  <option value="">Select country...</option>
                  {COUNTRY_LIST.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Visa Type *</label>
                <div className="flex flex-wrap gap-2">
                  {VISA_TYPES.map((v) => (
                    <button key={v} onClick={() => set("visaType", v)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${form.visaType === v ? "bg-[#004B49] text-white border-[#004B49]" : "bg-gray-50 text-gray-600 border-gray-100"}`}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
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

        {step === 3 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="text-sm font-bold text-gray-800 mb-4">Pricing</div>
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Service Fee *</label>
                  <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-3">
                    <span className="text-gray-400 font-bold text-sm">$</span>
                    <input type="number" value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="499"
                      className="flex-1 bg-transparent text-sm text-gray-800 outline-none font-bold" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Currency</label>
                  <select value={form.currency} onChange={(e) => set("currency", e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-3 text-sm text-gray-800 outline-none">
                    <option>USDT</option><option>USD</option><option>EUR</option><option>GBP</option><option>AED</option><option>PKR</option>
                  </select>
                </div>
              </div>
              <div className="bg-[#E8F0EF] border border-[#004B49]/15 rounded-xl p-3">
                <div className="text-xs font-black text-[#004B49] mb-1">Crossing Fee Structure</div>
                <div className="text-[11px] text-[#004B49] flex flex-col gap-0.5">
                  <div>• Buyer pays: Your fee + $36 Crossing fee</div>
                  <div>• You receive: Your fee − $36 Crossing fee</div>
                  <div>• Payment released only after visa confirmed</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="text-sm font-bold text-gray-800 mb-1">Step-by-Step Process</div>
            <div className="text-xs text-gray-500 mb-4">Explain what will happen at each stage for the buyer</div>
            <div className="flex flex-col gap-3">
              {form.steps.map((s, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div className="w-7 h-7 rounded-full bg-[#004B49] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-2.5">{i + 1}</div>
                  <input value={s} onChange={(e) => setStepText(i, e.target.value)}
                    placeholder={["Documents collection from buyer","Document verification & preparation","Embassy application submission","Interview scheduling (if required)","Visa delivery & case closure"][i]}
                    className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-[#004B49]" />
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="flex flex-col gap-3">
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="text-sm font-bold text-gray-800 mb-3">Review Your Listing</div>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-bold text-gray-800">{form.title || "Untitled"}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{form.country} · {form.visaType}</div>
                </div>
                <div className="text-right">
                  <div className="font-black text-[#004B49] text-lg">${form.price}</div>
                  <div className="text-[10px] text-gray-400">{form.currency}</div>
                </div>
              </div>
              <div className="flex gap-2 mb-3">
                <span className="bg-[#E8F0EF] text-[#004B49] text-xs px-2.5 py-1 rounded-full font-semibold">⏱ {form.processingTime || "TBD"}</span>
              </div>
              {form.requirements.length > 0 && (
                <div className="mb-2">
                  <div className="text-xs font-bold text-gray-600 mb-1.5">📄 Required Docs ({form.requirements.length})</div>
                  {form.requirements.map((r, i) => (
                    <div key={i} className="text-xs text-gray-500 flex items-center gap-1.5 mb-1">
                      <span className="w-1 h-1 rounded-full bg-[#004B49] flex-shrink-0" />{r}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
              <div className="text-sm font-bold text-green-700 mb-1">✓ Ready to Publish</div>
              <div className="text-xs text-green-600">Listing reviewed by admin within 24 hours before going live.</div>
            </div>
          </div>
        )}

        <button
          onClick={() => step < totalSteps ? setStep(step + 1) : void handleSubmit()}
          disabled={submitting}
          className="w-full mt-4 bg-[#004B49] text-white font-bold py-4 rounded-2xl text-sm flex items-center justify-center gap-2 disabled:opacity-60">
          {submitting ? "Submitting..." : step < totalSteps ? <><span>Continue</span><ChevronRight size={16} /></> : <span>Submit Listing 🚀</span>}
        </button>
      </div>
    </div>
  );
}
