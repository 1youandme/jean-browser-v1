import { JeanAction } from '@/types/common';

export interface TraeAgent {
  id: string;
  name: string;
  role: string;
  email: string;
  capabilities: string[];
  status: 'active' | 'idle' | 'error' | 'paused' | 'maintenance';
  priority: number; // 1-10, lower numbers = higher priority
  max_concurrent_tasks: number;
  current_tasks: number;
  docker_container?: string;
  configuration: Record<string, any>;
  performance_metrics: Record<string, any>;
  last_run?: Date;
  total_runs: number;
  successful_runs: number;
  failed_runs: number;
  average_execution_time_ms: number;
  resource_limits: {
    cpu: number;
    memory: number;
    disk: number;
  };
  webhook_url?: string;
  health_check_url?: string;
  auto_restart: boolean;
  maintenance_schedule?: Record<string, any>;
  tags: string[];
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
}

export interface TraeAgentTask {
  id: string;
  agent_id: string;
  task_type: string;
  parameters: Record<string, any>;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  priority: number; // 1-10
  max_retries: number;
  retry_count: number;
  scheduled_at: Date;
  started_at?: Date;
  completed_at?: Date;
  execution_time_ms?: number;
  result?: any;
  error_message?: string;
  created_by?: string;
  created_at: Date;
  updated_at: Date;
}

export interface TraeAgentLog {
  id: string;
  agent_id: string;
  task_id?: string;
  log_level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  message: string;
  context?: Record<string, any>;
  timestamp: Date;
  execution_id?: string;
}

