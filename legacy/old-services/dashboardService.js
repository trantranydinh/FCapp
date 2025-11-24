import path from "path";
import fs from "fs-extra";
import { formatISO } from "date-fns";

import { settings } from "../settings.js";
import { fetchLatestForecast, fetchHistoricalPrices, getAccuracySummary } from "./priceService.js";
import { getMarketSentiment } from "./marketInsightsService.js";
import { getNewsSummary } from "./newsService.js";
import { getApiUsage, getJobRuns } from "./demoCache.js";

export const getDashboardOverview = async () => {
  const [latestForecast, sentiment, news, usage] = await Promise.all([
    fetchLatestForecast(),
    getMarketSentiment(),
    getNewsSummary(3),
    getApiUsage()
  ]);

  const keyMetrics = {
    current_price: latestForecast.basePrice,
    trend: latestForecast.trendLabel,
    trend_percentage: Number((latestForecast.trendPercentage * 100).toFixed(2)),
    confidence: latestForecast.confidenceScore,
    last_updated: latestForecast.createdAt,
    forecasts: buildForecastHighlights(latestForecast)
  };

  return {
    timestamp: new Date().toISOString(),
    latest_forecast: latestForecast,
    key_metrics: keyMetrics,
    market_sentiment: sentiment,
    top_news: news.top_news,
    api_usage_summary: summarizeUsage(usage)
  };
};

const buildForecastHighlights = (forecast) => {
  const dates = forecast?.detailedData?.forecast_dates || [];
  const prices = forecast?.detailedData?.median_prices || [];
  const currentPrice = forecast?.basePrice || 0;
  const horizons = {};
  [7, 14, 30, 60].forEach((day) => {
    if (dates.length >= day) {
      const idx = day - 1;
      const price = prices[idx];
      horizons[`${day}d`] = {
        date: dates[idx],
        price,
        change_percent: Number((((price - currentPrice) / Math.max(currentPrice, 1)) * 100).toFixed(2))
      };
    }
  });
  return horizons;
};

const summarizeUsage = (usage) => {
  const totalCalls = usage.length;
  const byProvider = usage.reduce((acc, entry) => {
    const provider = entry.provider || "unknown";
    if (!acc[provider]) {
      acc[provider] = { calls: 0, tokens: 0, cost: 0 };
    }
    acc[provider].calls += 1;
    acc[provider].tokens += entry.tokens_used || 0;
    acc[provider].cost += entry.cost_estimate || 0;
    return acc;
  }, {});
  return {
    total_calls: totalCalls,
    providers: byProvider,
    limit_per_day: settings.llmMaxCallsPerDay
  };
};

export const getHistoricalSummary = async ({ monthsBack }) => fetchHistoricalPrices(monthsBack);

export const getSystemStatus = async () => {
  const [usage, jobs, accuracy] = await Promise.all([getApiUsage(), getJobRuns(), getAccuracySummary()]);
  return {
    status: "healthy",
    demo_mode: settings.demoMode,
    llm_provider: settings.llmProvider,
    api_usage: summarizeUsage(usage),
    runs: jobs.slice(-10),
    accuracy
  };
};

export const getAlerts = async () => {
  const usage = await getApiUsage();
  const latestForecast = await fetchLatestForecast();
  const alerts = [];

  if (usage.length >= settings.llmMaxCallsPerDay) {
    alerts.push({
      type: "warning",
      message: "Demo LLM usage limit reached for the day.",
      timestamp: new Date().toISOString()
    });
  }

  if (Math.abs(latestForecast.trendPercentage) > 0.05) {
    alerts.push({
      type: "info",
      message: "Forecast trend change greater than 5%. Review underlying drivers.",
      timestamp: new Date().toISOString()
    });
  }

  return {
    alerts,
    total_count: alerts.length,
    last_checked: new Date().toISOString()
  };
};

export const ensureSampleData = async () => {
  const filePath = path.join(settings.dataDir, settings.priceDataFile);
  const exists = await fs.pathExists(filePath);
  if (!exists) {
    await fs.ensureDir(settings.dataDir);
    await fs.writeFile(
      filePath,
      "Date,Price\n" + formatISO(new Date(), { representation: "date" }) + ",1000\n",
      "utf-8"
    );
  }
};
