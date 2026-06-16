import { Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Lock, Mail, User, Phone, Building, FileText, MapPin, Globe, ChevronRight } from "lucide-react";
import { useState } from "react";
import { COUNTRIES } from "../lib/mockData";

const BUSINESS_TYPES = [
  { key: "company", label: "🏢 Registered Company", desc: "Ltd / LLC / Pvt Limited" },
  { key: "consultant", label: "👤 Licensed Consultant", desc: "Individual immigration consultant" },
  { key: "agency", label: "✈️ Travel Agency", desc: "Licensed travel & visa agency" },
  { key: "recruiter", label: "👥 Recruitment Agency", desc: "HR & manpower recruitment firm" },
];

const LICENSE_BODIES = [
  "ICCRC (Canada)", "MARA (Australia)", "OISC (UK)", "ICCRC-IRB (Canada)",
  "AIRC (Australia)", "ACMIGRATION (Australia)", "Pakistan BEOE",
  "UAE MOHRE", "Saudi MOL", "Local Government License", "Other",
];

export function Signup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<"seeker" | "provider" | "">("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    // Personal
    name: "", email: "", phone: "", country: "", password: "", confirm: "",
    // Provider — Business
    businessType: "",
    companyName: "",
    licenseNumber: "",
    licenseBody: "",
    licenseExpiry: "",
    // Provider — Documents
    companyReg: "",
    tradeLicense: "",
    officeAddress: "",
    officeCity: "",
    officeCountry: "",
    website: "",
    // Provider — Director
    directorName: "",
    directorTitle: "",
  });

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const totalSteps = role === "provider" ? 5 : 3;

  const validate = () => {
    if (step === 1 && !role) { setError("Please select your role"); return false; }
    if (step === 2) {
      if (!form.name || !form.email || !form.phone || !form.country) {
        setError("Please fill all required fields"); return false;
      }
    }
    if (step === 3 && role === "seeker") {
      if (!form.password || form.password.length < 8) { setError("Password must be at least 8 characters"); return false; }
      if (form.password !== form.confirm) { setError("Passwords do not match"); return false; }
    }
    if (step === 3 && role === "provider") {
      if (!form.businessType) { setError("Please select business type"); return false; }
      if (!form.companyName) { setError("Company/Business name is required"); return false; }
    }
    if (step === 4 && role === "provider") {
      if (!form.licenseNumber || !form.licenseBody) { setError("License details are required"); return false; }
    }
    if (step === 5 && role === "provider") {
      if (!form.password || form.password.length < 8) { setError("Password must be at least 8 characters"); return false; }
      if (form.password !== form.confirm) { setError("Passwords do not match"); return false; }
    }
    setError("");
    return true;
  };

  const handleNext = () => {
    if (!validate()) return;
    if ((step === 3 && role === "seeker") || (step === 5 && role === "provider")) {
      setLoading(true);
      setTimeout(() => { setLoading(false); void navigate({ to: "/" }); }, 1200);
      return;
    }
    setStep(step + 1);
  };

  const stepLabels = role === "provider"
    ? ["Role", "Details", "Business", "License", "Password"]
    : ["Role", "Details", "Password"];

  return (
    <div className="min-h-screen bg-[#F2F3F7] flex flex-col">

      {/* TOP HEADER */}
      <div className="bg-gradient-to-br from-[#1a1a2e] to-[#1a56f0] px-6 pt-14 pb-6">
        <div className="flex justify-center mb-3">
          <svg width="44" height="44" viewBox="0 0 80 80" fill="none">
            <rect width="80" height="80" rx="20" fill="white" fillOpacity="0.15" />
            <line x1="18" y1="18" x2="62" y2="62" stroke="white" strokeWidth="9" strokeLinecap="round" />
            <line x1="62" y1="18" x2="18" y2="62" stroke="white" strokeWidth="9" strokeLinecap="round" />
            <circle cx="40" cy="40" r="7" fill="white" />
          </svg>
        </div>
        <div className="text-white font-black text-xl tracking-wider text-center mb-4">CROSSING</div>

        {/* STEP INDICATOR */}
        <div className="flex items-center justify-center gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                i + 1 < step ? "bg-green-400 text-white" :
                i + 1 === step ? "bg-white text-[#1a56f0]" :
                "bg-white/20 text-white/50"
              }`}>
                {i + 1 < step ? "✓" : i + 1}
              </div>
              {i < totalSteps - 1 && (
                <div className={`w-5 h-0.5 ${i + 1 < step ? "bg-green-400" : "bg-white/20"}`} />
              )}
            </div>
          ))}
        </div>
        <div className="text-white/60 text-xs text-center mt-2">
          Step {step} of {totalSteps} — {stepLabels[step - 1]}
        </div>
      </div>

      {/* FORM */}
      <div className="flex-1 px-5 py-5">
        <div className="bg-white rounded-3xl p-5 shadow-sm">

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-xs font-semibold text-red-500 mb-4">
              ⚠️ {error}
            </div>
          )}

          {/* ── STEP 1: ROLE ── */}
          {step === 1 && (
            <>
              <div className="font-black text-gray-800 text-xl mb-1">Join Crossing</div>
              <div className="text-sm text-gray-500 mb-5">Select your role to get started</div>

              <div
                onClick={() => setRole("seeker")}
                className={`border-2 rounded-2xl p-4 mb-3 cursor-pointer transition-all ${
                  role === "seeker" ? "border-[#1a56f0] bg-blue-50" : "border-gray-100"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">🔎</span>
                  <div style={{ flex: 1 }}>
                    <div className="font-bold text-gray-800">Visa Seeker</div>
                    <div className="text-xs text-gray-500">I want to find & buy visa services</div>
                  </div>
                  {role === "seeker" && <span className="text-[#1a56f0] font-bold text-lg">✓</span>}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {["Work Visa", "Study Visa", "Immigration", "Sponsorship"].map(t => (
                    <span key={t} className="text-[10px] bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full text-gray-500">{t}</span>
                  ))}
                </div>
              </div>

              <div
                onClick={() => setRole("provider")}
                className={`border-2 rounded-2xl p-4 cursor-pointer transition-all ${
                  role === "provider" ? "border-[#1a56f0] bg-blue-50" : "border-gray-100"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">🏢</span>
                  <div style={{ flex: 1 }}>
                    <div className="font-bold text-gray-800">Visa Provider</div>
                    <div className="text-xs text-gray-500">I offer visa & immigration services</div>
                  </div>
                  {role === "provider" && <span className="text-[#1a56f0] font-bold text-lg">✓</span>}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {["Licensed Agent", "Immigration Consultant", "Recruitment Agency", "Travel Agency"].map(t => (
                    <span key={t} className="text-[10px] bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full text-gray-500">{t}</span>
                  ))}
                </div>
                {role === "provider" && (
                  <div className="mt-3 bg-amber-50 border border-amber-100 rounded-xl p-2.5 flex gap-2">
                    <span className="text-amber-500 text-xs flex-shrink-0">⚠️</span>
                    <span className="text-[11px] text-amber-700">Provider accounts require business license verification. Review takes 3-5 business days.</span>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── STEP 2: PERSONAL DETAILS ── */}
          {step === 2 && (
            <>
              <div className="font-black text-gray-800 text-xl mb-1">Your Details</div>
              <div className="text-sm text-gray-500 mb-4">Tell us about yourself</div>

              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Full Name *</label>
                  <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-3 py-3">
                    <User size={15} className="text-gray-400" />
                    <input value={form.name} onChange={e => set("name", e.target.value)}
                      placeholder="Ahmad Khan"
                      className="flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Email Address *</label>
                  <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-3 py-3">
                    <Mail size={15} className="text-gray-400" />
                    <input type="email" value={form.email} onChange={e => set("email", e.target.value)}
                      placeholder="you@email.com"
                      className="flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Mobile Number *</label>
                  <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-3 py-3">
                    <Phone size={15} className="text-gray-400" />
                    <input type="tel" value={form.phone} onChange={e => set("phone", e.target.value)}
                      placeholder="+92 300 0000000"
                      className="flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Country of Residence *</label>
                  <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-3 py-3">
                    <Globe size={15} className="text-gray-400" />
                    <select value={form.country} onChange={e => set("country", e.target.value)}
                      className="flex-1 bg-transparent text-sm text-gray-800 outline-none">
                      <option value="">Select country...</option>
                      {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── STEP 3 (SEEKER): PASSWORD ── */}
          {step === 3 && role === "seeker" && (
            <>
              <div className="font-black text-gray-800 text-xl mb-1">Set Password</div>
              <div className="text-sm text-gray-500 mb-4">Choose a strong password</div>
              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Password *</label>
                  <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-3 py-3">
                    <Lock size={15} className="text-gray-400" />
                    <input type={showPass ? "text" : "password"} value={form.password} onChange={e => set("password", e.target.value)}
                      placeholder="Min. 8 characters"
                      className="flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400" />
                    <button onClick={() => setShowPass(!showPass)}>
                      {showPass ? <EyeOff size={15} className="text-gray-400" /> : <Eye size={15} className="text-gray-400" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Confirm Password *</label>
                  <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-3 py-3">
                    <Lock size={15} className="text-gray-400" />
                    <input type="password" value={form.confirm} onChange={e => set("confirm", e.target.value)}
                      placeholder="Repeat password"
                      className="flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400" />
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                  <div className="text-xs text-blue-700">
                    By creating an account you agree to our <span className="font-bold">Terms of Service</span> and <span className="font-bold">Privacy Policy</span>.
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── STEP 3 (PROVIDER): BUSINESS INFO ── */}
          {step === 3 && role === "provider" && (
            <>
              <div className="font-black text-gray-800 text-xl mb-1">Business Information</div>
              <div className="text-sm text-gray-500 mb-4">Tell us about your business</div>

              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">Business Type *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {BUSINESS_TYPES.map(b => (
                      <button key={b.key} onClick={() => set("businessType", b.key)}
                        className={`border-2 rounded-xl p-2.5 text-left transition-all ${
                          form.businessType === b.key ? "border-[#1a56f0] bg-blue-50" : "border-gray-100 bg-gray-50"
                        }`}>
                        <div className="text-sm font-bold text-gray-700">{b.label}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">{b.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Company / Business Name *</label>
                  <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-3 py-3">
                    <Building size={15} className="text-gray-400" />
                    <input value={form.companyName} onChange={e => set("companyName", e.target.value)}
                      placeholder="ImmigrationPro Inc."
                      className="flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Director / Owner Name *</label>
                  <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-3 py-3">
                    <User size={15} className="text-gray-400" />
                    <input value={form.directorName} onChange={e => set("directorName", e.target.value)}
                      placeholder="Full name of owner/director"
                      className="flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Office Address *</label>
                  <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-3 py-3">
                    <MapPin size={15} className="text-gray-400" />
                    <input value={form.officeAddress} onChange={e => set("officeAddress", e.target.value)}
                      placeholder="Full office address"
                      className="flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">City *</label>
                    <input value={form.officeCity} onChange={e => set("officeCity", e.target.value)}
                      placeholder="Karachi"
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-3 text-sm outline-none focus:border-[#1a56f0]" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Country *</label>
                    <select value={form.officeCountry} onChange={e => set("officeCountry", e.target.value)}
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-3 text-sm outline-none focus:border-[#1a56f0]">
                      <option value="">Select...</option>
                      {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Website (optional)</label>
                  <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-3 py-3">
                    <Globe size={15} className="text-gray-400" />
                    <input value={form.website} onChange={e => set("website", e.target.value)}
                      placeholder="https://yourcompany.com"
                      className="flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400" />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── STEP 4 (PROVIDER): LICENSE ── */}
          {step === 4 && role === "provider" && (
            <>
              <div className="font-black text-gray-800 text-xl mb-1">License Verification</div>
              <div className="text-sm text-gray-500 mb-4">Your license details for verification</div>

              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-4 flex gap-2">
                <span className="text-amber-500 flex-shrink-0">⚠️</span>
                <span className="text-[11px] text-amber-700">
                  Only licensed and registered professionals can operate as Visa Providers on Crossing. Fake or expired licenses result in permanent ban.
                </span>
              </div>

              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">License / Registration Number *</label>
                  <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-3 py-3">
                    <FileText size={15} className="text-gray-400" />
                    <input value={form.licenseNumber} onChange={e => set("licenseNumber", e.target.value)}
                      placeholder="e.g. R123456 or BEOE-2024-001"
                      className="flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Issuing Authority *</label>
                  <select value={form.licenseBody} onChange={e => set("licenseBody", e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-3 text-sm text-gray-800 outline-none focus:border-[#1a56f0]">
                    <option value="">Select authority...</option>
                    {LICENSE_BODIES.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">License Expiry Date *</label>
                  <input type="date" value={form.licenseExpiry} onChange={e => set("licenseExpiry", e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-3 text-sm text-gray-800 outline-none focus:border-[#1a56f0]" />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Upload License Document *</label>
                  <div className="border-2 border-dashed border-gray-200 rounded-xl py-4 text-center cursor-pointer hover:border-[#1a56f0]/40 transition-all"
                    onClick={() => alert("File picker opening...")}>
                    <div className="text-2xl mb-1">📄</div>
                    <div className="text-xs font-semibold text-gray-500">Tap to upload license</div>
                    <div className="text-[10px] text-gray-400">PDF or Image · Max 5MB</div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Upload Company Registration *</label>
                  <div className="border-2 border-dashed border-gray-200 rounded-xl py-4 text-center cursor-pointer hover:border-[#1a56f0]/40 transition-all"
                    onClick={() => alert("File picker opening...")}>
                    <div className="text-2xl mb-1">🏢</div>
                    <div className="text-xs font-semibold text-gray-500">Company registration certificate</div>
                    <div className="text-[10px] text-gray-400">PDF or Image · Max 5MB</div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex gap-2">
                  <span className="text-[#1a56f0] flex-shrink-0">ℹ️</span>
                  <div className="text-[11px] text-blue-700">
                    <div className="font-black mb-0.5">What happens after submission?</div>
                    <div>1. Admin verifies your license with issuing authority</div>
                    <div>2. Office address is verified</div>
                    <div>3. Account approved within 3-5 business days</div>
                    <div>4. You receive email confirmation</div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── STEP 5 (PROVIDER): PASSWORD ── */}
          {step === 5 && role === "provider" && (
            <>
              <div className="font-black text-gray-800 text-xl mb-1">Set Password</div>
              <div className="text-sm text-gray-500 mb-4">Almost done! Set a strong password.</div>
              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Password *</label>
                  <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-3 py-3">
                    <Lock size={15} className="text-gray-400" />
                    <input type={showPass ? "text" : "password"} value={form.password} onChange={e => set("password", e.target.value)}
                      placeholder="Min. 8 characters"
                      className="flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400" />
                    <button onClick={() => setShowPass(!showPass)}>
                      {showPass ? <EyeOff size={15} className="text-gray-400" /> : <Eye size={15} className="text-gray-400" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Confirm Password *</label>
                  <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-3 py-3">
                    <Lock size={15} className="text-gray-400" />
                    <input type="password" value={form.confirm} onChange={e => set("confirm", e.target.value)}
                      placeholder="Repeat password"
                      className="flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400" />
                  </div>
                </div>
                <div className="bg-green-50 border border-green-100 rounded-xl p-3">
                  <div className="text-xs font-black text-green-700 mb-1">✓ Application Summary</div>
                  <div className="text-[11px] text-green-600 flex flex-col gap-0.5">
                    <div>Business: {form.companyName}</div>
                    <div>License: {form.licenseNumber} — {form.licenseBody}</div>
                    <div>Location: {form.officeCity}, {form.officeCountry}</div>
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                  <div className="text-[11px] text-blue-700">
                    By submitting you agree to our <span className="font-bold">Terms of Service</span>, <span className="font-bold">Privacy Policy</span>, and <span className="font-bold">Provider Agreement</span>.
                  </div>
                </div>
              </div>
            </>
          )}

          {/* NEXT BUTTON */}
          <button onClick={handleNext} disabled={loading}
            className="w-full bg-[#1a56f0] text-white font-bold py-4 rounded-2xl text-sm mt-5 disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? "Creating account..." :
              (step === totalSteps ? (role === "provider" ? "Submit for Review 🚀" : "Create Account 🚀") : (
                <><span>Continue</span><ChevronRight size={16} /></>
              ))}
          </button>

          {step === 1 && (
            <div className="text-center text-sm text-gray-500 mt-4">
              Already have an account?{" "}
              <Link to="/login"><span className="font-bold text-[#1a56f0]">Login</span></Link>
            </div>
          )}

          {step > 1 && (
            <button onClick={() => { setStep(step - 1); setError(""); }}
              className="w-full text-gray-400 text-sm font-semibold py-2 mt-1">
              ← Back
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
