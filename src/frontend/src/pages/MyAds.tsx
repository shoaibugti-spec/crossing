import { ArrowLeft, Plus, Eye, EyeOff, Trash2, Loader2, Globe, Edit3, Check, TrendingUp, Award, Star, Megaphone, User, Calendar, MessageCircle } from "lucide-react";
import { useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

const SUBMISSION_FEE = 36;

export function MyAds() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [tab, setTab] = useState<"listings" | "profile">("listings");

  const [ads, setAds] = useState<any[]>([]);
  const [profile, setProfile] = useState<any | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  // Profile edit
  const [editingProfile, setEditingProfile] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => { void loadData(); }, []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  async function loadData() {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) { setLoading(false); void navigate({ to: "/login" }); return; }
    setUserId(userData.user.id);

    const { data: prof } = await supabase
      .from("profiles")
      .select("id, display_name, full_name, profile_bio, total_visas_delivered, total_valuation, positive_feedback_count, negative_feedback_count, created_at")
      .eq("id", userData.user.id)
      .single();
    setProfile(prof);
    setDisplayName(prof?.display_name ?? prof?.full_name ?? "");
    setBio(prof?.profile_bio ?? "");

    const { data: adRows } = await supabase
      .from("ads")
      .select("id, title, country, visa_type, price, currency, status, is_public, provider_fee, buyer_fee, created_at")
      .eq("provider_id", userData.user.id)
      .order("created_at", { ascending: false });
    setAds(adRows ?? []);

    const { data: revs } = await supabase
      .from("reviews")
      .select("id, rating, tags, comment, created_at")
      .eq("provider_id", userData.user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    setReviews(revs ?? []);

    setLoading(false);
  }

  async function togglePublic(ad: any) {
    setProcessingId(ad.id);
    const newPublic = !ad.is_public;
    await supabase.from("ads").update({
      is_public: newPublic,
      status: newPublic ? "active" : "suspended",
    }).eq("id", ad.id);
    setAds((p) => p.map((a) => a.id === ad.id ? { ...a, is_public: newPublic, status: newPublic ? "active" : "suspended" } : a));
    setProcessingId(null);
    showToast(newPublic ? "✅ Ad is now Public" : "🔒 Ad is now Private");
  }

  async function deleteAd(ad: any) {
    if (!confirm(`Delete "${ad.title}"? Your $${SUBMISSION_FEE} submission fee will be refunded to your wallet.`)) return;
    setProcessingId(ad.id);

    const { error } = await supabase.from("ads").delete().eq("id", ad.id);
    if (error) { alert("Failed to delete: " + error.message); setProcessingId(null); return; }

    // Refund $36
    if (userId) {
      const { data: prof } = await supabase.from("profiles").select("wallet_balance").eq("id", userId).single();
      const newBal = Number(prof?.wallet_balance ?? 0) + SUBMISSION_FEE;
      await supabase.from("profiles").update({ wallet_balance: newBal }).eq("id", userId);
      await supabase.from("wallet_transactions").insert({
        user_id: userId,
        type: "refund",
        amount: SUBMISSION_FEE,
        status: "completed",
        notes: `Ad submission fee refunded — "${ad.title}"`,
      });
    }

    setAds((p) => p.filter((a) => a.id !== ad.id));
    setProcessingId(null);
    showToast("🗑 Ad deleted · $36 refunded");
  }

  async function saveProfile() {
    if (!userId) return;
    if (!displayName.trim()) { showToast("⚠️ Display name required"); return; }
    setSavingProfile(true);
    await supabase.from("profiles").update({
      display_name: displayName.trim(),
      profile_bio: bio.trim() || null,
    }).eq("id", userId);
    setProfile((p: any) => ({ ...p, display_name: displayName.trim(), profile_bio: bio.trim() }));
    setSavingProfile(false);
    setEditingProfile(false);
    showToast("✅ Profile updated");
  }

  if (loading) {
    return <div className="flex items-center justify-center py-24"><Loader2 className="animate-spin text-gray-300" size={28} /></div>;
  }

  const totalFeedback = (profile?.positive_feedback_count ?? 0) + (profile?.negative_feedback_count ?? 0);
  const positiveRate = totalFeedback > 0 ? Math.round(((profile?.positive_feedback_count ?? 0) / totalFeedback) * 100) : 0;
  const joinDate = profile?.created_at ? new Date(profile.created_at) : null;
  const daysSinceJoin = joinDate ? Math.floor((Date.now() - joinDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;

  // Common feedback tags summary
  const tagCounts: Record<string, number> = {};
  reviews.forEach((r) => (r.tags ?? []).forEach((t: string) => { tagCounts[t] = (tagCounts[t] ?? 0) + 1; }));
  const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div className="flex flex-col pb-8">

      {toast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[100] bg-gray-900 text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-2xl">
          {toast}
        </div>
      )}

      <div className="bg-white px-4 py-3 flex items-center gap-2 border-b border-gray-100">
        <button onClick={() => void navigate({ to: "/" })} className="p-1.5 rounded-full hover:bg-gray-100">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <span className="font-bold text-gray-800 text-sm">My Ads</span>
      </div>

      {/* TABS */}
      <div className="grid grid-cols-2 gap-2 px-4 mt-4">
        <button onClick={() => setTab("listings")}
          className={`flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold transition-all ${tab === "listings" ? "bg-[#004B49] text-white shadow-md" : "bg-white text-gray-500 border border-gray-100"}`}>
          <Megaphone size={16} /> My Listings
        </button>
        <button onClick={() => setTab("profile")}
          className={`flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold transition-all ${tab === "profile" ? "bg-[#004B49] text-white shadow-md" : "bg-white text-gray-500 border border-gray-100"}`}>
          <User size={16} /> Public Profile
        </button>
      </div>

      {/* ══ LISTINGS TAB ══ */}
      {tab === "listings" && (
        <div className="px-4 mt-4 flex flex-col gap-3">
          <Link to="/post-ad">
            <button className="w-full bg-[#004B49] text-white font-bold py-3.5 rounded-2xl text-sm flex items-center justify-center gap-2">
              <Plus size={16} /> Post New Ad
            </button>
          </Link>

          {ads.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm py-12 text-center">
              <div className="text-3xl mb-2">📢</div>
              <div className="text-sm font-bold text-gray-400 mb-1">No ads yet</div>
              <div className="text-xs text-gray-400">Post your first visa listing to get started.</div>
            </div>
          ) : (
            ads.map((ad) => {
              const buyerPays = Number(ad.price) + (ad.provider_fee ?? 6) + (ad.buyer_fee ?? 3);
              return (
                <div key={ad.id} className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-gray-800 text-sm truncate">{ad.title}</div>
                      <div className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                        <Globe size={10} /> {ad.country} · {ad.visa_type}
                      </div>
                    </div>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full flex-shrink-0 ${
                      ad.is_public ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500"
                    }`}>
                      {ad.is_public ? "PUBLIC" : "PRIVATE"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <span className="bg-gray-50 text-gray-700 text-[11px] font-semibold px-2.5 py-1 rounded-full">
                      You receive ${Number(ad.price).toFixed(2)}
                    </span>
                    <span className="bg-[#E8F0EF] text-[#004B49] text-[11px] font-semibold px-2.5 py-1 rounded-full">
                      Buyer pays ${buyerPays.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => void togglePublic(ad)} disabled={processingId === ad.id}
                      className={`flex-1 text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 border ${
                        ad.is_public ? "bg-gray-50 text-gray-600 border-gray-100" : "bg-[#004B49] text-white border-[#004B49]"
                      }`}>
                      {ad.is_public ? <><EyeOff size={13} /> Make Private</> : <><Eye size={13} /> Make Public</>}
                    </button>
                    <button onClick={() => void deleteAd(ad)} disabled={processingId === ad.id}
                      className="bg-red-50 text-red-500 border border-red-100 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5">
                      {processingId === ad.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ══ PUBLIC PROFILE TAB ══ */}
      {tab === "profile" && (
        <div className="px-4 mt-4 flex flex-col gap-3">

          {/* Preview / Edit card */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Your Public Identity</div>
              {!editingProfile && (
                <button onClick={() => setEditingProfile(true)} className="text-[#004B49] flex items-center gap-1 text-xs font-bold">
                  <Edit3 size={13} /> Edit
                </button>
              )}
            </div>

            {editingProfile ? (
              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Display Name (shown to buyers)</label>
                  <input value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Al-Karam Visa Services"
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-3 text-sm text-gray-800 outline-none focus:border-[#004B49]" />
                  <div className="text-[10px] text-gray-400 mt-1">This is your brand name on Crossingate. Your real KYC name stays private.</div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Bio / About (optional)</label>
                  <textarea value={bio} onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell buyers about your experience, specialties, success rate..."
                    rows={4}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-3 text-sm text-gray-800 outline-none focus:border-[#004B49] resize-none" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => void saveProfile()} disabled={savingProfile}
                    className="flex-1 bg-[#004B49] text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-1.5 disabled:opacity-60">
                    {savingProfile ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save
                  </button>
                  <button onClick={() => { setEditingProfile(false); setDisplayName(profile?.display_name ?? profile?.full_name ?? ""); setBio(profile?.profile_bio ?? ""); }}
                    className="bg-gray-50 text-gray-500 font-semibold px-5 py-3 rounded-xl text-sm">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#004B49] to-[#00746f] flex items-center justify-center text-white font-black text-xl">
                  {(profile?.display_name ?? profile?.full_name ?? "P")[0]?.toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="font-black text-gray-800 text-base">{profile?.display_name ?? "Set your name"}</div>
                  {profile?.profile_bio ? (
                    <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">{profile.profile_bio}</div>
                  ) : (
                    <div className="text-xs text-gray-400 mt-0.5">Add a bio to attract more buyers</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white rounded-2xl p-3 shadow-sm text-center">
              <TrendingUp size={18} className="text-[#004B49] mx-auto mb-1" />
              <div className="font-black text-gray-800 text-lg">{profile?.total_visas_delivered ?? 0}</div>
              <div className="text-[10px] text-gray-400">Visas Delivered</div>
            </div>
            <div className="bg-white rounded-2xl p-3 shadow-sm text-center">
              <Award size={18} className="text-[#9c7a1f] mx-auto mb-1" />
              <div className="font-black text-gray-800 text-lg">${Number(profile?.total_valuation ?? 0).toLocaleString()}</div>
              <div className="text-[10px] text-gray-400">Total Value</div>
            </div>
            <div className="bg-white rounded-2xl p-3 shadow-sm text-center">
              <Star size={18} className="text-green-500 mx-auto mb-1" />
              <div className="font-black text-gray-800 text-lg">{positiveRate}%</div>
              <div className="text-[10px] text-gray-400">Positive</div>
            </div>
          </div>

          {/* Join info */}
          <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E8F0EF] flex items-center justify-center flex-shrink-0">
              <Calendar size={18} className="text-[#004B49]" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold text-gray-800">Member for {daysSinceJoin} day{daysSinceJoin !== 1 ? "s" : ""}</div>
              <div className="text-[11px] text-gray-400">{joinDate ? `Joined ${joinDate.toLocaleDateString()}` : "—"}</div>
            </div>
          </div>

          {/* Feedback summary */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="text-sm font-bold text-gray-800 mb-3">Client Feedback</div>
            {totalFeedback === 0 ? (
              <div className="text-center py-4">
                <div className="text-2xl mb-1">⭐</div>
                <div className="text-xs text-gray-400">No reviews yet. Complete orders to build your reputation.</div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1 bg-green-50 rounded-xl p-3 text-center">
                    <div className="font-black text-green-600 text-lg">👍 {profile?.positive_feedback_count ?? 0}</div>
                    <div className="text-[10px] text-gray-500">Positive</div>
                  </div>
                  <div className="flex-1 bg-red-50 rounded-xl p-3 text-center">
                    <div className="font-black text-red-400 text-lg">👎 {profile?.negative_feedback_count ?? 0}</div>
                    <div className="text-[10px] text-gray-500">Negative</div>
                  </div>
                </div>

                {topTags.length > 0 && (
                  <div className="mb-3">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Buyers Say</div>
                    <div className="flex flex-wrap gap-1.5">
                      {topTags.map(([tag, count]) => (
                        <span key={tag} className="text-[11px] bg-[#E8F0EF] text-[#004B49] font-semibold px-2.5 py-1 rounded-full">
                          {tag} · {count}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  {reviews.slice(0, 5).map((r) => (
                    <div key={r.id} className="bg-gray-50 rounded-xl p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`text-[10px] font-bold ${r.rating === "positive" ? "text-green-600" : "text-red-400"}`}>
                          {r.rating === "positive" ? "👍 Positive" : "👎 Negative"}
                        </span>
                        <span className="text-[9px] text-gray-400">{new Date(r.created_at).toLocaleDateString()}</span>
                      </div>
                      {r.tags && r.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-1">
                          {r.tags.map((t: string) => (
                            <span key={t} className="text-[9px] bg-white text-gray-500 px-1.5 py-0.5 rounded-full border border-gray-100">{t}</span>
                          ))}
                        </div>
                      )}
                      {r.comment && <div className="text-[11px] text-gray-600">{r.comment}</div>}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
