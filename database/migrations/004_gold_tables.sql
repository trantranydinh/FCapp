-- Migration 004: Gold Layer Tables
-- Business-ready data for dashboards

-- Gold: RCN Price Forecast
CREATE TABLE IF NOT EXISTS gold.rcn_forecast (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES public.jobs(id),
    forecast_date DATE NOT NULL,
    forecast_value DECIMAL(10, 2) NOT NULL,
    confidence_lower DECIMAL(10, 2) NOT NULL,
    confidence_upper DECIMAL(10, 2) NOT NULL,
    model_name VARCHAR(50) NOT NULL,
    accuracy_mape DECIMAL(5, 2), -- Mean Absolute Percentage Error
    accuracy_rmse DECIMAL(10, 2), -- Root Mean Square Error
    features_used TEXT[],
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(profile_id, forecast_date, model_name)
);

CREATE INDEX idx_gold_forecast_profile ON gold.rcn_forecast(profile_id);
CREATE INDEX idx_gold_forecast_date ON gold.rcn_forecast(forecast_date DESC);
CREATE INDEX idx_gold_forecast_profile_date ON gold.rcn_forecast(profile_id, forecast_date DESC);
CREATE INDEX idx_gold_forecast_model ON gold.rcn_forecast(model_name);

-- Gold: Market Summary
CREATE TABLE IF NOT EXISTS gold.market_summary (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES public.jobs(id),
    scan_date TIMESTAMP NOT NULL,
    sentiment market_sentiment NOT NULL,
    sentiment_score DECIMAL(3, 2) NOT NULL, -- -1 to 1
    signal_count INTEGER NOT NULL,
    volume_indicator DECIMAL(5, 2),
    summary_text TEXT,
    top_drivers JSONB, -- [{factor, impact, sentiment}]
    provider VARCHAR(50), -- 'perplexity', 'gemini', 'chatgpt'
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(profile_id, scan_date, provider)
);

CREATE INDEX idx_gold_market_profile ON gold.market_summary(profile_id);
CREATE INDEX idx_gold_market_scan ON gold.market_summary(scan_date DESC);
CREATE INDEX idx_gold_market_profile_scan ON gold.market_summary(profile_id, scan_date DESC);
CREATE INDEX idx_gold_market_sentiment ON gold.market_summary(sentiment);

-- Gold: News Ranked
CREATE TABLE IF NOT EXISTS gold.news_ranked (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES public.jobs(id),
    news_id UUID NOT NULL REFERENCES silver.news_clean(id),
    news_title TEXT NOT NULL,
    news_url TEXT NOT NULL,
    published_at TIMESTAMP NOT NULL,
    accuracy_score DECIMAL(3, 2) NOT NULL, -- 0-1
    reliability_score DECIMAL(3, 2) NOT NULL, -- 0-1
    recency_score DECIMAL(3, 2) NOT NULL, -- 0-1
    impact_score DECIMAL(3, 2) NOT NULL, -- 0-1
    final_score DECIMAL(3, 2) NOT NULL, -- Weighted average
    final_rank INTEGER NOT NULL,
    ranked_by VARCHAR(50), -- 'claude-3.5-sonnet'
    reasoning TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(profile_id, news_id, ranked_by)
);

CREATE INDEX idx_gold_news_profile ON gold.news_ranked(profile_id);
CREATE INDEX idx_gold_news_rank ON gold.news_ranked(final_rank);
CREATE INDEX idx_gold_news_profile_rank ON gold.news_ranked(profile_id, final_rank);
CREATE INDEX idx_gold_news_published ON gold.news_ranked(published_at DESC);

