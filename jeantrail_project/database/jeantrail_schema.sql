-- JeanTrail Browser Database Schema
-- Complete database structure for all system components

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'banned');
CREATE TYPE subscription_tier AS ENUM ('free', 'basic', 'premium', 'enterprise');
CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded', 'disputed');
CREATE TYPE shipment_status AS ENUM ('pending', 'processing', 'shipped', 'in_transit', 'customs', 'out_for_delivery', 'delivered', 'returned', 'lost', 'damaged');
CREATE TYPE verification_level AS ENUM ('none', 'email', 'phone', 'identity', 'business');
CREATE TYPE transaction_type AS ENUM ('payment', 'refund', 'chargeback', 'dispute', 'fee');
CREATE TYPE reward_tier AS ENUM ('bronze', 'silver', 'gold', 'platinum', 'diamond');

-- =================================================================
-- USER MANAGEMENT TABLES
-- =================================================================

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    avatar_url VARCHAR(500),
    date_of_birth DATE,
    gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
    
    -- Location information
    country VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    address TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Preferences
    language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'UTC',
    currency VARCHAR(3) DEFAULT 'USD',
    notifications_email BOOLEAN DEFAULT true,
    notifications_push BOOLEAN DEFAULT true,
    notifications_sms BOOLEAN DEFAULT false,
    profile_visibility VARCHAR(20) DEFAULT 'public' CHECK (profile_visibility IN ('public', 'friends', 'private')),
    show_email BOOLEAN DEFAULT false,
    show_phone BOOLEAN DEFAULT false,
    show_location BOOLEAN DEFAULT true,
    
    -- Status and verification
    status user_status DEFAULT 'active',
    email_verified BOOLEAN DEFAULT false,
    phone_verified BOOLEAN DEFAULT false,
    identity_verified BOOLEAN DEFAULT false,
    address_verified BOOLEAN DEFAULT false,
    business_verified BOOLEAN DEFAULT false,
    
    -- Security
    two_factor_enabled BOOLEAN DEFAULT false,
    last_password_change TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    login_attempts INTEGER DEFAULT 0,
    blocked_until TIMESTAMP WITH TIME ZONE,
    
    -- Roles and permissions
    roles TEXT[] DEFAULT ARRAY['user'],
    permissions TEXT[] DEFAULT ARRAY['buy'],
    
    -- Metadata
    notes TEXT,
    tags TEXT[] DEFAULT ARRAY[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
);

-- User subscriptions
CREATE TABLE user_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tier subscription_tier NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP WITH TIME ZONE,
    features TEXT[] DEFAULT ARRAY[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =================================================================
-- PRODUCT AND E-COMMERCE TABLES
-- =================================================================

-- Categories
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(10),
    parent_id UUID REFERENCES categories(id),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Products
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    short_description TEXT,
    
    -- Supplier information
    supplier_id UUID NOT NULL REFERENCES users(id),
    supplier_name VARCHAR(255) NOT NULL,
    supplier_rating DECIMAL(3,2) DEFAULT 0.00,
    supplier_response_rate INTEGER DEFAULT 0,
    supplier_response_time VARCHAR(50),
    supplier_location_country VARCHAR(100),
    supplier_location_city VARCHAR(100),
    supplier_verified BOOLEAN DEFAULT false,
    supplier_years_on_platform INTEGER DEFAULT 0,
    
    -- Pricing
    price DECIMAL(15,2) NOT NULL,
    original_price DECIMAL(15,2),
    currency VARCHAR(3) DEFAULT 'USD',
    discount_percentage DECIMAL(5,2) DEFAULT 0.00,
    
    -- Inventory
    moq INTEGER DEFAULT 1, -- Minimum Order Quantity
    stock INTEGER DEFAULT 0,
    sku VARCHAR(100) UNIQUE,
    
    -- Category and tags
    category_id UUID REFERENCES categories(id),
    subcategory VARCHAR(100),
    tags TEXT[] DEFAULT ARRAY[],
    
    -- Media
    images TEXT[] DEFAULT ARRAY[],
    videos TEXT[] DEFAULT ARRAY[],
    
    -- Shipping
    free_shipping BOOLEAN DEFAULT false,
    shipping_cost DECIMAL(15,2) DEFAULT 0.00,
    estimated_delivery VARCHAR(50),
    shipping_locations TEXT[] DEFAULT ARRAY[],
    
    -- Specifications
    specifications JSONB DEFAULT '{}',
    
    -- Rating and reviews
    rating DECIMAL(3,2) DEFAULT 0.00,
    reviews_count INTEGER DEFAULT 0,
    
    -- Statistics
    views INTEGER DEFAULT 0,
    orders INTEGER DEFAULT 0,
    wishlist_count INTEGER DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    is_trending BOOLEAN DEFAULT false,
    
    -- Timestamps
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Metadata
    source VARCHAR(100) DEFAULT 'manual',
    external_id VARCHAR(100),
    scraped_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =================================================================
-- ORDERS AND TRANSACTIONS TABLES
-- =================================================================

-- Orders
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id),
    
    -- Order details
    status VARCHAR(50) DEFAULT 'pending',
    subtotal DECIMAL(15,2) NOT NULL,
    tax_amount DECIMAL(15,2) DEFAULT 0.00,
    shipping_amount DECIMAL(15,2) DEFAULT 0.00,
    discount_amount DECIMAL(15,2) DEFAULT 0.00,
    total_amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Shipping information
    shipping_address JSONB NOT NULL,
    billing_address JSONB,
    
    -- Payment information
    payment_status VARCHAR(50) DEFAULT 'pending',
    payment_method_id UUID,
    payment_method_type VARCHAR(50),
    payment_method_name VARCHAR(100),
    
    -- Notes
    customer_notes TEXT,
    admin_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'
);

