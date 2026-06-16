import { Link, useLocation } from "@tanstack/react-router";
import { Bell, Home, Menu, MessageCircle, Plus, Search, User, X } from "lucide-react";
import { useState } from "react";

interface LayoutProps { children: React.ReactNode; }

export function Layout({ children }: LayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const path = location.pathname;

  const navItems = [
    { to: "/", icon: Home, label: "Home" },
    { to: "/ads", icon: Search, label: "Search" },
    { to: "/post-ad", icon: Plus, label: "Post" },
    { to: "/messages", icon: MessageCircle, label: "Chat" },
    { to: "/profile/me", icon: User, label: "Profile" },
  ];

  const sideMenuLinks = [
    { to: "/", label: "🏠 Home" },
    { to: "/ads", label: "🔍 Browse Visa Ads" },
    { to: "/my-ads", label: "📋 My Listings" },
    { to: "/messages", label: "💬 Messages" },
    { to: "/wallet", label: "💳 Wallet" },
    { to: "/transactions", label: "🔄 Transactions" },
    { to: "/kyc", label: "✅ KYC Verification" },
    { to: "/disputes", label: "⚖️ Disputes" },
    { to: "/notifications", label: "🔔 Notifications" },
    { to: "/settings", label: "⚙️ Settings" },
    { to: "/help", label: "🆘 Help & Safety" },
    { to: "/admin", label: "🛡️ Admin Dashboard" },
  ];

  return (
    <div className="min-h-screen bg-[#F2F3F7] flex flex-col">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/notifications" className="relative p-2 rounded-full hover:bg-gray-50">
            <Bell size={22} className="text-gray-600" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
          </Link>
          <Link to="/" className="flex flex-col items-center">
            <svg width="32" height="32" viewBox="0 0 80 80" fill="none">
              <rect width="80" height="80" rx="18" fill="#1a56f0" />
              <line x1="18" y1="18" x2="62" y2="62" stroke="white" strokeWidth="9" strokeLinecap="round" />
              <line x1="62" y1="18" x2="18" y2="62" stroke="white" strokeWidth="9" strokeLinecap="round" />
              <circle cx="40" cy="40" r="7" fill="white" />
            </svg>
            <span className="text-[10px] font-black tracking-widest text-[#1a56f0] leading-none mt-0.5">CROSSING</span>
          </Link>
          <button onClick={() => setMenuOpen(true)} className="p-2 rounded-full hover:bg-gray-50">
            <Menu size={22} className="text-gray-600" />
          </button>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
          <div className="w-72 bg-white h-full shadow-2xl flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <span className="font-black text-[#1a56f0] tracking-wider text-sm">CROSSING</span>
              <button onClick={() => setMenuOpen(false)}><X size={20} className="text-gray-500" /></button>
            </div>
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1a56f0] to-purple-600 flex items-center justify-center text-white font-bold text-sm">A</div>
                <div>
                  <div className="font-semibold text-gray-800 text-sm">Ahmad Khan</div>
                  <div className="text-xs text-gray-500">✅ Verified · Seeker</div>
                </div>
              </div>
            </div>
            <nav className="flex-1 px-3 py-3">
              {sideMenuLinks.map((link) => (
                <Link key={link.to} to={link.to} onClick={() => setMenuOpen(false)}
                  className={`flex items-center px-3 py-2.5 rounded-xl text-sm font-medium mb-0.5 transition-colors ${path === link.to ? "bg-[#1a56f0]/10 text-[#1a56f0]" : "text-gray-600 hover:bg-gray-100"}`}>
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="px-5 py-4 border-t border-gray-100">
              <Link to="/login" onClick={() => setMenuOpen(false)} className="block text-center text-sm font-semibold text-red-500">Logout</Link>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-lg mx-auto w-full pb-20">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 shadow-lg">
        <div className="max-w-lg mx-auto flex">
          {navItems.map(({ to, icon: Icon, label }) => {
            const active = to === "/" ? path === "/" : path.startsWith(to);
            return (
              <Link key={to} to={to} className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-colors ${active ? "text-[#1a56f0]" : "text-gray-400"}`}>
                {to === "/post-ad" ? (
                  <div className="w-10 h-10 rounded-full bg-[#1a56f0] flex items-center justify-center shadow-md -mt-4">
                    <Plus size={20} className="text-white" />
                  </div>
                ) : (
                  <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
                )}
                <span className="text-[10px] font-semibold leading-none">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
