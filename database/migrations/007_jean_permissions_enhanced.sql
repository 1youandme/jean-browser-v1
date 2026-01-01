-- Enhanced Jean Permissions System
-- Comprehensive permission management with templates, delegation, and analytics

-- Permission types definition
CREATE TYPE jean_permission_type AS ENUM (
    'filesystem_read', 'filesystem_write', 'filesystem_delete',
    'browser_navigation', 'browser_tab_management', 'browser_download',
    'proxy_control', 'proxy_node_management', 'proxy_session_management',
    'ecommerce_view', 'ecommerce_edit', 'ecommerce_pricing', 'ecommerce_orders',
    'video_jobs_create', 'video_jobs_execute', 'video_jobs_delete',
    'system_monitor', 'system_control', 'docker_management',
    'user_management', 'security_admin', 'analytics_view',
    'memory_read', 'memory_write', 'memory_delete', 'memory_search'
);

-- Enhanced permissions table with better structure
CREATE TABLE IF NOT EXISTS jean_permissions_enhanced (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Permission definition
    permission_type jean_permission_type NOT NULL,
    scope VARCHAR(255) NOT NULL DEFAULT 'global', -- global, specific_path, specific_resource
    resource_id UUID, -- Specific resource ID if scope is specific
    
    -- Permission limits
    max_amount DECIMAL(15,2), -- For financial permissions
    usage_count INTEGER DEFAULT 0,
    max_usage INTEGER, -- Maximum number of uses
    time_limit_minutes INTEGER, -- Time limit in minutes
    
    -- Delegation support
    delegated_by UUID REFERENCES users(id),
    delegation_reason TEXT,
    can_delegate BOOLEAN DEFAULT FALSE,
    
    -- Context restrictions
    allowed_paths TEXT[], -- Specific paths for filesystem permissions
    allowed_domains TEXT[], -- Specific domains for browser permissions
    time_restrictions JSONB, -- Time-based restrictions (hours, days)
    
    -- Status and lifecycle
    is_active BOOLEAN DEFAULT TRUE,
    is_template BOOLEAN DEFAULT FALSE,
    template_name VARCHAR(255),
    
    -- Audit
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    usage_analytics JSONB DEFAULT '{}', -- Detailed usage analytics
    
    -- Metadata
    description TEXT,
    risk_level VARCHAR(20) DEFAULT 'medium', -- low, medium, high, critical
    auto_revoke BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, permission_type, scope, COALESCE(resource_id, '00000000-0000-0000-0000-000000000000'::uuid))
);

-- Permission templates for quick setup
CREATE TABLE IF NOT EXISTS jean_permission_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB NOT NULL, -- Array of permission configurations
    is_system_template BOOLEAN DEFAULT FALSE,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Permission request logs
CREATE TABLE IF NOT EXISTS jean_permission_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    requested_permission_type jean_permission_type NOT NULL,
    requested_scope VARCHAR(255),
    requested_resource_id UUID,
    reason TEXT NOT NULL,
    context JSONB DEFAULT '{}', -- Context of the request
    
    -- Request status
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, denied, expired
    reviewed_by UUID REFERENCES users(id),
    review_notes TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    
    -- Auto-approval settings
    auto_approved BOOLEAN DEFAULT FALSE,
    approval_conditions JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Permission usage analytics
