import { useState } from 'react';
import Head from 'next/head';
import DashboardLayout from '../components/DashboardLayout';
import PriceChart from '../components/PriceChart';
import KpiCardModern from '../components/KpiCardModern';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { DollarSign, TrendingUp, TrendingDown, Activity, Cpu, Loader2, AlertCircle, ChevronDown } from 'lucide-react';

/**
 * LSTM Demo Page
 * Simple interface to test the LSTM Golden Path
 */
export default function LSTMDemo() {
  const [loading, setLoading] = useState(false);
  const [forecast, setForecast] = useState(null);
  const [error, setError] = useState(null);
  const [forecastDays, setForecastDays] = useState(60);

  const runLSTMForecast = async () => {
    setLoading(true);
    setError(null);
    setForecast(null);

    try {
      console.log(`[LSTM Demo] Calling API with ${forecastDays} days...`);

      const response = await fetch('http://localhost:5173/api/v1/lstm/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          forecast_days: forecastDays
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'API request failed');
      }

      const result = await response.json();
      console.log('[LSTM Demo] Received forecast:', result);

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

  // Prepare chart data if forecast is available
  const prepareChartData = () => {
    if (!forecast || !forecast.detailedData) return null;

    // Historical data (we'll use a placeholder for now)
    const historicalLabels = [];
    const historicalPrices = [];

    // Add base price as last historical point
    historicalLabels.push('Base');
    historicalPrices.push(forecast.basePrice);

    // Forecast data
    const forecastLabels = forecast.detailedData.map((d, idx) => `Day ${idx + 1}`);
    const forecastPrices = forecast.detailedData.map(d => d.predicted);
    const lowerBand = forecast.detailedData.map(d => d.lower);
    const upperBand = forecast.detailedData.map(d => d.upper);

    return {
      labels: [...historicalLabels, ...forecastLabels],
      datasets: [
        {
          label: 'Historical',
          data: [...historicalPrices, ...Array(forecastPrices.length).fill(null)],
          borderColor: '#666',
          backgroundColor: '#666',
          borderWidth: 2,
          pointRadius: 3
        },
        {
          label: 'Forecast',
          data: [...Array(historicalLabels.length).fill(null), ...forecastPrices],
          borderColor: '#dc2626',
          backgroundColor: '#dc2626',
          borderWidth: 2,
          pointRadius: 3
        },
        {
          label: 'Upper Bound',
          data: [...Array(historicalLabels.length).fill(null), ...upperBand],
          borderColor: 'rgba(220, 38, 38, 0.3)',
          backgroundColor: 'rgba(220, 38, 38, 0.1)',
          borderWidth: 1,
          borderDash: [5, 5],
          fill: false,
          pointRadius: 0
        },
        {
          label: 'Lower Bound',
          data: [...Array(historicalLabels.length).fill(null), ...lowerBand],
          borderColor: 'rgba(220, 38, 38, 0.3)',
          backgroundColor: 'rgba(220, 38, 38, 0.1)',
          borderWidth: 1,
          borderDash: [5, 5],
          fill: false,
          pointRadius: 0
        }
      ]
    };
  };

  const TrendIcon = forecast?.trendLabel === 'UP' ? TrendingUp : forecast?.trendLabel === 'DOWN' ? TrendingDown : Activity;
  const trendBadge = forecast?.trendLabel === 'UP'
    ? { label: 'Bullish', variant: 'success' }
    : forecast?.trendLabel === 'DOWN'
    ? { label: 'Bearish', variant: 'destructive' }
    : { label: 'Neutral', variant: 'outline' };

  return (
    <>
      <Head>
        <title>LSTM Demo | Cashew Forecast</title>
      </Head>
      <DashboardLayout title="LSTM Demo">
        <div className="space-y-6">
          {/* Info Banner */}
          <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                <Cpu className="h-6 w-6 text-primary" />
                <h2 className="text-lg font-semibold text-primary">
                  LSTM Neural Network Forecasting
                </h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Test the complete LSTM Golden Path: Frontend → API → Application → Domain → Infrastructure → Python LSTM
              </p>
            </CardContent>
          </Card>

          {/* Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="h-5 w-5" />
                Forecast Configuration
              </CardTitle>
              <CardDescription>
                Configure and run LSTM-based price predictions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-end gap-4">
                <div className="space-y-2">
                  <label htmlFor="forecastDays" className="text-sm font-medium">
                    Forecast Days
                  </label>
                  <input
                    id="forecastDays"
                    type="number"
                    min="1"
                    max="90"
                    value={forecastDays}
                    onChange={(e) => setForecastDays(Number(e.target.value))}
                    disabled={loading}
                    className="flex h-10 w-24 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                <Button
                  onClick={runLSTMForecast}
                  disabled={loading}
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Running LSTM...
                    </>
                  ) : (
                    <>
                      <Cpu className="mr-2 h-4 w-4" />
                      Run LSTM Forecast
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Loading State */}
          {loading && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center gap-3">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  <div>
                    <p className="font-semibold text-blue-900">Processing LSTM Forecast...</p>
                    <p className="text-sm text-blue-700">This may take up to 2 minutes. Training 3 LSTM networks...</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error State */}
          {error && !loading && (
            <Card className="bg-red-50 border-red-200">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-900 mb-1">Error</p>
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Forecast Results */}
          {forecast && !loading && (
            <>
              {/* KPI Cards */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Model</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold">{forecast.modelName}</div>
                    <p className="text-xs text-muted-foreground mt-1">{forecast.modelType}</p>
                  </CardContent>
                </Card>

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
                  badge={
                    forecast.confidence > 0.7
                      ? { label: 'High', variant: 'success' }
                      : forecast.confidence > 0.5
                      ? { label: 'Medium', variant: 'outline' }
                      : { label: 'Low', variant: 'warning' }
                  }
                  icon={Activity}
                />
              </div>

              {/* Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Price Forecast Visualization</CardTitle>
                  <CardDescription>
                    LSTM-generated forecast with confidence bands
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {prepareChartData() && <PriceChart data={prepareChartData()} />}
                </CardContent>
              </Card>

              {/* JSON Output (collapsible) */}
              <details className="group">
                <summary className="cursor-pointer list-none">
                  <Card className="transition-colors group-hover:bg-accent/50">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Raw JSON Output</CardTitle>
                        <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" />
                      </div>
                    </CardHeader>
                  </Card>
                </summary>
                <Card className="mt-2">
                  <CardContent className="pt-6">
                    <pre className="bg-muted p-4 rounded-lg overflow-auto text-xs max-h-96">
                      {JSON.stringify(forecast, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              </details>
            </>
          )}

          {/* Empty State */}
          {!forecast && !loading && !error && (
            <Card className="border-dashed border-2">
              <CardContent className="pt-16 pb-16">
                <div className="text-center space-y-4">
                  <div className="text-6xl">🚀</div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">
                      Ready to Run LSTM Forecast
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                      Click "Run LSTM Forecast" above to execute the full LSTM Golden Path:<br />
                      Frontend → API → Application → Domain → Infrastructure → Python LSTM
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DashboardLayout>
    </>
  );
}
