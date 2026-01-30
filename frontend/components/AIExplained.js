import { Lightbulb, ArrowRight, Zap, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";

export default function ForecastIntelligence({
    confidence = 85,
    factors = [
        { name: "Global Supply Chain", impact: "High", direction: "negative" },
        { name: "Seasonal Demand", impact: "Medium", direction: "positive" },
        { name: "Currency Fluctuation", impact: "Low", direction: "neutral" }
    ],
    summary = "The model predicts a bullish trend due to tightening supply in major export regions."
}) {
    return (
        <Card className="glass-card border-none overflow-hidden relative">
            <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-accent/10 text-accent">
                        <Zap className="h-4 w-4" />
                    </div>
                    <CardTitle className="text-base font-semibold">Market Model Context</CardTitle>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* AI Summary */}
                <div className="p-3 rounded-lg bg-background/50 border border-border/50 text-sm leading-relaxed">
                    <span className="font-semibold text-primary mr-1">Model Summary:</span>
                    {summary}
                </div>

                {/* Confidence Meter */}
                <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Model Confidence</span>
                        <span className="font-bold text-foreground">{confidence}%</span>
                    </div>
                    <div className="h-2 w-full bg-muted/50 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary relative"
                            style={{ width: `${confidence}%` }}
                        />
                    </div>
                </div>

                {/* Key Factors */}
                <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Top Influencing Factors</p>
                    <div className="space-y-2">
                        {factors.map((factor, index) => (
                            <div key={index} className="flex items-center justify-between p-2 rounded-md hover:bg-secondary transition-colors group">
                                <div className="flex items-center gap-2">
                                    <div className={`h-1.5 w-1.5 rounded-full ${factor.direction === 'positive' ? 'bg-success' :
                                        factor.direction === 'negative' ? 'bg-destructive' : 'bg-warning'
                                        }`} />
                                    <span className="text-sm font-medium">{factor.name}</span>
                                </div>
                                <Badge variant="outline" className="text-[10px] h-5 bg-transparent group-hover:bg-background/50 transition-colors">
                                    {factor.impact} Impact
                                </Badge>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Action Link */}
                <div className="pt-2">
                    <button className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
                        View full model details <ArrowRight className="h-3 w-3" />
                    </button>
                </div>
            </CardContent>
        </Card>
    );
}
