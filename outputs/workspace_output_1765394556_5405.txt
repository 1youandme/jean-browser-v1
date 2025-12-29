# JeanTrail Browser - Enhanced Folder Structure

## Updated Directory Tree

```
jeantrail-browser/
├── src-tauri/
│   ├── src/
│   │   ├── main.rs                    # Main application entry point
│   │   ├── lib.rs                     # Tauri lib.rs entry point
│   │   ├── commands.rs                # Tauri commands for frontend
│   │   ├── ai.rs                      # AI backend abstraction
│   │   ├── workspace.rs               # Workspace management
│   │   ├── proxy.rs                   # Proxy network layer
│   │   ├── local_fs.rs                # Local file system operations
│   │   ├── models.rs                  # Database models
│   │   ├── backlog.rs                 # CSV backlog management
│   │   ├── loyalty.rs                 # Loyalty programs management
│   │   ├── plugins.rs                 # Plugin system
│   │   ├── security.rs                # Security & authentication
│   │   ├── integrations.rs            # External integrations
│   │   ├── video_studio.rs            # Video studio service
│   │   ├── local_hub.rs               # Local hub management
│   │   ├── auto_api.rs                # Auto API extractor
│   │   ├── transport.rs               # Transport layer
│   │   ├── jean_core.rs               # NEW: Jean AI orchestrator core
│   │   ├── jean_permissions.rs        # NEW: Jean permission system
│   │   ├── docker_monitor.rs          # NEW: Docker container monitoring
│   │   ├── memory_store.rs            # NEW: Jean memory management
│   │   ├── ecommerce.rs               # NEW: E-commerce backend
│   │   ├── scraper.rs                 # NEW: Product scraper service
│   │   ├── pricing.rs                 # NEW: Smart pricing service
│   │   └── suppliers.rs               # NEW: Supplier management
│   ├── migrations/
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_phase2_extensions.sql
│   │   ├── 003_jean_orchestrator.sql  # NEW: Jean core tables
│   │   └── 004_ecommerce_extension.sql # NEW: E-commerce tables
│   └── Cargo.toml
├── src/
│   ├── main.tsx                       # React app entry point
│   ├── App.tsx                        # Main application component
│   ├── types.ts                       # TypeScript type definitions
│   ├── components/
│   │   ├── Header.tsx                 # Top navigation bar
│   │   ├── TabsStrip.tsx              # Tab management
│   │   ├── SplitView.tsx              # Multi-pane layout
│   │   ├── JeanAssistant.tsx          # Jean AI assistant UI
│   │   ├── BrowserView.tsx            # Web browser component
│   │   ├── LocalFileBrowser.tsx       # Local file explorer
│   │   ├── ProxyPanel.tsx             # Proxy network panel
│   │   ├── MobileFrame.tsx            # Mobile emulator
│   │   ├── jean/                      # NEW: Jean-specific components
│   │   │   ├── JeanSettings.tsx       # Jean configuration panel
│   │   │   ├── PermissionManager.tsx  # Permission management UI
│   │   │   ├── MemoryViewer.tsx       # Memory browser
│   │   │   ├── DockerMonitor.tsx      # Container monitoring
│   │   │   ├── TRAEAgents.tsx         # TRAE agent management
│   │   │   └── JeanChat.tsx           # Enhanced chat interface
│   │   └── ecommerce/                 # NEW: E-commerce components
│   │       ├── StoreFront.tsx         # Main storefront
│   │       ├── ProductList.tsx        # Product listing
│   │       ├── ProductDetail.tsx      # Product details
│   │       ├── NewProductsLanding.tsx # New products page
│   │       ├── Cart.tsx               # Shopping cart
│   │       ├── Checkout.tsx           # Checkout process
│   │       ├── OrderTracking.tsx      # Order tracking
│   │       ├── DeveloperStudio.tsx    # Developer console
│   │       ├── ProductReview.tsx      # Product review interface
│   │       ├── SupplierConsole.tsx    # Supplier management
│   │       ├── PricingAnalytics.tsx   # Pricing dashboard
│   │       └── PromoManager.tsx       # Promotion management
│   ├── pages/
│   │   ├── jeantrail/
│   │   │   ├── EcommercePage.tsx      # E-commerce main page
│   │   │   ├── JobBoardPage.tsx
│   │   │   ├── DeliveryPage.tsx
│   │   │   └── index.ts
│   │   └── developer/                 # NEW: Developer-specific pages
│   │       ├── Studio.tsx             # Main developer studio
│   │       ├── ProductStudio.tsx      # Product development
│   │       ├── SupplierStudio.tsx     # Supplier management
│   │       ├── PricingStudio.tsx      # Pricing analysis
│   │       └── AnalyticsDashboard.tsx # Analytics dashboard
│   ├── hooks/
│   │   ├── useTabs.ts                 # Tab management hook
│   │   ├── useJeanAI.ts               # Jean AI communication
│   │   ├── useJeanPermissions.ts      # NEW: Permission management
│   │   ├── useJeanMemory.ts           # NEW: Memory operations
│   │   ├── useDockerMonitor.ts        # NEW: Container monitoring
│   │   ├── useTRAEAgents.ts           # NEW: TRAE agent integration
│   │   ├── useEcommerce.ts            # NEW: E-commerce operations
│   │   ├── useProducts.ts             # NEW: Product management
│   │   ├── useSuppliers.ts            # NEW: Supplier operations
│   │   ├── usePricing.ts              # NEW: Pricing calculations
│   │   └── useOrders.ts               # NEW: Order management
│   ├── services/
│   │   ├── index.ts                   # Service registry
│   │   ├── workspace.ts               # Workspace service
│   │   ├── proxy.ts                   # Proxy service
│   │   ├── ecommerce.ts               # E-commerce service stubs
│   │   ├── jobboard.ts
│   │   ├── delivery.ts
│   │   ├── realestate.ts
│   │   ├── socialfeed.ts
│   │   ├── medialibrary.ts
│   │   ├── developerhub.ts
│   │   ├── loyaltywallet.ts
│   │   ├── portfolio.ts
│   │   ├── jean/                      # NEW: Jean-related services
│   │   │   ├── jeanCore.ts            # Jean core API client
│   │   │   ├── permissions.ts         # Permission service
│   │   │   ├── memory.ts              # Memory store service
│   │   │   ├── docker.ts              # Docker monitoring service
│   │   │   └── traeAgents.ts          # TRAE agent service
│   │   └── ecommerce/                 # NEW: E-commerce services
│   │       ├── products.ts            # Product management
│   │       ├── suppliers.ts           # Supplier operations
│   │       ├── pricing.ts             # Pricing service
│   │       ├── orders.ts              # Order management
│   │       ├── scraper.ts             # Scraper service
│   │       ├── payments.ts            # Payment processing
│   │       └── analytics.ts           # Analytics service
│   └── styles/
│       ├── index.css                  # Global styles
│       └── components/                # Component-specific styles
│           ├── jean.css               # NEW: Jean component styles
│           └── ecommerce.css          # NEW: E-commerce styles
├── scripts/
│   ├── scrape_products.js             # Enhanced scraper script
│   ├── scraper/                       # NEW: Scraper modules
│   │   ├── alibaba.js                 # Alibaba scraper
│   │   ├── amazon.js                  # Amazon price checker
│   │   ├── aliexpress.js              # AliExpress scraper
│   │   ├── categorizer.js             # Product categorization
│   │   ├── imageDownloader.js         # Image processing
│   │   └── priceAnalyzer.js           # Price analysis
│   ├── pricing/                       # NEW: Pricing modules
│   │   ├── calculator.js              # Smart pricing calculator
│   │   ├── competitor.js              # Competitor analysis
│   │   ├── promoGenerator.js          # Promo code generator
│   │   └── insights.js                # AI pricing insights
│   └── utils/                         # Utility scripts
│       ├── dataProcessor.js           # Data processing utilities
│       ├── fileManager.js             # File operations
│       └── logger.js                  # Logging utilities
├── database/
│   ├── schema.sql                     # Complete database schema
│   ├── migrations/
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_phase2_extensions.sql
│   │   ├── 003_jean_orchestrator.sql
│   │   ├── 004_ecommerce_extension.sql
│   │   └── 005_indexes_triggers.sql   # NEW: Performance optimizations
│   ├── seeds/
│   │   ├── users.sql                  # User seed data
│   │   ├── categories.sql             # Product categories
│   │   └── sample_products.sql        # Sample product data
│   └── backups/                       # Database backup directory
├── extension/
│   └── auto-api-extractor/
│       ├── manifest.json
│       ├── background.js
│       ├── content.js
│       ├── injected.js
│       ├── popup.html
│       └── popup.js
├── plugins/
│   └── hello-ai/
│       ├── manifest.json
│       ├── index.html
│       ├── styles.css
│       ├── script.js
│       └── icon.svg
├── docker/
│   ├── Dockerfile                     # Application container
│   ├── docker-compose.yml             # Development environment
│   ├── docker-compose.prod.yml        # Production environment
│   └── configs/
│       ├── postgres.conf              # PostgreSQL configuration
│       ├── redis.conf                 # Redis configuration
│       └── nginx.conf                 # Nginx configuration
├── docs/
│   ├── architecture/                  # Architecture documentation
│   │   ├── JEAN_ARCHITECTURE.md
│   │   ├── ECOMMERCE_ARCHITECTURE.md
│   │   └── FOLDER_STRUCTURE.md
│   ├── api/                           # API documentation
│   │   ├── jean_api.md                # Jean API endpoints
│   │   ├── ecommerce_api.md           # E-commerce API
│   │   └── tra_agents_api.md          # TRAE agents API
│   ├── guides/                        # User guides
│   │   ├── developer_setup.md         # Developer setup guide
│   │   ├── jean_configuration.md      # Jean configuration
│   │   └── ecommerce_management.md    # E-commerce management
│   └── examples/                      # Code examples
│       ├── jean_integration.js        # Jean integration examples
│       ├── scraper_usage.js           # Scraper usage examples
│       └── pricing_automation.js      # Pricing automation examples
├── tests/
│   ├── backend/                       # Backend tests
│   │   ├── jean_tests.rs              # Jean core tests
│   │   ├── ecommerce_tests.rs         # E-commerce tests
│   │   └── scraper_tests.js           # Scraper tests
│   ├── frontend/                      # Frontend tests
│   │   ├── jean_components.test.tsx   # Jean component tests
│   │   └── ecommerce_components.test.tsx # E-commerce tests
│   └── integration/                   # Integration tests
│       ├── jean_browser.test.ts       # Jean-browser integration
│       └── ecommerce_flow.test.ts     # E-commerce flow tests
├── .env.example                       # Environment variables template
├── .gitignore
├── README.md
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── tailwind.config.js
├── vite.config.ts
└── index.html
```

