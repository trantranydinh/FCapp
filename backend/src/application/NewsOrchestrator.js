/**
 * APPLICATION LAYER: News Orchestrator (Enhanced)
 *
 * Responsibility: Coordinate news data retrieval and AI enhancement
 * Dependencies: Infrastructure services (JSONCache, LLMProvider, NewsCrawler)
 *
 * Features:
 * - Keyword-based news crawling
 * - AI enhancement for news insights
 * - Graceful degradation when AI unavailable
 */

import path from 'path';
import fs from 'fs-extra';
import llmProvider from '../infrastructure/llm/LLMProvider.js';
import newsCrawler from '../infrastructure/data/NewsCrawler.js';
import databaseAdapter from '../infrastructure/db/DatabaseAdapter.js';
import { settings } from '../settings.js';

class NewsOrchestrator {
  constructor() {
    // Default to data directory for news storage
    this.newsFilePath = path.resolve(process.cwd(), 'data', 'demo_news.json');
  }

  /**
   * Get news summary
   *
   * @param {number} limit - Maximum number of news items to return
   * @returns {Promise<object>} News summary with optional AI enhancements
   */
  async getNewsSummary(limit = 5) {
    if (!Number.isInteger(limit) || limit < 1 || limit > 20) {
      throw new Error('limit must be an integer between 1 and 20');
    }

    console.log(`[NewsOrchestrator] Fetching news summary (limit: ${limit})`);

    try {
      // Step 1: Load news items
      const items = await this._loadNewsItems();

      // Step 2: Select top N items
      const topNews = items.slice(0, limit);

      // Step 3: Enhance with AI (if enabled)
      const enhancedNews = await this._enhanceNewsWithAI(topNews);

      return {
        total_count: items.length,
        top_news: enhancedNews,
        last_updated: new Date().toISOString()
      };

    } catch (error) {
      console.error('[NewsOrchestrator] Failed to fetch news:', error.message);
      throw new Error(`Failed to fetch news summary: ${error.message}`);
    }
  }

  /**
   * Refresh news data by crawling with optional keywords
   *
   * @param {Object} options - Crawl options
   * @returns {Promise<Array>} List of refreshed news items
   */
  async refreshNews(options = {}) {
    const { keywords = [], limit = 10 } = options;
    // Always fetch a minimum baseline to ensure cache isn't too small if user switches 'Show' filter
    const internalLimit = Math.max(limit, 24);

    console.log(`[NewsOrchestrator] Refreshing news (keywords: ${keywords.join(', ')}, limit: ${limit}, fetching: ${internalLimit})`);

    try {
      // Step 1: Crawl new data
      const newsItems = await newsCrawler.crawl({ keywords, limit: internalLimit });

      // Step 2: Persist to file (or DB in future)
      await fs.ensureDir(path.dirname(this.newsFilePath));
      await fs.writeJson(this.newsFilePath, newsItems, { spaces: 2 });
      console.log(`[NewsOrchestrator] Saved ${newsItems.length} items to ${this.newsFilePath}`);

      return newsItems;

    } catch (error) {
      console.error('[NewsOrchestrator] Failed to refresh news:', error.message);
      throw new Error(`Failed to refresh news: ${error.message}`);
    }
  }

  /**
   * Load news items from storage
   * @private
   */
  async _loadNewsItems() {
    try {
      // Check if file exists
      const exists = await fs.pathExists(this.newsFilePath);

      if (exists) {
        const stats = await fs.stat(this.newsFilePath);
        const now = new Date();
        const mtime = new Date(stats.mtime);
        const ageMinutes = (now - mtime) / (1000 * 60);

        // If file is older than 15 minutes, treat as expired (in dev mode, maybe stricter)
        const CACHE_TTL_MINUTES = 15;

        if (ageMinutes < CACHE_TTL_MINUTES) {
          console.log(`[NewsOrchestrator] Serving cache (age: ${Math.round(ageMinutes)}m)`);
          const data = await fs.readJson(this.newsFilePath);
          if (Array.isArray(data) && data.length > 0) {
            return data;
          }
        } else {
          console.log(`[NewsOrchestrator] Cache expired (age: ${Math.round(ageMinutes)}m), refreshing...`);
          // Proceed to undefined check -> triggers refresh
        }
      }

      console.warn('[NewsOrchestrator] No local news found, triggering fresh crawl...');
      // Force a crawl using the new Real News Logic
      return await this.refreshNews({ keywords: ['cashew'], limit: 12 });

    } catch (error) {
      console.warn('[NewsOrchestrator] Failed to load news file, using fallback:', error.message);
      return this._getFallbackNews();
    }
  }

