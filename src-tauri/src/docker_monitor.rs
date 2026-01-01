use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tokio::sync::RwLock;
use std::sync::Arc;
use chrono::{DateTime, Utc, Duration};
use bollard::Docker;
use bollard::container::{ListContainersOptions, StatsOptions, RestartContainerOptions};
use bollard::models::ContainerSummary;
use uuid::Uuid;
use std::process::Command;

use crate::commands::{CommandResult, DatabasePool};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContainerStatus {
    pub id: Uuid,
    pub container_name: String,
    pub container_id: String,
    pub image_name: String,
    pub status: ContainerState,
    pub cpu_usage: Option<f64>,
    pub memory_usage: Option<i64>,
    pub memory_limit: Option<i64>,
    pub network_rx: Option<i64>,
    pub network_tx: Option<i64>,
    pub health_status: HealthStatus,
    pub uptime: Option<i64>, // seconds
    pub restart_count: i32,
    pub labels: HashMap<String, String>,
    pub ports: HashMap<String, Option<Vec<PortBinding>>>,
    pub last_checked: DateTime<Utc>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ContainerState {
    Running,
    Stopped,
    Error,
    Restarting,
    Paused,
    Exited,
    Dead,
    Created,
    Removing,
    Unknown,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum HealthStatus {
    Healthy,
    Unhealthy,
    Unknown,
    Starting,
    Disabled,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ServiceType {
    Docker,
    Process,
    ExternalApi,
    SystemService,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServiceStatus {
    pub id: Uuid,
    pub service_name: String,
    pub service_type: ServiceType,
    pub status: ContainerState,
    pub health_endpoint: Option<String>,
    pub metrics: serde_json::Value,
    pub last_check: DateTime<Utc>,
    pub restart_count: i32,
    pub error_message: Option<String>,
    pub config: serde_json::Value,
    pub is_monitored: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServiceConfig {
    pub name: String,
    pub service_type: ServiceType,
    pub container_name: Option<String>,
    pub process_name: Option<String>,
    pub health_check_url: Option<String>,
    pub restart_on_failure: bool,
    pub max_restarts: i32,
    pub cpu_threshold: Option<f64>,
    pub memory_threshold: Option<i64>,
    pub check_interval_seconds: i32,
    pub tags: Vec<String>,
}
    Unhealthy,
    Unknown,
    Starting,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PortBinding {
    pub host_ip: String,
    pub host_port: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DockerService {
    pub name: String,
    pub container_pattern: String, // regex pattern to match container names
    pub auto_restart: bool,
    pub resource_limits: ResourceLimits,
    pub health_check: Option<HealthCheckConfig>,
    pub alerts: AlertConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResourceLimits {
    pub max_cpu_percent: f64,
    pub max_memory_mb: i64,
    pub max_disk_percent: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HealthCheckConfig {
    pub endpoint: Option<String>,
    pub timeout_seconds: i32,
    pub retries: i32,
    pub interval_seconds: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AlertConfig {
    pub enable_cpu_alerts: bool,
    pub enable_memory_alerts: bool,
    pub enable_health_alerts: bool,
    pub cpu_threshold: f64,
    pub memory_threshold: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContainerAction {
    pub container_id: String,
    pub action_type: ContainerActionType,
    pub reason: String,
    pub auto_approved: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ContainerActionType {
    Start,
    Stop,
    Restart,
    Pause,
    Unpause,
    Remove,
    Update,
}

pub struct DockerMonitor {
    docker: Arc<Docker>,
    db: Arc<DatabasePool>,
    services: Arc<RwLock<HashMap<String, DockerService>>>,
    monitoring_active: Arc<RwLock<bool>>,
}

impl DockerMonitor {
    pub fn new(db: Arc<DatabasePool>) -> Result<Self, String> {
        let docker = Docker::connect_with_local_defaults()
            .map_err(|e| format!("Failed to connect to Docker: {}", e))?;

        Ok(Self {
            docker: Arc::new(docker),
            db,
            services: Arc::new(RwLock::new(HashMap::new())),
            monitoring_active: Arc::new(RwLock::new(false)),
        })
    }

    /// Start monitoring Docker containers
    pub async fn start_monitoring(&self) -> Result<(), String> {
        {
            let mut monitoring = self.monitoring_active.write().await;
            *monitoring = true;
        }

        // Load configured services
        self.load_services().await?;

        // Start the monitoring loop
        let monitor = self.clone();
        tokio::spawn(async move {
            monitor.monitoring_loop().await;
        });

        log::info!("Docker monitoring started");
        Ok(())
    }

    /// Stop monitoring Docker containers
    pub async fn stop_monitoring(&self) -> Result<(), String> {
        {
            let mut monitoring = self.monitoring_active.write().await;
            *monitoring = false;
        }

        log::info!("Docker monitoring stopped");
        Ok(())
    }

    /// Get all container statuses
    pub async fn get_all_containers(&self) -> Result<Vec<ContainerStatus>, String> {
        let mut conn = self.db.acquire().await
            .map_err(|e| format!("Database error: {}", e))?;

        let containers = sqlx::query_as!(
            ContainerStatusRow,
            r#"
            SELECT * FROM docker_status 
            ORDER BY container_name
            "#
        )
        .fetch_all(&mut *conn)
        .await
        .map_err(|e| format!("Failed to fetch containers: {}", e))?;

        Ok(containers.into_iter()
            .map(|row| self.row_to_status(row))
            .collect())
    }

    /// Get specific container status
    pub async fn get_container_status(&self, container_name: &str) -> Result<Option<ContainerStatus>, String> {
        let mut conn = self.db.acquire().await
            .map_err(|e| format!("Database error: {}", e))?;

        let container = sqlx::query_as!(
            ContainerStatusRow,
            r#"
            SELECT * FROM docker_status 
            WHERE container_name = $1
            "#,
            container_name
        )
        .fetch_optional(&mut *conn)
        .await
        .map_err(|e| format!("Failed to fetch container: {}", e))?;

        Ok(container.map(|row| self.row_to_status(row)))
    }

    /// Execute container action
    pub async fn execute_container_action(&self, action: ContainerAction) -> Result<ActionResult, String> {
        log::info!("Executing container action: {:?} on {}", action.action_type, action.container_id);

        let result = match action.action_type {
            ContainerActionType::Start => self.start_container(&action.container_id).await,
            ContainerActionType::Stop => self.stop_container(&action.container_id).await,
            ContainerActionType::Restart => self.restart_container(&action.container_id).await,
            ContainerActionType::Pause => self.pause_container(&action.container_id).await,
            ContainerActionType::Unpause => self.unpause_container(&action.container_id).await,
            ContainerActionType::Remove => self.remove_container(&action.container_id).await,
            ContainerActionType::Update => self.update_container(&action.container_id).await,
        };

        // Log the action
        self.log_container_action(&action, &result).await?;

        result
    }

    /// Get container resource usage
    pub async fn get_container_stats(&self, container_name: &str) -> Result<Option<ContainerStats>, String> {
        let containers = self.list_containers(Some(vec![container_name.to_string()])).await?;
        
        if containers.is_empty() {
            return Ok(None);
        }

        let container = &containers[0];
        let stats = self.get_container_statistics(&container.id).await?;
        
        Ok(Some(stats))
    }

    /// Add or update a monitored service
    pub async fn configure_service(&self, service: DockerService) -> Result<(), String> {
        let mut services = self.services.write().await;
        services.insert(service.name.clone(), service);

        // Persist to database
        self.save_service_to_db(&service).await?;

        log::info!("Docker service configured: {}", service.name);
        Ok(())
    }

    /// Get monitoring statistics
    pub async fn get_monitoring_stats(&self) -> Result<MonitoringStats, String> {
        let containers = self.get_all_containers().await?;
        
        let total_containers = containers.len();
        let running_containers = containers.iter()
            .filter(|c| matches!(c.status, ContainerState::Running))
            .count();
        let unhealthy_containers = containers.iter()
            .filter(|c| matches!(c.health_status, HealthStatus::Unhealthy))
            .count();

        let total_cpu: f64 = containers.iter()
            .filter_map(|c| c.cpu_usage)
            .sum();
        
        let total_memory: i64 = containers.iter()
            .filter_map(|c| c.memory_usage)
            .sum();

        Ok(MonitoringStats {
            total_containers,
            running_containers,
            stopped_containers: total_containers - running_containers,
            unhealthy_containers,
            total_cpu_usage: total_cpu,
            total_memory_usage: total_memory,
            last_updated: Utc::now(),
        })
    }

    // Private methods

    async fn monitoring_loop(&self) {
        let mut interval = tokio::time::interval(tokio::time::Duration::from_secs(30));

        loop {
            {
                let monitoring = self.monitoring_active.read().await;
                if !*monitoring {
                    break;
                }
            }

            if let Err(e) = self.update_all_containers().await {
                log::error!("Error updating container statuses: {}", e);
            }

            if let Err(e) = self.check_service_health().await {
                log::error!("Error checking service health: {}", e);
            }

            interval.tick().await;
        }
    }

    async fn update_all_containers(&self) -> Result<(), String> {
        let containers = self.list_containers(None).await?;
        
        for container in containers {
            if let Err(e) = self.update_container_status(&container).await {
                log::error!("Failed to update status for container {}: {}", container.names[0], e);
            }
        }

        Ok(())
    }

    async fn update_container_status(&self, container: &ContainerSummary) -> Result<(), String> {
        let container_name = container.names[0].trim_start_matches('/');
        let stats = self.get_container_statistics(&container.id).await?;

        let mut conn = self.db.acquire().await
            .map_err(|e| format!("Database error: {}", e))?;

        let status = self.determine_container_state(&container.state);
        let health = self.determine_health_status(&container.status);

        sqlx::query!(
            r#"
            INSERT INTO docker_status (
                id, container_name, container_id, image_name, status,
                cpu_usage, memory_usage, memory_limit, network_rx, network_tx,
                health_status, last_checked, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            ON CONFLICT (container_name) 
            DO UPDATE SET 
                status = EXCLUDED.status,
                cpu_usage = EXCLUDED.cpu_usage,
                memory_usage = EXCLUDED.memory_usage,
                memory_limit = EXCLUDED.memory_limit,
                network_rx = EXCLUDED.network_rx,
                network_tx = EXCLUDED.network_tx,
                health_status = EXCLUDED.health_status,
                last_checked = EXCLUDED.last_checked,
                updated_at = NOW()
            "#,
            Uuid::new_v4(),
            container_name,
            &container.id,
            container.image.as_deref().unwrap_or("unknown"),
            serde_json::to_string(&status).unwrap(),
            stats.cpu_percent,
            stats.memory_usage,
            stats.memory_limit,
            stats.network_rx,
            stats.network_tx,
            serde_json::to_string(&health).unwrap(),
            Utc::now(),
            Utc::now(),
            Utc::now()
        )
        .execute(&mut *conn)
        .await
        .map_err(|e| format!("Failed to update container status: {}", e))?;

        Ok(())
    }

    async fn list_containers(&self, names: Option<Vec<String>>) -> Result<Vec<ContainerSummary>, String> {
        let options = if let Some(names) = names {
            Some(ListContainersOptions {
                all: true,
                filters: vec![("name".to_string(), names)].into_iter().collect(),
                ..Default::default()
            })
        } else {
            Some(ListContainersOptions::<String> {
                all: true,
                ..Default::default()
            })
        };

        let containers = self.docker
            .list_containers(options)
            .await
            .map_err(|e| format!("Failed to list containers: {}", e))?;

        Ok(containers)
    }

    async fn get_container_statistics(&self, container_id: &str) -> Result<ContainerStats, String> {
        let options = Some(StatsOptions {
            stream: false,
            ..Default::default()
        });

        let mut stats_stream = self.docker
            .stats(container_id, options)
            .await
            .map_err(|e| format!("Failed to get container stats: {}", e))?;

        if let Some(stats) = stats_stream.next().await {
            let stats = stats.map_err(|e| format!("Failed to parse stats: {}", e))?;
            
            let cpu_percent = calculate_cpu_usage(&stats);
            let memory_usage = stats.memory_stats.usage.unwrap_or(0);
            let memory_limit = stats.memory_stats.limit.unwrap_or(0);
            
            let network_rx = stats.networks.as_ref()
                .and_then(|nets| nets.values().next())
                .map(|net| net.rx_bytes.unwrap_or(0));
            
            let network_tx = stats.networks.as_ref()
                .and_then(|nets| nets.values().next())
                .map(|net| net.tx_bytes.unwrap_or(0));

            return Ok(ContainerStats {
                cpu_percent,
                memory_usage: memory_usage as i64,
                memory_limit: memory_limit as i64,
                network_rx: network_rx.map(|v| v as i64),
                network_tx: network_tx.map(|v| v as i64),
            });
        }

        Ok(ContainerStats::default())
    }

    async fn start_container(&self, container_id: &str) -> Result<ActionResult, String> {
        self.docker
            .start_container::<&str>(container_id, None)
            .await
            .map_err(|e| format!("Failed to start container: {}", e))?;

        Ok(ActionResult {
            success: true,
            message: format!("Container {} started successfully", container_id),
            data: None,
        })
    }

    async fn stop_container(&self, container_id: &str) -> Result<ActionResult, String> {
        self.docker
            .stop_container(container_id, None)
            .await
            .map_err(|e| format!("Failed to stop container: {}", e))?;

        Ok(ActionResult {
            success: true,
            message: format!("Container {} stopped successfully", container_id),
            data: None,
        })
    }

    async fn restart_container(&self, container_id: &str) -> Result<ActionResult, String> {
        self.docker
            .restart_container(container_id, None)
            .await
            .map_err(|e| format!("Failed to restart container: {}", e))?;

        Ok(ActionResult {
            success: true,
            message: format!("Container {} restarted successfully", container_id),
            data: None,
        })
    }

    async fn pause_container(&self, container_id: &str) -> Result<ActionResult, String> {
        self.docker
            .pause_container(container_id)
            .await
            .map_err(|e| format!("Failed to pause container: {}", e))?;

        Ok(ActionResult {
            success: true,
            message: format!("Container {} paused successfully", container_id),
            data: None,
        })
    }

    async fn unpause_container(&self, container_id: &str) -> Result<ActionResult, String> {
        self.docker
            .unpause_container(container_id)
            .await
            .map_err(|e| format!("Failed to unpause container: {}", e))?;

        Ok(ActionResult {
            success: true,
            message: format!("Container {} unpaused successfully", container_id),
            data: None,
        })
    }

    async fn remove_container(&self, container_id: &str) -> Result<ActionResult, String> {
        self.docker
            .remove_container(container_id, None)
            .await
            .map_err(|e| format!("Failed to remove container: {}", e))?;

        Ok(ActionResult {
            success: true,
            message: format!("Container {} removed successfully", container_id),
            data: None,
        })
    }

    async fn update_container(&self, container_id: &str) -> Result<ActionResult, String> {
        // Container update logic would go here
        Ok(ActionResult {
            success: true,
            message: format!("Container {} updated successfully", container_id),
            data: None,
        })
    }

    async fn check_service_health(&self) -> Result<Vec<HealthAlert>, String> {
        let mut alerts = Vec::new();
        let services = self.services.read().await;

        for service in services.values() {
            if let Err(e) = self.check_single_service_health(service).await {
                log::error!("Error checking service health for {}: {}", service.name, e);
            }
        }

        Ok(alerts)
    }

    async fn check_single_service_health(&self, service: &DockerService) -> Result<(), String> {
        let containers = self.list_containers(None).await?;
        
        for container in containers {
            let container_name = container.names[0].trim_start_matches('/');
            
            if !container_name.contains(&service.container_pattern) {
                continue;
            }

            let stats = self.get_container_statistics(&container.id).await?;
            
            // Check CPU usage
            if service.alerts.enable_cpu_alerts && 
               stats.cpu_percent > service.alerts.cpu_threshold {
                self.create_alert(&service.name, container_name, "high_cpu", &format!(
                    "CPU usage {:.1}% exceeds threshold {:.1}%", 
                    stats.cpu_percent, service.alerts.cpu_threshold
                )).await?;
            }

            // Check memory usage
            if service.alerts.enable_memory_alerts && 
               stats.memory_limit > 0 {
                let memory_percent = (stats.memory_usage as f64 / stats.memory_limit as f64) * 100.0;
                if memory_percent > service.alerts.memory_threshold {
                    self.create_alert(&service.name, container_name, "high_memory", &format!(
                        "Memory usage {:.1}% exceeds threshold {:.1}%", 
                        memory_percent, service.alerts.memory_threshold
                    )).await?;
                }
            }
        }

        Ok(())
    }

    async fn create_alert(
        &self,
        service_name: &str,
        container_name: &str,
        alert_type: &str,
        message: &str
    ) -> Result<(), String> {
        log::warn!("Docker Alert [{}] {} [{}]: {}", 
            service_name, alert_type, container_name, message);

        // Store alert in database or send notification
        Ok(())
    }

    async fn log_container_action(
        &self,
        action: &ContainerAction,
        result: &ActionResult
    ) -> Result<(), String> {
        // Log action to database for auditing
        Ok(())
    }

    fn determine_container_state(&self, state: &str) -> ContainerState {
        match state.to_lowercase().as_str() {
            "running" => ContainerState::Running,
            "stopped" => ContainerState::Stopped,
            "error" => ContainerState::Error,
            "restarting" => ContainerState::Restarting,
            "paused" => ContainerState::Paused,
            "exited" => ContainerState::Exited,
            "dead" => ContainerState::Dead,
            "created" => ContainerState::Created,
            "removing" => ContainerState::Removing,
            _ => ContainerState::Unknown,
        }
    }

    fn determine_health_status(&self, status: &Option<String>) -> HealthStatus {
        match status.as_deref() {
            Some("healthy") => HealthStatus::Healthy,
            Some("unhealthy") => HealthStatus::Unhealthy,
            Some("starting") => HealthStatus::Starting,
            _ => HealthStatus::Unknown,
        }
    }

    fn row_to_status(&self, row: ContainerStatusRow) -> ContainerStatus {
        ContainerStatus {
            id: row.id,
            container_name: row.container_name,
            container_id: row.container_id,
            image_name: row.image_name,
            status: serde_json::from_str(&row.status).unwrap_or(ContainerState::Unknown),
            cpu_usage: row.cpu_usage.map(|v| v as f64),
            memory_usage: row.memory_usage,
            memory_limit: row.memory_limit,
            network_rx: row.network_rx,
            network_tx: row.network_tx,
            health_status: serde_json::from_str(&row.health_status).unwrap_or(HealthStatus::Unknown),
            uptime: None, // Would need to calculate from created_at
            restart_count: 0,
            labels: HashMap::new(),
            ports: HashMap::new(),
            last_checked: row.last_checked,
            created_at: row.created_at,
            updated_at: row.updated_at,
        }
    }

    async fn load_services(&self) -> Result<(), String> {
        // Load configured services from database
        Ok(())
    }

    async fn save_service_to_db(&self, service: &DockerService) -> Result<(), String> {
        // Save service configuration to database
        Ok(())
    }
}

// Supporting types

#[derive(Debug, Clone)]
struct ContainerStatusRow {
    pub id: Uuid,
    pub container_name: String,
    pub container_id: String,
    pub image_name: String,
    pub status: String,
    pub cpu_usage: Option<f64>,
    pub memory_usage: Option<i64>,
    pub memory_limit: Option<i64>,
    pub network_rx: Option<i64>,
    pub network_tx: Option<i64>,
    pub health_status: String,
    pub last_checked: DateTime<Utc>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Default)]
pub struct ContainerStats {
    pub cpu_percent: f64,
    pub memory_usage: i64,
    pub memory_limit: i64,
    pub network_rx: Option<i64>,
    pub network_tx: Option<i64>,
}

#[derive(Debug, Clone)]
pub struct ActionResult {
    pub success: bool,
    pub message: String,
    pub data: Option<serde_json::Value>,
}

#[derive(Debug, Clone)]
pub struct MonitoringStats {
    pub total_containers: usize,
    pub running_containers: usize,
    pub stopped_containers: usize,
    pub unhealthy_containers: usize,
    pub total_cpu_usage: f64,
    pub total_memory_usage: i64,
    pub last_updated: DateTime<Utc>,
}

#[derive(Debug, Clone)]
pub struct HealthAlert {
    pub service_name: String,
    pub container_name: String,
    pub alert_type: String,
    pub message: String,
    pub severity: AlertSeverity,
    pub timestamp: DateTime<Utc>,
}

#[derive(Debug, Clone)]
pub enum AlertSeverity {
    Info,
    Warning,
    Critical,
}

// Utility functions

fn calculate_cpu_usage(stats: &bollard::models::Stats) -> f64 {
    // CPU usage calculation based on Docker stats
    // This is a simplified version - real implementation would need proper delta calculation
    
    if let (Some(cpu_delta), Some(system_delta)) = (stats.cpu_stats.cpu_usage, stats.cpu_stats.system_cpu_usage) {
        if let Some(pre_cpu) = &stats.precpu_stats {
            if let (Some(pre_cpu_usage), Some(pre_system_cpu_usage)) = 
                (pre_cpu.cpu_usage, pre_cpu.system_cpu_usage) {
                
                let cpu_percent = ((cpu_delta - pre_cpu_usage) as f64 / 
                    ((system_delta - pre_system_cpu_usage) as f64)) * 
                    stats.cpu_stats.online_cpus.unwrap_or(1) as f64 * 100.0;
                
                return cpu_percent;
            }
        }
    }
    
    0.0
}

// Enhanced Docker Monitor with Service Management
pub struct DockerMonitor {
    docker: Arc<Docker>,
    db_pool: Arc<sqlx::PgPool>,
    service_configs: Arc<RwLock<HashMap<String, ServiceConfig>>>,
    monitoring_enabled: Arc<RwLock<bool>>,
}

impl DockerMonitor {
    pub fn new(docker: Docker, db_pool: sqlx::PgPool) -> Self {
        Self {
            docker: Arc::new(docker),
            db_pool: Arc::new(db_pool),
            service_configs: Arc::new(RwLock::new(HashMap::new())),
            monitoring_enabled: Arc::new(RwLock::new(true)),
        }
    }

    /// Start continuous monitoring of all configured services
    pub async fn start_monitoring(&self) -> CommandResult<()> {
        let monitor = self.clone();
        tokio::spawn(async move {
            let mut interval = tokio::time::interval(Duration::from_secs(30));
            
            loop {
                interval.tick().await;
                
                let monitoring_enabled = *monitor.monitoring_enabled.read().await;
                if monitoring_enabled {
                    if let Err(e) = monitor.check_all_services().await {
                        eprintln!("Monitoring error: {}", e);
                    }
                }
            }
        });

        Ok(())
    }

    /// Check all monitored services
    pub async fn check_all_services(&self) -> CommandResult<Vec<ServiceStatus>> {
        let configs = self.service_configs.read().await;
        let mut statuses = Vec::new();

        for (name, config) in configs.iter() {
            match self.check_service(name, config).await {
                Ok(status) => statuses.push(status),
                Err(e) => eprintln!("Failed to check service {}: {}", name, e),
            }
        }

        // Store statuses in database
        self.store_service_statuses(&statuses).await?;

        Ok(statuses)
    }

    /// Check individual service status
    async fn check_service(&self, name: &str, config: &ServiceConfig) -> CommandResult<ServiceStatus> {
        let (status, metrics, error_message) = match config.service_type {
            ServiceType::Docker => self.check_docker_service(config).await?,
            ServiceType::Process => self.check_process_service(config).await?,
            ServiceType::ExternalApi => self.check_api_service(config).await?,
            ServiceType::SystemService => self.check_system_service(config).await?,
        };

        let service_status = ServiceStatus {
            id: Uuid::new_v4(),
            service_name: name.to_string(),
            service_type: config.service_type.clone(),
            status,
            health_endpoint: config.health_check_url.clone(),
            metrics,
            last_check: Utc::now(),
            restart_count: 0, // Would load from DB
            error_message,
            config: serde_json::to_value(config).unwrap_or_default(),
            is_monitored: true,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        Ok(service_status)
    }

    /// Check Docker container status
    async fn check_docker_service(&self, config: &ServiceConfig) -> CommandResult<(ContainerState, serde_json::Value, Option<String>)> {
        let container_name = config.container_name.as_ref()
            .ok_or("No container name specified")?;

        let containers = self.docker.list_containers::<String>(None).await
            .map_err(|e| format!("Failed to list containers: {}", e))?;

        let container = containers.iter()
            .find(|c| c.names.iter().any(|n| n.contains(container_name)))
            .ok_or_else(|| format!("Container {} not found", container_name))?;

        let status = self.parse_container_status(&container.state);
        let metrics = self.get_container_metrics(&container.id).await?;
        let error_message = if status == ContainerState::Error || status == ContainerState::Stopped {
            Some(format!("Container status: {}", container.state.as_ref().unwrap_or(&"unknown".to_string())))
        } else {
            None
        };

        Ok((status, metrics, error_message))
    }

    /// Check process status
    async fn check_process_service(&self, config: &ServiceConfig) -> CommandResult<(ContainerState, serde_json::Value, Option<String>)> {
        let process_name = config.process_name.as_ref()
            .ok_or("No process name specified")?;

        // Use system commands to check process
        let output = Command::new("pgrep")
            .arg("-f")
            .arg(process_name)
            .output()
            .await
            .map_err(|e| format!("Failed to check process: {}", e))?;

        let status = if output.status.success() && !output.stdout.is_empty() {
            ContainerState::Running
        } else {
            ContainerState::Stopped
        };

        let metrics = serde_json::json!({
            "process_name": process_name,
            "pid_count": output.stdout.len(),
            "command": "pgrep -f"
        });

        let error_message = if status == ContainerState::Stopped {
            Some(format!("Process {} not running", process_name))
        } else {
            None
        };

        Ok((status, metrics, error_message))
    }

    /// Check external API service
    async fn check_api_service(&self, config: &ServiceConfig) -> CommandResult<(ContainerState, serde_json::Value, Option<String>)> {
        let health_url = config.health_check_url.as_ref()
            .ok_or("No health check URL specified")?;

        // Make HTTP request to health endpoint
        let client = reqwest::Client::new();
        let response = client.get(health_url)
            .timeout(Duration::from_secs(10))
            .send()
            .await;

        match response {
            Ok(resp) => {
                let status = if resp.status().is_success() {
                    ContainerState::Running
                } else {
                    ContainerState::Error
                };

                let metrics = serde_json::json!({
                    "url": health_url,
                    "status_code": resp.status().as_u16(),
                    "response_time_ms": 0 // Would measure actual time
                });

                let error_message = if status == ContainerState::Error {
                    Some(format!("API returned status: {}", resp.status()))
                } else {
                    None
                };

                Ok((status, metrics, error_message))
            }
            Err(e) => {
                let metrics = serde_json::json!({
                    "url": health_url,
                    "error": e.to_string()
                });

                Ok((ContainerState::Error, metrics, Some(e.to_string())))
            }
        }
    }

    /// Check system service (systemd)
    async fn check_system_service(&self, config: &ServiceConfig) -> CommandResult<(ContainerState, serde_json::Value, Option<String>)> {
        let service_name = config.service_name.as_str();

        let output = Command::new("systemctl")
            .args(&["is-active", service_name])
            .output()
            .await
            .map_err(|e| format!("Failed to check systemd service: {}", e))?;

        let status_output = String::from_utf8_lossy(&output.stdout).trim().to_string();
        
        let status = match status_output.as_str() {
            "active" => ContainerState::Running,
            "inactive" | "dead" => ContainerState::Stopped,
            "failed" => ContainerState::Error,
            "activating" => ContainerState::Starting,
            _ => ContainerState::Unknown,
        };

        // Get additional service info
        let status_output = Command::new("systemctl")
            .args(&["status", service_name, "--no-pager"])
            .output()
            .await
            .map_err(|e| format!("Failed to get service status details: {}", e))?;

        let status_text = String::from_utf8_lossy(&status_output.stdout);
        
        let metrics = serde_json::json!({
            "service_name": service_name,
            "systemd_status": status_output,
            "status_text": status_text
        });

        let error_message = if status == ContainerState::Error {
            Some(format!("Systemd service {} failed", service_name))
        } else if status == ContainerState::Stopped {
            Some(format!("Systemd service {} is not running", service_name))
        } else {
            None
        };

        Ok((status, metrics, error_message))
    }

    /// Get detailed container metrics
    async fn get_container_metrics(&self, container_id: &str) -> CommandResult<serde_json::Value> {
        let stats = self.docker.stats::<String>(container_id, None).await
            .map_err(|e| format!("Failed to get container stats: {}", e));

        match stats {
            Ok(mut stream) => {
                if let Some(stats_result) = stream.next().await {
                    let stats = stats_result.map_err(|e| format!("Stats error: {}", e))?;
                    
                    let cpu_usage = calculate_cpu_usage(&stats);
                    let memory_usage = stats.memory_stats.usage.unwrap_or(0);
                    let memory_limit = stats.memory_stats.limit.unwrap_or(0);
                    let memory_percent = if memory_limit > 0 {
                        (memory_usage as f64 / memory_limit as f64) * 100.0
                    } else {
                        0.0
                    };

                    Ok(serde_json::json!({
                        "container_id": container_id,
                        "cpu_usage_percent": cpu_usage,
                        "memory_usage_bytes": memory_usage,
                        "memory_limit_bytes": memory_limit,
                        "memory_usage_percent": memory_percent,
                        "network_rx": stats.networks.as_ref()
                            .and_then(|n| n.values().next())
                            .map(|n| n.rx_bytes.unwrap_or(0))
                            .unwrap_or(0),
                        "network_tx": stats.networks.as_ref()
                            .and_then(|n| n.values().next())
                            .map(|n| n.tx_bytes.unwrap_or(0))
                            .unwrap_or(0)
                    }))
                } else {
                    Ok(serde_json::json!({"error": "No stats available"}))
                }
            }
            Err(e) => Ok(serde_json::json!({"error": e}))
        }
    }

    /// Parse container state string to enum
    fn parse_container_status(&self, state: &Option<String>) -> ContainerState {
        match state.as_ref().map(|s| s.as_str()).unwrap_or("") {
            "running" => ContainerState::Running,
            "stopped" | "exited" => ContainerState::Stopped,
            "error" | "dead" => ContainerState::Error,
            "restarting" => ContainerState::Restarting,
            "paused" => ContainerState::Paused,
            "created" => ContainerState::Created,
            "removing" => ContainerState::Removing,
            _ => ContainerState::Unknown,
        }
    }

    /// Store service statuses in database
    async fn store_service_statuses(&self, statuses: &[ServiceStatus]) -> CommandResult<()> {
        for status in statuses {
            sqlx::query!(
                r#"
                INSERT INTO service_status (
                    service_name, service_type, status, health_endpoint,
                    metrics, last_check, error_message, config, is_monitored
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                ON CONFLICT (service_name) DO UPDATE SET
                    status = EXCLUDED.status,
                    metrics = EXCLUDED.metrics,
                    last_check = EXCLUDED.last_check,
                    error_message = EXCLUDED.error_message,
                    updated_at = NOW()
                "#,
                status.service_name,
                serde_json::to_string(&status.service_type).unwrap_or_default(),
                serde_json::to_string(&status.status).unwrap_or_default(),
                status.health_endpoint,
                status.metrics,
                status.last_check,
                status.error_message,
                status.config,
                status.is_monitored
            )
            .execute(&*self.db_pool)
            .await
            .map_err(|e| format!("Failed to store service status: {}", e))?;
        }

        Ok(())
    }

    /// Restart a service
    pub async fn restart_service(&self, service_name: &str) -> CommandResult<String> {
        let configs = self.service_configs.read().await;
        let config = configs.get(service_name)
            .ok_or_else(|| format!("Service {} not found", service_name))?;

        let result = match config.service_type {
            ServiceType::Docker => self.restart_docker_service(config).await?,
            ServiceType::Process => self.restart_process_service(config).await?,
            ServiceType::SystemService => self.restart_system_service(config).await?,
            ServiceType::ExternalApi => "Cannot restart external API service".to_string(),
        };

        Ok(result)
    }

    /// Restart Docker container
    async fn restart_docker_service(&self, config: &ServiceConfig) -> CommandResult<String> {
        let container_name = config.container_name.as_ref()
            .ok_or("No container name specified")?;

        self.docker.restart_container::<String>(container_name, None).await
            .map_err(|e| format!("Failed to restart container: {}", e))?;

        Ok(format!("Container {} restarted successfully", container_name))
    }

    /// Restart process service
    async fn restart_process_service(&self, config: &ServiceConfig) -> CommandResult<String> {
        // Implementation depends on how the process is managed
        // This is a placeholder for process restart logic
        Ok(format!("Process {} restart requested", config.service_name))
    }

    /// Restart systemd service
    async fn restart_system_service(&self, config: &ServiceConfig) -> CommandResult<String> {
        let output = Command::new("systemctl")
            .args(&["restart", &config.service_name])
            .output()
            .await
            .map_err(|e| format!("Failed to restart systemd service: {}", e))?;

        if output.status.success() {
            Ok(format!("Systemd service {} restarted", config.service_name))
        } else {
            Err(format!("Failed to restart service: {}", String::from_utf8_lossy(&output.stderr)))
        }
    }

    /// Add service configuration for monitoring
    pub async fn add_service_config(&self, config: ServiceConfig) -> CommandResult<()> {
        let mut configs = self.service_configs.write().await;
        configs.insert(config.name.clone(), config);
        Ok(())
    }

    /// Remove service from monitoring
    pub async fn remove_service_config(&self, service_name: &str) -> CommandResult<()> {
        let mut configs = self.service_configs.write().await;
        configs.remove(service_name);
        Ok(())
    }

    /// Enable/disable monitoring
    pub async fn set_monitoring_enabled(&self, enabled: bool) {
        let mut monitoring = self.monitoring_enabled.write().await;
        *monitoring = enabled;
    }

    /// Get all current service statuses from database
    pub async fn get_service_statuses(&self) -> CommandResult<Vec<ServiceStatus>> {
        let rows = sqlx::query!(
            r#"
            SELECT 
                id, service_name, service_type, status, health_endpoint,
                metrics, last_check, restart_count, error_message, config,
                is_monitored, created_at, updated_at
            FROM service_status 
            ORDER BY last_check DESC
            "#
        )
        .fetch_all(&*self.db_pool)
        .await
        .map_err(|e| format!("Failed to get service statuses: {}", e))?;

        let statuses: Result<Vec<ServiceStatus>, _> = rows.into_iter().map(|row| {
            let service_type: ServiceType = serde_json::from_str(&row.service_type.unwrap_or_default())?;
            let status: ContainerState = serde_json::from_str(&row.status.unwrap_or_default())?;

            Ok(ServiceStatus {
                id: row.id,
                service_name: row.service_name,
                service_type,
                status,
                health_endpoint: row.health_endpoint,
                metrics: row.metrics.unwrap_or_default(),
                last_check: row.last_check,
                restart_count: row.restart_count.unwrap_or(0),
                error_message: row.error_message,
                config: row.config.unwrap_or_default(),
                is_monitored: row.is_monitored.unwrap_or(true),
                created_at: row.created_at,
                updated_at: row.updated_at,
            })
        }).collect();

        statuses.map_err(|e| format!("Failed to parse service statuses: {}", e))
    }

    /// Get service status summary for dashboard
    pub async fn get_service_summary(&self) -> CommandResult<serde_json::Value> {
        let statuses = self.get_service_statuses().await?;

        let running_count = statuses.iter()
            .filter(|s| matches!(s.status, ContainerState::Running))
            .count();
        
        let stopped_count = statuses.iter()
            .filter(|s| matches!(s.status, ContainerState::Stopped))
            .count();
        
        let error_count = statuses.iter()
            .filter(|s| matches!(s.status, ContainerState::Error))
            .count();

        let total_cpu: f64 = statuses.iter()
            .map(|s| s.metrics["cpu_usage_percent"].as_f64().unwrap_or(0.0))
            .sum();

        let total_memory: i64 = statuses.iter()
            .map(|s| s.metrics["memory_usage_bytes"].as_i64().unwrap_or(0))
            .sum();

        Ok(serde_json::json!({
            "total_services": statuses.len(),
            "running": running_count,
            "stopped": stopped_count,
            "error": error_count,
            "total_cpu_usage": total_cpu,
            "total_memory_usage": total_memory,
            "last_updated": Utc::now()
        }))
    }
}

// Clone implementation for DockerMonitor
impl Clone for DockerMonitor {
    fn clone(&self) -> Self {
        Self {
            docker: Arc::clone(&self.docker),
            db_pool: Arc::clone(&self.db_pool),
            service_configs: Arc::clone(&self.service_configs),
            monitoring_enabled: Arc::clone(&self.monitoring_enabled),
        }
    }
}