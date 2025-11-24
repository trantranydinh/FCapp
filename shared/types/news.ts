/**
 * News Ranking Types
 * News analysis and ranking
 */

export interface NewsArticle {
  id: string;
  title: string;
  url: string;
  source: string;
  publishedAt: Date;
  content?: string;
  summary?: string;
}

export interface NewsRanking {
  id: string;
  profileId: string;
  newsTitle: string;
  newsUrl: string;
  publishedAt: Date;
  accuracyScore: number;    // 0-1
  reliabilityScore: number; // 0-1
  recencyScore: number;     // 0-1
  impactScore: number;      // 0-1
  finalRank: number;
  rankedBy: string; // 'claude-3.5-sonnet'
  reasoning?: string;
  createdAt: Date;
}

export interface NewsRankingResult {
  profileId: string;
  rankingTimestamp: string;
  totalArticles: number;
  rankedArticles: NewsRanking[];
  topNews: NewsRanking[];
  summary: string;
  keyThemes: string[];
}
