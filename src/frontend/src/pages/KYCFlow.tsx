import { ArrowLeft, Shield, Camera, CheckCircle, Clock, Video, Loader2, XCircle, RefreshCw, Building2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, base64] = dataUrl.split(",");
  const mimeMatch = meta.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

export function KYCFlow() {
  const navigate = useNavigate();
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [existingStatus, setExistingStatus] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);

  // Level 4 — Business
  const [businessStatus, setBusinessStatus] = useState<string>("none");
  const [businessRejection, setBusinessRejection] = useState<string | null>(null);
  const [bizForm, setBizForm] = useState({ companyName: "", regNumber: "" });
  const [licenseDoc, setLicenseDoc] = useState<File | null>(null);
  const [licensePreview, setLicensePreview] = useState<string | null>(null);
  const [regDoc, setRegDoc] = useState<File | null>(null);
  const [regPreview, setRegPreview] = useState<string | null>(null);
  const [bizSubmitting, setBizSubmitting] = useState(false);

  const [activeLevel, setActiveLevel] = useState(3);
  const [docType, setDocType] = useState<"passport" | "nid" | "license">("passport");
  const [form, setForm] = useState({ fullName: "", dob: "", nationality: "", docNumber: "", address: "" });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");

  const [docFront, setDocFront] = useState<string | null>(null);
  const [docBack, setDocBack] = useState<string | null>(null);
  const [selfie, setSelfie] = useState<string | null>(null);
  const [videoBlob, setVideoBlob] = useState<string | null>(null);
  const [videoRawBlob, setVideoRawBlob] = useState<Blob | null>(null);

  const [videoRecording, setVideoRecording] = useState(false);
  const [videoTimer, setVideoTimer] = useState(0);
  const [activeCamera, setActiveCamera] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const videoElRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const liveVideoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    void loadStatus();
    return () => {
      stopStream();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  async function loadStatus() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) { setLoadingStatus(false); void navigate({ to: "/login" }); return; }
    setUserId(userData.user.id);

    const { data: profile } = await supabase
      .from("profiles")
      .select("kyc_status, full_name, business_status")
      .eq("id", userData.user.id)
      .single();

    setExistingStatus(profile?.kyc_status ?? "none");
    setBusinessStatus(profile?.business_status ?? "none");
    if (profile?.full_name) setForm((p) => ({ ...p, fullName: profile.full_name }));

    if (profile?.kyc_status === "rejected") {
      const { data: submission } = await supabase
        .from("kyc_submissions")
        .select("rejection_reason")
        .eq("user_id", userData.user.id)
        .order("submitted_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setRejectionReason(submission?.rejection_reason ?? null);
    }

    if (profile?.business_status === "rejected") {
      const { data: bv } = await supabase
        .from("business_verifications")
        .select("rejection_reason")
        .eq("user_id", userData.user.id)
        .order("submitted_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setBusinessRejection(bv?.rejection_reason ?? null);
    }

    if (profile?.kyc_status === "pending" || profile?.kyc_status === "approved") {
      setSubmitted(true);
    }

    setLoadingStatus(false);
  }

  function stopStream() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }

  const startCamera = useCallback(async (target: string) => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: target === "selfie" ? "user" : "environment" },
      });
      streamRef.current = s;
      setActiveCamera(target);
      requestAnimationFrame(() => {
        if (videoElRef.current) {
          videoElRef.current.srcObject = s;
          videoElRef.current.play().catch(() => {});
        }
      });
    } catch {
      alert("Camera access denied. Please allow camera permission in your browser settings.");
    }
  }, []);

  const capturePhoto = useCallback(() => {
    const videoEl = videoElRef.current;
    const canvas = canvasRef.current;
    if (!videoEl || !canvas || !activeCamera) return;

    canvas.width = videoEl.videoWidth || 640;
    canvas.height = videoEl.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    const target = activeCamera;

    stopStream();
    if (videoElRef.current) videoElRef.current.srcObject = null;
    setActiveCamera(null);

    if (target === "front") setDocFront(dataUrl);
    else if (target === "back") setDocBack(dataUrl);
    else if (target === "selfie") setSelfie(dataUrl);
  }, [activeCamera]);

  const cancelCamera = useCallback(() => {
    stopStream();
    if (videoElRef.current) videoElRef.current.srcObject = null;
    setActiveCamera(null);
  }, []);

  const startVideoRecording = useCallback(async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: true });
      streamRef.current = s;
      setVideoRecording(true);
      setVideoTimer(0);

      requestAnimationFrame(() => {
        if (liveVideoRef.current) {
          liveVideoRef.current.srcObject = s;
          liveVideoRef.current.play().catch(() => {});
        }
      });

      const recorder = new MediaRecorder(s);
      mediaRecorderRef.current = recorder;
      videoChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) videoChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(videoChunksRef.current, { type: "video/webm" });
        setVideoBlob(URL.createObjectURL(blob));
        setVideoRawBlob(blob);
        stopStream();
        if (liveVideoRef.current) liveVideoRef.current.srcObject = null;
        setVideoRecording(false);
        if (timerIntervalRef.current) { clearInterval(timerIntervalRef.current); timerIntervalRef.current = null; }
      };

      recorder.start();

      let sec = 0;
      timerIntervalRef.current = setInterval(() => {
        sec++;
        setVideoTimer(sec);
        if (sec >= 15) {
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
          if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop();
          }
        }
      }, 1000);
    } catch {
      alert("Camera/microphone access denied. Please allow permissions.");
    }
  }, []);

  function resetForResubmit() {
    setSubmitted(false);
    setDocFront(null);
    setDocBack(null);
    setSelfie(null);
    setVideoBlob(null);
    setVideoRawBlob(null);
    setForm((p) => ({ ...p, dob: "", nationality: "", docNumber: "" }));
  }

  async function handleSubmit() {
    if (!userId) return;
    if (!form.fullName) { alert("Full name is required"); return; }
    if (!docFront) { alert("Please capture document front photo"); return; }
    if (!selfie) { alert("Please take a selfie"); return; }
    if (!videoRawBlob) { alert("Please record a 15-second face video"); return; }

    setSubmitting(true);

    try {
      const folder = `${userId}/${Date.now()}`;

      setUploadProgress("Uploading document front...");
      const frontBlob = dataUrlToBlob(docFront);
      const { error: frontErr } = await supabase.storage.from("kyc-documents").upload(`${folder}/front.jpg`, frontBlob, { contentType: "image/jpeg" });
      if (frontErr) throw frontErr;
      const { data: frontUrl } = supabase.storage.from("kyc-documents").getPublicUrl(`${folder}/front.jpg`);

      let backUrl: string | null = null;
      if (docBack) {
        setUploadProgress("Uploading document back...");
        const backBlob = dataUrlToBlob(docBack);
        const { error: backErr } = await supabase.storage.from("kyc-documents").upload(`${folder}/back.jpg`, backBlob, { contentType: "image/jpeg" });
        if (backErr) throw backErr;
        backUrl = supabase.storage.from("kyc-documents").getPublicUrl(`${folder}/back.jpg`).data.publicUrl;
      }

      setUploadProgress("Uploading selfie...");
      const selfieBlob = dataUrlToBlob(selfie);
      const { error: selfieErr } = await supabase.storage.from("kyc-documents").upload(`${folder}/selfie.jpg`, selfieBlob, { contentType: "image/jpeg" });
      if (selfieErr) throw selfieErr;
      const { data: selfieUrl } = supabase.storage.from("kyc-documents").getPublicUrl(`${folder}/selfie.jpg`);

      setUploadProgress("Uploading face video...");
      const { error: videoErr } = await supabase.storage.from("kyc-documents").upload(`${folder}/face-video.webm`, videoRawBlob, { contentType: "video/webm" });
      if (videoErr) throw videoErr;
      const { data: faceVideoUrl } = supabase.storage.from("kyc-documents").getPublicUrl(`${folder}/face-video.webm`);

      setUploadProgress("Saving submission...");

      const { error: insertErr } = await supabase.from("kyc_submissions").insert({
        user_id: userId,
        full_name: form.fullName,
        date_of_birth: form.dob || null,
        nationality: form.nationality || null,
        document_type: docType,
        document_number: form.docNumber || null,
        document_front_url: frontUrl.publicUrl,
        document_back_url: backUrl,
        selfie_url: selfieUrl.publicUrl,
        face_video_url: faceVideoUrl.publicUrl,
        status: "pending",
      });
      if (insertErr) throw insertErr;

      await supabase.from("profiles").update({
        kyc_status: "pending",
        kyc_level: 0,
      }).eq("id", userId);

      setExistingStatus("pending");
      setSubmitted(true);
    } catch (err: any) {
      alert("Submission failed: " + (err.message ?? "unknown error"));
    } finally {
      setSubmitting(false);
      setUploadProgress("");
    }
  }

  // ── Level 4 Business Submit ──
  async function handleBusinessSubmit() {
    if (!userId) return;
    if (!bizForm.companyName.trim()) { alert("Company name is required"); return; }
    if (!licenseDoc) { alert("Please upload your trade license photo"); return; }

    setBizSubmitting(true);
    try {
      const folder = `${userId}/${Date.now()}`;

      const licExt = licenseDoc.name.split(".").pop() || "jpg";
      const { error: licErr } = await supabase.storage.from("business-docs").upload(`${folder}/license.${licExt}`, licenseDoc, { contentType: licenseDoc.type || "image/jpeg" });
      if (licErr) throw licErr;
      const licUrl = supabase.storage.from("business-docs").getPublicUrl(`${folder}/license.${licExt}`).data.publicUrl;

      let regUrl: string | null = null;
      if (regDoc) {
        const regExt = regDoc.name.split(".").pop() || "jpg";
        const { error: regErr } = await supabase.storage.from("business-docs").upload(`${folder}/registration.${regExt}`, regDoc, { contentType: regDoc.type || "image/jpeg" });
        if (regErr) throw regErr;
        regUrl = supabase.storage.from("business-docs").getPublicUrl(`${folder}/registration.${regExt}`).data.publicUrl;
      }

      const { error: insertErr } = await supabase.from("business_verifications").insert({
        user_id: userId,
        company_name: bizForm.companyName.trim(),
        registration_number: bizForm.regNumber.trim() || null,
        license_doc_url: licUrl,
        registration_doc_url: regUrl,
        status: "pending",
      });
      if (insertErr) throw insertErr;

      await supabase.from("profiles").update({ business_status: "pending" }).eq("id", userId);
      setBusinessStatus("pending");
    } catch (err: any) {
      alert("Submission failed: " + (err.message ?? "unknown error"));
    } finally {
      setBizSubmitting(false);
    }
  }

  if (loadingStatus) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-gray-300" size={28} />
      </div>
    );
  }

  if (activeCamera) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col" style={{ touchAction: "none" }}>
        <div className="flex items-center gap-3 px-4 py-4 bg-black flex-shrink-0">
          <button onClick={cancelCamera} className="text-white text-2xl leading-none">‹</button>
          <span className="text-white font-bold text-sm">
            {activeCamera === "front" ? `Capture ${docType === "passport" ? "Passport" : "ID"} Front`
              : activeCamera === "back" ? `Capture ${docType === "passport" ? "Passport" : "ID"} Back`
              : "Take Selfie with Document"}
          </span>
        </div>
        <div className="flex-1 relative bg-black overflow-hidden">
          <video ref={videoElRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />
        </div>
        <canvas ref={canvasRef} className="hidden" />
        <div className="p-6 bg-black flex-shrink-0">
          <div className="text-center text-white/60 text-xs mb-4">
            {activeCamera === "selfie"
              ? "Hold your document next to your face — both must be clearly visible"
              : "Make sure all text is clearly readable — good lighting required"}
          </div>
          <button onClick={capturePhoto} className="w-full bg-white text-black font-black py-4 rounded-2xl text-base flex items-center justify-center gap-2">
            <Camera size={20} /> Capture Photo
          </button>
        </div>
      </div>
    );
  }

  const level3Done = existingStatus === "approved";

  const LEVELS = [
    { level: 1, title: "Email Verification", desc: "Verify your email address" },
    { level: 2, title: "Phone Verification", desc: "Verify your mobile number" },
    { level: 3, title: "Identity Verification", desc: "ID/Passport + Selfie + Face Video" },
    { level: 4, title: "Business Verification", desc: "Company Registration + Trade License" },
  ];

  return (
    <div className="flex flex-col pb-8">

      <div className="bg-white px-4 py-3 flex items-center gap-2 border-b border-gray-100">
        <button onClick={() => void navigate({ to: "/" })} className="p-1.5 rounded-full hover:bg-gray-100">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <span className="font-bold text-gray-800 text-sm">KYC Verification</span>
      </div>

      <div className="mx-4 mt-4">
        <div className="bg-gradient-to-br from-[#00302e] to-[#004B49] rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield size={18} className="text-[#D4AF37]" />
            <span className="text-white font-bold text-sm">Why Verify?</span>
          </div>
          <div className="flex flex-col gap-1.5">
            {["Unlock Escrow payments", "Get verified badge on listings", "Higher trust = more clients", "Required to withdraw funds"].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <CheckCircle size={11} className="text-white/60" />
                <span className="text-white/80 text-xs">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-4 mt-4 flex flex-col gap-3">
        {LEVELS.map((l) => {
          // status calculation
          let displayStatus = "completed";
          let pillText = "✓ Done";
          if (l.level === 3) {
            displayStatus = existingStatus === "approved" ? "completed" : existingStatus === "pending" ? "pending" : existingStatus === "rejected" ? "rejected" : "required";
            pillText = existingStatus === "approved" ? "✓ Verified" : existingStatus === "pending" ? "⏳ Under Review" : existingStatus === "rejected" ? "❌ Rejected" : "Required";
          }
          if (l.level === 4) {
            if (!level3Done) { displayStatus = "locked"; pillText = "Locked"; }
            else {
              displayStatus = businessStatus === "approved" ? "completed" : businessStatus === "pending" ? "pending" : businessStatus === "rejected" ? "rejected" : "required";
              pillText = businessStatus === "approved" ? "✓ Verified" : businessStatus === "pending" ? "⏳ Under Review" : businessStatus === "rejected" ? "❌ Rejected" : "Required";
            }
          }
          const isLocked = displayStatus === "locked";

          return (
            <div key={l.level} className={`bg-white rounded-2xl shadow-sm overflow-hidden ${isLocked ? "opacity-50" : ""}`}>

              <button type="button"
                onClick={() => !isLocked && setActiveLevel(activeLevel === l.level ? 0 : l.level)}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
                disabled={isLocked}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  displayStatus === "completed" ? "bg-green-50"
                  : displayStatus === "rejected" ? "bg-red-50"
                  : displayStatus === "pending" ? "bg-[#FBF3E1]"
                  : "bg-gray-50"
                }`}>
                  {displayStatus === "completed" ? <CheckCircle size={20} className="text-green-500" />
                    : displayStatus === "rejected" ? <XCircle size={20} className="text-red-500" />
                    : displayStatus === "pending" ? <Clock size={20} className="text-[#9c7a1f]" />
                    : l.level === 4 ? <Building2 size={20} className="text-gray-300" />
                    : <Shield size={20} className="text-gray-300" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-gray-800">Level {l.level} — {l.title}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      displayStatus === "completed" ? "bg-green-50 text-green-500"
                      : displayStatus === "rejected" ? "bg-red-50 text-red-500"
                      : displayStatus === "pending" ? "bg-[#FBF3E1] text-[#9c7a1f]"
                      : "bg-gray-50 text-gray-400"
                    }`}>
                      {pillText}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">{l.desc}</div>
                </div>
              </button>

              {/* ── LEVEL 3 CONTENT ── */}
              {activeLevel === 3 && l.level === 3 && (
                <div className="px-4 pb-4 border-t border-gray-50">

                  {existingStatus === "rejected" && submitted && (
                    <div className="mt-3">
                      <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <XCircle size={18} className="text-red-500 flex-shrink-0" />
                          <span className="font-black text-red-700 text-sm">KYC Rejected</span>
                        </div>
                        {rejectionReason && (
                          <div className="text-xs text-red-600 mb-2">
                            <span className="font-bold">Reason: </span>{rejectionReason}
                          </div>
                        )}
                        <div className="text-xs text-red-500 flex flex-col gap-1">
                          <div>• Make sure documents are clear and readable</div>
                          <div>• Use good lighting for photos</div>
                          <div>• Selfie must show your face and document clearly</div>
                        </div>
                      </div>
                      <button onClick={resetForResubmit}
                        className="w-full bg-[#004B49] text-white font-bold py-4 rounded-2xl text-sm flex items-center justify-center gap-2">
                        <RefreshCw size={16} /> Resubmit KYC
                      </button>
                    </div>
                  )}

                  {existingStatus === "pending" && submitted && (
                    <div className="text-center py-6">
                      <div className="w-14 h-14 bg-[#FBF3E1] rounded-full flex items-center justify-center mx-auto mb-3">
                        <Clock size={26} className="text-[#9c7a1f]" />
                      </div>
                      <div className="font-black text-gray-800 text-lg mb-1">Under Review</div>
                      <div className="text-sm text-gray-500 mb-3">Admin will review within 24-48 hours.</div>
                    </div>
                  )}

                  {existingStatus === "approved" && (
                    <div className="text-center py-6">
                      <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <CheckCircle size={26} className="text-green-500" />
                      </div>
                      <div className="font-black text-gray-800 text-lg mb-1">KYC Verified ✅</div>
                      <div className="text-sm text-gray-500">Your identity has been verified.</div>
                    </div>
                  )}

                  {!submitted && (
                    <div className="mt-3 flex flex-col gap-4">

                      {existingStatus === "rejected" && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2">
                          <span className="text-amber-600 flex-shrink-0">⚠️</span>
                          <span className="text-xs text-amber-700 font-semibold">Please fix the issues and resubmit your documents carefully.</span>
                        </div>
                      )}

                      <div>
                        <div className="text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">Document Type</div>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { key: "passport", emoji: "📘", label: "Passport", desc: "International" },
                            { key: "nid", emoji: "🆔", label: "National ID", desc: "Local Gov ID" },
                            { key: "license", emoji: "🪪", label: "Driving License", desc: "Gov Issued" },
                          ].map((d) => (
                            <button key={d.key} type="button" onClick={() => setDocType(d.key as "passport" | "nid" | "license")}
                              className={`border-2 rounded-xl py-2.5 px-1 text-center transition-all ${docType === d.key ? "border-[#004B49] bg-[#E8F0EF]" : "border-gray-100 bg-gray-50"}`}>
                              <div className="text-base">{d.emoji}</div>
                              <div className="text-[10px] font-bold text-gray-700 mt-0.5">{d.label}</div>
                              <div className="text-[9px] text-gray-400">{d.desc}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">Personal Information</div>
                        <div className="flex flex-col gap-2">
                          <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Full Name *</label>
                            <input value={form.fullName} onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
                              placeholder="Full Name"
                              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-[#004B49]" />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Date of Birth</label>
                              <input type="date" value={form.dob} onChange={(e) => setForm((p) => ({ ...p, dob: e.target.value }))}
                                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-[#004B49]" />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Nationality</label>
                              <input value={form.nationality} onChange={(e) => setForm((p) => ({ ...p, nationality: e.target.value }))}
                                placeholder="e.g. Pakistani"
                                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-[#004B49]" />
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">
                              {docType === "passport" ? "Passport Number" : docType === "nid" ? "ID Number" : "License Number"} *
                            </label>
                            <input value={form.docNumber} onChange={(e) => setForm((p) => ({ ...p, docNumber: e.target.value }))}
                              placeholder={docType === "passport" ? "AB1234567" : docType === "nid" ? "00000-0000000-0" : "DL-123456"}
                              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-[#004B49]" />
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">Document Photos</div>
                        <div className="flex flex-col gap-2">
                          <div>
                            <div className="text-[10px] text-gray-400 font-semibold mb-1">{docType === "passport" ? "Passport Photo Page" : "Front Side"} *</div>
                            {docFront ? (
                              <div className="relative">
                                <img src={docFront} alt="Doc Front" className="w-full rounded-xl border border-gray-100 max-h-32 object-cover" />
                                <button type="button" onClick={() => setDocFront(null)} className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg">Retake</button>
                                <div className="absolute bottom-2 left-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">✓ Captured</div>
                              </div>
                            ) : (
                              <button type="button" onClick={() => void startCamera("front")}
                                className="w-full border-2 border-dashed border-gray-200 rounded-xl py-4 flex flex-col items-center gap-1.5 hover:border-[#004B49]/40 transition-all">
                                <Camera size={22} className="text-gray-300" />
                                <span className="text-xs font-semibold text-gray-400">Tap to capture with camera</span>
                              </button>
                            )}
                          </div>

                          {docType !== "passport" && (
                            <div>
                              <div className="text-[10px] text-gray-400 font-semibold mb-1">Back Side *</div>
                              {docBack ? (
                                <div className="relative">
                                  <img src={docBack} alt="Doc Back" className="w-full rounded-xl border border-gray-100 max-h-32 object-cover" />
                                  <button type="button" onClick={() => setDocBack(null)} className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg">Retake</button>
                                  <div className="absolute bottom-2 left-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">✓ Captured</div>
                                </div>
                              ) : (
                                <button type="button" onClick={() => void startCamera("back")}
                                  className="w-full border-2 border-dashed border-gray-200 rounded-xl py-4 flex flex-col items-center gap-1.5 hover:border-[#004B49]/40 transition-all">
                                  <Camera size={22} className="text-gray-300" />
                                  <span className="text-xs font-semibold text-gray-400">Tap to capture back side</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Selfie with Document *</div>
                        <div className="text-[10px] text-gray-400 mb-2">Hold your document next to your face — both must be clearly visible</div>
                        {selfie ? (
                          <div className="relative">
                            <img src={selfie} alt="Selfie" className="w-full rounded-xl border border-gray-100 max-h-40 object-cover" />
                            <button type="button" onClick={() => setSelfie(null)} className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg">Retake</button>
                            <div className="absolute bottom-2 left-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">✓ Captured</div>
                          </div>
                        ) : (
                          <button type="button" onClick={() => void startCamera("selfie")}
                            className="w-full border-2 border-dashed border-gray-200 rounded-xl py-4 flex flex-col items-center gap-1.5 hover:border-[#004B49]/40 transition-all">
                            <Camera size={22} className="text-gray-300" />
                            <span className="text-xs font-semibold text-gray-400">Take selfie holding your document</span>
                          </button>
                        )}
                      </div>

                      <div>
                        <div className="text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">15-Second Face Video *</div>
                        <div className="text-[10px] text-gray-400 mb-2">Look at camera and slowly turn your head left and right.</div>
                        {videoBlob ? (
                          <div>
                            <video src={videoBlob} controls className="w-full rounded-xl border border-gray-100 max-h-40" />
                            <button type="button" onClick={() => { setVideoBlob(null); setVideoRawBlob(null); }}
                              className="w-full mt-2 border border-gray-200 bg-gray-50 text-gray-500 text-xs font-semibold py-2 rounded-xl">
                              Re-record Video
                            </button>
                            <div className="text-center text-[10px] text-green-500 font-bold mt-1">✓ Video recorded</div>
                          </div>
                        ) : videoRecording ? (
                          <div>
                            <video ref={liveVideoRef} autoPlay playsInline muted className="w-full rounded-xl border border-red-200 max-h-48 object-cover" />
                            <div className="flex items-center justify-between mt-2 px-1">
                              <span className="text-xs font-bold text-red-500">● Recording... {videoTimer}s / 15s</span>
                              <span className="text-[10px] text-gray-400">Auto-stops at 15s</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
                              <div className="bg-red-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${(videoTimer / 15) * 100}%` }} />
                            </div>
                          </div>
                        ) : (
                          <button type="button" onClick={() => void startVideoRecording()}
                            className="w-full border-2 border-dashed border-gray-200 rounded-xl py-4 flex flex-col items-center gap-1.5 hover:border-[#004B49]/40 transition-all">
                            <Video size={22} className="text-gray-300" />
                            <span className="text-xs font-semibold text-gray-400">🎥 Record 15-Second Face Video</span>
                            <span className="text-[10px] text-gray-300">Liveness verification</span>
                          </button>
                        )}
                      </div>

                      <div className="bg-[#E8F0EF] border border-[#004B49]/15 rounded-xl p-3 flex gap-2">
                        <Shield size={14} className="text-[#004B49] flex-shrink-0 mt-0.5" />
                        <div className="text-[11px] text-[#004B49]">
                          Your documents are encrypted and stored securely. Never shared with third parties.
                        </div>
                      </div>

                      <button type="button" onClick={() => void handleSubmit()} disabled={submitting}
                        className="w-full bg-[#004B49] text-white font-bold py-4 rounded-2xl text-sm disabled:opacity-60">
                        {submitting ? (uploadProgress || "Submitting...") : existingStatus === "rejected" ? "Resubmit for Review 🔄" : "Submit for Review"}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ── LEVEL 4 CONTENT — Business Verification ── */}
              {activeLevel === 4 && l.level === 4 && level3Done && (
                <div className="px-4 pb-4 border-t border-gray-50">

                  {businessStatus === "approved" && (
                    <div className="text-center py-6">
                      <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <CheckCircle size={26} className="text-green-500" />
                      </div>
                      <div className="font-black text-gray-800 text-lg mb-1">Business Verified ✅</div>
                      <div className="text-sm text-gray-500">Your business has been verified. All levels complete!</div>
                    </div>
                  )}

                  {businessStatus === "pending" && (
                    <div className="text-center py-6">
                      <div className="w-14 h-14 bg-[#FBF3E1] rounded-full flex items-center justify-center mx-auto mb-3">
                        <Clock size={26} className="text-[#9c7a1f]" />
                      </div>
                      <div className="font-black text-gray-800 text-lg mb-1">Under Review</div>
                      <div className="text-sm text-gray-500">Admin will review your business documents within 24-48 hours.</div>
                    </div>
                  )}

                  {(businessStatus === "none" || businessStatus === "rejected") && (
                    <div className="mt-3 flex flex-col gap-4">

                      {businessStatus === "rejected" && (
                        <div className="bg-red-50 border border-red-100 rounded-2xl p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <XCircle size={15} className="text-red-500 flex-shrink-0" />
                            <span className="font-black text-red-700 text-xs">Business Verification Rejected</span>
                          </div>
                          {businessRejection && (
                            <div className="text-xs text-red-600">
                              <span className="font-bold">Reason: </span>{businessRejection}
                            </div>
                          )}
                        </div>
                      )}

                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Company / Business Name *</label>
                        <input value={bizForm.companyName} onChange={(e) => setBizForm((p) => ({ ...p, companyName: e.target.value }))}
                          placeholder="e.g. Al-Karam Visa Services"
                          className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-[#004B49]" />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Registration Number (optional)</label>
                        <input value={bizForm.regNumber} onChange={(e) => setBizForm((p) => ({ ...p, regNumber: e.target.value }))}
                          placeholder="Company registration number"
                          className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-[#004B49]" />
                      </div>

                      <div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Trade License Photo *</div>
                        {licensePreview ? (
                          <div className="relative">
                            <img src={licensePreview} alt="License" className="w-full rounded-xl border border-gray-100 max-h-40 object-contain bg-gray-50" />
                            <button type="button" onClick={() => { setLicenseDoc(null); setLicensePreview(null); }}
                              className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg">Remove</button>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-2">
                            <label className="border-2 border-dashed border-gray-200 rounded-xl py-4 flex flex-col items-center gap-1 cursor-pointer hover:border-[#004B49]/40">
                              <Camera size={20} className="text-gray-300" />
                              <span className="text-[10px] font-semibold text-gray-400">📷 Camera</span>
                              <input type="file" accept="image/*" capture="environment" className="hidden"
                                onChange={(e) => { const f = e.target.files?.[0]; if (f) { setLicenseDoc(f); setLicensePreview(URL.createObjectURL(f)); } }} />
                            </label>
                            <label className="border-2 border-dashed border-gray-200 rounded-xl py-4 flex flex-col items-center gap-1 cursor-pointer hover:border-[#004B49]/40">
                              <span className="text-lg">🖼️</span>
                              <span className="text-[10px] font-semibold text-gray-400">Gallery / File</span>
                              <input type="file" accept="image/*" className="hidden"
                                onChange={(e) => { const f = e.target.files?.[0]; if (f) { setLicenseDoc(f); setLicensePreview(URL.createObjectURL(f)); } }} />
                            </label>
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Company Registration Document (optional)</div>
                        {regPreview ? (
                          <div className="relative">
                            <img src={regPreview} alt="Registration" className="w-full rounded-xl border border-gray-100 max-h-40 object-contain bg-gray-50" />
                            <button type="button" onClick={() => { setRegDoc(null); setRegPreview(null); }}
                              className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg">Remove</button>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-2">
                            <label className="border-2 border-dashed border-gray-200 rounded-xl py-4 flex flex-col items-center gap-1 cursor-pointer hover:border-[#004B49]/40">
                              <Camera size={20} className="text-gray-300" />
                              <span className="text-[10px] font-semibold text-gray-400">📷 Camera</span>
                              <input type="file" accept="image/*" capture="environment" className="hidden"
                                onChange={(e) => { const f = e.target.files?.[0]; if (f) { setRegDoc(f); setRegPreview(URL.createObjectURL(f)); } }} />
                            </label>
                            <label className="border-2 border-dashed border-gray-200 rounded-xl py-4 flex flex-col items-center gap-1 cursor-pointer hover:border-[#004B49]/40">
                              <span className="text-lg">🖼️</span>
                              <span className="text-[10px] font-semibold text-gray-400">Gallery / File</span>
                              <input type="file" accept="image/*" className="hidden"
                                onChange={(e) => { const f = e.target.files?.[0]; if (f) { setRegDoc(f); setRegPreview(URL.createObjectURL(f)); } }} />
                            </label>
                          </div>
                        )}
                      </div>

                      <button type="button" onClick={() => void handleBusinessSubmit()} disabled={bizSubmitting}
                        className="w-full bg-[#004B49] text-white font-bold py-4 rounded-2xl text-sm disabled:opacity-60">
                        {bizSubmitting ? "Submitting..." : businessStatus === "rejected" ? "Resubmit Business Verification 🔄" : "Submit Business Verification"}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeLevel === 4 && l.level === 4 && !level3Done && (
                <div className="px-4 pb-4 border-t border-gray-50">
                  <div className="mt-3 text-xs text-gray-500">Complete Level 3 first to unlock Business Verification.</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
