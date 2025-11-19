-- Migration 003: Silver Layer Tables
-- Cleaned and normalized data

-- Silver: Clean Price Data
CREATE TABLE IF NOT EXISTS silver.price_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    volume DECIMAL(15, 2),
    currency VARCHAR(3) DEFAULT 'USD',
    source VARCHAR(100),
    quality_score DECIMAL(3, 2), -- 0-1, data quality indicator
    bronze_id UUID, -- Reference to bronze.raw_price_data
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(profile_id, date, source)
);

CREATE INDEX idx_silver_price_profile ON silver.price_data(profile_id);
CREATE INDEX idx_silver_price_date ON silver.price_data(date DESC);
CREATE INDEX idx_silver_price_profile_date ON silver.price_data(profile_id, date DESC);

-- Silver: Market Signals (Cleaned)
CREATE TABLE IF NOT EXISTS silver.market_signals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    source VARCHAR(100),
    url TEXT,
    sentiment market_sentiment NOT NULL,
    strength signal_strength NOT NULL,
    confidence DECIMAL(3, 2) NOT NULL, -- 0-1
    description TEXT,
    extracted_entities JSONB, -- Extracted keywords, companies, etc.
    extracted_at TIMESTAMP NOT NULL,
    bronze_id UUID, -- Reference to bronze.raw_market_scan
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_silver_signals_profile ON silver.market_signals(profile_id);
CREATE INDEX idx_silver_signals_extracted ON silver.market_signals(extracted_at DESC);
CREATE INDEX idx_silver_signals_sentiment ON silver.market_signals(sentiment);
CREATE INDEX idx_silver_signals_profile_extracted ON silver.market_signals(profile_id, extracted_at DESC);

-- Silver: Clean News (Deduplicated & Parsed)
CREATE TABLE IF NOT EXISTS silver.news_clean (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    source VARCHAR(100),
    summary TEXT,
    content_hash VARCHAR(64) UNIQUE, -- For deduplication
    published_at TIMESTAMP NOT NULL,
    keywords TEXT[],
    entities JSONB, -- Extracted entities
    bronze_id UUID, -- Reference to bronze.raw_news
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_silver_news_profile ON silver.news_clean(profile_id);
CREATE INDEX idx_silver_news_published ON silver.news_clean(published_at DESC);
CREATE INDEX idx_silver_news_url ON silver.news_clean(url);
CREATE INDEX idx_silver_news_hash ON silver.news_clean(content_hash);
CREATE INDEX idx_silver_news_profile_published ON silver.news_clean(profile_id, published_at DESC);

-- Silver: Data Quality Checks
CREATE TABLE IF NOT EXISTS silver.quality_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(100) NOT NULL,
    check_type VARCHAR(50), -- 'schema', 'completeness', 'uniqueness', 'validity'
    check_name VARCHAR(100),
    passed BOOLEAN NOT NULL,
    row_count INTEGER,
    failed_count INTEGER,
    details JSONB,
    checked_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_silver_quality_table ON silver.quality_checks(table_name);
CREATE INDEX idx_silver_quality_checked ON silver.quality_checks(checked_at DESC);
CREATE INDEX idx_silver_quality_passed ON silver.quality_checks(passed);

-- Create function to generate content hash for deduplication
CREATE OR REPLACE FUNCTION silver.generate_content_hash(content TEXT)
RETURNS VARCHAR(64) AS $$
BEGIN
    RETURN ENCODE(SHA256(content::bytea), 'hex');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON TABLE silver.price_data IS 'Cleaned price data with quality indicators';
COMMENT ON TABLE silver.market_signals IS 'Parsed market signals with sentiment analysis';
COMMENT ON TABLE silver.news_clean IS 'Deduplicated and cleaned news articles';
COMMENT ON TABLE silver.quality_checks IS 'Data quality validation results';
