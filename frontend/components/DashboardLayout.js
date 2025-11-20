import Link from "next/link";
import {
  LayoutDashboard,
  TrendingUp,
  Newspaper,
  BarChart3,
  Activity,
  User,
  ChevronDown
} from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/price-forecast", label: "Price Forecast", icon: TrendingUp },
  { href: "/market-insights", label: "Market Insights", icon: BarChart3 },
  { href: "/news-watch", label: "News Watch", icon: Newspaper },
  { href: "/lstm-demo", label: "LSTM Demo", icon: Activity },
];

export default function DashboardLayout({ children, title = "Dashboard", currentPath = "" }) {
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
            <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                A
              </div>
            </Button>
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
