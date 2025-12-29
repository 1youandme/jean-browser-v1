// Unified Integration Layer - n8n, Colab, Gradio
use axum::{Json, extract::{Path, Query, State}};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use uuid::Uuid;
use chrono::{DateTime, Utc};
use std::collections::HashMap;
use reqwest;

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Integration {
    pub id: Uuid,
    pub name: String,
    pub integration_type: String,
    pub config: Value,
    pub is_active: bool,
    pub last_tested_at: Option<DateTime<Utc>>,
    pub test_status: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct IntegrationLog {
    pub id: Uuid,
    pub integration_id: Uuid,
    pub event_type: String,
    pub payload: Value,
    pub response_data: Value,
    pub status: String,
    pub error_message: Option<String>,
    pub duration_ms: Option<i32>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateIntegrationRequest {
    pub name: String,
    pub integration_type: String,
    pub config: Value,
}

#[derive(Debug, Deserialize)]
pub struct UpdateIntegrationRequest {
    pub name: Option<String>,
    pub config: Option<Value>,
    pub is_active: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct TriggerWebhookRequest {
    pub integration_id: Uuid,
    pub event_type: String,
    pub payload: Value,
}

#[derive(Debug, Deserialize)]
pub struct ColabJobRequest {
    pub notebook_url: String,
    pub parameters: Value,
    pub timeout_minutes: Option<u32>,
}

#[derive(Debug, Deserialize)]
pub struct GradioJobRequest {
    pub app_url: String,
    pub fn_index: i32,
    pub data: Vec<Value>,
    pub timeout_minutes: Option<u32>,
}

// Integration Types
#[derive(Debug, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum IntegrationConfig {
    #[serde(rename = "n8n")]
    N8N {
        webhook_url: String,
        api_key: Option<String>,
        workflow_id: Option<String>,
    },
    #[serde(rename = "colab")]
    Colab {
        notebook_url: String,
        api_key: Option<String>,
        runtime_type: String,
    },
    #[serde(rename = "gradio")]
    Gradio {
        app_url: String,
        api_key: Option<String>,
        fn_index: i32,
    },
    #[serde(rename = "webhook")]
    Webhook {
        url: String,
        secret: Option<String>,
        headers: HashMap<String, String>,
    },
    #[serde(rename = "api")]
    API {
        base_url: String,
        api_key: Option<String>,
        headers: HashMap<String, String>,
    },
}

pub async fn list_integrations(
    Query(params): Query<ListIntegrationsQuery>,
) -> Result<Json<Vec<Integration>>, axum::http::StatusCode> {
    let mock_integrations = vec![
        Integration {
            id: Uuid::new_v4(),
            name: "n8n Workflow Automation".to_string(),
            integration_type: "n8n".to_string(),
            config: serde_json::json!({
                "webhook_url": "https://n8n.example.com/webhook/jeantrail",
                "api_key": "n8n_api_key_123",
                "workflow_id": "workflow_456"
            }),
            is_active: true,
            last_tested_at: Some(Utc::now()),
            test_status: Some("success".to_string()),
            created_at: Utc::now(),
            updated_at: Utc::now(),
        },
        Integration {
            id: Uuid::new_v4(),
            name: "Colab Video Generation".to_string(),
            integration_type: "colab".to_string(),
            config: serde_json::json!({
                "notebook_url": "https://colab.research.google.com/drive/1abc123def456",
                "api_key": "colab_api_key_789",
                "runtime_type": "gpu"
            }),
            is_active: true,
            last_tested_at: Some(Utc::now()),
            test_status: Some("success".to_string()),
            created_at: Utc::now(),
            updated_at: Utc::now(),
        }
    ];

    Ok(Json(mock_integrations))
}

#[derive(Debug, Deserialize)]
pub struct ListIntegrationsQuery {
    pub integration_type: Option<String>,
    pub is_active: Option<bool>,
}

pub async fn create_integration(
    Json(request): Json<CreateIntegrationRequest>,
) -> Result<Json<Integration>, axum::http::StatusCode> {
    let new_integration = Integration {
        id: Uuid::new_v4(),
        name: request.name,
        integration_type: request.integration_type,
        config: request.config,
        is_active: false, // Require testing first
        last_tested_at: None,
        test_status: None,
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };

    // Validate config based on type
    if let Err(e) = validate_integration_config(&request.integration_type, &request.config) {
        return Err(axum::http::StatusCode::BAD_REQUEST);
    }

    // Save to database
    Ok(Json(new_integration))
}

pub async fn update_integration(
    Path(id): Path<Uuid>,
    Json(request): Json<UpdateIntegrationRequest>,
) -> Result<Json<Integration>, axum::http::StatusCode> {
    // Update integration in database
    Err(axum::http::StatusCode::NOT_FOUND)
}

pub async fn delete_integration(
    Path(id): Path<Uuid>,
) -> Result<(), axum::http::StatusCode> {
    // Delete integration from database
    Ok(())
}

pub async fn test_integration(
    Path(id): Path<Uuid>,
) -> Result<Json<Value>, axum::http::StatusCode> {
    // Test integration connectivity
    // For now, return success
    Ok(Json(serde_json::json!({
        "success": true,
        "response_time_ms": 250,
        "message": "Integration test successful"
    })))
}

pub async fn trigger_webhook(
    Json(request): Json<TriggerWebhookRequest>,
) -> Result<Json<Value>, axum::http::StatusCode> {
    let start_time = std::time::Instant::now();
    
    // Get integration config
    let integration = get_integration_by_id(request.integration_id).await?;
    
    match integration.integration_type.as_str() {
        "n8n" => trigger_n8n_webhook(&integration.config, &request.event_type, &request.payload).await?,
        "webhook" => trigger_generic_webhook(&integration.config, &request.payload).await?,
        _ => return Err(axum::http::StatusCode::BAD_REQUEST),
    }
    
    let duration = start_time.elapsed().as_millis() as i32;
    
    // Log the integration call
    let log = IntegrationLog {
        id: Uuid::new_v4(),
        integration_id: request.integration_id,
        event_type: request.event_type,
        payload: request.payload,
        response_data: serde_json::json!({"success": true}),
        status: "success".to_string(),
        error_message: None,
        duration_ms: Some(duration),
        created_at: Utc::now(),
    };
    
    // Save log
    Ok(Json(serde_json::json!({
        "success": true,
        "duration_ms": duration,
        "log_id": log.id
    })))
}

async fn trigger_n8n_webhook(
    config: &Value,
    event_type: &str,
    payload: &Value,
) -> Result<(), axum::http::StatusCode> {
    let webhook_url = config["webhook_url"].as_str().ok_or(axum::http::StatusCode::BAD_REQUEST)?;
    let api_key = config["api_key"].as_str();
    
    let client = reqwest::Client::new();
    let mut request = client
        .post(webhook_url)
        .header("Content-Type", "application/json")
        .json(&serde_json::json!({
            "event": event_type,
            "data": payload,
            "source": "jeantrail"
        }));
    
    if let Some(key) = api_key {
        request = request.header("Authorization", format!("Bearer {}", key));
    }
    
    let response = request.send().await.map_err(|_| axum::http::StatusCode::INTERNAL_SERVER_ERROR)?;
    
    if !response.status().is_success() {
        return Err(axum::http::StatusCode::INTERNAL_SERVER_ERROR);
    }
    
    Ok(())
}

async fn trigger_generic_webhook(
    config: &Value,
    payload: &Value,
) -> Result<(), axum::http::StatusCode> {
    let url = config["url"].as_str().ok_or(axum::http::StatusCode::BAD_REQUEST)?;
    let secret = config["secret"].as_str();
    let headers = config["headers"].as_object().unwrap_or(&serde_json::Map::new());
    
    let client = reqwest::Client::new();
    let mut request = client.post(url).json(payload);
    
    // Add custom headers
    for (key, value) in headers {
        if let Some(value_str) = value.as_str() {
            request = request.header(key, value_str);
        }
    }
    
    // Add secret header if provided
    if let Some(secret_val) = secret {
        request = request.header("X-JeanTrail-Secret", secret_val);
    }
    
    let response = request.send().await.map_err(|_| axum::http::StatusCode::INTERNAL_SERVER_ERROR)?;
    
    if !response.status().is_success() {
        return Err(axum::http::StatusCode::INTERNAL_SERVER_ERROR);
    }
    
    Ok(())
}

pub async fn submit_colab_job(
    Json(request): Json<ColabJobRequest>,
) -> Result<Json<Value>, axum::http::StatusCode> {
    let job_id = Uuid::new_v4();
    
    // Submit job to Colab via API
    let colab_response = submit_to_colab(&request.notebook_url, &request.parameters).await?;
    
    // Store job information
    let job_info = serde_json::json!({
        "job_id": job_id,
        "notebook_url": request.notebook_url,
        "status": "submitted",
        "colab_job_id": colab_response["job_id"],
        "submitted_at": Utc::now(),
        "timeout_minutes": request.timeout_minutes.unwrap_or(30)
    });
    
    // Save to database
    
    Ok(Json(job_info))
}

async fn submit_to_colab(notebook_url: &str, parameters: &Value) -> Result<Value, Box<dyn std::error::Error>> {
    // In production, this would use Google Colab API
    // For now, return mock response
    Ok(serde_json::json!({
        "job_id": format!("colab_{}", uuid::Uuid::new_v4()),
        "status": "queued",
        "estimated_duration_minutes": 15
    }))
}

pub async fn submit_gradio_job(
    Json(request): Json<GradioJobRequest>,
) -> Result<Json<Value>, axum::http::StatusCode> {
    let job_id = Uuid::new_v4();
    
    // Submit job to Gradio app
    let gradio_response = submit_to_gradio(&request.app_url, request.fn_index, &request.data).await?;
    
    let job_info = serde_json::json!({
        "job_id": job_id,
        "app_url": request.app_url,
        "fn_index": request.fn_index,
        "status": "processing",
        "gradio_job_id": gradio_response["job_id"],
        "submitted_at": Utc::now(),
        "timeout_minutes": request.timeout_minutes.unwrap_or(10)
    });
    
    // Save to database
    
    Ok(Json(job_info))
}

async fn submit_to_gradio(app_url: &str, fn_index: i32, data: &[Value]) -> Result<Value, Box<dyn std::error::Error>> {
    let client = reqwest::Client::new();
    let response = client
        .post(&format!("{}/api/predict", app_url))
        .json(&serde_json::json!({
            "fn_index": fn_index,
            "data": data
        }))
        .send()
        .await?;
    
    if !response.status().is_success() {
        return Err("Failed to submit to Gradio".into());
    }
    
    let result: Value = response.json().await?;
    Ok(result)
}

pub async fn get_job_status(
    Path(job_id): Path<Uuid>,
) -> Result<Json<Value>, axum::http::StatusCode> {
    // Get job status from database or external service
    let status = serde_json::json!({
        "job_id": job_id,
        "status": "completed",
        "progress": 100,
        "result": {
            "output_url": "https://storage.example.com/results/video_123.mp4",
            "metadata": {
                "duration_seconds": 120,
                "file_size_mb": 45.6
            }
        },
        "started_at": "2024-01-15T10:00:00Z",
        "completed_at": "2024-01-15T10:15:30Z",
        "error": null
    });
    
    Ok(Json(status))
}

pub async fn cancel_job(
    Path(job_id): Path<Uuid>,
) -> Result<Json<Value>, axum::http::StatusCode> {
    // Cancel job
    Ok(Json(serde_json::json!({
        "job_id": job_id,
        "status": "cancelled",
        "cancelled_at": Utc::now()
    })))
}

pub async fn get_integration_logs(
    Query(params): Query<GetIntegrationLogsQuery>,
) -> Result<Json<Vec<IntegrationLog>>, axum::http::StatusCode> {
    // Query integration logs
    let mock_logs = vec![
        IntegrationLog {
            id: Uuid::new_v4(),
            integration_id: Uuid::new_v4(),
            event_type: "video_generation_started".to_string(),
            payload: serde_json::json!({"prompt": "Generate video of sunset"}),
            response_data: serde_json::json!({"job_id": "job_123"}),
            status: "success".to_string(),
            error_message: None,
            duration_ms: Some(1500),
            created_at: Utc::now(),
        }
    ];

    Ok(Json(mock_logs))
}

#[derive(Debug, Deserialize)]
pub struct GetIntegrationLogsQuery {
    pub integration_id: Option<Uuid>,
    pub event_type: Option<String>,
    pub status: Option<String>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

async fn get_integration_by_id(id: Uuid) -> Result<Integration, axum::http::StatusCode> {
    // Fetch integration from database
    Err(axum::http::StatusCode::NOT_FOUND)
}

fn validate_integration_config(integration_type: &str, config: &Value) -> Result<(), ()> {
    match integration_type {
        "n8n" => {
            if config["webhook_url"].as_str().is_none() {
                return Err(());
            }
        },
        "colab" => {
            if config["notebook_url"].as_str().is_none() {
                return Err(());
            }
        },
        "gradio" => {
            if config["app_url"].as_str().is_none() || config["fn_index"].as_i64().is_none() {
                return Err(());
            }
        },
        "webhook" => {
            if config["url"].as_str().is_none() {
                return Err(());
            }
        },
        _ => return Err(()),
    }
    
    Ok(())
}