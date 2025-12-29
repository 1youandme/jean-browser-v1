use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use sqlx::{PgPool, Row};

use crate::commands::{CommandResult, DatabasePool};
use super::products::{ProductService, ProductCreateRequest};
use super::categories::CategoryService;
use super::pricing::PricingService;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScraperConfig {
    pub auto_categorize: bool,
    pub auto_pricing: bool,
    pub auto_promo: bool,
    pub batch_size: i32,
    pub processing_delay_seconds: i32,
}

impl Default for ScraperConfig {
    fn default() -> Self {
        Self {
            auto_categorize: true,
            auto_pricing: true,
            auto_promo: true,
            batch_size: 10,
            processing_delay_seconds: 5,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScrapedProduct {
    pub source_url: String,
    pub source_platform: String,
    pub source_product_id: String,
    pub title: String,
    pub description: Option<String>,
    pub price: f64,
    pub original_price: Option<f64>,
    pub currency: String,
    pub images: Vec<String>,
    pub supplier_name: Option<String>,
    pub supplier_rating: Option<f64>,
    pub supplier_id: Option<String>,
    pub min_order_quantity: i32,
    pub specifications: serde_json::Value,
    pub variants: serde_json::Value,
    pub category_path: Option<String>,
    pub tags: Vec<String>,
    pub shipping_cost: Option<f64>,
    pub shipping_info: Option<String>,
    pub availability: String,
    pub scraped_at: DateTime<Utc>,
    pub aibuy_data: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScrapingRun {
    pub id: Uuid,
    pub platform: String,
    pub started_at: DateTime<Utc>,
    pub completed_at: Option<DateTime<Utc>>,
    pub status: String, // running, completed, failed
    pub products_found: i32,
    pub products_imported: i32,
    pub products_failed: i32,
    pub error_message: Option<String>,
    pub config: serde_json::Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcessingResult {
    pub scraped_product: ScrapedProduct,
    pub product_id: Option<Uuid>,
    pub success: bool,
    pub errors: Vec<String>,
    pub warnings: Vec<String>,
    pub processing_time_ms: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatchProcessingResult {
    pub run_id: Uuid,
    pub total_processed: i32,
    pub successful: i32,
    pub failed: i32,
    pub warnings: i32,
    pub processing_time_seconds: i64,
    pub results: Vec<ProcessingResult>,
}

pub struct ScraperIntegrationService {
    db_pool: sqlx::PgPool,
    config: ScraperConfig,
    product_service: ProductService,
    category_service: CategoryService,
    pricing_service: PricingService,
}

impl ScraperIntegrationService {
    pub fn new(db_pool: sqlx::PgPool, config: Option<ScraperConfig>) -> Self {
        let config = config.unwrap_or_default();
        let pool_clone = db_pool.clone();
        
        Self {
            db_pool: db_pool.clone(),
            config,
            product_service: ProductService::new(db_pool.clone()),
            category_service: CategoryService::new(db_pool.clone()),
            pricing_service: PricingService::new(pool_clone, None),
        }
    }

    /// Import scraped products directly from scraper output
    pub async fn import_scraped_products(
        &self,
        scraped_products: Vec<ScrapedProduct>,
        platform: &str,
    ) -> CommandResult<BatchProcessingResult> {
        let run_id = self.create_scraping_run(platform).await?;
        let start_time = std::time::Instant::now();

        let mut results = Vec::new();
        let mut successful_count = 0;
        let mut failed_count = 0;
        let mut warning_count = 0;

        for scraped_product in scraped_products {
            let result = self.process_scraped_product(scraped_product.clone()).await;
            
            match result {
                Ok(processing_result) => {
                    if processing_result.success {
                        successful_count += 1;
                        
                        // Auto-trigger pricing if configured
                        if self.config.auto_pricing {
                            if let Some(product_id) = processing_result.product_id {
                                let _ = self.trigger_auto_pricing(product_id).await;
                            }
                        }
                        
                        // Auto-trigger promo if configured
                        if self.config.auto_promo {
                            if let Some(product_id) = processing_result.product_id {
                                let _ = self.trigger_auto_promo(product_id).await;
                            }
                        }
                    } else {
                        failed_count += 1;
                    }
                    
                    warning_count += processing_result.warnings.len() as i32;
                    results.push(processing_result);
                }
                Err(e) => {
                    failed_count += 1;
                    results.push(ProcessingResult {
                        scraped_product,
                        product_id: None,
                        success: false,
                        errors: vec![e],
                        warnings: vec![],
                        processing_time_ms: 0,
                    });
                }
            }

            // Add delay to prevent overwhelming the system
            if self.config.processing_delay_seconds > 0 {
                tokio::time::sleep(tokio::time::Duration::from_secs(
                    self.config.processing_delay_seconds as u64
                )).await;
            }
        }

        let processing_time_seconds = start_time.elapsed().as_secs() as i64;

        // Update scraping run
        self.update_scraping_run(
            run_id,
            results.len() as i32,
            successful_count,
            failed_count,
            None,
        ).await?;

        Ok(BatchProcessingResult {
            run_id,
            total_processed: results.len() as i32,
            successful: successful_count,
            failed: failed_count,
            warnings: warning_count,
            processing_time_seconds,
            results,
        })
    }

    /// Process individual scraped product
    async fn process_scraped_product(&self, scraped_product: ScrapedProduct) -> CommandResult<ProcessingResult> {
        let start_time = std::time::Instant::now();
        let mut warnings = Vec::new();
        let mut errors = Vec::new();

        // Validate scraped product
        if let Err(e) = self.validate_scraped_product(&scraped_product) {
            errors.push(e);
            return Ok(ProcessingResult {
                scraped_product,
                product_id: None,
                success: false,
                errors,
                warnings,
                processing_time_ms: start_time.elapsed().as_millis() as i64,
            });
        }

        // Check for duplicates
        if let Some(existing_id) = self.check_duplicate_product(&scraped_product).await? {
            warnings.push(format!("Product already exists with ID: {}", existing_id));
            return Ok(ProcessingResult {
                scraped_product,
                product_id: Some(existing_id),
                success: true,
                errors,
                warnings,
                processing_time_ms: start_time.elapsed().as_millis() as i64,
            });
        }

        // Create product
        let product_request = self.scraped_to_create_request(scraped_product.clone());
        
        match self.product_service.create_product(product_request).await {
            Ok(product) => {
                // Auto-categorize if enabled
                if self.config.auto_categorize {
                    if let Err(e) = self.auto_categorize_product(product.id, &scraped_product.category_path).await {
                        warnings.push(format!("Auto-categorization failed: {}", e));
                    }
                }

                Ok(ProcessingResult {
                    scraped_product,
                    product_id: Some(product.id),
                    success: true,
                    errors,
                    warnings,
                    processing_time_ms: start_time.elapsed().as_millis() as i64,
                })
            }
            Err(e) => {
                errors.push(format!("Failed to create product: {}", e));
                Ok(ProcessingResult {
                    scraped_product,
                    product_id: None,
                    success: false,
                    errors,
                    warnings,
                    processing_time_ms: start_time.elapsed().as_millis() as i64,
                })
            }
        }
    }

    /// Trigger auto pricing for product
    async fn trigger_auto_pricing(&self, product_id: Uuid) -> CommandResult<()> {
        use super::pricing::PricingRequest;
        use super::pricing::PricingRunType;

        let pricing_request = PricingRequest {
            product_id,
            run_type: PricingRunType::Initial,
            custom_margin: None,
            force_update: false,
        };

        self.pricing_service.run_pricing(pricing_request).await
    }

    /// Trigger auto promo for new product
    async fn trigger_auto_promo(&self, product_id: Uuid) -> CommandResult<()> {
        use super::promotions::PromotionService;
        let promo_service = PromotionService::new(self.db_pool.clone(), None);
        
        promo_service.create_new_product_promo(product_id).await
    }

    /// Validate scraped product data
    fn validate_scraped_product(&self, product: &ScrapedProduct) -> CommandResult<()> {
        if product.title.is_empty() {
            return Err("Product title is required".to_string());
        }

        if product.source_url.is_empty() {
            return Err("Source URL is required".to_string());
        }

        if product.price <= 0.0 {
            return Err("Product price must be positive".to_string());
        }

        if product.images.is_empty() {
            return Err("Product must have at least one image".to_string());
        }

        Ok(())
    }

    /// Check for duplicate products
    async fn check_duplicate_product(&self, product: &ScrapedProduct) -> CommandResult<Option<Uuid>> {
        let existing = sqlx::query_scalar!(
            r#"
            SELECT id FROM products 
            WHERE source_platform = $1 
                AND source_product_id = $2
            LIMIT 1
            "#,
            product.source_platform,
            product.source_product_id
        )
        .fetch_optional(&self.db_pool)
        .await
        .map_err(|e| format!("Failed to check duplicates: {}", e))?;

        Ok(existing)
    }

    /// Convert scraped product to create request
    fn scraped_to_create_request(&self, scraped: ScrapedProduct) -> ProductCreateRequest {
        ProductCreateRequest {
            title: scraped.title,
            description: scraped.description,
            source_url: scraped.source_url,
            source_platform: scraped.source_platform,
            source_product_id: Some(scraped.source_product_id),
            cost_price: scraped.price,
            shipping_cost: scraped.shipping_cost,
            images: Some(scraped.images),
            specifications: Some(scraped.specifications),
            variants: Some(scraped.variants),
            tags: Some(scraped.tags),
            raw_category_path: scraped.category_path,
            aibuy_data: scraped.aibuy_data,
        }
    }

    /// Auto-categorize product
    async fn auto_categorize_product(
        &self,
        product_id: Uuid,
        category_path: &Option<String>,
    ) -> CommandResult<()> {
        if let Some(path) = category_path {
            let (category_id, subcategory_id) = self.category_service.categorize_product(&Some(path.clone())).await?;
            
            if category_id.is_some() || subcategory_id.is_some() {
                sqlx::query!(
                    r#"
                    UPDATE products 
                    SET category_id = $1, subcategory_id = $2
                    WHERE id = $3
                    "#,
                    category_id,
                    subcategory_id,
                    product_id
                )
                .execute(&self.db_pool)
                .await
                .map_err(|e| format!("Failed to update product categories: {}", e))?;
            }
        }

        Ok(())
    }

    /// Create scraping run record
    async fn create_scraping_run(&self, platform: &str) -> CommandResult<Uuid> {
        let run_id = Uuid::new_v4();

        sqlx::query!(
            r#"
            INSERT INTO scraping_runs (
                id, platform, started_at, status, config
            ) VALUES ($1, $2, $3, $4, $5)
            "#,
            run_id,
            platform,
            Utc::now(),
            "running",
            serde_json::to_value(&self.config).unwrap_or_default()
        )
        .execute(&self.db_pool)
        .await
        .map_err(|e| format!("Failed to create scraping run: {}", e))?;

        Ok(run_id)
    }

    /// Update scraping run
    async fn update_scraping_run(
        &self,
        run_id: Uuid,
        products_found: i32,
        products_imported: i32,
        products_failed: i32,
        error_message: Option<String>,
    ) -> CommandResult<()> {
        sqlx::query!(
            r#"
            UPDATE scraping_runs 
            SET 
                completed_at = NOW(),
                status = 'completed',
                products_found = $1,
                products_imported = $2,
                products_failed = $3,
                error_message = $4
            WHERE id = $5
            "#,
            products_found,
            products_imported,
            products_failed,
            error_message,
            run_id
        )
        .execute(&self.db_pool)
        .await
        .map_err(|e| format!("Failed to update scraping run: {}", e))?;

        Ok(())
    }

    /// Get scraping run history
    pub async fn get_scraping_runs(&self, limit: Option<i32>) -> CommandResult<Vec<ScrapingRun>> {
        let limit_clause = limit.map(|l| format!("LIMIT {}", l)).unwrap_or_default();

        let runs = sqlx::query_as!(
            ScrapingRun,
            &format!(r#"
            SELECT *
            FROM scraping_runs 
            ORDER BY started_at DESC
            {}
            "#, limit_clause)
        )
        .fetch_all(&self.db_pool)
        .await
        .map_err(|e| format!("Failed to get scraping runs: {}", e))?;

        Ok(runs)
    }

    /// Get scraping analytics
    pub async fn get_scraping_analytics(&self, days_back: i32) -> CommandResult<serde_json::Value> {
        let mut conn = self.db_pool.acquire().await
            .map_err(|e| format!("Failed to get connection: {}", e))?;

        // Recent runs stats
        let run_stats = sqlx::query!(
            r#"
            SELECT 
                COUNT(*) as total_runs,
                SUM(products_found) as total_products_found,
                SUM(products_imported) as total_products_imported,
                SUM(products_failed) as total_products_failed,
                AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) as avg_duration_seconds
            FROM scraping_runs 
            WHERE started_at >= NOW() - INTERVAL '{} days'
            "#,
            days_back
        )
        .fetch_one(&mut *conn)
        .await
        .map_err(|e| format!("Failed to get run stats: {}", e))?;

        // By platform stats
        let platform_stats = sqlx::query!(
            r#"
            SELECT 
                platform,
                COUNT(*) as runs,
                SUM(products_found) as products_found,
                SUM(products_imported) as products_imported
            FROM scraping_runs 
            WHERE started_at >= NOW() - INTERVAL '{} days'
            GROUP BY platform
            ORDER BY products_imported DESC
            "#,
            days_back
        )
        .fetch_all(&mut *conn)
        .await
        .map_err(|e| format!("Failed to get platform stats: {}", e))?;

        let analytics = serde_json::json!({
            "runs": {
                "total": run_stats.total_runs.unwrap_or(0),
                "products_found": run_stats.total_products_found.unwrap_or(0),
                "products_imported": run_stats.total_products_imported.unwrap_or(0),
                "products_failed": run_stats.total_products_failed.unwrap_or(0),
                "avg_duration_seconds": run_stats.avg_duration_seconds.unwrap_or(0.0)
            },
            "platforms": platform_stats.into_iter().map(|r| serde_json::json!({
                "platform": r.platform,
                "runs": r.runs.unwrap_or(0),
                "products_found": r.products_found.unwrap_or(0),
                "products_imported": r.products_imported.unwrap_or(0)
            })).collect::<Vec<_>>(),
            "period_days": days_back
        });

        Ok(analytics)
    }

    /// Cleanup old scraping data
    pub async fn cleanup_old_scraping_data(&self, days_to_keep: i32) -> CommandResult<i32> {
        let cutoff_date = Utc::now() - chrono::Duration::days(days_to_keep as i64);

        let result = sqlx::query!(
            r#"
            DELETE FROM scraping_runs 
            WHERE started_at < $1 AND status = 'completed'
            "#,
            cutoff_date
        )
        .execute(&self.db_pool)
        .await
        .map_err(|e| format!("Failed to cleanup old scraping data: {}", e))?;

        Ok(result.rows_affected() as i32)
    }

    /// Process scraped products from file (JSON)
    pub async fn process_scraped_products_from_file(
        &self,
        file_path: &str,
        platform: &str,
    ) -> CommandResult<BatchProcessingResult> {
        // Read JSON file
        let file_content = tokio::fs::read_to_string(file_path).await
            .map_err(|e| format!("Failed to read file: {}", e))?;

        // Parse JSON
        let scraped_products: Vec<ScrapedProduct> = serde_json::from_str(&file_content)
            .map_err(|e| format!("Failed to parse JSON: {}", e))?;

        // Process products
        self.import_scraped_products(scraped_products, platform).await
    }
}

// Node.js scraper integration methods
impl ScraperIntegrationService {
    /// Bridge method for Node.js scraper integration
    pub async fn bridge_scraped_products(
        &self,
        scraper_output: &str, // JSON string from scraper
        platform: &str,
    ) -> CommandResult<serde_json::Value> {
        // Parse scraper output
        let scraper_data: serde_json::Value = serde_json::from_str(scraper_output)
            .map_err(|e| format!("Failed to parse scraper output: {}", e))?;

        // Extract products array
        let products_array = scraper_data["products"].as_array()
            .ok_or("Invalid scraper output: missing products array")?;

        // Convert to ScrapedProduct structs
        let mut scraped_products = Vec::new();
        for product_json in products_array {
            let scraped_product: ScrapedProduct = serde_json::from_value(product_json.clone())
                .map_err(|e| format!("Failed to parse product: {}", e))?;
            scraped_products.push(scraped_product);
        }

        // Process products
        let result = self.import_scraped_products(scraped_products, platform).await?;

        // Return result as JSON
        Ok(serde_json::to_value(result).unwrap_or_default())
    }

    /// Get status of recent processing
    pub async fn get_processing_status(&self, hours_back: i32) -> CommandResult<serde_json::Value> {
        let mut conn = self.db_pool.acquire().await
            .map_err(|e| format!("Failed to get connection: {}", e))?;

        // Recent runs
        let recent_runs = sqlx::query!(
            r#"
            SELECT 
                id, platform, status, products_found, products_imported,
                products_failed, started_at, completed_at
            FROM scraping_runs 
            WHERE started_at >= NOW() - INTERVAL '{} hours'
            ORDER BY started_at DESC
            "#,
            hours_back
        )
        .fetch_all(&mut *conn)
        .await
        .map_err(|e| format!("Failed to get recent runs: {}", e))?;

        // Currently processing products
        let processing_count = sqlx::query_scalar!(
            r#"
            SELECT COUNT(*) 
            FROM products 
            WHERE status = 'pending' 
                AND created_at >= NOW() - INTERVAL '1 hour'
            "#
        )
        .fetch_one(&mut *conn)
        .await
        .map_err(|e| format!("Failed to get processing count: {}", e))?
        .unwrap_or(0);

        Ok(serde_json::json!({
            "recent_runs": recent_runs.into_iter().map(|r| serde_json::json!({
                "id": r.id,
                "platform": r.platform,
                "status": r.status,
                "products_found": r.products_found,
                "products_imported": r.products_imported,
                "products_failed": r.products_failed,
                "started_at": r.started_at,
                "completed_at": r.completed_at
            })).collect::<Vec<_>>(),
            "currently_processing": processing_count,
            "period_hours": hours_back
        }))
    }
}