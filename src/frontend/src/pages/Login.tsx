import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export function Login() {
  const navigate = useNavigate();
  const { login, isLoggingIn, isInitializing, identity } =
    useInternetIdentity();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ email: "", password: "" });

  if (identity) {
    void navigate({ to: "/" });
    return null;
  }

  const validate = () => {
    const newErrors = { email: "", password: "" };
    if (!email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      newErrors.email = "Invalid email format";
    if (!password.trim()) newErrors.password = "Password is required";
    else if (password.length < 6)
      newErrors.password = "Password must be at least 6 characters";
    setErrors(newErrors);
    return !newErrors.email && !newErrors.password;
  };

  const handleEmailLogin = () => {
    if (!validate()) return;
    // Demo: trigger II login
    login();
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src="/assets/generated/crossing-logo-transparent.dim_200x200.png"
            alt="Crossing"
            className="h-12 w-12 object-contain mx-auto mb-3"
          />
          <h1 className="font-display text-2xl font-bold text-foreground">
            Welcome back
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Sign in to your Crossing account
          </p>
        </div>

        <Card className="border-border/60 shadow-card">
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrors((prev) => ({ ...prev, email: "" }));
                  }}
                  className={errors.email ? "border-destructive" : ""}
                  autoComplete="email"
                  data-ocid="auth.email_input"
                />
                {errors.email && (
                  <p
                    className="text-xs text-destructive"
                    data-ocid="auth.email_error"
                  >
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <button
                    type="button"
                    className="text-xs text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrors((prev) => ({ ...prev, password: "" }));
                    }}
                    className={`pr-10 ${errors.password ? "border-destructive" : ""}`}
                    autoComplete="current-password"
                    data-ocid="auth.password_input"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {errors.password && (
                  <p
                    className="text-xs text-destructive"
                    data-ocid="auth.password_error"
                  >
                    {errors.password}
                  </p>
                )}
              </div>

              <Button
                className="w-full bg-primary text-primary-foreground"
                onClick={handleEmailLogin}
                disabled={isLoggingIn || isInitializing}
                data-ocid="auth.login_button"
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 size={15} className="mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </div>

            <div className="relative my-5">
              <Separator />
              <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-card px-2 text-xs text-muted-foreground">
                or
              </span>
            </div>

            {/* Internet Identity */}
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={login}
              disabled={isLoggingIn || isInitializing}
              data-ocid="auth.ii_login_button"
            >
              <img
                src="/assets/generated/crossing-logo-transparent.dim_200x200.png"
                alt="Internet Identity"
                className="h-4 w-4 object-contain opacity-60"
              />
              Continue with Internet Identity
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="text-primary hover:underline font-medium"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
