-- Jean Developer Metrics & Aggregation
-- Stores anonymous, privacy-safe aggregates for system health monitoring

-- 1. Daily Metrics Table
-- No user_id, no timestamps (date only), no content.
CREATE TABLE IF NOT EXISTS jean_daily_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_date DATE NOT NULL,
    metric_key VARCHAR(100) NOT NULL, -- e.g. 'consent_refused', 'session_start'
    dimension VARCHAR(100) DEFAULT 'global', -- e.g. 'capability:fs_read'
    count_value INTEGER NOT NULL DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure unique daily entry per key/dimension for UPSERTs
    CONSTRAINT uniq_metric_day UNIQUE (metric_date, metric_key, dimension)
);

-- Index for date-range queries (e.g. "Last 30 Days")
CREATE INDEX IF NOT EXISTS idx_jean_metrics_date ON jean_daily_metrics(metric_date);

-- 2. Function to flush/increment metrics (Upsert Logic)
-- To be called by the backend
/*
  INSERT INTO jean_daily_metrics (metric_date, metric_key, dimension, count_value)
  VALUES (CURRENT_DATE, 'consent_refused', 'global', 1)
  ON CONFLICT (metric_date, metric_key, dimension)
  DO UPDATE SET 
    count_value = jean_daily_metrics.count_value + EXCLUDED.count_value,
    updated_at = NOW();
*/

-- 3. Seed Initial Metrics (Zero state for UI testing)
INSERT INTO jean_daily_metrics (metric_date, metric_key, dimension, count_value) VALUES
(CURRENT_DATE, 'session_start', 'global', 1),
(CURRENT_DATE, 'advisory_shown', 'global', 0),
(CURRENT_DATE, 'consent_granted', 'global', 0),
(CURRENT_DATE, 'consent_refused', 'global', 0)
ON CONFLICT DO NOTHING;
