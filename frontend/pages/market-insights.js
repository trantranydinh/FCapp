import Head from "next/head";
import DashboardLayout from "../components/DashboardLayout";
import KpiCardModern from "../components/KpiCardModern";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { useMarketSentiment } from "../hooks/useDashboardData";
import { TrendingUp, TrendingDown, Minus, BarChart3, Activity, AlertCircle } from "lucide-react";

const MarketInsightsPage = () => {
  const { data } = useMarketSentiment();

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
          {/* Sentiment Overview KPIs */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

          {/* Market Insights Feed */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Market Intelligence
              </CardTitle>
              <CardDescription>
                AI-generated insights and analysis from market data
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data?.insights && data.insights.length > 0 ? (
                <div className="space-y-4">
                  {data.insights.map((insight, index) => (
                    <div
                      key={insight.section || index}
                      className="rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold leading-tight">
                              {insight.headline}
                            </h3>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {insight.section}
                          </Badge>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {insight.summary}
                          </p>
                        </div>
                      </div>

                      {/* Metrics Footer */}
                      <div className="mt-3 flex items-center gap-4 border-t pt-3 text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="text-muted-foreground">Impact:</span>
                          <Badge variant={getImpactVariant(insight.impact_score)}>
                            {insight.impact_score?.toFixed(1) || "—"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-muted-foreground">Confidence:</span>
                          <span className="font-medium">
                            {Math.round((insight.confidence || 0) * 100)}%
                          </span>
                        </div>
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
