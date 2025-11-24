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
        reliability: 0.7,
        published_at: now,
        url: '',
        tags: ['Demand', 'Europe']
      },
      {
        title: 'Logistics costs tick higher amid shipping constraints',
        source: 'Logistics Daily',
        summary: 'Freight rates rise 4-6% on select routes, prompting early booking strategies.',
        impact: 'HIGH',
        reliability: 0.6,
        published_at: now,
        url: '',
        tags: ['Logistics']
      },
      {
        title: 'New processing facilities announced in Vietnam',
        source: 'Industry News',
        summary: 'Three new cashew processing plants will increase regional capacity by 15%.',
        impact: 'MEDIUM',
        reliability: 0.8,
        published_at: now,
        url: '',
        tags: ['Supply', 'Vietnam']
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
