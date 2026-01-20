import Link from "next/link";
import { useRouter } from "next/router";
import {
    LayoutDashboard,
    TrendingUp,
    BarChart3,
    Newspaper,
    Activity,
    Settings,
    Database,
    Key,
    Info,
    ChevronRight,
    FileText
} from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";

const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/price-forecast", label: "Model Forecast", icon: TrendingUp },
    { href: "/market-insights", label: "Market Insights", icon: BarChart3 },
    { href: "/news-watch", label: "News Watch", icon: Newspaper },
    { href: "/lstm-demo", label: "LSTM Demo", icon: Activity },
    { href: "/reports", label: "Reports", icon: FileText, isNew: true },
    { href: "/model-performance", label: "Model Performance", icon: Info },
];

const managementItems = [
    { href: "/settings", label: "Settings", icon: Settings },
    { href: "/system", label: "System Methodology", icon: Info },
    { href: "/changelog", label: "Changelog", icon: Activity },
    { href: "/data-management", label: "Data Management", icon: Database },
    { href: "/api-access", label: "API Access", icon: Key },
];

export default function Sidebar() {
    const router = useRouter();
    const currentPath = router.pathname;

    const NavItem = ({ item }) => {
        const isActive = currentPath === item.href;
        const Icon = item.icon;

        return (
            <Link href={item.href} className="w-full">
                <div
                    className={cn(
                        "group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 relative overflow-hidden",
                        isActive
                            ? "bg-primary/10 text-primary font-medium shadow-sm"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                >
                    {isActive && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full" />
                    )}

                    <Icon
                        className={cn(
                            "h-5 w-5 transition-transform duration-300 group-hover:scale-110",
                            isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary"
                        )}
                    />

                    <span className="flex-1 truncate">{item.label}</span>

                    {item.isNew && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold bg-accent/10 text-accent rounded-md uppercase tracking-wider">
                            New
                        </span>
                    )}

                    {isActive && (
                        <ChevronRight className="h-4 w-4 text-primary/50 animate-in fade-in slide-in-from-left-1" />
                    )}
                </div>
            </Link>
        );
    };

    return (
        <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-white/10 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 hidden lg:flex flex-col">
            {/* Logo Area */}
            <div className="h-16 flex items-center px-6 border-b border-white/10">
                <Link href="/dashboard" className="flex items-center gap-3 group">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/20 group-hover:shadow-primary/30 transition-all duration-300">
                        <LayoutDashboard className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-lg font-bold text-foreground leading-none tracking-tight">Cashew<span className="text-primary">AI</span></span>
                    </div>
                </Link>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto py-6 px-3 space-y-6 custom-scrollbar">
                {/* Main Menu */}
                <div className="space-y-1">
                    <p className="px-3 text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider mb-2">
                        Analytics
                    </p>
                    {navItems.map((item) => (
                        <NavItem key={item.href} item={item} />
                    ))}
                </div>

                {/* Management Menu */}
                <div className="space-y-1">
                    <p className="px-3 text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider mb-2">
                        System
                    </p>
                    {managementItems.map((item) => (
                        <NavItem key={item.href} item={item} />
                    ))}
                </div>
            </div>

            {/* User Profile / Bottom Area */}
            <div className="p-4 border-t border-white/10 bg-white/5">
                <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer group">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center text-white font-bold shadow-sm group-hover:scale-105 transition-transform">
                        A
                    </div>
                    <div className="flex flex-col overflow-hidden">
                        <span className="text-sm font-medium text-foreground truncate">Admin User</span>
                        <span className="text-xs text-muted-foreground truncate">admin@cashew.ai</span>
                    </div>
                </div>
            </div>
        </aside>
    );
}
