-- JeanTrail OS - Jean Orchestrator Unlimited Schema
-- Migration for comprehensive permission system and action logging

-- Enhanced Jean Permissions System
CREATE TABLE IF NOT EXISTS jean_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission_type VARCHAR(100) NOT NULL,
    scope JSONB NOT NULL DEFAULT '{}',
    grant_type VARCHAR(50) NOT NULL DEFAULT 'manual', -- manual, auto, delegated, template
    granted_by UUID REFERENCES users(id),
    delegated_from UUID REFERENCES jean_permissions(id),
    expires_at TIMESTAMPTZ,
    auto_approve_if JSONB, -- Conditions for auto-approval
    usage_limits JSONB, -- Usage count, time limits, amount limits
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Permission Scopes (detailed scope definitions)
CREATE TABLE IF NOT EXISTS jean_permission_scopes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    permission_id UUID NOT NULL REFERENCES jean_permissions(id) ON DELETE CASCADE,
    scope_name VARCHAR(100) NOT NULL,
    parameters JSONB NOT NULL DEFAULT '{}',
    restrictions JSONB DEFAULT '{}', -- Additional restrictions
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comprehensive Actions Log
CREATE TABLE IF NOT EXISTS jean_actions_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action_type VARCHAR(100) NOT NULL,
    target VARCHAR(255) NOT NULL, -- service/resource name
    parameters JSONB NOT NULL DEFAULT '{}',
    permission_id UUID REFERENCES jean_permissions(id),
    requires_confirmation BOOLEAN DEFAULT false,
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, executed, failed, cancelled
    result JSONB,
    error_message TEXT,
    execution_time_ms INTEGER,
    auto_approved BOOLEAN DEFAULT false,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    executed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    context_snapshot JSONB, -- System state at time of action
    session_id VARCHAR(255),
    workspace_id UUID,
    strip_type VARCHAR(50), -- local, proxy, web, mobile
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Action Templates (predefined actions)
CREATE TABLE IF NOT EXISTS jean_action_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    action_type VARCHAR(100) NOT NULL,
    template_parameters JSONB NOT NULL DEFAULT '{}',
    required_permissions JSONB, -- Array of required permission types
    auto_approve_conditions JSONB,
    impact_level VARCHAR(50) DEFAULT 'low', -- low, medium, high, critical
    category VARCHAR(100),
    tags JSONB DEFAULT '[]',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Enhanced Memory System with folders and links
CREATE TABLE IF NOT EXISTS jean_memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    memory_type VARCHAR(100) NOT NULL,
    title VARCHAR(500),
    content TEXT NOT NULL,
    category VARCHAR(100),
    tags JSONB DEFAULT '[]',
    importance_score DECIMAL(3,2) DEFAULT 0.5 CHECK (importance_score >= 0 AND importance_score <= 1),
    relevance_score DECIMAL(3,2) DEFAULT 0.5 CHECK (relevance_score >= 0 AND relevance_score <= 1),
    access_count INTEGER DEFAULT 0,
    last_accessed TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    is_archived BOOLEAN DEFAULT false,
    is_private BOOLEAN DEFAULT false,
    encryption_key_id UUID,
    session_id VARCHAR(255),
    context_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Memory Folders (hierarchical organization)
CREATE TABLE IF NOT EXISTS jean_memory_folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_folder_id UUID REFERENCES jean_memory_folders(id) ON DELETE CASCADE,
    color VARCHAR(7), -- Hex color code
    icon VARCHAR(50),
    is_system BOOLEAN DEFAULT false, -- System-generated folders
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Memory-Folder Links (many-to-many)
CREATE TABLE IF NOT EXISTS jean_memory_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    memory_id UUID NOT NULL REFERENCES jean_memories(id) ON DELETE CASCADE,
    folder_id UUID NOT NULL REFERENCES jean_memory_folders(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(memory_id, folder_id)
);

