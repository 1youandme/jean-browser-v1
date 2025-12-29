// P2P Local Hub / Offline Chat Module
use axum::{Json, extract::{Path, Query, State}, extract::Multipart, response::sse, ws::{WebSocket, Message}};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use uuid::Uuid;
use chrono::{DateTime, Utc};
use std::collections::{HashMap, HashSet};
use std::sync::Arc;
use tokio::sync::{RwLock, broadcast};
use tokio_stream::wrappers::BroadcastStream;

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct LocalHubRoom {
    pub id: Uuid,
    pub room_code: String,
    pub name: Option<String>,
    pub created_by: Uuid,
    pub is_private: bool,
    pub max_participants: i32,
    pub expires_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct LocalHubParticipant {
    pub id: Uuid,
    pub room_id: Uuid,
    pub user_id: Uuid,
    pub peer_id: String,
    pub role: ParticipantRole,
    pub joined_at: DateTime<Utc>,
    pub last_active: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "varchar")]
pub enum ParticipantRole {
    #[serde(rename = "host")]
    Host,
    #[serde(rename = "participant")]
    Participant,
}

#[derive(Debug, Deserialize)]
pub struct CreateRoomRequest {
    pub name: Option<String>,
    pub is_private: bool,
    pub max_participants: Option<i32>,
    pub expires_hours: Option<i32>,
}

