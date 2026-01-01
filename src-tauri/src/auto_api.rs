// Auto-API Extractor / Generator Module
use axum::{Json, extract::{Path, Query, State}, extract::Multipart};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use uuid::Uuid;
use chrono::{DateTime, Utc};
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct ApiDiscoveryLog {
    pub id: Uuid,
    pub user_id: Option<Uuid>,
    pub session_id: Option<String>,
    pub domain: String,
    pub method: String,
    pub url: String,
    pub headers: Value,
    pub request_body: Option<String>,
    pub response_status: Option<i32>,
    pub response_headers: Option<Value>,
    pub response_body: Option<String>,
    pub timestamp: DateTime<Utc>,
    pub processed: bool,
    pub api_spec: Option<Value>,
}

#[derive(Debug, Deserialize)]
pub struct LogApiRequestRequest {
    pub session_id: Option<String>,
    pub domain: String,
    pub method: String,
    pub url: String,
    pub headers: Value,
    pub request_body: Option<String>,
    pub response_status: Option<i32>,
    pub response_headers: Option<Value>,
    pub response_body: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OpenApiSpec {
    pub openapi: String,
    pub info: OpenApiInfo,
    pub servers: Vec<OpenApiServer>,
    pub paths: HashMap<String, OpenApiPathItem>,
    pub components: Option<OpenApiComponents>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OpenApiInfo {
    pub title: String,
    pub version: String,
    pub description: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OpenApiServer {
    pub url: String,
    pub description: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OpenApiPathItem {
    pub get: Option<OpenApiOperation>,
    pub post: Option<OpenApiOperation>,
    pub put: Option<OpenApiOperation>,
    pub delete: Option<OpenApiOperation>,
    pub patch: Option<OpenApiOperation>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OpenApiOperation {
    pub operation_id: Option<String>,
    pub summary: Option<String>,
    pub description: Option<String>,
    pub parameters: Vec<OpenApiParameter>,
    pub request_body: Option<OpenApiRequestBody>,
    pub responses: HashMap<String, OpenApiResponse>,
    pub tags: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OpenApiParameter {
    pub name: String,
    pub in_: String, // "query", "header", "path", "cookie"
    pub required: bool,
    pub schema: Value,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OpenApiRequestBody {
    pub content: HashMap<String, OpenApiMediaType>,
    pub required: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OpenApiMediaType {
    pub schema: Value,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OpenApiResponse {
    pub description: String,
    pub content: Option<HashMap<String, OpenApiMediaType>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OpenApiComponents {
    pub schemas: Option<HashMap<String, Value>>,
}

pub async fn log_api_request(
    Json(request): Json<LogApiRequestRequest>,
) -> Result<Json<Value>, axum::http::StatusCode> {
    let log_entry = ApiDiscoveryLog {
        id: Uuid::new_v4(),
        user_id: Some(Uuid::new_v4()), // Get from auth context
        session_id: request.session_id,
        domain: request.domain,
        method: request.method,
        url: request.url,
        headers: request.headers,
        request_body: request.request_body,
        response_status: request.response_status,
        response_headers: request.response_headers,
        response_body: request.response_body,
        timestamp: Utc::now(),
        processed: false,
        api_spec: None,
    };
    
    // Save to database
    Ok(Json(serde_json::json!({
        "success": true,
        "log_id": log_entry.id
    })))
}

pub async fn get_discovered_apis(
    Query(params): Query<GetDiscoveredApisQuery>,
) -> Result<Json<Vec<Value>>, axum::http::StatusCode> {
    // Group logs by domain and generate OpenAPI specs
    let mock_apis = vec![
        serde_json::json!({
            "domain": "api.example.com",
            "base_url": "https://api.example.com",
            "endpoints_count": 15,
            "methods": ["GET", "POST", "PUT", "DELETE"],
            "last_discovered": "2024-01-15T10:30:00Z",
            "openapi_spec": {
                "openapi": "3.0.0",
                "info": {
                    "title": "Example API",
                    "version": "1.0.0"
                },
                "servers": [
                    {"url": "https://api.example.com", "description": "Production server"}
                ],
                "paths": {
                    "/users": {
                        "get": {
                            "summary": "List users",
                            "responses": {
                                "200": {
                                    "description": "Successful response"
                                }
                            }
                        }
                    }
                }
            }
        })
    ];

    Ok(Json(mock_apis))
}

#[derive(Debug, Deserialize)]
pub struct GetDiscoveredApisQuery {
    pub domain: Option<String>,
    pub processed: Option<bool>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

pub async fn generate_openapi_spec(
    Path(domain): Path<String>,
) -> Result<Json<OpenApiSpec>, axum::http::StatusCode> {
    // Get all API logs for domain and generate OpenAPI spec
    let logs = get_api_logs_by_domain(&domain).await?;
    
    let mut paths = HashMap::new();
    let mut path_params = HashSet::new();
    
    for log in logs {
        let path = extract_path_from_url(&log.url);
        let method = log.method.to_lowercase();
        
        // Extract path parameters
        let (clean_path, params) = extract_path_parameters(&path);
        for param in params {
            path_params.insert(param.clone());
        }
        
        // Create or update path item
        let path_item = paths.entry(clean_path).or_insert_with(|| OpenApiPathItem {
            get: None,
            post: None,
            put: None,
            delete: None,
            patch: None,
        });
        
        // Add operation
        let operation = create_openapi_operation_from_log(&log, &params);
        match method.as_str() {
            "get" => path_item.get = Some(operation),
            "post" => path_item.post = Some(operation),
            "put" => path_item.put = Some(operation),
            "delete" => path_item.delete = Some(operation),
            "patch" => path_item.patch = Some(operation),
            _ => {}
        }
    }
    
    let openapi_spec = OpenApiSpec {
        openapi: "3.0.0".to_string(),
        info: OpenApiInfo {
            title: format!("{} API", domain),
            version: "1.0.0".to_string(),
            description: Some(format!("Auto-generated OpenAPI specification for {}", domain)),
        },
        servers: vec![
            OpenApiServer {
                url: format!("https://{}", domain),
                description: Some("Production server".to_string()),
            }
        ],
        paths,
        components: Some(OpenApiComponents {
            schemas: Some(HashMap::new()),
        }),
    };
    
    // Mark logs as processed
    mark_logs_as_processed(&domain).await?;
    
    Ok(Json(openapi_spec))
}

async fn get_api_logs_by_domain(domain: &str) -> Result<Vec<ApiDiscoveryLog>, axum::http::StatusCode> {
    // Query database for logs by domain
    let mock_logs = vec![
        ApiDiscoveryLog {
            id: Uuid::new_v4(),
            user_id: Some(Uuid::new_v4()),
            session_id: Some("session_123".to_string()),
            domain: domain.to_string(),
            method: "GET".to_string(),
            url: "https://api.example.com/users".to_string(),
            headers: serde_json::json!({"content-type": "application/json"}),
            request_body: None,
            response_status: Some(200),
            response_headers: Some(serde_json::json!({"content-type": "application/json"})),
            response_body: Some(r#"{"users": []}"#.to_string()),
            timestamp: Utc::now(),
            processed: false,
            api_spec: None,
        }
    ];
    
    Ok(mock_logs)
}

fn extract_path_from_url(url: &str) -> String {
    if let Ok(parsed_url) = url::Url::parse(url) {
        parsed_url.path().to_string()
    } else {
        url.to_string()
    }
}

fn extract_path_parameters(path: &str) -> (String, Vec<String>) {
    let mut clean_path = path.to_string();
    let mut params = Vec::new();
    
    // Simple pattern matching for UUIDs and IDs
    let re = regex::Regex::new(r"/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|\\d+)").unwrap();
    
    clean_path = re.replace_all(&clean_path, "/{id}").to_string();
    
    // Extract parameter types
    if clean_path.contains("{id}") {
        params.push("id".to_string());
    }
    
    (clean_path, params)
}

fn create_openapi_operation_from_log(log: &ApiDiscoveryLog, params: &[String]) -> OpenApiOperation {
    let mut operation = OpenApiOperation {
        operation_id: Some(format!("{}_{}", log.method.to_lowercase(), Uuid::new_v4().to_string().replace('-', "")[..8].to_string())),
        summary: Some(format!("{} {}", log.method, log.url)),
        description: Some(format!("Auto-generated from {} request", log.method)),
        parameters: Vec::new(),
        request_body: None,
        responses: HashMap::new(),
        tags: vec!["auto-generated".to_string()],
    };
    
    // Add path parameters
    for param in params {
        operation.parameters.push(OpenApiParameter {
            name: param.clone(),
            in_: "path".to_string(),
            required: true,
            schema: serde_json::json!({"type": "string"}),
        });
    }
    
    // Add request body if present
    if let Some(request_body) = &log.request_body {
        operation.request_body = Some(OpenApiRequestBody {
            content: HashMap::from([
                ("application/json".to_string(), OpenApiMediaType {
                    schema: serde_json::json!({"type": "object"}),
                })
            ]),
            required: Some(false),
        });
    }
    
    // Add response
    operation.responses.insert(
        log.response_status.unwrap_or(200).to_string(),
        OpenApiResponse {
            description: format!("Response from {} request", log.method),
            content: Some(HashMap::from([
                ("application/json".to_string(), OpenApiMediaType {
                    schema: serde_json::json!({"type": "object"}),
                })
            ])),
        }
    );
    
    operation
}

async fn mark_logs_as_processed(domain: &str) -> Result<(), Box<dyn std::error::Error>> {
    // Update database to mark logs as processed
    tracing::info!("Marked API logs for domain {} as processed", domain);
    Ok(())
}

pub async fn generate_client_stubs(
    Path(domain): Path<String>,
    Query(params): Query<GenerateClientStubsQuery>,
) -> Result<Json<Value>, axum::http::StatusCode> {
    let openapi_spec = generate_openapi_spec(Path(domain.to_string())).await?;
    
    let mut stubs = HashMap::new();
    
    for language in &params.languages {
        match language.as_str() {
            "typescript" => {
                let typescript_stub = generate_typescript_client(&openapi_spec);
                stubs.insert(language.clone(), serde_json::json!({
                    "language": language,
                    "content": typescript_stub,
                    "filename": format!("{}.ts", domain.replace(".", "_"))
                }));
            },
            "python" => {
                let python_stub = generate_python_client(&openapi_spec);
                stubs.insert(language.clone(), serde_json::json!({
                    "language": language,
                    "content": python_stub,
                    "filename": format!("{}.py", domain.replace(".", "_"))
                }));
            },
            "javascript" => {
                let javascript_stub = generate_javascript_client(&openapi_spec);
                stubs.insert(language.clone(), serde_json::json!({
                    "language": language,
                    "content": javascript_stub,
                    "filename": format!("{}.js", domain.replace(".", "_"))
                }));
            },
            _ => {}
        }
    }
    
    Ok(Json(serde_json::json!({
        "domain": domain,
        "stubs": stubs
    })))
}

#[derive(Debug, Deserialize)]
pub struct GenerateClientStubsQuery {
    pub languages: Vec<String>,
}

fn generate_typescript_client(spec: &OpenApiSpec) -> String {
    let mut client_code = String::new();
    
    client_code.push_str(&format!(
        "// Auto-generated TypeScript client for {} API\n",
        spec.info.title
    ));
    client_code.push_str("export class ApiClient {\n");
    client_code.push_str("  private baseUrl: string;\n");
    client_code.push_str("  private apiKey?: string;\n\n");
    client_code.push_str("  constructor(baseUrl: string, apiKey?: string) {\n");
    client_code.push_str("    this.baseUrl = baseUrl;\n");
    client_code.push_str("    this.apiKey = apiKey;\n");
    client_code.push_str("  }\n\n");
    
    // Generate methods for each endpoint
    for (path, path_item) in &spec.paths {
        if let Some(get_op) = &path_item.get {
            let method_name = format_operation_name("get", path);
            client_code.push_str(&format!(
                "  async {}() {{\n    const response = await fetch(`{{this.baseUrl}}{}`);",
                method_name, path
            ));
            client_code.push_str("\n    return response.json();\n  }\n\n");
        }
        
        if let Some(post_op) = &path_item.post {
            let method_name = format_operation_name("post", path);
            client_code.push_str(&format!(
                "  async {}(data?: any) {{\n    const response = await fetch(`{{this.baseUrl}}{}}`, {{\n      method: 'POST',\n      headers: {{\n        'Content-Type': 'application/json',\n        ...(this.apiKey && {{ 'Authorization': `Bearer ${{this.apiKey}}` }})\n      }},\n      body: JSON.stringify(data)\n    }});",
                method_name, path
            ));
            client_code.push_str("\n    return response.json();\n  }\n\n");
        }
    }
    
    client_code.push_str("}\n");
    client_code
}

fn generate_python_client(spec: &OpenApiSpec) -> String {
    format!(
        "# Auto-generated Python client for {} API\nimport requests\n\nclass ApiClient:\n    def __init__(self, base_url: str, api_key: str = None):\n        self.base_url = base_url\n        self.api_key = api_key\n        self.session = requests.Session()\n        if api_key:\n            self.session.headers.update({'Authorization': f'Bearer {{api_key}}'})\n",
        spec.info.title
    )
}

fn generate_javascript_client(spec: &OpenApiSpec) -> String {
    format!(
        "// Auto-generated JavaScript client for {} API\nclass ApiClient {{\n  constructor(baseUrl, apiKey) {{\n    this.baseUrl = baseUrl;\n    this.apiKey = apiKey;\n  }}\n}}",
        spec.info.title
    )
}

fn format_operation_name(method: &str, path: &str) -> String {
    let path_parts: Vec<&str> = path.split('/').filter(|s| !s.is_empty()).collect();
    let mut name = method.to_string();
    
    for part in path_parts {
        if part.starts_with('{') && part.ends_with('}') {
            name.push_str("ById");
        } else {
            name.push_str(&part.capitalize());
        }
    }
    
    name
}

pub async fn download_client_stub(
    Path(domain): Path<String>,
    Query(params): Query<DownloadStubQuery>,
) -> Result<axum::response::Response, axum::http::StatusCode> {
    let mut stubs_response = generate_client_stubs(Path(domain.to_string()), Query(params)).await?;
    let stubs = stubs_response["stubs"].as_object().unwrap();
    
    let stub_data = stubs.get(&params.language)
        .and_then(|s| s["content"].as_str())
        .ok_or(axum::http::StatusCode::NOT_FOUND)?;
    
    let filename = stubs.get(&params.language)
        .and_then(|s| s["filename"].as_str())
        .unwrap_or("client.txt");
    
    let headers = [
        ("Content-Type", "text/plain"),
        ("Content-Disposition", &format!("attachment; filename=&quot;{}&quot;", filename)),
    ];
    
    Ok(axum::response::Response::builder()
        .status(200)
        .header("Content-Type", "text/plain")
        .header("Content-Disposition", &format!("attachment; filename=&quot;{}&quot;", filename))
        .body(axum::body::Body::from(stub_data.to_string()))
        .unwrap())
}

#[derive(Debug, Deserialize)]
pub struct DownloadStubQuery {
    pub language: String,
}

use std::collections::HashSet;