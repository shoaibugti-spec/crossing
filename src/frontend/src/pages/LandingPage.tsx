import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle,
  Lock,
  MessageCircle,
  Search,
  Shield,
  Star,
  Users,
} from "lucide-react";
import { useState } from "react";
import { AdCard } from "../components/AdCard";
import { COUNTRIES, MOCK_ADS } from "../lib/mockData";

export function LandingPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("");
  const featuredAds = MOCK_ADS.slice(0, 4);

  const handleSearch = () => {
    void navigate({
      to: "/ads",
      search: { q: search, country, type: "" },
    });
  };

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="gradient-hero text-white relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/[0.03] blur-3xl" />
          <div className="absolute bottom-0 -left-24 w-80 h-80 rounded-full bg-white/[0.04] blur-3xl" />
        </div>

        <div className="container mx-auto px-4 py-20 lg:py-28 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            {/* Trust pill */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-sm mb-6">
              <Shield size={14} className="text-amber-400" />
              <span className="text-white/90">KYC-Verified Platform</span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight mb-5">
              Your Trusted Gateway for{" "}
              <span className="text-amber-400">Cross-Border</span> Visa Services
            </h1>

            <p className="text-lg text-white/75 mb-10 max-w-xl mx-auto leading-relaxed">
              Connect with verified visa agents and sponsorship providers
              worldwide. Secure, transparent, and backed by AI fraud detection.
            </p>

            {/* Search Box */}
            <div className="bg-white rounded-xl shadow-gold p-2 flex flex-col sm:flex-row gap-2 max-w-2xl mx-auto">
              <Input
                placeholder="Search visa services..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1 border-0 focus-visible:ring-0 text-foreground bg-transparent h-11"
                data-ocid="ads.search_input"
              />
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger
                  className="w-full sm:w-44 border-0 focus:ring-0 h-11 text-foreground"
                  data-ocid="ads.filter.select"
                >
                  <SelectValue placeholder="Destination" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.slice(0, 10).map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleSearch}
                className="h-11 px-6 bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
              >
                <Search size={16} className="mr-2" />
                Search
              </Button>
            </div>

            {/* Quick filters */}
            <div className="flex flex-wrap gap-2 justify-center mt-4">
              {[
                "Saudi Work Visa",
                "UAE Tourist",
                "UK Skilled Worker",
                "Canada PR",
                "Schengen Student",
              ].map((tag) => (
                <button
                  type="button"
                  key={tag}
                  onClick={() => {
                    setSearch(tag);
                    void navigate({
                      to: "/ads",
                      search: { q: tag, country: "", type: "" },
                    });
                  }}
                  className="text-xs bg-white/10 hover:bg-white/20 border border-white/20 rounded-full px-3 py-1 text-white/80 transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="bg-white border-b border-border/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border/50">
            {[
              { icon: Users, value: "10,000+", label: "Verified Users" },
              { icon: Shield, value: "KYC-Backed", label: "Identity Verified" },
              { icon: Lock, value: "Escrow", label: "Protected Payments" },
              { icon: Star, value: "4.8/5", label: "Average Rating" },
            ].map(({ icon: Icon, value, label }) => (
              <div
                key={label}
                className="flex flex-col items-center py-6 gap-1"
              >
                <Icon size={20} className="text-primary mb-1" />
                <span className="font-display font-bold text-lg text-foreground">
                  {value}
                </span>
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Ads */}
      <section className="py-16 container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground">
              Featured Services
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              Top-rated visa services from verified providers
            </p>
          </div>
          <Link to="/ads" search={{ q: "", country: "", type: "" }}>
            <Button variant="outline" size="sm" className="gap-1.5">
              View All <ArrowRight size={14} />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {featuredAds.map((ad, i) => (
            <AdCard key={ad.id} ad={ad} index={i + 1} />
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-secondary/30 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="outline" className="badge-gold mb-3">
              How It Works
            </Badge>
            <h2 className="font-display text-3xl font-bold text-foreground">
              Three steps to your visa
            </h2>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">
              Find, connect, and complete your visa application with confidence
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                step: "01",
                icon: Search,
                title: "Search & Discover",
                description:
                  "Browse hundreds of verified visa service listings. Filter by destination, visa type, price, and seller verification level.",
              },
              {
                step: "02",
                icon: MessageCircle,
                title: "Connect & Communicate",
                description:
                  "Message verified providers directly through our secure in-app chat. Review seller profiles, ratings, and response times.",
              },
              {
                step: "03",
                icon: Lock,
                title: "Transact Securely",
                description:
                  "Use our escrow-protected payment system. Funds are only released when your service is delivered — or get a full refund.",
              },
            ].map(({ step, icon: Icon, title, description }) => (
              <div key={step} className="relative">
                <div className="flex flex-col items-center text-center p-6 bg-card rounded-xl border border-border/60 shadow-card h-full">
                  <div className="font-display text-5xl font-bold text-primary/10 mb-4 leading-none">
                    {step}
                  </div>
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Icon size={22} className="text-primary" />
                  </div>
                  <h3 className="font-display font-bold text-lg text-foreground mb-2">
                    {title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Destinations */}
      <section className="py-16 container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="font-display text-2xl font-bold text-foreground">
            Popular Destinations
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Services available for top immigration destinations
          </p>
        </div>

        <div className="flex flex-wrap gap-3 justify-center">
          {[
            { country: "🇸🇦 Saudi Arabia", count: 124 },
            { country: "🇦🇪 UAE", count: 98 },
            { country: "🇬🇧 United Kingdom", count: 87 },
            { country: "🇩🇪 Germany", count: 76 },
            { country: "🇨🇦 Canada", count: 65 },
            { country: "🇦🇺 Australia", count: 54 },
            { country: "🇳🇿 New Zealand", count: 43 },
            { country: "🇺🇸 United States", count: 38 },
          ].map(({ country: c, count }) => (
            <Link
              key={c}
              to="/ads"
              search={{
                q: "",
                country: c.split(" ").slice(1).join(" "),
                type: "",
              }}
            >
              <button
                type="button"
                className="flex items-center gap-2 px-4 py-2 bg-card border border-border/60 rounded-full hover:border-primary/50 hover:bg-primary/5 transition-all text-sm font-medium group"
              >
                <span>{c}</span>
                <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors">
                  {count} listings
                </span>
              </button>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="gradient-hero py-16 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/[0.03] blur-3xl" />
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="font-display text-3xl font-bold text-white mb-4">
            Ready to start your journey?
          </h2>
          <p className="text-white/75 mb-8 max-w-md mx-auto">
            Join thousands of users who found trusted visa services through
            Crossing
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/ads" search={{ q: "", country: "", type: "" }}>
              <Button
                size="lg"
                className="bg-white text-navy hover:bg-white/90 gap-2 font-semibold"
              >
                <Search size={16} />
                Browse Ads
              </Button>
            </Link>
            <Link to="/post-ad">
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 gap-2"
              >
                Become a Seller
                <ArrowRight size={16} />
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap gap-6 justify-center mt-8">
            {[
              "Free to browse",
              "KYC-verified sellers",
              "Escrow protection",
              "24/7 support",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-2 text-sm text-white/80"
              >
                <CheckCircle size={14} className="text-amber-400" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
