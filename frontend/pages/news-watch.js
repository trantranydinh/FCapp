import Head from "next/head";
import { useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { useNewsSummary } from "../hooks/useDashboardData";
import { Newspaper, Tag, Calendar, ExternalLink } from "lucide-react";
 
const NewsWatchPage = () => {
  const [limit, setLimit] = useState(5);
  const { data, isLoading } = useNewsSummary(limit);
 
  const newsItems = data?.top_news || [];
 
  return (
    <>
      <Head>
        <title>News Watch | Cashew Forecast</title>
      </Head>
      <DashboardLayout title="News Watch">
        <div className="space-y-6">
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
                    Recent news articles related to cashew market trends
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
                  {newsItems.map((item, index) => (
                    <div
                      key={`${item.title}-${item.published_at || index}`}
                      className="rounded-lg border bg-card p-5 transition-colors hover:bg-accent/50"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          <h3 className="font-semibold leading-tight text-lg">
                            {item.url ? (
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-primary hover:underline"
                              >
                                {item.title}
                              </a>
                            ) : (
                              item.title
                            )}
                          </h3>
 
                          {/* Meta info */}
                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            {item.source && (
                              <div className="flex items-center gap-1">
                                <ExternalLink className="h-3 w-3" />
                                {item.url ? (
                                  <a
                                    href={item.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-medium hover:text-primary hover:underline"
                                  >
                                    {item.source}
                                  </a>
                                ) : (
                                  <span className="font-medium">{item.source}</span>
                                )}
                              </div>
                            )}
                            {item.published_at && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>{new Date(item.published_at).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>
 
                          {/* Summary */}
                          {item.summary && (
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {item.summary}
                            </p>
                          )}
 
                          {/* Tags */}
                          {item.tags && item.tags.length > 0 && (
                            <div className="flex flex-wrap items-center gap-2">
                              <Tag className="h-3 w-3 text-muted-foreground" />
                              {item.tags.map((tag, tagIndex) => (
                                <Badge key={tagIndex} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
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