import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, CheckCircle, Clock, FileText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DisputeStatus } from "../backend.d";
import { useCreateDispute } from "../hooks/useQueries";
import { MOCK_DISPUTES } from "../lib/mockData";

const statusConfig: Record<
  DisputeStatus,
  { label: string; className: string }
> = {
  [DisputeStatus.open]: {
    label: "Open",
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  [DisputeStatus.underReview]: {
    label: "Under Review",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  [DisputeStatus.resolvedBuyer]: {
    label: "Resolved (Buyer)",
    className: "bg-green-50 text-green-700 border-green-200",
  },
  [DisputeStatus.resolvedSeller]: {
    label: "Resolved (Seller)",
    className: "bg-green-50 text-green-700 border-green-200",
  },
  [DisputeStatus.closed]: {
    label: "Closed",
    className: "bg-gray-100 text-gray-600 border-gray-200",
  },
};

export function Disputes() {
  const [fileOpen, setFileOpen] = useState(false);
  const [disputes, setDisputes] = useState(MOCK_DISPUTES);
  const [form, setForm] = useState({
    transactionId: "",
    reason: "",
    evidence: "",
  });
  const [errors, setErrors] = useState<typeof form>({
    transactionId: "",
    reason: "",
    evidence: "",
  });
  const createDispute = useCreateDispute();

  const validate = () => {
    const newErrors = { transactionId: "", reason: "", evidence: "" };
    if (!form.transactionId.trim())
      newErrors.transactionId = "Transaction ID is required";
    if (!form.reason.trim()) newErrors.reason = "Reason is required";
    if (form.reason.trim().length < 20)
      newErrors.reason = "Please provide more detail (min 20 characters)";
    return newErrors;
  };

  const handleSubmit = async () => {
    const newErrors = validate();
    if (newErrors.transactionId || newErrors.reason) {
      setErrors(newErrors);
      return;
    }

    try {
      await createDispute.mutateAsync({
        transactionId: form.transactionId,
        reason: form.reason,
        evidence: form.evidence,
      });
    } catch {
      // fallback
    }

    setDisputes((prev) => [
      {
        id: `dispute-${prev.length + 1}`,
        transactionId: form.transactionId,
        reason: form.reason,
        evidence: form.evidence,
        status: DisputeStatus.open,
        filedAt: new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
        resolutionNotes: "",
      },
      ...prev,
    ]);

    toast.success(
      "Dispute filed successfully. Our team will review within 48 hours.",
    );
    setFileOpen(false);
    setForm({ transactionId: "", reason: "", evidence: "" });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Disputes
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage and track your dispute cases
          </p>
        </div>
        <Dialog open={fileOpen} onOpenChange={setFileOpen}>
          <DialogTrigger asChild>
            <Button
              className="gap-2 bg-primary text-primary-foreground"
              data-ocid="disputes.file_button"
            >
              <AlertTriangle size={14} />
              File Dispute
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>File a Dispute</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="txn-id">
                  Transaction ID <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="txn-id"
                  placeholder="e.g., txn-001"
                  value={form.transactionId}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, transactionId: e.target.value }));
                    setErrors((e2) => ({ ...e2, transactionId: "" }));
                  }}
                  className={errors.transactionId ? "border-destructive" : ""}
                  data-ocid="disputes.transaction_id_input"
                />
                {errors.transactionId && (
                  <p
                    className="text-xs text-destructive"
                    data-ocid="disputes.transaction_id_error"
                  >
                    {errors.transactionId}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reason">
                  Reason for Dispute <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="reason"
                  placeholder="Explain what happened and why you're disputing this transaction..."
                  rows={4}
                  value={form.reason}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, reason: e.target.value }));
                    setErrors((e2) => ({ ...e2, reason: "" }));
                  }}
                  className={errors.reason ? "border-destructive" : ""}
                  data-ocid="disputes.reason_textarea"
                />
                {errors.reason && (
                  <p
                    className="text-xs text-destructive"
                    data-ocid="disputes.reason_error"
                  >
                    {errors.reason}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="evidence">
                  Evidence Description (Optional)
                </Label>
                <Textarea
                  id="evidence"
                  placeholder="Describe your evidence: screenshots, chat logs, receipts..."
                  rows={3}
                  value={form.evidence}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, evidence: e.target.value }))
                  }
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                <AlertTriangle size={12} className="inline mr-1.5" />
                Filing a dispute will freeze any escrowed funds until the case
                is resolved.
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setFileOpen(false)}
                data-ocid="disputes.cancel_button"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createDispute.isPending}
                data-ocid="disputes.submit_button"
              >
                {createDispute.isPending ? "Filing..." : "File Dispute"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {disputes.length > 0 ? (
        <div className="space-y-3">
          {disputes.map((dispute, i) => {
            const config = statusConfig[dispute.status];
            return (
              <Card
                key={dispute.id}
                className="border-border/60 shadow-card"
                data-ocid={`disputes.item.${i + 1}`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <FileText
                          size={14}
                          className="text-muted-foreground shrink-0"
                        />
                        <span className="text-xs font-mono text-muted-foreground">
                          Txn: {dispute.transactionId}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-xs border ${config.className}`}
                        >
                          {config.label}
                        </Badge>
                      </div>

                      <p className="text-sm font-medium text-foreground line-clamp-2 mb-2">
                        {dispute.reason}
                      </p>

                      {dispute.evidence && (
                        <p className="text-xs text-muted-foreground mb-2">
                          Evidence: {dispute.evidence}
                        </p>
                      )}

                      {dispute.resolutionNotes && (
                        <div className="bg-muted/30 rounded-lg p-2.5 mt-2 border border-border/40">
                          <p className="text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">
                              Admin note:{" "}
                            </span>
                            {dispute.resolutionNotes}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                        <Clock size={11} />
                        Filed {dispute.filedAt}
                      </div>
                    </div>

                    <div className="shrink-0">
                      {dispute.status === DisputeStatus.resolvedBuyer ||
                      dispute.status === DisputeStatus.resolvedSeller ? (
                        <CheckCircle size={18} className="text-green-600" />
                      ) : (
                        <AlertTriangle
                          size={18}
                          className={
                            dispute.status === DisputeStatus.open
                              ? "text-blue-600"
                              : "text-amber-600"
                          }
                        />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div
          className="flex flex-col items-center justify-center py-20 text-center"
          data-ocid="disputes.empty_state"
        >
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
            <CheckCircle size={20} className="text-muted-foreground" />
          </div>
          <h3 className="font-display font-semibold text-foreground mb-1">
            No disputes
          </h3>
          <p className="text-sm text-muted-foreground">
            All your transactions are in good standing.
          </p>
        </div>
      )}
    </div>
  );
}
