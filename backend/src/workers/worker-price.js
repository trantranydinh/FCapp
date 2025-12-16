/**
 * Worker 1: RCN Price Forecast
 * Processes price forecasting jobs using ML models
 */

import { Worker } from 'bullmq';
import { spawn } from 'child_process';
import Redis from 'ioredis';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../db/mysqlClient.js';
import jsonCache from '../infrastructure/data/JSONCache.js';

// Environment setup
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const connection = new Redis(REDIS_URL, {
    maxRetriesPerRequest: null,
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PriceWorker {
    constructor() {
        this.worker = new Worker(
            'price-forecast',
            async (job) => {
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

    async process(job) {
        const { jobId, profileId } = job.data;

        console.log(`[Price Worker] Processing job ${jobId} for profile ${profileId}`);

        // Update job status to running via JSONCache (logging)
        await jsonCache.logJobRun({
            runId: jobId,
            module: 'PRICE_FORECAST_WORKER',
            status: 'RUNNING',
            timestamp: new Date().toISOString()
        });

        try {
            // 1. Load historical data from silver layer
            const historicalData = await this.loadHistoricalData(profileId);

            // Check if data is sufficient (mocking check if DB is empty)
            if (!historicalData || historicalData.length < 30) {
                // Fallback to sample data from Excel logic if DB is empty? 
                // For now, let's respect the worker logic but log warning.
                // If 0 rows, maybe we should fetch from ExcelReader? 
                // Leaving as is but logging.
                console.warn(`[Price Worker] Warning: Low data count (${historicalData ? historicalData.length : 0}).`);
                if (!historicalData || historicalData.length === 0) {
                    throw new Error('No historical data found for profile');
                }
            }

            // 2. Run Prophet forecaster
            const forecastResult = await this.runProphetForecast(historicalData);

            // 3. Save results to gold layer
            await this.saveForecast(profileId, jobId, forecastResult);

            // 4. Update freshness (skipped as service missing)
            // await freshnessCheckService.updateFreshness(profileId, 'price_forecast');

            // 5. Update job status to completed
            await jsonCache.logJobRun({
                runId: jobId,
                module: 'PRICE_FORECAST_WORKER',
                status: 'COMPLETED',
                timestamp: new Date().toISOString()
            });

            console.log(`[Price Worker] Job ${jobId} completed successfully`);

            return forecastResult;
        } catch (error) {
            console.error(`[Price Worker] Job ${jobId} failed:`, error.message);
            await jsonCache.logJobRun({
                runId: jobId,
                module: 'PRICE_FORECAST_WORKER',
                status: 'FAILED',
                error: error.message,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    }

    async loadHistoricalData(profileId) {
        // MySQL uses ? for placeholders
        const sql = `
       SELECT date, price
       FROM silver.price_data
       WHERE profile_id = ?
       ORDER BY date DESC
       LIMIT 365
    `;

        // db.query returns [rows, fields]
        const [rows] = await db.query(sql, [profileId]);
        return rows.reverse(); // Oldest first
    }

    async runProphetForecast(historicalData) {
        return new Promise((resolve, reject) => {
            const input = {
                historical_data: historicalData,
                forecast_periods: 30,
                backtest: true,
                backtest_periods: 30,
            };

            // Path to Python script: ../../../ml-models/rcn-price/simplified_lstm.py
            const scriptPath = path.resolve(__dirname, '../../../ml-models/rcn-price/simplified_lstm.py');

            const python = spawn('python', [
                scriptPath,
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
                        forecast: output.forecast.map((f) => ({
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

    async saveForecast(profileId, jobId, result) {
        // MySQL ON DUPLICATE KEY UPDATE
        const sql = `
        INSERT INTO gold.rcn_forecast
         (profile_id, job_id, forecast_date, forecast_value, confidence_lower, confidence_upper, model_name, accuracy_mape, accuracy_rmse)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           forecast_value = VALUES(forecast_value),
           confidence_lower = VALUES(confidence_lower),
           confidence_upper = VALUES(confidence_upper),
           accuracy_mape = VALUES(accuracy_mape),
           accuracy_rmse = VALUES(accuracy_rmse),
           created_at = NOW()
    `;

        for (const point of result.forecast) {
            await db.query(sql, [
                profileId,
                jobId,
                point.date,
                point.value,
                point.lower,
                point.upper,
                result.modelName,
                result.accuracy?.mape || null,
                result.accuracy?.rmse || null,
            ]);
        }

        console.log(`[Price Worker] Saved ${result.forecast.length} forecast points`);
    }

    async close() {
        await this.worker.close();
        await connection.quit();
    }
}

// Start worker if run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const priceWorker = new PriceWorker();

    process.on('SIGTERM', async () => {
        console.log('[Price Worker] Received SIGTERM, shutting down...');
        await priceWorker.close();
        process.exit(0);
    });
}

export { PriceWorker };