-- Gold: Ensemble Aggregate (Combined Output)
CREATE TABLE IF NOT EXISTS gold.fc_aggregate (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    bundle_id UUID NOT NULL REFERENCES public.job_bundles(id),
    report_date DATE NOT NULL,
    forecast_value DECIMAL(10, 2) NOT NULL,
    trend trend_direction NOT NULL,
    confidence_score DECIMAL(3, 2) NOT NULL,
    model_agreement_pct DECIMAL(5, 2) NOT NULL,
    market_sentiment market_sentiment NOT NULL,
    key_drivers JSONB NOT NULL, -- [{driver, contribution, source}]
    deviation_alert BOOLEAN DEFAULT FALSE,
    deviation_type deviation_type,
    summary_text TEXT NOT NULL,
    weights JSONB NOT NULL, -- {price: 0.4, market: 0.4, news: 0.2}
    metadata JSONB, -- Additional context
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(profile_id, report_date)
);

CREATE INDEX idx_gold_aggregate_profile ON gold.fc_aggregate(profile_id);
CREATE INDEX idx_gold_aggregate_date ON gold.fc_aggregate(report_date DESC);
CREATE INDEX idx_gold_aggregate_profile_date ON gold.fc_aggregate(profile_id, report_date DESC);
CREATE INDEX idx_gold_aggregate_trend ON gold.fc_aggregate(trend);
CREATE INDEX idx_gold_aggregate_alert ON gold.fc_aggregate(deviation_alert) WHERE deviation_alert = TRUE;

-- Gold: Freshness Tracking
CREATE TABLE IF NOT EXISTS gold.data_freshness (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    data_type VARCHAR(50) NOT NULL, -- 'price_forecast', 'market_scan', 'news_ranking', 'ensemble'
    last_updated TIMESTAMP NOT NULL,
    sla_threshold_hours INTEGER NOT NULL,
    is_fresh BOOLEAN NOT NULL,
    next_refresh_due TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(profile_id, data_type)
);

CREATE INDEX idx_gold_freshness_profile ON gold.data_freshness(profile_id);
CREATE INDEX idx_gold_freshness_type ON gold.data_freshness(data_type);
CREATE INDEX idx_gold_freshness_fresh ON gold.data_freshness(is_fresh);
CREATE INDEX idx_gold_freshness_due ON gold.data_freshness(next_refresh_due);

-- Create materialized view for dashboard overview
CREATE MATERIALIZED VIEW gold.dashboard_overview AS
SELECT
    p.id as profile_id,
    p.name as profile_name,
    p.user_id,
    f.forecast_value as latest_forecast,
    f.forecast_date,
    m.sentiment as market_sentiment,
    m.scan_date as market_scan_date,
    a.trend,
    a.confidence_score,
    a.deviation_alert,
    a.report_date as latest_report_date
FROM public.profiles p
LEFT JOIN LATERAL (
    SELECT * FROM gold.rcn_forecast
    WHERE profile_id = p.id
    ORDER BY forecast_date DESC
    LIMIT 1
) f ON true
LEFT JOIN LATERAL (
    SELECT * FROM gold.market_summary
    WHERE profile_id = p.id
    ORDER BY scan_date DESC
    LIMIT 1
) m ON true
LEFT JOIN LATERAL (
    SELECT * FROM gold.fc_aggregate
    WHERE profile_id = p.id
    ORDER BY report_date DESC
    LIMIT 1
) a ON true
WHERE p.active = TRUE;

CREATE UNIQUE INDEX idx_dashboard_overview_profile ON gold.dashboard_overview(profile_id);

COMMENT ON TABLE gold.rcn_forecast IS 'Price forecasting results - permanent storage';
COMMENT ON TABLE gold.market_summary IS 'Market movement summaries - permanent storage';
COMMENT ON TABLE gold.news_ranked IS 'Ranked news articles - permanent storage';
COMMENT ON TABLE gold.fc_aggregate IS 'Combined ensemble output - permanent storage';
COMMENT ON TABLE gold.data_freshness IS 'Tracks data freshness for SLA compliance';
COMMENT ON MATERIALIZED VIEW gold.dashboard_overview IS 'Quick dashboard overview - refresh after ensemble runs';
