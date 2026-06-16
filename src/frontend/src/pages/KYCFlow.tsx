import { ArrowLeft, Upload, CheckCircle, Clock, Shield, Camera, FileText, AlertTriangle } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";

const LEVELS = [
  {
    level: 1,
    title: "Email Verification",
    desc: "Verify your email address",
    status: "completed",
    icon: CheckCircle,
  },
  {
    level: 2,
    title: "Phone Verification",
    desc: "Verify your mobile number",
    status: "completed",
    icon: CheckCircle,
  },
  {
    level: 3,
    title: "Identity Verification",
    desc: "Upload ID or Passport + Selfie",
    status: "in_review",
    icon: Clock,
  },
  {
    level: 4,
    title: "Business Verification",
    desc: "Company registration + Trade license",
    status: "locked",
    icon: Shield,
  },
];

export function KYCFlow() {
  const navigate = useNavigate();
  const [activeLevel, setActiveLevel] = useState<number | null>(3);
  const [docType, setDocType] = useState("passport");
  const [uploaded, setUploaded] = useState({ doc: false, selfie: false });
  const [submitted, setSubmitted] = useState(false);

  const handleUpload = (type: "doc" | "selfie") => {
    setUploaded((u) => ({ ...u, [type]: true }));
  };

  const handleSubmit = () => {
    setSubmitted(true);
  };

  return (
    <div className="flex flex-col pb-8">

      {/* BACK */}
      <div className="bg-white px-4 py-3 flex items-center gap-2 border-b border-gray-100">
        <button
          onClick={() => void navigate({ to: "/" })}
          className="p-1.5 rounded-full hover:bg-gray-100"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <span className="font-bold text-gray-800 text-sm">KYC Verification</span>
      </div>

      {/* WHY KYC */}
      <div className="mx-4 mt-4">
        <div className="bg-gradient-to-br from-[#1a1a2e] to-[#1a56f0] rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield size={18} className="text-white" />
            <span className="text-white font-bold text-sm">Why Verify?</span>
          </div>
          <div className="flex flex-col gap-1.5">
            {[
              "Higher trust score = more buyers",
              "Unlock Escrow payments",
              "Get verified badge on listings",
              "Required to withdraw funds",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <CheckCircle size={12} className="text-white/60" />
                <span className="text-white/80 text-xs">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* LEVELS */}
      <div className="mx-4 mt-4 flex flex-col gap-3">
        {LEVELS.map((l) => (
          <div
            key={l.level}
            onClick={() => l.status !== "locked" && setActiveLevel(activeLevel === l.level ? null : l.level)}
            className={`bg-white rounded-2xl shadow-sm overflow-hidden ${l.status !== "locked" ? "cursor-pointer" : "opacity-60"}`}
          >
            {/* LEVEL HEADER */}
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                l.status === "completed" ? "bg-green-50" :
                l.status === "in_review" ? "bg-amber-50" : "bg-gray-50"
              }`}>
                <l.icon size={20} className={
                  l.status === "completed" ? "text-green-500" :
                  l.status === "in_review" ? "text-amber-500" : "text-gray-300"
                } />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-800">Level {l.level}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    l.status === "completed" ? "bg-green-50 text-green-500" :
                    l.status === "in_review" ? "bg-amber-50 text-amber-500" :
                    "bg-gray-50 text-gray-400"
                  }`}>
                    {l.status === "completed" ? "✓ Done" :
                     l.status === "in_review" ? "Under Review" : "Locked"}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-0.5">{l.desc}</div>
              </div>
            </div>

            {/* LEVEL 3 EXPANDED */}
            {activeLevel === l.level && l.level === 3 && (
              <div className="px-4 pb-4 border-t border-gray-50">
                {submitted ? (
                  <div className="text-center py-4">
                    <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-3">
                      <Clock size={22} className="text-amber-500" />
                    </div>
                    <div className="font-bold text-gray-800 mb-1">Documents Submitted</div>
                    <div className="text-xs text-gray-500">Admin will review within 24-48 hours. You will be notified.</div>
                  </div>
                ) : (
                  <>
                    <div className="mt-3 mb-3">
                      <div className="text-xs font-bold text-gray-600 mb-2">Document Type</div>
                      <div className="flex gap-2">
                        {["passport", "national_id", "driving_license"].map((d) => (
                          <button
                            key={d}
                            onClick={() => setDocType(d)}
                            className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                              docType === d
                                ? "bg-[#1a56f0] text-white border-[#1a56f0]"
                                : "bg-gray-50 text-gray-600 border-gray-100"
                            }`}
                          >
                            {d === "passport" ? "Passport" : d === "national_id" ? "National ID" : "License"}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* UPLOAD DOC */}
                    <div className="mb-3">
                      <div className="text-xs font-bold text-gray-600 mb-2">
                        Upload {docType === "passport" ? "Passport" : docType === "national_id" ? "National ID" : "Driving License"}
                      </div>
                      <button
                        onClick={() => handleUpload("doc")}
                        className={`w-full border-2 border-dashed rounded-2xl py-5 flex flex-col items-center gap-2 transition-all ${
                          uploaded.doc
                            ? "border-green-200 bg-green-50"
                            : "border-gray-200 bg-gray-50 hover:border-[#1a56f0]/40"
                        }`}
                      >
                        {uploaded.doc ? (
                          <>
                            <CheckCircle size={24} className="text-green-500" />
                            <span className="text-xs font-semibold text-green-600">Document Uploaded ✓</span>
                          </>
                        ) : (
                          <>
                            <FileText size={24} className="text-gray-300" />
                            <span className="text-xs font-semibold text-gray-500">Tap to upload document</span>
                            <span className="text-[10px] text-gray-400">JPG, PNG or PDF · Max 5MB</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* UPLOAD SELFIE */}
                    <div className="mb-4">
                      <div className="text-xs font-bold text-gray-600 mb-2">Upload Selfie with Document</div>
                      <button
                        onClick={() => handleUpload("selfie")}
                        className={`w-full border-2 border-dashed rounded-2xl py-5 flex flex-col items-center gap-2 transition-all ${
                          uploaded.selfie
                            ? "border-green-200 bg-green-50"
                            : "border-gray-200 bg-gray-50 hover:border-[#1a56f0]/40"
                        }`}
                      >
                        {uploaded.selfie ? (
                          <>
                            <CheckCircle size={24} className="text-green-500" />
                            <span className="text-xs font-semibold text-green-600">Selfie Uploaded ✓</span>
                          </>
                        ) : (
                          <>
                            <Camera size={24} className="text-gray-300" />
                            <span className="text-xs font-semibold text-gray-500">Tap to take/upload selfie</span>
                            <span className="text-[10px] text-gray-400">Hold document next to your face</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-4 flex gap-2">
                      <AlertTriangle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                      <span className="text-[11px] text-amber-700">
                        Make sure all text is clearly visible. Blurry or cropped images will be rejected.
                      </span>
                    </div>

                    <button
                      onClick={handleSubmit}
                      disabled={!uploaded.doc || !uploaded.selfie}
                      className="w-full bg-[#1a56f0] text-white font-bold py-3.5 rounded-2xl text-sm disabled:opacity-40"
                    >
                      Submit for Review
                    </button>
                  </>
                )}
              </div>
            )}

            {/* LEVEL 4 EXPANDED */}
            {activeLevel === l.level && l.level === 4 && (
              <div className="px-4 pb-4 border-t border-gray-50">
                <div className="mt-3 text-xs text-gray-500 mb-3">
                  Complete Level 3 first to unlock Business Verification.
                </div>
                <div className="flex flex-col gap-2">
                  {["Company Registration Certificate", "Trade License", "Tax Registration Number"].map((doc) => (
                    <div key={doc} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5">
                      <FileText size={14} className="text-gray-300" />
                      <span className="text-xs text-gray-400">{doc}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

    </div>
  );
}
