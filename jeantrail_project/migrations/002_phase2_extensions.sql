-- JeanTrail Phase 2 Extensions
-- Additional schema for Model Hub, Backlog, Loyalty, Plugins, and Security

-- Model Hub Tables
CREATE TABLE IF NOT EXISTS ai_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    model_type VARCHAR(50) NOT NULL CHECK (model_type IN ('llm', 'image', 'video', 'audio', 'multimodal')),
    backend_type VARCHAR(50) NOT NULL CHECK (backend_type IN ('local', 'remote', 'colab', 'gradio')),
    endpoint_url TEXT,
    docker_image VARCHAR(500),
    api_key_encrypted TEXT,
    model_config JSONB DEFAULT '{}',
    parameters JSONB DEFAULT '{}',
    capabilities TEXT[],
    status VARCHAR(20) DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'downloading', 'error', 'updating')),
    is_default BOOLEAN DEFAULT false,
    priority INTEGER DEFAULT 0,
    file_size BIGINT,
    download_progress INTEGER DEFAULT 0,
    version VARCHAR(50),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Backlog / Ideas Management
CREATE TABLE IF NOT EXISTS backlog_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id VARCHAR(100),
    title VARCHAR(500) NOT NULL,
    summary TEXT,
    details TEXT,
    technical_details TEXT,
    category VARCHAR(100),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(20) DEFAULT 'idea' CHECK (status IN ('idea', 'planned', 'in_progress', 'completed', 'archived')),
    tags TEXT[],
    estimated_hours INTEGER,
    assignee_id UUID REFERENCES users(id),
    creator_id UUID REFERENCES users(id),
    source VARCHAR(100), -- 'csv_import', 'manual', 'ai_generated'
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Loyalty Ledger / Points System
CREATE TABLE IF NOT EXISTS loyalty_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    transaction_type VARCHAR(50) NOT NULL,
    source VARCHAR(50) NOT NULL, -- 'proxy_sharing', 'purchase', 'referral', 'content_creation', 'task_completion', 'daily_login'
    points INTEGER NOT NULL,
    direction VARCHAR(10) NOT NULL CHECK (direction IN ('earn', 'spend')),
    balance_after INTEGER NOT NULL,
    description TEXT,
    reference_id UUID, -- Related to specific transaction/action
    metadata JSONB DEFAULT '{}',
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    points_cost INTEGER NOT NULL,
    reward_type VARCHAR(50) NOT NULL, -- 'discount', 'feature_unlock', 'badge', 'subscription'
    reward_value JSONB, -- Flexible structure for different reward types
    is_active BOOLEAN DEFAULT true,
    quantity_available INTEGER,
    valid_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    reward_id UUID REFERENCES rewards(id),
    points_used INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'claimed' CHECK (status IN ('claimed', 'used', 'expired')),
    claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'
);

-- Plugin System
CREATE TABLE IF NOT EXISTS plugins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    version VARCHAR(50) NOT NULL,
    author VARCHAR(255),
    manifest JSONB NOT NULL,
    entry_point VARCHAR(500),
    permissions TEXT[],
    is_active BOOLEAN DEFAULT false,
    is_system BOOLEAN DEFAULT false,
    installed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS user_plugin_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    plugin_id UUID REFERENCES plugins(id),
    settings JSONB DEFAULT '{}',
    is_enabled BOOLEAN DEFAULT false,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, plugin_id)
);

-- Transport / Delivery Pilot Extension
CREATE TABLE IF NOT EXISTS delivery_drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    vehicle_type VARCHAR(50) NOT NULL,
    vehicle_plate VARCHAR(50),
    license_number VARCHAR(100),
    is_active BOOLEAN DEFAULT false,
    current_location JSONB, -- {lat, lng, address}
    rating DECIMAL(3,2) DEFAULT 5.0,
    total_deliveries INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'busy', 'offline', 'on_break')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS delivery_vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID REFERENCES delivery_drivers(id),
    make VARCHAR(100),
    model VARCHAR(100),
    year INTEGER,
    color VARCHAR(50),
    license_plate VARCHAR(50),
    vehicle_type VARCHAR(50),
    capacity_kg DECIMAL(8,2),
    insurance_expiry DATE,
    registration_expiry DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS delivery_routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID REFERENCES delivery_drivers(id),
    name VARCHAR(255),
    waypoints JSONB NOT NULL, -- Array of {lat, lng, address, estimated_time}
    total_distance_km DECIMAL(8,2),
    estimated_duration_minutes INTEGER,
    status VARCHAR(20) DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed', 'cancelled')),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS delivery_telemetry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID REFERENCES delivery_drivers(id),
    route_id UUID REFERENCES delivery_routes(id),
    delivery_id UUID REFERENCES transactions(id), -- Link to delivery transaction
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    location JSONB NOT NULL, -- {lat, lng, accuracy}
    speed_kmh DECIMAL(5,2),
    heading_degrees INTEGER,
    event_type VARCHAR(50), -- 'location_update', 'pickup', 'delivery', 'break', 'fuel'
    event_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Security / Privacy / Compliance
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100),
    resource_id VARCHAR(255),
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    risk_score INTEGER DEFAULT 0, -- 0-100
    status VARCHAR(20) DEFAULT 'success' CHECK (status IN ('success', 'failed', 'blocked')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS consent_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    consent_type VARCHAR(100) NOT NULL, -- 'data_processing', 'analytics', 'marketing', 'third_party_sharing'
    version VARCHAR(50) NOT NULL,
    granted BOOLEAN NOT NULL,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    revoked_at TIMESTAMP WITH TIME ZONE,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS privacy_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    setting_key VARCHAR(100) NOT NULL,
    setting_value JSONB NOT NULL,
    category VARCHAR(50), -- 'data_collection', 'sharing', 'analytics', 'security'
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, setting_key)
);

