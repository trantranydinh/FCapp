import { useState } from 'react';
import Layout from '../components/Layout';
import PriceChart from '../components/PriceChart';

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

  return (
    <Layout>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '10px' }}>
          LSTM Forecast Demo
        </h1>
        <p style={{ color: '#666', marginBottom: '30px' }}>
          Test the LSTM Golden Path: Infrastructure → Domain → Application → API → Frontend
        </p>

        {/* Controls */}
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Forecast Days:
              </label>
              <input
                type="number"
                min="1"
                max="90"
                value={forecastDays}
                onChange={(e) => setForecastDays(Number(e.target.value))}
                style={{
                  padding: '8px 12px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '14px',
                  width: '100px'
                }}
                disabled={loading}
              />
            </div>

            <button
              onClick={runLSTMForecast}
              disabled={loading}
              style={{
                padding: '10px 24px',
                background: loading ? '#9ca3af' : '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: 'auto'
              }}
            >
              {loading ? 'Running LSTM...' : 'Run LSTM Forecast'}
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div style={{
            background: '#eff6ff',
            border: '2px solid #3b82f6',
            borderRadius: '8px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>
              Processing LSTM Forecast...
            </div>
            <div style={{ color: '#666' }}>
              This may take up to 2 minutes. Training 3 LSTM networks...
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div style={{
            background: '#fee2e2',
            border: '2px solid #dc2626',
            borderRadius: '8px',
            padding: '20px'
          }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px', color: '#dc2626' }}>
              Error
            </div>
            <div style={{ color: '#666' }}>{error}</div>
          </div>
        )}

        {/* Forecast Results */}
        {forecast && !loading && (
          <div>
            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
              <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Model</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{forecast.modelName}</div>
                <div style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>{forecast.modelType}</div>
              </div>

              <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Base Price</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>${forecast.basePrice.toFixed(2)}</div>
              </div>

              <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Final Price</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>${forecast.finalPrice.toFixed(2)}</div>
              </div>

              <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Trend</div>
                <div style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: forecast.trendLabel === 'UP' ? '#16a34a' : forecast.trendLabel === 'DOWN' ? '#dc2626' : '#666'
                }}>
                  {forecast.trendLabel}
                </div>
                <div style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>
                  {forecast.priceChange > 0 ? '+' : ''}{forecast.priceChange.toFixed(2)}%
                </div>
              </div>

              <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Confidence</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                  {(forecast.confidence * 100).toFixed(0)}%
                </div>
              </div>
            </div>

            {/* Chart */}
            <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>
                Price Forecast Chart
              </h3>
              {prepareChartData() && <PriceChart data={prepareChartData()} />}
            </div>

            {/* JSON Output (collapsible) */}
            <details style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <summary style={{ fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '10px' }}>
                Raw JSON Output
              </summary>
              <pre style={{
                background: '#f9fafb',
                padding: '15px',
                borderRadius: '6px',
                overflow: 'auto',
                fontSize: '12px',
                maxHeight: '400px'
              }}>
                {JSON.stringify(forecast, null, 2)}
              </pre>
            </details>
          </div>
        )}

        {/* Info Section */}
        {!forecast && !loading && !error && (
          <div style={{
            background: '#f9fafb',
            border: '2px dashed #e5e7eb',
            borderRadius: '8px',
            padding: '40px',
            textAlign: 'center',
            color: '#666'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>🚀</div>
            <div style={{ fontSize: '18px', marginBottom: '10px' }}>
              Click "Run LSTM Forecast" to start
            </div>
            <div style={{ fontSize: '14px' }}>
              This will execute the full LSTM Golden Path:<br />
              Frontend → API → Application → Domain → Infrastructure → Python LSTM
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
