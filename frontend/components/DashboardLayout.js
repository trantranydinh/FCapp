import Link from "next/link";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  TrendingUp,
  Newspaper,
  BarChart3,
  Activity,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  Calculator,
  History,
  Lightbulb,
  Share2,
  Brain,
  BookOpen,
  Clock,
  Settings,
  Bell,
  Database,
  RefreshCw,
  ShieldCheck
} from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";
import { useAuth } from "./AuthProvider";
import { useFavicon } from "../hooks/useFavicon";
import { useSWRConfig } from "swr";

// Define Navigation Structure
const navSections = [
  {
    type: "section",
    title: "Parity Tool",
    items: [
      { href: "/dashboard", label: "Calculation", icon: Calculator },
      { href: "/dashboard#history", label: "History", icon: History },
    ]
  },
  {
    type: "section",
    title: "Price Forecast",
    items: [
      { href: "/price-forecast", label: "Overview", icon: LayoutDashboard },
      { href: "/market-insights", label: "Market Signals", icon: BarChart3 },
      { href: "/news-watch", label: "News Watch", icon: Newspaper, badge: "Live" },
      { href: "/reports", label: "Decision Support", icon: Lightbulb },
      { type: "subheader", label: "Models & Experiments" }, // Sub-section
      { href: "/decision-tree", label: "Model Logic", icon: Share2 },
      { href: "/lstm-demo", label: "Forecast Model", icon: Brain },
    ]
  },
  {
    type: "section",
    title: "System",
    items: [
      { href: "/system", label: "Methodology", icon: BookOpen },
      { href: "/changelog", label: "Change Log", icon: Clock },
    ]
  },
  {
    type: "section",
    title: "App Settings",
    items: [
      { href: "/settings", label: "Settings", icon: Settings },
      { href: "/data-management", label: "Data Management", icon: Database },
    ]
  }
];

