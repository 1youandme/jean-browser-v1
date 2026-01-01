-- Jean Model Hub & Local Hub Schema
-- Comprehensive model management and P2P local communication

-- Model Hub Tables
CREATE TYPE model_backend AS ENUM ('local', 'cloud', 'colab', 'api', 'hybrid');
CREATE TYPE model_status AS ENUM ('active', 'inactive', 'loading', 'error', 'updating');
CREATE TYPE model_type AS ENUM ('llm', 'tts', 'stt', 'vision', 'embedding', 'translation');

-- Model registry for all AI models
CREATE TABLE IF NOT EXISTS jean_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    display_name VARCHAR(300),
    description TEXT,
    
    -- Model identification
    model_type model_type NOT NULL,
    backend model_backend NOT NULL,
    model_id VARCHAR(200), -- External model ID
    version VARCHAR(50),
    provider VARCHAR(100), -- openai, anthropic, huggingface, local, etc.
    
    -- Capabilities and settings
    capabilities JSONB DEFAULT '[]', -- Array of capabilities
    parameters JSONB DEFAULT '{}', -- Model-specific parameters
    max_tokens INTEGER DEFAULT 2048,
    supports_streaming BOOLEAN DEFAULT FALSE,
    supports_vision BOOLEAN DEFAULT FALSE,
    supports_audio BOOLEAN DEFAULT FALSE,
    
    -- Performance metrics
    quality_score DECIMAL(3,2),
    speed_score DECIMAL(3,2),
    cost_per_token DECIMAL(10,8),
    avg_response_time_ms INTEGER,
    success_rate DECIMAL(3,2),
    
    -- Resource requirements
    memory_required_gb DECIMAL(8,2),
    gpu_memory_required_gb DECIMAL(8,2),
    cpu_cores_required INTEGER,
    disk_space_required_gb DECIMAL(8,2),
    
    -- Language support
    supported_languages TEXT[] DEFAULT '{}',
    primary_language VARCHAR(10),
    
    -- Status and availability
    status model_status DEFAULT 'inactive',
    is_default BOOLEAN DEFAULT FALSE,
    is_premium BOOLEAN DEFAULT FALSE,
    auto_load BOOLEAN DEFAULT FALSE,
    
    -- Configuration
    endpoint_url VARCHAR(1000),
    api_key_required BOOLEAN DEFAULT FALSE,
    auth_method VARCHAR(50), -- api_key, oauth, custom
    
    -- Metadata
    tags TEXT[] DEFAULT '{}',
    category VARCHAR(100),
    license VARCHAR(100),
    model_size_gb DECIMAL(8,2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(name, version)
);

-- Model instances (running instances of models)
CREATE TABLE IF NOT EXISTS jean_model_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id UUID NOT NULL REFERENCES jean_models(id) ON DELETE CASCADE,
    instance_name VARCHAR(200) NOT NULL,
    
    -- Instance configuration
    config JSONB DEFAULT '{}', -- Instance-specific configuration
    allocated_resources JSONB DEFAULT '{}', -- CPU, GPU, memory allocation
    
    -- Runtime status
    is_running BOOLEAN DEFAULT FALSE,
    pid INTEGER, -- Process ID for local models
    port INTEGER, -- Port number for local services
    host VARCHAR(255) DEFAULT 'localhost',
    
    -- Performance tracking
    current_load DECIMAL(3,2), -- Current usage 0.0-1.0
    total_requests INTEGER DEFAULT 0,
    total_tokens_processed BIGINT DEFAULT 0,
    uptime_seconds BIGINT DEFAULT 0,
    
    -- Health monitoring
    last_health_check TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    health_status VARCHAR(20) DEFAULT 'unknown', -- healthy, degraded, unhealthy
    error_count INTEGER DEFAULT 0,
    last_error TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(instance_name)
);

