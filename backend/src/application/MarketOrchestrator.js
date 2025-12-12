/**
 * APPLICATION LAYER: Market Orchestrator
 *
 * Responsibility: Coordinate market sentiment analysis
 * Dependencies: PriceOrchestrator, LLMProvider
 *
 * Principles:
 * - Analyze market trends from price data
 * - Generate sentiment scores and classifications
 * - Optional AI-powered insights
 * - Graceful degradation when data unavailable
 */

import llmProvider from '../infrastructure/llm/LLMProvider.js';
import priceOrchestrator from './PriceOrchestrator.js';

class MarketOrchestrator {
  /**
   * Get market sentiment analysis
   *
   * @returns {Promise<object>} Market sentiment with AI insights
   */
  async getMarketSentiment() {
    console.log('[MarketOrchestrator] Analyzing market sentiment');

    try {
      // Step 1: Get recent price history (6 months)
      const history = await priceOrchestrator.getHistoricalPrices(6);
      const { prices } = history;

      // Validate data availability
      if (!prices || prices.length === 0) {
        return this._getNeutralSentiment('Insufficient price data');
      }

      // Step 2: Calculate price changes
      const lastPrice = prices[prices.length - 1];
      const weekPrice = prices[Math.max(0, prices.length - 7)] || lastPrice;
      const monthPrice = prices[Math.max(0, prices.length - 30)] || lastPrice;

      const weekChange = this._calculatePercentageChange(weekPrice, lastPrice);
      const monthChange = this._calculatePercentageChange(monthPrice, lastPrice);

      // Step 3: Calculate sentiment score (-100 to +100)
      // Weighted: 60% weekly trend, 40% monthly trend
      const sentimentScore = Number(((weekChange * 0.6 + monthChange * 0.4) * 100).toFixed(2));

      // Step 4: Classify sentiment
      const overallSentiment = this._classifySentiment(sentimentScore);

      // Step 5: Generate insights
      const insights = this._generateInsights(weekChange, monthChange, lastPrice);

      // Step 6: Add AI-powered insight (optional)
      const aiInsight = await this._generateAIInsight({
        currentPrice: lastPrice,
        weekChange: Number((weekChange * 100).toFixed(2)),
        monthChange: Number((monthChange * 100).toFixed(2)),
        sentiment: overallSentiment
      });

      return {
        overall_sentiment: overallSentiment,
        sentiment_score: sentimentScore,
        confidence: this._calculateConfidence(prices),
        current_price: Number(lastPrice.toFixed(2)),
        week_change_percent: Number((weekChange * 100).toFixed(2)),
        month_change_percent: Number((monthChange * 100).toFixed(2)),
        ai_insight: aiInsight,
        insights,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('[MarketOrchestrator] Sentiment analysis failed:', error.message);
      return this._getNeutralSentiment(error.message);
    }
  }

  // ========== PRIVATE HELPER METHODS ==========

  /**
   * Calculate percentage change between two prices
   * @private
   */
  _calculatePercentageChange(oldPrice, newPrice) {
    if (oldPrice === 0) return 0;
    return (newPrice - oldPrice) / oldPrice;
  }

  /**
   * Classify sentiment based on score
   * @private
   */
  _classifySentiment(score) {
    if (score > 2) return 'BULLISH';
    if (score < -2) return 'BEARISH';
    return 'NEUTRAL';
  }

  /**
   * Calculate confidence score based on data availability
   * @private
   */
  _calculateConfidence(prices) {
    // More data points = higher confidence
    const dataPoints = prices.length;
    const maxPoints = 180; // 6 months of daily data

    const dataScore = Math.min(dataPoints / maxPoints, 1);

    // Calculate price volatility (lower volatility = higher confidence)
    const volatility = this._calculateVolatility(prices.slice(-30));
    const avgPrice = prices.slice(-30).reduce((sum, p) => sum + p, 0) / Math.min(30, prices.length);
    const relativeVolatility = avgPrice > 0 ? volatility / avgPrice : 1;

    const volatilityScore = Math.max(0, 1 - relativeVolatility);

    // Weighted confidence: 70% data availability, 30% low volatility
    return Number((dataScore * 0.7 + volatilityScore * 0.3).toFixed(2));
  }

  /**
   * Calculate price volatility (standard deviation)
   * @private
   */
  _calculateVolatility(prices) {
    if (prices.length === 0) return 0;

    const mean = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    const variance = prices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / prices.length;
    return Math.sqrt(variance);
  }

  /**
   * Generate market insights from price changes
   * @private
   */
  _generateInsights(weekChange, monthChange, currentPrice) {
    const insights = [];

    // Weekly trend insight
    insights.push({
      section: 'Price Momentum',
      headline: `Prices ${weekChange >= 0 ? 'increased' : 'decreased'} ${Math.abs(weekChange * 100).toFixed(1)}% in the last week`,
      impact_score: Number(Math.min(10, Math.abs(weekChange * 100) * 2).toFixed(1)),
      summary: weekChange >= 0
        ? 'Short-term demand remains supportive with modest upward momentum.'
        : 'Short-term correction observed; monitor supply contracts closely.',
      confidence: 0.6,
      sources: ['Price history']
    });

    // Monthly trend insight
    insights.push({
      section: 'Monthly Trend',
      headline: `30-day trend ${monthChange >= 0 ? 'positive' : 'negative'} at ${(monthChange * 100).toFixed(1)}%`,
      impact_score: Number(Math.min(10, Math.abs(monthChange * 100) * 1.5).toFixed(1)),
      summary: monthChange >= 0
        ? 'Medium-term outlook stable with incremental gains.'
        : 'Medium-term softness suggests revisiting sales guidance.',
      confidence: 0.55,
      sources: ['Price history']
    });

    return insights;
  }

  /**
   * Generate AI-powered market insight
   * @private
   */
  async _generateAIInsight(priceData) {
    if (!llmProvider.isEnabled()) {
      return null;
    }

    try {
      const sentiment = {
        overall_sentiment: priceData.sentiment
      };

      return await llmProvider.generateMarketInsight(priceData, sentiment);

    } catch (error) {
      console.warn('[MarketOrchestrator] Failed to generate AI insight:', error.message);
      return null; // Graceful degradation
    }
  }

  /**
   * Get neutral sentiment response (fallback)
   * @private
   */
  _getNeutralSentiment(reason = 'No data available') {
    return {
      overall_sentiment: 'NEUTRAL',
      sentiment_score: 0,
      confidence: 0.5,
      current_price: null,
      week_change_percent: 0,
      month_change_percent: 0,
      ai_insight: null,
      insights: [
        {
          section: 'Status',
          headline: 'Market sentiment unavailable',
          impact_score: 0,
          summary: `Unable to analyze market sentiment: ${reason}`,
          confidence: 0,
          sources: []
        }
      ],
      timestamp: new Date().toISOString()
    };
  }
}

// Export singleton instance
const marketOrchestrator = new MarketOrchestrator();
export default marketOrchestrator;
