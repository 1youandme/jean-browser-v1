use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use std::collections::HashMap;
use tokio::sync::RwLock;
use std::sync::Arc;
use regex::Regex;

use crate::commands::{CommandResult, DatabasePool};

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "jean_language")]
pub enum JeanLanguage {
    #[sqlx(rename = "en")]
    English,
    #[sqlx(rename = "ar")]
    Arabic,
    #[sqlx(rename = "es")]
    Spanish,
    #[sqlx(rename = "zh")]
    Chinese,
    #[sqlx(rename = "fr")]
    French,
    #[sqlx(rename = "de")]
    German,
    #[sqlx(rename = "ja")]
    Japanese,
    #[sqlx(rename = "ko")]
    Korean,
    #[sqlx(rename = "pt")]
    Portuguese,
    #[sqlx(rename = "ru")]
    Russian,
    #[sqlx(rename = "it")]
    Italian,
    #[sqlx(rename = "hi")]
    Hindi,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct JeanDialect {
    pub id: Uuid,
    pub language_code: JeanLanguage,
    pub dialect_code: String,
    pub dialect_name: String,
    pub native_name: String,
    pub region: Option<String>,
    pub is_default_dialect: bool,
    pub tts_voice_id: Option<String>,
    pub stt_model_id: Option<String>,
    pub date_format: Option<String>,
    pub time_format: Option<String>,
    pub number_format: Option<String>,
    pub currency_format: Option<String>,
    pub text_direction: Option<String>,
    pub decimal_separator: Option<String>,
    pub thousands_separator: Option<String>,
    pub list_separator: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct JeanLanguagePreferences {
    pub id: Uuid,
    pub user_id: Uuid,
    pub primary_language: JeanLanguage,
    pub primary_dialect: Option<String>,
    pub secondary_languages: Vec<JeanLanguage>,
    pub secondary_dialects: Vec<String>,
    pub ui_language: JeanLanguage,
    pub ui_dialect: Option<String>,
    pub speech_language: JeanLanguage,
    pub speech_dialect: Option<String>,
    pub voice_tone: Option<String>,
    pub speech_rate: Option<rust_decimal::Decimal>,
    pub speech_pitch: Option<rust_decimal::Decimal>,
    pub formality_level: Option<String>,
    pub greeting_style: Option<String>,
    pub use_local_expressions: bool,
    pub respect_cultural_nuances: bool,
    pub auto_translate_responses: bool,
    pub show_original_text: bool,
    pub translation_confidence_threshold: Option<rust_decimal::Decimal>,
    pub timezone: Option<String>,
    pub date_format: Option<String>,
    pub time_format: Option<String>,
    pub number_format: Option<String>,
    pub currency_format: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct JeanMultilingualContent {
    pub id: Uuid,
    pub content_key: String,
    pub content_type: String,
    pub language: JeanLanguage,
    pub dialect_code: Option<String>,
    pub title: Option<String>,
    pub content: String,
    pub context: serde_json::Value,
    pub is_machine_translated: bool,
    pub translation_confidence: Option<rust_decimal::Decimal>,
    pub reviewed_by: Option<Uuid>,
    pub reviewed_at: Option<DateTime<Utc>>,
    pub formal_variant: Option<String>,
    pub casual_variant: Option<String>,
    pub cultural_notes: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct JeanConversationLanguage {
    pub id: Uuid,
    pub user_id: Uuid,
    pub session_id: Option<String>,
    pub detected_language: Option<JeanLanguage>,
    pub detected_dialect: Option<String>,
    pub detection_confidence: Option<rust_decimal::Decimal>,
    pub preferred_language: Option<JeanLanguage>,
    pub preferred_dialect: Option<String>,
    pub language_switches: serde_json::Value,
    pub response_quality_score: Option<rust_decimal::Decimal>,
    pub user_satisfaction_score: Option<rust_decimal::Decimal>,
    pub misunderstanding_count: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct JeanLanguageModel {
    pub id: Uuid,
    pub language: JeanLanguage,
    pub dialect_code: Option<String>,
    pub model_name: String,
    pub model_version: Option<String>,
    pub provider: String,
    pub system_prompt_template: Option<String>,
    pub temperature: Option<rust_decimal::Decimal>,
    pub max_tokens: Option<i32>,
    pub avg_response_time_ms: Option<i32>,
    pub quality_score: Option<rust_decimal::Decimal>,
    pub usage_count: i32,
    pub cultural_context_included: bool,
    pub local_knowledge_base: bool,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct JeanVoiceConfig {
    pub id: Uuid,
    pub language: JeanLanguage,
    pub dialect_code: Option<String>,
    pub voice_name: String,
    pub voice_provider: String,
    pub voice_gender: Option<String>,
    pub voice_age: Option<String>,
    pub sample_rate: Option<i32>,
    pub bit_rate: Option<i32>,
    pub audio_format: Option<String>,
    pub speaking_rate: Option<rust_decimal::Decimal>,
    pub pitch_variation: Option<rust_decimal::Decimal>,
    pub volume_level: Option<rust_decimal::Decimal>,
    pub naturalness_score: Option<rust_decimal::Decimal>,
    pub clarity_score: Option<rust_decimal::Decimal>,
    pub emotional_range: Option<rust_decimal::Decimal>,
    pub is_preferred: bool,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LanguageDetection {
    pub language: JeanLanguage,
    pub dialect: Option<String>,
    pub confidence: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LanguagePreferencesUpdate {
    pub primary_language: Option<JeanLanguage>,
    pub primary_dialect: Option<String>,
    pub ui_language: Option<JeanLanguage>,
    pub ui_dialect: Option<String>,
    pub speech_language: Option<JeanLanguage>,
    pub speech_dialect: Option<String>,
    pub voice_tone: Option<String>,
    pub speech_rate: Option<f64>,
    pub speech_pitch: Option<f64>,
    pub formality_level: Option<String>,
    pub use_local_expressions: Option<bool>,
    pub auto_translate_responses: Option<bool>,
    pub timezone: Option<String>,
}

#[derive(Debug, Clone)]
pub struct JeanMultilingual {
    db: Arc<DatabasePool>,
}

impl JeanMultilingual {
    pub fn new(db: Arc<DatabasePool>) -> Self {
        Self { db }
    }

    /// Get all available languages and their dialects
    pub async fn get_available_languages(&self) -> CommandResult<HashMap<JeanLanguage, Vec<JeanDialect>>> {
        let mut conn = self.db.acquire().await
            .map_err(|e| format!("Failed to get connection: {}", e))?;

        let dialects = sqlx::query_as!(
            JeanDialect,
            "SELECT * FROM jean_dialects ORDER BY language_code, is_default_dialect DESC, dialect_name"
        )
        .fetch_all(&mut *conn)
        .await
        .map_err(|e| format!("Failed to get dialects: {}", e))?;

        let mut languages: HashMap<JeanLanguage, Vec<JeanDialect>> = HashMap::new();
        for dialect in dialects {
            languages.entry(dialect.language_code.clone())
                .or_insert_with(Vec::new)
                .push(dialect);
        }

        Ok(languages)
    }

    /// Get user language preferences
    pub async fn get_user_preferences(&self, user_id: Uuid) -> CommandResult<Option<JeanLanguagePreferences>> {
        let mut conn = self.db.acquire().await
            .map_err(|e| format!("Failed to get connection: {}", e))?;

        let preferences = sqlx::query_as!(
            JeanLanguagePreferences,
            "SELECT * FROM jean_language_preferences WHERE user_id = $1",
            user_id
        )
        .fetch_optional(&mut *conn)
        .await
        .map_err(|e| format!("Failed to get user preferences: {}", e))?;

        Ok(preferences)
    }

    /// Update user language preferences
    pub async fn update_user_preferences(
        &self,
        user_id: Uuid,
        update: LanguagePreferencesUpdate,
    ) -> CommandResult<JeanLanguagePreferences> {
        let mut conn = self.db.acquire().await
            .map_err(|e| format!("Failed to get connection: {}", e))?;

        // Build dynamic update query
        let mut update_fields = Vec::new();
        let mut params: Vec<Box<dyn sqlx::Encode<'_, sqlx::Postgres> + Send + Sync>> = Vec::new();
        let mut param_index = 2;

        if let Some(primary_language) = update.primary_language {
            update_fields.push(format!("primary_language = ${}", param_index));
            params.push(Box::new(primary_language));
            param_index += 1;
        }

        if let Some(primary_dialect) = update.primary_dialect {
            update_fields.push(format!("primary_dialect = ${}", param_index));
            params.push(Box::new(primary_dialect));
            param_index += 1;
        }

        if let Some(ui_language) = update.ui_language {
            update_fields.push(format!("ui_language = ${}", param_index));
            params.push(Box::new(ui_language));
            param_index += 1;
        }

        if let Some(ui_dialect) = update.ui_dialect {
            update_fields.push(format!("ui_dialect = ${}", param_index));
            params.push(Box::new(ui_dialect));
            param_index += 1;
        }

        if let Some(voice_tone) = update.voice_tone {
            update_fields.push(format!("voice_tone = ${}", param_index));
            params.push(Box::new(voice_tone));
            param_index += 1;
        }

        if let Some(formality_level) = update.formality_level {
            update_fields.push(format!("formality_level = ${}", param_index));
            params.push(Box::new(formality_level));
            param_index += 1;
        }

        update_fields.push("updated_at = NOW()".to_string());

        let query = format!(
            "UPDATE jean_language_preferences SET {} WHERE user_id = $1 RETURNING *",
            update_fields.join(", ")
        );

        // Execute update with upsert logic
        let preferences = sqlx::query_as!(
            JeanLanguagePreferences,
            r#"
            INSERT INTO jean_language_preferences (user_id, primary_language, ui_language, speech_language, voice_tone, formality_level, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW())
            ON CONFLICT (user_id) 
            DO UPDATE SET 
                primary_language = COALESCE(EXCLUDED.primary_language, jean_language_preferences.primary_language),
                ui_language = COALESCE(EXCLUDED.ui_language, jean_language_preferences.ui_language),
                speech_language = COALESCE(EXCLUDED.speech_language, jean_language_preferences.speech_language),
                voice_tone = COALESCE(EXCLUDED.voice_tone, jean_language_preferences.voice_tone),
                formality_level = COALESCE(EXCLUDED.formality_level, jean_language_preferences.formality_level),
                updated_at = NOW()
            RETURNING *
            "#,
            user_id,
            update.primary_language.unwrap_or(JeanLanguage::English),
            update.ui_language.unwrap_or(JeanLanguage::English),
            update.speech_language.unwrap_or(JeanLanguage::English),
            update.voice_tone.unwrap_or("neutral".to_string()),
            update.formality_level.unwrap_or("neutral".to_string())
        )
        .fetch_one(&mut *conn)
        .await
        .map_err(|e| format!("Failed to update preferences: {}", e))?;

        Ok(preferences)
    }

    /// Detect language from text
    pub async fn detect_language(&self, text: &str, user_id: Option<Uuid>) -> CommandResult<LanguageDetection> {
        let mut conn = self.db.acquire().await
            .map_err(|e| format!("Failed to get connection: {}", e))?;

        let results = sqlx::query!(
            "SELECT * FROM detect_language($1, $2)",
            text,
            user_id
        )
        .fetch_all(&mut *conn)
        .await
        .map_err(|e| format!("Failed to detect language: {}", e))?;

        if let Some(result) = results.into_iter().next() {
            Ok(LanguageDetection {
                language: result.detected_language.unwrap_or(JeanLanguage::English),
                dialect: result.detected_dialect,
                confidence: result.confidence.unwrap_or(0.0) as f64,
            })
        } else {
            Ok(LanguageDetection {
                language: JeanLanguage::English,
                dialect: None,
                confidence: 0.5,
            })
        }
    }

    /// Get localized content
    pub async fn get_localized_content(
        &self,
        content_key: &str,
        language: JeanLanguage,
        dialect: Option<&str>,
        content_type: Option<&str>,
        formality_level: Option<&str>,
    ) -> CommandResult<Option<JeanMultilingualContent>> {
        let mut conn = self.db.acquire().await
            .map_err(|e| format!("Failed to get connection: {}", e))?;

        let content = sqlx::query_as!(
            JeanMultilingualContent,
            "SELECT * FROM get_localized_content($1, $2, $3, $4)",
            content_key,
            language as JeanLanguage,
            dialect,
            content_type
        )
        .fetch_optional(&mut *conn)
        .await
        .map_err(|e| format!("Failed to get localized content: {}", e))?;

        // If formality is specified, prefer the appropriate variant
        if let Some(ref content_item) = content {
            if let Some(formality) = formality_level {
                let variant_content = match formality {
                    "formal" => &content_item.formal_variant,
                    "casual" => &content_item.casual_variant,
                    _ => None,
                };

                if let Some(variant) = variant_content {
                    let mut modified_content = content_item.clone();
                    modified_content.content = variant.clone();
                    return Ok(Some(modified_content));
                }
            }
        }

        Ok(content)
    }

    /// Get language model configuration for a language
    pub async fn get_language_model(
        &self,
        language: JeanLanguage,
        dialect: Option<&str>,
    ) -> CommandResult<Option<JeanLanguageModel>> {
        let mut conn = self.db.acquire().await
            .map_err(|e| format!("Failed to get connection: {}", e))?;

        let model = sqlx::query_as!(
            JeanLanguageModel,
            r#"
            SELECT * FROM jean_language_models 
            WHERE language = $1 
                AND (dialect_code = $2 OR dialect_code IS NULL)
                AND is_active = TRUE
            ORDER BY 
                CASE WHEN dialect_code = $2 THEN 1 ELSE 2 END,
                quality_score DESC NULLS LAST
            LIMIT 1
            "#,
            language as JeanLanguage,
            dialect
        )
        .fetch_optional(&mut *conn)
        .await
        .map_err(|e| format!("Failed to get language model: {}", e))?;

        Ok(model)
    }

    /// Get voice configuration for TTS
    pub async fn get_voice_config(
        &self,
        language: JeanLanguage,
        dialect: Option<&str>,
        preferred_voice: Option<&str>,
    ) -> CommandResult<Option<JeanVoiceConfig>> {
        let mut conn = self.db.acquire().await
            .map_err(|e| format!("Failed to get connection: {}", e))?;

        let voice = sqlx::query_as!(
            JeanVoiceConfig,
            r#"
            SELECT * FROM jean_voice_configs 
            WHERE language = $1 
                AND (dialect_code = $2 OR dialect_code IS NULL)
                AND is_active = TRUE
                AND ($3::VARCHAR IS NULL OR voice_name = $3)
            ORDER BY 
                CASE WHEN voice_name = $3 THEN 1 ELSE 2 END,
                is_preferred DESC,
                naturalness_score DESC NULLS LAST
            LIMIT 1
            "#,
            language as JeanLanguage,
            dialect,
            preferred_voice
        )
        .fetch_optional(&mut *conn)
        .await
        .map_err(|e| format!("Failed to get voice config: {}", e))?;

        Ok(voice)
    }

    /// Update conversation language context
    pub async fn update_conversation_language(
        &self,
        user_id: Uuid,
        session_id: Option<&str>,
        detected_language: JeanLanguage,
        detected_dialect: Option<&str>,
        confidence: f64,
        preferred_language: Option<JeanLanguage>,
        preferred_dialect: Option<&str>,
    ) -> CommandResult<JeanConversationLanguage> {
        let mut conn = self.db.acquire().await
            .map_err(|e| format!("Failed to get connection: {}", e))?;

        let context = sqlx::query_as!(
            JeanConversationLanguage,
            r#"
            INSERT INTO jean_conversation_language (
                user_id, session_id, detected_language, detected_dialect,
                detection_confidence, preferred_language, preferred_dialect
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (user_id, COALESCE(session_id, '')) 
            DO UPDATE SET 
                detected_language = EXCLUDED.detected_language,
                detected_dialect = EXCLUDED.detected_dialect,
                detection_confidence = EXCLUDED.detection_confidence,
                preferred_language = EXCLUDED.preferred_language,
                preferred_dialect = EXCLUDED.preferred_dialect,
                updated_at = NOW()
            RETURNING *
            "#,
            user_id,
            session_id.unwrap_or(""),
            detected_language as JeanLanguage,
            detected_dialect,
            confidence as rust_decimal::Decimal,
            preferred_language as JeanLanguage,
            preferred_dialect
        )
        .fetch_one(&mut *conn)
        .await
        .map_err(|e| format!("Failed to update conversation language: {}", e))?;

        Ok(context)
    }

    /// Add or update multilingual content
    pub async fn upsert_content(
        &self,
        content_key: &str,
        content_type: &str,
        language: JeanLanguage,
        dialect: Option<&str>,
        title: Option<&str>,
        content: &str,
        formal_variant: Option<&str>,
        casual_variant: Option<&str>,
        cultural_notes: Option<&str>,
        context: Option<serde_json::Value>,
    ) -> CommandResult<JeanMultilingualContent> {
        let mut conn = self.db.acquire().await
            .map_err(|e| format!("Failed to get connection: {}", e))?;

        let multilingual_content = sqlx::query_as!(
            JeanMultilingualContent,
            r#"
            INSERT INTO jean_multilingual_content (
                content_key, content_type, language, dialect_code, title, content,
                formal_variant, casual_variant, cultural_notes, context
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            ON CONFLICT (content_key, language, COALESCE(dialect_code, ''))
            DO UPDATE SET 
                title = EXCLUDED.title,
                content = EXCLUDED.content,
                formal_variant = EXCLUDED.formal_variant,
                casual_variant = EXCLUDED.casual_variant,
                cultural_notes = EXCLUDED.cultural_notes,
                context = EXCLUDED.context,
                updated_at = NOW()
            RETURNING *
            "#,
            content_key,
            content_type,
            language as JeanLanguage,
            dialect,
            title,
            content,
            formal_variant,
            casual_variant,
            cultural_notes,
            context.unwrap_or_default()
        )
        .fetch_one(&mut *conn)
        .await
        .map_err(|e| format!("Failed to upsert content: {}", e))?;

        Ok(multilingual_content)
    }

    /// Format content according to user's language preferences
    pub async fn format_content_for_user(
        &self,
        user_id: Uuid,
        content: &str,
        content_type: &str,
    ) -> CommandResult<String> {
        let preferences = self.get_user_preferences(user_id).await?;
        
        if let Some(prefs) = preferences {
            // Get localized content if available
            if let Some(localized) = self.get_localized_content(
                content,
                prefs.ui_language,
                prefs.ui_dialect.as_deref(),
                Some(content_type),
                prefs.formality_level.as_deref(),
            ).await? {
                return Ok(localized.content);
            }
        }

        // Fallback to original content
        Ok(content.to_string())
    }

    /// Get language-specific system prompt
    pub async fn get_system_prompt(
        &self,
        language: JeanLanguage,
        dialect: Option<&str>,
        user_preferences: Option<&JeanLanguagePreferences>,
    ) -> CommandResult<String> {
        // Try to get language model configuration
        if let Some(model) = self.get_language_model(language, dialect).await? {
            if let Some(template) = model.system_prompt_template {
                return Ok(template);
            }
        }

        // Fallback to default prompts
        let base_prompt = match language {
            JeanLanguage::English => "You are Jean, a helpful AI assistant. Respond in clear, natural English.",
            JeanLanguage::Arabic => "أنت جان، مساعد ذكي مفيد. استجب باللغة العربية الواضحة والطبيعية.",
            JeanLanguage::Spanish => "Eres Jean, un asistente de IA útil. Responde en español claro y natural.",
            JeanLanguage::Chinese => "你是Jean，一个有用的AI助手。请用清晰自然的中文回答。",
            _ => "You are Jean, a helpful AI assistant. Please respond in the user's preferred language.",
        };

        // Customize based on user preferences
        if let Some(prefs) = user_preferences {
            let mut customized_prompt = base_prompt.to_string();

            if let Some(formality) = prefs.formality_level.as_deref() {
                match formality {
                    "formal" => customized_prompt += " Use formal language.",
                    "casual" => customized_prompt += " Use casual, friendly language.",
                    _ => {}
                }
            }

            if prefs.use_local_expressions {
                customized_prompt += " Include local expressions and cultural references when appropriate.";
            }

            if prefs.respect_cultural_nuances {
                customized_prompt += " Be mindful of cultural nuances and context.";
            }

            Ok(customized_prompt)
        } else {
            Ok(base_prompt.to_string())
        }
    }

    /// Get supported languages with their properties
    pub async fn get_supported_languages(&self) -> CommandResult<Vec<JeanLanguage>> {
        let mut conn = self.db.acquire().await
            .map_err(|e| format!("Failed to get connection: {}", e))?;

        let languages = sqlx::query!(
            "SELECT DISTINCT language_code FROM jean_dialects ORDER BY language_code"
        )
        .fetch_all(&mut *conn)
        .await
        .map_err(|e| format!("Failed to get supported languages: {}", e))?;

        let supported_languages = languages.into_iter()
            .filter_map(|row| row.language_code)
            .collect();

        Ok(supported_languages)
    }

    /// Get dialects for a specific language
    pub async fn get_dialects_for_language(&self, language: JeanLanguage) -> CommandResult<Vec<JeanDialect>> {
        let mut conn = self.db.acquire().await
            .map_err(|e| format!("Failed to get connection: {}", e))?;

        let dialects = sqlx::query_as!(
            JeanDialect,
            "SELECT * FROM jean_dialects WHERE language_code = $1 ORDER BY is_default_dialect DESC, dialect_name",
            language as JeanLanguage
        )
        .fetch_all(&mut *conn)
        .await
        .map_err(|e| format!("Failed to get dialects: {}", e))?;

        Ok(dialects)
    }

    /// Get language statistics for analytics
    pub async fn get_language_usage_stats(&self, days_back: i32) -> CommandResult<serde_json::Value> {
        let mut conn = self.db.acquire().await
            .map_err(|e| format!("Failed to get connection: {}", e))?;

        let cutoff_date = Utc::now() - chrono::Duration::days(days_back as i64);

        // Usage by language
        let language_usage = sqlx::query!(
            r#"
            SELECT 
                detected_language,
                COUNT(*) as usage_count,
                AVG(detection_confidence) as avg_confidence
            FROM jean_conversation_language
            WHERE created_at >= $1 AND detected_language IS NOT NULL
            GROUP BY detected_language
            ORDER BY usage_count DESC
            "#,
            cutoff_date
        )
        .fetch_all(&mut *conn)
        .await
        .map_err(|e| format!("Failed to get language usage: {}", e))?;

        // User preferences distribution
        let preference_distribution = sqlx::query!(
            r#"
            SELECT 
                primary_language,
                COUNT(*) as user_count
            FROM jean_language_preferences
            GROUP BY primary_language
            ORDER BY user_count DESC
            "#
        )
        .fetch_all(&mut *conn)
        .await
        .map_err(|e| format!("Failed to get preference distribution: {}", e))?;

        let stats = serde_json::json!({
            "language_usage": language_usage.into_iter().map(|r| serde_json::json!({
                "language": r.detected_language,
                "usage_count": r.usage_count.unwrap_or(0),
                "avg_confidence": r.avg_confidence.unwrap_or(0.0)
            })).collect::<Vec<_>>(),
            "preference_distribution": preference_distribution.into_iter().map(|r| serde_json::json!({
                "language": r.primary_language,
                "user_count": r.user_count.unwrap_or(0)
            })).collect::<Vec<_>>(),
            "period_days": days_back
        });

        Ok(stats)
    }
}