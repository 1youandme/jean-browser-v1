// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod ai;
mod proxy;
mod workspace;
mod local_fs;
mod models;
mod error;
mod ai_gateway;
mod prompt_engineering;
mod backlog;
mod loyalty;
mod plugins;
mod security;
mod integrations;
mod video_studio;
mod local_hub;
mod auto_api;
mod transport;

use axum::{
    routing::{get, post},
    Json, Router,
};
use serde_json::Value;
use std::net::SocketAddr;
use tokio::net::TcpListener;
use tower_http::cors::CorsLayer;
use tower::middleware;
use tracing_subscriber;

#[tokio::main]
async fn main() {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_env_filter("jeantrail_browser=debug,tower_http=debug")
        .init();

    // Tauri commands are registered in lib.rs
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            commands::read_file,
            commands::write_file,
            commands::open_url,
            commands::list_directory,
            commands::open_in_system,
            local_fs::create_directory,
            local_fs::delete_file_or_directory,
            local_fs::move_file,
            local_fs::copy_file,
            local_fs::get_file_info
        ])
        .setup(|app| {
            let enable = false;
            let _ = enable;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

async fn start_backend_server() {
    let app = Router::new()
        .route("/health", get(health_check))
        .route("/ai/generate", post(ai::generate_response))
        .route("/api/workspaces", get(workspace::list_workspaces))
        .route("/api/workspaces", post(workspace::create_workspace))
        .route("/api/workspaces/:id", get(workspace::get_workspace))
        .route("/api/workspaces/:id", put(workspace::update_workspace))
        .route("/api/workspaces/:id", axum::routing::delete(workspace::delete_workspace))
        .route("/api/proxy/nodes", get(proxy::list_nodes))
        .route("/api/proxy/nodes", post(proxy::create_node))
        .route("/api/proxy/nodes/:id", axum::routing::delete(proxy::delete_node))
        .route("/api/proxy/sessions", get(proxy::list_sessions))
        .route("/api/proxy/sessions", post(proxy::start_session))
        
        // Model Hub routes
        .route("/api/models", get(models::list_models))
        .route("/api/models", post(models::create_model))
        .route("/api/models/:id", get(models::get_model))
        .route("/api/models/:id", axum::routing::put(models::update_model))
        .route("/api/models/:id", axum::routing::delete(models::delete_model))
        .route("/api/models/:model_type/:id/default", axum::routing::put(models::set_default_model))
        .route("/api/models/:id/download", post(models::download_model))
        .route("/api/models/:id/test", post(models::test_model))
        
        // Backlog / Ideas routes
        .route("/api/backlog", get(backlog::list_backlog_items))
        .route("/api/backlog", post(backlog::create_backlog_item))
        .route("/api/backlog/import", post(backlog::import_csv_backlog))
        .route("/api/backlog/export", get(backlog::export_csv_backlog))
        .route("/api/backlog/statistics", get(backlog::get_backlog_statistics))
        .route("/api/backlog/:id", get(backlog::get_backlog_item))
        .route("/api/backlog/:id", axum::routing::put(backlog::update_backlog_item))
        .route("/api/backlog/:id", axum::routing::delete(backlog::delete_backlog_item))
        
        // Loyalty / Points routes
        .route("/api/loyalty/users/:user_id/balance", get(loyalty::get_user_points_balance))
        .route("/api/loyalty/earn", post(loyalty::earn_points))
        .route("/api/loyalty/users/:user_id/spend", post(loyalty::spend_points))
        .route("/api/loyalty/users/:user_id/transactions", get(loyalty::get_user_transaction_history))
        .route("/api/loyalty/rewards", get(loyalty::list_rewards))
        .route("/api/loyalty/rewards", post(loyalty::create_reward))
        .route("/api/loyalty/redeem", post(loyalty::redeem_reward))
        .route("/api/loyalty/users/:user_id/rewards", get(loyalty::get_user_rewards))
        
        // Plugin System routes
        .route("/api/plugins", get(plugins::list_plugins))
        .route("/api/plugins", post(plugins::create_plugin))
        .route("/api/plugins/install", post(plugins::install_plugin_from_url))
        .route("/api/plugins/:id", get(plugins::get_plugin))
        .route("/api/plugins/:id", axum::routing::put(plugins::update_plugin))
        .route("/api/plugins/:id", axum::routing::delete(plugins::delete_plugin))
        .route("/api/plugins/:id/activate", post(plugins::activate_plugin))
        .route("/api/plugins/:id/deactivate", post(plugins::deactivate_plugin))
        .route("/api/plugins/:id/validate", post(plugins::validate_plugin_manifest))
        .route("/api/plugins/users/:user_id/:plugin_id", get(plugins::get_user_plugin_settings))
        .route("/api/plugins/users/:user_id/:plugin_id", axum::routing::put(plugins::update_user_plugin_settings))
        .route("/api/plugins/:id/users/:user_id/execute", post(plugins::execute_plugin_command))
        .route("/api/plugins/:id/users/:user_id/api/:endpoint", axum::routing::post(plugins::bridge_plugin_api_request))
        
        // Security / Privacy routes
        .route("/api/security/audit-logs", get(security::get_audit_logs))
        .route("/api/security/consents", post(security::create_consent_record))
        .route("/api/security/users/:user_id/consents", get(security::get_user_consents))
        .route("/api/security/users/:user_id/privacy", axum::routing::put(security::update_privacy_settings))
        .route("/api/security/users/:user_id/privacy", get(security::get_user_privacy_settings))
        .route("/api/security/dashboard", get(security::get_security_dashboard))
        
        // Integrations routes
        .route("/api/integrations", get(integrations::list_integrations))
        .route("/api/integrations", post(integrations::create_integration))
        .route("/api/integrations/:id", get(integrations::get_integration))
        .route("/api/integrations/:id", axum::routing::put(integrations::update_integration))
        .route("/api/integrations/:id", axum::routing::delete(integrations::delete_integration))
        .route("/api/integrations/:id/test", post(integrations::test_integration))
        .route("/api/integrations/webhook", post(integrations::trigger_webhook))
        .route("/api/integrations/colab", post(integrations::submit_colab_job))
        .route("/api/integrations/gradio", post(integrations::submit_gradio_job))
        .route("/api/integrations/jobs/:job_id", get(integrations::get_job_status))
        .route("/api/integrations/jobs/:job_id/cancel", post(integrations::cancel_job))
        .route("/api/integrations/logs", get(integrations::get_integration_logs))
        
        // Video Studio routes
        .route("/api/video-studio/projects", get(video_studio::list_video_projects))
        .route("/api/video-studio/projects", post(video_studio::create_video_project))
        .route("/api/video-studio/projects/templates", get(video_studio::get_video_templates))
        .route("/api/video-studio/projects/:template_id/from-template", post(video_studio::create_project_from_template))
        .route("/api/video-studio/projects/:id", get(video_studio::get_video_project))
        .route("/api/video-studio/projects/:id", axum::routing::put(video_studio::update_video_project))
        .route("/api/video-studio/projects/:id", axum::routing::delete(video_studio::delete_video_project))
        .route("/api/video-studio/projects/:id/generate", post(video_studio::generate_video))
        .route("/api/video-studio/projects/:id/status", get(video_studio::get_video_generation_status))
        .route("/api/video-studio/projects/:id/cancel", post(video_studio::cancel_video_generation))
        .route("/api/video-studio/projects/:id/upload", post(video_studio::upload_reference_image))
        .route("/api/video-studio/queue", get(video_studio::get_video_generation_queue))
        
        // Local Hub / P2P routes
        .route("/api/local-hub/rooms", post(local_hub::create_room))
        .route("/api/local-hub/rooms/join", post(local_hub::join_room))
        .route("/api/local-hub/rooms/active", get(local_hub::list_active_rooms))
        .route("/api/local-hub/rooms/:room_code", get(local_hub::get_room_info))
        .route("/api/local-hub/rooms/:room_code/leave/:peer_id", post(local_hub::leave_room))
        .route("/api/local-hub/rooms/:room_code/messages", post(local_hub::send_message))
        .route("/api/local-hub/rooms/:room_code/messages", get(local_hub::get_room_messages))
        .route("/api/local-hub/rooms/:room_code/qr", get(local_hub::get_room_qr_code))
        .route("/api/local-hub/rooms/:room_code/export", get(local_hub::export_chat_history))
        .route("/api/local-hub/rooms/:room_code/ws/:peer_id", axum::routing::get(local_hub::websocket_handler))
        
        // Auto-API Extractor routes
        .route("/api/auto-api/log", post(auto_api::log_api_request))
        .route("/api/auto-api/discovered", get(auto_api::get_discovered_apis))
        .route("/api/auto-api/specs/:domain", get(auto_api::generate_openapi_spec))
        .route("/api/auto-api/stubs/:domain", get(auto_api::generate_client_stubs))
        .route("/api/auto-api/stubs/:domain/download", get(auto_api::download_client_stub))
        
        // Transport / Delivery routes
        .route("/api/transport/drivers", get(transport::list_drivers))
        .route("/api/transport/drivers", post(transport::create_driver))
        .route("/api/transport/drivers/:id", get(transport::get_driver))
        .route("/api/transport/drivers/:id/status", axum::routing::put(transport::update_driver_status))
        .route("/api/transport/vehicles", post(transport::create_vehicle))
        .route("/api/transport/drivers/:driver_id/vehicles", get(transport::get_driver_vehicles))
        .route("/api/transport/routes", post(transport::create_route))
        .route("/api/transport/routes/:id/start", post(transport::start_route))
        .route("/api/transport/routes/:id/complete", post(transport::complete_route))
        .route("/api/transport/telemetry", post(transport::record_telemetry))
        .route("/api/transport/telemetry", get(transport::get_telemetry_data))
        .route("/api/transport/analytics", get(transport::get_delivery_analytics))
        .route("/api/transport/drivers/:driver_id/performance", get(transport::get_driver_performance))
        .route("/api/transport/drivers/:driver_id/dashboard", get(transport::get_driver_dashboard))
        .route("/api/transport/drivers/:driver_id/deliveries", get(transport::get_available_deliveries))
        .layer(CorsLayer::permissive())
        
        // Security middleware
        .layer(middleware::from_fn(security::audit_logging_middleware));

    let addr = SocketAddr::from(([127, 0, 0, 1], 8080));
    let listener = TcpListener::bind(addr).await.unwrap();

    tracing::info!("Backend server listening on {}", addr);
    axum::serve(listener, app).await.unwrap();
}

async fn health_check() -> Json<Value> {
    Json(serde_json::json!({
        "status": "ok",
        "timestamp": chrono::Utc::now().to_rfc3339()
    }))
}
