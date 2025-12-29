-- Migration: 015_data_intelligence_settings.sql
-- Description: Stores user preferences for the Data Intelligence Layer (Opt-in/out).

CREATE TABLE IF NOT EXISTS jean_telemetry_settings (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    
    -- The Master Switch
    is_telemetry_enabled BOOLEAN DEFAULT false, -- Explicit Opt-In required
    
    -- Granular Controls (Optional for future)
    share_usage_counts BOOLEAN DEFAULT false,
    share_error_reports BOOLEAN DEFAULT false,
    share_performance_stats BOOLEAN DEFAULT false,
    
    -- Operational State
    last_report_sent_at TIMESTAMPTZ,
    current_cohort_id VARCHAR(50) DEFAULT 'default', -- e.g., 'beta_users', 'pro_tier'
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Log of transmitted reports (Local Audit Trail of what was sent)
CREATE TABLE IF NOT EXISTS jean_telemetry_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    report_timestamp TIMESTAMPTZ DEFAULT NOW(),
    report_payload_hash VARCHAR(64) NOT NULL, -- SHA256 of the JSON sent
    report_summary JSONB, -- Stored locally so user can see what they sent
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick lookup of user settings
CREATE INDEX IF NOT EXISTS idx_telemetry_settings_user ON jean_telemetry_settings(user_id);
