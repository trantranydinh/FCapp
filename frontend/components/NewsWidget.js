import { Newspaper, ArrowRight, Clock, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { cn } from "../lib/utils";
import Link from "next/link";

export default function NewsWidget({ news = [], onRefresh, isRefreshing = false }) {
    // Fallback data if no news provided
    const displayNews = news.length > 0 ? news : [
        { id: 1, title: "Vietnam Cashew Exports Surge in Q3", source: "AgriNews", time: "2h ago", tag: "Market" },
        { id: 2, title: "Global Supply Chain Disruptions Impact Prices", source: "TradeDaily", time: "4h ago", tag: "Logistics" },
        { id: 3, title: "New Processing Tech Boosts Yields", source: "TechFarming", time: "6h ago", tag: "Technology" },
        { id: 4, title: "Weather Patterns Affect African Crop", source: "ClimateWatch", time: "12h ago", tag: "Weather" },
    ];

    return (
        <Card className="glass-card border-none h-full flex flex-col">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Newspaper className="h-4 w-4 text-primary" />
                        <CardTitle className="text-base">Market News</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px]">Live Updates</Badge>
                        {onRefresh && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={onRefresh}
                                disabled={isRefreshing}
                                type="button"
                            >
                                <RefreshCw className={cn("h-3 w-3", isRefreshing && "animate-spin")} />
                            </Button>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 flex flex-col">
                <ScrollArea className="flex-1 px-6 pb-4">
                    <div className="space-y-4 pt-2">
                        {displayNews.slice(0, 5).map((item, index) => (
                            <div
                                key={item.id || index}
                                className="group relative pl-4 border-l-2 border-muted hover:border-primary transition-colors duration-300 py-2"
                            >
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center justify-between">
                                        <div className="flex gap-2 items-center">
                                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                                                {item.category || item.tag || "General"}
                                            </Badge>
                                            {item.sourceTier && (
                                                <Badge className={cn(
                                                    "text-[10px] px-1.5 py-0 h-5",
                                                    item.sourceTier === 'A' ? "bg-green-100 text-green-800 border-green-200" :
                                                        item.sourceTier === 'B' ? "bg-blue-100 text-blue-800 border-blue-200" :
                                                            "bg-gray-100 text-gray-800 border-gray-200"
                                                )}>
                                                    Tier {item.sourceTier}
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                            <Clock className="h-3 w-3" />
                                            {item.publishedAt || item.published_at ? (() => {
                                                const d = new Date(item.publishedAt || item.published_at);
                                                if (isNaN(d.getTime())) return "Unknown Date";
                                                const diff = new Date() - d;
                                                const hours = Math.floor(diff / (1000 * 60 * 60));
                                                return hours < 24 ? `${hours}h ago` : d.toLocaleDateString();
                                            })() : "Just now"}
                                        </div>
                                    </div>

                                    <a
                                        href={item.url || item.originalUrl || "#"}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm font-medium leading-snug group-hover:text-primary transition-colors cursor-pointer block hover:underline mt-1"
                                    >
                                        {item.title}
                                    </a>

                                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                        {item.summary || "No summary available."}
                                    </p>

                                    <div className="flex items-center justify-between mt-2 border-t border-border/40 pt-1">
                                        <span className="text-[10px] font-semibold text-muted-foreground/80">{item.source}</span>
                                        {item.trustScore && (
                                            <div className="flex items-center gap-1" title={item.trustReasons?.join(', ') || 'Trust Score'}>
                                                <div className={cn(
                                                    "h-1.5 w-1.5 rounded-full",
                                                    item.trustScore >= 80 ? "bg-green-500" :
                                                        item.trustScore >= 50 ? "bg-yellow-500" : "bg-red-500"
                                                )} />
                                                <span className="text-[10px] text-muted-foreground">{item.trustScore}% Trust</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
                <div className="p-4 border-t border-border/50 bg-muted/20">
                    <Link href="/news-watch" className="w-full">
                        <Button variant="ghost" size="sm" className="w-full text-xs gap-1 h-8">
                            View All News Details <ArrowRight className="h-3 w-3" />
                        </Button>
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}
