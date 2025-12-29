-- Jean Multilingual & Dialects System
-- Comprehensive language and dialect support for Jean AI

-- Supported languages
CREATE TYPE jean_language AS ENUM (
    'en', 'ar', 'es', 'zh', 'fr', 'de', 'ja', 'ko', 'pt', 'ru', 'it', 'hi'
);

-- Dialect variants for languages
CREATE TABLE IF NOT EXISTS jean_dialects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    language_code jean_language NOT NULL,
    dialect_code VARCHAR(10) NOT NULL, -- e.g., 'eg', 'sa', 'ae' for Arabic
    dialect_name VARCHAR(100) NOT NULL, -- e.g., 'Egyptian Arabic', 'Gulf Arabic'
    native_name VARCHAR(100) NOT NULL, -- e.g., 'العربية المصرية'
    region VARCHAR(100), -- e.g., 'Egypt', 'Gulf Region'
    is_default_dialect BOOLEAN DEFAULT FALSE,
    tts_voice_id VARCHAR(100), -- Text-to-speech voice identifier
    stt_model_id VARCHAR(100), -- Speech-to-text model identifier
    
    -- Cultural and linguistic preferences
    date_format VARCHAR(50) DEFAULT 'YYYY-MM-DD',
    time_format VARCHAR(20) DEFAULT '24h', -- 24h or 12h
    number_format VARCHAR(20) DEFAULT '1,234.56',
    currency_format VARCHAR(20) DEFAULT '$1,234.56',
    text_direction VARCHAR(3) DEFAULT 'ltr', -- ltr or rtl
    
    -- Localization settings
    decimal_separator VARCHAR(1) DEFAULT '.',
    thousands_separator VARCHAR(1) DEFAULT ',',
    list_separator VARCHAR(1) DEFAULT ',',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(language_code, dialect_code)
);

-- Jean language preferences per user
CREATE TABLE IF NOT EXISTS jean_language_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Primary language settings
    primary_language jean_language NOT NULL DEFAULT 'en',
    primary_dialect VARCHAR(10),
    
    -- Secondary languages (for understanding)
    secondary_languages jean_language[] DEFAULT '{}',
    secondary_dialects TEXT[] DEFAULT '{}',
    
    -- Interface settings
    ui_language jean_language DEFAULT 'en',
    ui_dialect VARCHAR(10),
    
    -- Voice and speech settings
    speech_language jean_language DEFAULT 'en',
    speech_dialect VARCHAR(10),
    voice_tone VARCHAR(50) DEFAULT 'neutral', -- formal, casual, friendly, professional
    speech_rate DECIMAL(3,2) DEFAULT 1.0, -- 0.5 to 2.0
    speech_pitch DECIMAL(3,2) DEFAULT 1.0, -- 0.5 to 2.0
    
    -- Cultural preferences
    formality_level VARCHAR(20) DEFAULT 'neutral', -- formal, informal, neutral
    greeting_style VARCHAR(50) DEFAULT 'standard', -- standard, casual, formal
    use_local_expressions BOOLEAN DEFAULT FALSE,
    respect_cultural_nuances BOOLEAN DEFAULT TRUE,
    
    -- Translation preferences
    auto_translate_responses BOOLEAN DEFAULT FALSE,
    show_original_text BOOLEAN DEFAULT FALSE,
    translation_confidence_threshold DECIMAL(3,2) DEFAULT 0.8,
    
    -- Local settings
    timezone VARCHAR(50) DEFAULT 'UTC',
    date_format VARCHAR(50),
    time_format VARCHAR(20),
    number_format VARCHAR(20),
    currency_format VARCHAR(20),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Jean multilingual content (translations, prompts, etc.)