-- Model usage statistics
CREATE TABLE IF NOT EXISTS jean_model_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id UUID NOT NULL REFERENCES jean_models(id) ON DELETE CASCADE,
    instance_id UUID REFERENCES jean_model_instances(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Request details
    session_id VARCHAR(255),
    request_type VARCHAR(50), -- chat, completion, embedding, etc.
    input_tokens INTEGER,
    output_tokens INTEGER,
    
    -- Performance metrics
    response_time_ms INTEGER,
    queue_time_ms INTEGER,
    processing_time_ms INTEGER,
    
    -- Cost tracking
    cost_cents DECIMAL(10,4),
    
    -- Quality metrics
    success BOOLEAN,
    error_type VARCHAR(100),
    error_message TEXT,
    user_rating INTEGER, -- 1-5 stars
    
    -- Context
    context JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Local Hub Tables (P2P Communication)

-- P2P rooms for local communication
CREATE TABLE IF NOT EXISTS local_hub_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id VARCHAR(100) UNIQUE NOT NULL, -- Human-readable room ID
    room_name VARCHAR(200),
    description TEXT,
    
    -- Room configuration
    is_public BOOLEAN DEFAULT FALSE,
    requires_password BOOLEAN DEFAULT FALSE,
    password_hash VARCHAR(255),
    max_participants INTEGER DEFAULT 10,
    
    -- Creator and ownership
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Features
    enable_file_sharing BOOLEAN DEFAULT TRUE,
    enable_voice_chat BOOLEAN DEFAULT FALSE,
    enable_screen_sharing BOOLEAN DEFAULT FALSE,
    
    -- Statistics
    participant_count INTEGER DEFAULT 0,
    message_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE -- Auto-expiration
);

-- Room participants
CREATE TABLE IF NOT EXISTS local_hub_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES local_hub_rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Participant details
    display_name VARCHAR(100),
    avatar_url VARCHAR(1000),
    is_moderator BOOLEAN DEFAULT FALSE,
    is_speaking BOOLEAN DEFAULT FALSE,
    
    -- Connection details
    peer_id VARCHAR(255) UNIQUE NOT NULL, -- WebRTC peer ID
    connection_status VARCHAR(20) DEFAULT 'connecting', -- connected, connecting, disconnected
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Capabilities
    can_send_audio BOOLEAN DEFAULT TRUE,
    can_send_video BOOLEAN DEFAULT TRUE,
    can_share_screen BOOLEAN DEFAULT FALSE,
    
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    left_at TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(room_id, user_id)
);

