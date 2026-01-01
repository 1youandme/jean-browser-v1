use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use sqlx::{PgPool, Row};

use crate::commands::{CommandResult, DatabasePool};
use super::products::Product;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SupplierConfig {
    pub auto_approve_threshold: f64, // Supplier rating above this gets auto-approved
    pub min_rating_for_partnership: f64,
    pub default_order_minimum: f64,
    pub default_payment_terms: String,
}

impl Default for SupplierConfig {
    fn default() -> Self {
        Self {
            auto_approve_threshold: 4.0,
            min_rating_for_partnership: 3.5,
            default_order_minimum: 100.0,
            default_payment_terms: "NET 30".to_string(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Supplier {
    pub id: Uuid,
    pub name: String,
    pub alias: Option<String>, // Alternative name/brand
    pub email: Option<String>,
    pub phone: Option<String>,
    pub address: Option<serde_json::Value>,
    pub website: Option<String>,
    pub logo_url: Option<String>,
    
    // Business Information
    pub company_type: String, // manufacturer, wholesaler, distributor, trader
    pub business_license: Option<String>,
    pub established_year: Option<i32>,
    pub employee_count: Option<i32>,
    pub annual_revenue: Option<f64>,
    
    // Quality & Verification
    pub verification_status: String, // unverified, verified, gold, premium
    pub verification_date: Option<DateTime<Utc>>,
    pub certificates: Option<serde_json::Value>,
    pub quality_score: f64,
    pub reliability_score: f64,
    
    // Performance Metrics
    pub rating: f64,
    pub review_count: i32,
    pub response_rate: f64,
    pub response_time_hours: Option<f64>,
    pub on_time_delivery_rate: f64,
    pub return_rate: f64,
    
    // Capabilities
    pub main_categories: Vec<String>,
    pub production_capacity: Option<serde_json::Value>,
    pub export_markets: Vec<String>,
    pub languages: Vec<String>,
    
    // Financial Information
    pub payment_methods: Vec<String>,
    pub accepted_currencies: Vec<String>,
    pub credit_terms: Option<String>,
    pub insurance_coverage: Option<serde_json::Value>,
    
    // Status and Metadata
    pub is_active: bool,
    pub is_preferred: bool,
    pub is_blacklisted: bool,
    pub notes: Option<String>,
    pub tags: Vec<String>,
    pub metadata: serde_json::Value,
    
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct SupplierProduct {
    pub id: Uuid,
    pub supplier_id: Uuid,
    pub product_id: Uuid,
    pub supplier_sku: Option<String>,
    pub supplier_product_url: String,
    pub supplier_price: f64,
    pub supplier_currency: String,
    pub min_order_quantity: i32,
    pub max_order_quantity: Option<i32>,
    pub lead_time_days: i32,
    pub bulk_pricing: Option<serde_json::Value>,
    pub availability: String,
    pub last_updated: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SupplierAnalysis {
    pub supplier_id: Uuid,
    pub quality_score: f64,
    pub reliability_score: f64,
    pub price_competitiveness: f64,
    pub overall_score: f64,
    pub recommendations: Vec<String>,
    pub risk_factors: Vec<String>,
    pub partnership_suggestion: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateSupplierRequest {
    pub name: String,
    pub alias: Option<String>,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub website: Option<String>,
    pub company_type: String,
    pub main_categories: Vec<String>,
    pub payment_methods: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SupplierSearchRequest {
    pub query: Option<String>,
    pub company_type: Option<String>,
    pub verification_status: Option<String>,
    pub min_rating: Option<f64>,
    pub main_categories: Option<Vec<String>>,
    pub is_active: Option<bool>,
    pub is_preferred: Option<bool>,
    pub sort_by: Option<String>, // rating, quality_score, created_at
    pub sort_order: Option<String>, // asc, desc
    pub limit: Option<i32>,
    pub offset: Option<i32>,
}

pub struct SupplierService {
    db_pool: sqlx::PgPool,
    config: SupplierConfig,
}

impl SupplierService {
    pub fn new(db_pool: sqlx::PgPool, config: Option<SupplierConfig>) -> Self {
        Self {
            db_pool,
            config: config.unwrap_or_default(),
        }
    }

    /// Create new supplier
    pub async fn create_supplier(&self, request: CreateSupplierRequest) -> CommandResult<Supplier> {
        let supplier_id = Uuid::new_v4();

        sqlx::query_as!(
            Supplier,
            r#"
            INSERT INTO suppliers (
                id, name, alias, email, phone, website, company_type,
                verification_status, quality_score, reliability_score,
                rating, review_count, main_categories, payment_methods,
                is_active, is_preferred, is_blacklisted, tags, metadata,
                created_at, updated_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, 'unverified', 3.0, 3.0,
                3.0, 0, $8, $9, true, false, false, '{}', '{}', 
                $10, $10
            ) RETURNING *
            "#,
            supplier_id,
            request.name,
            request.alias,
            request.email,
            request.phone,
            request.website,
            request.company_type,
            &request.main_categories,
            &request.payment_methods,
            Utc::now()
        )
        .fetch_one(&self.db_pool)
        .await
        .map_err(|e| format!("Failed to create supplier: {}", e))
    }

    /// Get supplier by ID
    pub async fn get_supplier(&self, supplier_id: Uuid) -> CommandResult<Supplier> {
        sqlx::query_as!(
            Supplier,
            "SELECT * FROM suppliers WHERE id = $1",
            supplier_id
        )
        .fetch_one(&self.db_pool)
        .await
        .map_err(|e| format!("Failed to get supplier: {}", e))
    }

    /// Search suppliers
    pub async fn search_suppliers(&self, request: SupplierSearchRequest) -> CommandResult<Vec<Supplier>> {
        let mut query = "
            SELECT *
            FROM suppliers
            WHERE 1=1
        ".to_string();

        let mut conditions = Vec::new();
        let mut params = Vec::new();

        // Add search conditions
        if let Some(query_text) = &request.query {
            conditions.push("(name ILIKE $1 OR alias ILIKE $1 OR email ILIKE $1)");
            params.push(format!("%{}%", query_text));
        }

        if let Some(company_type) = &request.company_type {
            conditions.push("company_type = $2");
            params.push(company_type.clone());
        }

        if let Some(verification_status) = &request.verification_status {
            conditions.push("verification_status = $3");
            params.push(verification_status.clone());
        }

        if let Some(min_rating) = request.min_rating {
            conditions.push("rating >= $4");
            params.push(min_rating.to_string());
        }

        if let Some(is_active) = request.is_active {
            conditions.push("is_active = $5");
            params.push(is_active.to_string());
        }

        if let Some(is_preferred) = request.is_preferred {
            conditions.push("is_preferred = $6");
            params.push(is_preferred.to_string());
        }

        if !conditions.is_empty() {
            query.push_str(" AND ");
            query.push_str(&conditions.join(" AND "));
        }

        // Add sorting
        let sort_by = request.sort_by.as_deref().unwrap_or("rating");
        let sort_order = request.sort_order.as_deref().unwrap_or("desc");
        query.push_str(&format!(" ORDER BY {} {}", sort_by, sort_order));

        // Add pagination
        if let Some(limit) = request.limit {
            query.push_str(&format!(" LIMIT {}", limit));
        }
        if let Some(offset) = request.offset {
            query.push_str(&format!(" OFFSET {}", offset));
        }

        let mut builder = sqlx::query_as::<_, Supplier>(&query);
        for param in params {
            builder = builder.bind(param);
        }

        builder
            .fetch_all(&self.db_pool)
            .await
            .map_err(|e| format!("Failed to search suppliers: {}", e))
    }

    /// Link product to supplier
    pub async fn link_product_to_supplier(
        &self,
        product_id: Uuid,
        supplier_id: Uuid,
        supplier_sku: Option<String>,
        supplier_product_url: String,
        supplier_price: f64,
        min_order_quantity: i32,
        lead_time_days: i32,
    ) -> CommandResult<SupplierProduct> {
        let link_id = Uuid::new_v4();

        sqlx::query_as!(
            SupplierProduct,
            r#"
            INSERT INTO supplier_products (
                id, supplier_id, product_id, supplier_sku, supplier_product_url,
                supplier_price, supplier_currency, min_order_quantity,
                lead_time_days, availability, last_updated
            ) VALUES (
                $1, $2, $3, $4, $5, $6, 'USD', $7, $8, 'available', $9
            ) RETURNING *
            "#,
            link_id,
            supplier_id,
            product_id,
            supplier_sku,
            supplier_product_url,
            supplier_price,
            min_order_quantity,
            lead_time_days,
            Utc::now()
        )
        .fetch_one(&self.db_pool)
        .await
        .map_err(|e| format!("Failed to link product to supplier: {}", e))
    }

    /// Get supplier for product
    pub async fn get_product_suppliers(&self, product_id: Uuid) -> CommandResult<Vec<(Supplier, SupplierProduct)>> {
        let mut conn = self.db_pool.acquire().await
            .map_err(|e| format!("Failed to get connection: {}", e))?;

        let results = sqlx::query!(
            r#"
            SELECT 
                s.id, s.name, s.alias, s.email, s.rating, s.quality_score, s.reliability_score,
                sp.id as link_id, sp.supplier_sku, sp.supplier_price, sp.min_order_quantity,
                sp.lead_time_days, sp.availability, sp.supplier_product_url
            FROM suppliers s
            JOIN supplier_products sp ON s.id = sp.supplier_id
            WHERE sp.product_id = $1 AND s.is_active = true
            ORDER BY sp.supplier_price ASC
            "#,
            product_id
        )
        .fetch_all(&mut *conn)
        .await
        .map_err(|e| format!("Failed to get product suppliers: {}", e))?;

        let suppliers_with_products = results.into_iter().map(|row| {
            let supplier = Supplier {
                id: row.id,
                name: row.name,
                alias: row.alias,
                email: row.email,
                phone: None,
                address: None,
                website: None,
                logo_url: None,
                company_type: String::new(),
                business_license: None,
                established_year: None,
                employee_count: None,
                annual_revenue: None,
                verification_status: "unverified".to_string(),
                verification_date: None,
                certificates: None,
                quality_score: row.quality_score.unwrap_or(3.0),
                reliability_score: row.reliability_score.unwrap_or(3.0),
                rating: row.rating.unwrap_or(3.0),
                review_count: 0,
                response_rate: 0.0,
                response_time_hours: None,
                on_time_delivery_rate: 0.0,
                return_rate: 0.0,
                main_categories: vec![],
                production_capacity: None,
                export_markets: vec![],
                languages: vec![],
                payment_methods: vec![],
                accepted_currencies: vec![],
                credit_terms: None,
                insurance_coverage: None,
                is_active: true,
                is_preferred: false,
                is_blacklisted: false,
                notes: None,
                tags: vec![],
                metadata: serde_json::Value::Null,
                created_at: Utc::now(),
                updated_at: Utc::now(),
            };

            let supplier_product = SupplierProduct {
                id: row.link_id,
                supplier_id: row.id,
                product_id,
                supplier_sku: row.supplier_sku,
                supplier_product_url: row.supplier_product_url.unwrap_or_default(),
                supplier_price: row.supplier_price.unwrap_or(0.0),
                supplier_currency: "USD".to_string(),
                min_order_quantity: row.min_order_quantity.unwrap_or(1),
                max_order_quantity: None,
                lead_time_days: row.lead_time_days.unwrap_or(7),
                bulk_pricing: None,
                availability: row.availability.unwrap_or("unknown".to_string()),
                last_updated: Utc::now(),
            };

            (supplier, supplier_product)
        }).collect();

        Ok(suppliers_with_products)
    }

    /// Analyze supplier performance and suggest actions
    pub async fn analyze_supplier(&self, supplier_id: Uuid) -> CommandResult<SupplierAnalysis> {
        let supplier = self.get_supplier(supplier_id).await?;

        let mut recommendations = Vec::new();
        let mut risk_factors = Vec::new();

        // Quality analysis
        if supplier.quality_score < 3.5 {
            recommendations.push("Consider quality improvement program with supplier".to_string());
            risk_factors.push("Below average quality score".to_string());
        } else if supplier.quality_score > 4.5 {
            recommendations.push("Excellent quality - consider for partnership program".to_string());
        }

        // Reliability analysis
        if supplier.reliability_score < 3.0 {
            recommendations.push("Monitor closely - consider backup suppliers".to_string());
            risk_factors.push("Low reliability score".to_string());
        }

        // Response time analysis
        if let Some(response_time) = supplier.response_time_hours {
            if response_time > 48.0 {
                recommendations.push("Slow response time - may impact order fulfillment".to_string());
                risk_factors.push("Poor customer service responsiveness".to_string());
            }
        }

        // Rating analysis
        if supplier.rating < self.config.min_rating_for_partnership {
            recommendations.push("Below partnership threshold - consider training or replacement".to_string());
        } else if supplier.rating > self.config.auto_approve_threshold {
            recommendations.push("High rating - suitable for auto-approval status".to_string());
        }

        // Calculate overall score
        let overall_score = (supplier.quality_score + supplier.reliability_score + supplier.rating) / 3.0;

        // Determine partnership suggestion
        let partnership_suggestion = if overall_score >= 4.5 {
            "Gold Partnership - prioritize for strategic initiatives"
        } else if overall_score >= 4.0 {
            "Preferred Supplier - increase order volume"
        } else if overall_score >= 3.5 {
            "Approved Supplier - monitor performance"
        } else if overall_score >= 3.0 {
            "Probationary - require improvement plan"
        } else {
            "Consider termination - high risk supplier"
        }.to_string();

        Ok(SupplierAnalysis {
            supplier_id,
            quality_score: supplier.quality_score,
            reliability_score: supplier.reliability_score,
            price_competitiveness: 3.5, // Would calculate from actual pricing data
            overall_score,
            recommendations,
            risk_factors,
            partnership_suggestion,
        })
    }

    /// Update supplier rating and metrics
    pub async fn update_supplier_metrics(
        &self,
        supplier_id: Uuid,
        new_rating: Option<f64>,
        new_review_count: Option<i32>,
        new_response_rate: Option<f64>,
        new_on_time_delivery: Option<f64>,
        new_return_rate: Option<f64>,
    ) -> CommandResult<()> {
        let mut updates = Vec::new();
        let mut params = Vec::new();

        if let Some(rating) = new_rating {
            updates.push("rating = $1");
            params.push(rating.to_string());
        }
        if let Some(review_count) = new_review_count {
            updates.push("review_count = $2");
            params.push(review_count.to_string());
        }
        if let Some(response_rate) = new_response_rate {
            updates.push("response_rate = $3");
            params.push(response_rate.to_string());
        }
        if let Some(on_time_delivery) = new_on_time_delivery {
            updates.push("on_time_delivery_rate = $4");
            params.push(on_time_delivery.to_string());
        }
        if let Some(return_rate) = new_return_rate {
            updates.push("return_rate = $5");
            params.push(return_rate.to_string());
        }

        if !updates.is_empty() {
            updates.push("updated_at = $6");
            params.push(Utc::now().to_string());

            let query = format!(
                "UPDATE suppliers SET {} WHERE id = ${}",
                updates.join(", "),
                params.len() + 1
            );
            params.push(supplier_id.to_string());

            let mut builder = sqlx::query(&query);
            for param in params {
                builder = builder.bind(param);
            }

            builder
                .execute(&self.db_pool)
                .await
                .map_err(|e| format!("Failed to update supplier metrics: {}", e))?;
        }

        Ok(())
    }

    /// Get supplier analytics
    pub async fn get_supplier_analytics(&self, days_back: i32) -> CommandResult<serde_json::Value> {
        let mut conn = self.db_pool.acquire().await
            .map_err(|e| format!("Failed to get connection: {}", e))?;

        // Supplier counts by type
        let type_stats = sqlx::query!(
            r#"
            SELECT 
                company_type,
                COUNT(*) as count,
                AVG(rating) as avg_rating,
                AVG(quality_score) as avg_quality,
                AVG(reliability_score) as avg_reliability
            FROM suppliers 
            WHERE is_active = true
            GROUP BY company_type
            ORDER BY count DESC
            "#
        )
        .fetch_all(&mut *conn)
        .await
        .map_err(|e| format!("Failed to get type stats: {}", e))?;

        // Top performing suppliers
        let top_suppliers = sqlx::query!(
            r#"
            SELECT 
                id, name, rating, quality_score, reliability_score, review_count
            FROM suppliers 
            WHERE is_active = true AND review_count > 0
            ORDER BY rating DESC, quality_score DESC
            LIMIT 10
            "#
        )
        .fetch_all(&mut *conn)
        .await
        .map_err(|e| format!("Failed to get top suppliers: {}", e))?;

        let analytics = serde_json::json!({
            "by_type": type_stats.into_iter().map(|r| serde_json::json!({
                "type": r.company_type,
                "count": r.count.unwrap_or(0),
                "avg_rating": r.avg_rating.unwrap_or(0.0),
                "avg_quality": r.avg_quality.unwrap_or(0.0),
                "avg_reliability": r.avg_reliability.unwrap_or(0.0)
            })).collect::<Vec<_>>(),
            "top_performers": top_suppliers.into_iter().map(|r| serde_json::json!({
                "id": r.id,
                "name": r.name,
                "rating": r.rating.unwrap_or(0.0),
                "quality_score": r.quality_score.unwrap_or(0.0),
                "reliability_score": r.reliability_score.unwrap_or(0.0),
                "review_count": r.review_count
            })).collect::<Vec<_>>(),
            "period_days": days_back
        });

        Ok(analytics)
    }

    /// Import supplier from scraper data
    pub async fn import_supplier_from_scraper(
        &self,
        scraper_data: serde_json::Value,
        platform: &str,
    ) -> CommandResult<Uuid> {
        let name = scraper_data["name"].as_str()
            .ok_or("Missing supplier name")?;

        let email = scraper_data["email"].as_str().map(|s| s.to_string());
        let website = scraper_data["website"].as_str().map(|s| s.to_string());
        let rating = scraper_data["rating"].as_f64().unwrap_or(3.0);
        let review_count = scraper_data["review_count"].as_i64().unwrap_or(0) as i32;

        let request = CreateSupplierRequest {
            name: name.to_string(),
            alias: None,
            email,
            phone: None,
            website,
            company_type: platform.to_string(),
            main_categories: vec![],
            payment_methods: vec![],
        };

        let supplier = self.create_supplier(request).await?;

        // Update metrics from scraper data
        self.update_supplier_metrics(
            supplier.id,
            Some(rating),
            Some(review_count),
            None,
            None,
            None,
        ).await?;

        Ok(supplier.id)
    }
}