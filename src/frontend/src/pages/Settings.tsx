import { ArrowLeft, ChevronRight, Shield, Bell, Globe, Lock, Eye, HelpCircle, LogOut, User, CreditCard, Star } from "lucide-react";
import { useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";

export function Settings() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState({
    messages: true,
    escrow: true,
    kyc: true,
    promotions: false,
    reviews: true,
  });
  const [language, setLanguage] = useState("English");
  const [showLangPicker, setShowLangPicker] = useState(false);

  const LANGUAGES = ["English", "اردو (Urdu)", "العربية (Arabic)", "Français", "Deutsch", "Türkçe"];

  const SECTIONS = [
    {
      title: "Account",
      items: [
        { icon: User, label: "Edit Profile", color: "bg-blue-50 text-blue-500", link: "/profile/me" },
        { icon: Shield, label: "KYC Verification", color: "bg-green-50 text-green-500", link: "/kyc", badge: "L3" },
        { icon: CreditCard, label: "Wallet & Payments", color: "bg-amber-50 text-amber-500", link: "/wallet" },
        { icon: Star, label: "My Reviews", color: "bg-purple-50 text-purple-500", link: "/profile/me" },
      ],
    },
    {
      title: "Security",
      items: [
        { icon: Lock, label: "Change Password", color: "bg-red-50 text-red-500", link: null },
        { icon: Eye, label: "Two-Factor Authentication", color: "bg-indigo-50 text-indigo-500", link: null, toggle: true, enabled: true },
        { icon: Shield, label: "Active Sessions", color: "bg-gray-50 text-gray-500", link: null },
      ],
    },
  ];

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
        <span className="font-bold text-gray-800 text-sm">Settings</span>
      </div>

      {/* PROFILE CARD */}
      <div className="mx-4 mt-4">
        <Link to="/profile/me">
          <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1a56f0] to-purple-600 flex items-center justify-center text-white font-black text-lg">
              AK
            </div>
            <div className="flex-1">
              <div className="font-bold text-gray-800">Ahmad Khan</div>
              <div className="text-xs text-gray-500 mt-0.5">ahmad@email.com</div>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="bg-green-50 text-green-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-100">
                  ✓ KYC L3
                </span>
                <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-100">
                  Trust: 82
                </span>
              </div>
            </div>
            <ChevronRight size={18} className="text-gray-300" />
          </div>
        </Link>
      </div>

      {/* SECTIONS */}
      {SECTIONS.map((section) => (
        <div key={section.title} className="mx-4 mt-4">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">
            {section.title}
          </div>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {section.items.map((item, i) => (
              <div key={item.label}>
                {item.link ? (
                  <Link to={item.link as "/"}>
                    <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-all">
                      <div className={`w-9 h-9 rounded-xl ${item.color} flex items-center justify-center flex-shrink-0`}>
                        <item.icon size={17} />
                      </div>
                      <span className="flex-1 text-sm font-medium text-gray-700">{item.label}</span>
                      {item.badge && (
                        <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full mr-1">
                          {item.badge}
                        </span>
                      )}
                      <ChevronRight size={16} className="text-gray-300" />
                    </div>
                  </Link>
                ) : (
                  <div className="flex items-center gap-3 px-4 py-3.5">
                    <div className={`w-9 h-9 rounded-xl ${item.color} flex items-center justify-center flex-shrink-0`}>
                      <item.icon size={17} />
                    </div>
                    <span className="flex-1 text-sm font-medium text-gray-700">{item.label}</span>
                    {item.toggle ? (
                      <button className="w-11 h-6 rounded-full bg-[#1a56f0] relative">
                        <div className="w-5 h-5 bg-white rounded-full shadow absolute right-0.5 top-0.5" />
                      </button>
                    ) : (
                      <ChevronRight size={16} className="text-gray-300" />
                    )}
                  </div>
                )}
                {i < section.items.length - 1 && (
                  <div className="h-px bg-gray-50 ml-16" />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* NOTIFICATIONS */}
      <div className="mx-4 mt-4">
        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">
          Notifications
        </div>
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {[
            { key: "messages", label: "New Messages", icon: "💬" },
            { key: "escrow", label: "Escrow Updates", icon: "🔒" },
            { key: "kyc", label: "KYC Status", icon: "✅" },
            { key: "reviews", label: "Reviews & Ratings", icon: "⭐" },
            { key: "promotions", label: "Promotions", icon: "🎁" },
          ].map((item, i, arr) => (
            <div key={item.key}>
              <div className="flex items-center gap-3 px-4 py-3.5">
                <span className="text-lg w-9 text-center flex-shrink-0">{item.icon}</span>
                <span className="flex-1 text-sm font-medium text-gray-700">{item.label}</span>
                <button
                  onClick={() => setNotifications((n) => ({ ...n, [item.key]: !n[item.key as keyof typeof n] }))}
                  className={`w-11 h-6 rounded-full relative transition-all ${
                    notifications[item.key as keyof typeof notifications] ? "bg-[#1a56f0]" : "bg-gray-200"
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow absolute top-0.5 transition-all ${
                    notifications[item.key as keyof typeof notifications] ? "right-0.5" : "left-0.5"
                  }`} />
                </button>
              </div>
              {i < arr.length - 1 && <div className="h-px bg-gray-50 ml-16" />}
            </div>
          ))}
        </div>
      </div>

      {/* LANGUAGE */}
      <div className="mx-4 mt-4">
        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">
          Preferences
        </div>
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <button
            onClick={() => setShowLangPicker(!showLangPicker)}
            className="w-full flex items-center gap-3 px-4 py-3.5"
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center flex-shrink-0">
              <Globe size={17} />
            </div>
            <span className="flex-1 text-sm font-medium text-gray-700 text-left">Language</span>
            <span className="text-xs text-gray-400 mr-1">{language}</span>
            <ChevronRight size={16} className="text-gray-300" />
          </button>

          {showLangPicker && (
            <div className="border-t border-gray-50">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang}
                  onClick={() => { setLanguage(lang); setShowLangPicker(false); }}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50"
                >
                  <span className="text-sm text-gray-700">{lang}</span>
                  {language === lang && (
                    <span className="text-[#1a56f0] text-xs font-bold">✓</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* HELP */}
      <div className="mx-4 mt-4">
        <Link to="/help">
          <div className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gray-50 text-gray-500 flex items-center justify-center">
              <HelpCircle size={17} />
            </div>
            <span className="flex-1 text-sm font-medium text-gray-700">Help & Support</span>
            <ChevronRight size={16} className="text-gray-300" />
          </div>
        </Link>
      </div>

      {/* LOGOUT */}
      <div className="mx-4 mt-3">
        <button
          onClick={() => void navigate({ to: "/login" })}
          className="w-full bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center justify-center gap-2"
        >
          <LogOut size={16} className="text-red-500" />
          <span className="text-sm font-bold text-red-500">Logout</span>
        </button>
      </div>

      <div className="text-center mt-4">
        <span className="text-[10px] text-gray-300">Crossing v1.0.0 · crossing-frontend.vercel.app</span>
      </div>

    </div>
  );
}
