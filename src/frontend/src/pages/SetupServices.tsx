import { ArrowLeft, Plus, Trash2, Shield, CheckCircle, Loader2, Globe } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

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
}

interface DraftService {
  origin_country: string;
  destination_country: string;
  visa_category: string;
  min_price: string;
  max_price: string;
  capacity: string;
}

const emptyDraft: DraftService = {
  origin_country: "Pakistan",
  destination_country: "",
  visa_category: "",
  min_price: "",
  max_price: "",
  capacity: "1",
};

function tierFor(totalDeposit: number): { name: string; color: string } {
  if (totalDeposit >= 20000) return { name: "Diamond", color: "text-cyan-600 bg-cyan-50 border-cyan-200" };
  if (totalDeposit >= 10000) return { name: "Platinum", color: "text-slate-600 bg-slate-50 border-slate-200" };
  if (totalDeposit >= 5000) return { name: "Gold", color: "text-[#9c7a1f] bg-[#FBF3E1] border-[#D4AF37]/40" };
  if (totalDeposit >= 2000) return { name: "Silver", color: "text-gray-600 bg-gray-100 border-gray-300" };
  return { name: "Bronze", color: "text-orange-700 bg-orange-50 border-orange-200" };
}

export function SetupServices() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [existingDeposit, setExistingDeposit] = useState(0);
  const [draft, setDraft] = useState<DraftService>(emptyDraft);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

    const { data: profile } = await supabase
      .from("profiles")
      .select("security_deposit")
      .eq("id", userData.user.id)
      .single();
    setExistingDeposit(Number(profile?.security_deposit ?? 0));

    const { data: rows } = await supabase
      .from("provider_services")
      .select("id, origin_country, destination_country, visa_category, min_price, max_price, capacity, active_count, status")
      .eq("provider_id", userData.user.id)
      .order("created_at", { ascending: true });
    setServices(rows ?? []);

    setLoading(false);
  }

  function serviceDeposit(s: { max_price: number; capacity: number }) {
    return s.max_price * 2 * s.capacity;
  }

  const draftServicesTotal = services.reduce((sum, s) => sum + serviceDeposit(s), 0);
  const draftMaxPrice = Number(draft.max_price) || 0;
  const draftCapacity = Number(draft.capacity) || 0;
  const draftPreviewDeposit = draftMaxPrice * 2 * draftCapacity;
  const grandTotal = draftServicesTotal;
  const tier = tierFor(grandTotal);

  function validateDraft(): boolean {
    if (!draft.destination_country) { setError("Select a destination country"); return false; }
    if (!draft.visa_category) { setError("Select a visa category"); return false; }
    if (!draft.min_price || !draft.max_price) { setError("Enter both minimum and maximum price"); return false; }
    if (Number(draft.min_price) <= 0 || Number(draft.max_price) <= 0) { setError("Prices must be greater than zero"); return false; }
    if (Number(draft.min_price) > Number(draft.max_price)) { setError("Minimum price cannot be greater than maximum price"); return false; }
    if (!draft.capacity || Number(draft.capacity) < 1) { setError("Capacity must be at least 1"); return false; }
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
        capacity: Number(draft.capacity),
        status: "pending",
      })
      .select("id, origin_country, destination_country, visa_category, min_price, max_price, capacity, active_count, status")
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
    if (!confirm("Remove this service? You'll lose this slot and its deposit contribution.")) return;
    const { error: delErr } = await supabase.from("provider_services").delete().eq("id", id);
    if (delErr) {
      alert("Failed to remove: " + delErr.message);
      return;
    }
    setServices((prev) => prev.filter((s) => s.id !== id));
  }

  async function confirmAndProceed() {
    if (!userId) return;
    if (services.length === 0) {
      setError("Add at least one service before continuing");
      return;
    }
    setSubmitting(true);

    await supabase.from("profiles").update({ security_deposit: existingDeposit }).eq("id", userId);

    setSubmitting(false);
    void navigate({ to: "/wallet" });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-gray-300" size={28} />
      </div>
    );
  }

  return (
    <div className="flex flex-col pb-32">

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
            Add each visa service you provide — destination, category, your price range, and how many clients you can handle at once. Your security deposit is calculated automatically from what you select. No fixed amount — it's entirely based on your own business.
          </div>
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
              <div className="flex flex-wrap gap-2 mb-2">
                <span className="bg-[#E8F0EF] text-[#004B49] text-[11px] font-semibold px-2.5 py-1 rounded-full">
                  ${s.min_price}–${s.max_price} per client
                </span>
                <span className="bg-[#FBF3E1] text-[#9c7a1f] text-[11px] font-semibold px-2.5 py-1 rounded-full">
                  {s.capacity} simultaneous client{s.capacity > 1 ? "s" : ""}
                </span>
              </div>
              <div className="bg-gray-50 rounded-xl p-2.5 flex justify-between text-xs">
                <span className="text-gray-500">Deposit for this service</span>
                <span className="font-bold text-gray-800">${serviceDeposit(s).toFixed(2)}</span>
              </div>
              {s.status === "pending" && (
                <div className="text-[10px] text-[#9c7a1f] font-semibold mt-2">⏳ Pending admin review</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ADD SERVICE FORM */}
      <div className="mx-4 mt-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="text-sm font-bold text-gray-800 mb-4">Add a Service</div>

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

            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">
                Simultaneous Clients (how many at once for this service) *
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" onClick={() => setDraft((d) => ({ ...d, capacity: String(n) }))}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${draft.capacity === String(n) ? "bg-[#004B49] text-white border-[#004B49]" : "bg-gray-50 text-gray-600 border-gray-100"}`}>
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {draftMaxPrice > 0 && draftCapacity > 0 && (
              <div className="bg-[#E8F0EF] border border-[#004B49]/15 rounded-xl p-3">
                <div className="text-xs font-black text-[#004B49] mb-1.5">Deposit for this service</div>
                <div className="text-[11px] text-[#004B49] flex flex-col gap-0.5">
                  <div>Max price (${draftMaxPrice}) × 2 clients-worth × {draftCapacity} capacity</div>
                  <div className="font-black text-sm mt-1">= ${draftPreviewDeposit.toFixed(2)}</div>
                </div>
              </div>
            )}

            <button onClick={() => void addService()} disabled={adding}
              className="w-full bg-[#004B49]/10 text-[#004B49] font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-60">
              {adding ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              Add This Service
            </button>
          </div>
        </div>
      </div>

      {/* TOTAL SUMMARY — fixed bottom */}
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 z-30">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Total Security Deposit Required</div>
              <div className="text-xl font-black text-[#004B49]">${grandTotal.toFixed(2)} USDT</div>
            </div>
            <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${tier.color}`}>
              {tier.name} Tier
            </span>
          </div>
          <button onClick={() => void confirmAndProceed()} disabled={submitting || services.length === 0}
            className="w-full bg-[#004B49] text-white font-bold py-3.5 rounded-2xl text-sm disabled:opacity-40 flex items-center justify-center gap-2">
            {submitting ? "Saving..." : <><Shield size={16} /> Continue to Deposit ${grandTotal.toFixed(2)}</>}
          </button>
        </div>
      </div>

    </div>
  );
}
