import { Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

function CPLogo({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <rect width="80" height="80" rx="20" fill="white" fillOpacity="0.15" />
      <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle"
        fontFamily="Arial Black, sans-serif" fontWeight="900" fontSize="32" fill="white">
        CP
      </text>
      <circle cx="66" cy="66" r="8" fill="#D4AF37" />
    </svg>
  );
}

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

    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });

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
    <div className="min-h-screen bg-[#F4F6F6] flex flex-col">

      <div className="bg-gradient-to-br from-[#00302e] via-[#004B49] to-[#00615e] px-6 pt-16 pb-10 flex flex-col items-center">
        <CPLogo size={56} />
        <div className="text-white font-black text-2xl tracking-wider mt-3">CrossingPoint</div>
        <div className="text-white/60 text-xs mt-1">World's Trusted Visa Marketplace</div>
      </div>

      <div className="flex-1 px-5 -mt-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <div className="font-black text-gray-800 text-xl mb-1">Welcome Back</div>
          <div className="text-sm text-gray-500 mb-5">Login to continue to CrossingPoint</div>

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
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400"
                  onKeyDown={(e) => e.key === "Enter" && void handleLogin()} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Password</label>
                <Link to="/forgot-password">
                  <span className="text-[10px] font-bold text-[#004B49]">Forgot Password?</span>
                </Link>
              </div>
              <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-3 py-3">
                <Lock size={15} className="text-gray-400" />
                <input type={showPass ? "text" : "password"} value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400"
                  onKeyDown={(e) => e.key === "Enter" && void handleLogin()} />
                <button onClick={() => setShowPass(!showPass)}>
                  {showPass ? <EyeOff size={15} className="text-gray-400" /> : <Eye size={15} className="text-gray-400" />}
                </button>
              </div>
            </div>
          </div>

          <button onClick={() => void handleLogin()} disabled={loading}
            className="w-full bg-[#004B49] text-white font-bold py-4 rounded-2xl text-sm mt-5 disabled:opacity-60">
            {loading ? "Logging in..." : "Login"}
          </button>

          <div className="text-center text-sm text-gray-500 mt-5">
            Don't have an account?{" "}
            <Link to="/signup"><span className="font-bold text-[#004B49]">Sign Up</span></Link>
          </div>
        </div>

        <div className="text-center text-xs text-gray-400 mt-6 px-8">
          By logging in, you agree to CrossingPoint's Terms of Service and Privacy Policy. Your funds are always protected by Escrow.
        </div>
      </div>
    </div>
  );
}
