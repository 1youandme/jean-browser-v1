-- E-commerce Dropshipping Database Schema
-- Migration 004: E-commerce System Tables

-- Products Table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    brand VARCHAR(200),
    sku VARCHAR(100) UNIQUE,
    upc VARCHAR(50),
    images JSONB, -- Array of image URLs with metadata
    specifications JSONB, -- Product specifications
    variants JSONB, -- Size, color, etc. options
    tags TEXT[],
    
    -- Source Information
    source_url VARCHAR(1000) NOT NULL,
    source_platform VARCHAR(50) NOT NULL CHECK (source_platform IN ('alibaba', '1688', 'amazon', 'aliexpress')),
    source_product_id VARCHAR(200),
    upload_date TIMESTAMP WITH TIME ZONE,
    
    -- Pricing Information
    cost_price DECIMAL(10,2) NOT NULL, -- Supplier price
    selling_price DECIMAL(10,2),
    margin_percentage DECIMAL(5,2),
    shipping_cost DECIMAL(10,2),
    total_cost DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Competitor Pricing
    amazon_price DECIMAL(10,2),
    aliexpress_price DECIMAL(10,2),
    competitor_margin DECIMAL(5,2),
    price_last_updated TIMESTAMP WITH TIME ZONE,
    
    -- Status and Flags
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'analyzing', 'priced', 'active', 'inactive', 'discontinued')),
    is_new BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    is_promo_active BOOLEAN DEFAULT FALSE,
    is_visible BOOLEAN DEFAULT TRUE,
    
    -- Inventory (for reference, not used in dropshipping)
    stock_status VARCHAR(20) DEFAULT 'available',
    min_order_quantity INTEGER DEFAULT 1,
    
    -- SEO
    meta_title VARCHAR(500),
    meta_description TEXT,
    slug VARCHAR(500),
    
    -- Weights and Dimensions
    weight_kg DECIMAL(8,3),
    length_cm DECIMAL(8,2),
    width_cm DECIMAL(8,2),
    height_cm DECIMAL(8,2),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    priced_at TIMESTAMP WITH TIME ZONE,
    launched_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for products
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_subcategory ON products(subcategory);
CREATE INDEX idx_products_new ON products(is_new) WHERE is_new = TRUE;
CREATE INDEX idx_products_promo ON products(is_promo_active) WHERE is_promo_active = TRUE;
CREATE INDEX idx_products_featured ON products(is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_products_visible ON products(is_visible) WHERE is_visible = TRUE;
CREATE INDEX idx_products_source_platform ON products(source_platform);
CREATE INDEX idx_products_created ON products(created_at);
CREATE INDEX idx_products_tags ON products USING GIN(tags);

-- Suppliers Table
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(300) NOT NULL,
    company_name VARCHAR(300),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    address TEXT,
    country VARCHAR(100),
    city VARCHAR(100),
    postal_code VARCHAR(20),
    
    -- Platform Information
    platform VARCHAR(50) NOT NULL CHECK (platform IN ('alibaba', '1688', 'amazon', 'aliexpress')),
    platform_seller_id VARCHAR(200),
    platform_url VARCHAR(1000),
    
    -- Performance Metrics
    rating DECIMAL(3,2) CHECK (rating >= 1.0 AND rating <= 5.0),
    total_transactions INTEGER DEFAULT 0,
    response_rate DECIMAL(5,2), -- percentage
    response_time_hours DECIMAL(5,2),
    years_on_platform INTEGER,
    
    -- Business Information
    business_type VARCHAR(50), -- manufacturer, trading_company, wholesaler
    main_products TEXT[],
    production_capacity VARCHAR(200),
    certifications JSONB,
    
    -- Status
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    is_preferred BOOLEAN DEFAULT FALSE,
    
    -- Jean Developer Notes
    internal_notes TEXT,
    communication_templates JSONB, -- Message templates
    last_contacted TIMESTAMP WITH TIME ZONE,
    contact_frequency VARCHAR(20) DEFAULT 'weekly', -- daily, weekly, monthly
    
    -- Financial
    payment_terms JSONB,
    average_lead_time_days INTEGER,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for suppliers
CREATE INDEX idx_suppliers_platform ON suppliers(platform);
CREATE INDEX idx_suppliers_active ON suppliers(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_suppliers_verified ON suppliers(is_verified) WHERE is_verified = TRUE;
CREATE INDEX idx_suppliers_preferred ON suppliers(is_preferred) WHERE is_preferred = TRUE;
CREATE INDEX idx_suppliers_rating ON suppliers(rating);
CREATE INDEX idx_suppliers_country ON suppliers(country);

-- Shipping Options Table
CREATE TABLE shipping_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    name VARCHAR(200) NOT NULL,
    carrier VARCHAR(100) NOT NULL, -- DHL, FedEx, UPS, etc.
    shipping_type VARCHAR(50) NOT NULL CHECK (shipping_type IN ('express', 'standard', 'economy', 'sea', 'air')),
    
    -- Shipping Details
    origin_country VARCHAR(100) NOT NULL,
    origin_city VARCHAR(100),
    destination_zones JSONB, -- Array of country codes or regions
    estimated_days_min INTEGER,
    estimated_days_max INTEGER,
    
    -- Cost Structure
    base_cost DECIMAL(10,2) NOT NULL,
    cost_per_kg DECIMAL(8,2) DEFAULT 0,
    cost_per_cbm DECIMAL(8,2) DEFAULT 0,
    free_shipping_threshold DECIMAL(10,2),
    
    -- Restrictions
    max_weight_kg DECIMAL(8,2),
    max_volume_cbm DECIMAL(8,2),
    prohibited_items JSONB, -- Array of restricted item types
    
    -- Tracking
    tracking_available BOOLEAN DEFAULT TRUE,
    insurance_available BOOLEAN DEFAULT FALSE,
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for shipping options
CREATE INDEX idx_shipping_supplier ON shipping_options(supplier_id);
CREATE INDEX idx_shipping_carrier ON shipping_options(carrier);
CREATE INDEX idx_shipping_active ON shipping_options(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_shipping_destination ON shipping_options USING GIN(destination_zones);

-- Pricing Snapshots Table
CREATE TABLE pricing_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id),
    
    -- Supplier Pricing
    supplier_price DECIMAL(10,2) NOT NULL,
    supplier_currency VARCHAR(3) DEFAULT 'USD',
    shipping_cost DECIMAL(10,2) DEFAULT 0,
    
    -- Market Analysis
    amazon_price DECIMAL(10,2),
    aliexpress_price DECIMAL(10,2),
    market_average DECIMAL(10,2),
    market_min DECIMAL(10,2),
    market_max DECIMAL(10,2),
    
    -- Calculated Pricing
    recommended_price DECIMAL(10,2) NOT NULL,
    recommended_margin DECIMAL(5,2) NOT NULL,
    competitor_diff_percentage DECIMAL(5,2),
    
    -- AI Insights
    pricing_strategy VARCHAR(50) CHECK (pricing_strategy IN ('premium', 'competitive', 'budget', 'penetration')),
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0),
    ai_notes TEXT,
    demand_score DECIMAL(3,2),
    competition_level VARCHAR(20) CHECK (competition_level IN ('low', 'medium', 'high')),
    
    -- 1688AIBUY Integration
    aibuy_price DECIMAL(10,2),
    aibuy_insights JSONB,
    aibuy_confidence DECIMAL(3,2),
    aibuy_extracted_at TIMESTAMP WITH TIME ZONE,
    
    -- Price History
    price_trend VARCHAR(20) CHECK (price_trend IN ('increasing', 'decreasing', 'stable')),
    seasonality_factor DECIMAL(3,2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for pricing snapshots
CREATE INDEX idx_pricing_snapshots_product ON pricing_snapshots(product_id);
CREATE INDEX idx_pricing_snapshots_created ON pricing_snapshots(created_at);
CREATE INDEX idx_pricing_snapshots_strategy ON pricing_snapshots(pricing_strategy);
CREATE INDEX idx_pricing_snapshots_confidence ON pricing_snapshots(confidence_score);

-- Promotions Table
CREATE TABLE promotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id), -- NULL for global promotions
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200),
    description TEXT,
    
    -- Discount Details
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed', 'free_shipping')),
    discount_value DECIMAL(10,2) NOT NULL,
    minimum_order_value DECIMAL(10,2),
    
    -- Timing
    starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Usage Limits
    max_uses INTEGER,
    current_uses INTEGER DEFAULT 0,
    max_uses_per_user INTEGER,
    
    -- Targeting
    applicable_countries JSONB,
    customer_segments JSONB,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    auto_generated BOOLEAN DEFAULT FALSE,
    promo_type VARCHAR(30) DEFAULT 'general', -- new_product, seasonal, clearance, general
    
    -- Performance
    conversion_rate DECIMAL(5,2),
    total_revenue_impact DECIMAL(10,2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for promotions
CREATE INDEX idx_promotions_product ON promotions(product_id);
CREATE INDEX idx_promotions_code ON promotions(code);
CREATE INDEX idx_promotions_active ON promotions(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_promotions_type ON promotions(promo_type);
CREATE INDEX idx_promotions_dates ON promotions(starts_at, ends_at);

-- Orders Table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID NOT NULL REFERENCES users(id),
    
    -- Order Details
    items JSONB NOT NULL, -- Array of order items with product details
    subtotal DECIMAL(10,2) NOT NULL,
    shipping_cost DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Customer Information
    shipping_address JSONB NOT NULL,
    billing_address JSONB,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50),
    
    -- Order Processing
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed', 'partially_refunded')),
    payment_method VARCHAR(50),
    transaction_id VARCHAR(200),
    payment_gateway VARCHAR(50),
    
    -- Supplier Integration
    supplier_order_id VARCHAR(200),
    supplier_tracking_number VARCHAR(200),
    supplier_cost DECIMAL(10,2),
    
    -- Fulfillment
    fulfillment_status VARCHAR(20) DEFAULT 'unfulfilled',
    tracking_carrier VARCHAR(100),
    estimated_delivery TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    notes TEXT,
    internal_notes TEXT, -- Visible to staff only
    source VARCHAR(50) DEFAULT 'website', -- website, api, admin
    affiliate_code VARCHAR(50),
    
    -- Timestamps
    order_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    processed_at TIMESTAMP WITH TIME ZONE,
    shipped_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for orders
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_date ON orders(order_date);
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_affiliate ON orders(affiliate_code);
CREATE INDEX idx_orders_supplier_order ON orders(supplier_order_id);

-- Order Status History Table
CREATE TABLE order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id),
    status VARCHAR(20) NOT NULL,
    notes TEXT,
    internal_only BOOLEAN DEFAULT FALSE, -- Visible to staff only
    
    -- Location Tracking
    current_location VARCHAR(200),
    estimated_delivery TIMESTAMP WITH TIME ZONE,
    
    -- Notifications
    customer_notified BOOLEAN DEFAULT FALSE,
    notification_method VARCHAR(50), -- email, sms, push
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id) -- Staff user who made the change
);

