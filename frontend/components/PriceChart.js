import { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from "chart.js";
import { Line } from "react-chartjs-2";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const PriceChart = ({ historyDates = [], historyPrices = [], forecast }) => {
  const [isMounted, setIsMounted] = useState(false);

  // Handle Next.js SSR - only render chart on client side
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Safe data validation
  const hasHistoricalData = historyDates?.length > 0 && historyPrices?.length > 0;
  const hasForecastData =
    forecast?.forecast_dates?.length > 0 &&
    forecast?.median_prices?.length > 0;

  // Don't render until mounted (client-side only)
  if (!isMounted) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "300px",
        color: "#6b7280"
      }}>
        Loading chart...
      </div>
    );
  }

  // Show message if no data
  if (!hasHistoricalData && !hasForecastData) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "300px",
        color: "#6b7280"
      }}>
        No data available for chart
      </div>
    );
  }

  // Build labels safely
  const labels = [...(historyDates || [])];

  // Initialize datasets array
  const datasets = [];

  // Add historical data with RED as main theme
  if (hasHistoricalData) {
    datasets.push({
      label: "Historical",
      data: historyPrices,
      borderColor: "#ef4444", // RED main color
      backgroundColor: "rgba(239, 68, 68, 0.2)", // RED with transparency
      tension: 0.3,
      fill: false,
      pointRadius: 2,
      pointHoverRadius: 5,
      pointBackgroundColor: "#ef4444",
      pointBorderColor: "#fff",
      pointBorderWidth: 2
    });
  }

  // Add forecast data if available
  if (hasForecastData) {
    labels.push(...forecast.forecast_dates);

    // Forecast median line
    datasets.push({
      label: "Forecast (median)",
      data: [
        ...Array(historyPrices?.length || 0).fill(null),
        ...(forecast.median_prices || [])
      ],
      borderColor: "#dc2626", // Darker RED for forecast
      backgroundColor: "rgba(220, 38, 38, 0.2)",
      tension: 0.3,
      borderDash: [8, 4],
      fill: false,
      pointRadius: 2,
      pointHoverRadius: 5,
      pointBackgroundColor: "#dc2626",
      pointBorderColor: "#fff",
      pointBorderWidth: 2
    });

    // Add confidence bands if available
    const hasUpperBand = Array.isArray(forecast.upper_band) && forecast.upper_band.length > 0;
    const hasLowerBand = Array.isArray(forecast.lower_band) && forecast.lower_band.length > 0;

    if (hasUpperBand && hasLowerBand) {
      // Upper band
      datasets.push({
        label: "Upper Confidence Band",
        data: [
          ...Array(historyPrices?.length || 0).fill(null),
          ...(forecast.upper_band || [])
        ],
        borderColor: "rgba(239, 68, 68, 0.3)",
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        tension: 0.3,
        borderDash: [2, 2],
        fill: '+1', // Fill to next dataset (lower band)
        pointRadius: 0,
        pointHoverRadius: 0
      });

      // Lower band
      datasets.push({
        label: "Lower Confidence Band",
        data: [
          ...Array(historyPrices?.length || 0).fill(null),
          ...(forecast.lower_band || [])
        ],
        borderColor: "rgba(239, 68, 68, 0.3)",
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        tension: 0.3,
        borderDash: [2, 2],
        fill: false,
        pointRadius: 0,
        pointHoverRadius: 0
      });
    }
  }

  return (
    <Line
      data={{
        labels,
        datasets
      }}
      options={{
        responsive: true,
        maintainAspectRatio: true,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              color: "#1f2937",
              padding: 15,
              font: {
                size: 12,
                weight: '500'
              },
              usePointStyle: true,
              boxWidth: 6,
              boxHeight: 6
            }
          },
          tooltip: {
            enabled: true,
            backgroundColor: "rgba(220, 38, 38, 0.95)",
            titleColor: "#ffffff",
            bodyColor: "#fee2e2",
            borderColor: "#991b1b",
            borderWidth: 2,
            padding: 12,
            displayColors: true,
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  label += new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD'
                  }).format(context.parsed.y);
                }
                return label;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              color: "rgba(229, 231, 235, 0.5)",
              drawBorder: false
            },
            ticks: {
              color: "#6b7280",
              font: {
                size: 11
              },
              maxRotation: 45,
              minRotation: 0
            }
          },
          y: {
            grid: {
              color: "rgba(229, 231, 235, 0.5)",
              drawBorder: false
            },
            ticks: {
              color: "#6b7280",
              font: {
                size: 11
              },
              callback: function(value) {
                return '$' + value.toLocaleString();
              }
            }
          }
        }
      }}
    />
  );
};

export default PriceChart;
