-- Jean Orchestrator & E-commerce Enhancements
-- Migration 005: Enhanced permissions, categories, and product flow

-- Enhanced Jean Permissions with Templates
CREATE TABLE jean_permission_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    default_actions JSONB NOT NULL, -- Array of default action types
    default_scopes JSONB NOT NULL, -- Array of default scopes
    default_limits JSONB, -- Default limits for amount, usage, time
    is_system BOOLEAN DEFAULT FALSE, -- System templates vs user-created
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert system permission templates
INSERT INTO jean_permission_templates (name, description, default_actions, default_scopes, default_limits, is_system) VALUES
('Basic Assistant', 'Allow basic assistance without financial actions', '["read_tab", "summarize", "suggest"]', '["*", "local.*", "web.*"]', '{"amount": 0, "usage": 100, "hours": 24}', TRUE),
('File Manager', 'Limited file management operations', '["read_file", "create_file", "delete_temp"]', '["local.temp/*", "local.downloads/*"]', '{"amount": 0, "usage": 50, "hours": 8}', TRUE),
('Shopper Assistant', 'Shopping and browsing assistance', '["read_tab", "search_products", "compare_prices"]', '["web.*", "ecommerce.*"]', '{"amount": 100, "usage": 30, "hours": 12}', TRUE),
('Developer Mode', 'Full development and system access', '["*"]', '["*"]', '{"amount": 1000, "usage": 1000, "hours": 72}', TRUE);

-- Enhanced Jean Memory with Context Links
ALTER TABLE jean_memory ADD COLUMN parent_memory_id UUID REFERENCES jean_memory(id);
ALTER TABLE jean_memory ADD COLUMN relevance_score DECIMAL(3,2) DEFAULT 0.5;
ALTER TABLE jean_memory ADD COLUMN access_count INTEGER DEFAULT 0;
ALTER TABLE jean_memory ADD COLUMN last_accessed TIMESTAMP WITH TIME ZONE;
ALTER TABLE jean_memory ADD COLUMN project_context JSONB; -- Project-specific context

CREATE INDEX idx_jean_memory_parent ON jean_memory(parent_memory_id);
CREATE INDEX idx_jean_memory_relevance ON jean_memory(relevance_score);
CREATE INDEX idx_jean_memory_accessed ON jean_memory(last_accessed);

-- Service Status Monitoring
CREATE TABLE service_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_name VARCHAR(100) NOT NULL,
    service_type VARCHAR(50) NOT NULL, -- docker, process, external_api
    status VARCHAR(20) NOT NULL CHECK (status IN ('running', 'stopped', 'error', 'starting', 'restarting')),
    health_endpoint VARCHAR(500),
    metrics JSONB, -- CPU, RAM, disk usage, etc.
    last_check TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    restart_count INTEGER DEFAULT 0,
    error_message TEXT,
    config JSONB, -- Service configuration
    is_monitored BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_service_status_name ON service_status(service_name);
CREATE INDEX idx_service_status_type ON service_status(service_type);
CREATE INDEX idx_service_status_status ON service_status(status);
CREATE INDEX idx_service_status_monitored ON service_status(is_active) WHERE is_monitored = TRUE;

-- Categories System with External Mapping
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) NOT NULL UNIQUE,
    description TEXT,
    parent_id UUID REFERENCES categories(id),
    level INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    external_mappings JSONB, -- {google_taxonomy_id: "123", alibaba_path: "sample"}
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE subcategories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    external_mappings JSONB,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(category_id, slug)
);

CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_active ON categories(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_categories_level ON categories(level);
CREATE INDEX idx_subcategories_category ON subcategories(category_id);
CREATE INDEX idx_subcategories_active ON subcategories(is_active) WHERE is_active = TRUE;

-- Insert initial categories (Apparel & Accessories focus)
INSERT INTO categories (name, slug, description, level, external_mappings) VALUES
('Apparel & Accessories', 'apparel-accessories', 'Clothing, shoes, and fashion accessories', 1, 
 '{"google_taxonomy_id": "182", "alibaba_paths": ["Apparel", "Fashion Accessories", "Clothing"]}');

INSERT INTO subcategories (category_id, name, slug, description, external_mappings) VALUES
((SELECT id FROM categories WHERE slug = 'apparel-accessories'), 'Bermuda Shorts', 'bermuda-shorts', 
 'Casual knee-length shorts', '{"google_taxonomy_id": "1836", "keywords": ["bermuda", "shorts", "casual"]}'),
((SELECT id FROM categories WHERE slug = 'apparel-accessories'), 'Cravats', 'cravats', 
 'Formal neckwear accessories', '{"google_taxonomy_id": "1837", "keywords": ["cravat", "neckwear", "formal"]}'),
((SELECT id FROM categories WHERE slug = 'apparel-accessories'), 'T-Shirts', 't-shirts', 
 'Casual and graphic t-shirts', '{"google_taxonomy_id": "1840", "keywords": ["t-shirt", "tee", "casual shirt"]}'),
((SELECT id FROM categories WHERE slug = 'apparel-accessories'), 'Dresses', 'dresses', 
 'Various styles of dresses', '{"google_taxonomy_id": "1844", "keywords": ["dress", "gown", "formal wear"]}');

-- Enhanced Products with Category Links
ALTER TABLE products ADD COLUMN category_id UUID REFERENCES categories(id);
ALTER TABLE products ADD COLUMN subcategory_id UUID REFERENCES subcategories(id);
ALTER TABLE products ADD COLUMN raw_category_path TEXT; -- Original category path from source
ALTER TABLE products ADD COLUMN quality_score DECIMAL(3,2); -- AI-generated quality score 0-1
ALTER TABLE products ADD COLUMN demand_score DECIMAL(3,2); -- AI-generated demand score 0-1
ALTER TABLE products ADD COLUMN competition_level VARCHAR(20) CHECK (competition_level IN ('low', 'medium', 'high'));
ALTER TABLE products ADD COLUMN aibuy_data JSONB; -- 1688AIBUY integration data
ALTER TABLE products ADD COLUMN supplier_notes TEXT; -- Internal supplier notes

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_subcategory ON products(subcategory_id);
CREATE INDEX idx_products_quality ON products(quality_score);
CREATE INDEX idx_products_demand ON products(demand_score);
CREATE INDEX idx_products_competition ON products(competition_level);

-- Pricing Intelligence System
CREATE TABLE pricing_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    run_type VARCHAR(20) NOT NULL CHECK (run_type IN ('initial', 'competitor_check', 'auto_adjust')),
    input_data JSONB, -- Cost, shipping, competitor prices
    calculation_rules JSONB, -- Pricing rules applied
    result_data JSONB, -- Calculated prices and margins
    confidence_score DECIMAL(3,2), -- AI confidence in pricing
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE pricing_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    run_id UUID REFERENCES pricing_runs(id),
    
    -- Pricing Data
    cost_price DECIMAL(10,2) NOT NULL,
    shipping_cost DECIMAL(10,2),
    total_cost DECIMAL(10,2),
    selling_price DECIMAL(10,2) NOT NULL,
    margin_percentage DECIMAL(5,2),
    margin_amount DECIMAL(10,2),
    
    -- Competitor Data
    amazon_price DECIMAL(10,2),
    aliexpress_price DECIMAL(10,2),
    cheapest_competitor VARCHAR(50),
    competitor_advantage DECIMAL(5,2), -- Our price advantage percentage
    
    -- AI Insights
    demand_forecast JSONB,
    competition_analysis JSONB,
    quality_impact JSONB,
    recommended_price DECIMAL(10,2),
    pricing_strategy VARCHAR(50),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_pricing_runs_product ON pricing_runs(product_id);
CREATE INDEX idx_pricing_runs_type ON pricing_runs(run_type);
CREATE INDEX idx_pricing_snapshots_product ON pricing_snapshots(product_id);
CREATE INDEX idx_pricing_snapshots_created ON pricing_snapshots(created_at);

-- Enhanced Promotions System
ALTER TABLE promotions ADD COLUMN promo_type VARCHAR(20) CHECK (promo_type IN ('auto_new', 'manual', 'seasonal', 'clearance'));
ALTER TABLE promotions ADD COLUMN target_audience JSONB; -- {customer_type, location, etc}
ALTER TABLE promotions ADD COLUMN usage_limits JSONB; -- {per_customer, total_usage}
ALTER TABLE promotions ADD COLUMN ai_generated BOOLEAN DEFAULT FALSE;
ALTER TABLE promotions ADD COLUMN performance_metrics JSONB; -- Clicks, conversions, revenue

CREATE TABLE promo_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promotion_id UUID NOT NULL REFERENCES promotions(id),
    customer_id UUID REFERENCES customers(id),
    order_id UUID REFERENCES orders(id),
    discount_amount DECIMAL(10,2) NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Tracking
    ip_address INET,
    user_agent TEXT,
    referrer VARCHAR(500)
);

CREATE INDEX idx_promo_usage_promotion ON promo_usage(promotion_id);
CREATE INDEX idx_promo_usage_customer ON promo_usage(customer_id);
CREATE INDEX idx_promo_usage_order ON promo_usage(order_id);
CREATE INDEX idx_promo_usage_used ON promo_usage(used_at);

-- Product Status History
CREATE TABLE product_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    old_status VARCHAR(20),
    new_status VARCHAR(20) NOT NULL,
    change_reason VARCHAR(100),
    changed_by UUID REFERENCES users(id),
    automated_change BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_product_status_history_product ON product_status_history(product_id);
CREATE INDEX idx_product_status_history_created ON product_status_history(created_at);

-- Service Accounts for External Integrations
CREATE TABLE service_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_name VARCHAR(100) NOT NULL, -- gmail, colab, n8n, etc.
    email_address VARCHAR(255) NOT NULL,
    purpose VARCHAR(100) NOT NULL, -- support, sales, colab_gpu, workflows
    display_name VARCHAR(200),
    is_active BOOLEAN DEFAULT TRUE,
    access_level VARCHAR(20) CHECK (access_level IN ('read', 'write', 'admin')),
    oauth_config JSONB, -- OAuth configuration (encrypted in production)
    usage_stats JSONB, -- API usage, quota, etc.
    last_used TIMESTAMP WITH TIME ZONE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_service_accounts_email ON service_accounts(email_address, service_name);
CREATE INDEX idx_service_accounts_active ON service_accounts(is_active) WHERE is_active = TRUE;

-- Triggers for updated_at
CREATE TRIGGER update_service_status_updated_at BEFORE UPDATE ON service_status FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subcategories_updated_at BEFORE UPDATE ON subcategories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_service_accounts_updated_at BEFORE UPDATE ON service_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add category_id foreign key constraint for existing products
ALTER TABLE products ADD CONSTRAINT fk_products_category 
    FOREIGN KEY (category_id) REFERENCES categories(id);
ALTER TABLE products ADD CONSTRAINT fk_products_subcategory 
    FOREIGN KEY (subcategory_id) REFERENCES subcategories(id);