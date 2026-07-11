import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Bell, Home, Menu, MessageCircle, Megaphone, User, X, ShoppingBag, Wallet as WalletIcon, HeadphonesIcon } from "lucide-react";
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

const TranslateIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 8l6 6" />
    <path d="M4 14l6-6 2-3" />
    <path d="M2 5h12" />
    <path d="M7 2h1" />
    <path d="M22 22l-5-10-5 10" />
    <path d="M14 18h6" />
  </svg>
);

const LANGUAGES = [
  { code: "en",    label: "English",       flag: "🇬🇧" },
  { code: "ur",    label: "اردو",          flag: "🇵🇰" },
  { code: "ar",    label: "العربية",       flag: "🇸🇦" },
  { code: "hi",    label: "हिंदी",         flag: "🇮🇳" },
  { code: "zh-CN", label: "中文(简体)",    flag: "🇨🇳" },
  { code: "zh-TW", label: "中文(繁體)",    flag: "🇹🇼" },
  { code: "fr",    label: "Français",      flag: "🇫🇷" },
  { code: "de",    label: "Deutsch",       flag: "🇩🇪" },
  { code: "es",    label: "Español",       flag: "🇪🇸" },
  { code: "pt",    label: "Português",     flag: "🇧🇷" },
  { code: "ru",    label: "Русский",       flag: "🇷🇺" },
  { code: "ja",    label: "日本語",        flag: "🇯🇵" },
  { code: "ko",    label: "한국어",        flag: "🇰🇷" },
  { code: "tr",    label: "Türkçe",        flag: "🇹🇷" },
  { code: "id",    label: "Indonesia",     flag: "🇮🇩" },
  { code: "ms",    label: "Melayu",        flag: "🇲🇾" },
  { code: "th",    label: "ภาษาไทย",      flag: "🇹🇭" },
  { code: "vi",    label: "Tiếng Việt",    flag: "🇻🇳" },
  { code: "bn",    label: "বাংলা",         flag: "🇧🇩" },
  { code: "fa",    label: "فارسی",         flag: "🇮🇷" },
  { code: "ps",    label: "پښتو",          flag: "🇦🇫" },
  { code: "tl",    label: "Filipino",      flag: "🇵🇭" },
  { code: "sw",    label: "Swahili",       flag: "🌍" },
  { code: "am",    label: "አማርኛ",         flag: "🇪🇹" },
  { code: "so",    label: "Soomaali",      flag: "🇸🇴" },
  { code: "ha",    label: "Hausa",         flag: "🇳🇬" },
  { code: "yo",    label: "Yorùbá",        flag: "🇳🇬" },
  { code: "ig",    label: "Igbo",          flag: "🇳🇬" },
  { code: "zu",    label: "isiZulu",       flag: "🇿🇦" },
  { code: "af",    label: "Afrikaans",     flag: "🇿🇦" },
  { code: "nl",    label: "Nederlands",    flag: "🇳🇱" },
  { code: "it",    label: "Italiano",      flag: "🇮🇹" },
  { code: "pl",    label: "Polski",        flag: "🇵🇱" },
  { code: "uk",    label: "Українська",    flag: "🇺🇦" },
  { code: "ro",    label: "Română",        flag: "🇷🇴" },
  { code: "cs",    label: "Čeština",       flag: "🇨🇿" },
  { code: "hu",    label: "Magyar",        flag: "🇭🇺" },
  { code: "el",    label: "Ελληνικά",      flag: "🇬🇷" },
  { code: "he",    label: "עברית",         flag: "🇮🇱" },
  { code: "sv",    label: "Svenska",       flag: "🇸🇪" },
  { code: "no",    label: "Norsk",         flag: "🇳🇴" },
  { code: "da",    label: "Dansk",         flag: "🇩🇰" },
  { code: "fi",    label: "Suomi",         flag: "🇫🇮" },
  { code: "sk",    label: "Slovenčina",    flag: "🇸🇰" },
  { code: "bg",    label: "Български",     flag: "🇧🇬" },
  { code: "hr",    label: "Hrvatski",      flag: "🇭🇷" },
  { code: "sr",    label: "Српски",        flag: "🇷🇸" },
  { code: "lt",    label: "Lietuvių",      flag: "🇱🇹" },
  { code: "lv",    label: "Latviešu",      flag: "🇱🇻" },
  { code: "et",    label: "Eesti",         flag: "🇪🇪" },
  { code: "ka",    label: "ქართული",       flag: "🇬🇪" },
  { code: "hy",    label: "Հայերեն",       flag: "🇦🇲" },
  { code: "az",    label: "Azərbaycan",    flag: "🇦🇿" },
  { code: "kk",    label: "Қазақша",       flag: "🇰🇿" },
  { code: "uz",    label: "O'zbek",        flag: "🇺🇿" },
  { code: "ky",    label: "Кыргызча",      flag: "🇰🇬" },
  { code: "tg",    label: "Тоҷикӣ",        flag: "🇹🇯" },
  { code: "mn",    label: "Монгол",        flag: "🇲🇳" },
  { code: "ne",    label: "नेपाली",        flag: "🇳🇵" },
  { code: "si",    label: "සිංහල",         flag: "🇱🇰" },
  { code: "my",    label: "မြန်မာ",        flag: "🇲🇲" },
  { code: "km",    label: "ខ្មែរ",         flag: "🇰🇭" },
  { code: "lo",    label: "ລາວ",           flag: "🇱🇦" },
  { code: "jw",    label: "Jawa",          flag: "🇮🇩" },
  { code: "su",    label: "Sunda",         flag: "🇮🇩" },
  { code: "ceb",   label: "Cebuano",       flag: "🇵🇭" },
  { code: "mg",    label: "Malagasy",      flag: "🇲🇬" },
  { code: "eo",    label: "Esperanto",     flag: "🌐" },
];