CREATE TABLE IF NOT EXISTS jean_multilingual_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_key VARCHAR(200) NOT NULL, -- Unique key for the content
    content_type VARCHAR(50) NOT NULL, -- prompt, response, error_message, ui_text
    language jean_language NOT NULL,
    dialect_code VARCHAR(10),
    
    -- Content in the target language
    title VARCHAR(500),
    content TEXT NOT NULL,
    
    -- Metadata
    context JSONB DEFAULT '{}', -- Usage context, variables, etc.
    is_machine_translated BOOLEAN DEFAULT FALSE,
    translation_confidence DECIMAL(3,2),
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    
    -- Variants
    formal_variant TEXT, -- Formal version
    casual_variant TEXT, -- Casual version
    cultural_notes TEXT, -- Cultural context notes
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(content_key, language, COALESCE(dialect_code, ''))
);

-- Jean conversation language context
CREATE TABLE IF NOT EXISTS jean_conversation_language (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(255),
    
    -- Detected language
    detected_language jean_language,
    detected_dialect VARCHAR(10),
    detection_confidence DECIMAL(3,2),
    
    -- User preferences for this conversation
    preferred_language jean_language,
    preferred_dialect VARCHAR(10),
    
    -- Language switching history
    language_switches JSONB DEFAULT '[]', -- Array of language change events
    
    -- Language-specific performance metrics
    response_quality_score DECIMAL(3,2),
    user_satisfaction_score DECIMAL(3,2),
    misunderstanding_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Language model configurations per language
CREATE TABLE IF NOT EXISTS jean_language_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    language jean_language NOT NULL,
    dialect_code VARCHAR(10),
    
    -- Model settings
    model_name VARCHAR(200) NOT NULL,
    model_version VARCHAR(50),
    provider VARCHAR(100), -- openai, anthropic, local, etc.
    
    -- Language-specific parameters
    system_prompt_template TEXT, -- Template with language-specific system prompt
    temperature DECIMAL(3,2) DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 2048,
    
    -- Performance metrics
    avg_response_time_ms INTEGER,
    quality_score DECIMAL(3,2),
    usage_count INTEGER DEFAULT 0,
    
    -- Regional considerations
    cultural_context_included BOOLEAN DEFAULT FALSE,
    local_knowledge_base BOOLEAN DEFAULT FALSE,
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(language, COALESCE(dialect_code, ''))
);

-- Voice synthesis configurations
CREATE TABLE IF NOT EXISTS jean_voice_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    language jean_language NOT NULL,
    dialect_code VARCHAR(10),
    
    -- Voice settings
    voice_name VARCHAR(200) NOT NULL,
    voice_provider VARCHAR(100), -- aws, google, azure, local
    voice_gender VARCHAR(10), -- male, female, neutral
    voice_age VARCHAR(20), -- young, adult, elderly
    
    -- Audio parameters
    sample_rate INTEGER DEFAULT 22050,
    bit_rate INTEGER DEFAULT 128,
    audio_format VARCHAR(10) DEFAULT 'mp3',
    
    -- Speech characteristics
    speaking_rate DECIMAL(3,2) DEFAULT 1.0,
    pitch_variation DECIMAL(3,2) DEFAULT 1.0,
    volume_level DECIMAL(3,2) DEFAULT 1.0,
    
    -- Quality and performance
    naturalness_score DECIMAL(3,2),
    clarity_score DECIMAL(3,2),
    emotional_range DECIMAL(3,2),
    
    is_preferred BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(language, COALESCE(dialect_code, ''), voice_name)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_jean_dialects_language ON jean_dialects(language_code);
CREATE INDEX IF NOT EXISTS idx_jean_dialects_default ON jean_dialects(is_default_dialect) WHERE is_default_dialect = TRUE;

CREATE INDEX IF NOT EXISTS idx_jean_language_preferences_user_id ON jean_language_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_jean_language_preferences_primary_lang ON jean_language_preferences(primary_language);

CREATE INDEX IF NOT EXISTS idx_jean_multilingual_content_key ON jean_multilingual_content(content_key);
CREATE INDEX IF NOT EXISTS idx_jean_multilingual_content_lang ON jean_multilingual_content(language, dialect_code);
CREATE INDEX IF NOT EXISTS idx_jean_multilingual_content_type ON jean_multilingual_content(content_type);

CREATE INDEX IF NOT EXISTS idx_jean_conversation_language_user_id ON jean_conversation_language(user_id);
CREATE INDEX IF NOT EXISTS idx_jean_conversation_language_session ON jean_conversation_language(session_id);
CREATE INDEX IF NOT EXISTS idx_jean_conversation_language_detected ON jean_conversation_language(detected_language, detected_dialect);