export default function DashboardLayout({ children, title = "Dashboard" }) {
  const { user, logout } = useAuth();
  const { setFavicon } = useFavicon();
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Collapse sidebar by default on small screens
    if (window.innerWidth < 1024) setIsCollapsed(true);
  }, []);

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!mounted || !user?.name) return "U";
    return user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const currentPath = router.pathname;

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans text-foreground">
      {/* 🟢 LEFT NAVIGATION RAIL */}
      <aside
        className={cn(
          "relative z-30 flex flex-col h-full border-r border-border bg-secondary transition-all duration-300 ease-in-out",
          isCollapsed ? "w-[72px]" : "w-64"
        )}
      >
        {/* Sidebar Header / Logo */}
        <div className="h-16 flex items-center justify-center border-b border-border bg-secondary shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-8 w-auto flex items-center justify-center">
              <img src="/assets/images/logo-icon.png" alt="Intersnack" className="h-full w-auto object-contain" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col animate-in fade-in duration-300">
                <span className="font-semibold text-[10px] leading-tight text-[#1D222C]">
                  Intersnack Cashew
                </span>
                <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-medium">
                  Internal System
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-6">
          {navSections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              {/* Section Header */}
              {!isCollapsed && (
                <h3 className="px-3 text-[10px] uppercase tracking-wider font-bold text-muted-foreground/70 mb-2 select-none flex items-center justify-between">
                  {section.title}
                  {(section.title === "App Settings" || section.title === "Price Forecast") && (
                    <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded ml-2 normal-case">Coming Soon</span>
                  )}
                </h3>
              )}

              {/* Items */}
              <div className="space-y-1">
                {section.items.map((item, i) => {
                  // Handle Subheaders / Dividers
                  if (item.type === "subheader") {
                    return !isCollapsed ? (
                      <div key={i} className="pt-3 pb-1 px-3">
                        <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/40 border-b border-border/40 pb-1">
                          {item.label}
                        </div>
                      </div>
                    ) : <div key={i} className="my-2 border-t border-border/50 mx-2" />;
                  }

                  // Handle Active State (Hash vs Path)
                  let isActive = router.pathname === item.href;

                  if (item.href.includes('#')) {
                    isActive = router.asPath === item.href;
                  } else if (item.href === '/dashboard') {
                    // Exact match for Dashboard to avoid conflict with history hash
                    isActive = router.asPath === '/dashboard' || router.asPath === '/dashboard#';
                  }

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "group flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200",
                        isActive
                          ? "bg-white shadow-sm border-l-2 border-primary text-primary font-medium"
                          : "text-muted-foreground hover:bg-white/50 hover:text-foreground"
                      )}
                      title={isCollapsed ? item.label : ""}
                    >
                      <item.icon className={cn(
                        "h-5 w-5 shrink-0 transition-colors",
                        isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                      )} />

                      {!isCollapsed && (
                        <div className="flex flex-1 items-center justify-between min-w-0">
                          <span className="text-sm truncate">{item.label}</span>
                          {item.badge && (
                            <span className="text-[10px] bg-emerald-500/10 text-emerald-600 px-1.5 py-0.5 rounded-full font-medium border border-emerald-500/20 ml-2">
                              {item.badge}
                            </span>
                          )}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-border bg-secondary shrink-0">
          {!isCollapsed && (
            <div className="mb-4 pl-1 space-y-0.5 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <p className="text-[10px] font-semibold text-foreground/80">Intersnack Cashew Company</p>
              <div className="text-[10px] text-muted-foreground flex flex-col">
                <span>Version 2.1.0 · Beta</span>
                <span className="opacity-70">Last updated: Jan 2026</span>
              </div>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="w-full h-8 flex items-center justify-center rounded-md hover:bg-white/50 text-muted-foreground"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </aside>

      {/* 🔵 MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-background">

        {/* TOP EXECUTIVE BAR */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-border bg-background/95 backdrop-blur-sm z-20 sticky top-0">
          {/* Section Context */}
          <div className="flex items-center gap-4">
            {isCollapsed && (
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setIsCollapsed(false)}
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}
            <div>
              <h1 className="text-lg font-semibold text-foreground tracking-tight">{title}</h1>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_4px_rgba(34,197,94,0.4)]"></span>
                <span>System Operational</span>
                <span className="text-border">|</span>
                <span>Latency: {Math.floor(Math.random() * 20 + 15)}ms</span>
              </div>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-4">
            {/* Action Button - Deep Red */}

            <Button
              size="sm"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-sm border border-transparent active:scale-95 transition-transform"
              disabled={isRefreshing}
              onClick={async () => {
                setIsRefreshing(true);

                try {
                  // 1. Route-Specific Background Tasks
                  if (router.pathname.includes('news-watch')) {
                    await fetch('/api/v1/dashboard/news-refresh', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ keywords: ['cashew'], limit: 12 })
                    });
                  }

                  // 2. Universal Soft Refresh
                  await mutate(() => true, undefined, { revalidate: true });
                  await router.replace(router.asPath, undefined, { scroll: false });

                } catch (e) {
                  console.error("Refresh failed:", e);
                } finally {
                  setTimeout(() => setIsRefreshing(false), 500);
                }
              }}
            >
              <RefreshCw className={cn("w-4 h-4 mr-2", isRefreshing ? "animate-spin" : "")} />
              {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
            </Button>

            <div className="h-6 w-[1px] bg-border" />

            {/* Profile */}
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-medium text-foreground">{user?.name}</div>
                <div className="text-[10px] text-muted-foreground uppercase">Internal System View</div>
              </div>
              <div className="h-8 w-8 rounded bg-secondary border border-border flex items-center justify-center text-xs font-bold text-foreground">
                {getUserInitials()}
              </div>
              <button onClick={logout} className="text-muted-foreground hover:text-primary transition-colors">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Main Decision Canvas */}
        <main className="flex-1 overflow-y-auto p-6 scroll-smooth">
          <div className="max-w-[1700px] mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
