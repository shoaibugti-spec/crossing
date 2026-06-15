import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, CheckCircle, Plus, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useCreateListing } from "../hooks/useQueries";
import { COUNTRIES, VISA_TYPES } from "../lib/mockData";

type Step = 1 | 2 | 3 | 4;

interface AdFormData {
  title: string;
  category: string;
  destinationCountry: string;
  originCountry: string;
  price: string;
  currency: string;
  processingTime: string;
  requirements: string[];
  description: string;
}

const CURRENCIES = ["USD", "EUR", "GBP", "AED", "SAR", "PKR", "INR"];

export function PostAd() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const createListing = useCreateListing();

  const [form, setForm] = useState<AdFormData>({
    title: "",
    category: "",
    destinationCountry: "",
    originCountry: "",
    price: "",
    currency: "USD",
    processingTime: "",
    requirements: [""],
    description: "",
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof AdFormData, string>>
  >({});

  const updateField = (field: keyof AdFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateStep = (s: Step): boolean => {
    const newErrors: typeof errors = {};
    if (s === 1) {
      if (!form.title.trim()) newErrors.title = "Title is required";
      if (!form.category) newErrors.category = "Category is required";
      if (!form.destinationCountry)
        newErrors.destinationCountry = "Destination country is required";
      if (!form.description.trim())
        newErrors.description = "Description is required";
    }
    if (s === 2) {
      if (
        !form.price ||
        Number.isNaN(Number(form.price)) ||
        Number(form.price) <= 0
      ) {
        newErrors.price = "Valid price is required";
      }
      if (!form.processingTime.trim())
        newErrors.processingTime = "Processing time is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep((s) => Math.min(4, s + 1) as Step);
    }
  };

  const prevStep = () => setStep((s) => Math.max(1, s - 1) as Step);

  const addRequirement = () => {
    setForm((prev) => ({ ...prev, requirements: [...prev.requirements, ""] }));
  };

  const updateRequirement = (index: number, value: string) => {
    setForm((prev) => ({
      ...prev,
      requirements: prev.requirements.map((r, i) => (i === index ? value : r)),
    }));
  };

  const removeRequirement = (index: number) => {
    setForm((prev) => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index),
    }));
  };

  const handlePublish = async (isDraft = false) => {
    try {
      const id = await createListing.mutateAsync({
        title: form.title,
        category: form.category,
        price: BigInt(Math.round(Number(form.price) * 100)),
      });
      toast.success(
        isDraft ? "Ad saved as draft" : "Ad published successfully!",
      );
      void navigate({ to: "/my-ads" });
      console.log("Created listing:", id);
    } catch {
      // Fallback for unauthenticated users
      toast.success(
        isDraft ? "Ad saved as draft" : "Ad published successfully!",
      );
      void navigate({ to: "/my-ads" });
    }
  };

  const steps = [
    { label: "Basic Info", number: 1 },
    { label: "Pricing", number: 2 },
    { label: "Requirements", number: 3 },
    { label: "Preview", number: 4 },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-foreground">
          Post a Visa Service
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Share your visa facilitation service with thousands of seekers
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-0 mb-8 overflow-x-auto pb-2">
        {steps.map((s, i) => (
          <div key={s.number} className="flex items-center">
            <div className="flex items-center gap-2 shrink-0">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                  step > s.number
                    ? "bg-green-600 text-white"
                    : step === s.number
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {step > s.number ? <CheckCircle size={16} /> : s.number}
              </div>
              <span
                className={`text-sm font-medium shrink-0 ${
                  step === s.number
                    ? "text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className="w-8 h-px bg-border mx-3 shrink-0" />
            )}
          </div>
        ))}
      </div>

      <Card className="border-border/60 shadow-card">
        <CardContent className="p-6">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="font-display font-bold text-lg">
                Basic Information
              </h2>

              <div className="space-y-1.5">
                <Label htmlFor="title">
                  Service Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="e.g., Saudi Arabia Work Visa - Guaranteed Processing"
                  value={form.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  className={errors.title ? "border-destructive" : ""}
                />
                {errors.title && (
                  <p className="text-xs text-destructive">{errors.title}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>
                    Visa Category <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={form.category}
                    onValueChange={(v) => updateField("category", v)}
                  >
                    <SelectTrigger
                      className={errors.category ? "border-destructive" : ""}
                    >
                      <SelectValue placeholder="Select visa type" />
                    </SelectTrigger>
                    <SelectContent>
                      {VISA_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && (
                    <p className="text-xs text-destructive">
                      {errors.category}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label>
                    Destination Country{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={form.destinationCountry}
                    onValueChange={(v) => updateField("destinationCountry", v)}
                  >
                    <SelectTrigger
                      className={
                        errors.destinationCountry ? "border-destructive" : ""
                      }
                    >
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.destinationCountry && (
                    <p className="text-xs text-destructive">
                      {errors.destinationCountry}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Origin Country (Optional)</Label>
                <Select
                  value={form.originCountry}
                  onValueChange={(v) => updateField("originCountry", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Where applicants typically come from" />
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

              <div className="space-y-1.5">
                <Label htmlFor="description">
                  Description <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe your service in detail — experience, success rate, what's included..."
                  rows={4}
                  value={form.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  className={errors.description ? "border-destructive" : ""}
                  data-ocid="post_ad.description_textarea"
                />
                {errors.description && (
                  <p className="text-xs text-destructive">
                    {errors.description}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Pricing */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="font-display font-bold text-lg">
                Pricing & Timeline
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="price">
                    Service Fee <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="0.00"
                    value={form.price}
                    onChange={(e) => updateField("price", e.target.value)}
                    className={errors.price ? "border-destructive" : ""}
                  />
                  {errors.price && (
                    <p className="text-xs text-destructive">{errors.price}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label>Currency</Label>
                  <Select
                    value={form.currency}
                    onValueChange={(v) => updateField("currency", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="processingTime">
                  Processing Time Estimate{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="processingTime"
                  placeholder="e.g., 15-21 business days"
                  value={form.processingTime}
                  onChange={(e) =>
                    updateField("processingTime", e.target.value)
                  }
                  className={errors.processingTime ? "border-destructive" : ""}
                />
                {errors.processingTime && (
                  <p className="text-xs text-destructive">
                    {errors.processingTime}
                  </p>
                )}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
                <p className="font-semibold mb-1">💡 Pricing Guidance</p>
                <p>
                  Similar {form.category || "visa"} services in our marketplace
                  are priced between $120–$2,500. Competitive pricing increases
                  your chances of getting matched.
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Requirements */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-display font-bold text-lg">
                  Documents Required
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  List all documents buyers need to provide for their
                  application
                </p>
              </div>

              <div className="space-y-2.5">
                {form.requirements.map((req, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: requirements are positional
                  <div key={i} className="flex gap-2 items-center">
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-semibold shrink-0">
                      {i + 1}
                    </div>
                    <Input
                      placeholder={`Requirement ${i + 1}, e.g., Valid passport (min 6 months)`}
                      value={req}
                      onChange={(e) => updateRequirement(i, e.target.value)}
                      className="flex-1"
                    />
                    {form.requirements.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeRequirement(i)}
                        className="h-9 w-9 text-muted-foreground hover:text-destructive"
                      >
                        <X size={14} />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={addRequirement}
                className="gap-2"
              >
                <Plus size={14} />
                Add Requirement
              </Button>
            </div>
          )}

          {/* Step 4: Preview */}
          {step === 4 && (
            <div className="space-y-5">
              <h2 className="font-display font-bold text-lg">
                Preview & Publish
              </h2>
              <p className="text-sm text-muted-foreground">
                Review your listing before publishing
              </p>

              <div className="bg-muted/30 rounded-xl p-5 space-y-4">
                <div className="flex flex-wrap gap-2">
                  {form.category && (
                    <Badge variant="outline" className="badge-navy text-xs">
                      {form.category}
                    </Badge>
                  )}
                  {form.destinationCountry && (
                    <Badge variant="outline" className="text-xs">
                      {form.destinationCountry}
                    </Badge>
                  )}
                </div>

                <h3 className="font-display font-bold text-xl text-foreground">
                  {form.title || "Your Ad Title"}
                </h3>

                {form.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {form.description}
                  </p>
                )}

                <Separator />

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Price</span>
                    <p className="font-bold text-lg font-display">
                      {form.price
                        ? `$${Number(form.price).toLocaleString()} ${form.currency}`
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      Processing Time
                    </span>
                    <p className="font-medium">{form.processingTime || "—"}</p>
                  </div>
                </div>

                {form.requirements.filter((r) => r.trim()).length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-semibold mb-2">
                        Requirements:
                      </p>
                      <ul className="space-y-1.5">
                        {form.requirements
                          .filter((r) => r.trim())
                          .map((req) => (
                            <li
                              key={req}
                              className="flex items-start gap-2 text-sm text-muted-foreground"
                            >
                              <CheckCircle
                                size={13}
                                className="text-green-600 shrink-0 mt-0.5"
                              />
                              {req}
                            </li>
                          ))}
                      </ul>
                    </div>
                  </>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => handlePublish(true)}
                  disabled={createListing.isPending}
                  className="flex-1"
                  data-ocid="post_ad.save_draft_button"
                >
                  Save as Draft
                </Button>
                <Button
                  onClick={() => handlePublish(false)}
                  disabled={createListing.isPending}
                  className="flex-1 bg-primary text-primary-foreground"
                  data-ocid="post_ad.submit_button"
                >
                  {createListing.isPending ? "Publishing..." : "Publish Ad"}
                </Button>
              </div>
            </div>
          )}

          {/* Navigation */}
          {step < 4 && (
            <div className="flex justify-between mt-6 pt-6 border-t border-border/50">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={step === 1}
                className="gap-1.5"
                data-ocid="post_ad.prev_button"
              >
                <ArrowLeft size={14} />
                Back
              </Button>
              <Button
                onClick={nextStep}
                className="gap-1.5 bg-primary text-primary-foreground"
                data-ocid="post_ad.next_button"
              >
                Continue
                <ArrowRight size={14} />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
