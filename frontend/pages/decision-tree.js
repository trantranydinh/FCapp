import Head from "next/head";
import DashboardLayout from "../components/DashboardLayout";
// import ForecastNav from "../components/ForecastNav"; // Removed
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { GitMerge, CheckCircle, XCircle, AlertTriangle, ArrowRight } from "lucide-react";

export default function DecisionTreePage() {
    // Simple "Hardcoded" trading strategy logic for demo
    // In a real app, this data would come from the backend API
    const marketConditions = {
        rcnPrice: 1450,
        inventory: "LOW",
        trend: "UP",
        season: "PEAK"
    };

    return (
        <>
            <Head>
                <title>Decision Tree | Cashew Forecast</title>
            </Head>
            <DashboardLayout title="Decision Support System">
                <div className="space-y-6">
                    {/* ForecastNav removed */}

                    <Card className="glass-card border-none">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <GitMerge className="h-5 w-5 text-primary" />
                                Strategic Decision Tree
                            </CardTitle>
                            <CardDescription>
                                AI-driven logic flow for current procurement recommendations
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-8">
                            {/* Visual Tree Structure using CSS/Flexbox */}
                            <div className="flex flex-col items-center space-y-8">

                                {/* Root Node */}
                                <div className="relative z-10">
                                    <div className="bg-primary text-primary-foreground px-6 py-3 rounded-full font-bold shadow-lg shadow-primary/20 flex flex-col items-center">
                                        <span>Market Assessment</span>
                                        <span className="text-[10px] opacity-80 uppercase tracking-widest">Start</span>
                                    </div>
                                    {/* Connector Line */}
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 h-8 w-0.5 bg-border"></div>
                                </div>

                                {/* Level 1: Pricing Check */}
                                <div className="relative z-10 w-full max-w-2xl">
                                    <div className="border border-border bg-card p-4 rounded-xl text-center shadow-sm mx-auto w-64">
                                        <h4 className="font-semibold text-sm text-muted-foreground mb-1">Price Check</h4>
                                        <div className="font-bold text-lg">RCN Price &lt; $1500?</div>
                                        <div className="mt-2 text-xs text-primary font-mono">Current: ${marketConditions.rcnPrice}</div>
                                    </div>

                                    {/* Branches */}
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 h-8 w-full flex justify-between">
                                        <div className="w-1/2 h-full border-r border-t border-border rounded-tr-xl transform translate-x-0.5"></div>
                                        <div className="w-1/2 h-full border-l border-t border-border rounded-tl-xl transform -translate-x-0.5"></div>
                                    </div>
                                </div>

                                {/* Level 2: Conditional Branches */}
                                <div className="flex justify-between w-full max-w-2xl pt-8 gap-8">
                                    {/* Left Branch (Yes) */}
                                    <div className="flex flex-col items-center flex-1 relative">
                                        <Badge variant="outline" className="mb-2 bg-background border-success/50 text-success">YES</Badge>
                                        <div className="border border-border bg-card p-4 rounded-xl text-center shadow-sm w-full">
                                            <h4 className="font-semibold text-sm text-muted-foreground mb-1">Inventory Check</h4>
                                            <div className="font-bold">Inventory &lt; 2000 MT?</div>
                                        </div>

                                        {/* Sub-branch connectors */}
                                        <div className="h-8 w-full flex justify-between mt-0 relative">
                                            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-4 w-0.5 bg-border"></div>
                                            <div className="w-1/2 h-4 border-t border-border mt-4 ml-auto rounded-tr-lg"></div>
                                            <div className="w-1/2 h-4 border-t border-border mt-4 mr-auto rounded-tl-lg"></div>
                                            {/* Vertical drops */}
                                            <div className="absolute top-4 left-[25%] h-4 w-0.5 bg-border"></div>
                                            <div className="absolute top-4 right-[25%] h-4 w-0.5 bg-border"></div>
                                        </div>

                                        {/* Leaf Nodes Left */}
                                        <div className="flex justify-between w-full mt-4 gap-2">
                                            <div className="bg-success/10 border border-success/20 p-4 rounded-xl flex-1 text-center">
                                                <div className="flex justify-center mb-2"><CheckCircle className="h-6 w-6 text-success" /></div>
                                                <div className="font-bold text-success">STRONG BUY</div>
                                                <div className="text-xs text-muted-foreground mt-1">Accumulate aggressively</div>
                                            </div>
                                            <div className="bg-warning/10 border border-warning/20 p-4 rounded-xl flex-1 text-center">
                                                <div className="flex justify-center mb-2"><AlertTriangle className="h-6 w-6 text-warning" /></div>
                                                <div className="font-bold text-warning">WAIT</div>
                                                <div className="text-xs text-muted-foreground mt-1">Monitor trend</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Branch (No) */}
                                    <div className="flex flex-col items-center flex-1 relative">
                                        <Badge variant="outline" className="mb-2 bg-background border-destructive/50 text-destructive">NO</Badge>
                                        <div className="border border-border bg-card p-4 rounded-xl text-center shadow-sm w-full opacity-50">
                                            <h4 className="font-semibold text-sm text-muted-foreground mb-1">Demand Check</h4>
                                            <div className="font-bold">Global Demand High?</div>
                                        </div>

                                        <div className="h-8 w-0.5 bg-border border-dashed"></div>

                                        <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-xl w-full text-center">
                                            <div className="flex justify-center mb-2"><XCircle className="h-6 w-6 text-destructive" /></div>
                                            <div className="font-bold text-destructive">HOLD / SELL</div>
                                            <div className="text-xs text-muted-foreground mt-1">Reduce exposure</div>
                                        </div>
                                    </div>
                                </div>

                            </div>

                            <div className="mt-12 bg-muted/30 p-4 rounded-lg border border-border/50">
                                <h3 className="font-semibold mb-2 flex items-center gap-2">
                                    <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    AI Recommendation Logic
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    The current market condition triggers the <strong>Left Branch</strong> logic. Since RCN Price is $1450 (below $1500 threshold) and Inventory is detected as LOW, the system recommends a <strong className="text-success">STRONG BUY</strong> strategy to replenish stocks before inevitable seasonal price hikes.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </DashboardLayout>
        </>
    );
}
