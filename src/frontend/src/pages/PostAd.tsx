import { ArrowLeft, ChevronRight, Plus, X, Shield, Lock, CheckCircle, Loader2, Globe } from "lucide-react";
import { useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

const CROSSING_FEE = 72;

interface UserStatus {
  kycLevel: number;
  deposit: number;
}

interface ServiceRow {
  id: string;
  origin_country: string;
  destination_country: string;
  visa_category: string;
  min_price: number;
  max_price: number;
  capacity: number;
  active_count: number;
}

export function PostAd() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [req, setReq] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [status, setStatus] = useState<UserStatus>({ kycLevel: 0, deposit: 0 });
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [selectedService, setSelectedService] = useState<ServiceRow | null>(null);

  const [form, setForm] = useState({
    title: "", price: "",
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

    const { data: svcRows } = await supabase
      .from("provider_services")
      .select("id, origin_country, destination_country, visa_category, min_price, max_price, capacity, active_count")
      .eq("provider_id", userData.user.id)
      .eq("status", "approved");

    setServices(svcRows ?? []);
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
    if (!userId || !selectedService) return;
    setSubmitting(true);

    const { error } = await supabase.from("ads").insert({
      provider_id: userId,
      provider_service_id: selectedService.id,
      title: form.title,
      description: form.description,
      country: selectedService.destination_country,
      visa_type: selectedService.visa_category,
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
  const providerPrice = Number(form.price) || 0;
  const buyerPrice = providerPrice + CROSSING_FEE;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-gray-300" size={28} />
      </div>
    );
  }

  // ── GATE 1: KYC ──
  if (status.kycLevel < 3) {
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
            <div className="font-black text-gray-800 text-lg">KYC Required</div>
            <div className="text-xs text-gray-500 mt-1">Complete identity verification before posting</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border-2 border-red-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                <Lock size={20} className="text-red-400" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-gray-800 text-sm">Identity Verification (KYC)</div>
                <div className="text-xs font-semibold mt-0.5 text-red-400">⚠ Not completed — Required</div>
              </div>
            </div>
            <Link to="/kyc">
              <button className="w-full bg-[#004B49] text-white font-bold py-3 rounded-xl text-sm">
                Complete KYC →
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── GATE 2: No services set up yet ──
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
            <div className="text-xs text-gray-500 mt-1">Define your visa routes, prices and capacity — your security deposit is calculated automatically</div>
          </div>

          {status.deposit > 0 ? (
            <div className="bg-white rounded-2xl p-4 shadow-sm border-2 border-[#FBF3E1]">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#FBF3E1] flex items-center justify-center flex-shrink-0">
                  <Shield size={20} className="text-[#9c7a1f]" />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-gray-800 text-sm">Services Pending Admin Review</div>
                  <div className="text-xs text-gray-500 mt-0.5">Your services were submitted and are being reviewed. Once approved you can post ads.</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-4 shadow-sm border-2 border-[#D4AF37]/40">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#FBF3E1] flex items-center justify-center flex-shrink-0">
                  <Shield size={20} className="text-[#9c7a1f]" />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-gray-800 text-sm">Service Setup Required</div>
                  <div className="text-xs text-gray-500 mt-0.5">Tell us what visa services you offer so we can calculate your security deposit</div>
                </div>
              </div>
              <Link to="/setup-services">
                <button className="w-full bg-[#004B49] text-white font-bold py-3 rounded-xl text-sm">
                  Setup My Services →
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── GATE 3: Deposit not yet paid ──
  if (status.deposit <= 0) {
    const requiredDeposit = services.reduce((sum, s) => sum + s.max_price * 2 * s.capacity, 0);
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
              <Shield size={26} className="text-[#9c7a1f]" />
            </div>
            <div className="font-black text-gray-800 text-lg">Security Deposit Required</div>
            <div className="text-xs text-gray-500 mt-1">Based on your services, your required deposit is:</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border-2 border-[#D4AF37]/40">
            <div className="text-center mb-4">
              <div className="text-3xl font-black text-[#004B49]">${requiredDeposit.toFixed(2)}</div>
              <div className="text-xs text-gray-400 mt-1">USDT · Security Deposit</div>
            </div>
            {services.map((s) => (
              <div key={s.id} className="flex justify-between text-xs text-gray-500 mb-1.5">
                <span>{s.origin_country} → {s.destination_country} ({s.visa_category}) ×{s.capacity}</span>
                <span className="font-bold text-gray-700">${(s.max_price * 2 * s.capacity).toFixed(0)}</span>
              </div>
            ))}
            <div className="mt-3">
              <Link to="/wallet">
                <button className="w-full bg-[#D4AF37] text-white font-bold py-3 rounded-xl text-sm">
                  Deposit ${requiredDeposit.toFixed(2)} USDT →
                </button>
              </Link>
            </div>
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
          {["Service","Basic","Details","Pricing","Review"].map((l, i) => (
            <span key={l} className={`text-[10px] font-semibold ${i + 1 === step ? "text-[#004B49]" : "text-gray-300"}`}>{l}</span>
          ))}
        </div>
      </div>

      <div className="px-4 mt-4">

        {/* STEP 1 — Select Service Slot */}
        {step === 1 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="text-sm font-bold text-gray-800 mb-1">Select Service Slot</div>
            <div className="text-xs text-gray-500 mb-4">Choose which of your approved services this ad will be listed under</div>
            <div className="flex flex-col gap-3">
              {services.map((s) => {
                const available = s.capacity - s.active_count;
                const isFull = available <= 0;
                const isSelected = selectedService?.id === s.id;
                return (
                  <button key={s.id} type="button" disabled={isFull}
                    onClick={() => setSelectedService(s)}
                    className={`border-2 rounded-2xl p-4 text-left transition-all ${isSelected ? "border-[#004B49] bg-[#E8F0EF]" : isFull ? "border-gray-100 bg-gray-50 opacity-50" : "border-gray-100 bg-white"}`}>
                    <div className="font-bold text-gray-800 text-sm mb-1">
                      {s.origin_country} → {s.destination_country}
                    </div>
                    <div className="text-xs text-gray-500 mb-2">{s.visa_category}</div>
                    <div className="flex flex-wrap gap-2">
                      <span className="bg-[#E8F0EF] text-[#004B49] text-[11px] font-semibold px-2.5 py-1 rounded-full">
                        ${s.min_price}–${s.max_price} per client
                      </span>
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${isFull ? "bg-red-50 text-red-400" : "bg-green-50 text-green-600"}`}>
                        {isFull ? "Full" : `${available} slot${available > 1 ? "s" : ""} available`}
                      </span>
                    </div>
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

        {/* STEP 2 — Basic Info */}
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
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Listing Title *</label>
                <input value={form.title} onChange={(e) => set("title", e.target.value)}
                  placeholder={`e.g. ${selectedService?.visa_category ?? "Visa"} Service — ${selectedService?.destination_country ?? "Destination"}`}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-[#004B49]" />
              </div>
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
                Your approved range for this service: <span className="font-bold text-gray-800">${selectedService.min_price} – ${selectedService.max_price}</span>
              </div>
            )}
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Your Asking Price *</label>
                  <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-3">
                    <span className="text-gray-400 font-bold text-sm">$</span>
                    <input type="number" value={form.price} onChange={(e) => set("price", e.target.value)}
                      placeholder={String(selectedService?.min_price ?? "400")}
                      min={selectedService?.min_price} max={selectedService?.max_price}
                      className="flex-1 bg-transparent text-sm text-gray-800 outline-none font-bold" />
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1">This is exactly what YOU receive.</div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Currency</label>
                  <select value={form.currency} onChange={(e) => set("currency", e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-3 text-sm text-gray-800 outline-none">
                    <option>USDT</option><option>USD</option><option>EUR</option><option>GBP</option><option>AED</option><option>PKR</option>
                  </select>
                </div>
              </div>

              {providerPrice > 0 && (
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">You receive</span>
                    <span className="font-bold text-gray-800">${providerPrice.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-1.5 mt-1 flex justify-between text-xs">
                    <span className="font-bold text-gray-700">Buyer pays</span>
                    <span className="font-black text-[#004B49]">${buyerPrice.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 5 — Review */}
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
                  <div className="font-black text-[#004B49] text-lg">${buyerPrice.toFixed(2)}</div>
                  <div className="text-[10px] text-gray-400">Buyer pays</div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-2.5 mb-3 flex justify-between text-xs">
                <span className="text-gray-500">You receive</span>
                <span className="font-bold text-gray-700">${providerPrice.toFixed(2)}</span>
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
          onClick={() => {
            if (step === 1 && !selectedService) { alert("Please select a service slot first"); return; }
            step < totalSteps ? setStep(step + 1) : void handleSubmit();
          }}
          disabled={submitting}
          className="w-full mt-4 bg-[#004B49] text-white font-bold py-4 rounded-2xl text-sm flex items-center justify-center gap-2 disabled:opacity-60">
          {submitting ? "Submitting..." : step < totalSteps ? <><span>Continue</span><ChevronRight size={16} /></> : <span>Submit Listing 🚀</span>}
        </button>
      </div>
    </div>
  );
}
