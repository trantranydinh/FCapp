/**
 * APPLICATION LAYER: Market Orchestrator
 *
 * Responsibility: Derive quantitative insights from structured market data.
 * Core Philosophy: Market Insights are numeric, deterministic, and strictly data-driven.
 *
 * Capabilities:
 * - Market Regime Detection (Trend vs Range)
 * - Momentum Analysis (RSI, ROC)
 * - Volatility Assessment
 * - Anomaly Detection
 */

import llmProvider from '../infrastructure/llm/LLMProvider.js';
import priceOrchestrator from './PriceOrchestrator.js';

class MarketOrchestrator {
  /**
   * Get comprehensive market insights
   *
   * @returns {Promise<object>} Quantitative market analysis
   */
  async getMarketInsights() {
    console.log('[MarketOrchestrator] Generating quantitative market insights');

    try {
      // Step 1: Get recent price history (180 days for full context)
      const history = await priceOrchestrator.getHistoricalPrices(6);
      const { prices, dates } = history;

      // Validate data availability
      if (!prices || prices.length < 30) {
        return this._getFallbackState('Insufficient price data for technical analysis');
      }

      // Step 2: Technical Analysis Calculation
      const currentPrice = prices[prices.length - 1];
      const rsi = this._calculateRSI(prices, 14);
      const sma50 = this._calculateSMA(prices, 50);
      const sma20 = this._calculateSMA(prices, 20);
      const volatility = this._calculateVolatility(prices.slice(-30));

      // Step 3: Determine Market Regime
      const regime = this._determineMarketRegime(currentPrice, sma20, sma50, rsi);

      // Step 4: Detect Anomalies
      const anomaly = this._detectAnomaly(prices);

      // Step 5: Generate Quantitative Signals
      const signals = this._generateSignals({
        currentPrice,
        prevPrice: prices[prices.length - 2],
        rsi,
        volatility,
        regime
      });

      // Step 6: AI-Enhanced Explanation (Optional - Strictly for summarizing numbers)
      const aiSummary = await this._generateQuantitativeSummary({
        currentPrice,
        rsi: rsi.toFixed(1),
        regime: regime.state,
        volatility: (volatility * 100).toFixed(2),
        trend_strength: regime.strength
      });

      return {
        market_regime: regime,
        key_metrics: {
          current_price: Number(currentPrice.toFixed(2)),
          rsi: Number(rsi.toFixed(2)),
          volatility_30d: Number(volatility.toFixed(4)),
          sma_50: sma50 ? Number(sma50.toFixed(2)) : null,
          is_anomaly: anomaly.isAnomaly
        },
        signals: signals,
        ai_summary: aiSummary, // Null if disabled
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('[MarketOrchestrator] Insight generation failed:', error.message);
      return this._getFallbackState(error.message);
    }
  }

  // ========== TECHNICAL INDICATORS ==========

  /**
   * Calculate Relative Strength Index (RSI)
   * @private
   */
  _calculateRSI(prices, period = 14) {
    if (prices.length < period + 1) return 50;

    let gains = 0;
    let losses = 0;

    // First period
    for (let i = 1; i <= period; i++) {
      const change = prices[i] - prices[i - 1];
      if (change >= 0) gains += change;
      else losses -= change;
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    // Smoothed RSI
    for (let i = period + 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      if (change >= 0) {
        avgGain = (avgGain * (period - 1) + change) / period;
        avgLoss = (avgLoss * (period - 1)) / period;
      } else {
        avgGain = (avgGain * (period - 1)) / period;
        avgLoss = (avgLoss * (period - 1) - change) / period;
      }
    }

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  /**
   * Calculate Simple Moving Average (SMA)
   * @private
   */
  _calculateSMA(prices, period) {
    if (prices.length < period) return null;
    const slice = prices.slice(-period);
    const sum = slice.reduce((a, b) => a + b, 0);
    return sum / period;
  }

  /**
   * Calculate Volatility (Standard Deviation of log returns)
   * @private
   */
  _calculateVolatility(prices) {
    if (prices.length < 2) return 0;
    const logReturns = [];
    for (let i = 1; i < prices.length; i++) {
      logReturns.push(Math.log(prices[i] / prices[i - 1]));
    }
    const mean = logReturns.reduce((a, b) => a + b, 0) / logReturns.length;
    const variance = logReturns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / logReturns.length;
    return Math.sqrt(variance); // Daily volatility
  }

  // ========== LOGIC CORE ==========

  /**
   * Determine Market Regime (Bull/Bear/Neutral + Strength)
   * @private
   */
  _determineMarketRegime(price, sma20, sma50, rsi) {
    let state = 'NEUTRAL';
    let strength = 'MODERATE';

    // Trend Direction
    if (sma20 && sma50) {
      if (price > sma20 && sma20 > sma50) state = 'BULLISH_TREND';
      else if (price < sma20 && sma20 < sma50) state = 'BEARISH_TREND';
      else if (Math.abs(sma20 - sma50) / sma50 < 0.01) state = 'CONSOLIDATION'; // <1% diff
    }

    // Trend Strength via RSI
    if (rsi > 70) strength = 'OVERBOUGHT';
    if (rsi < 30) strength = 'OVERSOLD';
    if (rsi > 60 && rsi <= 70) strength = 'STRONG';
    if (rsi < 40 && rsi >= 30) strength = 'WEAK';

    return { state, strength };
  }

  /**
   * Simple Statistical Anomaly Detection (Z-Score based)
   * @private
   */
  _detectAnomaly(prices) {
    if (prices.length < 30) return { isAnomaly: false };

    const window = prices.slice(-30);
    const current = window[window.length - 1];
    const mean = window.reduce((a, b) => a + b, 0) / window.length;
    const stdDev = Math.sqrt(window.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / window.length);

    const zScore = (current - mean) / (stdDev || 1);

    return {
      isAnomaly: Math.abs(zScore) > 2.5, // >2.5 sigma event
      zScore: zScore
    };
  }

  /**
   * Generate human-readable signals from data
   * @private
   */
  _generateSignals(data) {
    const signals = [];

    // Momentum Signal
    if (data.rsi > 70) {
      signals.push({
        type: 'MOMENTUM',
        status: 'WARNING',
        message: `RSI is ${data.rsi.toFixed(0)} (Overbought). Potential pull-back risk.`
      });
    } else if (data.rsi < 30) {
      signals.push({
        type: 'MOMENTUM',
        status: 'OPPORTUNITY',
        message: `RSI is ${data.rsi.toFixed(0)} (Oversold). Potential accumulation zone.`
      });
    } else {
      signals.push({
        type: 'MOMENTUM',
        status: 'NEUTRAL',
        message: `Momentum is stable (RSI: ${data.rsi.toFixed(0)}).`
      });
    }

    // Volatility Signal
    const volPct = (data.volatility * 100).toFixed(2);
    if (data.volatility > 0.02) { // >2% daily moves
      signals.push({
        type: 'VOLATILITY',
        status: 'HIGH',
        message: `High volatility detected (${volPct}% daily). Wide stops recommended.`
      });
    }

    // Regime Signal
    signals.push({
      type: 'REGIME',
      status: 'INFO',
      message: `Market is in ${data.regime.state.replace('_', ' ')} phase with ${data.regime.strength} momentum.`
    });

    return signals;
  }

  // ========== AI EXPLANATION ==========

  async _generateQuantitativeSummary(metrics) {
    if (!llmProvider.isEnabled()) return null;

    const prompt = `
Context: Quantitative Market Analysis for Cashew Kernels.
Data:
- Current Price: $${metrics.currentPrice}
- RSI (14): ${metrics.rsi} (Momentum indicator)
- Volatility (30d): ${metrics.volatility}%
- Detected Regime: ${metrics.regime}
- Strength: ${metrics.trend_strength}

Task: Provide a factual, data-driven summary of the market state in strictly 2 sentences.
Rules:
- Do NOT use emotional words (hope, fear).
- Do NOT mention news or external events.
- Focus ONLY on the technical indicators provided.
- Describe the statistical state (e.g., "The market is exhibiting strong trend continuation...").
      `.trim();

    try {
      return await llmProvider.call(prompt, { maxTokens: 150, temperature: 0.2 });
    } catch (e) {
      console.warn('AI Summary failed', e);
      return null;
    }
  }

  _getFallbackState(reason) {
    return {
      market_regime: { state: 'UNKNOWN', strength: 'UNKNOWN' },
      key_metrics: {},
      signals: [{ type: 'SYSTEM', status: 'ERROR', message: reason }],
      ai_summary: null,
      timestamp: new Date().toISOString()
    };
  }
}

const marketOrchestrator = new MarketOrchestrator();
export default marketOrchestrator;
