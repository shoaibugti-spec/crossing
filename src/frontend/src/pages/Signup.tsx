import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link, useNavigate } from "@tanstack/react-router";
import { Check, Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { UserRole } from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useCreateUser } from "../hooks/useQueries";
import { COUNTRIES } from "../lib/mockData";

const ROLE_OPTIONS = [
  {
    value: UserRole.buyer,
    label: "Buyer",
    description: "I'm looking for visa services",
    icon: "🔍",
  },
  {
    value: UserRole.seller,
    label: "Seller",
    description: "I provide visa facilitation services",
    icon: "📋",
  },
];

export function Signup() {
  const navigate = useNavigate();
  const { login, isLoggingIn, identity } = useInternetIdentity();
  const createUser = useCreateUser();
  // step reserved for future multi-step form
  const [_step, _setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: UserRole.buyer as UserRole,
    country: "",
  });
  const [errors, setErrors] = useState<Partial<typeof form>>({});

  if (identity) {
    void navigate({ to: "/" });
    return null;
  }

  const validate = () => {
    const newErrors: Partial<typeof form> = {};
    if (!form.name.trim()) newErrors.name = "Name is required";
    if (!form.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      newErrors.email = "Invalid email";
    if (!form.password.trim()) newErrors.password = "Password is required";
    else if (form.password.length < 8)
      newErrors.password = "Minimum 8 characters";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validate()) return;

    try {
      await createUser.mutateAsync({
        country: form.country,
        bio: "",
        role: form.role,
      });
    } catch {
      // fallback
    }

    // Trigger login
    login();
    toast.success("Account created! Please complete authentication.");
    void navigate({ to: "/kyc" });
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
            Create your account
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Join Crossing and access trusted visa services
          </p>
        </div>

        <Card className="border-border/60 shadow-card">
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Name */}
              <div className="space-y-1.5">
                <Label htmlFor="signup-name">Full Name</Label>
                <Input
                  id="signup-name"
                  placeholder="Your full name"
                  value={form.name}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, name: e.target.value }));
                    setErrors((e2) => ({ ...e2, name: "" }));
                  }}
                  className={errors.name ? "border-destructive" : ""}
                  data-ocid="auth.name_input"
                />
                {errors.name && (
                  <p
                    className="text-xs text-destructive"
                    data-ocid="auth.name_error"
                  >
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="signup-email">Email Address</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, email: e.target.value }));
                    setErrors((e2) => ({ ...e2, email: "" }));
                  }}
                  className={errors.email ? "border-destructive" : ""}
                  autoComplete="email"
                  data-ocid="auth.signup_email_input"
                />
                {errors.email && (
                  <p
                    className="text-xs text-destructive"
                    data-ocid="auth.signup_email_error"
                  >
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="signup-password">Password</Label>
                <div className="relative">
                  <Input
                    id="signup-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Min. 8 characters"
                    value={form.password}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, password: e.target.value }));
                      setErrors((e2) => ({ ...e2, password: "" }));
                    }}
                    className={`pr-10 ${errors.password ? "border-destructive" : ""}`}
                    autoComplete="new-password"
                    data-ocid="auth.signup_password_input"
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
                    data-ocid="auth.signup_password_error"
                  >
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Role Selection */}
              <div className="space-y-2">
                <Label>I want to</Label>
                <RadioGroup
                  value={form.role}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, role: v as UserRole }))
                  }
                  className="grid grid-cols-2 gap-3"
                >
                  {ROLE_OPTIONS.map((option) => (
                    <div key={option.value}>
                      <RadioGroupItem
                        value={option.value}
                        id={`role-${option.value}`}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={`role-${option.value}`}
                        className={`flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          form.role === option.value
                            ? "border-primary bg-primary/5"
                            : "border-border/60 hover:border-primary/40"
                        }`}
                        data-ocid={`auth.role_${option.value}_radio`}
                      >
                        <span className="text-xl">{option.icon}</span>
                        <span className="font-semibold text-sm">
                          {option.label}
                        </span>
                        <span className="text-xs text-muted-foreground text-center">
                          {option.description}
                        </span>
                        {form.role === option.value && (
                          <Check size={14} className="text-primary" />
                        )}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Country */}
              <div className="space-y-1.5">
                <Label>Country</Label>
                <Select
                  value={form.country}
                  onValueChange={(v) => setForm((f) => ({ ...f, country: v }))}
                >
                  <SelectTrigger data-ocid="auth.country_select">
                    <SelectValue placeholder="Select your country" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                className="w-full bg-primary text-primary-foreground"
                onClick={handleSignup}
                disabled={createUser.isPending || isLoggingIn}
                data-ocid="auth.signup_button"
              >
                {createUser.isPending || isLoggingIn ? (
                  <>
                    <Loader2 size={15} className="mr-2 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-primary hover:underline font-medium"
          >
            Sign in
          </Link>
        </p>

        <p className="text-center text-xs text-muted-foreground mt-3">
          By creating an account, you agree to our Terms of Service and Privacy
          Policy
        </p>
      </div>
    </div>
  );
}
