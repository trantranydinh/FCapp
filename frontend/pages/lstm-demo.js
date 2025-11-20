import { useState } from 'react';
import Head from 'next/head';
import DashboardLayout from '../components/DashboardLayout';
import PriceChart from '../components/PriceChart';
import KpiCardModern from '../components/KpiCardModern';
import ModelArchitectureViewer from '../components/ModelArchitectureViewer';
import LossCurveChart from '../components/LossCurveChart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { DollarSign, TrendingUp, TrendingDown, Activity, Cpu, Loader2, AlertCircle, ChevronDown, Settings, Layers } from 'lucide-react';

/**
 * LSTM Demo Page
 * Simple interface to test the LSTM Golden Path
 */
export default function LSTMDemo() {
  const [loading, setLoading] = useState(false);
  const [forecast, setForecast] = useState(null);
  const [error, setError] = useState(null);
  const [forecastDays, setForecastDays] = useState(30);
  const [modelVersion, setModelVersion] = useState("v2.1.0 (Production)");

  const runLSTMForecast = async () => {
    setLoading(true);
    setError(null);
    setForecast(null);

    try {
      console.log(`[LSTM Demo] Calling API with ${forecastDays} days...`);

      // Mocking the API call for now to ensure UI works if backend isn't ready
      // In production, uncomment the fetch below
      /*
      const response = await fetch('http://localhost:5173/api/v1/lstm/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forecast_days: forecastDays })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'API request failed');
      }
      const result = await response.json();
      */

      // Mock response for UI demonstration
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate delay
      const basePrice = 145.50;
      const mockData = Array.from({ length: forecastDays }, (_, i) => {
        const price = basePrice * (1 + Math.sin(i / 5) * 0.05 + (i / 100));
        return {
          date: new Date(Date.now() + i * 86400000).toISOString().split('T')[0],
          predicted: price,
          lower: price * 0.95,
          upper: price * 1.05
        };
      });

      const result = {
        success: true,
        data: {
          modelName: "LSTM-Cashew-V2",
          modelType: "Bidirectional LSTM",
          basePrice: basePrice,
          finalPrice: mockData[mockData.length - 1].predicted,
          priceChange: ((mockData[mockData.length - 1].predicted - basePrice) / basePrice) * 100,
          trendLabel: "UP",
          confidence: 0.87,
          detailedData: mockData
        }
      };

      if (result.success && result.data) {
        setForecast(result.data);
      } else {
        throw new Error('Invalid response format');
      }

    } catch (err) {
      console.error('[LSTM Demo] Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const TrendIcon = forecast?.trendLabel === 'UP' ? TrendingUp : forecast?.trendLabel === 'DOWN' ? TrendingDown : Activity;
  const trendBadge = forecast?.trendLabel === 'UP'
    ? { label: 'Bullish', variant: 'success' }
    : forecast?.trendLabel === 'DOWN'
      ? { label: 'Bearish', variant: 'destructive' }
      : { label: 'Neutral', variant: 'outline' };

  // Prepare data for PriceChart
  const chartProps = forecast ? {
    historyDates: ["2023-01-01", "2023-01-02", "2023-01-03"], // Mock history for now
    historyPrices: [140, 142, 145.5], // Mock history for now
    forecast: {
      forecast_dates: forecast.detailedData.map(d => d.date),
      median_prices: forecast.detailedData.map(d => d.predicted),
      upper_band: forecast.detailedData.map(d => d.upper),
      lower_band: forecast.detailedData.map(d => d.lower)
    }
  } : null;

  return (
    <>
      <Head>
        <title>LSTM Model Lab | Cashew Forecast</title>
      </Head>
      <DashboardLayout title="LSTM Model Lab">
        <div className="space-y-6">

          {/* Controls Section */}
          <Card className="glass-card border-none">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-primary" />
                    Model Configuration
                  </CardTitle>
                  <CardDescription>Configure parameters for the LSTM neural network</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="h-8 px-3 gap-1 bg-background/50">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    GPU Active
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-end gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Model Version</label>
                  <div className="relative">
                    <select
                      className="h-10 w-48 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={modelVersion}
                      onChange={(e) => setModelVersion(e.target.value)}
                    >
                      <option>v2.1.0 (Production)</option>
                      <option>v2.2.0-beta (Exp)</option>
                      <option>v1.5.4 (Legacy)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Forecast Horizon (Days)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="7"
                      max="90"
                      step="1"
                      value={forecastDays}
                      onChange={(e) => setForecastDays(Number(e.target.value))}
                      className="w-32 accent-primary"
                    />
                    <span className="w-12 text-center font-mono text-sm border rounded px-1 py-0.5 bg-background/50">
                      {forecastDays}d
                    </span>
                  </div>
                </div>

                <Button
                  onClick={runLSTMForecast}
                  disabled={loading}
                  className="min-w-[160px]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Training...
                    </>
                  ) : (
                    <>
                      <Cpu className="mr-2 h-4 w-4" />
                      Run Inference
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Main Content Area */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

            {/* Left Column: Architecture & Loss */}
            <div className="space-y-6 xl:col-span-1">
              <ModelArchitectureViewer />
              <LossCurveChart />
            </div>

            {/* Right Column: Results & Chart */}
            <div className="space-y-6 xl:col-span-2">

              {/* KPI Grid */}
              {forecast && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <KpiCardModern
                    title="Base Price"
                    value={`$${forecast.basePrice.toFixed(2)}`}
                    icon={DollarSign}
                  />
                  <KpiCardModern
                    title="Final Price"
                    value={`$${forecast.finalPrice.toFixed(2)}`}
                    icon={DollarSign}
                  />
                  <KpiCardModern
                    title="Trend"
                    value={forecast.trendLabel}
                    change={`${forecast.priceChange > 0 ? '+' : ''}${forecast.priceChange.toFixed(2)}%`}
                    badge={trendBadge}
                    icon={TrendIcon}
                    trend={forecast.trendLabel === 'UP' ? 'up' : forecast.trendLabel === 'DOWN' ? 'down' : 'neutral'}
                  />
                  <KpiCardModern
                    title="Confidence"
                    value={`${(forecast.confidence * 100).toFixed(0)}%`}
                    badge={{ label: 'High', variant: 'success' }}
                    icon={Activity}
                  />
                </div>
              )}

              {/* Main Chart */}
              <Card className="glass-card border-none min-h-[400px] flex flex-col">
                <CardHeader>
                  <CardTitle>Prediction vs Actual</CardTitle>
                  <CardDescription>
                    Model performance comparison on test set + future forecast
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  {forecast ? (
                    <PriceChart {...chartProps} />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      <div className="text-center space-y-2">
                        <Layers className="h-12 w-12 mx-auto opacity-20" />
                        <p>Ready to train model.</p>
                        <p className="text-sm">Configure parameters and click "Run Inference"</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* JSON Output (Collapsible) */}
              {forecast && (
                <details className="group">
                  <summary className="cursor-pointer list-none">
                    <Card className="transition-colors group-hover:bg-accent/50 border-dashed">
                      <CardHeader className="py-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-mono flex items-center gap-2">
                            <span className="text-muted-foreground">{`{ }`}</span>
                            Raw Inference Output
                          </CardTitle>
                          <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                        </div>
                      </CardHeader>
                    </Card>
                  </summary>
                  <Card className="mt-2 border-none bg-slate-950 text-slate-50">
                    <CardContent className="pt-4">
                      <pre className="overflow-auto text-xs font-mono max-h-64">
                        {JSON.stringify(forecast, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                </details>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}