-- Indexes for order status history
CREATE INDEX idx_order_status_history_order ON order_status_history(order_id);
CREATE INDEX idx_order_status_history_created ON order_status_history(created_at);

-- Product Categories Table
CREATE TABLE product_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES product_categories(id),
    image_url VARCHAR(500),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    meta_title VARCHAR(500),
    meta_description TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for categories
CREATE INDEX idx_categories_parent ON product_categories(parent_id);
CREATE INDEX idx_categories_active ON product_categories(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_categories_sort ON product_categories(sort_order);

-- Customer Addresses Table
CREATE TABLE customer_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    type VARCHAR(20) NOT NULL CHECK (type IN ('shipping', 'billing')),
    is_default BOOLEAN DEFAULT FALSE,
    
    -- Address Details
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    company VARCHAR(200),
    address_line_1 VARCHAR(255) NOT NULL,
    address_line_2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) NOT NULL,
    phone VARCHAR(50),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for customer addresses
CREATE INDEX idx_customer_addresses_user ON customer_addresses(user_id);
CREATE INDEX idx_customer_addresses_default ON customer_addresses(user_id, is_default) WHERE is_default = TRUE;

-- Shopping Cart Table
CREATE TABLE shopping_cart (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    session_id VARCHAR(100), -- For guest users
    product_id UUID NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL, -- Snapshot of price at time of adding
    variant_data JSONB, -- Selected variants (size, color, etc.)
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, product_id) when user_id is not null,
    UNIQUE(session_id, product_id) when user_id is null
);

