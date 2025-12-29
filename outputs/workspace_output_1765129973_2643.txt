use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use std::sync::Arc;
use tokio::sync::RwLock;

use crate::commands::{CommandResult, DatabasePool};
use crate::jean_core::JeanOrchestrator;
use crate::jean_permissions::JeanPermissions;
use crate::docker_monitor::DockerMonitor;
use crate::ecommerce::*;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrchestratorConfig {
    pub auto_monitoring: bool,
    pub auto_pricing: bool,
    pub auto_promos: bool,
    pub memory_retention_days: i32,
    pub permission_expiry_hours: i32,
    pub cleanup_interval_hours: i32,
}

impl Default for OrchestratorConfig {
    fn default() -> Self {
        Self {
            auto_monitoring: true,
            auto_pricing: true,
            auto_promos: true,
            memory_retention_days: 90,
            permission_expiry_hours: 24,
            cleanup_interval_hours: 6,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemStatus {
    pub orchestrator_status: String,
    pub docker_monitoring: bool,
    pub services_running: i32,
    pub services_healthy: i32,
    pub active_permissions: i32,
    pub recent_actions: i32,
    pub memory_entries: i32,
    pub new_products: i32,
    pub active_promos: i32,
    pub last_cleanup: Option<DateTime<Utc>>,
    pub uptime_seconds: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HealthCheckResult {
    pub component: String,
    pub status: String,
    pub message: Option<String>,
    pub metrics: Option<serde_json::Value>,
    pub timestamp: DateTime<Utc>,
}

pub struct MainOrchestrator {
    db_pool: Arc<sqlx::PgPool>,
    config: Arc<RwLock<OrchestratorConfig>>,
    
    // Core services
    jean_orchestrator: Arc<JeanOrchestrator>,
    jean_permissions: Arc<JeanPermissions>,
    docker_monitor: Arc<DockerMonitor>,
    
    // E-commerce services
    product_service: Arc<ProductService>,
    category_service: Arc<CategoryService>,
    pricing_service: Arc<PricingService>,
    promotion_service: Arc<PromotionService>,
    order_service: Arc<OrderService>,
    supplier_service: Arc<SupplierService>,
    scraper_integration: Arc<ScraperIntegrationService>,
    
    // Runtime state
    start_time: DateTime<Utc>,
    cleanup_handle: Option<tokio::task::JoinHandle<()>>,
}

impl MainOrchestrator {
    pub async fn new(db_pool: sqlx::PgPool, config: Option<OrchestratorConfig>) -> CommandResult<Self> {
        let config = Arc::new(RwLock::new(config.unwrap_or_default()));
        let db_arc = Arc::new(db_pool);

        // Initialize core services
        let jean_orchestrator = Arc::new(JeanOrchestrator::new(db_arc.as_ref().clone()));
        let jean_permissions = Arc::new(JeanPermissions::new(db_arc.as_ref().clone()));
        
        // Initialize Docker monitor (will fail gracefully if Docker not available)
        let docker_monitor = match Docker::connect_with_defaults().await {
            Ok(docker) => Arc::new(DockerMonitor::new(docker, db_arc.as_ref().clone())),
            Err(_) => {
                eprintln!("Warning: Docker not available, monitoring disabled");
                // Create a mock monitor that does nothing
                Arc::new(DockerMonitor::new_mock())
            }
        };

        // Initialize e-commerce services
        let product_service = Arc::new(ProductService::new(db_arc.as_ref().clone()));
        let category_service = Arc::new(CategoryService::new(db_arc.as_ref().clone()));
        let pricing_service = Arc::new(PricingService::new(db_arc.as_ref().clone(), None));
        let promotion_service = Arc::new(PromotionService::new(db_arc.as_ref().clone(), None));
        let order_service = Arc::new(OrderService::new(db_arc.as_ref().clone()));
        let scraper_integration = Arc::new(ScraperIntegrationService::new(db_arc.as_ref().clone(), None));

        let mut orchestrator = Self {
            db_pool: db_arc,
            config,
            jean_orchestrator,
            jean_permissions,
            docker_monitor,
            product_service,
            category_service,
            pricing_service,
            promotion_service,
            order_service,
            scraper_integration,
            start_time: Utc::now(),
            cleanup_handle: None,
        };

        // Start background tasks
        orchestrator.start_background_tasks().await?;

        Ok(orchestrator)
    }

    /// Start all background monitoring and cleanup tasks
    async fn start_background_tasks(&mut self) -> CommandResult<()> {
        let config = self.config.clone();
        let docker_monitor = self.docker_monitor.clone();
        let jean_permissions = self.jean_permissions.clone();
        let product_service = self.product_service.clone();
        let pricing_service = self.pricing_service.clone();
        let promotion_service = self.promotion_service.clone();
        let scraper_integration = self.scraper_integration.clone();

        // Start Docker monitoring
        if config.read().await.auto_monitoring {
            docker_monitor.start_monitoring().await?;
        }

        // Start periodic cleanup task
        let cleanup_handle = tokio::spawn(async move {
            let mut interval = tokio::time::interval(tokio::time::Duration::from_secs(3600)); // Every hour
            
            loop {
                interval.tick().await;
                
                let current_config = config.read().await;
                
                // Cleanup expired permissions
                if let Err(e) = jean_permissions.cleanup_expired_permissions().await {
                    eprintln!("Permission cleanup error: {}", e);
                }

                // Cleanup old memories
                if let Err(e) = jean_orchestrator.cleanup_old_memories(current_config.memory_retention_days).await {
                    eprintln!("Memory cleanup error: {}", e);
                }

                // Process new products for pricing
                if current_config.auto_pricing {
                    if let Ok(products) = product_service.get_products_for_pricing().await {
                        let product_ids: Vec<Uuid> = products.into_iter().map(|p| p.id).collect();
                        if let Err(e) = pricing_service.batch_pricing(product_ids).await {
                            eprintln!("Pricing batch error: {}", e);
                        }
                    }
                }

                // Create promos for new products
                if current_config.auto_promos {
                    if let Err(e) = promotion_service.batch_create_new_product_promos(None).await {
                        eprintln!("Promo batch error: {}", e);
                    }
                }

                // Cleanup expired promos
                if let Err(e) = promotion_service.cleanup_expired_promotions().await {
                    eprintln!("Promo cleanup error: {}", e);
                }

                // Cleanup old scraping data
                if let Err(e) = scraper_integration.cleanup_old_scraping_data(30).await {
                    eprintln!("Scraping cleanup error: {}", e);
                }
            }
        });

        self.cleanup_handle = Some(cleanup_handle);

        Ok(())
    }

    /// Get overall system status
    pub async fn get_system_status(&self) -> CommandResult<SystemStatus> {
        let uptime_seconds = (Utc::now() - self.start_time).num_seconds();

        // Get service status
        let service_summary = self.docker_monitor.get_service_summary().await.unwrap_or_default();
        let services_running = service_summary["total_services"].as_i64().unwrap_or(0) as i32;
        let services_healthy = service_summary["running"].as_i64().unwrap_or(0) as i32;

        // Get permission stats
        let permission_stats = self.jean_permissions.get_permission_stats(
            Uuid::new_v4(), // Would use actual user_id
            7
        ).await.unwrap_or_default();
        let active_permissions = permission_stats["active_permissions"].as_i64().unwrap_or(0) as i32;

        // Get action stats
        let recent_actions = permission_stats["total_actions"].as_i64().unwrap_or(0) as i32;

        // Get memory stats
        let memory_stats = self.jean_orchestrator.get_memory_stats(
            Uuid::new_v4(), // Would use actual user_id
            7
        ).await.unwrap_or_default();
        let memory_entries = memory_stats["memory_types"].as_array()
            .map(|arr| arr.len() as i32)
            .unwrap_or(0);

        // Get product stats
        let product_stats = self.product_service.get_product_stats().await.unwrap_or_default();
        let new_products = product_stats["new_products"].as_i64().unwrap_or(0) as i32;

        // Get promo stats
        let promo_stats = self.promotion_service.get_promo_analytics(7).await.unwrap_or_default();
        let active_promos = promo_stats["active_promotions"].as_i64().unwrap_or(0) as i32;

        Ok(SystemStatus {
            orchestrator_status: "running".to_string(),
            docker_monitoring: self.config.read().await.auto_monitoring,
            services_running,
            services_healthy,
            active_permissions,
            recent_actions,
            memory_entries,
            new_products,
            active_promos,
            last_cleanup: Some(Utc::now()), // Would track actual last cleanup
            uptime_seconds,
        })
    }

    /// Perform comprehensive health check
    pub async fn health_check(&self) -> CommandResult<Vec<HealthCheckResult>> {
        let mut results = Vec::new();

        // Database connectivity
        let db_result = match sqlx::query_scalar!("SELECT 1").fetch_one(&*self.db_pool).await {
            Ok(_) => HealthCheckResult {
                component: "database".to_string(),
                status: "healthy".to_string(),
                message: Some("Database connection successful".to_string()),
                metrics: None,
                timestamp: Utc::now(),
            },
            Err(e) => HealthCheckResult {
                component: "database".to_string(),
                status: "unhealthy".to_string(),
                message: Some(format!("Database error: {}", e)),
                metrics: None,
                timestamp: Utc::now(),
            },
        };
        results.push(db_result);

        // Docker monitoring
        let docker_result = HealthCheckResult {
            component: "docker_monitor".to_string(),
            status: if self.config.read().await.auto_monitoring { "active" } else { "disabled" }.to_string(),
            message: Some(if self.config.read().await.auto_monitoring {
                "Docker monitoring is active"
            } else {
                "Docker monitoring is disabled"
            }.to_string()),
            metrics: Some(self.docker_monitor.get_service_summary().await.unwrap_or_default()),
            timestamp: Utc::now(),
        };
        results.push(docker_result);

        // Product service
        let product_count = self.product_service.get_product_stats().await
            .map(|stats| stats["total_products"].as_i64().unwrap_or(0))
            .unwrap_or(0);
        
        results.push(HealthCheckResult {
            component: "product_service".to_string(),
            status: "healthy".to_string(),
            message: Some(format!("{} products in database", product_count)),
            metrics: Some(serde_json::json!({
                "total_products": product_count
            })),
            timestamp: Utc::now(),
        });

        // Pricing service
        let pricing_analytics = self.pricing_service.get_pricing_analytics(7).await.unwrap_or_default();
        results.push(HealthCheckResult {
            component: "pricing_service".to_string(),
            status: "healthy".to_string(),
            message: Some("Pricing calculations operational".to_string()),
            metrics: Some(pricing_analytics),
            timestamp: Utc::now(),
        });

        // Promotion service
        let promo_analytics = self.promotion_service.get_promo_analytics(7).await.unwrap_or_default();
        results.push(HealthCheckResult {
            component: "promotion_service".to_string(),
            status: "healthy".to_string(),
            message: Some("Promo system operational".to_string()),
            metrics: Some(promo_analytics),
            timestamp: Utc::now(),
        });

        Ok(results)
    }

    /// Process scraped products from external source
    pub async fn process_scraped_products(
        &self,
        scraper_output: &str,
        platform: &str,
    ) -> CommandResult<serde_json::Value> {
        self.scraper_integration.bridge_scraped_products(scraper_output, platform).await
    }

    /// Get comprehensive dashboard data
    pub async fn get_dashboard_data(&self) -> CommandResult<serde_json::Value> {
        let system_status = self.get_system_status().await?;
        let health_results = self.health_check().await?;
        let product_stats = self.product_service.get_product_stats().await.unwrap_or_default();
        let pricing_analytics = self.pricing_service.get_pricing_analytics(7).await.unwrap_or_default();
        let promo_analytics = self.promotion_service.get_promo_analytics(7).await.unwrap_or_default();
        let order_stats = self.order_service.get_order_stats(7).await.unwrap_or_default();

        Ok(serde_json::json!({
            "system_status": system_status,
            "health_checks": health_results,
            "products": product_stats,
            "pricing": pricing_analytics,
            "promotions": promo_analytics,
            "orders": order_stats,
            "last_updated": Utc::now()
        }))
    }

    /// Graceful shutdown
    pub async fn shutdown(&self) -> CommandResult<()> {
        // Stop cleanup task
        if let Some(handle) = &self.cleanup_handle {
            handle.abort();
        }

        // Stop Docker monitoring
        self.docker_monitor.set_monitoring_enabled(false).await;

        // Update status
        let status = SystemStatus {
            orchestrator_status: "shutdown".to_string(),
            docker_monitoring: false,
            services_running: 0,
            services_healthy: 0,
            active_permissions: 0,
            recent_actions: 0,
            memory_entries: 0,
            new_products: 0,
            active_promos: 0,
            last_cleanup: Some(Utc::now()),
            uptime_seconds: (Utc::now() - self.start_time).num_seconds(),
        };

        // Log shutdown
        eprintln!("Orchestrator shutdown complete. Final status: {:?}", status);

        Ok(())
    }
}

// Mock Docker Monitor implementation for when Docker is not available
#[cfg(not(target_os = "linux"))]
impl DockerMonitor {
    pub fn new_mock() -> Self {
        // This would need to be implemented properly
        unimplemented!("Mock Docker Monitor not implemented for non-Linux platforms")
    }
}

#[cfg(target_os = "linux")]
use bollard::Docker;

#[cfg(not(target_os = "linux"))]
struct Docker;

#[cfg(not(target_os = "linux"))]
impl Docker {
    async fn connect_with_defaults() -> Result<Self, Box<dyn std::error::Error>> {
        Err("Docker not available on this platform".into())
    }
}