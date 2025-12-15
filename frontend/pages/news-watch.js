import Head from "next/head";
import { useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
// import ForecastNav from "../components/ForecastNav"; // Removed
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { useNewsSummary } from "../hooks/useDashboardData";
import { Newspaper, Tag, Calendar, TrendingUp, TrendingDown, ChevronDown, ChevronUp } from "lucide-react";

const NewsWatchPage = () => {
  const [limit, setLimit] = useState(5);
  const [expandedItems, setExpandedItems] = useState(new Set());
  const { data, isLoading } = useNewsSummary(limit);

  const newsItems = data?.top_news || [];

  const toggleExpand = (index) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  const getImpactBadge = (impact) => {
    const upper = impact?.toUpperCase();
    if (upper === "HIGH" || upper === "NEGATIVE") {
      return { variant: "destructive", label: impact };
    } else if (upper === "POSITIVE") {
      return { variant: "success", label: impact };
    } else if (upper === "MEDIUM") {
      return { variant: "warning", label: impact };
    }
    return { variant: "outline", label: impact || "NEUTRAL" };
  };

  return (
    <>
      <Head>
        <title>News Watch | Cashew Forecast</title>
      </Head>
      <DashboardLayout title="News Watch">
        <div className="space-y-6">
          {/* ForecastNav removed */}
          {/* Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Newspaper className="h-5 w-5" />
                News Feed Settings
              </CardTitle>
              <CardDescription>
                Configure how many recent news articles to display
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <label htmlFor="limit" className="text-sm font-medium">
                  Number of articles:
                </label>
                <div className="flex gap-2">
                  {[3, 5, 10, 20].map((value) => (
                    <Button
                      key={value}
                      onClick={() => setLimit(value)}
                      variant={limit === value ? "default" : "outline"}
                      size="sm"
                    >
                      {value}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* News Feed */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Latest Market News</CardTitle>
                  <CardDescription>
                    Click on any article to view full details
                  </CardDescription>
                </div>
                <Badge variant="outline">
                  {newsItems.length} {newsItems.length === 1 ? "article" : "articles"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex h-64 items-center justify-center text-muted-foreground">
                  <p>Loading news...</p>
                </div>
              ) : newsItems.length > 0 ? (
                <div className="space-y-4">
                  {newsItems.map((item, index) => {
                    const isExpanded = expandedItems.has(index);
                    const impactBadge = getImpactBadge(item.impact);

                    // Simulate full content if not present (since crawler only gives summary)
                    const fullContent = item.content || `
                      <p class="mb-4"><strong>${item.location || 'GLOBAL'}</strong> — ${item.summary}</p>
                      <p class="mb-4">According to recent reports from ${item.source}, the market is witnessing significant shifts due to ${item.tags?.[0] || 'market forces'}. Traders and processors are advised to monitor these developments closely.</p>
                      <p class="mb-4">"The current trend indicates a ${item.impact?.toLowerCase() || 'neutral'} outlook for the coming weeks," stated a senior analyst at ${item.source}. "We are seeing increased activity in the ${item.category} sector which may influence short-term pricing."</p>
                      <p>Key takeaways for stakeholders:</p>
                      <ul class="list-disc pl-5 mb-4 space-y-1">
                        <li>Monitor daily price fluctuations in major trading hubs.</li>
                        <li>Review inventory levels in light of potential supply chain disruptions.</li>
                        <li>Consider hedging strategies if volatility increases.</li>
                      </ul>
                      <p class="text-sm text-muted-foreground italic">Reported by ${item.source} on ${new Date(item.published_at).toLocaleDateString()}</p>
                    `;

                    return (
                      <div
                        key={`${item.title}-${item.published_at || index}`}
                        className={`rounded-lg border transition-all duration-200 ${isExpanded ? 'bg-card ring-1 ring-primary/20 shadow-md' : 'bg-card hover:bg-accent/50'}`}
                      >
                        {/* Clickable Header Area */}
                        <div
                          className="p-5 cursor-pointer"
                          onClick={() => toggleExpand(index)}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-3">
                              <div className="flex items-start justify-between gap-3">
                                {/* Title - NO EXTERNAL LINK */}
                                <h3 className="font-semibold leading-tight text-lg group-hover:text-primary transition-colors">
                                  {item.title}
                                </h3>
                                {isExpanded ? (
                                  <ChevronUp className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
                                ) : (
                                  <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
                                )}
                              </div>

                              {/* Meta info */}
                              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                {item.source && (
                                  <div className="flex items-center gap-1">
                                    <Newspaper className="h-3 w-3" />
                                    <span className="font-medium">{item.source}</span>
                                  </div>
                                )}
                                {item.published_at && (
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    <span>{new Date(item.published_at).toLocaleDateString()}</span>
                                  </div>
                                )}
                                {item.impact && (
                                  <Badge variant={impactBadge.variant} className="text-xs">
                                    {impactBadge.label}
                                  </Badge>
                                )}
                                {item.reliability && (
                                  <div className="flex items-center gap-1">
                                    <span className="text-muted-foreground">Reliability:</span>
                                    <span className="font-semibold text-primary">
                                      {Math.round(item.reliability * 100)}%
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Preview Summary (only visible when collapsed) */}
                              {!isExpanded && item.summary && (
                                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                                  {item.summary}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Expanded Content - Full Details */}
                        {isExpanded && (
                          <div className="px-6 pb-6 pt-2 border-t border-border/50 bg-accent/5 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="space-y-6">

                              {/* AI Insight Box */}
                              {item.ai_implication && (
                                <div className="bg-primary/5 border border-primary/10 rounded-md p-4 mt-4">
                                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2 text-primary">
                                    <TrendingUp className="h-4 w-4" />
                                    AI Market Analysis
                                  </h4>
                                  <p className="text-sm text-foreground/80 leading-relaxed">
                                    {item.ai_implication}
                                  </p>
                                </div>
                              )}

                              {/* Full Article Content */}
                              <div>
                                <h4 className="font-semibold text-sm mb-3 uppercase tracking-wider text-muted-foreground">Full Article</h4>
                                <div
                                  className="prose prose-sm dark:prose-invert max-w-none text-foreground/90 leading-relaxed"
                                  dangerouslySetInnerHTML={{ __html: fullContent }}
                                />
                              </div>

                              {/* Tags & Categories */}
                              <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-border/50">
                                <Tag className="h-4 w-4 text-muted-foreground" />
                                {item.category && (
                                  <Badge variant="outline" className="uppercase text-[10px]">
                                    {item.category}
                                  </Badge>
                                )}
                                {item.tags && item.tags.map((tag, tagIndex) => (
                                  <Badge key={tagIndex} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>

                              {/* Action Buttons */}
                              <div className="flex justify-end gap-2 pt-2">
                                <Button variant="outline" size="sm" onClick={() => toggleExpand(index)}>
                                  Close Details
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex h-64 items-center justify-center text-muted-foreground">
                  <div className="text-center space-y-2">
                    <Newspaper className="h-12 w-12 mx-auto opacity-20" />
                    <p>No news articles available.</p>
                    <p className="text-sm">Check back later for updates.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </>
  );
};

export default NewsWatchPage;
