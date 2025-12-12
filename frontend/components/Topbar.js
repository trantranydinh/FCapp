import { Search, Bell, User, Settings, Command } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

export default function Topbar() {
    return (
        <header className="sticky top-0 z-30 flex h-16 w-full items-center gap-4 border-b border-white/10 bg-white/80 dark:bg-slate-950/80 px-6 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60">
            {/* Search Bar */}
            <div className="flex flex-1 items-center gap-4 md:gap-8">
                <div className="relative flex-1 max-w-md hidden md:flex">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                        type="search"
                        placeholder="Search trends, forecasts, or news..."
                        className="h-9 w-full rounded-full border border-input bg-background/50 px-9 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    <div className="absolute right-2.5 top-2.5 hidden lg:flex items-center gap-1">
                        <span className="text-[10px] font-medium text-muted-foreground border border-input rounded px-1.5 py-0.5 bg-background/50">⌘K</span>
                    </div>
                </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-4">
                {/* System Status - Mini */}
                <div className="hidden xl:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/5 border border-emerald-500/10">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-medium text-emerald-600">System Optimal</span>
                </div>

                <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-accent/10">
                    <Bell className="h-5 w-5 text-muted-foreground" />
                    <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 border-2 border-background" />
                </Button>

                <Button variant="ghost" size="icon" className="rounded-full hover:bg-accent/10">
                    <Settings className="h-5 w-5 text-muted-foreground" />
                </Button>

                <div className="h-8 w-px bg-border/50 mx-1" />

                <Button variant="ghost" size="sm" className="gap-2 rounded-full pl-1 pr-3 hover:bg-accent/10">
                    <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground text-xs font-bold">
                        A
                    </div>
                    <span className="text-sm font-medium hidden sm:inline-block">Admin</span>
                </Button>
            </div>
        </header>
    );
}
