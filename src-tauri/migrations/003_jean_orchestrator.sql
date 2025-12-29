-- Jean Orchestrator Database Schema
-- Migration 003: Jean AI Core Tables

-- Jean Memory Store
CREATE TABLE jean_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    memory_type VARCHAR(50) NOT NULL CHECK (memory_type IN ('conversation', 'knowledge', 'preference', 'context')),
    content JSONB NOT NULL,
    context_tags TEXT[],
    session_id VARCHAR(100),
    is_private BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for memory table
CREATE INDEX idx_jean_memory_user_id ON jean_memory(user_id);
CREATE INDEX idx_jean_memory_type ON jean_memory(memory_type);
CREATE INDEX idx_jean_memory_tags ON jean_memory USING GIN(context_tags);
CREATE INDEX idx_jean_memory_session ON jean_memory(session_id);
CREATE INDEX idx_jean_memory_created ON jean_memory(created_at);

-- Jean Permissions System
CREATE TABLE jean_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    action_type VARCHAR(50) NOT NULL,
    scope VARCHAR(255) NOT NULL,
    max_amount DECIMAL(10,2),
    usage_count INTEGER DEFAULT 0,
    max_usage INTEGER,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE
);

-- Indexes for permissions
CREATE INDEX idx_jean_permissions_user ON jean_permissions(user_id);
CREATE INDEX idx_jean_permissions_action ON jean_permissions(action_type);
CREATE INDEX idx_jean_permissions_active ON jean_permissions(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_jean_permissions_expires ON jean_permissions(expires_at);

-- Jean Actions Log
CREATE TABLE jean_actions_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    session_id VARCHAR(100),
    action_type VARCHAR(100) NOT NULL,
    action_data JSONB NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'confirmed', 'executed', 'cancelled', 'failed')),
    confirmation_required BOOLEAN DEFAULT FALSE,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    executed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    result_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for actions log
CREATE INDEX idx_jean_actions_user ON jean_actions_log(user_id);
CREATE INDEX idx_jean_actions_session ON jean_actions_log(session_id);
CREATE INDEX idx_jean_actions_status ON jean_actions_log(status);
CREATE INDEX idx_jean_actions_created ON jean_actions_log(created_at);

-- Docker Container Status
CREATE TABLE docker_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    container_name VARCHAR(255) NOT NULL UNIQUE,
    container_id VARCHAR(100),
    image_name VARCHAR(255),
    status VARCHAR(20) NOT NULL CHECK (status IN ('running', 'stopped', 'error', 'restarting', 'paused')),
    cpu_usage DECIMAL(5,2),
    memory_usage BIGINT,
    memory_limit BIGINT,
    network_rx BIGINT,
    network_tx BIGINT,
    health_status VARCHAR(20) DEFAULT 'unknown',
    last_checked TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for docker status
CREATE INDEX idx_docker_status_name ON docker_status(container_name);
CREATE INDEX idx_docker_status_status ON docker_status(status);
CREATE INDEX idx_docker_status_health ON docker_status(health_status);
CREATE INDEX idx_docker_status_checked ON docker_status(last_checked);

-- TRAE Agents Registry
CREATE TABLE tra_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    agent_type VARCHAR(50) NOT NULL,
    endpoint VARCHAR(500),
    capabilities JSONB,
    status VARCHAR(20) DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'busy', 'error', 'maintenance')),
    config JSONB,
    last_heartbeat TIMESTAMP WITH TIME ZONE,
    version VARCHAR(20),
    documentation_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for TRAE agents
CREATE INDEX idx_tra_agents_type ON tra_agents(agent_type);
CREATE INDEX idx_tra_agents_status ON tra_agents(status);
CREATE INDEX idx_tra_agents_heartbeat ON tra_agents(last_heartbeat);

-- Jean User Preferences
CREATE TABLE jean_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) UNIQUE,
    initiative_level VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (initiative_level IN ('low', 'medium', 'high')),
    language VARCHAR(10) DEFAULT 'en',
    theme VARCHAR(20) DEFAULT 'auto',
    privacy_settings JSONB DEFAULT '{}',
    notification_settings JSONB DEFAULT '{}',
    tra_agent_preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Jean Knowledge Base
CREATE TABLE jean_knowledge_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    title VARCHAR(500) NOT NULL,
    content JSONB NOT NULL,
    content_type VARCHAR(20) DEFAULT 'markdown' CHECK (content_type IN ('markdown', 'json', 'text', 'code')),
    tags TEXT[],
    is_public BOOLEAN DEFAULT TRUE,
    is_system BOOLEAN DEFAULT FALSE,
    version INTEGER DEFAULT 1,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for knowledge base
CREATE INDEX idx_jean_knowledge_category ON jean_knowledge_base(category);
CREATE INDEX idx_jean_knowledge_tags ON jean_knowledge_base USING GIN(tags);
CREATE INDEX idx_jean_knowledge_public ON jean_knowledge_base(is_public) WHERE is_public = TRUE;

-- Jean Session Context
CREATE TABLE jean_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    session_id VARCHAR(100) NOT NULL UNIQUE,
    context JSONB DEFAULT '{}',
    active_strips JSONB DEFAULT '[]', -- Active browser strips
    current_workspace UUID REFERENCES workspaces(id),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for sessions
CREATE INDEX idx_jean_sessions_user ON jean_sessions(user_id);
CREATE INDEX idx_jean_sessions_session_id ON jean_sessions(session_id);
CREATE INDEX idx_jean_sessions_activity ON jean_sessions(last_activity);
CREATE INDEX idx_jean_sessions_expires ON jean_sessions(expires_at);

-- Jean Integration Logs
CREATE TABLE jean_integration_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    integration_type VARCHAR(50) NOT NULL, -- docker, tra_agent, external_api
    integration_id VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    request_data JSONB,
    response_data JSONB,
    status VARCHAR(20) NOT NULL,
    error_message TEXT,
    duration_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for integration logs
CREATE INDEX idx_jean_integration_user ON jean_integration_logs(user_id);
CREATE INDEX idx_jean_integration_type ON jean_integration_logs(integration_type);
CREATE INDEX idx_jean_integration_created ON jean_integration_logs(created_at);

-- Jean Scheduled Tasks
CREATE TABLE jean_scheduled_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id), -- NULL for system tasks
    task_type VARCHAR(50) NOT NULL,
    task_data JSONB NOT NULL,
    schedule_expression VARCHAR(100), -- cron expression
    next_run TIMESTAMP WITH TIME ZONE,
    last_run TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'running', 'completed', 'failed', 'cancelled')),
    run_count INTEGER DEFAULT 0,
    max_runs INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for scheduled tasks
CREATE INDEX idx_jean_tasks_user ON jean_scheduled_tasks(user_id);
CREATE INDEX idx_jean_tasks_type ON jean_scheduled_tasks(task_type);
CREATE INDEX idx_jean_tasks_next_run ON jean_scheduled_tasks(next_run);
CREATE INDEX idx_jean_tasks_status ON jean_scheduled_tasks(status);

-- Update timestamp functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_jean_memory_updated_at BEFORE UPDATE ON jean_memory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_docker_status_updated_at BEFORE UPDATE ON docker_status FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tra_agents_updated_at BEFORE UPDATE ON tra_agents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_jean_preferences_updated_at BEFORE UPDATE ON jean_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_jean_knowledge_base_updated_at BEFORE UPDATE ON jean_knowledge_base FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();