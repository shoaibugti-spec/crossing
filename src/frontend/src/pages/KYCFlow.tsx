import { ArrowLeft, Shield, Camera, CheckCircle, Clock, Video, Loader2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

const LEVELS = [
  { level: 1, title: "Email Verification", desc: "Verify your email address", status: "completed" },
  { level: 2, title: "Phone Verification", desc: "Verify your mobile number", status: "completed" },
  { level: 3, title: "Identity Verification", desc: "ID/Passport + Selfie + Face Video", status: "pending" },
  { level: 4, title: "Business Verification", desc: "Company Registration + Trade License", status: "locked" },
];

// Convert a data URL (image) to a Blob for upload
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

  const [activeLevel, setActiveLevel] = useState(3);
  const [docType, setDocType] = useState<"passport" | "nid" | "license">("passport");
  const [form, setForm] = useState({ fullName: "", dob: "", nationality: "", docNumber: "", address: "" });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");

  // Captured media — stored once, never cleared accidentally
  const [docFront, setDocFront] = useState<string | null>(null);
  const [docBack, setDocBack] = useState<string | null>(null);
  const [selfie, setSelfie] = useState<string | null>(null);
  const [videoBlob, setVideoBlob] = useState<string | null>(null);
  const [videoRawBlob, setVideoRawBlob] = useState<Blob | null>(null);

  // Recording state
  const [videoRecording, setVideoRecording] = useState(false);
  const [videoTimer, setVideoTimer] = useState(0);

  // Camera overlay state — null means closed
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
    if (!userData.user) {
      setLoadingStatus(false);
      void navigate({ to: "/login" });
      return;
    }
    setUserId(userData.user.id);

    const { data: profile } = await supabase.from("profiles").select("kyc_status, full_name").eq("id", userData.user.id).single();
    setExistingStatus(profile?.kyc_status ?? "none");
    if (profile?.full_name) setForm((p) => ({ ...p, fullName: profile.full_name }));
    if (profile?.kyc_status === "pending" || profile?.kyc_status === "approved") setSubmitted(true);
    setLoadingStatus(false);
  }

  function stopStream() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }

  // ── START PHOTO CAMERA ──
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

  // ── CAPTURE PHOTO ──
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

  // ── START VIDEO RECORDING ──
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
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
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
      alert("Camera/microphone access denied. Please allow permissions in your browser settings.");
    }
  }, []);

  // ── SUBMIT — uploads real files to Supabase Storage and creates a real kyc_submissions row ──
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

      // Mark profile as pending review
      await supabase.from("profiles").update({ kyc_status: "pending" }).eq("id", userId);

      setSubmitted(true);
    } catch (err: any) {
      alert("Submission failed: " + (err.message ?? "unknown error"));
    } finally {
      setSubmitting(false);
      setUploadProgress("");
    }
  }

  if (loadingStatus) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-gray-300" size={28} />
      </div>
    );
  }

  // ── CAMERA OVERLAY (full screen, isolated) ──
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
              ? "Hold your document next to your face — make sure both are clearly visible"
              : "Make sure all text is clearly readable — good lighting required"}
          </div>
          <button onClick={capturePhoto} className="w-full bg-white text-black font-black py-4 rounded-2xl text-base flex items-center justify-center gap-2">
            <Camera size={20} /> Capture Photo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col pb-8">

      {/* HEADER */}
      <div className="bg-white px-4 py-3 flex items-center gap-2 border-b border-gray-100">
        <button onClick={() => void navigate({ to: "/" })} className="p-1.5 rounded-full hover:bg-gray-100">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <span className="font-bold text-gray-800 text-sm">KYC Verification</span>
      </div>

      {/* WHY VERIFY BANNER */}
      <div className="mx-4 mt-4">
        <div className="bg-gradient-to-br from-[#1a1a2e] to-[#1a56f0] rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield size={18} className="text-white" />
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

      {/* LEVEL LIST */}
      <div className="mx-4 mt-4 flex flex-col gap-3">
        {LEVELS.map((l) => {
          const level3Status = existingStatus === "approved" ? "completed" : existingStatus === "pending" ? "pending" : existingStatus === "rejected" ? "pending" : "pending";
          const displayStatus = l.level === 3 ? level3Status : l.status;

          return (
            <div key={l.level} className={`bg-white rounded-2xl shadow-sm overflow-hidden ${l.status === "locked" ? "opacity-50" : ""}`}>

              <button type="button" onClick={() => l.status !== "locked" && setActiveLevel(activeLevel === l.level ? 0 : l.level)}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left" disabled={l.status === "locked"}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  displayStatus === "completed" ? "bg-green-50" : displayStatus === "pending" ? "bg-amber-50" : "bg-gray-50"
                }`}>
                  {displayStatus === "completed" ? <CheckCircle size={20} className="text-green-500" />
                    : displayStatus === "pending" ? <Clock size={20} className="text-amber-500" />
                    : <Shield size={20} className="text-gray-300" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-800">Level {l.level} — {l.title}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      displayStatus === "completed" ? "bg-green-50 text-green-500" : displayStatus === "pending" ? "bg-amber-50 text-amber-500" : "bg-gray-50 text-gray-400"
                    }`}>
                      {l.level === 3 && existingStatus === "approved" ? "✓ Verified"
                        : l.level === 3 && existingStatus === "pending" ? "Under Review"
                        : l.level === 3 && existingStatus === "rejected" ? "Rejected — Resubmit"
                        : displayStatus === "completed" ? "✓ Done" : displayStatus === "pending" ? "Required" : "Locked"}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">{l.desc}</div>
                </div>
              </button>

              {/* LEVEL 3 FORM */}
              {activeLevel === 3 && l.level === 3 && (
                <div className="px-4 pb-4 border-t border-gray-50">
                  {submitted ? (
                    <div className="text-center py-6">
                      <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Clock size={26} className="text-amber-500" />
                      </div>
                      <div className="font-black text-gray-800 text-lg mb-1">Documents Submitted!</div>
                      <div className="text-sm text-gray-500">Admin will review within 24-48 hours. You will be notified.</div>
                    </div>
                  ) : (
                    <div className="mt-3 flex flex-col gap-4">

                      <div>
                        <div className="text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">Document Type</div>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { key: "passport", emoji: "📘", label: "Passport", desc: "International" },
                            { key: "nid", emoji: "🆔", label: "National ID", desc: "Local Gov ID" },
                            { key: "license", emoji: "🪪", label: "Driving License", desc: "Gov Issued" },
                          ].map((d) => (
                            <button key={d.key} type="button" onClick={() => setDocType(d.key as "passport" | "nid" | "license")}
                              className={`border-2 rounded-xl py-2.5 px-1 text-center transition-all ${docType === d.key ? "border-[#1a56f0] bg-blue-50" : "border-gray-100 bg-gray-50"}`}>
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
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Full Name (as on document) *</label>
                            <input value={form.fullName} onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
                              placeholder="Full Name"
                              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-[#1a56f0]" />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Date of Birth</label>
                              <input type="date" value={form.dob} onChange={(e) => setForm((p) => ({ ...p, dob: e.target.value }))}
                                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-[#1a56f0]" />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Nationality</label>
                              <input value={form.nationality} onChange={(e) => setForm((p) => ({ ...p, nationality: e.target.value }))}
                                placeholder="e.g. Pakistani"
                                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-[#1a56f0]" />
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">
                              {docType === "passport" ? "Passport Number" : docType === "nid" ? "ID Number" : "License Number"} *
                            </label>
                            <input value={form.docNumber} onChange={(e) => setForm((p) => ({ ...p, docNumber: e.target.value }))}
                              placeholder={docType === "passport" ? "AB1234567" : docType === "nid" ? "00000-0000000-0" : "DL-123456"}
                              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-[#1a56f0]" />
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
                                className="w-full border-2 border-dashed border-gray-200 rounded-xl py-4 flex flex-col items-center gap-1.5 hover:border-[#1a56f0]/40 transition-all">
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
                                  className="w-full border-2 border-dashed border-gray-200 rounded-xl py-4 flex flex-col items-center gap-1.5 hover:border-[#1a56f0]/40 transition-all">
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
                            className="w-full border-2 border-dashed border-gray-200 rounded-xl py-4 flex flex-col items-center gap-1.5 hover:border-[#1a56f0]/40 transition-all">
                            <Camera size={22} className="text-gray-300" />
                            <span className="text-xs font-semibold text-gray-400">Take selfie holding your document</span>
                          </button>
                        )}
                      </div>

                      <div>
                        <div className="text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">15-Second Face Video *</div>
                        <div className="text-[10px] text-gray-400 mb-2">
                          Record a short video of your face for liveness verification. Look at the camera and slowly turn your head left and right.
                        </div>
                        {videoBlob ? (
                          <div>
                            <video src={videoBlob} controls className="w-full rounded-xl border border-gray-100 max-h-40" />
                            <button type="button" onClick={() => { setVideoBlob(null); setVideoRawBlob(null); }}
                              className="w-full mt-2 border border-gray-200 bg-gray-50 text-gray-500 text-xs font-semibold py-2 rounded-xl">
                              Re-record Video
                            </button>
                            <div className="text-center text-[10px] text-green-500 font-bold mt-1">✓ Video recorded (15 seconds)</div>
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
                            className="w-full border-2 border-dashed border-gray-200 rounded-xl py-4 flex flex-col items-center gap-1.5 hover:border-[#1a56f0]/40 transition-all">
                            <Video size={22} className="text-gray-300" />
                            <span className="text-xs font-semibold text-gray-400">🎥 Record 15-Second Face Video</span>
                            <span className="text-[10px] text-gray-300">Liveness verification</span>
                          </button>
                        )}
                      </div>

                      <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex gap-2">
                        <Shield size={14} className="text-[#1a56f0] flex-shrink-0 mt-0.5" />
                        <div className="text-[11px] text-blue-700">
                          Your documents are encrypted and stored securely. They are only used for identity verification and are never shared with third parties.
                        </div>
                      </div>

                      <button type="button" onClick={() => void handleSubmit()} disabled={submitting}
                        className="w-full bg-[#1a56f0] text-white font-bold py-4 rounded-2xl text-sm disabled:opacity-60">
                        {submitting ? (uploadProgress || "Submitting...") : "Submit for Review"}
                      </button>

                    </div>
                  )}
                </div>
              )}

              {activeLevel === 4 && l.level === 4 && (
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
