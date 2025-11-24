/**
 * Worker 2: Market Movement
 * Processes market scanning and sentiment analysis
 */

import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import db from '../db/client';
import { JobPayload, orchestrator } from '../services/orchestrator';
import { freshnessCheckService } from '../services/freshness-check';
import { llmBroker } from '../../../ai-broker/src/broker';
import { v4 as uuidv4 } from 'uuid';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const connection = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
});

interface MarketSignal {
  source: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  strength: 'strong' | 'moderate' | 'weak';
  confidence: number;
  description: string;
  url?: string;
}

interface MarketWorkerResult {
  profileId: string;
  overallSentiment: 'bullish' | 'bearish' | 'neutral';
  sentimentScore: number; // -1 to 1
  signals: MarketSignal[];
  summary: string;
  topDrivers: { factor: string; impact: number }[];
}

class MarketWorker {
  private worker: Worker;

  constructor() {
    this.worker = new Worker<JobPayload>(
      'market-scan',
      async (job: Job<JobPayload>) => {
        return await this.process(job);
      },
      {
        connection,
        concurrency: 3, // Process 3 jobs simultaneously
      }
    );

    this.worker.on('completed', (job) => {
      console.log(`[Market Worker] Job ${job.id} completed`);
    });

    this.worker.on('failed', (job, err) => {
      console.error(`[Market Worker] Job ${job?.id} failed:`, err.message);
    });

    console.log('[Market Worker] Started');
  }

  private async process(job: Job<JobPayload>): Promise<MarketWorkerResult> {
    const { jobId, profileId } = job.data;

    console.log(`[Market Worker] Processing job ${jobId} for profile ${profileId}`);

    await orchestrator.updateJobStatus(jobId, 'running');

    try {
      // 1. Load profile to get keywords
      const profile = await this.loadProfile(profileId);

      // 2. Scan market using Perplexity
      const rawSignals = await this.scanMarket(profile);

      // 3. Save raw data to Bronze
      const bronzeId = await this.saveToBronze(profileId, rawSignals);

      // 4. Parse and clean signals to Silver
      const cleanSignals = await this.parseSignals(rawSignals);
      await this.saveToSilver(profileId, cleanSignals, bronzeId);

      // 5. Generate summary using ChatGPT
      const summary = await this.generateSummary(cleanSignals);

      // 6. Calculate overall sentiment and top drivers
      const analysis = this.analyzeSignals(cleanSignals);

      // 7. Save to Gold layer
      await this.saveToGold(profileId, jobId, {
        ...analysis,
        signals: cleanSignals,
        summary,
      });

      // 8. Update freshness
      await freshnessCheckService.updateFreshness(profileId, 'market_scan');

      await orchestrator.updateJobStatus(jobId, 'completed');

      console.log(`[Market Worker] Job ${jobId} completed`);

      return {
        profileId,
        ...analysis,
        signals: cleanSignals,
        summary,
      };
    } catch (error: any) {
      console.error(`[Market Worker] Job ${jobId} failed:`, error.message);
      await orchestrator.updateJobStatus(jobId, 'failed', error.message);
      throw error;
    }
  }

  private async loadProfile(profileId: string): Promise<any> {
    const result = await db.query(
      `SELECT * FROM public.profiles WHERE id = $1`,
      [profileId]
    );

    if (result.rows.length === 0) {
      throw new Error('Profile not found');
    }

    return result.rows[0];
  }

  private async scanMarket(profile: any): Promise<string> {
    const keywords = profile.keywords.join(', ');
    const entities = profile.entities.map((e: any) => e.value).join(', ');

    const prompt = `
Analyze the current market conditions for ${entities} in the ${profile.region} region.
Focus on: ${keywords}

Please provide:
1. Overall market sentiment (bullish, bearish, or neutral)
2. Key market drivers and their impact
3. Recent price movements or trends
4. Supply and demand factors
5. Any significant news or events affecting the market

Format your response as a structured analysis with clear sections.
    `.trim();

    const response = await llmBroker.execute({
      task: 'market_scan',
      prompt,
      temperature: 0.5,
      maxTokens: 2000,
    });

    return response.response;
  }

  private async saveToBronze(profileId: string, rawData: string): Promise<string> {
    const id = uuidv4();

    await db.query(
      `INSERT INTO bronze.raw_market_scan
       (id, profile_id, source, raw_content, raw_data, scan_timestamp)
       VALUES ($1, $2, 'perplexity', $3, $4, NOW())`,
      [id, profileId, rawData, JSON.stringify({ raw: rawData })]
    );

    return id;
  }