CREATE INDEX IF NOT EXISTS idx_jean_language_models_lang ON jean_language_models(language, dialect_code);
CREATE INDEX IF NOT EXISTS idx_jean_language_models_active ON jean_language_models(is_active) WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_jean_voice_configs_lang ON jean_voice_configs(language, dialect_code);
CREATE INDEX IF NOT EXISTS idx_jean_voice_configs_preferred ON jean_voice_configs(is_preferred) WHERE is_preferred = TRUE;

-- Insert default dialects for Arabic
INSERT INTO jean_dialects (language_code, dialect_code, dialect_name, native_name, region, is_default_dialect, text_direction)
VALUES 
    ('ar', 'eg', 'Egyptian Arabic', 'العربية المصرية', 'Egypt', TRUE, 'rtl'),
    ('ar', 'sa', 'Gulf Arabic', 'العربية الخليجية', 'Saudi Arabia/Gulf', FALSE, 'rtl'),
    ('ar', 'ae', 'UAE Arabic', 'العربية الإماراتية', 'United Arab Emirates', FALSE, 'rtl'),
    ('ar', 'ma', 'Moroccan Arabic', 'العربية المغربية', 'Morocco', FALSE, 'rtl'),
    ('ar', 'jo', 'Jordanian Arabic', 'العربية الأردنية', 'Jordan', FALSE, 'rtl'),
    ('ar', 'lb', 'Lebanese Arabic', 'العربية اللبنانية', 'Lebanon', FALSE, 'rtl')
ON CONFLICT (language_code, dialect_code) DO NOTHING;

-- Insert default dialects for English
INSERT INTO jean_dialects (language_code, dialect_code, dialect_name, native_name, region, is_default_dialect)
VALUES 
    ('en', 'us', 'American English', 'American English', 'United States', TRUE),
    ('en', 'uk', 'British English', 'British English', 'United Kingdom', FALSE),
    ('en', 'au', 'Australian English', 'Australian English', 'Australia', FALSE),
    ('en', 'ca', 'Canadian English', 'Canadian English', 'Canada', FALSE),
    ('en', 'in', 'Indian English', 'Indian English', 'India', FALSE)
ON CONFLICT (language_code, dialect_code) DO NOTHING;

-- Insert default dialects for Spanish
INSERT INTO jean_dialects (language_code, dialect_code, dialect_name, native_name, region, is_default_dialect)
VALUES 
    ('es', 'es', 'Castilian Spanish', 'Español castellano', 'Spain', TRUE),
    ('es', 'mx', 'Mexican Spanish', 'Español mexicano', 'Mexico', FALSE),
    ('es', 'ar', 'Argentine Spanish', 'Español argentino', 'Argentina', FALSE),
    ('es', 'co', 'Colombian Spanish', 'Español colombiano', 'Colombia', FALSE)
ON CONFLICT (language_code, dialect_code) DO NOTHING;

-- Insert default dialects for Chinese
INSERT INTO jean_dialects (language_code, dialect_code, dialect_name, native_name, region, is_default_dialect)
VALUES 
    ('zh', 'cn', 'Mandarin Chinese (Simplified)', '简体中文', 'Mainland China', TRUE),
    ('zh', 'tw', 'Mandarin Chinese (Traditional)', '繁體中文', 'Taiwan', FALSE),
    ('zh', 'hk', 'Cantonese (Traditional)', '繁體中文', 'Hong Kong', FALSE),
    ('zh', 'sg', 'Mandarin Chinese (Singapore)', '简体中文', 'Singapore', FALSE)
ON CONFLICT (language_code, dialect_code) DO NOTHING;

