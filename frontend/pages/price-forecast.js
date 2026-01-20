import { useEffect, useState } from "react";
import Head from "next/head";
import DashboardLayout from "../components/DashboardLayout";
import PriceChart from "../components/PriceChart";
import KpiCardModern from "../components/KpiCardModern";
import AIExplained from "../components/AIExplained";
import ExecutiveOverview from "../components/ExecutiveOverview";
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
  const [dataSource, setDataSource] = useState('upload'); // 'upload' | 'lakehouse'
  const { data: history, mutate: refreshHistory } = useHistoricalData(0); // Show ALL data by default

  const syncLakehouse = async () => {
    try {
      setLoading(true);

      // 1. Sync Data from Lakehouse
      const syncResponse = await api.post("/api/v1/price/sync-lakehouse", {}, { timeout: 120000 });
      const data = syncResponse.data;

      // Handle Device Code Auth Request
      if (data && data.isAuthRequired) {
        const { userCode, verificationUri } = data;
        // Show interactive prompt
        const shouldOpen = window.confirm(
          `Authentication Required (Microsoft Device Login)\n\n` +
          `1. Copy this code: ${userCode}\n` +
          `2. Click OK to open the login page.\n` +
          `3. Paste the code and sign in.\n\n` +
          `After you finish signing in, click the 'Fetch Data' button again.`
        );

        if (shouldOpen) {
          window.open(verificationUri, '_blank');
        }
        return;
      }

      if (data && data.success) {
        // 2. Automatically Run Forecast on the new data
        const days = selectedDays || 30;
        const forecastResponse = await api.post("/api/v1/price/run-forecast", { forecast_days: days });

        // 3. Trigger Visual Success Workflow
        handleUploadSuccess({ data: { forecast: forecastResponse.data.data } });

        // 4. Refresh historical background data
        refreshHistory();

        // Optional: Browser notification
        if (typeof window !== 'undefined') {
          window.alert(`Successfully synced ${data.data?.totalRows || ''} rows from Fabric Lakehouse.\nForecast updated.`);
        }
      }
    } catch (error) {
      console.error(handleError(error));
      if (typeof window !== 'undefined') {
        const msg = error.response?.data?.message || error.message || "Unknown error";
        // Ignore "Response Sent" error if it leaks
        if (!msg.includes('RESPONSE_SENT')) {
          window.alert("Lakehouse Sync Failed: " + msg);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const loadLatest = async () => {
    try {
      const response = await api.get("/api/v1/price/latest");
      setForecast(response.data);
    } catch (error) {
      // Ignore 404 if no forecast exists yet
      if (error.response && error.response.status === 404) {
        setForecast(null);
        return;
      }
      console.error(() => handleError(error)); // Use callback or just log message to avoid throwing in render loop? 
      // Actually handleError throws. We should simple log it here to avoid crashing the app.
      console.warn("Failed to load latest forecast:", error.message);
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
      if (response.data && response.data.success) {
        setForecast(response.data.data);
      }
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
        <div className="space-y-8">
          {/* Executive Signal Deck */}
          <ExecutiveOverview />

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Left: Upload & Workflow Panel */}
            <div className="xl:col-span-3 space-y-6">
              <Card className="bg-card border border-border shadow-none relative overflow-hidden">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Forecast Workflow
                  </CardTitle>
                  <CardDescription>Upload data to generate real-time AI price predictions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ForecastStepper currentStep={currentStep} />

                  {/* Data Source Selection */}
                  {(currentStep === 1 || currentStep === 5) && (
                    <div className="flex flex-col space-y-4">

                      <div className="flex justify-center pb-2">
                        <div className="bg-muted p-1 rounded-lg flex gap-1">
                          <Button
                            variant={dataSource === 'upload' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setDataSource('upload')}
                            className="w-32"
                          >
                            Upload File
                          </Button>
                          <Button
                            variant={dataSource === 'lakehouse' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setDataSource('lakehouse')}
                            className="w-32 gap-2"
                          >
                            Lakehouse
                          </Button>
                        </div>
                      </div>

                      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {dataSource === 'upload' ? (
                          <FileUploadCard onUploadSuccess={handleUploadSuccess} />
                        ) : (
                          <Card className="border-dashed border-2 border-border/50 bg-accent/5">
                            <CardContent className="flex flex-col items-center justify-center py-10 text-center space-y-4">
                              <div className="bg-primary/10 p-4 rounded-full">
                                <Share2 className="h-8 w-8 text-primary" />
                              </div>
                              <div className="space-y-2">
                                <h3 className="font-semibold text-lg">Connect to Fabric Lakehouse</h3>
                                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                                  Securely fetch the latest market pricing data directly from your organizational OneLake / SQL Endpoint.
                                </p>
                              </div>
                              <Button
                                onClick={syncLakehouse}
                                size="lg"
                                className="w-48 gap-2"
                                disabled={loading}
                              >
                                {loading ? (
                                  <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Syncing...
                                  </>
                                ) : (
                                  <>
                                    <Download className="h-4 w-4" />
                                    Fetch Data
                                  </>
                                )}
                              </Button>
                              <p className="text-xs text-muted-foreground pt-2">
                                Source: <strong>Production Lakehouse (SQL)</strong>
                              </p>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Processing State (Steps 2-4) */}
                  {(currentStep > 1 && currentStep < 5) && (
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

              <Card className="bg-card border border-border shadow-none">
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
