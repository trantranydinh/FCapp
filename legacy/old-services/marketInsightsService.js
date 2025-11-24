import { fetchHistoricalPrices } from "./priceService.js";
import { generateMarketInsight } from "./llmService.js";

export const getMarketSentiment = async () => {
  const history = await fetchHistoricalPrices(6);
  const { prices } = history;
  if (!prices.length) {
    return {
      overall_sentiment: "NEUTRAL",
      sentiment_score: 0,
      confidence: 0.5,
      insights: []
    };
  }

  const lastPrice = prices.at(-1);
  const weekPrice = prices.at(-7) || lastPrice;
  const monthPrice = prices.at(-30) || lastPrice;

  const weekChange = (lastPrice - weekPrice) / Math.max(weekPrice, 1);
  const monthChange = (lastPrice - monthPrice) / Math.max(monthPrice, 1);

  const score = Number(((weekChange * 0.6 + monthChange * 0.4) * 100).toFixed(2));
  const sentiment = score > 2 ? "BULLISH" : score < -2 ? "BEARISH" : "NEUTRAL";

  // Generate AI-powered insight
  let aiInsight = null;
  try {
    aiInsight = await generateMarketInsight(
      {
        currentPrice: lastPrice,
        weekChange: Number((weekChange * 100).toFixed(2)),
        monthChange: Number((monthChange * 100).toFixed(2))
      },
      { overall_sentiment: sentiment }
    );
  } catch (error) {
    console.warn("Failed to generate AI insight:", error.message);
  }

  return {
    overall_sentiment: sentiment,
    sentiment_score: score,
    confidence: 0.6,
    ai_insight: aiInsight,
    insights: [
      {
        section: "Price Momentum",
        headline: `Prices ${weekChange >= 0 ? "increased" : "decreased"} ${Math.abs(weekChange * 100).toFixed(1)}% in the last week`,
        impact_score: Math.min(10, Math.abs(weekChange * 100) * 2),
        summary:
          weekChange >= 0
            ? "Short-term demand remains supportive with modest upward momentum."
            : "Short-term correction observed; monitor supply contracts closely.",
        confidence: 0.6,
        sources: ["Price history"]
      },
      {
        section: "Monthly Trend",
        headline: `30-day trend ${monthChange >= 0 ? "positive" : "negative"} at ${(monthChange * 100).toFixed(1)}%`,
        impact_score: Math.min(10, Math.abs(monthChange * 100) * 1.5),
        summary:
          monthChange >= 0
            ? "Medium-term outlook stable with incremental gains."
            : "Medium-term softness suggests revisiting sales guidance.",
        confidence: 0.55,
        sources: ["Price history"]
      }
    ]
  };
};
