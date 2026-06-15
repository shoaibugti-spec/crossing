import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, useLocation } from "@tanstack/react-router";
import {
  Bell,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  Plus,
  Shield,
  User,
  X,
} from "lucide-react";
import { useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { MOCK_NOTIFICATIONS } from "../lib/mockData";

const unreadCount = MOCK_NOTIFICATIONS.filter((n) => !n.read).length;

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { identity, clear, login, isLoggingIn, isInitializing } =
    useInternetIdentity();
  const isAuthenticated = !!identity;
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border/60 shadow-xs">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link
            to="/"
            data-ocid="nav.home_link"
            className="flex items-center gap-2.5 shrink-0"
          >
            <img
              src="/assets/generated/crossing-logo-transparent.dim_200x200.png"
              alt="Crossing"
              className="h-8 w-8 object-contain"
            />
            <span className="font-display font-bold text-lg text-foreground tracking-tight">
              Crossing
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              to="/ads"
              search={{ q: "", country: "", type: "" }}
              data-ocid="nav.browse_link"
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                isActive("/ads")
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              Browse Ads
            </Link>
            {isAuthenticated && (
              <>
                <Link
                  to="/messages"
                  data-ocid="nav.messages_link"
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive("/messages")
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  Messages
                </Link>
                <Link
                  to="/post-ad"
                  data-ocid="nav.post_ad_link"
                  className="ml-2"
                >
                  <Button
                    size="sm"
                    className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Plus size={14} />
                    Post Ad
                  </Button>
                </Link>
              </>
            )}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                {/* Notifications */}
                <Link to="/notifications" data-ocid="nav.notifications_link">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-9 w-9"
                  >
                    <Bell size={18} />
                    {unreadCount > 0 && (
                      <Badge className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 text-xs bg-gold text-foreground border-0 flex items-center justify-center">
                        {unreadCount}
                      </Badge>
                    )}
                  </Button>
                </Link>

                {/* Profile dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="gap-2 h-9 px-2"
                      data-ocid="nav.profile_link"
                    >
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                          {identity
                            .getPrincipal()
                            .toString()
                            .slice(0, 2)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <ChevronDown
                        size={14}
                        className="text-muted-foreground hidden sm:block"
                      />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link
                        to="/profile/$id"
                        params={{ id: "me" }}
                        className="flex items-center gap-2"
                      >
                        <User size={14} />
                        My Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/my-ads" className="flex items-center gap-2">
                        <LayoutDashboard size={14} />
                        My Ads
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/kyc" className="flex items-center gap-2">
                        <Shield size={14} />
                        KYC Verification
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link
                        to="/admin"
                        data-ocid="nav.admin_link"
                        className="flex items-center gap-2"
                      >
                        <LayoutDashboard size={14} />
                        Admin
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={clear}
                      className="text-destructive flex items-center gap-2"
                    >
                      <LogOut size={14} />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link to="/login" className="hidden sm:block">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Button
                  size="sm"
                  onClick={login}
                  disabled={isLoggingIn || isInitializing}
                  data-ocid="auth.login_button"
                  className="bg-primary text-primary-foreground"
                >
                  {isLoggingIn ? "Connecting..." : "Connect Wallet"}
                </Button>
              </>
            )}

            {/* Mobile menu toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-9 w-9"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border/60 bg-card py-3 px-4 space-y-1">
            <Link
              to="/ads"
              search={{ q: "", country: "", type: "" }}
              className="block px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50"
              onClick={() => setMobileMenuOpen(false)}
            >
              Browse Ads
            </Link>
            {isAuthenticated && (
              <>
                <Link
                  to="/messages"
                  className="block px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Messages
                </Link>
                <Link
                  to="/post-ad"
                  className="block px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Post Ad
                </Link>
                <Link
                  to="/notifications"
                  className="block px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Notifications {unreadCount > 0 && `(${unreadCount})`}
                </Link>
              </>
            )}
          </div>
        )}
      </header>

      {/* Main */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-card py-8 mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img
                src="/assets/generated/crossing-logo-transparent.dim_200x200.png"
                alt="Crossing"
                className="h-6 w-6 object-contain opacity-70"
              />
              <span className="font-display font-semibold text-sm text-muted-foreground">
                Crossing
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <Link
                to="/help"
                className="hover:text-foreground transition-colors"
              >
                Help & Safety
              </Link>
              <Link
                to="/settings"
                className="hover:text-foreground transition-colors"
              >
                Settings
              </Link>
            </div>
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()}.{" "}
              <a
                href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                Built with ♥ using caffeine.ai
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
