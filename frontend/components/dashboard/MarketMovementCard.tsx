/**
 * Market Movement Card Component
 * Displays market sentiment and signals
 */

import React from 'react';
import { Card, CardHeader, CardBody } from '../ui/Card';
import { BarChart } from '../charts/BarChart';
import { SentimentBadge, Badge } from '../ui/Badge';

interface MarketSignal {
  source: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  description: string;
}

interface MarketMovementCardProps {
  sentiment: 'bullish' | 'bearish' | 'neutral';
  sentimentScore: number;
  signalCount: number;
  signals: MarketSignal[];
  topDrivers: { factor: string; impact: number }[];
  lastUpdated: string;
}

export const MarketMovementCard: React.FC<MarketMovementCardProps> = ({
  sentiment,
  sentimentScore,
  signalCount,
  signals,
  topDrivers,
  lastUpdated,
}) => {
  return (
    <Card>
      <CardHeader
        title="Market Movement"
        subtitle={`${signalCount} signals • Updated ${lastUpdated}`}
        action={<SentimentBadge sentiment={sentiment} />}
      />
      <CardBody>
        {/* Sentiment Score */}
        <div className="mb-6 p-4 bg-gray-50 rounded-xl">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Overall Sentiment</span>
            <span className="text-2xl font-bold text-gray-900">
              {sentimentScore > 0 ? '+' : ''}
              {sentimentScore.toFixed(2)}
            </span>
          </div>
          <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full ${
                sentimentScore > 0 ? 'bg-green-500' : 'bg-red-500'
              }`}
              style={{
                width: `${Math.abs(sentimentScore) * 50}%`,
                marginLeft: sentimentScore < 0 ? `${50 + sentimentScore * 50}%` : '50%',
              }}
            />
          </div>
        </div>

        {/* Top Drivers */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Top Drivers</h4>
          <BarChart
            data={topDrivers.map((d) => ({
              label: d.factor,
              value: d.impact,
            }))}
            height={200}
            horizontal
          />
        </div>

        {/* Recent Signals */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">
            Recent Signals ({signals.length})
          </h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {signals.slice(0, 5).map((signal, idx) => (
              <div
                key={idx}
                className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-sm font-medium text-gray-900">
                    {signal.source}
                  </span>
                  <SentimentBadge sentiment={signal.sentiment} size="sm" />
                </div>
                <p className="text-xs text-gray-600 line-clamp-2">
                  {signal.description}
                </p>
                <div className="mt-1 text-xs text-gray-500">
                  Confidence: {(signal.confidence * 100).toFixed(0)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardBody>
    </Card>
  );
};
