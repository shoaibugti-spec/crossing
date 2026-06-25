import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Bell, Home, Menu, MessageCircle, Plus, User, X, ShoppingBag, Wallet as WalletIcon, HeadphonesIcon, Globe } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

interface LayoutProps {
  children: React.ReactNode;
}

interface ProfileInfo {
  full_name: string | null;
  role: string;
  kyc_status: string;
}

const BRAND_NAME = (
  <span style={{
    fontFamily: "'Montserrat', 'Inter', Arial, sans-serif",
    fontWeight: 700,
    fontStyle: "normal",
    letterSpacing: "0px",
    lineHeight: 1,
  }}>
    <span style={{ color: "#004B49" }}>Crossin</span>
    <span style={{ color: "#D4AF37" }}>gate</span>
  </span>
);

// Google Translate inject
function injectGoogleTranslate() {
  if (document.getElementById("google-translate-script")) return;
  (window as any).googleTranslateElementInit = function () {
    new (window as any).google.translate.TranslateElement(
      { pageLanguage: "en", layout: 0, autoDisplay: false },
      "google_translate_element"
    );
  };
  const script = document.createElement("script");
  script.id = "google-translate-script";
  script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
  document.body.appendChild(script);
}

export function Layout({ children }: LayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profile, setProfile] = useState<ProfileInfo | null>(null);
  const [checked, setChecked] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showTranslate, setShowTranslate] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  useEffect(() => {
    void loadProfile();
    injectGoogleTranslate();
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      void loadProfile();
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (menuOpen) void loadProfile();
  }, [menuOpen]);

  async function loadProfile() {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) { setProfile(null); setChecked(true); return; }
    const { data, error } = await supabase.from("profiles").select("full_name, role, kyc_status").eq("id", userData.user.id).single();
    setProfile(error ? null : data);
    setChecked(true);
    void loadUnreadCount(userData.user.id);
    subscribeToNotifications(userData.user.id);
  }

  async function loadUnreadCount(uid: string) {
    const { count } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", uid)
      .eq("is_read", false);
    setUnreadCount(count ?? 0);
  }

  function subscribeToNotifications(uid: string) {
    supabase
      .channel(`notif_badge_${uid}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${uid}`,
      }, () => {
        setUnreadCount((prev) => prev + 1);
      })
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${uid}`,
      }, () => {
        void loadUnreadCount(uid);
      })
      .subscribe();
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setProfile(null);
    setMenuOpen(false);
    void navigate({ to: "/login" });
  }

  const isAdmin = profile?.role === "admin";
  const isProvider = profile?.role === "provider";
  const loggedIn = !!profile;

  const sideMenuLinks: { to: "/" | "/ads" | "/my-ads" | "/messages" | "/wallet" | "/transactions" | "/kyc" | "/disputes" | "/notifications" | "/settings" | "/help" | "/admin" | "/setup-services"; label: string }[] = [
    { to: "/", label: "🏠 Home" },
    { to: "/ads", label: "🔍 Browse Visa Ads" },
    { to: "/my-ads", label: "📋 My Listings" },
    { to: "/messages", label: "💬 Messages" },
    { to: "/wallet", label: "💳 Wallet" },
    { to: "/transactions", label: "🔄 Transactions" },
    { to: "/kyc", label: "✅ KYC Verification" },
    ...(isProvider ? [{ to: "/setup-services" as const, label: "🌍 My Services" }] : []),
    { to: "/disputes", label: "⚖️ Disputes" },
    { to: "/notifications", label: "🔔 Notifications" },
    { to: "/settings", label: "⚙️ Settings" },
    { to: "/help", label: "🆘 Help & Safety" },
    ...(isAdmin ? [{ to: "/admin" as const, label: "🛡️ Admin Dashboard" }] : []),
  ];

  const isActive = (to: string) => {
    if (to === "/") return path === "/";
    return path.startsWith(to);
  };

  const initial = profile?.full_name?.[0]?.toUpperCase() ?? "?";
  const displayName = profile?.full_name || "Guest";
  const roleLabel = profile
    ? `${profile.kyc_status === "approved" ? "✅ Verified" : "⏳ Unverified"} · ${profile.role === "admin" ? "Admin" : profile.role === "provider" ? "Provider" : "Seeker"}`
    : checked ? "Not logged in" : "Loading...";

  if (checked && !loggedIn) {
    return <div className="min-h-screen bg-[#F4F6F6]">{children}</div>;
  }

  if (!checked) {
    return <div className="min-h-screen bg-[#F4F6F6]" />;
  }

  return (
    <div className="min-h-screen bg-[#F4F6F6] flex flex-col">

      {/* Google Translate hidden element */}
      <div id="google_translate_element" style={{ display: "none" }} />

      {/* TOP NAV */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center">
          <Link to="/">
            <span style={{ fontSize: "18px" }}>{BRAND_NAME}</span>
          </Link>
          <div className="flex items-center gap-1 ml-auto">

            {/* Help icon only */}
            <Link to="/help">
              <div className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-50 transition-all">
                <HeadphonesIcon size={20} className="text-[#004B49]" />
              </div>
            </Link>

            {/* Google Translate */}
            <div className="relative">
              <button
                onClick={() => setShowTranslate(!showTranslate)}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-50 transition-all">
                <Globe size={20} className="text-[#004B49]" />
              </button>
              {showTranslate && (
                <div className="absolute right-0 top-11 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 p-3 min-w-[200px]">
                  <div className="text-xs font-black text-gray-500 mb-2 px-1">🌐 Translate Page</div>
                  <div id="google_translate_element_visible" className="min-h-[40px]" />
                  <div className="mt-2 text-[10px] text-gray-400 text-center px-1">
                    Powered by Google Translate
                  </div>
                  <button
                    onClick={() => setShowTranslate(false)}
                    className="mt-2 w-full text-xs text-gray-400 py-1 hover:text-gray-600">
                    Close ✕
                  </button>
                </div>
              )}
            </div>

            {/* Notifications */}
            <Link to="/notifications">
              <div className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-50">
                <Bell size={20} className="text-gray-600" />
                {unreadCount > 0 && (
                  <div className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center border-2 border-white">
                    <span className="text-[9px] font-black text-white px-0.5">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  </div>
                )}
              </div>
            </Link>

            <button onClick={() => setMenuOpen(true)} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-50">
              <Menu size={22} className="text-gray-600" />
            </button>
          </div>
        </div>
      </header>

      {/* SIDE DRAWER */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
          <div className="w-72 bg-white h-full shadow-2xl flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <span style={{ fontSize: "16px" }}>{BRAND_NAME}</span>
              <button onClick={() => setMenuOpen(false)}><X size={20} className="text-gray-500" /></button>
            </div>
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#004B49] to-[#00746f] flex items-center justify-center text-white font-bold text-sm">
                  {initial}
                </div>
                <div>
                  <div className="font-semibold text-gray-800 text-sm">{displayName}</div>
                  <div className="text-xs text-gray-500">{roleLabel}</div>
                </div>
              </div>
            </div>
            <nav className="flex-1 px-3 py-3">
              {sideMenuLinks.map((link) => (
                <Link key={link.to} to={link.to} onClick={() => setMenuOpen(false)}>
                  <div className={`flex items-center px-3 py-2.5 rounded-xl text-sm font-medium mb-0.5 transition-colors ${
                    isActive(link.to) ? "bg-[#004B49]/10 text-[#004B49]" : "text-gray-600 hover:bg-gray-100"
                  }`}>
                    {link.label}
                    {link.to === "/notifications" && unreadCount > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-[9px] font-black rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </nav>
            <div className="px-5 py-4 border-t border-gray-100">
              <button onClick={() => void handleLogout()} className="w-full text-center text-sm font-semibold text-red-500">
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-lg mx-auto w-full pb-20">
        {children}
      </main>

      {/* BOTTOM NAV */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 shadow-lg">
        <div className="max-w-lg mx-auto flex">
          <Link to="/" className="flex-1">
            <div className={`flex flex-col items-center gap-0.5 py-2.5 transition-colors ${isActive("/") ? "text-[#004B49]" : "text-gray-400"}`}>
              <Home size={22} strokeWidth={isActive("/") ? 2.5 : 1.8} />
              <span className="text-[10px] font-semibold">Home</span>
            </div>
          </Link>
          <Link to="/transactions" className="flex-1">
            <div className={`flex flex-col items-center gap-0.5 py-2.5 transition-colors ${isActive("/transactions") ? "text-[#004B49]" : "text-gray-400"}`}>
              <ShoppingBag size={22} strokeWidth={isActive("/transactions") ? 2.5 : 1.8} />
              <span className="text-[10px] font-semibold">Orders</span>
            </div>
          </Link>
          {isProvider ? (
            <Link to="/post-ad" className="flex-1">
              <div className="flex flex-col items-center gap-0.5 py-2.5">
                <div className="w-11 h-11 rounded-full bg-[#004B49] flex items-center justify-center shadow-lg -mt-5 border-4 border-white">
                  <Plus size={22} className="text-white" />
                </div>
                <span className="text-[10px] font-semibold text-gray-400 mt-0.5">Post</span>
              </div>
            </Link>
          ) : (
            <Link to="/wallet" className="flex-1">
              <div className="flex flex-col items-center gap-0.5 py-2.5">
                <div className="w-11 h-11 rounded-full bg-[#004B49] flex items-center justify-center shadow-lg -mt-5 border-4 border-white">
                  <WalletIcon size={20} className="text-white" />
                </div>
                <span className="text-[10px] font-semibold text-gray-400 mt-0.5">Wallet</span>
              </div>
            </Link>
          )}
          <Link to="/messages" className="flex-1">
            <div className={`flex flex-col items-center gap-0.5 py-2.5 transition-colors ${isActive("/messages") ? "text-[#004B49]" : "text-gray-400"}`}>
              <MessageCircle size={22} strokeWidth={isActive("/messages") ? 2.5 : 1.8} />
              <span className="text-[10px] font-semibold">Chat</span>
            </div>
          </Link>
          <Link to="/profile/$id" params={{ id: "me" }} className="flex-1">
            <div className={`flex flex-col items-center gap-0.5 py-2.5 transition-colors ${isActive("/profile") ? "text-[#004B49]" : "text-gray-400"}`}>
              <User size={22} strokeWidth={isActive("/profile") ? 2.5 : 1.8} />
              <span className="text-[10px] font-semibold">Profile</span>
            </div>
          </Link>
        </div>
      </nav>

      {/* Google Translate CSS fix — toolbar ہٹائیں */}
      <style>{`
        .goog-te-banner-frame, .skiptranslate { display: none !important; }
        body { top: 0 !important; }
        .goog-te-gadget { font-size: 0 !important; }
        .goog-te-gadget select { font-size: 13px !important; border-radius: 10px !important; border: 1px solid #e5e7eb !important; padding: 6px 10px !important; outline: none !important; width: 100% !important; }
      `}</style>
    </div>
  );
}
