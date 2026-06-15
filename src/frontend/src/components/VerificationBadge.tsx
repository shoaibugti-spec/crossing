import { cn } from "@/lib/utils";
import { Shield, ShieldCheck, Star } from "lucide-react";
import { VerificationLevel } from "../backend.d";

interface VerificationBadgeProps {
  level: VerificationLevel;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function VerificationBadge({
  level,
  size = "md",
  showLabel = true,
  className,
}: VerificationBadgeProps) {
  const iconSizes = { sm: 12, md: 14, lg: 16 };
  const iconSize = iconSizes[size];

  if (level === VerificationLevel.fullyVerified) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full font-medium",
          size === "sm" && "text-xs px-2 py-0.5",
          size === "md" && "text-xs px-2.5 py-1",
          size === "lg" && "text-sm px-3 py-1",
          "bg-amber-50 text-amber-700 border border-amber-200",
          className,
        )}
      >
        <Star size={iconSize} className="fill-amber-500 text-amber-500" />
        {showLabel && "Fully Verified"}
      </span>
    );
  }

  if (level === VerificationLevel.documentVerified) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full font-medium",
          size === "sm" && "text-xs px-2 py-0.5",
          size === "md" && "text-xs px-2.5 py-1",
          size === "lg" && "text-sm px-3 py-1",
          "bg-blue-50 text-blue-700 border border-blue-200",
          className,
        )}
      >
        <ShieldCheck size={iconSize} />
        {showLabel && "Document Verified"}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium",
        size === "sm" && "text-xs px-2 py-0.5",
        size === "md" && "text-xs px-2.5 py-1",
        size === "lg" && "text-sm px-3 py-1",
        "bg-gray-100 text-gray-600 border border-gray-200",
        className,
      )}
    >
      <Shield size={iconSize} />
      {showLabel && "Basic"}
    </span>
  );
}
