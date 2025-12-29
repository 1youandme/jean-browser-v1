-- AI Knowledge Base Table
CREATE TABLE IF NOT EXISTS ai_knowledge_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(100) NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    tags TEXT[],
    embedding vector(1536), -- For semantic search
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT true
);

-- User AI Context Table
CREATE TABLE IF NOT EXISTS user_ai_context (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(255),
    context_key VARCHAR(255) NOT NULL,
    context_value TEXT,
    context_type VARCHAR(50) NOT NULL, -- 'preference', 'history', 'memory', etc.
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, session_id, context_key)
);

-- AI Chat History Table
CREATE TABLE IF NOT EXISTS ai_chat_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(255) NOT NULL,
    message_role VARCHAR(20) NOT NULL CHECK (message_role IN ('user', 'assistant', 'system')),
    message_content TEXT NOT NULL,
    model_used VARCHAR(100),
    tokens_used INTEGER,
    response_time_ms INTEGER,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    INDEX idx_chat_history_user (user_id),
    INDEX idx_chat_history_session (session_id),
    INDEX idx_chat_history_created (created_at)
);

-- AI Generated Content Table
CREATE TABLE IF NOT EXISTS ai_generated_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content_type VARCHAR(50) NOT NULL, -- 'image', 'video', 'audio', 'text'
    generation_type VARCHAR(50) NOT NULL, -- 'sdxl', 'cogvideox', 'whisper', 'tts', etc.
    prompt TEXT NOT NULL,
    parameters JSONB,
    file_path TEXT,
    file_size BIGINT,
    file_mime_type VARCHAR(100),
    generation_time_ms INTEGER,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    INDEX idx_generated_content_user (user_id),
    INDEX idx_generated_content_type (content_type),
    INDEX idx_generated_content_status (status)
);

-- AI Model Usage Statistics
CREATE TABLE IF NOT EXISTS ai_model_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    model_name VARCHAR(100) NOT NULL,
    endpoint VARCHAR(100) NOT NULL,
    request_type VARCHAR(50) NOT NULL, -- 'chat', 'analyze', 'translate', 'generate_image', etc.
    tokens_used INTEGER DEFAULT 0,
    processing_time_ms INTEGER,
    cache_hit BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    INDEX idx_model_usage_user (user_id),
    INDEX idx_model_usage_model (model_name),
    INDEX idx_model_usage_date (created_at)
);

-- AI User Preferences
CREATE TABLE IF NOT EXISTS ai_user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    preference_key VARCHAR(100) NOT NULL,
    preference_value TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, preference_key)
);

-- AI Training Data Table (for future fine-tuning)
CREATE TABLE IF NOT EXISTS ai_training_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    dataset_name VARCHAR(100) NOT NULL,
    input_data JSONB NOT NULL,
    expected_output JSONB,
    quality_score DECIMAL(3,2), -- 0.00 to 1.00
    is_approved BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    INDEX idx_training_data_dataset (dataset_name),
    INDEX idx_training_data_quality (quality_score)
);

-- Insert default knowledge base entries
INSERT INTO ai_knowledge_base (category, title, content, tags) VALUES
('system', 'JeanTrail OS Overview', 'JeanTrail OS is a cutting-edge operating system that integrates AI capabilities with traditional computing, featuring a conversational AI assistant named Jean.', ARRAY['jeantrail', 'os', 'ai', 'overview']),
('system', 'Jean Assistant Capabilities', 'Jean is an AI assistant powered by Qwen-3 that can help with text analysis, translation, image generation, video creation, and voice interactions.', ARRAY['jean', 'assistant', 'capabilities', 'ai']),
('system', 'Voice Commands', 'Jean supports voice commands for hands-free interaction. Simply click the microphone button or say "Hey Jean" to activate voice input.', ARRAY['voice', 'commands', 'interaction']),
('system', 'Privacy Features', 'All AI interactions are processed locally or through secure endpoints. Your data is never shared with third parties without explicit consent.', ARRAY['privacy', 'security', 'data']);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_base_category ON ai_knowledge_base(category);
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_base_tags ON ai_knowledge_base USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_base_active ON ai_knowledge_base(is_active);
CREATE INDEX IF NOT EXISTS idx_ai_context_user_session ON user_ai_context(user_id, session_id);
CREATE INDEX IF NOT EXISTS idx_ai_context_type ON user_ai_context(context_type);
CREATE INDEX IF NOT EXISTS idx_ai_user_preferences_user ON ai_user_preferences(user_id);

-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Create vector similarity search index for knowledge base
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_base_embedding ON ai_knowledge_base 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Create trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ai_knowledge_base_updated_at BEFORE UPDATE ON ai_knowledge_base FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_ai_context_updated_at BEFORE UPDATE ON user_ai_context FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_user_preferences_updated_at BEFORE UPDATE ON ai_user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default AI user preferences for existing users
INSERT INTO ai_user_preferences (user_id, preference_key, preference_value)
SELECT id, 'voice_enabled', 'true' FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM ai_user_preferences aup 
    WHERE aup.user_id = u.id AND aup.preference_key = 'voice_enabled'
);

INSERT INTO ai_user_preferences (user_id, preference_key, preference_value)
SELECT id, 'default_model', 'Qwen-3' FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM ai_user_preferences aup 
    WHERE aup.user_id = u.id AND aup.preference_key = 'default_model'
);

INSERT INTO ai_user_preferences (user_id, preference_key, preference_value)
SELECT id, 'auto_speak_responses', 'false' FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM ai_user_preferences aup 
    WHERE aup.user_id = u.id AND aup.preference_key = 'auto_speak_responses'
);