/**
 * SLA Rules Configuration
 * Defines freshness thresholds for each data type
 */

export interface SLARule {
  maxAge: number; // milliseconds
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export const SLA_RULES: Record<string, SLARule> = {
  price_forecast: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    priority: 'high',
  },
  market_scan: {
    maxAge: 12 * 60 * 60 * 1000, // 12 hours
    priority: 'medium',
  },
  news_ranking: {
    maxAge: 4 * 60 * 60 * 1000, // 4 hours
    priority: 'high',
  },
  ensemble: {
    maxAge: 6 * 60 * 60 * 1000, // 6 hours
    priority: 'critical',
  },
};

/**
 * Check if data is fresh based on SLA rules
 */
export function isFresh(lastRun: Date, ruleKey: keyof typeof SLA_RULES): boolean {
  if (!lastRun) return false;

  const now = Date.now();
  const age = now - lastRun.getTime();
  const rule = SLA_RULES[ruleKey];

  if (!rule) return false;

  return age < rule.maxAge;
}

/**
 * Get time until next refresh needed
 */
export function getTimeUntilStale(lastRun: Date, ruleKey: keyof typeof SLA_RULES): number {
  if (!lastRun) return 0;

  const now = Date.now();
  const age = now - lastRun.getTime();
  const rule = SLA_RULES[ruleKey];

  if (!rule) return 0;

  const remaining = rule.maxAge - age;
  return Math.max(0, remaining);
}