  private async parseSignals(rawData: string): Promise<MarketSignal[]> {
    // In a real implementation, this would use NLP to extract signals
    // For now, we'll create synthetic signals based on the raw data

    const signals: MarketSignal[] = [
      {
        source: 'Market Analysis',
        sentiment: this.detectSentiment(rawData),
        strength: 'strong',
        confidence: 0.85,
        description: rawData.substring(0, 200),
      },
    ];

    return signals;
  }

  private detectSentiment(text: string): 'bullish' | 'bearish' | 'neutral' {
    const bullishWords = ['increase', 'growth', 'rising', 'positive', 'strong', 'demand'];
    const bearishWords = ['decrease', 'decline', 'falling', 'negative', 'weak', 'oversupply'];

    const lowerText = text.toLowerCase();
    const bullishCount = bullishWords.filter((w) => lowerText.includes(w)).length;
    const bearishCount = bearishWords.filter((w) => lowerText.includes(w)).length;

    if (bullishCount > bearishCount) return 'bullish';
    if (bearishCount > bullishCount) return 'bearish';
    return 'neutral';
  }

  private async saveToSilver(
    profileId: string,
    signals: MarketSignal[],
    bronzeId: string
  ): Promise<void> {
    for (const signal of signals) {
      await db.query(
        `INSERT INTO silver.market_signals
         (profile_id, source, sentiment, strength, confidence, description, extracted_at, bronze_id)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7)`,
        [
          profileId,
          signal.source,
          signal.sentiment,
          signal.strength,
          signal.confidence,
          signal.description,
          bronzeId,
        ]
      );
    }
  }

  private async generateSummary(signals: MarketSignal[]): Promise<string> {
    const signalText = signals.map((s) => `${s.source}: ${s.description}`).join('\n');

    const prompt = `
Summarize the following market signals in 2-3 concise sentences:

${signalText}

Provide a clear, actionable summary for traders.
    `.trim();

    const response = await llmBroker.execute({
      task: 'market_summary',
      prompt,
      temperature: 0.3,
      maxTokens: 200,
    });

    return response.response;
  }

  private analyzeSignals(signals: MarketSignal[]): {
    overallSentiment: 'bullish' | 'bearish' | 'neutral';
    sentimentScore: number;
    topDrivers: { factor: string; impact: number }[];
  } {
    // Calculate sentiment score
    let score = 0;
    for (const signal of signals) {
      const weight = signal.confidence;
      if (signal.sentiment === 'bullish') score += weight;
      if (signal.sentiment === 'bearish') score -= weight;
    }

    score = score / signals.length;

    // Determine overall sentiment
    let overallSentiment: 'bullish' | 'bearish' | 'neutral';
    if (score > 0.2) overallSentiment = 'bullish';
    else if (score < -0.2) overallSentiment = 'bearish';
    else overallSentiment = 'neutral';

    // Extract top drivers
    const topDrivers = signals
      .map((s) => ({
        factor: s.source,
        impact: s.confidence * (s.sentiment === 'bullish' ? 1 : -1),
      }))
      .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
      .slice(0, 5);

    return {
      overallSentiment,
      sentimentScore: score,
      topDrivers,
    };
  }

  private async saveToGold(
    profileId: string,
    jobId: string,
    result: Omit<MarketWorkerResult, 'profileId'>
  ): Promise<void> {
    await db.query(
      `INSERT INTO gold.market_summary
       (profile_id, job_id, scan_date, sentiment, sentiment_score, signal_count, summary_text, top_drivers, provider)
       VALUES ($1, $2, NOW(), $3, $4, $5, $6, $7, 'perplexity')`,
      [
        profileId,
        jobId,
        result.overallSentiment,
        result.sentimentScore,
        result.signals.length,
        result.summary,
        JSON.stringify(result.topDrivers),
      ]
    );
  }

  async close(): Promise<void> {
    await this.worker.close();
    await connection.quit();
  }
}

// Start worker if run directly
if (require.main === module) {
  const marketWorker = new MarketWorker();

  process.on('SIGTERM', async () => {
    console.log('[Market Worker] Received SIGTERM, shutting down...');
    await marketWorker.close();
    process.exit(0);
  });
}

export { MarketWorker };
