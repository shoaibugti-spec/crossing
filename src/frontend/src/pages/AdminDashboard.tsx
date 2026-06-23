import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle, Ban, CheckCircle, Loader2, Lock,
  Shield, Users, XCircle, ArrowDownLeft,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "../lib/supabaseClient";

export function AdminDashboard() {
  const navigate = useNavigate();
  const [accessChecked, setAccessChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [kycUsers, setKycUsers] = useState<any[]>([]);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [adminAds, setAdminAds] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [providerServices, setProviderServices] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [processingId, setProcessingId] = useState<string | null>(null);
  const [disputeDialogOpen, setDisputeDialogOpen] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState<string | null>(null);
  const [disputeStatus, setDisputeStatus] = useState("under_review");
  const [disputeNotes, setDisputeNotes] = useState("");

  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [selectedDeposit, setSelectedDeposit] = useState<any | null>(null);
  const [depositAmountOverride, setDepositAmountOverride] = useState("");

  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [selectedWithdraw, setSelectedWithdraw] = useState<any | null>(null);

  // KYC reject with reason
  const [kycRejectDialogOpen, setKycRejectDialogOpen] = useState(false);
  const [selectedKyc, setSelectedKyc] = useState<any | null>(null);
  const [kycRejectionReason, setKycRejectionReason] = useState("");

  useEffect(() => {
    void checkAccess();
  }, []);

  async function checkAccess() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) { setAccessChecked(true); void navigate({ to: "/login" }); return; }
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", userData.user.id).single();
    if (profile?.role === "admin") { setIsAdmin(true); void loadAllData(); }
    setAccessChecked(true);
  }

  async function loadAllData() {
    setLoadingData(true);

    const { data: kyc } = await supabase
      .from("kyc_submissions")
      .select("id, user_id, full_name, document_type, submitted_at, status, document_front_url, document_back_url, selfie_url, face_video_url, rejection_reason")
      .order("submitted_at", { ascending: false });
    setKycUsers(kyc ?? []);

    const { data: users } = await supabase
      .from("profiles")
      .select("id, full_name, role, kyc_status, trust_score, is_suspended, created_at, country")
      .order("created_at", { ascending: false });
    setAdminUsers(users ?? []);

    const { data: ads } = await supabase
      .from("ads")
      .select("id, title, country, status, created_at, provider_id, profiles:provider_id(full_name)")
      .order("created_at", { ascending: false });
    setAdminAds(ads ?? []);

    const { data: disputesData } = await supabase
      .from("disputes")
      .select("id, transaction_id, reason, status, created_at, filed_by")
      .order("created_at", { ascending: false });
    setDisputes(disputesData ?? []);

    const { data: depositsData } = await supabase
      .from("wallet_transactions")
      .select("id, user_id, amount, status, notes, receipt_url, reference_code, created_at, profiles:user_id(full_name)")
      .eq("type", "deposit")
      .order("created_at", { ascending: false });
    setDeposits(depositsData ?? []);

    const { data: withdrawalsData } = await supabase
      .from("wallet_transactions")
      .select("id, user_id, amount, status, notes, created_at, profiles:user_id(full_name)")
      .eq("type", "withdrawal")
      .order("created_at", { ascending: false });
    setWithdrawals(withdrawalsData ?? []);

    const { data: servicesData } = await supabase
      .from("provider_services")
      .select("id, provider_id, origin_country, destination_country, visa_category, min_price, max_price, capacity, status, created_at, profiles:provider_id(full_name)")
      .order("created_at", { ascending: false });
    setProviderServices(servicesData ?? []);

    setLoadingData(false);
  }

  // ── KYC ──
  const handleApproveKYC = async (kycId: string, userId: string) => {
    setProcessingId(kycId);
    await supabase.from("kyc_submissions").update({ status: "approved", reviewed_at: new Date().toISOString() }).eq("id", kycId);
    await supabase.from("profiles").update({ kyc_status: "approved", kyc_level: 3 }).eq("id", userId);
    setKycUsers((prev) => prev.map((u) => (u.id === kycId ? { ...u, status: "approved" } : u)));
    setProcessingId(null);
    toast.success("KYC approved ✅");
  };

  const openRejectKyc = (kyc: any) => {
    setSelectedKyc(kyc);
    setKycRejectionReason("");
    setKycRejectDialogOpen(true);
  };

  const handleRejectKYC = async () => {
    if (!selectedKyc) return;
    if (!kycRejectionReason.trim()) { toast.error("Please enter a rejection reason"); return; }
    setProcessingId(selectedKyc.id);

    await supabase.from("kyc_submissions").update({
      status: "rejected",
      reviewed_at: new Date().toISOString(),
      rejection_reason: kycRejectionReason.trim(),
    }).eq("id", selectedKyc.id);

    await supabase.from("profiles").update({ kyc_status: "rejected", kyc_level: 0 }).eq("id", selectedKyc.user_id);

    setKycUsers((prev) => prev.map((u) => (u.id === selectedKyc.id ? { ...u, status: "rejected", rejection_reason: kycRejectionReason.trim() } : u)));
    setKycRejectDialogOpen(false);
    setSelectedKyc(null);
    setKycRejectionReason("");
    setProcessingId(null);
    toast.success("KYC rejected — reason saved");
  };

  // ── DEPOSIT ──
  async function confirmDeposit() {
    if (!selectedDeposit) return;
    const confirmedAmount = Number(depositAmountOverride) || selectedDeposit.amount;
    setProcessingId(selectedDeposit.id);
    await supabase.from("wallet_transactions").update({ status: "completed" }).eq("id", selectedDeposit.id);
    const { data: profile } = await supabase.from("profiles").select("wallet_balance").eq("id", selectedDeposit.user_id).single();
    const newBalance = Number(profile?.wallet_balance ?? 0) + confirmedAmount;
    await supabase.from("profiles").update({ wallet_balance: newBalance }).eq("id", selectedDeposit.user_id);
    setDeposits((prev) => prev.map((d) => (d.id === selectedDeposit.id ? { ...d, status: "completed" } : d)));
    setDepositDialogOpen(false);
    setSelectedDeposit(null);
    setDepositAmountOverride("");
    setProcessingId(null);
    toast.success(`Deposit of $${confirmedAmount} confirmed`);
  }

  async function rejectDeposit(id: string) {
    setProcessingId(id);
    await supabase.from("wallet_transactions").update({ status: "rejected" }).eq("id", id);
    setDeposits((prev) => prev.map((d) => (d.id === id ? { ...d, status: "rejected" } : d)));
    setProcessingId(null);
    toast.success("Deposit rejected");
  }

  // ── WITHDRAWAL ──
  async function confirmWithdrawal() {
    if (!selectedWithdraw) return;
    setProcessingId(selectedWithdraw.id);
    await supabase.from("wallet_transactions").update({ status: "completed" }).eq("id", selectedWithdraw.id);
    const { data: profile } = await supabase.from("profiles").select("wallet_balance").eq("id", selectedWithdraw.user_id).single();
    const withdrawAmount = Math.abs(selectedWithdraw.amount);
    const newBalance = Math.max(0, Number(profile?.wallet_balance ?? 0) - withdrawAmount);
    await supabase.from("profiles").update({ wallet_balance: newBalance }).eq("id", selectedWithdraw.user_id);
    setWithdrawals((prev) => prev.map((w) => (w.id === selectedWithdraw.id ? { ...w, status: "completed" } : w)));
    setWithdrawDialogOpen(false);
    setSelectedWithdraw(null);
    setProcessingId(null);
    toast.success("Withdrawal confirmed");
  }

  async function rejectWithdrawal(id: string) {
    setProcessingId(id);
    await supabase.from("wallet_transactions").update({ status: "rejected" }).eq("id", id);
    setWithdrawals((prev) => prev.map((w) => (w.id === id ? { ...w, status: "rejected" } : w)));
    setProcessingId(null);
    toast.success("Withdrawal rejected");
  }

  // ── SERVICES ──
  async function approveService(id: string, providerId: string) {
    setProcessingId(id);
    await supabase.from("provider_services").update({ status: "approved" }).eq("id", id);
    const { data: allServices } = await supabase.from("provider_services").select("max_price, capacity, status").eq("provider_id", providerId);
    const totalDeposit = (allServices ?? [])
      .filter((s: any) => s.status === "approved")
      .reduce((sum: number, s: any) => sum + s.max_price * 2 * s.capacity, 0);
    await supabase.from("profiles").update({ security_deposit: totalDeposit }).eq("id", providerId);
    setProviderServices((prev) => prev.map((s) => (s.id === id ? { ...s, status: "approved" } : s)));
    setProcessingId(null);
    toast.success("Service approved");
  }

  async function rejectService(id: string) {
    setProcessingId(id);
    await supabase.from("provider_services").update({ status: "rejected" }).eq("id", id);
    setProviderServices((prev) => prev.map((s) => (s.id === id ? { ...s, status: "rejected" } : s)));
    setProcessingId(null);
    toast.success("Service rejected");
  }

  // ── MISC ──
  const handleSuspendUser = async (userId: string) => {
    await supabase.from("profiles").update({ is_suspended: true }).eq("id", userId);
    setAdminUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, is_suspended: true } : u)));
    toast.success("User suspended");
  };

  const handleApproveAd = async (id: string) => {
    await supabase.from("ads").update({ status: "active" }).eq("id", id);
    setAdminAds((prev) => prev.map((a) => (a.id === id ? { ...a, status: "active" } : a)));
    toast.success("Ad approved and live");
  };

  const handleSuspendAd = async (id: string) => {
    await supabase.from("ads").update({ status: "suspended" }).eq("id", id);
    setAdminAds((prev) => prev.map((a) => (a.id === id ? { ...a, status: "suspended" } : a)));
    toast.success("Ad suspended");
  };

  const handleUpdateDispute = async () => {
    if (!selectedDispute) return;
    await supabase.from("disputes").update({ status: disputeStatus, admin_notes: disputeNotes }).eq("id", selectedDispute);
    setDisputes((prev) => prev.map((d) => (d.id === selectedDispute ? { ...d, status: disputeStatus } : d)));
    setDisputeDialogOpen(false);
    toast.success("Dispute updated");
  };

  const kycStatusBadge = (status: string) => {
    if (status === "pending") return <Badge variant="outline" className="text-xs bg-[#FBF3E1] text-[#9c7a1f] border-[#D4AF37]/30">Pending</Badge>;
    if (status === "approved") return <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">Approved</Badge>;
    return <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">Rejected</Badge>;
  };

  const txStatusBadge = (status: string) => {
    if (status === "pending") return <Badge variant="outline" className="text-xs bg-[#FBF3E1] text-[#9c7a1f] border-[#D4AF37]/30">Pending</Badge>;
    if (status === "completed") return <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">Completed</Badge>;
    return <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">Rejected</Badge>;
  };

  const svcStatusBadge = (status: string) => {
    if (status === "pending") return <Badge variant="outline" className="text-xs bg-[#FBF3E1] text-[#9c7a1f] border-[#D4AF37]/30">Pending</Badge>;
    if (status === "approved") return <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">Approved</Badge>;
    return <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">Rejected</Badge>;
  };

  const pendingDeposits = deposits.filter((d) => d.status === "pending").length;
  const pendingWithdrawals = withdrawals.filter((w) => w.status === "pending").length;
  const pendingServices = providerServices.filter((s) => s.status === "pending").length;
  const pendingKyc = kycUsers.filter((u) => u.status === "pending").length;

  const stats = [
    { label: "Total Users", value: adminUsers.length.toString(), icon: Users, color: "text-[#004B49]", bg: "bg-[#E8F0EF]" },
    { label: "Pending KYC", value: String(pendingKyc), icon: Shield, color: "text-[#9c7a1f]", bg: "bg-[#FBF3E1]" },
    { label: "Pending Deposits", value: String(pendingDeposits), icon: ArrowDownLeft, color: "text-green-600", bg: "bg-green-50" },
    { label: "Open Disputes", value: disputes.filter((d) => d.status === "open" || d.status === "under_review").length.toString(), icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
  ];

  if (!accessChecked) return <div className="flex items-center justify-center py-24"><Loader2 className="animate-spin text-gray-300" size={28} /></div>;

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4"><Lock size={28} className="text-red-400" /></div>
        <div className="font-black text-gray-800 text-lg mb-1">Access Denied</div>
        <div className="text-sm text-gray-500">Restricted to Crossingate administrators only.</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="font-display text-2xl font-bold text-foreground mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="border-border/60">
            <CardContent className="p-5">
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                <Icon size={18} className={color} />
              </div>
              <p className="font-bold text-2xl text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {loadingData ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-gray-300" size={28} /></div>
      ) : (
        <Tabs defaultValue="deposits">
          <TabsList className="mb-6 flex-wrap gap-1">
            <TabsTrigger value="deposits">
              Deposits {pendingDeposits > 0 && <span className="ml-1.5 bg-green-500 text-white rounded-full px-1.5 py-0.5 text-xs font-bold">{pendingDeposits}</span>}
            </TabsTrigger>
            <TabsTrigger value="withdrawals">
              Withdrawals {pendingWithdrawals > 0 && <span className="ml-1.5 bg-orange-500 text-white rounded-full px-1.5 py-0.5 text-xs font-bold">{pendingWithdrawals}</span>}
            </TabsTrigger>
            <TabsTrigger value="services">
              Services {pendingServices > 0 && <span className="ml-1.5 bg-[#D4AF37] text-white rounded-full px-1.5 py-0.5 text-xs font-bold">{pendingServices}</span>}
            </TabsTrigger>
            <TabsTrigger value="kyc">
              KYC {pendingKyc > 0 && <span className="ml-1.5 bg-[#D4AF37] text-white rounded-full px-1.5 py-0.5 text-xs font-bold">{pendingKyc}</span>}
            </TabsTrigger>
            <TabsTrigger value="ads">Ads</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="disputes">Disputes</TabsTrigger>
          </TabsList>

          {/* ── DEPOSITS ── */}
          <TabsContent value="deposits">
            <Card className="border-border/60">
              <CardContent className="p-0">
                {deposits.length === 0 ? <div className="text-center py-12 text-sm text-muted-foreground">No deposit requests yet.</div> : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead>Receipt</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {deposits.map((d) => (
                        <TableRow key={d.id}>
                          <TableCell className="font-medium text-sm">{(d.profiles as any)?.full_name ?? "—"}</TableCell>
                          <TableCell className="font-bold text-green-600">${d.amount}</TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-xs"><span className="line-clamp-2">{d.notes ?? "—"}</span></TableCell>
                          <TableCell>
                            {d.receipt_url ? (
                              <a href={d.receipt_url} target="_blank" rel="noopener noreferrer">
                                <img src={d.receipt_url} alt="receipt" className="w-10 h-10 rounded-lg object-cover border border-gray-100 cursor-pointer hover:opacity-80" />
                              </a>
                            ) : <span className="text-xs text-muted-foreground">No receipt</span>}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{new Date(d.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>{txStatusBadge(d.status)}</TableCell>
                          <TableCell className="text-right">
                            {d.status === "pending" && (
                              <div className="flex items-center justify-end gap-2">
                                <Button size="sm" onClick={() => { setSelectedDeposit(d); setDepositAmountOverride(String(d.amount)); setDepositDialogOpen(true); }}
                                  className="gap-1 text-xs bg-[#004B49] hover:bg-[#00302e] text-white h-7">
                                  <CheckCircle size={11} /> Confirm
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => void rejectDeposit(d.id)} disabled={processingId === d.id}
                                  className="gap-1 text-xs text-destructive border-destructive/30 h-7">
                                  <XCircle size={11} /> Reject
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── WITHDRAWALS ── */}
          <TabsContent value="withdrawals">
            <Card className="border-border/60">
              <CardContent className="p-0">
                {withdrawals.length === 0 ? <div className="text-center py-12 text-sm text-muted-foreground">No withdrawal requests yet.</div> : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Wallet Address</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {withdrawals.map((w) => (
                        <TableRow key={w.id}>
                          <TableCell className="font-medium text-sm">{(w.profiles as any)?.full_name ?? "—"}</TableCell>
                          <TableCell className="font-bold text-orange-600">${Math.abs(w.amount)}</TableCell>
                          <TableCell className="text-xs font-mono text-muted-foreground max-w-xs"><span className="line-clamp-1">{w.notes?.replace("Withdrawal request to ", "") ?? "—"}</span></TableCell>
                          <TableCell className="text-sm text-muted-foreground">{new Date(w.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>{txStatusBadge(w.status)}</TableCell>
                          <TableCell className="text-right">
                            {w.status === "pending" && (
                              <div className="flex items-center justify-end gap-2">
                                <Button size="sm" onClick={() => { setSelectedWithdraw(w); setWithdrawDialogOpen(true); }}
                                  className="gap-1 text-xs bg-[#004B49] hover:bg-[#00302e] text-white h-7">
                                  <CheckCircle size={11} /> Mark Sent
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => void rejectWithdrawal(w.id)} disabled={processingId === w.id}
                                  className="gap-1 text-xs text-destructive border-destructive/30 h-7">
                                  <XCircle size={11} /> Reject
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── SERVICES ── */}
          <TabsContent value="services">
            <Card className="border-border/60">
              <CardContent className="p-0">
                {providerServices.length === 0 ? <div className="text-center py-12 text-sm text-muted-foreground">No service requests yet.</div> : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Provider</TableHead>
                        <TableHead>Route</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Price Range</TableHead>
                        <TableHead>Capacity</TableHead>
                        <TableHead>Deposit</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {providerServices.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell className="font-medium text-sm">{(s.profiles as any)?.full_name ?? "—"}</TableCell>
                          <TableCell className="text-sm">{s.origin_country} → {s.destination_country}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{s.visa_category}</TableCell>
                          <TableCell className="text-sm font-medium">${s.min_price}–${s.max_price}</TableCell>
                          <TableCell className="text-sm text-center">{s.capacity}</TableCell>
                          <TableCell className="text-sm font-bold text-[#004B49]">${s.max_price * 2 * s.capacity}</TableCell>
                          <TableCell>{svcStatusBadge(s.status)}</TableCell>
                          <TableCell className="text-right">
                            {s.status === "pending" && (
                              <div className="flex items-center justify-end gap-2">
                                <Button size="sm" onClick={() => void approveService(s.id, s.provider_id)} disabled={processingId === s.id}
                                  className="gap-1 text-xs bg-[#004B49] hover:bg-[#00302e] text-white h-7">
                                  {processingId === s.id ? <Loader2 size={10} className="animate-spin" /> : <CheckCircle size={11} />} Approve
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => void rejectService(s.id)} disabled={processingId === s.id}
                                  className="gap-1 text-xs text-destructive border-destructive/30 h-7">
                                  <XCircle size={11} /> Reject
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── KYC ── */}
          <TabsContent value="kyc">
            <Card className="border-border/60">
              <CardContent className="p-0">
                {kycUsers.length === 0 ? <div className="text-center py-12 text-sm text-muted-foreground">No KYC submissions yet.</div> : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Document</TableHead>
                        <TableHead>Photos</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Rejection Reason</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {kycUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium text-sm">{user.full_name}</TableCell>
                          <TableCell className="text-sm text-muted-foreground capitalize">{user.document_type}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {user.document_front_url && (
                                <a href={user.document_front_url} target="_blank" rel="noopener noreferrer">
                                  <img src={user.document_front_url} alt="front" className="w-8 h-8 rounded object-cover border border-gray-100 hover:opacity-80" />
                                </a>
                              )}
                              {user.selfie_url && (
                                <a href={user.selfie_url} target="_blank" rel="noopener noreferrer">
                                  <img src={user.selfie_url} alt="selfie" className="w-8 h-8 rounded object-cover border border-gray-100 hover:opacity-80" />
                                </a>
                              )}
                              {user.face_video_url && (
                                <a href={user.face_video_url} target="_blank" rel="noopener noreferrer">
                                  <div className="w-8 h-8 rounded bg-gray-100 border border-gray-200 flex items-center justify-center text-[10px] text-gray-500 font-bold">▶</div>
                                </a>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{new Date(user.submitted_at).toLocaleDateString()}</TableCell>
                          <TableCell>{kycStatusBadge(user.status)}</TableCell>
                          <TableCell className="text-xs text-red-500 max-w-xs">
                            <span className="line-clamp-2">{user.rejection_reason ?? "—"}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            {user.status === "pending" && (
                              <div className="flex items-center justify-end gap-2">
                                <Button size="sm" onClick={() => void handleApproveKYC(user.id, user.user_id)} disabled={processingId === user.id}
                                  className="gap-1 text-xs bg-[#004B49] hover:bg-[#00302e] text-white h-7">
                                  {processingId === user.id ? <Loader2 size={10} className="animate-spin" /> : <CheckCircle size={11} />} Approve
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => openRejectKyc(user)} disabled={processingId === user.id}
                                  className="gap-1 text-xs text-destructive border-destructive/30 h-7">
                                  <XCircle size={11} /> Reject
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── ADS ── */}
          <TabsContent value="ads">
            <Card className="border-border/60">
              <CardContent className="p-0">
                {adminAds.length === 0 ? <div className="text-center py-12 text-sm text-muted-foreground">No listings yet.</div> : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Country</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {adminAds.map((ad) => (
                        <TableRow key={ad.id}>
                          <TableCell className="font-medium text-sm max-w-xs"><span className="line-clamp-1">{ad.title}</span></TableCell>
                          <TableCell className="text-sm text-muted-foreground">{ad.country}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-xs capitalize ${
                              ad.status === "active" ? "bg-green-50 text-green-700 border-green-200"
                              : ad.status === "suspended" ? "bg-red-50 text-red-700 border-red-200"
                              : ad.status === "pending_review" ? "bg-[#FBF3E1] text-[#9c7a1f] border-[#D4AF37]/30"
                              : "bg-gray-100 text-gray-600 border-gray-200"
                            }`}>
                              {ad.status.replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{new Date(ad.created_at).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {ad.status === "pending_review" && (
                                <Button size="sm" onClick={() => void handleApproveAd(ad.id)}
                                  className="gap-1 text-xs bg-[#004B49] hover:bg-[#00302e] text-white h-7">
                                  <CheckCircle size={11} /> Approve
                                </Button>
                              )}
                              {ad.status !== "suspended" && (
                                <Button size="sm" variant="outline" onClick={() => void handleSuspendAd(ad.id)}
                                  className="gap-1 text-xs text-orange-600 border-orange-200 h-7">
                                  <Ban size={11} /> Suspend
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── USERS ── */}
          <TabsContent value="users">
            <Card className="border-border/60">
              <CardContent className="p-0">
                {adminUsers.length === 0 ? <div className="text-center py-12 text-sm text-muted-foreground">No users yet.</div> : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>KYC</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {adminUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium text-sm">{user.full_name || "—"}</TableCell>
                          <TableCell><Badge variant="outline" className="text-xs capitalize">{user.role}</Badge></TableCell>
                          <TableCell className="text-xs capitalize text-muted-foreground">{user.kyc_status}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{new Date(user.created_at).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                            {!user.is_suspended && user.role !== "admin" && (
                              <Button size="sm" variant="outline" onClick={() => void handleSuspendUser(user.id)}
                                className="gap-1 text-xs text-orange-600 border-orange-200 h-7">
                                <Ban size={11} /> Suspend
                              </Button>
                            )}
                            {user.is_suspended && <span className="text-xs text-red-500 font-bold">Suspended</span>}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── DISPUTES ── */}
          <TabsContent value="disputes">
            <Card className="border-border/60">
              <CardContent className="p-0">
                {disputes.length === 0 ? <div className="text-center py-12 text-sm text-muted-foreground">No disputes filed yet.</div> : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Transaction</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Filed</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {disputes.map((dispute) => (
                        <TableRow key={dispute.id}>
                          <TableCell className="font-mono text-xs">{dispute.transaction_id}</TableCell>
                          <TableCell className="text-sm max-w-xs"><span className="line-clamp-1">{dispute.reason}</span></TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-xs capitalize ${
                              dispute.status === "open" ? "bg-[#E8F0EF] text-[#004B49] border-[#004B49]/20"
                              : dispute.status === "under_review" ? "bg-[#FBF3E1] text-[#9c7a1f] border-[#D4AF37]/30"
                              : "bg-green-50 text-green-700 border-green-200"
                            }`}>{dispute.status}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{new Date(dispute.created_at).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="outline" className="text-xs h-7"
                              onClick={() => { setSelectedDispute(dispute.id); setDisputeStatus(dispute.status); setDisputeDialogOpen(true); }}>
                              Update
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* ── KYC REJECT DIALOG ── */}
      <Dialog open={kycRejectDialogOpen} onOpenChange={setKycRejectDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject KYC — Add Reason</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="text-xs font-bold text-gray-600 mb-1">User: {selectedKyc?.full_name}</div>
              <div className="text-xs text-gray-400">Document: {selectedKyc?.document_type}</div>
            </div>
            <div className="space-y-1.5">
              <Label>Rejection Reason *</Label>
              <Textarea
                placeholder="e.g. Document not clear, selfie does not match, wrong document type..."
                rows={4}
                value={kycRejectionReason}
                onChange={(e) => setKycRejectionReason(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">This reason will be shown to the user so they can fix and resubmit.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                "Document not clearly visible",
                "Selfie does not match document",
                "Document expired",
                "Wrong document type",
                "Poor lighting — retake photos",
                "Face video too short",
              ].map((r) => (
                <button key={r} onClick={() => setKycRejectionReason(r)}
                  className="text-[11px] bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full border border-gray-200 hover:border-red-300 hover:text-red-600 transition-all">
                  {r}
                </button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setKycRejectDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => void handleRejectKYC()} disabled={processingId !== null || !kycRejectionReason.trim()}
              className="bg-red-500 hover:bg-red-600 text-white">
              {processingId ? <Loader2 size={14} className="animate-spin" /> : "Reject & Notify User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── DEPOSIT CONFIRM DIALOG ── */}
      <Dialog open={depositDialogOpen} onOpenChange={setDepositDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirm Deposit</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            {selectedDeposit?.receipt_url && (
              <div>
                <Label className="mb-2 block">Payment Receipt</Label>
                <a href={selectedDeposit.receipt_url} target="_blank" rel="noopener noreferrer">
                  <img src={selectedDeposit.receipt_url} alt="receipt" className="w-full max-h-64 object-contain rounded-xl border border-gray-100 cursor-pointer" />
                </a>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Confirm Amount (USDT)</Label>
              <Input type="number" value={depositAmountOverride} onChange={(e) => setDepositAmountOverride(e.target.value)} placeholder="Enter confirmed amount" />
              <p className="text-xs text-muted-foreground">User claimed: ${selectedDeposit?.amount}. Adjust if actual amount differs.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDepositDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => void confirmDeposit()} disabled={processingId !== null} className="bg-[#004B49] hover:bg-[#00302e] text-white">
              {processingId ? <Loader2 size={14} className="animate-spin" /> : "Confirm & Credit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── WITHDRAWAL CONFIRM DIALOG ── */}
      <Dialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirm Withdrawal Sent</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-[#FBF3E1] border border-[#D4AF37]/30 rounded-xl p-4">
              <div className="text-sm font-bold text-[#9c7a1f] mb-2">Send USDT Manually</div>
              <div className="text-xs text-[#9c7a1f] flex flex-col gap-1.5">
                <div>Amount: <span className="font-black">${Math.abs(selectedWithdraw?.amount ?? 0)} USDT</span></div>
                <div className="break-all">To: <span className="font-mono font-bold">{selectedWithdraw?.notes?.replace("Withdrawal request to ", "") ?? "—"}</span></div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Only confirm after you have actually sent the USDT.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWithdrawDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => void confirmWithdrawal()} disabled={processingId !== null} className="bg-[#004B49] hover:bg-[#00302e] text-white">
              {processingId ? <Loader2 size={14} className="animate-spin" /> : "I've Sent — Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── DISPUTE DIALOG ── */}
      <Dialog open={disputeDialogOpen} onOpenChange={setDisputeDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Update Dispute Status</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label>New Status</Label>
              <Select value={disputeStatus} onValueChange={setDisputeStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="resolved_buyer">Resolved (Buyer)</SelectItem>
                  <SelectItem value="resolved_seller">Resolved (Seller)</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Resolution Notes</Label>
              <Textarea placeholder="Add resolution notes..." rows={4} value={disputeNotes} onChange={(e) => setDisputeNotes(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDisputeDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => void handleUpdateDispute()} className="bg-[#004B49] hover:bg-[#00302e] text-white">Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
