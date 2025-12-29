# ⚙️ JeanTrail OS - Configuration Guide

## 📋 Table of Contents
- [Overview](#overview)
- [Environment Variables](#environment-variables)
- [Configuration Files](#configuration-files)
- [AI Model Configuration](#ai-model-configuration)
- [Database Configuration](#database-configuration)
- [Security Configuration](#security-configuration)
- [Performance Tuning](#performance-tuning)
- [Feature Flags](#feature-flags)
- [Logging Configuration](#logging-configuration)
- [Development vs Production](#development-vs-production)

---

## 🌟 Overview

JeanTrail OS uses a flexible configuration system supporting environment variables, configuration files, and runtime settings. This guide covers all configuration options to customize your JeanTrail OS installation.

### Configuration Priority (High to Low)
1. Environment variables
2. `.env` file
3. Configuration files (JSON/YAML)
4. Default values

---

## 🌍 Environment Variables

### Core Application Settings

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `NODE_ENV` | string | `development` | Environment mode (development/production/test) |
| `PORT` | number | `1420` | Frontend server port |
| `HOST` | string | `localhost` | Server host |
| `TAURI_DEV_PORT` | number | `1420` | Tauri development port |

### Database Configuration

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `DATABASE_URL` | string | `postgresql://jeantrail:password@localhost:5432/jeantrail` | PostgreSQL connection string |
| `REDIS_URL` | string | `redis://localhost:6379` | Redis connection string |
| `DB_POOL_SIZE` | number | `10` | Database connection pool size |
| `DB_TIMEOUT` | number | `30000` | Database query timeout (ms) |

### AI Services Configuration

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `QWEN_API_URL` | string | `http://localhost:8001` | Qwen-3 API endpoint |
| `SDXL_API_URL` | string | `http://localhost:8002` | SDXL API endpoint |
| `WHISPER_API_URL` | string | `http://localhost:8003` | Whisper API endpoint |
| `COQUI_TTS_API_URL` | string | `http://localhost:8004` | Coqui TTS API endpoint |
| `AI_TIMEOUT` | number | `120000` | AI service timeout (ms) |
| `AI_MAX_RETRIES` | number | `3` | Maximum retry attempts for AI calls |

### Jean AI Configuration

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `JEAN_MODEL` | string | `qwen-3-72b` | Default AI model for Jean |
| `JEAN_TEMPERATURE` | float | `0.7` | Jean response randomness (0.0-1.0) |
| `JEAN_MAX_TOKENS` | number | `2048` | Maximum response length |
| `JEAN_TOP_P` | float | `0.9` | Nucleus sampling parameter |
| `JEAN_FREQUENCY_PENALTY` | float | `0.0` | Repetition penalty |
| `JEAN_PRESENCE_PENALTY` | float | `0.0` | Presence penalty |

### Security & Authentication

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `JWT_SECRET` | string | `change-me-in-production` | JWT signing secret |
| `JWT_EXPIRES_IN` | string | `24h` | JWT expiration time |
| `REFRESH_TOKEN_EXPIRES_IN` | string | `7d` | Refresh token expiration |
| `CORS_ORIGIN` | string | `http://localhost:1420` | CORS allowed origins |
| `RATE_LIMIT_WINDOW` | number | `60000` | Rate limit window (ms) |
| `RATE_LIMIT_MAX` | number | `100` | Max requests per window |

---

## 🤖 AI Model Configuration

### Qwen-3 Settings
```yaml
# ai/models/qwen3.yaml
model:
  name: "Qwen/Qwen-3-72B"
  quantization: "Q4_K_M"
  context_length: 32768
  gpu_layers: -1
  batch_size: 512

generation:
  temperature: 0.7
  top_p: 0.9
  max_tokens: 2048
  frequency_penalty: 0.0
  presence_penalty: 0.0
```

### SDXL Configuration
```yaml
# ai/models/sdxl.yaml
model:
  name: "stabilityai/stable-diffusion-xl-base-1.0"
  scheduler: "DPMSolverMultistepScheduler"
  
generation:
  width: 1024
  height: 1024
  num_inference_steps: 30
  guidance_scale: 7.5
  negative_prompt: "blurry, low quality, distorted"
```

---

## 🗄️ Database Configuration

### PostgreSQL Settings
```yaml
# database/postgresql.yaml
database:
  host: localhost
  port: 5432
  name: jeantrail
  user: jeantrail
  password: password
  ssl_mode: prefer
  
pool:
  min_size: 5
  max_size: 20
  acquire_timeout: 30000
  idle_timeout: 600000
  
migrations:
  auto_migrate: true
  migration_path: ./database/migrations
```

### Redis Configuration
```yaml
# cache/redis.yaml
redis:
  host: localhost
  port: 6379
  db: 0
  password: null
  
cache:
  default_ttl: 3600
  max_memory: 2gb
  eviction_policy: allkeys-lru
```

---

## 🔒 Security Configuration

### JWT Settings
```yaml
# security/jwt.yaml
jwt:
  secret: ${JWT_SECRET}
  algorithm: HS256
  expires_in: 24h
  refresh_expires_in: 7d
  
  issuer: "jeantrail-os"
  audience: "jeantrail-users"
  
encryption:
  algorithm: AES-256-GCM
  key_derivation: PBKDF2
  iterations: 100000
```

### CORS Policy
```yaml
# security/cors.yaml
cors:
  origins: ["${CORS_ORIGIN}"]
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
  headers: ["Content-Type", "Authorization"]
  credentials: true
  max_age: 86400
```

---

## ⚡ Performance Tuning

### Application Performance
```yaml
# performance/app.yaml
server:
  workers: auto
  max_connections: 1000
  keep_alive_timeout: 65
  body_limit: 100mb
  
cache:
  enabled: true
  backend: redis
  ttl: 3600
  max_size: 1gb
  
compression:
  enabled: true
  algorithm: gzip
  level: 6
  min_length: 1024
```

### AI Performance
```yaml
# performance/ai.yaml
inference:
  batch_size: 512
  max_concurrent_requests: 10
  timeout: 120000
  
cache:
  enabled: true
  ttl: 3600
  max_entries: 1000
  
resource_limits:
  max_memory: 8gb
  max_gpu_memory: 6gb
```

---

## 🚦 Feature Flags

### Core Features
```yaml
# features/core.yaml
features:
  jean_assistant: true
  ai_generation: true
  proxy_network: true
  file_management: true
  real_time_collaboration: false
  
beta_features:
  voice_commands: true
  gesture_control: false
  ar_browsing: false
  
experimental:
  quantum_computing: false
  neural_interface: false
```

---

## 📝 Logging Configuration

### Log Settings
```yaml
# logging/config.yaml
logging:
  level: ${LOG_LEVEL:info}
  format: json
  
outputs:
  console:
    enabled: true
    level: info
    
  file:
    enabled: true
    path: ${LOG_FILE:./logs/jeantrail.log}
    level: info
    max_size: 100mb
    max_files: 10
    
  sentry:
    enabled: ${SENTRY_ENABLED:false}
    dsn: ${SENTRY_DSN}
    environment: ${NODE_ENV}
    
loggers:
  jean_ai:
    level: debug
  browser:
    level: info
  ai_services:
    level: warn
```

---

## 🔧 Development vs Production

### Development Configuration
```bash
# .env.development
NODE_ENV=development
LOG_LEVEL=debug
PORT=1420

# Database (local)
DATABASE_URL=postgresql://dev:dev@localhost:5432/jeantrail_dev
REDIS_URL=redis://localhost:6379/0

# AI Services (local)
QWEN_API_URL=http://localhost:8001
SDXL_API_URL=http://localhost:8002

# Security (relaxed)
JWT_SECRET=dev-secret-key
CORS_ORIGIN=http://localhost:1420
RATE_LIMIT_MAX=1000

# Features (all enabled)
FEATURE_JEAN_ASSISTANT=true
FEATURE_AI_GENERATION=true
FEATURE_VOICE_COMMANDS=true
```

### Production Configuration
```bash
# .env.production
NODE_ENV=production
LOG_LEVEL=info
PORT=3000
HOST=0.0.0.0

# Database (managed)
DATABASE_URL=postgresql://prod_user:secure_pass@db.example.com:5432/jeantrail_prod
REDIS_URL=redis://redis.example.com:6379/1

# AI Services (managed)
QWEN_API_URL=https://ai.jeantrail.ai/qwen
SDXL_API_URL=https://ai.jeantrail.ai/sdxl

# Security (strict)
JWT_SECRET=super-secure-production-secret
CORS_ORIGIN=https://your-domain.com
RATE_LIMIT_MAX=100

# Monitoring
SENTRY_DSN=https://your-sentry-dsn
PROMETHEUS_PORT=9090
```

---

## 🛠️ Configuration Management

### Environment-Specific Configs
```javascript
// src/config/index.ts
import dotenv from 'dotenv';
import path from 'path';

// Load environment-specific config
const env = process.env.NODE_ENV || 'development';
dotenv.config({ path: `.env.${env}` });

export const config = {
  app: {
    name: 'JeanTrail OS',
    version: '1.0.0',
    port: parseInt(process.env.PORT || '1420'),
    env: process.env.NODE_ENV || 'development'
  },
  
  database: {
    url: process.env.DATABASE_URL!,
    pool: {
      min: parseInt(process.env.DB_POOL_MIN || '5'),
      max: parseInt(process.env.DB_POOL_MAX || '20')
    }
  },
  
  ai: {
    qwen: {
      url: process.env.QWEN_API_URL!,
      model: process.env.JEAN_MODEL || 'qwen-3-72b',
      temperature: parseFloat(process.env.JEAN_TEMPERATURE || '0.7')
    },
    timeout: parseInt(process.env.AI_TIMEOUT || '120000')
  },
  
  security: {
    jwt: {
      secret: process.env.JWT_SECRET!,
      expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    },
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:1420'
    }
  }
};
```

### Validation Schema
```typescript
// src/config/validation.ts
import Joi from 'joi';

export const configSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').required(),
  PORT: Joi.number().port().default(1420),
  DATABASE_URL: Joi.string().uri().required(),
  REDIS_URL: Joi.string().uri().required(),
  JWT_SECRET: Joi.string().min(32).required(),
  JEAN_TEMPERATURE: Joi.number().min(0).max(1).default(0.7),
  JEAN_MAX_TOKENS: Joi.number().min(1).max(4096).default(2048)
});

// Validate configuration
export function validateConfig(): void {
  const { error } = configSchema.validate(process.env);
  if (error) {
    throw new Error(`Configuration validation failed: ${error.message}`);
  }
}
```

---

## 📊 Configuration Examples

### High-Performance Setup
```bash
# High-performance configuration
NODE_ENV=production
LOG_LEVEL=warn

# Optimized database
DB_POOL_SIZE=50
DB_TIMEOUT=10000

# AI optimizations
JEAN_MAX_TOKENS=1024
AI_TIMEOUT=60000

# Performance features
COMPRESSION_ENABLED=true
CACHE_ENABLED=true
RATE_LIMIT_MAX=1000
```

### Privacy-Focused Setup
```bash
# Privacy-focused configuration
PRIVACY_SHARE_STATS=false
PRIVACY_TELEMETRY=false
PRIVACY_CRASH_REPORTS=false

# Security hardening
JWT_EXPIRES_IN=1h
RATE_LIMIT_MAX=50
CORS_ORIGIN=https://your-domain.com

# Data retention
LOG_RETENTION_DAYS=7
CACHE_TTL=300
SESSION_TIMEOUT=1800
```

### Development Setup
```bash
# Development configuration
NODE_ENV=development
LOG_LEVEL=debug

# Local services
DATABASE_URL=postgresql://dev:dev@localhost:5432/jeantrail_dev
QWEN_API_URL=http://localhost:8001

# Relaxed security
JWT_SECRET=dev-secret
RATE_LIMIT_MAX=10000
CORS_ORIGIN=*
```

---

## 🔄 Dynamic Configuration

### Runtime Updates
```typescript
// src/config/runtime.ts
import { EventEmitter } from 'events';

export class ConfigManager extends EventEmitter {
  private config: Map<string, any> = new Map();
  
  update(key: string, value: any): void {
    this.config.set(key, value);
    this.emit('config:updated', { key, value });
  }
  
  get(key: string): any {
    return this.config.get(key);
  }
  
  reload(): void {
    // Reload configuration from environment
    this.emit('config:reloaded');
  }
}

// Usage example
const configManager = new ConfigManager();
configManager.on('config:updated', ({ key, value }) => {
  console.log(`Configuration updated: ${key} = ${value}`);
});
```

---

## 📋 Configuration Checklist

### Pre-deployment Checklist
- [ ] Environment variables set correctly
- [ ] Database connection string valid
- [ ] JWT secret is strong and unique
- [ ] CORS origins properly configured
- [ ] Rate limits appropriate for expected load
- [ ] Log level set appropriately
- [ ] Feature flags configured for environment
- [ ] SSL certificates configured (production)
- [ ] Backup and recovery settings configured

### Security Checklist
- [ ] JWT secrets rotated regularly
- [ ] Database credentials secure
- [ ] API keys stored securely
- [ ] HTTPS enabled in production
- [ ] Security headers configured
- [ ] Input validation enabled
- [ ] Rate limiting enabled
- [ ] Audit logging enabled

---

## 🆘 Configuration Troubleshooting

### Common Issues

#### Database Connection Failed
```bash
# Check connection string
psql $DATABASE_URL

# Verify PostgreSQL is running
docker ps | grep postgres

# Check network connectivity
telnet $DB_HOST $DB_PORT
```

#### AI Services Not Responding
```bash
# Check AI service status
curl -f http://localhost:8001/health

# Verify Docker containers
docker-compose ps

# Check service logs
docker-compose logs qwen-3-72b
```

#### Authentication Issues
```bash
# Verify JWT secret
echo $JWT_SECRET | wc -c

# Test token generation
curl -X POST /api/auth/login -d '{"email":"test@test.com","password":"test"}'
```

---

## 📖 Best Practices

1. **Use environment variables** for all sensitive configuration
2. **Validate configuration** at startup
3. **Use different configs** for development/staging/production
4. **Document all configuration options**
5. **Use strong secrets** and rotate them regularly
6. **Monitor configuration changes** in production
7. **Backup configuration files** regularly
8. **Use feature flags** for gradual rollouts

---

**Configuration Guide v1.0** | **Last Updated: December 2024** | **Author: Jean AI Assistant** 🤖