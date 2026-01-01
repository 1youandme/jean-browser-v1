-- Enhanced AI Results Schema
-- Migration: 003_ai_results_enhanced.sql

-- AI Jobs with enhanced tracking
CREATE TABLE IF NOT EXISTS ai_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    model_name TEXT NOT NULL,
    model_version TEXT NOT NULL,
    input_json JSONB NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    estimated_cost_cents INTEGER NOT NULL,
    actual_cost_cents INTEGER,
    processing_time_ms INTEGER,
    queue_wait_time_ms INTEGER,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    worker_id TEXT,
    parent_job_id UUID REFERENCES ai_jobs(id),
    batch_job_id UUID,
    metadata JSONB
);

-- AI Results (polymorphic storage)
CREATE TABLE IF NOT EXISTS ai_results (
    job_id UUID PRIMARY KEY REFERENCES ai_jobs(id) ON DELETE CASCADE,
    result_type TEXT NOT NULL CHECK (result_type IN ('text', 'image', 'video', 'audio', 'json')),
    result_path TEXT,
    result_text TEXT,
    result_data JSONB,
    file_size_bytes BIGINT,
    mime_type TEXT,
    checksum TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enhanced Cost Tracking
CREATE TABLE IF NOT EXISTS ai_costs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_name TEXT NOT NULL,
    version TEXT NOT NULL,
    cost_per_unit NUMERIC(10,4) NOT NULL, -- $ per token/second/image
    unit_type TEXT NOT NULL CHECK (unit_type IN ('token', 'second', 'image', 'video_second')),
    effective_date TIMESTAMPTZ DEFAULT NOW(),
    expires_date TIMESTAMPTZ,
    currency TEXT DEFAULT 'USD',
    cost_tier TEXT DEFAULT 'standard' CHECK (cost_tier IN ('basic', 'standard', 'premium', 'enterprise')),
    min_usage_units INTEGER DEFAULT 1,
    max_usage_units INTEGER,
    discount_percentage NUMERIC(5,2) DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage Tracking and Analytics
CREATE TABLE IF NOT EXISTS ai_usage_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    model_name TEXT NOT NULL,
    model_version TEXT NOT NULL,
    date DATE NOT NULL,
    hour INTEGER CHECK (hour >= 0 AND hour <= 23),
    total_requests INTEGER DEFAULT 0,
    successful_requests INTEGER DEFAULT 0,
    failed_requests INTEGER DEFAULT 0,
    total_cost_cents INTEGER DEFAULT 0,
    total_units BIGINT DEFAULT 0, -- tokens, seconds, images, etc.
    avg_processing_time_ms INTEGER,
    avg_queue_wait_time_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, model_name, model_version, date, hour)
);

-- Model Performance Metrics
CREATE TABLE IF NOT EXISTS ai_model_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_name TEXT NOT NULL,
    model_version TEXT NOT NULL,
    metric_type TEXT NOT NULL CHECK (metric_type IN ('throughput', 'latency', 'error_rate', 'cost_efficiency')),
    metric_value NUMERIC(10,4) NOT NULL,
    metric_unit TEXT NOT NULL,
    time_period TEXT NOT NULL CHECK (time_period IN ('minute', 'hour', 'day', 'week', 'month')),
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    sample_size BIGINT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User AI Preferences and Settings
CREATE TABLE IF NOT EXISTS user_ai_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    default_model_name TEXT DEFAULT 'qwen-3-72b',
    default_model_version TEXT DEFAULT 'latest',
    max_cost_per_day_cents INTEGER DEFAULT 1000, -- $10 per day
    max_requests_per_day INTEGER DEFAULT 100,
    max_tokens_per_request INTEGER DEFAULT 4096,
    auto_retry_failed_jobs BOOLEAN DEFAULT true,
    stream_responses BOOLEAN DEFAULT false,
    preferred_language TEXT DEFAULT 'en',
    cost_alerts BOOLEAN DEFAULT true,
    usage_notifications BOOLEAN DEFAULT true,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Prompts and Templates
CREATE TABLE IF NOT EXISTS ai_prompt_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    category TEXT NOT NULL,
    template_text TEXT NOT NULL,
    variables JSONB, -- JSON object describing variables
    default_model TEXT,
    model_settings JSONB, -- Model-specific settings
    usage_count INTEGER DEFAULT 0,
    rating NUMERIC(3,2) CHECK (rating >= 0 AND rating <= 5),
    is_system BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT false,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prompt Usage History
