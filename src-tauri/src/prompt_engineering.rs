use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::collections::HashMap;
use anyhow::Result;
use sqlx::{PgPool, Row};
use uuid::Uuid;
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PromptTemplate {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub category: String,
    pub template_text: String,
    pub variables: Value,
    pub default_model: Option<String>,
    pub model_settings: Option<Value>,
    pub usage_count: i64,
    pub rating: Option<f64>,
    pub is_system: bool,
    pub is_public: bool,
    pub created_by: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PromptContext {
    pub user_id: Uuid,
    pub user_name: Option<String>,
    pub detected_language: String,
    pub current_tab: String,
    pub recent_activity: Vec<String>,
    pub user_preferences: HashMap<String, Value>,
    pub session_context: HashMap<String, Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PromptRequest {
    pub template_name: String,
    pub variables: HashMap<String, Value>,
    pub context: Option<PromptContext>,
    pub model_override: Option<String>,
    pub model_settings_override: Option<Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PromptResponse {
    pub formatted_prompt: String,
    pub template: PromptTemplate,
    pub model_name: String,
    pub model_settings: Value,
    pub estimated_tokens: u32,
    pub estimated_cost_cents: u32,
}

pub struct PromptEngineeringService {
    db: PgPool,
    templates: HashMap<String, PromptTemplate>,
    context_cache: HashMap<Uuid, PromptContext>,
}

impl PromptEngineeringService {
    pub fn new(db: PgPool) -> Self {
        Self {
            db,
            templates: HashMap::new(),
            context_cache: HashMap::new(),
        }
    }

    pub async fn load_templates(&mut self) -> Result<()> {
        let rows = sqlx::query!(
            r#"
            SELECT id, name, description, category, template_text, variables, 
                   default_model, model_settings, usage_count, rating, 
                   is_system, is_public, created_by, created_at, updated_at
            FROM ai_prompt_templates
            ORDER BY is_system DESC, usage_count DESC
            "#
        )
        .fetch_all(&self.db)
        .await?;

        self.templates.clear();
        
        for row in rows {
            let template = PromptTemplate {
                id: row.id,
                name: row.name,
                description: row.description,
                category: row.category,
                template_text: row.template_text,
                variables: row.variables,
                default_model: row.default_model,
                model_settings: row.model_settings,
                usage_count: row.usage_count.unwrap_or(0),
                rating: row.rating,
                is_system: row.is_system,
                is_public: row.is_public,
                created_by: row.created_by,
                created_at: row.created_at,
                updated_at: row.updated_at,
            };
            
            self.templates.insert(template.name.clone(), template);
        }

        tracing::info!("Loaded {} prompt templates", self.templates.len());
        Ok(())
    }

    pub async fn get_template(&self, name: &str) -> Option<&PromptTemplate> {
        self.templates.get(name)
    }

    pub async fn format_prompt(&mut self, request: PromptRequest) -> Result<PromptResponse> {
        let template = self.templates.get(&request.template_name)
            .ok_or_else(|| anyhow::anyhow!("Template '{}' not found", request.template_name))?;

        // Merge context variables with provided variables
        let mut all_variables = request.variables.clone();
        
        if let Some(context) = &request.context {
            all_variables.insert("user_name".to_string(), 
                json!(context.user_name.as_deref().unwrap_or("User")));
            all_variables.insert("detected_language".to_string(), 
                json!(context.detected_language));
            all_variables.insert("current_tab".to_string(), 
                json!(context.current_tab));
            all_variables.insert("recent_activity".to_string(), 
                json!(context.recent_activity.join(", ")));
            
            // Add user preferences
            for (key, value) in &context.user_preferences {
                all_variables.insert(format!("user_{}", key), value.clone());
            }
            
            // Add session context
            for (key, value) in &context.session_context {
                all_variables.insert(format!("session_{}", key), value.clone());
            }
        }

        // Format the prompt
        let formatted_prompt = self.replace_variables(&template.template_text, &all_variables)?;

        // Determine model and settings
        let model_name = request.model_override
            .or(template.default_model.clone())
            .unwrap_or_else(|| "qwen-3-72b".to_string());
        
        let model_settings = request.model_settings_override
            .or(template.model_settings.clone())
            .unwrap_or_else(|| json!({
                "temperature": 0.7,
                "max_tokens": 2048,
                "top_p": 0.95,
                "top_k": 40
            }));

        // Estimate tokens and cost
        let estimated_tokens = self.estimate_tokens(&formatted_prompt);
        let estimated_cost_cents = self.estimate_cost(&model_name, estimated_tokens);

        // Update usage count
        self.increment_template_usage(&template.id).await?;

        Ok(PromptResponse {
            formatted_prompt,
            template: template.clone(),
            model_name,
            model_settings,
            estimated_tokens,
            estimated_cost_cents,
        })
    }

    fn replace_variables(&self, template: &str, variables: &HashMap<String, Value>) -> Result<String> {
        let mut result = template.to_string();
        
        for (key, value) in variables {
            let placeholder = format!("{{{}}}", key);
            let replacement = match value {
                Value::String(s) => s.clone(),
                Value::Number(n) => n.to_string(),
                Value::Bool(b) => b.to_string(),
                Value::Null => String::new(),
                _ => serde_json::to_string(value).unwrap_or_default(),
            };
            
            result = result.replace(&placeholder, &replacement);
        }

        // Handle conditional blocks {#if variable} ... {/if}
        result = self.process_conditionals(&result, variables)?;

        // Handle loops {#each items} ... {/each}
        result = self.process_loops(&result, variables)?;

        Ok(result)
    }

    fn process_conditionals(&self, template: &str, variables: &HashMap<String, Value>) -> Result<String> {
        // Simple conditional processing
        // {#if variable}content{/if} -> content if variable exists and is truthy
        let mut result = template.to_string();
        
        // This is a simplified implementation - in production, use a proper template engine
        let re = regex::Regex::new(r"\{#if\s+(\w+)\}(.*?)\{/if\}").unwrap();
        
        for caps in re.captures_iter(template) {
            let var_name = caps.get(1).unwrap().as_str();
            let content = caps.get(2).unwrap().as_str();
            
            let should_include = variables.get(var_name)
                .map(|v| self.is_truthy(v))
                .unwrap_or(false);
            
            let replacement = if should_include { content } else { "" };
            result = result.replace(&caps.get(0).unwrap().as_str(), replacement);
        }

        Ok(result)
    }

    fn process_loops(&self, template: &str, variables: &HashMap<String, Value>) -> Result<String> {
        // Simple loop processing
        // {#each items}- {item} {/each} -> - item1 - item2 ...
        let mut result = template.to_string();
        
        let re = regex::Regex::new(r"\{#each\s+(\w+)\}(.*?)\{/each\}").unwrap();
        
        for caps in re.captures_iter(template) {
            let var_name = caps.get(1).unwrap().as_str();
            let content = caps.get(2).unwrap().as_str();
            
            let loop_result = if let Some(array) = variables.get(var_name).and_then(|v| v.as_array()) {
                let mut items = Vec::new();
                for item in array {
                    let item_str = match item {
                        Value::String(s) => s.clone(),
                        _ => item.to_string(),
                    };
                    let item_content = content.replace("{item}", &item_str);
                    items.push(item_content);
                }
                items.join("")
            } else {
                String::new()
            };
            
            result = result.replace(&caps.get(0).unwrap().as_str(), &loop_result);
        }

        Ok(result)
    }

    fn is_truthy(&self, value: &Value) -> bool {
        match value {
            Value::Bool(b) => *b,
            Value::Null => false,
            Value::Number(n) => n.as_f64().unwrap_or(0.0) != 0.0,
            Value::String(s) => !s.is_empty(),
            Value::Array(a) => !a.is_empty(),
            Value::Object(o) => !o.is_empty(),
        }
    }

    fn estimate_tokens(&self, text: &str) -> u32 {
        // Simple token estimation: roughly 4 characters = 1 token
        // This is a rough approximation - use proper tokenizer in production
        ((text.len() as f32) / 4.0) as u32
    }

    fn estimate_cost(&self, model_name: &str, tokens: u32) -> u32 {
        // Cost estimation based on model
        let cost_per_token = match model_name {
            "qwen-3-72b" => 0.001, // $0.001 per token
            "qwen-3-32b" => 0.0005,
            "sdxl" => 0.05, // Per image, not per token
            _ => 0.001,
        };
        
        ((tokens as f64) * cost_per_token * 100.0) as u32 // Convert to cents
    }

    async fn increment_template_usage(&self, template_id: &Uuid) -> Result<()> {
        sqlx::query!(
            "UPDATE ai_prompt_templates SET usage_count = usage_count + 1, updated_at = NOW() WHERE id = $1",
            template_id
        )
        .execute(&self.db)
        .await?;
        
        Ok(())
    }

    pub async fn log_prompt_usage(
        &self,
        job_id: &Uuid,
        template_id: Option<&Uuid>,
        user_id: &Uuid,
        prompt_text: &str,
        variables: &HashMap<String, Value>,
        model_name: &str,
        success: bool,
    ) -> Result<()> {
        sqlx::query!(
            r#"
            INSERT INTO ai_prompt_usage (
                job_id, template_id, user_id, prompt_text, variables_values,
                model_name, model_version, success
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            "#,
            job_id,
            template_id,
            user_id,
            prompt_text,
            serde_json::to_value(variables)?,
            model_name,
            "latest", // Should be dynamic
            success
        )
        .execute(&self.db)
        .await?;
        
        Ok(())
    }

    pub async fn get_templates_by_category(&self, category: &str) -> Vec<&PromptTemplate> {
        self.templates
            .values()
            .filter(|t| t.category == category)
            .collect()
    }

    pub async fn search_templates(&self, query: &str) -> Vec<&PromptTemplate> {
        let query_lower = query.to_lowercase();
        self.templates
            .values()
            .filter(|t| {
                t.name.to_lowercase().contains(&query_lower) ||
                t.description.as_ref().map(|d| d.to_lowercase().contains(&query_lower)).unwrap_or(false) ||
                t.category.to_lowercase().contains(&query_lower)
            })
            .collect()
    }

    pub async fn create_template(
        &self,
        name: &str,
        description: Option<&str>,
        category: &str,
        template_text: &str,
        variables: Value,
        user_id: Uuid,
    ) -> Result<Uuid> {
        let id = Uuid::new_v4();
        
        sqlx::query!(
            r#"
            INSERT INTO ai_prompt_templates (
                id, name, description, category, template_text, variables,
                is_system, is_public, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            "#,
            id,
            name,
            description,
            category,
            template_text,
            variables,
            false,
            false,
            user_id
        )
        .execute(&self.db)
        .await?;
        
        Ok(id)
    }

    pub async fn update_template_rating(&self, template_id: &Uuid, rating: i32, feedback: Option<&str>) -> Result<()> {
        sqlx::query!(
            r#"
            INSERT INTO ai_prompt_usage (template_id, user_rating, feedback, created_at)
            VALUES ($1, $2, $3, NOW())
            "#,
            template_id,
            rating,
            feedback
        )
        .execute(&self.db)
        .await?;

        // Update average rating
        sqlx::query!(
            r#"
            UPDATE ai_prompt_templates 
            SET rating = (
                SELECT COALESCE(AVG(user_rating), 0) 
                FROM ai_prompt_usage 
                WHERE template_id = $1 AND user_rating IS NOT NULL
            ),
            updated_at = NOW()
            WHERE id = $1
            "#,
            template_id
        )
        .execute(&self.db)
        .await?;
        
        Ok(())
    }
}

// Predefined prompt builders for common use cases
impl PromptEngineeringService {
    pub async fn build_jean_core_prompt(
        &mut self,
        user_query: &str,
        context: &PromptContext,
    ) -> Result<PromptResponse> {
        let mut variables = HashMap::new();
        variables.insert("user_query".to_string(), json!(user_query));
        
        self.format_prompt(PromptRequest {
            template_name: "jean_core".to_string(),
            variables,
            context: Some(context.clone()),
            model_override: None,
            model_settings_override: None,
        }).await
    }

    pub async fn build_price_intelligence_prompt(
        &mut self,
        alibaba_price: f64,
        amazon_price: f64,
        weight: f64,
        has_free_shipping: bool,
        context: Option<PromptContext>,
    ) -> Result<PromptResponse> {
        let mut variables = HashMap::new();
        variables.insert("alibaba_price".to_string(), json!(alibaba_price));
        variables.insert("amazon_price".to_string(), json!(amazon_price));
        variables.insert("weight".to_string(), json!(weight));
        variables.insert("has_free_shipping".to_string(), json!(has_free_shipping));
        
        self.format_prompt(PromptRequest {
            template_name: "price_intelligence".to_string(),
            variables,
            context,
            model_override: None,
            model_settings_override: None,
        }).await
    }

    pub async fn build_mobile_emulator_prompt(
        &mut self,
        query: &str,
        context: &PromptContext,
    ) -> Result<PromptResponse> {
        let mut variables = HashMap::new();
        variables.insert("query".to_string(), json!(query));
        
        self.format_prompt(PromptRequest {
            template_name: "mobile_emulator".to_string(),
            variables,
            context: Some(context.clone()),
            model_override: None,
            model_settings_override: Some(json!({
                "temperature": 0.3,
                "max_tokens": 150
            })),
        }).await
    }

    pub async fn build_sdxl_image_prompt(
        &mut self,
        subject: &str,
        style: Option<&str>,
        lighting: Option<&str>,
        composition: Option<&str>,
        quality: Option<&str>,
        negative_prompt: Option<&str>,
    ) -> Result<PromptResponse> {
        let mut variables = HashMap::new();
        variables.insert("subject".to_string(), json!(subject));
        variables.insert("style".to_string(), json!(style.unwrap_or("photorealistic")));
        variables.insert("lighting".to_string(), json!(lighting.unwrap_or("natural lighting")));
        variables.insert("composition".to_string(), json!(composition.unwrap_or("centered")));
        variables.insert("quality".to_string(), json!(quality.unwrap_or("high quality")));
        variables.insert("negative_prompt".to_string(), json!(negative_prompt.unwrap_or("blurry, low quality")));
        
        self.format_prompt(PromptRequest {
            template_name: "sdxl_image".to_string(),
            variables,
            context: None,
            model_override: Some("sdxl".to_string()),
            model_settings_override: Some(json!({
                "num_inference_steps": 20,
                "guidance_scale": 7.5,
                "width": 1024,
                "height": 1024
            })),
        }).await
    }

    pub async fn build_context_aware_prompt(
        &mut self,
        base_query: &str,
        context: &PromptContext,
        custom_template: Option<&str>,
    ) -> Result<PromptResponse> {
        let template_name = custom_template.unwrap_or("jean_core");
        
        let mut variables = HashMap::new();
        variables.insert("base_query".to_string(), json!(base_query));
        variables.insert("timestamp".to_string(), json!(Utc::now().to_rfc3339()));
        
        // Add relevant context based on current tab
        match context.current_tab.as_str() {
            "web_browser" => {
                variables.insert("browser_context".to_string(), json!("User is actively browsing websites"));
            }
            "local_desktop" => {
                variables.insert("desktop_context".to_string(), json!("User is working with local files and applications"));
            }
            "proxy_network" => {
                variables.insert("proxy_context".to_string(), json!("User is using secure proxy network connections"));
            }
            "mobile_emulator" => {
                variables.insert("mobile_context".to_string(), json!("User is interacting with mobile app emulator"));
            }
            _ => {}
        }
        
        self.format_prompt(PromptRequest {
            template_name: template_name.to_string(),
            variables,
            context: Some(context.clone()),
            model_override: None,
            model_settings_override: None,
        }).await
    }
}