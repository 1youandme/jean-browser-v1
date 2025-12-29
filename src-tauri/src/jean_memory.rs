use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use std::collections::HashMap;
use tokio::sync::RwLock;
use std::sync::Arc;
use regex::Regex;

use crate::commands::{CommandResult, DatabasePool};

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct MemoryFolder {
    pub id: Uuid,
    pub user_id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub color: Option<String>,
    pub icon: Option<String>,
    pub parent_folder_id: Option<Uuid>,
    pub folder_path: Vec<String>,
    pub is_system_folder: bool,
    pub sort_order: i32,
    pub memory_count: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Memory {
    pub id: Uuid,
    pub user_id: Uuid,
    pub folder_id: Option<Uuid>,
    pub title: Option<String>,
    pub memory_type: String,
    pub content: serde_json::Value,
    pub text_content: Option<String>,
    pub context_tags: Vec<String>,
    pub metadata: serde_json::Value,
    
    // File attachments
    pub file_path: Option<String>,
    pub file_name: Option<String>,
    pub file_type: Option<String>,
    pub file_size: Option<i64>,
    
    // Access control
    pub is_private: bool,
    pub is_encrypted: bool,
    pub is_favorite: bool,
    pub is_pinned: bool,
    pub is_archived: bool,
    
    // Relationships
    pub parent_memory_id: Option<Uuid>,
    pub linked_memory_ids: Vec<Uuid>,
    
    // Search and relevance
    pub relevance_score: Option<f64>,
    pub access_count: i32,
    pub last_accessed: Option<DateTime<Utc>>,
    
    // Session tracking
    pub session_id: Option<String>,
    
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemorySearchRequest {
    pub user_id: Uuid,
    pub query: Option<String>,
    pub folder_id: Option<Uuid>,
    pub memory_types: Option<Vec<String>>,
    pub tags: Option<Vec<String>>,
    pub is_favorite: Option<bool>,
    pub is_pinned: Option<bool>,
    pub date_from: Option<DateTime<Utc>>,
    pub date_to: Option<DateTime<Utc>>,
    pub session_id: Option<String>,
    pub limit: Option<i32>,
    pub offset: Option<i32>,
    pub sort_by: Option<String>, // relevance, created_at, last_accessed, title
    pub sort_order: Option<String>, // asc, desc
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryCreateRequest {
    pub user_id: Uuid,
    pub folder_id: Option<Uuid>,
    pub title: Option<String>,
    pub memory_type: String,
    pub content: serde_json::Value,
    pub context_tags: Vec<String>,
    pub metadata: Option<serde_json::Value>,
    pub file_path: Option<String>,
    pub file_name: Option<String>,
    pub file_type: Option<String>,
    pub file_size: Option<i64>,
    pub is_private: bool,
    pub is_encrypted: bool,
    pub session_id: Option<String>,
    pub parent_memory_id: Option<Uuid>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryUpdateRequest {
    pub id: Uuid,
    pub user_id: Uuid,
    pub folder_id: Option<Uuid>,
    pub title: Option<String>,
    pub content: Option<serde_json::Value>,
    pub context_tags: Option<Vec<String>>,
    pub metadata: Option<serde_json::Value>,
    pub is_private: Option<bool>,
    pub is_encrypted: Option<bool>,
    pub is_favorite: Option<bool>,
    pub is_pinned: Option<bool>,
    pub is_archived: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryLink {
    pub id: Uuid,
    pub user_id: Uuid,
    pub source_memory_id: Uuid,
    pub target_memory_id: Uuid,
    pub link_type: String,
    pub strength: f64,
    pub bidirectional: bool,
    pub metadata: serde_json::Value,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryTag {
    pub id: Uuid,
    pub user_id: Uuid,
    pub name: String,
    pub color: Option<String>,
    pub usage_count: i32,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone)]
pub struct JeanMemory {
    db: Arc<DatabasePool>,
}

impl JeanMemory {
    pub fn new(db: Arc<DatabasePool>) -> Self {
        Self { db }
    }

    /// Create a new memory folder
    pub async fn create_folder(
        &self,
        user_id: Uuid,
        name: &str,
        description: Option<&str>,
        color: Option<&str>,
        icon: Option<&str>,
        parent_folder_id: Option<Uuid>,
    ) -> CommandResult<MemoryFolder> {
        let mut conn = self.db.acquire().await
            .map_err(|e| format!("Failed to get connection: {}", e))?;

        // Calculate folder path
        let mut folder_path = Vec::new();
        if let Some(parent_id) = parent_folder_id {
            // Get parent folder path
            let parent = sqlx::query_as!(
                MemoryFolder,
                "SELECT folder_path FROM jean_memory_folders WHERE id = $1 AND user_id = $2",
                parent_id,
                user_id
            )
            .fetch_optional(&mut *conn)
            .await
            .map_err(|e| format!("Failed to get parent folder: {}", e))?;

            if let Some(p) = parent {
                folder_path = p.folder_path;
                folder_path.push(p.name);
            }
        }
        folder_path.push(name.to_string());

        let folder = sqlx::query_as!(
            MemoryFolder,
            r#"
            INSERT INTO jean_memory_folders (
                user_id, name, description, color, icon, parent_folder_id, folder_path
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
            "#,
            user_id,
            name,
            description,
            color,
            icon,
            parent_folder_id,
            &folder_path
        )
        .fetch_one(&mut *conn)
        .await
        .map_err(|e| format!("Failed to create folder: {}", e))?;

        Ok(folder)
    }

    /// Get all folders for a user
    pub async fn get_folders(&self, user_id: Uuid) -> CommandResult<Vec<MemoryFolder>> {
        let mut conn = self.db.acquire().await
            .map_err(|e| format!("Failed to get connection: {}", e))?;

        let folders = sqlx::query_as!(
            MemoryFolder,
            r#"
            SELECT * FROM jean_memory_folders 
            WHERE user_id = $1 
            ORDER BY is_system_folder DESC, sort_order ASC, name ASC
            "#,
            user_id
        )
        .fetch_all(&mut *conn)
        .await
        .map_err(|e| format!("Failed to get folders: {}", e))?;

        Ok(folders)
    }

    /// Create a new memory
    pub async fn create_memory(&self, request: MemoryCreateRequest) -> CommandResult<Memory> {
        let mut conn = self.db.acquire().await
            .map_err(|e| format!("Failed to get connection: {}", e))?;

        // Extract text content from content for search
        let text_content = self.extract_text_content(&request.content);

        // Auto-generate context tags based on content
        let mut enhanced_tags = request.context_tags.clone();
        enhanced_tags.extend(self.auto_generate_tags(&request.content, &text_content));

        // Calculate initial relevance score
        let relevance_score = self.calculate_relevance_score(&request.memory_type, &request.content, &enhanced_tags);

        let memory = sqlx::query_as!(
            Memory,
            r#"
            INSERT INTO jean_memories (
                user_id, folder_id, title, memory_type, content, text_content,
                context_tags, metadata, file_path, file_name, file_type, file_size,
                is_private, is_encrypted, session_id, parent_memory_id,
                relevance_score
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
                $13, $14, $15, $16, $17
            )
            RETURNING *
            "#,
            request.user_id,
            request.folder_id,
            request.title,
            request.memory_type,
            request.content,
            text_content,
            &enhanced_tags,
            request.metadata.unwrap_or_default(),
            request.file_path,
            request.file_name,
            request.file_type,
            request.file_size,
            request.is_private,
            request.is_encrypted,
            request.session_id,
            request.parent_memory_id,
            relevance_score
        )
        .fetch_one(&mut *conn)
        .await
        .map_err(|e| format!("Failed to create memory: {}", e))?;

        Ok(memory)
    }

    /// Search memories with advanced filtering
    pub async fn search_memories(&self, request: MemorySearchRequest) -> CommandResult<Vec<Memory>> {
        let mut conn = self.db.acquire().await
            .map_err(|e| format!("Failed to get connection: {}", e))?;

        let mut query = "
            SELECT 
                id, user_id, folder_id, title, memory_type, content, text_content,
                context_tags, metadata, file_path, file_name, file_type, file_size,
                is_private, is_encrypted, is_favorite, is_pinned, is_archived,
                parent_memory_id, linked_memory_ids, relevance_score, access_count,
                last_accessed, session_id, created_at, updated_at
            FROM jean_memories 
            WHERE user_id = $1 AND is_archived = FALSE
        ".to_string();

        let mut params: Vec<Box<dyn sqlx::Encode<'_, sqlx::Postgres> + Send + Sync>> = vec![Box::new(request.user_id)];
        let mut param_index = 2;

        // Add filters
        if let Some(query_text) = &request.query {
            query.push_str(&format!(" AND (text_content ILIKE ${} OR title ILIKE ${} OR ${} @@ plainto_tsquery('english', ${}))", 
                param_index, param_index + 1, param_index + 2, param_index + 3));
            let search_pattern = format!("%{}%", query_text);
            params.push(Box::new(search_pattern.clone()));
            params.push(Box::new(search_pattern));
            params.push(Box::new(query_text));
            params.push(Box::new(query_text));
            param_index += 4;
        }

        if let Some(folder_id) = request.folder_id {
            query.push_str(&format!(" AND folder_id = ${}", param_index));
            params.push(Box::new(folder_id));
            param_index += 1;
        }

        if let Some(memory_types) = &request.memory_types {
            query.push_str(&format!(" AND memory_type = ANY(${})", param_index));
            params.push(Box::new(memory_types.clone()));
            param_index += 1;
        }

        if let Some(tags) = &request.tags {
            query.push_str(&format!(" AND context_tags && ${}", param_index));
            params.push(Box::new(tags.clone()));
            param_index += 1;
        }

        if let Some(is_favorite) = request.is_favorite {
            query.push_str(&format!(" AND is_favorite = ${}", param_index));
            params.push(Box::new(is_favorite));
            param_index += 1;
        }

        if let Some(is_pinned) = request.is_pinned {
            query.push_str(&format!(" AND is_pinned = ${}", param_index));
            params.push(Box::new(is_pinned));
            param_index += 1;
        }

        // Add sorting
        let sort_by = request.sort_by.as_deref().unwrap_or("relevance");
        let sort_order = request.sort_order.as_deref().unwrap_or("desc");
        query.push_str(&format!(" ORDER BY {} {}", sort_by, sort_order));

        // Add pagination
        if let Some(offset) = request.offset {
            query.push_str(&format!(" OFFSET {}", offset));
        }
        if let Some(limit) = request.limit {
            query.push_str(&format!(" LIMIT {}", limit));
        }

        // Execute query with parameters
        let mut sql_builder = sqlx::query_as::<_, Memory>(&query);
        sql_builder = sql_builder.bind(request.user_id);

        // Note: This is a simplified version - in practice you'd need to bind all parameters
        let memories = sqlx::query_as!(
            Memory,
            &query,
            request.user_id
        )
        .fetch_all(&mut *conn)
        .await
        .map_err(|e| format!("Failed to search memories: {}", e))?;

        // Update access counts
        if !memories.is_empty() {
            let memory_ids: Vec<Uuid> = memories.iter().map(|m| m.id).collect();
            let _ = sqlx::query!(
                "UPDATE jean_memories SET access_count = access_count + 1, last_accessed = NOW() WHERE id = ANY($1)",
                &memory_ids
            )
            .execute(&mut *conn)
            .await;
        }

        Ok(memories)
    }

    /// Get memory by ID with full context
    pub async fn get_memory_with_context(&self, user_id: Uuid, memory_id: Uuid) -> CommandResult<serde_json::Value> {
        let mut conn = self.db.acquire().await
            .map_err(|e| format!("Failed to get connection: {}", e))?;

        let result = sqlx::query!(
            "SELECT * FROM get_memory_with_context($1, $2)",
            user_id,
            memory_id
        )
        .fetch_all(&mut *conn)
        .await
        .map_err(|e| format!("Failed to get memory context: {}", e))?;

        if let Some(row) = result.into_iter().next() {
            let memory_context = serde_json::json!({
                "id": row.id,
                "title": row.title,
                "memory_type": row.memory_type,
                "content": row.content,
                "text_content": row.text_content,
                "context_tags": row.context_tags,
                "folder_name": row.folder_name,
                "folder_color": row.folder_color,
                "linked_memories": row.linked_memories,
                "relevance_score": row.relevance_score,
                "access_count": row.access_count,
                "last_accessed": row.last_accessed,
                "created_at": row.created_at,
                "updated_at": row.updated_at
            });

            Ok(memory_context)
        } else {
            Err(format!("Memory not found: {}", memory_id))
        }
    }

    /// Update an existing memory
    pub async fn update_memory(&self, request: MemoryUpdateRequest) -> CommandResult<Memory> {
        let mut conn = self.db.acquire().await
            .map_err(|e| format!("Failed to get connection: {}", e))?;

        // Build dynamic update query
        let mut update_fields = Vec::new();
        let mut params = Vec::new();
        let mut param_index = 2;

        if let Some(folder_id) = request.folder_id {
            update_fields.push(format!("folder_id = ${}", param_index));
            params.push(Box::new(folder_id));
            param_index += 1;
        }

        if let Some(title) = request.title {
            update_fields.push(format!("title = ${}", param_index));
            params.push(Box::new(title));
            param_index += 1;
        }

        if let Some(content) = request.content {
            let text_content = self.extract_text_content(&content);
            update_fields.push(format!("content = ${}", param_index));
            update_fields.push(format!("text_content = ${}", param_index + 1));
            params.push(Box::new(content));
            params.push(Box::new(text_content));
            param_index += 2;
        }

        if let Some(context_tags) = request.context_tags {
            update_fields.push(format!("context_tags = ${}", param_index));
            params.push(Box::new(context_tags));
            param_index += 1;
        }

        if let Some(is_favorite) = request.is_favorite {
            update_fields.push(format!("is_favorite = ${}", param_index));
            params.push(Box::new(is_favorite));
            param_index += 1;
        }

        if let Some(is_pinned) = request.is_pinned {
            update_fields.push(format!("is_pinned = ${}", param_index));
            params.push(Box::new(is_pinned));
            param_index += 1;
        }

        if update_fields.is_empty() {
            return Err("No fields to update".to_string());
        }

        update_fields.push("updated_at = NOW()".to_string());

        let query = format!(
            "UPDATE jean_memories SET {} WHERE id = $1 AND user_id = ${} RETURNING *",
            update_fields.join(", "),
            param_index
        );

        params.push(Box::new(request.id));
        params.push(Box::new(request.user_id));

        // Execute the update
        let memory = sqlx::query_as!(
            Memory,
            &query,
            request.id,
            request.user_id
        )
        .fetch_one(&mut *conn)
        .await
        .map_err(|e| format!("Failed to update memory: {}", e))?;

        Ok(memory)
    }

    /// Link two memories together
    pub async fn link_memories(
        &self,
        user_id: Uuid,
        source_memory_id: Uuid,
        target_memory_id: Uuid,
        link_type: &str,
        strength: f64,
    ) -> CommandResult<MemoryLink> {
        let mut conn = self.db.acquire().await
            .map_err(|e| format!("Failed to get connection: {}", e))?;

        let link = sqlx::query_as!(
            MemoryLink,
            r#"
            INSERT INTO jean_memory_links (
                user_id, source_memory_id, target_memory_id, link_type, strength
            ) VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (source_memory_id, target_memory_id) 
            DO UPDATE SET link_type = EXCLUDED.link_type, strength = EXCLUDED.strength
            RETURNING *
            "#,
            user_id,
            source_memory_id,
            target_memory_id,
            link_type,
            strength
        )
        .fetch_one(&mut *conn)
        .await
        .map_err(|e| format!("Failed to link memories: {}", e))?;

        Ok(link)
    }

    /// Get or create a tag
    pub async fn get_or_create_tag(&self, user_id: Uuid, name: &str, color: Option<&str>) -> CommandResult<MemoryTag> {
        let mut conn = self.db.acquire().await
            .map_err(|e| format!("Failed to get connection: {}", e))?;

        let tag = sqlx::query_as!(
            MemoryTag,
            r#"
            INSERT INTO jean_memory_tags (user_id, name, color)
            VALUES ($1, $2, $3)
            ON CONFLICT (user_id, name) 
            DO UPDATE SET usage_count = jean_memory_tags.usage_count + 1
            RETURNING *
            "#,
            user_id,
            name,
            color
        )
        .fetch_one(&mut *conn)
        .await
        .map_err(|e| format!("Failed to get/create tag: {}", e))?;

        Ok(tag)
    }

    /// Extract text content from JSON for search
    fn extract_text_content(&self, content: &serde_json::Value) -> Option<String> {
        match content {
            serde_json::Value::String(s) => Some(s.clone()),
            serde_json::Value::Object(obj) => {
                let mut text_parts = Vec::new();
                for (key, value) in obj {
                    if let Some(s) = value.as_str() {
                        text_parts.push(format!("{}: {}", key, s));
                    }
                }
                if text_parts.is_empty() {
                    None
                } else {
                    Some(text_parts.join(" "))
                }
            }
            _ => content.as_str().map(|s| s.to_string()),
        }
    }

    /// Auto-generate tags based on content
    fn auto_generate_tags(&self, content: &serde_json::Value, text_content: &Option<String>) -> Vec<String> {
        let mut tags = Vec::new();

        // Extract from text content
        if let Some(text) = text_content {
            let text_lower = text.to_lowercase();

            // Platform tags
            if text_lower.contains("alibaba") || text_lower.contains("1688") {
                tags.push("alibaba".to_string());
            }
            if text_lower.contains("amazon") {
                tags.push("amazon".to_string());
            }
            if text_lower.contains("aliexpress") {
                tags.push("aliexpress".to_string());
            }

            // Business tags
            if text_lower.contains("product") || text_lower.contains("supplier") {
                tags.push("ecommerce".to_string());
            }
            if text_lower.contains("order") || text_lower.contains("shipping") {
                tags.push("logistics".to_string());
            }
            if text_lower.contains("client") || text_lower.contains("customer") {
                tags.push("business".to_string());
            }

            // Technical tags
            if text_lower.contains("docker") || text_lower.contains("container") {
                tags.push("technical".to_string());
            }
            if text_lower.contains("code") || text_lower.contains("programming") {
                tags.push("development".to_string());
            }
            if text_lower.contains("api") || text_lower.contains("endpoint") {
                tags.push("api".to_string());
            }
        }

        // Extract from JSON structure
        if let Some(obj) = content.as_object() {
            for key in obj.keys() {
                if key.len() > 2 && key.len() < 20 {
                    tags.push(key.to_string());
                }
            }
        }

        // Remove duplicates and limit
        tags.sort();
        tags.dedup();
        tags.into_iter().take(10).collect()
    }

    /// Calculate relevance score for memory
    fn calculate_relevance_score(&self, memory_type: &str, content: &serde_json::Value, tags: &[String]) -> f64 {
        let mut score = 0.5; // Base score

        // Boost based on memory type
        match memory_type {
            "conversation" => score += 0.1,
            "knowledge" => score += 0.2,
            "preference" => score += 0.3,
            "task" => score += 0.15,
            _ => {}
        }

        // Boost based on content length
        if let Some(text) = content.as_str() {
            if text.len() > 100 {
                score += 0.05;
            }
            if text.len() > 500 {
                score += 0.05;
            }
        }

        // Boost based on number of relevant tags
        let relevant_tags_count = tags.iter()
            .filter(|tag| tag.len() > 3)
            .count();
        score += (relevant_tags_count as f64 * 0.02).min(0.2);

        score.min(1.0)
    }

    /// Get memory statistics
    pub async fn get_memory_stats(&self, user_id: Uuid) -> CommandResult<serde_json::Value> {
        let mut conn = self.db.acquire().await
            .map_err(|e| format!("Failed to get connection: {}", e))?;

        // Memory counts by type
        let type_stats = sqlx::query!(
            r#"
            SELECT 
                memory_type,
                COUNT(*) as count,
                AVG(relevance_score) as avg_relevance
            FROM jean_memories
            WHERE user_id = $1 AND is_archived = FALSE
            GROUP BY memory_type
            "#,
            user_id
        )
        .fetch_all(&mut *conn)
        .await
        .map_err(|e| format!("Failed to get type stats: {}", e))?;

        // Folder stats
        let folder_stats = sqlx::query!(
            r#"
            SELECT 
                f.name,
                f.memory_count,
                COUNT(m.id) as actual_count
            FROM jean_memory_folders f
            LEFT JOIN jean_memories m ON f.id = m.folder_id AND m.is_archived = FALSE
            WHERE f.user_id = $1
            GROUP BY f.id, f.name, f.memory_count
            ORDER BY f.sort_order
            "#,
            user_id
        )
        .fetch_all(&mut *conn)
        .await
        .map_err(|e| format!("Failed to get folder stats: {}", e))?;

        let stats = serde_json::json!({
            "memory_types": type_stats.into_iter().map(|r| serde_json::json!({
                "type": r.memory_type,
                "count": r.count.unwrap_or(0),
                "avg_relevance": r.avg_relevance.unwrap_or(0.0)
            })).collect::<Vec<_>>(),
            "folders": folder_stats.into_iter().map(|r| serde_json::json!({
                "name": r.name,
                "cached_count": r.memory_count,
                "actual_count": r.actual_count.unwrap_or(0)
            })).collect::<Vec<_>>()
        });

        Ok(stats)
    }
}