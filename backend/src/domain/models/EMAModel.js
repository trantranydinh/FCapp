import { addDays, formatISO } from "date-fns";
import { v4 as uuid } from "uuid";

/**
 * Moving Average Model
 * Uses exponential moving average (EMA) for smoother predictions
 */

class MovingAverageModel {
  getMetadata() {
    return {
      name: "Exponential Moving Average",
      version: "1.0.0",
      type: "statistical",
      description: "EMA-based forecasting with adaptive smoothing"
    };
  }

  /**
   * Calculate Exponential Moving Average
   */
  calculateEMA(prices, period) {
    const k = 2 / (period + 1);
    let ema = prices[0];

    for (let i = 1; i < prices.length; i++) {
      ema = prices[i] * k + ema * (1 - k);
    }

    return ema;
  }

  /**
   * Calculate volatility (standard deviation)
   */
  calculateVolatility(prices) {
    const mean = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    const variance = prices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / prices.length;
    return Math.sqrt(variance);
  }

  async predict(historicalData, horizonDays = 60) {
    if (!historicalData || historicalData.length < 10) {
      throw new Error("Insufficient historical data (minimum 10 points required)");
    }

    const prices = historicalData.map(d => d.price);
    const lastDate = historicalData[historicalData.length - 1].date;

    // Calculate short and long term EMAs
    const shortEMA = this.calculateEMA(prices.slice(-10), 10);
    const longEMA = this.calculateEMA(prices.slice(-30), 30);

    // Trend direction based on EMA crossover
    const trend = shortEMA > longEMA ? 1 : -1;

    // Calculate momentum
    const momentum = (shortEMA - longEMA) / longEMA;

    // Calculate volatility for confidence bands
    const volatility = this.calculateVolatility(prices.slice(-30));

    // Generate forecast
    const forecasts = [];
    let currentPrice = prices[prices.length - 1];

    for (let day = 1; day <= horizonDays; day++) {
      // Apply momentum decay (reduces over time)
      const decayFactor = Math.exp(-day / horizonDays);
      const priceChange = momentum * currentPrice * decayFactor;

      currentPrice += priceChange;

      // Confidence bands widen over time
      const bandWidth = volatility * (1 + day / horizonDays);

      forecasts.push({
        date: formatISO(addDays(lastDate, day), { representation: "date" }),
        median: Number(currentPrice.toFixed(2)),
        lower: Number(Math.max(0, currentPrice - bandWidth).toFixed(2)),
        upper: Number((currentPrice + bandWidth).toFixed(2))
      });
    }

    const trendPercentage = (forecasts.at(-1)?.median - prices[prices.length - 1]) / prices[prices.length - 1];
    const confidenceScore = Math.max(0.5, Math.min(0.9, 1 - volatility / prices[prices.length - 1]));

    return {
      forecastId: uuid(),
      createdAt: new Date().toISOString(),
      modelId: "ema-v1",
      modelName: this.getMetadata().name,
      horizonDays,
      basePrice: Number(prices[prices.length - 1].toFixed(2)),
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
        shortEMA: Number(shortEMA.toFixed(2)),
        longEMA: Number(longEMA.toFixed(2)),
        momentum: Number((momentum * 100).toFixed(2)),
        volatility: Number(volatility.toFixed(2))
      }
    };
  }
}

export default new MovingAverageModel();
