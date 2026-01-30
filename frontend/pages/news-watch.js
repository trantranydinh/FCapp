import Head from "next/head";
import { useState, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent } from "../components/ui/dialog";
import { useNewsSummary } from "../hooks/useDashboardData";
import { Newspaper, Tag, Calendar, TrendingUp, TrendingDown, ChevronDown, ChevronUp, X, ExternalLink, Search, Loader2, HelpCircle } from "lucide-react";
import { useSWRConfig } from "swr"; // Import for global mutate
import { cn } from "../lib/utils";

const NewsWatchPage = () => {
  const [limit, setLimit] = useState(12); // Default to 12 for grid
  const [page, setPage] = useState(1);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [clientDate, setClientDate] = useState("");

  const { data, isLoading } = useNewsSummary(limit, page);
  const { mutate } = useSWRConfig();

  // Fix hydration mismatch for dates
  useEffect(() => {
    setClientDate(new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
  }, []);

  // Access the nested data property from the API response
  const newsItems = data?.data?.top_news || [];
  const pagination = data?.data || {};

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
        mutate(`/api/v1/dashboard/news-summary?limit=${limit}&page=${page}`);
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
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-border pb-6 gap-6">
            <div className="space-y-3 max-w-4xl">
              <h1 className="text-4xl font-light tracking-tight text-foreground">
                Market <span className="font-semibold text-primary">Beat</span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Curated intelligence on global cashew markets, supply chain disruptions, and price movements.
              </p>
            </div>

            {/* Filter and Search Controls */}
            <div className="flex flex-col items-end gap-3">
              <div className="flex items-center gap-2">


                {/* Search Form */}
                <form onSubmit={handleSearch} className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search topics..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-secondary/50 border border-border rounded-full pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-48 transition-all"
                    />
                  </div>
                </form>
              </div>

              {/* Pagination Info & Page Size */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronDown className="h-4 w-4 rotate-90" />
                  </Button>
                  <span className="text-xs font-medium min-w-[60px] text-center">
                    Page {pagination.current_page || 1} / {pagination.total_pages || 1}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setPage(p => Math.min(pagination.total_pages || 1, p + 1))}
                    disabled={page >= (pagination.total_pages || 1)}
                  >
                    <ChevronDown className="h-4 w-4 -rotate-90" />
                  </Button>
                </div>
                <div className="h-4 w-px bg-border/60" />
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">Per page:</span>
                  {[12, 24, 48].map((value) => (
                    <button
                      key={value}
                      onClick={() => { setLimit(value); setPage(1); }}
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
                return (
                  <article
                    key={item.id}
                    className="flex flex-col bg-card border border-border/60 hover:border-primary/50 shadow-sm hover:shadow-md transition-all duration-300 rounded-xl overflow-hidden group h-full cursor-pointer"
                    onClick={() => setSelectedArticle({ ...item, _resolvedImage: item.image_url || getPlaceholderImage(index) })}
                  >
                    {/* TOP: Image & Visuals */}
                    <div className="relative h-48 w-full shrink-0 overflow-hidden bg-muted">
                      <img
                        src={item.image_url || getPlaceholderImage(index)}
                        alt={item.title}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        onError={(e) => { e.target.src = getPlaceholderImage(index); }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                      {/* Trust Badge Overlay (Compact) */}
                      <div className="absolute bottom-3 left-3">
                        <Badge className={cn("text-[10px] h-5 border-0 text-white backdrop-blur-md px-2",
                          item.trustLevel === 'High' ? "bg-green-600/90" :
                            item.trustLevel === 'Medium' ? "bg-amber-600/90" : "bg-red-600/90"
                        )}>
                          {item.trustLevel || 'Medium'} Trust
                        </Badge>
                      </div>
                    </div>

                    {/* BOTTOM: Content Structure */}
                    <div className="flex flex-col flex-1 p-4 gap-3">

                      {/* 1. METADATA: Category | Source | Date */}
                      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        <Badge variant="outline" className={cn("border-0 bg-opacity-10 text-[10px] px-2 h-5",
                          item.category === 'Market' ? "text-blue-600 bg-blue-100" :
                            item.category === 'Supply' ? "text-emerald-600 bg-emerald-100" :
                              item.category === 'Logistics' ? "text-purple-600 bg-purple-100" :
                                "text-slate-600 bg-slate-100"
                        )}>
                          {item.category || "General"}
                        </Badge>
                        <span className="text-border/60">|</span>
                        <span className="truncate max-w-[120px] text-foreground font-bold">{item.source || "Unknown Source"}</span>
                        <span className="text-border/60">|</span>
                        <span>
                          {item.publishedAt && !isNaN(new Date(item.publishedAt).getTime())
                            ? new Date(item.publishedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                            : `Retrieved: ${new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`}
                        </span>
                      </div>

                      {/* 2. INSIGHT: Title & Context */}
                      <div className="flex-1 space-y-2">
                        <h3 className="text-base font-bold text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-2">
                          {item.title}
                        </h3>

                        {/* Context Strip */}
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span className="bg-secondary/50 px-1.5 py-0.5 rounded">Tier {item.sourceTier || "?"}</span>
                          {item.title.toLowerCase().includes('vietnam') && <span className="bg-secondary/50 px-1.5 py-0.5 rounded">Region: Vietnam</span>}
                          {item.trustReasons?.includes('High Consensus') && <span className="bg-secondary/50 px-1.5 py-0.5 rounded text-primary">High Consensus</span>}
                        </div>

                        {/* 3. KEY TAKEAWAY (Formatted Bullets) */}
                        <div className="relative pl-3 border-l-2 border-primary/30 mt-3 pt-1">
                          {/* Simple heuristic to split long summary into pseudo-bullets if possible, else just show text */}
                          <div className="text-sm text-muted-foreground leading-relaxed text-justify space-y-1">
                            {item.summary && item.summary.length > 100 ? (
                              <>
                                <p className="line-clamp-4">
                                  <span className="font-semibold text-foreground/80">Insight: </span>
                                  {item.summary.split('. ')[0]}.
                                </p>
                                {/* Optional 2nd point if summary is long enough */}
                                {item.summary.split('. ').length > 1 && (
                                  <p className="line-clamp-2 italic text-xs mt-1">
                                    "{item.summary.split('. ').slice(1).join('. ').substring(0, 100)}..."
                                  </p>
                                )}
                              </>
                            ) : (
                              <p className="italic">"{item.summary || "No specific details available."}"</p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="h-px bg-border/40 w-full my-1" />

                      {/* 4. FOOTER: Consensus -> CTA */}
                      <div className="flex items-center justify-between pt-1">

                        {/* Consensus / Trust Details (Expandable in theory, tooltipped here) */}
                        <div className="flex items-center gap-3">
                          {(item.related_links?.length > 0) ? (
                            <div className="flex flex-col group/consensus cursor-help">
                              <div className="flex items-center gap-1.5">
                                <span className="flex h-2 w-2 relative">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                                </span>
                                <span className="text-xs font-bold text-foreground">
                                  High Consensus ({item.related_links.length + 1})
                                </span>
                              </div>
                              <span className="text-[10px] text-muted-foreground hidden group-hover/consensus:block absolute bg-popover px-2 py-1 rounded border shadow-lg -mt-8 ml-4 z-50 w-48">
                                Also covered by {item.related_links.map(l => l.source).join(', ')}...
                              </span>
                            </div>
                          ) : (
                            <div className="text-[10px] text-muted-foreground flex items-center gap-1" title={(item.trustReasons || []).join('\n')}>
                              Single Source <HelpCircle className="h-3 w-3" />
                            </div>
                          )}
                        </div>

                        {/* ACTION CTA */}
                        <a
                          href={item.url || item.originalUrl || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs font-bold text-white bg-primary hover:bg-primary/90 px-3 py-1.5 rounded-lg transition-all shadow-sm active:scale-95"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Read on {item.source?.split(' ')[0] || 'Source'}
                          <ExternalLink className="ml-1 h-3 w-3" />
                        </a>
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
                  <div className="bg-card border border-border/50 shadow-sm rounded-xl p-5 mb-6">
                    {/* Unified Metadata Line */}
                    <div className="flex flex-wrap items-center gap-3 text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-4">
                      <Badge variant="outline" className={
                        selectedArticle.category === 'Market' ? 'text-red-600 border-red-200 bg-red-50' :
                          selectedArticle.category === 'Supply' ? 'text-green-600 border-green-200 bg-green-50' :
                            'text-blue-600 border-blue-200 bg-blue-50'
                      }>
                        {selectedArticle.category || 'General'}
                      </Badge>
                      <span>{selectedArticle.publishedAt ? new Date(selectedArticle.publishedAt).toLocaleDateString() : "Unknown Date"}</span>

                      <div className="h-4 w-px bg-border/60 mx-1" />

                      {/* Trust & Consensus Group */}
                      {selectedArticle.trustScore && (
                        <span className={`flex items-center gap-1.5 ${selectedArticle.trustScore >= 80 ? 'text-green-600' : 'text-amber-600'}`} title={selectedArticle.trustReasons?.join(', ')}>
                          <div className={`h-1.5 w-1.5 rounded-full ${selectedArticle.trustScore >= 80 ? "bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]" : "bg-amber-500"}`} />
                          {selectedArticle.trustScore}% Trust
                        </span>
                      )}

                      {(selectedArticle.related_links?.length > 0 || selectedArticle.source_count > 1) && (
                        <>
                          <span className="text-border/40">•</span>
                          <span className="flex items-center gap-1 text-primary">
                            {/* Simple Dots for Consensus */}
                            <div className="flex gap-0.5">
                              {[1, 2, 3].map(i => (
                                <div key={i} className={`h-1 w-1 rounded-full ${(selectedArticle.source_count || selectedArticle.related_links?.length || 1) >= i
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
