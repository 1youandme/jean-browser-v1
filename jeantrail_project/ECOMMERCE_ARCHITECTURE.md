# E-commerce Dropshipping Architecture Design

## Business Model

### Core Structure
- **Single Owner Store**: Dropshipping store owned by the platform owner
- **Multi-level Affiliate System**: Future expansion for affiliate partners
- **Primary Source**: Alibaba/1688 products with automated scraping
- **Secondary Sources**: Amazon, AliExpress for price comparison

### Product Flow
1. **Scraping Phase**: Extract product data from Alibaba/1688
2. **Analysis Phase**: Process through Jean Developer Studio
3. **Pricing Phase**: Smart pricing calculation
4. **Promo Phase**: 24-hour promo period
5. **Launch Phase**: Product appears in storefront

## Database Schema

### Products Table
```sql
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    brand VARCHAR(200),
    sku VARCHAR(100) UNIQUE,
    images JSONB, -- Array of image URLs
    specifications JSONB, -- Product specifications
    variants JSONB, -- Size, color, etc. options
    
    -- Source Information
    source_url VARCHAR(1000) NOT NULL,
    source_platform VARCHAR(50) NOT NULL, -- alibaba, amazon, aliexpress
    source_product_id VARCHAR(200),
    upload_date TIMESTAMP WITH TIME ZONE,
    
    -- Pricing Information
    cost_price DECIMAL(10,2) NOT NULL, -- Supplier price
    selling_price DECIMAL(10,2),
    margin_percentage DECIMAL(5,2),
    shipping_cost DECIMAL(10,2),
    total_cost DECIMAL(10,2),
    
    -- Competitor Pricing
    amazon_price DECIMAL(10,2),
    aliexpress_price DECIMAL(10,2),
    competitor_margin DECIMAL(5,2),
    
    -- Status and Flags
    status VARCHAR(20) DEFAULT 'pending', -- pending, analyzing, priced, active, inactive
    is_new BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    is_promo_active BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    priced_at TIMESTAMP WITH TIME ZONE,
    launched_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_new ON products(is_new) WHERE is_new = TRUE;
CREATE INDEX idx_products_promo ON products(is_promo_active) WHERE is_promo_active = TRUE;
```

### Suppliers Table
```sql
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(300) NOT NULL,
    company_name VARCHAR(300),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    address TEXT,
    country VARCHAR(100),
    city VARCHAR(100),
    
    -- Platform Information
    platform VARCHAR(50) NOT NULL, -- alibaba, 1688, etc.
    platform_seller_id VARCHAR(200),
    platform_url VARCHAR(1000),
    
    -- Performance Metrics
    rating DECIMAL(3,2), -- 1.0 to 5.0
    total_transactions INTEGER DEFAULT 0,
    response_rate DECIMAL(5,2), -- percentage
    years_on_platform INTEGER,
    
    -- Status
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Jean Developer Notes
    internal_notes TEXT,
    communication_templates JSONB, -- Message templates
    last_contacted TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Shipping Options Table
```sql
CREATE TABLE shipping_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    name VARCHAR(200) NOT NULL,
    carrier VARCHAR(100) NOT NULL, -- DHL, FedEx, etc.
    shipping_type VARCHAR(50) NOT NULL, -- express, standard, economy
    
    -- Shipping Details
    origin_country VARCHAR(100) NOT NULL,
    destination_zones JSONB, -- Array of country codes
    estimated_days_min INTEGER,
    estimated_days_max INTEGER,
    
    -- Cost Structure
    base_cost DECIMAL(10,2) NOT NULL,
    cost_per_kg DECIMAL(8,2) DEFAULT 0,
    free_shipping_threshold DECIMAL(10,2),
    
    -- Restrictions
    max_weight_kg DECIMAL(8,2),
    prohibited_items JSONB, -- Array of restricted item types
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Pricing Snapshots Table
```sql
CREATE TABLE pricing_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id),
    
    -- Supplier Pricing
    supplier_price DECIMAL(10,2) NOT NULL,
    supplier_currency VARCHAR(3) DEFAULT 'USD',
    
    -- Market Analysis
    amazon_price DECIMAL(10,2),
    aliexpress_price DECIMAL(10,2),
    market_average DECIMAL(10,2),
    
    -- Calculated Pricing
    recommended_price DECIMAL(10,2) NOT NULL,
    recommended_margin DECIMAL(5,2) NOT NULL,
    competitor_diff_percentage DECIMAL(5,2),
    
    -- AI Insights
    pricing_strategy VARCHAR(50), -- premium, competitive, budget
    confidence_score DECIMAL(3,2), -- 0.0 to 1.0
    ai_notes TEXT,
    
    -- 1688AIBUY Integration
    aibuy_price DECIMAL(10,2),
    aibuy_insights JSONB,
    aibuy_confidence DECIMAL(3,2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_pricing_snapshots_product ON pricing_snapshots(product_id);
CREATE INDEX idx_pricing_snapshots_created ON pricing_snapshots(created_at);
```

