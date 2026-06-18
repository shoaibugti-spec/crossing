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
  AlertTriangle,
  Ban,
  CheckCircle,
  FileText,
  Loader2,
  Lock,
  Shield,
  Users,
  XCircle,
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
  const [loadingData, setLoadingData] = useState(true);

  const [processingId, setProcessingId] = useState<string | null>(null);
  const [disputeDialogOpen, setDisputeDialogOpen] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState<string | null>(null);
  const [disputeStatus, setDisputeStatus] = useState("under_review");
  const [disputeNotes, setDisputeNotes] = useState("");

  // ── ACCESS CONTROL ──
  useEffect(() => {
    void checkAccess();
  }, []);

  async function checkAccess() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setAccessChecked(true);
      void navigate({ to: "/login" });
      return;
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userData.user.id)
      .single();

    if (profile?.role === "admin") {
      setIsAdmin(true);
      void loadAllData();
    }
    setAccessChecked(true);
  }

  async function loadAllData() {
    setLoadingData(true);

    const { data: kyc } = await supabase
      .from("kyc_submissions")
      .select("id, user_id, full_name, document_type, submitted_at, status, profiles:user_id(full_name)")
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

    setLoadingData(false);
  }

  const stats = [
    { label: "Total Users", value: adminUsers.length.toString(), icon: Users, color: "text-[#004B49]", bg: "bg-[#E8F0EF]" },
    { label: "Active Ads", value: adminAds.filter((a) => a.status === "active").length.toString(), icon: FileText, color: "text-green-600", bg: "bg-green-50" },
    { label: "Pending KYC", value: kycUsers.filter((u) => u.status === "pending").length.toString(), icon: Shield, color: "text-[#9c7a1f]", bg: "bg-[#FBF3E1]" },
    { label: "Open Disputes", value: disputes.filter((d) => d.status === "open" || d.status === "under_review").length.toString(), icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
  ];

  const handleApproveKYC = async (kycId: string, userId: string) => {
    setProcessingId(kycId);
    await supabase.from("kyc_submissions").update({ status: "approved", reviewed_at: new Date().toISOString() }).eq("id", kycId);
    await supabase.from("profiles").update({ kyc_status: "approved", kyc_level: 3 }).eq("id", userId);
    setKycUsers((prev) => prev.map((u) => (u.id === kycId ? { ...u, status: "approved" } : u)));
    setProcessingId(null);
    toast.success("KYC approved");
  };

  const handleRejectKYC = async (kycId: string, userId: string) => {
    setProcessingId(kycId);
    await supabase.from("kyc_submissions").update({ status: "rejected", reviewed_at: new Date().toISOString() }).eq("id", kycId);
    await supabase.from("profiles").update({ kyc_status: "rejected" }).eq("id", userId);
    setKycUsers((prev) => prev.map((u) => (u.id === kycId ? { ...u, status: "rejected" } : u)));
    setProcessingId(null);
    toast.success("KYC rejected");
  };

  const handleSuspendUser = async (userId: string) => {
    await supabase.from("profiles").update({ is_suspended: true }).eq("id", userId);
    setAdminUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, is_suspended: true } : u)));
    toast.success("User suspended");
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
    toast.success("Dispute status updated");
  };

  const kycStatusBadge = (status: string) => {
    if (status === "pending") return <Badge variant="outline" className="text-xs bg-[#FBF3E1] text-[#9c7a1f] border-[#D4AF37]/30">Pending</Badge>;
    if (status === "approved") return <Badge variant="outline" className="text-xs badge-success">Approved</Badge>;
    return <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">Rejected</Badge>;
  };

  // ── ACCESS GATES ──
  if (!accessChecked) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-gray-300" size={28} />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
          <Lock size={28} className="text-red-400" />
        </div>
        <div className="font-black text-gray-800 text-lg mb-1">Access Denied</div>
        <div className="text-sm text-gray-500">This area is restricted to Crossing administrators only.</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="font-display text-2xl font-bold text-foreground mb-6">
        Admin Dashboard
      </h1>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="border-border/60 shadow-card">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
                  <Icon size={18} className={color} />
                </div>
              </div>
              <p className="font-display font-bold text-2xl text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {loadingData ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-gray-300" size={28} />
        </div>
      ) : (
        <Tabs defaultValue="kyc">
          <TabsList className="mb-6">
            <TabsTrigger value="kyc">
              KYC Queue
              {kycUsers.filter((u) => u.status === "pending").length > 0 && (
                <span className="ml-1.5 bg-[#D4AF37] text-white rounded-full px-1.5 py-0.5 text-xs font-bold">
                  {kycUsers.filter((u) => u.status === "pending").length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="ads">Ads</TabsTrigger>
            <TabsTrigger value="disputes">Disputes</TabsTrigger>
          </TabsList>

          {/* KYC Queue */}
          <TabsContent value="kyc">
            <Card className="border-border/60 shadow-card">
              <CardContent className="p-0">
                {kycUsers.length === 0 ? (
                  <div className="text-center py-12 text-sm text-muted-foreground">No KYC submissions yet.</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Document Type</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {kycUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium text-sm">{user.full_name}</TableCell>
                          <TableCell className="text-sm text-muted-foreground capitalize">{user.document_type}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(user.submitted_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>{kycStatusBadge(user.status)}</TableCell>
                          <TableCell className="text-right">
                            {user.status === "pending" ? (
                              <div className="flex items-center justify-end gap-2">
                                <Button size="sm" onClick={() => void handleApproveKYC(user.id, user.user_id)}
                                  disabled={processingId === user.id}
                                  className="gap-1 text-xs bg-[#004B49] hover:bg-[#00302e] text-white h-7">
                                  {processingId === user.id ? <Loader2 size={10} className="animate-spin" /> : <CheckCircle size={11} />}
                                  Approve
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => void handleRejectKYC(user.id, user.user_id)}
                                  disabled={processingId === user.id}
                                  className="gap-1 text-xs text-destructive border-destructive/30 h-7">
                                  <XCircle size={11} /> Reject
                                </Button>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
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

          {/* Users */}
          <TabsContent value="users">
            <Card className="border-border/60 shadow-card">
              <CardContent className="p-0">
                {adminUsers.length === 0 ? (
                  <div className="text-center py-12 text-sm text-muted-foreground">No users yet.</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>KYC</TableHead>
                        <TableHead>Trust Score</TableHead>
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
                          <TableCell className="text-sm font-medium">{user.trust_score}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(user.created_at).toLocaleDateString()}
                          </TableCell>
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

          {/* Ads */}
          <TabsContent value="ads">
            <Card className="border-border/60 shadow-card">
              <CardContent className="p-0">
                {adminAds.length === 0 ? (
                  <div className="text-center py-12 text-sm text-muted-foreground">No listings yet.</div>
                ) : (
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
                                : "bg-gray-100 text-gray-600 border-gray-200"
                            }`}>
                              {ad.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{new Date(ad.created_at).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                            {ad.status !== "suspended" && (
                              <Button size="sm" variant="outline" onClick={() => void handleSuspendAd(ad.id)}
                                className="gap-1 text-xs text-orange-600 border-orange-200 h-7">
                                <Ban size={11} /> Suspend
                              </Button>
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

          {/* Disputes */}
          <TabsContent value="disputes">
            <Card className="border-border/60 shadow-card">
              <CardContent className="p-0">
                {disputes.length === 0 ? (
                  <div className="text-center py-12 text-sm text-muted-foreground">No disputes filed yet.</div>
                ) : (
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
                            }`}>
                              {dispute.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{new Date(dispute.created_at).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="outline" className="text-xs h-7"
                              onClick={() => { setSelectedDispute(dispute.id); setDisputeStatus(dispute.status); setDisputeDialogOpen(true); }}>
                              Update Status
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

      {/* Dispute Update Dialog */}
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
              <Textarea placeholder="Add resolution notes for both parties..." rows={4} value={disputeNotes} onChange={(e) => setDisputeNotes(e.target.value)} />
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
