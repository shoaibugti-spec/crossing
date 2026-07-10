import { ArrowLeft, Shield, CheckCircle, Loader2, Star, TrendingUp, Award, Calendar, Globe, Lock } from "lucide-react";
import { useNavigate, useParams, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

const PROVIDER_FEE = 6;
const BUYER_FEE = 3;

export function ProfilePage() {
  const navigate = useNavigate();
  const params = useParams({ strict: false }) as { id?: string };
  const providerId = params.id;

  const [loading, setLoading] = useState(true);
  const [provider, setProvider] = useState<any | null>(null);
  const [ads, setAds] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [tab, setTab] = useState<"listings" | "reviews">("listings");

  useEffect(() => { void loadProfile(); }, [providerId]);

  async function loadProfile() {
    setLoading(true);
    if (!providerId) { setLoading(false); return; }

    let targetId = providerId;
    if (providerId === "me") {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) { setLoading(false); void navigate({ to: "/login" }); return; }
      targetId = userData.user.id;
    }

    const { data: prof } = await supabase
      .from("profiles")
      .select("id, display_name, full_name, profile_bio, country, role, kyc_status, business_status, total_visas_delivered, total_valuation, positive_feedback_count, negative_feedback_count, created_at")
      .eq("id", targetId)
      .single();
    setProvider(prof);

    const { data: adData } = await supabase
      .from("ads")
      .select("id, title, country, visa_type, price, currency, processing_time, status, is_public, provider_fee, buyer_fee")
      .eq("provider_id", targetId)
      .eq("status", "active")
      .eq("is_public", true)
      .order("created_at", { ascending: false });
    setAds(adData ?? []);

    const { data: revs } = await supabase
      .from("reviews")
      .select("id, rating, tags, comment, created_at")
      .eq("provider_id", targetId)
      .order("created_at", { ascending: false })
      .limit(20);
    setReviews(revs ?? []);

    setLoading(false);
  }

  if (loading) {
    return <div className="flex items-center justify-center py-24"><Loader2 className="animate-spin text-gray-300" size={28} /></div>;
  }

  if (!provider) {
    return (
      <div className="flex flex-col pb-8">
        <div className="bg-white px-4 py-3 flex items-center gap-2 border-b border-gray-100">
          <button onClick={() => void navigate({ to: "/" })} className="p-1.5 rounded-full hover:bg-gray-100">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <span className="font-bold text-gray-800 text-sm">Profile</span>
        </div>
        <div className="text-center py-16 text-gray-400 text-sm">Profile not found.</div>
      </div>
    );
  }

  // ── BUYER / SEEKER PROFILE ──
  if (provider.role !== "provider") {
    const joinDt = provider.created_at ? new Date(provider.created_at) : null;
    return (
      <div className="flex flex-col pb-8">
        <div className="bg-white px-4 py-3 flex items-center gap-2 border-b border-gray-100">
          <button onClick={() => void navigate({ to: "/" })} className="p-1.5 rounded-full hover:bg-gray-100">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <span className="font-bold text-gray-800 text-sm">My Profile</span>
        </div>

        <div className="mx-4 mt-4 bg-gradient-to-br from-[#00302e] to-[#004B49] rounded-3xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center text-white font-black text-2xl border border-white/20">
              {(provider.full_name ?? "U")[0]?.toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="font-black text-white text-lg">{provider.full_name ?? "User"}</div>
              <div className="text-white/60 text-xs flex items-center gap-1 mt-0.5">
                <Globe size={11} /> {provider.country ?? "—"} · Visa Buyer
              </div>
              {provider.kyc_status === "approved" && (
                <div className="flex items-center gap-1 mt-1">
                  <CheckCircle size={11} className="text-[#D4AF37]" />
                  <span className="text-white/80 text-xs font-bold">KYC Verified</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mx-4 mt-3 bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#E8F0EF] flex items-center justify-center flex-shrink-0">
            <Calendar size={18} className="text-[#004B49]" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold text-gray-800">Member since</div>
            <div className="text-[11px] text-gray-400">{joinDt ? joinDt.toLocaleDateString() : "—"}</div>
          </div>
        </div>

        <div className="mx-4 mt-3 flex flex-col gap-2">
          <Link to="/orders">
            <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between">
              <span className="text-sm font-bold text-gray-800">📦 My Orders</span>
              <span className="text-gray-300">›</span>
            </div>
          </Link>
          <Link to="/wallet">
            <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between">
              <span className="text-sm font-bold text-gray-800">💳 My Wallet</span>
              <span className="text-gray-300">›</span>
            </div>
          </Link>
          <Link to="/kyc">
            <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between">
              <span className="text-sm font-bold text-gray-800">🛡️ KYC Verification</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${provider.kyc_status === "approved" ? "bg-green-50 text-green-600" : "bg-[#FBF3E1] text-[#9c7a1f]"}`}>
                {provider.kyc_status === "approved" ? "✓ Verified" : "Pending"}
              </span>
            </div>
          </Link>
          <Link to="/settings">
            <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between">
              <span className="text-sm font-bold text-gray-800">⚙️ Settings</span>
              <span className="text-gray-300">›</span>
            </div>
          </Link>
        </div>
      </div>
    );
  }

  // ── PROVIDER PUBLIC PROFILE ──
  const displayName = provider.display_name ?? "Verified Provider";
  const totalFeedback = (provider.positive_feedback_count ?? 0) + (provider.negative_feedback_count ?? 0);
  const positiveRate = totalFeedback > 0 ? Math.round(((provider.positive_feedback_count ?? 0) / totalFeedback) * 100) : 0;
  const joinDate = provider.created_at ? new Date(provider.created_at) : null;
  const daysSinceJoin = joinDate ? Math.floor((Date.now() - joinDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
  const verified = provider.kyc_status === "approved";

  const tagCounts: Record<string, number> = {};
  reviews.forEach((r) => (r.tags ?? []).forEach((t: string) => { tagCounts[t] = (tagCounts[t] ?? 0) + 1; }));
  const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);

  return (
    <div className="flex flex-col pb-8">
      <div className="bg-white px-4 py-3 flex items-center gap-2 border-b border-gray-100">
        <button onClick={() => void navigate({ to: "/" })} className="p-1.5 rounded-full hover:bg-gray-100">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <span className="font-bold text-gray-800 text-sm">Provider Profile</span>
      </div>

      <div className="mx-4 mt-4 bg-gradient-to-br from-[#00302e] to-[#004B49] rounded-3xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center text-white font-black text-2xl border border-white/20">
            {displayName[0]?.toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="font-black text-white text-lg flex items-center gap-1.5">
              {displayName}
              {verified && <CheckCircle size={16} className="text-[#D4AF37]" />}
            </div>
            <div className="text-white/60 text-xs flex items-center gap-1 mt-0.5">
              <Globe size={11} /> {provider.country ?? "—"}
            </div>
            {totalFeedback > 0 ? (
              <div className="flex items-center gap-1 mt-1">
                <Star size={11} className="text-[#D4AF37] fill-[#D4AF37]" />
                <span className="text-white/80 text-xs font-bold">{positiveRate}% positive</span>
                <span className="text-white/40 text-[10px]">· {totalFeedback} reviews</span>
              </div>
            ) : (
              <div className="text-white/40 text-[10px] mt-1">No ratings yet</div>
            )}
          </div>
        </div>
        {verified && (
          <div className="bg-white/10 border border-white/15 rounded-xl px-3 py-2 flex items-center gap-2">
            <Shield size={14} className="text-[#D4AF37]" />
            <span className="text-white text-xs font-bold">Crossingate Verified Provider</span>
          </div>
        )}
      </div>

      {provider.profile_bio && (
        <div className="mx-4 mt-3 bg-white rounded-2xl p-4 shadow-sm">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">About</div>
          <div className="text-sm text-gray-600 leading-relaxed">{provider.profile_bio}</div>
        </div>
      )}

      <div className="mx-4 mt-3 grid grid-cols-3 gap-2">
        <div className="bg-white rounded-2xl p-3 shadow-sm text-center">
          <TrendingUp size={18} className="text-[#004B49] mx-auto mb-1" />
          <div className="font-black text-gray-800 text-lg">{provider.total_visas_delivered ?? 0}</div>
          <div className="text-[10px] text-gray-400">Visas Delivered</div>
        </div>
        <div className="bg-white rounded-2xl p-3 shadow-sm text-center">
          <Award size={18} className="text-[#9c7a1f] mx-auto mb-1" />
          <div className="font-black text-gray-800 text-lg">${Number(provider.total_valuation ?? 0).toLocaleString()}</div>
          <div className="text-[10px] text-gray-400">Total Value</div>
        </div>
        <div className="bg-white rounded-2xl p-3 shadow-sm text-center">
          <Star size={18} className="text-green-500 mx-auto mb-1" />
          <div className="font-black text-gray-800 text-lg">{positiveRate}%</div>
          <div className="text-[10px] text-gray-400">Positive</div>
        </div>
      </div>

      <div className="mx-4 mt-3 bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#E8F0EF] flex items-center justify-center flex-shrink-0">
          <Calendar size={18} className="text-[#004B49]" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-bold text-gray-800">Member for {daysSinceJoin} day{daysSinceJoin !== 1 ? "s" : ""}</div>
          <div className="text-[11px] text-gray-400">{joinDate ? `Joined ${joinDate.toLocaleDateString()}` : "—"}</div>
        </div>
      </div>

      <div className="mx-4 mt-3 bg-[#FBF3E1] border border-[#D4AF37]/30 rounded-2xl p-3 flex gap-2">
        <Lock size={14} className="text-[#9c7a1f] flex-shrink-0 mt-0.5" />
        <div className="text-[11px] text-[#9c7a1f]">Chat unlocks automatically once you place an order with this provider.</div>
      </div>

      <div className="grid grid-cols-2 gap-2 px-4 mt-4">
        <button onClick={() => setTab("listings")}
          className={`flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-bold transition-all ${tab === "listings" ? "bg-[#004B49] text-white shadow-md" : "bg-white text-gray-500 border border-gray-100"}`}>
          📋 Listings ({ads.length})
        </button>
        <button onClick={() => setTab("reviews")}
          className={`flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-bold transition-all ${tab === "reviews" ? "bg-[#004B49] text-white shadow-md" : "bg-white text-gray-500 border border-gray-100"}`}>
          ⭐ Reviews ({totalFeedback})
        </button>
      </div>

      {tab === "listings" && (
        <div className="px-4 mt-3 flex flex-col gap-3">
          {ads.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm py-10 text-center">
              <div className="text-2xl mb-1">📋</div>
              <div className="text-sm font-bold text-gray-400">No active listings</div>
            </div>
          ) : (
            ads.map((ad) => {
              const buyerPays = Number(ad.price) + (ad.provider_fee ?? PROVIDER_FEE) + (ad.buyer_fee ?? BUYER_FEE);
              return (
                <Link key={ad.id} to="/ads/$id" params={{ id: ad.id }}>
                  <div className="bg-white rounded-2xl shadow-sm p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-gray-800 text-sm">{ad.title}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{ad.country}</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="font-black text-[#004B49] text-lg">${buyerPays}</div>
                        <div className="text-[10px] text-gray-400">{ad.currency}</div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="bg-[#E8F0EF] text-[#004B49] text-[10px] font-semibold px-2 py-0.5 rounded-full">{ad.visa_type}</span>
                      {ad.processing_time && (
                        <span className="bg-gray-50 text-gray-500 text-[10px] font-semibold px-2 py-0.5 rounded-full">⏱ {ad.processing_time}</span>
                      )}
                      <span className="bg-green-50 text-green-600 text-[10px] font-semibold px-2 py-0.5 rounded-full">✓ Live</span>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      )}

      {tab === "reviews" && (
        <div className="px-4 mt-3 flex flex-col gap-3">
          {totalFeedback === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm py-10 text-center">
              <div className="text-2xl mb-1">⭐</div>
              <div className="text-sm font-bold text-gray-400">No reviews yet</div>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1 bg-green-50 rounded-xl p-3 text-center">
                    <div className="font-black text-green-600 text-lg">👍 {provider.positive_feedback_count ?? 0}</div>
                    <div className="text-[10px] text-gray-500">Positive</div>
                  </div>
                  <div className="flex-1 bg-red-50 rounded-xl p-3 text-center">
                    <div className="font-black text-red-400 text-lg">👎 {provider.negative_feedback_count ?? 0}</div>
                    <div className="text-[10px] text-gray-500">Negative</div>
                  </div>
                </div>
                {topTags.length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Clients Say</div>
                    <div className="flex flex-wrap gap-1.5">
                      {topTags.map(([tag, count]) => (
                        <span key={tag} className="text-[11px] bg-[#E8F0EF] text-[#004B49] font-semibold px-2.5 py-1 rounded-full">
                          {tag} · {count}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {reviews.map((r) => (
                <div key={r.id} className="bg-white rounded-2xl shadow-sm p-4">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`text-xs font-bold ${r.rating === "positive" ? "text-green-600" : "text-red-400"}`}>
                      {r.rating === "positive" ? "👍 Positive" : "👎 Negative"}
                    </span>
                    <span className="text-[9px] text-gray-400">{new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                  {r.tags && r.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-1.5">
                      {r.tags.map((t: string) => (
                        <span key={t} className="text-[9px] bg-gray-50 text-gray-500 px-1.5 py-0.5 rounded-full border border-gray-100">{t}</span>
                      ))}
                    </div>
                  )}
                  {r.comment && <div className="text-xs text-gray-600">{r.comment}</div>}
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
