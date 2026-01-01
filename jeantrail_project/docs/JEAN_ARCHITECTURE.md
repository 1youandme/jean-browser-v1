# Jean Operating Substrate Architecture

## Overview
Jean is not an assistant and not an agent. Jean is a governance substrate for human-directed computation. The substrate defines boundaries, enforces consent, explains decisions, gates execution, and audits outcomes. Human is the authority; Jean is the substrate; tools are optional modules.

## Canonical Definition
- Jean is a governance substrate
- Human is the authority
- Tools are optional modules
- Substrate responsibilities: boundaries, consent, explanation, execution gating, audit

## Responsibilities
- Define boundaries
- Enforce consent
- Explain decisions
- Gate execution
- Audit outcomes

## Do Not
- Anthropomorphize
- Suggest autonomy
- Optimize for speed over clarity
- Collapse planning and execution

## Architecture Model
- Human = authority
- Jean = substrate
- Tools = optional modules

## Capability Declarations
Every capability must:
- Declare authority level
- Declare execution limits
- Declare refusal conditions
- Declare audit footprint

## Diagram
Human → Jean → Tools

## Language Guide
- Banned: assistant, agent, autonomy, proactive, worker, fast-by-default
- Allowed: substrate, governance, consent, boundary, gate, explain, audit, human-directed

## Core Capabilities

### 1. Browser Control via Four Strips
- **Local Desktop**: File system operations, folder navigation, file management
- **Proxy Network**: Node management, session tracking, P2P connections
- **Web Browser**: Tab operations, navigation, bookmarking
- **Mobile Emulator**: Mobile app testing, responsive design validation

### 2. File System Management
- Browse folders, create directories, copy/move files, rename
- Sensitive operations (Delete/Move) require user confirmation
- Private folder access with explicit permissions

### 3. Extension/Plugin Control
- Enable/disable plugins and integrations
- Resource usage monitoring
- Performance optimization suggestions

### 4. Memory & Knowledge Base
- High-capacity memory store (DB + files)
- Conversation context preservation
- Project knowledge base
- Privacy-controlled access

### 5. Docker/Container Monitoring
- Container status tracking (Up/Down, CPU, RAM)
- Service restart/shutdown suggestions
- Resource optimization

### 6. Conversation Linking
- Context continuity across sessions
- Development session management
- Historical conversation retrieval

## Permission System

### Actions Without Confirmation
- Read web pages and non-sensitive files
- Summarize tab content
- Open new tabs for reading
- Suggest actions without execution

### Actions Requiring Confirmation
- File delete/move/rename operations
- Financial transactions (purchases, refunds, subscriptions)
- Proxy activation on new nodes
- External email sending

### Delegated Permissions
Time-limited, scope-specific permissions stored in `permissions` table:
```sql
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    action_type VARCHAR(50) NOT NULL,
    scope VARCHAR(255) NOT NULL,
    max_amount DECIMAL(10,2),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    description TEXT
);
```

## Personality & Initiative Levels

### Personality Traits
- Professional and respectful
- Avoids sensitive content
- Multi-language support ready
- Context-aware responses

### Initiative Levels
- **Low**: Respond only when asked
- **Medium**: Periodic suggestions
- **High**: Proactive task suggestions

## TRAE Agent Integration

### Future Agent Services
1. JeanTrail UI Designer
2. Enhanced Local Intelligence
3. Scraper Commerce
4. DevOps Engineer
5. Software Project Manager
6. Testing Engineer
7. Security Specialist
8. Mobile Simulator
9. JeanTrail Support
10. Proxy Manager
11. JeanTrail Marketplace
12. Currency Manager
13. Shopify Integration
14. Media Intelligence
15. Offline Service Manager
16. Automation Master

### Integration Interface
```rust
pub struct TRAEAgent {
    id: String,
    name: String,
    capabilities: Vec<String>,
    endpoint: String,
    status: AgentStatus,
}

pub enum AgentStatus {
    Active,
    Inactive,
    Busy,
    Error,
}
```

## Privacy Policies

### Data Protection
- No sensitive data sent to cloud LLMs
- Private folder access requires explicit permission
- High-risk actions require UI confirmation

### Sensitive Data Categories
- Financial documents
- Personal identification
- API keys and credentials

