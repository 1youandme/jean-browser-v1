use axum::{
    routing::{get, post, delete, put},
    Router,
    middleware,
};
use tower::ServiceBuilder;
use tower_http::{
    cors::CorsLayer,
    trace::TraceLayer,
    compression::CompressionLayer,
};

use crate::commands::AppState;
use crate::handlers::*;

// CORS configuration
fn cors_layer() -> CorsLayer {
    CorsLayer::new()
        .allow_origin("http://localhost:3000".parse::<HeaderValue>().unwrap())
        .allow_origin("http://localhost:5173".parse::<HeaderValue>().unwrap())
        .allow_methods([axum::http::Method::GET, axum::http::Method::POST, axum::http::Method::PUT, axum::http::Method::DELETE])
        .allow_headers([axum::http::header::CONTENT_TYPE, axum::http::header::AUTHORIZATION])
        .allow_credentials(true)
}

pub fn create_routes(state: AppState) -> Router {
    Router::new()
        // Jean Orchestrator Routes
        .route("/api/jean/action", post(jean::execute_action))
        .route("/api/jean/action/:action_id/approve", post(jean::approve_action))
        .route("/api/jean/action/:action_id/execute", post(jean::execute_action_by_id))
        .route("/api/jean/memory/search", get(jean::search_memory))
        .route("/api/jean/memory/save", post(jean::save_memory))
        .route("/api/jean/memory/folders", get(jean::get_memory_folders))
        .route("/api/jean/memory/folders", post(jean::create_memory_folder))
        .route("/api/jean/docker/status", get(jean::get_docker_status))
        .route("/api/jean/system/status", get(jean::get_system_status))
        .route("/api/jean/chat/message", post(jean::send_chat_message))
        .route("/api/jean/chat/history", get(jean::get_chat_history))
        .route("/api/jean/tasks/active", get(jean::get_active_tasks))
        .route("/api/jean/permissions", get(jean::get_permissions))
        .route("/api/jean/permissions", post(jean::grant_permission))
        .route("/api/jean/permissions/:permission_id", delete(jean::revoke_permission))
        .route("/api/jean/permissions/user/:user_id", get(jean::get_user_permissions))
        .route("/api/jean/actions/log", get(jean::get_actions_log))
        
        // Admin Dashboard Routes
        .route("/api/admin/dashboard", get(admin::get_dashboard))
        .route("/api/admin/dashboard/metrics", get(admin::get_dashboard_metrics))
        .route("/api/admin/dashboard/charts/revenue", get(admin::get_revenue_chart))
        .route("/api/admin/dashboard/charts/user-activity", get(admin::get_user_activity_chart))
        .route("/api/admin/activities/recent", get(admin::get_recent_activities))
        .route("/api/admin/system/health", get(admin::get_system_health))
        .route("/api/admin/system/metrics", get(admin::get_system_metrics))
        
        // Agents Management Routes
        .route("/api/agents", get(agents::list_agents))
        .route("/api/agents", post(agents::create_agent))
        .route("/api/agents/:agent_id", get(agents::get_agent))
        .route("/api/agents/:agent_id", put(agents::update_agent))
        .route("/api/agents/:agent_id", delete(agents::delete_agent))
        .route("/api/agents/:agent_id/control", post(agents::control_agent))
        .route("/api/agents/:agent_id/status", get(agents::get_agent_status))
        .route("/api/agents/:agent_id/logs", get(agents::get_agent_logs))
        .route("/api/agents/:agent_id/tasks", get(agents::get_agent_tasks))
        .route("/api/agents/:agent_id/execute", post(agents::execute_agent_task))
        .route("/api/agents/:agent_id/metrics", get(agents::get_agent_metrics))
        .route("/api/agents/metrics/system", get(agents::get_system_metrics))
        .route("/api/agents/tasks/:task_id", get(agents::get_task))
        .route("/api/agents/tasks/:task_id/cancel", post(agents::cancel_task))
        
        // Services Management
        .route("/api/services", get(services::list_services))
        .route("/api/services/:service_id/status", get(services::get_service_status))
        .route("/api/services/:service_id/action", post(services::execute_service_action))
        .route("/api/services/:service_id/config", get(services::get_service_config))
        .route("/api/services/:service_id/config", put(services::update_service_config))
        .route("/api/services/:service_id/logs", get(services::get_service_logs))
        .route("/api/services/health", get(services::get_all_services_health))
        .route("/api/services/restart/:service_id", post(services::restart_service))
        
        // E-commerce Routes
        .route("/api/ecommerce/products", get(ecommerce::list_products))
        .route("/api/ecommerce/products", post(ecommerce::create_product))
        .route("/api/ecommerce/products/:product_id", get(ecommerce::get_product))
        .route("/api/ecommerce/products/:product_id", put(ecommerce::update_product))
        .route("/api/ecommerce/products/:product_id", delete(ecommerce::delete_product))
        .route("/api/ecommerce/products/bulk", post(ecommerce::bulk_products))
        .route("/api/ecommerce/categories", get(ecommerce::list_categories))
        .route("/api/ecommerce/categories", post(ecommerce::create_category))
        .route("/api/ecommerce/orders", get(ecommerce::list_orders))
        .route("/api/ecommerce/orders", post(ecommerce::create_order))
        .route("/api/ecommerce/orders/:order_id", get(ecommerce::get_order))
        .route("/api/ecommerce/orders/:order_id/status", put(ecommerce::update_order_status))
        .route("/api/ecommerce/pricing/apply", post(ecommerce::apply_pricing))
        .route("/api/ecommerce/pricing/bulk", post(ecommerce::bulk_pricing))
        .route("/api/ecommerce/promotions", get(ecommerce::list_promotions))
        .route("/api/ecommerce/promotions", post(ecommerce::create_promotion))
        .route("/api/ecommerce/scraper/run", post(ecommerce::run_scraper))
        .route("/api/ecommerce/scraper/status", get(ecommerce::get_scraper_status))
        .route("/api/ecommerce/suppliers", get(ecommerce::list_suppliers))
        .route("/api/ecommerce/suppliers", post(ecommerce::create_supplier))
        .route("/api/ecommerce/analytics", get(ecommerce::get_analytics))
        
        // Payment Routes
        .route("/api/payments/stripe/status", get(payments::get_stripe_status))
        .route("/api/payments/paypal/status", get(payments::get_paypal_status))
        .route("/api/payments/transactions", get(payments::get_transactions))
        .route("/api/payments/transactions", post(payments::create_transaction))
        .route("/api/payments/transactions/:transaction_id", get(payments::get_transaction))
        .route("/api/payments/transfer", post(payments::create_transfer))
        .route("/api/payments/webhook/stripe", post(payments::stripe_webhook))
        .route("/api/payments/webhook/paypal", post(payments::paypal_webhook))
        .route("/api/payments/balance", get(payments::get_balance))
        .route("/api/payments/analytics", get(payments::get_payment_analytics))
        .route("/api/payments/settlements", get(payments::get_settlements))
        .route("/api/payments/refunds", post(payments::create_refund))
        
        // Security Routes
        .route("/api/security/audit", get(security::get_audit_log))
        .route("/api/security/permissions/:user_id", get(security::get_user_permissions))
        .route("/api/security/permissions/:user_id/grant", post(security::grant_permission))
        .route("/api/security/permissions/:user_id/:permission_id", delete(security::revoke_permission))
        .route("/api/security/vulnerabilities", get(security::get_vulnerabilities))
        .route("/api/security/scan", post(security::security_scan))
        .route("/api/security/incidents", get(security::get_incidents))
        .route("/api/security/incidents", post(security::create_incident))
        .route("/api/security/incidents/:incident_id", get(security::get_incident))
        .route("/api/security/incidents/:incident_id/resolve", post(security::resolve_incident))
        .route("/api/security/compliance", get(security::get_compliance_status))
        
        // Email Routes
        .route("/api/emails/templates", get(email::get_templates))
        .route("/api/emails/templates", post(email::create_template))
        .route("/api/emails/templates/:template_id", get(email::get_template))
        .route("/api/emails/templates/:template_id", put(email::update_template))
        .route("/api/emails/templates/:template_id", delete(email::delete_template))
        .route("/api/emails/send", post(email::send_email))
        .route("/api/emails/send_bulk", post(email::send_bulk_email))
        .route("/api/emails/schedule", post(email::schedule_email))
        .route("/api/emails/scheduled", get(email::get_scheduled_emails))
        .route("/api/emails/scheduled/:schedule_id", delete(email::cancel_scheduled_email))
        .route("/api/emails/history", get(email::get_email_history))
        .route("/api/emails/analytics", get(email::get_email_analytics))
        .route("/api/emails/test", post(email::send_test_email))
        
        // API Keys
        .route("/api/keys", get(api_keys::list_keys))
        .route("/api/keys", post(api_keys::create_key))
        .route("/api/keys/:key_id", get(api_keys::get_key))
        .route("/api/keys/:key_id", put(api_keys::update_key))
        .route("/api/keys/:key_id", delete(api_keys::delete_key))
        .route("/api/keys/:key_id/regenerate", post(api_keys::regenerate_key))
        .route("/api/keys/usage", get(api_keys::get_key_usage))
        .route("/api/keys/validate", post(api_keys::validate_key))
        
        // Model Hub Routes
        .route("/api/models", get(models::list_models))
        .route("/api/models", post(models::upload_model))
        .route("/api/models/:model_id", get(models::get_model))
        .route("/api/models/:model_id", delete(models::delete_model))
        .route("/api/models/:model_id/download", get(models::download_model))
        .route("/api/models/:model_id/status", get(models::get_model_status))
        .route("/api/models/categories", get(models::list_model_categories))
        .route("/api/models/search", get(models::search_models))
        .route("/api/models/:model_id/chat", post(models::chat_with_model))
        
        // Local Hub Routes
        .route("/api/localhub/peers", get(localhub::get_peers))
        .route("/api/localhub/peers/:peer_id/connect", post(localhub::connect_peer))
        .route("/api/localhub/peers/:peer_id/disconnect", post(localhub::disconnect_peer))
        .route("/api/localhub/files", get(localhub::list_files))
        .route("/api/localhub/files", post(localhub::share_file))
        .route("/api/localhub/files/:file_id", get(localhub::get_file))
        .route("/api/localhub/files/:file_id", delete(localhub::delete_file))
        .route("/api/localhub/room/create", post(localhub::create_room))
        .route("/api/localhub/rooms", get(localhub::list_rooms))
        .route("/api/localhub/rooms/:room_id/join", post(localhub::join_room))
        .route("/api/localhub/rooms/:room_id/leave", post(localhub::leave_room))
        .route("/api/localhub/qr", get(localhub::get_qr_code))
        .route("/api/localhub/status", get(localhub::get_hub_status))
        
        // Monitoring Routes
        .route("/api/monitoring/metrics", get(monitoring::get_metrics))
        .route("/api/monitoring/alerts", get(monitoring::get_alerts))
        .route("/api/monitoring/alerts", post(monitoring::create_alert))
        .route("/api/monitoring/alerts/:alert_id/ack", post(monitoring::acknowledge_alert))
        .route("/api/monitoring/alerts/:alert_id/resolve", post(monitoring::resolve_alert))
        .route("/api/monitoring/logs", get(monitoring::get_logs))
        .route("/api/monitoring/dashboards", get(monitoring::get_dashboards))
        .route("/api/monitoring/uptime", get(monitoring::get_uptime_stats))
        
        // Settings Routes
        .route("/api/settings", get(settings::get_settings))
        .route("/api/settings", put(settings::update_settings))
        .route("/api/settings/backup", post(settings::create_backup))
        .route("/api/settings/restore", post(settings::restore_backup))
        .route("/api/settings/export", get(settings::export_data))
        .route("/api/settings/import", post(settings::import_data))
        
        // User Management Routes
        .route("/api/users", get(users::list_users))
        .route("/api/users", post(users::create_user))
        .route("/api/users/:user_id", get(users::get_user))
        .route("/api/users/:user_id", put(users::update_user))
        .route("/api/users/:user_id", delete(users::delete_user))
        .route("/api/users/:user_id/permissions", get(users::get_user_permissions))
        .route("/api/users/:user_id/activity", get(users::get_user_activity))
        .route("/api/users/profile", get(users::get_current_user_profile))
        .route("/api/users/profile", put(users::update_current_user_profile))
        
        // Workspace Routes
        .route("/api/workspaces", get(workspace::list_workspaces))
        .route("/api/workspaces", post(workspace::create_workspace))
        .route("/api/workspaces/:workspace_id", get(workspace::get_workspace))
        .route("/api/workspaces/:workspace_id", put(workspace::update_workspace))
        .route("/api/workspaces/:workspace_id", delete(workspace::delete_workspace))
        .route("/api/workspaces/:workspace_id/tabs", get(workspace::get_workspace_tabs))
        .route("/api/workspaces/:workspace_id/save", post(workspace::save_workspace_state))
        
        // Proxy Routes
        .route("/api/proxy/nodes", get(proxy::list_nodes))
        .route("/api/proxy/nodes", post(proxy::create_node))
        .route("/api/proxy/nodes/:node_id", get(proxy::get_node))
        .route("/api/proxy/nodes/:node_id", delete(proxy::delete_node))
        .route("/api/proxy/nodes/:node_id/connect", post(proxy::connect_node))
        .route("/api/proxy/nodes/:node_id/disconnect", post(proxy::disconnect_node))
        .route("/api/proxy/sessions", get(proxy::list_sessions))
        .route("/api/proxy/sessions/:session_id", get(proxy::get_session))
        .route("/api/proxy/sessions/:session_id/close", post(proxy::close_session))
        
        .layer(
            ServiceBuilder::new()
                .layer(TraceLayer::new_for_http())
                .layer(CompressionLayer::new())
                .layer(cors_layer())
                .layer(middleware::from_fn_with_state(state.clone(), auth_middleware))
        )
        .with_state(state)
}