CREATE TABLE IF NOT EXISTS ai_prompt_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES ai_jobs(id) ON DELETE CASCADE,
    template_id UUID REFERENCES ai_prompt_templates(id),
    user_id UUID NOT NULL REFERENCES users(id),
    prompt_text TEXT NOT NULL,
    variables_values JSONB,
    model_name TEXT NOT NULL,
    model_version TEXT NOT NULL,
    success BOOLEAN,
    user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
    feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Batch Jobs Management
CREATE TABLE IF NOT EXISTS ai_batch_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    name TEXT NOT NULL,
    description TEXT,
    model_name TEXT NOT NULL,
    model_version TEXT NOT NULL,
    total_jobs INTEGER DEFAULT 0,
    completed_jobs INTEGER DEFAULT 0,
    failed_jobs INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    input_data JSONB NOT NULL, -- Array of inputs or reference to file
    settings JSONB, -- Common settings for all jobs
    estimated_cost_cents INTEGER,
    actual_cost_cents INTEGER,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Model Registry (Cache from Redis)
CREATE TABLE IF NOT EXISTS ai_model_registry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_name TEXT NOT NULL,
    model_version TEXT NOT NULL,
    model_type TEXT NOT NULL CHECK (model_type IN ('text', 'image', 'video', 'audio', 'multimodal')),
    endpoint TEXT NOT NULL,
    health_status TEXT NOT NULL DEFAULT 'unknown' CHECK (health_status IN ('healthy', 'unhealthy', 'degraded', 'unknown')),
    last_health_check TIMESTAMPTZ DEFAULT NOW(),
    cost_per_unit NUMERIC(10,4) NOT NULL,
    unit_type TEXT NOT NULL CHECK (unit_type IN ('token', 'second', 'image', 'video_second')),
    max_tokens INTEGER,
    gpu_required BOOLEAN DEFAULT false,
    gpu_memory_gb INTEGER,
    max_concurrent_requests INTEGER DEFAULT 10,
    current_requests INTEGER DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(model_name, model_version)
);

-- AI Worker Nodes
CREATE TABLE IF NOT EXISTS ai_workers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id TEXT NOT NULL UNIQUE,
    hostname TEXT NOT NULL,
    ip_address INET,
    status TEXT NOT NULL DEFAULT 'idle' CHECK (status IN ('idle', 'busy', 'offline', 'maintenance')),
    capabilities JSONB NOT NULL, -- GPU, RAM, model support
    current_load INTEGER DEFAULT 0,
    max_load INTEGER DEFAULT 100,
    last_heartbeat TIMESTAMPTZ DEFAULT NOW(),
    current_jobs TEXT[], -- Array of job IDs
    total_jobs_processed INTEGER DEFAULT 0,
    avg_processing_time_ms INTEGER,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Notifications and Alerts
CREATE TABLE IF NOT EXISTS ai_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    notification_type TEXT NOT NULL CHECK (notification_type IN ('cost_alert', 'job_failed', 'model_down', 'usage_limit', 'batch_complete')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT false,
    is_critical BOOLEAN DEFAULT false,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cost Analysis and Budgeting
CREATE TABLE IF NOT EXISTS ai_budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    budget_type TEXT NOT NULL CHECK (budget_type IN ('daily', 'weekly', 'monthly', 'yearly')),
    amount_cents INTEGER NOT NULL,
    spent_cents INTEGER DEFAULT 0,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    alert_threshold_percentage INTEGER DEFAULT 80, -- Alert when 80% used
    is_active BOOLEAN DEFAULT true,
    auto_stop_exceeded BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, budget_type, period_start)
);

-- AI Cost Optimization Rules
CREATE TABLE IF NOT EXISTS ai_cost_optimization_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    rule_name TEXT NOT NULL,
    rule_type TEXT NOT NULL CHECK (rule_type IN ('model_selection', 'batch_processing', 'time_based', 'usage_limit')),
    conditions JSONB NOT NULL, -- When to apply
    actions JSONB NOT NULL, -- What to do
    priority INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    cost_savings_cents INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Model Training Data (for fine-tuning)
