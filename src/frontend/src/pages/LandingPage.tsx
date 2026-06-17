import { Link, useNavigate } from "@tanstack/react-router";
import { Search, Shield, Lock, ArrowRight, CheckCircle, Loader2, Plane, Briefcase, Globe2, FileText, ShieldCheck } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { COUNTRIES } from "../lib/mockData";

interface AdRow {
  id: string;
  title: string;
  description: string | null;
  country: string;
  visa_type: string;
  price: number;
  currency: string;
  processing_time: string | null;
  provider_id: string;
  provider_name: string | null;
  provider_kyc_status: string | null;
}

interface ProviderSummary {
  id: string;
  name: string;
  category: string;
}

const VISA_TYPES = ["Work Visa", "Study Visa", "Tourist Visa", "Sponsorship", "PR / Immigration"];

const CATEGORY_TILES = [
  { emoji: "💼", label: "Work Visa" },
  { emoji: "🎓", label: "Study Visa" },
  { emoji: "🧳", label: "Tourist" },
  { emoji: "🤝", label: "Sponsorship" },
  { emoji: "🏛️", label: "Immigration" },
];

export function LandingPage() {
  const navigate = useNavigate();
  const [destCountry, setDestCountry] = useState("");
  const [visaType, setVisaType] = useState("");
  const [walletBalance, setWalletBalance] = useState(0);
  const [checked, setChecked] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ads, setAds] = useState<AdRow[]>([]);
  const [verifiedProviders, setVerifiedProviders] = useState<ProviderSummary[]>([]);

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      setLoggedIn(true);
      const { data: profile } = await supabase.from("profiles").select("wallet_balance").eq("id", userData.user.id).single();
      setWalletBalance(Number(profile?.wallet_balance ?? 0));
    }
    setChecked(true);

    setLoading(true);
    const { data } = await supabase
      .from("ads")
      .select("id, title, description, country, visa_type, price, currency, processing_time, provider_id, profiles:provider_id(full_name, kyc_status)")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(8);

    if (data) {
      const mapped: AdRow[] = data.map((row: any) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        country: row.country,
        visa_type: row.visa_type,
        price: Number(row.price),
        currency: row.currency,
        processing_time: row.processing_time,
        provider_id: row.provider_id,
        provider_name: row.profiles?.full_name ?? null,
        provider_kyc_status: row.profiles?.kyc_status ?? null,
      }));
      setAds(mapped);

      // Build a unique list of verified providers from the active ads
      const seen = new Set<string>();
      const providers: ProviderSummary[] = [];
      for (const ad of mapped) {
        if (ad.provider_kyc_status === "approved" && !seen.has(ad.provider_id)) {
          seen.add(ad.provider_id);
          providers.push({ id: ad.provider_id, name: ad.provider_name ?? "Provider", category: ad.country });
        }
      }
      setVerifiedProviders(providers.slice(0, 8));
    }
    setLoading(false);
  }

  const handleSearch = () => {
    void navigate({ to: "/ads", search: { q: "", country: destCountry, type: visaType } });
  };

  const hotAds = ads.slice(0, 3);
  const featuredAds = ads.slice(3, 7);

  if (!checked) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-gray-300" size={28} />
      </div>
    );
  }

  // ── SHARED: the floating search card used on both logged-out and logged-in views ──
  const SearchCard = (
    <div className="bg-white rounded-3xl shadow-xl shadow-[#004B49]/20 overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-50">
        <div className="w-8 h-8 rounded-lg bg-[#E8F0EF] text-[#004B49] flex items-center justify-center flex-shrink-0">
          <Globe2 size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">Destination Country</label>
          <select value={destCountry} onChange={(e) => setDestCountry(e.target.value)}
            className="w-full bg-transparent text-sm font-bold text-gray-800 outline-none">
            <option value="">Where are you headed?</option>
            {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div className="flex items-center gap-3 px-4 py-3.5">
        <div className="w-8 h-8 rounded-lg bg-[#E8F0EF] text-[#004B49] flex items-center justify-center flex-shrink-0">
          <FileText size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">Visa Type</label>
          <select value={visaType} onChange={(e) => setVisaType(e.target.value)}
            className="w-full bg-transparent text-sm font-bold text-gray-800 outline-none">
            <option value="">Work, Study, Tourist...</option>
            {VISA_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>
    </div>
  );

  // ── LOGGED-OUT VISITOR ──
  if (!loggedIn) {
    return (
      <div className="flex flex-col min-h-screen bg-[#F4F6F6]">

        <div className="bg-gradient-to-br from-[#00302e] via-[#004B49] to-[#00615e] px-6 pt-10 pb-16 relative overflow-hidden">
          <div className="absolute -top-14 -right-14 w-52 h-52 rounded-full bg-[#D4AF37]/15 blur-2xl" />
          <div className="absolute -bottom-20 -left-16 w-60 h-60 rounded-full bg-white/5 blur-2xl" />

          <div className="flex items-center gap-2.5 relative z-10">
            <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 80 80" fill="none">
                <line x1="18" y1="18" x2="62" y2="62" stroke="white" strokeWidth="11" strokeLinecap="round" />
                <line x1="62" y1="18" x2="18" y2="62" stroke="white" strokeWidth="11" strokeLinecap="round" />
              </svg>
            </div>
            <span className="text-white font-black text-sm tracking-widest">CROSSING</span>
            <span className="ml-auto flex items-center gap-1.5 bg-white/10 border border-white/15 rounded-full px-2.5 py-1 text-[10px] font-bold text-white/85">
              <Lock size={10} /> Escrow Protected
            </span>
          </div>

          <h1 className="text-white font-black text-2xl leading-snug mt-6 relative z-10">
            Your visa journey,<br /><span className="text-[#D4AF37]">verified end-to-end.</span>
          </h1>
          <p className="text-white/65 text-xs mt-2 max-w-[270px] relative z-10">
            Find a KYC-verified provider, pay safely into Escrow, and only release funds when your visa is in hand.
          </p>
        </div>

        {/* FLOATING SEARCH CARD */}
        <div className="px-5 -mt-10 relative z-10">
          {SearchCard}
          <button onClick={handleSearch}
            className="w-full mt-3 bg-gradient-to-r from-[#004B49] to-[#00342f] text-white font-bold py-4 rounded-2xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#004B49]/30">
            <Search size={16} /> Find Verified Providers
          </button>
        </div>

        {/* TWO PATHS */}
        <div className="px-5 mt-5 flex gap-3">
          <Link to="/signup" search={{ role: "seeker" }} className="flex-1">
            <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-gray-100 h-full">
              <div className="w-9 h-9 rounded-xl bg-[#E8F0EF] flex items-center justify-center mb-2">
                <Plane size={17} className="text-[#004B49]" />
              </div>
              <div className="font-black text-gray-800 text-xs">I Need a Visa</div>
              <div className="text-[10px] text-gray-400 mt-0.5 leading-snug">Browse providers with Escrow protection</div>
            </div>
          </Link>
          <Link to="/signup" search={{ role: "provider" }} className="flex-1">
            <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-gray-100 h-full">
              <div className="w-9 h-9 rounded-xl bg-[#FBF3E1] flex items-center justify-center mb-2">
                <Briefcase size={17} className="text-[#9c7a1f]" />
              </div>
              <div className="font-black text-gray-800 text-xs">I'm a Provider</div>
              <div className="text-[10px] text-gray-400 mt-0.5 leading-snug">List your service, reach seekers</div>
            </div>
          </Link>
        </div>

        {/* VERIFIED PROVIDERS STRIP */}
        {verifiedProviders.length > 0 && (
          <div className="mt-7 px-5">
            <span className="text-[10px] font-bold text-[#004B49] uppercase tracking-wider block mb-0.5">Handpicked</span>
            <h2 className="font-black text-gray-800 text-base mb-3">Top Verified Providers</h2>
            <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
              {verifiedProviders.map((p) => (
                <Link key={p.id} to="/profile/$id" params={{ id: p.id }}>
                  <div className="flex-shrink-0 w-[104px] bg-white rounded-2xl border border-gray-100 shadow-sm p-3 text-center">
                    <div className="relative w-10 h-10 mx-auto mb-2">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#004B49] to-[#00746f] text-white font-black text-sm flex items-center justify-center">
                        {p.name[0]?.toUpperCase()}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#D4AF37] border-2 border-white flex items-center justify-center">
                        <CheckCircle size={8} className="text-white" />
                      </div>
                    </div>
                    <div className="text-[11px] font-black text-gray-800 truncate">{p.name}</div>
                    <div className="text-[9px] text-gray-400 mt-0.5 truncate">{p.category}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* VISA CATEGORY GRID */}
        <div className="mt-7 px-5">
          <span className="text-[10px] font-bold text-[#004B49] uppercase tracking-wider block mb-0.5">Browse by</span>
          <h2 className="font-black text-gray-800 text-base mb-3">Visa Category</h2>
          <div className="grid grid-cols-3 gap-2.5">
            {CATEGORY_TILES.map((c) => (
              <button key={c.label} onClick={() => void navigate({ to: "/ads", search: { q: "", country: "", type: c.label } })}
                className="bg-white rounded-2xl py-4 px-2 text-center border border-gray-100 shadow-sm">
                <div className="text-xl">{c.emoji}</div>
                <div className="text-[10px] font-bold text-gray-700 mt-1.5">{c.label}</div>
              </button>
            ))}
            <button onClick={() => void navigate({ to: "/ads", search: { q: "", country: "", type: "" } })}
              className="bg-white rounded-2xl py-4 px-2 text-center border border-gray-100 shadow-sm">
              <div className="text-xl text-gray-300">+</div>
              <div className="text-[10px] font-bold text-gray-700 mt-1.5">More</div>
            </button>
          </div>
        </div>

        {/* LIVE LISTINGS */}
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-gray-300" size={28} />
          </div>
        ) : ads.length > 0 && (
          <div className="mt-7 px-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-[10px] font-bold text-[#004B49] uppercase tracking-wider block mb-0.5">Fresh on Crossing</span>
                <h2 className="font-black text-gray-800 text-base">Live Listings</h2>
              </div>
              <Link to="/ads" search={{ q: "", country: "", type: "" }}>
                <span className="text-xs font-bold text-[#004B49] flex items-center gap-1">See all <ArrowRight size={12} /></span>
              </Link>
            </div>
            <div className="flex flex-col gap-3">
              {ads.slice(0, 4).map((ad) => <HomeAdCard key={ad.id} ad={ad} />)}
            </div>
          </div>
        )}

        {/* TRUST BAR */}
        <div className="mx-5 mt-7">
          <div className="bg-[#11201f] rounded-2xl p-4 grid grid-cols-3 divide-x divide-white/10">
            {[
              { icon: ShieldCheck, v: "KYC", l: "Verified Only" },
              { icon: Lock, v: "Escrow", l: "Funds Locked" },
              { icon: Shield, v: "100%", l: "Refund on Fraud" },
            ].map(({ icon: Icon, v, l }) => (
              <div key={l} className="text-center px-1">
                <Icon size={15} className="text-[#D4AF37] mx-auto mb-1" />
                <div className="text-white font-black text-xs">{v}</div>
                <div className="text-white/40 text-[9px] mt-0.5">{l}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center text-sm text-gray-500 py-7">
          Already have an account?{" "}
          <Link to="/login"><span className="font-bold text-[#004B49]">Login</span></Link>
        </div>
      </div>
    );
  }

  // ── LOGGED-IN USER ──
  return (
    <div className="flex flex-col bg-[#F4F6F6]">

      <div className="bg-gradient-to-br from-[#00302e] via-[#004B49] to-[#00615e] px-4 pt-5 pb-14 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-[#D4AF37]/15 blur-2xl" />
        <div className="text-white/70 text-xs">Wallet Balance</div>
        <div className="text-white font-black text-2xl mt-0.5">
          ${walletBalance.toFixed(2)} <span className="text-sm font-semibold text-white/50">USDT</span>
        </div>
      </div>

      <div className="px-4 -mt-10 relative z-10">
        {SearchCard}
        <button onClick={handleSearch}
          className="w-full mt-3 bg-gradient-to-r from-[#004B49] to-[#00342f] text-white font-bold py-3.5 rounded-2xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#004B49]/30">
          <Search size={16} /> Find Verified Providers
        </button>
      </div>

      <div className="flex gap-2 mt-4 px-4 overflow-x-auto pb-1 scrollbar-none">
        {["All", ...VISA_TYPES].map((t) => (
          <button key={t}
            onClick={() => void navigate({ to: "/ads", search: { q: "", country: "", type: t === "All" ? "" : t } })}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border bg-white text-gray-600 border-gray-200">
            {t}
          </button>
        ))}
      </div>

      {verifiedProviders.length > 0 && (
        <div className="mt-6 px-4">
          <span className="text-[10px] font-bold text-[#004B49] uppercase tracking-wider block mb-0.5">Handpicked</span>
          <h2 className="font-black text-gray-800 text-base mb-3">Top Verified Providers</h2>
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
            {verifiedProviders.map((p) => (
              <Link key={p.id} to="/profile/$id" params={{ id: p.id }}>
                <div className="flex-shrink-0 w-[104px] bg-white rounded-2xl border border-gray-100 shadow-sm p-3 text-center">
                  <div className="relative w-10 h-10 mx-auto mb-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#004B49] to-[#00746f] text-white font-black text-sm flex items-center justify-center">
                      {p.name[0]?.toUpperCase()}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#D4AF37] border-2 border-white flex items-center justify-center">
                      <CheckCircle size={8} className="text-white" />
                    </div>
                  </div>
                  <div className="text-[11px] font-black text-gray-800 truncate">{p.name}</div>
                  <div className="text-[9px] text-gray-400 mt-0.5 truncate">{p.category}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 px-4">
        <span className="text-[10px] font-bold text-[#004B49] uppercase tracking-wider block mb-0.5">Browse by</span>
        <h2 className="font-black text-gray-800 text-base mb-3">Visa Category</h2>
        <div className="grid grid-cols-3 gap-2.5">
          {CATEGORY_TILES.map((c) => (
            <button key={c.label} onClick={() => void navigate({ to: "/ads", search: { q: "", country: "", type: c.label } })}
              className="bg-white rounded-2xl py-4 px-2 text-center border border-gray-100 shadow-sm">
              <div className="text-xl">{c.emoji}</div>
              <div className="text-[10px] font-bold text-gray-700 mt-1.5">{c.label}</div>
            </button>
          ))}
          <button onClick={() => void navigate({ to: "/ads", search: { q: "", country: "", type: "" } })}
            className="bg-white rounded-2xl py-4 px-2 text-center border border-gray-100 shadow-sm">
            <div className="text-xl text-gray-300">+</div>
            <div className="text-[10px] font-bold text-gray-700 mt-1.5">More</div>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-gray-300" size={28} />
        </div>
      ) : ads.length === 0 ? (
        <div className="mx-4 mt-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
            <div className="text-2xl mb-2">📋</div>
            <div className="text-sm font-bold text-gray-400">No listings on Crossing yet</div>
            <div className="text-xs text-gray-300 mt-1">Be the first verified provider to post a listing</div>
          </div>
        </div>
      ) : (
        <>
          {hotAds.length > 0 && (
            <div className="mt-6 px-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-black text-gray-800 text-base">Top Hot 🔥</h2>
                <Link to="/ads" search={{ q: "", country: "", type: "" }}>
                  <span className="text-xs font-bold text-[#004B49] flex items-center gap-1">See all <ArrowRight size={12} /></span>
                </Link>
              </div>
              <div className="flex flex-col gap-3">
                {hotAds.map((ad) => <HomeAdCard key={ad.id} ad={ad} />)}
              </div>
            </div>
          )}

          {featuredAds.length > 0 && (
            <div className="mt-6 px-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-black text-gray-800 text-base">Recommended for You</h2>
                <Link to="/ads" search={{ q: "", country: "", type: "" }}>
                  <span className="text-xs font-bold text-[#004B49] flex items-center gap-1">See all <ArrowRight size={12} /></span>
                </Link>
              </div>
              <div className="flex flex-col gap-3">
                {featuredAds.map((ad) => <HomeAdCard key={ad.id} ad={ad} />)}
              </div>
            </div>
          )}
        </>
      )}

      <div className="mx-4 mt-6">
        <div className="bg-[#11201f] rounded-2xl p-4 grid grid-cols-3 divide-x divide-white/10">
          {[
            { icon: ShieldCheck, v: "KYC", l: "Verified Only" },
            { icon: Lock, v: "Escrow", l: "Funds Locked" },
            { icon: Shield, v: "100%", l: "Refund on Fraud" },
          ].map(({ icon: Icon, v, l }) => (
            <div key={l} className="text-center px-1">
              <Icon size={15} className="text-[#D4AF37] mx-auto mb-1" />
              <div className="text-white font-black text-xs">{v}</div>
              <div className="text-white/40 text-[9px] mt-0.5">{l}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="h-6" />
    </div>
  );
}

function HomeAdCard({ ad }: { ad: AdRow }) {
  const verified = ad.provider_kyc_status === "approved";
  return (
    <Link to="/ads/$id" params={{ id: ad.id }}>
      <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <div className="font-bold text-gray-800 text-sm leading-snug">{ad.title}</div>
            <div className="text-xs text-gray-400 mt-0.5">{ad.country} · {ad.provider_name ?? "Provider"}</div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="font-black text-[#004B49] text-lg">${ad.price}</div>
            <div className="text-[10px] text-gray-400">{ad.currency}</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {verified && (
            <span className="flex items-center gap-1 bg-[#FBF3E1] text-[#9c7a1f] text-[10px] font-bold px-2 py-0.5 rounded-full">
              <Shield size={9} /> Verified
            </span>
          )}
          <span className="bg-[#E8F0EF] text-[#004B49] text-[10px] font-semibold px-2 py-0.5 rounded-full">{ad.visa_type}</span>
          {ad.processing_time && (
            <span className="bg-gray-50 text-gray-500 text-[10px] font-semibold px-2 py-0.5 rounded-full">⏱ {ad.processing_time}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
