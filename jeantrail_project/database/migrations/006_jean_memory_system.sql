-- Jean Memory System Tables
-- Comprehensive memory management with folders, links, and advanced search

-- Memory folders for organization
CREATE TABLE IF NOT EXISTS jean_memory_folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7), -- Hex color code
    icon VARCHAR(50), -- Icon identifier
    parent_folder_id UUID REFERENCES jean_memory_folders(id) ON DELETE CASCADE,
    folder_path TEXT[] DEFAULT '{}', -- Array path for nested folders
    is_system_folder BOOLEAN DEFAULT FALSE, -- Built-in folders like Projects, Clients, etc.
    sort_order INTEGER DEFAULT 0,
    memory_count INTEGER DEFAULT 0, -- Cached count
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, name, parent_folder_id)
);

-- Enhanced memory entries with folder support
CREATE TABLE IF NOT EXISTS jean_memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    folder_id UUID REFERENCES jean_memory_folders(id) ON DELETE SET NULL,
    title VARCHAR(500),
    memory_type VARCHAR(50) NOT NULL DEFAULT 'note', -- note, conversation, file, link, task
    content JSONB NOT NULL DEFAULT '{}',
    text_content TEXT, -- Extracted text for full-text search
    context_tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}', -- Additional structured data
    
    -- File attachment support
    file_path VARCHAR(1000),
    file_name VARCHAR(255),
    file_type VARCHAR(100),
    file_size BIGINT,
    
    -- Access control
    is_private BOOLEAN DEFAULT FALSE,
    is_encrypted BOOLEAN DEFAULT FALSE,
    is_favorite BOOLEAN DEFAULT FALSE,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    
    -- Relationships
    parent_memory_id UUID REFERENCES jean_memories(id) ON DELETE SET NULL,
    linked_memory_ids UUID[] DEFAULT '{}',
    
    -- Search and relevance
    search_vector tsvector,
    relevance_score DECIMAL(3,2) DEFAULT 0.5,
    access_count INTEGER DEFAULT 0,
    last_accessed TIMESTAMP WITH TIME ZONE,
    
    -- Session tracking
    session_id VARCHAR(255),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Full-text search index
    CONSTRAINT valid_memory_type CHECK (memory_type IN ('note', 'conversation', 'file', 'link', 'task', 'preference', 'context'))
);

-- Memory links for many-to-many relationships
CREATE TABLE IF NOT EXISTS jean_memory_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    source_memory_id UUID NOT NULL REFERENCES jean_memories(id) ON DELETE CASCADE,
    target_memory_id UUID NOT NULL REFERENCES jean_memories(id) ON DELETE CASCADE,
    link_type VARCHAR(50) DEFAULT 'related', -- related, parent_child, reference, similar
    strength DECIMAL(3,2) DEFAULT 0.5, -- Link strength 0.0-1.0
    bidirectional BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(source_memory_id, target_memory_id),
    CHECK (source_memory_id != target_memory_id)
);

-- Memory search history for analytics
CREATE TABLE IF NOT EXISTS jean_memory_search_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    filters JSONB DEFAULT '{}', -- Search filters used
    results_count INTEGER,
    clicked_memory_id UUID REFERENCES jean_memories(id) ON DELETE SET NULL,
    session_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Memory tags for better organization
CREATE TABLE IF NOT EXISTS jean_memory_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7),
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, name)
);

