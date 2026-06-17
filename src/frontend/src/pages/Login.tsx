import { Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }
    setLoading(true);
    setError("");

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      setError(loginError.message === "Invalid login credentials"
        ? "Incorrect email or password"
        : loginError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    void navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen bg-[#F2F3F7] flex flex-col">

      {/* TOP BRAND HEADER */}
      <div className="bg-gradient-to-br from-[#1a1a2e] to-[#1a56f0] px-6 pt-16 pb-10 flex flex-col items-center">
        <svg width="56" height="56" viewBox="0 0 80 80" fill="none">
          <rect width="80" height="80" rx="20" fill="white" fillOpacity="0.15" />
          <line x1="18" y1="18" x2="62" y2="62" stroke="white" strokeWidth="9" strokeLinecap="round" />
          <line x1="62" y1="18" x2="18" y2="62" stroke="white" strokeWidth="9" strokeLinecap="round" />
          <circle cx="40" cy="40" r="7" fill="white" />
        </svg>
        <div className="text-white font-black text-2xl tracking-wider mt-3">CROSSING</div>
        <div className="text-white/60 text-xs mt-1">World's Trusted Visa Marketplace</div>
      </div>

      {/* FORM */}
      <div className="flex-1 px-5 -mt-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <div className="font-black text-gray-800 text-xl mb-1">Welcome Back</div>
          <div className="text-sm text-gray-500 mb-5">Login to continue to Crossing</div>

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-xs font-semibold text-red-500 mb-4">
              ⚠️ {error}
            </div>
          )}

          <div className="flex flex-col gap-3">
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
                  onKeyDown={(e) => e.key === "Enter" && void handleLogin()}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Password</label>
                <Link to="/forgot-password">
                  <span className="text-[10px] font-bold text-[#1a56f0]">Forgot Password?</span>
                </Link>
              </div>
              <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-3 py-3">
                <Lock size={15} className="text-gray-400" />
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400"
                  onKeyDown={(e) => e.key === "Enter" && void handleLogin()}
                />
                <button onClick={() => setShowPass(!showPass)}>
                  {showPass ? <EyeOff size={15} className="text-gray-400" /> : <Eye size={15} className="text-gray-400" />}
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={() => void handleLogin()}
            disabled={loading}
            className="w-full bg-[#1a56f0] text-white font-bold py-4 rounded-2xl text-sm mt-5 disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          <div className="text-center text-sm text-gray-500 mt-5">
            Don't have an account?{" "}
            <Link to="/signup"><span className="font-bold text-[#1a56f0]">Sign Up</span></Link>
          </div>
        </div>

        <div className="text-center text-xs text-gray-400 mt-6 px-8">
          By logging in, you agree to Crossing's Terms of Service and Privacy Policy. Your funds are always protected by Escrow.
        </div>
      </div>
    </div>
  );
}
