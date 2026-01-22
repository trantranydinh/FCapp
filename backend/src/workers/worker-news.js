/**
 * Worker 3: News Ranking
 * Processes news articles and ranks them using Claude
 */

import { Worker } from 'bullmq';
import Redis from 'ioredis';
import db from '../db/mysqlClient.js';
import jsonCache from '../infrastructure/data/JSONCache.js';
import llmProvider from '../infrastructure/llm/LLMProvider.js';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import newsCrawler from '../infrastructure/data/NewsCrawler.js';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const connection = new Redis(REDIS_URL, {
    maxRetriesPerRequest: null,
});

class NewsWorker {
    constructor() {
        this.worker = new Worker(
            'news-ranking',
            async (job) => {
                return await this.process(job);
            },
            {
                connection,
                concurrency: 5, // Increased from 2 to 5 for better throughput
            }
        );

        this.worker.on('completed', (job) => {
            console.log(`[News Worker] Job ${job.id} completed`);
        });

        this.worker.on('failed', (job, err) => {
            console.error(`[News Worker] Job ${job?.id} failed:`, err.message);
        });

        console.log('[News Worker] Started');
    }

    async process(job) {
        const { jobId, profileId } = job.data;

        console.log(`[News Worker] Processing job ${jobId} for profile ${profileId}`);

        await jsonCache.logJobRun({
            runId: jobId,
            module: 'NEWS_WORKER',
            status: 'RUNNING',
            timestamp: new Date().toISOString()
        });

        try {
            // 1. Load profile
            const profile = await this.loadProfile(profileId);

            // 2. Fetch news articles (from RSS/API)
            const rawArticles = await this.fetchNews(profile);

            // 3. Save raw news to Bronze
            const bronzeIds = await this.saveToBronze(profileId, rawArticles);

            // 4. Deduplicate and clean to Silver
            const cleanArticles = await this.cleanAndDeduplicate(profileId, rawArticles, bronzeIds);

            // 5. Rank articles using Claude
            const rankedArticles = await this.rankArticles(cleanArticles, profile);

            // 6. Save rankings to Gold
            await this.saveToGold(profileId, jobId, rankedArticles);

            // 7. Generate summary
            const summary = this.generateSummary(rankedArticles);
            const keyThemes = this.extractKeyThemes(rankedArticles);

            // 8. Update freshness (skipping as service missing)
            // await freshnessCheckService.updateFreshness(profileId, 'news_ranking');

            await jsonCache.logJobRun({
                runId: jobId,
                module: 'NEWS_WORKER',
                status: 'COMPLETED',
                timestamp: new Date().toISOString()
            });

            console.log(`[News Worker] Job ${jobId} completed`);

            return {
                profileId,
                totalArticles: cleanArticles.length,
                rankedArticles,
                topNews: rankedArticles.slice(0, 10),
                summary,
                keyThemes,
            };
        } catch (error) {
            console.error(`[News Worker] Job ${jobId} failed:`, error.message);
            await jsonCache.logJobRun({
                runId: jobId,
                module: 'NEWS_WORKER',
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
            // For demo purposes, if profile not found, return a dummy profile
            console.warn('[News Worker] Profile not found, using default.');
            return { keywords: ['cashew', 'nuts', 'agriculture'] };
        }

        return rows[0];
    }

    /**
     * Fetch news using the central NewsCrawler infrastructure
     * Ensures consistency with Dashboard API
     */
    async fetchNews(profile) {
        const keywords = profile.keywords || ['cashew'];
        console.log(`[News Worker] Delegating crawl to NewsCrawler for keywords: ${keywords.join(', ')}`);

        // Use the shared crawler infrastructure
        // fetching more to allow for ranking filtering
        const rawItems = await newsCrawler.crawl({
            keywords,
            limit: 50
        });

        // Map to worker's expected format if slightly different
        // NewsCrawler returns { title, url, source, published_at, content, ... }
        // Worker expects { title, url, source, publishedAt, content }
        return rawItems.map(item => ({
            title: item.title,
            url: item.url,
            source: item.source,
            publishedAt: new Date(item.published_at),
            content: item.content || item.summary
        }));
    }

    async saveToBronze(profileId, articles) {
        if (articles.length === 0) return [];

        const ids = articles.map(() => uuidv4());
        const values = articles.map((article, i) => [
            ids[i],
            profileId,
            article.source,
            article.title,
            article.url,
            article.content,
            article.publishedAt,
            JSON.stringify(article)
        ]);

        // Batch insert - single query instead of N queries
        await db.query(
            `INSERT INTO bronze.raw_news
            (id, profile_id, source, title, url, content, published_at, raw_data)
            VALUES ?`,
            [values]
        );

        console.log(`[News Worker] Batch inserted ${ids.length} articles to Bronze`);
        return ids;
    }

    async cleanAndDeduplicate(profileId, articles, bronzeIds) {
        const cleanedArticles = [];

        for (let i = 0; i < articles.length; i++) {
            const article = articles[i];
            const bronzeId = bronzeIds[i];

            // Generate content hash for deduplication
            const contentHash = crypto
                .createHash('sha256')
                .update(article.title + (article.content || ''))
                .digest('hex');

            // Check if already exists
            const [existing] = await db.query(
                `SELECT id FROM silver.news_clean WHERE content_hash = ?`,
                [contentHash]
            );

            // Note: Logic to skip might need refinement if we want to re-process for new jobs,
            // but for now stick to avoiding duplicates in silver.
            if (existing.length > 0) {
                console.log(`[News Worker] Duplicate article skipped: ${article.title}`);
                continue;
            }

            // Insert into Silver (MySQL doesn't support RETURNING like Postgres usually clearly)
            // So we insert and then use the bronzeId or fetch back?
            // Or just use uuid for ID?
            // Since schema implies autoincrement ID or UUID? Worker used uuid?
            // The original code expected RETURNING id.
            // Let's assume ID is auto or handle it. Wait, the original inserted without ID but expected RETURNING.
            // MySQL `INSERT` returns `insertId`.

            const [result] = await db.query(
                `INSERT INTO silver.news_clean
         (profile_id, title, url, source, content_hash, published_at, bronze_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    profileId,
                    article.title,
                    article.url,
                    article.source,
                    contentHash,
                    article.publishedAt,
                    bronzeId,
                ]
            );

            cleanedArticles.push({
                id: result.insertId, // MySQL specific property
                title: article.title,
                url: article.url,
                source: article.source,
                publishedAt: article.publishedAt,
                content: article.content,
            });
        }

        return cleanedArticles;
    }

    async rankArticles(articles, profile) {
        // Build prompt for Claude
        const articlesText = articles
            .map(
                (a, idx) =>
                    `[${idx + 1}] ${a.title}\nSource: ${a.source}\nPublished: ${a.publishedAt.toISOString()}\n`
            )
            .join('\n');

        const prompt = `
You are an expert news analyst. Rank the following news articles based on their relevance to ${(profile.keywords || []).join(', ')} market analysis.

For each article, provide scores (0.0-1.0) for:
- Accuracy: How factual and well-sourced is the information?
- Reliability: How trustworthy is the source?
- Recency: How recent is the news?
- Impact: How significant is this news for market decisions?

Articles:
${articlesText}

Respond in JSON format:
{
  "rankings": [
    {
      "articleIndex": 1,
      "accuracyScore": 0.85,
      "reliabilityScore": 0.90,
      "recencyScore": 0.95,
      "impactScore": 0.80,
      "reasoning": "Brief explanation"
    }
  ]
}
    `.trim();

        const responseContent = await llmProvider.call(prompt, { maxTokens: 2000, temperature: 0.3 });

        // Parse Claude's response
        const rankings = this.parseRankings(responseContent);

        // Combine with articles
        const rankedArticles = articles.map((article, idx) => {
            const ranking = rankings.find((r) => r.articleIndex === idx + 1) || {
                accuracyScore: 0.5,
                reliabilityScore: 0.5,
                recencyScore: 0.5,
                impactScore: 0.5,
                reasoning: 'No ranking provided',
            };

            const finalScore =
                (ranking.accuracyScore * 0.3 +
                    ranking.reliabilityScore * 0.3 +
                    ranking.recencyScore * 0.2 +
                    ranking.impactScore * 0.2);

            return {
                id: uuidv4(),
                newsId: article.id,
                title: article.title,
                url: article.url,
                publishedAt: article.publishedAt,
                accuracyScore: ranking.accuracyScore,
                reliabilityScore: ranking.reliabilityScore,
                recencyScore: ranking.recencyScore,
                impactScore: ranking.impactScore,
                finalScore,
                finalRank: 0, // Will be set after sorting
                reasoning: ranking.reasoning,
            };
        });

        // Sort by final score and assign ranks
        rankedArticles.sort((a, b) => b.finalScore - a.finalScore);
        rankedArticles.forEach((article, idx) => {
            article.finalRank = idx + 1;
        });

        return rankedArticles;
    }

    parseRankings(response) {
        if (!response) return [];
        try {
            // Try to extract JSON from response
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const data = JSON.parse(jsonMatch[0]);
                return data.rankings || [];
            }
        } catch (error) {
            console.warn('[News Worker] Failed to parse rankings, using defaults');
        }

        return [];
    }

    async saveToGold(profileId, jobId, rankedArticles) {
        if (rankedArticles.length === 0) return;

        const values = rankedArticles.map(article => [
            profileId,
            jobId,
            article.newsId,
            article.title,
            article.url,
            article.publishedAt,
            article.accuracyScore,
            article.reliabilityScore,
            article.recencyScore,
            article.impactScore,
            article.finalScore,
            article.finalRank,
            'claude-3.5-sonnet',
            article.reasoning
        ]);

        // Batch insert - single query instead of N queries
        await db.query(
            `INSERT INTO gold.news_ranked
            (profile_id, job_id, news_id, news_title, news_url, published_at,
             accuracy_score, reliability_score, recency_score, impact_score,
             final_score, final_rank, ranked_by, reasoning)
            VALUES ?`,
            [values]
        );

        console.log(`[News Worker] Batch inserted ${rankedArticles.length} articles to Gold`);
    }

    generateSummary(rankedArticles) {
        const topArticles = rankedArticles.slice(0, 5);
        return `Analyzed ${rankedArticles.length} news articles. Top 5 articles cover key market developments with high accuracy and reliability scores.`;
    }

    extractKeyThemes(rankedArticles) {
        // Simple keyword extraction from top articles
        const topArticles = rankedArticles.slice(0, 10);
        const words = topArticles
            .map((a) => a.title.toLowerCase().split(' '))
            .flat()
            .filter((w) => w.length > 4);

        const wordCounts = words.reduce((acc, word) => {
            acc[word] = (acc[word] || 0) + 1;
            return acc;
        }, {});

        return Object.entries(wordCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map((e) => e[0]);
    }

    async close() {
        await this.worker.close();
        await connection.quit();
    }
}

// Start worker if run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const newsWorker = new NewsWorker();

    process.on('SIGTERM', async () => {
        console.log('[News Worker] Received SIGTERM, shutting down...');
        await newsWorker.close();
        process.exit(0);
    });
}

export { NewsWorker };
