-- Jean Capability Registry Migration
-- The "Empty Shell" definition of system capabilities.
-- No libraries are bound, no execution is enabled by default.

-- 1. Capability Definitions
-- The immutable constitution of what the system *can* theoretically do.
CREATE TABLE IF NOT EXISTS jean_capability_registry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identification
    name VARCHAR(100) NOT NULL UNIQUE, -- e.g. 'fs.read.local'
    domain VARCHAR(50) NOT NULL CHECK (domain IN ('FILESYSTEM', 'NETWORK', 'BROWSER', 'SYSTEM', 'AI', 'MEMORY')),
    description TEXT NOT NULL,
    
    -- Constraints
    allowed_outputs JSONB NOT NULL DEFAULT '[]', -- e.g. ["text", "json"]
    
    -- Governance
    consent_requirement VARCHAR(50) NOT NULL CHECK (consent_requirement IN ('NONE', 'INFORMATIONAL', 'EXPLICIT_APPROVAL', 'CRITICAL_AUTH')),
    risk_classification VARCHAR(50) NOT NULL CHECK (risk_classification IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    
    -- Architecture
    future_attachment_point VARCHAR(255) NOT NULL UNIQUE, -- e.g. 'hook.fs.read'
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Work Environments (Profiles)
-- Groups of capabilities that define a "Mode" (e.g. "Librarian Mode")
CREATE TABLE IF NOT EXISTS jean_work_environments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE, -- e.g. 'Sandbox', 'Librarian', 'Operator'
    description TEXT,
    is_system_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Environment -> Capability Mapping
-- Which capabilities are theoretically available in which environment?
CREATE TABLE IF NOT EXISTS jean_environment_capabilities (
    env_id UUID NOT NULL REFERENCES jean_work_environments(id) ON DELETE CASCADE,
    capability_id UUID NOT NULL REFERENCES jean_capability_registry(id) ON DELETE CASCADE,
    
    -- Overrides
    is_forced_disabled BOOLEAN DEFAULT false, -- Hard disable for this env
    
    PRIMARY KEY (env_id, capability_id)
);

-- 4. User Runtime State
-- The actual "On/Off" switch for a specific user in a specific workspace.
-- By default, NO ROWS exist here, meaning nothing is active.
CREATE TABLE IF NOT EXISTS jean_user_capability_state (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    workspace_id UUID, -- Optional: Scope to specific workspace
    capability_id UUID NOT NULL REFERENCES jean_capability_registry(id),
    
    is_active BOOLEAN DEFAULT false, -- The Master Switch
    last_enabled_at TIMESTAMPTZ,
    enabled_by_session_id VARCHAR(255),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE (user_id, workspace_id, capability_id)
);

-- 5. Seed the Registry (The Empty Shells)
-- These exist as definitions but are not active for any user.

INSERT INTO jean_capability_registry 
(name, domain, description, allowed_outputs, consent_requirement, risk_classification, future_attachment_point)
VALUES
-- Filesystem
('fs.read.local', 'FILESYSTEM', 'Read file content from allowed directories.', '["text", "binary"]', 'EXPLICIT_APPROVAL', 'MEDIUM', 'hook.fs.read'),
('fs.write.local', 'FILESYSTEM', 'Write or modify files.', '["status"]', 'CRITICAL_AUTH', 'HIGH', 'hook.fs.write'),
('fs.list', 'FILESYSTEM', 'List directory structure.', '["json"]', 'INFORMATIONAL', 'LOW', 'hook.fs.list'),

-- Network
('network.proxy.connect', 'NETWORK', 'Connect via Proxy Strip.', '["stream"]', 'EXPLICIT_APPROVAL', 'MEDIUM', 'hook.net.proxy'),
('network.fetch.public', 'NETWORK', 'Fetch public URL (GET only).', '["text", "json"]', 'INFORMATIONAL', 'LOW', 'hook.net.fetch'),

-- Browser
('browser.tab.control', 'BROWSER', 'Open/Close/Focus tabs.', '["status"]', 'NONE', 'LOW', 'hook.browser.tabs'),
('browser.dom.read', 'BROWSER', 'Read text content of active tab.', '["text"]', 'EXPLICIT_APPROVAL', 'MEDIUM', 'hook.browser.dom'),

-- AI / Memory
('ai.generate.text', 'AI', 'Generate text via local LLM.', '["text"]', 'NONE', 'LOW', 'hook.ai.gen'),
('memory.recall', 'MEMORY', 'Search local vector store.', '["json"]', 'INFORMATIONAL', 'LOW', 'hook.mem.search');

-- 6. Seed Environments
INSERT INTO jean_work_environments (name, description, is_system_default) VALUES
('Sandbox', 'Zero capabilities. Pure UI interaction.', true),
('Librarian', 'Read-only access for organization and search.', false),
('Architect', 'Structure analysis and diagramming.', false),
('Operator', 'Full development capabilities with high friction.', false);

-- Link Capabilities to Environments (Examples)
-- Librarian gets Read + List + Memory
INSERT INTO jean_environment_capabilities (env_id, capability_id)
SELECT e.id, c.id FROM jean_work_environments e, jean_capability_registry c
WHERE e.name = 'Librarian' AND c.name IN ('fs.read.local', 'fs.list', 'memory.recall', 'browser.dom.read');

-- Operator gets Everything
INSERT INTO jean_environment_capabilities (env_id, capability_id)
SELECT e.id, c.id FROM jean_work_environments e, jean_capability_registry c
WHERE e.name = 'Operator';
