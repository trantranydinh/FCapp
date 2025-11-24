/**
 * Ensemble Worker
 * Combines outputs from all three workers
 */

import { Worker, Job } from 'bullmq';
import { spawn } from 'child_process';
import Redis from 'ioredis';
import db from '../db/client';
import { JobPayload, orchestrator } from '../services/orchestrator';
import { freshnessCheckService } from '../services/freshness-check';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const connection = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
});

class EnsembleWorker {
  private worker: Worker;

  constructor() {
    this.worker = new Worker<JobPayload>(
      'ensemble',
      async (job: Job<JobPayload>) => {
        return await this.process(job);
      },
      {
        connection,
        concurrency: 1, // Run one at a time
      }
    );

    this.worker.on('completed', (job) => {
      console.log(`[Ensemble Worker] Job ${job.id} completed`);
    });

    this.worker.on('failed', (job, err) => {
      console.error(`[Ensemble Worker] Job ${job?.id} failed:`, err.message);
    });

    console.log('[Ensemble Worker] Started');
  }

  private async process(job: Job<JobPayload>): Promise<any> {
    const { jobId, profileId, bundleId } = job.data;

    console.log(`[Ensemble Worker] Processing job ${jobId} for profile ${profileId}`);

    await orchestrator.updateJobStatus(jobId, 'running');

    try {
      // 1. Load data from all three models
      const priceData = await this.loadPriceData(profileId);
      const marketData = await this.loadMarketData(profileId);
      const newsData = await this.loadNewsData(profileId);

      // 2. Run ensemble model
      const ensembleResult = await this.runEnsemble({
        price: priceData,
        market: marketData,
        news: newsData,
      });

      // 3. Save to gold.fc_aggregate
      await this.saveEnsembleOutput(profileId, bundleId, ensembleResult);

      // 4. Refresh materialized view
      await db.query('REFRESH MATERIALIZED VIEW CONCURRENTLY gold.dashboard_overview');

      // 5. Update freshness
      await freshnessCheckService.updateFreshness(profileId, 'ensemble');

      // 6. Trigger alerts if needed
      if (ensembleResult.deviationAlert) {
        await this.triggerAlerts(profileId, ensembleResult);
      }

      await orchestrator.updateJobStatus(jobId, 'completed');

      console.log(`[Ensemble Worker] Job ${jobId} completed`);

      return ensembleResult;
    } catch (error: any) {
      console.error(`[Ensemble Worker] Job ${jobId} failed:`, error.message);
      await orchestrator.updateJobStatus(jobId, 'failed', error.message);
      throw error;
    }
  }

  private async loadPriceData(profileId: string): Promise<any[]> {
    const result = await db.query(
      `SELECT
         forecast_date as date,
         forecast_value as value,
         confidence_lower as lower,
         confidence_upper as upper
       FROM gold.rcn_forecast
       WHERE profile_id = $1
       ORDER BY forecast_date ASC
       LIMIT 30`,
      [profileId]
    );

    return result.rows;
  }

  private async loadMarketData(profileId: string): Promise<any> {
    const result = await db.query(
      `SELECT
         sentiment,
         sentiment_score as "sentimentScore",
         signal_count as "signalCount",
         summary_text as summary,
         top_drivers as "topDrivers"
       FROM gold.market_summary
       WHERE profile_id = $1
       ORDER BY scan_date DESC
       LIMIT 1`,
      [profileId]
    );

    return result.rows[0] || {
      sentiment: 'neutral',
      sentimentScore: 0,
      signalCount: 0,
      summary: '',
      topDrivers: [],
    };
  }

  private async loadNewsData(profileId: string): Promise<any> {
    const result = await db.query(
      `SELECT
         news_title as title,
         news_url as url,
         published_at as "publishedAt",
         accuracy_score as "accuracyScore",
         reliability_score as "reliabilityScore",
         impact_score as "impactScore",
         final_rank as "finalRank"
       FROM gold.news_ranked
       WHERE profile_id = $1
       ORDER BY final_rank ASC
       LIMIT 10`,
      [profileId]
    );

    return {
      totalArticles: result.rowCount,
      topNews: result.rows,
    };
  }

  private async runEnsemble(input: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const python = spawn('python', [
        'ml-models/ensemble/ensemble.py',
        JSON.stringify(input),
      ]);

      let stdout = '';
      let stderr = '';

      python.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      python.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      python.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Ensemble model failed: ${stderr}`));
          return;
        }

        try {
          const output = JSON.parse(stdout);

          if (output.error) {
            reject(new Error(output.error));
            return;
          }

          resolve(output);
        } catch (error) {
          reject(new Error(`Failed to parse ensemble output: ${error}`));
        }
      });
    });
  }

  private async saveEnsembleOutput(
    profileId: string,
    bundleId: string,
    result: any
  ): Promise<void> {
    await db.query(
      `INSERT INTO gold.fc_aggregate
       (profile_id, bundle_id, report_date, forecast_value, trend, confidence_score,
        model_agreement_pct, market_sentiment, key_drivers, deviation_alert,
        deviation_type, summary_text, weights)
       VALUES ($1, $2, CURRENT_DATE, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (profile_id, report_date) DO UPDATE SET
         forecast_value = $3,
         trend = $4,
         confidence_score = $5,
         model_agreement_pct = $6,
         market_sentiment = $7,
         key_drivers = $8,
         deviation_alert = $9,
         deviation_type = $10,
         summary_text = $11,
         weights = $12,
         created_at = NOW()`,
      [
        profileId,
        bundleId,
        result.forecastValue,
        result.trend,
        result.confidenceScore,
        result.modelAgreementPct,
        result.marketSentiment,
        JSON.stringify(result.keyDrivers),
        result.deviationAlert,
        result.deviationType,
        result.summaryText,
        JSON.stringify(result.weights),
      ]
    );
  }

  private async triggerAlerts(profileId: string, result: any): Promise<void> {
    for (const alert of result.alertsTriggered) {
      await db.query(
        `INSERT INTO audit.alerts
         (profile_id, alert_type, severity, message, details)
         VALUES ($1, 'deviation', 'high', $2, $3)`,
        [profileId, alert, JSON.stringify(result)]
      );
    }

    console.log(`[Ensemble Worker] Triggered ${result.alertsTriggered.length} alerts`);
  }

  async close(): Promise<void> {
    await this.worker.close();
    await connection.quit();
  }
}

// Start worker if run directly
if (require.main === module) {
  const ensembleWorker = new EnsembleWorker();

  process.on('SIGTERM', async () => {
    console.log('[Ensemble Worker] Received SIGTERM, shutting down...');
    await ensembleWorker.close();
    process.exit(0);
  });
}

export { EnsembleWorker };
