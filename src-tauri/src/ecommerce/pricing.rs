use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use sqlx::{PgPool, Row};

use crate::commands::{CommandResult, DatabasePool};
use super::products::Product;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PricingConfig {
    pub default_margin_percent: f64,
    pub minimum_margin_percent: f64,
    pub competitor_threshold_percent: f64,
    pub auto_adjust_competitor_price: bool,
    pub promo_discount_min_percent: f64,
    pub promo_discount_max_percent: f64,
}

impl Default for PricingConfig {
    fn default() -> Self {
        Self {
            default_margin_percent: 40.0,
            minimum_margin_percent: 25.0,
            competitor_threshold_percent: 15.0,
            auto_adjust_competitor_price: true,
            promo_discount_min_percent: 5.0,
            promo_discount_max_percent: 25.0,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct PricingRun {
    pub id: Uuid,
    pub product_id: Uuid,
    pub run_type: String,
    pub input_data: serde_json::Value,
    pub calculation_rules: serde_json::Value,
    pub result_data: serde_json::Value,
    pub confidence_score: f64,
    pub status: String,
    pub error_message: Option<String>,
    pub created_at: DateTime<Utc>,
    pub completed_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct PricingSnapshot {
    pub id: Uuid,
    pub product_id: Uuid,
    pub run_id: Option<Uuid>,
    pub cost_price: f64,
    pub shipping_cost: f64,
    pub total_cost: f64,
    pub selling_price: f64,
    pub margin_percentage: f64,
    pub margin_amount: f64,
    pub amazon_price: Option<f64>,
    pub aliexpress_price: Option<f64>,
    pub cheapest_competitor: Option<String>,
    pub competitor_advantage: f64,
    pub demand_forecast: serde_json::Value,
    pub competition_analysis: serde_json::Value,
    pub quality_impact: serde_json::Value,
    pub recommended_price: f64,
    pub pricing_strategy: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PricingRequest {
    pub product_id: Uuid,
    pub run_type: PricingRunType,
    pub custom_margin: Option<f64>,
    pub force_update: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PricingRunType {
    Initial,
    CompetitorCheck,
    AutoAdjust,
    Manual,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PricingResult {
    pub product_id: Uuid,
    pub recommended_price: f64,
    pub cost_price: f64,
    pub shipping_cost: f64,
    pub margin_percentage: f64,
    pub margin_amount: f64,
    pub strategy_used: String,
    pub confidence_score: f64,
    pub competitor_analysis: serde_json::Value,
    pub insights: Vec<String>,
}

pub struct PricingService {
    db_pool: sqlx::PgPool,
    config: PricingConfig,
}

impl PricingService {
    pub fn new(db_pool: sqlx::PgPool, config: Option<PricingConfig>) -> Self {
        Self {
            db_pool,
            config: config.unwrap_or_default(),
        }
    }

    /// Run pricing analysis for a product
    pub async fn run_pricing(&self, request: PricingRequest) -> CommandResult<PricingResult> {
        let mut conn = self.db_pool.acquire().await
            .map_err(|e| format!("Failed to get connection: {}", e))?;

        // Get product data
        let product = sqlx::query_as!(
            Product,
            r#"
            SELECT 
                id, title, cost_price, selling_price, shipping_cost, amazon_price,
                aliexpress_price, quality_score, demand_score, competition_level
            FROM products 
            WHERE id = $1
            "#,
            request.product_id
        )
        .fetch_one(&mut *conn)
        .await
        .map_err(|e| format!("Failed to get product: {}", e))?;

        // Check if recent pricing exists (unless forced)
        if !request.force_update {
            let recent_pricing = sqlx::query!(
                r#"
                SELECT id, created_at 
                FROM pricing_snapshots 
                WHERE product_id = $1 
                    AND created_at > NOW() - INTERVAL '24 hours'
                ORDER BY created_at DESC 
                LIMIT 1
                "#,
                request.product_id
            )
            .fetch_optional(&mut *conn)
            .await
            .map_err(|e| format!("Failed to check recent pricing: {}", e))?;

            if recent_pricing.is_some() {
                return Err("Pricing already updated in last 24 hours. Use force_update to override.".to_string());
            }
        }

        // Create pricing run
        let run_id = self.create_pricing_run(&request, &product).await?;

        // Calculate optimal price
        let pricing_result = self.calculate_optimal_price(&product, &request).await?;

        // Save pricing snapshot
        self.save_pricing_snapshot(run_id, &pricing_result).await?;

        // Update product price if confident
        if pricing_result.confidence_score > 0.7 {
            self.update_product_pricing(request.product_id, &pricing_result).await?;
        }

        Ok(pricing_result)
    }

    /// Batch pricing for multiple products
    pub async fn batch_pricing(&self, product_ids: Vec<Uuid>) -> CommandResult<Vec<PricingResult>> {
        let mut results = Vec::new();

        for product_id in product_ids {
            let request = PricingRequest {
                product_id,
                run_type: PricingRunType::AutoAdjust,
                custom_margin: None,
                force_update: false,
            };

            match self.run_pricing(request).await {
                Ok(result) => results.push(result),
                Err(e) => eprintln!("Failed to price product {}: {}", product_id, e),
            }
        }

        Ok(results)
    }

    /// Get pricing history for a product
    pub async fn get_pricing_history(&self, product_id: Uuid, limit: Option<i32>) -> CommandResult<Vec<PricingSnapshot>> {
        let limit_clause = limit.map(|l| format!("LIMIT {}", l)).unwrap_or_default();

        let snapshots = sqlx::query_as!(
            PricingSnapshot,
            &format!(r#"
            SELECT *
            FROM pricing_snapshots 
            WHERE product_id = $1
            ORDER BY created_at DESC
            {}
            "#, limit_clause),
            product_id
        )
        .fetch_all(&self.db_pool)
        .await
        .map_err(|e| format!("Failed to get pricing history: {}", e))?;

        Ok(snapshots)
    }

    /// Analyze competitor pricing
    async fn analyze_competitor_pricing(&self, product: &Product) -> CommandResult<serde_json::Value> {
        let mut competitor_data = serde_json::Map::new();

        if let Some(amazon_price) = product.amazon_price {
            competitor_data.insert("amazon".to_string(), serde_json::json!({
                "price": amazon_price,
                "vs_cost": amazon_price - product.cost_price,
                "vs_cost_percent": ((amazon_price - product.cost_price) / product.cost_price) * 100.0
            }));
        }

        if let Some(aliexpress_price) = product.aliexpress_price {
            competitor_data.insert("aliexpress".to_string(), serde_json::json!({
                "price": aliexpress_price,
                "vs_cost": aliexpress_price - product.cost_price,
                "vs_cost_percent": ((aliexpress_price - product.cost_price) / product.cost_price) * 100.0
            }));
        }

        // Find cheapest competitor
        let cheapest_price = product.amazon_price
            .or(product.aliexpress_price)
            .unwrap_or(product.cost_price * 2.0);

        let cheapest_source = if Some(cheapest_price) == product.amazon_price {
            "amazon"
        } else if Some(cheapest_price) == product.aliexpress_price {
            "aliexpress"
        } else {
            "unknown"
        };

        competitor_data.insert("analysis".to_string(), serde_json::json!({
            "cheapest_price": cheapest_price,
            "cheapest_source": cheapest_source,
            "our_cost": product.cost_price,
            "cost_vs_cheapest": cheapest_price - product.cost_price,
            "recommended_min_margin": self.config.minimum_margin_percent
        }));

        Ok(serde_json::Value::Object(competitor_data))
    }

    /// Calculate optimal price based on multiple factors
    async fn calculate_optimal_price(&self, product: &Product, request: &PricingRequest) -> CommandResult<PricingResult> {
        let shipping_cost = product.shipping_cost.unwrap_or(0.0);
        let total_cost = product.cost_price + shipping_cost;

        // Analyze competition
        let competitor_analysis = self.analyze_competitor_pricing(product).await?;

        // Determine pricing strategy
        let strategy = self.determine_pricing_strategy(product, &competitor_analysis).await?;

        // Calculate base price with margin
        let custom_margin = request.custom_margin.unwrap_or(self.config.default_margin_percent);
        let base_price = total_cost * (1.0 + custom_margin / 100.0);

        // Adjust for competition
        let adjusted_price = self.adjust_for_competition(base_price, &competitor_analysis).await?;

        // Calculate final margin
        let margin_amount = adjusted_price - total_cost;
        let margin_percentage = (margin_amount / adjusted_price) * 100.0;

        // Generate insights
        let insights = self.generate_pricing_insights(product, &competitor_analysis, margin_percentage).await?;

        // Calculate confidence score
        let confidence_score = self.calculate_pricing_confidence(product, &competitor_analysis, margin_percentage).await?;

        Ok(PricingResult {
            product_id: product.id,
            recommended_price: adjusted_price,
            cost_price: product.cost_price,
            shipping_cost,
            margin_percentage,
            margin_amount,
            strategy_used: strategy,
            confidence_score,
            competitor_analysis,
            insights,
        })
    }

    /// Determine pricing strategy based on product and competition
    async fn determine_pricing_strategy(
        &self,
        product: &Product,
        competitor_analysis: &serde_json::Value,
    ) -> CommandResult<String> {
        let competition_level = product.competition_level.as_deref().unwrap_or("medium");
        let quality_score = product.quality_score.unwrap_or(0.5);
        let demand_score = product.demand_score.unwrap_or(0.5);

        let strategy = match (competition_level, quality_score, demand_score) {
            ("low", high_quality, high_demand) if high_quality > 0.7 && high_demand > 0.7 => "premium",
            ("low", _, _) => "value_leader",
            ("high", high_quality, _) if high_quality > 0.8 => "quality_differentiated",
            ("high", _, _) => "price_competitive",
            ("medium", high_quality, high_demand) if high_quality > 0.6 && high_demand > 0.6 => "balanced",
            _ => "standard",
        };

        Ok(strategy.to_string())
    }

    /// Adjust price based on competition
    async fn adjust_for_competition(
        &self,
        base_price: f64,
        competitor_analysis: &serde_json::Value,
    ) -> CommandResult<f64> {
        if let Some(analysis) = competitor_analysis.get("analysis") {
            if let (Some(cheapest_price), Some(our_cost)) = (
                analysis.get("cheapest_price").and_then(|v| v.as_f64()),
                analysis.get("our_cost").and_then(|v| v.as_f64())
            ) {
                let competitor_margin = cheapest_price - our_cost;
                let competitor_margin_percent = (competitor_margin / cheapest_price) * 100.0;

                // If competitor is significantly cheaper (within threshold), adjust
                if competitor_margin_percent < self.config.default_margin_percent - self.config.competitor_threshold_percent {
                    // Reduce to minimum margin
                    let adjusted_price = our_cost * (1.0 + self.config.minimum_margin_percent / 100.0);
                    return Ok(adjusted_price.max(base_price * 0.8)); // Don't reduce more than 20%
                }
            }
        }

        Ok(base_price)
    }

    /// Generate pricing insights
    async fn generate_pricing_insights(
        &self,
        product: &Product,
        competitor_analysis: &serde_json::Value,
        margin_percentage: f64,
    ) -> CommandResult<Vec<String>> {
        let mut insights = Vec::new();

        // Margin analysis
        if margin_percentage < self.config.minimum_margin_percent {
            insights.push(format!(
                "Warning: Margin {:.1}% is below minimum {:.1}%",
                margin_percentage, self.config.minimum_margin_percent
            ));
        } else if margin_percentage > self.config.default_margin_percent + 10.0 {
            insights.push(format!(
                "High margin {:.1}% - consider competitive positioning",
                margin_percentage
            ));
        }

        // Competition insights
        if let Some(analysis) = competitor_analysis.get("analysis") {
            if let (Some(cheapest_price), Some(our_cost)) = (
                analysis.get("cheapest_price").and_then(|v| v.as_f64()),
                analysis.get("our_cost").and_then(|v| v.as_f64())
            ) {
                let price_gap = cheapest_price - our_cost;
                if price_gap < our_cost * 0.1 {
                    insights.push("Very tight competition - minimal pricing flexibility".to_string());
                } else if price_gap > our_cost * 0.5 {
                    insights.push("Strong profit opportunity - competitors priced high".to_string());
                }
            }
        }

        // Quality-based insights
        if let Some(quality_score) = product.quality_score {
            if quality_score > 0.8 && margin_percentage < 35.0 {
                insights.push("High quality product - consider premium pricing".to_string());
            }
        }

        // Demand-based insights
        if let Some(demand_score) = product.demand_score {
            if demand_score > 0.8 {
                insights.push("High demand detected - pricing power available".to_string());
            } else if demand_score < 0.3 {
                insights.push("Low demand - consider competitive pricing".to_string());
            }
        }

        Ok(insights)
    }

    /// Calculate confidence in pricing recommendation
    async fn calculate_pricing_confidence(
        &self,
        product: &Product,
        competitor_analysis: &serde_json::Value,
        margin_percentage: f64,
    ) -> CommandResult<f64> {
        let mut confidence = 0.5; // Base confidence

        // Competitor data availability
        if product.amazon_price.is_some() || product.aliexpress_price.is_some() {
            confidence += 0.2;
        }

        // Quality score reliability
        if let Some(quality_score) = product.quality_score {
            if quality_score > 0.7 {
                confidence += 0.15;
            }
        }

        // Demand score reliability
        if let Some(demand_score) = product.demand_score {
            if demand_score > 0.7 {
                confidence += 0.15;
            }
        }

        // Margin reasonableness
        if margin_percentage >= self.config.minimum_margin_percent 
            && margin_percentage <= self.config.default_margin_percent + 20.0 {
            confidence += 0.1;
        }

        Ok(confidence.min(1.0))
    }

    /// Create pricing run record
    async fn create_pricing_run(&self, request: &PricingRequest, product: &Product) -> CommandResult<Uuid> {
        let run_id = Uuid::new_v4();

        let input_data = serde_json::json!({
            "product_id": product.id,
            "cost_price": product.cost_price,
            "shipping_cost": product.shipping_cost,
            "amazon_price": product.amazon_price,
            "aliexpress_price": product.aliexpress_price,
            "quality_score": product.quality_score,
            "demand_score": product.demand_score,
            "custom_margin": request.custom_margin
        });

        let calculation_rules = serde_json::json!({
            "default_margin": self.config.default_margin_percent,
            "minimum_margin": self.config.minimum_margin_percent,
            "competitor_threshold": self.config.competitor_threshold_percent,
            "auto_adjust": self.config.auto_adjust_competitor_price
        });

        sqlx::query!(
            r#"
            INSERT INTO pricing_runs (
                id, product_id, run_type, input_data, calculation_rules, 
                confidence_score, status, created_at
            ) VALUES ($1, $2, $3, $4, $5, 0.0, 'pending', $6)
            "#,
            run_id,
            request.product_id,
            serde_json::to_string(&request.run_type).unwrap_or_default(),
            input_data,
            calculation_rules,
            Utc::now()
        )
        .execute(&self.db_pool)
        .await
        .map_err(|e| format!("Failed to create pricing run: {}", e))?;

        Ok(run_id)
    }

    /// Save pricing snapshot
    async fn save_pricing_snapshot(&self, run_id: Uuid, result: &PricingResult) -> CommandResult<()> {
        let snapshot_id = Uuid::new_v4();

        sqlx::query!(
            r#"
            INSERT INTO pricing_snapshots (
                id, product_id, run_id, cost_price, shipping_cost, total_cost,
                selling_price, margin_percentage, margin_amount,
                amazon_price, aliexpress_price, cheapest_competitor,
                competitor_advantage, demand_forecast, competition_analysis,
                quality_impact, recommended_price, pricing_strategy, created_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
            )
            "#,
            snapshot_id,
            result.product_id,
            run_id,
            result.cost_price,
            result.shipping_cost,
            result.cost_price + result.shipping_cost,
            result.recommended_price,
            result.margin_percentage,
            result.margin_amount,
            None, // amazon_price - would populate from product
            None, // aliexpress_price - would populate from product
            None, // cheapest_competitor - extract from analysis
            0.0, // competitor_advantage - calculate
            serde_json::json!({}), // demand_forecast
            result.competitor_analysis,
            serde_json::json!({}), // quality_impact
            result.recommended_price,
            result.strategy_used,
            Utc::now()
        )
        .execute(&self.db_pool)
        .await
        .map_err(|e| format!("Failed to save pricing snapshot: {}", e))?;

        // Update run status
        sqlx::query!(
            r#"
            UPDATE pricing_runs 
            SET status = 'completed', completed_at = NOW(), confidence_score = $1
            WHERE id = $2
            "#,
            result.confidence_score,
            run_id
        )
        .execute(&self.db_pool)
        .await
        .map_err(|e| format!("Failed to update pricing run: {}", e))?;

        Ok(())
    }

    /// Update product with new pricing
    async fn update_product_pricing(&self, product_id: Uuid, result: &PricingResult) -> CommandResult<()> {
        sqlx::query!(
            r#"
            UPDATE products 
            SET 
                selling_price = $1,
                margin_percentage = $2,
                price_last_updated = NOW()
            WHERE id = $3
            "#,
            result.recommended_price,
            result.margin_percentage,
            product_id
        )
        .execute(&self.db_pool)
        .await
        .map_err(|e| format!("Failed to update product pricing: {}", e))?;

        Ok(())
    }

    /// Get pricing analytics
    pub async fn get_pricing_analytics(&self, days_back: i32) -> CommandResult<serde_json::Value> {
        let mut conn = self.db_pool.acquire().await
            .map_err(|e| format!("Failed to get connection: {}", e))?;

        // Recent pricing activity
        let recent_runs = sqlx::query!(
            r#"
            SELECT 
                COUNT(*) as total_runs,
                AVG(confidence_score) as avg_confidence,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_runs,
                COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_runs
            FROM pricing_runs 
            WHERE created_at >= NOW() - INTERVAL '{} days'
            "#,
            days_back
        )
        .fetch_one(&mut *conn)
        .await
        .map_err(|e| format!("Failed to get pricing analytics: {}", e))?;

        // Margin distribution
        let margin_stats = sqlx::query!(
            r#"
            SELECT 
                AVG(margin_percentage) as avg_margin,
                MIN(margin_percentage) as min_margin,
                MAX(margin_percentage) as max_margin,
                STDDEV(margin_percentage) as margin_stddev
            FROM pricing_snapshots 
            WHERE created_at >= NOW() - INTERVAL '{} days'
            "#,
            days_back
        )
        .fetch_one(&mut *conn)
        .await
        .map_err(|e| format!("Failed to get margin stats: {}", e))?;

        let analytics = serde_json::json!({
            "recent_runs": {
                "total": recent_runs.total_runs.unwrap_or(0),
                "completed": recent_runs.completed_runs.unwrap_or(0),
                "failed": recent_runs.failed_runs.unwrap_or(0),
                "avg_confidence": recent_runs.avg_confidence.unwrap_or(0.0)
            },
            "margins": {
                "average": margin_stats.avg_margin.unwrap_or(0.0),
                "minimum": margin_stats.min_margin.unwrap_or(0.0),
                "maximum": margin_stats.max_margin.unwrap_or(0.0),
                "deviation": margin_stats.margin_stddev.unwrap_or(0.0)
            },
            "period_days": days_back
        });

        Ok(analytics)
    }
}