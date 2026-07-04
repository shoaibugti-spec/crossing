import {
  Ban, CheckCircle, Loader2, Lock, Shield, Users, XCircle,
  ArrowDownLeft, ArrowUpRight, HeadphonesIcon, Send, FileText, Megaphone,
  Scale, RefreshCw, X, Building2,
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "../lib/supabaseClient";

interface SupportConv {
  id: string; conversation_id: string; user_id: string;
  user_name: string; user_email: string; message: string;
  status: string; created_at: string;
}
interface SupportReply {
  id: string; text: string; from_role: "user" | "admin"; created_at: string;
}

async function sendNotification(userId: string, type: string, title: string, body: string, link?: string) {
  await supabase.from("notifications").insert({ user_id: userId, type, title, body, link: link ?? null, is_read: false });
}

type TabKey = "kyc" | "business" | "deposits" | "withdrawals" | "services" | "support" | "ads" | "users" | "disputes";

export function AdminDashboard() {
  const navigate = useNavigate();
  const [accessChecked, setAccessChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminId, setAdminId] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [kycUsers, setKycUsers] = useState<any[]>([]);
  const [bizVerifications, setBizVerifications] = useState<any[]>([]);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [adminAds, setAdminAds] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [providerServices, setProviderServices] = useState<any[]>([]);
  const [supportConvs, setSupportConvs] = useState<SupportConv[]>([]);

  const [activeTab, setActiveTab] = useState<TabKey>("kyc");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  const [rejectKycId, setRejectKycId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const [rejectBizId, setRejectBizId] = useState<string | null>(null);
  const [bizRejectReason, setBizRejectReason] = useState("");

  const [confirmingDeposit, setConfirmingDeposit] = useState<any | null>(null);
  const [depositAmount, setDepositAmount] = useState("");

  const [confirmingWithdraw, setConfirmingWithdraw] = useState<any | null>(null);

  const [updatingDispute, setUpdatingDispute] = useState<any | null>(null);
  const [disputeStatus, setDisputeStatus] = useState("under_review");
  const [disputeNotes, setDisputeNotes] = useState("");

  const [selectedConv, setSelectedConv] = useState<SupportConv | null>(null);
  const [convReplies, setConvReplies] = useState<SupportReply[]>([]);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { void checkAccess(); }, []);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [convReplies]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  async function checkAccess() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) { setAccessChecked(true); void navigate({ to: "/login" }); return; }
    setAdminId(userData.user.id);
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", userData.user.id).single();
    if (profile?.role === "admin") { setIsAdmin(true); void loadAllData(); }
    setAccessChecked(true);
  }

  async function loadAllData() {
    setLoadingData(true);
    const [kyc, biz, users, ads, disputesData, depositsData, withdrawalsData, servicesData, supportData] = await Promise.all([
      supabase.from("kyc_submissions").select("id, user_id, full_name, document_type, submitted_at, status, document_front_url, document_back_url, selfie_url, face_video_url, rejection_reason").order("submitted_at", { ascending: false }),
      supabase.from("business_verifications").select("id, user_id, company_name, registration_number, license_doc_url, registration_doc_url, status, rejection_reason, submitted_at").order("submitted_at", { ascending: false }),
      supabase.from("profiles").select("id, full_name, email, role, kyc_status, business_status, trust_score, is_suspended, created_at, country").order("created_at", { ascending: false }),
      supabase.from("ads").select("id, title, country, status, created_at, provider_id").order("created_at", { ascending: false }),
      supabase.from("disputes").select("id, transaction_id, reason, status, created_at, filed_by").order("created_at", { ascending: false }),
      supabase.from("wallet_transactions").select("id, user_id, amount, status, notes, receipt_url, created_at").eq("type", "deposit").order("created_at", { ascending: false }),
      supabase.from("wallet_transactions").select("id, user_id, amount, status, notes, created_at").eq("type", "withdrawal").order("created_at", { ascending: false }),
      supabase.from("provider_services").select("id, provider_id, origin_country, destination_country, visa_category, min_price, max_price, capacity, status, created_at").order("created_at", { ascending: false }),
      supabase.from("support_messages").select("id, conversation_id, user_id, user_name, user_email, message, status, created_at").order("created_at", { ascending: false }),
    ]);

    const usersList = users.data ?? [];
    const nameById: Record<string, string> = {};
    usersList.forEach((u: any) => { nameById[u.id] = u.full_name ?? "User"; });

    setKycUsers(kyc.data ?? []);
    setBizVerifications(biz.data ?? []);
    setAdminUsers(usersList);
    setAdminAds((ads.data ?? []).map((a: any) => ({ ...a, profiles: { full_name: nameById[a.provider_id] ?? "—" } })));
    setDisputes(disputesData.data ?? []);
    setDeposits((depositsData.data ?? []).map((d: any) => ({ ...d, profiles: { full_name: nameById[d.user_id] ?? "User" } })));
    setWithdrawals((withdrawalsData.data ?? []).map((w: any) => ({ ...w, profiles: { full_name: nameById[w.user_id] ?? "User" } })));
    setProviderServices((servicesData.data ?? []).map((s: any) => ({ ...s, profiles: { full_name: nameById[s.provider_id] ?? "—" } })));
    setSupportConvs((supportData.data ?? []) as SupportConv[]);
    setLoadingData(false);
    setRefreshing(false);
  }

  // ── KYC ──
  async function approveKYC(kyc: any) {
    setProcessingId(kyc.id);
    await supabase.from("kyc_submissions").update({ status: "approved", reviewed_at: new Date().toISOString() }).eq("id", kyc.id);
    await supabase.from("profiles").update({ kyc_status: "approved", kyc_level: 3 }).eq("id", kyc.user_id);
    await sendNotification(kyc.user_id, "kyc", "✅ KYC Approved!", "Your identity has been verified. You can now use all features.", "/");
    setKycUsers((p) => p.map((u) => u.id === kyc.id ? { ...u, status: "approved" } : u));
    setProcessingId(null);
    showToast("✅ KYC Approved");
  }

  async function rejectKYC(kyc: any) {
    if (!rejectReason.trim()) { showToast("⚠️ Pehle reason likhen"); return; }
    setProcessingId(kyc.id);
    await supabase.from("kyc_submissions").update({ status: "rejected", reviewed_at: new Date().toISOString(), rejection_reason: rejectReason.trim() }).eq("id", kyc.id);
    await supabase.from("profiles").update({ kyc_status: "rejected", kyc_level: 0 }).eq("id", kyc.user_id);
    await sendNotification(kyc.user_id, "dispute", "❌ KYC Rejected", `Reason: ${rejectReason.trim()}. Please fix and resubmit.`, "/kyc");
    setKycUsers((p) => p.map((u) => u.id === kyc.id ? { ...u, status: "rejected", rejection_reason: rejectReason.trim() } : u));
    setRejectKycId(null);
    setRejectReason("");
    setProcessingId(null);
    showToast("❌ KYC Rejected");
  }

  // ── Business Verification ──
  async function approveBusiness(bv: any) {
    setProcessingId(bv.id);
    await supabase.from("business_verifications").update({ status: "approved", reviewed_at: new Date().toISOString() }).eq("id", bv.id);
    await supabase.from("profiles").update({ business_status: "approved" }).eq("id", bv.user_id);
    await sendNotification(bv.user_id, "kyc", "✅ Business Verified!", `"${bv.company_name}" has been verified. All 4 levels complete — you can now post ads!`, "/kyc");
    setBizVerifications((p) => p.map((b) => b.id === bv.id ? { ...b, status: "approved" } : b));
    setProcessingId(null);
    showToast("✅ Business Approved");
  }

  async function rejectBusiness(bv: any) {
    if (!bizRejectReason.trim()) { showToast("⚠️ Pehle reason likhen"); return; }
    setProcessingId(bv.id);
    await supabase.from("business_verifications").update({ status: "rejected", reviewed_at: new Date().toISOString(), rejection_reason: bizRejectReason.trim() }).eq("id", bv.id);
    await supabase.from("profiles").update({ business_status: "rejected" }).eq("id", bv.user_id);
    await sendNotification(bv.user_id, "dispute", "❌ Business Verification Rejected", `Reason: ${bizRejectReason.trim()}. Please fix and resubmit.`, "/kyc");
    setBizVerifications((p) => p.map((b) => b.id === bv.id ? { ...b, status: "rejected", rejection_reason: bizRejectReason.trim() } : b));
    setRejectBizId(null);
    setBizRejectReason("");
    setProcessingId(null);
    showToast("❌ Business Rejected");
  }

  // ── Deposits ──
  async function confirmDeposit() {
    if (!confirmingDeposit) return;
    const amt = Number(depositAmount) || confirmingDeposit.amount;
    setProcessingId(confirmingDeposit.id);
    await supabase.from("wallet_transactions").update({ status: "completed" }).eq("id", confirmingDeposit.id);
    const { data: prof } = await supabase.from("profiles").select("wallet_balance").eq("id", confirmingDeposit.user_id).single();
    const newBal = Number(prof?.wallet_balance ?? 0) + amt;
    await supabase.from("profiles").update({ wallet_balance: newBal }).eq("id", confirmingDeposit.user_id);
    await sendNotification(confirmingDeposit.user_id, "wallet", "💰 Deposit Confirmed!", `$${amt} USDT credited. New balance: $${newBal.toFixed(2)}.`, "/wallet");
    setDeposits((p) => p.map((d) => d.id === confirmingDeposit.id ? { ...d, status: "completed" } : d));
    setConfirmingDeposit(null);
    setDepositAmount("");
    setProcessingId(null);
    showToast("✅ Deposit confirmed");
  }

  async function rejectDeposit(d: any) {
    setProcessingId(d.id);
    await supabase.from("wallet_transactions").update({ status: "rejected" }).eq("id", d.id);
    await sendNotification(d.user_id, "dispute", "❌ Deposit Rejected", "Your deposit was rejected. Please check and try again.", "/wallet");
    setDeposits((p) => p.map((x) => x.id === d.id ? { ...x, status: "rejected" } : x));
    setProcessingId(null);
    showToast("❌ Deposit rejected");
  }

  // ── Withdrawals ──
  async function confirmWithdrawal() {
    if (!confirmingWithdraw) return;
    setProcessingId(confirmingWithdraw.id);
    await supabase.from("wallet_transactions").update({ status: "completed" }).eq("id", confirmingWithdraw.id);
    const { data: prof } = await supabase.from("profiles").select("wallet_balance").eq("id", confirmingWithdraw.user_id).single();
    const newBal = Math.max(0, Number(prof?.wallet_balance ?? 0) - Math.abs(confirmingWithdraw.amount));
    await supabase.from("profiles").update({ wallet_balance: newBal }).eq("id", confirmingWithdraw.user_id);
    await sendNotification(confirmingWithdraw.user_id, "wallet", "✅ Withdrawal Sent!", `$${Math.abs(confirmingWithdraw.amount)} USDT sent to your wallet.`, "/wallet");
    setWithdrawals((p) => p.map((w) => w.id === confirmingWithdraw.id ? { ...w, status: "completed" } : w));
    setConfirmingWithdraw(null);
    setProcessingId(null);
    showToast("✅ Withdrawal confirmed");
  }

  async function rejectWithdrawal(w: any) {
    setProcessingId(w.id);
    await supabase.from("wallet_transactions").update({ status: "rejected" }).eq("id", w.id);
    await sendNotification(w.user_id, "dispute", "❌ Withdrawal Rejected", "Funds remain in your wallet.", "/wallet");
    setWithdrawals((p) => p.map((x) => x.id === w.id ? { ...x, status: "rejected" } : x));
    setProcessingId(null);
    showToast("❌ Withdrawal rejected");
  }

  // ── Services ──
  async function approveService(s: any) {
    setProcessingId(s.id);
    await supabase.from("provider_services").update({ status: "approved" }).eq("id", s.id);
    await sendNotification(s.provider_id, "success", "✅ Service Approved!", "Your visa service is live. Post your first ad!", "/post-ad");
    setProviderServices((p) => p.map((x) => x.id === s.id ? { ...x, status: "approved" } : x));
    setProcessingId(null);
    showToast("✅ Service approved");
  }

  async function rejectService(s: any) {
    setProcessingId(s.id);
    await supabase.from("provider_services").update({ status: "rejected" }).eq("id", s.id);
    await sendNotification(s.provider_id, "dispute", "❌ Service Rejected", "Please review and resubmit.", "/setup-services");
    setProviderServices((p) => p.map((x) => x.id === s.id ? { ...x, status: "rejected" } : x));
    setProcessingId(null);
    showToast("❌ Service rejected");
  }

  // ── Users ──
  async function suspendUser(u: any) {
    await supabase.from("profiles").update({ is_suspended: true }).eq("id", u.id);
    await sendNotification(u.id, "dispute", "🚫 Account Suspended", "Contact support for details.", "/help");
    setAdminUsers((p) => p.map((x) => x.id === u.id ? { ...x, is_suspended: true } : x));
    showToast("🚫 User suspended");
  }

  async function restoreUser(u: any) {
    await supabase.from("profiles").update({ is_suspended: false }).eq("id", u.id);
    await sendNotification(u.id, "success", "✅ Account Restored", "You can use Crossingate normally now.", "/");
    setAdminUsers((p) => p.map((x) => x.id === u.id ? { ...x, is_suspended: false } : x));
    showToast("✅ User restored");
  }

  // ── Ads ──
  async function approveAd(ad: any) {
    await supabase.from("ads").update({ status: "active" }).eq("id", ad.id);
    await sendNotification(ad.provider_id, "success", "✅ Ad Live!", `"${ad.title}" is now live.`, "/my-ads");
    setAdminAds((p) => p.map((a) => a.id === ad.id ? { ...a, status: "active" } : a));
    showToast("✅ Ad approved");
  }

  async function suspendAd(ad: any) {
    await supabase.from("ads").update({ status: "suspended" }).eq("id", ad.id);
    await sendNotification(ad.provider_id, "dispute", "⚠️ Ad Suspended", `"${ad.title}" was suspended.`, "/help");
    setAdminAds((p) => p.map((a) => a.id === ad.id ? { ...a, status: "suspended" } : a));
    showToast("⚠️ Ad suspended");
  }

  // ── Disputes ──
  async function saveDispute() {
    if (!updatingDispute) return;
    await supabase.from("disputes").update({ status: disputeStatus, admin_notes: disputeNotes }).eq("id", updatingDispute.id);
    const label = disputeStatus === "resolved_buyer" ? "Resolved in your favor ✅" : disputeStatus === "resolved_seller" ? "Resolved in favor of provider" : disputeStatus.replace("_", " ");
    await sendNotification(updatingDispute.filed_by, "dispute", "⚖️ Dispute Update", `Status: ${label}.`, "/disputes");
    setDisputes((p) => p.map((d) => d.id === updatingDispute.id ? { ...d, status: disputeStatus } : d));
    setUpdatingDispute(null);
    setDisputeNotes("");
    showToast("⚖️ Dispute updated");
  }

  // ── Support ──
  async function openConversation(conv: SupportConv) {
    setSelectedConv(conv);
    const { data } = await supabase.from("support_replies").select("id, text, from_role, created_at").eq("conversation_id", conv.conversation_id).order("created_at", { ascending: true });
    setConvReplies((data ?? []) as SupportReply[]);
    supabase.channel(`admin_support_${conv.conversation_id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_replies", filter: `conversation_id=eq.${conv.conversation_id}` }, (payload) => {
        const m = payload.new as SupportReply;
        setConvReplies((prev) => prev.find((x) => x.id === m.id) ? prev : [...prev, m]);
      }).subscribe();
    await supabase.from("support_messages").update({ status: "read" }).eq("conversation_id", conv.conversation_id);
    setSupportConvs((p) => p.map((c) => c.conversation_id === conv.conversation_id ? { ...c, status: "read" } : c));
  }

  async function sendReply() {
    if (!replyText.trim() || !selectedConv || !adminId || sendingReply) return;
    setSendingReply(true);
    const text = replyText.trim();
    setReplyText("");
    await supabase.from("support_replies").insert({ conversation_id: selectedConv.conversation_id, message_id: selectedConv.id, text, from_role: "admin", user_id: adminId });
    await supabase.from("support_messages").update({ status: "replied" }).eq("conversation_id", selectedConv.conversation_id);
    setSupportConvs((p) => p.map((c) => c.conversation_id === selectedConv.conversation_id ? { ...c, status: "replied" } : c));
    await sendNotification(selectedConv.user_id, "message", "💬 Support Reply", `Admin: "${text.slice(0, 60)}"`, "/help");
    setSendingReply(false);
  }

  const cnt = {
    kyc: kycUsers.filter((u) => u.status === "pending").length,
    business: bizVerifications.filter((b) => b.status === "pending").length,
    deposits: deposits.filter((d) => d.status === "pending").length,
    withdrawals: withdrawals.filter((w) => w.status === "pending").length,
    services: providerServices.filter((s) => s.status === "pending").length,
    support: supportConvs.filter((s) => s.status === "open").length,
    disputes: disputes.filter((d) => d.status === "open" || d.status === "under_review").length,
    suspended: adminUsers.filter((u) => u.is_suspended).length,
  };

  const TABS: { key: TabKey; label: string; icon: any; badge: number }[] = [
    { key: "kyc", label: "KYC", icon: Shield, badge: cnt.kyc },
    { key: "business", label: "Business", icon: Building2, badge: cnt.business },
    { key: "deposits", label: "Deposits", icon: ArrowDownLeft, badge: cnt.deposits },
    { key: "withdrawals", label: "Withdraw", icon: ArrowUpRight, badge: cnt.withdrawals },
    { key: "services", label: "Services", icon: FileText, badge: cnt.services },
    { key: "support", label: "Support", icon: HeadphonesIcon, badge: cnt.support },
    { key: "ads", label: "Ads", icon: Megaphone, badge: 0 },
    { key: "users", label: "Users", icon: Users, badge: cnt.suspended },
    { key: "disputes", label: "Disputes", icon: Scale, badge: cnt.disputes },
  ];

  const statusPill = (s: string) => {
    const map: Record<string, string> = {
      pending: "bg-[#FBF3E1] text-[#9c7a1f]",
      approved: "bg-green-50 text-green-600",
      completed: "bg-green-50 text-green-600",
      active: "bg-green-50 text-green-600",
      rejected: "bg-red-50 text-red-500",
      suspended: "bg-red-50 text-red-500",
      open: "bg-blue-50 text-blue-600",
      under_review: "bg-[#FBF3E1] text-[#9c7a1f]",
      pending_review: "bg-[#FBF3E1] text-[#9c7a1f]",
    };
    return (
      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full capitalize ${map[s] ?? "bg-gray-100 text-gray-500"}`}>
        {s.replace("_", " ")}
      </span>
    );
  };

  if (!accessChecked) return <div className="flex items-center justify-center py-24"><Loader2 className="animate-spin text-gray-300" size={28} /></div>;

  if (!isAdmin) return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
      <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4"><Lock size={28} className="text-red-400" /></div>
      <div className="font-black text-gray-800 text-lg mb-1">Access Denied</div>
      <div className="text-sm text-gray-500">Restricted to Crossingate administrators only.</div>
    </div>
  );

  return (
    <div className="flex flex-col pb-8">

      {toast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[100] bg-gray-900 text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-2xl">
          {toast}
        </div>
      )}

      <div className="bg-white px-4 py-3 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#004B49] flex items-center justify-center">
            <Shield size={16} className="text-[#D4AF37]" />
          </div>
          <span className="font-black text-gray-800">Admin Dashboard</span>
        </div>
        <button onClick={() => { setRefreshing(true); void loadAllData(); }}
          className="w-9 h-9 rounded-full hover:bg-gray-50 flex items-center justify-center">
          <RefreshCw size={17} className={`text-gray-500 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Stats — 8 boxes */}
      <div className="grid grid-cols-4 gap-2 px-4 mt-4">
        {[
          { label: "Users", value: adminUsers.length, color: "text-[#004B49]", bg: "bg-[#E8F0EF]" },
          { label: "KYC", value: cnt.kyc, color: "text-[#9c7a1f]", bg: "bg-[#FBF3E1]" },
          { label: "Business", value: cnt.business, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Deposits", value: cnt.deposits, color: "text-green-600", bg: "bg-green-50" },
          { label: "Withdraw", value: cnt.withdrawals, color: "text-orange-500", bg: "bg-orange-50" },
          { label: "Services", value: cnt.services, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Support", value: cnt.support, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "Disputes", value: cnt.disputes, color: "text-red-500", bg: "bg-red-50" },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-2xl py-3 text-center`}>
            <div className={`font-black text-xl ${s.color}`}>{s.value}</div>
            <div className="text-[10px] text-gray-500 font-semibold mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs — grid, no scroll */}
      <div className="grid grid-cols-3 gap-2 px-4 mt-4">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`relative flex flex-col items-center gap-1 py-2.5 rounded-2xl text-[10px] font-bold transition-all ${
              activeTab === t.key ? "bg-[#004B49] text-white shadow-md" : "bg-white text-gray-500 border border-gray-100"
            }`}>
            <t.icon size={15} />
            {t.label}
            {t.badge > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full text-[9px] font-black flex items-center justify-center px-1 bg-red-500 text-white border-2 border-white">
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {loadingData ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-gray-300" size={28} /></div>
      ) : (
        <div className="px-4 mt-4 flex flex-col gap-3">

          {/* ══ KYC ══ */}
          {activeTab === "kyc" && (
            kycUsers.length === 0 ? <EmptyState text="No KYC submissions yet" /> :
            kycUsers.map((k) => (
              <div key={k.id} className="bg-white rounded-2xl shadow-sm p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-bold text-gray-800 text-sm">{k.full_name}</div>
                    <div className="text-[11px] text-gray-400 capitalize">{k.document_type} · {new Date(k.submitted_at).toLocaleDateString()}</div>
                  </div>
                  {statusPill(k.status)}
                </div>

                <div className="flex gap-2 mb-3">
                  {k.document_front_url && (
                    <a href={k.document_front_url} target="_blank" rel="noopener noreferrer" className="flex-1">
                      <div className="relative">
                        <img src={k.document_front_url} alt="doc" className="w-full h-20 rounded-xl object-cover border border-gray-100" />
                        <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[8px] font-bold px-1.5 py-0.5 rounded">DOC</span>
                      </div>
                    </a>
                  )}
                  {k.selfie_url && (
                    <a href={k.selfie_url} target="_blank" rel="noopener noreferrer" className="flex-1">
                      <div className="relative">
                        <img src={k.selfie_url} alt="selfie" className="w-full h-20 rounded-xl object-cover border border-gray-100" />
                        <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[8px] font-bold px-1.5 py-0.5 rounded">SELFIE</span>
                      </div>
                    </a>
                  )}
                  {k.face_video_url && (
                    <a href={k.face_video_url} target="_blank" rel="noopener noreferrer" className="flex-1">
                      <div className="w-full h-20 rounded-xl bg-gray-900 flex flex-col items-center justify-center">
                        <span className="text-white text-lg">▶</span>
                        <span className="text-white/60 text-[8px] font-bold">VIDEO</span>
                      </div>
                    </a>
                  )}
                </div>

                {k.rejection_reason && k.status === "rejected" && (
                  <div className="bg-red-50 rounded-xl px-3 py-2 text-[11px] text-red-500 mb-3">
                    <b>Rejected:</b> {k.rejection_reason}
                  </div>
                )}

                {k.status === "pending" && (
                  <>
                    {rejectKycId === k.id ? (
                      <div className="flex flex-col gap-2">
                        <div className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Rejection Reason likhen:</div>
                        <div className="flex items-center gap-2">
                          <input
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="e.g. Document not clear..."
                            autoFocus
                            className="flex-1 bg-red-50 border border-red-200 rounded-xl px-3 py-3 text-sm text-gray-800 outline-none focus:border-red-400" />
                          <button onClick={() => void rejectKYC(k)}
                            disabled={!rejectReason.trim() || processingId === k.id}
                            className="bg-red-500 text-white text-xs font-bold px-4 py-3 rounded-xl disabled:opacity-50 flex-shrink-0">
                            {processingId === k.id ? <Loader2 size={13} className="animate-spin" /> : "Reject"}
                          </button>
                          <button onClick={() => { setRejectKycId(null); setRejectReason(""); }}
                            className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0">
                            <X size={15} className="text-gray-400" />
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {["Document not clear", "Selfie doesn't match", "Document expired", "Poor lighting"].map((r) => (
                            <button key={r} onClick={() => setRejectReason(r)}
                              className="text-[10px] bg-gray-50 text-gray-500 px-2.5 py-1 rounded-full border border-gray-100">
                              {r}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button onClick={() => void approveKYC(k)} disabled={processingId === k.id}
                          className="flex-1 bg-[#004B49] text-white text-xs font-bold py-3 rounded-xl flex items-center justify-center gap-1.5 disabled:opacity-60">
                          {processingId === k.id ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />} Approve
                        </button>
                        <button onClick={() => { setRejectKycId(k.id); setRejectReason(""); }}
                          className="flex-1 bg-red-50 text-red-500 border border-red-100 text-xs font-bold py-3 rounded-xl flex items-center justify-center gap-1.5">
                          <XCircle size={13} /> Reject
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))
          )}

          {/* ══ BUSINESS ══ */}
          {activeTab === "business" && (
            bizVerifications.length === 0 ? <EmptyState text="No business verifications yet" /> :
            bizVerifications.map((b) => (
              <div key={b.id} className="bg-white rounded-2xl shadow-sm p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-bold text-gray-800 text-sm">{b.company_name}</div>
                    <div className="text-[11px] text-gray-400">
                      {b.registration_number ? `Reg#: ${b.registration_number} · ` : ""}{new Date(b.submitted_at).toLocaleDateString()}
                    </div>
                  </div>
                  {statusPill(b.status)}
                </div>

                <div className="flex gap-2 mb-3">
                  {b.license_doc_url && (
                    <a href={b.license_doc_url} target="_blank" rel="noopener noreferrer" className="flex-1">
                      <div className="relative">
                        <img src={b.license_doc_url} alt="license" className="w-full h-24 rounded-xl object-cover border border-gray-100" />
                        <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[8px] font-bold px-1.5 py-0.5 rounded">LICENSE</span>
                      </div>
                    </a>
                  )}
                  {b.registration_doc_url && (
                    <a href={b.registration_doc_url} target="_blank" rel="noopener noreferrer" className="flex-1">
                      <div className="relative">
                        <img src={b.registration_doc_url} alt="registration" className="w-full h-24 rounded-xl object-cover border border-gray-100" />
                        <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[8px] font-bold px-1.5 py-0.5 rounded">REG DOC</span>
                      </div>
                    </a>
                  )}
                </div>

                {b.rejection_reason && b.status === "rejected" && (
                  <div className="bg-red-50 rounded-xl px-3 py-2 text-[11px] text-red-500 mb-3">
                    <b>Rejected:</b> {b.rejection_reason}
                  </div>
                )}

                {b.status === "pending" && (
                  <>
                    {rejectBizId === b.id ? (
                      <div className="flex flex-col gap-2">
                        <div className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Rejection Reason likhen:</div>
                        <div className="flex items-center gap-2">
                          <input
                            value={bizRejectReason}
                            onChange={(e) => setBizRejectReason(e.target.value)}
                            placeholder="e.g. License not readable..."
                            autoFocus
                            className="flex-1 bg-red-50 border border-red-200 rounded-xl px-3 py-3 text-sm text-gray-800 outline-none focus:border-red-400" />
                          <button onClick={() => void rejectBusiness(b)}
                            disabled={!bizRejectReason.trim() || processingId === b.id}
                            className="bg-red-500 text-white text-xs font-bold px-4 py-3 rounded-xl disabled:opacity-50 flex-shrink-0">
                            {processingId === b.id ? <Loader2 size={13} className="animate-spin" /> : "Reject"}
                          </button>
                          <button onClick={() => { setRejectBizId(null); setBizRejectReason(""); }}
                            className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0">
                            <X size={15} className="text-gray-400" />
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {["License not readable", "Registration doc missing", "Company name mismatch", "Document expired"].map((r) => (
                            <button key={r} onClick={() => setBizRejectReason(r)}
                              className="text-[10px] bg-gray-50 text-gray-500 px-2.5 py-1 rounded-full border border-gray-100">
                              {r}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button onClick={() => void approveBusiness(b)} disabled={processingId === b.id}
                          className="flex-1 bg-[#004B49] text-white text-xs font-bold py-3 rounded-xl flex items-center justify-center gap-1.5 disabled:opacity-60">
                          {processingId === b.id ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />} Approve
                        </button>
                        <button onClick={() => { setRejectBizId(b.id); setBizRejectReason(""); }}
                          className="flex-1 bg-red-50 text-red-500 border border-red-100 text-xs font-bold py-3 rounded-xl flex items-center justify-center gap-1.5">
                          <XCircle size={13} /> Reject
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))
          )}

          {/* ══ DEPOSITS ══ */}
          {activeTab === "deposits" && (
            deposits.length === 0 ? <EmptyState text="No deposit requests yet" /> :
            deposits.map((d) => (
              <div key={d.id} className="bg-white rounded-2xl shadow-sm p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-bold text-gray-800 text-sm">{(d.profiles as any)?.full_name ?? "—"}</div>
                    <div className="text-[11px] text-gray-400">{new Date(d.created_at).toLocaleDateString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-green-600 text-lg">${d.amount}</div>
                    {statusPill(d.status)}
                  </div>
                </div>
                {d.receipt_url && (
                  <a href={d.receipt_url} target="_blank" rel="noopener noreferrer">
                    <img src={d.receipt_url} alt="receipt" className="w-full max-h-32 rounded-xl object-cover border border-gray-100 mb-2" />
                  </a>
                )}
                {d.notes && <div className="text-[11px] text-gray-500 bg-gray-50 rounded-xl px-3 py-2 mb-2">{d.notes}</div>}
                {d.status === "pending" && (
                  <div className="flex gap-2">
                    <button onClick={() => { setConfirmingDeposit(d); setDepositAmount(String(d.amount)); }}
                      className="flex-1 bg-[#004B49] text-white text-xs font-bold py-3 rounded-xl flex items-center justify-center gap-1.5">
                      <CheckCircle size={13} /> Confirm
                    </button>
                    <button onClick={() => void rejectDeposit(d)} disabled={processingId === d.id}
                      className="flex-1 bg-red-50 text-red-500 border border-red-100 text-xs font-bold py-3 rounded-xl flex items-center justify-center gap-1.5 disabled:opacity-60">
                      <XCircle size={13} /> Reject
                    </button>
                  </div>
                )}
              </div>
            ))
          )}

          {/* ══ WITHDRAWALS ══ */}
          {activeTab === "withdrawals" && (
            withdrawals.length === 0 ? <EmptyState text="No withdrawal requests yet" /> :
            withdrawals.map((w) => (
              <div key={w.id} className="bg-white rounded-2xl shadow-sm p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-bold text-gray-800 text-sm">{(w.profiles as any)?.full_name ?? "—"}</div>
                    <div className="text-[11px] text-gray-400">{new Date(w.created_at).toLocaleDateString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-orange-500 text-lg">${Math.abs(w.amount)}</div>
                    {statusPill(w.status)}
                  </div>
                </div>
                <div className="text-[10px] font-mono text-gray-500 bg-gray-50 rounded-xl px-3 py-2 mb-2 break-all">
                  {w.notes?.replace("Withdrawal request to ", "To: ") ?? "—"}
                </div>
                {w.status === "pending" && (
                  <div className="flex gap-2">
                    <button onClick={() => setConfirmingWithdraw(w)}
                      className="flex-1 bg-[#004B49] text-white text-xs font-bold py-3 rounded-xl flex items-center justify-center gap-1.5">
                      <CheckCircle size={13} /> Mark Sent
                    </button>
                    <button onClick={() => void rejectWithdrawal(w)} disabled={processingId === w.id}
                      className="flex-1 bg-red-50 text-red-500 border border-red-100 text-xs font-bold py-3 rounded-xl flex items-center justify-center gap-1.5 disabled:opacity-60">
                      <XCircle size={13} /> Reject
                    </button>
                  </div>
                )}
              </div>
            ))
          )}

          {/* ══ SERVICES ══ */}
          {activeTab === "services" && (
            providerServices.length === 0 ? <EmptyState text="No service requests yet" /> :
            providerServices.map((s) => (
              <div key={s.id} className="bg-white rounded-2xl shadow-sm p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-bold text-gray-800 text-sm">{(s.profiles as any)?.full_name ?? "—"}</div>
                    <div className="text-[11px] text-gray-400">{s.origin_country} → {s.destination_country}</div>
                  </div>
                  {statusPill(s.status)}
                </div>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="bg-gray-50 rounded-xl py-2 text-center">
                    <div className="text-xs font-black text-gray-700">{s.visa_category}</div>
                    <div className="text-[9px] text-gray-400">Category</div>
                  </div>
                  <div className="bg-gray-50 rounded-xl py-2 text-center">
                    <div className="text-xs font-black text-gray-700">${s.min_price}–${s.max_price}</div>
                    <div className="text-[9px] text-gray-400">Price</div>
                  </div>
                  <div className="bg-gray-50 rounded-xl py-2 text-center">
                    <div className="text-xs font-black text-gray-700">{s.capacity}</div>
                    <div className="text-[9px] text-gray-400">Capacity</div>
                  </div>
                </div>
                {s.status === "pending" && (
                  <div className="flex gap-2">
                    <button onClick={() => void approveService(s)} disabled={processingId === s.id}
                      className="flex-1 bg-[#004B49] text-white text-xs font-bold py-3 rounded-xl flex items-center justify-center gap-1.5 disabled:opacity-60">
                      <CheckCircle size={13} /> Approve
                    </button>
                    <button onClick={() => void rejectService(s)} disabled={processingId === s.id}
                      className="flex-1 bg-red-50 text-red-500 border border-red-100 text-xs font-bold py-3 rounded-xl flex items-center justify-center gap-1.5 disabled:opacity-60">
                      <XCircle size={13} /> Reject
                    </button>
                  </div>
                )}
              </div>
            ))
          )}

          {/* ══ SUPPORT ══ */}
          {activeTab === "support" && (
            selectedConv ? (
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col" style={{ height: "60vh" }}>
                <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
                  <button onClick={() => setSelectedConv(null)} className="text-gray-400 text-lg">‹</button>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#004B49] to-[#00746f] flex items-center justify-center text-white text-xs font-bold">
                    {selectedConv.user_name?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-gray-800 truncate">{selectedConv.user_name}</div>
                    <div className="text-[10px] text-gray-400 truncate">{selectedConv.user_email}</div>
                  </div>
                  {statusPill(selectedConv.status)}
                </div>
                <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2 bg-gray-50/60">
                  {convReplies.map((m) => (
                    <div key={m.id} className={`flex ${m.from_role === "admin" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm ${
                        m.from_role === "admin" ? "bg-[#004B49] text-white rounded-br-sm" : "bg-white text-gray-800 border border-gray-100 rounded-bl-sm"
                      }`}>
                        {m.text}
                        <div className={`text-[8px] mt-1 ${m.from_role === "admin" ? "text-white/50" : "text-gray-400"}`}>
                          {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <div className="px-3 py-2.5 border-t border-gray-100 flex items-center gap-2">
                  <input value={replyText} onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && void sendReply()}
                    placeholder="Type reply..."
                    className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#004B49]" />
                  <button onClick={() => void sendReply()} disabled={!replyText.trim() || sendingReply}
                    className="w-10 h-10 bg-[#004B49] rounded-xl flex items-center justify-center disabled:opacity-50">
                    {sendingReply ? <Loader2 size={15} className="animate-spin text-white" /> : <Send size={15} className="text-white" />}
                  </button>
                </div>
              </div>
            ) : (
              supportConvs.length === 0 ? <EmptyState text="No support messages yet" /> :
              supportConvs.map((c) => (
                <button key={c.id} onClick={() => void openConversation(c)}
                  className="bg-white rounded-2xl shadow-sm p-4 text-left">
                  <div className="flex items-center gap-3 mb-1.5">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                      c.status === "open" ? "bg-blue-500" : "bg-gradient-to-br from-[#004B49] to-[#00746f]"
                    }`}>
                      {c.user_name?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-gray-800 truncate">{c.user_name || "Unknown"}</div>
                      <div className="text-[10px] text-gray-400 truncate">{c.user_email}</div>
                    </div>
                    {statusPill(c.status)}
                  </div>
                  <div className="text-xs text-gray-500 truncate pl-12">{c.message}</div>
                </button>
              ))
            )
          )}

          {/* ══ ADS ══ */}
          {activeTab === "ads" && (
            adminAds.length === 0 ? <EmptyState text="No listings yet" /> :
            adminAds.map((ad) => (
              <div key={ad.id} className="bg-white rounded-2xl shadow-sm p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-800 text-sm truncate">{ad.title}</div>
                    <div className="text-[11px] text-gray-400">{ad.country} · {(ad.profiles as any)?.full_name ?? "—"}</div>
                  </div>
                  {statusPill(ad.status)}
                </div>
                <div className="flex gap-2">
                  {ad.status === "pending_review" && (
                    <button onClick={() => void approveAd(ad)}
                      className="flex-1 bg-[#004B49] text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5">
                      <CheckCircle size={13} /> Approve
                    </button>
                  )}
                  {ad.status !== "suspended" && (
                    <button onClick={() => void suspendAd(ad)}
                      className="flex-1 bg-orange-50 text-orange-500 border border-orange-100 text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5">
                      <Ban size={13} /> Suspend
                    </button>
                  )}
                  {ad.status === "suspended" && (
                    <button onClick={() => void approveAd(ad)}
                      className="flex-1 bg-green-50 text-green-600 border border-green-100 text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5">
                      <CheckCircle size={13} /> Re-activate
                    </button>
                  )}
                </div>
              </div>
            ))
          )}

          {/* ══ USERS ══ */}
          {activeTab === "users" && (
            adminUsers.length === 0 ? <EmptyState text="No users yet" /> :
            adminUsers.map((u) => (
              <div key={u.id} className="bg-white rounded-2xl shadow-sm p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm ${
                    u.is_suspended ? "bg-red-400" : "bg-gradient-to-br from-[#004B49] to-[#00746f]"
                  }`}>
                    {u.full_name?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-800 text-sm truncate">{u.full_name || "—"}</div>
                    <div className="text-[10px] text-gray-400 truncate">{u.email || "no email"}</div>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className="text-[9px] font-black bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full uppercase">{u.role}</span>
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full capitalize ${
                        u.kyc_status === "approved" ? "bg-green-50 text-green-600" : u.kyc_status === "pending" ? "bg-[#FBF3E1] text-[#9c7a1f]" : "bg-gray-100 text-gray-400"
                      }`}>KYC: {u.kyc_status}</span>
                      {u.business_status && u.business_status !== "none" && (
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full capitalize ${
                          u.business_status === "approved" ? "bg-green-50 text-green-600" : u.business_status === "pending" ? "bg-[#FBF3E1] text-[#9c7a1f]" : "bg-red-50 text-red-500"
                        }`}>Biz: {u.business_status}</span>
                      )}
                      {u.is_suspended && <span className="text-[9px] font-black bg-red-50 text-red-500 px-1.5 py-0.5 rounded-full">SUSPENDED</span>}
                    </div>
                  </div>
                </div>
                {u.role !== "admin" && (
                  <div className="flex gap-2">
                    {!u.is_suspended ? (
                      <button onClick={() => void suspendUser(u)}
                        className="flex-1 bg-orange-50 text-orange-500 border border-orange-100 text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5">
                        <Ban size={13} /> Suspend
                      </button>
                    ) : (
                      <button onClick={() => void restoreUser(u)}
                        className="flex-1 bg-green-50 text-green-600 border border-green-100 text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5">
                        <CheckCircle size={13} /> Restore Account
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))
          )}

          {/* ══ DISPUTES ══ */}
          {activeTab === "disputes" && (
            disputes.length === 0 ? <EmptyState text="No disputes filed yet" /> :
            disputes.map((d) => (
              <div key={d.id} className="bg-white rounded-2xl shadow-sm p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[10px] font-mono text-gray-400">{String(d.transaction_id).slice(0, 12)}...</div>
                  {statusPill(d.status)}
                </div>
                <div className="text-sm text-gray-700 mb-3">{d.reason}</div>
                <button onClick={() => { setUpdatingDispute(d); setDisputeStatus(d.status); setDisputeNotes(""); }}
                  className="w-full bg-[#E8F0EF] text-[#004B49] text-xs font-bold py-2.5 rounded-xl">
                  ⚖️ Update Status
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* ═══ DEPOSIT CONFIRM MODAL ═══ */}
      {confirmingDeposit && (
        <Modal onClose={() => setConfirmingDeposit(null)} title="Confirm Deposit">
          {confirmingDeposit.receipt_url && (
            <a href={confirmingDeposit.receipt_url} target="_blank" rel="noopener noreferrer">
              <img src={confirmingDeposit.receipt_url} alt="receipt" className="w-full max-h-48 object-contain rounded-xl border border-gray-100 mb-3" />
            </a>
          )}
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Confirm Amount (USDT)</div>
          <input type="number" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)}
            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-3 text-sm outline-none focus:border-[#004B49] mb-1" />
          <div className="text-[10px] text-gray-400 mb-3">User claimed: ${confirmingDeposit.amount}</div>
          <button onClick={() => void confirmDeposit()} disabled={processingId !== null}
            className="w-full bg-[#004B49] text-white font-bold py-3.5 rounded-xl text-sm disabled:opacity-50">
            {processingId ? "Confirming..." : "Confirm & Credit Wallet"}
          </button>
        </Modal>
      )}

      {/* ═══ WITHDRAWAL CONFIRM MODAL ═══ */}
      {confirmingWithdraw && (
        <Modal onClose={() => setConfirmingWithdraw(null)} title="Confirm Withdrawal">
          <div className="bg-[#FBF3E1] border border-[#D4AF37]/30 rounded-xl p-3.5 mb-3">
            <div className="text-xs font-bold text-[#9c7a1f] mb-1.5">⚠️ Send USDT manually first</div>
            <div className="text-xs text-[#9c7a1f]">Amount: <b>${Math.abs(confirmingWithdraw.amount)} USDT</b></div>
            <div className="text-[10px] font-mono text-[#9c7a1f] break-all mt-1">
              {confirmingWithdraw.notes?.replace("Withdrawal request to ", "To: ")}
            </div>
          </div>
          <button onClick={() => void confirmWithdrawal()} disabled={processingId !== null}
            className="w-full bg-[#004B49] text-white font-bold py-3.5 rounded-xl text-sm disabled:opacity-50">
            {processingId ? "Confirming..." : "✓ I've Sent — Confirm"}
          </button>
        </Modal>
      )}

      {/* ═══ DISPUTE UPDATE MODAL ═══ */}
      {updatingDispute && (
        <Modal onClose={() => setUpdatingDispute(null)} title="Update Dispute">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">New Status</div>
          <div className="flex flex-col gap-1.5 mb-3">
            {[
              { v: "open", l: "🔵 Open" },
              { v: "under_review", l: "🟡 Under Review" },
              { v: "resolved_buyer", l: "✅ Resolved — Buyer" },
              { v: "resolved_seller", l: "✅ Resolved — Seller" },
              { v: "closed", l: "⚫ Closed" },
            ].map((s) => (
              <button key={s.v} onClick={() => setDisputeStatus(s.v)}
                className={`text-left text-xs px-3 py-2.5 rounded-xl border transition-all ${
                  disputeStatus === s.v ? "bg-[#E8F0EF] border-[#004B49]/30 text-[#004B49] font-bold" : "bg-gray-50 border-gray-100 text-gray-600"
                }`}>
                {disputeStatus === s.v ? "✓ " : ""}{s.l}
              </button>
            ))}
          </div>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Resolution Notes</div>
          <textarea value={disputeNotes} onChange={(e) => setDisputeNotes(e.target.value)}
            rows={3} placeholder="Notes likhen..."
            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#004B49] mb-3" />
          <button onClick={() => void saveDispute()}
            className="w-full bg-[#004B49] text-white font-bold py-3.5 rounded-xl text-sm">
            Update Dispute
          </button>
        </Modal>
      )}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm py-12 text-center">
      <div className="text-2xl mb-2">📭</div>
      <div className="text-sm font-bold text-gray-400">{text}</div>
    </div>
  );
}

function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-0 z-[90] flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl px-5 pt-4 pb-6 max-h-[85vh] overflow-y-auto">
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-3" />
        <div className="flex items-center justify-between mb-4">
          <span className="font-black text-gray-800">{title}</span>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center">
            <X size={16} className="text-gray-500" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
