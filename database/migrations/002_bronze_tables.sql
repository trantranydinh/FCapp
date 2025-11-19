-- Migration 002: Bronze Layer Tables
-- Raw data storage with TTL (Time To Live)

-- Bronze: Raw Price Data
CREATE TABLE IF NOT EXISTS bronze.raw_price_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL,
    source VARCHAR(100), -- 'vendor_csv', 'api', 'manual'
    raw_data JSONB NOT NULL,
    ingested_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '30 days')
);

CREATE INDEX idx_bronze_price_profile ON bronze.raw_price_data(profile_id);
CREATE INDEX idx_bronze_price_ingested ON bronze.raw_price_data(ingested_at DESC);
CREATE INDEX idx_bronze_price_expires ON bronze.raw_price_data(expires_at);

-- Bronze: Raw Market Scan Data
CREATE TABLE IF NOT EXISTS bronze.raw_market_scan (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL,
    source VARCHAR(100), -- 'perplexity', 'gemini', 'web_crawl'
    url TEXT,
    raw_content TEXT,
    raw_data JSONB,
    scan_timestamp TIMESTAMP NOT NULL,
    ingested_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '7 days')
);

CREATE INDEX idx_bronze_market_profile ON bronze.raw_market_scan(profile_id);
CREATE INDEX idx_bronze_market_timestamp ON bronze.raw_market_scan(scan_timestamp DESC);
CREATE INDEX idx_bronze_market_expires ON bronze.raw_market_scan(expires_at);

-- Bronze: Raw News Data
CREATE TABLE IF NOT EXISTS bronze.raw_news (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL,
    source VARCHAR(100), -- 'rss', 'api', 'webhook'
    title TEXT,
    url TEXT,
    content TEXT,
    published_at TIMESTAMP,
    raw_data JSONB,
    ingested_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '14 days')
);

CREATE INDEX idx_bronze_news_profile ON bronze.raw_news(profile_id);
CREATE INDEX idx_bronze_news_published ON bronze.raw_news(published_at DESC);
CREATE INDEX idx_bronze_news_url ON bronze.raw_news(url);
CREATE INDEX idx_bronze_news_expires ON bronze.raw_news(expires_at);

-- Bronze: Raw LLM Responses
CREATE TABLE IF NOT EXISTS bronze.raw_llm_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL,
    provider VARCHAR(50), -- 'perplexity', 'gemini', 'chatgpt', 'claude'
    model VARCHAR(100),
    prompt TEXT,
    response TEXT,
    tokens_used INTEGER,
    cost DECIMAL(10, 6),
    latency_ms INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '7 days')
);

CREATE INDEX idx_bronze_llm_job ON bronze.raw_llm_responses(job_id);
CREATE INDEX idx_bronze_llm_provider ON bronze.raw_llm_responses(provider);
CREATE INDEX idx_bronze_llm_created ON bronze.raw_llm_responses(created_at DESC);
CREATE INDEX idx_bronze_llm_expires ON bronze.raw_llm_responses(expires_at);

-- Create cleanup function for expired Bronze data
CREATE OR REPLACE FUNCTION bronze.cleanup_expired_data()
RETURNS void AS $$
BEGIN
    DELETE FROM bronze.raw_price_data WHERE expires_at < NOW();
    DELETE FROM bronze.raw_market_scan WHERE expires_at < NOW();
    DELETE FROM bronze.raw_news WHERE expires_at < NOW();
    DELETE FROM bronze.raw_llm_responses WHERE expires_at < NOW();

    RAISE NOTICE 'Bronze layer cleanup completed at %', NOW();
END;
$$ LANGUAGE plpgsql;

-- Optional: Create scheduled job to run cleanup daily
-- This requires pg_cron extension
-- SELECT cron.schedule('cleanup-bronze', '0 2 * * *', 'SELECT bronze.cleanup_expired_data()');

COMMENT ON TABLE bronze.raw_price_data IS 'Raw price data from vendors/APIs - TTL 30 days';
COMMENT ON TABLE bronze.raw_market_scan IS 'Raw market scanning results - TTL 7 days';
COMMENT ON TABLE bronze.raw_news IS 'Raw news articles from RSS/webhooks - TTL 14 days';
COMMENT ON TABLE bronze.raw_llm_responses IS 'Raw LLM API responses for audit - TTL 7 days';