CREATE TABLE IF NOT EXISTS jean_permission_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    permission_id UUID NOT NULL REFERENCES jean_permissions_enhanced(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Usage details
    action_type VARCHAR(100) NOT NULL,
    action_data JSONB DEFAULT '{}',
    success BOOLEAN NOT NULL,
    error_message TEXT,
    
    -- Context
    session_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    
    -- Performance
    execution_time_ms INTEGER,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Permission alerts and notifications
CREATE TABLE IF NOT EXISTS jean_permission_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES jean_permissions_enhanced(id) ON DELETE CASCADE,
    
    -- Alert details
    alert_type VARCHAR(50) NOT NULL, -- usage_limit, expiry, suspicious_activity, high_risk_action
    severity VARCHAR(20) DEFAULT 'medium', -- low, medium, high, critical
    message TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    
    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    is_acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_jean_permissions_enhanced_user_id ON jean_permissions_enhanced(user_id);
CREATE INDEX IF NOT EXISTS idx_jean_permissions_enhanced_type ON jean_permissions_enhanced(permission_type);
CREATE INDEX IF NOT EXISTS idx_jean_permissions_enhanced_active ON jean_permissions_enhanced(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_jean_permissions_enhanced_expires ON jean_permissions_enhanced(expires_at);
CREATE INDEX IF NOT EXISTS idx_jean_permissions_enhanced_delegated ON jean_permissions_enhanced(delegated_by);
CREATE INDEX IF NOT EXISTS idx_jean_permissions_enhanced_template ON jean_permissions_enhanced(is_template) WHERE is_template = TRUE;

CREATE INDEX IF NOT EXISTS idx_jean_permission_requests_user_id ON jean_permission_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_jean_permission_requests_status ON jean_permission_requests(status);
CREATE INDEX IF NOT EXISTS idx_jean_permission_requests_created ON jean_permission_requests(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_jean_permission_usage_permission_id ON jean_permission_usage(permission_id);
CREATE INDEX IF NOT EXISTS idx_jean_permission_usage_user_id ON jean_permission_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_jean_permission_usage_created ON jean_permission_usage(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jean_permission_usage_success ON jean_permission_usage(success);

CREATE INDEX IF NOT EXISTS idx_jean_permission_alerts_user_id ON jean_permission_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_jean_permission_alerts_unread ON jean_permission_alerts(is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_jean_permission_alerts_severity ON jean_permission_alerts(severity);

-- Insert system permission templates
INSERT INTO jean_permission_templates (name, description, permissions, is_system_template)
VALUES 
(
    'Basic Browser Access',
    'Allow basic web browsing and navigation',
    '[
        {
            "permission_type": "browser_navigation",
            "scope": "global",
            "max_usage": null,
            "time_limit_minutes": null,
            "risk_level": "low"
        },
        {
            "permission_type": "browser_tab_management",
            "scope": "global",
            "max_usage": 50,
            "time_limit_minutes": 60,
            "risk_level": "low"
        }
    ]'::jsonb,
    true
),
(
    'File System Read',
    'Read access to local file system',
    '[
        {
            "permission_type": "filesystem_read",
            "scope": "specific_path",
            "allowed_paths": ["/home/user/Documents", "/home/user/Downloads"],
            "risk_level": "medium"
        }
    ]'::jsonb,
    true
),
(
    'E-commerce Manager',
    'Full e-commerce management capabilities',
    '[
        {
            "permission_type": "ecommerce_view",
            "scope": "global",
            "risk_level": "medium"
        },
        {
            "permission_type": "ecommerce_edit",
            "scope": "global",
            "risk_level": "medium"
        },
        {
            "permission_type": "ecommerce_pricing",
            "scope": "global",
            "max_amount": 10000.00,
            "risk_level": "high"
        },
        {
            "permission_type": "ecommerce_orders",
            "scope": "global",
            "risk_level": "medium"
        }
    ]'::jsonb,
    true
),
(
    'System Administrator',
    'Full system administration privileges',
    '[
        {
            "permission_type": "system_control",
            "scope": "global",
            "risk_level": "critical"
        },
        {
            "permission_type": "docker_management",
            "scope": "global",
            "risk_level": "high"
        },
        {
            "permission_type": "user_management",
            "scope": "global",
            "risk_level": "critical"
        },
        {
            "permission_type": "security_admin",
            "scope": "global",
            "risk_level": "critical"
        }
    ]'::jsonb,
    true
),
(
    'Jean AI Assistant',
    'Basic Jean AI assistant permissions',
    '[
        {
            "permission_type": "memory_read",
            "scope": "global",
            "risk_level": "low"
        },
        {
            "permission_type": "memory_write",
            "scope": "global",
            "risk_level": "low"
        },
        {
            "permission_type": "browser_navigation",
            "scope": "global",
            "risk_level": "low"
        },
        {
            "permission_type": "filesystem_read",
            "scope": "specific_path",
            "allowed_paths": ["/home/user"],
            "risk_level": "low"
        }
    ]'::jsonb,
    true
)
ON CONFLICT (name) DO NOTHING;

-- Create function to check permission with enhanced logic
CREATE OR REPLACE FUNCTION check_permission_enhanced(
    p_user_id UUID,
    p_permission_type jean_permission_type,
    p_scope VARCHAR DEFAULT 'global',
    p_resource_id UUID DEFAULT NULL,
    p_action_data JSONB DEFAULT '{}'
)
RETURNS TABLE(
    has_permission BOOLEAN,
    permission_id UUID,
    remaining_uses INTEGER,
    expires_at TIMESTAMP WITH TIME ZONE,
    risk_level VARCHAR,
    requires_confirmation BOOLEAN
) AS $$
DECLARE
    v_permission_id UUID;
    v_remaining_uses INTEGER;
    v_expires_at TIMESTAMP WITH TIME ZONE;
    v_risk_level VARCHAR;
    v_requires_confirmation BOOLEAN;
    v_amount DECIMAL(15,2);