### Promotions Table
```sql
CREATE TABLE promotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id),
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_type VARCHAR(20) NOT NULL, -- percentage, fixed
    discount_value DECIMAL(10,2) NOT NULL,
    
    -- Timing
    starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Usage Limits
    max_uses INTEGER,
    current_uses INTEGER DEFAULT 0,
    max_uses_per_user INTEGER,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    auto_generated BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Orders Table
```sql
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID NOT NULL REFERENCES users(id),
    
    -- Order Details
    items JSONB NOT NULL, -- Array of order items
    subtotal DECIMAL(10,2) NOT NULL,
    shipping_cost DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    
    -- Customer Information
    shipping_address JSONB NOT NULL,
    billing_address JSONB,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50),
    
    -- Order Processing
    status VARCHAR(20) DEFAULT 'pending', -- pending, confirmed, processing, shipped, delivered, cancelled
    payment_status VARCHAR(20) DEFAULT 'pending', -- pending, paid, refunded, failed
    payment_method VARCHAR(50),
    transaction_id VARCHAR(200),
    
    -- Supplier Integration
    supplier_order_id VARCHAR(200),
    supplier_tracking_number VARCHAR(200),
    
    -- Timestamps
    order_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    shipped_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_date ON orders(order_date);
```

### Order Status History Table
```sql
CREATE TABLE order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id),
    status VARCHAR(20) NOT NULL,
    notes TEXT,
    internal_only BOOLEAN DEFAULT FALSE, -- Visible to staff only
    
    -- Location Tracking
    current_location VARCHAR(200),
    estimated_delivery TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id) -- Staff user who made the change
);
```

### Affiliates Table (Future)
```sql
CREATE TABLE affiliates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    affiliate_code VARCHAR(50) UNIQUE NOT NULL,
    
    -- Commission Structure
    commission_rate DECIMAL(5,2) NOT NULL, -- percentage
    cookie_duration_days INTEGER DEFAULT 30,
    
    -- Performance
    total_clicks INTEGER DEFAULT 0,
    total_conversions INTEGER DEFAULT 0,
    total_commission DECIMAL(10,2) DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    approved_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Smart Pricing Algorithm

### Default Margin Strategy
```typescript
interface PricingCalculation {
  costPrice: number;           // Supplier price + shipping
  defaultMargin: number;       // 40%
  minMargin: number;          // 10%
  competitorThreshold: number; // 10-15%
  
  calculatePrice(product: Product): SmartPrice {
    const totalCost = product.supplierPrice + product.shippingCost;
    const defaultPrice = totalCost * (1 + this.defaultMargin);
    
    // Competitor analysis
    if (product.amazonPrice && product.amazonPrice < defaultPrice) {
      const diffPercentage = (defaultPrice - product.amazonPrice) / product.amazonPrice;
      if (diffPercentage > this.competitorThreshold) {
        return {
          price: totalCost * (1 + 0.25), // Reduce to 25% margin
          margin: 25,
          strategy: 'competitive',
          reason: 'Competitor price significantly lower'
        };
      }
    }
    
    return {
      price: defaultPrice,
      margin: this.defaultMargin,
      strategy: 'standard',
      reason: 'Standard margin applied'
    };
  }
}
```

### Promo Code Generation
```typescript
interface PromoGenerator {
  generateNewProductPromo(productId: string): Promotion {
    const discount = Math.floor(Math.random() * 21) + 5; // 5-25%
    const code = `JEANTRAIL-NEW-${this.generateRandomString(5)}`;
    
    return {
      code,
      discountType: 'percentage',
      discountValue: discount,
      startsAt: new Date(),
      endsAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      maxUses: 100,
      productId
    };
  }
}
```

