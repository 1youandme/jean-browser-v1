// Security / Privacy / Compliance Layer
use axum::{Json, extract::{Path, Query, Request}, http::HeaderMap, middleware};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use uuid::Uuid;
use chrono::{DateTime, Utc};
use std::collections::HashMap;
use std::net::IpAddr;

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct AuditLog {
    pub id: Uuid,
    pub user_id: Option<Uuid>,
    pub action: String,
    pub resource_type: Option<String>,
    pub resource_id: Option<String>,
    pub details: Value,
    pub ip_address: Option<IpAddr>,
    pub user_agent: Option<String>,
    pub session_id: Option<String>,
    pub risk_score: i32,
    pub status: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct ConsentRecord {
    pub id: Uuid,
    pub user_id: Uuid,
    pub consent_type: String,
    pub version: String,
    pub granted: bool,
    pub granted_at: DateTime<Utc>,
    pub revoked_at: Option<DateTime<Utc>>,
    pub ip_address: Option<IpAddr>,
    pub user_agent: Option<String>,
    pub metadata: Value,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct PrivacySetting {
    pub id: Uuid,
    pub user_id: Uuid,
    pub setting_key: String,
    pub setting_value: Value,
    pub category: Option<String>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateConsentRecordRequest {
    pub user_id: Uuid,
    pub consent_type: String,
    pub version: String,
    pub granted: bool,
    pub metadata: Option<Value>,
}

#[derive(Debug, Deserialize)]
pub struct UpdatePrivacySettingsRequest {
    pub settings: HashMap<String, Value>,
}

// Audit Logging Middleware
pub async fn audit_logging_middleware(
    request: Request,
    next: axum::middleware::Next,
) -> Result<axum::response::Response, axum::http::StatusCode> {
    let start_time = std::time::Instant::now();
    let method = request.method().to_string();
    let uri = request.uri().to_string();
    let headers = request.headers().clone();
    
    // Extract user info from headers/jwt
    let user_id = extract_user_id_from_request(&headers);
    let session_id = extract_session_id_from_request(&headers);
    
    // Calculate risk score based on request
    let risk_score = calculate_request_risk_score(&request);
    
    let response = next.run(request).await;
    
    let duration = start_time.elapsed();
    let status = response.status();
    
    // Log the request
    let audit_log = AuditLog {
        id: Uuid::new_v4(),
        user_id,
        action: format!("{}_{}", method, uri),
        resource_type: extract_resource_type(&uri),
        resource_id: extract_resource_id(&uri),
        details: serde_json::json!({
            "method": method,
            "uri": uri,
            "status": status.as_u16(),
            "duration_ms": duration.as_millis(),
            "user_agent": extract_user_agent(&headers)
        }),
        ip_address: extract_ip_address(&headers),
        user_agent: extract_user_agent(&headers),
        session_id,
        risk_score,
        status: if status.is_success() { "success".to_string() } else { "failed".to_string() },
        created_at: Utc::now(),
    };
    
    // Save audit log asynchronously
    tokio::spawn(async move {
        if let Err(e) = save_audit_log(audit_log).await {
            tracing::error!("Failed to save audit log: {}", e);
        }
    });
    
    Ok(response)
}

fn extract_user_id_from_request(headers: &HeaderMap) -> Option<Uuid> {
    headers
        .get("x-user-id")
        .and_then(|h| h.to_str().ok())
        .and_then(|s| Uuid::parse_str(s).ok())
}

fn extract_session_id_from_request(headers: &HeaderMap) -> Option<String> {
    headers
        .get("x-session-id")
        .and_then(|h| h.to_str().ok())
        .map(|s| s.to_string())
}

fn extract_user_agent(headers: &HeaderMap) -> Option<String> {
    headers
        .get("user-agent")
        .and_then(|h| h.to_str().ok())
        .map(|s| s.to_string())
}

fn extract_ip_address(headers: &HeaderMap) -> Option<IpAddr> {
    headers
        .get("x-real-ip")
        .or_else(|| headers.get("x-forwarded-for"))
        .and_then(|h| h.to_str().ok())
        .and_then(|s| s.parse().ok())
}

fn extract_resource_type(uri: &str) -> Option<String> {
    if uri.contains("/api/ai/") {
        Some("ai_request".to_string())
    } else if uri.contains("/api/proxy/") {
        Some("proxy_request".to_string())
    } else if uri.contains("/api/files/") {
        Some("file_operation".to_string())
    } else if uri.contains("/api/plugins/") {
        Some("plugin_operation".to_string())
    } else {
        None
    }
}

fn extract_resource_id(uri: &str) -> Option<String> {
    use regex::Regex;
    let re = Regex::new(r"/([^/]+)/?$").ok()?;
    let captures = re.captures(uri)?;
    captures.get(1).map(|m| m.as_str().to_string())
}

fn calculate_request_risk_score(request: &Request) -> i32 {
    let mut score = 0;
    let method = request.method();
    let uri = request.uri();
    
    // Higher risk for sensitive operations
    if method == axum::http::Method::DELETE {
        score += 30;
    } else if method == axum::http::Method::PUT || method == axum::http::Method::PATCH {
        score += 20;
    }
    
    // Higher risk for sensitive endpoints
    if uri.path().contains("/admin/") {
        score += 50;
    } else if uri.path().contains("/api/plugins/") {
        score += 25;
    } else if uri.path().contains("/api/ai/") {
        score += 15;
    }
    
    // Check for suspicious patterns
    if uri.path().contains("..") || uri.path().contains("%2e%2e") {
        score += 100;
    }
    
    score.min(100) // Cap at 100
}

async fn save_audit_log(audit_log: AuditLog) -> Result<(), Box<dyn std::error::Error>> {
    // Save to database
    tracing::info!("Saving audit log: {:?}", audit_log);
    Ok(())
}

// API Endpoints
pub async fn get_audit_logs(
    Query(params): Query<GetAuditLogsQuery>,
) -> Result<Json<Vec<AuditLog>>, axum::http::StatusCode> {
    // Query audit logs with filters
    let mock_logs = vec![
        AuditLog {
            id: Uuid::new_v4(),
            user_id: Some(Uuid::new_v4()),
            action: "GET_api_ai_generate".to_string(),
            resource_type: Some("ai_request".to_string()),
            resource_id: None,
            details: serde_json::json!({
                "method": "GET",
                "uri": "/api/ai/generate",
                "status": 200,
                "duration_ms": 150
            }),
            ip_address: Some("192.168.1.100".parse().unwrap()),
            user_agent: Some("JeanTrail Browser/1.0".to_string()),
            session_id: Some("session_123".to_string()),
            risk_score: 15,
            status: "success".to_string(),
            created_at: Utc::now(),
        }
    ];

    Ok(Json(mock_logs))
}

#[derive(Debug, Deserialize)]
pub struct GetAuditLogsQuery {
    pub user_id: Option<Uuid>,
    pub action: Option<String>,
    pub resource_type: Option<String>,
    pub status: Option<String>,
    pub min_risk_score: Option<i32>,
    pub max_risk_score: Option<i32>,
    pub from_date: Option<DateTime<Utc>>,
    pub to_date: Option<DateTime<Utc>>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

pub async fn create_consent_record(
    Json(request): Json<CreateConsentRecordRequest>,
) -> Result<Json<ConsentRecord>, axum::http::StatusCode> {
    let consent_record = ConsentRecord {
        id: Uuid::new_v4(),
        user_id: request.user_id,
        consent_type: request.consent_type,
        version: request.version,
        granted: request.granted,
        granted_at: Utc::now(),
        revoked_at: None,
        ip_address: None, // Would extract from request
        user_agent: None, // Would extract from request
        metadata: request.metadata.unwrap_or_else(|| serde_json::json!({})),
    };

    // Save to database
    Ok(Json(consent_record))
}

pub async fn get_user_consents(
    Path(user_id): Path<Uuid>,
) -> Result<Json<Vec<ConsentRecord>>, axum::http::StatusCode> {
    // Get user's consent records
    let mock_consents = vec![
        ConsentRecord {
            id: Uuid::new_v4(),
            user_id,
            consent_type: "data_processing".to_string(),
            version: "1.0".to_string(),
            granted: true,
            granted_at: Utc::now(),
            revoked_at: None,
            ip_address: None,
            user_agent: None,
            metadata: serde_json::json!({}),
        }
    ];

    Ok(Json(mock_consents))
}

pub async fn update_privacy_settings(
    Path(user_id): Path<Uuid>,
    Json(request): Json<UpdatePrivacySettingsRequest>,
) -> Result<Json<Vec<PrivacySetting>>, axum::http::StatusCode> {
    let mut updated_settings = Vec::new();
    
    for (key, value) in request.settings {
        let setting = PrivacySetting {
            id: Uuid::new_v4(),
            user_id,
            setting_key: key.clone(),
            setting_value: value,
            category: extract_setting_category(&key),
            updated_at: Utc::now(),
        };
        
        // Save to database
        updated_settings.push(setting);
    }

    Ok(Json(updated_settings))
}

fn extract_setting_category(key: &str) -> Option<String> {
    if key.starts_with("data_collection.") {
        Some("data_collection".to_string())
    } else if key.starts_with("sharing.") {
        Some("sharing".to_string())
    } else if key.starts_with("analytics.") {
        Some("analytics".to_string())
    } else if key.starts_with("security.") {
        Some("security".to_string())
    } else {
        None
    }
}

use axum::{
    middleware::{self, Next},
    extract::{Request, State},
    http::{StatusCode, HeaderMap},
    response::Response,
    Json,
};
use serde_json::Value;
use std::collections::HashMap;

// Audit logging middleware
pub async fn audit_logging_middleware(
    request: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let method = request.method().to_string();
    let uri = request.uri().to_string();
    let headers = request.headers().clone();
    
    // Extract user info from headers or JWT token
    let user_id = extract_user_id(&headers).await;
    let ip_address = extract_client_ip(&headers);
    let user_agent = get_user_agent(&headers);
    
    // Calculate risk score based on request
    let risk_score = calculate_risk_score(&method, &uri, &headers);
    
    // Log the request
    let log_entry = serde_json::json!({
        "user_id": user_id,
        "action": format!("{} {}", method, uri),
        "resource_type": extract_resource_type(&uri),
        "resource_id": extract_resource_id(&uri),
        "details": {
            "method": method,
            "uri": uri,
            "headers": sanitize_headers(&headers),
        },
        "ip_address": ip_address,
        "user_agent": user_agent,
        "risk_score": risk_score,
        "status": "processing"
    });
    
    // Log to file or database (simplified - in production use proper logging)
    log_audit_event(&log_entry).await;
    
    // Process the request
    let response = next.run(request).await;
    
    // Update log with response status
    let status_code = response.status().as_u16();
    
    // Log completion
    let completion_log = serde_json::json!({
        "user_id": user_id,
        "action": format!("{} {}", method, uri),
        "status": if status_code < 400 { "success" } else { "error" },
        "details": {
            "status_code": status_code,
            "response_time_ms": chrono::Utc::now().timestamp_millis(), // Simplified
        }
    });
    
    log_audit_event(&completion_log).await;
    
    Ok(response)
}

async fn extract_user_id(headers: &HeaderMap) -> Option<String> {
    // Try to extract from Authorization header (JWT token)
    if let Some(auth_header) = headers.get("authorization") {
        if let Ok(auth_str) = auth_header.to_str() {
            if auth_str.starts_with("Bearer ") {
                // In production, validate JWT and extract user ID
                // For now, return a placeholder
                return Some("user_from_jwt".to_string());
            }
        }
    }
    
    // Try to extract from custom header
    if let Some(user_header) = headers.get("x-user-id") {
        if let Ok(user_str) = user_header.to_str() {
            return Some(user_str.to_string());
        }
    }
    
    None
}

fn extract_client_ip(headers: &HeaderMap) -> Option<String> {
    // Check various headers for client IP
    let ip_headers = [
        "x-forwarded-for",
        "x-real-ip",
        "cf-connecting-ip",
        "x-client-ip",
    ];
    
    for header_name in &ip_headers {
        if let Some(header_value) = headers.get(header_name) {
            if let Ok(ip_str) = header_value.to_str() {
                // Take first IP if multiple
                let ip = ip_str.split(',').next().unwrap_or("").trim();
                if !ip.is_empty() {
                    return Some(ip.to_string());
                }
            }
        }
    }
    
    None
}

fn get_user_agent(headers: &HeaderMap) -> Option<String> {
    headers
        .get("user-agent")
        .and_then(|h| h.to_str().ok())
        .map(|s| s.to_string())
}

fn calculate_risk_score(method: &str, uri: &str, headers: &HeaderMap) -> i32 {
    let mut score = 0;
    
    // Higher risk for certain methods
    match method {
        "DELETE" => score += 20,
        "PUT" | "PATCH" => score += 15,
        "POST" => score += 10,
        _ => {}
    }
    
    // Higher risk for sensitive endpoints
    if uri.contains("/admin/") {
        score += 30;
    } else if uri.contains("/users/") {
        score += 15;
    } else if uri.contains("/auth/") {
        score += 10;
    }
    
    // Higher risk for requests without proper auth
    if !headers.contains_key("authorization") {
        score += 25;
    }
    
    // Higher risk for suspicious user agents
    if let Some(user_agent) = get_user_agent(headers) {
        if user_agent.contains("bot") || user_agent.contains("scanner") {
            score += 15;
        }
    }
    
    score.min(100) // Cap at 100
}

fn extract_resource_type(uri: &str) -> String {
    if uri.contains("/users/") {
        "user".to_string()
    } else if uri.contains("/workspaces/") {
        "workspace".to_string()
    } else if uri.contains("/tabs/") {
        "tab".to_string()
    } else if uri.contains("/ai/") {
        "ai".to_string()
    } else if uri.contains("/plugins/") {
        "plugin".to_string()
    } else {
        "unknown".to_string()
    }
}

fn extract_resource_id(uri: &str) -> Option<String> {
    // Extract UUID from URI path
    let parts: Vec<&str> = uri.split('/').collect();
    for part in parts {
        if part.len() == 36 && part.contains('-') {
            return Some(part.to_string());
        }
    }
    None
}

fn sanitize_headers(headers: &HeaderMap) -> HashMap<String, String> {
    let mut sanitized = HashMap::new();
    
    for (name, value) in headers {
        if let Ok(name_str) = name.to_str() {
            // Skip sensitive headers
            if name_str.to_lowercase().contains("authorization") ||
               name_str.to_lowercase().contains("cookie") ||
               name_str.to_lowercase().contains("token") {
                continue;
            }
            
            if let Ok(value_str) = value.to_str() {
                sanitized.insert(name_str.to_string(), value_str.to_string());
            }
        }
    }
    
    sanitized
}

async fn log_audit_event(event: &Value) {
    // In production, log to file, database, or logging service
    // For now, just print to console
    println!("AUDIT: {}", serde_json::to_string_pretty(event).unwrap_or_default());
}

// Additional security utilities
pub fn validate_api_key(api_key: &str) -> bool {
    // In production, validate against stored API keys
    // For demo, check for basic format
    api_key.len() >= 32 && api_key.chars().all(|c| c.is_alphanumeric() || c == '-' || c == '_')
}

pub fn generate_secure_token() -> String {
    use uuid::Uuid;
    Uuid::new_v4().to_string()
}

pub fn hash_sensitive_data(data: &str) -> String {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};
    
    let mut hasher = DefaultHasher::new();
    data.hash(&mut hasher);
    format!("{:x}", hasher.finish())
}

// Rate limiting helper (simplified)
pub struct RateLimiter {
    requests: std::collections::HashMap<String, Vec<i64>>,
    max_requests: usize,
    window_seconds: i64,
}

impl RateLimiter {
    pub fn new(max_requests: usize, window_seconds: i64) -> Self {
        Self {
            requests: std::collections::HashMap::new(),
            max_requests,
            window_seconds,
        }
    }
    
    pub fn is_allowed(&mut self, key: &str) -> bool {
        let now = chrono::Utc::now().timestamp();
        let window_start = now - self.window_seconds;
        
        let requests = self.requests.entry(key.to_string()).or_insert_with(Vec::new);
        
        // Remove old requests outside the window
        requests.retain(|&timestamp| timestamp > window_start);
        
        // Check if under limit
        if requests.len() < self.max_requests {
            requests.push(now);
            true
        } else {
            false
        }
    }
}

pub async fn get_user_privacy_settings(
    Path(user_id): Path<Uuid>,
) -> Result<Json<Vec<PrivacySetting>>, axum::http::StatusCode> {
    // Get user's privacy settings
    let mock_settings = vec![
        PrivacySetting {
            id: Uuid::new_v4(),
            user_id,
            setting_key: "data_collection.analytics".to_string(),
            setting_value: serde_json::json!(true),
            category: Some("data_collection".to_string()),
            updated_at: Utc::now(),
        },
        PrivacySetting {
            id: Uuid::new_v4(),
            user_id,
            setting_key: "sharing.profile_visibility".to_string(),
            setting_value: serde_json::json!("public"),
            category: Some("sharing".to_string()),
            updated_at: Utc::now(),
        }
    ];

    Ok(Json(mock_settings))
}

pub async fn get_security_dashboard() -> Result<Json<Value>, axum::http::StatusCode> {
    let dashboard = serde_json::json!({
        "total_events": 15234,
        "high_risk_events": 23,
        "failed_logins": 5,
        "suspicious_ips": 12,
        "data_access_requests": 456,
        "consent_grants": 892,
        "consent_revocations": 34,
        "recent_events": [
            {
                "timestamp": "2024-01-15T10:30:00Z",
                "event_type": "high_risk_api_call",
                "description": "Multiple failed attempts to access admin API",
                "risk_score": 85
            }
        ],
        "privacy_metrics": {
            "data_processing_consents": 1250,
            "analytics_opt_ins": 890,
            "third_party_sharing_consents": 234,
            "data_retention_compliance": "98.5%"
        }
    });

    Ok(Json(dashboard))
}

// Data Retention Policies
pub async fn cleanup_old_audit_logs() -> Result<u64, Box<dyn std::error::Error>> {
    // Delete audit logs older than retention period (e.g., 90 days)
    let cutoff_date = Utc::now() - chrono::Duration::days(90);
    
    // In production, this would be a database query
    // DELETE FROM audit_logs WHERE created_at < cutoff_date
    
    tracing::info!("Cleaning up audit logs older than {}", cutoff_date);
    Ok(1000) // Mock deleted count
}

pub async fn cleanup_expired_consents() -> Result<u64, Box<dyn std::error::Error>> {
    // Mark expired consents as revoked
    tracing::info!("Checking for expired consents");
    Ok(5) // Mock expired count
}