/**
 * Pill Component
 * Rounded KPI indicators with values
 */

import React from 'react';

interface PillProps {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  variant?: 'default' | 'primary' | 'success' | 'danger';
  className?: string;
}

const variantStyles = {
  default: 'bg-gray-50 border-gray-200',
  primary: 'bg-blue-50 border-blue-200',
  success: 'bg-green-50 border-green-200',
  danger: 'bg-red-50 border-red-200',
};

const trendIcons = {
  up: '↑',
  down: '↓',
  neutral: '→',
};

const trendColors = {
  up: 'text-green-600',
  down: 'text-red-600',
  neutral: 'text-gray-600',
};

export const Pill: React.FC<PillProps> = ({
  label,
  value,
  trend,
  variant = 'default',
  className = '',
}) => {
  return (
    <div
      className={`
        inline-flex items-center gap-3 px-4 py-2 rounded-full border
        ${variantStyles[variant]}
        ${className}
      `}
    >
      <span className="text-sm text-gray-600 font-medium">{label}</span>
      <div className="flex items-center gap-1">
        <span className="text-lg font-semibold text-gray-900">{value}</span>
        {trend && (
          <span className={`text-sm ${trendColors[trend]}`}>
            {trendIcons[trend]}
          </span>
        )}
      </div>
    </div>
  );
};

// KPI Pill - specialized version for dashboard KPIs
interface KPIPillProps {
  label: string;
  value: string | number;
  change?: number; // percentage change
  format?: 'number' | 'currency' | 'percentage';
  className?: string;
}

export const KPIPill: React.FC<KPIPillProps> = ({
  label,
  value,
  change,
  format = 'number',
  className = '',
}) => {
  const formatValue = (val: string | number): string => {
    if (typeof val === 'string') return val;

    switch (format) {
      case 'currency':
        return `$${val.toLocaleString()}`;
      case 'percentage':
        return `${val}%`;
      default:
        return val.toLocaleString();
    }
  };

  const getTrend = (changeValue?: number) => {
    if (changeValue === undefined) return undefined;
    if (changeValue > 0) return 'up';
    if (changeValue < 0) return 'down';
    return 'neutral';
  };

  const getVariant = (changeValue?: number) => {
    if (changeValue === undefined) return 'default';
    if (changeValue > 5) return 'success';
    if (changeValue < -5) return 'danger';
    return 'default';
  };

  return (
    <div className={`relative ${className}`}>
      <Pill
        label={label}
        value={formatValue(value)}
        trend={getTrend(change)}
        variant={getVariant(change)}
      />
      {change !== undefined && (
        <span className="absolute -top-1 -right-1 text-xs text-gray-500 bg-white px-1 rounded">
          {change > 0 ? '+' : ''}{change.toFixed(1)}%
        </span>
      )}
    </div>
  );
};
