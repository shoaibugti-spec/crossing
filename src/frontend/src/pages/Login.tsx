import { Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useState } from "react";

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = () => {
    if (!email || !password) {
      setError("Please fill all fields");
      return;
    }
    setError("");
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      void navigate({ to: "/" });
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#F2F3F7] flex flex-col">

      {/* TOP */}
      <div className="bg-gradient-to-br from-[#1a1a2e] to-[#1a56f0] px-6 pt-16 pb-10 text-center">
        <div className="flex justify-center mb-4">
          <svg width="52" height="52" viewBox="0 0 80 80" fill="none">
            <rect width="80" height="80" rx="20" fill="white" fillOpacity="0.15" />
            <line x1="18" y1="18" x2="62" y2="62" stroke="white" strokeWidth="9" strokeLinecap="round" />
            <line x1="62" y1="18" x2="18" y2="62" stroke="white" strokeWidth="9" strokeLinecap="round" />
            <circle cx="40" cy="40" r="7" fill="white" />
          </svg>
        </div>
        <div className="text-white font-black text-2xl tracking-wider mb-1">CROSSING</div>
        <div className="text-white/60 text-sm">P2P Visa Marketplace</div>
      </div>

      {/* FORM */}
      <div className="flex-1 px-6 py-8">
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <div className="font-black text-gray-800 text-xl mb-1">Welcome back</div>
          <div className="text-sm text-gray-500 mb-6">Login to your account</div>

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-xs font-semibold text-red-500 mb-4">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Email</label>
            <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 focus-within:border-[#1a56f0]">
              <Mail size={16} className="text-gray-400 flex-shrink-0" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400"
              />
            </div>
          </div>

          <div className="mb-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Password</label>
            <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 focus-within:border-[#1a56f0]">
              <Lock size={16} className="text-gray-400 flex-shrink-0" />
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                placeholder="Your password"
                className="flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400"
              />
              <button onClick={() => setShowPass(!showPass)}>
                {showPass
                  ? <EyeOff size={16} className="text-gray-400" />
                  : <Eye size={16} className="text-gray-400" />}
              </button>
            </div>
          </div>

          <div className="text-right mb-6">
            <span className="text-xs font-semibold text-[#1a56f0] cursor-pointer">
              Forgot password?
            </span>
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-[#1a56f0] text-white font-bold py-4 rounded-2xl text-sm disabled:opacity-60 mb-4"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400">or continue with</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          <div className="grid grid-cols-3 gap-2 mb-6">
            {[
              { label: "Google", emoji: "G" },
              { label: "Apple", emoji: "" },
              { label: "LinkedIn", emoji: "in" },
            ].map(({ label, emoji }) => (
              <button
                key={label}
                onClick={handleLogin}
                className="border border-gray-100 bg-gray-50 rounded-xl py-3 text-xs font-bold text-gray-600 hover:border-[#1a56f0]/30 transition-all"
              >
                {emoji} {label}
              </button>
            ))}
          </div>

          <div className="text-center text-sm text-gray-500">
            No account?{" "}
            <Link to="/signup">
              <span className="font-bold text-[#1a56f0]">Create one</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