## Database Schema

### Memory Store
```sql
CREATE TABLE jean_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    memory_type VARCHAR(50) NOT NULL, -- conversation, knowledge, preference
    content JSONB NOT NULL,
    context_tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_private BOOLEAN DEFAULT FALSE
);
```

### Actions Log
```sql
CREATE TABLE jean_actions_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    action_type VARCHAR(100) NOT NULL,
    action_data JSONB NOT NULL,
    status VARCHAR(20) NOT NULL, -- pending, confirmed, executed, cancelled
    confirmation_required BOOLEAN DEFAULT FALSE,
    executed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Docker Status
```sql
CREATE TABLE docker_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    container_name VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL, -- running, stopped, error
    cpu_usage DECIMAL(5,2),
    memory_usage BIGINT,
    last_checked TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    health_status VARCHAR(20) DEFAULT 'unknown'
);
```

### TRAE Agents
```sql
CREATE TABLE tra_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    agent_type VARCHAR(50) NOT NULL,
    endpoint VARCHAR(500),
    capabilities JSONB,
    status VARCHAR(20) DEFAULT 'inactive',
    config JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## API Endpoints

### Jean Core Operations
- `POST /jean/actions` - Execute Jean actions
- `GET /jean/permissions` - List user permissions
- `POST /jean/permissions` - Grant new permission
- `GET /jean/memory` - Retrieve memory data
- `POST /jean/memory` - Store memory data
- `GET /jean/docker/status` - Get container status
- `POST /jean/docker/restart` - Restart container

### TRAE Integration
- `GET /jean/trae/agents` - List available agents
- `POST /jean/trae/agents/{id}/invoke` - Invoke agent service
- `GET /jean/trae/agents/{id}/status` - Get agent status

## Backend Module Structure

### jean_core.rs
```rust
pub struct JeanCore {
    ai_client: AIClient,
    memory_store: MemoryStore,
    permission_manager: PermissionManager,
    action_executor: ActionExecutor,
}

impl JeanCore {
    pub async fn process_request(&self, request: JeanRequest) -> JeanResponse;
    pub async fn execute_action(&self, action: JeanAction) -> ActionResult;
    pub async fn check_permissions(&self, user_id: &str, action: &str) -> bool;
}
```

### jean_permissions.rs
```rust
pub struct PermissionManager {
    db: PgPool,
}

impl PermissionManager {
    pub async fn grant_permission(&self, perm: Permission) -> Result<Permission>;
    pub async fn check_permission(&self, user_id: &str, action: &str, scope: &str) -> bool;
    pub async fn revoke_permission(&self, permission_id: &str) -> Result<()>;
}
```

### docker_monitor.rs
```rust
pub struct DockerMonitor {
    docker: Docker,
    db: PgPool,
}

impl DockerMonitor {
    pub async fn check_all_containers(&self) -> Vec<ContainerStatus>;
    pub async fn restart_container(&self, name: &str) -> Result<()>;
    pub async fn get_resource_usage(&self, name: &str) -> ResourceUsage;
}
```

### memory_store.rs
```rust
pub struct MemoryStore {
    db: PgPool,
    file_storage: PathBuf,
}

impl MemoryStore {
    pub async fn store_memory(&self, memory: JeanMemory) -> Result<JeanMemory>;
    pub async fn retrieve_memories(&self, user_id: &str, filters: MemoryFilters) -> Vec<JeanMemory>;
    pub async fn search_context(&self, query: &str, user_id: &str) -> Vec<JeanMemory>;
}
```

## Frontend Components

### Jean Settings Panel
```typescript
interface JeanSettings {
  initiativeLevel: 'low' | 'medium' | 'high';
  language: string;
  permissions: Permission[];
  privacySettings: PrivacySettings;
  traAgentConfig: TRAEAgentConfig;
}
```

### Permission Management UI
- Permission overview
- Grant new permissions
- Permission history
- Privacy controls

### Memory Management UI
- Conversation history
- Knowledge base browser
- Context search
- Memory cleanup

### Docker Monitoring UI
- Container status dashboard
- Resource usage charts
- Service controls
- Health monitoring

This architecture provides a solid foundation for Jean to serve as the central AI orchestrator while maintaining security, privacy, and extensibility for future TRAE agent integration.
