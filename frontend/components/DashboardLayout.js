import Link from "next/link";
import { useState } from "react";
import {
  LayoutDashboard,
  TrendingUp,
  Newspaper,
  BarChart3,
  Activity,
  User,
  LogOut,
  ChevronDown
} from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";
import { useAuth } from "./AuthProvider";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/price-forecast", label: "Price Forecast", icon: TrendingUp },
  { href: "/market-insights", label: "Market Insights", icon: BarChart3 },
  { href: "/news-watch", label: "News Watch", icon: Newspaper },
  { href: "/lstm-demo", label: "LSTM Demo", icon: Activity },
];

export default function DashboardLayout({ children, title = "Dashboard", currentPath = "" }) {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Check if current route matches nav item
  const isActive = (href) => {
    // Simple check based on title for now
    if (title.toLowerCase().includes("dashboard") && href === "/dashboard") return true;
    if (title.toLowerCase().includes("price") && href === "/price-forecast") return true;
    if (title.toLowerCase().includes("market") && href === "/market-insights") return true;
    if (title.toLowerCase().includes("news") && href === "/news-watch") return true;
    if (title.toLowerCase().includes("lstm") && href === "/lstm-demo") return true;
    return false;
  };

  const handleLogout = async () => {
    await logout();
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.name) return "U";
    return user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo & Brand */}
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <LayoutDashboard className="h-6 w-6 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-primary leading-none">Cashew Forecast</span>
                <span className="text-xs text-muted-foreground">Price Analysis System</span>
              </div>
            </Link>

            {/* Navigation Links - Desktop */}
            <nav className="hidden md:flex items-center gap-1 ml-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "transition-all relative h-16 rounded-none",
                        isActive(item.href)
                          ? "bg-accent/10 text-accent font-medium after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-accent"
                          : "text-foreground/70 hover:text-accent hover:bg-accent/5"
                      )}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Side - Status & User */}
          <div className="flex items-center gap-4">
            {/* System Status Indicator */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/20">
              <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
              <span className="text-xs font-medium text-success">System Online</span>
            </div>

            {/* Version Badge */}
            <Badge variant="outline" className="hidden sm:inline-flex">
              v0.2.0
            </Badge>

            {/* User Avatar/Menu */}
            <div className="relative">
              <Button
                variant="ghost"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 h-9 px-2"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                  {getUserInitials()}
                </div>
                <div className="hidden sm:flex flex-col items-start">
                  <span className="text-xs font-medium text-foreground">{user?.name || "User"}</span>
                  <span className="text-[10px] text-muted-foreground">{user?.role || "user"}</span>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-background border border-border">
                  <div className="py-1">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-border">
                      <p className="text-sm font-medium text-foreground">{user?.name || "User"}</p>
                      <p className="text-xs text-muted-foreground">{user?.email || "No email"}</p>
                      <div className="mt-1">
                        <Badge variant={user?.role === 'admin' ? 'default' : 'outline'} className="text-[10px]">
                          {user?.role || "user"}
                        </Badge>
                        {user?.department && (
                          <Badge variant="outline" className="text-[10px] ml-1">
                            {user.department}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Logout Button */}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-accent hover:bg-accent/10 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation - Dropdown */}
        <div className="md:hidden border-t">
          <nav className="container mx-auto flex overflow-x-auto px-4 py-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "whitespace-nowrap transition-all",
                      isActive(item.href)
                        ? "bg-accent/10 text-accent font-medium border-b-2 border-accent rounded-b-none"
                        : "text-foreground/70 hover:text-accent"
                    )}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Page Title Bar */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-primary">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time cashew price forecasting and market analysis
          </p>
        </div>

        {/* Page Content */}
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t mt-auto">
        <div className="container mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>© 2024 Cashew Forecast App. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-2">
                API Status: <Badge variant="success" className="text-[10px]">Connected</Badge>
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
