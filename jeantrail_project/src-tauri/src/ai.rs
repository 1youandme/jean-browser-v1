use axum::{Json, extract::State};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;

#[derive(Debug, Deserialize)]
pub struct AIRequest {
    prompt: String,
    context_json: Option<String>,
    model: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct AIResponse {
    response: String,
    actions: Option<Vec<JeanAction>>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum JeanAction {
    OpenTab {
        target_bar: String,
        payload: serde_json::Value,
    },
    CloseTab {
        target_bar: String,
        payload: serde_json::Value,
    },
    Navigate {
        target_bar: String,
        payload: serde_json::Value,
    },
    OpenLocalPath {
        target_bar: String,
        payload: serde_json::Value,
    },
}

pub async fn generate_response(
    Json(request): Json<AIRequest>,
) -> Result<Json<AIResponse>, axum::http::StatusCode> {
    // Check if we should use cloud AI or local LLM
    let use_cloud_ai = std::env::var("USE_CLOUD_AI").unwrap_or_else(|_| "false".to_string()) == "true";
    
    let response = if use_cloud_ai {
        call_cloud_llm(&request).await
    } else {
        call_local_llm(&request).await
    };

    match response {
        Ok(ai_response) => Ok(Json(ai_response)),
        Err(e) => {
            tracing::error!("AI generation failed: {}", e);
            Err(axum::http::StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

async fn call_cloud_llm(request: &AIRequest) -> Result<AIResponse, Box<dyn std::error::Error>> {
    let cloud_endpoint = std::env::var("CLOUD_AI_ENDPOINT")?;
    let api_key = std::env::var("CLOUD_AI_API_KEY").ok();

    let client = reqwest::Client::new();
    let mut req_body = HashMap::new();
    req_body.insert("prompt", &request.prompt);
    if let Some(context) = &request.context_json {
        req_body.insert("context", context);
    }
    if let Some(model) = &request.model {
        req_body.insert("model", model);
    }

    let mut http_req = client.post(&cloud_endpoint).json(&req_body);
    if let Some(key) = api_key {
        http_req = http_req.header("Authorization", format!("Bearer {}", key));
    }

    let response: Value = http_req.send().await?.json().await?;
    
    // Parse response and extract actions
    let response_text = response["response"].as_str().unwrap_or("I'm sorry, I couldn't process that request.");
    let actions = extract_actions_from_response(&response);

    Ok(AIResponse {
        response: response_text.to_string(),
        actions: Some(actions),
    })
}

async fn call_local_llm(request: &AIRequest) -> Result<AIResponse, Box<dyn std::error::Error>> {
    let local_endpoint = std::env::var("LOCAL_LLM_ENDPOINT")
        .unwrap_or_else(|_| "http://localhost:8081/v1/chat/completions".to_string());

    let client = reqwest::Client::new();
    let req_body = serde_json::json!({
        "messages": [
            {
                "role": "system",
                "content": "You are Jean, an AI assistant for the JeanTrail Browser. Help users navigate and manage their browsing experience. When appropriate, suggest actions in JSON format."
            },
            {
                "role": "user", 
                "content": format!("{}\n\nContext: {}", request.prompt, request.context_json.as_deref().unwrap_or("None"))
            }
        ],
        "model": request.model.as_deref().unwrap_or("default"),
        "max_tokens": 1000
    });

    let response: Value = client.post(&local_endpoint).json(&req_body).send().await?.json().await?;
    
    let response_text = response["choices"][0]["message"]["content"]
        .as_str()
        .unwrap_or("I'm sorry, I couldn't process that request.");

    let actions = extract_actions_from_response(&response);

    Ok(AIResponse {
        response: response_text.to_string(),
        actions: Some(actions),
    })
}

fn extract_actions_from_response(response: &Value) -> Vec<JeanAction> {
    // Look for JSON actions in the response text
    // For now, return empty - this would be enhanced to parse actual actions
    Vec::new()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_ai_response_parsing() {
        let request = AIRequest {
            prompt: "Open a new tab".to_string(),
            context_json: None,
            model: None,
        };

        // Test would go here
    }
}