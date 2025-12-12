import { TrendingUp, TrendingDown, Minus, Activity, Calendar, Zap } from "lucide-react";
import { cn } from "../lib/utils";

export default function TrendMicroCard({
    title,
    value,
    subValue,
    type = "trend", // trend, volatility, confidence, seasonal
    trend = "neutral",
    score = 0
}) {

    const renderContent = () => {
        switch (type) {
            case "trend":
                const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
                const trendColor = trend === "up" ? "text-emerald-500" : trend === "down" ? "text-red-500" : "text-muted-foreground";
                return (
                    <div className="flex items-center justify-between mt-2">
                        <div className="text-2xl font-bold">{value}</div>
                        <div className={cn("p-2 rounded-full bg-background/50 shadow-sm", trendColor)}>
                            <TrendIcon className="h-5 w-5" />
                        </div>
                    </div>
                );

            case "volatility":
                return (
                    <div className="mt-3 space-y-2">
                        <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Low</span>
                            <span className="font-medium text-foreground">{value}</span>
                            <span className="text-muted-foreground">High</span>
                        </div>
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-emerald-500 via-yellow-500 to-red-500"
                                style={{ width: `${score}%` }}
                            />
                        </div>
                    </div>
                );

            case "confidence":
                return (
                    <div className="mt-3 space-y-1">
                        <div className="flex items-end gap-2">
                            <span className="text-2xl font-bold text-primary">{score}%</span>
                            <span className="text-xs text-muted-foreground mb-1">Accuracy</span>
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary transition-all duration-500"
                                style={{ width: `${score}%` }}
                            />
                        </div>
                    </div>
                );

            case "seasonal":
                return (
                    <div className="flex items-center gap-3 mt-2">
                        <div className="flex-1">
                            <div className="text-lg font-semibold">{value}</div>
                            <div className="text-xs text-muted-foreground">{subValue}</div>
                        </div>
                        <Calendar className="h-8 w-8 text-accent/50" />
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="glass-card p-4 rounded-xl hover:scale-[1.02] transition-transform duration-300 border border-white/10">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                {type === "trend" && <TrendingUp className="h-3 w-3" />}
                {type === "volatility" && <Activity className="h-3 w-3" />}
                {type === "confidence" && <Zap className="h-3 w-3" />}
                {type === "seasonal" && <Calendar className="h-3 w-3" />}
                {title}
            </h3>
            {renderContent()}
        </div>
    );
}
