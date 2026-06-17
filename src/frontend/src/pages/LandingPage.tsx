import { Link, useNavigate } from "@tanstack/react-router";
import { Search, Shield, Star, Lock, Users, ArrowRight, CheckCircle, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

interface AdRow {
  id: string;
  title: string;
  description: string | null;
  country: string;
  visa_type: string;
  price: number;
  currency: string;
  processing_time: string | null;
  provider_name: string | null;
  provider_kyc_status: string | null;
}

export function LandingPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [walletBalance, setWalletBalance] = useState(0);
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ads, setAds] = useState<AdRow[]>([]);

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      setLoggedIn(true);
      const { data: profile } = await supabase.from("profiles").select("wallet_balance").eq("id", userData.user.id).single();
      setWalletBalance(Number(profile?.wallet_balance ?? 0));
    }

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
        provider_name: row.profiles?.full_name ?? null,
        provider_kyc_status: row.profiles?.kyc_status ?? null,
      }));
      setAds(mapped);
    }
    setLoading(false);
  }

  const handleSearch = () => {
    void navigate({ to: "/ads", search: { q: search, country: "", type: "" } });
  };

  const hotAds = ads.slice(0, 3);
  const featuredAds = ads.slice(3, 7);

  return (
    <div className="flex flex-col">

      {/* SEARCH BAR */}
      <div className="bg-white px-4 pt-4 pb-3 shadow-sm">
        <div className="flex items-center gap-2 bg-[#F2F3F7] rounded-2xl px-4 py-3">
          <Search size={18} className="text-gray-400 flex-shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search visa, country, service..."
            className="flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
          />
          <button onClick={handleSearch} className="bg-[#1a56f0] text-white text-xs font-bold px-3 py-1.5 rounded-xl">
            Go
          </button>
        </div>
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-none">
          {["All", "Work Visa", "Study Visa", "Tourist", "Sponsorship", "Immigration"].map((t) => (
            <button key={t}
              onClick={() => void navigate({ to: "/ads", search: { q: "", country: "", type: t === "All" ? "" : t } })}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                t === "All" ? "bg-[#1a1a2e] text-white border-[#1a1a2e]" : "bg-white text-gray-600 border-gray-200 hover:border-[#1a56f0] hover:text-[#1a56f0]"
              }`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* WALLET BALANCE */}
      {loggedIn && (
        <div className="mx-4 mt-4">
          <div className="bg-white rounded-2xl px-5 py-4 flex items-center justify-between shadow-sm">
            <div>
              <div className="text-xs text-gray-500 mb-1">Wallet Balance</div>
              <div className="text-2xl font-black text-gray-800">
                ${walletBalance.toFixed(2)} <span className="text-sm font-semibold text-gray-400">USDT</span>
              </div>
            </div>
            <Link to="/wallet">
              <button className="bg-[#1a1a2e] text-white text-sm font-bold px-4 py-2.5 rounded-xl">
                Add Funds
              </button>
            </Link>
          </div>
        </div>
      )}

      {/* TRUST STATS */}
      <div className="mx-4 mt-3">
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
          <div className="grid grid-cols-4 divide-x divide-gray-100">
            {[
              { icon: Shield, value: "KYC", label: "Verified" },
              { icon: Lock, value: "Escrow", label: "Protected" },
              { icon: Users, value: "Crossing", label: "Platform" },
              { icon: Star, value: "New", label: "Marketplace" },
            ].map(({ icon: Icon, value, label }) => (
              <div key={label} className="flex flex-col items-center py-3 gap-0.5">
                <Icon size={16} className="text-[#1a56f0]" />
                <span className="text-xs font-bold text-gray-800">{value}</span>
                <span className="text-[10px] text-gray-400">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div className="mx-4 mt-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="text-sm font-bold text-gray-800 mb-3">How Crossing Works</div>
          <div className="flex flex-col gap-3">
            {[
              { n: "1", t: "Provider posts listing", d: "Price, time, required docs, step-by-step procedure" },
              { n: "2", t: "Seeker deposits to Escrow", d: "Funds locked safely — not sent to provider yet" },
              { n: "3", t: "Visa process begins", d: "Provider guides step by step, submits documents" },
              { n: "4", t: "Visa approved ✓", d: "Crossing releases payment. Case closed." },
            ].map((s) => (
              <div key={s.n} className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-[#1a56f0] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{s.n}</div>
                <div>
                  <div className="text-xs font-semibold text-gray-800">{s.t}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{s.d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-gray-300" size={28} />
        </div>
      ) : ads.length === 0 ? (
        <div className="mx-4 mt-5">
          <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
            <div className="text-2xl mb-2">📋</div>
            <div className="text-sm font-bold text-gray-400">No listings on Crossing yet</div>
            <div className="text-xs text-gray-300 mt-1">Be the first verified provider to post a listing</div>
            <Link to="/post-ad">
              <button className="mt-3 bg-[#1a56f0] text-white text-xs font-bold px-4 py-2.5 rounded-xl">Post a Listing</button>
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* TOP HOT */}
          {hotAds.length > 0 && (
            <div className="mt-5 px-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-base font-black text-gray-800">Top Hot 🔥</div>
                <Link to="/ads" search={{ q: "", country: "", type: "" }}>
                  <span className="text-xs font-semibold text-[#1a56f0] flex items-center gap-1">See all <ArrowRight size={12} /></span>
                </Link>
              </div>
              <div className="flex flex-col gap-3">
                {hotAds.map((ad) => <HomeAdCard key={ad.id} ad={ad} />)}
              </div>
            </div>
          )}

          {/* RECOMMENDED */}
          {featuredAds.length > 0 && (
            <div className="mt-5 px-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-base font-black text-gray-800">Recommended for You</div>
                <Link to="/ads" search={{ q: "", country: "", type: "" }}>
                  <span className="text-xs font-semibold text-[#1a56f0] flex items-center gap-1">See all <ArrowRight size={12} /></span>
                </Link>
              </div>
              <div className="flex flex-col gap-3">
                {featuredAds.map((ad) => <HomeAdCard key={ad.id} ad={ad} />)}
              </div>
            </div>
          )}
        </>
      )}

      {/* POPULAR DESTINATIONS */}
      <div className="mt-5 px-4">
        <div className="text-base font-black text-gray-800 mb-3">Popular Destinations</div>
        <div className="flex flex-wrap gap-2">
          {[
            { flag: "🇸🇦", c: "Saudi Arabia" },
            { flag: "🇦🇪", c: "UAE" },
            { flag: "🇬🇧", c: "United Kingdom" },
            { flag: "🇩🇪", c: "Germany" },
            { flag: "🇨🇦", c: "Canada" },
            { flag: "🇦🇺", c: "Australia" },
          ].map(({ flag, c }) => (
            <Link key={c} to="/ads" search={{ q: "", country: c, type: "" }}>
              <button className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-100 rounded-full text-xs font-medium shadow-sm hover:border-[#1a56f0]/40 transition-all">
                <span>{flag}</span><span className="text-gray-700">{c}</span>
              </button>
            </Link>
          ))}
        </div>
      </div>

      {/* AD BANNER */}
      <div className="mx-4 mt-5 mb-2">
        <div className="bg-gradient-to-r from-[#1a1a2e] to-[#1a56f0] rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-white text-sm font-bold mb-1">Are you a Visa Agent?</div>
            <div className="text-white/70 text-xs">Post your listing — reach thousands</div>
          </div>
          <Link to="/post-ad">
            <button className="bg-white text-[#1a56f0] text-xs font-bold px-3 py-2 rounded-xl">Post Ad</button>
          </Link>
        </div>
      </div>

      {/* SAFETY */}
      <div className="mx-4 mt-3 mb-6">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="text-sm font-bold text-gray-800 mb-3">Why Crossing is Safe</div>
          <div className="flex flex-col gap-2">
            {[
              "Funds held in Escrow — released only after visa confirmed",
              "KYC-verified providers only",
              "Full refund if fraud detected",
              "Step-by-step case tracking for both parties",
            ].map((item) => (
              <div key={item} className="flex items-start gap-2">
                <CheckCircle size={14} className="text-[#1a56f0] flex-shrink-0 mt-0.5" />
                <span className="text-xs text-gray-600">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}

function HomeAdCard({ ad }: { ad: AdRow }) {
  const verified = ad.provider_kyc_status === "approved";
  return (
    <Link to="/ads/$id" params={{ id: ad.id }}>
      <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-50 hover:border-[#1a56f0]/20 transition-all">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <div className="font-bold text-gray-800 text-sm leading-snug">{ad.title}</div>
            <div className="text-xs text-gray-400 mt-0.5">{ad.country}</div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="font-black text-[#1a56f0] text-lg">${ad.price}</div>
            <div className="text-[10px] text-gray-400">{ad.currency}</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {verified && (
            <span className="flex items-center gap-1 bg-green-50 text-green-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-100">
              <Shield size={9} /> Verified
            </span>
          )}
          <span className="bg-blue-50 text-blue-600 text-[10px] font-semibold px-2 py-0.5 rounded-full">{ad.visa_type}</span>
          {ad.processing_time && (
            <span className="bg-gray-50 text-gray-500 text-[10px] font-semibold px-2 py-0.5 rounded-full">⏱ {ad.processing_time}</span>
          )}
        </div>
        <div className="text-xs font-semibold text-gray-600">{ad.provider_name ?? "Provider"}</div>
      </div>
    </Link>
  );
}
