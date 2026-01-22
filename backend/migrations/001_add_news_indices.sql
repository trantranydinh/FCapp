-- Migration: Add indices for news crawler performance optimization
-- Date: 2026-01-22
-- Priority: P3
-- Expected Impact: 10-100× faster queries as data grows

-- Silver layer indices
CREATE INDEX IF NOT EXISTS idx_news_clean_content_hash
    ON silver.news_clean(content_hash);

CREATE INDEX IF NOT EXISTS idx_news_clean_profile_id
    ON silver.news_clean(profile_id);

CREATE INDEX IF NOT EXISTS idx_news_clean_published_at
    ON silver.news_clean(published_at);

-- Gold layer indices
CREATE INDEX IF NOT EXISTS idx_news_ranked_job_id
    ON gold.news_ranked(job_id);

CREATE INDEX IF NOT EXISTS idx_news_ranked_profile_final
    ON gold.news_ranked(profile_id, final_rank);

-- Composite index for common query pattern
CREATE INDEX IF NOT EXISTS idx_news_ranked_profile_job
    ON gold.news_ranked(profile_id, job_id, final_rank);

-- Bronze layer indices (optional - for debugging/analytics)
CREATE INDEX IF NOT EXISTS idx_raw_news_profile_id
    ON bronze.raw_news(profile_id);

CREATE INDEX IF NOT EXISTS idx_raw_news_published_at
    ON bronze.raw_news(published_at);
