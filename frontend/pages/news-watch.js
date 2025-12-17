import Head from "next/head";
import { useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent } from "../components/ui/dialog";
import { useNewsSummary } from "../hooks/useDashboardData";
import { Newspaper, Tag, Calendar, TrendingUp, TrendingDown, ChevronDown, ChevronUp, X, ExternalLink, Search, Loader2 } from "lucide-react";
import { useSWRConfig } from "swr"; // Import for global mutate

const NewsWatchPage = () => {
  const [limit, setLimit] = useState(9); // Default to 9 for grid
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data, isLoading } = useNewsSummary(limit);
  const { mutate } = useSWRConfig();

  // Access the nested data property from the API response
  const newsItems = data?.data?.top_news || [];

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsRefreshing(true);
    try {
      // Trigger backend crawl
      const response = await fetch('/api/v1/dashboard/news-refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords: [searchQuery], limit: limit })
      });

      if (response.ok) {
        // Revalidate SWR cache to show new data
        mutate(`/api/v1/dashboard/news-summary?limit=${limit}`);
        setSearchQuery(""); // Optional: clear or keep
      }
    } catch (err) {
      console.error("Search failed", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Helper to generate a consistent placeholder image based on index/category
  const getPlaceholderImage = (index) => {
    // Reliable static Unsplash IDs for demo to avoid broken "source.unsplash.com" links
    const placeholders = [
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80", // Food/General
      "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&q=80", // Agriculture
      "https://images.unsplash.com/photo-1611974765270-ca12586343bb?w=800&q=80", // Chart
      "https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?w=800&q=80", // Logistics
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80", // Strategy
      "https://images.unsplash.com/photo-1559825481-12a05cc00344?w=800&q=80"  // Market
    ];
    return placeholders[index % placeholders.length];
  };

  return (
    <>
      <Head>
        <title>Market Insights | Intersnack Forecast</title>
      </Head>
      <DashboardLayout title="Market Insights">
        <div className="space-y-10 max-w-[1600px] mx-auto">
          {/* 1. Editorial Header */}
          <div className="flex flex-col md:flex-row justify-between items-end border-b border-border pb-6 gap-6">
            <div className="space-y-3 max-w-2xl">
              <h1 className="text-4xl font-light tracking-tight text-foreground">
                Market <span className="font-semibold text-primary">Beat</span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Curated intelligence on global cashew markets, supply chain disruptions, and price movements.
              </p>
            </div>

            {/* Filter and Search Controls */}
            <div className="flex flex-col items-end gap-3">
              {/* Search Form */}
              <form onSubmit={handleSearch} className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search topics (e.g. Vietnam)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-secondary/50 border border-border rounded-full pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-64 transition-all"
                  />
                </div>
                <Button type="submit" size="sm" disabled={isRefreshing} className="rounded-full px-4">
                  {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
                </Button>
              </form>

              {/* Limit Toggles */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground mr-2">Show:</span>
                {[6, 9, 12].map((value) => (
                  <button
                    key={value}
                    onClick={() => setLimit(value)}
                    className={`px-3 py-1 text-xs rounded-full transition-all ${limit === value
                      ? "bg-foreground text-background font-medium"
                      : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                      }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 2. News Grid (Editorial Layout) */}
          {isLoading || isRefreshing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-pulse">
              {[1, 2, 3].map(i => (
                <div key={i} className="space-y-4">
                  <div className="h-64 bg-secondary rounded-2xl w-full" />
                  <div className="h-4 bg-secondary w-1/3 rounded" />
                  <div className="h-8 bg-secondary w-full rounded" />
                  <div className="h-20 bg-secondary w-full rounded" />
                </div>
              ))}
            </div>
          ) : newsItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
              {newsItems.map((item, index) => {
                // Fallback image logic
                // Prioritize direct image, then Unsplash valid ID
                let imageUrl = item.image_url;
                if (!imageUrl || imageUrl.includes('source.unsplash.com')) {
                  imageUrl = getPlaceholderImage(index);
                }

                return (
                  <article
                    key={index}
                    className="group flex flex-col space-y-4 cursor-pointer"
                    onClick={() => setSelectedArticle({ ...item, _resolvedImage: imageUrl })}
                  >
                    {/* Image Card */}
                    <div className="relative overflow-hidden rounded-2xl aspect-[4/3] bg-secondary border border-border/50">
                      <img
                        src={imageUrl}
                        alt={item.title}
                        className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105"
                        onError={(e) => { e.target.src = getPlaceholderImage(index + 1); }}
                      />
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-white/90 text-foreground hover:bg-white border-0 shadow-sm backdrop-blur-sm">
                          {item.category || item.source || 'News'}
                        </Badge>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        <span>{new Date(item.published_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        <span className="w-1 h-1 rounded-full bg-border" />
                        <span className="text-primary">{item.source}</span>
                      </div>

                      <h2 className="text-xl font-bold text-foreground leading-snug group-hover:text-primary transition-colors">
                        {item.title}
                      </h2>

                      <p className="text-muted-foreground line-clamp-3 leading-relaxed text-sm">
                        {item.summary || item.content?.substring(0, 150) + "..."}
                      </p>

                      <div className="pt-2 flex items-center gap-2 text-sm font-semibold text-foreground group-hover:underline decoration-primary decoration-2 underline-offset-4">
                        Read Analysis <TrendingUp className="h-4 w-4" />
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="py-20 text-center text-muted-foreground">
              <Newspaper className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg">No market insights available at the moment.</p>
            </div>
          )}
        </div>

        {/* Article Details Dialog */}
        <Dialog open={!!selectedArticle} onOpenChange={(open) => !open && setSelectedArticle(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 gap-0 border-none sm:rounded-2xl">
            {selectedArticle && (
              <>
                <div className="relative h-64 sm:h-80 w-full overflow-hidden">
                  <img
                    src={selectedArticle._resolvedImage || selectedArticle.image_url}
                    alt={selectedArticle.title}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = getPlaceholderImage(0); }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute bottom-0 left-0 p-6 sm:p-8 w-full">
                    <Badge className="mb-3 bg-primary text-primary-foreground border-none">
                      {selectedArticle.category || 'Market Update'}
                    </Badge>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight shadow-sm">
                      {selectedArticle.title}
                    </h2>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-4 right-4 text-white hover:bg-black/20 rounded-full"
                    onClick={() => setSelectedArticle(null)}
                  >
                    <X className="h-6 w-6" />
                  </Button>
                </div>

                <div className="p-6 sm:p-8 space-y-6 bg-background">
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground border-b border-border pb-6">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {new Date(selectedArticle.published_at).toLocaleString()}
                    </div>
                    <div className="flex items-center gap-2">
                      <Newspaper className="h-4 w-4" />
                      {selectedArticle.source}
                    </div>
                    {selectedArticle.reliability && (
                      <Badge variant="outline" className="ml-auto">
                        Trust Score: {Math.round(selectedArticle.reliability * 100)}%
                      </Badge>
                    )}
                  </div>

                  {/* AI Analysis Box */}
                  <div className="bg-primary/5 border border-primary/10 rounded-xl p-6">
                    <h3 className="flex items-center gap-2 font-semibold text-primary mb-3">
                      <TrendingUp className="h-5 w-5" />
                      Strategic Implication (AI Summary)
                    </h3>
                    <p className="text-foreground/90 leading-relaxed font-medium">
                      {selectedArticle.ai_implication || selectedArticle.summary || "This development is being monitored for potential impact on the global cashew supply chain."}
                    </p>
                  </div>

                  {/* Full Article Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">Full Article</h3>
                    <div
                      className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground leading-loose"
                      dangerouslySetInnerHTML={{ __html: selectedArticle.content || `<p>${selectedArticle.summary}</p>` }}
                    />
                  </div>

                  {selectedArticle.url && (
                    <div className="pt-4">
                      <Button variant="outline" className="gap-2" asChild>
                        <a href={selectedArticle.url} target="_blank" rel="noopener noreferrer">
                          Verify Original Source <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

      </DashboardLayout>
    </>
  );
};

export default NewsWatchPage;
