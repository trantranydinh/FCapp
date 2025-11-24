/**
 * INFRASTRUCTURE LAYER: News Crawler with Keyword Support
 *
 * Responsibility: Fetch news from external sources with keyword filtering
 */
 
class NewsCrawler {
    constructor() {
        // Mock sources with reliability scores
        this.sources = [
            { name: 'Cashew Market Watch', reliability: 0.8, category: 'market' },
            { name: 'AgriNews Global', reliability: 0.7, category: 'agriculture' },
            { name: 'Vietnam Trade Portal', reliability: 0.9, category: 'trade' },
            { name: 'African Cashew Alliance', reliability: 0.85, category: 'supply' },
            { name: 'Logistics Daily', reliability: 0.75, category: 'logistics' }
        ];
 
        // Keyword-based news templates
        this.newsTemplates = {
            price: [
                { title: "Raw Cashew Nut Prices {action} in {region}", impact: "HIGH", tags: ["Price", "Supply"] },
                { title: "{region} Cashew Market Sees {trend} Price Movement", impact: "MEDIUM", tags: ["Price", "Market"] }
            ],
            supply: [
                { title: "{region}'s Cashew Harvest {status} Due to Weather", impact: "HIGH", tags: ["Supply", "Weather"] },
                { title: "New Processing Facilities in {region} Boost Capacity", impact: "POSITIVE", tags: ["Supply", "Processing"] }
            ],
            demand: [
                { title: "{region} Demand for Cashew Kernels {trend}", impact: "MEDIUM", tags: ["Demand", "Export"] },
                { title: "Consumer Trends Drive {trend} in {region} Markets", impact: "POSITIVE", tags: ["Demand", "Market"] }
            ],
            logistics: [
                { title: "Shipping Costs {action} on {route} Route", impact: "NEGATIVE", tags: ["Logistics", "Shipping"] },
                { title: "Container Availability {status} for Cashew Exports", impact: "MEDIUM", tags: ["Logistics"] }
            ],
            regulation: [
                { title: "{region} Introduces New Quality Standards", impact: "NEUTRAL", tags: ["Regulation", "Quality"] },
                { title: "Trade Policy Changes Affect {region} Exports", impact: "MEDIUM", tags: ["Regulation", "Trade"] }
            ]
        };
 
        // Dynamic data for templates
        this.regions = ["Vietnam", "India", "Ivory Coast", "Nigeria", "Brazil", "EU", "USA", "China"];
        this.actions = ["Surge", "Drop", "Stabilize", "Fluctuate"];
        this.trends = ["Upward", "Downward", "Stable", "Volatile"];
        this.statuses = ["Delayed", "Accelerated", "Improved", "Challenged"];
    }
 
    /**
     * Crawl news with optional keyword filtering
     * @param {Object} options - Crawl options
     * @param {Array<string>} options.keywords - Keywords to filter (e.g., ['price', 'supply'])
     * @param {number} options.limit - Maximum number of items
     * @returns {Promise<Array>} List of news items
     */
    async crawl(options = {}) {
        const { keywords = [], limit = 10 } = options;
 
        console.log(`[NewsCrawler] Starting crawl... Keywords: ${keywords.length > 0 ? keywords.join(', ') : 'all'}`);
 
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
 
        let newsItems = [];
 
        // If keywords specified, generate targeted news
        if (keywords.length > 0) {
            keywords.forEach(keyword => {
                const templates = this.newsTemplates[keyword.toLowerCase()] || [];
                templates.forEach(template => {
                    newsItems.push(this._generateNewsFromTemplate(template, keyword));
                });
            });
        } else {
            // Generate general news from all categories
            Object.keys(this.newsTemplates).forEach(category => {
                const templates = this.newsTemplates[category];
                const template = templates[Math.floor(Math.random() * templates.length)];
                newsItems.push(this._generateNewsFromTemplate(template, category));
            });
        }
 
        // Add some general market news
        newsItems.push(...this._getGeneralNews());
 
        // Shuffle and limit
        newsItems = this._shuffleArray(newsItems).slice(0, limit);
 
        // Add timestamps
        newsItems = newsItems.map((item, index) => ({
            ...item,
            published_at: new Date(Date.now() - (index * 3600000)).toISOString() // Stagger by hours
        }));
 
        console.log(`[NewsCrawler] Crawled ${newsItems.length} items`);
        return newsItems;
    }
 
    /**
     * Generate news from template
     * @private
     */
    _generateNewsFromTemplate(template, category) {
        let title = template.title;
 
        // Replace placeholders
        title = title.replace('{region}', this._randomItem(this.regions));
        title = title.replace('{action}', this._randomItem(this.actions));
        title = title.replace('{trend}', this._randomItem(this.trends));
        title = title.replace('{status}', this._randomItem(this.statuses));
        title = title.replace('{route}', `${this._randomItem(this.regions)}-${this._randomItem(this.regions)}`);
 
        const source = this._randomItem(this.sources);
 
        return {
            title,
            source: source.name,
            summary: this._generateSummary(title, category),
            impact: template.impact,
            reliability: source.reliability,
            tags: template.tags,
            category,
            url: 'https://www.google.com/search?q=' + encodeURIComponent(title)
        };
    }
 
    /**
     * Generate summary based on title
     * @private
     */
    _generateSummary(title, category) {
        const summaries = {
            price: "Market analysts report significant price movements driven by supply-demand dynamics.",
            supply: "Production levels are being affected by various regional factors including weather and infrastructure.",
            demand: "Consumer preferences and economic conditions are shaping market demand patterns.",
            logistics: "Transportation and shipping challenges continue to impact global trade flows.",
            regulation: "New policy frameworks are being implemented to ensure quality and fair trade practices."
        };
 
        return summaries[category] || "Industry experts are monitoring developments closely.";
    }
 
    /**
     * Get general market news
     * @private
     */
    _getGeneralNews() {
        return [
            {
                title: "Global Cashew Market Outlook Remains Positive",
                source: "Cashew Market Watch",
                summary: "Industry forecasts indicate steady growth in global cashew consumption over the next quarter.",
                impact: "POSITIVE",
                reliability: 0.8,
                tags: ["Market", "Forecast"],
                category: "general",
                url: "https://www.google.com/search?q=Global+Cashew+Market+Outlook"
            },
            {
                title: "Sustainability Initiatives Gain Traction in Cashew Industry",
                source: "AgriNews Global",
                summary: "Major processors commit to sustainable sourcing and fair labor practices.",
                impact: "POSITIVE",
                reliability: 0.75,
                tags: ["Sustainability", "Industry"],
                category: "general",
                url: "https://www.google.com/search?q=Cashew+Industry+Sustainability"
            }
        ];
    }
 
    /**
     * Utility: Get random item from array
     * @private
     */
    _randomItem(array) {
        return array[Math.floor(Math.random() * array.length)];
    }
 
    /**
     * Utility: Shuffle array
     * @private
     */
    _shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
}
 
const newsCrawler = new NewsCrawler();
export default newsCrawler;
 