/**
 * INFRASTRUCTURE LAYER: LLM Provider
 *
 * Responsibility: Unified interface for OpenAI and Anthropic LLM calls
 * Used by: Application layer services for AI-powered insights
 */

import jsonCache from '../data/JSONCache.js';

class LLMProvider {
  constructor() {
    this.provider = null;
    this.openAiKey = null;
    this.claudeKey = null;
  }

  /**
   * Configure LLM provider with settings
   * @param {object} config - Configuration { provider, openAiKey, claudeKey }
   */
  configure(config) {
    this.provider = config.provider || 'none';
    this.openAiKey = config.openAiKey;
    this.claudeKey = config.claudeKey;
    console.log(`[LLMProvider] Configured with provider: ${this.provider}`);
  }

  /**
   * Call OpenAI API
   * @private
   */
  async _callOpenAI(prompt, { maxTokens = 500, temperature = 0.7 } = {}) {
    if (!this.openAiKey) throw new Error('OpenAI API key not configured');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.openAiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Cost-effective model
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
        temperature
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Log API usage
    await jsonCache.logApiUsage({
      provider: 'openai',
      model: 'gpt-4o-mini',
      tokens_used: data.usage?.total_tokens || 0,
      cost_estimate: (data.usage?.total_tokens || 0) * 0.00015 / 1000,
      timestamp: new Date().toISOString()
    });

    return data.choices[0]?.message?.content || '';
  }

  /**
   * Call Anthropic Claude API
   * @private
   */
  async _callAnthropic(prompt, { maxTokens = 500, temperature = 0.7 } = {}) {
    if (!this.claudeKey) throw new Error('Anthropic API key not configured');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.claudeKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022', // Fast and cost-effective
        max_tokens: maxTokens,
        temperature,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Log API usage
    await jsonCache.logApiUsage({
      provider: 'anthropic',
      model: 'claude-3-5-haiku-20241022',
      tokens_used: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
      cost_estimate: ((data.usage?.input_tokens || 0) * 0.00025 + (data.usage?.output_tokens || 0) * 0.00125) / 1000,
      timestamp: new Date().toISOString()
    });

    return data.content[0]?.text || '';
  }

  /**
   * Main LLM call - routes to appropriate provider
   * @param {string} prompt - The prompt to send to LLM
   * @param {object} options - Options { maxTokens, temperature }
   * @returns {Promise<string|null>} - LLM response or null if disabled
   */
  async call(prompt, options = {}) {
    if (this.provider === 'none' || this.provider === 'disabled') {
      console.log('[LLMProvider] LLM disabled, using fallback');
      return null;
    }

    try {
      if (this.provider === 'openai') {
        return await this._callOpenAI(prompt, options);
      } else if (this.provider === 'anthropic') {
        return await this._callAnthropic(prompt, options);
      } else {
        throw new Error(`Unknown LLM provider: ${this.provider}`);
      }
    } catch (error) {
      console.error(`[LLMProvider] Call failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Generate market insight summary
   */
  async generateMarketInsight(priceData, sentiment) {
    const prompt = `You are a cashew market analyst. Based on the following data, provide a brief 2-3 sentence market insight.

Recent Price Data:
- Current Price: $${priceData.currentPrice}
- 7-day change: ${priceData.weekChange}%
- 30-day change: ${priceData.monthChange}%
- Trend: ${sentiment.overall_sentiment}

Provide actionable insights for traders and buyers. Focus on what this means for near-term market conditions.`;

    const insight = await this.call(prompt, { maxTokens: 200, temperature: 0.7 });
    return insight || 'Market conditions remain stable with moderate price fluctuations.';
  }

  /**
   * Generate forecast explanation
   */
  async generateForecastExplanation(forecast, historicalData) {
    const prompt = `You are a cashew price forecasting expert. Explain this forecast in simple terms for business stakeholders.

Forecast Details:
- Base Price: $${forecast.basePrice}
- Trend: ${forecast.trendLabel}
- Trend Change: ${(forecast.trendPercentage * 100).toFixed(2)}%
- Confidence: ${(forecast.confidenceScore * 100).toFixed(0)}%
- Forecast Period: ${forecast.horizonDays} days

Historical Context:
- Recent price volatility: ${historicalData.volatility}%
- Average price (30d): $${historicalData.avg30d}

Provide a 2-3 sentence explanation that non-technical stakeholders can understand.`;

    const explanation = await this.call(prompt, { maxTokens: 200, temperature: 0.7 });
    return explanation || `The forecast predicts a ${forecast.trendLabel.toLowerCase()} trend over the next ${forecast.horizonDays} days with ${(forecast.confidenceScore * 100).toFixed(0)}% confidence.`;
  }

  /**
   * Enhance news with LLM analysis
   */
  async enhanceNews(newsItem) {
    const prompt = `You are a market analyst. Analyze this news headline and provide a brief 1-sentence market implication.

Headline: ${newsItem.title}
Summary: ${newsItem.summary || 'No summary available'}

What does this mean for cashew prices in the short term?`;

    const implication = await this.call(prompt, { maxTokens: 100, temperature: 0.7 });
    return implication || 'Market impact uncertain, monitor for further developments.';
  }

  /**
   * Check if LLM is enabled
   */
  isEnabled() {
    return this.provider !== 'none' && this.provider !== 'disabled';
  }

  /**
   * Get current provider
   */
  getProvider() {
    return this.provider;
  }
}

// Export singleton instance
const llmProvider = new LLMProvider();
export default llmProvider;

// Also export for backwards compatibility
export const callLLM = (prompt, options) => llmProvider.call(prompt, options);
export const generateMarketInsight = (priceData, sentiment) => llmProvider.generateMarketInsight(priceData, sentiment);
export const generateForecastExplanation = (forecast, historicalData) => llmProvider.generateForecastExplanation(forecast, historicalData);