-- Memory tag associations
CREATE TABLE IF NOT EXISTS jean_memory_tag_associations (
    memory_id UUID NOT NULL REFERENCES jean_memories(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES jean_memory_tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    PRIMARY KEY (memory_id, tag_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_jean_memories_user_id ON jean_memories(user_id);
CREATE INDEX IF NOT EXISTS idx_jean_memories_folder_id ON jean_memories(folder_id);
CREATE INDEX IF NOT EXISTS idx_jean_memories_memory_type ON jean_memories(memory_type);
CREATE INDEX IF NOT EXISTS idx_jean_memories_session_id ON jean_memories(session_id);
CREATE INDEX IF NOT EXISTS idx_jean_memories_created_at ON jean_memories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jean_memories_relevance_score ON jean_memories(relevance_score DESC);
CREATE INDEX IF NOT EXISTS idx_jean_memories_last_accessed ON jean_memories(last_accessed DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_jean_memories_is_favorite ON jean_memories(is_favorite) WHERE is_favorite = TRUE;
CREATE INDEX IF NOT EXISTS idx_jean_memories_is_pinned ON jean_memories(is_pinned) WHERE is_pinned = TRUE;

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_jean_memories_search_vector ON jean_memories USING GIN(search_vector);

-- Folder indexes
CREATE INDEX IF NOT EXISTS idx_jean_memory_folders_user_id ON jean_memory_folders(user_id);
CREATE INDEX IF NOT EXISTS idx_jean_memory_folders_parent_id ON jean_memory_folders(parent_folder_id);
CREATE INDEX IF NOT EXISTS idx_jean_memory_folders_path ON jean_memory_folders USING GIN(folder_path);

-- Link indexes
CREATE INDEX IF NOT EXISTS idx_jean_memory_links_source ON jean_memory_links(source_memory_id);
CREATE INDEX IF NOT EXISTS idx_jean_memory_links_target ON jean_memory_links(target_memory_id);
CREATE INDEX IF NOT EXISTS idx_jean_memory_links_user_id ON jean_memory_links(user_id);

-- Tag indexes
CREATE INDEX IF NOT EXISTS idx_jean_memory_tags_user_id ON jean_memory_tags(user_id);
CREATE INDEX IF NOT EXISTS idx_jean_memory_tags_usage_count ON jean_memory_tags(usage_count DESC);

-- Create system folders for all existing users
INSERT INTO jean_memory_folders (user_id, name, description, is_system_folder, color, icon, sort_order)
SELECT 
    id as user_id,
    'Projects' as name,
    'All your project-related memories and files' as description,
    TRUE as is_system_folder,
    '#3B82F6' as color,
    'folder-project' as icon,
    1 as sort_order
FROM users 
WHERE id NOT IN (SELECT user_id FROM jean_memory_folders WHERE name = 'Projects' AND is_system_folder = TRUE);

INSERT INTO jean_memory_folders (user_id, name, description, is_system_folder, color, icon, sort_order)
SELECT 
    id as user_id,
    'Clients' as name,
    'Client information, conversations, and related documents' as description,
    TRUE as is_system_folder,
    '#10B981' as color,
    'folder-client' as icon,
    2 as sort_order
FROM users 
WHERE id NOT IN (SELECT user_id FROM jean_memory_folders WHERE name = 'Clients' AND is_system_folder = TRUE);

INSERT INTO jean_memory_folders (user_id, name, description, is_system_folder, color, icon, sort_order)
SELECT 
    id as user_id,
    'Courses' as name,
    'Learning materials, course notes, and educational content' as description,
    TRUE as is_system_folder,
    '#8B5CF6' as color,
    'folder-course' as icon,
    3 as sort_order
FROM users 
WHERE id NOT IN (SELECT user_id FROM jean_memory_folders WHERE name = 'Courses' AND is_system_folder = TRUE);

INSERT INTO jean_memory_folders (user_id, name, description, is_system_folder, color, icon, sort_order)
SELECT 
    id as user_id,
    'Personal' as name,
    'Personal notes, thoughts, and private memories' as description,
    TRUE as is_system_folder,
    '#EC4899' as color,
    'folder-personal' as icon,
    4 as sort_order
FROM users 
WHERE id NOT IN (SELECT user_id FROM jean_memory_folders WHERE name = 'Personal' AND is_system_folder = TRUE);

-- Create trigger for updating search_vector
CREATE OR REPLACE FUNCTION update_memory_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.text_content, '')), 'B') ||
        setweight(to_tsvector('english', array_to_string(NEW.context_tags, ' ')), 'C');
    
    -- Update folder memory count
    IF NEW.folder_id IS NOT NULL THEN
        UPDATE jean_memory_folders 
        SET memory_count = memory_count + 1 
        WHERE id = NEW.folder_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_memory_search_vector
    BEFORE INSERT OR UPDATE ON jean_memories
    FOR EACH ROW EXECUTE FUNCTION update_memory_search_vector();

-- Function to update folder memory count when memory is deleted
CREATE OR REPLACE FUNCTION update_folder_memory_count_on_delete()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.folder_id IS NOT NULL THEN
        UPDATE jean_memory_folders 
        SET memory_count = GREATEST(memory_count - 1, 0) 
        WHERE id = OLD.folder_id;
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_folder_memory_count_on_delete
    BEFORE DELETE ON jean_memories
    FOR EACH ROW EXECUTE FUNCTION update_folder_memory_count_on_delete();

-- Function to get memory with full context
CREATE OR REPLACE FUNCTION get_memory_with_context(p_user_id UUID, p_memory_id UUID)
RETURNS TABLE(
    id UUID,
    title VARCHAR,
    memory_type VARCHAR,
    content JSONB,
    text_content TEXT,
    context_tags TEXT[],
    folder_name VARCHAR,
    folder_color VARCHAR,
    linked_memories JSONB,
    relevance_score DECIMAL,
    access_count INTEGER,
    last_accessed TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.title,
        m.memory_type,
        m.content,
        m.text_content,
        m.context_tags,
        f.name as folder_name,
        f.color as folder_color,
        COALESCE(
            json_agg(
                json_build_object(
                    'id', lm.id,
                    'title', lm.title,
                    'memory_type', lm.memory_type,
                    'link_type', l.link_type,
                    'strength', l.strength
                )
            ) FILTER (WHERE lm.id IS NOT NULL),
            '[]'::json
        ) as linked_memories,
        m.relevance_score,
        m.access_count,
        m.last_accessed,
        m.created_at,
        m.updated_at
    FROM jean_memories m
    LEFT JOIN jean_memory_folders f ON m.folder_id = f.id
    LEFT JOIN jean_memory_links l ON m.id = l.source_memory_id
    LEFT JOIN jean_memories lm ON l.target_memory_id = lm.id
    WHERE m.user_id = p_user_id AND m.id = p_memory_id AND m.is_archived = FALSE
    GROUP BY m.id, f.name, f.color;
END;
$$ LANGUAGE plpgsql;