-- Transactions
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference VARCHAR(100) UNIQUE NOT NULL,
    type transaction_type NOT NULL,
    status payment_status NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    usd_amount DECIMAL(15,2) NOT NULL, -- Always store USD equivalent
    
    -- Payment method
    payment_method_type VARCHAR(50),
    payment_method_name VARCHAR(100),
    payment_method_last4 VARCHAR(4),
    
    -- Associated records
    order_id UUID REFERENCES orders(id),
    user_id UUID NOT NULL REFERENCES users(id),
    
    -- Fees
    processing_fee DECIMAL(15,2) DEFAULT 0.00,
    platform_fee DECIMAL(15,2) DEFAULT 0.00,
    total_fee DECIMAL(15,2) DEFAULT 0.00,
    net_amount DECIMAL(15,2) NOT NULL,
    
    -- Description
    description TEXT,
    metadata JSONB DEFAULT '{}',
    
    -- Gateway information
    gateway_provider VARCHAR(100),
    gateway_transaction_id VARCHAR(255),
    gateway_authorization_code VARCHAR(100),
    
    -- Risk assessment
    risk_score INTEGER DEFAULT 0,
    risk_level VARCHAR(20) DEFAULT 'low',
    risk_flags TEXT[] DEFAULT ARRAY[],
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- =================================================================
-- SHIPPING AND DELIVERY TABLES
-- =================================================================

-- Carriers
CREATE TABLE carriers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL, -- express, standard, economy, freight
    services TEXT[] DEFAULT ARRAY[],
    coverage TEXT[] DEFAULT ARRAY[],
    rating DECIMAL(3,2) DEFAULT 0.00,
    reviews_count INTEGER DEFAULT 0,
    contact_phone VARCHAR(50),
    contact_email VARCHAR(255),
    website VARCHAR(500),
    
    -- Pricing
    base_rate DECIMAL(15,2) NOT NULL,
    per_kg_rate DECIMAL(10,4),
    per_km_rate DECIMAL(10,4),
    fuel_surcharge DECIMAL(5,2),
    
    -- Features and availability
    features TEXT[] DEFAULT ARRAY[],
    is_available BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Shipments
CREATE TABLE shipments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tracking_number VARCHAR(100) UNIQUE NOT NULL,
    order_id UUID REFERENCES orders(id),
    shipment_reference VARCHAR(100) UNIQUE NOT NULL,
    
    -- Status
    status shipment_status NOT NULL,
    
    -- Carrier information
    carrier_id UUID NOT NULL REFERENCES carriers(id),
    carrier_name VARCHAR(100) NOT NULL,
    carrier_type VARCHAR(50),
    
    -- Route information
    origin_address JSONB NOT NULL,
    origin_city VARCHAR(100) NOT NULL,
    origin_country VARCHAR(100) NOT NULL,
    origin_postal_code VARCHAR(20),
    
    destination_address JSONB NOT NULL,
    destination_city VARCHAR(100) NOT NULL,
    destination_country VARCHAR(100) NOT NULL,
    destination_postal_code VARCHAR(20),
    
    -- Recipient information
    recipient_name VARCHAR(255) NOT NULL,
    recipient_phone VARCHAR(50) NOT NULL,
    recipient_email VARCHAR(255),
    
    -- Package information
    package_weight DECIMAL(10,3) NOT NULL,
    package_length DECIMAL(10,2),
    package_width DECIMAL(10,2),
    package_height DECIMAL(10,2),
    package_description TEXT,
    package_value DECIMAL(15,2),
    package_currency VARCHAR(3) DEFAULT 'USD',
    insurance BOOLEAN DEFAULT false,
    
    -- Shipping details
    shipping_method VARCHAR(100),
    shipping_cost DECIMAL(15,2),
    estimated_delivery DATE,
    actual_delivery DATE,
    service_type VARCHAR(50),
    
    -- Current tracking
    current_location VARCHAR(255),
    delay_reason TEXT,
    
    -- Costs
    total_cost DECIMAL(15,2) NOT NULL,
    cost_currency VARCHAR(3) DEFAULT 'USD',
    
    -- Notes
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =================================================================
-- REWARDS AND ACHIEVEMENTS TABLES
-- =================================================================

