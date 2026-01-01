use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),
    
    #[error("Redis error: {0}")]
    Redis(#[from] redis::RedisError),
    
    #[error("Model not found: {0}")]
    ModelNotFound(String),
    
    #[error("Job not found: {0}")]
    JobNotFound(String),
    
    #[error("User not found: {0}")]
    UserNotFound(String),
    
    #[error("Invalid request: {0}")]
    InvalidRequest(String),
    
    #[error("Service unavailable: {0}")]
    ServiceUnavailable(String),
    
    #[error("Rate limit exceeded")]
    RateLimitExceeded,
    
    #[error("Cost limit exceeded")]
    CostLimitExceeded,
    
    #[error("Permission denied: {0}")]
    PermissionDenied(String),
    
    #[error("Not found: {0}")]
    NotFound(String),
    
    #[error("Internal server error: {0}")]
    InternalError(String),
    
    #[error("Network error: {0}")]
    NetworkError(String),
    
    #[error("Serialization error: {0}")]
    SerializationError(#[from] serde_json::Error),
    
    #[error("IO error: {0}")]
    IoError(#[from] std::io::Error),
    
    #[error("UUID error: {0}")]
    UuidError(#[from] uuid::Error),
    
    #[error("Parse error: {0}")]
    ParseError(String),
}

impl axum::response::IntoResponse for AppError {
    fn into_response(self) -> axum::response::Response {
        let (status, error_message) = match self {
            AppError::Database(ref e) => {
                tracing::error!("Database error: {:?}", e);
                (axum::http::StatusCode::INTERNAL_SERVER_ERROR, "Internal server error")
            }
            AppError::ModelNotFound(ref model) => {
                (axum::http::StatusCode::NOT_FOUND, model.as_str())
            }
            AppError::JobNotFound(ref job) => {
                (axum::http::StatusCode::NOT_FOUND, job.as_str())
            }
            AppError::UserNotFound(ref user) => {
                (axum::http::StatusCode::NOT_FOUND, user.as_str())
            }
            AppError::InvalidRequest(ref msg) => {
                (axum::http::StatusCode::BAD_REQUEST, msg.as_str())
            }
            AppError::ServiceUnavailable(ref service) => {
                (axum::http::StatusCode::SERVICE_UNAVAILABLE, service.as_str())
            }
            AppError::RateLimitExceeded => {
                (axum::http::StatusCode::TOO_MANY_REQUESTS, "Rate limit exceeded")
            }
            AppError::CostLimitExceeded => {
                (axum::http::StatusCode::PAYMENT_REQUIRED, "Cost limit exceeded")
            }
            AppError::PermissionDenied(ref msg) => {
                (axum::http::StatusCode::FORBIDDEN, msg.as_str())
            }
            AppError::NotFound(ref msg) => {
                (axum::http::StatusCode::NOT_FOUND, msg.as_str())
            }
            _ => {
                tracing::error!("Unhandled error: {:?}", self);
                (axum::http::StatusCode::INTERNAL_SERVER_ERROR, "Internal server error")
            }
        };

        let body = serde_json::json!({
            "error": error_message,
            "status": status.as_u16()
        });

        (status, axum::Json(body)).into_response()
    }
}

pub type Result<T> = std::result::Result<T, AppError>;