/**
 * News Ranking Card Component
 * Displays ranked news articles
 */

import React from 'react';
import { Card, CardHeader, CardBody } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface NewsArticle {
  id: string;
  title: string;
  url: string;
  publishedAt: string;
  accuracyScore: number;
  reliabilityScore: number;
  impactScore: number;
  finalRank: number;
  source: string;
}

interface NewsRankingCardProps {
  articles: NewsArticle[];
  lastUpdated: string;
}

export const NewsRankingCard: React.FC<NewsRankingCardProps> = ({
  articles,
  lastUpdated,
}) => {
  const getScoreColor = (score: number): 'success' | 'warning' | 'danger' => {
    if (score >= 0.8) return 'success';
    if (score >= 0.6) return 'warning';
    return 'danger';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <Card>
      <CardHeader
        title="News Insights"
        subtitle={`${articles.length} articles • Updated ${lastUpdated}`}
        action={
          <Badge variant="info" size="sm">
            Ranked by Claude
          </Badge>
        }
      />
      <CardBody>
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {articles.map((article) => (
            <div
              key={article.id}
              className="p-4 border border-gray-200 rounded-xl hover:border-red-200 hover:bg-red-50 transition-all cursor-pointer"
            >
              {/* Rank Badge */}
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                    <span className="text-sm font-bold text-red-600">
                      #{article.finalRank}
                    </span>
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  {/* Title */}
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-gray-900 hover:text-red-600 line-clamp-2"
                  >
                    {article.title}
                  </a>

                  {/* Meta */}
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                    <span className="font-medium">{article.source}</span>
                    <span>•</span>
                    <span>{formatDate(article.publishedAt)}</span>
                  </div>

                  {/* Scores */}
                  <div className="flex gap-2 mt-3">
                    <Badge
                      variant={getScoreColor(article.accuracyScore)}
                      size="sm"
                    >
                      Accuracy: {(article.accuracyScore * 100).toFixed(0)}%
                    </Badge>
                    <Badge
                      variant={getScoreColor(article.reliabilityScore)}
                      size="sm"
                    >
                      Reliability: {(article.reliabilityScore * 100).toFixed(0)}%
                    </Badge>
                    <Badge
                      variant={getScoreColor(article.impactScore)}
                      size="sm"
                    >
                      Impact: {(article.impactScore * 100).toFixed(0)}%
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
};
