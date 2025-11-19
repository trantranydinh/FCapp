/**
 * APPLICATION LAYER: Dashboard Orchestrator
 *
 * Responsibility: Coordinate dashboard data aggregation
 * Dependencies: Domain models + Infrastructure services
 *
 * Principles:
 * - Single Responsibility: Only dashboard data coordination
 * - Separation of Concerns: No HTTP logic, no direct infrastructure calls
 * - Error Resilience: Graceful degradation when services fail
 */

import jsonCache from '../infrastructure/data/JSONCache.js';
import llmProvider from '../infrastructure/llm/LLMProvider.js';

class DashboardOrchestrator {
  /**
   * Get complete dashboard overview
   *
   * Aggregates data from multiple sources with parallel execution
   * Implements graceful degradation if individual components fail
   *
   * @returns {Promise<object>} Dashboard overview data
   */
  async getOverview() {
    console.log('[DashboardOrchestrator] Generating dashboard overview');

    try {
      // Parallel fetch with error isolation
      const [
        latestForecast,
        apiUsage,
        jobRuns,
      ] = await Promise.allSettled([
        this._getLatestForecast(),
        this._getApiUsage(),
        this._getJobRuns(),
      ]);

      // Extract data with safe fallbacks
      const forecast = this._extractValue(latestForecast, null);
      const usage = this._extractValue(apiUsage, []);
      const runs = this._extractValue(jobRuns, []);

      // Build key metrics from forecast
      const keyMetrics = this._buildKeyMetrics(forecast);

      // Build response
      return {
        timestamp: new Date().toISOString(),
        latest_forecast: forecast,
        key_metrics: keyMetrics,
        api_usage_summary: this._summarizeUsage(usage),
        recent_jobs: runs.slice(-5),
        status: 'healthy'
      };

    } catch (error) {
      console.error('[DashboardOrchestrator] Failed to generate overview:', error.message);
      throw new Error(`Dashboard generation failed: ${error.message}`);
    }
  }

