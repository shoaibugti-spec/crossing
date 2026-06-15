import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { Clock, Eye, MapPin, MessageCircle } from "lucide-react";
import type { MockAd } from "../lib/mockData";
import { StarRating } from "./StarRating";
import { VerificationBadge } from "./VerificationBadge";

interface AdCardProps {
  ad: MockAd;
  index: number;
  className?: string;
}

export function AdCard({ ad, index, className }: AdCardProps) {
  return (
    <Link to="/ads/$id" params={{ id: ad.id }}>
      <Card
        data-ocid={`ads.card.${index}`}
        className={cn(
          "group cursor-pointer transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5 overflow-hidden border-border/60",
          className,
        )}
      >
        <CardContent className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-display font-semibold text-foreground text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                {ad.title}
              </h3>
            </div>
            <Badge
              variant="outline"
              className="shrink-0 text-xs font-medium badge-navy"
            >
              {ad.category}
            </Badge>
          </div>

          {/* Location */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
            <span className="flex items-center gap-1">
              <MapPin size={11} />
              {ad.destinationCountry}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {ad.processingTime}
            </span>
          </div>

          {/* Description */}
          <p className="text-xs text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
            {ad.description}
          </p>

          {/* Seller */}
          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border/50">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                {ad.sellerAvatar}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-foreground truncate">
                  {ad.sellerName}
                </span>
                <VerificationBadge
                  level={ad.sellerVerification}
                  size="sm"
                  showLabel={false}
                />
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <StarRating rating={ad.sellerRating} size={10} />
                <span className="text-xs text-muted-foreground">
                  {ad.sellerRating}
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-lg font-display font-bold text-foreground">
                ${ad.price.toLocaleString()}
              </span>
              <span className="text-xs text-muted-foreground ml-1">
                {ad.currency}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Eye size={11} />
                {ad.views}
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle size={11} />
                {Math.floor(ad.views * 0.05)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
