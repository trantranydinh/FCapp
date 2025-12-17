/**
 * Worker 2: Market Movement
 * Processes market scanning and sentiment analysis
 */

import { Worker } from 'bullmq';
import Redis from 'ioredis';
import db from '../db/mysqlClient.js';
import jsonCache from '../infrastructure/data/JSONCache.js';
import llmProvider from '../infrastructure/llm/LLMProvider.js';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const connection = new Redis(REDIS_URL, {
    maxRetriesPerRequest: null,
});

class MarketWorker {
    constructor() {
        this.worker = new Worker(
            'market-scan',
            async (job) => {
                return await this.process(job);
            },
            {
                connection,
                concurrency: 3, // Process 3 jobs simultaneously
                limiter: {
                    max: 10,
                    duration: 60000
                }
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

    async process(job) {
        const { jobId, profileId } = job.data;

        console.log(`[Market Worker] Processing job ${jobId} for profile ${profileId}`);

        await jsonCache.logJobRun({
            runId: jobId,
            module: 'MARKET_WORKER',
            status: 'RUNNING',
            timestamp: new Date().toISOString()
        });

        try {
            // 1. Load profile to get keywords
            const profile = await this.loadProfile(profileId);

            // 2. Scan market using Perplexity (simulated via LLM here)
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

            // 8. Update freshness (skipping)
            // await freshnessCheckService.updateFreshness(profileId, 'market_scan');

            await jsonCache.logJobRun({
                runId: jobId,
                module: 'MARKET_WORKER',
                status: 'COMPLETED',
                timestamp: new Date().toISOString()
            });

            console.log(`[Market Worker] Job ${jobId} completed`);

            return {
                profileId,
                ...analysis,
                signals: cleanSignals,
                summary,
            };
        } catch (error) {
            console.error(`[Market Worker] Job ${jobId} failed:`, error.message);
            await jsonCache.logJobRun({
                runId: jobId,
                module: 'MARKET_WORKER',
                status: 'FAILED',
                error: error.message,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    }

    async loadProfile(profileId) {
        const [rows] = await db.query(
            `SELECT * FROM public.profiles WHERE id = ?`,
            [profileId]
        );

        if (rows.length === 0) {
            console.warn('[Market Worker] Profile not found, using default.');
            return {
                keywords: ['cashew'],
                entities: [{ value: 'Cashew Kernels' }],
                region: 'Global'
            };
        }

        return rows[0];
    }

    async scanMarket(profile) {
        const keywords = (profile.keywords || []).join(', ');
        const entities = (profile.entities || []).map((e) => e.value).join(', ');

        const prompt = `
Analyze the current market conditions for ${entities} in the ${profile.region || 'Global'} region.
Focus on: ${keywords}

Please provide:
1. Overall market sentiment (bullish, bearish, or neutral)
2. Key market drivers and their impact
3. Recent price movements or trends
4. Supply and demand factors
5. Any significant news or events affecting the market

Format your response as a structured analysis with clear sections.
    `.trim();

        const responseContent = await llmProvider.call(prompt, { maxTokens: 2000, temperature: 0.5 });
        return responseContent || "Market analysis unavailable.";
    }

    async saveToBronze(profileId, rawData) {
        const id = uuidv4();

        await db.query(
            `INSERT INTO bronze.raw_market_scan
       (id, profile_id, source, raw_content, raw_data, scan_timestamp)
       VALUES (?, ?, 'perplexity', ?, ?, NOW())`,
            [id, profileId, rawData, JSON.stringify({ raw: rawData })]
        );

        return id;
    }

    async parseSignals(rawData) {
        // In a real implementation, this would use NLP to extract signals
        // For now, we'll create synthetic signals based on the raw data

        const signals = [
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

    detectSentiment(text) {
        const bullishWords = ['increase', 'growth', 'rising', 'positive', 'strong', 'demand'];
        const bearishWords = ['decrease', 'decline', 'falling', 'negative', 'weak', 'oversupply'];

        const lowerText = text.toLowerCase();
        const bullishCount = bullishWords.filter((w) => lowerText.includes(w)).length;
        const bearishCount = bearishWords.filter((w) => lowerText.includes(w)).length;

        if (bullishCount > bearishCount) return 'bullish';
        if (bearishCount > bullishCount) return 'bearish';
        return 'neutral';
    }

    async saveToSilver(profileId, signals, bronzeId) {
        for (const signal of signals) {
            await db.query(
                `INSERT INTO silver.market_signals
         (profile_id, source, sentiment, strength, confidence, description, extracted_at, bronze_id)
         VALUES (?, ?, ?, ?, ?, ?, NOW(), ?)`,
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

    async generateSummary(signals) {
        const signalText = signals.map((s) => `${s.source}: ${s.description}`).join('\n');

        const prompt = `
Summarize the following market signals in 2-3 concise sentences:

${signalText}

Provide a clear, actionable summary for traders.
    `.trim();

        const responseContent = await llmProvider.call(prompt, { maxTokens: 200, temperature: 0.3 });
        return responseContent || "No summary available.";
    }

    analyzeSignals(signals) {
        // Calculate sentiment score
        let score = 0;
        for (const signal of signals) {
            const weight = signal.confidence;
            if (signal.sentiment === 'bullish') score += weight;
            if (signal.sentiment === 'bearish') score -= weight;
        }

        score = score / signals.length;

        // Determine overall sentiment
        let overallSentiment;
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

    async saveToGold(profileId, jobId, result) {
        await db.query(
            `INSERT INTO gold.market_summary
       (profile_id, job_id, scan_date, sentiment, sentiment_score, signal_count, summary_text, top_drivers, provider)
       VALUES (?, ?, NOW(), ?, ?, ?, ?, ?, 'perplexity')`,
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

    async close() {
        await this.worker.close();
        await connection.quit();
    }
}

// Start worker if run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const marketWorker = new MarketWorker();

    process.on('SIGTERM', async () => {
        console.log('[Market Worker] Received SIGTERM, shutting down...');
        await marketWorker.close();
        process.exit(0);
    });
}

export { MarketWorker };