-- User rewards
CREATE TABLE user_rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_points INTEGER DEFAULT 0,
    available_points INTEGER DEFAULT 0,
    spent_points INTEGER DEFAULT 0,
    current_tier reward_tier DEFAULT 'bronze',
    current_tier_points INTEGER DEFAULT 0,
    next_tier_points INTEGER DEFAULT 1000,
    
    -- Streak information
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_activity_date DATE DEFAULT CURRENT_DATE,
    
    -- Referral information
    referral_count INTEGER DEFAULT 0,
    successful_referrals INTEGER DEFAULT 0,
    referral_points_earned INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =================================================================
-- NEWS TABLES
-- =================================================================

-- News sources
CREATE TABLE news_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    url VARCHAR(500) NOT NULL,
    country VARCHAR(100),
    category VARCHAR(50),
    reliability INTEGER CHECK (reliability >= 1 AND reliability <= 10),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- News articles
CREATE TABLE news_articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    summary TEXT,
    content TEXT,
    url VARCHAR(1000) UNIQUE NOT NULL,
    
    -- Source information
    source_id UUID NOT NULL REFERENCES news_sources(id),
    source_name VARCHAR(100) NOT NULL,
    source_logo VARCHAR(500),
    source_country VARCHAR(100),
    
    -- Author and publication
    author VARCHAR(255),
    published_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Categories and tags
    category VARCHAR(100),
    tags TEXT[] DEFAULT ARRAY[],
    
    -- Engagement metrics
    views INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    
    -- Sentiment analysis
    sentiment VARCHAR(20) DEFAULT 'neutral',
    importance INTEGER CHECK (importance >= 1 AND importance <= 10) DEFAULT 5,
    
    -- Media
    image_url VARCHAR(1000),
    
    -- User interactions
    is_bookmarked BOOLEAN DEFAULT false,
    is_read BOOLEAN DEFAULT false,
    
    -- Timestamps
    scraped_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =================================================================
-- CURRENCY TABLES
-- =================================================================

-- Currencies
CREATE TABLE currencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(3) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    rate DECIMAL(20,8) NOT NULL, -- Rate to USD
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    decimal_places INTEGER DEFAULT 2,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =================================================================
-- INDEXES FOR PERFORMANCE
-- =================================================================

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_country ON users(country);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Products indexes
CREATE INDEX idx_products_supplier_id ON products(supplier_id);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_created_at ON products(created_at);

-- Orders indexes
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- Transactions indexes
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_order_id ON transactions(order_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);

-- Shipments indexes
CREATE INDEX idx_shipments_order_id ON shipments(order_id);
CREATE INDEX idx_shipments_carrier_id ON shipments(carrier_id);
CREATE INDEX idx_shipments_status ON shipments(status);
CREATE INDEX idx_shipments_tracking_number ON shipments(tracking_number);

-- News articles indexes
CREATE INDEX idx_news_articles_source_id ON news_articles(source_id);
CREATE INDEX idx_news_articles_published_at ON news_articles(published_at);
CREATE INDEX idx_news_articles_category ON news_articles(category);

-- =================================================================
-- INITIAL DATA
-- =================================================================

-- Insert default currencies
INSERT INTO currencies (code, name, symbol, rate, is_default) VALUES
('USD', 'US Dollar', '$', 1.0, true),
('EUR', 'Euro', '€', 0.92, false),
('GBP', 'British Pound', '£', 0.79, false),
('SAR', 'Saudi Riyal', '﷼', 3.75, false),
('AED', 'UAE Dirham', 'د.إ', 3.67, false),
('CNY', 'Chinese Yuan', '¥', 7.24, false),
('INR', 'Indian Rupee', '₹', 83.12, false);

-- Insert default categories
INSERT INTO categories (name, slug, description, icon) VALUES
('Electronics', 'electronics', 'Electronic devices and accessories', '💻'),
('Clothing & Fashion', 'clothing-fashion', 'Apparel and fashion items', '👕'),
('Beauty & Personal Care', 'beauty-personal-care', 'Cosmetics and personal care products', '💄'),
('Home & Garden', 'home-garden', 'Home improvement and garden supplies', '🏠'),
('Sports & Outdoors', 'sports-outdoors', 'Sports equipment and outdoor gear', '⚽'),
('Toys & Hobbies', 'toys-hobbies', 'Toys and hobby items', '🎮'),
('Automotive', 'automotive', 'Car parts and accessories', '🚗'),
('Industrial Equipment', 'industrial-equipment', 'Industrial machinery and equipment', '🏭');

COMMIT;