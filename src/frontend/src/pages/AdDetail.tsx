import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  Eye,
  Heart,
  MapPin,
  MessageCircle,
  Share2,
  Unlock,
} from "lucide-react";
import { toast } from "sonner";
import { StarRating } from "../components/StarRating";
import { VerificationBadge } from "../components/VerificationBadge";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { MOCK_ADS, MOCK_REVIEWS } from "../lib/mockData";

export function AdDetail() {
  const { id } = useParams({ from: "/ads/$id" });
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;

  const ad = MOCK_ADS.find((a) => a.id === id) ?? MOCK_ADS[0];
  const reviews = MOCK_REVIEWS.filter((r) => r.adId === ad.id);
  const relatedAds = MOCK_ADS.filter(
    (a) => a.id !== ad.id && a.category === ad.category,
  ).slice(0, 3);

  const handleMessage = () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to message sellers");
      void navigate({ to: "/login" });
      return;
    }
    void navigate({ to: "/messages/$id", params: { id: "conv-1" } });
  };

  const handleUnlock = () => {
    if (!isAuthenticated) {
      toast.error("Please sign in first");
      void navigate({ to: "/login" });
      return;
    }
    toast.info("Complete KYC verification to unlock contact details");
    void navigate({ to: "/kyc" });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Back */}
      <Link
        to="/ads"
        search={{ q: "", country: "", type: "" }}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft size={14} />
        Back to listings
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header card */}
          <Card className="border-border/60 shadow-card overflow-hidden">
            <CardContent className="p-6">
              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="outline" className="badge-navy text-xs">
                  {ad.category}
                </Badge>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 rounded-full px-2.5 py-1">
                  <MapPin size={11} />
                  {ad.destinationCountry}
                </span>
                {ad.originCountry && (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 rounded-full px-2.5 py-1">
                    From {ad.originCountry}
                  </span>
                )}
              </div>

              <h1 className="font-display text-2xl font-bold text-foreground mb-3 leading-tight">
                {ad.title}
              </h1>

              <p className="text-muted-foreground leading-relaxed mb-4">
                {ad.description}
              </p>

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Clock size={14} className="text-primary" />
                  Processing: {ad.processingTime}
                </span>
                <span className="flex items-center gap-1.5">
                  <Eye size={14} />
                  {ad.views} views
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} />
                  Posted {ad.createdAt}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Requirements */}
          <Card className="border-border/60 shadow-card">
            <CardContent className="p-6">
              <h2 className="font-display font-bold text-lg text-foreground mb-4">
                Requirements Checklist
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                You will need to provide the following documents:
              </p>
              <ul className="space-y-2.5">
                {ad.requirements.map((req, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: requirements are positional
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <CheckCircle
                      size={15}
                      className="text-green-600 shrink-0 mt-0.5"
                    />
                    <span className="text-foreground">{req}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Reviews */}
          <Card className="border-border/60 shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-bold text-lg text-foreground">
                  Reviews
                </h2>
                <div className="flex items-center gap-2">
                  <StarRating rating={ad.sellerRating} size={14} />
                  <span className="text-sm font-semibold">
                    {ad.sellerRating}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    ({reviews.length + 12} reviews)
                  </span>
                </div>
              </div>

              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div
                      key={review.id}
                      className="border-b border-border/50 pb-4 last:border-0 last:pb-0"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                            {review.reviewerAvatar}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {review.reviewerName}
                            </span>
                            <StarRating rating={review.rating} size={11} />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {review.createdAt}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed pl-11">
                        {review.comment}
                      </p>
                    </div>
                  ))}

                  {/* Show more reviews placeholder */}
                  <div className="text-center pt-2">
                    <button
                      type="button"
                      className="text-sm text-primary hover:underline"
                    >
                      Show all 15 reviews
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No reviews yet for this specific listing.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Price & Actions */}
          <Card className="border-border/60 shadow-card sticky top-20">
            <CardContent className="p-6">
              <div className="mb-5">
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="font-display text-3xl font-bold text-foreground">
                    ${ad.price.toLocaleString()}
                  </span>
                  <span className="text-muted-foreground">{ad.currency}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Inclusive of service fee. Escrow-protected payment available.
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleMessage}
                  className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                  size="lg"
                  data-ocid="ad_detail.message_button"
                >
                  <MessageCircle size={16} />
                  Message Seller
                </Button>
                <Button
                  onClick={handleUnlock}
                  variant="outline"
                  className="w-full gap-2"
                  size="lg"
                  data-ocid="ad_detail.unlock_button"
                >
                  <Unlock size={16} />
                  Unlock Contact Details
                </Button>
              </div>

              <div className="flex gap-2 mt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 gap-1.5 text-xs"
                >
                  <Heart size={13} />
                  Save
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 gap-1.5 text-xs"
                >
                  <Share2 size={13} />
                  Share
                </Button>
              </div>

              <Separator className="my-4" />

              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle size={13} className="text-green-600" />
                  Escrow-protected payments
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={13} className="text-green-600" />
                  Dispute resolution available
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={13} className="text-green-600" />
                  Secure document exchange
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seller Card */}
          <Card className="border-border/60 shadow-card">
            <CardContent className="p-5">
              <h3 className="font-display font-semibold text-sm text-foreground mb-4">
                About the Seller
              </h3>
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="text-sm font-bold bg-primary/10 text-primary">
                    {ad.sellerAvatar}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-sm text-foreground">
                    {ad.sellerName}
                  </p>
                  <VerificationBadge level={ad.sellerVerification} size="sm" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-muted/50 rounded-lg p-2.5 text-center">
                  <div className="font-display font-bold text-foreground">
                    {ad.sellerTrustScore}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Trust Score
                  </div>
                </div>
                <div className="bg-muted/50 rounded-lg p-2.5 text-center">
                  <div className="font-display font-bold text-foreground">
                    {ad.sellerResponseRate}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Response Rate
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Rating</span>
                  <div className="flex items-center gap-1">
                    <StarRating rating={ad.sellerRating} size={11} />
                    <span className="font-medium text-foreground">
                      {ad.sellerRating}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span>Member since</span>
                  <span className="font-medium text-foreground">
                    {ad.sellerMemberSince}
                  </span>
                </div>
              </div>

              <Link to="/profile/$id" params={{ id: ad.sellerId }}>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-4 text-xs"
                >
                  View Full Profile
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Related ads */}
          {relatedAds.length > 0 && (
            <Card className="border-border/60 shadow-card">
              <CardContent className="p-5">
                <h3 className="font-display font-semibold text-sm text-foreground mb-3">
                  Similar Services
                </h3>
                <div className="space-y-3">
                  {relatedAds.map((related) => (
                    <Link
                      key={related.id}
                      to="/ads/$id"
                      params={{ id: related.id }}
                      className="flex items-start gap-2.5 group"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/40 mt-2 shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">
                          {related.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ${related.price} · {related.destinationCountry}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
