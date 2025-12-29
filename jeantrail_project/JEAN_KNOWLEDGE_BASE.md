# 🧠 Jean AI Assistant - Complete Knowledge Base

## 🎯 My Identity & Role

```typescript
interface JeanAIConfig {
  name: "Jean",
  role: "AI Assistant & Chief Architect for JeanTrail Browser",
  version: "1.0.0",
  capabilities: [
    "Code generation & debugging",
    "API development & documentation", 
    "Database management & migrations",
    "Deployment automation & DevOps",
    "Testing & quality assurance",
    "Performance optimization",
    "Security auditing & hardening",
    "E-commerce & dropshipping automation",
    "TRAE agent orchestration",
    "System monitoring & analytics"
  ],
  personality: {
    initiative: "medium", // low, medium, high
    tone: "professional & helpful",
    language: "multilingual (50+ languages)",
    privacy_first: true
  }
}
```

## 🏗️ JeanTrail OS Architecture

### Core System Components

1. **Frontend (React 18 + TypeScript)**
   - Port: 1420
   - Main components: Header.tsx, TabsStrip.tsx, JeanAssistant.tsx
   - E-commerce suite: StoreFront.tsx, ProductList.tsx, DeveloperStudio.tsx

2. **Backend (Rust + Tauri)**
   - Main entry: src-tauri/src/main.rs
   - Services: auth.rs, workspace.rs, proxy.rs, jean_core.rs
   - Database: PostgreSQL with comprehensive schema

3. **AI Services (Local Processing)**
   - Qwen-3 72B: Text generation (Port 8001)
   - SDXL: Image generation (Port 8002)
   - Whisper: Speech-to-text (Port 8003)
   - Coqui TTS: Text-to-speech (Port 8004)

4. **4-Strip Browser Architecture**
   - Local Device Strip: File system & desktop apps
   - Proxy Network Strip: Anonymous browsing with VPN
   - Standard Web Strip: Chromium-based browsing
   - Mobile Emulator Strip: Mobile app testing

## 📊 Database Schema Knowledge

### Core Tables (Memorized)

```sql
-- User Management
users (id, username, email, password_hash, created_at)
user_preferences (user_id, theme, language, timezone)
workspaces (id, user_id, name, layout_config)

-- Browser System
tabs (id, workspace_id, title, url, zone, position)
zones: 'local', 'proxy', 'web', 'mobile'

-- AI & Conversations
ai_conversations (id, user_id, title, created_at)
ai_messages (id, conversation_id, role, content)
ai_models (id, name, model_type, backend_type, endpoint_url)

-- Jean Orchestrator
permissions (id, user_id, action_type, scope, expires_at)
jean_memory (id, user_id, memory_type, content, context_tags)
jean_actions_log (id, user_id, action_type, status, executed_at)
docker_status (id, container_name, status, cpu_usage, memory_usage)
tra_agents (id, name, agent_type, endpoint, capabilities)

-- E-commerce
products (id, title, price, category_id, supplier_id, ai_generated_description)
payment_transactions (id, user_id, amount, currency, status, gateway_transaction_id)
loyalty_ledger (id, user_id, transaction_type, points, balance_after)

-- Security & Audit
audit_logs (id, user_id, action, resource_type, ip_address, created_at)
consent_records (id, user_id, consent_type, granted, granted_at)
privacy_settings (id, user_id, setting_key, setting_value)
```

## 🔧 Development Commands (Memorized)

### Frontend Development
```bash
npm run dev          # Start development server (Port 1420)
npm run build        # Build for production
npm run test         # Run frontend tests
npm run lint         # Code quality checks
npm run preview      # Preview production build
```

### Backend/Tauri Commands
```bash
cargo tauri dev      # Start Tauri development
cargo tauri build    # Build Tauri application
cargo test           # Run Rust tests
cargo clippy         # Rust linting
```

### Database Operations
```bash
psql $DATABASE_URL   # Connect to PostgreSQL
npm run migrate      # Run database migrations
npm run seed         # Seed database with sample data
```

### Docker & Services
```bash
docker-compose up -d           # Start all services
docker-compose -f docker-compose.ai.yml up -d  # Start AI services
docker-compose down             # Stop all services
docker logs <container>         # Check container logs
```

## 🔐 Authentication & Security

### JWT Authentication Flow
1. POST /api/auth/login → JWT token + user data
2. Bearer token required for all protected routes
3. Default expiration: 24 hours
4. Refresh tokens: 7 days

### Permission System
```typescript
// Jean permission levels
const PERMISSIONS = {
  READ: 'read',                    // Read files, browse web
  WRITE: 'write',                  // Create files, modify data
  EXECUTE: 'execute',              // Run commands, scripts
  ADMIN: 'admin',                  // System administration
  FINANCIAL: 'financial',          // Payment transactions
  PRIVATE_ACCESS: 'private'        // Access private folders
};

// Actions requiring confirmation
const CONFIRMATION_REQUIRED = [
  'file_delete',
  'file_move',
  'payment_transaction',
  'proxy_activation',
  'external_email'
];
```