// Complete list of 16 TRAE Agents
export const TRAE_AGENTS: TraeAgent[] = [
  {
    id: "1",
    name: "JeanTrailUI Designer",
    role: "واجهات المستخدم",
    email: "jeantrail1001@gmail.com",
    capabilities: ["design", "ui_components", "ux_research", "prototyping", "accessibility"],
    status: "active",
    priority: 3,
    max_concurrent_tasks: 2,
    current_tasks: 0,
    docker_container: "jeantrail-designer-1",
    configuration: {
      design_system: "tailwind",
      component_library: "shadcn-ui",
      figma_integration: true
    },
    performance_metrics: {
      cpu_usage: 15.2,
      memory_usage: 512,
      network_io: 1024,
      disk_io: 256
    },
    last_run: new Date(),
    total_runs: 1247,
    successful_runs: 1198,
    failed_runs: 49,
    average_execution_time_ms: 2300,
    resource_limits: {
      cpu: 50,
      memory: 2048,
      disk: 10240
    },
    webhook_url: "https://api.jeantrail.com/webhooks/designer",
    health_check_url: "https://api.jeantrail.com/health/designer",
    auto_restart: true,
    tags: ["ui", "design", "frontend"],
    created_at: new Date("2024-01-15"),
    updated_at: new Date(),
    is_active: true
  },
  {
    id: "2",
    name: "ذكاء محلي محسن",
    role: "AI models محلي",
    email: "jeantrail1002@gmail.com",
    capabilities: ["llm_management", "model_optimization", "inference", "fine_tuning", "quantization"],
    status: "active",
    priority: 1,
    max_concurrent_tasks: 4,
    current_tasks: 1,
    docker_container: "jeantrail-ai-2",
    configuration: {
      model_path: "/models/qwen",
      inference_engine: "llama.cpp",
      gpu_acceleration: true
    },
    performance_metrics: {
      cpu_usage: 78.5,
      memory_usage: 8192,
      network_io: 512,
      disk_io: 2048
    },
    last_run: new Date(),
    total_runs: 3542,
    successful_runs: 3521,
    failed_runs: 21,
    average_execution_time_ms: 850,
    resource_limits: {
      cpu: 80,
      memory: 16384,
      disk: 51200
    },
    webhook_url: "https://api.jeantrail.com/webhooks/ai-local",
    health_check_url: "https://api.jeantrail.com/health/ai-local",
    auto_restart: true,
    tags: ["ai", "llm", "inference", "local"],
    created_at: new Date("2024-01-15"),
    updated_at: new Date(),
    is_active: true
  },
  {
    id: "3",
    name: "Scraper Commerce",
    role: "جمع بيانات المنتجات",
    email: "jeantrail1003@gmail.com",
    capabilities: ["web_scraping", "data_extraction", "alibaba_1688", "amazon", "price_monitoring"],
    status: "active",
    priority: 2,
    max_concurrent_tasks: 3,
    current_tasks: 2,
    docker_container: "jeantrail-scraper-3",
    configuration: {
      browser_type: "chromium",
      proxy_rotation: true,
      rate_limiting: {
        requests_per_minute: 60,
        burst_size: 10
      }
    },
    performance_metrics: {
      cpu_usage: 45.3,
      memory_usage: 2048,
      network_io: 8192,
      disk_io: 1024
    },
    last_run: new Date(),
    total_runs: 892,
    successful_runs: 834,
    failed_runs: 58,
    average_execution_time_ms: 5200,
    resource_limits: {
      cpu: 60,
      memory: 4096,
      disk: 20480
    },
    webhook_url: "https://api.jeantrail.com/webhooks/scraper",
    health_check_url: "https://api.jeantrail.com/health/scraper",
    auto_restart: true,
    tags: ["scraping", "ecommerce", "data"],
    created_at: new Date("2024-01-16"),
    updated_at: new Date(),
    is_active: true
  },
  {
    id: "4",
    name: "DevOps مهندس",
    role: "البنية التحتية",
    email: "jeantrail1004@gmail.com",
    capabilities: ["docker", "kubernetes", "deployment", "monitoring", "ci_cd"],
    status: "active",
    priority: 2,
    max_concurrent_tasks: 2,
    current_tasks: 0,
    docker_container: "jeantrail-devops-4",
    configuration: {
      kubernetes_cluster: "jeantrail-prod",
      monitoring_stack: "prometheus-grafana",
      ci_cd_pipeline: "github-actions"
    },
    performance_metrics: {
      cpu_usage: 12.8,
      memory_usage: 1024,
      network_io: 2048,
      disk_io: 512
    },
    last_run: new Date(),
    total_runs: 456,
    successful_runs: 442,
    failed_runs: 14,
    average_execution_time_ms: 1800,
    resource_limits: {
      cpu: 40,
      memory: 2048,
      disk: 5120
    },
    webhook_url: "https://api.jeantrail.com/webhooks/devops",
    health_check_url: "https://api.jeantrail.com/health/devops",
    auto_restart: true,
    tags: ["devops", "infrastructure", "deployment"],
    created_at: new Date("2024-01-17"),
    updated_at: new Date(),
    is_active: true
  },
  {
    id: "5",
    name: "مدير مشروع البرمجيات",
    role: "التنسيق والمتابعة",
    email: "jeantrail1005@gmail.com",
    capabilities: ["project_management", "coordination", "tracking", "reporting", "planning"],
    status: "idle",
    priority: 4,
    max_concurrent_tasks: 5,
    current_tasks: 0,
    docker_container: "jeantrail-pm-5",
    configuration: {
      project_management_tool: "github-projects",
      reporting_frequency: "daily",
      notification_channels: ["slack", "email"]
    },
    performance_metrics: {
      cpu_usage: 8.5,
      memory_usage: 512,
      network_io: 256,
      disk_io: 128
    },
    last_run: new Date(),
    total_runs: 234,
    successful_runs: 228,
    failed_runs: 6,
    average_execution_time_ms: 1200,
    resource_limits: {
      cpu: 30,
      memory: 1024,
      disk: 2048
    },
    webhook_url: "https://api.jeantrail.com/webhooks/project-manager",
    health_check_url: "https://api.jeantrail.com/health/project-manager",
    auto_restart: true,
    tags: ["management", "coordination", "tracking"],
    created_at: new Date("2024-01-18"),
    updated_at: new Date(),
    is_active: true
  },
  {
    id: "6",
    name: "مهندس اختبارات",
    role: "الجودة والأداء",
    email: "jeantrail1006@gmail.com",
    capabilities: ["qa", "testing", "performance_testing", "bug_tracking", "automation"],
    status: "active",
    priority: 3,
    max_concurrent_tasks: 3,
    current_tasks: 1,
    docker_container: "jeantrail-qa-6",
    configuration: {
      testing_framework: "jest+cypress",
      performance_tools: "lighthouse+webpagetest",
      bug_tracking: "github-issues"
    },
    performance_metrics: {
      cpu_usage: 25.7,
      memory_usage: 1536,
      network_io: 1024,
      disk_io: 768
    },
    last_run: new Date(),
    total_runs: 678,
    successful_runs: 654,
    failed_runs: 24,
    average_execution_time_ms: 3400,
    resource_limits: {
      cpu: 50,
      memory: 3072,
      disk: 6144
    },
    webhook_url: "https://api.jeantrail.com/webhooks/qa",
    health_check_url: "https://api.jeantrail.com/health/qa",
    auto_restart: true,
    tags: ["testing", "qa", "quality"],
    created_at: new Date("2024-01-19"),
    updated_at: new Date(),
    is_active: true
  },
  {
    id: "7",
    name: "أخصائي أمان",
    role: "الحماية والأمان",
    email: "jeantrail1007@gmail.com",
    capabilities: ["security", "encryption", "penetration_testing", "audit", "compliance"],
    status: "active",
    priority: 1,
    max_concurrent_tasks: 2,
    current_tasks: 0,
    docker_container: "jeantrail-security-7",
    configuration: {
      security_tools: ["nessus", "owasp-zap", "burp-suite"],
      encryption_standards: ["aes-256", "rsa-4096"],
      compliance_frameworks: ["gdpr", "soc2", "iso27001"]
    },
    performance_metrics: {
      cpu_usage: 18.3,
      memory_usage: 2048,
      network_io: 512,
      disk_io: 1024
    },
    last_run: new Date(),
    total_runs: 189,
    successful_runs: 184,
    failed_runs: 5,
    average_execution_time_ms: 4500,
    resource_limits: {
      cpu: 40,
      memory: 4096,
      disk: 8192
    },
    webhook_url: "https://api.jeantrail.com/webhooks/security",
    health_check_url: "https://api.jeantrail.com/health/security",
    auto_restart: true,
    tags: ["security", "audit", "compliance"],
    created_at: new Date("2024-01-20"),
    updated_at: new Date(),
    is_active: true
  },
  {
    id: "8",
    name: "محاكي الجوال",
    role: "اختبار على موبايل",
    email: "jeantrail1008@gmail.com",
    capabilities: ["mobile_emulation", "cross_device_testing", "responsive_design", "app_testing"],
    status: "idle",
    priority: 5,
    max_concurrent_tasks: 4,
    current_tasks: 0,
    docker_container: "jeantrail-mobile-8",
    configuration: {
      devices: ["iphone-14", "samsung-s22", "ipad-air"],
      browsers: ["safari", "chrome-mobile", "firefox-mobile"],
      os_versions: ["ios-16", "android-13"]
    },
    performance_metrics: {
      cpu_usage: 22.1,
      memory_usage: 3072,
      network_io: 1536,
      disk_io: 2048
    },
    last_run: new Date(),
    total_runs: 412,
    successful_runs: 398,
    failed_runs: 14,
    average_execution_time_ms: 2800,
    resource_limits: {
      cpu: 60,
      memory: 6144,
      disk: 12288
    },
    webhook_url: "https://api.jeantrail.com/webhooks/mobile",
    health_check_url: "https://api.jeantrail.com/health/mobile",
    auto_restart: true,
    tags: ["mobile", "testing", "emulation"],
    created_at: new Date("2024-01-21"),
    updated_at: new Date(),
    is_active: true
  },
  {
    id: "9",
    name: "دعم جين تريل",
    role: "مساعدة المستخدمين",
    email: "jeantrail1009@gmail.com",
    capabilities: ["customer_support", "documentation", "training", "knowledge_base"],
    status: "active",
    priority: 4,
    max_concurrent_tasks: 8,
    current_tasks: 3,
    docker_container: "jeantrail-support-9",
    configuration: {
      support_channels: ["chat", "email", "phone"],
      knowledge_base: "confluence",
      response_time_sla: "5min"
    },
    performance_metrics: {
      cpu_usage: 15.6,
      memory_usage: 1024,
      network_io: 512,
      disk_io: 256
    },
    last_run: new Date(),
    total_runs: 2341,
    successful_runs: 2298,
    failed_runs: 43,
    average_execution_time_ms: 900,
    resource_limits: {
      cpu: 30,
      memory: 2048,
      disk: 4096
    },
    webhook_url: "https://api.jeantrail.com/webhooks/support",
    health_check_url: "https://api.jeantrail.com/health/support",
    auto_restart: true,
    tags: ["support", "help", "documentation"],
    created_at: new Date("2024-01-22"),
    updated_at: new Date(),
    is_active: true
  },
  {
    id: "10",
    name: "مدير بروكسي",
    role: "شبكة بروكسي آمنة",
    email: "jeantrail1010@gmail.com",
    capabilities: ["proxy_management", "p2p_networking", "mesh_network", "load_balancing"],
    status: "active",
    priority: 1,
    max_concurrent_tasks: 10,
    current_tasks: 2,
    docker_container: "jeantrail-proxy-10",
    configuration: {
      proxy_type: "http-socks5",
      rotation_interval: 300,
      geo_distribution: ["us", "eu", "asia"]
    },
    performance_metrics: {
      cpu_usage: 35.8,
      memory_usage: 4096,
      network_io: 16384,
      disk_io: 512
    },
    last_run: new Date(),
    total_runs: 5678,
    successful_runs: 5621,
    failed_runs: 57,
    average_execution_time_ms: 450,
    resource_limits: {
      cpu: 70,
      memory: 8192,
      disk: 4096
    },
    webhook_url: "https://api.jeantrail.com/webhooks/proxy",
    health_check_url: "https://api.jeantrail.com/health/proxy",
    auto_restart: true,
    tags: ["proxy", "network", "security"],
    created_at: new Date("2024-01-23"),
    updated_at: new Date(),
    is_active: true
  },
  {
    id: "11",
    name: "سوق جين ترايل",
    role: "سوق إلكتروني",
    email: "info@jeantrail.com",
    capabilities: ["ecommerce", "product_management", "order_processing", "inventory"],
    status: "active",
    priority: 2,
    max_concurrent_tasks: 5,
    current_tasks: 1,
    docker_container: "jeantrail-market-11",
    configuration: {
      payment_gateways: ["stripe", "paypal"],
      shipping_providers: ["fedex", "ups", "dhl"],
      tax_calculator: "avalara"
    },
    performance_metrics: {
      cpu_usage: 42.3,
      memory_usage: 3072,
      network_io: 4096,
      disk_io: 1536
    },
    last_run: new Date(),
    total_runs: 1892,
    successful_runs: 1845,
    failed_runs: 47,
    average_execution_time_ms: 1650,
    resource_limits: {
      cpu: 60,
      memory: 6144,
      disk: 10240
    },
    webhook_url: "https://api.jeantrail.com/webhooks/marketplace",
    health_check_url: "https://api.jeantrail.com/health/marketplace",
    auto_restart: true,
    tags: ["ecommerce", "marketplace", "sales"],
    created_at: new Date("2024-01-24"),
    updated_at: new Date(),
    is_active: true
  },
  {
    id: "12",
    name: "مدير العملة",
    role: "عملة رقمية ومدفوعات",
    email: "support@jeantrail.com",
    capabilities: ["payment_processing", "crypto", "tokenomics", "wallet", "fraud_detection"],
    status: "active",
    priority: 1,
    max_concurrent_tasks: 3,
    current_tasks: 1,
    docker_container: "jeantrail-payments-12",
    configuration: {
      supported_cryptos: ["btc", "eth", "usdt"],
      fiat_currencies: ["usd", "eur", "gbp"],
      compliance_level: "kyc-enhanced"
    },
    performance_metrics: {
      cpu_usage: 28.9,
      memory_usage: 2048,
      network_io: 2048,
      disk_io: 1024
    },
    last_run: new Date(),
    total_runs: 789,
    successful_runs: 778,
    failed_runs: 11,
    average_execution_time_ms: 2100,
    resource_limits: {
      cpu: 50,
      memory: 4096,
      disk: 8192
    },
    webhook_url: "https://api.jeantrail.com/webhooks/payments",
    health_check_url: "https://api.jeantrail.com/health/payments",
    auto_restart: true,
    tags: ["payments", "crypto", "finance"],
    created_at: new Date("2024-01-25"),
    updated_at: new Date(),
    is_active: true
  },
  {
    id: "13",
    name: "Shopify متكامل",
    role: "تكامل مع متاجر",
    email: "contact@jeantrail.com",
    capabilities: ["shopify_integration", "api_gateway", "webhooks", "sync_engine"],
    status: "active",
    priority: 3,
    max_concurrent_tasks: 4,
    current_tasks: 0,
    docker_container: "jeantrail-shopify-13",
    configuration: {
      shopify_api_version: "2024-01",
      sync_frequency: "5min",
      webhook_events: ["order_created", "product_updated", "inventory_changed"]
    },
    performance_metrics: {
      cpu_usage: 19.4,
      memory_usage: 1536,
      network_io: 3072,
      disk_io: 768
    },
    last_run: new Date(),
    total_runs: 523,
    successful_runs: 516,
    failed_runs: 7,
    average_execution_time_ms: 1350,
    resource_limits: {
      cpu: 40,
      memory: 3072,
      disk: 6144
    },
    webhook_url: "https://api.jeantrail.com/webhooks/shopify",
    health_check_url: "https://api.jeantrail.com/health/shopify",
    auto_restart: true,
    tags: ["shopify", "integration", "sync"],
    created_at: new Date("2024-01-26"),
    updated_at: new Date(),
    is_active: true
  },
  {
    id: "14",
    name: "وسائط الذكاء",
    role: "إنتاج صور وفيديو",
    email: "sales@jeantrail.com",
    capabilities: ["image_generation", "video_creation", "audio_processing", "sdxl", "cogvideox"],
    status: "active",
    priority: 5,
    max_concurrent_tasks: 2,
    current_tasks: 1,
    docker_container: "jeantrail-media-14",
    configuration: {
      image_model: "stable-diffusion-xl",
      video_model: "cogvideox",
      audio_model: "whisper-large-v3",
      gpu_acceleration: true
    },
    performance_metrics: {
      cpu_usage: 67.2,
      memory_usage: 12288,
      network_io: 4096,
      disk_io: 8192
    },
    last_run: new Date(),
    total_runs: 342,
    successful_runs: 328,
    failed_runs: 14,
    average_execution_time_ms: 8900,
    resource_limits: {
      cpu: 80,
      memory: 24576,
      disk: 49152
    },
    webhook_url: "https://api.jeantrail.com/webhooks/media",
    health_check_url: "https://api.jeantrail.com/health/media",
    auto_restart: true,
    tags: ["media", "ai", "generation"],
    created_at: new Date("2024-01-27"),
    updated_at: new Date(),
    is_active: true
  },
  {
    id: "15",
    name: "مدير خدمات بلا نت",
    role: "عمل أوفلاين",
    email: "noreply@jeantrail.com",
    capabilities: ["offline_sync", "cache_management", "local_storage", "conflict_resolution"],
    status: "idle",
    priority: 6,
    max_concurrent_tasks: 6,
    current_tasks: 0,
    docker_container: "jeantrail-offline-15",
    configuration: {
      cache_size: "2gb",
      sync_strategy: "eventual-consistency",
      conflict_resolution: "last-write-wins"
    },
    performance_metrics: {
      cpu_usage: 8.7,
      memory_usage: 1024,
      network_io: 128,
      disk_io: 512
    },
    last_run: new Date(),
    total_runs: 156,
    successful_runs: 154,
    failed_runs: 2,
    average_execution_time_ms: 600,
    resource_limits: {
      cpu: 20,
      memory: 2048,
      disk: 4096
    },
    webhook_url: "https://api.jeantrail.com/webhooks/offline",
    health_check_url: "https://api.jeantrail.com/health/offline",
    auto_restart: true,
    tags: ["offline", "sync", "cache"],
    created_at: new Date("2024-01-28"),
    updated_at: new Date(),
    is_active: true
  },
  {
    id: "16",
    name: "Automation Master",
    role: "أتمتة كاملة",
    email: "jeantrail.official@gmail.com",
    capabilities: ["workflow_automation", "job_scheduling", "n8n_integration", "process_optimization"],
    status: "active",
    priority: 2,
    max_concurrent_tasks: 8,
    current_tasks: 4,
    docker_container: "jeantrail-automation-16",
    configuration: {
      workflow_engine: "n8n",
      scheduler: "node-cron",
      optimization_algorithm: "genetic"
    },
    performance_metrics: {
      cpu_usage: 31.5,
      memory_usage: 4096,
      network_io: 2048,
      disk_io: 1536
    },
    last_run: new Date(),
    total_runs: 4234,
    successful_runs: 4198,
    failed_runs: 36,
    average_execution_time_ms: 750,
    resource_limits: {
      cpu: 60,
      memory: 8192,
      disk: 12288
    },
    webhook_url: "https://api.jeantrail.com/webhooks/automation",
    health_check_url: "https://api.jeantrail.com/health/automation",
    auto_restart: true,
    tags: ["automation", "workflow", "optimization"],
    created_at: new Date("2024-01-29"),
    updated_at: new Date(),
    is_active: true
  }
];

