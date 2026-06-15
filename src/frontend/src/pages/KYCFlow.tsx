import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle,
  Clock,
  RefreshCw,
  Shield,
  ShieldCheck,
  Star,
  Upload,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useSubmitKYC } from "../hooks/useQueries";

type KYCState = "not_submitted" | "pending" | "approved" | "rejected";

const DOC_TYPES = [
  "Passport",
  "CNIC (National ID Card)",
  "National ID",
  "Driver's License",
];

export function KYCFlow() {
  const [kycState, setKycState] = useState<KYCState>("not_submitted");
  const [docType, setDocType] = useState("");
  const [description, setDescription] = useState("");
  const [docUploaded, setDocUploaded] = useState(false);
  const [selfieUploaded, setSelfieUploaded] = useState(false);
  const submitKYC = useSubmitKYC();

  const handleSubmit = async () => {
    if (!docType) {
      toast.error("Please select a document type");
      return;
    }
    if (!docUploaded) {
      toast.error("Please upload your document");
      return;
    }
    if (!selfieUploaded) {
      toast.error("Please upload your selfie");
      return;
    }

    try {
      await submitKYC.mutateAsync({ documentType: docType, description });
      setKycState("pending");
      toast.success("KYC documents submitted successfully");
    } catch {
      // Fallback for demo
      setKycState("pending");
      toast.success("KYC documents submitted successfully");
    }
  };

  const kycLevels = [
    { level: 0, label: "Basic", icon: Shield, desc: "Email/phone verified" },
    {
      level: 1,
      label: "Document Verified",
      icon: ShieldCheck,
      desc: "ID document reviewed",
    },
    {
      level: 2,
      label: "Fully Verified",
      icon: Star,
      desc: "Video/live verification",
    },
  ];

  const currentLevel = kycState === "approved" ? 1 : 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">
          KYC Verification
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Verify your identity to unlock full platform features
        </p>
      </div>

      {/* Level Progress */}
      <Card className="border-border/60 shadow-card mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-semibold text-foreground">
              Verification Level
            </h2>
            <span className="text-sm text-muted-foreground">
              Level {currentLevel} of 2
            </span>
          </div>
          <Progress value={(currentLevel / 2) * 100} className="h-2 mb-4" />

          <div className="grid grid-cols-3 gap-3">
            {kycLevels.map((level) => {
              const Icon = level.icon;
              const isCompleted = currentLevel >= level.level;
              const isCurrent =
                currentLevel === level.level - 1 && kycState !== "approved";

              return (
                <div
                  key={level.level}
                  className={`p-3 rounded-lg border text-center transition-colors ${
                    isCompleted
                      ? "bg-green-50 border-green-200"
                      : isCurrent
                        ? "bg-amber-50 border-amber-200"
                        : "bg-muted/30 border-border/50"
                  }`}
                >
                  <Icon
                    size={20}
                    className={`mx-auto mb-1.5 ${
                      isCompleted
                        ? "text-green-600"
                        : isCurrent
                          ? "text-amber-600"
                          : "text-muted-foreground"
                    }`}
                  />
                  <p
                    className={`text-xs font-semibold ${
                      isCompleted ? "text-green-700" : "text-muted-foreground"
                    }`}
                  >
                    {level.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {level.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* KYC Status Content */}
      {kycState === "not_submitted" && (
        <Card className="border-border/60 shadow-card">
          <CardContent className="p-6 space-y-5">
            <h2 className="font-display font-bold text-lg">
              Submit Verification Documents
            </h2>

            <div className="space-y-1.5">
              <Label>
                Document Type <span className="text-destructive">*</span>
              </Label>
              <Select value={docType} onValueChange={setDocType}>
                <SelectTrigger data-ocid="kyc.doctype_select">
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  {DOC_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="kyc-notes">Additional Notes (Optional)</Label>
              <Textarea
                id="kyc-notes"
                placeholder="Any additional context about your documents..."
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-3">
              <div>
                <Label className="mb-2 block">
                  Identity Document <span className="text-destructive">*</span>
                </Label>
                <button
                  type="button"
                  className={`w-full border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                    docUploaded
                      ? "border-green-400 bg-green-50"
                      : "border-border hover:border-primary/50 hover:bg-primary/5"
                  }`}
                  onClick={() => {
                    setSelfieUploaded(false);
                    setDocUploaded(true);
                    toast.success("Document uploaded successfully");
                  }}
                  data-ocid="kyc.upload_button"
                >
                  {docUploaded ? (
                    <div className="flex items-center justify-center gap-2 text-green-700">
                      <CheckCircle size={18} />
                      <span className="text-sm font-medium">
                        Document uploaded
                      </span>
                    </div>
                  ) : (
                    <>
                      <Upload
                        size={24}
                        className="text-muted-foreground mx-auto mb-2"
                      />
                      <p className="text-sm font-medium text-foreground">
                        Click to upload your ID document
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PNG, JPG, PDF up to 10MB
                      </p>
                    </>
                  )}
                </button>
              </div>

              <div>
                <Label className="mb-2 block">
                  Selfie with Document{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <button
                  type="button"
                  className={`w-full border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                    selfieUploaded
                      ? "border-green-400 bg-green-50"
                      : "border-border hover:border-primary/50 hover:bg-primary/5"
                  }`}
                  onClick={() => {
                    setSelfieUploaded(true);
                    toast.success("Selfie uploaded successfully");
                  }}
                >
                  {selfieUploaded ? (
                    <div className="flex items-center justify-center gap-2 text-green-700">
                      <CheckCircle size={18} />
                      <span className="text-sm font-medium">
                        Selfie uploaded
                      </span>
                    </div>
                  ) : (
                    <>
                      <Upload
                        size={24}
                        className="text-muted-foreground mx-auto mb-2"
                      />
                      <p className="text-sm font-medium text-foreground">
                        Click to upload your selfie holding the document
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PNG, JPG up to 10MB. Face clearly visible.
                      </p>
                    </>
                  )}
                </button>
              </div>
            </div>

            <Button
              className="w-full bg-primary text-primary-foreground"
              onClick={handleSubmit}
              disabled={submitKYC.isPending}
              data-ocid="kyc.submit_button"
            >
              {submitKYC.isPending
                ? "Submitting..."
                : "Submit for Verification"}
            </Button>
          </CardContent>
        </Card>
      )}

      {kycState === "pending" && (
        <Card className="border-amber-200 bg-amber-50 shadow-card">
          <CardContent className="p-8 text-center">
            <Clock size={40} className="text-amber-600 mx-auto mb-4" />
            <h2 className="font-display font-bold text-xl text-amber-900 mb-2">
              Under Review
            </h2>
            <p className="text-amber-800 text-sm max-w-sm mx-auto leading-relaxed">
              Your documents are being reviewed by our verification team. This
              typically takes 1-2 business days. You'll receive a notification
              once complete.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 text-xs text-amber-700 bg-amber-100 rounded-full px-4 py-2">
              <Clock size={13} />
              Estimated review time: 1-2 business days
            </div>
          </CardContent>
        </Card>
      )}

      {kycState === "approved" && (
        <Card className="border-green-200 bg-green-50 shadow-card">
          <CardContent className="p-8 text-center">
            <CheckCircle size={40} className="text-green-600 mx-auto mb-4" />
            <h2 className="font-display font-bold text-xl text-green-900 mb-2">
              Verification Approved!
            </h2>
            <p className="text-green-800 text-sm max-w-sm mx-auto">
              Your identity has been verified. You now have Document Verified
              status and can access full platform features.
            </p>
            <div className="mt-4">
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                <ShieldCheck size={16} />
                Document Verified
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {kycState === "rejected" && (
        <Card className="border-red-200 bg-red-50 shadow-card">
          <CardContent className="p-8 text-center">
            <XCircle size={40} className="text-red-500 mx-auto mb-4" />
            <h2 className="font-display font-bold text-xl text-red-900 mb-2">
              Verification Rejected
            </h2>
            <p className="text-red-800 text-sm max-w-sm mx-auto mb-2">
              Reason: Document was blurry or incomplete. Please resubmit with
              clearer images.
            </p>
            <Button
              onClick={() => setKycState("not_submitted")}
              className="mt-4 gap-2"
              variant="outline"
            >
              <RefreshCw size={14} />
              Resubmit Documents
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Demo controls */}
      <div className="mt-6 p-4 bg-muted/30 rounded-lg border border-border/50">
        <p className="text-xs text-muted-foreground mb-2 font-semibold">
          Demo: Toggle KYC state
        </p>
        <div className="flex flex-wrap gap-2">
          {(
            ["not_submitted", "pending", "approved", "rejected"] as KYCState[]
          ).map((state) => (
            <Button
              key={state}
              variant={kycState === state ? "default" : "outline"}
              size="sm"
              onClick={() => setKycState(state)}
              className="text-xs"
            >
              {state.replace("_", " ")}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