## API Endpoints

### Product Management
- `GET /ecommerce/products` - List products with filters
- `GET /ecommerce/products/{id}` - Get product details
- `POST /ecommerce/products` - Create new product (from scraper)
- `PUT /ecommerce/products/{id}` - Update product
- `POST /ecommerce/products/{id}/price` - Calculate and set price
- `GET /ecommerce/products/new` - Get new products (last 24 hours)

### Developer Studio
- `GET /ecommerce/studio/products/pending` - Get products awaiting pricing
- `POST /ecommerce/studio/products/{id}/approve` - Approve product pricing
- `PUT /ecommerce/studio/products/{id}/price` - Manually adjust price
- `GET /ecommerce/studio/suppliers` - Get supplier information
- `POST /ecommerce/studio/suppliers/{id}/contact` - Log supplier contact

### Pricing Service
- `POST /ecommerce/pricing/calculate` - Calculate smart pricing
- `GET /ecommerce/pricing/snapshots/{productId}` - Get pricing history
- `POST /ecommerce/pricing/competitor-analysis` - Analyze competitor prices
- `GET /ecommerce/pricing/insights` - Get AI pricing insights

### Order Management
- `GET /ecommerce/orders` - List orders
- `POST /ecommerce/orders` - Create order
- `GET /ecommerce/orders/{id}` - Get order details
- `PUT /ecommerce/orders/{id}/status` - Update order status
- `GET /ecommerce/orders/{id}/tracking` - Get tracking information

## Frontend Components

### StoreFront Components
```typescript
// Product listing with search and filters
interface StoreFrontProps {
  searchQuery?: string;
  category?: string;
  priceRange?: [number, number];
  sortBy?: string;
}

// Product detail with pricing and promo
interface ProductDetailProps {
  productId: string;
  showPricing?: boolean;
  allowPurchase?: boolean;
}

// New products landing page
interface NewProductsLandingProps {
  timeFilter?: '24h' | '7d' | '30d';
  category?: string;
}
```

### Developer Studio Components
```typescript
// Product review and pricing interface
interface DeveloperStudioProps {
  productId: string;
  showSupplierInfo?: boolean;
  enablePriceAdjustment?: boolean;
}

// Supplier management interface
interface SupplierConsoleProps {
  supplierId?: string;
  showCommunication?: boolean;
}

// Pricing analytics dashboard
interface PricingAnalyticsProps {
  timeRange?: string;
  category?: string;
}
```

## Enhanced Scraper Script

### Product Data Extraction
```javascript
class AlibabaScraper {
  async extractProductData(url) {
    const product = {
      // Basic Information
      title: await this.extractTitle(),
      description: await this.extractDescription(),
      images: await this.extractImages(),
      specifications: await this.extractSpecifications(),
      variants: await this.extractVariants(),
      
      // Source Information
      sourceUrl: url,
      sourcePlatform: 'alibaba',
      sourceProductId: await this.extractProductId(),
      uploadDate: await this.extractUploadDate(),
      
      // Pricing
      supplierPrice: await this.extractPrice(),
      moq: await this.extractMOQ(),
      priceRanges: await this.extractPriceRanges(),
      
      // Supplier Information
      supplier: await this.extractSupplierInfo(),
      
      // Shipping Information
      shippingOptions: await this.extractShippingOptions(),
      
      // Auto-categorization
      category: await this.categorizeProduct(),
      isNew: await this.checkIfNew()
    };
    
    return product;
  }
  
  async extractSupplierInfo() {
    return {
      name: await this.getSupplierName(),
      company: await this.getCompanyName(),
      rating: await this.getSupplierRating(),
      responseRate: await this.getResponseRate(),
      yearsOnPlatform: await this.getYearsOnPlatform(),
      location: await this.getSupplierLocation()
    };
  }
  
  async categorizeProduct() {
    const title = await this.extractTitle();
    const description = await this.extractDescription();
    
    // Use AI or keyword-based categorization
    return this.aiCategorization(title, description);
  }
  
  async checkIfNew() {
    const uploadDate = await this.extractUploadDate();
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    return uploadDate > twentyFourHoursAgo;
  }
}
```

This architecture provides a comprehensive foundation for the dropshipping store with intelligent pricing, supplier management, and a clear separation between customer-facing features and developer tools.