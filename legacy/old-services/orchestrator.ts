/**
 * Orchestrator Service
 * Manages job bundles and task distribution
 */

import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import db from '../db/client';
import { v4 as uuidv4 } from 'uuid';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const connection = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
});

export interface JobPayload {
  jobId: string;
  bundleId: string;
  profileId: string;
  type: 'price' | 'market' | 'news' | 'ensemble';
  metadata?: Record<string, any>;
}

export class Orchestrator {
  private queues: {
    price: Queue<JobPayload>;
    market: Queue<JobPayload>;
    news: Queue<JobPayload>;
    ensemble: Queue<JobPayload>;
  };

  constructor() {
    this.queues = {
      price: new Queue<JobPayload>('price-forecast', { connection }),
      market: new Queue<JobPayload>('market-scan', { connection }),
      news: new Queue<JobPayload>('news-ranking', { connection }),
      ensemble: new Queue<JobPayload>('ensemble', { connection }),
    };

    console.log('Orchestrator initialized with queues');
  }

  async createJobBundle(profileId: string, jobTypes: string[]): Promise<string> {
    // Create bundle in database
    const bundleResult = await db.query(
      `INSERT INTO public.job_bundles (id, profile_id, status, request_time)
       VALUES ($1, $2, 'pending', NOW())
       RETURNING id`,
      [uuidv4(), profileId]
    );

    const bundleId = bundleResult.rows[0].id;

    // Create individual jobs
    const jobPromises = jobTypes.map(async (type) => {
      const jobId = uuidv4();

      // Insert job into database
      await db.query(
        `INSERT INTO public.jobs (id, bundle_id, profile_id, type, status, priority)
         VALUES ($1, $2, $3, $4, 'pending', $5)`,
        [jobId, bundleId, profileId, type, this.getJobPriority(type)]
      );

      // Add job to queue
      await this.queueJob({
        jobId,
        bundleId,
        profileId,
        type: type as any,
      });

      return jobId;
    });

    await Promise.all(jobPromises);

    // Update bundle status to running
    await db.query(
      `UPDATE public.job_bundles SET status = 'running', start_time = NOW() WHERE id = $1`,
      [bundleId]
    );

    console.log(`Job bundle created: ${bundleId} with ${jobTypes.length} jobs`);

    return bundleId;
  }

  private async queueJob(payload: JobPayload): Promise<void> {
    const queue = this.queues[payload.type];

    await queue.add(payload.type, payload, {
      jobId: payload.jobId,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: false,
      removeOnFail: false,
    });

    console.log(`Job queued: ${payload.jobId} (${payload.type})`);
  }

  private getJobPriority(type: string): number {
    const priorities = {
      price: 5,
      market: 5,
      news: 5,
      ensemble: 10, // Highest priority
    };
    return priorities[type as keyof typeof priorities] || 1;
  }

  async getJobStatus(bundleId: string): Promise<any> {
    const bundleResult = await db.query(
      `SELECT * FROM public.job_bundles WHERE id = $1`,
      [bundleId]
    );

    if (bundleResult.rows.length === 0) {
      throw new Error('Job bundle not found');
    }

    const jobsResult = await db.query(
      `SELECT * FROM public.jobs WHERE bundle_id = $1 ORDER BY created_at`,
      [bundleId]
    );

    return {
      bundle: bundleResult.rows[0],
      jobs: jobsResult.rows,
    };
  }

  async updateJobStatus(
    jobId: string,
    status: 'running' | 'completed' | 'failed',
    error?: string
  ): Promise<void> {
    if (status === 'running') {
      await db.query(
        `UPDATE public.jobs SET status = $1, start_time = NOW() WHERE id = $2`,
        [status, jobId]
      );
    } else {
      await db.query(
        `UPDATE public.jobs SET status = $1, end_time = NOW(), error = $3 WHERE id = $2`,
        [status, jobId, error || null]
      );
    }

    // Check if all jobs in bundle are complete
    await this.checkBundleCompletion(jobId);
  }

  private async checkBundleCompletion(jobId: string): Promise<void> {
    const result = await db.query(
      `SELECT bundle_id FROM public.jobs WHERE id = $1`,
      [jobId]
    );

    if (result.rows.length === 0) return;

    const bundleId = result.rows[0].bundle_id;

    const jobsResult = await db.query(
      `SELECT status FROM public.jobs WHERE bundle_id = $1`,
      [bundleId]
    );

    const statuses = jobsResult.rows.map((r) => r.status);
    const allCompleted = statuses.every((s) => s === 'completed' || s === 'failed');

    if (allCompleted) {
      const hasFailures = statuses.some((s) => s === 'failed');
      const bundleStatus = hasFailures ? 'failed' : 'completed';

      await db.query(
        `UPDATE public.job_bundles SET status = $1, end_time = NOW() WHERE id = $2`,
        [bundleStatus, bundleId]
      );

      console.log(`Job bundle ${bundleId} completed with status: ${bundleStatus}`);
    }
  }

  async close(): Promise<void> {
    await Promise.all([
      this.queues.price.close(),
      this.queues.market.close(),
      this.queues.news.close(),
      this.queues.ensemble.close(),
    ]);
    await connection.quit();
  }
}

export const orchestrator = new Orchestrator();
