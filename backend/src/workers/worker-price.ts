/**
 * Worker 1: RCN Price Forecast
 * Processes price forecasting jobs using ML models
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

interface PriceWorkerResult {
  profileId: string;
  modelName: string;
  forecast: {
    date: string;
    value: number;
    lower: number;
    upper: number;
  }[];
  accuracy?: {
    mape: number;
    rmse: number;
    mae: number;
  };
}

class PriceWorker {
  private worker: Worker;

  constructor() {
    this.worker = new Worker<JobPayload>(
      'price-forecast',
      async (job: Job<JobPayload>) => {
        return await this.process(job);
      },
      {
        connection,
        concurrency: 2, // Process 2 jobs simultaneously
        limiter: {
          max: 10, // Max 10 jobs per duration
          duration: 60000, // 1 minute
        },
      }
    );

    this.worker.on('completed', (job) => {
      console.log(`[Price Worker] Job ${job.id} completed`);
    });

    this.worker.on('failed', (job, err) => {
      console.error(`[Price Worker] Job ${job?.id} failed:`, err.message);
    });

    console.log('[Price Worker] Started');
  }

  private async process(job: Job<JobPayload>): Promise<PriceWorkerResult> {
    const { jobId, profileId } = job.data;

    console.log(`[Price Worker] Processing job ${jobId} for profile ${profileId}`);

    // Update job status to running
    await orchestrator.updateJobStatus(jobId, 'running');

    try {
      // 1. Load historical data from silver layer
      const historicalData = await this.loadHistoricalData(profileId);

      if (historicalData.length < 30) {
        throw new Error('Insufficient historical data (minimum 30 days required)');
      }

      // 2. Run Prophet forecaster
      const forecastResult = await this.runProphetForecast(historicalData);

      // 3. Save results to gold layer
      await this.saveForecast(profileId, jobId, forecastResult);

      // 4. Update freshness tracking
      await freshnessCheckService.updateFreshness(profileId, 'price_forecast');

      // 5. Update job status to completed
      await orchestrator.updateJobStatus(jobId, 'completed');

      console.log(`[Price Worker] Job ${jobId} completed successfully`);

      return forecastResult;
    } catch (error: any) {
      console.error(`[Price Worker] Job ${jobId} failed:`, error.message);
      await orchestrator.updateJobStatus(jobId, 'failed', error.message);
      throw error;
    }
  }

  private async loadHistoricalData(profileId: string): Promise<any[]> {
    const result = await db.query(
      `SELECT date, price
       FROM silver.price_data
       WHERE profile_id = $1
       ORDER BY date DESC
       LIMIT 365`, // Last 1 year of data
      [profileId]
    );

    return result.rows.reverse(); // Oldest first
  }

  private async runProphetForecast(historicalData: any[]): Promise<PriceWorkerResult> {
    return new Promise((resolve, reject) => {
      const input = {
        historical_data: historicalData,
        forecast_periods: 30,
        backtest: true,
        backtest_periods: 30,
      };

      const python = spawn('python', [
        'ml-models/rcn-price/prophet_forecaster.py',
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
          reject(new Error(`Prophet forecaster failed: ${stderr}`));
          return;
        }

        try {
          const output = JSON.parse(stdout);

          if (output.error) {
            reject(new Error(output.error));
            return;
          }

          resolve({
            profileId: '', // Will be set by caller
            modelName: output.model_name,
            forecast: output.forecast.map((f: any) => ({
              date: f.ds,
              value: f.yhat,
              lower: f.yhat_lower,
              upper: f.yhat_upper,
            })),
            accuracy: output.backtest?.accuracy,
          });
        } catch (error) {
          reject(new Error(`Failed to parse Prophet output: ${error}`));
        }
      });
    });
  }

  private async saveForecast(profileId: string, jobId: string, result: PriceWorkerResult): Promise<void> {
    // Save each forecast point
    for (const point of result.forecast) {
      await db.query(
        `INSERT INTO gold.rcn_forecast
         (profile_id, job_id, forecast_date, forecast_value, confidence_lower, confidence_upper, model_name, accuracy_mape, accuracy_rmse)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (profile_id, forecast_date, model_name) DO UPDATE SET
           forecast_value = $4,
           confidence_lower = $5,
           confidence_upper = $6,
           accuracy_mape = $8,
           accuracy_rmse = $9,
           created_at = NOW()`,
        [
          profileId,
          jobId,
          point.date,
          point.value,
          point.lower,
          point.upper,
          result.modelName,
          result.accuracy?.mape || null,
          result.accuracy?.rmse || null,
        ]
      );
    }

    console.log(`[Price Worker] Saved ${result.forecast.length} forecast points`);
  }

  async close(): Promise<void> {
    await this.worker.close();
    await connection.quit();
  }
}

// Start worker if run directly
if (require.main === module) {
  const priceWorker = new PriceWorker();

  process.on('SIGTERM', async () => {
    console.log('[Price Worker] Received SIGTERM, shutting down...');
    await priceWorker.close();
    process.exit(0);
  });
}

export { PriceWorker };
