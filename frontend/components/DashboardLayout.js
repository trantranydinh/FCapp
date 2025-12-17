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
    <div className="flex h-screen bg-background overflow-hidden font-sans text-foreground">
      {/* 🟢 LEFT NAVIGATION RAIL */}
      <aside
        className={cn(
          "relative z-30 flex flex-col h-full border-r border-border bg-secondary transition-all duration-300 ease-in-out",
          isCollapsed ? "w-[72px]" : "w-64"
        )}
      >
        {/* Sidebar Header / Logo */}
        <div className="h-16 flex items-center justify-center border-b border-border bg-secondary">
          <div className="flex items-center gap-3">
            <div className="h-8 w-auto flex items-center justify-center">
              <img src="/logo_intersnack.png" alt="Intersnack" className="h-full w-auto object-contain" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col animate-in fade-in duration-300">
                <span className="font-semibold text-sm tracking-tight text-foreground">
                  FC System
                </span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                  Executive
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto py-6 px-2 space-y-1">
          {navItems.map((item) => {
            const isActive = isParentActive(item);
            const isChildrenVisible = isActive && !isCollapsed;

            return (
              <div key={item.href} className="space-y-1">
                {/* Parent Item */}
                <Link
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200",
                    isActive
                      ? "bg-white shadow-sm border-l-2 border-primary text-primary" // Active: White bg + Red Border
                      : "text-muted-foreground hover:bg-white/50 hover:text-foreground"
                  )}
                  title={isCollapsed ? item.label : ""}
                >
                  <item.icon className={cn(
                    "h-5 w-5 shrink-0 transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )} />

                  {!isCollapsed && (
                    <span className="font-medium text-sm truncate">
                      {item.label}
                    </span>
                  )}
                </Link>

                {/* Children Items (Sub-menu) */}
                {item.children && isChildrenVisible && !isCollapsed && (
                  <div className="ml-4 pl-4 border-l border-border/60 space-y-1 mt-1">
                    {item.children.map((child) => {
                      const isChildActive = currentPath === child.href;
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-all duration-200",
                            isChildActive
                              ? "text-primary font-medium bg-primary/5"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
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

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-border bg-secondary">
          <Button
            variant="ghost"
            size="icon"
            className="w-full h-9 flex items-center justify-center rounded-md hover:bg-white/50 text-muted-foreground"
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
                <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
                <span>System Operational</span>
                <span className="text-border">|</span>
                <span>Latency: 24ms</span>
              </div>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-4">
            {/* Action Button - Deep Red */}
            <Button
              size="sm"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-sm border border-transparent"
            >
              <Activity className="w-4 h-4 mr-2" />
              Run Forecast
            </Button>

            <div className="h-6 w-[1px] bg-border" />

            {/* Profile */}
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-medium text-foreground">{user?.name}</div>
                <div className="text-[10px] text-muted-foreground uppercase">Executive View</div>
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
          <div className="max-w-[1600px] mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
