use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use sqlx::{PgPool, Row};

use crate::commands::{CommandResult, DatabasePool};
use super::categories::CategoryService;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Product {
    pub id: Uuid,
    pub title: String,
    pub description: Option<String>,
    pub category_id: Option<Uuid>,
    pub subcategory_id: Option<Uuid>,
    pub raw_category_path: Option<String>,
    pub brand: Option<String>,
    pub sku: Option<String>,
    pub upc: Option<String>,
    pub images: Vec<String>,
    pub specifications: serde_json::Value,
    pub variants: serde_json::Value,
    pub tags: Vec<String>,

    // Source Information
    pub source_url: String,
    pub source_platform: String,
    pub source_product_id: Option<String>,
    pub upload_date: Option<DateTime<Utc>>,

    // Pricing Information
    pub cost_price: f64,
    pub selling_price: Option<f64>,
    pub margin_percentage: Option<f64>,
    pub shipping_cost: Option<f64>,
    pub total_cost: Option<f64>,
    pub currency: String,

    // Competitor Pricing
    pub amazon_price: Option<f64>,
    pub aliexpress_price: Option<f64>,
    pub competitor_margin: Option<f64>,
    pub price_last_updated: Option<DateTime<Utc>>,

    // Status and Flags
    pub status: String,
    pub is_new: bool,
    pub is_featured: bool,
    pub is_promo_active: bool,
    pub is_visible: bool,

    // AI Scores
    pub quality_score: Option<f64>,
    pub demand_score: Option<f64>,
    pub competition_level: Option<String>,

    // Additional Data
    pub aibuy_data: Option<serde_json::Value>,
    pub supplier_notes: Option<String>,
    pub stock_status: String,
    pub min_order_quantity: i32,

    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProductImport {
    pub source_url: String,
    pub source_platform: String,
    pub title: String,
    pub description: Option<String>,
    pub price: f64,
    pub images: Vec<String>,
    pub supplier_id: Option<String>,
    pub supplier_name: Option<String>,
    pub supplier_rating: Option<f64>,
    pub min_order_quantity: i32,
    pub specifications: serde_json::Value,
    pub variants: serde_json::Value,
    pub raw_category_path: Option<String>,
    pub shipping_cost: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProductSearch {
    pub query: Option<String>,
    pub category_id: Option<Uuid>,
    pub subcategory_id: Option<Uuid>,
    pub source_platform: Option<String>,
    pub status: Option<String>,
    pub is_new: Option<bool>,
    pub min_price: Option<f64>,
    pub max_price: Option<f64>,
    pub min_quality_score: Option<f64>,
    pub min_demand_score: Option<f64>,
    pub sort_by: Option<String>, // created_at, price, quality_score, demand_score
    pub sort_order: Option<String>, // asc, desc
    pub limit: Option<i32>,
    pub offset: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProductAnalysis {
    pub product_id: Uuid,
    pub demand_score: f64,
    pub competition_level: String,
    pub quality_score: f64,
    pub market_fit: f64,
    pub recommended_price: f64,
    pub insights: Vec<String>,
    pub competitor_analysis: serde_json::Value,
    pub profit_potential: f64,
}

pub struct ProductService {
    db_pool: sqlx::PgPool,
    category_service: CategoryService,
}

impl ProductService {
    pub fn new(db_pool: sqlx::PgPool) -> Self {
        Self {
            db_pool: db_pool.clone(),
            category_service: CategoryService::new(db_pool),
        }
    }

    /// Import product from scraper data
    pub async fn import_product(&self, import_data: ProductImport) -> CommandResult<Uuid> {
        let mut conn = self.db_pool.acquire().await
            .map_err(|e| format!("Failed to get connection: {}", e))?;

        // Auto-categorize the product
        let (category_id, subcategory_id) = self.category_service
            .categorize_product(&import_data.raw_category_path)
            .await?;

        // Generate SKU if not provided
        let sku = import_data.sku.or_else(|| {
            Some(format!("JT-{}-{}", 
                import_data.source_platform.to_uppercase().chars().take(3).collect::<String>(),
                Uuid::new_v4().to_string().chars().take(8).collect::<String>()
            ))
        });

        // Calculate initial cost
        let total_cost = import_data.price + import_data.shipping_cost.unwrap_or(0.0);

        // Create product
        let product_id = sqlx::query_scalar!(
            r#"
            INSERT INTO products (
                title, description, category_id, subcategory_id, raw_category_path,
                sku, upc, images, specifications, variants, tags,
                source_url, source_platform, source_product_id, upload_date,
                cost_price, total_cost, currency,
                status, is_new, is_visible, stock_status, min_order_quantity,
                quality_score, demand_score, competition_level
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
                    $12, $13, $14, NOW(), $15, $16, 'USD',
                    'pending', true, true, 'available', $17,
                    $18, $19, $20)
            RETURNING id
            "#,
            import_data.title,
            import_data.description,
            category_id,
            subcategory_id,
            import_data.raw_category_path,
            sku,
            import_data.upc,
            &import_data.images,
            import_data.specifications,
            import_data.variants,
            &import_data.tags, // Would extract from content
            import_data.source_url,
            import_data.source_platform,
            import_data.source_product_id,
            import_data.price,
            total_cost,
            import_data.min_order_quantity,
            0.5, // Initial quality score
            0.5, // Initial demand score
            "medium" // Initial competition level
        )
        .fetch_one(&mut *conn)
        .await
        .map_err(|e| format!("Failed to import product: {}", e))?;

        Ok(product_id)
    }

    /// Search products with advanced filtering
    pub async fn search_products(&self, search: ProductSearch) -> CommandResult<Vec<Product>> {
        let mut conn = self.db_pool.acquire().await
            .map_err(|e| format!("Failed to get connection: {}", e))?;

        let mut query = "
            SELECT 
                p.*,
                c.name as category_name,
                sc.name as subcategory_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
            WHERE 1=1
        ".to_string();

        let mut params = Vec::new();
        let mut param_index = 1;

        if let Some(query_text) = &search.query {
            query.push_str(&format!(" AND (p.title ILIKE ${} OR p.description ILIKE ${})", param_index, param_index + 1));
            params.push(format!("%{}%", query_text));
            params.push(format!("%{}%", query_text));
            param_index += 2;
        }

        if let Some(category_id) = search.category_id {
            query.push_str(&format!(" AND p.category_id = ${}", param_index));
            params.push(category_id.to_string());
            param_index += 1;
        }

        if let Some(subcategory_id) = search.subcategory_id {
            query.push_str(&format!(" AND p.subcategory_id = ${}", param_index));
            params.push(subcategory_id.to_string());
            param_index += 1;
        }

        if let Some(source_platform) = &search.source_platform {
            query.push_str(&format!(" AND p.source_platform = ${}", param_index));
            params.push(source_platform.clone());
            param_index += 1;
        }

        if let Some(status) = &search.status {
            query.push_str(&format!(" AND p.status = ${}", param_index));
            params.push(status.clone());
            param_index += 1;
        }

        if let Some(is_new) = search.is_new {
            query.push_str(&format!(" AND p.is_new = ${}", param_index));
            params.push(is_new.to_string());
            param_index += 1;
        }

        if let Some(min_price) = search.min_price {
            query.push_str(&format!(" AND (p.selling_price >= ${} OR p.cost_price >= ${})", param_index, param_index + 1));
            params.push(min_price.to_string());
            params.push(min_price.to_string());
            param_index += 2;
        }

        if let Some(max_price) = search.max_price {
            query.push_str(&format!(" AND (p.selling_price <= ${} OR p.cost_price <= ${})", param_index, param_index + 1));
            params.push(max_price.to_string());
            params.push(max_price.to_string());
            param_index += 2;
        }

        // Add sorting
        let sort_by = search.sort_by.as_deref().unwrap_or("created_at");
        let sort_order = search.sort_order.as_deref().unwrap_or("desc");
        query.push_str(&format!(" ORDER BY p.{} {}", sort_by, sort_order));

        // Add pagination
        if let Some(limit) = search.limit {
            query.push_str(&format!(" LIMIT {}", limit));
            if let Some(offset) = search.offset {
                query.push_str(&format!(" OFFSET {}", offset));
            }
        }

        // Execute query (simplified for example)
        let products = sqlx::query_as::<_, Product>(&query)
            .fetch_all(&mut *conn)
            .await
            .map_err(|e| format!("Failed to search products: {}", e))?;

        Ok(products)
    }

    /// Get product by ID with full details
    pub async fn get_product(&self, product_id: Uuid) -> CommandResult<Product> {
        let mut conn = self.db_pool.acquire().await
            .map_err(|e| format!("Failed to get connection: {}", e))?;

        let product = sqlx::query_as!(
            Product,
            r#"
            SELECT 
                p.*,
                c.name as category_name,
                sc.name as subcategory_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
            WHERE p.id = $1
            "#,
            product_id
        )
        .fetch_one(&mut *conn)
        .await
        .map_err(|e| format!("Failed to get product: {}", e))?;

        Ok(product)
    }

    /// Update product status
    pub async fn update_product_status(
        &self,
        product_id: Uuid,
        new_status: String,
        reason: Option<String>,
        changed_by: Uuid,
    ) -> CommandResult<()> {
        let mut conn = self.db_pool.acquire().await
            .map_err(|e| format!("Failed to get connection: {}", e))?;

        // Get current status for history
        let current_status = sqlx::query_scalar!(
            "SELECT status FROM products WHERE id = $1",
            product_id
        )
        .fetch_one(&mut *conn)
        .await
        .map_err(|e| format!("Failed to get current status: {}", e))?;

        // Update product status
        sqlx::query!(
            r#"
            UPDATE products 
            SET status = $1, updated_at = NOW()
            WHERE id = $2
            "#,
            new_status,
            product_id
        )
        .execute(&mut *conn)
        .await
        .map_err(|e| format!("Failed to update product status: {}", e))?;

        // Record status change in history
        sqlx::query!(
            r#"
            INSERT INTO product_status_history (
                product_id, old_status, new_status, change_reason, changed_by
            ) VALUES ($1, $2, $3, $4, $5)
            "#,
            product_id,
            current_status,
            new_status,
            reason,
            changed_by
        )
        .execute(&mut *conn)
        .await
        .map_err(|e| format!("Failed to record status change: {}", e))?;

        Ok(())
    }

    /// Analyze product for AI insights
    pub async fn analyze_product(&self, product_id: Uuid) -> CommandResult<ProductAnalysis> {
        let product = self.get_product(product_id).await?;

        // Calculate demand score based on multiple factors
        let demand_score = self.calculate_demand_score(&product).await?;

        // Determine competition level
        let competition_level = self.determine_competition_level(&product).await?;

        // Calculate quality score
        let quality_score = self.calculate_quality_score(&product).await?;

        // Market fit score
        let market_fit = (demand_score + quality_score) / 2.0;

        // Competitor analysis
        let competitor_analysis = self.analyze_competitors(&product).await?;

        // Calculate profit potential
        let profit_potential = self.calculate_profit_potential(&product).await?;

        // Generate insights
        let insights = self.generate_insights(&product, &demand_score, &competition_level).await?;

        // Recommended pricing
        let recommended_price = self.calculate_recommended_price(&product).await?;

        Ok(ProductAnalysis {
            product_id,
            demand_score,
            competition_level,
            quality_score,
            market_fit,
            recommended_price,
            insights,
            competitor_analysis,
            profit_potential,
        })
    }

    /// Get new products (in promo period)
    pub async fn get_new_products(&self, limit: Option<i32>) -> CommandResult<Vec<Product>> {
        let mut conn = self.db_pool.acquire().await
            .map_err(|e| format!("Failed to get connection: {}", e))?;

        let limit_clause = limit.map(|l| format!(" LIMIT {}", l)).unwrap_or_default();

        let products = sqlx::query_as!(
            Product,
            &format!(r#"
            SELECT p.*
            FROM products p
            WHERE p.is_new = true 
                AND p.status IN ('pending', 'analyzing')
                AND p.upload_date >= NOW() - INTERVAL '24 hours'
            ORDER BY p.upload_date DESC
            {}
            "#, limit_clause)
        )
        .fetch_all(&mut *conn)
        .await
        .map_err(|e| format!("Failed to get new products: {}", e))?;

        Ok(products)
    }

    /// Get products ready for pricing analysis
    pub async fn get_products_for_pricing(&self) -> CommandResult<Vec<Product>> {
        let mut conn = self.db_pool.acquire().await
            .map_err(|e| format!("Failed to get connection: {}", e))?;

        let products = sqlx::query_as!(
            Product,
            r#"
            SELECT p.*
            FROM products p
            WHERE p.status = 'analyzing'
                AND p.selling_price IS NULL
            ORDER BY p.upload_date ASC
            LIMIT 50
            "#
        )
        .fetch_all(&mut *conn)
        .await
        .map_err(|e| format!("Failed to get products for pricing: {}", e))?;

        Ok(products)
    }

    // Private helper methods

    async fn calculate_demand_score(&self, product: &Product) -> CommandResult<f64> {
        let mut score = 0.5; // Base score

        // Boost for popular categories
        if let Some(category_name) = product.title.to_lowercase().contains("t-shirt") {
            score += 0.2;
        }

        // Boost based on competitor prices (lower prices = higher demand)
        if let (Some(amazon_price), Some(aliexpress_price)) = (product.amazon_price, product.aliexpress_price) {
            let avg_competitor_price = (amazon_price + aliexpress_price) / 2.0;
            if product.cost_price < avg_competitor_price * 0.8 {
                score += 0.15;
            }
        }

        // Quality score influences demand
        if let Some(quality) = product.quality_score {
            score += (quality - 0.5) * 0.2;
        }

        Ok(score.min(1.0).max(0.0))
    }

    async fn determine_competition_level(&self, product: &Product) -> CommandResult<String> {
        if product.amazon_price.is_some() && product.aliexpress_price.is_some() {
            Ok("high".to_string())
        } else if product.amazon_price.is_some() || product.aliexpress_price.is_some() {
            Ok("medium".to_string())
        } else {
            Ok("low".to_string())
        }
    }

    async fn calculate_quality_score(&self, product: &Product) -> CommandResult<f64> {
        let mut score = 0.5; // Base score

        // Image count influences quality perception
        score += (product.images.len() as f64 / 10.0).min(0.2);

        // Detailed descriptions indicate quality
        if let Some(description) = &product.description {
            if description.len() > 500 {
                score += 0.1;
            }
        }

        // Brand presence
        if product.brand.is_some() {
            score += 0.1;
        }

        // Specifications detail
        if product.specifications.as_object().map(|o| o.len()).unwrap_or(0) > 5 {
            score += 0.1;
        }

        Ok(score.min(1.0).max(0.0))
    }

    async fn analyze_competitors(&self, product: &Product) -> CommandResult<serde_json::Value> {
        Ok(serde_json::json!({
            "amazon_price": product.amazon_price,
            "aliexpress_price": product.aliexpress_price,
            "price_advantage": if let (Some(cost), Some(amazon)) = (product.cost_price, product.amazon_price) {
                Some((amazon - cost) / amazon * 100.0)
            } else {
                None
            }
        }))
    }

    async fn calculate_profit_potential(&self, product: &Product) -> CommandResult<f64> {
        if let (Some(cost_price), Some(amazon_price)) = (product.selling_price, product.amazon_price) {
            let margin = (amazon_price - cost_price) / amazon_price * 100.0;
            Ok(margin / 100.0) // Convert to 0-1 scale
        } else {
            Ok(0.3) // Default moderate potential
        }
    }

    async fn generate_insights(
        &self,
        product: &Product,
        demand_score: &f64,
        competition_level: &str,
    ) -> CommandResult<Vec<String>> {
        let mut insights = Vec::new();

        if demand_score > &0.7 {
            insights.push("High demand expected based on market analysis".to_string());
        }

        if competition_level == "low" {
            insights.push("Low competition in this category".to_string());
        }

        if product.quality_score.unwrap_or(0.0) > 0.8 {
            insights.push("High quality product with good customer potential".to_string());
        }

        if product.images.len() > 5 {
            insights.push("Rich product imagery helps conversion".to_string());
        }

        Ok(insights)
    }

    async fn calculate_recommended_price(&self, product: &Product) -> CommandResult<f64> {
        let base_cost = product.cost_price + product.shipping_cost.unwrap_or(0.0);
        let mut recommended_price = base_cost * 1.4; // 40% default margin

        // Adjust based on competition
        if let Some(amazon_price) = product.amazon_price {
            if amazon_price < recommended_price * 0.85 {
                // Competitor is significantly cheaper, reduce margin
                recommended_price = base_cost * 1.25; // 25% margin
            }
        }

        recommended_price
    }

    /// Batch process products for pricing
    pub async fn batch_process_pricing(&self, product_ids: Vec<Uuid>) -> CommandResult<Vec<Uuid>> {
        let mut processed_ids = Vec::new();

        for product_id in product_ids {
            match self.analyze_product(product_id).await {
                Ok(analysis) => {
                    // Update product with analysis results
                    let _ = self.update_product_analysis(product_id, &analysis).await;
                    processed_ids.push(product_id);
                }
                Err(e) => {
                    eprintln!("Failed to analyze product {}: {}", product_id, e);
                }
            }
        }

        Ok(processed_ids)
    }

    async fn update_product_analysis(&self, product_id: Uuid, analysis: &ProductAnalysis) -> CommandResult<()> {
        let mut conn = self.db_pool.acquire().await
            .map_err(|e| format!("Failed to get connection: {}", e))?;

        sqlx::query!(
            r#"
            UPDATE products 
            SET 
                quality_score = $1,
                demand_score = $2,
                competition_level = $3,
                selling_price = $4,
                margin_percentage = (($4 - cost_price) / $4) * 100,
                price_last_updated = NOW()
            WHERE id = $5
            "#,
            analysis.quality_score,
            analysis.demand_score,
            analysis.competition_level,
            analysis.recommended_price,
            product_id
        )
        .execute(&mut *conn)
        .await
        .map_err(|e| format!("Failed to update product analysis: {}", e))?;

        Ok(())
    }
}