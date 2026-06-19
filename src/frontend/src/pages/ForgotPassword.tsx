import { Link, useNavigate } from "@tanstack/react-router";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

const BrandLight = (
  <span style={{
    fontFamily: "'Montserrat', 'Inter', Arial, sans-serif",
    fontWeight: 700,
    fontStyle: "italic",
    fontSize: "22px",
    letterSpacing: "-0.3px",
    lineHeight: 1,
  }}>
    <span style={{ color: "#ffffff" }}>Crossing</span>
    <span style={{ color: "#D4AF37" }}>point</span>
  </span>
);

export function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!email) { setError("Please enter your email address"); return; }
    setLoading(true);
    setError("");

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-[#F4F6F6] flex flex-col">

      <div className="bg-gradient-to-br from-[#00302e] via-[#004B49] to-[#00615e] px-6 pt-16 pb-10 flex flex-col items-center">
        {BrandLight}
        <div className="text-white/60 text-xs mt-2">Password Recovery</div>
      </div>

      <div className="flex-1 px-5 -mt-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm">

          {!sent ? (
            <>
              <button onClick={() => void navigate({ to: "/login" })} className="flex items-center gap-1.5 text-gray-400 text-xs mb-4">
                <ArrowLeft size={14} /> Back to Login
              </button>

              <div className="font-black text-gray-800 text-xl mb-1">Forgot Password?</div>
              <div className="text-sm text-gray-500 mb-5">Enter your email and we'll send you a reset link</div>

              {error && (
                <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-xs font-semibold text-red-500 mb-4">
                  ⚠️ {error}
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Email Address</label>
                <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-3 py-3">
                  <Mail size={15} className="text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    className="flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400"
                    onKeyDown={(e) => e.key === "Enter" && void handleSubmit()}
                  />
                </div>
              </div>

              <button onClick={() => void handleSubmit()} disabled={loading}
                className="w-full bg-[#004B49] text-white font-bold py-4 rounded-2xl text-sm mt-5 disabled:opacity-60">
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-green-500" />
              </div>
              <div className="font-black text-gray-800 text-xl mb-2">Email Sent!</div>
              <div className="text-sm text-gray-500 mb-6 leading-relaxed">
                We've sent a password reset link to <span className="font-bold text-gray-700">{email}</span>. Check your inbox.
              </div>
              <div className="bg-[#E8F0EF] border border-[#004B49]/15 rounded-xl p-3 mb-5 text-left">
                <div className="text-xs text-[#004B49] flex flex-col gap-1">
                  <div>• Check your spam/junk folder too</div>
                  <div>• Link expires in 1 hour</div>
                  <div>• Click the link to set a new password</div>
                </div>
              </div>
              <Link to="/login">
                <button className="w-full bg-[#004B49] text-white font-bold py-4 rounded-2xl text-sm">
                  Back to Login
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
