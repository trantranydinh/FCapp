import { addDays, formatISO, getMonth, getDayOfYear } from "date-fns";
import { v4 as uuid } from "uuid";

/**
 * Seasonal Model
 * Accounts for seasonal patterns in cashew pricing
 */

class SeasonalModel {
  getMetadata() {
    return {
      name: "Seasonal Decomposition Model",
      version: "1.0.0",
      type: "statistical",
      description: "Captures seasonal patterns and trends for agricultural commodity forecasting"
    };
  }

  /**
   * Detect seasonal patterns in historical data
   */
  detectSeasonality(historicalData) {
    // Group prices by month
    const monthlyAverages = new Array(12).fill(0);
    const monthlyCounts = new Array(12).fill(0);

    historicalData.forEach(({ date, price }) => {
      const month = getMonth(date);
      monthlyAverages[month] += price;
      monthlyCounts[month] += 1;
    });

    // Calculate average price per month
    const seasonalFactors = monthlyAverages.map((sum, idx) =>
      monthlyCounts[idx] > 0 ? sum / monthlyCounts[idx] : 0
    );

    // Normalize to average = 1.0
    const overallAvg = seasonalFactors.reduce((sum, val) => sum + val, 0) / 12;
    const normalized = seasonalFactors.map(val => val / overallAvg);

    return normalized;
  }

  /**
   * Calculate linear trend
   */
  calculateTrend(prices) {
    const n = prices.length;
    const indices = Array.from({ length: n }, (_, i) => i);

    // Linear regression
    const sumX = indices.reduce((sum, x) => sum + x, 0);
    const sumY = prices.reduce((sum, y) => sum + y, 0);
    const sumXY = indices.reduce((sum, x, i) => sum + x * prices[i], 0);
    const sumX2 = indices.reduce((sum, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
  }

  async predict(historicalData, horizonDays = 60) {
    if (!historicalData || historicalData.length < 60) {
      throw new Error("Seasonal model requires at least 60 days of historical data");
    }

    const prices = historicalData.map(d => d.price);
    const lastDate = historicalData[historicalData.length - 1].date;
    const lastPrice = prices[prices.length - 1];

    // Detect seasonal pattern
    const seasonalFactors = this.detectSeasonality(historicalData);

    // Calculate trend
    const { slope, intercept } = this.calculateTrend(prices);

    // Calculate volatility
    const residuals = prices.map((price, i) => {
      const trendValue = slope * i + intercept;
      return price - trendValue;
    });
    const volatility = Math.sqrt(
      residuals.reduce((sum, r) => sum + r * r, 0) / residuals.length
    );

    // Generate forecast
    const forecasts = [];
    for (let day = 1; day <= horizonDays; day++) {
      const forecastDate = addDays(lastDate, day);
      const month = getMonth(forecastDate);

      // Trend component
      const trendValue = slope * (prices.length + day) + intercept;

      // Seasonal adjustment
      const seasonalAdjustment = seasonalFactors[month];

      // Combined forecast
      const median = trendValue * seasonalAdjustment;

      // Confidence bands (widen over time)
      const timeFactor = 1 + (day / horizonDays) * 0.5;
      const bandWidth = volatility * timeFactor;

      forecasts.push({
        date: formatISO(forecastDate, { representation: "date" }),
        median: Number(median.toFixed(2)),
        lower: Number(Math.max(0, median - bandWidth).toFixed(2)),
        upper: Number((median + bandWidth).toFixed(2))
      });
    }

    const trendPercentage = (forecasts.at(-1)?.median - lastPrice) / lastPrice;
    const confidenceScore = Math.max(0.6, Math.min(0.85, 1 - volatility / lastPrice));

    return {
      forecastId: uuid(),
      createdAt: new Date().toISOString(),
      modelId: "seasonal-v1",
      modelName: this.getMetadata().name,
      horizonDays,
      basePrice: Number(lastPrice.toFixed(2)),
      trendLabel: trendPercentage > 0.03 ? "UP" : trendPercentage < -0.03 ? "DOWN" : "FLAT",
      trendPercentage: Number(trendPercentage.toFixed(4)),
      confidenceScore: Number(confidenceScore.toFixed(2)),
      detailedData: {
        forecast_dates: forecasts.map((item) => item.date),
        median_prices: forecasts.map((item) => item.median),
        lower_band: forecasts.map((item) => item.lower),
        upper_band: forecasts.map((item) => item.upper)
      },
      metadata: {
        seasonalPattern: seasonalFactors.map(f => Number(f.toFixed(3))),
        trendSlope: Number(slope.toFixed(4)),
        volatility: Number(volatility.toFixed(2))
      }
    };
  }
}

export default new SeasonalModel();
