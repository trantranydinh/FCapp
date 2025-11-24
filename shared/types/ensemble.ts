/**
 * Ensemble Types
 * Combined output from all models
 */

export type TrendDirection = 'up' | 'down' | 'stable';
export type DeviationType = 'normal' | 'anomaly' | 'breaking_event' | 'model_disagreement';

export interface ModelWeight {
  price: number;
  market: number;
  news: number;
}

export interface EnsembleOutput {
  id: string;
  profileId: string;
  reportDate: Date;
  forecastValue: number;
  trend: TrendDirection;
  confidenceScore: number;
  modelAgreementPct: number;
  marketSentiment: string;
  keyDrivers: {
    driver: string;
    contribution: number;
    source: 'price' | 'market' | 'news';
  }[];
  deviationAlert: boolean;
  deviationType?: DeviationType;
  summaryText: string;
  weights: ModelWeight;
  createdAt: Date;
}

export interface EnsembleResult {
  profileId: string;
  timestamp: string;
  aggregate: EnsembleOutput;
  deviationChecks: {
    threeSourceAgreement: boolean;
    changeVsPrevious: {
      passed: boolean;
      percentChange: number;
      threshold: number;
    };
    forecastVsActual?: {
      passed: boolean;
      deviation: number;
      threshold: number;
    };
  };
  alertsTriggered: string[];
}
