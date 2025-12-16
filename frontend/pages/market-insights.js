import Head from "next/head";
import DashboardLayout from "../components/DashboardLayout";
import KpiCardModern from "../components/KpiCardModern";
import MarketHeatmap from "../components/MarketHeatmap";
// import ForecastNav from "../components/ForecastNav"; // Removed
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { useMarketSentiment } from "../hooks/useDashboardData";
import { TrendingUp, TrendingDown, Minus, BarChart3, Activity, AlertCircle, PieChart, ArrowRight } from "lucide-react";

const MarketInsightsPage = () => {
  const { data: apiResponse } = useMarketSentiment();
  const data = apiResponse?.data; // Extract actual data from API response

  // Get sentiment badge
  const getSentimentBadge = (sentiment) => {
    if (!sentiment) return { label: "Unknown", variant: "outline" };

    const upper = sentiment.toUpperCase();
    if (upper === "POSITIVE" || upper === "BULLISH") {
      return { label: "Bullish", variant: "success" };
    } else if (upper === "NEGATIVE" || upper === "BEARISH") {
      return { label: "Bearish", variant: "destructive" };
    } else {
      return { label: "Neutral", variant: "outline" };
    }
  };

  // Get sentiment icon
  const getSentimentIcon = (sentiment) => {
    if (!sentiment) return Minus;
    const upper = sentiment.toUpperCase();
    if (upper === "POSITIVE" || upper === "BULLISH") return TrendingUp;
    if (upper === "NEGATIVE" || upper === "BEARISH") return TrendingDown;
    return Minus;
  };

  // Get impact badge variant
  const getImpactVariant = (score) => {
    if (score >= 7) return "destructive";
    if (score >= 4) return "warning";
    return "outline";
  };

  const confidencePercent = Math.round((data?.confidence || 0) * 100);
  const SentimentIcon = getSentimentIcon(data?.overall_sentiment);

  return (
    <>
      <Head>
        <title>Market Insights | Cashew Forecast</title>
      </Head>
      <DashboardLayout title="Market Insights">
        <div className="space-y-6">
          {/* ForecastNav removed */}

          {/* Top Section: KPIs & Heatmap */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Left: KPIs */}
            <div className="space-y-4">
              <KpiCardModern
                title="Overall Sentiment"
                value={data?.overall_sentiment || "NEUTRAL"}
                badge={getSentimentBadge(data?.overall_sentiment)}
                icon={SentimentIcon}
              />

              <KpiCardModern
                title="Sentiment Score"
                value={data?.sentiment_score ? data.sentiment_score.toFixed(2) : "—"}
                icon={BarChart3}
              />

              <KpiCardModern
                title="Confidence Level"
                value={data ? `${confidencePercent}%` : "—"}
                badge={
                  confidencePercent > 70
                    ? { label: "High", variant: "success" }
                    : confidencePercent > 50
                      ? { label: "Medium", variant: "outline" }
                      : { label: "Low", variant: "warning" }
                }
                icon={Activity}
              />
            </div>

            {/* Right: Market Heatmap */}
            <Card className="xl:col-span-2 glass-card border-none">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-primary" />
                  Sector Performance Heatmap
                </CardTitle>
                <CardDescription>Real-time volume and price change across cashew sectors</CardDescription>
              </CardHeader>
              <CardContent>
                <MarketHeatmap />
              </CardContent>
            </Card>
          </div>

          {/* Market Insights Feed */}
          <Card className="bg-card border border-border shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-primary" />
                AI Market Intelligence
              </CardTitle>
              <CardDescription>
                Deep-dive analysis generated from global trade data and news sources
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data?.insights && data.insights.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {data.insights.map((insight, index) => (
                    <div
                      key={insight.section || index}
                      className="rounded-xl border border-border/50 bg-white/50 dark:bg-slate-900/50 p-5 transition-all hover:bg-white/80 dark:hover:bg-slate-900/80 hover:shadow-md hover:border-primary/20 group flex flex-col h-full"
                    >
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold leading-tight text-lg group-hover:text-primary transition-colors">
                            {insight.headline}
                          </h3>
                          <Badge variant="outline" className="text-xs bg-background/50 backdrop-blur-sm">
                            {insight.section}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {insight.summary}
                        </p>
                      </div>

                      {/* Metrics Footer */}
                      <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3 text-xs">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1.5">
                            <span className="text-muted-foreground font-medium">Impact:</span>
                            <Badge variant={getImpactVariant(insight.impact_score)} className="shadow-sm h-5">
                              {insight.impact_score?.toFixed(1) || "—"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-muted-foreground font-medium">Confidence:</span>
                            <span className="font-bold text-primary">
                              {Math.round((insight.confidence || 0) * 100)}%
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-64 items-center justify-center text-muted-foreground">
                  <div className="text-center space-y-2">
                    <BarChart3 className="h-12 w-12 mx-auto opacity-20" />
                    <p>No market insights available.</p>
                    <p className="text-sm">Generate a forecast to see market analysis.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </>
  );
};

export default MarketInsightsPage;