-- Insert default multilingual content (system messages)
INSERT INTO jean_multilingual_content (content_key, content_type, language, title, content)
VALUES 
    ('welcome_message', 'greeting', 'en', 'Welcome', 'Hello! I am Jean, your AI assistant. How can I help you today?'),
    ('welcome_message', 'greeting', 'ar', 'أهلاً بك', 'مرحباً! أنا جان، مساعدك الذكي. كيف يمكنني مساعدتك اليوم؟'),
    ('welcome_message', 'greeting', 'es', 'Bienvenido', '¡Hola! Soy Jean, tu asistente de IA. ¿Cómo puedo ayudarte hoy?'),
    ('welcome_message', 'greeting', 'zh', '欢迎', '你好！我是Jean，你的AI助手。今天我能为你做些什么？'),
    
    ('permission_request', 'system_message', 'en', 'Permission Required', 'I need your permission to {action}. Would you like to grant it?'),
    ('permission_request', 'system_message', 'ar', 'الصلاحية مطلوبة', 'أحتاج إذنك لـ {action}. هل تريد منحها؟'),
    ('permission_request', 'system_message', 'es', 'Permiso Requerido', 'Necesito tu permiso para {action}. ¿Te gustaría otorgarlo?'),
    ('permission_request', 'system_message', 'zh', '需要权限', '我需要您的权限来{action}。您想授予权限吗？'),
    
    ('action_confirmed', 'system_message', 'en', 'Action Confirmed', 'Action "{action}" has been confirmed and executed.'),
    ('action_confirmed', 'system_message', 'ar', 'تم تأكيد الإجراء', 'تم تأكيد الإجراء "{action}" وتنفيذه.'),
    ('action_confirmed', 'system_message', 'es', 'Acción Confirmada', 'La acción "{action}" ha sido confirmada y ejecutada.'),
    ('action_confirmed', 'system_message', 'zh', '操作已确认', '操作"{action}"已确认并执行。'),
    
    ('error_occurred', 'error_message', 'en', 'Error', 'An error occurred: {error}'),
    ('error_occurred', 'error_message', 'ar', 'خطأ', 'حدث خطأ: {error}'),
    ('error_occurred', 'error_message', 'es', 'Error', 'Ocurrió un error: {error}'),
    ('error_occurred', 'error_message', 'zh', '错误', '发生错误：{error}')
ON CONFLICT (content_key, language, COALESCE(dialect_code, '')) DO NOTHING;

-- Insert default language model configurations
INSERT INTO jean_language_models (language, dialect_code, model_name, provider, system_prompt_template, is_active)
VALUES 
    ('en', NULL, 'gpt-4', 'openai', 'You are Jean, a helpful AI assistant. Respond in clear, natural English.', TRUE),
    ('ar', 'eg', 'gpt-4', 'openai', 'أنت جان، مساعد ذكي مفيد. استجب باللغة العربية المصرية الواضحة والطبيعية.', TRUE),
    ('ar', NULL, 'gpt-4', 'openai', 'أنت جان، مساعد ذكي مفيد. استجب باللغة العربية الفصحى الواضحة والاحترافية.', TRUE),
    ('es', 'es', 'gpt-4', 'openai', 'Eres Jean, un asistente de IA útil. Responde en español claro y natural.', TRUE),
    ('zh', 'cn', 'gpt-4', 'openai', '你是Jean，一个有用的AI助手。请用清晰自然的中文回答。', TRUE)
ON CONFLICT (language, COALESCE(dialect_code, '')) DO NOTHING;

-- Insert default voice configurations
INSERT INTO jean_voice_configs (language, dialect_code, voice_name, voice_provider, voice_gender, is_preferred)
VALUES 
    ('en', 'us', 'Joanna', 'aws', 'female', TRUE),
    ('en', 'uk', 'Emma', 'aws', 'female', FALSE),
    ('ar', 'eg', 'Zeina', 'aws', 'female', TRUE),
    ('ar', NULL, 'Hala', 'aws', 'female', FALSE),
    ('es', 'es', 'Lucia', 'aws', 'female', TRUE),
    ('es', 'mx', 'Mia', 'aws', 'female', FALSE),
    ('zh', 'cn', 'Zhiyu', 'aws', 'female', TRUE),
    ('zh', 'tw', 'Yun-Jhe', 'aws', 'male', FALSE)
ON CONFLICT (language, COALESCE(dialect_code, ''), voice_name) DO NOTHING;