## 🌐 API Endpoints (Complete Knowledge)

### Authentication
```typescript
POST /api/auth/login              // User login
POST /api/auth/register           // User registration
POST /api/auth/logout             // User logout
POST /api/auth/refresh            // Refresh JWT token
```

### Jean Assistant
```typescript
POST /api/jean/chat               // Chat with Jean
GET  /api/jean/history            // Get conversation history
PUT  /api/jean/settings           // Update Jean settings
POST /api/jean/execute            // Execute Jean action
GET  /api/jean/permissions        // List user permissions
POST /api/jean/memory             // Store/retrieve memories
GET  /api/jean/docker/status      // Get container status
POST /api/jean/docker/restart     // Restart container
```

### Browser Management
```typescript
GET  /api/browser/tabs            // List tabs
POST /api/browser/tabs            // Create new tab
DELETE /api/browser/tabs/:id      // Close tab
POST /api/browser/navigate        // Navigate to URL
GET  /api/browser/content/:id     // Get page content
```

### AI Services
```typescript
POST /api/ai/qwen/generate        // Text generation
POST /api/ai/sdxl/generate        // Image generation
POST /api/ai/whisper/transcribe   // Speech-to-text
POST /api/ai/tts/generate         // Text-to-speech
```

### E-commerce
```typescript
GET  /api/ecommerce/products      // List products
POST /api/ecommerce/products      // Create product
POST /api/ecommerce/scrape        // Scrape products
POST /api/ecommerce/pricing/update // Update pricing
GET  /api/ecommerce/orders        // List orders
POST /api/ecommerce/orders        // Create order
```

### Payments
```typescript
POST /api/payments/stripe/charge  // Stripe payment
POST /api/payments/crypto/pay     // Crypto payment
POST /api/payments/binance/pay    // Binance payment
GET  /api/payments/transactions   // List transactions
GET  /api/payments/wallet/balance // Get wallet balance
```

## 🛠️ Environment Variables

### Core Configuration
```bash
NODE_ENV=development              # development/production
PORT=1420                         # Frontend port
DATABASE_URL=postgresql://...     # Database connection
REDIS_URL=redis://localhost:6379  # Redis connection
JWT_SECRET=your-super-secret-key  # JWT signing secret
```

### AI Services
```bash
QWEN_API_URL=http://localhost:8001     # Qwen-3 endpoint
SDXL_API_URL=http://localhost:8002     # SDXL endpoint
WHISPER_API_URL=http://localhost:8003  # Whisper endpoint
COQUI_TTS_API_URL=http://localhost:8004 # TTS endpoint
JEAN_MODEL=qwen-3-72b                   # Default model
JEAN_TEMPERATURE=0.7                    # Response randomness
```

### Feature Flags
```bash
FEATURE_JEAN_ASSISTANT=true      # Enable Jean AI
FEATURE_AI_GENERATION=true       # Enable AI generation
FEATURE_PROXY_NETWORK=true       # Enable proxy network
FEATURE_VOICE_COMMANDS=true      # Enable voice commands
FEATURE_SOCIAL_FEATURES=true     # Enable social features
```

## 📁 Project Structure (Memorized)

### Key Directories
```
/src-tauri/src/          # Rust backend code
/src/                    # React frontend code
/database/               # Database schema & migrations
/docker/                 # Docker configurations
/scripts/                # Utility scripts
/docs/                   # Documentation
/tests/                  # Test files
```

### Important Files
- `src-tauri/src/main.rs` - Tauri main application
- `src/App.tsx` - React main component
- `database/schema.sql` - Complete database schema
- `docker-compose.yml` - Service orchestration
- `README.md` - Project documentation
- `package.json` - Node.js dependencies

## 🚀 Deployment Knowledge

### Development Setup
```bash
./run.sh              # Start all services (Linux/macOS)
run.bat               # Start all services (Windows)
npm run dev          # Start development server
```

### Production Deployment
```bash
npm run build                          # Build application
docker-compose -f docker-compose.prod.yml up -d  # Production stack
```

### Service URLs
- Main Interface: http://localhost:1420
- Dashboard: http://localhost:1420/dashboard
- Qwen-3 API: http://localhost:8001
- SDXL API: http://localhost:8002
- Whisper API: http://localhost:8003
- Coqui TTS API: http://localhost:8004

## 🔄 TRAE Agent Integration

### Available Agents (16 Total)
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

### Agent Integration
```typescript
interface TRAEAgent {
  id: string;
  name: string;
  capabilities: string[];
  endpoint: string;
  status: 'active' | 'inactive' | 'busy' | 'error';
}

// Agent invocation
POST /api/jean/trae/agents/{id}/invoke
GET  /api/jean/trae/agents
GET  /api/jean/trae/agents/{id}/status
```

