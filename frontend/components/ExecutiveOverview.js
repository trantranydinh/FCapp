
import { ArrowUpRight, ArrowDownRight, Activity, ShieldCheck, AlertTriangle, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { cn } from "../lib/utils";

const SignalCard = ({ title, value, trend, trendValue, icon: Icon, signalColor, status }) => {
    return (
        <Card className="panel-executive overflow-hidden relative group hover:border-primary/30 transition-all duration-300">
            <div className={cn("absolute top-0 left-0 w-1 h-full", signalColor)} />
            <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
                        <h3 className="text-2xl font-semibold mt-1 tracking-tight text-foreground">{value}</h3>
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
    return (
        <div className="space-y-6">
            {/* Title / Context */}
            <div className="flex items-end justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-foreground">Market Signals</h2>
                    <p className="text-sm text-muted-foreground">AI-driven market intelligence summary for the current period.</p>
                </div>
                <div className="text-xs text-muted-foreground font-mono">
                    LAST UPDATED: {new Date().toLocaleTimeString()}
                </div>
            </div>

            {/* Signal Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 1. Trend Forecast */}
                <SignalCard
                    title="RCN Price Trend"
                    value="$1,450 / MT"
                    trend="up"
                    trendValue="+5.2%"
                    status="vs last week"
                    icon={TrendingUp}
                    signalColor="bg-primary"
                />

                {/* 2. AI Confidence */}
                <SignalCard
                    title="Model Confidence"
                    value="87.4%"
                    trend="up"
                    trendValue="+2.1%"
                    status="accuracy gain"
                    icon={ShieldCheck}
                    signalColor="bg-success"
                />

                {/* 3. Business Impact (Risk) */}
                <SignalCard
                    title="Supply Risk Index"
                    value="Moderate"
                    trend="neutral"
                    trendValue="Stable"
                    status="No immediate disruptions"
                    icon={AlertTriangle}
                    signalColor="bg-warning"
                />
            </div>

            {/* Insight Drawer (Contextual) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase">Key Insights</h3>
                    <div className="bg-secondary/30 border border-border rounded-md p-4 space-y-3">
                        <div className="flex items-start gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                            <p className="text-sm text-foreground">RCN prices are projected to rise due to delayed harvest reports from West Africa.</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-success mt-2 shrink-0" />
                            <p className="text-sm text-foreground">Vietnam market showing strong demand signals, supporting the bullish trend.</p>
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="text-sm font-medium text-muted-foreground uppercase mb-4">System Health</h3>
                    <div className="bg-secondary/30 border border-border rounded-md p-4 space-y-4">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Ensemble Model</span>
                            <span className="text-success font-medium">Active</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">News Crawler</span>
                            <span className="text-success font-medium">Running</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Market Scanner</span>
                            <span className="text-warning font-medium">Syncing...</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
