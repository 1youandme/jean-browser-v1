// Loyalty / Points / Tokenomics Module
use axum::{Json, extract::{Path, Query, State}};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use uuid::Uuid;
use chrono::{DateTime, Utc};
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct LoyaltyLedger {
    pub id: Uuid,
    pub user_id: Uuid,
    pub transaction_type: String,
    pub source: String,
    pub points: i32,
    pub direction: Direction,
    pub balance_after: i32,
    pub description: Option<String>,
    pub reference_id: Option<Uuid>,
    pub metadata: Value,
    pub expires_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "varchar")]
pub enum Direction {
    #[serde(rename = "earn")]
    Earn,
    #[serde(rename = "spend")]
    Spend,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Reward {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub points_cost: i32,
    pub reward_type: String,
    pub reward_value: Value,
    pub is_active: bool,
    pub quantity_available: Option<i32>,
    pub valid_until: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct UserReward {
    pub id: Uuid,
    pub user_id: Uuid,
    pub reward_id: Uuid,
    pub points_used: i32,
    pub status: String,
    pub claimed_at: DateTime<Utc>,
    pub used_at: Option<DateTime<Utc>>,
    pub expires_at: Option<DateTime<Utc>>,
    pub metadata: Value,
}

#[derive(Debug, Deserialize)]
pub struct EarnPointsRequest {
    pub user_id: Uuid,
    pub source: String,
    pub transaction_type: String,
    pub points: i32,
    pub description: Option<String>,
    pub reference_id: Option<Uuid>,
    pub metadata: Option<Value>,
    pub expires_days: Option<i32>, // Points expire after N days
}

#[derive(Debug, Deserialize)]
pub struct RedeemRewardRequest {
    pub user_id: Uuid,
    pub reward_id: Uuid,
    pub metadata: Option<Value>,
}

#[derive(Debug, Deserialize)]
pub struct CreateRewardRequest {
    pub name: String,
    pub description: Option<String>,
    pub points_cost: i32,
    pub reward_type: String,
    pub reward_value: Value,
    pub quantity_available: Option<i32>,
    pub valid_until: Option<DateTime<Utc>>,
}

pub async fn get_user_points_balance(
    Path(user_id): Path<Uuid>,
) -> Result<Json<Value>, axum::http::StatusCode> {
    // Calculate current balance from ledger
    let balance = get_user_balance(user_id).await.unwrap_or(0);
    
    Ok(Json(serde_json::json!({
        "user_id": user_id,
        "current_balance": balance,
        "earned_lifetime": 1250,
        "spent_lifetime": 320,
        "expiring_soon": 50,
        "next_expiration": "2024-02-15T00:00:00Z"
    })))
}

async fn get_user_balance(user_id: Uuid) -> Option<i32> {
    // Query loyalty_ledger for latest balance
    Some(930) // Mock balance
}

pub async fn earn_points(
    Json(request): Json<EarnPointsRequest>,
) -> Result<Json<LoyaltyLedger>, axum::http::StatusCode> {
    let current_balance = get_user_balance(request.user_id).await.unwrap_or(0);
    let new_balance = current_balance + request.points;
    
    let expires_at = request.expires_days.map(|days| {
        Utc::now() + chrono::Duration::days(days as i64)
    });

    let ledger_entry = LoyaltyLedger {
        id: Uuid::new_v4(),
        user_id: request.user_id,
        transaction_type: request.transaction_type,
        source: request.source,
        points: request.points,
        direction: Direction::Earn,
        balance_after: new_balance,
        description: request.description,
        reference_id: request.reference_id,
        metadata: request.metadata.unwrap_or_else(|| serde_json::json!({})),
        expires_at,
        created_at: Utc::now(),
    };

    // Save to database and update user balance
    Ok(Json(ledger_entry))
}

pub async fn spend_points(
    Path(user_id): Path<Uuid>,
    Json(request): Json<serde_json::Value>,
) -> Result<Json<Value>, axum::http::StatusCode> {
    let points_to_spend: i32 = request["points"].as_i64().unwrap_or(0) as i32;
    let current_balance = get_user_balance(user_id).await.unwrap_or(0);
    
    if current_balance < points_to_spend {
        return Err(axum::http::StatusCode::BAD_REQUEST);
    }

    let new_balance = current_balance - points_to_spend;
    
    // Create ledger entry for spending
    let ledger_entry = LoyaltyLedger {
        id: Uuid::new_v4(),
        user_id,
        transaction_type: "spend".to_string(),
        source: "redemption".to_string(),
        points: points_to_spend,
        direction: Direction::Spend,
        balance_after: new_balance,
        description: request["description"].as_str().map(|s| s.to_string()),
        reference_id: None,
        metadata: request,
        expires_at: None,
        created_at: Utc::now(),
    };

    // Save to database
    Ok(Json(serde_json::json!({
        "success": true,
        "new_balance": new_balance,
        "points_spent": points_to_spend,
        "ledger_entry": ledger_entry
    })))
}

pub async fn get_user_transaction_history(
    Path(user_id): Path<Uuid>,
    Query(params): Query<TransactionHistoryQuery>,
) -> Result<Json<Vec<LoyaltyLedger>>, axum::http::StatusCode> {
    // Query user's transaction history
    let mock_history = vec![
        LoyaltyLedger {
            id: Uuid::new_v4(),
            user_id,
            transaction_type: "daily_login".to_string(),
            source: "engagement".to_string(),
            points: 10,
            direction: Direction::Earn,
            balance_after: 940,
            description: Some("Daily login bonus".to_string()),
            reference_id: None,
            metadata: serde_json::json!({}),
            expires_at: None,
            created_at: Utc::now(),
        }
    ];

    Ok(Json(mock_history))
}

#[derive(Debug, Deserialize)]
pub struct TransactionHistoryQuery {
    pub limit: Option<i64>,
    pub offset: Option<i64>,
    pub source: Option<String>,
    pub direction: Option<Direction>,
}

pub async fn list_rewards(
    Query(params): Query<ListRewardsQuery>,
) -> Result<Json<Vec<Reward>>, axum::http::StatusCode> {
    let mock_rewards = vec![
        Reward {
            id: Uuid::new_v4(),
            name: "Pro Features Unlock".to_string(),
            description: Some("Unlock all premium features for 30 days".to_string()),
            points_cost: 500,
            reward_type: "feature_unlock".to_string(),
            reward_value: serde_json::json!({
                "feature": "pro_features",
                "duration_days": 30
            }),
            is_active: true,
            quantity_available: None,
            valid_until: None,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        },
        Reward {
            id: Uuid::new_v4(),
            name: "ChatGPT Integration".to_string(),
            description: Some("100 API calls to ChatGPT".to_string()),
            points_cost: 200,
            reward_type: "api_credits".to_string(),
            reward_value: serde_json::json!({
                "provider": "openai",
                "calls": 100
            }),
            is_active: true,
            quantity_available: Some(1000),
            valid_until: None,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        }
    ];

    Ok(Json(mock_rewards))
}

#[derive(Debug, Deserialize)]
pub struct ListRewardsQuery {
    pub is_active: Option<bool>,
    pub reward_type: Option<String>,
    pub min_points: Option<i32>,
    pub max_points: Option<i32>,
}

pub async fn redeem_reward(
    Json(request): Json<RedeemRewardRequest>,
) -> Result<Json<UserReward>, axum::http::StatusCode> {
    // Check if user has enough points
    let current_balance = get_user_balance(request.user_id).await.unwrap_or(0);
    
    // Get reward details (mock)
    let reward_points_cost = 500; // Would fetch from database
    
    if current_balance < reward_points_cost {
        return Err(axum::http::StatusCode::BAD_REQUEST);
    }

    // Create user reward record
    let user_reward = UserReward {
        id: Uuid::new_v4(),
        user_id: request.user_id,
        reward_id: request.reward_id,
        points_used: reward_points_cost,
        status: "claimed".to_string(),
        claimed_at: Utc::now(),
        used_at: None,
        expires_at: None,
        metadata: request.metadata.unwrap_or_else(|| serde_json::json!({})),
    };

    // Deduct points from user balance
    // Save records to database

    Ok(Json(user_reward))
}

pub async fn get_user_rewards(
    Path(user_id): Path<Uuid>,
) -> Result<Json<Vec<UserReward>>, axum::http::StatusCode> {
    // Get user's redeemed rewards
    let mock_rewards = vec![];
    Ok(Json(mock_rewards))
}

pub async fn create_reward(
    Json(request): Json<CreateRewardRequest>,
) -> Result<Json<Reward>, axum::http::StatusCode> {
    let new_reward = Reward {
        id: Uuid::new_v4(),
        name: request.name,
        description: request.description,
        points_cost: request.points_cost,
        reward_type: request.reward_type,
        reward_value: request.reward_value,
        is_active: true,
        quantity_available: request.quantity_available,
        valid_until: request.valid_until,
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };

    // Save to database
    Ok(Json(new_reward))
}

// Points earning triggers
pub async fn trigger_daily_login_bonus(user_id: Uuid) -> Result<(), Box<dyn std::error::Error>> {
    let earn_request = EarnPointsRequest {
        user_id,
        source: "engagement".to_string(),
        transaction_type: "daily_login".to_string(),
        points: 10,
        description: Some("Daily login bonus".to_string()),
        reference_id: None,
        metadata: Some(serde_json::json!({"trigger": "daily_login"})),
        expires_days: Some(365), // Points expire after 1 year
    };

    // Call earn_points function
    Ok(())
}

pub async fn trigger_referral_bonus(referrer_id: Uuid, referred_id: Uuid) -> Result<(), Box<dyn std::error::Error>> {
    let earn_request = EarnPointsRequest {
        user_id: referrer_id,
        source: "referral".to_string(),
        transaction_type: "referral_success".to_string(),
        points: 100,
        description: Some("Referral bonus - new user joined".to_string()),
        reference_id: Some(referred_id),
        metadata: Some(serde_json::json!({"referred_user": referred_id})),
        expires_days: Some(365),
    };

    // Call earn_points function
    Ok(())
}

pub async fn trigger_content_creation_bonus(user_id: Uuid, content_type: &str) -> Result<(), Box<dyn std::error::Error>> {
    let points = match content_type {
        "video" => 50,
        "article" => 25,
        "plugin" => 200,
        "tutorial" => 75,
        _ => 10,
    };

    let earn_request = EarnPointsRequest {
        user_id,
        source: "content_creation".to_string(),
        transaction_type: format!("{}_created", content_type),
        points,
        description: Some(format!("Bonus for creating {}", content_type)),
        reference_id: None,
        metadata: Some(serde_json::json!({"content_type": content_type})),
        expires_days: Some(365),
    };

    // Call earn_points function
    Ok(())
}