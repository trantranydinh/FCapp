import Link from "next/link";
import { useRouter } from "next/router";
import { cn } from "../lib/utils";
import { TrendingUp, BarChart3, Newspaper, Activity, GitMerge } from "lucide-react";

const tabs = [
    { href: "/price-forecast", label: "Price Forecast", icon: TrendingUp },
    { href: "/market-insights", label: "Market Insights", icon: BarChart3 },
    { href: "/news-watch", label: "News Watch", icon: Newspaper },
    { href: "/decision-tree", label: "Decision Tree", icon: GitMerge },
    { href: "/lstm-demo", label: "LSTM Demo", icon: Activity },
];

export default function ForecastNav() {
    const router = useRouter();
    const currentPath = router.pathname;

    return (
        <div className="mb-6 border-b border-border/40">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                {tabs.map((tab) => {
                    const isActive = currentPath === tab.href;
                    return (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            className={cn(
                                "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200 whitespace-nowrap",
                                isActive
                                    ? "border-primary text-primary"
                                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30 rounded-t-lg"
                            )}
                        >
                            <tab.icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground")} />
                            {tab.label}
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
