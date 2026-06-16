import { ArrowLeft, Star, Shield, Clock, CheckCircle, MessageCircle, Flag, Edit3 } from "lucide-react";
import { useNavigate, useParams, Link } from "@tanstack/react-router";
import { useState } from "react";

const PROFILE = {
  id: "me",
  name: "Ahmad Khan",
  avatar: "AK",
  role: "Opportunity Seeker",
  country: "🇵🇰 Pakistan · Karachi",
  bio: "Looking for verified work visa opportunities in Europe and Middle East. Experienced software engineer with 5 years experience.",
  memberSince: "January 2026",
  verified: true,
  kycLevel: 3,
  trustScore: 82,
  rating: 4.9,
  reviewCount: 24,
  totalTransactions: 3,
  successRate: 100,
  responseTime: "< 2 hours",
  languages: ["Urdu", "English", "Arabic"],
  badges: [
    { label: "KYC Verified", color: "bg-blue-50 text-blue-600 border-blue-100" },
    { label: "Top Buyer", color: "bg-amber-50 text-amber-600 border-amber-100" },
    { label: "Trusted Member", color: "bg-green-50 text-green-600 border-green-100" },
  ],
};

const PROVIDER_PROFILE = {
  id: "provider1",
  name: "ImmigrationPro",
  avatar: "IP",
  role: "Visa Provider · Licensed Immigration Consultant",
  country: "🇨🇦 Canada · Toronto",
  bio: "Licensed immigration consultant with 10+ years of experience. Specializing in Canada PR, Express Entry, and PNP programs. 500+ successful cases.",
  memberSince: "March 2025",
  verified: true,
  kycLevel: 4,
  trustScore: 96,
  rating: 4.9,
  reviewCount: 234,
  totalTransactions: 312,
  successRate: 97,
  responseTime: "< 1 hour",
  languages: ["English", "French", "Urdu"],
  badges: [
    { label: "KYC L4 Verified", color: "bg-blue-50 text-blue-600 border-blue-100" },
    { label: "Top Provider", color: "bg-amber-50 text-amber-600 border-amber-100" },
    { label: "500+ Cases", color: "bg-purple-50 text-purple-600 border-purple-100" },
    { label: "97% Success", color: "bg-green-50 text-green-600 border-green-100" },
  ],
};

const REVIEWS = [
  {
    id: 1,
    reviewer: "Muhammad Ali",
    avatar: "MA",
    rating: 5,
    date: "June 5, 2026",
    text: "Excellent service! Got my Canada PR approved in 7 months. Very professional and always available for questions.",
    visa: "Canada PR",
  },
  {
    id: 2,
    reviewer: "Sara Khan",
    avatar: "SK",
    rating: 5,
    date: "May 20, 2026",
    text: "Highly recommend! They guided me through every step. My study visa was approved first attempt.",
    visa: "UK Student Visa",
  },
  {
    id: 3,
    reviewer: "Ahmed Raza",
    avatar: "AR",
    rating: 4,
    date: "May 1, 2026",
    text: "Good service, took a bit longer than expected but they delivered. Communication was great throughout.",
    visa: "Germany Work Visa",
  },
];

