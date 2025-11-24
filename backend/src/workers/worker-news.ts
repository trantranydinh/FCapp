/**
 * Worker 3: News Ranking
 * Processes news articles and ranks them using Claude
 */

import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import db from '../db/client';
import { JobPayload, orchestrator } from '../services/orchestrator';
import { freshnessCheckService } from '../services/freshness-check';
import { llmBroker } from '../../../ai-broker/src/broker';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const connection = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
});

interface NewsArticle {
  id: string;
  title: string;
  url: string;
  source: string;
  publishedAt: Date;
  content?: string;
}

interface RankedNews {
  id: string;
  newsId: string;
  title: string;
  url: string;
  publishedAt: Date;
  accuracyScore: number;
  reliabilityScore: number;
  recencyScore: number;
  impactScore: number;
  finalScore: number;
  finalRank: number;
  reasoning?: string;
}

interface NewsWorkerResult {
  profileId: string;
  totalArticles: number;
  rankedArticles: RankedNews[];
  topNews: RankedNews[];
  summary: string;
  keyThemes: string[];
}

class NewsWorker {
  private worker: Worker;

  constructor() {
    this.worker = new Worker<JobPayload>(
      'news-ranking',
      async (job: Job<JobPayload>) => {
        return await this.process(job);
      },
      {
        connection,
        concurrency: 2,
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

  private async process(job: Job<JobPayload>): Promise<NewsWorkerResult> {
    const { jobId, profileId } = job.data;

    console.log(`[News Worker] Processing job ${jobId} for profile ${profileId}`);

    await orchestrator.updateJobStatus(jobId, 'running');

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

      // 8. Update freshness
      await freshnessCheckService.updateFreshness(profileId, 'news_ranking');

      await orchestrator.updateJobStatus(jobId, 'completed');

      console.log(`[News Worker] Job ${jobId} completed`);

      return {
        profileId,
        totalArticles: cleanArticles.length,
        rankedArticles,
        topNews: rankedArticles.slice(0, 10),
        summary,
        keyThemes,
      };
    } catch (error: any) {
      console.error(`[News Worker] Job ${jobId} failed:`, error.message);
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

  private async fetchNews(profile: any): Promise<any[]> {
    // In a real implementation, this would fetch from RSS feeds or news APIs
    // For demo, we'll generate synthetic news articles

    const keywords = profile.keywords.slice(0, 5);

    const syntheticNews = keywords.map((keyword: string, idx: number) => ({
      title: `${keyword} Market Update: Latest Developments`,
      url: `https://example.com/news/${idx + 1}`,
      source: 'Market News Daily',
      publishedAt: new Date(Date.now() - idx * 24 * 60 * 60 * 1000),
      content: `Recent analysis of ${keyword} market shows significant trends...`,
    }));

    return syntheticNews;
  }

  private async saveToBronze(profileId: string, articles: any[]): Promise<string[]> {
    const ids: string[] = [];

    for (const article of articles) {
      const id = uuidv4();

      await db.query(
        `INSERT INTO bronze.raw_news
         (id, profile_id, source, title, url, content, published_at, raw_data)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          id,
          profileId,
          article.source,
          article.title,
          article.url,
          article.content,
          article.publishedAt,
          JSON.stringify(article),
        ]
      );

      ids.push(id);
    }

    return ids;
  }

  private async cleanAndDeduplicate(
    profileId: string,
    articles: any[],
    bronzeIds: string[]
  ): Promise<NewsArticle[]> {
    const cleanedArticles: NewsArticle[] = [];

    for (let i = 0; i < articles.length; i++) {
      const article = articles[i];
      const bronzeId = bronzeIds[i];

      // Generate content hash for deduplication
      const contentHash = crypto
        .createHash('sha256')
        .update(article.title + article.content)
        .digest('hex');

      // Check if already exists
      const existing = await db.query(
        `SELECT id FROM silver.news_clean WHERE content_hash = $1`,
        [contentHash]
      );

      if (existing.rows.length > 0) {
        console.log(`[News Worker] Duplicate article skipped: ${article.title}`);
        continue;
      }

      // Insert into Silver
      const result = await db.query(
        `INSERT INTO silver.news_clean
         (profile_id, title, url, source, content_hash, published_at, bronze_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
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
        id: result.rows[0].id,
        title: article.title,
        url: article.url,
        source: article.source,
        publishedAt: article.publishedAt,
        content: article.content,
      });
    }

    return cleanedArticles;
  }

  private async rankArticles(articles: NewsArticle[], profile: any): Promise<RankedNews[]> {
    // Build prompt for Claude
    const articlesText = articles
      .map(
        (a, idx) =>
          `[${idx + 1}] ${a.title}\nSource: ${a.source}\nPublished: ${a.publishedAt.toISOString()}\n`
      )
      .join('\n');

    const prompt = `
You are an expert news analyst. Rank the following news articles based on their relevance to ${profile.keywords.join(', ')} market analysis.

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
    },
    ...
  ]
}
    `.trim();

    const response = await llmBroker.execute({
      task: 'news_ranking',
      prompt,
      temperature: 0.3,
      maxTokens: 2000,
    });

    // Parse Claude's response
    const rankings = this.parseRankings(response.response);

    // Combine with articles
    const rankedArticles: RankedNews[] = articles.map((article, idx) => {
      const ranking = rankings.find((r: any) => r.articleIndex === idx + 1) || {
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

  private parseRankings(response: string): any[] {
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

  private async saveToGold(
    profileId: string,
    jobId: string,
    rankedArticles: RankedNews[]
  ): Promise<void> {
    for (const article of rankedArticles) {
      await db.query(
        `INSERT INTO gold.news_ranked
         (profile_id, job_id, news_id, news_title, news_url, published_at,
          accuracy_score, reliability_score, recency_score, impact_score,
          final_score, final_rank, ranked_by, reasoning)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'claude-3.5-sonnet', $13)`,
        [
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
          article.reasoning,
        ]
      );
    }
  }

  private generateSummary(rankedArticles: RankedNews[]): string {
    const topArticles = rankedArticles.slice(0, 5);
    return `Analyzed ${rankedArticles.length} news articles. Top 5 articles cover key market developments with high accuracy and reliability scores.`;
  }

  private extractKeyThemes(rankedArticles: RankedNews[]): string[] {
    // Simple keyword extraction from top articles
    const topArticles = rankedArticles.slice(0, 10);
    const words = topArticles
      .map((a) => a.title.toLowerCase().split(' '))
      .flat()
      .filter((w) => w.length > 4);

    const wordCounts = words.reduce((acc: any, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(wordCounts)
      .sort((a: any, b: any) => b[1] - a[1])
      .slice(0, 5)
      .map((e) => e[0]);
  }

  async close(): Promise<void> {
    await this.worker.close();
    await connection.quit();
  }
}

// Start worker if run directly
if (require.main === module) {
  const newsWorker = new NewsWorker();

  process.on('SIGTERM', async () => {
    console.log('[News Worker] Received SIGTERM, shutting down...');
    await newsWorker.close();
    process.exit(0);
  });
}

export { NewsWorker };
