import { settings } from "../settings.js";
import { logApiUsage } from "./demoCache.js";

/**
 * LLM Service - Unified interface for OpenAI and Anthropic
 * Supports switching between providers via environment config
 */

// OpenAI Integration
const callOpenAI = async (prompt, { maxTokens = 500, temperature = 0.7 } = {}) => {
  const apiKey = settings.openAiKey;
  if (!apiKey) throw new Error("OpenAI API key not configured");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini", // Cost-effective model
      messages: [{ role: "user", content: prompt }],
      max_tokens: maxTokens,
      temperature
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  await logApiUsage({
    provider: "openai",
    model: "gpt-4o-mini",
    tokens_used: data.usage?.total_tokens || 0,
    cost_estimate: (data.usage?.total_tokens || 0) * 0.00015 / 1000, // Approximate cost
    timestamp: new Date().toISOString()
  });

  return data.choices[0]?.message?.content || "";
};

// Anthropic Integration
const callAnthropic = async (prompt, { maxTokens = 500, temperature = 0.7 } = {}) => {
  const apiKey = settings.claudeKey;
  if (!apiKey) throw new Error("Anthropic API key not configured");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-3-5-haiku-20241022", // Fast and cost-effective
      max_tokens: maxTokens,
      temperature,
      messages: [{ role: "user", content: prompt }]
    })
  });

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  await logApiUsage({
    provider: "anthropic",
    model: "claude-3-5-haiku-20241022",
    tokens_used: data.usage?.input_tokens + data.usage?.output_tokens || 0,
    cost_estimate: ((data.usage?.input_tokens || 0) * 0.00025 + (data.usage?.output_tokens || 0) * 0.00125) / 1000,
    timestamp: new Date().toISOString()
  });

  return data.content[0]?.text || "";
};

/**
 * Main LLM call function - routes to appropriate provider
 */
export const callLLM = async (prompt, options = {}) => {
  const provider = settings.llmProvider;

  if (provider === "none" || provider === "disabled") {
    console.log("LLM disabled, using fallback");
    return null;
  }

  try {
    if (provider === "openai") {
      return await callOpenAI(prompt, options);
    } else if (provider === "anthropic") {
      return await callAnthropic(prompt, options);
    } else {
      throw new Error(`Unknown LLM provider: ${provider}`);
    }
  } catch (error) {
    console.error(`LLM call failed: ${error.message}`);
    return null;
  }
};

/**
 * Generate market insight summary using LLM
 */
export const generateMarketInsight = async (priceData, sentiment) => {
  const prompt = `You are a cashew market analyst. Based on the following data, provide a brief 2-3 sentence market insight.

Recent Price Data:
- Current Price: $${priceData.currentPrice}
- 7-day change: ${priceData.weekChange}%
- 30-day change: ${priceData.monthChange}%
- Trend: ${sentiment.overall_sentiment}

Provide actionable insights for traders and buyers. Focus on what this means for near-term market conditions.`;

  const insight = await callLLM(prompt, { maxTokens: 200, temperature: 0.7 });
  return insight || "Market conditions remain stable with moderate price fluctuations.";
};

/**
 * Generate forecast explanation using LLM
 */
export const generateForecastExplanation = async (forecast, historicalData) => {
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

  const explanation = await callLLM(prompt, { maxTokens: 200, temperature: 0.7 });
  return explanation || `The forecast predicts a ${forecast.trendLabel.toLowerCase()} trend over the next ${forecast.horizonDays} days with ${(forecast.confidenceScore * 100).toFixed(0)}% confidence.`;
};

/**
 * Enhance news summary with LLM analysis
 */
export const enhanceNewsWithLLM = async (newsItems) => {
  if (!newsItems || newsItems.length === 0) return newsItems;

  const prompt = `Analyze these cashew market news headlines and provide a 1-sentence market implication for each:

${newsItems.map((item, idx) => `${idx + 1}. ${item.title}: ${item.summary}`).join('\n')}

Return ONLY a JSON array with enhanced summaries, no other text:
[{"index": 0, "implication": "one sentence here"}, ...]`;

  try {
    const response = await callLLM(prompt, { maxTokens: 300, temperature: 0.5 });
    if (!response) return newsItems;

    const enhanced = JSON.parse(response);
    return newsItems.map((item, idx) => ({
      ...item,
      ai_implication: enhanced.find(e => e.index === idx)?.implication || ""
    }));
  } catch (error) {
    console.error("Failed to enhance news with LLM:", error.message);
    return newsItems;
  }
};

export default {
  callLLM,
  generateMarketInsight,
  generateForecastExplanation,
  enhanceNewsWithLLM
};
