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
  Computer
} from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";
import { useAuth } from "./AuthProvider";

const navItems = [
  { href: "/dashboard", label: "Parity Tool", icon: LayoutDashboard },
  {
    href: "/price-forecast",
    label: "Forecast Price",
    icon: TrendingUp,
    children: [
      { href: "/price-forecast", label: "Overview", icon: Activity },
      { href: "/market-insights", label: "Market Insights", icon: BarChart3 },
      { href: "/news-watch", label: "News Watch", icon: Newspaper },
      { href: "/decision-tree", label: "Decision Tree", icon: Computer }, // Using Computer icon temporarily or import another
      { href: "/lstm-demo", label: "LSTM Demo", icon: Activity },
    ]
  },
];

export default function DashboardLayout({ children, title = "Dashboard" }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
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

  // Helper to determine active state
  const isItemActive = (href, exact = false) => {
    if (exact) return currentPath === href;
    return currentPath === href || currentPath.startsWith(href) && href !== '/dashboard'; // Special case for dashboard root
  };

  // Check if any child of a parent is active
  const isParentActive = (item) => {
    if (item.href === currentPath) return true;
    if (item.children) {
      return item.children.some(child => child.href === currentPath);
    }
    return false;
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">

      {/* 🟢 HIGHTECH SIDEBAR */}
      <aside
        className={cn(
          "relative z-30 flex flex-col h-full border-r border-border/40 bg-background/80 backdrop-blur-xl transition-all duration-500 ease-in-out shadow-2xl shadow-primary/5",
          isCollapsed ? "w-[80px]" : "w-72"
        )}
      >
        {/* Sidebar Header / Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-border/40">
          {!isCollapsed && (
            <div className="flex items-center gap-3 animate-in fade-in duration-300">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
                <Computer className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                  FC System
                </span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                  v2.0 PRO
                </span>
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className="w-full flex justify-center">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
                <Computer className="h-5 w-5 text-white" />
              </div>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-2">
          {navItems.map((item) => {
            const isActive = isParentActive(item);
            const isChildrenVisible = isActive && !isCollapsed;

            return (
              <div key={item.href} className="space-y-1">
                {/* Parent Item */}
                <Link
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 relative overflow-hidden",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                      : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                  )}
                >
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent pointer-events-none" />
                  )}

                  <item.icon className={cn(
                    "h-5 w-5 transition-transform duration-300",
                    isActive ? "scale-110" : "group-hover:scale-110",
                    isCollapsed ? "mx-auto" : ""
                  )} />

                  {!isCollapsed && (
                    <span className="font-medium text-sm tracking-wide animate-in fade-in duration-300">
                      {item.label}
                    </span>
                  )}

                  {/* Active Indicator for Collapsed Mode */}
                  {isCollapsed && isActive && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white shadow-glow" />
                  )}
                </Link>

                {/* Children Items (Sub-menu) */}
                {item.children && isChildrenVisible && (
                  <div className="ml-4 pl-4 border-l border-border/50 space-y-1 animate-in slide-in-from-left-4 duration-300">
                    {item.children.map((child) => {
                      const isChildActive = currentPath === child.href;
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200",
                            isChildActive
                              ? "text-primary font-semibold bg-primary/10"
                              : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                          )}
                        >
                          {child.icon && <child.icon className="h-4 w-4 opacity-70" />}
                          <span>{child.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* Sidebar Footer / Toggle */}
        <div className="p-4 border-t border-border/40">
          <Button
            variant="ghost"
            size="icon"
            className="w-full h-10 flex items-center justify-center rounded-xl hover:bg-secondary/80 text-muted-foreground transition-colors"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </Button>
        </div>
      </aside>

      {/* 🔵 MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-slate-50/50 dark:bg-black/20">

        {/* Top Header Bar */}
        <header className="h-16 flex items-center justify-between px-8 border-b border-border/40 bg-background/60 backdrop-blur-sm z-20 sticky top-0">
          {/* Section Title */}
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
              <h1 className="text-xl font-bold text-foreground tracking-tight">{title}</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">AI-Powered Market Intelligence Engine</p>
            </div>
          </div>

          {/* User Profile / Status */}
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center px-3 py-1 bg-success/10 border border-success/20 rounded-full gap-2">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse shadow-lg shadow-success/50" />
              <span className="text-xs font-semibold text-success tracking-wide">SYSTEM ONLINE</span>
            </div>

            <div className="h-8 w-[1px] bg-border/60 hidden sm:block" />

            <div className="relative group">
              <button className="flex items-center gap-3 focus:outline-none">
                <div className="flex flex-col items-end hidden sm:flex">
                  <span className="text-sm font-semibold text-foreground">{user?.name || "User"}</span>
                  <span className="text-[10px] text-muted-foreground font-medium uppercase">{user?.role || "Viewer"}</span>
                </div>
                <div className="h-9 w-9 rounded-full bg-secondary border border-border flex items-center justify-center text-sm font-bold text-primary ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
                  {getUserInitials()}
                </div>
              </button>

              {/* Simple Dropdown for Logout */}
              <div className="absolute right-0 mt-2 w-48 py-1 bg-background border border-border/50 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right z-50">
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-accent hover:bg-accent/5 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="font-medium">Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth will-change-scroll">
          <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {children}
          </div>

          {/* Footer */}
          <footer className="mt-12 py-6 border-t border-border/40 text-center">
            <p className="text-xs text-muted-foreground">
              © 2025 Intersnack Forecast App. All rights reserved. <span className="opacity-50 mx-2">|</span> v2.0.0
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}
