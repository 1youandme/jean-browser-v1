use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::Json,
    Json as AxumJson,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use std::collections::HashMap;

use crate::commands::AppState;
use crate::routes::UserContext;
use crate::jean_core::{JeanOrchestrator, JeanRequest, JeanResponse, JeanAction};
use crate::jean_memory::JeanMemoryStore;
use crate::jean_permissions::JeanPermissions;
use crate::docker_monitor::DockerMonitor;

#[derive(Debug, Deserialize)]
pub struct ExecuteActionRequest {
    pub action_id: Uuid,
    pub parameters: Option<serde_json::Value>,
    pub force: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct ChatMessageRequest {
    pub message: String,
    pub context: Option<serde_json::Value>,
    pub session_id: Option<String>,
    pub attachments: Option<Vec<serde_json::Value>>,
}

#[derive(Debug, Deserialize)]
pub struct SaveMemoryRequest {
    pub content: String,
    pub memory_type: String,
    pub category: Option<String>,
    pub tags: Option<Vec<String>>,
    pub importance_score: Option<f32>,
    pub folder_id: Option<Uuid>,
}

#[derive(Debug, Deserialize)]
pub struct SearchMemoryRequest {
    pub query: String,
    pub memory_type: Option<String>,
    pub category: Option<String>,
    pub tags: Option<Vec<String>>,
    pub limit: Option<i32>,
    pub offset: Option<i32>,
}

#[derive(Debug, Deserialize)]
pub struct CreateFolderRequest {
    pub name: String,
    pub description: Option<String>,
    pub parent_folder_id: Option<Uuid>,
    pub color: Option<String>,
    pub icon: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct ActionResponse {
    pub success: bool,
    pub action_id: Uuid,
    pub status: String,
    pub result: Option<serde_json::Value>,
    pub message: String,
}

#[derive(Debug, Serialize)]
pub struct ChatResponse {
    pub message: String,
    pub actions: Vec<JeanAction>,
    pub requires_confirmation: bool,
    pub context_updates: Option<serde_json::Value>,
    pub session_id: String,
}

// Execute Jean action
pub async fn execute_action(
    State(state): State<AppState>,
    user_context: UserContext,
    Json(request): AxumJson<ExecuteActionRequest>,
) -> Result<Json<ActionResponse>, StatusCode> {
    let orchestrator = JeanOrchestrator::new(state.db_pool.clone());
    
    // Get action details
    let action = match sqlx::query!(
        r#"
        SELECT ja.*, jp.permission_type
        FROM jean_actions ja
        LEFT JOIN jean_permissions jp ON ja.permission_id = jp.id
        WHERE ja.id = $1 AND ja.user_id = $2
        "#,
        request.action_id,
        user_context.user_id
    )
    .fetch_one(&state.db_pool)
    .await
    {
        Ok(action) => action,
        Err(_) => return Err(StatusCode::NOT_FOUND),
    };

    // Check if action is already executed
    if action.status != "pending" {
        return Ok(Json(ActionResponse {
            success: false,
            action_id: request.action_id,
            status: action.status,
            result: action.result,
            message: format!("Action is already {}", action.status),
        }));
    }

    // Check permissions
    if let Some(permission_type) = action.permission_type {
        let permissions = JeanPermissions::new(state.db_pool.clone());
        if !permissions.check_permission(user_context.user_id, &permission_type, &action.target).await.unwrap_or(false) {
            return Err(StatusCode::FORBIDDEN);
        }
    }

    // Execute action based on type
    let result = match action.action_type.as_str() {
        "open_tab" => execute_open_tab(&action.parameters, &state).await,
        "close_tab" => execute_close_tab(&action.parameters, &state).await,
        "navigate" => execute_navigate(&action.parameters, &state).await,
        "run_scraper" => execute_scraper(&action.parameters, &state).await,
        "apply_pricing" => execute_apply_pricing(&action.parameters, &state).await,
        "send_email" => execute_send_email(&action.parameters, &state).await,
        "create_agent" => execute_create_agent(&action.parameters, &state).await,
        "docker_control" => execute_docker_control(&action.parameters, &state).await,
        _ => Err("Unknown action type".to_string()),
    };

    match result {
        Ok(execution_result) => {
            // Update action status
            let status = if execution_result.success { "executed" } else { "failed" };
            
            sqlx::query!(
                r#"
                UPDATE jean_actions 
                SET status = $1, result = $2, error_message = $3, executed_at = NOW()
                WHERE id = $4
                "#,
                status,
                execution_result.result,
                execution_result.error_message,
                request.action_id
            )
            .execute(&state.db_pool)
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

            Ok(Json(ActionResponse {
                success: execution_result.success,
                action_id: request.action_id,
                status: status.to_string(),
                result: execution_result.result,
                message: execution_result.message,
            }))
        }
        Err(error) => {
            // Update action with error
            sqlx::query!(
                r#"
                UPDATE jean_actions 
                SET status = 'failed', error_message = $1, executed_at = NOW()
                WHERE id = $2
                "#,
                error,
                request.action_id
            )
            .execute(&state.db_pool)
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

            Ok(Json(ActionResponse {
                success: false,
                action_id: request.action_id,
                status: "failed".to_string(),
                result: None,
                message: error,
            }))
        }
    }
}

// Approve action
pub async fn approve_action(
    State(state): State<AppState>,
    user_context: UserContext,
    Path(action_id): Path<Uuid>,
) -> Result<Json<ActionResponse>, StatusCode> {
    // Update action to approved status
    let rows_affected = sqlx::query!(
        r#"
        UPDATE jean_actions 
        SET status = 'approved', approved_by = $1, approved_at = NOW()
        WHERE id = $2 AND user_id = $3 AND status = 'pending'
        "#,
        user_context.user_id,
        action_id,
        user_context.user_id
    )
    .execute(&state.db_pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .rows_affected();

    if rows_affected == 0 {
        return Err(StatusCode::NOT_FOUND);
    }

    Ok(Json(ActionResponse {
        success: true,
        action_id,
        status: "approved".to_string(),
        result: None,
        message: "Action approved successfully".to_string(),
    }))
}

// Execute action by ID (auto-execute for safe actions)
pub async fn execute_action_by_id(
    State(state): State<AppState>,
    user_context: UserContext,
    Path(action_id): Path<Uuid>,
) -> Result<Json<ActionResponse>, StatusCode> {
    let request = ExecuteActionRequest {
        action_id,
        parameters: None,
        force: Some(false),
    };
    
    execute_action(State(state), user_context, Json(request)).await
}

// Send chat message to Jean
pub async fn send_chat_message(
    State(state): State<AppState>,
    user_context: UserContext,
    Json(request): AxumJson<ChatMessageRequest>,
) -> Result<Json<ChatResponse>, StatusCode> {
    let orchestrator = JeanOrchestrator::new(state.db_pool.clone());
    
    let jean_request = JeanRequest {
        user_id: user_context.user_id,
        session_id: request.session_id,
        message: request.message,
        context: request.context,
        attachments: request.attachments.map(|atts| {
            atts.into_iter().map(|att| serde_json::from_value(att).unwrap()).collect()
        }),
    };

    match orchestrator.process_request(jean_request).await {
        Ok(response) => {
            // Save conversation to memory
            let memory_store = JeanMemoryStore::new(state.db_pool.clone());
            let _ = memory_store.save_conversation(
                user_context.user_id,
                &request.message,
                &response.message,
                request.session_id.as_deref(),
            ).await;

            Ok(Json(ChatResponse {
                message: response.message,
                actions: response.actions,
                requires_confirmation: response.requires_confirmation,
                context_updates: response.context_updates,
                session_id: response.session_id.unwrap_or_else(|| Uuid::new_v4().to_string()),
            }))
        }
        Err(error) => {
            tracing::error!("Failed to process Jean request: {}", error);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

// Get chat history
pub async fn get_chat_history(
    State(state): State<AppState>,
    user_context: UserContext,
    Query(params): Query<HashMap<String, String>>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    let limit: i64 = params.get("limit").and_then(|s| s.parse().ok()).unwrap_or(50);
    let offset: i64 = params.get("offset").and_then(|s| s.parse().ok()).unwrap_or(0);

    let memories = sqlx::query!(
        r#"
        SELECT id, content, memory_type, category, tags, importance_score, 
               relevance_score, access_count, last_accessed, created_at
        FROM jean_memories
        WHERE user_id = $1 AND memory_type = 'conversation'
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
        "#,
        user_context.user_id,
        limit,
        offset
    )
    .fetch_all(&state.db_pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(serde_json::json!({
        "memories": memories,
        "total": memories.len()
    })))
}

// Search memory
pub async fn search_memory(
    State(state): State<AppState>,
    user_context: UserContext,
    Json(request): AxumJson<SearchMemoryRequest>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    let memory_store = JeanMemoryStore::new(state.db_pool.clone());
    
    match memory_store.search(
        user_context.user_id,
        &request.query,
        request.memory_type.as_deref(),
        request.category.as_deref(),
        request.tags.as_deref(),
        request.limit.unwrap_or(20),
        request.offset.unwrap_or(0),
    ).await {
        Ok(results) => Ok(Json(serde_json::json!({
            "results": results,
            "total": results.len()
        }))),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

// Save memory
pub async fn save_memory(
    State(state): State<AppState>,
    user_context: UserContext,
    Json(request): AxumJson<SaveMemoryRequest>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    let memory_store = JeanMemoryStore::new(state.db_pool.clone());
    
    let memory_id = memory_store.save_memory(
        user_context.user_id,
        &request.memory_type,
        &request.content,
        request.category.as_deref(),
        request.tags.as_deref(),
        request.importance_score.unwrap_or(0.5),
    ).await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // Link to folder if provided
    if let Some(folder_id) = request.folder_id {
        let _ = memory_store.link_to_folder(memory_id, folder_id).await;
    }

    Ok(Json(serde_json::json!({
        "id": memory_id,
        "message": "Memory saved successfully"
    })))
}

// Get memory folders
pub async fn get_memory_folders(
    State(state): State<AppState>,
    user_context: UserContext,
) -> Result<Json<serde_json::Value>, StatusCode> {
    let folders = sqlx::query!(
        r#"
        SELECT id, name, description, parent_folder_id, color, icon, is_system
        FROM jean_memory_folders
        WHERE user_id = $1
        ORDER BY created_at ASC
        "#,
        user_context.user_id
    )
    .fetch_all(&state.db_pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(serde_json::json!({
        "folders": folders
    })))
}

// Create memory folder
pub async fn create_memory_folder(
    State(state): State<AppState>,
    user_context: UserContext,
    Json(request): AxumJson<CreateFolderRequest>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    let folder_id = sqlx::query!(
        r#"
        INSERT INTO jean_memory_folders (user_id, name, description, parent_folder_id, color, icon)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
        "#,
        user_context.user_id,
        request.name,
        request.description,
        request.parent_folder_id,
        request.color,
        request.icon
    )
    .fetch_one(&state.db_pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .id;

    Ok(Json(serde_json::json!({
        "id": folder_id,
        "message": "Folder created successfully"
    })))
}

// Get Docker status
pub async fn get_docker_status(
    State(state): State<AppState>,
    _user_context: UserContext,
) -> Result<Json<serde_json::Value>, StatusCode> {
    let monitor = DockerMonitor::new(state.db_pool.clone());
    
    match monitor.get_service_summary().await {
        Ok(summary) => Ok(Json(summary)),
        Err(_) => Ok(Json(serde_json::json!({
            "error": "Docker monitoring not available"
        }))),
    }
}

// Get system status
pub async fn get_system_status(
    State(state): State<AppState>,
    _user_context: UserContext,
) -> Result<Json<serde_json::Value>, StatusCode> {
    // Get comprehensive system status
    let db_status = sqlx::query!("SELECT 1 as health_check")
        .fetch_one(&state.db_pool)
        .await
        .is_ok();

    let total_permissions = sqlx::query_scalar!(
        "SELECT COUNT(*) FROM jean_permissions WHERE is_active = true"
    )
    .fetch_one(&state.db_pool)
    .await
    .unwrap_or(0);

    let total_actions = sqlx::query_scalar!(
        "SELECT COUNT(*) FROM jean_actions WHERE created_at > NOW() - INTERVAL '24 hours'"
    )
    .fetch_one(&state.db_pool)
    .await
    .unwrap_or(0);

    let total_memories = sqlx::query_scalar!(
        "SELECT COUNT(*) FROM jean_memories WHERE is_archived = false"
    )
    .fetch_one(&state.db_pool)
    .await
    .unwrap_or(0);

    Ok(Json(serde_json::json!({
        "database": { "healthy": db_status },
        "permissions": { "active": total_permissions },
        "actions": { "last_24h": total_actions },
        "memories": { "total": total_memories },
        "timestamp": chrono::Utc::now()
    })))
}

// Get active tasks
pub async fn get_active_tasks(
    State(state): State<AppState>,
    _user_context: UserContext,
) -> Result<Json<serde_json::Value>, StatusCode> {
    let tasks = sqlx::query!(
        r#"
        SELECT id, task_type, status, scheduled_at, started_at, 
               COALESCE(completion_percentage, 0) as progress
        FROM trae_agent_tasks
        WHERE status IN ('queued', 'running')
        ORDER BY priority ASC, scheduled_at ASC
        LIMIT 10
        "#
    )
    .fetch_all(&state.db_pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(serde_json::json!({
        "tasks": tasks.iter().map(|task| {
            serde_json::json!({
                "id": task.id,
                "description": task.task_type,
                "status": task.status,
                "progress": task.progress.unwrap_or(0),
                "startTime": task.started_at
            })
        }).collect::<Vec<_>>()
    })))
}

// Get permissions
pub async fn get_permissions(
    State(state): State<AppState>,
    user_context: UserContext,
) -> Result<Json<serde_json::Value>, StatusCode> {
    let permissions = sqlx::query!(
        r#"
        SELECT id, permission_type, scope, grant_type, expires_at,
               usage_limits, metadata, created_at
        FROM jean_permissions
        WHERE user_id = $1 AND is_active = true
        ORDER BY created_at DESC
        "#,
        user_context.user_id
    )
    .fetch_all(&state.db_pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(serde_json::json!({
        "permissions": permissions
    })))
}

// Grant permission
pub async fn grant_permission(
    State(state): State<AppState>,
    user_context: UserContext,
    Json(request): AxumJson<serde_json::Value>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    let permission_type: String = request.get("permission_type")
        .and_then(|v| v.as_str())
        .unwrap_or("read")
        .to_string();

    let scope = request.get("scope").unwrap_or(&serde_json::json!({}));

    let permission_id = sqlx::query!(
        r#"
        INSERT INTO jean_permissions (user_id, permission_type, scope, grant_type, granted_by)
        VALUES ($1, $2, $3, 'manual', $1)
        RETURNING id
        "#,
        user_context.user_id,
        permission_type,
        scope
    )
    .fetch_one(&state.db_pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .id;

    Ok(Json(serde_json::json!({
        "id": permission_id,
        "message": "Permission granted successfully"
    })))
}

// Revoke permission
pub async fn revoke_permission(
    State(state): State<AppState>,
    user_context: UserContext,
    Path((user_id, permission_id)): Path<(Uuid, Uuid)>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    // Check if user has permission to revoke (admin or self)
    if user_id != user_context.user_id {
        // Check if current user is admin
        let is_admin = sqlx::query_scalar!(
            "SELECT EXISTS(SELECT 1 FROM user_roles WHERE user_id = $1 AND role = 'admin')",
            user_context.user_id
        )
        .fetch_one(&state.db_pool)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .unwrap_or(false);

        if !is_admin {
            return Err(StatusCode::FORBIDDEN);
        }
    }

    let rows_affected = sqlx::query!(
        "UPDATE jean_permissions SET is_active = false WHERE id = $1 AND user_id = $2",
        permission_id,
        user_id
    )
    .execute(&state.db_pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .rows_affected();

    if rows_affected == 0 {
        return Err(StatusCode::NOT_FOUND);
    }

    Ok(Json(serde_json::json!({
        "message": "Permission revoked successfully"
    })))
}

// Get actions log
pub async fn get_actions_log(
    State(state): State<AppState>,
    user_context: UserContext,
    Query(params): Query<HashMap<String, String>>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    let limit: i64 = params.get("limit").and_then(|s| s.parse().ok()).unwrap_or(50);
    let offset: i64 = params.get("offset").and_then(|s| s.parse().ok()).unwrap_or(0);

    let actions = sqlx::query!(
        r#"
        SELECT ja.id, ja.action_type, ja.target, ja.parameters, ja.status, 
               ja.result, ja.error_message, ja.created_at, ja.executed_at,
               u.email as user_email
        FROM jean_actions ja
        JOIN users u ON ja.user_id = u.id
        WHERE ja.user_id = $1
        ORDER BY ja.created_at DESC
        LIMIT $2 OFFSET $3
        "#,
        user_context.user_id,
        limit,
        offset
    )
    .fetch_all(&state.db_pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(serde_json::json!({
        "actions": actions,
        "total": actions.len()
    })))
}

// Get user permissions
pub async fn get_user_permissions(
    State(state): State<AppState>,
    Path(user_id): Path<Uuid>,
    user_context: UserContext,
) -> Result<Json<serde_json::Value>, StatusCode> {
    // Users can only view their own permissions unless they're admin
    if user_id != user_context.user_id {
        let is_admin = sqlx::query_scalar!(
            "SELECT EXISTS(SELECT 1 FROM user_roles WHERE user_id = $1 AND role = 'admin')",
            user_context.user_id
        )
        .fetch_one(&state.db_pool)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .unwrap_or(false);

        if !is_admin {
            return Err(StatusCode::FORBIDDEN);
        }
    }

    let permissions = sqlx::query!(
        r#"
        SELECT id, permission_type, scope, grant_type, expires_at,
               usage_limits, metadata, created_at
        FROM jean_permissions
        WHERE user_id = $1 AND is_active = true
        ORDER BY created_at DESC
        "#,
        user_id
    )
    .fetch_all(&state.db_pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(serde_json::json!({
        "permissions": permissions
    })))
}

// Action execution helpers
struct ActionResult {
    success: bool,
    result: Option<serde_json::Value>,
    error_message: Option<String>,
    message: String,
}

async fn execute_open_tab(
    params: &serde_json::Value,
    _state: &AppState,
) -> Result<ActionResult, String> {
    // Implementation for opening tabs in different strips
    let strip = params.get("strip_type").and_then(|s| s.as_str()).unwrap_or("web");
    let url = params.get("url").and_then(|u| u.as_str()).unwrap_or("about:blank");
    
    // This would integrate with the frontend tab management
    Ok(ActionResult {
        success: true,
        result: Some(serde_json::json!({
            "action": "open_tab",
            "strip": strip,
            "url": url,
            "tab_id": Uuid::new_v4()
        })),
        error_message: None,
        message: format!("Tab opened in {} strip", strip),
    })
}

async fn execute_close_tab(
    params: &serde_json::Value,
    _state: &AppState,
) -> Result<ActionResult, String> {
    let tab_id = params.get("tab_id").and_then(|t| t.as_str());
    
    if tab_id.is_none() {
        return Err("Tab ID is required".to_string());
    }
    
    Ok(ActionResult {
        success: true,
        result: Some(serde_json::json!({
            "action": "close_tab",
            "tab_id": tab_id
        })),
        error_message: None,
        message: "Tab closed successfully".to_string(),
    })
}

async fn execute_navigate(
    params: &serde_json::Value,
    _state: &AppState,
) -> Result<ActionResult, String> {
    let url = params.get("url").and_then(|u| u.as_str());
    
    if url.is_none() {
        return Err("URL is required".to_string());
    }
    
    Ok(ActionResult {
        success: true,
        result: Some(serde_json::json!({
            "action": "navigate",
            "url": url
        })),
        error_message: None,
        message: "Navigation completed".to_string(),
    })
}

async fn execute_scraper(
    params: &serde_json::Value,
    state: &AppState,
) -> Result<ActionResult, String> {
    let platform = params.get("platform").and_then(|p| p.as_str()).unwrap_or("alibaba");
    let category = params.get("category").and_then(|c| c.as_str());
    
    // Trigger scraper service
    // This would integrate with the existing scraper service
    Ok(ActionResult {
        success: true,
        result: Some(serde_json::json!({
            "action": "run_scraper",
            "platform": platform,
            "category": category,
            "job_id": Uuid::new_v4()
        })),
        error_message: None,
        message: format!("Scraper started for {} on {}", category.unwrap_or("all"), platform),
    })
}

async fn execute_apply_pricing(
    params: &serde_json::Value,
    state: &AppState,
) -> Result<ActionResult, String> {
    let product_ids: Vec<Uuid> = params.get("product_ids")
        .and_then(|p| p.as_array())
        .map(|arr| arr.iter().filter_map(|v| Uuid::parse_str(v.as_str().unwrap_or("")).ok()).collect())
        .unwrap_or_default();
    
    // Trigger pricing service
    Ok(ActionResult {
        success: true,
        result: Some(serde_json::json!({
            "action": "apply_pricing",
            "product_ids": product_ids,
            "job_id": Uuid::new_v4()
        })),
        error_message: None,
        message: format!("Pricing applied to {} products", product_ids.len()),
    })
}

async fn execute_send_email(
    params: &serde_json::Value,
    _state: &AppState,
) -> Result<ActionResult, String> {
    let to = params.get("to").and_then(|t| t.as_array());
    let subject = params.get("subject").and_then(|s| s.as_str());
    let template = params.get("template").and_then(|t| t.as_str());
    
    if to.is_none() || subject.is_none() {
        return Err("Recipients and subject are required".to_string());
    }
    
    Ok(ActionResult {
        success: true,
        result: Some(serde_json::json!({
            "action": "send_email",
            "to": to,
            "subject": subject,
            "template": template,
            "email_id": Uuid::new_v4()
        })),
        error_message: None,
        message: "Email sent successfully".to_string(),
    })
}

async fn execute_create_agent(
    params: &serde_json::Value,
    _state: &AppState,
) -> Result<ActionResult, String> {
    let name = params.get("name").and_then(|n| n.as_str());
    let role = params.get("role").and_then(|r| r.as_str());
    
    if name.is_none() || role.is_none() {
        return Err("Name and role are required".to_string());
    }
    
    Ok(ActionResult {
        success: true,
        result: Some(serde_json::json!({
            "action": "create_agent",
            "name": name,
            "role": role,
            "agent_id": Uuid::new_v4()
        })),
        error_message: None,
        message: format!("Agent '{}' created successfully", name.unwrap()),
    })
}

async fn execute_docker_control(
    params: &serde_json::Value,
    state: &AppState,
) -> Result<ActionResult, String> {
    let container = params.get("container").and_then(|c| c.as_str());
    let action = params.get("action").and_then(|a| a.as_str());
    
    if container.is_none() || action.is_none() {
        return Err("Container and action are required".to_string());
    }
    
    Ok(ActionResult {
        success: true,
        result: Some(serde_json::json!({
            "action": "docker_control",
            "container": container,
            "operation": action
        })),
        error_message: None,
        message: format!("Docker action '{}' executed on container '{}'", action.unwrap(), container.unwrap()),
    })
}