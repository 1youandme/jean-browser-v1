use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use std::collections::HashMap;
use tokio::sync::RwLock;
use std::sync::Arc;
use regex::Regex;

use crate::commands::{CommandResult, DatabasePool};

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub enum PermissionType {
    #[serde(rename = "filesystem_read")]
    FilesystemRead,
    #[serde(rename = "filesystem_write")]
    FilesystemWrite,
    #[serde(rename = "filesystem_delete")]
    FilesystemDelete,
    #[serde(rename = "browser_navigation")]
    BrowserNavigation,
    #[serde(rename = "browser_tab_management")]
    BrowserTabManagement,
    #[serde(rename = "browser_download")]
    BrowserDownload,
    #[serde(rename = "proxy_control")]
    ProxyControl,
    #[serde(rename = "proxy_node_management")]
    ProxyNodeManagement,
    #[serde(rename = "proxy_session_management")]
    ProxySessionManagement,
    #[serde(rename = "ecommerce_view")]
    EcommerceView,
    #[serde(rename = "ecommerce_edit")]
    EcommerceEdit,
    #[serde(rename = "ecommerce_pricing")]
    EcommercePricing,
    #[serde(rename = "ecommerce_orders")]
    EcommerceOrders,
    #[serde(rename = "video_jobs_create")]
    VideoJobsCreate,
    #[serde(rename = "video_jobs_execute")]
    VideoJobsExecute,
    #[serde(rename = "video_jobs_delete")]
    VideoJobsDelete,
    #[serde(rename = "system_monitor")]
    SystemMonitor,
    #[serde(rename = "system_control")]
    SystemControl,
    #[serde(rename = "docker_management")]
    DockerManagement,
    #[serde(rename = "user_management")]
    UserManagement,
    #[serde(rename = "security_admin")]
    SecurityAdmin,
    #[serde(rename = "analytics_view")]
    AnalyticsView,
    #[serde(rename = "memory_read")]
    MemoryRead,
    #[serde(rename = "memory_write")]
    MemoryWrite,
    #[serde(rename = "memory_delete")]
    MemoryDelete,
    #[serde(rename = "memory_search")]
    MemorySearch,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct EnhancedPermission {
    pub id: Uuid,
    pub user_id: Uuid,
    pub permission_type: PermissionType,
    pub scope: String,
    pub resource_id: Option<Uuid>,
    pub max_amount: Option<rust_decimal::Decimal>,
    pub usage_count: i32,
    pub max_usage: Option<i32>,
    pub time_limit_minutes: Option<i32>,
    pub delegated_by: Option<Uuid>,
    pub delegation_reason: Option<String>,
    pub can_delegate: bool,
    pub allowed_paths: Option<Vec<String>>,
    pub allowed_domains: Option<Vec<String>>,
    pub time_restrictions: Option<serde_json::Value>,
    pub is_active: bool,
    pub is_template: bool,
    pub template_name: Option<String>,
    pub granted_at: DateTime<Utc>,
    pub expires_at: Option<DateTime<Utc>>,
    pub last_used_at: Option<DateTime<Utc>>,
    pub usage_analytics: serde_json::Value,
    pub description: Option<String>,
    pub risk_level: String,
    pub auto_revoke: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PermissionCheckRequest {
    pub user_id: Uuid,
    pub permission_type: PermissionType,
    pub scope: Option<String>,
    pub resource_id: Option<Uuid>,
    pub action_data: Option<serde_json::Value>,
    pub session_id: Option<String>,
    pub ip_address: Option<String>,
    pub user_agent: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PermissionCheckResult {
    pub has_permission: bool,
    pub permission_id: Option<Uuid>,
    pub remaining_uses: Option<i32>,
    pub expires_at: Option<DateTime<Utc>>,
    pub risk_level: Option<String>,
    pub requires_confirmation: bool,
    pub reason: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PermissionTemplate {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub permissions: serde_json::Value,
    pub is_system_template: bool,
    pub usage_count: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PermissionRequestData {
    pub id: Uuid,
    pub user_id: Uuid,
    pub requested_permission_type: PermissionType,
    pub requested_scope: String,
    pub requested_resource_id: Option<Uuid>,
    pub reason: String,
    pub context: serde_json::Value,
    pub status: String,
    pub reviewed_by: Option<Uuid>,
    pub review_notes: Option<String>,
    pub reviewed_at: Option<DateTime<Utc>>,
    pub auto_approved: bool,
    pub approval_conditions: serde_json::Value,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PermissionUsage {
    pub id: Uuid,
    pub permission_id: Uuid,
    pub user_id: Uuid,
    pub action_type: String,
    pub action_data: serde_json::Value,
    pub success: bool,
    pub error_message: Option<String>,
    pub session_id: Option<String>,
    pub ip_address: Option<String>,
    pub user_agent: Option<String>,
    pub execution_time_ms: Option<i32>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PermissionAlert {
    pub id: Uuid,
    pub user_id: Uuid,
    pub permission_id: Option<Uuid>,
    pub alert_type: String,
    pub severity: String,
    pub message: String,
    pub details: serde_json::Value,
    pub is_read: bool,
    pub is_acknowledged: bool,
    pub acknowledged_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone)]
pub struct JeanPermissionsEnhanced {
    db: Arc<DatabasePool>,
}

impl JeanPermissionsEnhanced {
    pub fn new(db: Arc<DatabasePool>) -> Self {
        Self { db }
    }

    /// Check if user has permission with enhanced logic
    pub async fn check_permission(&self, request: PermissionCheckRequest) -> CommandResult<PermissionCheckResult> {
        let mut conn = self.db.acquire().await
            .map_err(|e| format!("Failed to get connection: {}", e))?;

        // For simplicity, using string representation of permission type
        // In production, you'd use proper SQL enum handling
        let permission_type_str = format!("{:?}", request.permission_type).to_lowercase();
        
        let mut result = sqlx::query!(
            r#"
            SELECT 
                has_permission,
                permission_id,
                remaining_uses,
                expires_at,
                risk_level,
                requires_confirmation
            FROM check_permission_enhanced(
                $1::uuid,
                $2::jean_permission_type,
                COALESCE($3, 'global'),
                $4,
                COALESCE($5, '{}')
            )
            "#,
            request.user_id,
            permission_type_str as &str,
            request.scope.unwrap_or_else(|| "global".to_string()),
            request.resource_id,
            request.action_data.unwrap_or_default()
        )
        .fetch_optional(&mut *conn)
        .await
        .map_err(|e| format!("Failed to check permission: {}", e))?;

        if let Some(row) = result {
            Ok(PermissionCheckResult {
                has_permission: row.has_permission.unwrap_or(false),
                permission_id: row.permission_id,
                remaining_uses: row.remaining_uses,
                expires_at: row.expires_at,
                risk_level: row.risk_level,
                requires_confirmation: row.requires_confirmation.unwrap_or(false),
                reason: None,
            })
        } else {
            Ok(PermissionCheckResult {
                has_permission: false,
                permission_id: None,
                remaining_uses: None,
                expires_at: None,
                risk_level: None,
                requires_confirmation: false,
                reason: Some("Permission check failed".to_string()),
            })
        }
    }

    /// Grant permission to user
    pub async fn grant_permission(
        &self,
        user_id: Uuid,
        permission_type: PermissionType,
        scope: &str,
        max_amount: Option<rust_decimal::Decimal>,
        max_usage: Option<i32>,
        time_limit_minutes: Option<i32>,
        description: Option<String>,
        granted_by: Option<Uuid>,
        expires_at: Option<DateTime<Utc>>,
    ) -> CommandResult<EnhancedPermission> {
        let mut conn = self.db.acquire().await
            .map_err(|e| format!("Failed to get connection: {}", e))?;

        let permission = sqlx::query_as!(
            EnhancedPermission,
            r#"
            INSERT INTO jean_permissions_enhanced (
                user_id, permission_type, scope, max_amount, max_usage,
                time_limit_minutes, description, delegated_by, expires_at,
                risk_level
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9,
                CASE 
                    WHEN $2 IN ('system_control', 'user_management', 'security_admin') THEN 'critical'
                    WHEN $2 IN ('docker_management', 'ecommerce_pricing') THEN 'high'
                    WHEN $2 IN ('filesystem_delete', 'ecommerce_orders') THEN 'medium'
                    ELSE 'low'
                END
            )
            RETURNING *
            "#,
            user_id,
            format!("{:?}", permission_type).to_lowercase(),
            scope,
            max_amount,
            max_usage,
            time_limit_minutes,
            description,
            granted_by,
            expires_at
        )
        .fetch_one(&mut *conn)
        .await
        .map_err(|e| format!("Failed to grant permission: {}", e))?;

        Ok(permission)
    }

    /// Create permission request
    pub async fn create_permission_request(
        &self,
        user_id: Uuid,
        permission_type: PermissionType,
        scope: &str,
        resource_id: Option<Uuid>,
        reason: &str,
        context: serde_json::Value,
        duration_minutes: Option<i32>,
        max_usage: Option<i32>,
        max_amount: Option<rust_decimal::Decimal>,
    ) -> CommandResult<PermissionRequestData> {
        let mut conn = self.db.acquire().await
            .map_err(|e| format!("Failed to get connection: {}", e))?;

        let request = sqlx::query_as!(
            PermissionRequestData,
            r#"
            INSERT INTO jean_permission_requests (
                user_id, requested_permission_type, requested_scope, requested_resource_id,
                reason, context, status, auto_approved, approval_conditions
            ) VALUES (
                $1, $2, $3, $4, $5, $6, 'pending', false, '{}'
            )
            RETURNING *
            "#,
            user_id,
            format!("{:?}", permission_type).to_lowercase(),
            scope,
            resource_id,
            reason,
            context
        )
        .fetch_one(&mut *conn)
        .await
        .map_err(|e| format!("Failed to create permission request: {}", e))?;

        Ok(request)
    }

    /// Get user's active permissions
    pub async fn get_user_permissions(&self, user_id: Uuid) -> CommandResult<Vec<EnhancedPermission>> {
        let mut conn = self.db.acquire().await
            .map_err(|e| format!("Failed to get connection: {}", e))?;

        let permissions = sqlx::query_as!(
            EnhancedPermission,
            r#"
            SELECT * FROM jean_permissions_enhanced 
            WHERE user_id = $1 AND is_active = TRUE 
            AND (expires_at IS NULL OR expires_at > NOW())
            ORDER BY risk_level DESC, granted_at DESC
            "#,
            user_id
        )
        .fetch_all(&mut *conn)
        .await
        .map_err(|e| format!("Failed to get user permissions: {}", e))?;

        Ok(permissions)
    }

    /// Get permission templates
    pub async fn get_permission_templates(&self) -> CommandResult<Vec<PermissionTemplate>> {
        let mut conn = self.db.acquire().await
            .map_err(|e| format!("Failed to get connection: {}", e))?;

        let templates = sqlx::query_as!(
            PermissionTemplate,
            "SELECT * FROM jean_permission_templates ORDER BY is_system_template DESC, name ASC"
        )
        .fetch_all(&mut *conn)
        .await
        .map_err(|e| format!("Failed to get permission templates: {}", e))?;

        Ok(templates)
    }

    /// Create permissions from template
    pub async fn create_from_template(
        &self,
        user_id: Uuid,
        template_name: &str,
        granted_by: Option<Uuid>,
        expires_at: Option<DateTime<Utc>>,
    ) -> CommandResult<i32> {
        let mut conn = self.db.acquire().await
            .map_err(|e| format!("Failed to get connection: {}", e))?;

        let result = sqlx::query_scalar!(
            "SELECT create_permissions_from_template($1, $2, $3, $4)",
            user_id,
            template_name,
            granted_by,
            expires_at
        )
        .fetch_one(&mut *conn)
        .await
        .map_err(|e| format!("Failed to create from template: {}", e))?;

        Ok(result.unwrap_or(0))
    }

    /// Log permission usage
    pub async fn log_usage(
        &self,
        permission_id: Uuid,
        user_id: Uuid,
        action_type: &str,
        action_data: serde_json::Value,
        success: bool,
        error_message: Option<String>,
        session_id: Option<String>,
        ip_address: Option<String>,
        user_agent: Option<String>,
        execution_time_ms: Option<i32>,
    ) -> CommandResult<()> {
        let mut conn = self.db.acquire().await
            .map_err(|e| format!("Failed to get connection: {}", e))?;

        sqlx::query!(
            r#"
            SELECT log_permission_usage(
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
            )
            "#,
            permission_id,
            user_id,
            action_type,
            action_data,
            success,
            error_message,
            session_id,
            ip_address,
            user_agent,
            execution_time_ms
        )
        .execute(&mut *conn)
        .await
        .map_err(|e| format!("Failed to log usage: {}", e))?;

        Ok(())
    }

    /// Get permission alerts for user
    pub async fn get_user_alerts(&self, user_id: Uuid, unread_only: bool) -> CommandResult<Vec<PermissionAlert>> {
        let mut conn = self.db.acquire().await
            .map_err(|e| format!("Failed to get connection: {}", e))?;

        let alerts = if unread_only {
            sqlx::query_as!(
                PermissionAlert,
                r#"
                SELECT * FROM jean_permission_alerts 
                WHERE user_id = $1 AND is_read = FALSE 
                ORDER BY severity DESC, created_at DESC
                "#,
                user_id
            )
            .fetch_all(&mut *conn)
            .await
            .map_err(|e| format!("Failed to get unread alerts: {}", e))?
        } else {
            sqlx::query_as!(
                PermissionAlert,
                r#"
                SELECT * FROM jean_permission_alerts 
                WHERE user_id = $1 
                ORDER BY is_read ASC, severity DESC, created_at DESC
                LIMIT 50
                "#,
                user_id
            )
            .fetch_all(&mut *conn)
            .await
            .map_err(|e| format!("Failed to get alerts: {}", e))?
        };

        Ok(alerts)
    }

    /// Get permission usage analytics
    pub async fn get_usage_analytics(
        &self,
        user_id: Uuid,
        days_back: i32,
    ) -> CommandResult<serde_json::Value> {
        let mut conn = self.db.acquire().await
            .map_err(|e| format!("Failed to get connection: {}", e))?;

        let cutoff_date = Utc::now() - chrono::Duration::days(days_back as i64);

        // Usage by permission type
        let usage_by_type = sqlx::query!(
            r#"
            SELECT 
                pe.permission_type,
                COUNT(pu.id) as usage_count,
                COUNT(CASE WHEN pu.success = TRUE THEN 1 END) as success_count,
                AVG(pu.execution_time_ms) as avg_execution_time
            FROM jean_permissions_enhanced pe
            LEFT JOIN jean_permission_usage pu ON pe.id = pu.permission_id 
                AND pu.user_id = pe.user_id
                AND pu.created_at >= $2
            WHERE pe.user_id = $1
            GROUP BY pe.permission_type
            ORDER BY usage_count DESC
            "#,
            user_id,
            cutoff_date
        )
        .fetch_all(&mut *conn)
        .await
        .map_err(|e| format!("Failed to get usage analytics: {}", e))?;

        // Daily usage trend
        let daily_usage = sqlx::query!(
            r#"
            SELECT 
                DATE(pu.created_at) as date,
                COUNT(*) as usage_count,
                COUNT(CASE WHEN pu.success = TRUE THEN 1 END) as success_count
            FROM jean_permission_usage pu
            WHERE pu.user_id = $1 AND pu.created_at >= $2
            GROUP BY DATE(pu.created_at)
            ORDER BY date DESC
            "#,
            user_id,
            cutoff_date
        )
        .fetch_all(&mut *conn)
        .await
        .map_err(|e| format!("Failed to get daily usage: {}", e))?;

        let analytics = serde_json::json!({
            "usage_by_type": usage_by_type.into_iter().map(|r| serde_json::json!({
                "permission_type": r.permission_type,
                "usage_count": r.usage_count.unwrap_or(0),
                "success_count": r.success_count.unwrap_or(0),
                "success_rate": if r.usage_count.unwrap_or(0) > 0 {
                    r.success_count.unwrap_or(0) as f64 / r.usage_count.unwrap_or(0) as f64
                } else { 0.0 },
                "avg_execution_time": r.avg_execution_time
            })).collect::<Vec<_>>(),
            "daily_usage": daily_usage.into_iter().map(|r| serde_json::json!({
                "date": r.date,
                "usage_count": r.usage_count.unwrap_or(0),
                "success_count": r.success_count.unwrap_or(0),
                "success_rate": if r.usage_count.unwrap_or(0) > 0 {
                    r.success_count.unwrap_or(0) as f64 / r.usage_count.unwrap_or(0) as f64
                } else { 0.0 }
            })).collect::<Vec<_>>(),
            "period_days": days_back
        });

        Ok(analytics)
    }

    /// Revoke permission
    pub async fn revoke_permission(&self, permission_id: Uuid, user_id: Uuid, reason: Option<String>) -> CommandResult<()> {
        let mut conn = self.db.acquire().await
            .map_err(|e| format!("Failed to get connection: {}", e))?;

        sqlx::query!(
            r#"
            UPDATE jean_permissions_enhanced 
            SET is_active = FALSE, updated_at = NOW()
            WHERE id = $1 AND user_id = $2
            "#,
            permission_id,
            user_id
        )
        .execute(&mut *conn)
        .await
        .map_err(|e| format!("Failed to revoke permission: {}", e))?;

        // Log the revocation
        if let Some(r) = reason {
            let _ = sqlx::query!(
                r#"
                INSERT INTO jean_permission_usage (
                    permission_id, user_id, action_type, action_data, success
                ) VALUES ($1, $2, 'permission_revoked', $3, TRUE)
                "#,
                permission_id,
                user_id,
                serde_json::json!({"reason": r})
            )
            .execute(&mut *conn)
            .await;
        }

        Ok(())
    }

    /// Auto-cleanup expired permissions and old logs
    pub async fn cleanup_expired(&self) -> CommandResult<i32> {
        let mut conn = self.db.acquire().await
            .map_err(|e| format!("Failed to get connection: {}", e))?;

        // Deactivate expired permissions
        let result = sqlx::query!(
            r#"
            UPDATE jean_permissions_enhanced 
            SET is_active = FALSE 
            WHERE expires_at <= NOW() AND is_active = TRUE
            "#,
        )
        .execute(&mut *conn)
        .await
        .map_err(|e| format!("Failed to cleanup expired permissions: {}", e))?;

        // Clean up old usage logs (older than 90 days)
        let cutoff_date = Utc::now() - chrono::Duration::days(90);
        let cleanup_result = sqlx::query!(
            "DELETE FROM jean_permission_usage WHERE created_at < $1",
            cutoff_date
        )
        .execute(&mut *conn)
        .await
        .map_err(|e| format!("Failed to cleanup old usage logs: {}", e))?;

        Ok(result.rows_affected() as i32 + cleanup_result.rows_affected() as i32)
    }
}