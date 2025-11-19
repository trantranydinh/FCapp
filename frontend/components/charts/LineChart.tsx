/**
 * Line Chart Component
 * For price forecasting and trends
 */

import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

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

interface ForecastDataPoint {
  date: string;
  value: number;
  lower?: number;
  upper?: number;
}

interface LineChartProps {
  data: ForecastDataPoint[];
  height?: number;
  showConfidenceBands?: boolean;
  title?: string;
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  height = 300,
  showConfidenceBands = true,
  title,
}) => {
  const chartData = {
    labels: data.map((d) => d.date),
    datasets: [
      // Main forecast line
      {
        label: 'Forecast',
        data: data.map((d) => d.value),
        borderColor: 'rgb(220, 38, 38)',
        backgroundColor: 'rgba(220, 38, 38, 0.1)',
        borderWidth: 3,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      // Upper confidence band
      ...(showConfidenceBands && data[0]?.upper
        ? [
            {
              label: 'Upper Confidence',
              data: data.map((d) => d.upper),
              borderColor: 'rgba(220, 38, 38, 0.2)',
              backgroundColor: 'rgba(220, 38, 38, 0.05)',
              borderWidth: 1,
              borderDash: [5, 5],
              tension: 0.4,
              pointRadius: 0,
              fill: '+1',
            },
          ]
        : []),
      // Lower confidence band
      ...(showConfidenceBands && data[0]?.lower
        ? [
            {
              label: 'Lower Confidence',
              data: data.map((d) => d.lower),
              borderColor: 'rgba(220, 38, 38, 0.2)',
              backgroundColor: 'rgba(220, 38, 38, 0.05)',
              borderWidth: 1,
              borderDash: [5, 5],
              tension: 0.4,
              pointRadius: 0,
              fill: false,
            },
          ]
        : []),
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12,
          },
        },
      },
      title: {
        display: !!title,
        text: title,
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          label: function (context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
              }).format(context.parsed.y);
            }
            return label;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
        },
      },
      y: {
        beginAtZero: false,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          callback: function (value: any) {
            return new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 0,
            }).format(value);
          },
        },
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
  };

  return (
    <div style={{ height }}>
      <Line data={chartData} options={options} />
    </div>
  );
};