## Key New Additions

### 1. Jean Orchestrator Layer
- **Backend**: `jean_core.rs`, `jean_permissions.rs`, `docker_monitor.rs`, `memory_store.rs`
- **Frontend**: Jean-specific components and hooks
- **Database**: New tables for Jean operations, permissions, memory, and TRAE agents

### 2. E-commerce Enhancement
- **Backend**: `ecommerce.rs`, `scraper.rs`, `pricing.rs`, `suppliers.rs`
- **Frontend**: Complete e-commerce component suite
- **Developer Studio**: Dedicated development interface for product management
- **Scripts**: Enhanced scraper with modular architecture

### 3. Service Layer Expansion
- **Jean Services**: Core Jean functionality APIs
- **E-commerce Services**: Complete e-commerce operation services
- **Developer Tools**: Analytics, pricing insights, supplier management

### 4. Database Organization
- **Schema Extensions**: New migration files for Jean and e-commerce
- **Performance**: Indexes and triggers for optimization
- **Seed Data**: Sample data for development and testing

### 5. Documentation & Testing
- **Architecture Docs**: Comprehensive documentation
- **API Documentation**: Detailed API guides
- **Test Coverage**: Backend, frontend, and integration tests

### 6. Developer Experience
- **Modular Scraper**: Separate modules for different platforms
- **Pricing Engine**: Smart pricing with competitor analysis
- **Developer Studio**: Professional development interface

This structure provides a solid foundation for implementing the Jean AI orchestrator and the enhanced e-commerce dropshipping system while maintaining clean separation of concerns and scalability.