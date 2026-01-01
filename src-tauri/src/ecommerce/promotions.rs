use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use sqlx::{PgPool, Row};

use crate::commands::{CommandResult, DatabasePool};
use super::products::ProductService;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PromoConfig {
    pub auto_new_product_duration_hours: i32,
    pub discount_min_percent: f64,
    pub discount_max_percent: f64,
    pub code_prefix: String,
    pub max_usage_per_code: i32,
}

impl Default for PromoConfig {
    fn default() -> Self {
        Self {
            auto_new_product_duration_hours: 24,
            discount_min_percent: 5.0,
            discount_max_percent: 25.0,
            code_prefix: "JEANTRAIL-NEW".to_string(),
            max_usage_per_code: 100,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Promotion {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub promo_type: String,
    pub discount_type: String, // percentage, fixed_amount
    pub discount_value: f64,
    pub minimum_order_amount: Option<f64>,
    pub maximum_discount_amount: Option<f64>,
    pub start_date: DateTime<Utc>,
    pub end_date: DateTime<Utc>,
    pub usage_limit: Option<i32>,
    pub usage_count: i32,
    pub is_active: bool,
    pub auto_generated: bool,
    pub target_audience: Option<serde_json::Value>,
    pub usage_limits: Option<serde_json::Value>,
    pub ai_generated: bool,
    pub performance_metrics: Option<serde_json::Value>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct PromoCode {
    pub id: Uuid,
    pub promotion_id: Uuid,
    pub code: String,
    pub discount_percent: f64,
    pub max_usage: i32,
    pub current_usage: i32,
    pub is_active: bool,
    pub expires_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct PromoUsage {
    pub id: Uuid,
    pub promotion_id: Uuid,
    pub customer_id: Option<Uuid>,
    pub order_id: Option<Uuid>,
    pub discount_amount: f64,
    pub used_at: DateTime<Utc>,
    pub ip_address: Option<String>,
    pub user_agent: Option<String>,
    pub referrer: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NewProductPromo {
    pub product_id: Uuid,
    pub promo_code: String,
    pub discount_percent: f64,
    pub expires_at: DateTime<Utc>,
}

pub struct PromotionService {
    db_pool: sqlx::PgPool,
    config: PromoConfig,
}

impl PromotionService {
    pub fn new(db_pool: sqlx::PgPool, config: Option<PromoConfig>) -> Self {
        Self {
            db_pool,
            config: config.unwrap_or_default(),
        }
    }

    /// Create automatic promo for new products
    pub async fn create_new_product_promo(&self, product_id: Uuid) -> CommandResult<NewProductPromo> {
        let mut conn = self.db_pool.acquire().await
            .map_err(|e| format!("Failed to get connection: {}", e))?;

        // Check if product is new and eligible for promo
        let product_info = sqlx::query!(
            r#"
            SELECT title, upload_date, is_new
            FROM products 
            WHERE id = $1 AND is_new = true AND is_visible = true
            "#,
            product_id
        )
        .fetch_optional(&mut *conn)
        .await
        .map_err(|e| format!("Failed to check product eligibility: {}", e))?;

        if product_info.is_none() {
            return Err("Product not found or not eligible for new product promo".to_string());
        }

        // Check if promo already exists
        let existing_promo = sqlx::query!(
            r#"
            SELECT pc.id
            FROM promo_codes pc
            JOIN promotions p ON pc.promotion_id = p.id
            WHERE p.name = $1 AND pc.is_active = true
            "#,
            format!("New Product Promo - {}", product_id)
        )
        .fetch_optional(&mut *conn)
        .await
        .map_err(|e| format!("Failed to check existing promo: {}", e))?;

        if existing_promo.is_some() {
            return Err("Promo already exists for this product".to_string());
        }

        // Generate random discount
        let discount_percent = self.generate_random_discount();

        // Create promotion
        let promo_id = self.create_promotion_record(product_id, discount_percent).await?;

        // Generate promo code
        let promo_code = self.generate_promo_code();
        let expires_at = Utc::now() + chrono::Duration::hours(self.config.auto_new_product_duration_hours as i64);

        // Create promo code
        sqlx::query!(
            r#"
            INSERT INTO promo_codes (
                id, promotion_id, code, discount_percent, max_usage, 
                current_usage, is_active, expires_at, created_at
            ) VALUES ($1, $2, $3, $4, $5, 0, $6, $7, $8)
            "#,
            Uuid::new_v4(),
            promo_id,
            promo_code.clone(),
            discount_percent,
            self.config.max_usage_per_code,
            true,
            expires_at,
            Utc::now()
        )
        .execute(&mut *conn)
        .await
        .map_err(|e| format!("Failed to create promo code: {}", e))?;

        Ok(NewProductPromo {
            product_id,
            promo_code,
            discount_percent,
            expires_at,
        })
    }

    /// Validate and apply promo code
    pub async fn validate_promo_code(&self, code: &str, order_amount: f64) -> CommandResult<serde_json::Value> {
        let mut conn = self.db_pool.acquire().await
            .map_err(|e| format!("Failed to get connection: {}", e))?;

        // Get promo code with promotion details
        let promo_info = sqlx::query!(
            r#"
            SELECT 
                pc.id as code_id,
                pc.discount_percent,
                pc.max_usage,
                pc.current_usage,
                pc.is_active as code_active,
                pc.expires_at,
                p.id as promotion_id,
                p.name,
                p.description,
                p.start_date,
                p.end_date,
                p.minimum_order_amount,
                p.maximum_discount_amount,
                p.is_active as promotion_active
            FROM promo_codes pc
            JOIN promotions p ON pc.promotion_id = p.id
            WHERE pc.code = $1
            "#,
            code
        )
        .fetch_one(&mut *conn)
        .await
        .map_err(|e| format!("Promo code not found: {}", e))?;

        // Validate promo code
        let validation_result = self.validate_code_rules(&promo_info, order_amount).await?;

        if !validation_result.is_valid {
            return Ok(serde_json::json!({
                "valid": false,
                "reason": validation_result.reason
            }));
        }

        // Calculate discount
        let discount_amount = self.calculate_discount(order_amount, &promo_info).await?;

        Ok(serde_json::json!({
            "valid": true,
            "promotion_id": promo_info.promotion_id,
            "promotion_name": promo_info.name,
            "promotion_description": promo_info.description,
            "discount_type": "percentage",
            "discount_value": promo_info.discount_percent,
            "discount_amount": discount_amount,
            "final_amount": order_amount - discount_amount
        }))
    }

    /// Record promo usage
    pub async fn record_promo_usage(
        &self,
        code: &str,
        customer_id: Option<Uuid>,
        order_id: Option<Uuid>,
        discount_amount: f64,
        metadata: Option<serde_json::Value>,
    ) -> CommandResult<()> {
        let mut conn = self.db_pool.acquire().await
            .map_err(|e| format!("Failed to get connection: {}", e))?;

        // Get promo code info
        let promo_code = sqlx::query!(
            r#"
            SELECT pc.id, pc.promotion_id
            FROM promo_codes pc
            WHERE pc.code = $1
            "#,
            code
        )
        .fetch_one(&mut *conn)
        .await
        .map_err(|e| format!("Failed to get promo code: {}", e))?;

        // Record usage
        sqlx::query!(
            r#"
            INSERT INTO promo_usage (
                id, promotion_id, customer_id, order_id, discount_amount,
                used_at, ip_address, user_agent, referrer
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            "#,
            Uuid::new_v4(),
            promo_code.promotion_id,
            customer_id,
            order_id,
            discount_amount,
            Utc::now(),
            metadata.and_then(|m| m.get("ip_address")).and_then(|v| v.as_str()).map(|s| s.to_string()),
            metadata.and_then(|m| m.get("user_agent")).and_then(|v| v.as_str()).map(|s| s.to_string()),
            metadata.and_then(|m| m.get("referrer")).and_then(|v| v.as_str()).map(|s| s.to_string())
        )
        .execute(&mut *conn)
        .await
        .map_err(|e| format!("Failed to record promo usage: {}", e))?;

        // Update usage count
        sqlx::query!(
            r#"
            UPDATE promo_codes 
            SET current_usage = current_usage + 1
            WHERE id = $1
            "#,
            promo_code.id
        )
        .execute(&mut *conn)
        .await
        .map_err(|e| format!("Failed to update promo usage: {}", e))?;

        Ok(())
    }

    /// Get promo analytics
    pub async fn get_promo_analytics(&self, days_back: i32) -> CommandResult<serde_json::Value> {
        let mut conn = self.db_pool.acquire().await
            .map_err(|e| format!("Failed to get connection: {}", e))?;

        // Active promotions count
        let active_promos = sqlx::query_scalar!(
            r#"
            SELECT COUNT(*)
            FROM promotions 
            WHERE is_active = true 
                AND start_date <= NOW() 
                AND end_date >= NOW()
            "#
        )
        .fetch_one(&mut *conn)
        .await
        .map_err(|e| format!("Failed to get active promo count: {}", e))?
        .unwrap_or(0);

        // Recent promo usage
        let recent_usage = sqlx::query!(
            r#"
            SELECT 
                COUNT(*) as total_usage,
                SUM(discount_amount) as total_discount,
                COUNT(DISTINCT customer_id) as unique_customers,
                AVG(discount_amount) as avg_discount
            FROM promo_usage 
            WHERE used_at >= NOW() - INTERVAL '{} days'
            "#,
            days_back
        )
        .fetch_one(&mut *conn)
        .await
        .map_err(|e| format!("Failed to get recent usage: {}", e))?;

        // Top performing promos
        let top_promos = sqlx::query!(
            r#"
            SELECT 
                p.name,
                COUNT(pu.id) as usage_count,
                SUM(pu.discount_amount) as total_discount
            FROM promotions p
            LEFT JOIN promo_usage pu ON p.id = pu.promotion_id
                AND pu.used_at >= NOW() - INTERVAL '{} days'
            WHERE p.is_active = true
            GROUP BY p.id, p.name
            ORDER BY usage_count DESC
            LIMIT 5
            "#,
            days_back
        )
        .fetch_all(&mut *conn)
        .await
        .map_err(|e| format!("Failed to get top promos: {}", e))?;

        let analytics = serde_json::json!({
            "active_promotions": active_promos,
            "recent_usage": {
                "total_usage": recent_usage.total_usage.unwrap_or(0),
                "total_discount": recent_usage.total_discount.unwrap_or(0.0),
                "unique_customers": recent_usage.unique_customers.unwrap_or(0),
                "average_discount": recent_usage.avg_discount.unwrap_or(0.0)
            },
            "top_performing": top_promos.into_iter().map(|r| serde_json::json!({
                "name": r.name,
                "usage_count": r.usage_count.unwrap_or(0),
                "total_discount": r.total_discount.unwrap_or(0.0)
            })).collect::<Vec<_>>(),
            "period_days": days_back
        });

        Ok(analytics)
    }

    /// Cleanup expired promotions
    pub async fn cleanup_expired_promotions(&self) -> CommandResult<i32> {
        let mut conn = self.db_pool.acquire().await
            .map_err(|e| format!("Failed to get connection: {}", e))?;

        // Deactivate expired promotions
        let result = sqlx::query!(
            r#"
            UPDATE promotions 
            SET is_active = false 
            WHERE is_active = true AND end_date < NOW()
            "#
        )
        .execute(&mut *conn)
        .await
        .map_err(|e| format!("Failed to cleanup expired promotions: {}", e))?;

        // Deactivate expired promo codes
        sqlx::query!(
            r#"
            UPDATE promo_codes 
            SET is_active = false 
            WHERE is_active = true AND expires_at < NOW()
            "#
        )
        .execute(&mut *conn)
        .await
        .map_err(|e| format!("Failed to cleanup expired promo codes: {}", e))?;

        Ok(result.rows_affected() as i32)
    }

    /// Batch create promos for new products
    pub async fn batch_create_new_product_promos(&self, limit: Option<i32>) -> CommandResult<i32> {
        let mut conn = self.db_pool.acquire().await
            .map_err(|e| format!("Failed to get connection: {}", e))?;

        let limit_clause = limit.map(|l| format!("LIMIT {}", l)).unwrap_or_default();

        // Get products eligible for promo
        let products = sqlx::query!(
            &format!(r#"
            SELECT id, title, upload_date
            FROM products 
            WHERE is_new = true 
                AND is_visible = true 
                AND selling_price IS NULL
                AND upload_date >= NOW() - INTERVAL '24 hours'
                AND id NOT IN (
                    SELECT DISTINCT SUBSTRING(p.name FROM 'New Product Promo - (.+)$')::uuid
                    FROM promotions p 
                    WHERE p.name LIKE 'New Product Promo - %'
                )
            ORDER BY upload_date DESC
            {}
            "#, limit_clause)
        )
        .fetch_all(&mut *conn)
        .await
        .map_err(|e| format!("Failed to get eligible products: {}", e))?;

        let mut created_count = 0;

        for product in products {
            match self.create_new_product_promo(product.id).await {
                Ok(_) => created_count += 1,
                Err(e) => eprintln!("Failed to create promo for product {}: {}", product.id, e),
            }
        }

        Ok(created_count)
    }

    // Private helper methods

    async fn create_promotion_record(&self, product_id: Uuid, discount_percent: f64) -> CommandResult<Uuid> {
        let promo_id = Uuid::new_v4();
        let now = Utc::now();
        let end_date = now + chrono::Duration::hours(self.config.auto_new_product_duration_hours as i64);

        sqlx::query!(
            r#"
            INSERT INTO promotions (
                id, name, description, promo_type, discount_type, discount_value,
                start_date, end_date, usage_limit, is_active, auto_generated,
                ai_generated, created_at, updated_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
            )
            RETURNING id
            "#,
            promo_id,
            format!("New Product Promo - {}", product_id),
            format!("Automatic discount for new product"),
            "auto_new",
            "percentage",
            discount_percent,
            now,
            end_date,
            self.config.max_usage_per_code,
            true,
            true,
            true,
            now,
            now
        )
        .fetch_one(&self.db_pool)
        .await
        .map_err(|e| format!("Failed to create promotion: {}", e))
    }

    fn generate_random_discount(&self) -> f64 {
        use rand::Rng;
        let mut rng = rand::thread_rng();
        rng.gen_range(self.config.discount_min_percent..=self.config.discount_max_percent)
    }

    fn generate_promo_code(&self) -> String {
        use rand::Rng;
        let mut rng = rand::thread_rng();
        let random_part: u32 = rng.gen_range(10000..99999);
        format!("{}-{}", self.config.code_prefix, random_part)
    }

    async fn validate_code_rules(
        &self,
        promo_info: &PromoValidationInfo,
        order_amount: f64,
    ) -> CommandResult<PromoValidationResult> {
        // Check if code is active
        if !promo_info.code_active || !promo_info.promotion_active {
            return Ok(PromoValidationResult {
                is_valid: false,
                reason: "Promo code is not active".to_string(),
            });
        }

        // Check expiration
        if let Some(expires_at) = promo_info.expires_at {
            if expires_at < Utc::now() {
                return Ok(PromoValidationResult {
                    is_valid: false,
                    reason: "Promo code has expired".to_string(),
                });
            }
        }

        // Check promotion dates
        if promo_info.start_date > Utc::now() || promo_info.end_date < Utc::now() {
            return Ok(PromoValidationResult {
                is_valid: false,
                reason: "Promotion is not currently active".to_string(),
            });
        }

        // Check usage limit
        if promo_info.current_usage >= promo_info.max_usage {
            return Ok(PromoValidationResult {
                is_valid: false,
                reason: "Promo code usage limit exceeded".to_string(),
            });
        }

        // Check minimum order amount
        if let Some(min_amount) = promo_info.minimum_order_amount {
            if order_amount < min_amount {
                return Ok(PromoValidationResult {
                    is_valid: false,
                    reason: format!("Minimum order amount is ${:.2}", min_amount),
                });
            }
        }

        Ok(PromoValidationResult {
            is_valid: true,
            reason: "Valid promo code".to_string(),
        })
    }

    async fn calculate_discount(
        &self,
        order_amount: f64,
        promo_info: &PromoValidationInfo,
    ) -> CommandResult<f64> {
        let discount_amount = order_amount * (promo_info.discount_percent / 100.0);

        // Apply maximum discount limit if exists
        if let Some(max_discount) = promo_info.maximum_discount_amount {
            Ok(discount_amount.min(max_discount))
        } else {
            Ok(discount_amount)
        }
    }
}

// Helper structs for validation
#[derive(Debug, Clone)]
struct PromoValidationInfo {
    code_id: Uuid,
    discount_percent: f64,
    max_usage: i32,
    current_usage: i32,
    code_active: bool,
    expires_at: Option<DateTime<Utc>>,
    promotion_id: Uuid,
    name: String,
    description: Option<String>,
    start_date: DateTime<Utc>,
    end_date: DateTime<Utc>,
    minimum_order_amount: Option<f64>,
    maximum_discount_amount: Option<f64>,
    promotion_active: bool,
}

#[derive(Debug, Clone)]
struct PromoValidationResult {
    is_valid: bool,
    reason: String,
}