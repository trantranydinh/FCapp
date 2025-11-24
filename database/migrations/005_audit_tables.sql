-- Migration 005: Audit Layer Tables
-- Immutable logs for tracking and debugging

-- Audit: Model Runs
CREATE TABLE IF NOT EXISTS audit.model_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES public.jobs(id),
    profile_id UUID NOT NULL REFERENCES public.profiles(id),
    model_type VARCHAR(50) NOT NULL, -- 'prophet', 'arima', 'lstm', 'perplexity', 'claude'
    model_version VARCHAR(50),
    input_params JSONB NOT NULL,
    output_data JSONB,
    execution_time_ms INTEGER,
    success BOOLEAN NOT NULL,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_runs_job ON audit.model_runs(job_id);
CREATE INDEX idx_audit_runs_profile ON audit.model_runs(profile_id);
CREATE INDEX idx_audit_runs_type ON audit.model_runs(model_type);
CREATE INDEX idx_audit_runs_created ON audit.model_runs(created_at DESC);
CREATE INDEX idx_audit_runs_success ON audit.model_runs(success);

-- Audit: Backtest Results
CREATE TABLE IF NOT EXISTS audit.backtests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id),
    model_name VARCHAR(50) NOT NULL,
    test_start_date DATE NOT NULL,
    test_end_date DATE NOT NULL,
    mape DECIMAL(5, 2), -- Mean Absolute Percentage Error
    rmse DECIMAL(10, 2), -- Root Mean Square Error
    mae DECIMAL(10, 2), -- Mean Absolute Error
    accuracy_score DECIMAL(3, 2), -- 0-1
    predictions JSONB, -- Array of {date, predicted, actual, error}
    configuration JSONB, -- Model hyperparameters
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_backtest_profile ON audit.backtests(profile_id);
CREATE INDEX idx_audit_backtest_model ON audit.backtests(model_name);
CREATE INDEX idx_audit_backtest_created ON audit.backtests(created_at DESC);
CREATE INDEX idx_audit_backtest_accuracy ON audit.backtests(accuracy_score DESC);

-- Audit: API Calls
CREATE TABLE IF NOT EXISTS audit.api_calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id),
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INTEGER NOT NULL,
    request_body JSONB,
    response_body JSONB,
    ip_address INET,
    user_agent TEXT,
    execution_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_api_user ON audit.api_calls(user_id);
CREATE INDEX idx_audit_api_endpoint ON audit.api_calls(endpoint);
CREATE INDEX idx_audit_api_status ON audit.api_calls(status_code);
CREATE INDEX idx_audit_api_created ON audit.api_calls(created_at DESC);

-- Audit: Data Lineage
CREATE TABLE IF NOT EXISTS audit.data_lineage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_table VARCHAR(100) NOT NULL,
    source_id UUID NOT NULL,
    target_table VARCHAR(100) NOT NULL,
    target_id UUID NOT NULL,
    transformation VARCHAR(100), -- 'clean', 'aggregate', 'rank', 'merge'
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_lineage_source ON audit.data_lineage(source_table, source_id);
CREATE INDEX idx_audit_lineage_target ON audit.data_lineage(target_table, target_id);
CREATE INDEX idx_audit_lineage_transformation ON audit.data_lineage(transformation);
CREATE INDEX idx_audit_lineage_created ON audit.data_lineage(created_at DESC);

-- Audit: Alert History
CREATE TABLE IF NOT EXISTS audit.alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id),
    alert_type VARCHAR(50) NOT NULL, -- 'deviation', 'anomaly', 'drift', 'threshold'
    severity VARCHAR(20) NOT NULL, -- 'critical', 'high', 'medium', 'low'
    message TEXT NOT NULL,
    details JSONB,
    triggered_by UUID, -- job_id or user_id
    acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_by UUID REFERENCES public.users(id),
    acknowledged_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_alerts_profile ON audit.alerts(profile_id);
CREATE INDEX idx_audit_alerts_type ON audit.alerts(alert_type);
CREATE INDEX idx_audit_alerts_severity ON audit.alerts(severity);
CREATE INDEX idx_audit_alerts_created ON audit.alerts(created_at DESC);
CREATE INDEX idx_audit_alerts_acknowledged ON audit.alerts(acknowledged);

-- Audit: LLM Cost Tracking
CREATE TABLE IF NOT EXISTS audit.llm_costs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES public.jobs(id),
    provider VARCHAR(50) NOT NULL,
    model VARCHAR(100) NOT NULL,
    tokens_input INTEGER NOT NULL,
    tokens_output INTEGER NOT NULL,
    cost_usd DECIMAL(10, 6) NOT NULL,
    request_timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_llm_cost_job ON audit.llm_costs(job_id);
CREATE INDEX idx_audit_llm_cost_provider ON audit.llm_costs(provider);
CREATE INDEX idx_audit_llm_cost_created ON audit.llm_costs(created_at DESC);

-- Create view for cost analysis
CREATE OR REPLACE VIEW audit.llm_cost_summary AS
SELECT
    provider,
    model,
    DATE_TRUNC('day', request_timestamp) as date,
    COUNT(*) as request_count,
    SUM(tokens_input) as total_tokens_input,
    SUM(tokens_output) as total_tokens_output,
    SUM(cost_usd) as total_cost_usd,
    AVG(cost_usd) as avg_cost_per_request
FROM audit.llm_costs
GROUP BY provider, model, DATE_TRUNC('day', request_timestamp)
ORDER BY date DESC, total_cost_usd DESC;

-- Create view for model performance tracking
CREATE OR REPLACE VIEW audit.model_performance AS
SELECT
    model_name,
    COUNT(*) as backtest_count,
    AVG(mape) as avg_mape,
    AVG(rmse) as avg_rmse,
    AVG(accuracy_score) as avg_accuracy,
    MIN(accuracy_score) as min_accuracy,
    MAX(accuracy_score) as max_accuracy,
    MAX(created_at) as last_backtest_date
FROM audit.backtests
GROUP BY model_name
ORDER BY avg_accuracy DESC;

COMMENT ON TABLE audit.model_runs IS 'Immutable log of all model executions';
COMMENT ON TABLE audit.backtests IS 'Historical backtest results for model evaluation';
COMMENT ON TABLE audit.api_calls IS 'API request/response audit trail';
COMMENT ON TABLE audit.data_lineage IS 'Tracks data transformations across layers';
COMMENT ON TABLE audit.alerts IS 'Alert history and acknowledgment tracking';
COMMENT ON TABLE audit.llm_costs IS 'LLM API usage and cost tracking';
