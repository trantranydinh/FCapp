/**
 * APPLICATION LAYER: News Orchestrator (Enhanced)
 *
 * Responsibility: Coordinate news data retrieval and AI enhancement
 * Dependencies: Infrastructure services (LLMProvider, NewsCrawler)
 *
 * Features:
 * - Keyword-based news crawling
 * - AI enhancement for news insights
 * - File-based caching with TTL
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
    this.newsFilePath = path.resolve(process.cwd(), 'data', 'demo_news.json');
  }

  /**
   * Get news summary
   *
   * @param {number} limit - Maximum number of news items to return
   * @returns {Promise<object>} News summary with optional AI enhancements
   */
  async getNewsSummary(limit = 12, page = 1) {
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new Error('limit must be an integer between 1 and 100');
    }
    if (!Number.isInteger(page) || page < 1) {
      throw new Error('page must be a positive integer');
    }

    console.log(`[NewsOrchestrator] Fetching news summary (limit: ${limit}, page: ${page})`);

    try {
      // Step 1: Load news items
      const items = await this._loadNewsItems();

      // Step 2: Calculate pagination
      const totalCount = items.length;
      const totalPages = Math.ceil(totalCount / limit);
      const start = (page - 1) * limit;
      const end = start + limit;

      const pagedItems = items.slice(start, end);

      // Step 3: Enhance with AI (if enabled) - Only for the items being shown
      const enhancedNews = await this._enhanceNewsWithAI(pagedItems);

      return {
        total_count: totalCount,
        total_pages: totalPages,
        current_page: page,
        limit: limit,
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

      // Step 2: Persist to file
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
   * Load news items from storage (Redis → File → Crawl fallback)
   * @private
   */
  async _loadNewsItems() {
    try {
      // Try file cache
      const exists = await fs.pathExists(this.newsFilePath);

      if (exists) {
        const stats = await fs.stat(this.newsFilePath);
        const now = new Date();
        const mtime = new Date(stats.mtime);
        const ageMinutes = (now - mtime) / (1000 * 60);

        // If file is older than 15 minutes, treat as expired
        const CACHE_TTL_MINUTES = 15;

        if (ageMinutes < CACHE_TTL_MINUTES) {
          const data = await fs.readJson(this.newsFilePath);
          if (Array.isArray(data) && data.length > 0) {
            console.log(`[NewsOrchestrator] Serving from file cache (age: ${Math.round(ageMinutes)}m)`);
            return data;
          }
        } else {
          console.log(`[NewsOrchestrator] Cache expired (age: ${Math.round(ageMinutes)}m), refreshing...`);
        }
      }

      // Level 3: No cache available, crawl fresh
      console.warn('[NewsOrchestrator] No local news found, triggering fresh crawl...');
      return await this.refreshNews({ keywords: ['cashew'], limit: 12 });

    } catch (error) {
      console.warn('[NewsOrchestrator] Failed to load news, using fallback:', error.message);
      return this._getFallbackNews();
    }
  }

  /**
   * Get fallback news data
   * @private
   */
  _getFallbackNews() {
    const now = new Date();
    const twoHoursAgo = new Date(now - 2 * 60 * 60 * 1000).toISOString();
    const fourHoursAgo = new Date(now - 4 * 60 * 60 * 1000).toISOString();
    const yesterday = new Date(now - 24 * 60 * 60 * 1000).toISOString();

    return [
      {
        id: 'demo-1',
        title: 'Vietnam Cashew Exports Hit Record High in Q4 2024',
        source: 'Vinacas Official',
        domain: 'vinacas.com.vn',
        summary: 'Vietnam\'s cashew exports have surged 15% year-on-year, driven by strong demand from the US and EU markets during the holiday season. The association notes stable raw nut supply has been crucial.',
        ai_implication: '1. Production volumes in Vietnam are outpacing forecasts, suggesting eased supply constraints. 2. Traders should watch for potential oversupply softening prices in Q1 2025. 3. Strong EU demand indicates robust consumption despite economic headwinds.',
        category: 'Supply',
        published_at: twoHoursAgo,
        url: 'https://vinacas.com.vn/news-demo',
        image_url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&q=80',
        tags: ['Vietnam', 'Exports', 'Production'],
        reliability: 0.95,
        is_trusted: true,
        source_count: 5,
        related_links: [
          { source: 'Reuters', url: 'https://reuters.com/demo1', domain: 'reuters.com' },
          { source: 'Vietnam Briefing', url: 'https://vietnam-briefing.com/demo', domain: 'vietnam-briefing.com' },
          { source: 'AgriLinks', url: 'https://agrilinks.org/demo', domain: 'agrilinks.org' }
        ]
      },
      {
        id: 'demo-2',
        title: 'Global Freight Rates Spike on Asia-Europe Routes',
        source: 'Logistics Daily',
        domain: 'logisticsdaily.com',
        summary: 'Container shipping rates have increased by 12% this week due to renewed congestion in key transit hubs. Exporters are facing delays of up to 2 weeks for bookings.',
        ai_implication: '1. Logistics costs will directly impact CFR prices for upcoming shipments. 2. Buyers should account for longer lead times (additional 14 days). 3. Immediate booking is recommended to secure current rates before further hikes.',
        category: 'Logistics',
        published_at: fourHoursAgo,
        url: 'https://logisticsdaily.com/demo',
        image_url: 'https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?w=800&q=80',
        tags: ['Shipping', 'Freight', 'Cost'],
        reliability: 0.88,
        is_trusted: true,
        source_count: 3,
        related_links: [
          { source: 'Bloomberg', url: 'https://bloomberg.com/demo', domain: 'bloomberg.com' },
          { source: 'Maersk News', url: 'https://maersk.com/news', domain: 'maersk.com' }
        ]
      },
      {
        id: 'demo-3',
        title: 'Ivory Coast Sets New Farmgate Price for 2025 Season',
        source: 'Abidjan Business',
        domain: 'abidjan.net',
        summary: 'The CCA (Cotton and Cashew Council) has established a minimum farmgate price of 320 FCFA/kg for the upcoming season, aiming to ensure fair compensation for farmers amid inflation.',
        ai_implication: '1. The new floor price establishes a higher cost basis for RCN sourcing. 2. Processors in Vietnam/India will face tighter margins if kernel prices do not rise proportionally. 3. Monitor enforcement levels in the bush, as actual trading often varies.',
        category: 'Price',
        published_at: yesterday,
        url: 'https://abidjan.net/demo',
        image_url: 'https://images.unsplash.com/photo-1611974765270-ca12586343bb?w=800&q=80',
        tags: ['Ivory Coast', 'RCN', 'Regulation'],
        reliability: 0.92,
        is_trusted: true,
        source_count: 2,
        related_links: [
          { source: 'CommodityHQ', url: 'https://commodityhq.com/demo', domain: 'commodityhq.com' }
        ]
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
