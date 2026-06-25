import { ArrowLeft, ChevronRight, Shield, Globe, Lock, Eye, HelpCircle, LogOut, User, CreditCard, Star, Loader2, Save, X } from "lucide-react";
import { useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { COUNTRIES } from "../lib/mockData";

interface ProfileInfo {
  full_name: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  kyc_level: number;
  kyc_status: string;
  trust_score: number;
}

export function Settings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileInfo | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Edit mode
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editCountry, setEditCountry] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Password change
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const [notifications, setNotifications] = useState({
    messages: true, escrow: true, kyc: true, promotions: false, reviews: true,
  });
  const [language, setLanguage] = useState("English");
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const LANGUAGES = ["English", "اردو (Urdu)", "العربية (Arabic)", "Français", "Deutsch", "Türkçe"];

  useEffect(() => { void loadProfile(); }, []);

  async function loadProfile() {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) { setLoading(false); void navigate({ to: "/login" }); return; }
    setUserId(userData.user.id);
    const { data } = await supabase
      .from("profiles")
      .select("full_name, email, phone, country, kyc_level, kyc_status, trust_score")
      .eq("id", userData.user.id)
      .single();
    setProfile(data ?? null);
    if (data) {
      setEditName(data.full_name ?? "");
      setEditPhone(data.phone ?? "");
      setEditCountry(data.country ?? "");
    }
    setLoading(false);
  }

  async function saveProfile() {
    if (!userId) return;
    if (!editName.trim()) { return; }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: editName.trim(), phone: editPhone.trim(), country: editCountry })
      .eq("id", userId);
    if (!error) {
      setProfile((prev) => prev ? { ...prev, full_name: editName.trim(), phone: editPhone.trim(), country: editCountry } : prev);
      setSaveSuccess(true);
      setTimeout(() => { setSaveSuccess(false); setEditMode(false); }, 1500);
    }
    setSaving(false);
  }

  async function changePassword() {
    setPasswordError("");
    if (newPassword.length < 8) { setPasswordError("Password must be at least 8 characters"); return; }
    if (newPassword !== confirmPassword) { setPasswordError("Passwords do not match"); return; }
    setPasswordSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) { setPasswordError(error.message); }
    else {
      setPasswordSuccess(true);
      setNewPassword(""); setConfirmPassword("");
      setTimeout(() => { setPasswordSuccess(false); setShowPasswordForm(false); }, 2000);
    }
    setPasswordSaving(false);
  }

  async function handleLogout() {
    setLoggingOut(true);
    await supabase.auth.signOut();
    void navigate({ to: "/login" });
  }

  if (loading) {
    return <div className="flex items-center justify-center py-24"><Loader2 className="animate-spin text-gray-300" size={28} /></div>;
  }

  const displayName = profile?.full_name || "Unnamed User";
  const initial = displayName[0]?.toUpperCase() ?? "?";
  const verified = profile?.kyc_status === "approved";

  return (
    <div className="flex flex-col pb-8">

      {/* HEADER */}
      <div className="bg-white px-4 py-3 flex items-center gap-2 border-b border-gray-100">
        <button onClick={() => void navigate({ to: "/" })} className="p-1.5 rounded-full hover:bg-gray-100">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <span className="font-bold text-gray-800 text-sm flex-1">Settings</span>
      </div>

      {/* PROFILE CARD */}
      <div className="mx-4 mt-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#004B49] to-[#00746f] flex items-center justify-center text-white font-black text-lg flex-shrink-0">
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-gray-800">{displayName}</div>
              <div className="text-xs text-gray-500 mt-0.5">{profile?.email}</div>
              <div className="flex items-center gap-2 mt-1.5">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${verified ? "bg-green-50 text-green-600 border-green-100" : "bg-gray-50 text-gray-500 border-gray-200"}`}>
                  {verified ? `✓ KYC L${profile?.kyc_level}` : "Unverified"}
                </span>
                <span className="bg-[#E8F0EF] text-[#004B49] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#004B49]/15">
                  Trust: {profile?.trust_score ?? 50}
                </span>
              </div>
            </div>
            <button onClick={() => setEditMode(!editMode)}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${editMode ? "bg-gray-100 text-gray-500" : "bg-[#004B49] text-white"}`}>
              {editMode ? "Cancel" : "✏️ Edit"}
            </button>
          </div>

          {/* EDIT FORM */}
          {editMode && (
            <div className="border-t border-gray-50 pt-3 flex flex-col gap-3">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Full Name *</label>
                <input value={editName} onChange={(e) => setEditName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-[#004B49]" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Phone Number</label>
                <input value={editPhone} onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="+92 300 0000000"
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-[#004B49]" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Country</label>
                <select value={editCountry} onChange={(e) => setEditCountry(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-[#004B49]">
                  <option value="">Select country...</option>
                  {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {saveSuccess ? (
                <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 text-xs font-bold text-green-600 text-center">
                  ✅ Profile updated successfully!
                </div>
              ) : (
                <button onClick={() => void saveProfile()} disabled={saving || !editName.trim()}
                  className="w-full bg-[#004B49] text-white font-bold py-3 rounded-xl text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><Save size={14} /> Save Changes</>}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ACCOUNT SECTION */}
      <div className="mx-4 mt-4">
        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">Account</div>
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {[
            { icon: Shield, label: "KYC Verification", color: "bg-green-50 text-green-500", link: "/kyc" as const, badge: `L${profile?.kyc_level ?? 0}` },
            { icon: CreditCard, label: "Wallet & Payments", color: "bg-[#FBF3E1] text-[#9c7a1f]", link: "/wallet" as const },
            { icon: Star, label: "My Transactions", color: "bg-purple-50 text-purple-500", link: "/transactions" as const },
          ].map((item, i, arr) => (
            <div key={item.label}>
              <Link to={item.link}>
                <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-all">
                  <div className={`w-9 h-9 rounded-xl ${item.color} flex items-center justify-center flex-shrink-0`}>
                    <item.icon size={17} />
                  </div>
                  <span className="flex-1 text-sm font-medium text-gray-700">{item.label}</span>
                  {"badge" in item && item.badge && (
                    <span className="text-[10px] font-bold bg-[#E8F0EF] text-[#004B49] px-2 py-0.5 rounded-full mr-1">{item.badge}</span>
                  )}
                  <ChevronRight size={16} className="text-gray-300" />
                </div>
              </Link>
              {i < arr.length - 1 && <div className="h-px bg-gray-50 ml-16" />}
            </div>
          ))}
        </div>
      </div>

      {/* SECURITY */}
      <div className="mx-4 mt-4">
        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">Security</div>
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <button onClick={() => setShowPasswordForm(!showPasswordForm)}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-all">
            <div className="w-9 h-9 rounded-xl bg-red-50 text-red-500 flex items-center justify-center flex-shrink-0">
              <Lock size={17} />
            </div>
            <span className="flex-1 text-sm font-medium text-gray-700 text-left">Change Password</span>
            <ChevronRight size={16} className={`text-gray-300 transition-transform ${showPasswordForm ? "rotate-90" : ""}`} />
          </button>

          {showPasswordForm && (
            <div className="border-t border-gray-50 px-4 pb-4 pt-3 flex flex-col gap-3">
              {passwordError && (
                <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2 text-xs font-semibold text-red-500">
                  ⚠️ {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div className="bg-green-50 border border-green-100 rounded-xl px-3 py-2 text-xs font-bold text-green-600">
                  ✅ Password changed successfully!
                </div>
              )}
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">New Password</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#004B49]" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Confirm New Password</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#004B49]" />
              </div>
              <button onClick={() => void changePassword()} disabled={passwordSaving || !newPassword || !confirmPassword}
                className="w-full bg-red-500 text-white font-bold py-3 rounded-xl text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                {passwordSaving ? <><Loader2 size={14} className="animate-spin" /> Changing...</> : "Change Password"}
              </button>
            </div>
          )}

          <div className="h-px bg-gray-50 ml-16" />

          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center flex-shrink-0">
              <Eye size={17} />
            </div>
            <span className="flex-1 text-sm font-medium text-gray-700">Two-Factor Authentication</span>
            <button onClick={() => alert("Coming soon!")} className="w-11 h-6 rounded-full bg-gray-200 relative">
              <div className="w-5 h-5 bg-white rounded-full shadow absolute left-0.5 top-0.5" />
            </button>
          </div>
        </div>
      </div>

      {/* NOTIFICATIONS */}
      <div className="mx-4 mt-4">
        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">Notifications</div>
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {[
            { key: "messages",    label: "New Messages",    icon: "💬" },
            { key: "escrow",      label: "Escrow Updates",  icon: "🔒" },
            { key: "kyc",         label: "KYC Status",      icon: "✅" },
            { key: "reviews",     label: "Reviews & Ratings", icon: "⭐" },
            { key: "promotions",  label: "Promotions",      icon: "🎁" },
          ].map((item, i, arr) => (
            <div key={item.key}>
              <div className="flex items-center gap-3 px-4 py-3.5">
                <span className="text-lg w-9 text-center flex-shrink-0">{item.icon}</span>
                <span className="flex-1 text-sm font-medium text-gray-700">{item.label}</span>
                <button
                  onClick={() => setNotifications((n) => ({ ...n, [item.key]: !n[item.key as keyof typeof n] }))}
                  className={`w-11 h-6 rounded-full relative transition-all ${notifications[item.key as keyof typeof notifications] ? "bg-[#004B49]" : "bg-gray-200"}`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow absolute top-0.5 transition-all ${notifications[item.key as keyof typeof notifications] ? "right-0.5" : "left-0.5"}`} />
                </button>
              </div>
              {i < arr.length - 1 && <div className="h-px bg-gray-50 ml-16" />}
            </div>
          ))}
        </div>
      </div>

      {/* LANGUAGE */}
      <div className="mx-4 mt-4">
        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">Preferences</div>
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <button onClick={() => setShowLangPicker(!showLangPicker)} className="w-full flex items-center gap-3 px-4 py-3.5">
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
                <button key={lang} onClick={() => { setLanguage(lang); setShowLangPicker(false); }}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                  <span className="text-sm text-gray-700">{lang}</span>
                  {language === lang && <span className="text-[#004B49] text-xs font-bold">✓</span>}
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
        <button onClick={() => void handleLogout()} disabled={loggingOut}
          className="w-full bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center justify-center gap-2 disabled:opacity-60">
          <LogOut size={16} className="text-red-500" />
          <span className="text-sm font-bold text-red-500">{loggingOut ? "Logging out..." : "Logout"}</span>
        </button>
      </div>

      <div className="text-center mt-4">
        <span className="text-[10px] text-gray-300">Crossingate v1.0 · crossingate.com</span>
      </div>
    </div>
  );
}
