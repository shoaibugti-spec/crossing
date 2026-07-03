import { ArrowLeft, Plus, Trash2, Shield, Loader2, Globe, Info } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

const SUBMISSION_FEE = 36;
const MAX_FREE_SERVICES = 3;

const COUNTRY_LIST = ["Saudi Arabia","UAE","United Kingdom","Germany","Canada","Australia","USA","Turkey","Malaysia","Pakistan","Romania","Poland","Portugal","Spain","France","Italy","Netherlands","Sweden","Norway","Denmark","Finland","Ireland","Switzerland","Austria","Belgium","Czech Republic","Hungary","Bulgaria","Croatia","Greece","Cyprus","Malta","Slovakia","Slovenia","Estonia","Latvia","Lithuania","Iceland","Luxembourg","Serbia","Albania","Bosnia","Kosovo","Montenegro","North Macedonia","Moldova","Ukraine","Russia","Georgia","Armenia","Azerbaijan","Kazakhstan","Uzbekistan","China","Japan","South Korea","Vietnam","Thailand","Indonesia","Philippines","Bangladesh","Nepal","Sri Lanka","Singapore","Taiwan","Mongolia","India","Egypt","Morocco","Tunisia","Algeria","Libya","Sudan","Ethiopia","Kenya","Nigeria","Ghana","South Africa","Tanzania","Uganda","Rwanda","Senegal","Cameroon","Mozambique","Zambia","Zimbabwe","Angola","Somalia","Mauritius","Seychelles","Brazil","Argentina","Colombia","Chile","Peru","Venezuela","Ecuador","Bolivia","Mexico","Panama","Costa Rica","Guatemala","Honduras","El Salvador","Nicaragua","Cuba","Dominican Republic","Jamaica","Trinidad and Tobago","Bahamas","Barbados","New Zealand","Fiji","Papua New Guinea"];

const VISA_CATEGORIES = [
  "Umrah", "Hajj", "Visit / Tourist", "Work Visa", "Study Visa",
  "Business Settlement", "Health / Medical Settlement", "Family / Sponsorship",
  "PR / Immigration", "Transit Visa", "Seasonal Work", "Working Holiday",
];

interface ServiceRow {
  id: string;
  origin_country: string;
  destination_country: string;
  visa_category: string;
  min_price: number;
  max_price: number;
  capacity: number;
  active_count: number;
  status: string;
  fee_paid: boolean;
}

interface DraftService {
  origin_country: string;
  destination_country: string;
  visa_category: string;
  min_price: string;
  max_price: string;
}

const emptyDraft: DraftService = {
  origin_country: "Pakistan",
  destination_country: "",
  visa_category: "",
  min_price: "",
  max_price: "",
};