-- Auto-API Extractor
CREATE TABLE IF NOT EXISTS api_discovery_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    session_id VARCHAR(255),
    domain VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    url TEXT NOT NULL,
    headers JSONB,
    request_body TEXT,
    response_status INTEGER,
    response_headers JSONB,
    response_body TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed BOOLEAN DEFAULT false,
    api_spec JSONB -- Generated OpenAPI spec
);

-- Video Studio / Colab Integration
CREATE TABLE IF NOT EXISTS video_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    storyboard JSONB NOT NULL, -- Scene definitions
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'completed', 'failed')),
    job_id VARCHAR(255), -- External job ID from Colab/Gradio
    job_config JSONB,
    result_urls TEXT[], -- Generated video URLs
    progress INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Local Hub / P2P Chat
CREATE TABLE IF NOT EXISTS local_hub_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255),
    created_by UUID REFERENCES users(id),
    is_private BOOLEAN DEFAULT false,
    max_participants INTEGER DEFAULT 10,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS local_hub_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES local_hub_rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    peer_id VARCHAR(255), -- WebRTC peer ID
    role VARCHAR(20) DEFAULT 'participant' CHECK (role IN ('host', 'participant')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(room_id, user_id)
);

-- Integration Configuration
CREATE TABLE IF NOT EXISTS integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL, -- 'n8n', 'colab', 'gradio', 'webhook', 'api'
    config JSONB NOT NULL,
    is_active BOOLEAN DEFAULT false,
    last_tested_at TIMESTAMP WITH TIME ZONE,
    test_status VARCHAR(20), -- 'success', 'failed', 'pending'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS integration_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_id UUID REFERENCES integrations(id),
    event_type VARCHAR(100) NOT NULL,
    payload JSONB,
    response_data JSONB,
    status VARCHAR(20) DEFAULT 'success',
    error_message TEXT,
    duration_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- New Indexes
CREATE INDEX IF NOT EXISTS idx_ai_models_type ON ai_models(model_type, backend_type);
CREATE INDEX IF NOT EXISTS idx_ai_models_status ON ai_models(status);
CREATE INDEX IF NOT EXISTS idx_backlog_items_status ON backlog_items(status, priority);
CREATE INDEX IF NOT EXISTS idx_backlog_items_creator ON backlog_items(creator_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_ledger_user ON loyalty_ledger(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_loyalty_ledger_source ON loyalty_ledger(source, transaction_type);
CREATE INDEX IF NOT EXISTS idx_plugins_active ON plugins(is_active, is_system);
CREATE INDEX IF NOT EXISTS idx_delivery_drivers_status ON delivery_drivers(status, is_active);
CREATE INDEX IF NOT EXISTS idx_delivery_telemetry_driver ON delivery_telemetry(driver_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action, created_at);
CREATE INDEX IF NOT EXISTS idx_consent_records_user ON consent_records(user_id, consent_type);
CREATE INDEX IF NOT EXISTS idx_api_discovery_logs_domain ON api_discovery_logs(domain, timestamp);
CREATE INDEX IF NOT EXISTS idx_video_projects_status ON video_projects(status, user_id);
CREATE INDEX IF NOT EXISTS idx_local_hub_rooms_code ON local_hub_rooms(room_code);
CREATE INDEX IF NOT EXISTS idx_local_hub_participants_user ON local_hub_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_integration_logs_timestamp ON integration_logs(created_at);

-- Add foreign key constraints for existing tables if needed
ALTER TABLE tabs ADD CONSTRAINT IF NOT EXISTS fk_tabs_user FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE proxy_nodes ADD CONSTRAINT IF NOT EXISTS fk_proxy_nodes_user FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE proxy_sessions ADD CONSTRAINT IF NOT EXISTS fk_proxy_sessions_user FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE workspaces ADD CONSTRAINT IF NOT EXISTS fk_workspaces_user FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE messages ADD CONSTRAINT IF NOT EXISTS fk_messages_user FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE transactions ADD CONSTRAINT IF NOT EXISTS fk_transactions_user FOREIGN KEY (user_id) REFERENCES users(id);