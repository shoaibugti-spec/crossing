import { Search, SlidersHorizontal, Star, Clock, Shield, X, Loader2 } from "lucide-react";
import { useSearch, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { COUNTRIES } from "../lib/mockData";

const VISA_TYPES = ["Work Visa", "Study Visa", "Tourist Visa", "Business Visa", "Sponsorship", "PR / Immigration"];
const SORT_OPTIONS = ["Newest", "Price: Low to High", "Price: High to Low"];

interface AdRow {
  id: string;
  title: string;
  description: string | null;
  country: string;
  visa_type: string;
  price: number;
  currency: string;
  processing_time: string | null;
  created_at: string;
  provider_id: string;
  provider_name: string | null;
  provider_kyc_status: string | null;
}

export function BrowseAds() {
  const search = useSearch({ from: "/ads" });

  const [q, setQ] = useState(search.q ?? "");
  const [country, setCountry] = useState(search.country ?? "");
  const [visaType, setVisaType] = useState(search.type ?? "");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("Newest");
  const [maxPrice, setMaxPrice] = useState(2000);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ads, setAds] = useState<AdRow[]>([]);

  useEffect(() => {
    void loadAds();
  }, []);

  async function loadAds() {
    setLoading(true);
    const { data, error } = await supabase
      .from("ads")
      .select("id, title, description, country, visa_type, price, currency, processing_time, created_at, provider_id, profiles:provider_id(full_name, kyc_status)")
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (!error && data) {
      const mapped: AdRow[] = data.map((row: any) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        country: row.country,
        visa_type: row.visa_type,
        price: Number(row.price),
        currency: row.currency,
        processing_time: row.processing_time,
        created_at: row.created_at,
        provider_id: row.provider_id,
        provider_name: row.profiles?.full_name ?? null,
        provider_kyc_status: row.profiles?.kyc_status ?? null,
      }));
      setAds(mapped);
    }
    setLoading(false);
  }

  let filtered = ads.filter((ad) => {
    const matchQ = !q || ad.title.toLowerCase().includes(q.toLowerCase()) || ad.country.toLowerCase().includes(q.toLowerCase());
    const matchCountry = !country || ad.country.toLowerCase().includes(country.toLowerCase());
    const matchType = !visaType || ad.visa_type === visaType;
    const matchVerified = !verifiedOnly || ad.provider_kyc_status === "approved";
    const matchPrice = ad.price <= maxPrice;
    return matchQ && matchCountry && matchType && matchVerified && matchPrice;
  });

  if (sortBy === "Price: Low to High") filtered = [...filtered].sort((a, b) => a.price - b.price);
  if (sortBy === "Price: High to Low") filtered = [...filtered].sort((a, b) => b.price - a.price);

  const clearFilters = () => {
    setQ(""); setCountry(""); setVisaType(""); setVerifiedOnly(false); setMaxPrice(2000);
  };

  const hasFilters = q || country || visaType || verifiedOnly;

  return (
    <div className="flex flex-col pb-8">

      {/* SEARCH */}
      <div className="bg-white px-4 pt-4 pb-3 border-b border-gray-100">
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 bg-[#F2F3F7] rounded-2xl px-4 py-3">
            <Search size={16} className="text-gray-400 flex-shrink-0" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search visa services..."
              className="flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
            />
            {q && (
              <button onClick={() => setQ("")}>
                <X size={14} className="text-gray-400" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 border transition-all ${
              showFilters || hasFilters ? "bg-[#1a56f0] border-[#1a56f0] text-white" : "bg-white border-gray-100 text-gray-500"
            }`}
          >
            <SlidersHorizontal size={18} />
          </button>
        </div>

        <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-none">
          <button onClick={() => setVisaType("")}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              !visaType ? "bg-[#1a1a2e] text-white border-[#1a1a2e]" : "bg-white text-gray-600 border-gray-200"
            }`}>
            All
          </button>
          {VISA_TYPES.map((t) => (
            <button key={t} onClick={() => setVisaType(visaType === t ? "" : t)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                visaType === t ? "bg-[#1a56f0] text-white border-[#1a56f0]" : "bg-white text-gray-600 border-gray-200"
              }`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* FILTER PANEL */}
      {showFilters && (
        <div className="bg-white border-b border-gray-100 px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-gray-800">Filters</span>
            <button onClick={clearFilters} className="text-xs text-[#1a56f0] font-semibold">Clear all</button>
          </div>

          <div className="mb-3">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Country</label>
            <select value={country} onChange={(e) => setCountry(e.target.value)}
              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 text-sm text-gray-800 outline-none">
              <option value="">All Countries</option>
              {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>

          <div className="mb-3">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Max Price: ${maxPrice} USDT</label>
            <input type="range" min={50} max={2000} step={50} value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))} className="w-full accent-[#1a56f0]" />
            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
              <span>$50</span><span>$2000</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700 font-medium">Verified providers only</span>
            <button onClick={() => setVerifiedOnly(!verifiedOnly)}
              className={`w-11 h-6 rounded-full transition-all ${verifiedOnly ? "bg-[#1a56f0]" : "bg-gray-200"}`}>
              <div className={`w-5 h-5 bg-white rounded-full shadow transition-all mx-0.5 ${verifiedOnly ? "translate-x-5" : "translate-x-0"}`} />
            </button>
          </div>
        </div>
      )}

      {/* RESULTS HEADER */}
      <div className="px-4 py-3 flex items-center justify-between">
        <span className="text-sm text-gray-500">
          <span className="font-bold text-gray-800">{filtered.length}</span> listings found
        </span>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
          className="text-xs font-semibold text-[#1a56f0] bg-transparent outline-none cursor-pointer">
          {SORT_OPTIONS.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* ADS LIST */}
      <div className="px-4 flex flex-col gap-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-gray-300" size={28} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <Search size={36} className="text-gray-200 mx-auto mb-3" />
            <div className="text-sm font-bold text-gray-400">
              {ads.length === 0 ? "No listings on Crossing yet" : "No listings found"}
            </div>
            <div className="text-xs text-gray-300 mt-1">
              {ads.length === 0 ? "Be the first verified provider to post a listing" : "Try different filters"}
            </div>
            {ads.length > 0 && (
              <button onClick={clearFilters} className="mt-3 text-xs text-[#1a56f0] font-semibold">Clear filters</button>
            )}
          </div>
        ) : (
          filtered.map((ad) => {
            const verified = ad.provider_kyc_status === "approved";
            return (
              <Link key={ad.id} to="/ads/$id" params={{ id: ad.id }}>
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

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {verified && (
                      <span className="flex items-center gap-1 bg-green-50 text-green-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-100">
                        <Shield size={9} /> Verified
                      </span>
                    )}
                    <span className="bg-blue-50 text-blue-600 text-[10px] font-semibold px-2 py-0.5 rounded-full">{ad.visa_type}</span>
                    {ad.processing_time && (
                      <span className="flex items-center gap-1 bg-gray-50 text-gray-500 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                        <Clock size={9} /> {ad.processing_time}
                      </span>
                    )}
                  </div>

                  {ad.description && (
                    <p className="text-xs text-gray-500 mb-3 line-clamp-2 leading-relaxed">{ad.description}</p>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#1a56f0] to-purple-500 flex items-center justify-center text-white text-[10px] font-black">
                        {ad.provider_name?.[0]?.toUpperCase() ?? "P"}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-gray-700">{ad.provider_name ?? "Provider"}</div>
                        <div className="flex items-center gap-1">
                          <Star size={9} className="text-amber-400 fill-amber-400" />
                          <span className="text-[10px] text-gray-400">No ratings yet</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-[#1a56f0] text-white text-xs font-bold px-3 py-1.5 rounded-xl">View →</div>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>

    </div>
  );
}
