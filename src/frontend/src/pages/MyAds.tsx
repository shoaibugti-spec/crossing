import { ArrowLeft, Plus, Eye, EyeOff, Trash2, Loader2, Globe, Edit3, Check, TrendingUp, Award, Star, Megaphone, User, Calendar, X } from "lucide-react";
import { useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

const PROVIDER_FEE = 6;
const BUYER_FEE = 3;

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

  // Edit ad modal
  const [editingAd, setEditingAd] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({ title: "", price: "", processing_time: "", description: "" });
  const [savingAd, setSavingAd] = useState(false);

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
      .select("id, title, description, country, visa_type, price, currency, processing_time, status, is_public, provider_fee, buyer_fee, provider_service_id, created_at")
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
    if (!confirm(`Delete "${ad.title}"? This cannot be undone.`)) return;
    setProcessingId(ad.id);

    const { error } = await supabase.from("ads").delete().eq("id", ad.id);
    if (error) { alert("Failed to delete: " + error.message); setProcessingId(null); return; }

    setAds((p) => p.filter((a) => a.id !== ad.id));
    setProcessingId(null);
    showToast("🗑 Ad deleted");
  }

  function openEdit(ad: any) {
    setEditingAd(ad);
    setEditForm({
      title: ad.title ?? "",
      price: String(ad.price ?? ""),
      processing_time: ad.processing_time ?? "",
      description: ad.description ?? "",
    });
  }

  async function saveAdEdit() {
    if (!editingAd) return;
    if (!editForm.title.trim()) { showToast("⚠️ Title required"); return; }
    const newPrice = Number(editForm.price);
    if (!newPrice || newPrice <= 0) { showToast("⚠️ Valid price required"); return; }

    setSavingAd(true);
    const { error } = await supabase.from("ads").update({
      title: editForm.title.trim(),
      price: newPrice,
      processing_time: editForm.processing_time.trim() || null,
      description: editForm.description.trim() || null,
    }).eq("id", editingAd.id);

    setSavingAd(false);
    if (error) { alert("Save failed: " + error.message); return; }

    setAds((p) => p.map((a) => a.id === editingAd.id ? {
      ...a,
      title: editForm.title.trim(),
      price: newPrice,
      processing_time: editForm.processing_time.trim() || null,
      description: editForm.description.trim() || null,
    } : a));
    setEditingAd(null);
    showToast("✅ Ad updated — live on dashboard");
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

  const tagCounts: Record<string, number> = {};
  reviews.forEach((r) => (r.tags ?? []).forEach((t: string) => { tagCounts[t] = (tagCounts[t] ?? 0) + 1; }));
  const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const editPrice = Number(editForm.price) || 0;
  const editSubmitsAt = editPrice + PROVIDER_FEE;
  const editBuyerPays = editPrice + PROVIDER_FEE + BUYER_FEE;

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

          {ads.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm py-14 text-center">
              <div className="text-3xl mb-2">📢</div>
              <div className="text-sm font-bold text-gray-400 mb-1">You do not have any Ads.</div>
              <div className="text-xs text-gray-400 mb-4">Post your first visa listing to start receiving orders.</div>
              <Link to="/post-ad">
                <button className="bg-[#004B49] text-white font-bold px-6 py-3 rounded-2xl text-sm inline-flex items-center gap-2">
                  <Plus size={16} /> Post Ad
                </button>
              </Link>
            </div>
          ) : (
            <>
              <Link to="/post-ad">
                <button className="w-full bg-[#004B49] text-white font-bold py-3.5 rounded-2xl text-sm flex items-center justify-center gap-2">
                  <Plus size={16} /> Post New Ad
                </button>
              </Link>

              {ads.map((ad) => {
                const buyerPays = Number(ad.price) + (ad.provider_fee ?? PROVIDER_FEE) + (ad.buyer_fee ?? BUYER_FEE);
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
                        {ad.is_public ? "ACTIVE" : "PRIVATE"}
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
                      <button onClick={() => openEdit(ad)}
                        className="flex-1 bg-[#E8F0EF] text-[#004B49] border border-[#004B49]/15 text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5">
                        <Edit3 size={13} /> Edit
                      </button>
                      <button onClick={() => void togglePublic(ad)} disabled={processingId === ad.id}
                        className={`flex-1 text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 border ${
                          ad.is_public ? "bg-gray-50 text-gray-600 border-gray-100" : "bg-[#004B49] text-white border-[#004B49]"
                        }`}>
                        {ad.is_public ? <><EyeOff size={13} /> Deactivate</> : <><Eye size={13} /> Activate</>}
                      </button>
                      <button onClick={() => void deleteAd(ad)} disabled={processingId === ad.id}
                        className="bg-red-50 text-red-500 border border-red-100 text-xs font-bold px-3.5 py-2.5 rounded-xl flex items-center justify-center">
                        {processingId === ad.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      {/* ══ PUBLIC PROFILE TAB ══ */}
      {tab === "profile" && (
        <div className="px-4 mt-4 flex flex-col gap-3">

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

          <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E8F0EF] flex items-center justify-center flex-shrink-0">
              <Calendar size={18} className="text-[#004B49]" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold text-gray-800">Member for {daysSinceJoin} day{daysSinceJoin !== 1 ? "s" : ""}</div>
              <div className="text-[11px] text-gray-400">{joinDate ? `Joined ${joinDate.toLocaleDateString()}` : "—"}</div>
            </div>
          </div>

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

      {/* ══ EDIT AD MODAL ══ */}
      {editingAd && (
        <div className="fixed inset-0 z-[90] flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => !savingAd && setEditingAd(null)} />
          <div className="relative bg-white rounded-t-3xl px-5 pt-4 pb-8 max-h-[90vh] overflow-y-auto">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-3" />
            <div className="flex items-center justify-between mb-4">
              <span className="font-black text-gray-800">✏️ Edit Ad</span>
              <button onClick={() => setEditingAd(null)} className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center">
                <X size={16} className="text-gray-500" />
              </button>
            </div>

            <div className="bg-[#E8F0EF] rounded-xl p-2.5 mb-4 flex items-center gap-2">
              <Globe size={13} className="text-[#004B49] flex-shrink-0" />
              <span className="text-xs text-[#004B49] font-semibold">{editingAd.country} · {editingAd.visa_type}</span>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Listing Title *</label>
                <input value={editForm.title} onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-3 text-sm text-gray-800 outline-none focus:border-[#004B49]" />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Your Price (what you receive) *</label>
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-3">
                  <span className="text-gray-400 font-bold text-sm">$</span>
                  <input type="number" value={editForm.price} onChange={(e) => setEditForm((f) => ({ ...f, price: e.target.value }))}
                    className="flex-1 bg-transparent text-sm text-gray-800 outline-none font-bold" />
                </div>
              </div>

              {editPrice > 0 && (
                <div className="bg-[#E8F0EF] border border-[#004B49]/15 rounded-xl p-3.5">
                  <div className="text-[10px] font-black text-[#004B49] uppercase tracking-wider mb-2">New Price Breakdown</div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-gray-600">You receive</span>
                    <span className="font-bold text-gray-800">${editPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-gray-600">Listed at (+$6 provider fee)</span>
                    <span className="font-bold text-[#9c7a1f]">${editSubmitsAt.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-[#004B49]/10 pt-1.5 mt-1 flex justify-between text-xs">
                    <span className="font-bold text-gray-700">Buyer pays (+$3 buyer fee)</span>
                    <span className="font-black text-[#004B49]">${editBuyerPays.toFixed(2)}</span>
                  </div>
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Processing Time</label>
                <input value={editForm.processing_time} onChange={(e) => setEditForm((f) => ({ ...f, processing_time: e.target.value }))}
                  placeholder="e.g. 7-10 Days"
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-3 text-sm text-gray-800 outline-none focus:border-[#004B49]" />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Description</label>
                <textarea value={editForm.description} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                  rows={4}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-3 text-sm text-gray-800 outline-none focus:border-[#004B49] resize-none" />
              </div>

              <button onClick={() => void saveAdEdit()} disabled={savingAd}
                className="w-full bg-[#004B49] text-white font-bold py-3.5 rounded-2xl text-sm flex items-center justify-center gap-2 disabled:opacity-60">
                {savingAd ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
