# Database Setup

## Overview

This folder contains database migrations and seed data for the FCApp forecasting system.

## Architecture

The database follows a **Medallion Architecture**:

- **Bronze**: Raw data (7-30 day TTL)
- **Silver**: Cleaned & normalized data
- **Gold**: Business-ready data for dashboards
- **Audit**: Immutable logs and tracking

## Migrations

Run migrations in order:

```bash
# 1. Initialize schema and core tables
psql -d fcapp -f migrations/001_init_schema.sql

# 2. Create Bronze layer tables (raw data)
psql -d fcapp -f migrations/002_bronze_tables.sql

# 3. Create Silver layer tables (cleaned data)
psql -d fcapp -f migrations/003_silver_tables.sql

# 4. Create Gold layer tables (business data)
psql -d fcapp -f migrations/004_gold_tables.sql

# 5. Create Audit layer tables (logs)
psql -d fcapp -f migrations/005_audit_tables.sql

# 6. Load seed data
psql -d fcapp -f seeds/default-profiles.sql
```

Or run all at once:

```bash
cat migrations/*.sql seeds/*.sql | psql -d fcapp
```

## Seed Data

Default users:
- **admin@fcapp.com** (role: admin)
- **demo@fcapp.com** (role: user)

Default profiles:
- RCN WW320 Global Forecast
- RCN Vietnam Focus
- Demo Profile

## Key Tables

### Public Schema
- `users` - User accounts and roles
- `profiles` - Forecasting profiles
- `job_bundles` - Job execution groups
- `jobs` - Individual worker jobs

### Bronze Schema
- `raw_price_data` - Raw price data (TTL: 30 days)
- `raw_market_scan` - Raw market scans (TTL: 7 days)
- `raw_news` - Raw news articles (TTL: 14 days)
- `raw_llm_responses` - LLM API responses (TTL: 7 days)

### Silver Schema
- `price_data` - Cleaned price data
- `market_signals` - Parsed market signals
- `news_clean` - Deduplicated news
- `quality_checks` - Data quality validation

### Gold Schema
- `rcn_forecast` - Price forecasts
- `market_summary` - Market movement summaries
- `news_ranked` - Ranked news articles
- `fc_aggregate` - Combined ensemble output
- `data_freshness` - SLA tracking

### Audit Schema
- `model_runs` - Model execution logs
- `backtests` - Backtest results
- `api_calls` - API audit trail
- `data_lineage` - Data transformation tracking
- `alerts` - Alert history
- `llm_costs` - LLM usage and costs

## Maintenance

### Cleanup expired Bronze data

```sql
SELECT bronze.cleanup_expired_data();
```

### Refresh dashboard overview

```sql
REFRESH MATERIALIZED VIEW CONCURRENTLY gold.dashboard_overview;
```

### Check data freshness

```sql
SELECT * FROM gold.data_freshness WHERE is_fresh = FALSE;
```

### View LLM costs

```sql
SELECT * FROM audit.llm_cost_summary
WHERE date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY date DESC, total_cost_usd DESC;
```

### View model performance

```sql
SELECT * FROM audit.model_performance
ORDER BY avg_accuracy DESC;
```

## Connection String

```
postgresql://user:password@localhost:5432/fcapp
```

## Environment Variables

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/fcapp
DATABASE_POOL_SIZE=20
DATABASE_MAX_IDLE=10
```
