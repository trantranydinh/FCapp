# API and News Configuration Guide

## Current Status: APIs NOT In Use ❌

### What's Configured

The system has **AI API integration ready** but **currently disabled**. Here's what exists:

## 1. AI API Configuration

### Location
- **Service**: `backend/src/services/llmService.js`
- **Settings**: `.env` file (root directory)
- **Configuration**: `backend/src/settings.js`

### Supported API Providers

#### OpenAI (GPT-4o-mini)
- **Model**: `gpt-4o-mini` (cost-effective)
- **Use Cases**:
  - Generate forecast explanations
  - Market sentiment analysis
  - News headline analysis
- **Cost**: ~$0.15 per 1,000 tokens
- **Status**: ❌ **NOT CONFIGURED** (API key empty)

#### Anthropic (Claude 3.5 Haiku)
- **Model**: `claude-3-5-haiku-20241022`
- **Use Cases**:
  - Same as OpenAI (alternative provider)
  - Fast and cost-effective
- **Cost**:
  - Input: $0.25 per 1M tokens
  - Output: $1.25 per 1M tokens
- **Status**: ❌ **NOT CONFIGURED** (API key empty)

### Current Configuration (`.env`)

```env
# LLM provider: openai|anthropic|none
LLM_PROVIDER=none                    ← DISABLED

# API keys (leave blank if not testing)
OPENAI_API_KEY=                      ← EMPTY (not in use)
ANTHROPIC_API_KEY=                   ← EMPTY (not in use)

# Rate limits
LLM_MAX_CALLS_PER_MIN=5              ← Safety limit
LLM_MAX_CALLS_PER_DAY=50             ← Cost control
```

## 2. How APIs Would Be Used (If Enabled)

### Forecast Explanation
**File**: `priceService.js:98-113`

When enabled, AI generates explanations like:
```
"The LSTM ensemble predicts a modest 3.5% upward trend over 60 days.
Recent price stability (1.7% volatility) supports this forecast, though
seasonal factors may introduce short-term fluctuations."
```

**Current Behavior**: Falls back to simple template:
```
"The forecast predicts an up trend over the next 60 days with 85% confidence."
```

### Market Insights
**File**: `llmService.js:110-123`

Would analyze:
- Current price trends
- 7-day and 30-day changes
- Overall sentiment
- Actionable insights for traders

**Current Behavior**: Returns generic fallback message

### News Analysis
**File**: `llmService.js:151-174`

Would enhance news items with:
- Market implications
- Risk assessment
- Business impact

**Current Behavior**: Returns news without AI analysis

## 3. API Usage Tracking

### Tracking System (Ready but Unused)
**File**: `backend/src/services/demoCache.js`

Logs every API call to: `outputs/cache/api_calls.json`

**Tracked Metrics**:
```json
{
  "provider": "openai",
  "model": "gpt-4o-mini",
  "tokens_used": 247,
  "cost_estimate": 0.037,
  "timestamp": "2025-10-29T12:00:00.000Z"
}
```

### View API Usage
```bash
# Check API usage log (when enabled)
cat backend/outputs/cache/api_calls.json

# API endpoint to check usage
curl http://localhost:8000/api/v1/admin/api-usage
```

## 4. Rate Limits and Cost Control

### Built-in Safeguards
```env
LLM_MAX_CALLS_PER_MIN=5    # Max 5 API calls per minute
LLM_MAX_CALLS_PER_DAY=50   # Max 50 API calls per day
```

### Estimated Monthly Costs (If Enabled)

**Scenario: Moderate Usage**
- 10 forecasts per day
- 3 news analyses per day
- 5 market insights per day

**OpenAI (GPT-4o-mini)**:
- ~18 API calls/day
- ~5,400 API calls/month
- Average 200 tokens per call
- **Monthly Cost**: ~$16-20

**Anthropic (Claude Haiku)**:
- Same usage pattern
- **Monthly Cost**: ~$10-15 (slightly cheaper)

### Cost Breakdown by Feature

| Feature | Calls/Day | Tokens/Call | Monthly Cost (OpenAI) |
|---------|-----------|-------------|----------------------|
| Forecast Explanation | 10 | 200 | $9 |
| Market Insights | 5 | 150 | $4 |
| News Analysis | 3 | 300 | $4 |
| **TOTAL** | 18 | - | **~$17/month** |

## 5. News System

### Current Implementation
**File**: `backend/src/services/newsService.js`

### Status: NO Real News Scraping ❌

**What Exists**:
- Fallback demo news (hardcoded)
- 2 static news items
- Located at: `data/demo_news.json` (if exists)

**What's Missing**:
- No web scraping library (axios, cheerio, puppeteer)
- No RSS feed parser
- No news API integration (NewsAPI, Google News, etc.)
- No real-time data

### Current News Data (Hardcoded)

```javascript
// From newsService.js:8-32
const fallbackNews = () => {
  return [
    {
      title: "Export demand for cashew remains steady in Q1",
      source: "Cashew Market Watch",
      summary: "Key buyers in Europe maintain forward contracts...",
      impact: "MEDIUM",
      reliability: 0.7
    },
    {
      title: "Logistics costs tick higher amid shipping constraints",
      source: "Logistics Daily",
      summary: "Freight rates rise 4-6% on select routes...",
      impact: "HIGH",
      reliability: 0.6
    }
  ];
};
```

## 6. How to Enable APIs

### Option 1: Enable OpenAI

**Step 1**: Get API key from https://platform.openai.com/api-keys

**Step 2**: Edit `.env` file:
```env
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxx
```

