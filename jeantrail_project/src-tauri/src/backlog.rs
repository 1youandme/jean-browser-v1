// Backlog / Ideas Management Module
use axum::{Json, extract::{Path, Query, State}};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use uuid::Uuid;
use chrono::{DateTime, Utc};
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct BacklogItem {
    pub id: Uuid,
    pub question_id: Option<String>,
    pub title: String,
    pub summary: Option<String>,
    pub details: Option<String>,
    pub technical_details: Option<String>,
    pub category: Option<String>,
    pub priority: Priority,
    pub status: Status,
    pub tags: Vec<String>,
    pub estimated_hours: Option<i32>,
    pub assignee_id: Option<Uuid>,
    pub creator_id: Uuid,
    pub source: String,
    pub metadata: Value,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "varchar")]
pub enum Priority {
    #[serde(rename = "low")]
    Low,
    #[serde(rename = "medium")]
    Medium,
    #[serde(rename = "high")]
    High,
    #[serde(rename = "critical")]
    Critical,
}

#[derive(Debug, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "varchar")]
pub enum Status {
    #[serde(rename = "idea")]
    Idea,
    #[serde(rename = "planned")]
    Planned,
    #[serde(rename = "in_progress")]
    InProgress,
    #[serde(rename = "completed")]
    Completed,
    #[serde(rename = "archived")]
    Archived,
}

