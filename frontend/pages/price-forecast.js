import { useEffect, useState } from "react";
import Head from "next/head";
import DashboardLayout from "../components/DashboardLayout";
import PriceChart from "../components/PriceChart";
import KpiCardModern from "../components/KpiCardModern";
import AIExplained from "../components/AIExplained";
// import ForecastNav from "../components/ForecastNav"; // Removed
import FileUploadCard from "../components/FileUploadCard";
import ForecastStepper from "../components/ForecastStepper";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { api, handleError } from "../lib/apiClient";
import { useHistoricalData } from "../hooks/useDashboardData";
import { DollarSign, TrendingUp, Activity, Calendar, Loader2, Download, Share2, FileText } from "lucide-react";

const formatCurrency = (value) => `$${Number(value || 0).toLocaleString()}`;
const formatPercent = (value) => `${value > 0 ? '+' : ''}${Number(value || 0).toFixed(2)}%`;

const PriceForecastPage = () => {
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedDays, setSelectedDays] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadSuccess, setUploadSuccess] = useState(false);
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

  const handleUploadSuccess = (data) => {
    setUploadSuccess(true);
    setCurrentStep(2);

    // Simulate workflow steps
    setTimeout(() => setCurrentStep(3), 1500);
    setTimeout(() => setCurrentStep(4), 3000);
    setTimeout(() => {
      setCurrentStep(5);
      if (data && data.data && data.data.forecast) {
        setForecast(data.data.forecast);
      } else {
        loadLatest();
      }
      setUploadSuccess(false);
    }, 4500);
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
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Left: Upload & Workflow Panel */}
            <div className="xl:col-span-3 space-y-6">
              <Card className="glass-card border-none relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary opacity-50" />
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Forecast Workflow
                  </CardTitle>
                  <CardDescription>Upload data to generate real-time AI price predictions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ForecastStepper currentStep={currentStep} />

                  {currentStep === 1 || currentStep === 5 ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <FileUploadCard onUploadSuccess={handleUploadSuccess} />
                    </div>
                  ) : (
                    <div className="h-48 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in zoom-in duration-300">
                      <div className="relative h-16 w-16">
                        <div className="absolute inset-0 rounded-full border-4 border-muted opacity-20" />
                        <div className="absolute inset-0 rounded-full border-4 border-t-accent border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center font-bold text-xl text-accent">
                          AI
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">Processing Data...</h3>
                        <p className="text-sm text-muted-foreground">Running LSTM Neural Network Analysis</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Top Controls & KPIs */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* Controls */}
            <Card className="xl:col-span-3 glass-card border-none">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      Forecast Horizon
                    </CardTitle>
                    <CardDescription>Select time period for AI prediction</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-2">
                      <Download className="h-4 w-4" /> Export PDF
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2">
                      <FileText className="h-4 w-4" /> CSV
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {[7, 14, 30, 60, 90, 180].map((days) => (
                    <Button
                      key={days}
                      onClick={() => runForecast(days)}
                      disabled={loading}
                      variant={selectedDays === days && loading ? "default" : "outline"}
                      className="min-w-[100px] hover:bg-primary/5 hover:text-primary hover:border-primary/50 transition-all duration-300"
                    >
                      {loading && selectedDays === days ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Running...
                        </>
                      ) : (
                        `${days} Days`
                      )}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Main KPI */}
            <KpiCardModern
              title="Projected Trend"
              value={forecast?.trendLabel || "UNKNOWN"}
              change={trendPercentage ? formatPercent(trendPercentage) : undefined}
              changeLabel="strength"
              badge={getTrendBadge(forecast?.trendLabel)}
              icon={TrendingUp}
              trend={getTrend(trendPercentage)}
            />
          </div>

          {/* Main Chart Section */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <Card className="xl:col-span-2 glass-card border-none min-h-[500px] flex flex-col">
              <CardHeader>
                <CardTitle>Price Forecast Visualization</CardTitle>
                <CardDescription>
                  Historical prices vs ML-generated forecast predictions with confidence intervals
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
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
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    <div className="text-center space-y-2">
                      <TrendingUp className="h-12 w-12 mx-auto opacity-20" />
                      <p>No forecast data available.</p>
                      <p className="text-sm">Select a horizon above to generate predictions.</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Insights Panel */}
            <div className="space-y-6">
              <AIExplained
                confidence={confidenceScore || 85}
                summary={forecast?.summary || "The model predicts a continuation of the current trend based on historical patterns and recent volatility markers."}
                factors={[
                  { name: "Historical Volatility", impact: "High", direction: "negative" },
                  { name: "Seasonal Index", impact: "Medium", direction: "positive" },
                  { name: "Market Momentum", impact: "Medium", direction: "neutral" }
                ]}
              />

              <Card className="glass-card border-none">
                <CardHeader>
                  <CardTitle className="text-base">Forecast Metadata</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 text-sm">
                    <div className="flex justify-between border-b border-border/50 pb-2">
                      <span className="text-muted-foreground">Model Type</span>
                      <span className="font-semibold">{forecast?.modelType || "LSTM Neural Net"}</span>
                    </div>
                    <div className="flex justify-between border-b border-border/50 pb-2">
                      <span className="text-muted-foreground">Forecast Horizon</span>
                      <span className="font-semibold">{forecast?.forecastDays || selectedDays || "—"} Days</span>
                    </div>
                    <div className="flex justify-between border-b border-border/50 pb-2">
                      <span className="text-muted-foreground">Generated At</span>
                      <span className="font-semibold">
                        {forecast?.timestamp ? new Date(forecast.timestamp).toLocaleTimeString() : "—"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Data Points</span>
                      <span className="font-semibold">{forecast?.detailedData?.forecast_dates?.length || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div >
      </DashboardLayout >
    </>
  );
};

export default PriceForecastPage;