// Authentication middleware
pub async fn auth_middleware(
    state: AppState,
    request: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    // Skip auth for certain routes (health checks, etc.)
    let path = request.uri().path();
    if path.starts_with("/api/health") || 
       path.starts_with("/api/monitoring/metrics") ||
       path.starts_with("/api/jean/system/status") {
        return Ok(next.run(request).await);
    }

    // Check for API key in headers
    let auth_header = request.headers().get("authorization");
    
    if let Some(auth_value) = auth_header {
        if let Ok(auth_str) = auth_value.to_str() {
            if auth_str.starts_with("Bearer ") {
                let api_key = &auth_str[7..];
                
                // Validate API key against database
                let validation_result = validate_api_key(&state.db_pool, api_key).await;
                
                if validation_result.is_ok() {
                    // Add user context to request extensions
                    let (user_id, permissions) = validation_result.unwrap();
                    request.extensions_mut().insert(UserContext { user_id, permissions });
                    return Ok(next.run(request).await);
                }
            }
        }
    }

    Err(StatusCode::UNAUTHORIZED)
}

// User context for authenticated requests
#[derive(Debug, Clone)]
pub struct UserContext {
    pub user_id: uuid::Uuid,
    pub permissions: Vec<String>,
}

// API key validation
async fn validate_api_key(
    pool: &sqlx::PgPool,
    api_key: &str,
) -> Result<(uuid::Uuid, Vec<String>), Box<dyn std::error::Error>> {
    let result = sqlx::query!(
        r#"
        SELECT ak.user_id, ak.permissions, u.is_active
        FROM api_keys ak
        JOIN users u ON ak.user_id = u.id
        WHERE ak.key_hash = crypt($1, ak.key_hash)
            AND ak.is_active = true
            AND u.is_active = true
            AND (ak.expires_at IS NULL OR ak.expires_at > NOW())
        "#,
        api_key
    )
    .fetch_optional(pool)
    .await?;

    if let Some(record) = result {
        if !record.is_active {
            return Err("User account is inactive".into());
        }
        
        let permissions: Vec<String> = serde_json::from_value(record.permissions.unwrap_or_default())?;
        Ok((record.user_id, permissions))
    } else {
        Err("Invalid API key".into())
    }
}

// Re-export modules
pub mod jean;
pub mod admin;
pub mod agents;
pub mod services;
pub mod payments;
pub mod security;
pub mod email;
pub mod api_keys;
pub mod models;
pub mod localhub;
pub mod monitoring;
pub mod settings;
pub mod users;
pub mod workspace;
pub mod proxy;