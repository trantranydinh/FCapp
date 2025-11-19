/**
 * Badge Component
 * Small colored labels for categorical data
 */

import React from 'react';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
export type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
  neutral: 'bg-gray-50 text-gray-600',
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-base',
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
}) => {
  return (
    <span
      className={`
        inline-flex items-center font-medium rounded-full
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
    >
      {children}
    </span>
  );
};

// Specialized badges for sentiment
interface SentimentBadgeProps {
  sentiment: 'bullish' | 'bearish' | 'neutral';
  className?: string;
}

export const SentimentBadge: React.FC<SentimentBadgeProps> = ({ sentiment, className = '' }) => {
  const variants: Record<typeof sentiment, BadgeVariant> = {
    bullish: 'success',
    bearish: 'danger',
    neutral: 'neutral',
  };

  const labels = {
    bullish: '↑ Bullish',
    bearish: '↓ Bearish',
    neutral: '→ Neutral',
  };

  return (
    <Badge variant={variants[sentiment]} className={className}>
      {labels[sentiment]}
    </Badge>
  );
};

// Specialized badge for trend
interface TrendBadgeProps {
  trend: 'up' | 'down' | 'stable';
  className?: string;
}

export const TrendBadge: React.FC<TrendBadgeProps> = ({ trend, className = '' }) => {
  const variants: Record<typeof trend, BadgeVariant> = {
    up: 'success',
    down: 'danger',
    stable: 'neutral',
  };

  const labels = {
    up: '↑ Up',
    down: '↓ Down',
    stable: '→ Stable',
  };

  return (
    <Badge variant={variants[trend]} className={className}>
      {labels[trend]}
    </Badge>
  );
};
