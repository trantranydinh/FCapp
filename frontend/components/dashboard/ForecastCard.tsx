/**
 * Forecast Card Component
 * Displays price forecast with confidence bands
 */

import React from 'react';
import { Card, CardHeader, CardBody } from '../ui/Card';
import { LineChart } from '../charts/LineChart';
import { KPIPill } from '../ui/Pill';
import { TrendBadge } from '../ui/Badge';

interface ForecastCardProps {
  forecastData: {
    date: string;
    value: number;
    lower: number;
    upper: number;
  }[];
  currentValue: number;
  trend: 'up' | 'down' | 'stable';
  confidence: number;
  modelName: string;
  lastUpdated: string;
}

export const ForecastCard: React.FC<ForecastCardProps> = ({
  forecastData,
  currentValue,
  trend,
  confidence,
  modelName,
  lastUpdated,
}) => {
  return (
    <Card className="col-span-2">
      <CardHeader
        title="Price Forecast"
        subtitle={`Model: ${modelName} • Updated ${lastUpdated}`}
        action={<TrendBadge trend={trend} />}
      />
      <CardBody>
        <div className="flex gap-4 mb-6">
          <KPIPill
            label="Current Forecast"
            value={currentValue}
            format="currency"
          />
          <KPIPill
            label="Confidence"
            value={confidence}
            format="percentage"
          />
        </div>
        <LineChart data={forecastData} height={350} showConfidenceBands />
      </CardBody>
    </Card>
  );
};
