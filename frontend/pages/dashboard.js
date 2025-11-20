import Head from "next/head";
import { useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import KpiCardModern from "../components/KpiCardModern";
import PriceChart from "../components/PriceChart";
import FileUploadCard from "../components/FileUploadCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { useDashboardOverview, useHistoricalData } from "../hooks/useDashboardData";
import { DollarSign, TrendingUp, Activity, RefreshCw } from "lucide-react";

const formatCurrency = (value) => `$${Number(value || 0).toLocaleString()}`;
const formatPercent = (value) => `${value > 0 ? '+' : ''}${Number(value || 0).toFixed(2)}%`;

const DashboardPage = () => {
  const { data: overview, mutate: refreshOverview, isLoading } = useDashboardOverview();
  const { data: history, mutate: refreshHistory } = useHistoricalData(12);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const metrics = overview?.data?.key_metrics;
  const forecast = overview?.data?.latest_forecast?.detailedData;
  const apiUsage = overview?.data?.api_usage_summary;

  const handleUploadSuccess = (data) => {
    setUploadSuccess(true);
    refreshOverview();
    refreshHistory();
    setTimeout(() => setUploadSuccess(false), 3000);
  };

  // Determine trend direction
  const getTrend = (percentage) => {
    if (!percentage) return "neutral";
    return percentage > 0 ? "up" : percentage < 0 ? "down" : "neutral";
  };

  // Get risk badge
  const getRiskBadge = (trend, confidence) => {
    if (!trend || !confidence) return { label: "No Data", variant: "outline" };

    if (confidence > 70) {
      return { label: "Low Risk", variant: "success" };
    } else if (confidence > 50) {
      return { label: "Watch", variant: "warning" };
    } else {
      return { label: "High Risk", variant: "destructive" };
    }
  };

  return (
    <>
      <Head>
        <title>Dashboard | Cashew Forecast</title>
      </Head>
      <DashboardLayout title="Dashboard">
        <div className="space-y-6">
          {/* Upload Success Alert */}
          {uploadSuccess && (
            <div className="rounded-lg border border-emerald-500 bg-emerald-50 p-4 text-emerald-900">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full bg-emerald-500" />
                <p className="font-semibold">Forecast updated successfully! Dashboard data refreshed.</p>
              </div>
            </div>
          )}

          {/* File Upload Section */}
          <FileUploadCard onUploadSuccess={handleUploadSuccess} />

          {/* KPI Cards Grid */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCardModern
              title="Current Price"
              value={metrics?.current_price ? formatCurrency(metrics.current_price) : "—"}
              change={metrics?.trend_percentage ? formatPercent(metrics.trend_percentage) : undefined}
              changeLabel="trend"
              badge={getRiskBadge(metrics?.trend, metrics?.confidence)}
              icon={DollarSign}
              trend={getTrend(metrics?.trend_percentage)}
            />

            <KpiCardModern
              title="Next 7D Forecast"
              value={metrics?.forecasts?.['7d']?.price ? formatCurrency(metrics.forecasts['7d'].price) : "—"}
              change={metrics?.forecasts?.['7d']?.change_percent ? formatPercent(metrics.forecasts['7d'].change_percent) : undefined}
              icon={TrendingUp}
              trend={getTrend(metrics?.forecasts?.['7d']?.change_percent)}
            />

            <KpiCardModern
              title="Confidence Score"
              value={metrics?.confidence ? `${metrics.confidence}%` : "—"}
              badge={
                metrics?.confidence > 70
                  ? { label: "High", variant: "success" }
                  : metrics?.confidence > 50
                  ? { label: "Medium", variant: "outline" }
                  : { label: "Low", variant: "warning" }
              }
              icon={Activity}
            />

            <KpiCardModern
              title="Trend Direction"
              value={metrics?.trend || "UNKNOWN"}
              badge={
                metrics?.trend === "UP"
                  ? { label: "Bullish", variant: "success" }
                  : metrics?.trend === "DOWN"
                  ? { label: "Bearish", variant: "destructive" }
                  : { label: "Neutral", variant: "outline" }
              }
              icon={TrendingUp}
              trend={
                metrics?.trend === "UP"
                  ? "up"
                  : metrics?.trend === "DOWN"
                  ? "down"
                  : "neutral"
              }
            />
          </div>

          {/* Latest Forecast Snapshot */}
          <Card className="xl:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Latest Forecast Snapshot</CardTitle>
                  <CardDescription className="mt-1">
                    {metrics?.last_updated
                      ? `Updated ${new Date(metrics.last_updated).toLocaleTimeString()}`
                      : "No forecast available"}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => refreshOverview()}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {forecast ? (
                <PriceChart forecast={forecast} />
              ) : (
                <div className="flex h-64 items-center justify-center text-muted-foreground">
                  <p>No forecast data available. Upload a file to generate a forecast.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Price History Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Price History & Forecast</CardTitle>
              <CardDescription>Historical prices vs forecast predictions (12 months)</CardDescription>
            </CardHeader>
            <CardContent>
              {history?.data?.dates && history.data.dates.length > 0 ? (
                <PriceChart
                  history={{
                    dates: history.data.dates,
                    prices: history.data.prices
                  }}
                  forecast={forecast}
                />
              ) : (
                <div className="flex h-64 items-center justify-center text-muted-foreground">
                  <p>Loading historical data...</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* System Status */}
          {apiUsage && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">API Usage Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Total Calls</p>
                    <p className="text-2xl font-semibold">{apiUsage.total_calls || 0}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Total Tokens</p>
                    <p className="text-2xl font-semibold">{apiUsage.total_tokens?.toLocaleString() || 0}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Total Cost</p>
                    <p className="text-2xl font-semibold">${(apiUsage.total_cost || 0).toFixed(4)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Providers</p>
                    <div className="flex gap-2 mt-2">
                      {Object.keys(apiUsage.providers || {}).map((provider) => (
                        <Badge key={provider} variant="outline">
                          {provider}
                        </Badge>
                      ))}
                      {Object.keys(apiUsage.providers || {}).length === 0 && (
                        <Badge variant="outline">None</Badge>
                      )}
                    </div>
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

export default DashboardPage;
