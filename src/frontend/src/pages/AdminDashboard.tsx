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
  Shield,
  Users,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AdStatus, DisputeStatus, KYCStatus } from "../backend.d";
import { VerificationBadge } from "../components/VerificationBadge";
import {
  useUpdateDisputeStatus,
  useUpdateKYCStatus,
} from "../hooks/useQueries";
import {
  ADMIN_ADS,
  ADMIN_DISPUTES,
  ADMIN_USERS,
  KYC_MOCK_USERS,
} from "../lib/mockData";

export function AdminDashboard() {
  const [kycUsers, setKycUsers] = useState(KYC_MOCK_USERS);
  const [adminAds, setAdminAds] = useState(ADMIN_ADS);
  const [disputes, setDisputes] = useState(ADMIN_DISPUTES);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [disputeDialogOpen, setDisputeDialogOpen] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState<string | null>(null);
  const [disputeStatus, setDisputeStatus] = useState<DisputeStatus>(
    DisputeStatus.underReview,
  );
  const [disputeNotes, setDisputeNotes] = useState("");

  const updateKYC = useUpdateKYCStatus();
  const updateDispute = useUpdateDisputeStatus();

  const stats = [
    {
      label: "Total Users",
      value: ADMIN_USERS.length.toString(),
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Active Ads",
      value: adminAds
        .filter((a) => a.status === AdStatus.active)
        .length.toString(),
      icon: FileText,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Pending KYC",
      value: kycUsers
        .filter((u) => u.status === KYCStatus.pending)
        .length.toString(),
      icon: Shield,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Open Disputes",
      value: disputes
        .filter(
          (d) =>
            d.status === DisputeStatus.open ||
            d.status === DisputeStatus.underReview,
        )
        .length.toString(),
      icon: AlertTriangle,
      color: "text-red-600",
      bg: "bg-red-50",
    },
  ];

  const handleApproveKYC = async (principal: string) => {
    setProcessingId(principal);
    try {
      await updateKYC.mutateAsync({
        userPrincipal: principal,
        status: KYCStatus.approved,
        notes: "Approved by admin",
      });
    } catch {
      // fallback
    }
    setKycUsers((prev) =>
      prev.map((u) =>
        u.principal === principal ? { ...u, status: KYCStatus.approved } : u,
      ),
    );
    setProcessingId(null);
    toast.success("KYC approved");
  };

  const handleRejectKYC = async (principal: string) => {
    setProcessingId(principal);
    try {
      await updateKYC.mutateAsync({
        userPrincipal: principal,
        status: KYCStatus.rejected,
        notes: "Rejected - document unclear",
      });
    } catch {
      // fallback
    }
    setKycUsers((prev) =>
      prev.map((u) =>
        u.principal === principal ? { ...u, status: KYCStatus.rejected } : u,
      ),
    );
    setProcessingId(null);
    toast.success("KYC rejected");
  };

  const handleSuspendAd = (id: string) => {
    setAdminAds((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: AdStatus.suspended } : a)),
    );
    toast.success("Ad suspended");
  };

  const handleUpdateDispute = async () => {
    if (!selectedDispute) return;
    try {
      await updateDispute.mutateAsync({
        transactionId: selectedDispute,
        status: disputeStatus,
        notes: disputeNotes,
      });
    } catch {
      // fallback
    }
    setDisputes((prev) =>
      prev.map((d) =>
        d.id === selectedDispute ? { ...d, status: disputeStatus } : d,
      ),
    );
    setDisputeDialogOpen(false);
    toast.success("Dispute status updated");
  };

  const kycStatusBadge = (status: KYCStatus) => {
    if (status === KYCStatus.pending)
      return (
        <Badge
          variant="outline"
          className="text-xs bg-amber-50 text-amber-700 border-amber-200"
        >
          Pending
        </Badge>
      );
    if (status === KYCStatus.approved)
      return (
        <Badge variant="outline" className="text-xs badge-success">
          Approved
        </Badge>
      );
    return (
      <Badge
        variant="outline"
        className="text-xs bg-red-50 text-red-700 border-red-200"
      >
        Rejected
      </Badge>
    );
  };

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
                <div
                  className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}
                >
                  <Icon size={18} className={color} />
                </div>
              </div>
              <p className="font-display font-bold text-2xl text-foreground">
                {value}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="kyc">
        <TabsList className="mb-6">
          <TabsTrigger value="kyc" data-ocid="admin.kyc_queue.tab">
            KYC Queue
            {kycUsers.filter((u) => u.status === KYCStatus.pending).length >
              0 && (
              <span className="ml-1.5 bg-amber-500 text-white rounded-full px-1.5 py-0.5 text-xs font-bold">
                {kycUsers.filter((u) => u.status === KYCStatus.pending).length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="users" data-ocid="admin.users.tab">
            Users
          </TabsTrigger>
          <TabsTrigger value="ads" data-ocid="admin.ads.tab">
            Ads
          </TabsTrigger>
          <TabsTrigger value="disputes" data-ocid="admin.disputes.tab">
            Disputes
          </TabsTrigger>
        </TabsList>

        {/* KYC Queue */}
        <TabsContent value="kyc">
          <Card className="border-border/60 shadow-card">
            <CardContent className="p-0">
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
                  {kycUsers.map((user, i) => (
                    <TableRow
                      key={user.principal}
                      data-ocid={`admin.kyc.item.${i + 1}`}
                    >
                      <TableCell className="font-medium text-sm">
                        {user.name}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.docType}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.submittedDate}
                      </TableCell>
                      <TableCell>{kycStatusBadge(user.status)}</TableCell>
                      <TableCell className="text-right">
                        {user.status === KYCStatus.pending ? (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleApproveKYC(user.principal)}
                              disabled={processingId === user.principal}
                              className="gap-1 text-xs bg-green-600 hover:bg-green-700 text-white h-7"
                              data-ocid={`admin.approve_button.${i + 1}`}
                            >
                              {processingId === user.principal ? (
                                <Loader2 size={10} className="animate-spin" />
                              ) : (
                                <CheckCircle size={11} />
                              )}
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRejectKYC(user.principal)}
                              disabled={processingId === user.principal}
                              className="gap-1 text-xs text-destructive border-destructive/30 h-7"
                              data-ocid={`admin.reject_button.${i + 1}`}
                            >
                              <XCircle size={11} />
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users */}
        <TabsContent value="users">
          <Card className="border-border/60 shadow-card">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Verification</TableHead>
                    <TableHead>Trust Score</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ADMIN_USERS.map((user, i) => (
                    <TableRow
                      key={user.id}
                      data-ocid={`admin.users.item.${i + 1}`}
                    >
                      <TableCell className="font-medium text-sm">
                        {user.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs capitalize">
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <VerificationBadge
                          level={user.verification}
                          size="sm"
                          showLabel={false}
                        />
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {user.trustScore}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.joined}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-xs text-orange-600 border-orange-200 h-7"
                        >
                          <Ban size={11} />
                          Suspend
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ads */}
        <TabsContent value="ads">
          <Card className="border-border/60 shadow-card">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Seller</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adminAds.map((ad, i) => (
                    <TableRow key={ad.id} data-ocid={`admin.ads.item.${i + 1}`}>
                      <TableCell className="font-medium text-sm max-w-xs">
                        <span className="line-clamp-1">{ad.title}</span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {ad.seller}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {ad.country}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-xs capitalize ${
                            ad.status === AdStatus.active
                              ? "bg-green-50 text-green-700 border-green-200"
                              : ad.status === AdStatus.suspended
                                ? "bg-red-50 text-red-700 border-red-200"
                                : "bg-gray-100 text-gray-600 border-gray-200"
                          }`}
                        >
                          {ad.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {ad.created}
                      </TableCell>
                      <TableCell className="text-right">
                        {ad.status !== AdStatus.suspended && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSuspendAd(ad.id)}
                            className="gap-1 text-xs text-orange-600 border-orange-200 h-7"
                          >
                            <Ban size={11} />
                            Suspend
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Disputes */}
        <TabsContent value="disputes">
          <Card className="border-border/60 shadow-card">
            <CardContent className="p-0">
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
                  {disputes.map((dispute, i) => (
                    <TableRow
                      key={dispute.id}
                      data-ocid={`admin.disputes.item.${i + 1}`}
                    >
                      <TableCell className="font-mono text-xs">
                        {dispute.transactionId}
                      </TableCell>
                      <TableCell className="text-sm max-w-xs">
                        <span className="line-clamp-1">{dispute.reason}</span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-xs capitalize ${
                            dispute.status === DisputeStatus.open
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : dispute.status === DisputeStatus.underReview
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-green-50 text-green-700 border-green-200"
                          }`}
                        >
                          {dispute.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {dispute.filed}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-7"
                          onClick={() => {
                            setSelectedDispute(dispute.id);
                            setDisputeStatus(dispute.status);
                            setDisputeDialogOpen(true);
                          }}
                        >
                          Update Status
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dispute Update Dialog */}
      <Dialog open={disputeDialogOpen} onOpenChange={setDisputeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Dispute Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label>New Status</Label>
              <Select
                value={disputeStatus}
                onValueChange={(v) => setDisputeStatus(v as DisputeStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={DisputeStatus.open}>Open</SelectItem>
                  <SelectItem value={DisputeStatus.underReview}>
                    Under Review
                  </SelectItem>
                  <SelectItem value={DisputeStatus.resolvedBuyer}>
                    Resolved (Buyer)
                  </SelectItem>
                  <SelectItem value={DisputeStatus.resolvedSeller}>
                    Resolved (Seller)
                  </SelectItem>
                  <SelectItem value={DisputeStatus.closed}>Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Resolution Notes</Label>
              <Textarea
                placeholder="Add resolution notes for both parties..."
                rows={4}
                value={disputeNotes}
                onChange={(e) => setDisputeNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDisputeDialogOpen(false)}
              data-ocid="admin.dispute_cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateDispute}
              data-ocid="admin.dispute_confirm_button"
            >
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
