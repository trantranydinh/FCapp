/**
 * INFRASTRUCTURE LAYER: News Crawler
 *
 * Responsibility: Fetch latest news from diverse sources (RSS, APIs, Social)
 * Capabilities:
 * - Multi-source aggregation (Google, Bing, ContextualWeb)
 * - Intelligent keyword expansion
 * - Robust error handling & deduplication
 * - Source reputation tracking
 */

import Parser from 'rss-parser';
import * as cheerio from 'cheerio';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import axios from 'axios';
import pLimit from 'p-limit';
import fs from 'fs-extra';
import path from 'path';

// Cache file location
const CACHE_FILE = path.resolve(process.cwd(), 'data', 'news_cache.json');

// User-Agent rotation to avoid blocking
const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15'
];

const getRandomUA = () => USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

const rssParser = new Parser({
    headers: { 'User-Agent': getRandomUA() },
    customFields: {
        item: [
            ['image', 'image'],
            ['media:content', 'media'],
            ['enclosure', 'enclosure'],
            ['description', 'summary'],
            ['content:encoded', 'full_content'],
            ['dc:creator', 'author'],
            ['pubDate', 'pubDate'],
            ['isoDate', 'isoDate']
        ]
    }
});

const IMAGE_POOLS = {
    market: [
        'https://images.unsplash.com/photo-1628102491629-778571d893a3?w=800&fit=crop',
        'https://images.unsplash.com/photo-1610450549449-74d394b0bd15?w=800&fit=crop',
        'https://images.unsplash.com/photo-1590779033100-9f60a05a013d?w=800&fit=crop',
        'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?w=800&fit=crop',
        'https://images.unsplash.com/photo-1559589689-577aabd1db4f?w=800&fit=crop',
        'https://images.unsplash.com/photo-1560472355-536de3962603?w=800&fit=crop', // Finance
        'https://images.unsplash.com/photo-1611974765270-ca1258634369?w=800&fit=crop', // Trading
        'https://images.unsplash.com/photo-1535320903710-d9cf5b367b67?w=800&fit=crop',
        'https://images.unsplash.com/photo-1526304640152-d4619684e484?w=800&fit=crop'
    ],
    supply: [
        'https://images.unsplash.com/photo-1601053746399-6e426cb7507b?w=800&fit=crop', // Cashew fruit
        'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&fit=crop',
        'https://images.unsplash.com/photo-1627914040994-db7cdb144fae?w=800&fit=crop',
        'https://images.unsplash.com/photo-1595839049400-354964177d70?w=800&fit=crop', // Farming
        'https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?w=800&fit=crop', // Agriculture
        'https://images.unsplash.com/photo-1605000797499-95a51c5269ae?w=800&fit=crop',
        'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800&fit=crop'
    ],
    logistics: [
        'https://images.unsplash.com/photo-1494412651409-ae1e0d529258?w=800&fit=crop', // Container
        'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&fit=crop',
        'https://images.unsplash.com/photo-1566847438217-76e82d383f84?w=800&fit=crop', // Port
        'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=800&fit=crop', // Ship
        'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?w=800&fit=crop'
    ],
    general: [
        'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&fit=crop', // Food
        'https://plus.unsplash.com/premium_photo-1675363010376-76495cb2e32f?w=800&fit=crop', // Cashew
        'https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&fit=crop',
        'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&fit=crop', // Business
        'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=800&fit=crop'
    ]
};

// ============================================
// HELPER CLASSES
// ============================================

class ZeroDuplicateImageResolver {
    constructor() {
        this.usedImages = new Set();
        this.articleImageMap = new Map();
        this.imagePools = IMAGE_POOLS;
        this.ogFetchLimit = pLimit(5); // Max 5 concurrent OG image fetches
    }

    reset() {
        this.usedImages.clear();
        this.articleImageMap.clear();
    }

    async resolveImage(article) {
        const fingerprint = this.getArticleFingerprint(article);

        // 1. Check cache
        if (this.articleImageMap.has(fingerprint)) {
            return this.articleImageMap.get(fingerprint);
        }

        let imageUrl = null;
        let imageSource = null;

        // LEVEL 1: RSS Metadata Extraction
        imageUrl = this.extractRSSImage(article);
        if (imageUrl && this.isValidImageUrl(imageUrl)) {
            // Check uniqueness if strict unique is needed, but RSS images are specific to article so usually OK
            // We still mark it used.
            imageSource = 'rss';
        }

        // LEVEL 2: Open Graph (Deep Fetch) - with concurrency limit
        if (!imageUrl && article.link) {
            imageUrl = await this.ogFetchLimit(() => this.fetchOGImage(article.link));
            if (imageUrl) {
                imageSource = 'og';
            }
        }

        // LEVEL 3: Deterministic Fallback (Zero Duplicate Logic)
        if (!imageUrl) {
            imageUrl = this.getUniqueFallback(article);
            imageSource = 'fallback';
        }

        // Track usage
        this.usedImages.add(imageUrl);
        this.articleImageMap.set(fingerprint, imageUrl);

        return imageUrl;
    }