#[derive(Debug, Deserialize)]
pub struct CreateBacklogItemRequest {
    pub question_id: Option<String>,
    pub title: String,
    pub summary: Option<String>,
    pub details: Option<String>,
    pub technical_details: Option<String>,
    pub category: Option<String>,
    pub priority: Priority,
    pub tags: Vec<String>,
    pub estimated_hours: Option<i32>,
    pub assignee_id: Option<Uuid>,
    pub source: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateBacklogItemRequest {
    pub title: Option<String>,
    pub summary: Option<String>,
    pub details: Option<String>,
    pub technical_details: Option<String>,
    pub category: Option<String>,
    pub priority: Option<Priority>,
    pub status: Option<Status>,
    pub tags: Option<Vec<String>>,
    pub estimated_hours: Option<i32>,
    pub assignee_id: Option<Uuid>,
    pub metadata: Option<Value>,
}

#[derive(Debug, Deserialize)]
pub struct ListBacklogItemsQuery {
    pub status: Option<Status>,
    pub priority: Option<Priority>,
    pub category: Option<String>,
    pub assignee_id: Option<Uuid>,
    pub creator_id: Option<Uuid>,
    pub tags: Option<Vec<String>>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

pub async fn list_backlog_items(
    Query(params): Query<ListBacklogItemsQuery>,
) -> Result<Json<Vec<BacklogItem>>, axum::http::StatusCode> {
    // Query backlog items with filters
    let mock_items = vec![
        BacklogItem {
            id: Uuid::new_v4(),
            question_id: Some("Q001".to_string()),
            title: "Implement Auto-API Extractor".to_string(),
            summary: Some("Build browser extension to capture API calls".to_string()),
            details: Some("Create Chrome extension that monitors XHR/fetch requests and generates OpenAPI specs".to_string()),
            technical_details: Some("Use content scripts, background script, Rust backend for processing".to_string()),
            category: Some("Developer Tools".to_string()),
            priority: Priority::High,
            status: Status::InProgress,
            tags: vec!["api".to_string(), "automation".to_string(), "chrome-extension".to_string()],
            estimated_hours: Some(40),
            assignee_id: Some(Uuid::new_v4()),
            creator_id: Uuid::new_v4(),
            source: "manual".to_string(),
            metadata: serde_json::json!({"complexity": "high"}),
            created_at: Utc::now(),
            updated_at: Utc::now(),
        }
    ];

    Ok(Json(mock_items))
}

pub async fn get_backlog_item(
    Path(id): Path<Uuid>,
) -> Result<Json<BacklogItem>, axum::http::StatusCode> {
    // Fetch specific backlog item
    Err(axum::http::StatusCode::NOT_FOUND)
}

pub async fn create_backlog_item(
    Json(request): Json<CreateBacklogItemRequest>,
) -> Result<Json<BacklogItem>, axum::http::StatusCode> {
    let new_item = BacklogItem {
        id: Uuid::new_v4(),
        question_id: request.question_id,
        title: request.title,
        summary: request.summary,
        details: request.details,
        technical_details: request.technical_details,
        category: request.category,
        priority: request.priority,
        status: Status::Idea,
        tags: request.tags,
        estimated_hours: request.estimated_hours,
        assignee_id: request.assignee_id,
        creator_id: Uuid::new_v4(), // Get from auth context
        source: request.source.unwrap_or_else(|| "manual".to_string()),
        metadata: serde_json::json!({}),
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };

    // Save to database
    Ok(Json(new_item))
}

pub async fn update_backlog_item(
    Path(id): Path<Uuid>,
    Json(request): Json<UpdateBacklogItemRequest>,
) -> Result<Json<BacklogItem>, axum::http::StatusCode> {
    // Update backlog item in database
    Err(axum::http::StatusCode::NOT_FOUND)
}

pub async fn delete_backlog_item(
    Path(id): Path<Uuid>,
) -> Result<(), axum::http::StatusCode> {
    // Delete backlog item from database
    Ok(())
}

pub async fn import_csv_backlog(
    mut multipart: Multipart,
) -> Result<Json<Value>, axum::http::StatusCode> {
    use axum::body::Bytes;
    use std::io::Write;
    use tokio::fs::File;
    use tokio::io::AsyncWriteExt;

    let mut file_content = String::new();
    
    while let Some(field) = multipart.next_field().await.map_err(|_| axum::http::StatusCode::BAD_REQUEST)? {
        let name = field.name().unwrap_or("file");
        
        if name == "csv_file" {
            let data = field.bytes().await.map_err(|_| axum::http::StatusCode::BAD_REQUEST)?;
            file_content = String::from_utf8_lossy(&data).to_string();
        }
    }

    // Parse CSV and create backlog items
    let parsed_items = parse_csv_to_backlog_items(&file_content).await;
    
    Ok(Json(serde_json::json!({
        "imported_count": parsed_items.len(),
        "items": parsed_items
    })))
}

async fn parse_csv_to_backlog_items(csv_content: &str) -> Vec<Value> {
    // Simple CSV parsing - in production use proper CSV library
    let lines: Vec<&str> = csv_content.lines().collect();
    let mut items = Vec::new();
    
    for (index, line) in lines.iter().enumerate() {
        if index == 0 { continue; } // Skip header
        
        let fields: Vec<&str> = line.split(',').collect();
        if fields.len() >= 3 {
            items.push(serde_json::json!({
                "question_id": fields.get(0).unwrap_or(&""),
                "title": fields.get(1).unwrap_or(&""),
                "summary": fields.get(2).unwrap_or(&""),
                "priority": "medium",
                "status": "idea",
                "source": "csv_import"
            }));
        }
    }
    
    items
}

pub async fn export_csv_backlog(
    Query(params): Query<ListBacklogItemsQuery>,
) -> Result<String, axum::http::StatusCode> {
    // Generate CSV export of backlog items
    let mut csv_content = "question_id,title,summary,priority,status,category,tags,created_at\n".to_string();
    
    // Add actual data from database
    csv_content.push_str("Q001,Implement Auto-API,Build browser extension,high,in_progress,Developer Tools,&quot;api,automation&quot;,2024-01-01\n");
    
    Ok(csv_content)
}

pub async fn get_backlog_statistics() -> Result<Json<Value>, axum::http::StatusCode> {
    let stats = serde_json::json!({
        "total_items": 156,
        "by_status": {
            "idea": 89,
            "planned": 34,
            "in_progress": 23,
            "completed": 8,
            "archived": 2
        },
        "by_priority": {
            "low": 45,
            "medium": 67,
            "high": 38,
            "critical": 6
        },
        "by_category": {
            "Developer Tools": 45,
            "AI Features": 38,
            "UI/UX": 28,
            "Backend": 23,
            "Security": 12,
            "Other": 10
        },
        "total_estimated_hours": 2840,
        "completed_hours": 342
    });
    
    Ok(Json(stats))
}