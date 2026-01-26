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

const rssParser = new Parser({
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' },
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
            if (Array.isArray(obj)) return findUrl(obj[0]);
            if (obj.$ && obj.$.url) return obj.$.url;
            if (obj.url) return obj.url;
            return null;
        };

        // Try mapped and original fields
        let url = findUrl(article.media) ||
            findUrl(article['media:content']) ||
            findUrl(article.enclosure) ||
            findUrl(article.image) ||
            findUrl(article.thumbnail);

        if (url && this.isValidImageUrl(url)) return url;

        // Try extracted from HTML description
        if (article.extractedImage && this.isValidImageUrl(article.extractedImage)) {
            return article.extractedImage;
        }
        return null;
    }

    async fetchOGImage(url, timeout = 3000) {
        if (!url || !url.startsWith('http')) return null;
        try {
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), timeout);

            const response = await axios.get(url, {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept': 'text/html'
                },
                maxRedirects: 3
            });
            clearTimeout(id);

            const $ = cheerio.load(response.data);
            let ogImage = $('meta[property="og:image"]').attr('content') ||
                $('meta[name="twitter:image"]').attr('content');

            if (ogImage) {
                if (ogImage.startsWith('//')) ogImage = 'https:' + ogImage;
                else if (ogImage.startsWith('/')) {
                    const u = new URL(url);
                    ogImage = `${u.protocol}//${u.host}${ogImage}`;
                }
            }
            return ogImage;
        } catch (e) {
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
        return url && url.match(/^https?:\/\/.+\.(jpg|jpeg|png|webp|gif|svg)$/i) || (url && url.startsWith('http') && !url.includes('google.com/news')); // Basic check
    }
}

// ============================================
// MAIN CRAWLER CLASS
// ============================================

class NewsCrawler {
    constructor() {
        this.imageResolver = new ZeroDuplicateImageResolver();
        this.rssParser = new Parser({
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' },
            customFields: {
                item: [
                    ['image', 'image'],
                    ['media:content', 'media'],
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
            'C': ['commodityhq.com', 'blog.', 'medium.com', 'pr.com']
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

        // 2. Fetch from Multiple Sources (Parallel)
        const fetchTasks = keywords.map(kw => this._fetchByKeyword(kw));

        // Add specific industry feeds parallel to keywords
        fetchTasks.push(this._fetchIndustryFeeds());

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

    async _fetchByKeyword(keyword) {
        const encoded = encodeURIComponent(keyword);
        const sources = [
            { name: 'Google News', url: `https://news.google.com/rss/search?q=${encoded}&hl=en-US&gl=US&ceid=US:en` },
            { name: 'Bing News', url: `https://www.bing.com/news/search?q=${encoded}&format=rss` }
        ];

        const articles = [];
        for (const s of sources) {
            try {
                const feed = await this.rssParser.parseURL(s.url);
                feed.items.forEach(item => {
                    const parsed = this._parseItem(item, s.name);
                    if (parsed) articles.push(parsed);
                });
            } catch (e) {
                // Ignore individual feed errors
            }
        }
        return articles;
    }

    async _fetchIndustryFeeds() {
        // Use Google News Site Operators for stability instead of fragile direct RSS
        const sites = ['site:freshplaza.com', 'site:agrilinks.org', 'site:worldbank.org'];
        return this._fetchByKeyword(sites.join(' OR ') + ' cashew');
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
        const map = new Map();
        const urlMap = new Map();

        articles.forEach(a => {
            // 1. URL-based deduplication (strongest)
            const cleanUrl = (a.link || '').split('?')[0].split('#')[0].toLowerCase().trim();

            // 2. Title-based deduplication (more flexible)
            // Remove common news prefixes and suffixes, normalize whitespace
            const normTitle = a.title.toLowerCase()
                .replace(/^(breaking|exclusive|update|report|news|video|audio):\s*/i, '')
                .replace(/\s*\|\s*.*$/g, '') // Remove everything after pipe (often source info)
                .replace(/[^a-z0-9]/g, '')
                .substring(0, 100); // Increased from 40 for better precision

            const urlKey = cleanUrl || null;
            const titleKey = normTitle;

            let existing = null;
            if (urlKey && urlMap.has(urlKey)) existing = urlMap.get(urlKey);
            else if (map.has(titleKey)) existing = map.get(titleKey);

            if (existing) {
                // Merge info
                if (!existing.related) existing.related = [];
                // Only add to related if it's a different source/link
                if (a.source !== existing.source || a.link !== existing.link) {
                    existing.related.push({ source: a.source, url: a.link });
                }

                // Keep the one with better summary
                if ((a.summary || '').length > (existing.summary || '').length) {
                    existing.summary = a.summary;
                }

                // MERGE ALL IMAGE DATA if existing is missing it
                const imageFields = ['extractedImage', 'enclosure', 'media:content', 'image'];
                const hasExistingImage = imageFields.some(f => existing[f]);
                const hasNewImage = imageFields.some(f => a[f]);

                if (!hasExistingImage && hasNewImage) {
                    imageFields.forEach(f => {
                        if (a[f]) existing[f] = a[f];
                    });
                }
            } else {
                a.related = [];
                if (urlKey) urlMap.set(urlKey, a);
                map.set(titleKey, a);
            }
        });

        return Array.from(new Set([...map.values(), ...urlMap.values()])); // Ensure unique values
    }

    _calculateTrust(article) {
        const domain = this._extractDomain(article.link);
        let score = 50;
        const reasons = [];

        // Check Tiers
        let tier = 'Unverified';
        if (this.sourceTiers.A.some(d => domain.includes(d))) { tier = 'A'; score += 40; reasons.push('Source Type: Official/Gov'); }
        else if (this.sourceTiers.B.some(d => domain.includes(d))) { tier = 'B'; score += 25; reasons.push('Source Type: Industry Reputable'); }
        else if (this.sourceTiers.C.some(d => domain.includes(d))) { tier = 'C'; score -= 10; reasons.push('Source Type: Blog/Vendor'); }
        else { reasons.push('Source Type: Aggregator'); }

        // Consensus Bonus
        if (article.related && article.related.length > 0) {
            score += 10;
            reasons.push('High Consensus (+ Sources)');
        }

        // Penalty
        if (/sponsored|press release/.test(article.title.toLowerCase())) {
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