import { cn } from "@/lib/utils";
import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: number;
  showValue?: boolean;
  className?: string;
}

const STAR_POSITIONS = [0, 1, 2, 3, 4];

export function StarRating({
  rating,
  maxRating = 5,
  size = 14,
  showValue = false,
  className,
}: StarRatingProps) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)}>
      {STAR_POSITIONS.slice(0, maxRating).map((i) => (
        <Star
          key={i}
          size={size}
          className={
            i < Math.floor(rating)
              ? "fill-amber-400 text-amber-400"
              : i < rating
                ? "fill-amber-200 text-amber-400"
                : "fill-gray-100 text-gray-300"
          }
        />
      ))}
      {showValue && (
        <span className="ml-1 text-sm text-muted-foreground font-medium">
          {rating.toFixed(1)}
        </span>
      )}
    </span>
  );
}
