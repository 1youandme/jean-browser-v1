# JeanTrail OS - Complete Backend + Jean Developer Console

## 🚀 Overview

JeanTrail OS is a comprehensive AI-driven operating system that combines the power of 16 TRAE agents with an unlimited Jean Orchestrator, providing a complete backend infrastructure for modern web applications and e-commerce platforms.

### 🎯 Key Features

- **Jean Orchestrator Unlimited**: Advanced AI agent with comprehensive permission system, memory store, and action execution
- **Jean Developer Console**: Complete admin interface for managing the entire system
- **16 TRAE Agents**: Specialized AI agents for different domains (UI design, scraping, DevOps, security, etc.)
- **Complete Backend APIs**: RESTful APIs for all system components
- **Real-time Monitoring**: Docker monitoring, system health checks, and performance metrics
- **Multi-service Architecture**: E-commerce, payments, security, email, and more

## 📋 Architecture

### Core Components

1. **Jean Orchestrator** (`jean_orchestrator.rs`)
   - Command processing and execution
   - Permission management with granular controls
   - Memory store with full-text search
   - Audit logging and action tracking
   - Docker container monitoring

2. **Jean Developer Console** (`JeanDeveloperConsole.tsx`)
   - Real-time dashboard with metrics
   - Agent management interface
   - Service control panels
   - Security audit tools
   - Chat interface with Jean AI

3. **TRAE Agents** (16 Specialized Agents)
   - UI Designer, Local AI, Scraper, DevOps, QA, Security
   - Mobile Emulator, Support, Proxy Manager, Marketplace
   - Payments, Shopify Integration, Media Generation
   - Offline Services, Automation Master

4. **Backend Services**
   - E-commerce with dynamic pricing
   - Payment processing (Stripe, PayPal, Crypto)
   - Security and audit logging
   - Email automation and templates
   - API key management

## 🛠️ Installation & Setup

### Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for frontend development)
- PostgreSQL 15+
- Redis 7+
- NVIDIA GPU (for AI models, optional)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/jeantrail/jeantrail-os.git
   cd jeantrail-os
   ```

2. **Environment Configuration**
   ```bash
   cp .env.jeantrail-os .env
   # Edit .env with your specific configuration
   ```

3. **Start with Docker Compose**
   ```bash
   docker-compose -f docker-compose.jeantrail-os.yml up -d
   ```

4. **Run Database Migrations**
   ```bash
   docker-compose exec jeantrail-backend sqlx migrate run
   ```

5. **Access the Services**
   - Jean Developer Console: http://localhost:3000/admin
   - API Documentation: http://localhost:8000/docs
   - Grafana Dashboard: http://localhost:3001
   - Prometheus: http://localhost:9090

### Development Setup

1. **Backend Development**
   ```bash
   cd src-tauri
   cargo install sqlx-cli
   sqlx migrate run
   cargo run
   ```

2. **Frontend Development**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## 📊 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    JeanTrail OS                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐    ┌──────────────────────────────┐   │
│  │   Frontend      │    │      Jean Developer Console  │   │
│  │   (React)       │    │         (Admin Interface)   │   │
│  └─────────────────┘    └──────────────────────────────┘   │
│           │                           │                     │
│           ▼                           ▼                     │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                   API Gateway                          │ │
│  │              (Axum + Middleware)                       │ │
│  └─────────────────────────────────────────────────────────┘ │
│           │                           │                     │
│           ▼                           ▼                     │
│  ┌─────────────────┐    ┌──────────────────────────────┐   │
│  │ Jean Orchestrator│   │         TRAE Agents         │   │
│  │   (Core AI)     │    │      (16 Specialized)       │   │
│  └─────────────────┘    └──────────────────────────────┘   │
│           │                           │                     │
│           ▼                           ▼                     │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                   Services Layer                       │ │
│  │  E-commerce | Payments | Security | Email | Monitoring │ │
│  └─────────────────────────────────────────────────────────┘ │
│           │                                                   │
│           ▼                                                   │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                Data Layer                               │ │
│  │     PostgreSQL | Redis | Docker | File Storage         │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Configuration

### Environment Variables

Key configuration options in `.env`:

```bash
# Jean Orchestrator
JEAN_LLM_MODEL=qwen:latest
JEAN_ENABLE_DOCKER_MONITORING=true
JEAN_MAX_MEMORY_MB=8192

