import { useEffect, useState } from "react";
import { ArrowUpRight, ArrowDownRight, Activity, ShieldCheck, AlertTriangle, TrendingUp, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { cn } from "../lib/utils";
import { api } from "../lib/apiClient";

const SignalCard = ({ title, value, trend, trendValue, icon: Icon, signalColor, status, loading }) => {
    return (
        <Card className="panel-executive overflow-hidden relative group hover:border-primary/30 transition-all duration-300">
            <div className={cn("absolute top-0 left-0 w-1 h-full", signalColor)} />
            <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
                        {loading ? (
                            <Loader2 className="h-6 w-6 mt-1 animate-spin text-muted-foreground" />
                        ) : (
                            <h3 className="text-2xl font-semibold mt-1 tracking-tight text-foreground">{value}</h3>
                        )}
                    </div>
                    <div className={cn(
                        "p-2 rounded-md bg-secondary/50 text-foreground group-hover:bg-secondary transition-colors",
                        "border border-border/50"
                    )}>
                        <Icon className="h-5 w-5" />
                    </div>
                </div>

                <div className="flex items-center gap-2 mt-2">
                    {trend === 'up' && <ArrowUpRight className="h-4 w-4 text-success" />}
                    {trend === 'down' && <ArrowDownRight className="h-4 w-4 text-destructive" />}
                    {trend === 'neutral' && <Activity className="h-4 w-4 text-warning" />}

                    <span className={cn(
                        "text-sm font-medium",
                        trend === 'up' ? "text-success" :
                            trend === 'down' ? "text-destructive" : "text-warning"
                    )}>
                        {trendValue}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">
                        {status}
                    </span>
                </div>
            </CardContent>
        </Card>
    );
};

export default function ExecutiveOverview() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await api.get("/api/v1/dashboard/overview");
            if (response.success) {
                setData(response.data);
            }
        } catch (error) {
            console.error("Failed to fetch dashboard overview:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // Refresh every 5 minutes
        const interval = setInterval(fetchData, 300000);
        return () => clearInterval(interval);
    }, []);

    const metrics = data?.key_metrics || {};
    const insights = data?.market_insights || {};
    const signals = insights.signals || [];

    return (
        <div className="space-y-6">
            <div className="flex items-end justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-foreground">Market Signals</h2>
                    <p className="text-sm text-muted-foreground">AI-driven market intelligence summary for the current period.</p>
                </div>
                <div className="text-xs text-muted-foreground font-mono uppercase">
                    LAST SYNC: {data?.timestamp ? new Date(data.timestamp).toLocaleTimeString() : '---'}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SignalCard
                    title="Current Market Price"
                    value={metrics.current_price ? `$${metrics.current_price.toLocaleString()} / MT` : "---"}
                    trend={metrics.trend_percentage > 0 ? 'up' : metrics.trend_percentage < 0 ? 'down' : 'neutral'}
                    trendValue={`${metrics.trend_percentage > 0 ? '+' : ''}${metrics.trend_percentage || 0}%`}
                    status="projected trend"
                    icon={TrendingUp}
                    signalColor="bg-primary"
                    loading={loading}
                />

                <SignalCard
                    title="Model Confidence"
                    value={metrics.confidence ? `${metrics.confidence}%` : "---"}
                    trend="neutral"
                    trendValue="Operational"
                    status="prediction weight"
                    icon={ShieldCheck}
                    signalColor="bg-success"
                    loading={loading}
                />

                <SignalCard
                    title="Market Regime"
                    value={insights.market_regime?.state?.replace('_', ' ') || "ANALYZING"}
                    trend="neutral"
                    trendValue={insights.market_regime?.strength || "Checking"}
                    status="regime strength"
                    icon={AlertTriangle}
                    signalColor="bg-warning"
                    loading={loading}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase">Key AI Insights</h3>
                    <div className="bg-secondary/30 border border-border rounded-md p-4 space-y-3 min-h-[100px]">
                        {loading ? (
                            <div className="flex items-center justify-center h-full">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : signals.length > 0 ? (
                            signals.map((sig, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <div className={cn(
                                        "w-1.5 h-1.5 rounded-full mt-2 shrink-0",
                                        sig.status === 'OPPORTUNITY' || sig.status === 'INFO' ? "bg-success" :
                                            sig.status === 'WARNING' ? "bg-warning" : "bg-destructive"
                                    )} />
                                    <p className="text-sm text-foreground">{sig.message}</p>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground italic">No specific signals detected at this time.</p>
                        )}

                        {insights.ai_summary && !loading && (
                            <div className="pt-2 border-t border-border/50 mt-2">
                                <p className="text-sm text-primary font-medium italic">"{insights.ai_summary}"</p>
                            </div>
                        )}
                    </div>
                </div>

                <div>
                    <h3 className="text-sm font-medium text-muted-foreground uppercase mb-4">Market Status</h3>
                    <div className="bg-secondary/30 border border-border rounded-md p-4 space-y-4">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">AI Intelligence</span>
                            <span className={cn("font-medium", data?.status === 'healthy' ? "text-success" : "text-warning")}>
                                {data?.status === 'healthy' ? "Active" : "Degraded"}
                            </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Market Volatility</span>
                            <span className="text-foreground font-medium">
                                {insights.key_metrics?.volatility_30d ? `${(insights.key_metrics.volatility_30d * 100).toFixed(2)}%` : "---"}
                            </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">RSI (14)</span>
                            <span className={cn("font-medium",
                                insights.key_metrics?.rsi > 70 ? "text-destructive" :
                                    insights.key_metrics?.rsi < 30 ? "text-success" : "text-foreground"
                            )}>
                                {insights.key_metrics?.rsi ? insights.key_metrics.rsi.toFixed(1) : "---"}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