  /**
   * Get fallback news data
   * @private
   */
  _getFallbackNews() {
    const now = new Date().toISOString();

    return [
      {
        title: 'Export demand for cashew remains steady in Q1',
        source: 'Cashew Market Watch',
        summary: 'Key buyers in Europe maintain forward contracts, supporting price stability.',
        impact: 'MEDIUM',
        published_at: now,
        url: 'https://www.reuters.com/markets/commodities', // General commodities page
        image_url: 'https://images.unsplash.com/photo-1611974765270-ca12586343bb?w=800&q=80',
        tags: ['Demand', 'Europe'],
        content: `<p><strong>(Reuters)</strong> - Demand for cashew kernels in the European market has shown resilience despite broader economic headwinds. Importers report a steady increase in orders for premium grades (W320 and above) as consumer preference shifts towards healthier snacking options.</p><p>However, inflationary pressures are squeezing margins for smaller distributors. "The appetite is there, but price sensitivity is at an all-time high," says a procurement manager at a leading German retailer.</p><p>Market participants expect this trend of high volume but lower margin to continue through Q3 2024.</p>`
      },
      {
        title: 'Logistics costs tick higher amid shipping constraints',
        source: 'Logistics Daily',
        summary: 'Freight rates rise 4-6% on select routes, prompting early booking strategies.',
        impact: 'HIGH',
        reliability: 0.6,
        published_at: now,
        url: 'https://www.logisticsmgmt.com/topic/ocean_freight',
        image_url: 'https://images.unsplash.com/photo-1494412574643-35d32468817e?w=800&q=80',
        tags: ['Logistics'],
        content: `<p><strong>(Logistics Daily)</strong> - Global shipping routes are facing renewed strain as container availability tightens in key Asian ports. Freight rates for the Vietnam-Europe route have ticked up by 4-6% in the last week alone.</p><p>Exporters are advised to book shipments at least 3 weeks in advance to secure slots. "Space is the new currency," notes a freight forwarder based in Ho Chi Minh City.</p><p>This uptick in logistics costs is likely to be passed on to the CFR prices in the coming weeks.</p>`
      },
      {
        title: 'New processing facilities announced in Vietnam',
        source: 'Industry News',
        summary: 'Three new cashew processing plants will increase regional capacity by 15%.',
        impact: 'MEDIUM',
        reliability: 0.8,
        published_at: now,
        url: 'https://www.vietnam-briefing.com/news/category/industry/agriculture',
        image_url: 'https://images.unsplash.com/photo-1598514981750-f19a0a39525c?w=800&q=80',
        tags: ['Supply', 'Vietnam'],
        content: `<p><strong>(Industry News)</strong> - In a bid to consolidate its position as the world's leading cashew processor, Vietnam has announced the groundbreaking of three new large-scale processing facilities in Binh Phuoc province.</p><p>These facilities, expected to come online by late 2025, will add approximately 15% to the regional processing capacity. The focus is on automation and high-value retrieval rates.</p><p>The move is seen as a direct response to increasing competition from African processing hubs.</p>`
      }
    ];
  }

  /**
   * Enhance news with AI-generated insights
   * @private
   */
  async _enhanceNewsWithAI(newsItems) {
    // Skip if LLM not enabled
    if (!llmProvider.isEnabled() || newsItems.length === 0) {
      return newsItems;
    }

    console.log(`[NewsOrchestrator] Enhancing ${newsItems.length} news items with AI`);

    try {
      // Enhance each news item individually (parallel execution)
      const enhancedPromises = newsItems.map(async (item) => {
        try {
          const implication = await llmProvider.enhanceNews(item);
          return {
            ...item,
            ai_implication: implication
          };
        } catch (error) {
          console.warn(`[NewsOrchestrator] Failed to enhance news item: ${item.title}`, error.message);
          return item; // Return original if enhancement fails
        }
      });

      return await Promise.all(enhancedPromises);

    } catch (error) {
      console.warn('[NewsOrchestrator] AI enhancement failed, returning original news:', error.message);
      return newsItems; // Graceful degradation
    }
  }
}

// Export singleton instance
const newsOrchestrator = new NewsOrchestrator();
export default newsOrchestrator;