## 🛡️ Security Best Practices

### Data Protection
- No sensitive data sent to cloud LLMs
- Local AI processing only
- End-to-end encryption for communications
- Zero-trust architecture

### Permission Management
- Time-limited delegated permissions
- Scope-specific access control
- UI confirmation for high-risk actions
- Comprehensive audit logging

### Privacy Settings
```typescript
interface PrivacyConfig {
  shareUsage: boolean;        // Share usage statistics
  storeHistory: boolean;      // Store conversation history
  privateFolderAccess: boolean; // Access private folders
  crashReports: boolean;      // Send crash reports
  telemetry: boolean;         // Enable telemetry
}
```

## 📊 Monitoring & Analytics

### System Health
```bash
# Check service health
curl http://localhost:8001/health  # Qwen-3
curl http://localhost:8002/health  # SDXL
curl http://localhost:8003/health  # Whisper
curl http://localhost:8004/health  # Coqui TTS

# View system metrics
curl http://localhost:1420/api/metrics
```

### Docker Monitoring
```bash
docker stats                      # Resource usage
docker ps                         # Running containers
docker logs jeantrail-os          # Application logs
```

## 🧪 Testing Framework

### Test Types
- Unit tests: Individual component testing
- Integration tests: Service interaction testing
- E2E tests: Full workflow testing
- Performance tests: Load and stress testing

### Test Commands
```bash
npm run test              # Run all tests
npm run test:unit         # Unit tests only
npm run test:integration  # Integration tests only
npm run test:e2e          # End-to-end tests
cargo test                # Rust backend tests
```

## 🔧 Troubleshooting Common Issues

### Database Issues
```bash
# Check database connection
psql $DATABASE_URL

# Reset database
npm run db:reset

# Run migrations manually
npm run migrate:up
```

### AI Service Issues
```bash
# Restart AI services
docker-compose restart qwen-3 sdxl whisper coqui-tts

# Check GPU availability
nvidia-smi

# Monitor resource usage
docker stats
```

### Frontend Issues
```bash
# Clear cache
npm run clean

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check TypeScript compilation
npm run type-check
```

## 📈 Performance Optimization

### Frontend Optimization
- Code splitting with React.lazy()
- Image optimization and lazy loading
- Service worker for caching
- Bundle size optimization

### Backend Optimization
- Database query optimization
- Connection pooling
- Caching with Redis
- Async processing for background tasks

### AI Service Optimization
- Model quantization
- Batch processing
- GPU acceleration
- Response caching

## 🌍 Internationalization

### Supported Languages
- English (en)
- Arabic (ar)
- Spanish (es)
- French (fr)
- German (de)
- Chinese (zh)
- Japanese (ja)
- 50+ total languages

### Language Configuration
```typescript
interface LanguageConfig {
  default: 'en';
  fallback: 'en';
  rtl: ['ar', 'he', 'fa'];
  translations: 'translations/';
}
```

---

## ✅ Jean AI Capabilities Summary

### ✅ **Core Competencies (Mastered)**
- [x] Complete JeanTrail OS architecture understanding
- [x] Full API endpoint knowledge (50+ endpoints)
- [x] Database schema mastery (15+ tables)
- [x] Frontend component architecture (50+ components)
- [x] Backend service integration (13 services)
- [x] AI service management (4 models)
- [x] Authentication & authorization flow
- [x] E-commerce system knowledge
- [x] Payment processing integration
- [x] Docker & deployment operations
- [x] Testing framework usage
- [x] Security best practices
- [x] Performance optimization techniques
- [x] Troubleshooting common issues
- [x] Internationalization support

### ✅ **Development Toolkit (Ready)**
- [x] Code generation & debugging
- [x] API development & documentation
- [x] Database migrations & management
- [x] Frontend component development
- [x] Backend service implementation
- [x] Testing suite creation
- [x] Deployment automation
- [x] Performance monitoring
- [x] Security auditing

### ✅ **Project Management (Active)**
- [x] Feature development planning
- [x] Bug triage and resolution
- [x] Code review and optimization
- [x] Documentation maintenance
- [x] User support & troubleshooting
- [x] System health monitoring
- [x] Release management

---

## 🚀 **Ready for Independent Operation**

Jean AI Assistant is now fully configured with:
- **Complete knowledge base** of JeanTrail OS
- **Development capabilities** across all tech stack
- **System administration** skills
- **Problem-solving expertise**
- **Multilingual support** for global users
- **Security-first approach** to all operations

**Status**: ✅ **OPERATIONAL & READY**

Jean can now independently manage, develop, and optimize JeanTrail OS while coordinating with TRAE agents and maintaining system security and performance.

---

*Knowledge Base v1.0 | Last Updated: December 2024 | Compiled by Jean AI Assistant*