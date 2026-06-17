import { ArrowLeft, Star, Shield, CheckCircle, MessageCircle, Flag, Edit3, Loader2 } from "lucide-react";
import { useNavigate, useParams, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

interface ProfileData {
  id: string;
  full_name: string | null;
  role: string;
  country: string | null;
  kyc_level: number;
  kyc_status: string;
  trust_score: number;
  created_at: string;
}

interface BusinessInfo {
  company_name: string | null;
  business_type: string | null;
  office_city: string | null;
  office_country: string | null;
}

interface AdRow {
  id: string;
  title: string;
  price: number;
  currency: string;
  country: string;
  processing_time: string | null;
  status: string;
}

export function ProfilePage() {
  const { id } = useParams({ from: "/profile/$id" });
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [business, setBusiness] = useState<BusinessInfo | null>(null);
  const [listings, setListings] = useState<AdRow[]>([]);
  const [activeTab, setActiveTab] = useState<"reviews" | "listings">("reviews");
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    void loadProfile();
  }, [id]);

  async function loadProfile() {
    setLoading(true);

    const { data: userData } = await supabase.auth.getUser();
    const currentUserId = userData.user?.id ?? null;

    const targetId = id === "me" ? currentUserId : id;
    setIsOwnProfile(id === "me" || targetId === currentUserId);

    if (!targetId) {
      setLoading(false);
      return;
    }

    const { data: profileData } = await supabase
      .from("profiles")
      .select("id, full_name, role, country, kyc_level, kyc_status, trust_score, created_at")
      .eq("id", targetId)
      .single();
    setProfile(profileData ?? null);

    if (profileData?.role === "provider") {
      const { data: biz } = await supabase
        .from("provider_business_info")
        .select("company_name, business_type, office_city, office_country")
        .eq("user_id", targetId)
        .single();
      setBusiness(biz ?? null);

      const { data: ads } = await supabase
        .from("ads")
        .select("id, title, price, currency, country, processing_time, status")
        .eq("provider_id", targetId)
        .order("created_at", { ascending: false });
      setListings(ads ?? []);
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-gray-300" size={28} />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
        <div className="text-2xl mb-2">👤</div>
        <div className="font-bold text-gray-700">Profile not found</div>
        <div className="text-xs text-gray-400 mt-1">This user may not exist or hasn't completed signup.</div>
      </div>
    );
  }

  const isProvider = profile.role === "provider";
  const displayName = isProvider && business?.company_name ? business.company_name : (profile.full_name || "Unnamed User");
  const initial = displayName[0]?.toUpperCase() ?? "?";
  const roleLabel = isProvider
    ? `Visa Provider${business?.business_type ? ` · ${business.business_type}` : ""}`
    : profile.role === "admin" ? "Crossing Administrator" : "Visa Seeker";
  const locationLabel = isProvider && business
    ? `${business.office_city ?? ""}${business.office_city && business.office_country ? ", " : ""}${business.office_country ?? ""}`
    : profile.country ?? "Location not set";
  const verified = profile.kyc_status === "approved";
  const memberSince = new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const memberYear = new Date(profile.created_at).getFullYear();

  return (
    <div className="flex flex-col pb-8">

      {/* BACK */}
      <div className="bg-white px-4 py-3 flex items-center gap-2 border-b border-gray-100">
        <button onClick={() => void navigate({ to: "/" })} className="p-1.5 rounded-full hover:bg-gray-100">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <span className="font-bold text-gray-800 text-sm">{isOwnProfile ? "My Profile" : "Profile"}</span>
        {isOwnProfile && (
          <Link to="/settings" className="ml-auto">
            <button className="flex items-center gap-1.5 text-xs font-semibold text-[#1a56f0]">
              <Edit3 size={14} /> Edit
            </button>
          </Link>
        )}
      </div>

      {/* PROFILE HEADER */}
      <div className="bg-white px-4 pt-5 pb-4 border-b border-gray-100">
        <div className="flex items-start gap-4 mb-4">
          <div className="relative flex-shrink-0">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1a56f0] to-purple-600 flex items-center justify-center text-white font-black text-xl">
              {initial}
            </div>
            {verified && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#1a56f0] rounded-full flex items-center justify-center border-2 border-white">
                <CheckCircle size={12} className="text-white" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-black text-gray-800 text-lg leading-tight">{displayName}</div>
            <div className="text-xs text-gray-500 mt-0.5">{roleLabel}</div>
            <div className="text-xs text-gray-400 mt-0.5">{locationLabel}</div>
            <div className="flex items-center gap-1 mt-1.5">
              <Star size={12} className="text-amber-400 fill-amber-400" />
              <span className="text-xs font-bold text-gray-700">No ratings yet</span>
            </div>
          </div>
        </div>

        {/* BADGES */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {verified && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-blue-50 text-blue-600 border-blue-100">
              KYC Verified
            </span>
          )}
          {profile.role === "admin" && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-purple-50 text-purple-600 border-purple-100">
              Crossing Admin
            </span>
          )}
          {!verified && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-gray-50 text-gray-500 border-gray-200">
              Unverified
            </span>
          )}
        </div>
      </div>

      {/* TRUST SCORE */}
      <div className="mx-4 mt-4">
        <div className="bg-gradient-to-br from-[#1a1a2e] to-[#1a56f0] rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-white/60 text-xs mb-0.5">Trust Score</div>
              <div className="text-3xl font-black text-white">{profile.trust_score}<span className="text-lg text-white/50">/100</span></div>
            </div>
            <div className="w-16 h-16 relative">
              <svg viewBox="0 0 60 60" className="w-full h-full -rotate-90">
                <circle cx="30" cy="30" r="24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="6" />
                <circle cx="30" cy="30" r="24" fill="none" stroke="white" strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${(profile.trust_score / 100) * 150} 150`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Shield size={18} className="text-white" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "KYC Level", value: `L${profile.kyc_level}` },
              { label: "Status", value: profile.kyc_status === "approved" ? "Verified" : profile.kyc_status === "pending" ? "Pending" : "None" },
              { label: "Member Since", value: String(memberYear) },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white/10 rounded-xl p-2 text-center">
                <div className="text-white font-black text-sm">{value}</div>
                <div className="text-white/50 text-[9px] mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="mx-4 mt-3">
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Transactions", value: "0" },
            { label: "Listings", value: String(listings.length) },
            { label: "Joined", value: memberSince },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white rounded-2xl p-3 text-center shadow-sm">
              <div className="font-black text-gray-800 text-sm">{value}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ACTION BUTTONS */}
      {!isOwnProfile && isProvider && (
        <div className="mx-4 mt-3 flex gap-2">
          <Link to="/ads" search={{ q: "", country: "", type: "" }} className="flex-1">
            <button className="w-full bg-[#1a56f0] text-white font-bold py-3.5 rounded-2xl text-sm flex items-center justify-center gap-2">
              <MessageCircle size={16} />
              View Listings to Order
            </button>
          </Link>
          <button onClick={() => alert("Report submitted")}
            className="w-11 h-11 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-center flex-shrink-0 mt-0.5">
            <Flag size={16} className="text-red-400" />
          </button>
        </div>
      )}

      {!isOwnProfile && isProvider && (
        <div className="mx-4 mt-2">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-2.5 text-[11px] text-blue-700">
            Chat unlocks automatically once you place an order with this provider.
          </div>
        </div>
      )}

      {/* TABS */}
      <div className="mx-4 mt-4">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {(["reviews", "listings"] as const).map((t) => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === t ? "bg-white text-gray-800 shadow-sm" : "text-gray-400"}`}>
              {t === "reviews" ? "⭐ Reviews" : "📋 Listings"}
            </button>
          ))}
        </div>
      </div>

      {/* REVIEWS — empty until review system is built */}
      {activeTab === "reviews" && (
        <div className="mx-4 mt-3">
          <div className="text-center py-10">
            <div className="text-2xl mb-2">⭐</div>
            <div className="text-sm font-bold text-gray-400">No reviews yet</div>
            <div className="text-xs text-gray-300 mt-1">Reviews appear after completed transactions</div>
          </div>
        </div>
      )}

      {/* LISTINGS TAB */}
      {activeTab === "listings" && (
        <div className="mx-4 mt-3">
          {isProvider ? (
            listings.length > 0 ? (
              <div className="flex flex-col gap-3">
                {listings.map((listing) => (
                  <Link key={listing.id} to="/ads/$id" params={{ id: listing.id }}>
                    <div className="bg-white rounded-2xl p-4 shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="text-sm font-bold text-gray-800">{listing.title}</div>
                          <div className="text-xs text-gray-400 mt-0.5">{listing.country}</div>
                        </div>
                        <div className="font-black text-[#1a56f0]">${listing.price}</div>
                      </div>
                      <div className="flex gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          listing.status === "active" ? "bg-green-50 text-green-600 border-green-100" : "bg-gray-50 text-gray-500 border-gray-200"
                        }`}>
                          {listing.status === "active" ? "✓ Live" : listing.status.replace("_", " ")}
                        </span>
                        {listing.processing_time && (
                          <span className="bg-gray-50 text-gray-500 text-[10px] font-semibold px-2 py-0.5 rounded-full">⏱ {listing.processing_time}</span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-2xl mb-2">📋</div>
                <div className="text-sm font-bold text-gray-400">No listings yet</div>
              </div>
            )
          ) : (
            <div className="text-center py-8">
              <div className="text-2xl mb-2">📋</div>
              <div className="text-sm font-bold text-gray-400">No listings</div>
              <div className="text-xs text-gray-300 mt-1">This user is a Visa Seeker</div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
