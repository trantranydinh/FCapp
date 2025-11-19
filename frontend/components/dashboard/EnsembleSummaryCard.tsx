/**
 * Ensemble Summary Card Component
 * Combined output from all models
 */

import React from 'react';
import { Card, CardHeader, CardBody } from '../ui/Card';
import { KPIPill } from '../ui/Pill';
import { TrendBadge, Badge } from '../ui/Badge';
import { SparkLine } from '../charts/SparkLine';

interface KeyDriver {
  driver: string;
  contribution: number;
  source: 'price' | 'market' | 'news';
}

interface EnsembleSummaryCardProps {
  forecastValue: number;
  trend: 'up' | 'down' | 'stable';
  confidenceScore: number;
  modelAgreementPct: number;
  keyDrivers: KeyDriver[];
  deviationAlert: boolean;
  deviationType?: string;
  summaryText: string;
  weights: { price: number; market: number; news: number };
  historicalValues: number[];
  lastUpdated: string;
}

export const EnsembleSummaryCard: React.FC<EnsembleSummaryCardProps> = ({
  forecastValue,
  trend,
  confidenceScore,
  modelAgreementPct,
  keyDrivers,
  deviationAlert,
  deviationType,
  summaryText,
  weights,
  historicalValues,
  lastUpdated,
}) => {
  const getSourceColor = (source: string) => {
    const colors = {
      price: '#dc2626',
      market: '#2563eb',
      news: '#16a34a',
    };
    return colors[source as keyof typeof colors] || '#6b7280';
  };

  return (
    <Card className="col-span-full">
      <CardHeader
        title="Ensemble Forecast Summary"
        subtitle={`Combined analysis from all models • Updated ${lastUpdated}`}
        action={
          <div className="flex gap-2">
            <TrendBadge trend={trend} />
            {deviationAlert && (
              <Badge variant="warning">
                Alert: {deviationType?.replace('_', ' ')}
              </Badge>
            )}
          </div>
        }
      />
      <CardBody>
        {/* Top KPIs */}
        <div className="flex flex-wrap gap-3 mb-6">
          <KPIPill
            label="Forecast Value"
            value={forecastValue}
            format="currency"
          />
          <KPIPill
            label="Confidence"
            value={confidenceScore}
            format="percentage"
          />
          <KPIPill
            label="Model Agreement"
            value={modelAgreementPct}
            format="percentage"
          />
        </div>

        {/* Summary Text */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <p className="text-sm text-gray-800 leading-relaxed">{summaryText}</p>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Key Drivers */}
          <div className="col-span-2">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">
              Key Drivers
            </h4>
            <div className="space-y-3">
              {keyDrivers.map((driver, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        {driver.driver}
                      </span>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            driver.source === 'price'
                              ? 'danger'
                              : driver.source === 'market'
                              ? 'info'
                              : 'success'
                          }
                          size="sm"
                        >
                          {driver.source}
                        </Badge>
                        <span className="text-sm font-semibold text-gray-700">
                          {driver.contribution.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full"
                        style={{
                          width: `${driver.contribution}%`,
                          backgroundColor: getSourceColor(driver.source),
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Model Weights & History */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">
              Model Weights
            </h4>
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Price Model</span>
                <span className="font-semibold">{(weights.price * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Market Model</span>
                <span className="font-semibold">{(weights.market * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">News Model</span>
                <span className="font-semibold">{(weights.news * 100).toFixed(0)}%</span>
              </div>
            </div>

            <h4 className="text-sm font-semibold text-gray-700 mb-3">
              Recent Trend
            </h4>
            <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg">
              <SparkLine data={historicalValues} width={200} height={60} />
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};
