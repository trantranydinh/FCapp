/**
 * Dashboard Overview Page
 * Main dashboard showing all components
 */

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { ForecastCard } from '../../components/dashboard/ForecastCard';
import { MarketMovementCard } from '../../components/dashboard/MarketMovementCard';
import { NewsRankingCard } from '../../components/dashboard/NewsRankingCard';
import { EnsembleSummaryCard } from '../../components/dashboard/EnsembleSummaryCard';
import { Button } from '../../components/ui/Button';
import { TimeframeFilter, SearchBar } from '../../components/ui/Topbar';
import apiClient from '../../lib/api-client';

export default function DashboardPage() {
  const [timeframe, setTimeframe] = useState('30d');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  const profileId = '00000000-0000-0000-0000-000000000101'; // Default profile

  useEffect(() => {
    loadDashboardData();
  }, [timeframe]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const overview = await apiClient.getDashboardOverview(profileId);
      setData(overview);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRunForecast = async () => {
    try {
      setLoading(true);
      await apiClient.triggerForecast(profileId);
      // Poll for completion
      setTimeout(loadDashboardData, 5000);
    } catch (error) {
      console.error('Failed to trigger forecast:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!data && !loading) {
    return (
      <DashboardLayout title="Dashboard" subtitle="Loading...">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading dashboard data...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Forecast Dashboard"
      subtitle="Comprehensive market analysis and price forecasting"
      topbarActions={
        <Button
          variant="primary"
          loading={loading}
          onClick={handleRunForecast}
        >
          Run Forecast
        </Button>
      }
      topbarFilters={
        <>
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search keywords..."
          />
          <TimeframeFilter value={timeframe} onChange={setTimeframe} />
        </>
      }
    >
      <div className="space-y-6">
        {/* Ensemble Summary - Full Width */}
        {data?.ensemble && (
          <EnsembleSummaryCard
            forecastValue={data.ensemble.forecastValue}
            trend={data.ensemble.trend}
            confidenceScore={data.ensemble.confidenceScore}
            modelAgreementPct={data.ensemble.modelAgreementPct}
            keyDrivers={data.ensemble.keyDrivers}
            deviationAlert={data.ensemble.deviationAlert}
            deviationType={data.ensemble.deviationType}
            summaryText={data.ensemble.summaryText}
            weights={data.ensemble.weights}
            historicalValues={data.ensemble.historicalValues || []}
            lastUpdated={data.ensemble.lastUpdated}
          />
        )}

        {/* Grid Layout */}
        <div className="grid grid-cols-3 gap-6">
          {/* Forecast Card - 2 columns */}
          {data?.forecast && (
            <ForecastCard
              forecastData={data.forecast.data}
              currentValue={data.forecast.currentValue}
              trend={data.forecast.trend}
              confidence={data.forecast.confidence}
              modelName={data.forecast.modelName}
              lastUpdated={data.forecast.lastUpdated}
            />
          )}

          {/* Market Movement Card - 1 column */}
          {data?.market && (
            <MarketMovementCard
              sentiment={data.market.sentiment}
              sentimentScore={data.market.sentimentScore}
              signalCount={data.market.signalCount}
              signals={data.market.signals}
              topDrivers={data.market.topDrivers}
              lastUpdated={data.market.lastUpdated}
            />
          )}
        </div>

        {/* News Ranking - Full Width */}
        {data?.news && (
          <NewsRankingCard
            articles={data.news.articles}
            lastUpdated={data.news.lastUpdated}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