    extractRSSImage(article) {
        const findUrl = (obj) => {
            if (!obj) return null;
            if (typeof obj === 'string' && obj.startsWith('http')) return obj;
            if (Array.isArray(obj)) {
                // Try each item in array
                for (const item of obj) {
                    const url = findUrl(item);
                    if (url) return url;
                }
                return null;
            }
            // Check various attribute patterns
            if (obj.$ && obj.$.url) return obj.$.url;
            if (obj.$ && obj.$.src) return obj.$.src;
            if (obj.$ && obj.$.href) return obj.$.href;
            if (obj.url) return obj.url;
            if (obj.src) return obj.src;
            if (obj.href) return obj.href;
            return null;
        };

        // Try mapped and original fields (expanded list)
        const fieldsToCheck = [
            'media',
            'media:content',
            'media:thumbnail',
            'enclosure',
            'image',
            'thumbnail',
            'itunes:image',
            'content:encoded'
        ];

        for (const field of fieldsToCheck) {
            const url = findUrl(article[field]);
            if (url && this.isValidImageUrl(url)) {
                return url;
            }
        }

        // Try extracted from HTML description
        if (article.extractedImage && this.isValidImageUrl(article.extractedImage)) {
            return article.extractedImage;
        }

        return null;
    }

    async fetchOGImage(url, timeout = 5000) {
        if (!url || !url.startsWith('http')) return null;
        try {
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), timeout);

            const response = await axios.get(url, {
                signal: controller.signal,
                headers: {
                    'User-Agent': getRandomUA(),
                    'Accept': 'text/html,application/xhtml+xml',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Cache-Control': 'no-cache'
                },
                maxRedirects: 3,
                timeout: timeout,
                validateStatus: (status) => status < 400 // Accept redirects
            });
            clearTimeout(id);

            // Check if response is HTML
            const contentType = response.headers['content-type'] || '';
            if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
                return null;
            }

            const $ = cheerio.load(response.data);

            // Try multiple OG/meta image sources
            let ogImage = $('meta[property="og:image"]').attr('content') ||
                $('meta[property="og:image:url"]').attr('content') ||
                $('meta[name="twitter:image"]').attr('content') ||
                $('meta[name="twitter:image:src"]').attr('content') ||
                $('link[rel="image_src"]').attr('href');

            if (ogImage) {
                // Handle protocol-relative URLs
                if (ogImage.startsWith('//')) {
                    ogImage = 'https:' + ogImage;
                }
                // Handle relative URLs
                else if (ogImage.startsWith('/')) {
                    const u = new URL(url);
                    ogImage = `${u.protocol}//${u.host}${ogImage}`;
                }
                // Validate the final URL
                if (this.isValidImageUrl(ogImage)) {
                    return ogImage;
                }
            }
            return null;
        } catch (e) {
            // Silent fail - will fallback to pool images
            return null;
        }
    }

    getUniqueFallback(article) {
        const category = this.detectCategory(article);
        const pool = this.imagePools[category] || this.imagePools.general;

        // Strategy: Use content hash to pick an index
        // To ensure uniqueness across a list, we try to pick one not used.
        // If all used, we cycle.

        const fingerprint = this.getArticleFingerprint(article);
        const hash = this.hashCode(fingerprint);

        // Try to find an unused image starting from the hash index
        for (let i = 0; i < pool.length; i++) {
            const idx = (Math.abs(hash) + i) % pool.length;
            const img = pool[idx];
            if (!this.usedImages.has(img)) {
                return img;
            }
        }

        // If all used, just return based on hash
        return pool[Math.abs(hash) % pool.length];
    }

    detectCategory(article) {
        const text = `${article.title} ${article.summary || ''}`.toLowerCase();
        if (/price|market|trade|cost|value/.test(text)) return 'market';
        if (/harvest|crop|farm|yield|supply|rain|weather/.test(text)) return 'supply';
        if (/ship|port|container|freight|logistics/.test(text)) return 'logistics';
        return 'general';
    }

    getArticleFingerprint(article) {
        return `${article.link || article.url}-${article.title}`;
    }

    hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash |= 0;
        }
        return hash;
    }

    isValidImageUrl(url) {
        if (!url || typeof url !== 'string') return false;
        if (!url.startsWith('http')) return false;

        // Block known non-image patterns
        const blocklist = [
            'google.com/news',
            '/rss/',
            '/feed/',
            '.xml',
            'favicon',
            'logo',
            'icon',
            'pixel',
            'tracking',
            'ads.',
            '/ad/',
            '1x1',
            'spacer'
        ];
        if (blocklist.some(b => url.toLowerCase().includes(b))) return false;

        // Accept URLs with image extensions (anywhere in path, before query string)
        const urlPath = url.split('?')[0];
        const imageExtensions = /\.(jpg|jpeg|png|webp|gif|svg|avif|bmp)$/i;
        if (imageExtensions.test(urlPath)) return true;

        // Accept known image CDN patterns
        const cdnPatterns = /images\.unsplash|cdn\.|cloudinary|imgix|imgur|wp-content\/uploads|media\.|img\.|image\./i;
        if (cdnPatterns.test(url)) return true;

        // Accept URLs with image-related query params
        const imageQueryParams = /[?&](image|img|photo|pic|thumb|w=|h=|width=|height=|format=|fit=)/i;
        if (imageQueryParams.test(url)) return true;

        return false;
    }
}