-- Function to get localized content
CREATE OR REPLACE FUNCTION get_localized_content(
    p_content_key VARCHAR,
    p_language jean_language,
    p_dialect VARCHAR DEFAULT NULL,
    p_content_type VARCHAR DEFAULT NULL
)
RETURNS TABLE(
    id UUID,
    title VARCHAR,
    content TEXT,
    formal_variant TEXT,
    casual_variant TEXT,
    cultural_notes TEXT,
    translation_confidence DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        mc.id,
        mc.title,
        mc.content,
        mc.formal_variant,
        mc.casual_variant,
        mc.cultural_notes,
        mc.translation_confidence
    FROM jean_multilingual_content mc
    WHERE mc.content_key = p_content_key
        AND mc.language = p_language
        AND (p_dialect IS NULL OR mc.dialect_code = p_dialect OR mc.dialect_code IS NULL)
        AND (p_content_type IS NULL OR mc.content_type = p_content_type)
    ORDER BY 
        CASE WHEN mc.dialect_code = p_dialect THEN 1 ELSE 2 END,
        mc.translation_confidence DESC NULLS LAST
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to detect language from text
CREATE OR REPLACE FUNCTION detect_language(
    p_text TEXT,
    p_user_id UUID DEFAULT NULL
)
RETURNS TABLE(
    detected_language jean_language,
    detected_dialect VARCHAR,
    confidence DECIMAL
) AS $$
BEGIN
    -- This is a simplified language detection
    -- In production, you'd integrate with a proper language detection service
    
    IF p_text ~ '[\u0600-\u06FF]' THEN -- Arabic characters
        RETURN QUERY 
        SELECT 'ar'::jean_language, 'eg'::VARCHAR, 0.8::DECIMAL
        UNION ALL
        SELECT 'ar'::jean_language, NULL::VARCHAR, 0.9::DECIMAL;
    ELSIF p_text ~ '[\u4E00-\u9FFF]' THEN -- Chinese characters
        RETURN QUERY 
        SELECT 'zh'::jean_language, 'cn'::VARCHAR, 0.8::DECIMAL
        UNION ALL
        SELECT 'zh'::jean_language, NULL::VARCHAR, 0.9::DECIMAL;
    ELSIF p_text ~ '[ñáéíóúüÑÁÉÍÓÚÜ]' THEN -- Spanish characters
        RETURN QUERY 
        SELECT 'es'::jean_language, 'es'::VARCHAR, 0.8::DECIMAL
        UNION ALL
        SELECT 'es'::jean_language, NULL::VARCHAR, 0.9::DECIMAL;
    ELSE
        RETURN QUERY 
        SELECT 'en'::jean_language, 'us'::VARCHAR, 0.8::DECIMAL
        UNION ALL
        SELECT 'en'::jean_language, NULL::VARCHAR, 0.9::DECIMAL;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get user language preferences with fallback
CREATE OR REPLACE FUNCTION get_user_language_preferences(
    p_user_id UUID
)
RETURNS TABLE(
    primary_language jean_language,
    primary_dialect VARCHAR,
    ui_language jean_language,
    ui_dialect VARCHAR,
    speech_language jean_language,
    speech_dialect VARCHAR,
    formality_level VARCHAR,
    timezone VARCHAR,
    text_direction VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(jlp.primary_language, 'en')::jean_language,
        jlp.primary_dialect,
        COALESCE(jlp.ui_language, jlp.primary_language, 'en')::jean_language,
        COALESCE(jlp.ui_dialect, jlp.primary_dialect),
        COALESCE(jlp.speech_language, jlp.primary_language, 'en')::jean_language,
        COALESCE(jlp.speech_dialect, jlp.primary_dialect),
        COALESCE(jlp.formality_level, 'neutral'),
        COALESCE(jlp.timezone, 'UTC'),
        COALESCE(jd.text_direction, 'ltr')
    FROM jean_language_preferences jlp
    LEFT JOIN jean_dialects jd ON jlp.primary_language = jd.language_code 
        AND jlp.primary_dialect = jd.dialect_code
    WHERE jlp.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;