-- Docker Container Status Monitoring
CREATE TABLE IF NOT EXISTS docker_container_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    container_id VARCHAR(100) NOT NULL UNIQUE,
    container_name VARCHAR(255) NOT NULL,
    image_name VARCHAR(500),
    status VARCHAR(50) NOT NULL, -- running, stopped, paused, restarting, error
    cpu_usage DECIMAL(5,2), -- Percentage
    memory_usage BIGINT, -- Bytes
    memory_limit BIGINT, -- Bytes
    network_rx BIGINT DEFAULT 0, -- Bytes received
    network_tx BIGINT DEFAULT 0, -- Bytes transmitted
    disk_usage BIGINT DEFAULT 0, -- Bytes
    health_status VARCHAR(50), -- healthy, unhealthy, none
    ports JSONB DEFAULT '[]',
    labels JSONB DEFAULT '{}',
    environment JSONB DEFAULT '{}',
    restart_count INTEGER DEFAULT 0,
    last_checked TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    uptime_seconds BIGINT DEFAULT 0,
    agent_type VARCHAR(100), -- TRAE agent type if applicable
    is_trae_agent BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TRAE Agents Management
CREATE TABLE IF NOT EXISTS trae_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    capabilities JSONB NOT NULL DEFAULT '[]',
    status VARCHAR(50) DEFAULT 'idle', -- active, idle, error, paused, maintenance
    priority INTEGER DEFAULT 5, -- 1-10, lower numbers = higher priority
    max_concurrent_tasks INTEGER DEFAULT 1,
    current_tasks INTEGER DEFAULT 0,
    docker_container_id VARCHAR(100) REFERENCES docker_container_status(container_id),
    configuration JSONB DEFAULT '{}',
    performance_metrics JSONB DEFAULT '{}',
    last_run TIMESTAMPTZ,
    total_runs BIGINT DEFAULT 0,
    successful_runs BIGINT DEFAULT 0,
    failed_runs BIGINT DEFAULT 0,
    average_execution_time_ms INTEGER DEFAULT 0,
    resource_limits JSONB, -- CPU, memory, disk limits
    webhook_url VARCHAR(500),
    health_check_url VARCHAR(500),
    auto_restart BOOLEAN DEFAULT true,
    maintenance_schedule JSONB, -- Cron-like schedule
    tags JSONB DEFAULT '[]',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Agent Task Queue
CREATE TABLE IF NOT EXISTS trae_agent_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES trae_agents(id) ON DELETE CASCADE,
    task_type VARCHAR(100) NOT NULL,
    parameters JSONB NOT NULL DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'queued', -- queued, running, completed, failed, cancelled
    priority INTEGER DEFAULT 5, -- 1-10
    max_retries INTEGER DEFAULT 3,
    retry_count INTEGER DEFAULT 0,
    scheduled_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    execution_time_ms INTEGER,
    result JSONB,
    error_message TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent Execution Logs
CREATE TABLE IF NOT EXISTS trae_agent_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES trae_agents(id) ON DELETE CASCADE,
    task_id UUID REFERENCES trae_agent_tasks(id) ON DELETE CASCADE,
    log_level VARCHAR(20) NOT NULL, -- debug, info, warn, error, fatal
    message TEXT NOT NULL,
    context JSONB DEFAULT '{}',
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    execution_id VARCHAR(100)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_jean_permissions_user_active ON jean_permissions(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_jean_permissions_type ON jean_permissions(permission_type);
CREATE INDEX IF NOT EXISTS idx_jean_permissions_expires ON jean_permissions(expires_at);

CREATE INDEX IF NOT EXISTS idx_jean_actions_log_user ON jean_actions_log(user_id);
CREATE INDEX IF NOT EXISTS idx_jean_actions_log_type ON jean_actions_log(action_type);
CREATE INDEX IF NOT EXISTS idx_jean_actions_log_status ON jean_actions_log(status);
CREATE INDEX IF NOT EXISTS idx_jean_actions_log_created ON jean_actions_log(created_at);

CREATE INDEX IF NOT EXISTS idx_jean_memories_user ON jean_memories(user_id, is_archived);
CREATE INDEX IF NOT EXISTS idx_jean_memories_type ON jean_memories(memory_type);
CREATE INDEX IF NOT EXISTS idx_jean_memories_relevance ON jean_memories(relevance_score DESC);
CREATE INDEX IF NOT EXISTS idx_jean_memories_tags ON jean_memories USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_docker_container_status_name ON docker_container_status(container_name);
CREATE INDEX IF NOT EXISTS idx_docker_container_status_status ON docker_container_status(status);
CREATE INDEX IF NOT EXISTS idx_docker_container_status_agent ON docker_container_status(is_trae_agent);

CREATE INDEX IF NOT EXISTS idx_trae_agents_status ON trae_agents(status, is_active);
CREATE INDEX IF NOT EXISTS idx_trae_agents_type ON trae_agents(capabilities);

CREATE INDEX IF NOT EXISTS idx_trae_agent_tasks_agent ON trae_agent_tasks(agent_id);
CREATE INDEX IF NOT EXISTS idx_trae_agent_tasks_status ON trae_agent_tasks(status);
CREATE INDEX IF NOT EXISTS idx_trae_agent_tasks_scheduled ON trae_agent_tasks(scheduled_at);

CREATE INDEX IF NOT EXISTS idx_trae_agent_logs_agent ON trae_agent_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_trae_agent_logs_timestamp ON trae_agent_logs(timestamp);

-- Enable full-text search on memories
CREATE INDEX IF NOT EXISTS idx_jean_memories_fts ON jean_memories USING GIN(
    to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(content, ''))
);

