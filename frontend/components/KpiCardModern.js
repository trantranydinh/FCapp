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
  const trendColor = trend === "up" ? "text-emerald-600" : trend === "down" ? "text-red-600" : "text-gray-600";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {badge && (
          <Badge variant={badge.variant || "outline"} className="text-xs">
            {badge.label}
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {/* Main Metric */}
          <div className="flex items-baseline gap-2">
            {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
            <div className="text-2xl font-semibold tracking-tight">
              {value || "—"}
            </div>
          </div>

          {/* Change Indicator */}
          {change !== undefined && (
            <div className={cn("flex items-center gap-1 text-xs", trendColor)}>
              <TrendIcon className="h-3 w-3" />
              <span className="font-medium">{change}</span>
              <span className="text-muted-foreground ml-1">{changeLabel}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
