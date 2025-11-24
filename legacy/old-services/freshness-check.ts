/**
 * Freshness Check Service
 * Validates data freshness based on SLA rules
 */

import db from '../db/client';
import { isFresh, SLA_RULES } from '../../../shared/config/sla-rules';

export interface FreshnessResult {
  dataType: string;
  isFresh: boolean;
  lastUpdated: Date | null;
  nextRefreshDue: Date;
  slaThresholdHours: number;
}

export class FreshnessCheckService {
  async checkFreshness(profileId: string, dataType: keyof typeof SLA_RULES): Promise<FreshnessResult> {
    const result = await db.query(
      `SELECT last_updated, next_refresh_due, sla_threshold_hours, is_fresh
       FROM gold.data_freshness
       WHERE profile_id = $1 AND data_type = $2`,
      [profileId, dataType]
    );

    if (result.rows.length === 0) {
      // No record found - data is stale
      return {
        dataType,
        isFresh: false,
        lastUpdated: null,
        nextRefreshDue: new Date(),
        slaThresholdHours: SLA_RULES[dataType].maxAge / (1000 * 60 * 60),
      };
    }

    const row = result.rows[0];
    return {
      dataType,
      isFresh: row.is_fresh,
      lastUpdated: row.last_updated,
      nextRefreshDue: row.next_refresh_due,
      slaThresholdHours: row.sla_threshold_hours,
    };
  }

  async checkAllFreshness(profileId: string): Promise<Record<string, FreshnessResult>> {
    const dataTypes: (keyof typeof SLA_RULES)[] = [
      'price_forecast',
      'market_scan',
      'news_ranking',
      'ensemble',
    ];

    const results: Record<string, FreshnessResult> = {};

    for (const dataType of dataTypes) {
      results[dataType] = await this.checkFreshness(profileId, dataType);
    }

    return results;
  }

  async updateFreshness(profileId: string, dataType: keyof typeof SLA_RULES): Promise<void> {
    const now = new Date();
    const slaRule = SLA_RULES[dataType];
    const nextRefreshDue = new Date(now.getTime() + slaRule.maxAge);
    const slaThresholdHours = slaRule.maxAge / (1000 * 60 * 60);

    await db.query(
      `INSERT INTO gold.data_freshness (profile_id, data_type, last_updated, sla_threshold_hours, is_fresh, next_refresh_due)
       VALUES ($1, $2, $3, $4, TRUE, $5)
       ON CONFLICT (profile_id, data_type)
       DO UPDATE SET
         last_updated = $3,
         is_fresh = TRUE,
         next_refresh_due = $5,
         updated_at = NOW()`,
      [profileId, dataType, now, slaThresholdHours, nextRefreshDue]
    );
  }

  determineJobsNeeded(freshness: Record<string, FreshnessResult>): string[] {
    const jobs: string[] = [];

    if (!freshness.price_forecast.isFresh) {
      jobs.push('price');
    }
    if (!freshness.market_scan.isFresh) {
      jobs.push('market');
    }
    if (!freshness.news_ranking.isFresh) {
      jobs.push('news');
    }
    if (!freshness.ensemble.isFresh || jobs.length > 0) {
      jobs.push('ensemble');
    }

    return jobs;
  }
}

export const freshnessCheckService = new FreshnessCheckService();