-- Insert default action templates
INSERT INTO jean_action_templates (name, description, action_type, template_parameters, required_permissions, impact_level, category) VALUES
('open_tab', 'Open new browser tab in specified strip', 'open_tab', 
 '{"strip_type": "web", "url": "https://example.com", "workspace_id": null}',
 '["browser_navigation"]', 'low', 'browser'),
('close_tab', 'Close current browser tab', 'close_tab',
 '{"tab_id": null}',
 '["browser_tab_management"]', 'low', 'browser'),
('run_scraper', 'Execute product scraper on specified platform', 'run_scraper',
 '{"platform": "alibaba", "category": "electronics", "max_products": 100}',
 '["service_control", "filesystem_write"]', 'medium', 'ecommerce'),
('apply_pricing', 'Apply dynamic pricing to products', 'apply_pricing',
 '{"product_ids": [], "strategy": "competitive"}',
 '["service_control", "payment_processing"]', 'high', 'ecommerce'),
('send_email', 'Send email to specified recipients', 'send_email',
 '{"to": [], "subject": "", "template": "default"}',
 '["email_sending"]', 'medium', 'communication'),
('create_agent', 'Create new TRAE agent', 'create_agent',
 '{"name": "", "role": "", "capabilities": []}',
 '["agent_creation", "docker_control"]', 'high', 'system')
ON CONFLICT (name) DO NOTHING;

-- Insert default memory folders
INSERT INTO jean_memory_folders (name, description, is_system, color, icon) VALUES
('Conversations', 'Jean chat conversations and discussions', true, '#3B82F6', 'message-circle'),
('Decisions', 'Important decisions and choices made', true, '#10B981', 'check-circle'),
('Projects', 'Project-related information and plans', true, '#8B5CF6', 'folder'),
('Preferences', 'User preferences and settings', true, '#F59E0B', 'settings'),
('Technical', 'Technical notes, code snippets, and solutions', true, '#EF4444', 'code'),
('Business', 'Business decisions, strategies, and insights', true, '#6366F1', 'briefcase')
ON CONFLICT DO NOTHING;

-- Grant necessary permissions for the Jean system
-- These are system permissions that Jean needs to function properly
INSERT INTO jean_permissions (user_id, permission_type, scope, grant_type, auto_approve_if, usage_limits) 
SELECT 
    u.id,
    p.permission_type,
    p.scope,
    'auto',
    p.auto_approve_if,
    p.usage_limits
FROM (
    SELECT 
        gen_random_uuid() as id,
        'jean_system' as user_id,
        unnest(ARRAY[
            'filesystem_read', 'filesystem_write', 'filesystem_delete',
            'browser_navigation', 'browser_tab_management',
            'service_control', 'payment_processing',
            'email_sending', 'agent_creation', 'agent_management',
            'docker_control', 'monitoring',
            'api_key_generation', 'user_management',
            'analytics_access', 'security_audit'
        ]) as permission_type,
        '{"scope": "system", "priority": "system"}'::jsonb as scope,
        '{"always": true}'::jsonb as auto_approve_if,
        '{"unlimited": true}'::jsonb as usage_limits
    FROM generate_series(1, 16)
) p, (SELECT gen_random_uuid() as id) as u
ON CONFLICT DO NOTHING;

COMMIT;