-- Indexes for shopping cart
CREATE INDEX idx_cart_user ON shopping_cart(user_id);
CREATE INDEX idx_cart_session ON shopping_cart(session_id);
CREATE INDEX idx_cart_product ON shopping_cart(product_id);

-- Affiliates Table (Future)
CREATE TABLE affiliates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    affiliate_code VARCHAR(50) UNIQUE NOT NULL,
    
    -- Commission Structure
    commission_rate DECIMAL(5,2) NOT NULL, -- percentage
    cookie_duration_days INTEGER DEFAULT 30,
    payout_threshold DECIMAL(10,2) DEFAULT 50.00,
    
    -- Performance
    total_clicks INTEGER DEFAULT 0,
    total_conversions INTEGER DEFAULT 0,
    total_commission DECIMAL(10,2) DEFAULT 0,
    total_sales DECIMAL(10,2) DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    approved_at TIMESTAMP WITH TIME ZONE,
    rejected_reason TEXT,
    
    -- Payout Information
    payout_method VARCHAR(50),
    payout_details JSONB,
    last_payout_date TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for affiliates
CREATE INDEX idx_affiliates_user ON affiliates(user_id);
CREATE INDEX idx_affiliates_code ON affiliates(affiliate_code);
CREATE INDEX idx_affiliates_active ON affiliates(is_active) WHERE is_active = TRUE;

-- Add updated_at triggers
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_promotions_updated_at BEFORE UPDATE ON promotions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_categories_updated_at BEFORE UPDATE ON product_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customer_addresses_updated_at BEFORE UPDATE ON customer_addresses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shopping_cart_updated_at BEFORE UPDATE ON shopping_cart FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_affiliates_updated_at BEFORE UPDATE ON affiliates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();