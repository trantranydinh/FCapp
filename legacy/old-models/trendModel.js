import { addDays, formatISO } from "date-fns";
import { v4 as uuid } from "uuid";

/**
 * Simple Trend Model (Baseline)
 * Uses moving average and linear regression for trend projection
 */

class TrendModel {
  getMetadata() {
    return {
      name: "Simple Trend Forecaster",
      version: "1.0.0",
      type: "statistical",
      description: "Baseline model using moving average and linear trend projection"
    };
  }

  async predict(historicalData, horizonDays = 60) {
    if (!historicalData || historicalData.length === 0) {
      throw new Error("Historical data is required for prediction");
    }

    // Calculate trend using recent window
    const window = Math.min(30, historicalData.length);
    const recent = historicalData.slice(-window);

    // Calculate average slope (linear trend)
    const avgSlope =
      recent.reduce((acc, row, idx, arr) => {
        if (idx === 0) return acc;
        const prev = arr[idx - 1];
        const delta = row.price - prev.price;
        return acc + delta;
      }, 0) / Math.max(1, window - 1);

    const lastPrice = recent[recent.length - 1]?.price || 0;
    const lastDate = recent[recent.length - 1]?.date || new Date();

    // Generate forecast
    const forecasts = [];
    let currentPrice = lastPrice;

    for (let day = 1; day <= horizonDays; day++) {
      currentPrice += avgSlope;
      const volatility = Math.abs(avgSlope) * 0.5 || lastPrice * 0.01;

      forecasts.push({
        date: formatISO(addDays(lastDate, day), { representation: "date" }),
        median: Number(currentPrice.toFixed(2)),
        lower: Number(Math.max(0, currentPrice - volatility).toFixed(2)),
        upper: Number((currentPrice + volatility).toFixed(2))
      });
    }

    // Calculate trend metrics
    const trendPercentage = ((forecasts.at(-1)?.median || lastPrice) - lastPrice) / Math.max(lastPrice, 1);

    return {
      forecastId: uuid(),
      createdAt: new Date().toISOString(),
      modelId: "trend-v1",
      modelName: this.getMetadata().name,
      horizonDays,
      basePrice: Number(lastPrice.toFixed(2)),
      trendLabel: trendPercentage > 0.03 ? "UP" : trendPercentage < -0.03 ? "DOWN" : "FLAT",
      trendPercentage: Number(trendPercentage.toFixed(4)),
      confidenceScore: 0.6,
      detailedData: {
        forecast_dates: forecasts.map((item) => item.date),
        median_prices: forecasts.map((item) => item.median),
        lower_band: forecasts.map((item) => item.lower),
        upper_band: forecasts.map((item) => item.upper)
      }
    };
  }
}

export default new TrendModel();