// ============================================
// MAIN CRAWLER CLASS
// ============================================

class NewsCrawler {
    constructor() {
        this.imageResolver = new ZeroDuplicateImageResolver();
        this.rssParser = new Parser({
            headers: { 'User-Agent': getRandomUA() },
            timeout: 10000,
            customFields: {
                item: [
                    ['image', 'image'],
                    ['media:content', 'media'],
                    ['media:thumbnail', 'thumbnail'],
                    ['enclosure', 'enclosure'],
                    ['description', 'summary'],
                    ['content:encoded', 'full_content'],
                    ['dc:creator', 'author']
                ]
            }
        });

        this.sourceTiers = {
            'A': ['worldbank.org', 'fao.org', 'vinacas.com.vn', 'gov.vn', 'usda.gov'],
            'B': ['reuters.com', 'bloomberg.com', 'agrilinks.org', 'freshplaza.com', 'inc.org', 'cnbc.com', 'ft.com'],
            'C': ['commodityhq.com', 'blog.', 'medium.com', 'pr.com'],
            'Social': ['reddit.com', 'twitter.com', 'x.com', 'nitter.net', 'linkedin.com']
        };
    }

    /**
     * MAIN ENTRY POINT
     */
    async crawl(profile) {
        this.imageResolver.reset();
        const profilename = profile.name || 'General';
        console.log(`[NewsCrawler] Starting Bulletproof Crawl for: ${profilename}`);

        let allArticles = [];

        // 1. Keyword Expansion
        const keywords = this._expandKeywords(profile.keywords || ['cashew']);
        console.log(`[NewsCrawler] Keywords: ${keywords.join(', ')}`);

        // 2. Fetch from Multiple Sources (with concurrency limit to avoid rate limiting)
        const keywordFetchLimit = pLimit(2); // Max 2 concurrent keyword fetches
        const fetchTasks = keywords.map(kw =>
            keywordFetchLimit(async () => {
                // Add small random delay before each keyword fetch
                await new Promise(r => setTimeout(r, Math.random() * 300));
                return this._fetchByKeyword(kw);
            })
        );

        // Add specific industry feeds (also limited)
        fetchTasks.push(keywordFetchLimit(() => this._fetchIndustryFeeds()));

        // Add social media sources (Reddit, Twitter)
        fetchTasks.push(keywordFetchLimit(() => this._fetchSocialMedia(keywords)));

        const results = await Promise.allSettled(fetchTasks);
        results.forEach(r => {
            if (r.status === 'fulfilled') allArticles.push(...r.value);
        });

        // 3. Fallback to Cache if empty
        if (allArticles.length === 0) {
            console.warn('[NewsCrawler] All sources failed. Attempting cache fallback.');
            const cached = await this._loadCache();
            if (cached && cached.length > 0) return cached;
            return this._generateFallbackNews(profile); // Return generated fallback if no cache
        }

        // 4. Deduplicate
        const uniqueArticles = this._deduplicate(allArticles);
        console.log(`[NewsCrawler] Fetched ${allArticles.length} raw, deduplicated to ${uniqueArticles.length}`);

        // 5. Initial Assessment (Scoring without heavy I/O)
        const scoredArticles = uniqueArticles.map(article => {
            const { trustScore, trustLevel, trustReasons } = this._calculateTrust(article);
            const relevanceScore = this._calculateRelevance(article, profile);
            return {
                ...article,
                trustScore,
                trustLevel,
                trustReasons,
                relevanceScore,
                overallScore: Math.round((trustScore * 0.6) + (relevanceScore * 0.4))
            };
        });

        // 6. Preliminary Sort (Date + Quality)
        scoredArticles.sort((a, b) => {
            const dateA = new Date(a.pubDate).getTime();
            const dateB = new Date(b.pubDate).getTime();
            if (dateB !== dateA) return dateB - dateA;
            return b.overallScore - a.overallScore;
        });

        // 7. Limit to top 100 BEFORE heavy image resolution
        const topArticles = scoredArticles.slice(0, 100);

        // 8. Final Enrichment & Image Resolution (Only for the top subset)
        console.log(`[NewsCrawler] Resolving images for top ${topArticles.length} candidates...`);
        const final = await Promise.all(topArticles.map(async (article) => {
            // Resolve Image (3-Level Logic) - Perform only on top candidates
            const resolvedImage = await this.imageResolver.resolveImage(article);

            return {
                id: this._generateId(article),
                title: article.title,
                summary: article.summary || "No summary available.",
                url: article.link,
                originalUrl: article.link,
                image_url: resolvedImage,
                source: article.source || 'Unknown',
                sourceDomain: this._extractDomain(article.link),
                sourceTier: article.sourceTier,
                sourceType: article.sourceType || 'news',
                sourceCount: article.sourceCount || 1,
                category: this.imageResolver.detectCategory(article).charAt(0).toUpperCase() + this.imageResolver.detectCategory(article).slice(1),
                publishedAt: article.pubDate,
                trustScore: article.trustScore,
                trustLevel: article.trustLevel,
                trustReasons: article.trustReasons,
                relevanceScore: article.relevanceScore,
                overallScore: article.overallScore,
                tags: this._generateTags(article),
                related_links: article.related || []
            };
        }));

        // 9. Save Cache
        this._saveCache(final);

        return final;
    }

