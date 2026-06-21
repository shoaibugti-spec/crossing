import { Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Lock, Mail, User, Phone, Building, FileText, MapPin, Globe, ChevronRight } from "lucide-react";
import { useState } from "react";
import { COUNTRIES } from "../lib/mockData";
import { supabase } from "../lib/supabaseClient";

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

const BrandLight = (
  <span style={{
    fontFamily: "'Montserrat', 'Inter', Arial, sans-serif",
    fontWeight: 700,
    fontStyle: "normal",
    fontSize: "24px",
    letterSpacing: "0px",
    lineHeight: 1,
  }}>
    <span style={{ color: "#ffffff" }}>Crossin</span>
    <span style={{ color: "#D4AF37" }}>gate</span>
  </span>
);

export function Signup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<"seeker" | "provider" | "">("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "", email: "", phone: "", country: "", password: "", confirm: "",
    businessType: "", companyName: "", licenseNumber: "", licenseBody: "", licenseExpiry: "",
    companyReg: "", tradeLicense: "", officeAddress: "", officeCity: "", officeCountry: "", website: "",
    directorName: "", directorTitle: "",
  });

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));
  const totalSteps = role === "provider" ? 5 : 3;

  const validate = () => {
    if (step === 1 && !role) { setError("Please select your role"); return false; }
    if (step === 2) {
      if (!form.name || !form.email || !form.phone || !form.country) { setError("Please fill all required fields"); return false; }
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

  const handleNext = async () => {
    if (!validate()) return;
    const isFinalStep = (step === 3 && role === "seeker") || (step === 5 && role === "provider");
    if (!isFinalStep) { setStep(step + 1); return; }

    setLoading(true);
    setError("");
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { full_name: form.name, role } },
      });
      if (signUpError) { setError(signUpError.message); setLoading(false); return; }
      const userId = data.user?.id;
      if (!userId) { setError("Account created but no session returned."); setLoading(false); return; }
      await supabase.from("profiles").update({ phone: form.phone, country: form.country }).eq("id", userId);
      if (role === "provider") {
        await supabase.from("provider_business_info").insert({
          user_id: userId,
          business_type: form.businessType,
          company_name: form.companyName,
          director_name: form.directorName,
          office_address: form.officeAddress,
          office_city: form.officeCity,
          office_country: form.officeCountry,
          website: form.website,
          license_number: form.licenseNumber,
          license_body: form.licenseBody,
          license_expiry: form.licenseExpiry || null,
          status: "pending",
        });
      }
      setLoading(false);
      void navigate({ to: "/" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  };

  const stepLabels = role === "provider"
    ? ["Role", "Details", "Business", "License", "Password"]
    : ["Role", "Details", "Password"];

  return (
    <div className="min-h-screen bg-[#F4F6F6] flex flex-col">
      <div className="bg-gradient-to-br from-[#00302e] via-[#004B49] to-[#00615e] px-6 pt-14 pb-6">
        <div className="flex justify-center mb-4">{BrandLight}</div>
        <div className="flex items-center justify-center gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                i + 1 < step ? "bg-[#D4AF37] text-white" : i + 1 === step ? "bg-white text-[#004B49]" : "bg-white/20 text-white/50"
              }`}>
                {i + 1 < step ? "✓" : i + 1}
              </div>
              {i < totalSteps - 1 && <div className={`w-5 h-0.5 ${i + 1 < step ? "bg-[#D4AF37]" : "bg-white/20"}`} />}
            </div>
          ))}
        </div>
        <div className="text-white/60 text-xs text-center mt-2">Step {step} of {totalSteps} — {stepLabels[step - 1]}</div>
      </div>

      <div className="flex-1 px-5 py-5">
        <div className="bg-white rounded-3xl p-5 shadow-sm">
          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-xs font-semibold text-red-500 mb-4">
              ⚠️ {error}
            </div>
          )}

          {step === 1 && (
            <>
              <div className="font-black text-gray-800 text-xl mb-1">Join Crossingate</div>
              <div className="text-sm text-gray-500 mb-5">Select your role to get started</div>
              <div onClick={() => setRole("seeker")}
                className={`border-2 rounded-2xl p-4 mb-3 cursor-pointer transition-all ${role === "seeker" ? "border-[#004B49] bg-[#E8F0EF]" : "border-gray-100"}`}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">🔎</span>
                  <div style={{ flex: 1 }}>
                    <div className="font-bold text-gray-800">Visa Seeker</div>
                    <div className="text-xs text-gray-500">I want to find & buy visa services</div>
                  </div>
                  {role === "seeker" && <span className="text-[#004B49] font-bold text-lg">✓</span>}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {["Work Visa", "Study Visa", "Immigration", "Sponsorship"].map((t) => (
                    <span key={t} className="text-[10px] bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full text-gray-500">{t}</span>
                  ))}
                </div>
              </div>
              <div onClick={() => setRole("provider")}
                className={`border-2 rounded-2xl p-4 cursor-pointer transition-all ${role === "provider" ? "border-[#004B49] bg-[#E8F0EF]" : "border-gray-100"}`}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">🏢</span>
                  <div style={{ flex: 1 }}>
                    <div className="font-bold text-gray-800">Visa Provider</div>
                    <div className="text-xs text-gray-500">I offer visa & immigration services</div>
                  </div>
                  {role === "provider" && <span className="text-[#004B49] font-bold text-lg">✓</span>}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {["Licensed Agent", "Immigration Consultant", "Recruitment Agency", "Travel Agency"].map((t) => (
                    <span key={t} className="text-[10px] bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full text-gray-500">{t}</span>
                  ))}
                </div>
                {role === "provider" && (
                  <div className="mt-3 bg-[#FBF3E1] border border-[#D4AF37]/30 rounded-xl p-2.5 flex gap-2">
                    <span className="text-[#9c7a1f] text-xs flex-shrink-0">⚠️</span>
                    <span className="text-[11px] text-[#9c7a1f]">Provider accounts require business license verification. Review takes 3-5 business days.</span>
                  </div>
                )}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="font-black text-gray-800 text-xl mb-1">Your Details</div>
              <div className="text-sm text-gray-500 mb-4">Tell us about yourself</div>
              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Full Name *</label>
                  <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-3 py-3">
                    <User size={15} className="text-gray-400" />
                    <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Ahmad Khan"
                      className="flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Email Address *</label>
                  <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-3 py-3">
                    <Mail size={15} className="text-gray-400" />
                    <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@email.com"
                      className="flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Mobile Number *</label>
                  <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-3 py-3">
                    <Phone size={15} className="text-gray-400" />
                    <input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+92 300 0000000"
                      className="flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Country of Residence *</label>
                  <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-3 py-3">
                    <Globe size={15} className="text-gray-400" />
                    <select value={form.country} onChange={(e) => set("country", e.target.value)}
                      className="flex-1 bg-transparent text-sm text-gray-800 outline-none">
                      <option value="">Select country...</option>
                      {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </>
          )}

          {step === 3 && role === "seeker" && (
            <>
              <div className="font-black text-gray-800 text-xl mb-1">Set Password</div>
              <div className="text-sm text-gray-500 mb-4">Choose a strong password</div>
              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Password *</label>
                  <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-3 py-3">
                    <Lock size={15} className="text-gray-400" />
                    <input type={showPass ? "text" : "password"} value={form.password} onChange={(e) => set("password", e.target.value)}
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
                    <input type="password" value={form.confirm} onChange={(e) => set("confirm", e.target.value)} placeholder="Repeat password"
                      className="flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400" />
                  </div>
                </div>
                <div className="bg-[#E8F0EF] border border-[#004B49]/15 rounded-xl p-3">
                  <div className="text-xs text-[#004B49]">
                    By creating an account you agree to our <span className="font-bold">Terms of Service</span> and <span className="font-bold">Privacy Policy</span>.
                  </div>
                </div>
              </div>
            </>
          )}

          {step === 3 && role === "provider" && (
            <>
              <div className="font-black text-gray-800 text-xl mb-1">Business Information</div>
              <div className="text-sm text-gray-500 mb-4">Tell us about your business</div>
              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">Business Type *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {BUSINESS_TYPES.map((b) => (
                      <button key={b.key} onClick={() => set("businessType", b.key)}
                        className={`border-2 rounded-xl p-2.5 text-left transition-all ${form.businessType === b.key ? "border-[#004B49] bg-[#E8F0EF]" : "border-gray-100 bg-gray-50"}`}>
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
                    <input value={form.companyName} onChange={(e) => set("companyName", e.target.value)} placeholder="ImmigrationPro Inc."
                      className="flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Director / Owner Name *</label>
                  <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-3 py-3">
                    <User size={15} className="text-gray-400" />
                    <input value={form.directorName} onChange={(e) => set("directorName", e.target.value)} placeholder="Full name of owner/director"
                      className="flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Office Address *</label>
                  <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-3 py-3">
                    <MapPin size={15} className="text-gray-400" />
                    <input value={form.officeAddress} onChange={(e) => set("officeAddress", e.target.value)} placeholder="Full office address"
                      className="flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">City *</label>
                    <input value={form.officeCity} onChange={(e) => set("officeCity", e.target.value)} placeholder="Karachi"
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-3 text-sm outline-none focus:border-[#004B49]" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Country *</label>
                    <select value={form.officeCountry} onChange={(e) => set("officeCountry", e.target.value)}
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-3 text-sm outline-none focus:border-[#004B49]">
                      <option value="">Select...</option>
                      {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Website (optional)</label>
                  <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-3 py-3">
                    <Globe size={15} className="text-gray-400" />
                    <input value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="https://yourcompany.com"
                      className="flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400" />
                  </div>
                </div>
              </div>
            </>
          )}

          {step === 4 && role === "provider" && (
            <>
              <div className="font-black text-gray-800 text-xl mb-1">License Verification</div>
              <div className="text-sm text-gray-500 mb-4">Your license details for verification</div>
              <div className="bg-[#FBF3E1] border border-[#D4AF37]/30 rounded-xl p-3 mb-4 flex gap-2">
                <span className="text-[#9c7a1f] flex-shrink-0">⚠️</span>
                <span className="text-[11px] text-[#9c7a1f]">Only licensed professionals can operate as Visa Providers on Crossingate. Fake licenses result in permanent ban.</span>
              </div>
              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">License / Registration Number *</label>
                  <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-3 py-3">
                    <FileText size={15} className="text-gray-400" />
                    <input value={form.licenseNumber} onChange={(e) => set("licenseNumber", e.target.value)} placeholder="e.g. R123456 or BEOE-2024-001"
                      className="flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Issuing Authority *</label>
                  <select value={form.licenseBody} onChange={(e) => set("licenseBody", e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-3 text-sm text-gray-800 outline-none focus:border-[#004B49]">
                    <option value="">Select authority...</option>
                    {LICENSE_BODIES.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">License Expiry Date *</label>
                  <input type="date" value={form.licenseExpiry} onChange={(e) => set("licenseExpiry", e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-3 text-sm text-gray-800 outline-none focus:border-[#004B49]" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Upload License Document *</label>
                  <div className="border-2 border-dashed border-gray-200 rounded-xl py-4 text-center cursor-pointer hover:border-[#004B49]/40"
                    onClick={() => alert("File upload coming soon.")}>
                    <div className="text-2xl mb-1">📄</div>
                    <div className="text-xs font-semibold text-gray-500">Tap to upload license</div>
                    <div className="text-[10px] text-gray-400">PDF or Image · Max 5MB</div>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Upload Company Registration *</label>
                  <div className="border-2 border-dashed border-gray-200 rounded-xl py-4 text-center cursor-pointer hover:border-[#004B49]/40"
                    onClick={() => alert("File upload coming soon.")}>
                    <div className="text-2xl mb-1">🏢</div>
                    <div className="text-xs font-semibold text-gray-500">Company registration certificate</div>
                    <div className="text-[10px] text-gray-400">PDF or Image · Max 5MB</div>
                  </div>
                </div>
                <div className="bg-[#E8F0EF] border border-[#004B49]/15 rounded-xl p-3 flex gap-2">
                  <span className="text-[#004B49] flex-shrink-0">ℹ️</span>
                  <div className="text-[11px] text-[#004B49]">
                    <div className="font-black mb-0.5">After submission:</div>
                    <div>1. Admin verifies your license</div>
                    <div>2. Account approved within 3-5 days</div>
                    <div>3. You receive email confirmation</div>
                  </div>
                </div>
              </div>
            </>
          )}

          {step === 5 && role === "provider" && (
            <>
              <div className="font-black text-gray-800 text-xl mb-1">Set Password</div>
              <div className="text-sm text-gray-500 mb-4">Almost done!</div>
              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Password *</label>
                  <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-3 py-3">
                    <Lock size={15} className="text-gray-400" />
                    <input type={showPass ? "text" : "password"} value={form.password} onChange={(e) => set("password", e.target.value)}
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
                    <input type="password" value={form.confirm} onChange={(e) => set("confirm", e.target.value)} placeholder="Repeat password"
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
                <div className="bg-[#E8F0EF] border border-[#004B49]/15 rounded-xl p-3">
                  <div className="text-[11px] text-[#004B49]">
                    By submitting you agree to our <span className="font-bold">Terms of Service</span>, <span className="font-bold">Privacy Policy</span>, and <span className="font-bold">Provider Agreement</span>.
                  </div>
                </div>
              </div>
            </>
          )}

          <button onClick={() => void handleNext()} disabled={loading}
            className="w-full bg-[#004B49] text-white font-bold py-4 rounded-2xl text-sm mt-5 disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? "Creating account..." : (step === totalSteps
              ? (role === "provider" ? "Submit for Review 🚀" : "Create Account 🚀")
              : (<><span>Continue</span><ChevronRight size={16} /></>))}
          </button>

          {step === 1 && (
            <div className="text-center text-sm text-gray-500 mt-4">
              Already have an account?{" "}
              <Link to="/login"><span className="font-bold text-[#004B49]">Login</span></Link>
            </div>
          )}

          {step > 1 && (
            <button onClick={() => { setStep(step - 1); setError(""); }} className="w-full text-gray-400 text-sm font-semibold py-2 mt-1">
              ← Back
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
