import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";
import { VerificationLevel } from "../backend.d";
import { AdCard } from "../components/AdCard";
import { COUNTRIES, MOCK_ADS, VISA_TYPES } from "../lib/mockData";

const PAGE_SIZE = 6;

export function BrowseAds() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sortBy, setSortBy] = useState("relevant");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredAds = useMemo(() => {
    let ads = [...MOCK_ADS];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      ads = ads.filter(
        (ad) =>
          ad.title.toLowerCase().includes(q) ||
          ad.category.toLowerCase().includes(q) ||
          ad.destinationCountry.toLowerCase().includes(q) ||
          ad.description.toLowerCase().includes(q),
      );
    }

    if (selectedCountry) {
      ads = ads.filter((ad) =>
        ad.destinationCountry
          .toLowerCase()
          .includes(selectedCountry.toLowerCase()),
      );
    }

    if (selectedType) {
      ads = ads.filter((ad) =>
        ad.category.toLowerCase().includes(selectedType.toLowerCase()),
      );
    }

    if (minPrice) {
      ads = ads.filter((ad) => ad.price >= Number(minPrice));
    }

    if (maxPrice) {
      ads = ads.filter((ad) => ad.price <= Number(maxPrice));
    }

    if (verifiedOnly) {
      ads = ads.filter(
        (ad) =>
          ad.sellerVerification === VerificationLevel.fullyVerified ||
          ad.sellerVerification === VerificationLevel.documentVerified,
      );
    }

    switch (sortBy) {
      case "newest":
        ads.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        break;
      case "price-asc":
        ads.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        ads.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        ads.sort((a, b) => b.sellerRating - a.sellerRating);
        break;
      default:
        ads.sort((a, b) => b.views - a.views);
    }

    return ads;
  }, [
    searchQuery,
    selectedCountry,
    selectedType,
    minPrice,
    maxPrice,
    verifiedOnly,
    sortBy,
  ]);

  const totalPages = Math.ceil(filteredAds.length / PAGE_SIZE);
  const paginatedAds = filteredAds.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCountry("");
    setSelectedType("");
    setMinPrice("");
    setMaxPrice("");
    setVerifiedOnly(false);
    setSortBy("relevant");
    setCurrentPage(1);
  };

  const hasFilters =
    searchQuery ||
    selectedCountry ||
    selectedType ||
    minPrice ||
    maxPrice ||
    verifiedOnly;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">
          Browse Visa Services
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {filteredAds.length} services available from verified providers
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Filters Sidebar */}
        <aside className="w-full lg:w-64 shrink-0">
          <div className="bg-card border border-border/60 rounded-xl p-5 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-medium text-sm">
                <SlidersHorizontal size={15} />
                Filters
              </div>
              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  <X size={12} />
                  Clear all
                </button>
              )}
            </div>

            {/* Search */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Search
              </Label>
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  placeholder="Keywords..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-8 h-9 text-sm"
                  data-ocid="ads.search_input"
                />
              </div>
            </div>

            {/* Destination Country */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Destination Country
              </Label>
              <Select
                value={selectedCountry}
                onValueChange={(v) => {
                  setSelectedCountry(v === "all" ? "" : v);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger
                  className="h-9 text-sm"
                  data-ocid="ads.filter.select"
                >
                  <SelectValue placeholder="All countries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All countries</SelectItem>
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Visa Type */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Visa Type
              </Label>
              <Select
                value={selectedType}
                onValueChange={(v) => {
                  setSelectedType(v === "all" ? "" : v);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {VISA_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Price Range */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Price Range (USD)
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Min"
                  type="number"
                  value={minPrice}
                  onChange={(e) => {
                    setMinPrice(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-9 text-sm"
                />
                <Input
                  placeholder="Max"
                  type="number"
                  value={maxPrice}
                  onChange={(e) => {
                    setMaxPrice(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-9 text-sm"
                />
              </div>
            </div>

            {/* Verified Only */}
            <div className="flex items-center gap-3">
              <Switch
                id="verified-only"
                checked={verifiedOnly}
                onCheckedChange={(v) => {
                  setVerifiedOnly(v);
                  setCurrentPage(1);
                }}
              />
              <Label htmlFor="verified-only" className="text-sm cursor-pointer">
                Verified sellers only
              </Label>
            </div>
          </div>
        </aside>

        {/* Results */}
        <div className="flex-1">
          {/* Sort bar */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-muted-foreground">
              {filteredAds.length} result{filteredAds.length !== 1 ? "s" : ""}
            </span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger
                className="w-44 h-9 text-sm"
                data-ocid="ads.sort.select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevant">Most Relevant</SelectItem>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="price-asc">Price: Low to High</SelectItem>
                <SelectItem value="price-desc">Price: High to Low</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Ad grid */}
          {paginatedAds.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {paginatedAds.map((ad, i) => (
                <AdCard key={ad.id} ad={ad} index={i + 1} />
              ))}
            </div>
          ) : (
            <div
              data-ocid="ads.empty_state"
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Search size={24} className="text-muted-foreground" />
              </div>
              <h3 className="font-display font-semibold text-lg text-foreground mb-1">
                No results found
              </h3>
              <p className="text-muted-foreground text-sm max-w-sm">
                Try adjusting your filters or search terms to find more
                listings.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="mt-4"
              >
                Clear filters
              </Button>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      data-ocid="ads.pagination_prev"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className={
                        currentPage === 1
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }).map((_, i) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: pagination pages are positional
                    <PaginationItem key={i}>
                      <PaginationLink
                        isActive={currentPage === i + 1}
                        onClick={() => setCurrentPage(i + 1)}
                        className="cursor-pointer"
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      data-ocid="ads.pagination_next"
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      className={
                        currentPage === totalPages
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
