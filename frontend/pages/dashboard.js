import Head from "next/head";
import { useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import ParityTool from "../components/ParityTool";
import PriceChart from "../components/PriceChart";
import FileUploadCard from "../components/FileUploadCard";
import ForecastStepper from "../components/ForecastStepper";
import TrendMicroCard from "../components/TrendMicroCard";
import AIExplained from "../components/AIExplained";
import NewsWidget from "../components/NewsWidget";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useDashboardOverview, useHistoricalData, useNewsSummary } from "../hooks/useDashboardData";
import { api } from "../lib/apiClient";
import { RefreshCw, ArrowUpRight, Calendar, Download, Calculator, TrendingUp } from "lucide-react";

const DashboardPage = () => {
  const { data: overview, mutate: refreshOverview } = useDashboardOverview();
  const { data: history, mutate: refreshHistory } = useHistoricalData(12);
  const { data: newsData, mutate: refreshNewsList } = useNewsSummary();

  const [activeTab, setActiveTab] = useState("parity"); // Default to Parity Tool
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isRefreshingNews, setIsRefreshingNews] = useState(false);

  const metrics = overview?.data?.key_metrics;
  const forecast = overview?.data?.latest_forecast?.detailedData;

  const handleUploadSuccess = (data) => {
    setUploadSuccess(true);
    setCurrentStep(2);

    // Simulate workflow steps
    setTimeout(() => setCurrentStep(3), 1500);
    setTimeout(() => setCurrentStep(4), 3000);
    setTimeout(() => {
      setCurrentStep(5);
      refreshOverview();
      refreshHistory();
      setUploadSuccess(false);
    }, 4500);
  };

  const handleRefreshNews = async () => {
    setIsRefreshingNews(true);
    try {
      await api.post('/api/v1/dashboard/news-refresh');
      await refreshNewsList();
    } catch (error) {
      console.error("Failed to refresh news:", error);
    } finally {
      setIsRefreshingNews(false);
    }
  };

  const handleExportReport = async () => {
    try {
      const reportData = {
        trend: metrics?.trend || 'STABLE',
        confidence: metrics?.confidence || 85,
        currentPrice: metrics?.current_price || 145.20,
        priceChange: metrics?.price_change || 1.2,
        forecastPrice: forecast ? forecast[forecast.length - 1].price : 150.00,
        primaryDriver: 'Supply Chain Constraints',
        recommendation: metrics?.trend === 'UP' ? 'Increase Inventory' : 'Hold Position'
      };

      await api.post('/api/v1/dashboard/reports/generate', reportData);
      alert("Report generated successfully! (Check backend/outputs/reports)");
    } catch (error) {
      console.error("Failed to generate report:", error);
      alert("Failed to generate report");
    }
  };

  return (
    <>
      <Head>
        <title>Dashboard | Cashew Forecast AI</title>
      </Head>
      <DashboardLayout title="Dashboard">
        <div className="space-y-6">
          {/* Tab Navigation */}
          <Card className="glass-card border-none">
            <CardContent className="p-2">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab("parity")}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === "parity"
                      ? "bg-primary text-white shadow-md"
                      : "bg-transparent text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                >
                  <Calculator className="h-4 w-4" />
                  Parity Tool
                </button>
                <button
                  onClick={() => setActiveTab("forecast")}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === "forecast"
                      ? "bg-primary text-white shadow-md"
                      : "bg-transparent text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                >
                  <TrendingUp className="h-4 w-4" />
                  Price Forecast
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Tab Content */}
          {activeTab === "parity" ? (
            <ParityTool />
          ) : (
            <div className="space-y-8">
              {/* Top Section: Upload & Workflow + Mini KPIs */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Left: Upload & Workflow Panel */}
                <div className="xl:col-span-2 space-y-6">
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

                {/* Right: Mini KPI Bars */}
                <div className="space-y-4">
                  <TrendMicroCard
                    title="Market Trend"
                    value={metrics?.trend || "NEUTRAL"}
                    type="trend"
                    trend={metrics?.trend === "UP" ? "up" : metrics?.trend === "DOWN" ? "down" : "neutral"}
                  />
                  <TrendMicroCard
                    title="Volatility Index"
                    value="Moderate"
                    type="volatility"
                    score={45}
                  />
                  <TrendMicroCard
                    title="Model Confidence"
                    value="High"
                    type="confidence"
                    score={metrics?.confidence || 85}
                  />
                  <TrendMicroCard
                    title="Seasonality"
                    value="Peak Season"
                    subValue="Harvest approaching in Vietnam"
                    type="seasonal"
                  />
                </div>
              </div>

              {/* Middle Section: Main Chart & AI Insights */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Main Chart */}
                <Card className="xl:col-span-2 glass-card border-none min-h-[400px] flex flex-col">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div>
                      <CardTitle>Price Forecast Analysis</CardTitle>
                      <CardDescription>Historical data vs AI prediction (Next 12 Months)</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="h-8 gap-1" onClick={handleExportReport}>
                        <Download className="h-3 w-3" /> Export Report
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => refreshOverview()}>
                        <RefreshCw className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1">
                    {forecast || history?.data ? (
                      <PriceChart
                        forecast={forecast}
                        history={history?.data ? { dates: history.data.dates, prices: history.data.prices } : null}
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground">
                        Loading visualization...
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Right Column: AI Explained & News */}
                <div className="space-y-6">
                  <AIExplained
                    confidence={metrics?.confidence || 88}
                    summary="The model detects a bullish divergence in the 30-day moving average, suggesting upward price pressure due to supply constraints."
                  />
                  <NewsWidget
                    news={newsData?.data?.top_news}
                    onRefresh={handleRefreshNews}
                    isRefreshing={isRefreshingNews}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </>
  );
};

export default DashboardPage;
