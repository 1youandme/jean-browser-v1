use axum::{
    extract::{Extension, Path, Query, State},
    http::{StatusCode, HeaderMap},
    response::{Json, Response, Sse, sse::Event},
    routing::{get, post},
    Router,
    middleware,
};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::{RwLock, mpsc};
use tokio_stream::wrappers::ReceiverStream;
use uuid::Uuid;
use chrono::{DateTime, Utc};
use sqlx::{PgPool, Row};
use redis::{AsyncCommands, Client as RedisClient};
use futures::stream::{Stream, StreamExt};
use anyhow::Result;
use tracing::{info, warn, error, debug};

use crate::error::AppError;

#[derive(Clone)]
pub struct AiGatewayState {
    pub db: PgPool,
    pub redis: RedisClient,
    pub model_registry: Arc<RwLock<ModelRegistry>>,
    pub job_queue: Arc<RwLock<JobQueue>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelInfo {
    pub name: String,
    pub version: String,
    pub endpoint: String,
    pub model_type: ModelType,
    pub cost_per_unit: f64,
    pub unit_type: UnitType,
    pub max_tokens: Option<u32>,
    pub gpu_required: bool,
    pub health_status: HealthStatus,
    pub last_health_check: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ModelType {
    Text,
    Image,
    Video,
    Audio,
    Multimodal,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum UnitType {
    Token,
    Second,
    Image,
    VideoSecond,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum HealthStatus {
    Healthy,
    Unhealthy,
    Degraded,
    Unknown,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelRegistry {
    pub models: HashMap<String, Vec<ModelInfo>>,
}

impl ModelRegistry {
    pub fn new() -> Self {
        Self {
            models: HashMap::new(),
        }
    }

    pub async fn load_from_redis(&mut self, redis: &RedisClient) -> Result<()> {
        let mut conn = redis.get_async_connection().await?;
        
        // Load model registry from Redis
        let registry_json: String = conn.get("model_registry").await.unwrap_or_default();
        if !registry_json.is_empty() {
            let loaded: HashMap<String, Vec<ModelInfo>> = serde_json::from_str(&registry_json)?;
            self.models = loaded;
        }
        
        Ok(())
    }

    pub async fn save_to_redis(&self, redis: &RedisClient) -> Result<()> {
        let mut conn = redis.get_async_connection().await?;
        let registry_json = serde_json::to_string(&self.models)?;
        conn.set("model_registry", registry_json).await?;
        Ok(())
    }

    pub fn select_model(&self, model_name: &str, version: &str) -> Option<ModelInfo> {
        self.models.get(model_name)
            .and_then(|versions| {
                if version == "latest" {
                    versions.first().cloned()
                } else {
                    versions.iter().find(|m| m.version == version).cloned()
                }
            })
    }

    pub fn add_model(&mut self, model: ModelInfo) {
        self.models.entry(model.name.clone())
            .or_insert_with(Vec::new)
            .push(model);
        
        // Sort by version (assuming semantic versioning)
        if let Some(versions) = self.models.get_mut(&model.name) {
            versions.sort_by(|a, b| b.version.cmp(&a.version));
        }
    }

    pub async fn health_check_all(&mut self) -> Result<()> {
        for (_, versions) in self.models.iter_mut() {
            for model in versions.iter_mut() {
                model.health_status = self.check_model_health(&model.endpoint).await;
                model.last_health_check = Utc::now();
            }
        }
        Ok(())
    }

    async fn check_model_health(&self, endpoint: &str) -> HealthStatus {
        match surf::get(&format!("{}/health", endpoint)).await {
            Ok(mut response) => {
                if response.status().is_success() {
                    HealthStatus::Healthy
                } else {
                    HealthStatus::Degraded
                }
            }
            Err(_) => HealthStatus::Unhealthy,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiJob {
    pub id: String,
    pub user_id: String,
    pub model_name: String,
    pub model_version: String,
    pub input: Value,
    pub status: JobStatus,
    pub created_at: DateTime<Utc>,
    pub started_at: Option<DateTime<Utc>>,
    pub completed_at: Option<DateTime<Utc>>,
    pub estimated_cost_cents: u32,
    pub actual_cost_cents: Option<u32>,
    pub result: Option<Value>,
    pub error: Option<String>,
    pub priority: JobPriority,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum JobStatus {
    Pending,
    Processing,
    Completed,
    Failed,
    Cancelled,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum JobPriority {
    Low,
    Normal,
    High,
    Critical,
}

#[derive(Debug)]
pub struct JobQueue {
    pub sender: mpsc::UnboundedSender<AiJob>,
    pub receiver: Arc<RwLock<Option<mpsc::UnboundedReceiver<AiJob>>>>,
}

impl JobQueue {
    pub fn new() -> Self {
        let (sender, receiver) = mpsc::unbounded_channel();
        Self {
            sender,
            receiver: Arc::new(RwLock::new(Some(receiver))),
        }
    }

    pub async fn push(&self, job: AiJob) -> Result<()> {
        self.sender.send(job)?;
        Ok(())
    }

    pub async fn pop(&self) -> Option<AiJob> {
        let mut receiver = self.receiver.write().await;
        receiver.as_mut()?.recv().await
    }
}

#[derive(Debug, Deserialize)]
pub struct GenerateRequest {
    pub prompt: String,
    pub model: Option<String>,
    pub version: Option<String>,
    pub stream: Option<bool>,
    pub user_id: String,
    pub max_tokens: Option<u32>,
    pub temperature: Option<f32>,
    pub top_p: Option<f32>,
    pub top_k: Option<u32>,
    pub stop: Option<Vec<String>>,
    pub priority: Option<JobPriority>,
}

#[derive(Debug, Serialize)]
pub struct GenerateResponse {
    pub job_id: String,
    pub status: String,
    pub estimated_cost_cents: u32,
    pub stream_url: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct ChatRequest {
    pub messages: Vec<ChatMessage>,
    pub model: Option<String>,
    pub version: Option<String>,
    pub stream: Option<bool>,
    pub user_id: String,
    pub max_tokens: Option<u32>,
    pub temperature: Option<f32>,
    pub system_prompt: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

#[derive(Debug, Deserialize)]
pub struct ImageGenerateRequest {
    pub prompt: String,
    pub negative_prompt: Option<String>,
    pub model: Option<String>,
    pub user_id: String,
    pub width: Option<u32>,
    pub height: Option<u32>,
    pub num_inference_steps: Option<u32>,
    pub guidance_scale: Option<f32>,
}

impl AiGatewayState {
    pub async fn new(db: PgPool, redis: RedisClient) -> Result<Self> {
        let mut model_registry = ModelRegistry::new();
        model_registry.load_from_redis(&redis).await?;
        
        // Register default models
        model_registry.add_model(ModelInfo {
            name: "qwen-3-72b".to_string(),
            version: "v2.0.0".to_string(),
            endpoint: std::env::var("QWEN_URL").unwrap_or_else(|_| "http://qwen-3-72b:8000".to_string()),
            model_type: ModelType::Text,
            cost_per_unit: 0.001, // $0.001 per token
            unit_type: UnitType::Token,
            max_tokens: Some(32768),
            gpu_required: true,
            health_status: HealthStatus::Unknown,
            last_health_check: Utc::now(),
        });

        model_registry.add_model(ModelInfo {
            name: "sdxl".to_string(),
            version: "v1.0".to_string(),
            endpoint: std::env::var("SDXL_URL").unwrap_or_else(|_| "http://sdxl:8000".to_string()),
            model_type: ModelType::Image,
            cost_per_unit: 0.05, // $0.05 per image
            unit_type: UnitType::Image,
            max_tokens: None,
            gpu_required: true,
            health_status: HealthStatus::Unknown,
            last_health_check: Utc::now(),
        });

        model_registry.save_to_redis(&redis).await?;

        let job_queue = JobQueue::new();

        Ok(Self {
            db,
            redis,
            model_registry: Arc::new(RwLock::new(model_registry)),
            job_queue: Arc::new(RwLock::new(job_queue)),
        })
    }

    pub async fn estimate_cost(&self, model: &ModelInfo, input: &Value) -> u32 {
        match model.unit_type {
            UnitType::Token => {
                let tokens = self.estimate_tokens(input);
                (tokens as f64 * model.cost_per_unit * 100.0) as u32
            }
            UnitType::Image => (model.cost_per_unit * 100.0) as u32,
            UnitType::Second => 10, // Default 10 cents
            UnitType::VideoSecond => 50, // Default 50 cents
        }
    }

    fn estimate_tokens(&self, input: &Value) -> u32 {
        // Simple token estimation (4 characters = 1 token on average)
        if let Some(prompt) = input.get("prompt").and_then(|p| p.as_str()) {
            (prompt.len() as f32 / 4.0) as u32
        } else {
            100 // Default estimation
        }
    }

    pub async fn create_job(
        &self,
        user_id: &str,
        model_name: &str,
        model_version: &str,
        input: Value,
        estimated_cost: u32,
        priority: JobPriority,
    ) -> Result<String> {
        let job_id = Uuid::new_v4().to_string();
        
        let job = AiJob {
            id: job_id.clone(),
            user_id: user_id.to_string(),
            model_name: model_name.to_string(),
            model_version: model_version.to_string(),
            input,
            status: JobStatus::Pending,
            created_at: Utc::now(),
            started_at: None,
            completed_at: None,
            estimated_cost_cents: estimated_cost,
            actual_cost_cents: None,
            result: None,
            error: None,
            priority,
        };

        // Save to database
        sqlx::query!(
            r#"
            INSERT INTO ai_jobs (id, user_id, model_name, model_version, input_json, status, created_at, estimated_cost_cents, priority)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            "#,
            job.id,
            job.user_id,
            job.model_name,
            job.model_version,
            serde_json::to_value(&job.input)?,
            serde_json::to_string(&job.status)?,
            job.created_at,
            job.estimated_cost_cents as i32,
            serde_json::to_string(&job.priority)?
        )
        .execute(&self.db)
        .await?;

        // Add to queue
        let queue = self.job_queue.read().await;
        queue.push(job).await?;

        Ok(job_id)
    }

    pub async fn get_job(&self, job_id: &str) -> Result<Option<AiJob>> {
        let row = sqlx::query!(
            "SELECT * FROM ai_jobs WHERE id = $1",
            job_id
        )
        .fetch_optional(&self.db)
        .await?;

        if let Some(row) = row {
            let job = AiJob {
                id: row.id,
                user_id: row.user_id,
                model_name: row.model_name,
                model_version: row.model_version,
                input: serde_json::from_value(row.input_json)?,
                status: serde_json::from_str(&row.status)?,
                created_at: row.created_at,
                started_at: row.started_at,
                completed_at: row.completed_at,
                estimated_cost_cents: row.estimated_cost_cents as u32,
                actual_cost_cents: row.actual_cost_cents.map(|c| c as u32),
                result: row.result_json.map(|r| serde_json::from_value(r).unwrap_or_default()),
                error: row.error,
                priority: serde_json::from_str(&row.priority).unwrap_or(JobPriority::Normal),
            };
            Ok(Some(job))
        } else {
            Ok(None)
        }
    }

    pub async fn update_job_status(&self, job_id: &str, status: JobStatus) -> Result<()> {
        sqlx::query!(
            "UPDATE ai_jobs SET status = $1 WHERE id = $2",
            serde_json::to_string(&status)?,
            job_id
        )
        .execute(&self.db)
        .await?;
        Ok(())
    }

    pub async fn complete_job(&self, job_id: &str, result: Value, actual_cost: u32) -> Result<()> {
        sqlx::query!(
            r#"
            UPDATE ai_jobs 
            SET status = 'completed', completed_at = NOW(), result_json = $1, actual_cost_cents = $2
            WHERE id = $3
            "#,
            serde_json::to_value(result)?,
            actual_cost as i32,
            job_id
        )
        .execute(&self.db)
        .await?;
        Ok(())
    }

    pub async fn fail_job(&self, job_id: &str, error: &str) -> Result<()> {
        sqlx::query!(
            r#"
            UPDATE ai_jobs 
            SET status = 'failed', completed_at = NOW(), error = $1
            WHERE id = $2
            "#,
            error,
            job_id
        )
        .execute(&self.db)
        .await?;
        Ok(())
    }
}

pub async fn generate(
    State(state): State<AiGatewayState>,
    Json(req): Json<GenerateRequest>,
) -> Result<Json<GenerateResponse>, AppError> {
    let model_name = req.model.as_deref().unwrap_or("qwen-3-72b");
    let version = req.version.as_deref().unwrap_or("latest");
    let priority = req.priority.unwrap_or(JobPriority::Normal);

    // Select model
    let model = {
        let registry = state.model_registry.read().await;
        registry.select_model(model_name, version)
            .ok_or_else(|| AppError::ModelNotFound(model_name.to_string()))?
    };

    // Estimate cost
    let input_json = json!({
        "prompt": req.prompt,
        "max_tokens": req.max_tokens,
        "temperature": req.temperature,
        "top_p": req.top_p,
        "top_k": req.top_k,
        "stop": req.stop,
    });

    let estimated_cost = state.estimate_cost(&model, &input_json);

    // Create job
    let job_id = state.create_job(
        &req.user_id,
        model_name,
        version,
        input_json,
        estimated_cost,
        priority,
    ).await?;

    // Start background processing
    let state_clone = state.clone();
    tokio::spawn(async move {
        if let Err(e) = process_text_generation_job(state_clone, job_id.clone()).await {
            error!("Failed to process job {}: {}", job_id, e);
        }
    });

    Ok(Json(GenerateResponse {
        job_id,
        status: "pending".to_string(),
        estimated_cost_cents: estimated_cost,
        stream_url: if req.stream.unwrap_or(false) {
            Some(format!("/stream/{}", job_id))
        } else {
            None
        },
    }))
}

pub async fn generate_image(
    State(state): State<AiGatewayState>,
    Json(req): Json<ImageGenerateRequest>,
) -> Result<Json<GenerateResponse>, AppError> {
    let model_name = req.model.as_deref().unwrap_or("sdxl");
    let version = "latest";

    // Select model
    let model = {
        let registry = state.model_registry.read().await;
        registry.select_model(model_name, version)
            .ok_or_else(|| AppError::ModelNotFound(model_name.to_string()))?
    };

    // Estimate cost
    let input_json = json!({
        "prompt": req.prompt,
        "negative_prompt": req.negative_prompt,
        "width": req.width.unwrap_or(1024),
        "height": req.height.unwrap_or(1024),
        "num_inference_steps": req.num_inference_steps.unwrap_or(20),
        "guidance_scale": req.guidance_scale.unwrap_or(7.5),
    });

    let estimated_cost = state.estimate_cost(&model, &input_json);

    // Create job
    let job_id = state.create_job(
        &req.user_id,
        model_name,
        version,
        input_json,
        estimated_cost,
        JobPriority::Normal,
    ).await?;

    // Start background processing
    let state_clone = state.clone();
    tokio::spawn(async move {
        if let Err(e) = process_image_generation_job(state_clone, job_id.clone()).await {
            error!("Failed to process image job {}: {}", job_id, e);
        }
    });

    Ok(Json(GenerateResponse {
        job_id,
        status: "pending".to_string(),
        estimated_cost_cents: estimated_cost,
        stream_url: None,
    }))
}

pub async fn get_job_status(
    State(state): State<AiGatewayState>,
    Path(job_id): Path<String>,
) -> Result<Json<Value>, AppError> {
    let job = state.get_job(&job_id).await?
        .ok_or_else(|| AppError::NotFound("Job not found".to_string()))?;

    Ok(Json(json!({
        "job_id": job.id,
        "status": job.status,
        "model": job.model_name,
        "version": job.model_version,
        "created_at": job.created_at,
        "started_at": job.started_at,
        "completed_at": job.completed_at,
        "estimated_cost_cents": job.estimated_cost_cents,
        "actual_cost_cents": job.actual_cost_cents,
        "result": job.result,
        "error": job.error,
        "priority": job.priority
    })))
}

pub async fn stream_job(
    State(state): State<AiGatewayState>,
    Path(job_id): Path<String>,
) -> Result<Sse<impl Stream<Item = Result<Event, anyhow::Error>>>, AppError> {
    let (tx, rx) = tokio::sync::mpsc::channel(100);

    // Start streaming task
    let state_clone = state.clone();
    let job_id_clone = job_id.clone();
    tokio::spawn(async move {
        let mut interval = tokio::time::interval(std::time::Duration::from_millis(100));
        
        loop {
            interval.tick().await;
            
            match state_clone.get_job(&job_id_clone).await {
                Ok(Some(job)) => {
                    let event = Event::default()
                        .data(json!({
                            "status": job.status,
                            "result": job.result,
                            "error": job.error,
                            "actual_cost_cents": job.actual_cost_cents
                        }).to_string());
                    
                    if tx.send(Ok(event)).await.is_err() {
                        break;
                    }

                    if matches!(job.status, JobStatus::Completed | JobStatus::Failed | JobStatus::Cancelled) {
                        break;
                    }
                }
                Ok(None) | Err(_) => {
                    let error_event = Event::default()
                        .data(json!({"error": "Job not found"}).to_string());
                    let _ = tx.send(Ok(error_event)).await;
                    break;
                }
            }
        }
    });

    let stream = ReceiverStream::new(rx);
    Ok(Sse::new(stream))
}

pub async fn list_models(
    State(state): State<AiGatewayState>,
) -> Result<Json<Value>, AppError> {
    let registry = state.model_registry.read().await;
    
    let models: Vec<Value> = registry.models.iter()
        .flat_map(|(name, versions)| {
            versions.iter().map(move |model| json!({
                "id": format!("{}:{}", name, model.version),
                "object": "model",
                "created": model.last_health_check.timestamp(),
                "owned_by": "jeantrail",
                "model_type": model.model_type,
                "cost_per_unit": model.cost_per_unit,
                "unit_type": model.unit_type,
                "gpu_required": model.gpu_required,
                "health_status": model.health_status,
                "endpoint": model.endpoint
            }))
        })
        .collect();

    Ok(Json(json!({
        "models": models,
        "object": "list"
    })))
}

pub async fn health_check(
    State(state): State<AiGatewayState>,
) -> Result<Json<Value>, AppError> {
    let registry = state.model_registry.read().await;
    let queue = state.job_queue.read().await;
    
    let mut model_count = 0;
    let mut healthy_models = 0;
    
    for (_, versions) in registry.models.iter() {
        for model in versions {
            model_count += 1;
            if matches!(model.health_status, HealthStatus::Healthy) {
                healthy_models += 1;
            }
        }
    }

    Ok(Json(json!({
        "status": "healthy",
        "timestamp": Utc::now(),
        "models": {
            "total": model_count,
            "healthy": healthy_models,
            "unhealthy": model_count - healthy_models
        },
        "queue": {
            "active": "unknown" // TODO: Implement queue size tracking
        }
    })))
}

// Background job processing functions
async fn process_text_generation_job(state: AiGatewayState, job_id: String) -> Result<()> {
    // Update job status to processing
    state.update_job_status(&job_id, JobStatus::Processing).await?;

    // Get job details
    let job = state.get_job(&job_id).await?
        .ok_or_else(|| anyhow::anyhow!("Job not found"))?;

    // Get model info
    let model = {
        let registry = state.model_registry.read().await;
        registry.select_model(&job.model_name, &job.model_version)
            .ok_or_else(|| anyhow::anyhow!("Model not found"))?
    };

    // Start timing
    let start_time = std::time::Instant::now();

    // Call model API
    let result = match model.name.as_str() {
        "qwen-3-72b" => call_qwen_api(&job.input, &model.endpoint).await,
        _ => Err(anyhow::anyhow!("Unsupported model for text generation")),
    };

    let duration = start_time.elapsed();
    let actual_cost = calculate_actual_cost(&model, &result, duration);

    match result {
        Ok(output) => {
            state.complete_job(&job_id, output, actual_cost).await?;
        }
        Err(e) => {
            state.fail_job(&job_id, &e.to_string()).await?;
        }
    }

    Ok(())
}

async fn process_image_generation_job(state: AiGatewayState, job_id: String) -> Result<()> {
    state.update_job_status(&job_id, JobStatus::Processing).await?;

    let job = state.get_job(&job_id).await?
        .ok_or_else(|| anyhow::anyhow!("Job not found"))?;

    let model = {
        let registry = state.model_registry.read().await;
        registry.select_model(&job.model_name, &job.model_version)
            .ok_or_else(|| anyhow::anyhow!("Model not found"))?
    };

    let start_time = std::time::Instant::now();

    let result = match model.name.as_str() {
        "sdxl" => call_sdxl_api(&job.input, &model.endpoint).await,
        _ => Err(anyhow::anyhow!("Unsupported model for image generation")),
    };

    let duration = start_time.elapsed();
    let actual_cost = calculate_actual_cost(&model, &result, duration);

    match result {
        Ok(output) => {
            state.complete_job(&job_id, output, actual_cost).await?;
        }
        Err(e) => {
            state.fail_job(&job_id, &e.to_string()).await?;
        }
    }

    Ok(())
}

async fn call_qwen_api(input: &Value, endpoint: &str) -> Result<Value> {
    let client = surf::Client::new();
    let mut res = client
        .post(&format!("{}/generate", endpoint))
        .body_json(input)?
        .await?;

    let body: Value = res.body_json().await?;
    Ok(body)
}

async fn call_sdxl_api(input: &Value, endpoint: &str) -> Result<Value> {
    let client = surf::Client::new();
    let mut res = client
        .post(&format!("{}/generate", endpoint))
        .body_json(input)?
        .await?;

    let body: Value = res.body_json().await?;
    Ok(body)
}

fn calculate_actual_cost(model: &ModelInfo, result: &Result<Value>, duration: std::time::Duration) -> u32 {
    match model.unit_type {
        UnitType::Token => {
            if let Ok(output) = result {
                output.get("tokens_generated")
                    .and_then(|t| t.as_u64())
                    .map(|tokens| (tokens as f64 * model.cost_per_unit * 100.0) as u32)
                    .unwrap_or(0)
            } else {
                0
            }
        }
        UnitType::Image => (model.cost_per_unit * 100.0) as u32,
        UnitType::Second => (duration.as_secs_f64() * model.cost_per_unit * 100.0) as u32,
        UnitType::VideoSecond => (duration.as_secs_f64() * model.cost_per_unit * 100.0) as u32,
    }
}

// Background task to process jobs from queue
pub async fn job_processor(state: AiGatewayState) -> Result<()> {
    let mut interval = tokio::time::interval(std::time::Duration::from_millis(100));
    
    loop {
        interval.tick().await;
        
        if let Some(job) = state.job_queue.read().await.pop().await {
            match job.model_name.as_str() {
                "qwen-3-72b" => {
                    let state_clone = state.clone();
                    let job_id = job.id.clone();
                    tokio::spawn(async move {
                        if let Err(e) = process_text_generation_job(state_clone, job_id).await {
                            error!("Text generation job failed: {}", e);
                        }
                    });
                }
                "sdxl" => {
                    let state_clone = state.clone();
                    let job_id = job.id.clone();
                    tokio::spawn(async move {
                        if let Err(e) = process_image_generation_job(state_clone, job_id).await {
                            error!("Image generation job failed: {}", e);
                        }
                    });
                }
                _ => {
                    warn!("Unknown model: {}", job.model_name);
                }
            }
        }
    }
}

pub fn create_ai_gateway_router() -> Router<Arc<AiGatewayState>> {
    Router::new()
        .route("/generate", post(generate))
        .route("/generate-image", post(generate_image))
        .route("/job/:job_id", get(get_job_status))
        .route("/stream/:job_id", get(stream_job))
        .route("/models", get(list_models))
        .route("/health", get(health_check))
}