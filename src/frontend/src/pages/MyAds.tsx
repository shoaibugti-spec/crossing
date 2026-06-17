import { ArrowLeft, Plus, Eye, MessageCircle, Edit3, Trash2, TrendingUp, Loader2 } from "lucide-react";
import { useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

interface AdRow {
  id: string;
  title: string;
  country: string;
  visa_type: string;
  price: number;
  currency: string;
  status: string;
  created_at: string;
}

const STATUS: Record<string, { label: string; color: string }> = {
  active:         { label: "Active",         color: "bg-green-50 text-green-600 border-green-100" },
  pending_review: { label: "Pending Review", color: "bg-amber-50 text-amber-600 border-amber-100" },
  suspended:      { label: "Suspended",       color: "bg-gray-50 text-gray-400 border-gray-100" },
  rejected:       { label: "Rejected",        color: "bg-red-50 text-red-500 border-red-100" },
};

export function MyAds() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"active" | "pending" | "other">("active");
  const [loading, setLoading] = useState(true);
  const [ads, setAds] = useState<AdRow[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    void loadAds();
  }, []);

  async function loadAds() {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setLoading(false);
      void navigate({ to: "/login" });
      return;
    }

    const { data, error } = await supabase
      .from("ads")
      .select("id, title, country, visa_type, price, currency, status, created_at")
      .eq("provider_id", userData.user.id)
      .order("created_at", { ascending: false });

    if (!error && data) setAds(data);
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this listing? This cannot be undone.")) return;
    setDeletingId(id);
    const { error } = await supabase.from("ads").delete().eq("id", id);
    if (error) {
      alert("Failed to delete: " + error.message);
    } else {
      setAds((prev) => prev.filter((a) => a.id !== id));
    }
    setDeletingId(null);
  }

  const filtered = ads.filter((ad) => {
    if (tab === "active") return ad.status === "active";
    if (tab === "pending") return ad.status === "pending_review";
    return ad.status === "suspended" || ad.status === "rejected";
  });

  // No real analytics table yet — show 0 honestly rather than fake numbers
  const totalViews = 0;
  const totalMessages = 0;
  const totalOrders = 0;

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
        <span className="font-bold text-gray-800 text-sm flex-1">My Listings</span>
        <Link to="/post-ad">
          <button className="flex items-center gap-1.5 bg-[#1a56f0] text-white text-xs font-bold px-3 py-2 rounded-xl">
            <Plus size={14} /> New Ad
          </button>
        </Link>
      </div>

      {/* STATS */}
      <div className="mx-4 mt-4">
        <div className="bg-gradient-to-br from-[#1a1a2e] to-[#1a56f0] rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={16} className="text-white" />
            <span className="text-white font-bold text-sm">Performance Overview</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Total Views", value: totalViews },
              { label: "Messages", value: totalMessages },
              { label: "Orders", value: totalOrders },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white/10 rounded-xl p-2.5 text-center">
                <div className="text-white font-black text-xl">{value}</div>
                <div className="text-white/50 text-[10px] mt-0.5">{label}</div>
              </div>
            ))}
          </div>
          <div className="text-white/40 text-[10px] mt-2 text-center">Analytics tracking coming soon</div>
        </div>
      </div>

      {/* TABS */}
      <div className="mx-4 mt-4">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {(["active", "pending", "other"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${tab === t ? "bg-white text-gray-800 shadow-sm" : "text-gray-400"}`}>
              {t === "active" ? "Active" : t === "pending" ? "Pending" : "Suspended/Rejected"}
            </button>
          ))}
        </div>
      </div>

      {/* ADS */}
      <div className="mx-4 mt-3 flex flex-col gap-3">
        {filtered.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl shadow-sm">
            <div className="text-3xl mb-3">📋</div>
            <div className="text-sm font-bold text-gray-400">
              {ads.length === 0 ? "You haven't posted any listings yet" : `No ${tab} listings`}
            </div>
            {ads.length === 0 && (
              <Link to="/post-ad">
                <button className="mt-3 bg-[#1a56f0] text-white text-xs font-bold px-4 py-2 rounded-xl">
                  Post Your First Ad
                </button>
              </Link>
            )}
          </div>
        ) : (
          filtered.map((ad) => {
            const s = STATUS[ad.status] ?? { label: ad.status, color: "bg-gray-50 text-gray-400 border-gray-100" };
            return (
              <div key={ad.id} className="bg-white rounded-2xl shadow-sm p-4">

                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-800 text-sm leading-snug">{ad.title}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{ad.country} · {ad.visa_type}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-black text-[#1a56f0]">${ad.price}</div>
                    <div className="text-[10px] text-gray-400">{ad.currency}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${s.color}`}>{s.label}</span>
                  <span className="text-[10px] text-gray-400">Posted {new Date(ad.created_at).toLocaleDateString()}</span>
                </div>

                {ad.status === "active" && (
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {[
                      { icon: Eye, label: "Views", value: 0 },
                      { icon: MessageCircle, label: "Msgs", value: 0 },
                      { icon: TrendingUp, label: "Orders", value: 0 },
                    ].map(({ icon: Icon, label, value }) => (
                      <div key={label} className="bg-gray-50 rounded-xl p-2 text-center">
                        <div className="font-black text-gray-800 text-sm">{value}</div>
                        <div className="text-[10px] text-gray-400">{label}</div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <Link to="/ads/$id" params={{ id: ad.id }} className="flex-1">
                    <button className="w-full border border-gray-100 bg-gray-50 text-gray-600 text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5">
                      <Eye size={13} /> Preview
                    </button>
                  </Link>
                  <button onClick={() => alert("Editing listings is coming soon")}
                    className="flex-1 border border-[#1a56f0]/20 bg-[#1a56f0]/5 text-[#1a56f0] text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5">
                    <Edit3 size={13} /> Edit
                  </button>
                  <button onClick={() => void handleDelete(ad.id)} disabled={deletingId === ad.id}
                    className="w-10 border border-red-100 bg-red-50 text-red-400 rounded-xl flex items-center justify-center disabled:opacity-50">
                    {deletingId === ad.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
