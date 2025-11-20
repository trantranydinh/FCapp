import { useEffect, useState } from "react";
import Head from "next/head";
import DashboardLayout from "../components/DashboardLayout";
import PriceChart from "../components/PriceChart";
import KpiCardModern from "../components/KpiCardModern";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { api, handleError } from "../lib/apiClient";
import { useHistoricalData } from "../hooks/useDashboardData";
import { DollarSign, TrendingUp, Activity, Calendar, Loader2 } from "lucide-react";

const formatCurrency = (value) => `$${Number(value || 0).toLocaleString()}`;
const formatPercent = (value) => `${value > 0 ? '+' : ''}${Number(value || 0).toFixed(2)}%`;

const PriceForecastPage = () => {
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedDays, setSelectedDays] = useState(null);
  const { data: history } = useHistoricalData(12);

  const loadLatest = async () => {
    try {
      const response = await api.get("/api/v1/price/latest");
      setForecast(response.data);
    } catch (error) {
      console.error(handleError(error));
    }
  };

  useEffect(() => {
    loadLatest();
  }, []);

  const runForecast = async (days) => {
    try {
      setLoading(true);
      setSelectedDays(days);
      const response = await api.post("/api/v1/price/run-forecast", { forecast_days: days });
      setForecast(response.data);
    } catch (error) {
      console.error(handleError(error));
    } finally {
      setLoading(false);
    }
  };

  // Get trend direction
  const getTrend = (percentage) => {
    if (!percentage) return "neutral";
    return percentage > 0 ? "up" : percentage < 0 ? "down" : "neutral";
  };

  // Get trend badge
  const getTrendBadge = (label) => {
    if (!label) return { label: "Unknown", variant: "outline" };

    if (label === "UP" || label === "BULLISH") {
      return { label: "Bullish", variant: "success" };
    } else if (label === "DOWN" || label === "BEARISH") {
      return { label: "Bearish", variant: "destructive" };
    } else {
      return { label: "Neutral", variant: "outline" };
    }
  };

  const confidenceScore = Math.round((forecast?.confidenceScore || 0) * 100);
  const trendPercentage = (forecast?.trendPercentage || 0) * 100;

  return (
    <>
      <Head>
        <title>Price Forecast | Cashew Forecast</title>
      </Head>
      <DashboardLayout title="Price Forecast">
        <div className="space-y-6">
          {/* Forecast Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Generate New Forecast
              </CardTitle>
              <CardDescription>
                Run ML-powered price predictions for different time horizons
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {[14, 30, 60, 90].map((days) => (
                  <Button
                    key={days}
                    onClick={() => runForecast(days)}
                    disabled={loading}
                    variant={selectedDays === days && loading ? "default" : "outline"}
                    className="min-w-[120px]"
                  >
                    {loading && selectedDays === days ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Running...
                      </>
                    ) : (
                      `Forecast ${days}d`
                    )}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* KPI Metrics */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <KpiCardModern
              title="Base Price"
              value={forecast?.basePrice ? formatCurrency(forecast.basePrice) : "—"}
              icon={DollarSign}
            />

            <KpiCardModern
              title="Trend Direction"
              value={forecast?.trendLabel || "UNKNOWN"}
              change={trendPercentage ? formatPercent(trendPercentage) : undefined}
              changeLabel="trend strength"
              badge={getTrendBadge(forecast?.trendLabel)}
              icon={TrendingUp}
              trend={getTrend(trendPercentage)}
            />

            <KpiCardModern
              title="Confidence Score"
              value={forecast ? `${confidenceScore}%` : "—"}
              badge={
                confidenceScore > 70
                  ? { label: "High", variant: "success" }
                  : confidenceScore > 50
                  ? { label: "Medium", variant: "outline" }
                  : { label: "Low", variant: "warning" }
              }
              icon={Activity}
            />
          </div>

          {/* Forecast Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Price Forecast Visualization</CardTitle>
              <CardDescription>
                Historical prices vs ML-generated forecast predictions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {forecast?.detailedData || history?.data?.dates ? (
                <PriceChart
                  history={
                    history?.data?.dates
                      ? {
                          dates: history.data.dates,
                          prices: history.data.prices
                        }
                      : undefined
                  }
                  forecast={forecast?.detailedData}
                />
              ) : (
                <div className="flex h-80 items-center justify-center text-muted-foreground">
                  <div className="text-center space-y-2">
                    <TrendingUp className="h-12 w-12 mx-auto opacity-20" />
                    <p>No forecast data available.</p>
                    <p className="text-sm">Click a button above to generate a forecast.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Forecast Metadata */}
          {forecast && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Forecast Metadata</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Model Type</p>
                    <p className="font-semibold">{forecast.modelType || "LSTM"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Forecast Days</p>
                    <p className="font-semibold">{forecast.forecastDays || selectedDays || "—"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Generated At</p>
                    <p className="font-semibold">
                      {forecast.timestamp ? new Date(forecast.timestamp).toLocaleString() : "—"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Data Points</p>
                    <p className="font-semibold">{forecast.detailedData?.length || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DashboardLayout>
    </>
  );
};

export default PriceForecastPage;
