use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use sqlx::{PgPool, Row};

use crate::commands::{CommandResult, DatabasePool};
use super::products::Product;
use super::promotions::PromotionService;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Order {
    pub id: Uuid,
    pub customer_id: Uuid,
    pub order_number: String,
    pub status: String,
    pub subtotal: f64,
    pub tax_amount: f64,
    pub shipping_amount: f64,
    pub discount_amount: f64,
    pub total_amount: f64,
    pub currency: String,
    pub payment_status: String,
    pub payment_method: Option<String>,
    pub shipping_address: Option<serde_json::Value>,
    pub billing_address: Option<serde_json::Value>,
    pub notes: Option<String>,
    pub internal_notes: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct OrderItem {
    pub id: Uuid,
    pub order_id: Uuid,
    pub product_id: Uuid,
    pub sku: Option<String>,
    pub title: String,
    pub quantity: i32,
    pub unit_price: f64,
    pub total_price: f64,
    pub supplier_data: Option<serde_json::Value>,
    pub shipping_info: Option<serde_json::Value>,
    pub tracking_number: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct OrderStatusHistory {
    pub id: Uuid,
    pub order_id: Uuid,
    pub old_status: Option<String>,
    pub new_status: String,
    pub change_reason: Option<String>,
    pub changed_by: Option<Uuid>,
    pub automated_change: bool,
    pub notes: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateOrderRequest {
    pub customer_id: Uuid,
    pub items: Vec<OrderItemRequest>,
    pub shipping_address: serde_json::Value,
    pub billing_address: Option<serde_json::Value>,
    pub promo_code: Option<String>,
    pub notes: Option<String>,
    pub payment_method: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrderItemRequest {
    pub product_id: Uuid,
    pub quantity: i32,
    pub unit_price: Option<f64>, // If not provided, use current product price
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrderSummary {
    pub order: Order,
    pub items: Vec<OrderItemWithProduct>,
    pub status_history: Vec<OrderStatusHistory>,
    pub supplier_info: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrderItemWithProduct {
    pub order_item: OrderItem,
    pub product: Product,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrderAnalytics {
    pub total_orders: i32,
    pub total_revenue: f64,
    pub average_order_value: f64,
    pub orders_by_status: serde_json::Value,
    pub recent_orders: Vec<Order>,
    pub top_products: serde_json::Value,
}

pub struct OrderService {
    db_pool: sqlx::PgPool,
    promotion_service: PromotionService,
}

impl OrderService {
    pub fn new(db_pool: sqlx::PgPool) -> Self {
        Self {
            db_pool: db_pool.clone(),
            promotion_service: PromotionService::new(db_pool, None),
        }
    }

    /// Create new order
    pub async fn create_order(&self, request: CreateOrderRequest) -> CommandResult<OrderSummary> {
        let mut conn = self.db_pool.acquire().await
            .map_err(|e| format!("Failed to get connection: {}", e))?;

        let order_id = Uuid::new_v4();
        let order_number = self.generate_order_number().await?;

        // Validate and get order items with product details
        let mut order_items = Vec::new();
        let mut subtotal = 0.0;

        for item_request in request.items {
            let product = sqlx::query_as!(
                Product,
                r#"
                SELECT 
                    id, title, sku, cost_price, selling_price, shipping_cost,
                    source_platform, source_product_id, supplier_data
                FROM products 
                WHERE id = $1 AND is_visible = true
                "#,
                item_request.product_id
            )
            .fetch_one(&mut *conn)
            .await
            .map_err(|e| format!("Product not found: {}", e))?;

            if product.selling_price.is_none() {
                return Err(format!("Product {} is not available for purchase (no price set)", product.id));
            }

            let unit_price = item_request.unit_price.unwrap_or(product.selling_price.unwrap());
            let total_price = unit_price * item_request.quantity as f64;

            let order_item = OrderItem {
                id: Uuid::new_v4(),
                order_id,
                product_id: item_request.product_id,
                sku: product.sku,
                title: product.title.clone(),
                quantity: item_request.quantity,
                unit_price,
                total_price,
                supplier_data: product.supplier_data,
                shipping_info: None, // Will be set later
                tracking_number: None,
                created_at: Utc::now(),
            };

            order_items.push(order_item);
            subtotal += total_price;
        }

        // Calculate discount if promo code provided
        let discount_amount = if let Some(promo_code) = &request.promo_code {
            let promo_result = self.promotion_service
                .validate_promo_code(promo_code, subtotal)
                .await?;
            
            if promo_result["valid"].as_bool().unwrap_or(false) {
                promo_result["discount_amount"].as_f64().unwrap_or(0.0)
            } else {
                return Err(format!("Invalid promo code: {}", promo_code));
            }
        } else {
            0.0
        };

        // Calculate totals
        let tax_amount = subtotal * 0.08; // 8% tax rate
        let shipping_amount = self.calculate_shipping(&request.shipping_address, subtotal).await?;
        let total_amount = subtotal + tax_amount + shipping_amount - discount_amount;

        // Create order
        sqlx::query!(
            r#"
            INSERT INTO orders (
                id, customer_id, order_number, status, subtotal, tax_amount,
                shipping_amount, discount_amount, total_amount, currency,
                payment_status, payment_method, shipping_address, billing_address,
                notes, created_at, updated_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
            )
            "#,
            order_id,
            request.customer_id,
            order_number,
            "received", // initial status
            subtotal,
            tax_amount,
            shipping_amount,
            discount_amount,
            total_amount,
            "USD",
            "pending", // payment status
            request.payment_method,
            request.shipping_address,
            request.billing_address,
            request.notes,
            Utc::now(),
            Utc::now()
        )
        .execute(&mut *conn)
        .await
        .map_err(|e| format!("Failed to create order: {}", e))?;

        // Create order items
        for item in &order_items {
            sqlx::query!(
                r#"
                INSERT INTO order_items (
                    id, order_id, product_id, sku, title, quantity,
                    unit_price, total_price, supplier_data, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                "#,
                item.id,
                order_id,
                item.product_id,
                item.sku,
                item.title,
                item.quantity,
                item.unit_price,
                item.total_price,
                item.supplier_data,
                item.created_at
            )
            .execute(&mut *conn)
            .await
            .map_err(|e| format!("Failed to create order item: {}", e))?;
        }

        // Record promo usage if applicable
        if let Some(promo_code) = &request.promo_code {
            let _ = self.promotion_service.record_promo_usage(
                promo_code,
                Some(request.customer_id),
                Some(order_id),
                discount_amount,
                None,
            ).await;
        }

        // Get created order
        let order = self.get_order(order_id).await?;

        // Create order items with product details
        let items_with_product = self.get_order_items_with_products(order_id).await?;

        // Log initial status
        self.log_order_status_change(
            order_id,
            None,
            "received",
            Some("Order created"),
            None,
            false,
        ).await?;

        Ok(OrderSummary {
            order,
            items: items_with_product,
            status_history: vec![],
            supplier_info: None,
        })
    }

    /// Get order by ID
    pub async fn get_order(&self, order_id: Uuid) -> CommandResult<Order> {
        sqlx::query_as!(
            Order,
            r#"
            SELECT *
            FROM orders 
            WHERE id = $1
            "#,
            order_id
        )
        .fetch_one(&self.db_pool)
        .await
        .map_err(|e| format!("Failed to get order: {}", e))
    }

    /// Get order summary with items and history
    pub async fn get_order_summary(&self, order_id: Uuid) -> CommandResult<OrderSummary> {
        let order = self.get_order(order_id).await?;
        let items = self.get_order_items_with_products(order_id).await?;
        let status_history = self.get_order_status_history(order_id).await?;

        Ok(OrderSummary {
            order,
            items,
            status_history,
            supplier_info: None,
        })
    }

    /// Update order status
    pub async fn update_order_status(
        &self,
        order_id: Uuid,
        new_status: &str,
        reason: Option<String>,
        changed_by: Option<Uuid>,
        automated: bool,
        notes: Option<String>,
    ) -> CommandResult<()> {
        let mut conn = self.db_pool.acquire().await
            .map_err(|e| format!("Failed to get connection: {}", e))?;

        // Get current status
        let current_status = sqlx::query_scalar!(
            "SELECT status FROM orders WHERE id = $1",
            order_id
        )
        .fetch_one(&mut *conn)
        .await
        .map_err(|e| format!("Failed to get current status: {}", e))?;

        // Update order status
        sqlx::query!(
            r#"
            UPDATE orders 
            SET status = $1, updated_at = NOW()
            WHERE id = $2
            "#,
            new_status,
            order_id
        )
        .execute(&mut *conn)
        .await
        .map_err(|e| format!("Failed to update order status: {}", e))?;

        // Log status change
        self.log_order_status_change(
            order_id,
            Some(current_status),
            new_status,
            reason,
            changed_by,
            automated,
        ).await?;

        Ok(())
    }

    /// Get customer orders
    pub async fn get_customer_orders(
        &self,
        customer_id: Uuid,
        limit: Option<i32>,
        offset: Option<i32>,
    ) -> CommandResult<Vec<Order>> {
        let mut query = "
            SELECT *
            FROM orders 
            WHERE customer_id = $1
            ORDER BY created_at DESC
        ".to_string();

        if let Some(limit) = limit {
            query.push_str(&format!(" LIMIT {}", limit));
        }
        if let Some(offset) = offset {
            query.push_str(&format!(" OFFSET {}", offset));
        }

        sqlx::query_as::<_, Order>(&query)
            .bind(customer_id)
            .fetch_all(&self.db_pool)
            .await
            .map_err(|e| format!("Failed to get customer orders: {}", e))
    }

    /// Get order analytics
    pub async fn get_order_analytics(&self, days_back: i32) -> CommandResult<OrderAnalytics> {
        let mut conn = self.db_pool.acquire().await
            .map_err(|e| format!("Failed to get connection: {}", e))?;

        // Basic stats
        let basic_stats = sqlx::query!(
            r#"
            SELECT 
                COUNT(*) as total_orders,
                SUM(total_amount) as total_revenue,
                AVG(total_amount) as avg_order_value
            FROM orders 
            WHERE created_at >= NOW() - INTERVAL '{} days'
            "#,
            days_back
        )
        .fetch_one(&mut *conn)
        .await
        .map_err(|e| format!("Failed to get basic stats: {}", e))?;

        // Orders by status
        let status_stats = sqlx::query!(
            r#"
            SELECT status, COUNT(*) as count
            FROM orders 
            WHERE created_at >= NOW() - INTERVAL '{} days'
            GROUP BY status
            ORDER BY count DESC
            "#,
            days_back
        )
        .fetch_all(&mut *conn)
        .await
        .map_err(|e| format!("Failed to get status stats: {}", e))?;

        // Recent orders
        let recent_orders = sqlx::query_as!(
            Order,
            r#"
            SELECT *
            FROM orders 
            ORDER BY created_at DESC
            LIMIT 10
            "#
        )
        .fetch_all(&mut *conn)
        .await
        .map_err(|e| format!("Failed to get recent orders: {}", e))?;

        // Top products
        let top_products = sqlx::query!(
            r#"
            SELECT 
                p.title,
                COUNT(oi.id) as order_count,
                SUM(oi.quantity) as total_quantity,
                SUM(oi.total_price) as total_revenue
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            JOIN orders o ON oi.order_id = o.id
            WHERE o.created_at >= NOW() - INTERVAL '{} days'
            GROUP BY p.id, p.title
            ORDER BY total_revenue DESC
            LIMIT 5
            "#,
            days_back
        )
        .fetch_all(&mut *conn)
        .await
        .map_err(|e| format!("Failed to get top products: {}", e))?;

        Ok(OrderAnalytics {
            total_orders: basic_stats.total_orders.unwrap_or(0),
            total_revenue: basic_stats.total_revenue.unwrap_or(0.0),
            average_order_value: basic_stats.avg_order_value.unwrap_or(0.0),
            orders_by_status: serde_json::json!(
                status_stats.into_iter().map(|r| (r.status, r.count.unwrap_or(0))).collect::<serde_json::Map<String, serde_json::Value>>()
            ),
            recent_orders,
            top_products: serde_json::json!(
                top_products.into_iter().map(|r| serde_json::json!({
                    "title": r.title,
                    "order_count": r.order_count.unwrap_or(0),
                    "total_quantity": r.total_quantity.unwrap_or(0),
                    "total_revenue": r.total_revenue.unwrap_or(0.0)
                })).collect::<Vec<_>>()
            ),
        })
    }

    /// Process dropshipping fulfillment
    pub async fn process_dropshipping_fulfillment(&self, order_id: Uuid) -> CommandResult<()> {
        let mut conn = self.db_pool.acquire().await
            .map_err(|e| format!("Failed to get connection: {}", e))?;

        // Get order items with supplier data
        let order_items = sqlx::query!(
            r#"
            SELECT 
                oi.id, oi.product_id, oi.quantity, oi.unit_price,
                p.title, p.source_platform, p.source_product_id,
                p.supplier_data, p.supplier_notes
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = $1
            "#,
            order_id
        )
        .fetch_all(&mut *conn)
        .await
        .map_err(|e| format!("Failed to get order items: {}", e))?;

        // For each item, place order with supplier
        for item in order_items {
            // This would integrate with supplier APIs (Alibaba, 1688, etc.)
            // For now, we'll just update the status
            self.update_order_item_supplier_info(item.id, serde_json::json!({
                "order_placed": true,
                "order_date": Utc::now(),
                "supplier": item.source_platform
            })).await?;
        }

        // Update order status to confirmed_with_supplier
        self.update_order_status(
            order_id,
            "confirmed_with_supplier",
            Some("Orders placed with suppliers"),
            None,
            true,
        ).await?;

        Ok(())
    }

    // Private helper methods

    async fn generate_order_number(&self) -> CommandResult<String> {
        let mut conn = self.db_pool.acquire().await
            .map_err(|e| format!("Failed to get connection: {}", e))?;

        // Get current date and sequence number
        let result = sqlx::query!(
            r#"
            WITH today_orders AS (
                SELECT COUNT(*) as count
                FROM orders 
                WHERE DATE(created_at) = CURRENT_DATE
            )
            SELECT COALESCE(MAX(count), 0) + 1 as next_sequence
            FROM today_orders
            "#
        )
        .fetch_one(&mut *conn)
        .await
        .map_err(|e| format!("Failed to get order sequence: {}", e))?;

        let sequence = result.next_sequence.unwrap_or(1);
        let date_str = Utc::now().format("%Y%m%d").to_string();
        
        Ok(format!("JT-{}-{:04}", date_str, sequence))
    }

    async fn calculate_shipping(&self, address: &serde_json::Value, subtotal: f64) -> CommandResult<f64> {
        // Simple shipping calculation - in production would use carrier APIs
        if subtotal >= 50.0 {
            Ok(0.0) // Free shipping for orders over $50
        } else {
            Ok(5.99) // Standard shipping
        }
    }

    async fn get_order_items_with_products(&self, order_id: Uuid) -> CommandResult<Vec<OrderItemWithProduct>> {
        let mut conn = self.db_pool.acquire().await
            .map_err(|e| format!("Failed to get connection: {}", e))?;

        let items = sqlx::query!(
            r#"
            SELECT 
                oi.id, oi.order_id, oi.product_id, oi.sku, oi.title,
                oi.quantity, oi.unit_price, oi.total_price, oi.supplier_data,
                oi.shipping_info, oi.tracking_number, oi.created_at,
                p.cost_price, p.selling_price, p.source_platform, p.source_product_id,
                p.source_url, p.images, p.specifications
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = $1
            "#,
            order_id
        )
        .fetch_all(&mut *conn)
        .await
        .map_err(|e| format!("Failed to get order items: {}", e))?;

        let result: Vec<OrderItemWithProduct> = items.into_iter().map(|row| {
            let order_item = OrderItem {
                id: row.id,
                order_id: row.order_id,
                product_id: row.product_id,
                sku: row.sku,
                title: row.title,
                quantity: row.quantity,
                unit_price: row.unit_price,
                total_price: row.total_price,
                supplier_data: row.supplier_data,
                shipping_info: row.shipping_info,
                tracking_number: row.tracking_number,
                created_at: row.created_at,
            };

            let product = Product {
                id: row.product_id,
                title: row.title.clone(),
                description: None,
                category_id: None,
                subcategory_id: None,
                brand: None,
                sku: row.sku,
                upc: None,
                images: None,
                specifications: row.specifications,
                variants: None,
                tags: None,
                source_url: row.source_url.unwrap_or_default(),
                source_platform: row.source_platform.unwrap_or_default(),
                source_product_id: row.source_product_id,
                upload_date: None,
                raw_category_path: None,
                cost_price: row.cost_price.unwrap_or(0.0),
                selling_price: row.selling_price,
                margin_percentage: None,
                shipping_cost: None,
                total_cost: None,
                currency: "USD".to_string(),
                amazon_price: None,
                aliexpress_price: None,
                competitor_margin: None,
                price_last_updated: None,
                status: "active".to_string(),
                is_new: false,
                is_featured: false,
                is_promo_active: false,
                is_visible: true,
                stock_status: "available".to_string(),
                min_order_quantity: 1,
                quality_score: None,
                demand_score: None,
                competition_level: None,
                aibuy_data: None,
                supplier_notes: None,
                created_at: Utc::now(),
                updated_at: Utc::now(),
            };

            OrderItemWithProduct {
                order_item,
                product,
            }
        }).collect();

        Ok(result)
    }

    async fn get_order_status_history(&self, order_id: Uuid) -> CommandResult<Vec<OrderStatusHistory>> {
        sqlx::query_as!(
            OrderStatusHistory,
            r#"
            SELECT *
            FROM order_status_history 
            WHERE order_id = $1
            ORDER BY created_at DESC
            "#,
            order_id
        )
        .fetch_all(&self.db_pool)
        .await
        .map_err(|e| format!("Failed to get status history: {}", e))
    }

    async fn log_order_status_change(
        &self,
        order_id: Uuid,
        old_status: Option<&str>,
        new_status: &str,
        reason: Option<&str>,
        changed_by: Option<Uuid>,
        automated: bool,
    ) -> CommandResult<()> {
        sqlx::query!(
            r#"
            INSERT INTO order_status_history (
                id, order_id, old_status, new_status, change_reason,
                changed_by, automated_change, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            "#,
            Uuid::new_v4(),
            order_id,
            old_status,
            new_status,
            reason,
            changed_by,
            automated,
            Utc::now()
        )
        .execute(&self.db_pool)
        .await
        .map_err(|e| format!("Failed to log status change: {}", e))?;

        Ok(())
    }

    async fn update_order_item_supplier_info(
        &self,
        order_item_id: Uuid,
        supplier_info: serde_json::Value,
    ) -> CommandResult<()> {
        sqlx::query!(
            r#"
            UPDATE order_items 
            SET supplier_data = $1
            WHERE id = $2
            "#,
            supplier_info,
            order_item_id
        )
        .execute(&self.db_pool)
        .await
        .map_err(|e| format!("Failed to update supplier info: {}", e))?;

        Ok(())
    }
}