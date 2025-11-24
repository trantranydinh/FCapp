import { Newspaper, ExternalLink, Clock, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { cn } from "../lib/utils";

export default function NewsWidget({ news = [], onRefresh, isRefreshing = false }) {
    // Fallback data if no news provided
    const displayNews = news.length > 0 ? news : [
        { id: 1, title: "Vietnam Cashew Exports Surge in Q3", source: "AgriNews", time: "2h ago", tag: "Market", url: "#" },
        { id: 2, title: "Global Supply Chain Disruptions Impact Prices", source: "TradeDaily", time: "4h ago", tag: "Logistics", url: "#" },
        { id: 3, title: "New Processing Tech Boosts Yields", source: "TechFarming", time: "6h ago", tag: "Technology", url: "#" },
        { id: 4, title: "Weather Patterns Affect African Crop", source: "ClimateWatch", time: "12h ago", tag: "Weather", url: "#" },
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
                            >
                                <RefreshCw className={cn("h-3 w-3", isRefreshing && "animate-spin")} />
                            </Button>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1 p-0">
                <ScrollArea className="h-[300px] px-6 pb-4">
                    <div className="space-y-4 pt-2">
                        {displayNews.map((item, index) => (
                            <div
                                key={item.id || index}
                                className="group relative pl-4 border-l-2 border-muted hover:border-primary transition-colors duration-300"
                            >
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center justify-between">
                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">{item.tag || item.tags?.[0] || "General"}</Badge>
                                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                            <Clock className="h-3 w-3" />
                                            {item.time || (item.published_at ? new Date(item.published_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now")}
                                        </div>
                                    </div>
                                    <a
                                        href={item.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm font-medium leading-snug group-hover:text-primary transition-colors cursor-pointer block hover:underline"
                                    >
                                        {item.title}
                                    </a>
                                    <div className="flex items-center justify-between mt-1">
                                        <span className="text-xs text-muted-foreground">{item.source}</span>
                                        <a href={item.url} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-primary" />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
