import Link from "next/link";
import { useState } from "react";
import {
  LayoutDashboard,
  TrendingUp,
  Newspaper,
  BarChart3,
  Menu,
  X,
  Activity,
  ChevronRight
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

export default function DashboardLayout({ children, title = "Dashboard" }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Top App Bar */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center gap-4 px-4 sm:px-6">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          {/* App name & version */}
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold tracking-tight">Cashew Forecast</h1>
            <Badge variant="outline" className="hidden sm:inline-flex">
              v0.2.0
            </Badge>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Right side - System status */}
          <div className="hidden md:flex items-center gap-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-xs">System OK</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar - Desktop */}
        <aside className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 border-r bg-background pt-16 transition-transform duration-300 lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="flex h-full flex-col gap-2 px-3 py-4">
            {/* Navigation */}
            <nav className="flex-1 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* System Status Mini Section */}
            <div className="mt-auto space-y-2 border-t pt-4">
              <div className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                System Status
              </div>
              <div className="px-3 space-y-1.5 text-xs text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Backend API</span>
                  <Badge variant="success" className="text-[10px] px-1.5 py-0">OK</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>LLM Provider</span>
                  <span className="text-[10px]">none</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-x-hidden">
          {/* Breadcrumb / Page Title */}
          <div className="border-b">
            <div className="flex h-16 items-center gap-2 px-4 sm:px-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Link href="/" className="hover:text-foreground transition-colors">
                  Home
                </Link>
                <ChevronRight className="h-4 w-4" />
                <span className="text-foreground font-medium">{title}</span>
              </div>
            </div>
          </div>

          {/* Page Content */}
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
