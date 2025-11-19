/**
 * Bar Chart Component
 * For market sentiment visualization
 */

import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface BarDataPoint {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: BarDataPoint[];
  height?: number;
  horizontal?: boolean;
  title?: string;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  height = 300,
  horizontal = false,
  title,
}) => {
  const chartData = {
    labels: data.map((d) => d.label),
    datasets: [
      {
        label: 'Value',
        data: data.map((d) => d.value),
        backgroundColor: data.map(
          (d) =>
            d.color ||
            (d.value > 0 ? 'rgba(34, 197, 94, 0.6)' : 'rgba(239, 68, 68, 0.6)')
        ),
        borderColor: data.map(
          (d) =>
            d.color ||
            (d.value > 0 ? 'rgba(34, 197, 94, 1)' : 'rgba(239, 68, 68, 1)')
        ),
        borderWidth: 2,
        borderRadius: 6,
      },
    ],
  };

  const options = {
    indexAxis: horizontal ? ('y' as const) : ('x' as const),
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
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
        callbacks: {
          label: function (context: any) {
            return `${context.parsed.y > 0 ? '+' : ''}${context.parsed.y.toFixed(1)}%`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: !horizontal,
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
      y: {
        grid: {
          display: horizontal,
          color: 'rgba(0, 0, 0, 0.05)',
        },
        beginAtZero: true,
      },
    },
  };

  return (
    <div style={{ height }}>
      <Bar data={chartData} options={options} />
    </div>
  );
};