  /**
   * Get historical data summary
   *
   * @param {number} monthsBack - Number of months to look back
   * @returns {Promise<object>} Historical summary
   */
  async getHistoricalSummary(monthsBack = 12) {
    if (!Number.isInteger(monthsBack) || monthsBack < 1 || monthsBack > 24) {
      throw new Error('monthsBack must be an integer between 1 and 24');
    }

    console.log(`[DashboardOrchestrator] Fetching historical data for ${monthsBack} months`);

    try {
      const forecasts = await jsonCache.listForecasts();

      // Filter forecasts by date
      const cutoffDate = this._getMonthsAgo(monthsBack);
      const filtered = forecasts.filter(f =>
        new Date(f.createdAt || f.timestamp) >= cutoffDate
      );

      return {
        forecasts: filtered,
        count: filtered.length,
        period_months: monthsBack,
        date_range: {
          start: cutoffDate.toISOString(),
          end: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('[DashboardOrchestrator] Failed to fetch historical data:', error.message);
      throw new Error(`Historical data fetch failed: ${error.message}`);
    }
  }

  /**
   * Get system status
   *
   * @returns {Promise<object>} System health and status
   */
  async getSystemStatus() {
    console.log('[DashboardOrchestrator] Checking system status');

    try {
      const [usage, runs, cacheStats] = await Promise.all([
        jsonCache.getApiUsage(),
        jsonCache.getJobRuns(),
        jsonCache.getStats()
      ]);

      return {
        status: 'healthy',
        llm_enabled: llmProvider.isEnabled(),
        llm_provider: llmProvider.getProvider(),
        cache_stats: cacheStats,
        api_usage: this._summarizeUsage(usage),
        recent_jobs: runs.slice(-10),
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('[DashboardOrchestrator] System status check failed:', error.message);
      return {
        status: 'degraded',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get alerts based on system state
   *
   * @param {object} config - Alert configuration { llmMaxCallsPerDay }
   * @returns {Promise<object>} Active alerts
   */
  async getAlerts(config = {}) {
    const { llmMaxCallsPerDay = 50 } = config;

    console.log('[DashboardOrchestrator] Generating alerts');

    try {
      const [usage, latestForecast] = await Promise.all([
        jsonCache.getApiUsage(),
        this._getLatestForecast()
      ]);

      const alerts = [];

      // Alert: LLM usage limit
      if (usage.length >= llmMaxCallsPerDay) {
        alerts.push({
          type: 'warning',
          severity: 'medium',
          message: `LLM usage limit reached (${usage.length}/${llmMaxCallsPerDay} calls)`,
          timestamp: new Date().toISOString(),
          action: 'Consider upgrading LLM tier or waiting for reset'
        });
      }

      // Alert: Significant trend change
      if (latestForecast && Math.abs(latestForecast.trendPercentage || 0) > 0.05) {
        alerts.push({
          type: 'info',
          severity: 'low',
          message: `Forecast shows ${latestForecast.trendLabel} trend (${(latestForecast.trendPercentage * 100).toFixed(1)}% change)`,
          timestamp: new Date().toISOString(),
          action: 'Review underlying market drivers'
        });
      }

      // Alert: No recent forecast
      const forecastAge = latestForecast
        ? Date.now() - new Date(latestForecast.createdAt || latestForecast.timestamp).getTime()
        : Infinity;

      if (forecastAge > 24 * 60 * 60 * 1000) { // 24 hours
        alerts.push({
          type: 'warning',
          severity: 'medium',
          message: 'No forecast generated in the last 24 hours',
          timestamp: new Date().toISOString(),
          action: 'Run new forecast to ensure data freshness'
        });
      }

      return {
        alerts,
        total_count: alerts.length,
        last_checked: new Date().toISOString()
      };

    } catch (error) {
      console.error('[DashboardOrchestrator] Alert generation failed:', error.message);
      return {
        alerts: [],
        total_count: 0,
        error: error.message,
        last_checked: new Date().toISOString()
      };
    }
  }

  // ========== PRIVATE HELPER METHODS ==========

  /**
   * Get latest forecast from cache
   * @private
   */
  async _getLatestForecast() {
    const forecasts = await jsonCache.listForecasts();
    return forecasts.length > 0 ? forecasts[forecasts.length - 1] : null;
  }

  /**
   * Get API usage from cache
   * @private
   */
  async _getApiUsage() {
    return jsonCache.getApiUsage();
  }

  /**
   * Get job runs from cache
   * @private
   */
  async _getJobRuns() {
    return jsonCache.getJobRuns();
  }

  /**
   * Extract value from Promise.allSettled result
   * @private
   */
  _extractValue(settledPromise, fallback) {
    return settledPromise.status === 'fulfilled' ? settledPromise.value : fallback;
  }

  /**
   * Build key metrics from forecast
   * @private
   */
  _buildKeyMetrics(forecast) {
    if (!forecast) {
      return {
        current_price: null,
        trend: 'UNKNOWN',
        trend_percentage: 0,
        confidence: 0,
        last_updated: null,
        forecasts: {}
      };
    }

    const dates = forecast.detailedData?.forecast_dates || [];
    const prices = forecast.detailedData?.median_prices || [];
    const currentPrice = forecast.basePrice || 0;

    const horizons = {};
    [7, 14, 30, 60].forEach(day => {
      if (dates.length >= day) {
        const idx = day - 1;
        const price = prices[idx];
        const changePercent = currentPrice > 0
          ? ((price - currentPrice) / currentPrice) * 100
          : 0;

        horizons[`${day}d`] = {
          date: dates[idx],
          price: Number(price.toFixed(2)),
          change_percent: Number(changePercent.toFixed(2))
        };
      }
    });

    return {
      current_price: Number((currentPrice || 0).toFixed(2)),
      trend: forecast.trendLabel || 'UNKNOWN',
      trend_percentage: Number(((forecast.trendPercentage || 0) * 100).toFixed(2)),
      confidence: Number(((forecast.confidenceScore || forecast.confidence || 0) * 100).toFixed(1)),
      last_updated: forecast.createdAt || forecast.timestamp,
      forecasts: horizons
    };
  }

  /**
   * Summarize API usage
   * @private
   */
  _summarizeUsage(usage) {
    if (!Array.isArray(usage) || usage.length === 0) {
      return {
        total_calls: 0,
        total_tokens: 0,
        total_cost: 0,
        providers: {}
      };
    }

    const byProvider = usage.reduce((acc, entry) => {
      const provider = entry.provider || 'unknown';
      if (!acc[provider]) {
        acc[provider] = { calls: 0, tokens: 0, cost: 0 };
      }
      acc[provider].calls += 1;
      acc[provider].tokens += entry.tokens_used || 0;
      acc[provider].cost += entry.cost_estimate || 0;
      return acc;
    }, {});

    const totalTokens = Object.values(byProvider).reduce((sum, p) => sum + p.tokens, 0);
    const totalCost = Object.values(byProvider).reduce((sum, p) => sum + p.cost, 0);

    return {
      total_calls: usage.length,
      total_tokens: totalTokens,
      total_cost: Number(totalCost.toFixed(4)),
      providers: byProvider
    };
  }

  /**
   * Get date N months ago
   * @private
   */
  _getMonthsAgo(months) {
    const date = new Date();
    date.setMonth(date.getMonth() - months);
    return date;
  }
}

// Export singleton instance
const dashboardOrchestrator = new DashboardOrchestrator();
export default dashboardOrchestrator;