#[derive(Debug, Deserialize)]
pub struct JoinRoomRequest {
    pub room_code: String,
    pub user_name: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ChatMessage {
    pub id: Uuid,
    pub room_id: Uuid,
    pub sender_id: Uuid,
    pub sender_name: String,
    pub content: String,
    pub message_type: MessageType,
    pub timestamp: DateTime<Utc>,
    pub metadata: Value,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum MessageType {
    #[serde(rename = "text")]
    Text,
    #[serde(rename = "file")]
    File { filename: String, size: u64, url: String },
    #[serde(rename = "system")]
    System { event: String },
}

// In-memory storage for active rooms and connections
type RoomsStorage = Arc<RwLock<HashMap<String, RoomInfo>>>;
type ConnectionsStorage = Arc<RwLock<HashMap<String, broadcast::Sender<ChatMessage>>>>;

#[derive(Debug, Clone)]
pub struct RoomInfo {
    pub room: LocalHubRoom,
    pub participants: HashMap<String, LocalHubParticipant>,
    pub message_sender: broadcast::Sender<ChatMessage>,
}

pub async fn create_room(
    Json(request): Json<CreateRoomRequest>,
) -> Result<Json<Value>, axum::http::StatusCode> {
    let room_id = Uuid::new_v4();
    let room_code = generate_room_code();
    let expires_at = request.expires_hours.map(|hours| Utc::now() + chrono::Duration::hours(hours as i64));
    
    let room = LocalHubRoom {
        id: room_id,
        room_code: room_code.clone(),
        name: request.name,
        created_by: Uuid::new_v4(), // Get from auth context
        is_private: request.is_private,
        max_participants: request.max_participants.unwrap_or(10),
        expires_at,
        created_at: Utc::now(),
    };
    
    // Create broadcast channel for room messages
    let (message_sender, _) = broadcast::channel(1000);
    
    let room_info = RoomInfo {
        room: room.clone(),
        participants: HashMap::new(),
        message_sender,
    };
    
    // Store room in memory (in production, use database + cache)
    let rooms = RoomsStorage::default();
    rooms.write().await.insert(room_code.clone(), room_info);
    
    Ok(Json(serde_json::json!({
        "success": true,
        "room": room,
        "join_url": format!("jeantrail://local-hub/{}", room_code)
    })))
}

fn generate_room_code() -> String {
    use rand::Rng;
    let mut rng = rand::thread_rng();
    let chars: Vec<char> = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".chars().collect();
    (0..6).map(|_| chars[rng.gen_range(0..chars.len())]).collect()
}

pub async fn join_room(
    Json(request): Json<JoinRoomRequest>,
) -> Result<Json<Value>, axum::http::StatusCode> {
    let rooms = RoomsStorage::default();
    let rooms_read = rooms.read().await;
    
    let room_info = rooms_read.get(&request.room_code)
        .ok_or(axum::http::StatusCode::NOT_FOUND)?;
    
    // Check if room is full
    if room_info.participants.len() >= room_info.room.max_participants as usize {
        return Err(axum::http::StatusCode::TOO_MANY_REQUESTS);
    }
    
    // Check if room has expired
    if let Some(expires_at) = room_info.room.expires_at {
        if Utc::now() > expires_at {
            return Err(axum::http::StatusCode::GONE);
        }
    }
    
    let user_id = Uuid::new_v4();
    let peer_id = format!("peer_{}", Uuid::new_v4().to_string().replace('-', ""));
    
    let participant = LocalHubParticipant {
        id: Uuid::new_v4(),
        room_id: room_info.room.id,
        user_id,
        peer_id: peer_id.clone(),
        role: ParticipantRole::Participant,
        joined_at: Utc::now(),
        last_active: Utc::now(),
    };
    
    // Add participant to room
    drop(rooms_read);
    let mut rooms_write = rooms.write().await;
    if let Some(room_info) = rooms_write.get_mut(&request.room_code) {
        room_info.participants.insert(peer_id.clone(), participant.clone());
        
        // Send join message
        let join_message = ChatMessage {
            id: Uuid::new_v4(),
            room_id: room_info.room.id,
            sender_id: user_id,
            sender_name: request.user_name.clone(),
            content: format!("{} joined the room", request.user_name),
            message_type: MessageType::System { event: "user_joined".to_string() },
            timestamp: Utc::now(),
            metadata: serde_json::json!({"user_id": user_id}),
        };
        
        let _ = room_info.message_sender.send(join_message);
    }
    
    Ok(Json(serde_json::json!({
        "success": true,
        "room": room_info.room,
        "participant": participant,
        "peer_id": peer_id
    })))
}

pub async fn get_room_info(
    Path(room_code): Path<String>,
) -> Result<Json<Value>, axum::http::StatusCode> {
    let rooms = RoomsStorage::default();
    let rooms_read = rooms.read().await;
    
    let room_info = rooms_read.get(&room_code)
        .ok_or(axum::http::StatusCode::NOT_FOUND)?;
    
    let participants: Vec<Value> = room_info.participants.values().map(|p| {
        serde_json::json!({
            "id": p.id,
            "user_id": p.user_id,
            "peer_id": p.peer_id,
            "role": p.role,
            "joined_at": p.joined_at,
            "last_active": p.last_active
        })
    }).collect();
    
    Ok(Json(serde_json::json!({
        "room": room_info.room,
        "participants": participants,
        "participant_count": participants.len()
    })))
}

pub async fn leave_room(
    Path(room_code): Path<String>,
    Path(peer_id): Path<String>,
) -> Result<Json<Value>, axum::http::StatusCode> {
    let rooms = RoomsStorage::default();
    let mut rooms_write = rooms.write().await;
    
    if let Some(room_info) = rooms_write.get_mut(&room_code) {
        if let Some((_, participant)) = room_info.participants.remove_entry(&peer_id) {
            // Send leave message
            let leave_message = ChatMessage {
                id: Uuid::new_v4(),
                room_id: room_info.room.id,
                sender_id: participant.user_id,
                sender_name: "System".to_string(),
                content: "A participant left the room".to_string(),
                message_type: MessageType::System { event: "user_left".to_string() },
                timestamp: Utc::now(),
                metadata: serde_json::json!({"user_id": participant.user_id}),
            };
            
            let _ = room_info.message_sender.send(leave_message);
            
            return Ok(Json(serde_json::json!({
                "success": true,
                "message": "Left room successfully"
            })));
        }
    }
    
    Err(axum::http::StatusCode::NOT_FOUND)
}

pub async fn send_message(
    Path(room_code): Path<String>,
    Json(request): Json<SendMessageRequest>,
) -> Result<Json<Value>, axum::http::StatusCode> {
    let rooms = RoomsStorage::default();
    let rooms_read = rooms.read().await;
    
    let room_info = rooms_read.get(&room_code)
        .ok_or(axum::http::StatusCode::NOT_FOUND)?;
    
    let message = ChatMessage {
        id: Uuid::new_v4(),
        room_id: room_info.room.id,
        sender_id: request.sender_id,
        sender_name: request.sender_name.clone(),
        content: request.content,
        message_type: MessageType::Text,
        timestamp: Utc::now(),
        metadata: request.metadata.unwrap_or_else(|| serde_json::json!({})),
    };
    
    // Send message to all participants in room
    let _ = room_info.message_sender.send(message.clone());
    
    // Store message in local storage (optional)
    store_message_locally(&message).await;
    
    Ok(Json(serde_json::json!({
        "success": true,
        "message": message
    })))
}

#[derive(Debug, Deserialize)]
pub struct SendMessageRequest {
    pub sender_id: Uuid,
    pub sender_name: String,
    pub content: String,
    pub metadata: Option<Value>,
}

async fn store_message_locally(message: &ChatMessage) {
    // Store in IndexedDB or local storage via frontend
    // For now, just log
    tracing::info!("Stored message locally: {:?}", message);
}

pub async fn get_room_messages(
    Path(room_code): Path<String>,
    Query(params): Query<GetMessagesQuery>,
) -> Result<Json<Vec<ChatMessage>>, axum::http::StatusCode> {
    // Get messages from local storage
    let mock_messages = vec![
        ChatMessage {
            id: Uuid::new_v4(),
            room_id: Uuid::new_v4(),
            sender_id: Uuid::new_v4(),
            sender_name: "Alice".to_string(),
            content: "Welcome to the room!".to_string(),
            message_type: MessageType::Text,
            timestamp: Utc::now(),
            metadata: serde_json::json!({}),
        }
    ];

    Ok(Json(mock_messages))
}

#[derive(Debug, Deserialize)]
pub struct GetMessagesQuery {
    pub limit: Option<i64>,
    pub before: Option<DateTime<Utc>>,
}

// WebRTC Signalling
pub async fn websocket_handler(
    Path(room_code): Path<String>,
    Path(peer_id): Path<String>,
    ws: WebSocket,
) -> Result<(), axum::http::StatusCode> {
    let rooms = RoomsStorage::default();
    let (mut sender, mut receiver) = ws.split();
    
    // Add connection to connections storage
    let connections = ConnectionsStorage::default();
    let mut connections_write = connections.write().await;
    
    let room_info = {
        let rooms_read = rooms.read().await;
        rooms_read.get(&room_code).cloned()
            .ok_or(axum::http::StatusCode::NOT_FOUND)?
    };
    
    let mut rx = room_info.message_sender.subscribe();
    connections_write.insert(peer_id.clone(), room_info.message_sender.clone());
    drop(connections_write);
    
    // Handle incoming messages and broadcast to room
    let peer_id_clone = peer_id.clone();
    let room_code_clone = room_code.clone();
    let send_task = tokio::spawn(async move {
        while let Ok(msg) = rx.recv().await {
            let msg_json = serde_json::to_string(&msg).unwrap_or_default();
            if sender.send(Message::Text(msg_json)).await.is_err() {
                break;
            }
        }
    });
    
    let recv_task = tokio::spawn(async move {
        while let Some(msg) = receiver.next().await {
            match msg {
                Ok(Message::Text(text)) => {
                    if let Ok(signalling_message) = serde_json::from_str::<Value>(&text) {
                        handle_webrtc_signalling(&room_code_clone, &peer_id_clone, signalling_message).await;
                    }
                }
                Ok(Message::Close(_)) => {
                    break;
                }
                Err(_) => break,
                _ => {}
            }
        }
    });
    
    // Wait for either task to complete
    tokio::select! {
        _ = send_task => {},
        _ = recv_task => {},
    }
    
    // Clean up connection
    let mut connections_write = connections.write().await;
    connections_write.remove(&peer_id);
    
    Ok(())
}

async fn handle_webrtc_signalling(room_code: &str, from_peer_id: &str, message: Value) {
    let rooms = RoomsStorage::default();
    let rooms_read = rooms.read().await;
    
    if let Some(room_info) = rooms_read.get(room_code) {
        // Forward signalling message to all other peers in room
        let signalling_data = serde_json::json!({
            "type": "signalling",
            "from_peer_id": from_peer_id,
            "data": message
        });
        
        // This would be sent via WebSocket to specific peers
        // For now, just log
        tracing::info!("WebRTC signalling: {:?} -> {:?}: {:?}", from_peer_id, room_code, signalling_data);
    }
}

pub async fn get_room_qr_code(
    Path(room_code): Path<String>,
) -> Result<Json<Value>, axum::http::StatusCode> {
    use qrcode::QrCode;
    
    let join_url = format!("jeantrail://local-hub/{}", room_code);
    
    let qr_code = QrCode::new(&join_url)
        .map_err(|_| axum::http::StatusCode::INTERNAL_SERVER_ERROR)?;
    
    let image = qr_code.render::<image::Luma<u8>>().build();
    let mut buffer = Vec::new();
    
    // Convert to base64
    let base64_image = base64::encode(&buffer);
    
    Ok(Json(serde_json::json!({
        "room_code": room_code,
        "join_url": join_url,
        "qr_code": format!("data:image/png;base64,{}", base64_image)
    })))
}

pub async fn export_chat_history(
    Path(room_code): Path<String>,
) -> Result<Json<Value>, axum::http::StatusCode> {
    // Get all messages for room and export as JSON/CSV
    let export_data = serde_json::json!({
        "room_code": room_code,
        "exported_at": Utc::now(),
        "messages": [], // Would fetch from local storage
        "format": "json"
    });
    
    Ok(Json(export_data))
}

pub async fn list_active_rooms() -> Result<Json<Vec<LocalHubRoom>>, axum::http::StatusCode> {
    let rooms = RoomsStorage::default();
    let rooms_read = rooms.read().await;
    
    let active_rooms: Vec<LocalHubRoom> = rooms_read.values()
        .map(|room_info| room_info.room.clone())
        .collect();
    
    Ok(Json(active_rooms))
}

// Cleanup expired rooms
pub async fn cleanup_expired_rooms() -> Result<u64, Box<dyn std::error::Error>> {
    let rooms = RoomsStorage::default();
    let mut rooms_write = rooms.write().await;
    
    let now = Utc::now();
    let mut expired_count = 0;
    
    rooms_write.retain(|_, room_info| {
        if let Some(expires_at) = room_info.room.expires_at {
            if now > expires_at {
                expired_count += 1;
                return false;
            }
        }
        true
    });
    
    tracing::info!("Cleaned up {} expired rooms", expired_count);
    Ok(expired_count)
}