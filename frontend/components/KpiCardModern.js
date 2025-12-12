import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "../lib/utils";

export default function KpiCardModern({
  title,
  value,
  change,
  changeLabel = "vs last 7 days",
  badge,
  icon: Icon,
  trend = "neutral" // "up", "down", "neutral"
}) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  
  // Dynamic color based on trend
  const trendColor = trend === "up" 
    ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20" 
    : trend === "down" 
    ? "text-red-600 bg-red-50 dark:bg-red-900/20" 
    : "text-gray-600 bg-gray-50 dark:bg-gray-800/50";

  const iconColor = trend === "up" ? "text-emerald-600" : trend === "down" ? "text-red-600" : "text-primary";

  return (
    <Card className="glass-card border-none overflow-hidden relative group">
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {badge && (
          <Badge variant={badge.variant || "outline"} className="text-xs font-medium shadow-sm">
            {badge.label}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="space-y-3">
          {/* Main Metric */}
          <div className="flex items-center gap-3">
            {Icon && (
              <div className={cn("p-2 rounded-lg bg-primary/5 group-hover:bg-primary/10 transition-colors", iconColor)}>
                <Icon className="h-5 w-5" />
              </div>
            )}
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {value || "—"}
            </div>
          </div>

          {/* Change Indicator */}
          {change !== undefined && (
            <div className="flex items-center gap-2">
              <div className={cn("flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium", trendColor)}>
                <TrendIcon className="h-3 w-3" />
                <span>{change}</span>
              </div>
              <span className="text-xs text-muted-foreground">{changeLabel}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
