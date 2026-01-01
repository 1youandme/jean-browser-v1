// Transport / Delivery Pilot Extension Module
use axum::{Json, extract::{Path, Query, State}};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use uuid::Uuid;
use chrono::{DateTime, Utc};
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct DeliveryDriver {
    pub id: Uuid,
    pub user_id: Uuid,
    pub name: String,
    pub phone: Option<String>,
    pub email: Option<String>,
    pub vehicle_type: String,
    pub vehicle_plate: Option<String>,
    pub license_number: Option<String>,
    pub is_active: bool,
    pub current_location: Option<Value>,
    pub rating: Option<f64>,
    pub total_deliveries: i32,
    pub status: DriverStatus,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "varchar")]
pub enum DriverStatus {
    #[serde(rename = "available")]
    Available,
    #[serde(rename = "busy")]
    Busy,
    #[serde(rename = "offline")]
    Offline,
    #[serde(rename = "on_break")]
    OnBreak,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct DeliveryVehicle {
    pub id: Uuid,
    pub driver_id: Uuid,
    pub make: Option<String>,
    pub model: Option<String>,
    pub year: Option<i32>,
    pub color: Option<String>,
    pub license_plate: Option<String>,
    pub vehicle_type: String,
    pub capacity_kg: Option<f64>,
    pub insurance_expiry: Option<chrono::NaiveDate>,
    pub registration_expiry: Option<chrono::NaiveDate>,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct DeliveryRoute {
    pub id: Uuid,
    pub driver_id: Uuid,
    pub name: Option<String>,
    pub waypoints: Value, // Array of {lat, lng, address, estimated_time}
    pub total_distance_km: Option<f64>,
    pub estimated_duration_minutes: Option<i32>,
    pub status: RouteStatus,
    pub started_at: Option<DateTime<Utc>>,
    pub completed_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "varchar")]
pub enum RouteStatus {
    #[serde(rename = "planned")]
    Planned,
    #[serde(rename = "active")]
    Active,
    #[serde(rename = "completed")]
    Completed,
    #[serde(rename = "cancelled")]
    Cancelled,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct DeliveryTelemetry {
    pub id: Uuid,
    pub driver_id: Uuid,
    pub route_id: Option<Uuid>,
    pub delivery_id: Option<Uuid>,
    pub timestamp: DateTime<Utc>,
    pub location: Value, // {lat, lng, accuracy}
    pub speed_kmh: Option<f64>,
    pub heading_degrees: Option<i32>,
    pub event_type: Option<String>, // 'location_update', 'pickup', 'delivery', 'break', 'fuel'
    pub event_data: Option<Value>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateDriverRequest {
    pub user_id: Uuid,
    pub name: String,
    pub phone: Option<String>,
    pub email: Option<String>,
    pub vehicle_type: String,
    pub vehicle_plate: Option<String>,
    pub license_number: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateVehicleRequest {
    pub driver_id: Uuid,
    pub make: Option<String>,
    pub model: Option<String>,
    pub year: Option<i32>,
    pub color: Option<String>,
    pub license_plate: Option<String>,
    pub vehicle_type: String,
    pub capacity_kg: Option<f64>,
    pub insurance_expiry: Option<chrono::NaiveDate>,
    pub registration_expiry: Option<chrono::NaiveDate>,
}

#[derive(Debug, Deserialize)]
pub struct CreateRouteRequest {
    pub driver_id: Uuid,
    pub name: Option<String>,
    pub waypoints: Vec<RouteWaypoint>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RouteWaypoint {
    pub lat: f64,
    pub lng: f64,
    pub address: String,
    pub estimated_time: i32,
    pub waypoint_type: String, // 'pickup', 'delivery', 'break', 'fuel'
}

#[derive(Debug, Deserialize)]
pub struct RecordTelemetryRequest {
    pub driver_id: Uuid,
    pub route_id: Option<Uuid>,
    pub delivery_id: Option<Uuid>,
    pub location: Value,
    pub speed_kmh: Option<f64>,
    pub heading_degrees: Option<i32>,
    pub event_type: Option<String>,
    pub event_data: Option<Value>,
}

// Driver Management
pub async fn list_drivers(
    Query(params): Query<ListDriversQuery>,
) -> Result<Json<Vec<DeliveryDriver>>, axum::http::StatusCode> {
    let mock_drivers = vec![
        DeliveryDriver {
            id: Uuid::new_v4(),
            user_id: Uuid::new_v4(),
            name: "John Smith".to_string(),
            phone: Some("+1234567890".to_string()),
            email: Some("john.smith@example.com".to_string()),
            vehicle_type: "motorcycle".to_string(),
            vehicle_plate: Some("ABC123".to_string()),
            license_number: Some("DL123456".to_string()),
            is_active: true,
            current_location: Some(serde_json::json!({"lat": 40.7128, "lng": -74.0060, "address": "New York, NY"})),
            rating: Some(4.8),
            total_deliveries: 156,
            status: DriverStatus::Available,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        },
        DeliveryDriver {
            id: Uuid::new_v4(),
            user_id: Uuid::new_v4(),
            name: "Maria Garcia".to_string(),
            phone: Some("+1234567891".to_string()),
            email: Some("maria.garcia@example.com".to_string()),
            vehicle_type: "car".to_string(),
            vehicle_plate: Some("XYZ789".to_string()),
            license_number: Some("DL789012".to_string()),
            is_active: true,
            current_location: Some(serde_json::json!({"lat": 40.7580, "lng": -73.9855, "address": "Manhattan, NY"})),
            rating: Some(4.9),
            total_deliveries: 234,
            status: DriverStatus::Busy,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        }
    ];

    Ok(Json(mock_drivers))
}

#[derive(Debug, Deserialize)]
pub struct ListDriversQuery {
    pub is_active: Option<bool>,
    pub status: Option<DriverStatus>,
    pub vehicle_type: Option<String>,
    pub min_rating: Option<f64>,
}

pub async fn create_driver(
    Json(request): Json<CreateDriverRequest>,
) -> Result<Json<DeliveryDriver>, axum::http::StatusCode> {
    let driver = DeliveryDriver {
        id: Uuid::new_v4(),
        user_id: request.user_id,
        name: request.name,
        phone: request.phone,
        email: request.email,
        vehicle_type: request.vehicle_type,
        vehicle_plate: request.vehicle_plate,
        license_number: request.license_number,
        is_active: false, // Require verification first
        current_location: None,
        rating: Some(5.0),
        total_deliveries: 0,
        status: DriverStatus::Offline,
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };

    // Save to database
    Ok(Json(driver))
}

pub async fn get_driver(
    Path(id): Path<Uuid>,
) -> Result<Json<DeliveryDriver>, axum::http::StatusCode> {
    // Fetch specific driver
    Err(axum::http::StatusCode::NOT_FOUND)
}

pub async fn update_driver_status(
    Path(id): Path<Uuid>,
    Json(request): Json<UpdateDriverStatusRequest>,
) -> Result<Json<DeliveryDriver>, axum::http::StatusCode> {
    // Update driver status
    Err(axum::http::StatusCode::NOT_FOUND)
}

#[derive(Debug, Deserialize)]
pub struct UpdateDriverStatusRequest {
    pub status: DriverStatus,
    pub location: Option<Value>,
}

// Vehicle Management
pub async fn create_vehicle(
    Json(request): Json<CreateVehicleRequest>,
) -> Result<Json<DeliveryVehicle>, axum::http::StatusCode> {
    let vehicle = DeliveryVehicle {
        id: Uuid::new_v4(),
        driver_id: request.driver_id,
        make: request.make,
        model: request.model,
        year: request.year,
        color: request.color,
        license_plate: request.license_plate,
        vehicle_type: request.vehicle_type,
        capacity_kg: request.capacity_kg,
        insurance_expiry: request.insurance_expiry,
        registration_expiry: request.registration_expiry,
        is_active: true,
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };

    // Save to database
    Ok(Json(vehicle))
}

pub async fn get_driver_vehicles(
    Path(driver_id): Path<Uuid>,
) -> Result<Json<Vec<DeliveryVehicle>>, axum::http::StatusCode> {
    // Get vehicles for driver
    let mock_vehicles = vec![];
    Ok(Json(mock_vehicles))
}

// Route Management
pub async fn create_route(
    Json(request): Json<CreateRouteRequest>,
) -> Result<Json<DeliveryRoute>, axum::http::StatusCode> {
    let waypoints_json = serde_json::to_value(&request.waypoints).unwrap_or_else(|_| serde_json::json!([]));
    
    let route = DeliveryRoute {
        id: Uuid::new_v4(),
        driver_id: request.driver_id,
        name: request.name,
        waypoints: waypoints_json,
        total_distance_km: Some(calculate_route_distance(&request.waypoints)),
        estimated_duration_minutes: Some(calculate_route_duration(&request.waypoints)),
        status: RouteStatus::Planned,
        started_at: None,
        completed_at: None,
        created_at: Utc::now(),
    };

    // Save to database
    Ok(Json(route))
}

fn calculate_route_distance(waypoints: &[RouteWaypoint]) -> f64 {
    // Simple distance calculation - in production use proper routing API
    if waypoints.len() < 2 {
        return 0.0;
    }
    
    let mut total_distance = 0.0;
    for i in 0..waypoints.len() - 1 {
        let dist = haversine_distance(
            waypoints[i].lat, waypoints[i].lng,
            waypoints[i + 1].lat, waypoints[i + 1].lng
        );
        total_distance += dist;
    }
    
    total_distance
}

fn haversine_distance(lat1: f64, lng1: f64, lat2: f64, lng2: f64) -> f64 {
    use std::f64::consts::PI;
    
    let r = 6371.0; // Earth radius in kilometers
    
    let dlat = (lat2 - lat1).to_radians();
    let dlng = (lng2 - lng1).to_radians();
    
    let a = (dlat / 2.0).sin().powi(2) +
        lat1.to_radians().cos() * lat2.to_radians().cos() *
        (dlng / 2.0).sin().powi(2);
    
    let c = 2.0 * a.sqrt().atan2((1.0 - a).sqrt());
    
    r * c
}

fn calculate_route_duration(waypoints: &[RouteWaypoint]) -> i32 {
    // Simple duration estimate - in production use traffic and routing data
    let distance_km = calculate_route_distance(waypoints);
    let avg_speed_kmh = 40.0; // Average city speed
    
    ((distance_km / avg_speed_kmh) * 60.0) as i32 // Convert to minutes
}

pub async fn start_route(
    Path(id): Path<Uuid>,
) -> Result<Json<Value>, axum::http::StatusCode> {
    // Start route (update status and timestamps)
    Ok(Json(serde_json::json!({
        "success": true,
        "message": "Route started",
        "started_at": Utc::now()
    })))
}

pub async fn complete_route(
    Path(id): Path<Uuid>,
) -> Result<Json<Value>, axum::http::StatusCode> {
    // Complete route
    Ok(Json(serde_json::json!({
        "success": true,
        "message": "Route completed",
        "completed_at": Utc::now()
    })))
}

// Telemetry Collection
pub async fn record_telemetry(
    Json(request): Json<RecordTelemetryRequest>,
) -> Result<Json<Value>, axum::http::StatusCode> {
    let telemetry = DeliveryTelemetry {
        id: Uuid::new_v4(),
        driver_id: request.driver_id,
        route_id: request.route_id,
        delivery_id: request.delivery_id,
        timestamp: Utc::now(),
        location: request.location,
        speed_kmh: request.speed_kmh,
        heading_degrees: request.heading_degrees,
        event_type: request.event_type,
        event_data: request.event_data,
        created_at: Utc::now(),
    };

    // Save to database
    // Update driver current location
    update_driver_location(request.driver_id, &request.location).await?;

    Ok(Json(serde_json::json!({
        "success": true,
        "telemetry_id": telemetry.id
    })))
}

async fn update_driver_location(driver_id: Uuid, location: &Value) -> Result<(), Box<dyn std::error::Error>> {
    // Update driver's current location in database
    tracing::info!("Updated driver {} location: {:?}", driver_id, location);
    Ok(())
}

pub async fn get_telemetry_data(
    Query(params): Query<GetTelemetryQuery>,
) -> Result<Json<Vec<DeliveryTelemetry>>, axum::http::StatusCode> {
    // Query telemetry data with filters
    let mock_telemetry = vec![];
    Ok(Json(mock_telemetry))
}

#[derive(Debug, Deserialize)]
pub struct GetTelemetryQuery {
    pub driver_id: Option<Uuid>,
    pub route_id: Option<Uuid>,
    pub delivery_id: Option<Uuid>,
    pub from_time: Option<DateTime<Utc>>,
    pub to_time: Option<DateTime<Utc>>,
    pub event_type: Option<String>,
    pub limit: Option<i64>,
}

// Analytics and Dashboard
pub async fn get_delivery_analytics() -> Result<Json<Value>, axum::http::StatusCode> {
    let analytics = serde_json::json!({
        "total_deliveries": 1250,
        "active_drivers": 23,
        "average_delivery_time_minutes": 35,
        "total_distance_km": 15420.5,
        "fuel_efficiency_l_per_100km": 8.2,
        "driver_performance": [
            {
                "driver_id": Uuid::new_v4(),
                "name": "John Smith",
                "deliveries_today": 12,
                "average_time_minutes": 32,
                "rating": 4.8,
                "distance_km": 145.2
            },
            {
                "driver_id": Uuid::new_v4(),
                "name": "Maria Garcia",
                "deliveries_today": 15,
                "average_time_minutes": 28,
                "rating": 4.9,
                "distance_km": 167.8
            }
        ],
        "daily_stats": [
            {"date": "2024-01-15", "deliveries": 145, "revenue": 2340.50},
            {"date": "2024-01-14", "deliveries": 132, "revenue": 2156.75},
            {"date": "2024-01-13", "deliveries": 158, "revenue": 2589.25}
        ],
        "vehicle_utilization": {
            "motorcycles": {"active": 8, "total": 12, "utilization_percent": 66.7},
            "cars": {"active": 10, "total": 15, "utilization_percent": 66.7},
            "vans": {"active": 5, "total": 8, "utilization_percent": 62.5}
        }
    });

    Ok(Json(analytics))
}

pub async fn get_driver_performance(
    Path(driver_id): Path<Uuid>,
    Query(params): Query<PerformanceQuery>,
) -> Result<Json<Value>, axum::http::StatusCode> {
    let performance = serde_json::json!({
        "driver_id": driver_id,
        "period": {
            "from": params.from_date.unwrap_or_else(|| Utc::now() - chrono::Duration::days(30)),
            "to": params.to_date.unwrap_or_else(|| Utc::now())
        },
        "metrics": {
            "total_deliveries": 89,
            "completed_deliveries": 87,
            "cancelled_deliveries": 2,
            "completion_rate": 97.8,
            "average_delivery_time_minutes": 31.5,
            "total_distance_km": 1234.5,
            "fuel_consumed_liters": 101.2,
            "revenue_earned": 1789.50,
            "average_rating": 4.85,
            "on_time_delivery_rate": 94.2
        },
        "daily_breakdown": [
            {"date": "2024-01-15", "deliveries": 8, "revenue": 145.50, "time_minutes": 250},
            {"date": "2024-01-14", "deliveries": 12, "revenue": 215.75, "time_minutes": 378}
        ],
        "route_efficiency": {
            "planned_vs_actual_distance": 1.05,
            "planned_vs_actual_time": 1.12,
            "idle_time_percentage": 8.5
        }
    });

    Ok(Json(performance))
}

#[derive(Debug, Deserialize)]
pub struct PerformanceQuery {
    pub from_date: Option<DateTime<Utc>>,
    pub to_date: Option<DateTime<Utc>>,
}

// Driver PWA Interface Data
pub async fn get_driver_dashboard(
    Path(driver_id): Path<Uuid>,
) -> Result<Json<Value>, axum::http::StatusCode> {
    let dashboard = serde_json::json!({
        "driver_id": driver_id,
        "status": "available",
        "current_route": null,
        "today_summary": {
            "deliveries_completed": 5,
            "deliveries_remaining": 3,
            "revenue_earned": 125.50,
            "distance_travelled_km": 67.2,
            "time_on_road_minutes": 245
        },
        "next_delivery": {
            "id": Uuid::new_v4(),
            "pickup_address": "123 Main St, New York, NY",
            "delivery_address": "456 Oak Ave, New York, NY",
            "estimated_time_minutes": 25,
            "customer_name": "John Doe",
            "phone": "+1234567890"
        },
        "notifications": [
            {
                "id": Uuid::new_v4(),
                "type": "new_delivery",
                "message": "New delivery assigned",
                "timestamp": Utc::now(),
                "read": false
            }
        ],
        "vehicle_info": {
            "type": "motorcycle",
            "license_plate": "ABC123",
            "fuel_level_percent": 75,
            "last_maintenance_date": "2024-01-01"
        }
    });

    Ok(Json(dashboard))
}

pub async fn get_available_deliveries(
    Path(driver_id): Path<Uuid>,
) -> Result<Json<Value>, axum::http::StatusCode> {
    let deliveries = serde_json::json!({
        "available_deliveries": [
            {
                "id": Uuid::new_v4(),
                "pickup_address": "789 Pine St, New York, NY",
                "delivery_address": "321 Elm St, New York, NY",
                "estimated_distance_km": 8.5,
                "estimated_time_minutes": 30,
                "payment_amount": 25.00,
                "package_type": "small",
                "priority": "normal",
                "customer_notes": "Handle with care"
            },
            {
                "id": Uuid::new_v4(),
                "pickup_address": "654 Maple Ave, New York, NY",
                "delivery_address": "987 Cedar Rd, New York, NY",
                "estimated_distance_km": 12.3,
                "estimated_time_minutes": 45,
                "payment_amount": 35.00,
                "package_type": "medium",
                "priority": "high",
                "customer_notes": "Urgent delivery"
            }
        ]
    });

    Ok(Json(deliveries))
}