-- Migration 001: Initialize Database Schema
-- Creates core schemas and extensions

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable TimescaleDB extension (optional, for time-series optimization)
-- CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Create schemas
CREATE SCHEMA IF NOT EXISTS bronze;
CREATE SCHEMA IF NOT EXISTS silver;
CREATE SCHEMA IF NOT EXISTS gold;
CREATE SCHEMA IF NOT EXISTS audit;

-- Create ENUM types
CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE job_status AS ENUM ('pending', 'running', 'completed', 'failed', 'cancelled');
CREATE TYPE job_type AS ENUM ('price', 'market', 'news', 'ensemble');
CREATE TYPE market_sentiment AS ENUM ('bullish', 'bearish', 'neutral');
CREATE TYPE signal_strength AS ENUM ('strong', 'moderate', 'weak');
CREATE TYPE trend_direction AS ENUM ('up', 'down', 'stable');
CREATE TYPE deviation_type AS ENUM ('normal', 'anomaly', 'breaking_event', 'model_disagreement');

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'user',
    azure_ad_id VARCHAR(255) UNIQUE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_azure_ad_id ON public.users(azure_ad_id);

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    keywords TEXT[], -- Array of keywords
    entities JSONB, -- [{type: 'RCN', value: 'WW320'}]
    region VARCHAR(100),
    mode VARCHAR(20) CHECK (mode IN ('quantity', 'quality')),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_active ON public.profiles(active);

-- Create job_bundles table
CREATE TABLE IF NOT EXISTS public.job_bundles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status job_status DEFAULT 'pending',
    request_time TIMESTAMP NOT NULL,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_job_bundles_profile_id ON public.job_bundles(profile_id);
CREATE INDEX idx_job_bundles_status ON public.job_bundles(status);
CREATE INDEX idx_job_bundles_created_at ON public.job_bundles(created_at DESC);

-- Create jobs table
CREATE TABLE IF NOT EXISTS public.jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bundle_id UUID NOT NULL REFERENCES public.job_bundles(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type job_type NOT NULL,
    status job_status DEFAULT 'pending',
    priority INTEGER DEFAULT 5,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    error TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_jobs_bundle_id ON public.jobs(bundle_id);
CREATE INDEX idx_jobs_profile_id ON public.jobs(profile_id);
CREATE INDEX idx_jobs_type ON public.jobs(type);
CREATE INDEX idx_jobs_status ON public.jobs(status);
CREATE INDEX idx_jobs_priority ON public.jobs(priority DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_job_bundles_updated_at BEFORE UPDATE ON public.job_bundles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON SCHEMA bronze IS 'Raw data layer - time-limited retention (7-30 days)';
COMMENT ON SCHEMA silver IS 'Cleaned and normalized data layer';
COMMENT ON SCHEMA gold IS 'Business-ready data layer for dashboards';
COMMENT ON SCHEMA audit IS 'Audit logs and model tracking';