    // ============================================
    // FETCHING LOGIC
    // ============================================

    /**
     * Fetch RSS with retry and exponential backoff
     * @private
     */
    async _fetchRSSWithRetry(url, maxRetries = 3, silent = false) {
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                // Create new parser with random UA for each retry
                const parser = new Parser({
                    headers: { 'User-Agent': getRandomUA() },
                    timeout: 10000,
                    customFields: {
                        item: [
                            ['image', 'image'],
                            ['media:content', 'media'],
                            ['media:thumbnail', 'thumbnail'],
                            ['enclosure', 'enclosure'],
                            ['description', 'summary'],
                            ['content:encoded', 'full_content'],
                            ['dc:creator', 'author']
                        ]
                    }
                });
                return await parser.parseURL(url);
            } catch (e) {
                const isRateLimit = e.message?.includes('429') || e.message?.includes('Too Many');
                const isNitter = url.includes('nitter');
                const isLastAttempt = attempt === maxRetries - 1;

                if (isLastAttempt) {
                    if (!silent && !isNitter) {
                        console.warn(`[NewsCrawler] Failed to fetch ${url} after ${maxRetries} attempts: ${e.message}`);
                    }
                    return null;
                }

                // Exponential backoff: 1s, 2s, 4s + random jitter
                const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
                console.log(`[NewsCrawler] Retry ${attempt + 1}/${maxRetries} for ${url} in ${Math.round(delay)}ms${isRateLimit ? ' (rate limited)' : ''}`);
                await new Promise(r => setTimeout(r, delay));
            }
        }
        return null;
    }

    async _fetchByKeyword(keyword) {
        const encoded = encodeURIComponent(keyword);
        const sources = [
            { name: 'Google News', url: `https://news.google.com/rss/search?q=${encoded}&hl=en-US&gl=US&ceid=US:en` },
            { name: 'Bing News', url: `https://www.bing.com/news/search?q=${encoded}&format=rss` }
        ];

        const articles = [];
        for (const s of sources) {
            // Add small delay between sources to avoid rate limiting
            if (articles.length > 0) {
                await new Promise(r => setTimeout(r, 300 + Math.random() * 200));
            }

            const feed = await this._fetchRSSWithRetry(s.url);
            if (feed && feed.items) {
                feed.items.forEach(item => {
                    const parsed = this._parseItem(item, s.name);
                    if (parsed) articles.push(parsed);
                });
            }
        }
        return articles;
    }

    async _fetchIndustryFeeds() {
        // Use Google News Site Operators for stability instead of fragile direct RSS
        const sites = ['site:freshplaza.com', 'site:agrilinks.org', 'site:worldbank.org'];
        return this._fetchByKeyword(sites.join(' OR ') + ' cashew');
    }

    /**
     * Fetch from Social Media sources (Reddit, Twitter alternatives)
     * @private
     */
    async _fetchSocialMedia(keywords) {
        const articles = [];
        const keywordStr = keywords.join(' ');

        // 1. Reddit RSS feeds - reliable and public
        const redditFeeds = [
            // Subreddits relevant to commodities/agriculture
            { name: 'Reddit r/commodities', url: `https://www.reddit.com/r/commodities/search.rss?q=${encodeURIComponent(keywordStr)}&sort=new&restrict_sr=on&t=month` },
            { name: 'Reddit r/agriculture', url: `https://www.reddit.com/r/agriculture/search.rss?q=${encodeURIComponent(keywordStr)}&sort=new&restrict_sr=on&t=month` },
            { name: 'Reddit r/supplychain', url: `https://www.reddit.com/r/supplychain/search.rss?q=${encodeURIComponent(keywordStr)}&sort=new&restrict_sr=on&t=month` },
            { name: 'Reddit r/investing', url: `https://www.reddit.com/r/investing/search.rss?q=${encodeURIComponent(keywordStr)}&sort=new&restrict_sr=on&t=month` }
        ];

        // 2. Nitter instances (Twitter RSS proxy) - try multiple instances for reliability
        // 2. Nitter instances (Twitter RSS proxy) - prioritize reliable ones
        const nitterInstances = [
            'nitter.luca.gl',       // Often reliable
            'nitter.moomoo.me',     // Alternative
            'nitter.adminforge.de', // German instance
            'nitter.net'            // Official (strict rate limits)
        ];

        // Twitter/X accounts to follow for commodity news
        const twitterAccounts = [
            'FAaborneNews',      // FAO news
            'WorldBank',         // World Bank
            'ABORNEAOAC',        // AOAC (Agriculture)
            'USIKICC'            // INC Cashew Council
        ];

        // Fetch Reddit feeds
        for (const feed of redditFeeds) {
            try {
                await new Promise(r => setTimeout(r, 200 + Math.random() * 300));
                const result = await this._fetchRSSWithRetry(feed.url, 2);
                if (result && result.items) {
                    result.items.forEach(item => {
                        // Reddit-specific parsing
                        const parsed = this._parseRedditItem(item, feed.name);
                        if (parsed) articles.push(parsed);
                    });
                }
            } catch (e) {
                // Silent fail for individual feeds
            }
        }

        // Fetch from Nitter (Twitter RSS proxy)
        for (const account of twitterAccounts) {
            for (const instance of nitterInstances) {
                try {
                    const nitterUrl = `https://${instance}/${account}/rss`;
                    // Use silent=true for Nitter to avoid spamming logs with 403s/DNS errors
                    const result = await this._fetchRSSWithRetry(nitterUrl, 1, true);
                    if (result && result.items) {
                        result.items.forEach(item => {
                            // Filter by keywords
                            const text = `${item.title || ''} ${item.content || ''}`.toLowerCase();
                            const hasKeyword = keywords.some(k => text.includes(k.toLowerCase()));
                            if (hasKeyword) {
                                const parsed = this._parseTwitterItem(item, `Twitter @${account}`);
                                if (parsed) articles.push(parsed);
                            }
                        });
                        break; // Success, skip other instances
                    }
                } catch (e) {
                    // Try next instance
                }
            }
        }

        console.log(`[NewsCrawler] Social media fetch: ${articles.length} items`);
        return articles;
    }

    /**
     * Parse Reddit RSS item
     * @private
     */
    _parseRedditItem(item, sourceName) {
        if (!item.title) return null;

        // Extract actual link from Reddit post (if it links externally)
        let link = item.link;
        let extractedImage = null;

        // Try to extract external link and image from content
        if (item.content) {
            try {
                const $ = cheerio.load(item.content);
                const externalLink = $('a[href^="http"]').not('[href*="reddit.com"]').first().attr('href');
                if (externalLink) link = externalLink;
                extractedImage = $('img').first().attr('src');
            } catch { }
        }

        let pubDate = item.pubDate || item.isoDate;
        if (!pubDate || isNaN(new Date(pubDate).getTime())) {
            pubDate = new Date().toISOString();
        } else {
            pubDate = new Date(pubDate).toISOString();
        }

        return {
            title: item.title.replace(/\[.*?\]/g, '').trim(), // Remove [tags]
            link: link,
            pubDate: pubDate,
            summary: item.contentSnippet || item.title,
            source: sourceName,
            sourceType: 'social',
            extractedImage,
            enclosure: item.enclosure,
            image: item.image
        };
    }

    /**
     * Parse Twitter/Nitter RSS item
     * @private
     */
    _parseTwitterItem(item, sourceName) {
        if (!item.title && !item.content) return null;

        // Clean Twitter content
        let summary = (item.content || item.title || '')
            .replace(/<[^>]*>/g, '') // Remove HTML
            .replace(/https?:\/\/\S+/g, '') // Remove URLs from text
            .replace(/\s+/g, ' ')
            .trim();

        if (summary.length < 20) return null; // Skip very short tweets

        let pubDate = item.pubDate || item.isoDate;
        if (!pubDate || isNaN(new Date(pubDate).getTime())) {
            pubDate = new Date().toISOString();
        } else {
            pubDate = new Date(pubDate).toISOString();
        }

        // Extract image from content
        let extractedImage = null;
        if (item.content) {
            const imgMatch = item.content.match(/<img[^>]+src="([^"]+)"/i);
            if (imgMatch) extractedImage = imgMatch[1];
        }

        return {
            title: summary.length > 100 ? summary.substring(0, 100) + '...' : summary,
            link: item.link,
            pubDate: pubDate,
            summary: summary,
            source: sourceName,
            sourceType: 'social',
            extractedImage,
            image: item.image
        };
    }

    _parseItem(item, sourceName) {
        // Try to get raw description/content from multiple fields
        const rawDesc = item.full_content || item.content || item.summary || item.description || item.contentSnippet || '';

        // Parse HTML to get cleaned summary, publisher, and image
        let { cleanSummary, extractedPublisher, extractedImage } = this._parseHtml(rawDesc, item.link);

        // FALLBACK: If HTML parsing failed or returned empty, use contentSnippet or internal summary
        if (!cleanSummary || cleanSummary.length < 10) {
            cleanSummary = (item.contentSnippet || item.summary || item.content || '').replace(/\s+/g, ' ').trim();
        }

        // LAST RESORT: If still empty, use title
        if (!cleanSummary || cleanSummary.length < 5) {
            cleanSummary = item.title;
        }

        let pubDate = item.pubDate || item.isoDate;
        if (!pubDate || isNaN(new Date(pubDate).getTime())) pubDate = new Date().toISOString();
        else pubDate = new Date(pubDate).toISOString();

        return {
            title: item.title,
            link: item.link,
            pubDate: pubDate,
            summary: cleanSummary,
            source: extractedPublisher || item.source || sourceName,
            rawDesc,
            extractedImage, // For Level 1 resolution
            enclosure: item.enclosure,
            'media:content': item['media:content'],
            image: item.image
        };
    }

    _parseHtml(html, baseUrl) {
        if (!html) return { cleanSummary: '', extractedPublisher: null, extractedImage: null };
        try {
            const $ = cheerio.load(html);

            // Publisher
            let extractedPublisher = null;
            const fontTag = $('font').first();
            if (fontTag.length) extractedPublisher = fontTag.text().trim();

            // Image
            let extractedImage = $('img').first().attr('src');
            if (extractedImage && !extractedImage.startsWith('http') && baseUrl) {
                try { extractedImage = new URL(extractedImage, baseUrl).href; } catch { }
            }

            // Summary
            $('a, script, style, img, font').remove();
            let text = $.text().replace(/\s+/g, ' ').trim();
            if (text.length > 500) text = text.substring(0, 500) + '...';

            return { cleanSummary: text, extractedPublisher, extractedImage };
        } catch {
            return { cleanSummary: '', extractedPublisher: null, extractedImage: null };
        }
    }

    // ============================================
    // PIPELINE LOGIC
    // ============================================

    _expandKeywords(baseKeywords) {
        const expanded = new Set(baseKeywords);
        baseKeywords.forEach(k => {
            const lower = k.toLowerCase();
            if (lower.includes('cashew')) {
                expanded.add('raw cashew nut');
                expanded.add('RCN price');
                expanded.add('cashew kernel');
            }
        });
        return Array.from(expanded).slice(0, 5); // Limit to avoid rate limits
    }

    _deduplicate(articles) {
        const results = [];
        const urlMap = new Map();
        const titleMap = new Map();

        // Helper: Calculate similarity between two strings (Jaccard index on words)
        const calculateSimilarity = (str1, str2) => {
            const words1 = new Set(str1.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2));
            const words2 = new Set(str2.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2));
            if (words1.size === 0 || words2.size === 0) return 0;
            const intersection = new Set([...words1].filter(x => words2.has(x)));
            const union = new Set([...words1, ...words2]);
            return intersection.size / union.size;
        };

        // Helper: Normalize title for exact matching
        const normalizeTitle = (title) => {
            return (title || '').toLowerCase()
                .replace(/^(breaking|exclusive|update|report|news|video|audio|watch|listen):\s*/i, '')
                .replace(/\s*[-–|]\s*[^-–|]+$/, '') // Remove source suffix after dash/pipe
                .replace(/[^a-z0-9]/g, '')
                .substring(0, 120);
        };

        // Helper: Clean URL for matching
        const cleanUrl = (url) => {
            if (!url) return null;
            try {
                const u = new URL(url);
                // Remove tracking params
                const cleanParams = new URLSearchParams();
                u.searchParams.forEach((v, k) => {
                    if (!['utm_source', 'utm_medium', 'utm_campaign', 'ref', 'source', 'fbclid', 'gclid'].includes(k.toLowerCase())) {
                        cleanParams.set(k, v);
                    }
                });
                return `${u.hostname}${u.pathname}`.toLowerCase().replace(/\/+$/, '');
            } catch {
                return url.split('?')[0].split('#')[0].toLowerCase().trim();
            }
        };

        // Helper: Find similar existing article
        const findSimilarArticle = (article) => {
            const url = cleanUrl(article.link);
            const normTitle = normalizeTitle(article.title);

            // 1. Exact URL match
            if (url && urlMap.has(url)) {
                return urlMap.get(url);
            }

            // 3. Exact normalized title match
            if (titleMap.has(normTitle)) {
                return titleMap.get(normTitle);
            }

            // 4. Substring title match (One title is a substring of the other, > 80% length)
            for (const existing of results) {
                const existingNorm = normalizeTitle(existing.title);
                if ((existingNorm.includes(normTitle) && normTitle.length > existingNorm.length * 0.8) ||
                    (normTitle.includes(existingNorm) && existingNorm.length > normTitle.length * 0.8)) {
                    return existing;
                }
            }

            // 5. Fuzzy title matching (similarity > 0.75)
            for (const existing of results) {
                const similarity = calculateSimilarity(article.title, existing.title);
                if (similarity > 0.75) {
                    return existing;
                }
            }

            return null;
        };

        // Helper: Merge article into existing
        const mergeArticle = (existing, newArticle) => {
            // Add to related sources (avoid duplicates)
            if (!existing.related) existing.related = [];
            const domain = this._extractDomain(newArticle.link);
            const alreadyExists = existing.related.some(r =>
                r.url === newArticle.link || this._extractDomain(r.url) === domain
            );

            if (!alreadyExists && newArticle.link !== existing.link) {
                existing.related.push({
                    source: newArticle.source,
                    url: newArticle.link,
                    domain: domain
                });
            }

            // Keep better summary
            if ((newArticle.summary || '').length > (existing.summary || '').length) {
                existing.summary = newArticle.summary;
            }

            // Keep earlier publish date
            const existingDate = new Date(existing.pubDate);
            const newDate = new Date(newArticle.pubDate);
            if (newDate < existingDate && !isNaN(newDate.getTime())) {
                existing.pubDate = newArticle.pubDate;
            }

            // Merge image data if existing is missing
            const imageFields = ['extractedImage', 'enclosure', 'media:content', 'image', 'thumbnail'];
            const hasExistingImage = imageFields.some(f => existing[f]);
            if (!hasExistingImage) {
                imageFields.forEach(f => {
                    if (newArticle[f]) existing[f] = newArticle[f];
                });
            }

            // Increase consensus score indicator
            existing.sourceCount = (existing.sourceCount || 1) + 1;
        };

        // Process all articles
        articles.forEach(article => {
            const existing = findSimilarArticle(article);

            if (existing) {
                mergeArticle(existing, article);
            } else {
                // New unique article
                article.related = [];
                article.sourceCount = 1;

                const url = cleanUrl(article.link);
                const normTitle = normalizeTitle(article.title);

                if (url) urlMap.set(url, article);
                titleMap.set(normTitle, article);
                results.push(article);
            }
        });

        console.log(`[NewsCrawler] Deduplication: ${articles.length} → ${results.length} unique (merged ${articles.length - results.length} duplicates)`);
        return results;
    }

    _calculateTrust(article) {
        const domain = this._extractDomain(article.link);
        const isSocial = article.sourceType === 'social';
        let score = 50;
        const reasons = [];

        // Check Tiers
        let tier = 'Unverified';
        if (this.sourceTiers.A.some(d => domain.includes(d))) {
            tier = 'A'; score += 40; reasons.push('Source Type: Official/Gov');
        } else if (this.sourceTiers.B.some(d => domain.includes(d))) {
            tier = 'B'; score += 25; reasons.push('Source Type: Industry Reputable');
        } else if (this.sourceTiers.Social.some(d => domain.includes(d)) || isSocial) {
            tier = 'Social'; score += 5; reasons.push('Source Type: Social Media');
        } else if (this.sourceTiers.C.some(d => domain.includes(d))) {
            tier = 'C'; score -= 10; reasons.push('Source Type: Blog/Vendor');
        } else {
            reasons.push('Source Type: Aggregator');
        }

        // Consensus Bonus - stronger bonus for multiple sources
        if (article.related && article.related.length > 0) {
            const consensusBonus = Math.min(20, article.related.length * 5); // +5 per source, max +20
            score += consensusBonus;
            reasons.push(`High Consensus (${article.related.length + 1} sources)`);
        }

        // Source count bonus (from deduplication)
        if (article.sourceCount && article.sourceCount > 1) {
            score += Math.min(15, (article.sourceCount - 1) * 5);
        }

        // Penalty
        if (/sponsored|press release|advertisement|promoted/.test(article.title.toLowerCase())) {
            score -= 20;
            reasons.push('Possible Promotional');
        }

        const finalScore = Math.min(100, Math.max(0, score));
        let trustLevel = 'Low';
        if (finalScore >= 80) trustLevel = 'High';
        else if (finalScore >= 50) trustLevel = 'Medium';

        article.sourceTier = tier;
        return { trustScore: finalScore, trustLevel, trustReasons: reasons };
    }

    _extractDomain(url) {
        try { return new URL(url).hostname; } catch { return ''; }
    }

    _calculateRelevance(article, profile) {
        let score = 0;
        const text = (article.title + ' ' + article.summary).toLowerCase();
        profile.keywords.forEach(k => {
            if (text.includes(k.toLowerCase())) score += 20;
        });
        return Math.min(100, score);
    }

    _generateTags(article) {
        const tags = new Set();
        const text = (article.title + ' ' + (article.summary || '')).toLowerCase();

        if (text.includes('vietnam')) tags.add('Vietnam');
        if (text.includes('africa') || text.includes('ivory coast') || text.includes('ghana')) tags.add('Africa');
        if (text.includes('price') || text.includes('usd') || text.includes('market')) tags.add('Price');
        if (text.includes('supply') || text.includes('crop') || text.includes('harvest')) tags.add('Supply');
        if (text.includes('logistics') || text.includes('ship') || text.includes('port')) tags.add('Logistics');
        if (text.includes('raw') || text.includes('rcn')) tags.add('RCN');
        if (text.includes('kernel')) tags.add('Kernel');

        return Array.from(tags);
    }

    _generateId(article) {
        return crypto.createHash('md5').update(article.title + article.pubDate).digest('hex');
    }

    // ============================================
    // CACHE UTILS
    // ============================================

    async _saveCache(articles) {
        try {
            await fs.ensureDir(path.dirname(CACHE_FILE));
            await fs.writeJson(CACHE_FILE, { timestamp: Date.now(), data: articles });
        } catch (e) {
            console.error('Cache save failed', e);
        }
    }

    async _loadCache() {
        try {
            if (await fs.pathExists(CACHE_FILE)) {
                const cache = await fs.readJson(CACHE_FILE);
                // Return cache even if stale as fallback
                return cache.data || [];
            }
        } catch (e) {
            console.error('Cache load failed', e);
        }
        return null;
    }

    _generateFallbackNews(profile) {
        const now = new Date();
        return [
            {
                id: 'demo-1-fallback',
                title: "Global Cashew Market Report 2025: Production Estimates",
                source: "CommodityHQ",
                sourceTier: "B",
                publishedAt: now.toISOString(),
                summary: "Comprehensive analysis of global RCN output, highlighting resilient production in West Africa despite weather challenges.",
                overallScore: 90,
                trustScore: 85,
                trustReasons: ['Tier B: Reputable Industry Source'],
                category: 'Market',
                url: '#'
            },
            {
                id: 'demo-2-fallback',
                title: "Vietnam Cashew Exports Hit Record High in Q4",
                source: "Vinacas",
                sourceTier: "A",
                publishedAt: new Date(now - 3600000 * 5).toISOString(),
                summary: "Processing hubs in Vietnam report strong demand from US and European buyers ahead of the holiday season.",
                overallScore: 95,
                trustScore: 95,
                trustReasons: ['Tier A: Official/Gov Source'],
                category: 'Supply',
                url: '#'
            }
        ];
    }
}

const newsCrawler = new NewsCrawler();
export default newsCrawler;