// API functions for TRAE agents
export class TraeAgentService {
  static async getAgents(): Promise<TraeAgent[]> {
    const response = await fetch('/api/agents');
    if (!response.ok) throw new Error('Failed to fetch agents');
    return response.json();
  }

  static async getAgent(agentId: string): Promise<TraeAgent> {
    const response = await fetch(`/api/agents/${agentId}`);
    if (!response.ok) throw new Error('Failed to fetch agent');
    return response.json();
  }

  static async getAgentStatus(agentId: string): Promise<TraeAgent> {
    const response = await fetch(`/api/agents/${agentId}/status`);
    if (!response.ok) throw new Error('Failed to fetch agent status');
    return response.json();
  }

  static async getAgentTasks(agentId: string): Promise<TraeAgentTask[]> {
    const response = await fetch(`/api/agents/${agentId}/tasks`);
    if (!response.ok) throw new Error('Failed to fetch agent tasks');
    return response.json();
  }

  static async getAgentLogs(agentId: string): Promise<TraeAgentLog[]> {
    const response = await fetch(`/api/agents/${agentId}/logs`);
    if (!response.ok) throw new Error('Failed to fetch agent logs');
    return response.json();
  }

  static async dispatchTaskToAgent(agentId: string, task: {
    type: string;
    parameters: Record<string, any>;
    priority?: number;
  }): Promise<TraeAgentTask> {
    const response = await fetch(`/api/agents/${agentId}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task_type: task.type,
        parameters: task.parameters,
        priority: task.priority || 5
      })
    });
    if (!response.ok) throw new Error('Failed to dispatch task');
    return response.json();
  }

  static async controlAgent(agentId: string, action: 'start' | 'pause' | 'stop' | 'restart'): Promise<void> {
    const response = await fetch(`/api/agents/${agentId}/control`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action })
    });
    if (!response.ok) throw new Error(`Failed to ${action} agent`);
  }

  static async createAgent(agent: Omit<TraeAgent, 'id' | 'created_at' | 'updated_at'>): Promise<TraeAgent> {
    const response = await fetch('/api/agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(agent)
    });
    if (!response.ok) throw new Error('Failed to create agent');
    return response.json();
  }

  static async updateAgent(agentId: string, updates: Partial<TraeAgent>): Promise<TraeAgent> {
    const response = await fetch(`/api/agents/${agentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!response.ok) throw new Error('Failed to update agent');
    return response.json();
  }

  static async deleteAgent(agentId: string): Promise<void> {
    const response = await fetch(`/api/agents/${agentId}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete agent');
  }

  static async getAgentMetrics(agentId: string, timeframe: 'hour' | 'day' | 'week' | 'month'): Promise<Record<string, any>> {
    const response = await fetch(`/api/agents/${agentId}/metrics?timeframe=${timeframe}`);
    if (!response.ok) throw new Error('Failed to fetch agent metrics');
    return response.json();
  }

  static async getSystemMetrics(): Promise<Record<string, any>> {
    const response = await fetch('/api/agents/metrics/system');
    if (!response.ok) throw new Error('Failed to fetch system metrics');
    return response.json();
  }
}

export default TraeAgentService;