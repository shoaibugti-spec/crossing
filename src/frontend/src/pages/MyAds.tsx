import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Ban,
  ChevronDown,
  Edit,
  Eye,
  MessageCircle,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AdStatus } from "../backend.d";
import { MOCK_ADS } from "../lib/mockData";

const statusColors: Record<AdStatus, string> = {
  [AdStatus.active]: "bg-green-50 text-green-700 border-green-200",
  [AdStatus.draft]: "bg-gray-100 text-gray-600 border-gray-200",
  [AdStatus.expired]: "bg-orange-50 text-orange-700 border-orange-200",
  [AdStatus.suspended]: "bg-red-50 text-red-700 border-red-200",
};

export function MyAds() {
  const navigate = useNavigate();
  const [ads, setAds] = useState(
    MOCK_ADS.map((ad, i) => ({
      ...ad,
      status:
        i === 0
          ? AdStatus.active
          : i === 1
            ? AdStatus.active
            : i === 2
              ? AdStatus.draft
              : AdStatus.active,
    })),
  );

  const activeAds = ads.filter((a) => a.status === AdStatus.active);
  const draftAds = ads.filter((a) => a.status === AdStatus.draft);
  const expiredAds = ads.filter((a) => a.status === AdStatus.expired);
  const suspendedAds = ads.filter((a) => a.status === AdStatus.suspended);

  const handleSuspend = (id: string) => {
    setAds((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: AdStatus.suspended } : a)),
    );
    toast.success("Ad suspended successfully");
  };

  const handleDelete = (id: string) => {
    setAds((prev) => prev.filter((a) => a.id !== id));
    toast.success("Ad deleted");
  };

  const AdRow = ({ ad }: { ad: (typeof ads)[0] }) => (
    <div className="flex items-center justify-between p-4 bg-card rounded-xl border border-border/60 hover:border-primary/30 hover:shadow-card transition-all">
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 mb-1.5">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusColors[ad.status]}`}
          >
            {ad.status}
          </span>
          <span className="text-xs text-muted-foreground bg-muted/50 rounded-full px-2 py-0.5">
            {ad.category}
          </span>
        </div>
        <Link
          to="/ads/$id"
          params={{ id: ad.id }}
          className="text-sm font-semibold text-foreground hover:text-primary transition-colors line-clamp-1"
        >
          {ad.title}
        </Link>
        <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Eye size={11} />
            {ad.views} views
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle size={11} />
            {Math.floor(ad.views * 0.05)} messages
          </span>
          <span>
            ${ad.price.toLocaleString()} {ad.currency}
          </span>
          <span className="hidden sm:block">{ad.destinationCountry}</span>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-1 shrink-0 ml-2">
            Actions
            <ChevronDown size={12} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link
              to="/ads/$id"
              params={{ id: ad.id }}
              className="flex items-center gap-2"
            >
              <Eye size={13} />
              View
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => void navigate({ to: "/post-ad" })}
            className="flex items-center gap-2"
          >
            <Edit size={13} />
            Edit
          </DropdownMenuItem>
          {ad.status === AdStatus.active && (
            <DropdownMenuItem
              onClick={() => handleSuspend(ad.id)}
              className="flex items-center gap-2 text-orange-600"
            >
              <Ban size={13} />
              Suspend
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={() => handleDelete(ad.id)}
            className="flex items-center gap-2 text-destructive"
          >
            <Trash2 size={13} />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  const EmptyState = ({ message }: { message: string }) => (
    <div
      className="flex flex-col items-center justify-center py-16 text-center"
      data-ocid="my_ads.empty_state"
    >
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
        <Eye size={20} className="text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
      <Link to="/post-ad">
        <Button size="sm" variant="outline" className="mt-3 gap-1.5">
          <Plus size={13} />
          Post New Ad
        </Button>
      </Link>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            My Ads
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your visa service listings
          </p>
        </div>
        <Link to="/post-ad" data-ocid="nav.post_ad_link">
          <Button
            className="gap-2 bg-primary text-primary-foreground"
            size="sm"
          >
            <Plus size={14} />
            New Ad
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="active">
        <TabsList className="mb-6">
          <TabsTrigger value="active" className="gap-1.5">
            Active
            {activeAds.length > 0 && (
              <span className="ml-1 bg-primary/10 text-primary rounded-full px-1.5 py-0.5 text-xs font-semibold">
                {activeAds.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="drafts">
            Drafts
            {draftAds.length > 0 && (
              <span className="ml-1 bg-muted text-muted-foreground rounded-full px-1.5 py-0.5 text-xs font-semibold">
                {draftAds.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="expired">Expired</TabsTrigger>
          <TabsTrigger value="suspended">Suspended</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <div className="space-y-3">
            {activeAds.length > 0 ? (
              activeAds.map((ad) => <AdRow key={ad.id} ad={ad} />)
            ) : (
              <EmptyState message="No active ads. Post your first visa service!" />
            )}
          </div>
        </TabsContent>

        <TabsContent value="drafts">
          <div className="space-y-3">
            {draftAds.length > 0 ? (
              draftAds.map((ad) => <AdRow key={ad.id} ad={ad} />)
            ) : (
              <EmptyState message="No draft ads saved." />
            )}
          </div>
        </TabsContent>

        <TabsContent value="expired">
          <div className="space-y-3">
            {expiredAds.length > 0 ? (
              expiredAds.map((ad) => <AdRow key={ad.id} ad={ad} />)
            ) : (
              <EmptyState message="No expired ads." />
            )}
          </div>
        </TabsContent>

        <TabsContent value="suspended">
          <div className="space-y-3">
            {suspendedAds.length > 0 ? (
              suspendedAds.map((ad) => <AdRow key={ad.id} ad={ad} />)
            ) : (
              <EmptyState message="No suspended ads." />
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