export function ProfilePage() {
  const { id } = useParams({ from: "/profile/$id" });
  const navigate = useNavigate();
  const isOwnProfile = id === "me";
  const profile = id === "provider1" ? PROVIDER_PROFILE : PROFILE;
  const isProvider = profile.role.includes("Provider");
  const [activeTab, setActiveTab] = useState<"reviews" | "listings">("reviews");

  return (
    <div className="flex flex-col pb-8">

      {/* BACK */}
      <div className="bg-white px-4 py-3 flex items-center gap-2 border-b border-gray-100">
        <button
          onClick={() => void navigate({ to: "/" })}
          className="p-1.5 rounded-full hover:bg-gray-100"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <span className="font-bold text-gray-800 text-sm">
          {isOwnProfile ? "My Profile" : "Provider Profile"}
        </span>
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
              {profile.avatar}
            </div>
            {profile.verified && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#1a56f0] rounded-full flex items-center justify-center border-2 border-white">
                <CheckCircle size={12} className="text-white" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-black text-gray-800 text-lg leading-tight">{profile.name}</div>
            <div className="text-xs text-gray-500 mt-0.5">{profile.role}</div>
            <div className="text-xs text-gray-400 mt-0.5">{profile.country}</div>
            <div className="flex items-center gap-1 mt-1.5">
              <Star size={12} className="text-amber-400 fill-amber-400" />
              <span className="text-xs font-bold text-gray-700">{profile.rating}</span>
              <span className="text-xs text-gray-400">({profile.reviewCount} reviews)</span>
            </div>
          </div>
        </div>

        {/* BADGES */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {profile.badges.map((b) => (
            <span key={b.label} className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${b.color}`}>
              {b.label}
            </span>
          ))}
        </div>

        {/* BIO */}
        <p className="text-xs text-gray-600 leading-relaxed mb-3">{profile.bio}</p>

        {/* LANGUAGES */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-gray-400 font-semibold">Languages:</span>
          {profile.languages.map((l) => (
            <span key={l} className="text-[10px] bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full text-gray-600 font-medium">
              {l}
            </span>
          ))}
        </div>
      </div>

      {/* TRUST SCORE */}
      <div className="mx-4 mt-4">
        <div className="bg-gradient-to-br from-[#1a1a2e] to-[#1a56f0] rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-white/60 text-xs mb-0.5">Trust Score</div>
              <div className="text-3xl font-black text-white">{profile.trustScore}<span className="text-lg text-white/50">/100</span></div>
            </div>
            <div className="w-16 h-16 relative">
              <svg viewBox="0 0 60 60" className="w-full h-full -rotate-90">
                <circle cx="30" cy="30" r="24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="6" />
                <circle cx="30" cy="30" r="24" fill="none" stroke="white" strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${(profile.trustScore / 100) * 150} 150`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Shield size={18} className="text-white" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "KYC Level", value: `L${profile.kycLevel}` },
              { label: "Success Rate", value: `${profile.successRate}%` },
              { label: "Response", value: profile.responseTime },
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
            { label: "Transactions", value: profile.totalTransactions },
            { label: "Reviews", value: profile.reviewCount },
            { label: "Member Since", value: profile.memberSince.split(" ")[1] },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white rounded-2xl p-3 text-center shadow-sm">
              <div className="font-black text-gray-800 text-lg">{value}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ACTION BUTTONS */}
      {!isOwnProfile && (
        <div className="mx-4 mt-3 flex gap-2">
          <Link to="/messages/$id" params={{ id: "1" }} className="flex-1">
            <button className="w-full bg-[#1a56f0] text-white font-bold py-3.5 rounded-2xl text-sm flex items-center justify-center gap-2">
              <MessageCircle size={16} />
              Message Provider
            </button>
          </Link>
          <button
            onClick={() => alert("Report submitted")}
            className="w-11 h-11 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-center flex-shrink-0 mt-0.5"
          >
            <Flag size={16} className="text-red-400" />
          </button>
        </div>
      )}

      {/* TABS */}
      <div className="mx-4 mt-4">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {(["reviews", "listings"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === t ? "bg-white text-gray-800 shadow-sm" : "text-gray-400"
              }`}
            >
              {t === "reviews" ? `⭐ Reviews (${profile.reviewCount})` : "📋 Listings"}
            </button>
          ))}
        </div>
      </div>

      {/* REVIEWS */}
      {activeTab === "reviews" && (
        <div className="mx-4 mt-3 flex flex-col gap-3">
          {REVIEWS.map((r) => (
            <div key={r.id} className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white text-xs font-black">
                    {r.avatar}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-800">{r.reviewer}</div>
                    <div className="text-[10px] text-gray-400">{r.date}</div>
                  </div>
                </div>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={10} className={i < r.rating ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-200"} />
                  ))}
                </div>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed mb-2">{r.text}</p>
              <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-semibold">
                {r.visa}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* LISTINGS TAB */}
      {activeTab === "listings" && (
        <div className="mx-4 mt-3">
          {isProvider ? (
            <div className="flex flex-col gap-3">
              {[
                { title: "Canada Express Entry — PR Assistance", price: 499, country: "🇨🇦 Canada", time: "6-8 weeks" },
                { title: "Canada PNP — Ontario Stream", price: 399, country: "🇨🇦 Canada", time: "4-6 months" },
              ].map((listing, i) => (
                <Link key={i} to="/ads/$id" params={{ id: String(i) }}>
                  <div className="bg-white rounded-2xl p-4 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="text-sm font-bold text-gray-800">{listing.title}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{listing.country}</div>
                      </div>
                      <div className="font-black text-[#1a56f0]">${listing.price}</div>
                    </div>
                    <div className="flex gap-2">
                      <span className="bg-green-50 text-green-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-100">✓ Verified</span>
                      <span className="bg-gray-50 text-gray-500 text-[10px] font-semibold px-2 py-0.5 rounded-full">⏱ {listing.time}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-2xl mb-2">📋</div>
              <div className="text-sm font-bold text-gray-400">No listings yet</div>
              <div className="text-xs text-gray-300 mt-1">This user is a Visa Seeker</div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
