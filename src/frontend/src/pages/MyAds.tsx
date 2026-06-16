import { ArrowLeft, Plus, Eye, MessageCircle, Edit3, Trash2, TrendingUp } from "lucide-react";
import { useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";

const MY_ADS = [
  {
    id: "1",
    title: "Canada Express Entry — PR Assistance",
    country: "🇨🇦 Canada",
    category: "Work Visa",
    price: 499,
    status: "active",
    views: 247,
    messages: 12,
    orders: 3,
    createdAt: "June 1, 2026",
  },
  {
    id: "2",
    title: "UK Skilled Worker Visa — Full Service",
    country: "🇬🇧 United Kingdom",
    category: "Work Visa",
    price: 399,
    status: "active",
    views: 189,
    messages: 8,
    orders: 2,
    createdAt: "May 20, 2026",
  },
  {
    id: "3",
    title: "Germany Blue Card — IT Professionals",
    country: "🇩🇪 Germany",
    category: "Work Visa",
    price: 249,
    status: "pending",
    views: 0,
    messages: 0,
    orders: 0,
    createdAt: "June 14, 2026",
  },
  {
    id: "4",
    title: "UAE Tourist Visa — Fast Track",
    country: "🇦🇪 UAE",
    category: "Tourist Visa",
    price: 99,
    status: "expired",
    views: 92,
    messages: 5,
    orders: 1,
    createdAt: "April 1, 2026",
  },
];

const STATUS = {
  active:  { label: "Active",   color: "bg-green-50 text-green-600 border-green-100" },
  pending: { label: "Pending Review", color: "bg-amber-50 text-amber-600 border-amber-100" },
  expired: { label: "Expired",  color: "bg-gray-50 text-gray-400 border-gray-100" },
  rejected:{ label: "Rejected", color: "bg-red-50 text-red-500 border-red-100" },
};

export function MyAds() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"active" | "pending" | "expired">("active");

  const filtered = MY_ADS.filter((ad) => {
    if (tab === "active") return ad.status === "active";
    if (tab === "pending") return ad.status === "pending";
    return ad.status === "expired" || ad.status === "rejected";
  });

  const totalViews = MY_ADS.reduce((s, a) => s + a.views, 0);
  const totalOrders = MY_ADS.reduce((s, a) => s + a.orders, 0);
  const totalMessages = MY_ADS.reduce((s, a) => s + a.messages, 0);

  return (
    <div className="flex flex-col pb-8">

      {/* HEADER */}
      <div className="bg-white px-4 py-3 flex items-center gap-2 border-b border-gray-100">
        <button
          onClick={() => void navigate({ to: "/" })}
          className="p-1.5 rounded-full hover:bg-gray-100"
        >
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
        </div>
      </div>

      {/* TABS */}
      <div className="mx-4 mt-4">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {(["active", "pending", "expired"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                tab === t ? "bg-white text-gray-800 shadow-sm" : "text-gray-400"
              }`}
            >
              {t === "active" ? "Active" : t === "pending" ? "Pending" : "Expired"}
            </button>
          ))}
        </div>
      </div>

      {/* ADS */}
      <div className="mx-4 mt-3 flex flex-col gap-3">
        {filtered.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl shadow-sm">
            <div className="text-3xl mb-3">📋</div>
            <div className="text-sm font-bold text-gray-400">No {tab} listings</div>
            {tab === "active" && (
              <Link to="/post-ad">
                <button className="mt-3 bg-[#1a56f0] text-white text-xs font-bold px-4 py-2 rounded-xl">
                  Post Your First Ad
                </button>
              </Link>
            )}
          </div>
        ) : (
          filtered.map((ad) => {
            const s = STATUS[ad.status as keyof typeof STATUS];
            return (
              <div key={ad.id} className="bg-white rounded-2xl shadow-sm p-4">

                {/* TOP */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-800 text-sm leading-snug">{ad.title}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{ad.country} · {ad.category}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-black text-[#1a56f0]">${ad.price}</div>
                    <div className="text-[10px] text-gray-400">USDT</div>
                  </div>
                </div>

                {/* STATUS */}
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${s.color}`}>
                    {s.label}
                  </span>
                  <span className="text-[10px] text-gray-400">Posted {ad.createdAt}</span>
                </div>

                {/* STATS */}
                {ad.status === "active" && (
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {[
                      { icon: Eye, label: "Views", value: ad.views },
                      { icon: MessageCircle, label: "Msgs", value: ad.messages },
                      { icon: TrendingUp, label: "Orders", value: ad.orders },
                    ].map(({ icon: Icon, label, value }) => (
                      <div key={label} className="bg-gray-50 rounded-xl p-2 text-center">
                        <div className="font-black text-gray-800 text-sm">{value}</div>
                        <div className="text-[10px] text-gray-400">{label}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* ACTIONS */}
                <div className="flex gap-2">
                  <Link to="/ads/$id" params={{ id: ad.id }} className="flex-1">
                    <button className="w-full border border-gray-100 bg-gray-50 text-gray-600 text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5">
                      <Eye size={13} /> Preview
                    </button>
                  </Link>
                  <button
                    onClick={() => alert("Edit coming soon")}
                    className="flex-1 border border-[#1a56f0]/20 bg-[#1a56f0]/5 text-[#1a56f0] text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5"
                  >
                    <Edit3 size={13} /> Edit
                  </button>
                  <button
                    onClick={() => alert("Are you sure you want to delete this listing?")}
                    className="w-10 border border-red-100 bg-red-50 text-red-400 rounded-xl flex items-center justify-center"
                  >
                    <Trash2 size={14} />
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