function translatePage(langCode: string) {
  if (langCode === "en") {
    const el = document.querySelector(".goog-te-combo") as HTMLSelectElement;
    if (el) { el.value = "en"; el.dispatchEvent(new Event("change")); }
    else { window.location.href = window.location.href.replace("#googtrans", "") + "#googtrans(en|en)"; window.location.reload(); }
    return;
  }
  const value = `en|${langCode}`;
  document.cookie = `googtrans=/en/${langCode}; path=/`;
  document.cookie = `googtrans=/en/${langCode}; domain=.${window.location.hostname}; path=/`;

  const selectEl = document.querySelector(".goog-te-combo") as HTMLSelectElement;
  if (selectEl) {
    selectEl.value = langCode;
    selectEl.dispatchEvent(new Event("change"));
  } else {
    window.location.href = `https://translate.google.com/translate?sl=en&tl=${langCode}&u=${encodeURIComponent(window.location.href)}`;
  }
}

export function Layout({ children }: LayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profile, setProfile] = useState<ProfileInfo | null>(null);
  const [checked, setChecked] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatUnread, setChatUnread] = useState(0);
  const [showTranslate, setShowTranslate] = useState(false);
  const [activeLang, setActiveLang] = useState("en");
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  useEffect(() => {
    void loadProfile();

    if (!document.getElementById("gt-script")) {
      (window as any).googleTranslateElementInit = () => {};
      const s = document.createElement("script");
      s.id = "gt-script";
      s.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      s.async = true;
      document.head.appendChild(s);
    }

    if (!document.getElementById("gt-hidden-mount")) {
      const div = document.createElement("div");
      div.id = "gt-hidden-mount";
      div.style.cssText = "position:absolute;top:-9999px;left:-9999px;visibility:hidden;";
      document.body.appendChild(div);
      setTimeout(() => {
        if ((window as any).google?.translate?.TranslateElement) {
          new (window as any).google.translate.TranslateElement(
            { pageLanguage: "en", autoDisplay: false },
            "gt-hidden-mount"
          );
        }
      }, 2000);
    }

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      void loadProfile();
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (menuOpen) void loadProfile();
  }, [menuOpen]);

  // Chat kholne par unread dobara load karein (messages parh liye honge)
  useEffect(() => {
    void refreshChatUnread();
  }, [path]);

  async function refreshChatUnread() {
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) void loadChatUnread(userData.user.id);
  }

  async function loadProfile() {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) { setProfile(null); setChecked(true); return; }
    const { data, error } = await supabase.from("profiles").select("full_name, role, kyc_status").eq("id", userData.user.id).single();
    setProfile(error ? null : data);
    setChecked(true);
    void loadUnreadCount(userData.user.id);
    void loadChatUnread(userData.user.id);
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

  // Chat unread: apne orders ke messages jo doosre ne bheje aur parhe nahi
  async function loadChatUnread(uid: string) {
    const { data: txs } = await supabase
      .from("transactions")
      .select("id")
      .or(`buyer_id.eq.${uid},seller_id.eq.${uid}`);
    const txIds = (txs ?? []).map((t: any) => t.id);
    if (txIds.length === 0) { setChatUnread(0); return; }

    const { count } = await supabase
      .from("order_messages")
      .select("id", { count: "exact", head: true })
      .in("transaction_id", txIds)
      .neq("sender_id", uid)
      .eq("is_read", false);
    setChatUnread(count ?? 0);
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
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "order_messages",
      }, () => {
        // Naya order message aya — chat badge refresh karein
        void loadChatUnread(uid);
      })
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "order_messages",
      }, () => {
        void loadChatUnread(uid);
      })
      .subscribe();
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setProfile(null);
    setMenuOpen(false);
    void navigate({ to: "/login" });
  }

  function handleLangSelect(code: string) {
    setActiveLang(code);
    setShowTranslate(false);
    translatePage(code);
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

  const currentLang = LANGUAGES.find((l) => l.code === activeLang);

  return (
    <div className="min-h-screen bg-[#F4F6F6] flex flex-col">

      <style>{`
        .goog-te-banner-frame, #goog-gt-tt, .goog-te-balloon-frame { display: none !important; }
        .skiptranslate { display: none !important; }
        body { top: 0 !important; }
        font { background-color: transparent !important; box-shadow: none !important; }
      `}</style>

      {/* TOP NAV */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center">
          <Link to="/">
            <span style={{ fontSize: "18px" }}>{BRAND_NAME}</span>
          </Link>

          <div className="flex items-center gap-0.5 ml-auto">

            <Link to="/help">
              <div className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-50 transition-all">
                <HeadphonesIcon size={21} className="text-[#004B49]" />
              </div>
            </Link>

            <div className="relative">
              <button
                onClick={() => setShowTranslate(!showTranslate)}
                className={`w-10 h-10 flex items-center justify-center rounded-full transition-all ${showTranslate ? "bg-[#E8F0EF]" : "hover:bg-gray-50"} text-[#004B49]`}>
                {activeLang !== "en" ? (
                  <span className="text-base">{currentLang?.flag}</span>
                ) : (
                  <TranslateIcon />
                )}
              </button>

              {showTranslate && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowTranslate(false)} />
                  <div className="absolute right-0 top-12 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
                    style={{ width: "260px", maxHeight: "70vh" }}>
                    <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between sticky top-0 bg-white">
                      <div className="flex items-center gap-2 text-[#004B49]">
                        <TranslateIcon />
                        <span className="text-xs font-black text-gray-700">Select Language</span>
                      </div>
                      <button onClick={() => setShowTranslate(false)} className="text-gray-400 hover:text-gray-600">
                        <X size={16} />
                      </button>
                    </div>
                    <div className="overflow-y-auto" style={{ maxHeight: "55vh" }}>
                      {LANGUAGES.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => handleLangSelect(lang.code)}
                          className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0 ${
                            activeLang === lang.code ? "bg-[#E8F0EF]" : ""
                          }`}>
                          <span className="text-xl flex-shrink-0">{lang.flag}</span>
                          <span className={`text-sm flex-1 ${activeLang === lang.code ? "font-bold text-[#004B49]" : "font-medium text-gray-700"}`}>
                            {lang.label}
                          </span>
                          {activeLang === lang.code && (
                            <span className="text-[#004B49] text-xs font-black">✓</span>
                          )}
                        </button>
                      ))}
                    </div>
                    <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
                      <p className="text-[9px] text-gray-400 text-center">Powered by Google Translate</p>
                    </div>
                  </div>
                </>
              )}
            </div>

            <Link to="/notifications">
              <div className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-50">
                <Bell size={21} className="text-gray-600" />
                {unreadCount > 0 && (
                  <div className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center border-2 border-white">
                    <span className="text-[9px] font-black text-white px-0.5">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  </div>
                )}
              </div>
            </Link>

            <button onClick={() => setMenuOpen(true)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-50">
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
                    {link.to === "/messages" && chatUnread > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-[9px] font-black rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                        {chatUnread > 99 ? "99+" : chatUnread}
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
            <div className={`relative flex flex-col items-center gap-0.5 py-2.5 transition-colors ${isActive("/messages") ? "text-[#004B49]" : "text-gray-400"}`}>
              <div className="relative">
                <MessageCircle size={22} strokeWidth={isActive("/messages") ? 2.5 : 1.8} />
                {chatUnread > 0 && (
                  <div className="absolute -top-1.5 -right-2 min-w-[16px] h-[16px] bg-red-500 rounded-full flex items-center justify-center border-2 border-white">
                    <span className="text-[8px] font-black text-white px-0.5">
                      {chatUnread > 99 ? "99+" : chatUnread}
                    </span>
                  </div>
                )}
              </div>
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
    </div>
  );
}