export function SetupServices() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [draft, setDraft] = useState<DraftService>(emptyDraft);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void loadServices();
  }, []);

  async function loadServices() {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setLoading(false);
      void navigate({ to: "/login" });
      return;
    }
    setUserId(userData.user.id);

    const { data: rows } = await supabase
      .from("provider_services")
      .select("id, origin_country, destination_country, visa_category, min_price, max_price, capacity, active_count, status, fee_paid")
      .eq("provider_id", userData.user.id)
      .order("created_at", { ascending: true });
    setServices(rows ?? []);

    setLoading(false);
  }

  const servicesLeft = MAX_FREE_SERVICES - services.length;
  const canAddMore = servicesLeft > 0;

  function validateDraft(): boolean {
    if (!canAddMore) { setError(`Free plan allows max ${MAX_FREE_SERVICES} services. Upgrade to Premium for more.`); return false; }
    if (!draft.destination_country) { setError("Select a destination country"); return false; }
    if (!draft.visa_category) { setError("Select a visa category"); return false; }
    if (!draft.min_price || !draft.max_price) { setError("Enter both minimum and maximum price"); return false; }
    if (Number(draft.min_price) <= 0 || Number(draft.max_price) <= 0) { setError("Prices must be greater than zero"); return false; }
    if (Number(draft.min_price) > Number(draft.max_price)) { setError("Minimum price cannot be greater than maximum price"); return false; }
    setError("");
    return true;
  }

  async function addService() {
    if (!userId || !validateDraft()) return;
    setAdding(true);

    const { data, error: insertErr } = await supabase
      .from("provider_services")
      .insert({
        provider_id: userId,
        origin_country: draft.origin_country,
        destination_country: draft.destination_country,
        visa_category: draft.visa_category,
        min_price: Number(draft.min_price),
        max_price: Number(draft.max_price),
        capacity: 1,
        status: "pending",
        fee_paid: false,
      })
      .select("id, origin_country, destination_country, visa_category, min_price, max_price, capacity, active_count, status, fee_paid")
      .single();

    setAdding(false);

    if (insertErr || !data) {
      setError("Failed to add service: " + (insertErr?.message ?? "unknown error"));
      return;
    }

    setServices((prev) => [...prev, data]);
    setDraft(emptyDraft);
  }

  async function removeService(id: string) {
    if (!confirm("Remove this service? If you already paid the $36 submission fee, it will be refunded to your wallet.")) return;

    const svc = services.find((s) => s.id === id);
    const { error: delErr } = await supabase.from("provider_services").delete().eq("id", id);
    if (delErr) {
      alert("Failed to remove: " + delErr.message);
      return;
    }

    // Refund submission fee if it was paid
    if (svc?.fee_paid && userId) {
      const { data: prof } = await supabase.from("profiles").select("wallet_balance").eq("id", userId).single();
      const newBal = Number(prof?.wallet_balance ?? 0) + SUBMISSION_FEE;
      await supabase.from("profiles").update({ wallet_balance: newBal }).eq("id", userId);
      await supabase.from("wallet_transactions").insert({
        user_id: userId,
        type: "refund",
        amount: SUBMISSION_FEE,
        status: "completed",
        notes: `Service submission fee refunded — ${svc.destination_country} (${svc.visa_category})`,
      });
    }

    setServices((prev) => prev.filter((s) => s.id !== id));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-gray-300" size={28} />
      </div>
    );
  }

  return (
    <div className="flex flex-col pb-8">

      {/* HEADER */}
      <div className="bg-white px-4 py-3 flex items-center gap-2 border-b border-gray-100">
        <button onClick={() => void navigate({ to: "/" })} className="p-1.5 rounded-full hover:bg-gray-100">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <span className="font-bold text-gray-800 text-sm">Setup Your Services</span>
      </div>

      {/* INTRO */}
      <div className="mx-4 mt-4">
        <div className="bg-gradient-to-br from-[#00302e] to-[#004B49] rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Globe size={18} className="text-[#D4AF37]" />
            <span className="text-white font-bold text-sm">Define What You Offer</span>
          </div>
          <div className="text-white/80 text-xs leading-relaxed">
            Add up to <span className="font-bold text-[#D4AF37]">{MAX_FREE_SERVICES} visa services</span> on the free plan. Each service handles 1 client at a time. When you post an ad under a service, a one-time <span className="font-bold text-[#D4AF37]">${SUBMISSION_FEE}</span> submission fee applies (refunded if you delete it).
          </div>
        </div>
      </div>

      {/* FREE PLAN STATUS */}
      <div className="mx-4 mt-3">
        <div className="bg-white rounded-2xl p-3.5 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#E8F0EF] flex items-center justify-center flex-shrink-0">
            <Shield size={18} className="text-[#004B49]" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold text-gray-800">Free Plan</div>
            <div className="text-[11px] text-gray-400">{services.length} of {MAX_FREE_SERVICES} services used · 1 client each</div>
          </div>
          <span className="text-[10px] font-black bg-[#FBF3E1] text-[#9c7a1f] px-2.5 py-1 rounded-full border border-[#D4AF37]/30">FREE</span>
        </div>
      </div>

      {/* EXISTING SERVICES LIST */}
      {services.length > 0 && (
        <div className="mx-4 mt-4 flex flex-col gap-2">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">Your Services ({services.length})</div>
          {services.map((s) => (
            <div key={s.id} className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1">
                  <div className="font-bold text-gray-800 text-sm">{s.origin_country} → {s.destination_country}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{s.visa_category}</div>
                </div>
                <button onClick={() => void removeService(s.id)} className="w-8 h-8 bg-red-50 border border-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Trash2 size={14} className="text-red-400" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="bg-[#E8F0EF] text-[#004B49] text-[11px] font-semibold px-2.5 py-1 rounded-full">
                  ${s.min_price}–${s.max_price} per client
                </span>
                <span className="bg-[#FBF3E1] text-[#9c7a1f] text-[11px] font-semibold px-2.5 py-1 rounded-full">
                  1 client at a time
                </span>
                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                  s.status === "approved" ? "bg-green-50 text-green-600"
                  : s.status === "rejected" ? "bg-red-50 text-red-500"
                  : "bg-gray-100 text-gray-500"
                }`}>
                  {s.status === "approved" ? "✓ Approved" : s.status === "rejected" ? "Rejected" : "⏳ Pending review"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADD SERVICE FORM */}
      {canAddMore ? (
        <div className="mx-4 mt-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="text-sm font-bold text-gray-800 mb-1">Add a Service</div>
            <div className="text-[11px] text-gray-400 mb-4">{servicesLeft} service{servicesLeft !== 1 ? "s" : ""} remaining on free plan</div>

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-xs font-semibold text-red-500 mb-4">
                ⚠️ {error}
              </div>
            )}

            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">From (Origin)</label>
                  <select value={draft.origin_country} onChange={(e) => setDraft((d) => ({ ...d, origin_country: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-3 text-sm text-gray-800 outline-none focus:border-[#004B49]">
                    {COUNTRY_LIST.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">To (Destination) *</label>
                  <select value={draft.destination_country} onChange={(e) => setDraft((d) => ({ ...d, destination_country: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-3 text-sm text-gray-800 outline-none focus:border-[#004B49]">
                    <option value="">Select...</option>
                    {COUNTRY_LIST.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Visa Category *</label>
                <div className="flex flex-wrap gap-2">
                  {VISA_CATEGORIES.map((c) => (
                    <button key={c} type="button" onClick={() => setDraft((d) => ({ ...d, visa_category: c }))}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${draft.visa_category === c ? "bg-[#004B49] text-white border-[#004B49]" : "bg-gray-50 text-gray-600 border-gray-100"}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Min Price per Client *</label>
                  <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-3">
                    <span className="text-gray-400 font-bold text-sm">$</span>
                    <input type="number" value={draft.min_price} onChange={(e) => setDraft((d) => ({ ...d, min_price: e.target.value }))} placeholder="300"
                      className="flex-1 bg-transparent text-sm text-gray-800 outline-none font-bold" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Max Price per Client *</label>
                  <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-3">
                    <span className="text-gray-400 font-bold text-sm">$</span>
                    <input type="number" value={draft.max_price} onChange={(e) => setDraft((d) => ({ ...d, max_price: e.target.value }))} placeholder="500"
                      className="flex-1 bg-transparent text-sm text-gray-800 outline-none font-bold" />
                  </div>
                </div>
              </div>

              <div className="bg-[#E8F0EF] border border-[#004B49]/15 rounded-xl p-3 flex gap-2">
                <Info size={14} className="text-[#004B49] flex-shrink-0 mt-0.5" />
                <div className="text-[11px] text-[#004B49]">
                  No charge to add a service. The <span className="font-bold">${SUBMISSION_FEE}</span> submission fee is only charged when you publish an ad under this service — and refunded if you delete the ad.
                </div>
              </div>

              <button onClick={() => void addService()} disabled={adding}
                className="w-full bg-[#004B49]/10 text-[#004B49] font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-60">
                {adding ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                Add This Service
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="mx-4 mt-4">
          <div className="bg-gradient-to-br from-[#FBF3E1] to-white rounded-2xl p-4 border border-[#D4AF37]/30 text-center">
            <div className="text-2xl mb-2">⭐</div>
            <div className="font-black text-gray-800 text-sm mb-1">Free Plan Limit Reached</div>
            <div className="text-xs text-gray-500 mb-3">You've used all {MAX_FREE_SERVICES} free services. Upgrade to Premium for more services and multiple clients per service.</div>
            <button onClick={() => alert("Premium plans coming soon!")}
              className="bg-[#D4AF37] text-white font-bold px-5 py-2.5 rounded-xl text-sm">
              Upgrade to Premium
            </button>
          </div>
        </div>
      )}

      {/* CONTINUE */}
      {services.length > 0 && (
        <div className="mx-4 mt-4">
          <button onClick={() => void navigate({ to: "/my-ads" })}
            className="w-full bg-[#004B49] text-white font-bold py-3.5 rounded-2xl text-sm flex items-center justify-center gap-2">
            <Shield size={16} /> Done — Go to My Ads
          </button>
        </div>
      )}

    </div>
  );
}
