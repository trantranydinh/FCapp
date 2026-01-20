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
                {[6, 12, 24, 100].map((value) => (
                  <button
                    key={value}
                    onClick={() => setLimit(value)}
                    className={`px-3 py-1 text-xs rounded-full transition-all ${limit === value
                      ? "bg-foreground text-background font-medium"
                      : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                      }`}
                  >
                    {value === 100 ? 'All' : value}
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
                    className="group flex flex-col space-y-3 cursor-pointer h-full"
                    onClick={() => setSelectedArticle({ ...item, _resolvedImage: imageUrl })}
                  >
                    {/* Image Card */}
                    <div className="relative overflow-hidden rounded-2xl aspect-[16/9] bg-secondary border border-border/50">
                      <img
                        src={imageUrl}
                        alt={item.title}
                        className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105"
                        onError={(e) => { e.target.src = getPlaceholderImage(index + 1); }}
                      />
                      <div className="absolute top-3 left-3 flex gap-2">
                        <Badge className={`${item.category === 'Price' ? 'bg-red-500 hover:bg-red-600' :
                            item.category === 'Supply' ? 'bg-green-500 hover:bg-green-600' :
                              item.category === 'Logistics' ? 'bg-blue-500 hover:bg-blue-600' :
                                'bg-zinc-800 hover:bg-zinc-700'
                          } text-white border-0 shadow-sm backdrop-blur-sm`}>
                          {item.category || 'News'}
                        </Badge>
                      </div>

                      {/* Trust Badge on Image */}
                      {item.reliability && (
                        <div className="absolute bottom-3 right-3">
                          <Badge variant="secondary" className="bg-black/60 text-white backdrop-blur-md border-0 text-[10px] gap-1">
                            {item.reliability > 0.85 ? <div className="h-1.5 w-1.5 rounded-full bg-green-400" /> : <div className="h-1.5 w-1.5 rounded-full bg-amber-400" />}
                            {(item.reliability * 100).toFixed(0)}% Trust
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex flex-col flex-1 space-y-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-primary">{item.source}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(item.published_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        </div>

                        {/* Consensus Dots Small */}
                        {(item.related_links?.length > 0 || item.source_count > 1) && (
                          <div className="flex gap-0.5" title="Consensus">
                            {[1, 2, 3].map(i => (
                              <div key={i} className={`h-1 w-1 rounded-full ${(item.source_count || item.related_links?.length || 1) >= i
                                ? 'bg-primary' : 'bg-primary/20'}`} />
                            ))}
                          </div>
                        )}
                      </div>

                      <h2 className="text-lg font-bold text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-2">
                        {item.title}
                      </h2>

                      <p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed">
                        {item.summary || item.content?.substring(0, 150) + "..."}
                      </p>

                      <div className="pt-2 mt-auto flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-semibold text-foreground group-hover:underline decoration-primary decoration-2 underline-offset-4">
                          Read Analysis <TrendingUp className="h-3 w-3" />
                        </div>

                        {/* Direct Link Icon */}
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                            onClick={(e) => e.stopPropagation()} // Prevent modal opening
                            title="Open original source"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
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
          <DialogContent hideClose={true} className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0 border-none sm:rounded-2xl">
            {selectedArticle && (
              <div className="bg-background sm:rounded-2xl overflow-hidden">
                {/* Visual Header (Compact) */}
                <div className="relative h-48 w-full bg-secondary">
                  <img
                    src={selectedArticle._resolvedImage || selectedArticle.image_url}
                    alt=""
                    className="w-full h-full object-cover opacity-90"
                    onError={(e) => { e.target.src = getPlaceholderImage(0); }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-sm"
                    onClick={() => setSelectedArticle(null)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                <div className="px-6 pb-6 -mt-12 relative">
                  {/* A. HEADER SECTION */}
                  {/* A. HEADER SECTION */}
                  <div className="bg-card border border-border/50 shadow-sm rounded-xl p-5 mb-6">
                    {/* Unified Metadata Line */}
                    <div className="flex flex-wrap items-center gap-3 text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-4">
                      <Badge variant="outline" className={
                        selectedArticle.category === 'price' ? 'text-red-600 border-red-200 bg-red-50' :
                          selectedArticle.category === 'supply' ? 'text-green-600 border-green-200 bg-green-50' :
                            'text-blue-600 border-blue-200 bg-blue-50'
                      }>
                        {selectedArticle.category || 'General'}
                      </Badge>
                      <span>{new Date(selectedArticle.published_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>

                      <div className="h-4 w-px bg-border/60 mx-1" />

                      {/* Trust & Consensus Group */}
                      {selectedArticle.reliability && (
                        <span className={`flex items-center gap-1.5 ${selectedArticle.reliability > 0.85 ? 'text-green-600' : 'text-amber-600'}`}>
                          {selectedArticle.reliability > 0.85 ? <div className="h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]" /> : null}
                          {(selectedArticle.reliability * 100).toFixed(0)}% Trust
                        </span>
                      )}

                      {(selectedArticle.related_links?.length > 1 || selectedArticle.source_count > 1) && (
                        <>
                          <span className="text-border/40">•</span>
                          <span className="flex items-center gap-1 text-primary">
                            {/* Simple Dots for Consensus */}
                            <div className="flex gap-0.5">
                              {[1, 2, 3].map(i => (
                                <div key={i} className={`h-1 w-1 rounded-full ${(selectedArticle.source_count || selectedArticle.related_links?.length) >= (i * 2)
                                  ? 'bg-primary' : 'bg-primary/20'
                                  }`} />
                              ))}
                            </div>
                            High Consensus
                          </span>
                        </>
                      )}
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">
                      {selectedArticle.title}
                    </h2>
                  </div>

                  {/* B. ONE SUMMARY BLOCK */}
                  <div className="space-y-4 mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <span className="text-sm font-bold uppercase text-primary">Key Takeaway</span>
                    </div>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <p className="text-base text-foreground/90 leading-relaxed font-medium">
                        {selectedArticle.ai_implication || selectedArticle.summary}
                      </p>
                      {/* Fallback to content if summary is empty */}
                      {!selectedArticle.ai_implication && !selectedArticle.summary && (
                        <div dangerouslySetInnerHTML={{ __html: selectedArticle.content }} className="line-clamp-4" />
                      )}
                    </div>
                  </div>

                  {/* C. HASHTAGS */}
                  {selectedArticle.tags && (
                    <div className="flex flex-wrap gap-2 mb-8">
                      {selectedArticle.tags.slice(0, 3).map((tag, i) => (
                        <span key={i} className="text-xs font-medium text-muted-foreground bg-secondary px-2 py-1 rounded-md">
                          #{tag.replace(/\s+/g, '')}
                        </span>
                      ))}
                      {selectedArticle.tags.length > 3 && (
                        <span className="text-xs text-muted-foreground px-1 py-1">
                          +{selectedArticle.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* ACTIONS & SOURCES */}
                  <div className="border-t border-border pt-6 space-y-4">
                    {/* Primary CTA */}
                    {selectedArticle.url && (
                      <Button className="w-full h-12 text-base font-semibold shadow-sm" asChild>
                        <a href={selectedArticle.url} target="_blank" rel="noopener noreferrer">
                          Read on {selectedArticle.primary_source || selectedArticle.source} <ExternalLink className="ml-2 h-4 w-4" />
                        </a>
                      </Button>
                    )}

                    {/* Secondary Sources (Collapsible) */}
                    {selectedArticle.related_links && selectedArticle.related_links.length > 0 && (
                      <details className="group text-sm text-muted-foreground">
                        <summary className="cursor-pointer hover:text-foreground flex items-center gap-2 select-none list-none">
                          <span className="font-medium">Also covered by {selectedArticle.related_links.length} other sources</span>
                          <ChevronDown className="h-3 w-3 group-open:rotate-180 transition-transform" />
                        </summary>
                        <div className="mt-3 pl-0 space-y-2 flex flex-col border-l-2 border-border/50 ml-1 pl-3">
                          {selectedArticle.related_links.map((link, idx) => (
                            link.url !== selectedArticle.url && (
                              <a
                                key={idx}
                                href={link.url}
                                target="_blank"
                                className="block text-primary hover:underline underline-offset-4 truncate"
                              >
                                {link.source}: {link.url}
                              </a>
                            )
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

      </DashboardLayout>
    </>
  );
};

export default NewsWatchPage;
