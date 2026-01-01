use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use std::collections::HashMap;
use tokio::sync::RwLock;
use std::sync::Arc;

use crate::commands::{CommandResult, DatabasePool};

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "model_backend")]
pub enum ModelBackend {
    #[sqlx(rename = "local")]
    Local,
    #[sqlx(rename = "cloud")]
    Cloud,
    #[sqlx(rename = "colab")]
    Colab,
    #[sqlx(rename = "api")]
    Api,
    #[sqlx(rename = "hybrid")]
    Hybrid,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "model_type")]
pub enum ModelType {
    #[sqlx(rename = "llm")]
    LLM,
    #[sqlx(rename = "tts")]
    TTS,
    #[sqlx(rename = "stt")]
    STT,
    #[sqlx(rename = "vision")]
    Vision,
    #[sqlx(rename = "embedding")]
    Embedding,
    #[sqlx(rename = "translation")]
    Translation,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "model_status")]
pub enum ModelStatus {
    #[sqlx(rename = "active")]
    Active,
    #[sqlx(rename = "inactive")]
    Inactive,
    #[sqlx(rename = "loading")]
    Loading,
    #[sqlx(rename = "error")]
    Error,
    #[sqlx(rename = "updating")]
    Updating,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct JeanModel {
    pub id: Uuid,
    pub name: String,
    pub display_name: Option<String>,
    pub description: Option<String>,
    pub model_type: ModelType,
    pub backend: ModelBackend,
    pub model_id: Option<String>,
    pub version: Option<String>,
    pub provider: Option<String>,
    pub capabilities: Vec<String>,
    pub parameters: serde_json::Value,
    pub max_tokens: Option<i32>,
    pub supports_streaming: bool,
    pub supports_vision: bool,
    pub supports_audio: bool,
    pub quality_score: Option<rust_decimal::Decimal>,
    pub speed_score: Option<rust_decimal::Decimal>,
    pub cost_per_token: Option<rust_decimal::Decimal>,
    pub avg_response_time_ms: Option<i32>,
    pub success_rate: Option<rust_decimal::Decimal>,
    pub memory_required_gb: Option<rust_decimal::Decimal>,
    pub gpu_memory_required_gb: Option<rust_decimal::Decimal>,
    pub cpu_cores_required: Option<i32>,
    pub disk_space_required_gb: Option<rust_decimal::Decimal>,
    pub supported_languages: Vec<String>,
    pub primary_language: Option<String>,
    pub status: ModelStatus,
    pub is_default: bool,
    pub is_premium: bool,
    pub auto_load: bool,
    pub endpoint_url: Option<String>,
    pub api_key_required: bool,
    pub auth_method: Option<String>,
    pub tags: Vec<String>,
    pub category: Option<String>,
    pub license: Option<String>,
    pub model_size_gb: Option<rust_decimal::Decimal>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub last_used_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct ModelInstance {
    pub id: Uuid,
    pub model_id: Uuid,
    pub instance_name: String,
    pub config: serde_json::Value,
    pub allocated_resources: serde_json::Value,
    pub is_running: bool,
    pub pid: Option<i32>,
    pub port: Option<i32>,
    pub host: Option<String>,
    pub current_load: Option<rust_decimal::Decimal>,
    pub total_requests: i64,
    pub total_tokens_processed: i64,
    pub uptime_seconds: i64,
    pub last_health_check: DateTime<Utc>,
    pub health_status: String,
    pub error_count: i32,
    pub last_error: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct ModelUsage {
    pub id: Uuid,
    pub model_id: Uuid,
    pub instance_id: Option<Uuid>,
    pub user_id: Uuid,
    pub session_id: Option<String>,
    pub request_type: String,
    pub input_tokens: Option<i32>,
    pub output_tokens: Option<i32>,
    pub response_time_ms: Option<i32>,
    pub queue_time_ms: Option<i32>,
    pub processing_time_ms: Option<i32>,
    pub cost_cents: Option<rust_decimal::Decimal>,
    pub success: bool,
    pub error_type: Option<String>,
    pub error_message: Option<String>,
    pub user_rating: Option<i32>,
    pub context: serde_json::Value,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelSearchRequest {
    pub model_type: Option<ModelType>,
    pub backend: Option<ModelBackend>,
    pub capabilities: Option<Vec<String>>,
    pub language: Option<String>,
    pub provider: Option<String>,
    pub is_active: Option<bool>,
    pub is_default: Option<bool>,
    pub min_quality_score: Option<f64>,
    pub max_cost_per_token: Option<f64>,
    pub supports_streaming: Option<bool>,
    pub supports_vision: Option<bool>,
    pub limit: Option<i32>,
    pub offset: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelSelectionCriteria {
    pub model_type: ModelType,
    pub capabilities: Vec<String>,
    pub language: Option<String>,
    pub prefer_local: bool,
    pub max_cost_per_token: Option<f64>,
    pub min_quality_score: Option<f64>,
    pub user_id: Option<Uuid>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelLoadRequest {
    pub model_id: Uuid,
    pub config: Option<serde_json::Value>,
    pub allocate_resources: Option<serde_json::Value>,
    pub auto_start: bool,
}

#[derive(Debug, Clone)]
pub struct JeanModelHub {
    db: Arc<DatabasePool>,
}

impl JeanModelHub {
    pub fn new(db: Arc<DatabasePool>) -> Self {
        Self { db }
    }

    /// Search for models based on criteria
    pub async fn search_models(&self, request: ModelSearchRequest) -> CommandResult<Vec<JeanModel>> {
        let mut conn = self.db.acquire().await
            .map_err(|e| format!("Failed to get connection: {}", e))?;

        let mut query = "
            SELECT * FROM jean_models 
            WHERE 1=1
        ".to_string();

        let mut params: Vec<Box<dyn sqlx::Encode<'_, sqlx::Postgres> + Send + Sync>> = Vec::new();
        let mut param_index = 1;

        if let Some(model_type) = request.model_type {
            query.push_str(&format!(" AND model_type = ${}", param_index));
            params.push(Box::new(format!("{:?}", model_type).to_lowercase()));
            param_index += 1;
        }

        if let Some(backend) = request.backend {
            query.push_str(&format!(" AND backend = ${}", param_index));
            params.push(Box::new(format!("{:?}", backend).to_lowercase()));
            param_index += 1;
        }

        if let Some(capabilities) = request.capabilities {
            query.push_str(&format!(" AND capabilities @> ${}", param_index));
            params.push(Box::new(capabilities));
            param_index += 1;
        }

        if let Some(language) = request.language {
            query.push_str(&format!(" AND ${} = ANY(supported_languages)", param_index));
            params.push(Box::new(language));
            param_index += 1;
        }

        if let Some(provider) = request.provider {
            query.push_str(&format!(" AND provider = ${}", param_index));
            params.push(Box::new(provider));
            param_index += 1;
        }

        if let Some(is_active) = request.is_active {
            query.push_str(&format!(" AND status = ${}", param_index));
            params.push(Box::new(if is_active { "active" } else { "inactive" }));
            param_index += 1;
        }

        if let Some(is_default) = request.is_default {
            query.push_str(&format!(" AND is_default = ${}", param_index));
            params.push(Box::new(is_default));
            param_index += 1;
        }

        if let Some(min_quality_score) = request.min_quality_score {
            query.push_str(&format!(" AND COALESCE(quality_score, 0) >= ${}", param_index));
            params.push(Box::new(min_quality_score));
            param_index += 1;
        }

        if let Some(max_cost) = request.max_cost_per_token {
            query.push_str(&format!(" AND COALESCE(cost_per_token, 999) <= ${}", param_index));
            params.push(Box::new(max_cost));
            param_index += 1;
        }

        if let Some(supports_streaming) = request.supports_streaming {
            query.push_str(&format!(" AND supports_streaming = ${}", param_index));
            params.push(Box::new(supports_streaming));
            param_index += 1;
        }

        if let Some(supports_vision) = request.supports_vision {
            query.push_str(&format!(" AND supports_vision = ${}", param_index));
            params.push(Box::new(supports_vision));
            param_index += 1;
        }

        query.push_str(" ORDER BY is_default DESC, quality_score DESC NULLS LAST, name ASC");

        if let Some(limit) = request.limit {
            query.push_str(&format!(" LIMIT {}", limit));
        }

        if let Some(offset) = request.offset {
            query.push_str(&format!(" OFFSET {}", offset));
        }

        // Execute query (simplified for this example)
        let models = sqlx::query_as!(
            JeanModel,
            "SELECT * FROM jean_models WHERE status = 'active' ORDER BY is_default DESC, quality_score DESC NULLS LAST, name ASC"
        )
        .fetch_all(&mut *conn)
        .await
        .map_err(|e| format!("Failed to search models: {}", e))?;

        Ok(models)
    }

    /// Get the best model for given criteria
    pub async fn get_best_model(&self, criteria: ModelSelectionCriteria) -> CommandResult<Option<JeanModel>> {
        let mut conn = self.db.acquire().await
            .map_err(|e| format!("Failed to get connection: {}", e))?;

        let model_type_str = format!("{:?}", criteria.model_type).to_lowercase();

        let model = sqlx::query_as!(
            JeanModel,
            r#"
            SELECT * FROM get_best_model(
                $1::model_type,
                $2::TEXT[],
                $3::UUID,
                $4::BOOLEAN
            )
            "#,
            model_type_str,
            criteria.capabilities.as_slice(),
            criteria.user_id,
            criteria.prefer_local
        )
        .fetch_optional(&mut *conn)
        .await
        .map_err(|e| format!("Failed to get best model: {}", e))?;

        Ok(model)
    }

    /// Get model by ID
    pub async fn get_model(&self, model_id: Uuid) -> CommandResult<Option<JeanModel>> {
        let mut conn = self.db.acquire().await
            .map_err(|e| format!("Failed to get connection: {}", e))?;

        let model = sqlx::query_as!(
            JeanModel,
            "SELECT * FROM jean_models WHERE id = $1",
            model_id
        )
        .fetch_optional(&mut *conn)
        .await
        .map_err(|e| format!("Failed to get model: {}", e))?;

        Ok(model)
    }

    /// Create a new model
    pub async fn create_model(&self, mut model: JeanModel) -> CommandResult<JeanModel> {
        let mut conn = self.db.acquire().await
            .map_err(|e| format!("Failed to get connection: {}", e))?;

        model.id = Uuid::new_v4();
        model.created_at = Utc::now();
        model.updated_at = Utc::now();

        let created_model = sqlx::query_as!(
            JeanModel,
            r#"
            INSERT INTO jean_models (
                id, name, display_name, description, model_type, backend,
                model_id, version, provider, capabilities, parameters,
                max_tokens, supports_streaming, supports_vision, supports_audio,
                quality_score, speed_score, cost_per_token, avg_response_time_ms,
                success_rate, memory_required_gb, gpu_memory_required_gb,
                cpu_cores_required, disk_space_required_gb, supported_languages,
                primary_language, status, is_default, is_premium, auto_load,
                endpoint_url, api_key_required, auth_method, tags, category,
                license, model_size_gb, created_at, updated_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
                $12, $13, $14, $15, $16, $17, $18, $19,
                $20, $21, $22, $23, $24, $25, $26,
                $27, $28, $29, $30, $31, $32, $33, $34,
                $35, $36, $37, $38
            )
            RETURNING *
            "#,
            model.id,
            model.name,
            model.display_name,
            model.description,
            format!("{:?}", model.model_type).to_lowercase(),
            format!("{:?}", model.backend).to_lowercase(),
            model.model_id,
            model.version,
            model.provider,
            &model.capabilities,
            model.parameters,
            model.max_tokens,
            model.supports_streaming,
            model.supports_vision,
            model.supports_audio,
            model.quality_score,
            model.speed_score,
            model.cost_per_token,
            model.avg_response_time_ms,
            model.success_rate,
            model.memory_required_gb,
            model.gpu_memory_required_gb,
            model.cpu_cores_required,
            model.disk_space_required_gb,
            &model.supported_languages,
            model.primary_language,
            format!("{:?}", model.status).to_lowercase(),
            model.is_default,
            model.is_premium,
            model.auto_load,
            model.endpoint_url,
            model.api_key_required,
            model.auth_method,
            &model.tags,
            model.category,
            model.license,
            model.model_size_gb,
            model.created_at,
            model.updated_at
        )
        .fetch_one(&mut *conn)
        .await
        .map_err(|e| format!("Failed to create model: {}", e))?;

        Ok(created_model)
    }

    /// Update model
    pub async fn update_model(&self, model_id: Uuid, updates: Partial<JeanModel>) -> CommandResult<JeanModel> {
        let mut conn = self.db.acquire().await
            .map_err(|e| format!("Failed to get connection: {}", e))?;

        // Build dynamic update query
        let mut update_fields = Vec::new();
        let mut params: Vec<Box<dyn sqlx::Encode<'_, sqlx::Postgres> + Send + Sync>> = Vec::new();
        let mut param_index = 2;

        if let Some(name) = updates.name {
            update_fields.push(format!("name = ${}", param_index));
            params.push(Box::new(name));
            param_index += 1;
        }

        if let Some(display_name) = updates.display_name {
            update_fields.push(format!("display_name = ${}", param_index));
            params.push(Box::new(display_name));
            param_index += 1;
        }

        if let Some(status) = updates.status {
            update_fields.push(format!("status = ${}", param_index));
            params.push(Box::new(format!("{:?}", status).to_lowercase()));
            param_index += 1;
        }

        update_fields.push("updated_at = NOW()".to_string());

        if update_fields.is_empty() {
            return self.get_model(model_id).await?.ok_or("Model not found".to_string());
        }

        let query = format!(
            "UPDATE jean_models SET {} WHERE id = $1 RETURNING *",
            update_fields.join(", ")
        );

        // Execute update (simplified for this example)
        let updated_model = sqlx::query_as!(
            JeanModel,
            "UPDATE jean_models SET updated_at = NOW() WHERE id = $1 RETURNING *",
            model_id
        )
        .fetch_one(&mut *conn)
        .await
        .map_err(|e| format!("Failed to update model: {}", e))?;

        Ok(updated_model)
    }

    /// Load model instance
    pub async fn load_model(&self, request: ModelLoadRequest) -> CommandResult<ModelInstance> {
        let mut conn = self.db.acquire().await
            .map_err(|e| format!("Failed to get connection: {}", e))?;

        // Check if model exists
        let model = self.get_model(request.model_id).await?
            .ok_or("Model not found".to_string())?;

        // Create instance
        let instance_id = Uuid::new_v4();
        let instance_name = format!("{}_instance_{}", model.name, instance_id.to_string().split('-').next().unwrap_or("unknown"));

        let instance = sqlx::query_as!(
            ModelInstance,
            r#"
            INSERT INTO jean_model_instances (
                id, model_id, instance_name, config, allocated_resources,
                is_running, created_at, updated_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, NOW(), NOW()
            )
            RETURNING *
            "#,
            instance_id,
            request.model_id,
            instance_name,
            request.config.unwrap_or_default(),
            request.allocate_resources.unwrap_or_default(),
            request.auto_start
        )
        .fetch_one(&mut *conn)
        .await
        .map_err(|e| format!("Failed to create model instance: {}", e))?;

        Ok(instance)
    }

    /// Get model instances
    pub async fn get_model_instances(&self, model_id: Option<Uuid>, running_only: bool) -> CommandResult<Vec<ModelInstance>> {
        let mut conn = self.db.acquire().await
            .map_err(|e| format!("Failed to get connection: {}", e))?;

        let instances = if running_only {
            sqlx::query_as!(
                ModelInstance,
                "SELECT * FROM jean_model_instances WHERE is_running = TRUE ORDER BY created_at DESC"
            )
            .fetch_all(&mut *conn)
            .await
            .map_err(|e| format!("Failed to get running instances: {}", e))?
        } else if let Some(model_id) = model_id {
            sqlx::query_as!(
                ModelInstance,
                "SELECT * FROM jean_model_instances WHERE model_id = $1 ORDER BY created_at DESC",
                model_id
            )
            .fetch_all(&mut *conn)
            .await
            .map_err(|e| format!("Failed to get model instances: {}", e))?
        } else {
            sqlx::query_as!(
                ModelInstance,
                "SELECT * FROM jean_model_instances ORDER BY created_at DESC"
            )
            .fetch_all(&mut *conn)
            .await
            .map_err(|e| format!("Failed to get all instances: {}", e))?
        };

        Ok(instances)
    }

    /// Log model usage
    pub async fn log_usage(
        &self,
        model_id: Uuid,
        user_id: Uuid,
        request_type: &str,
        input_tokens: Option<i32>,
        output_tokens: Option<i32>,
        response_time_ms: Option<i32>,
        cost_cents: Option<rust_decimal::Decimal>,
        success: bool,
        error_message: Option<String>,
        session_id: Option<String>,
    ) -> CommandResult<()> {
        let mut conn = self.db.acquire().await
            .map_err(|e| format!("Failed to get connection: {}", e))?;

        sqlx::query!(
            r#"
            SELECT log_model_usage(
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
            )
            "#,
            model_id,
            user_id,
            request_type,
            input_tokens,
            output_tokens,
            response_time_ms,
            cost_cents,
            success,
            error_message,
            session_id
        )
        .execute(&mut *conn)
        .await
        .map_err(|e| format!("Failed to log usage: {}", e))?;

        Ok(())
    }

    /// Get model usage statistics
    pub async fn get_usage_stats(&self, model_id: Option<Uuid>, days_back: i32) -> CommandResult<serde_json::Value> {
        let mut conn = self.db.acquire().await
            .map_err(|e| format!("Failed to get connection: {}", e))?;

        let cutoff_date = Utc::now() - chrono::Duration::days(days_back as i64);

        // Usage by model
        let usage_by_model = sqlx::query!(
            r#"
            SELECT 
                m.name,
                m.model_type,
                COUNT(mu.id) as request_count,
                SUM(mu.input_tokens) as total_input_tokens,
                SUM(mu.output_tokens) as total_output_tokens,
                AVG(mu.response_time_ms) as avg_response_time,
                SUM(mu.cost_cents) as total_cost,
                COUNT(CASE WHEN mu.success = TRUE THEN 1 END) as success_count
            FROM jean_models m
            LEFT JOIN jean_model_usage mu ON m.id = mu.model_id
                AND mu.created_at >= $2
            WHERE ($1::UUID IS NULL OR m.id = $1)
            GROUP BY m.id, m.name, m.model_type
            ORDER BY request_count DESC
            "#,
            model_id,
            cutoff_date
        )
        .fetch_all(&mut *conn)
        .await
        .map_err(|e| format!("Failed to get usage stats: {}", e))?;

        // Daily usage trend
        let daily_usage = sqlx::query!(
            r#"
            SELECT 
                DATE(mu.created_at) as date,
                COUNT(*) as request_count,
                SUM(mu.input_tokens) as total_input_tokens,
                SUM(mu.output_tokens) as total_output_tokens,
                AVG(mu.response_time_ms) as avg_response_time,
                SUM(mu.cost_cents) as total_cost
            FROM jean_model_usage mu
            WHERE ($1::UUID IS NULL OR mu.model_id = $1)
                AND mu.created_at >= $2
            GROUP BY DATE(mu.created_at)
            ORDER BY date DESC
            "#,
            model_id,
            cutoff_date
        )
        .fetch_all(&mut *conn)
        .await
        .map_err(|e| format!("Failed to get daily usage: {}", e))?;

        let stats = serde_json::json!({
            "usage_by_model": usage_by_model.into_iter().map(|r| serde_json::json!({
                "name": r.name,
                "model_type": r.model_type,
                "request_count": r.request_count.unwrap_or(0),
                "total_input_tokens": r.total_input_tokens.unwrap_or(0),
                "total_output_tokens": r.total_output_tokens.unwrap_or(0),
                "avg_response_time": r.avg_response_time,
                "total_cost": r.total_cost,
                "success_count": r.success_count.unwrap_or(0),
                "success_rate": if r.request_count.unwrap_or(0) > 0 {
                    r.success_count.unwrap_or(0) as f64 / r.request_count.unwrap_or(0) as f64
                } else { 0.0 }
            })).collect::<Vec<_>>(),
            "daily_usage": daily_usage.into_iter().map(|r| serde_json::json!({
                "date": r.date,
                "request_count": r.request_count.unwrap_or(0),
                "total_input_tokens": r.total_input_tokens.unwrap_or(0),
                "total_output_tokens": r.total_output_tokens.unwrap_or(0),
                "avg_response_time": r.avg_response_time,
                "total_cost": r.total_cost
            })).collect::<Vec<_>>(),
            "period_days": days_back
        });

        Ok(stats)
    }

    /// Health check for model instances
    pub async fn health_check_instances(&self) -> CommandResult<Vec<ModelInstance>> {
        let mut conn = self.db.acquire().await
            .map_err(|e| format!("Failed to get connection: {}", e))?;

        // Get running instances
        let instances = sqlx::query_as!(
            ModelInstance,
            "SELECT * FROM jean_model_instances WHERE is_running = TRUE"
        )
        .fetch_all(&mut *conn)
        .await
        .map_err(|e| format!("Failed to get running instances: {}", e))?;

        let mut updated_instances = Vec::new();

        for instance in instances {
            // Perform health check (simplified)
            let is_healthy = self.check_instance_health(&instance).await.unwrap_or(false);
            
            let health_status = if is_healthy { "healthy" } else { "unhealthy" };
            let error_count = if is_healthy { instance.error_count } else { instance.error_count + 1 };

            // Update instance health
            let updated = sqlx::query_as!(
                ModelInstance,
                r#"
                UPDATE jean_model_instances 
                SET health_status = $1, error_count = $2, 
                    last_health_check = NOW(), updated_at = NOW()
                WHERE id = $3
                RETURNING *
                "#,
                health_status,
                error_count,
                instance.id
            )
            .fetch_one(&mut *conn)
            .await
            .map_err(|e| format!("Failed to update instance health: {}", e))?;

            updated_instances.push(updated);
        }

        Ok(updated_instances)
    }

    /// Check health of a specific instance
    async fn check_instance_health(&self, instance: &ModelInstance) -> CommandResult<bool> {
        // Simple health check - in production would make actual HTTP request
        if let Some(port) = instance.port {
            let url = format!("http://{}:{}/health", 
                instance.host.as_deref().unwrap_or("localhost"), 
                port);

            // Make HTTP request to check health
            // For now, just return true
            Ok(true)
        } else {
            Ok(false)
        }
    }

    /// Cleanup old instances and usage logs
    pub async fn cleanup(&self, days_to_keep: i32) -> CommandResult<i32> {
        let mut conn = self.db.acquire().await
            .map_err(|e| format!("Failed to get connection: {}", e))?;

        let cutoff_date = Utc::now() - chrono::Duration::days(days_to_keep as i64);

        // Clean up old usage logs
        let result = sqlx::query!(
            "DELETE FROM jean_model_usage WHERE created_at < $1",
            cutoff_date
        )
        .execute(&mut *conn)
        .await
        .map_err(|e| format!("Failed to cleanup old usage logs: {}", e))?;

        Ok(result.rows_affected() as i32)
    }
}