# TRAE Agents
TRAE_ENABLED=true
TRAE_MAX_CONCURRENT_AGENTS=8

# Database
DATABASE_URL=postgresql://user:pass@localhost/jeantrail
REDIS_URL=redis://localhost:6379/0

# AI/LLM
LOCAL_LLM_HOST=localhost
LOCAL_LLM_PORT=8001
OPENAI_API_KEY=your-openai-key

# Payments
STRIPE_API_KEY=sk_live_...
PAYPAL_CLIENT_ID=your-paypal-id

# Email
SMTP_HOST=smtp.gmail.com
SMTP_USER=noreply@jeantrail.com

# Monitoring
PROMETHEUS_ENABLED=true
GRAFANA_ADMIN_PASSWORD=secure-password
```

### Database Schema

The system uses PostgreSQL with the following key tables:

- `jean_permissions` - Granular permission system
- `jean_actions_log` - Complete audit trail
- `jean_memories` - AI memory store
- `trae_agents` - Agent definitions and status
- `trae_agent_tasks` - Task queue management
- `products` - E-commerce product catalog
- `orders` - Order processing
- `users` - User management

## 🎮 Jean Developer Console

The Jean Developer Console provides a comprehensive admin interface with:

### Dashboard
- Real-time system metrics
- Service health monitoring
- Revenue and user analytics
- Recent activity feed

### Agent Management
- View all 16 TRAE agents
- Monitor agent status and performance
- Dispatch tasks to agents
- View agent logs and metrics

### Service Panels
- **E-commerce**: Product management, pricing, orders
- **Payments**: Transaction history, settlements
- **Security**: Audit logs, permissions, incidents
- **Email**: Templates, campaigns, analytics
- **API Keys**: Generate and manage API keys

### Jean Chat Interface
- Natural language interaction with Jean
- Action confirmation system
- Real-time task monitoring
- File attachment support

## 🤖 TRAE Agents

The 16 specialized TRAE agents cover all aspects of system operation:

### Development & Design
1. **JeanTrailUI Designer** - UI/UX design and prototyping
2. **ذكاء محلي محسن** - Local AI model optimization
3. **DevOps مهندس** - Infrastructure and deployment
4. **مهندس اختبارات** - Quality assurance and testing
5. **محاكي الجوال** - Mobile device emulation

### Business & Operations
6. **Scraper Commerce** - Product data extraction
7. **مدير مشروع البرمجيات** - Project coordination
8. **دعم جين تريل** - Customer support
9. **سوق جين ترايل** - E-commerce marketplace
10. **مدير العملة** - Payment processing

### Integration & Automation
11. **Shopify متكامل** - Shopify integration
12. **مدير بروكسي** - Proxy network management
13. **وسائط الذكاء** - Media generation (images, video)
14. **مدير خدمات بلا نت** - Offline services
15. **Automation Master** - Workflow automation
16. **أخصائي أمان** - Security and compliance

## 🔌 API Documentation

### Jean Orchestrator APIs

#### Actions
```http
POST /api/jean/action          # Execute action
POST /api/jean/action/{id}/approve  # Approve action
GET  /api/jean/actions/log     # Get action history
```

#### Memory & Chat
```http
POST /api/jean/chat/message    # Send message to Jean
GET  /api/jean/chat/history    # Get chat history
POST /api/jean/memory/save     # Save to memory
GET  /api/jean/memory/search   # Search memory
```

#### Permissions
```http
GET  /api/jean/permissions     # Get user permissions
POST /api/jean/permissions     # Grant permission
DELETE /api/jean/permissions/{id}  # Revoke permission
```

### TRAE Agent APIs

#### Agent Management
```http
GET    /api/agents              # List all agents
GET    /api/agents/{id}         # Get agent details
POST   /api/agents              # Create agent
PUT    /api/agents/{id}         # Update agent
DELETE /api/agents/{id}         # Delete agent
```

#### Task Execution
```http
POST /api/agents/{id}/execute   # Dispatch task
GET  /api/agents/{id}/tasks     # Get agent tasks
GET  /api/agents/{id}/logs      # Get agent logs
POST /api/agents/{id}/control   # Control agent (start/pause/stop)
```

### Service APIs

#### E-commerce
```http
GET    /api/ecommerce/products  # List products
POST   /api/ecommerce/products  # Create product
POST   /api/ecommerce/pricing/apply  # Apply pricing
POST   /api/ecommerce/scraper/run   # Run scraper
```

#### Payments
```http
GET  /api/payments/transactions  # Get transactions
POST /api/payments/transfer      # Create transfer
GET  /api/payments/balance       # Get balance
```

## 🔍 Monitoring & Observability

### System Metrics
- CPU, Memory, Disk usage
- Network I/O and throughput
- Docker container status
- Database performance
- API response times

### Health Checks
```http
GET /api/health              # System health
GET /api/jean/system/status  # Jean status
GET /api/services/health     # Services health
```

### Monitoring Stack
- **Prometheus**: Metrics collection
- **Grafana**: Visualization and dashboards
- **ELK Stack**: Log aggregation (optional)
- **Custom alerts**: System notifications

## 🔒 Security Features

### Authentication & Authorization
- JWT-based authentication
- API key management
- Granular permission system
- Role-based access control

### Audit & Compliance
- Complete action logging
- Data retention policies
- GDPR compliance
- Security incident tracking

### Network Security
- HTTPS enforcement
- CORS configuration
- Rate limiting
- IP whitelisting for admin

## 📈 Performance Optimization

### Caching Strategy
- Redis for session caching
- Application-level caching
- Database query optimization
- CDN integration

### Scalability
- Horizontal scaling support
- Load balancing ready
- Database connection pooling
- Microservices architecture

## 🚀 Deployment Options

### Docker Deployment (Recommended)
```bash
docker-compose -f docker-compose.jeantrail-os.yml up -d
```

### Kubernetes Deployment
```bash
kubectl apply -f k8s/
```

### Cloud Deployment
- AWS ECS/EKS
- Google Cloud Run/GKE
- Azure Container Instances
- DigitalOcean App Platform

## 🛠️ Development

### Project Structure
```
jeantrail-os/
├── src-tauri/                 # Backend (Rust)
│   ├── src/
│   │   ├── routes/           # API routes
│   │   ├── handlers/         # Request handlers
│   │   ├── models/           # Data models
│   │   └── services/         # Business logic
│   └── migrations/           # Database migrations
├── src/                      # Frontend (React)
│   ├── components/           # React components
│   ├── pages/               # Page components
│   ├── services/            # API services
│   └── hooks/               # Custom hooks
├── agents/                   # TRAE agents
├── monitoring/               # Monitoring configs
├── nginx/                    # Reverse proxy
└── docker-compose.jeantrail-os.yml
```

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📞 Support

### Documentation
- [API Documentation](http://localhost:8000/docs)
- [Agent Configuration Guide](./docs/agents.md)
- [Security Guide](./docs/security.md)
- [Deployment Guide](./docs/deployment.md)

### Community
- Discord: [JeanTrail Community](https://discord.gg/jeantrail)
- GitHub Issues: [Report Issues](https://github.com/jeantrail/jeantrail-os/issues)
- Email: support@jeantrail.com

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Qwen AI Team for the local LLM model
- TRAE Agent Framework contributors
- Rust and Axum communities
- React and TypeScript teams
- All JeanTrail OS contributors

---

**JeanTrail OS** - The Future of AI-Driven Web Infrastructure 🚀