BEGIN
    -- Get the most relevant permission
    SELECT id, 
           CASE 
               WHEN max_usage IS NOT NULL THEN max_usage - usage_count 
               ELSE NULL 
           END as remaining_uses,
           expires_at,
           risk_level,
           CASE 
               WHEN risk_level IN ('high', 'critical') OR max_amount IS NOT NULL THEN TRUE
               ELSE FALSE
           END as requires_confirmation
    INTO v_permission_id, v_remaining_uses, v_expires_at, v_risk_level, v_requires_confirmation
    FROM jean_permissions_enhanced 
    WHERE user_id = p_user_id 
        AND permission_type = p_permission_type
        AND is_active = TRUE
        AND (expires_at IS NULL OR expires_at > NOW())
    ORDER BY 
        CASE WHEN scope = 'specific_resource' AND resource_id = p_resource_id THEN 1
             WHEN scope = 'specific_path' THEN 2
             WHEN scope = 'global' THEN 3
             ELSE 4 END,
        created_at DESC
    LIMIT 1;
    
    -- Check if permission exists and is valid
    IF v_permission_id IS NULL THEN
        RETURN QUERY SELECT FALSE, NULL, NULL, NULL, NULL, FALSE;
        RETURN;
    END IF;
    
    -- Check usage limits
    IF v_remaining_uses IS NOT NULL AND v_remaining_uses <= 0 THEN
        RETURN QUERY SELECT FALSE, v_permission_id, 0, v_expires_at, v_risk_level, FALSE;
        RETURN;
    END IF;
    
    -- Check financial limits if applicable
    IF p_action_data ? 'amount' THEN
        v_amount := (p_action_data->>'amount')::DECIMAL(15,2);
        
        PERFORM 1 FROM jean_permissions_enhanced 
        WHERE id = v_permission_id 
            AND (max_amount IS NULL OR v_amount <= max_amount);
        
        IF NOT FOUND THEN
            RETURN QUERY SELECT FALSE, v_permission_id, v_remaining_uses, v_expires_at, v_risk_level, FALSE;
            RETURN;
        END IF;
    END IF;
    
    -- Permission is granted
    RETURN QUERY SELECT TRUE, v_permission_id, v_remaining_uses, v_expires_at, v_risk_level, v_requires_confirmation;
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- Function to log permission usage
CREATE OR REPLACE FUNCTION log_permission_usage(
    p_permission_id UUID,
    p_user_id UUID,
    p_action_type VARCHAR,
    p_action_data JSONB DEFAULT '{}',
    p_success BOOLEAN DEFAULT TRUE,
    p_error_message TEXT DEFAULT NULL,
    p_session_id VARCHAR DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_execution_time_ms INTEGER DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO jean_permission_usage (
        permission_id, user_id, action_type, action_data, success, 
        error_message, session_id, ip_address, user_agent, execution_time_ms
    ) VALUES (
        p_permission_id, p_user_id, p_action_type, p_action_data, p_success,
        p_error_message, p_session_id, p_ip_address, p_user_agent, p_execution_time_ms
    );
    
    -- Update permission usage count and last used timestamp
    UPDATE jean_permissions_enhanced 
    SET usage_count = usage_count + 1,
        last_used_at = NOW()
    WHERE id = p_permission_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create permission from template
CREATE OR REPLACE FUNCTION create_permissions_from_template(
    p_user_id UUID,
    p_template_name VARCHAR,
    p_granted_by UUID DEFAULT NULL,
    p_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    v_template JSONB;
    v_permission JSONB;
    v_count INTEGER := 0;
BEGIN
    -- Get template
    SELECT permissions INTO v_template
    FROM jean_permission_templates 
    WHERE name = p_template_name;
    
    IF v_template IS NULL THEN
        RAISE EXCEPTION 'Template not found: %', p_template_name;
    END IF;
    
    -- Create permissions from template
    FOR v_permission IN SELECT * FROM jsonb_array_elements(v_template)
    LOOP
        INSERT INTO jean_permissions_enhanced (
            user_id, permission_type, scope, resource_id, max_amount, max_usage,
            time_limit_minutes, allowed_paths, allowed_domains, risk_level,
            delegated_by, expires_at, description
        ) VALUES (
            p_user_id,
            v_permission->>'permission_type',
            COALESCE(v_permission->>'scope', 'global'),
            (v_permission->>'resource_id')::UUID,
            (v_permission->>'max_amount')::DECIMAL(15,2),
            (v_permission->>'max_usage')::INTEGER,
            (v_permission->>'time_limit_minutes')::INTEGER,
            v_permission->'allowed_paths',
            v_permission->'allowed_domains',
            COALESCE(v_permission->>'risk_level', 'medium'),
            p_granted_by,
            p_expires_at,
            v_permission->>'description'
        );
        
        v_count := v_count + 1;
    END LOOP;
    
    -- Update template usage count
    UPDATE jean_permission_templates 
    SET usage_count = usage_count + 1 
    WHERE name = p_template_name;
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Trigger to clean up expired permissions
CREATE OR REPLACE FUNCTION cleanup_expired_permissions()
RETURNS TRIGGER AS $$
BEGIN
    -- Deactivate expired permissions
    UPDATE jean_permissions_enhanced 
    SET is_active = FALSE 
    WHERE expires_at <= NOW() AND is_active = TRUE;
    
    -- Clean up old usage logs (older than 90 days)
    DELETE FROM jean_permission_usage 
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    -- Clean up old alerts (older than 30 days)
    DELETE FROM jean_permission_alerts 
    WHERE created_at < NOW() - INTERVAL '30 days' AND is_read = TRUE;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup (would need pg_cron extension in production)
-- SELECT cron.schedule('cleanup-permissions', '0 2 * * *', 'SELECT cleanup_expired_permissions();');