**Step 3**: Restart backend:
```bash
cd backend
npm run dev
```

**Step 4**: Verify in logs:
```
LLM enabled: openai (gpt-4o-mini)
```

### Option 2: Enable Anthropic

**Step 1**: Get API key from https://console.anthropic.com/

**Step 2**: Edit `.env` file:
```env
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxx
```

**Step 3**: Restart backend

### Option 3: Keep Disabled (Current)
```env
LLM_PROVIDER=none
```
System continues to work with fallback messages.

## 7. Add Real News Scraping

### Option A: Use News API Service

**1. Install axios:**
```bash
cd backend
npm install axios
```

**2. Get API key from NewsAPI.org** (free tier: 100 requests/day)

**3. Update newsService.js:**
```javascript
import axios from "axios";

const fetchRealNews = async () => {
  const apiKey = process.env.NEWS_API_KEY;
  const response = await axios.get(
    `https://newsapi.org/v2/everything?q=cashew+market&apiKey=${apiKey}`
  );
  return response.data.articles.map(article => ({
    title: article.title,
    source: article.source.name,
    summary: article.description,
    url: article.url,
    published_at: article.publishedAt
  }));
};
```

**4. Add to .env:**
```env
NEWS_API_KEY=your_newsapi_key_here
```

### Option B: Web Scraping (Advanced)

**1. Install scraping tools:**
```bash
cd backend
npm install axios cheerio
```

**2. Example scraper:**
```javascript
import axios from "axios";
import * as cheerio from "cheerio";

const scrapeNews = async () => {
  const response = await axios.get("https://cashew-market-site.com/news");
  const $ = cheerio.load(response.data);

  const news = [];
  $(".news-item").each((i, elem) => {
    news.push({
      title: $(elem).find(".title").text(),
      summary: $(elem).find(".summary").text(),
      url: $(elem).find("a").attr("href")
    });
  });
  return news;
};
```

### Option C: RSS Feed (Simplest)

**1. Install RSS parser:**
```bash
cd backend
npm install rss-parser
```

**2. Parse RSS feeds:**
```javascript
import Parser from "rss-parser";

const parser = new Parser();
const feed = await parser.parseURL("https://cashew-market.com/rss");

const news = feed.items.map(item => ({
  title: item.title,
  summary: item.contentSnippet,
  url: item.link,
  published_at: item.pubDate
}));
```

## 8. Testing API Integration

### Test OpenAI API
```bash
# Set API key in .env first
curl -X POST http://localhost:8000/api/v1/price/run-forecast \
  -H "Content-Type: application/json" \
  -d '{"forecast_days": 30}'

# Check response for "ai_explanation" field
# Check logs for: "LLM enabled: openai"
```

### Test API Usage Tracking
```bash
# Check logged API calls
cat backend/outputs/cache/api_calls.json | python -m json.tool
```

### Expected Output (With API Enabled):
```json
{
  "forecastId": "lstm-20251029-120000",
  "trendLabel": "UP",
  "confidenceScore": 0.85,
  "ai_explanation": "The LSTM ensemble forecasts a moderate 3.5% increase over 60 days. Historical volatility of 1.7% suggests stable market conditions, though seasonal factors in October-November typically introduce price fluctuations. The 85% confidence reflects strong model convergence across the ensemble."
}
```

## 9. Monitoring and Debugging

### Check if APIs are Working

**Backend Logs** (look for):
```
✓ LLM enabled: openai (gpt-4o-mini)
LLM call: generating forecast explanation (247 tokens)
```

**Or:**
```
LLM disabled, using fallback
```

### Debug Mode
```bash
# Enable verbose logging
DEBUG=llm:* npm run dev
```

### View API Costs
```bash
# Check cost log
cat backend/outputs/cache/api_calls.json | \
  python -c "import sys,json; data=json.load(sys.stdin); print(f'Total cost: \${sum(x[\"cost_estimate\"] for x in data):.2f}')"
```

## 10. Recommended Setup for Production

### Phase 1: Start Without APIs (Current)
- ✅ LSTM forecasting works perfectly
- ✅ No API costs
- ✅ Fast responses
- ✅ No rate limits

### Phase 2: Add AI Explanations (Optional)
- Enable OpenAI or Anthropic
- Start with low daily limits (50 calls/day)
- Monitor costs for 1 week
- Expected: $10-20/month

### Phase 3: Add Real News (Optional)
- Use NewsAPI free tier (100 requests/day)
- Or scrape specific cashew market sites
- Or integrate RSS feeds
- Cache news for 6-24 hours to reduce API calls

## Summary

| Component | Status | Cost | Setup Required |
|-----------|--------|------|----------------|
| **LSTM Forecasting** | ✅ **Working** | $0 | ✅ Complete |
| **AI Explanations** | ❌ Disabled | $0 ($15-20/mo if enabled) | API key needed |
| **News Scraping** | ❌ Demo data only | $0 | Scraper needed |
| **API Tracking** | ✅ Ready | $0 | None |
| **Rate Limits** | ✅ Configured | $0 | None |

## Questions?

1. **Do I need APIs?** No, the LSTM model works perfectly without them.
2. **What do APIs add?** Better explanations and market insights (nice-to-have).
3. **Which API provider?** OpenAI (GPT-4o-mini) is easiest and well-documented.
4. **Monthly cost?** ~$15-20 for moderate usage.
5. **Free tier?** Anthropic has $5 free credit for new accounts.

---

**Current Setup**: Fully functional LSTM forecasting with 85% confidence, no API costs.
**Optional Upgrade**: Add AI explanations for $15-20/month + better news data.
