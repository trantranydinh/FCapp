import { useEffect, useState, useMemo } from "react";
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
import { Button } from "./ui/button";
import { cn } from "../lib/utils";

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
  const [timeRange, setTimeRange] = useState("ALL"); // 7D, 1M, 3M, 1Y, ALL

  // Handle Next.js SSR
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Filter data based on time range
  const filteredData = useMemo(() => {
    if (!historyDates.length) return { dates: [], prices: [] };

    let daysToKeep = 0;
    switch (timeRange) {
      case "7D": daysToKeep = 7; break;
      case "1M": daysToKeep = 30; break;
      case "3M": daysToKeep = 90; break;
      case "1Y": daysToKeep = 365; break;
      default: daysToKeep = historyDates.length;
    }

    // If range is larger than available data, show all
    if (daysToKeep > historyDates.length) daysToKeep = historyDates.length;

    const startIndex = historyDates.length - daysToKeep;
    return {
      dates: historyDates.slice(startIndex),
      prices: historyPrices.slice(startIndex)
    };
  }, [historyDates, historyPrices, timeRange]);

  const hasHistoricalData = filteredData.dates.length > 0;
  const hasForecastData = forecast?.forecast_dates?.length > 0 && forecast?.median_prices?.length > 0;

  if (!isMounted) return <div className="h-[300px] flex items-center justify-center text-muted-foreground">Loading chart...</div>;
  if (!hasHistoricalData && !hasForecastData) return <div className="h-[300px] flex items-center justify-center text-muted-foreground">No data available</div>;

  // Build labels
  const labels = [...filteredData.dates];
  if (hasForecastData) {
    labels.push(...forecast.forecast_dates);
  }

  // Create gradient for historical line
  const getGradient = (context) => {
    const ctx = context.chart.ctx;
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, "rgba(239, 68, 68, 0.5)");
    gradient.addColorStop(1, "rgba(239, 68, 68, 0.0)");
    return gradient;
  };

  const datasets = [];

  // Historical Data
  if (hasHistoricalData) {
    datasets.push({
      label: "Historical Price",
      data: filteredData.prices,
      borderColor: "#ef4444",
      backgroundColor: (context) => getGradient(context),
      tension: 0.4,
      fill: true,
      pointRadius: 0,
      pointHoverRadius: 6,
      pointBackgroundColor: "#ef4444",
      pointBorderColor: "#fff",
      pointBorderWidth: 2,
      borderWidth: 2,
    });
  }

  // Forecast Data
  if (hasForecastData) {
    const emptyHistory = Array(filteredData.prices.length).fill(null);

    // Connect last historical point to first forecast point
    const lastHistoryPrice = filteredData.prices[filteredData.prices.length - 1];
    const forecastData = [lastHistoryPrice, ...forecast.median_prices];
    // Adjust empty array size since we added one point
    const forecastOffset = emptyHistory.slice(0, -1);

    datasets.push({
      label: "AI Forecast",
      data: [...forecastOffset, ...forecastData],
      borderColor: "#dc2626",
      backgroundColor: "transparent",
      borderDash: [5, 5],
      tension: 0.4,
      pointRadius: 0,
      pointHoverRadius: 6,
      pointBackgroundColor: "#dc2626",
      pointBorderColor: "#fff",
      pointBorderWidth: 2,
      borderWidth: 2,
    });

    // Confidence Bands
    if (forecast.upper_band && forecast.lower_band) {
      const upperData = [lastHistoryPrice, ...forecast.upper_band];
      const lowerData = [lastHistoryPrice, ...forecast.lower_band];

      datasets.push({
        label: "Confidence Range",
        data: [...forecastOffset, ...upperData],
        borderColor: "transparent",
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        fill: "+1",
        pointRadius: 0,
        tension: 0.4,
      });

      datasets.push({
        label: "Lower Band",
        data: [...forecastOffset, ...lowerData],
        borderColor: "transparent",
        backgroundColor: "transparent",
        fill: false,
        pointRadius: 0,
        tension: 0.4,
      });
    }
  }

  const ranges = ["7D", "1M", "3M", "1Y", "ALL"];

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex justify-end mb-4 gap-1">
        {ranges.map((range) => (
          <Button
            key={range}
            variant={timeRange === range ? "default" : "ghost"}
            size="sm"
            onClick={() => setTimeRange(range)}
            className={cn(
              "h-7 text-xs px-2",
              timeRange === range ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {range}
          </Button>
        ))}
      </div>

      <div className="flex-1 min-h-[300px] w-full">
        <Line
          data={{ labels, datasets }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
              mode: 'index',
              intersect: false,
            },
            plugins: {
              legend: {
                display: true,
                position: 'top',
                align: 'end',
                labels: {
                  usePointStyle: true,
                  boxWidth: 6,
                  font: { size: 11 }
                }
              },
              tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                titleColor: '#fff',
                bodyColor: '#cbd5e1',
                borderColor: 'rgba(255,255,255,0.1)',
                borderWidth: 1,
                padding: 10,
                cornerRadius: 8,
                displayColors: true,
                callbacks: {
                  label: (context) => {
                    if (context.dataset.label === "Lower Band" || context.dataset.label === "Confidence Range") return null;
                    let label = context.dataset.label || '';
                    if (label) label += ': ';
                    if (context.parsed.y !== null) {
                      label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.parsed.y);
                    }
                    return label;
                  }
                }
              }
            },
            scales: {
              x: {
                grid: { display: false },
                ticks: {
                  maxTicksLimit: 8,
                  font: { size: 10 },
                  color: '#94a3b8'
                }
              },
              y: {
                grid: {
                  color: 'rgba(255, 255, 255, 0.05)',
                  drawBorder: false,
                },
                ticks: {
                  font: { size: 10 },
                  color: '#94a3b8',
                  callback: (value) => '$' + value
                }
              }
            }
          }}
        />
      </div>
    </div>
  );
};

export default PriceChart;
