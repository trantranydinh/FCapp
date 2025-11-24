/**
 * Market Movement Types
 * Market scanning and sentiment analysis
 */

export type MarketSentiment = 'bullish' | 'bearish' | 'neutral';
export type SignalStrength = 'strong' | 'moderate' | 'weak';

export interface MarketSignal {
  id: string;
  profileId: string;
  source: string;
  sentiment: MarketSentiment;
  strength: SignalStrength;
  confidence: number;
  description: string;
  extractedAt: Date;
  url?: string;
}

export interface MarketSummary {
  id: string;
  profileId: string;
  scanDate: Date;
  sentiment: MarketSentiment;
  signalCount: number;
  volumeIndicator: number;
  summaryText: string;
  provider: string; // 'perplexity', 'gemini', 'chatgpt'
  signals: MarketSignal[];
  createdAt: Date;
}

export interface MarketMovementResult {
  profileId: string;
  scanTimestamp: string;
  overallSentiment: MarketSentiment;
  sentimentScore: number; // -1 to 1
  signals: MarketSignal[];
  summary: string;
  topDrivers: {
    factor: string;
    impact: number;
    sentiment: MarketSentiment;
  }[];
}
