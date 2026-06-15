import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useParams } from "@tanstack/react-router";
import {
  Calendar,
  Camera,
  Edit,
  Globe,
  MessageCircle,
  Star,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { VerificationLevel } from "../backend.d";
import { StarRating } from "../components/StarRating";
import { VerificationBadge } from "../components/VerificationBadge";
import { MOCK_ADS, MOCK_REVIEWS } from "../lib/mockData";

const MOCK_PROFILE = {
  id: "me",
  name: "Mohammed Al-Hassan",
  avatar: "MA",
  country: "Pakistan",
  memberSince: "January 2024",
  verification: VerificationLevel.documentVerified,
  trustScore: 82,
  rating: 4.6,
  bio: "Experienced visa consultant specializing in Gulf countries. 5+ years helping families and professionals navigate the immigration process safely and efficiently.",
  languages: ["English", "Urdu", "Arabic"],
  adsPosted: 12,
  transactionsCompleted: 38,
};

export function ProfilePage() {
  const { id } = useParams({ from: "/profile/$id" });
  const isOwnProfile = id === "me" || !id;

  const [editOpen, setEditOpen] = useState(false);
  const [profile, setProfile] = useState(MOCK_PROFILE);
  const [editForm, setEditForm] = useState({
    name: profile.name,
    bio: profile.bio,
    country: profile.country,
    languages: profile.languages.join(", "),
  });

  const sellerAds = MOCK_ADS.slice(0, 3);
  const reviews = MOCK_REVIEWS;

  const handleSave = () => {
    setProfile((prev) => ({
      ...prev,
      name: editForm.name,
      bio: editForm.bio,
      country: editForm.country,
      languages: editForm.languages.split(",").map((l) => l.trim()),
    }));
    setEditOpen(false);
    toast.success("Profile updated successfully");
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="border-border/60 shadow-card">
            <CardContent className="p-6 text-center">
              {/* Avatar */}
              <div className="relative inline-block mb-4">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                    {profile.avatar}
                  </AvatarFallback>
                </Avatar>
                {isOwnProfile && (
                  <button
                    type="button"
                    className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center"
                  >
                    <Camera size={12} />
                  </button>
                )}
              </div>

              <h1 className="font-display font-bold text-xl text-foreground mb-1">
                {profile.name}
              </h1>

              <div className="flex items-center justify-center gap-1.5 mb-3">
                <Globe size={13} className="text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {profile.country}
                </span>
              </div>

              <VerificationBadge
                level={profile.verification}
                className="mx-auto mb-3"
              />

              {isOwnProfile && (
                <Dialog open={editOpen} onOpenChange={setEditOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 w-full"
                      data-ocid="profile.edit_button"
                    >
                      <Edit size={13} />
                      Edit Profile
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Profile</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="prof-name">Full Name</Label>
                        <Input
                          id="prof-name"
                          value={editForm.name}
                          onChange={(e) =>
                            setEditForm((f) => ({ ...f, name: e.target.value }))
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="prof-country">Country</Label>
                        <Input
                          id="prof-country"
                          value={editForm.country}
                          onChange={(e) =>
                            setEditForm((f) => ({
                              ...f,
                              country: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="prof-bio">Bio</Label>
                        <Textarea
                          id="prof-bio"
                          rows={4}
                          value={editForm.bio}
                          onChange={(e) =>
                            setEditForm((f) => ({ ...f, bio: e.target.value }))
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="prof-languages">
                          Languages (comma-separated)
                        </Label>
                        <Input
                          id="prof-languages"
                          value={editForm.languages}
                          onChange={(e) =>
                            setEditForm((f) => ({
                              ...f,
                              languages: e.target.value,
                            }))
                          }
                          placeholder="English, Urdu, Arabic"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setEditOpen(false)}
                        data-ocid="profile.cancel_button"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSave}
                        data-ocid="profile.save_button"
                      >
                        Save Changes
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </CardContent>
          </Card>

          {/* Stats */}
          <Card className="border-border/60 shadow-card">
            <CardContent className="p-5 space-y-3">
              <h3 className="font-display font-semibold text-sm text-foreground">
                Stats
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="font-display font-bold text-xl text-foreground">
                    {profile.trustScore}
                  </p>
                  <p className="text-xs text-muted-foreground">Trust Score</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Star size={14} className="fill-amber-400 text-amber-400" />
                    <span className="font-display font-bold text-xl text-foreground">
                      {profile.rating}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Rating</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="font-display font-bold text-xl text-foreground">
                    {profile.adsPosted}
                  </p>
                  <p className="text-xs text-muted-foreground">Ads Posted</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="font-display font-bold text-xl text-foreground">
                    {profile.transactionsCompleted}
                  </p>
                  <p className="text-xs text-muted-foreground">Transactions</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
                <Calendar size={12} />
                Member since {profile.memberSince}
              </div>
            </CardContent>
          </Card>

          {/* Languages */}
          <Card className="border-border/60 shadow-card">
            <CardContent className="p-5">
              <h3 className="font-display font-semibold text-sm text-foreground mb-3">
                Languages
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {profile.languages.map((lang) => (
                  <Badge key={lang} variant="outline" className="text-xs">
                    {lang}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-5">
          {/* Bio */}
          <Card className="border-border/60 shadow-card">
            <CardContent className="p-6">
              <h2 className="font-display font-semibold text-foreground mb-3">
                About
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {profile.bio}
              </p>
            </CardContent>
          </Card>

          {/* Active Listings */}
          <Card className="border-border/60 shadow-card">
            <CardContent className="p-6">
              <h2 className="font-display font-semibold text-foreground mb-4">
                Active Services
              </h2>
              <div className="space-y-3">
                {sellerAds.map((ad) => (
                  <div
                    key={ad.id}
                    className="flex items-start justify-between gap-3 py-2 border-b border-border/40 last:border-0"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground line-clamp-1 hover:text-primary">
                        {ad.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {ad.destinationCountry} · {ad.category}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-foreground shrink-0">
                      ${ad.price.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Reviews */}
          <Card className="border-border/60 shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-semibold text-foreground">
                  Reviews
                </h2>
                <div className="flex items-center gap-2">
                  <StarRating rating={profile.rating} size={14} />
                  <span className="text-sm font-semibold">
                    {profile.rating}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({reviews.length} reviews)
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="border-b border-border/40 pb-4 last:border-0 last:pb-0"
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
                    <p className="text-sm text-muted-foreground pl-11 leading-relaxed">
                      {review.comment}
                    </p>
                  </div>
                ))}
              </div>

              {!isOwnProfile && (
                <>
                  <Separator className="my-4" />
                  <Button className="w-full gap-2" variant="outline">
                    <MessageCircle size={14} />
                    Message {profile.name.split(" ")[0]}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