CREATE TABLE IF NOT EXISTS ai_training_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    dataset_name TEXT NOT NULL,
    model_name TEXT NOT NULL,
    data_type TEXT NOT NULL CHECK (data_type IN ('instruction', 'conversation', 'completion', 'classification')),
    input_text TEXT NOT NULL,
    expected_output TEXT,
    metadata JSONB,
    quality_score NUMERIC(3,2) CHECK (quality_score >= 0 AND quality_score <= 5),
    is_verified BOOLEAN DEFAULT false,
    used_for_training BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance optimization

-- AI Jobs indexes
CREATE INDEX IF NOT EXISTS idx_ai_jobs_user_status ON ai_jobs(user_id, status);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_model_status ON ai_jobs(model_name, status);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_created ON ai_jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_priority_created ON ai_jobs(priority, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_batch ON ai_jobs(batch_job_id);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_parent ON ai_jobs(parent_job_id);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_worker ON ai_jobs(worker_id);

-- AI Results indexes
CREATE INDEX IF NOT EXISTS idx_ai_results_type ON ai_results(result_type);
CREATE INDEX IF NOT EXISTS idx_ai_results_created ON ai_results(created_at);

-- Cost tracking indexes
CREATE INDEX IF NOT EXISTS idx_ai_costs_model_version ON ai_costs(model_name, version);
CREATE INDEX IF NOT EXISTS idx_ai_costs_effective ON ai_costs(effective_date, expires_date);

-- Usage stats indexes
CREATE INDEX IF NOT EXISTS idx_ai_usage_stats_user_date ON ai_usage_stats(user_id, date);
CREATE INDEX IF NOT EXISTS idx_ai_usage_stats_model_date ON ai_usage_stats(model_name, date);

-- Model metrics indexes
CREATE INDEX IF NOT EXISTS idx_ai_model_metrics_model_type ON ai_model_metrics(model_name, metric_type);
CREATE INDEX IF NOT EXISTS idx_ai_model_metrics_period ON ai_model_metrics(time_period, period_start);

-- Worker indexes
CREATE INDEX IF NOT EXISTS idx_ai_workers_status ON ai_workers(status);
CREATE INDEX IF NOT EXISTS idx_ai_workers_heartbeat ON ai_workers(last_heartbeat);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_ai_notifications_user_read ON ai_notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_ai_notifications_created ON ai_notifications(created_at);

-- Budget indexes
CREATE INDEX IF NOT EXISTS idx_ai_budgets_user_type ON ai_budgets(user_id, budget_type);
CREATE INDEX IF NOT EXISTS idx_ai_budgets_period ON ai_budgets(period_start, period_end);

-- Insert default AI costs
INSERT INTO ai_costs (model_name, version, cost_per_unit, unit_type, cost_tier) VALUES
('qwen-3-72b', 'v2.0.0', 0.001, 'token', 'standard'),
('qwen-3-72b', 'v2.0.0', 0.0008, 'token', 'premium'),
('sdxl', 'v1.0.0', 0.05, 'image', 'standard'),
('sdxl', 'v1.0.0', 0.04, 'image', 'premium'),
('whisper', 'v1.0.0', 0.01, 'second', 'standard'),
('coqui', 'v1.0.0', 0.005, 'second', 'standard')
ON CONFLICT (model_name, version) DO NOTHING;

-- Insert default prompt templates
INSERT INTO ai_prompt_templates (name, description, category, template_text, variables, is_system) VALUES
('jean_core', 'Jean AI Core Assistant', 'system', 
'You are Jean, the central AI assistant of JeanTrail OS. Your capabilities:

CONTEXT AWARENESS:
- You operate across 4 tabs: Local Desktop, Proxy Network, Web Browser, Mobile Emulator
- Maintain conversation history and user preferences
- Detect user emotion from text input

RESPONSE GUIDELINES:
- Always respond in the user''s language (detect from input)
- Be proactive: "I noticed you''re browsing Alibaba. Would you like me to find similar products?"
- For complex tasks: break into steps with clear actions
- Never share sensitive data or make assumptions about private information

CURRENT CONTEXT:
- User: {user_name}
- Language: {detected_language}
- Active Tab: {current_tab}
- Recent Activity: {recent_activity}

User Query: {user_query}',
'{"user_name": "string", "detected_language": "string", "current_tab": "string", "recent_activity": "string", "user_query": "string"}',
true),
('price_intelligence', 'Price Intelligence Analysis', 'ecommerce',
'You are Price Intelligence AI. Analyze this product:

Alibaba Price: ${alibaba_price}
Amazon Price: ${amazon_price}
Weight: ${weight}g
Free Shipping: ${has_free_shipping}

Apply these rules:
1. Default margin: 40%
2. If Amazon price < Alibaba * 1.25: use 25% margin
3. If weight < 500g AND free shipping: add +10% margin

Calculate final price and explain reasoning in 1 sentence.',
'{"alibaba_price": "number", "amazon_price": "number", "weight": "number", "has_free_shipping": "boolean"}',
true),
('mobile_emulator', 'Mobile App Emulator Guide', 'mobile',
'You are guiding a user through the Mobile App Emulator (375px width). 
Available app stores: Google Play, App Store, Xiaomi Store, Samsung Galaxy Store, Amazon AppStore.

User Query: "{query}"

Your Response:
1. First, identify which app store is most relevant
2. If user wants to install: provide clear "Install" button guidance
3. If user wants to find apps: suggest categories or search terms
4. Keep response under 2 sentences for mobile UX',
'{"query": "string"}',
true),
('sdxl_image', 'SDXL Image Generation', 'image',
'{subject}, {style}, {lighting}, {composition}, {quality}

Style Keywords: photorealistic, cinematic, 8k, sharp focus, professional photography
Negative Prompt: {negative_prompt}',
'{"subject": "string", "style": "string", "lighting": "string", "composition": "string", "quality": "string", "negative_prompt": "string"}',
true)
ON CONFLICT (name) DO NOTHING;

-- Triggers for automated updates

-- Update usage stats when job completes
CREATE OR REPLACE FUNCTION update_ai_usage_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        INSERT INTO ai_usage_stats (
            user_id, model_name, model_version, date, hour, 
            total_requests, successful_requests, total_cost_cents, total_units
        ) VALUES (
            NEW.user_id, NEW.model_name, NEW.model_version, 
            DATE(NEW.completed_at), EXTRACT(HOUR FROM NEW.completed_at),
            1, 1, COALESCE(NEW.actual_cost_cents, 0), 
            COALESCE((NEW.input_json->>'max_tokens')::INTEGER, 1000)
        )
        ON CONFLICT (user_id, model_name, model_version, date, hour)
        DO UPDATE SET
            total_requests = ai_usage_stats.total_requests + 1,
            successful_requests = ai_usage_stats.successful_requests + 1,
            total_cost_cents = ai_usage_stats.total_cost_cents + COALESCE(NEW.actual_cost_cents, 0),
            total_units = ai_usage_stats.total_units + COALESCE((NEW.input_json->>'max_tokens')::INTEGER, 1000),
            updated_at = NOW();
    ELSIF NEW.status = 'failed' AND OLD.status != 'failed' THEN
        INSERT INTO ai_usage_stats (
            user_id, model_name, model_version, date, hour, 
            total_requests, failed_requests
        ) VALUES (
            NEW.user_id, NEW.model_name, NEW.model_version, 
            DATE(NEW.completed_at), EXTRACT(HOUR FROM NEW.completed_at),
            1, 1
        )
        ON CONFLICT (user_id, model_name, model_version, date, hour)
        DO UPDATE SET
            total_requests = ai_usage_stats.total_requests + 1,
            failed_requests = ai_usage_stats.failed_requests + 1,
            updated_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ai_usage_stats
    AFTER UPDATE ON ai_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_ai_usage_stats();

-- Update budget when costs incurred
CREATE OR REPLACE FUNCTION update_ai_budget_spent()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.actual_cost_cents IS NOT NULL AND OLD.actual_cost_cents IS NULL THEN
        UPDATE ai_budgets 
        SET spent_cents = spent_cents + NEW.actual_cost_cents,
            updated_at = NOW()
        WHERE user_id = NEW.user_id 
          AND is_active = true 
          AND period_start <= DATE(NEW.completed_at) 
          AND period_end >= DATE(NEW.completed_at);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ai_budget_spent
    AFTER UPDATE ON ai_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_ai_budget_spent();