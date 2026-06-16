import { ArrowLeft, Shield, Camera, CheckCircle, Clock, AlertTriangle, Upload, Video } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";

const LEVELS = [
  { level: 1, title: "Email Verification", desc: "Verify your email address", status: "completed" },
  { level: 2, title: "Phone Verification", desc: "Verify your mobile number", status: "completed" },
  { level: 3, title: "Identity Verification", desc: "ID/Passport + Selfie + Face Video", status: "pending" },
  { level: 4, title: "Business Verification", desc: "Company Registration + Trade License", status: "locked" },
];

export function KYCFlow() {
  const navigate = useNavigate();
  const [activeLevel, setActiveLevel] = useState(3);
  const [docType, setDocType] = useState<"passport" | "nid" | "license">("passport");
  const [form, setForm] = useState({ fullName: "", dob: "", nationality: "", docNumber: "", address: "" });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Photo states
  const [docFront, setDocFront] = useState<string | null>(null);
  const [docBack, setDocBack] = useState<string | null>(null);
  const [selfie, setSelfie] = useState<string | null>(null);

  // Video states
  const [videoBlob, setVideoBlob] = useState<string | null>(null);
  const [videoRecording, setVideoRecording] = useState(false);
  const [videoTimer, setVideoTimer] = useState(0);

  // Camera
  const [activeCamera, setActiveCamera] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const liveVideoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    return () => { if (stream) stream.getTracks().forEach(t => t.stop()); };
  }, [stream]);

  // ── START PHOTO CAMERA ──
  async function startCamera(target: string) {
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: target === "selfie" ? "user" : "environment" }
      });
      setStream(s);
      setActiveCamera(target);
      setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = s; }, 100);
    } catch {
      alert("Camera access denied. Please allow camera permission.");
    }
  }

  // ── CAPTURE PHOTO ──
  function capturePhoto() {
    if (!videoRef.current || !canvasRef.current || !activeCamera) return;
    const canvas = canvasRef.current;
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg");
    if (activeCamera === "front") setDocFront(dataUrl);
    else if (activeCamera === "back") setDocBack(dataUrl);
    else if (activeCamera === "selfie") setSelfie(dataUrl);
    stream?.getTracks().forEach(t => t.stop());
    setStream(null);
    setActiveCamera(null);
  }

  // ── START VIDEO RECORDING ──
  async function startVideoRecording() {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: true });
      setStream(s);
      setVideoRecording(true);
      setVideoTimer(0);
      setTimeout(() => { if (liveVideoRef.current) liveVideoRef.current.srcObject = s; }, 100);
      const recorder = new MediaRecorder(s);
      mediaRecorderRef.current = recorder;
      videoChunksRef.current = [];
      recorder.ondataavailable = e => { if (e.data.size > 0) videoChunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(videoChunksRef.current, { type: "video/webm" });
        setVideoBlob(URL.createObjectURL(blob));
        s.getTracks().forEach(t => t.stop());
        setVideoRecording(false);
        setStream(null);
      };
      recorder.start();
      let sec = 0;
      const interval = setInterval(() => {
        sec++;
        setVideoTimer(sec);
        if (sec >= 15) { clearInterval(interval); recorder.stop(); }
      }, 1000);
    } catch {
      alert("Camera/microphone access denied. Please allow permissions.");
    }
  }

  // ── SUBMIT ──
  async function handleSubmit() {
    if (!form.fullName) { alert("Full name is required"); return; }
    if (!docFront) { alert("Please capture document front photo"); return; }
    if (!selfie) { alert("Please take a selfie"); return; }
    if (!videoBlob) { alert("Please record a 15-second face video"); return; }
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1500));
    setSubmitted(true);
    setSubmitting(false);
  }

  // ── CAMERA OVERLAY ──
  if (activeCamera) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        <div className="flex items-center gap-3 px-4 py-4 bg-black">
          <button onClick={() => { stream?.getTracks().forEach(t => t.stop()); setActiveCamera(null); setStream(null); }}
            className="text-white text-2xl">‹</button>
          <span className="text-white font-bold">
            {activeCamera === "front" ? `Capture ${docType === "passport" ? "Passport" : "ID"} Front`
              : activeCamera === "back" ? `Capture ${docType === "passport" ? "Passport" : "ID"} Back`
              : "Take Selfie with Document"}
          </span>
        </div>
        <video ref={videoRef} autoPlay playsInline className="flex-1 w-full object-cover" />
        <canvas ref={canvasRef} className="hidden" />
        <div className="p-6 bg-black">
          <div className="text-center text-white/60 text-xs mb-4">
            {activeCamera === "selfie"
              ? "Hold your document next to your face — make sure both are clearly visible"
              : "Make sure all text is clearly readable — good lighting required"}
          </div>
          <button onClick={capturePhoto}
            className="w-full bg-white text-black font-black py-4 rounded-2xl text-base flex items-center justify-center gap-2">
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
            {[
              "Unlock Escrow payments",
              "Get verified badge on listings",
              "Higher trust = more clients",
              "Required to withdraw funds",
            ].map((item) => (
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
        {LEVELS.map((l) => (
          <div key={l.level} className={`bg-white rounded-2xl shadow-sm overflow-hidden ${l.status === "locked" ? "opacity-50" : "cursor-pointer"}`}
            onClick={() => l.status !== "locked" && setActiveLevel(activeLevel === l.level ? 0 : l.level)}>

            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                l.status === "completed" ? "bg-green-50" : l.status === "pending" ? "bg-amber-50" : "bg-gray-50"
              }`}>
                {l.status === "completed" ? <CheckCircle size={20} className="text-green-500" />
                  : l.status === "pending" ? <Clock size={20} className="text-amber-500" />
                  : <Shield size={20} className="text-gray-300" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-800">Level {l.level} — {l.title}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    l.status === "completed" ? "bg-green-50 text-green-500"
                      : l.status === "pending" ? "bg-amber-50 text-amber-500"
                      : "bg-gray-50 text-gray-400"
                  }`}>
                    {l.status === "completed" ? "✓ Done" : l.status === "pending" ? "Required" : "Locked"}
                  </span>
                </div>
                <div className="text-xs text-gray-400 mt-0.5">{l.desc}</div>
              </div>
            </div>

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

                    {/* DOC TYPE */}
                    <div>
                      <div className="text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">Document Type</div>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { key: "passport", label: "📘 Passport", desc: "International" },
                          { key: "nid", label: "🆔 National ID", desc: "Local Gov ID" },
                          { key: "license", label: "🪪 Driving License", desc: "Gov Issued" },
                        ].map((d) => (
                          <button key={d.key} onClick={() => setDocType(d.key as any)}
                            className={`border-2 rounded-xl py-2.5 px-1 text-center transition-all ${
                              docType === d.key ? "border-[#1a56f0] bg-blue-50" : "border-gray-100 bg-gray-50"
                            }`}>
                            <div className="text-base">{d.label.split(" ")[0]}</div>
                            <div className="text-[10px] font-bold text-gray-700 mt-0.5">{d.label.split(" ").slice(1).join(" ")}</div>
                            <div className="text-[9px] text-gray-400">{d.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* PERSONAL INFO */}
                    <div>
                      <div className="text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">Personal Information</div>
                      <div className="flex flex-col gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Full Name (as on document) *</label>
                          <input value={form.fullName} onChange={e => setForm(p => ({...p, fullName: e.target.value}))}
                            placeholder="Ahmad Khan"
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-[#1a56f0]" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Date of Birth</label>
                            <input type="date" value={form.dob} onChange={e => setForm(p => ({...p, dob: e.target.value}))}
                              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-[#1a56f0]" />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Nationality</label>
                            <input value={form.nationality} onChange={e => setForm(p => ({...p, nationality: e.target.value}))}
                              placeholder="Pakistani"
                              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-[#1a56f0]" />
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">
                            {docType === "passport" ? "Passport Number" : docType === "nid" ? "ID Number" : "License Number"} *
                          </label>
                          <input value={form.docNumber} onChange={e => setForm(p => ({...p, docNumber: e.target.value}))}
                            placeholder={docType === "passport" ? "AB1234567" : docType === "nid" ? "00000-0000000-0" : "DL-123456"}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-[#1a56f0]" />
                        </div>
                      </div>
                    </div>

                    {/* DOCUMENT PHOTOS */}
                    <div>
                      <div className="text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">Document Photos</div>
                      <div className="flex flex-col gap-2">

                        {/* FRONT */}
                        <div>
                          <div className="text-[10px] text-gray-400 font-semibold mb-1">
                            {docType === "passport" ? "Passport Photo Page" : "Front Side"} *
                          </div>
                          {docFront ? (
                            <div className="relative">
                              <img src={docFront} alt="Doc Front" className="w-full rounded-xl border border-gray-100 max-h-32 object-cover" />
                              <button onClick={() => setDocFront(null)}
                                className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg">
                                Retake
                              </button>
                              <div className="absolute bottom-2 left-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">✓ Captured</div>
                            </div>
                          ) : (
                            <button onClick={() => startCamera("front")}
                              className="w-full border-2 border-dashed border-gray-200 rounded-xl py-4 flex flex-col items-center gap-1.5 hover:border-[#1a56f0]/40 transition-all">
                              <Camera size={22} className="text-gray-300" />
                              <span className="text-xs font-semibold text-gray-400">Tap to capture with camera</span>
                            </button>
                          )}
                        </div>

                        {/* BACK (not for passport) */}
                        {docType !== "passport" && (
                          <div>
                            <div className="text-[10px] text-gray-400 font-semibold mb-1">Back Side *</div>
                            {docBack ? (
                              <div className="relative">
                                <img src={docBack} alt="Doc Back" className="w-full rounded-xl border border-gray-100 max-h-32 object-cover" />
                                <button onClick={() => setDocBack(null)}
                                  className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg">
                                  Retake
                                </button>
                                <div className="absolute bottom-2 left-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">✓ Captured</div>
                              </div>
                            ) : (
                              <button onClick={() => startCamera("back")}
                                className="w-full border-2 border-dashed border-gray-200 rounded-xl py-4 flex flex-col items-center gap-1.5 hover:border-[#1a56f0]/40 transition-all">
                                <Camera size={22} className="text-gray-300" />
                                <span className="text-xs font-semibold text-gray-400">Tap to capture back side</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* SELFIE WITH DOCUMENT */}
                    <div>
                      <div className="text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Selfie with Document *</div>
                      <div className="text-[10px] text-gray-400 mb-2">Hold your document next to your face — both must be clearly visible</div>
                      {selfie ? (
                        <div className="relative">
                          <img src={selfie} alt="Selfie" className="w-full rounded-xl border border-gray-100 max-h-40 object-cover" />
                          <button onClick={() => setSelfie(null)}
                            className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg">
                            Retake
                          </button>
                          <div className="absolute bottom-2 left-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">✓ Captured</div>
                        </div>
                      ) : (
                        <button onClick={() => startCamera("selfie")}
                          className="w-full border-2 border-dashed border-gray-200 rounded-xl py-4 flex flex-col items-center gap-1.5 hover:border-[#1a56f0]/40 transition-all">
                          <Camera size={22} className="text-gray-300" />
                          <span className="text-xs font-semibold text-gray-400">Take selfie holding your document</span>
                        </button>
                      )}
                    </div>

                    {/* 15-SECOND FACE VIDEO */}
                    <div>
                      <div className="text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">15-Second Face Video *</div>
                      <div className="text-[10px] text-gray-400 mb-2">
                        Record a short video of your face for liveness verification. Look at the camera and slowly turn your head left and right.
                      </div>
                      {videoBlob ? (
                        <div>
                          <video src={videoBlob} controls className="w-full rounded-xl border border-gray-100 max-h-40" />
                          <button onClick={() => setVideoBlob(null)}
                            className="w-full mt-2 border border-gray-200 bg-gray-50 text-gray-500 text-xs font-semibold py-2 rounded-xl">
                            Re-record Video
                          </button>
                          <div className="text-center text-[10px] text-green-500 font-bold mt-1">✓ Video recorded (15 seconds)</div>
                        </div>
                      ) : videoRecording ? (
                        <div>
                          <video ref={liveVideoRef} autoPlay playsInline muted className="w-full rounded-xl border border-red-200 max-h-48" />
                          <div className="flex items-center justify-between mt-2 px-1">
                            <span className="text-xs font-bold text-red-500">● Recording... {videoTimer}s / 15s</span>
                            <span className="text-[10px] text-gray-400">Auto-stops at 15s</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
                            <div className="bg-red-500 h-2 rounded-full transition-all duration-1000"
                              style={{ width: `${(videoTimer / 15) * 100}%` }} />
                          </div>
                        </div>
                      ) : (
                        <button onClick={startVideoRecording}
                          className="w-full border-2 border-dashed border-gray-200 rounded-xl py-4 flex flex-col items-center gap-1.5 hover:border-[#1a56f0]/40 transition-all">
                          <Video size={22} className="text-gray-300" />
                          <span className="text-xs font-semibold text-gray-400">🎥 Record 15-Second Face Video</span>
                          <span className="text-[10px] text-gray-300">Liveness verification</span>
                        </button>
                      )}
                    </div>

                    {/* SECURITY NOTE */}
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex gap-2">
                      <Shield size={14} className="text-[#1a56f0] flex-shrink-0 mt-0.5" />
                      <div className="text-[11px] text-blue-700">
                        Your documents are encrypted and stored securely. They are only used for identity verification and are never shared with third parties.
                      </div>
                    </div>

                    {/* SUBMIT */}
                    <button onClick={handleSubmit} disabled={submitting}
                      className="w-full bg-[#1a56f0] text-white font-bold py-4 rounded-2xl text-sm disabled:opacity-60">
                      {submitting ? "Submitting..." : "Submit for Review"}
                    </button>

                  </div>
                )}
              </div>
            )}

            {/* LEVEL 4 */}
            {activeLevel === 4 && l.level === 4 && (
              <div className="px-4 pb-4 border-t border-gray-50">
                <div className="mt-3 text-xs text-gray-500">
                  Complete Level 3 first to unlock Business Verification.
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

    </div>
  );
}