-- Local messages
CREATE TABLE IF NOT EXISTS local_hub_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES local_hub_rooms(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES local_hub_participants(id) ON DELETE CASCADE,
    
    -- Message content
    message_type VARCHAR(50) DEFAULT 'text', -- text, file, image, audio, video, system
    content TEXT NOT NULL,
    content_url VARCHAR(1000), -- For file/image messages
    
    -- Message metadata
    reply_to_id UUID REFERENCES local_hub_messages(id) ON DELETE SET NULL,
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMP WITH TIME ZONE,
    
    -- Delivery status
    is_delivered BOOLEAN DEFAULT FALSE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- File sharing in local hub
CREATE TABLE IF NOT EXISTS local_hub_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES local_hub_rooms(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- File details
    file_name VARCHAR(500) NOT NULL,
    file_path VARCHAR(1000) NOT NULL,
    file_size BIGINT,
    file_type VARCHAR(100),
    mime_type VARCHAR(200),
    
    -- File metadata
    thumbnail_url VARCHAR(1000),
    preview_url VARCHAR(1000),
    download_count INTEGER DEFAULT 0,
    
    -- Sharing permissions
    is_public BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- WebRTC signaling messages
CREATE TABLE IF NOT EXISTS webrtc_signaling (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES local_hub_rooms(id) ON DELETE CASCADE,
    from_peer_id VARCHAR(255) NOT NULL,
    to_peer_id VARCHAR(255) NOT NULL,
    
    -- Signaling data
    signal_type VARCHAR(50) NOT NULL, -- offer, answer, ice-candidate, room-join, room-leave
    signal_data JSONB NOT NULL,
    
    -- Message tracking
    is_processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_jean_models_type ON jean_models(model_type);
CREATE INDEX IF NOT EXISTS idx_jean_models_backend ON jean_models(backend);
CREATE INDEX IF NOT EXISTS idx_jean_models_status ON jean_models(status);
CREATE INDEX IF NOT EXISTS idx_jean_models_default ON jean_models(is_default) WHERE is_default = TRUE;

CREATE INDEX IF NOT EXISTS idx_jean_model_instances_model_id ON jean_model_instances(model_id);
CREATE INDEX IF NOT EXISTS idx_jean_model_instances_running ON jean_model_instances(is_running) WHERE is_running = TRUE;

CREATE INDEX IF NOT EXISTS idx_jean_model_usage_model_id ON jean_model_usage(model_id);
CREATE INDEX IF NOT EXISTS idx_jean_model_usage_user_id ON jean_model_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_jean_model_usage_created ON jean_model_usage(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_local_hub_rooms_public ON local_hub_rooms(is_public, is_active) WHERE is_public = TRUE AND is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_local_hub_rooms_created_by ON local_hub_rooms(created_by);
CREATE INDEX IF NOT EXISTS idx_local_hub_rooms_expires ON local_hub_rooms(expires_at) WHERE expires_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_local_hub_participants_room_id ON local_hub_participants(room_id);
CREATE INDEX IF NOT EXISTS idx_local_hub_participants_user_id ON local_hub_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_local_hub_participants_peer_id ON local_hub_participants(peer_id);

CREATE INDEX IF NOT EXISTS idx_local_hub_messages_room_id ON local_hub_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_local_hub_messages_participant_id ON local_hub_messages(participant_id);
CREATE INDEX IF NOT EXISTS idx_local_hub_messages_created ON local_hub_messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_webrtc_signaling_room_id ON webrtc_signaling(room_id);
CREATE INDEX IF NOT EXISTS idx_webrtc_signaling_from_peer ON webrtc_signaling(from_peer_id);
CREATE INDEX IF NOT EXISTS idx_webrtc_signaling_to_peer ON webrtc_signaling(to_peer_id);
CREATE INDEX IF NOT EXISTS idx_webrtc_signaling_unprocessed ON webrtc_signaling(is_processed) WHERE is_processed = FALSE;

-- Insert default models
INSERT INTO jean_models (
    name, display_name, description, model_type, backend, provider,
    capabilities, max_tokens, supports_streaming, is_default, status
) VALUES 
(
    'gpt-4-turbo',
    'GPT-4 Turbo',
    'OpenAI''s most capable model for complex tasks',
    'llm',
    'cloud',
    'openai',
    '["chat", "completion", "function_calling", "vision"]'::jsonb,
    4096,
    TRUE,
    TRUE,
    'active'
),
(
    'claude-3-sonnet',
    'Claude 3 Sonnet',
    'Anthropic''s balanced model for conversation and analysis',
    'llm',
    'cloud',
    'anthropic',
    '["chat", "completion", "analysis"]'::jsonb,
    4096,
    TRUE,
    FALSE,
    'active'
),
(
    'llama-3-70b',
    'Llama 3 70B',
    'Meta''s open-source large language model',
    'llm',
    'local',
    'meta',
    '["chat", "completion"]'::jsonb,
    4096,
    TRUE,
    FALSE,
    'inactive'
),
(
    'whisper-large-v3',
    'Whisper Large v3',
    'OpenAI''s speech-to-text model',
    'stt',
    'cloud',
    'openai',
    '["transcription", "translation"]'::jsonb,
    NULL,
    FALSE,
    TRUE,
    'active'
),
(
    'tts-1-hd',
    'TTS-1 HD',
    'OpenAI''s high-quality text-to-speech model',
    'tts',
    'cloud',
    'openai',
    '["speech_synthesis"]'::jsonb,
    NULL,
    FALSE,
    TRUE,
    'active'
)
ON CONFLICT (name, version) DO NOTHING;

-- Function to get best model for task
CREATE OR REPLACE FUNCTION get_best_model(
    p_model_type model_type,
    p_capabilities TEXT[] DEFAULT NULL,
    p_user_id UUID DEFAULT NULL,
    p_prefer_local BOOLEAN DEFAULT FALSE
)
RETURNS TABLE(
    model_id UUID,
    model_name VARCHAR,
    backend model_backend,
    quality_score DECIMAL,
    cost_per_token DECIMAL,
    is_default BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.name,
        m.backend,
        m.quality_score,
        m.cost_per_token,
        m.is_default
    FROM jean_models m
    WHERE m.model_type = p_model_type
        AND m.status = 'active'
        AND (p_capabilities IS NULL OR m.capabilities @> p_capabilities)
        AND (NOT p_prefer_local OR m.backend = 'local' OR m.backend = 'hybrid')
    ORDER BY 
        CASE WHEN m.is_default = TRUE THEN 1 ELSE 2 END,
        CASE WHEN p_prefer_local AND m.backend IN ('local', 'hybrid') THEN 1 ELSE 2 END,
        m.quality_score DESC NULLS LAST,
        m.cost_per_token ASC NULLS LAST
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to log model usage
CREATE OR REPLACE FUNCTION log_model_usage(
    p_model_id UUID,
    p_user_id UUID,
    p_request_type VARCHAR,
    p_input_tokens INTEGER DEFAULT NULL,
    p_output_tokens INTEGER DEFAULT NULL,
    p_response_time_ms INTEGER DEFAULT NULL,
    p_cost_cents DECIMAL DEFAULT NULL,
    p_success BOOLEAN DEFAULT TRUE,
    p_error_message TEXT DEFAULT NULL,
    p_session_id VARCHAR DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO jean_model_usage (
        model_id, user_id, request_type, input_tokens, output_tokens,
        response_time_ms, cost_cents, success, error_message, session_id
    ) VALUES (
        p_model_id, p_user_id, p_request_type, p_input_tokens, p_output_tokens,
        p_response_time_ms, p_cost_cents, p_success, p_error_message, p_session_id
    );
    
    -- Update model usage statistics
    UPDATE jean_models 
    SET 
        total_requests = COALESCE(total_requests, 0) + 1,
        total_tokens_processed = COALESCE(total_tokens_processed, 0) + 
            COALESCE(p_input_tokens, 0) + COALESCE(p_output_tokens, 0),
        last_used_at = NOW()
    WHERE id = p_model_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create local room
CREATE OR REPLACE FUNCTION create_local_room(
    p_room_id VARCHAR,
    p_room_name VARCHAR,
    p_description TEXT DEFAULT NULL,
    p_created_by UUID,
    p_is_public BOOLEAN DEFAULT FALSE,
    p_requires_password BOOLEAN DEFAULT FALSE,
    p_password_hash VARCHAR DEFAULT NULL,
    p_max_participants INTEGER DEFAULT 10,
    p_expires_hours INTEGER DEFAULT 24
)
RETURNS UUID AS $$
DECLARE
    v_room_id UUID;
BEGIN
    INSERT INTO local_hub_rooms (
        room_id, room_name, description, created_by, is_public,
        requires_password, password_hash, max_participants, expires_at
    ) VALUES (
        p_room_id, p_room_name, p_description, p_created_by, p_is_public,
        p_requires_password, p_password_hash, p_max_participants,
        NOW() + (p_expires_hours || ' hours')::INTERVAL
    )
    RETURNING id INTO v_room_id;
    
    RETURN v_room_id;
END;
$$ LANGUAGE plpgsql;

-- Function to join room
CREATE OR REPLACE FUNCTION join_local_room(
    p_room_id UUID,
    p_user_id UUID,
    p_display_name VARCHAR,
    p_peer_id VARCHAR
)
RETURNS UUID AS $$
DECLARE
    v_participant_id UUID;
    v_current_count INTEGER;
BEGIN
    -- Check if room is full
    SELECT COUNT(*) INTO v_current_count
    FROM local_hub_participants 
    WHERE room_id = p_room_id AND left_at IS NULL;
    
    IF v_current_count >= (SELECT max_participants FROM local_hub_rooms WHERE id = p_room_id) THEN
        RAISE EXCEPTION 'Room is full';
    END IF;
    
    -- Add participant
    INSERT INTO local_hub_participants (
        room_id, user_id, display_name, peer_id, connection_status
    ) VALUES (
        p_room_id, p_user_id, p_display_name, p_peer_id, 'connected'
    )
    RETURNING id INTO v_participant_id;
    
    -- Update participant count
    UPDATE local_hub_rooms 
    SET participant_count = participant_count + 1,
        updated_at = NOW()
    WHERE id = p_room_id;
    
    RETURN v_participant_id;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired rooms and old messages
CREATE OR REPLACE FUNCTION cleanup_local_hub()
RETURNS INTEGER AS $$
DECLARE
    v_cleanup_count INTEGER := 0;
BEGIN
    -- Delete expired rooms
    DELETE FROM local_hub_rooms 
    WHERE expires_at <= NOW()
        AND is_active = FALSE;
    
    GET DIAGNOSTICS v_cleanup_count = ROW_COUNT;
    
    -- Delete old signaling messages (older than 1 hour)
    DELETE FROM webrtc_signaling 
    WHERE created_at < NOW() - INTERVAL '1 hour'
        AND is_processed = TRUE;
    
    GET DIAGNOSTICS v_cleanup_count = v_cleanup_count + ROW_COUNT;
    
    RETURN v_cleanup_count;
END;
$$ LANGUAGE plpgsql;