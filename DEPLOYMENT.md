# 🚀 JeanTrail OS - Deployment Guide

## 📋 Table of Contents
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Development Deployment](#development-deployment)
- [Production Deployment](#production-deployment)
- [Docker Services](#docker-services)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [SSL/HTTPS Setup](#sslhttps-setup)
- [Monitoring & Logging](#monitoring--logging)
- [Scaling & Performance](#scaling--performance)
- [Troubleshooting](#troubleshooting)

---

## 🔧 Prerequisites

### System Requirements
- **Operating System**: Linux (Ubuntu 20.04+), macOS (10.15+), or Windows 10+
- **RAM**: 16GB minimum (32GB+ recommended for AI models)
- **Storage**: 50GB available space (100GB+ recommended)
- **GPU**: NVIDIA GPU with 8GB+ VRAM (optional but recommended for AI models)

### Required Software
1. **Docker** & **Docker Compose**
   ```bash
   # Linux
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   
   # Install Docker Compose
   sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

2. **Node.js** (v18 or later)
   ```bash
   # Using NVM
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   nvm install 18
   nvm use 18
   ```

3. **Git**
   ```bash
   sudo apt-get install git  # Linux
   brew install git         # macOS
   ```

---

## 🚀 Quick Start

### One-Command Startup
```bash
# Clone the repository
git clone https://github.com/jeantrail/jeantrail-os.git
cd jeantrail-os

# Start everything (Linux/macOS)
./run.sh

# Or on Windows
run.bat
```

### Manual Startup
```bash
# 1. Setup environment
cp .env.example .env
npm install

# 2. Start AI services
docker-compose -f docker-compose.ai.yml up -d

# 3. Start frontend
npm run dev
```

### Access URLs
- **Frontend**: http://localhost:1420
- **Qwen-3 API**: http://localhost:8001
- **SDXL API**: http://localhost:8002
- **Whisper API**: http://localhost:8003
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

---

## 🛠️ Development Deployment

### Local Development Setup
```bash
# 1. Clone and setup
git clone https://github.com/jeantrail/jeantrail-os.git
cd jeantrail-os

# 2. Configure environment
cp .env.example .env.development
# Edit .env.development with your settings

# 3. Start development stack
docker-compose -f docker-compose.dev.yml up -d
npm run dev
```

### Development Environment Variables
```bash
NODE_ENV=development
PORT=1420
DATABASE_URL=postgresql://dev:dev@localhost:5432/jeantrail_dev
REDIS_URL=redis://localhost:6379/0
LOG_LEVEL=debug
```

### Hot Reload Configuration
```javascript
// vite.config.ts
export default defineConfig({
  server: {
    port: 1420,
    hmr: {
      port: 1421
    }
  },
  // ... other config
})
```

---

## 🏭 Production Deployment

### Production Server Setup

#### 1. Server Requirements
- **CPU**: 8+ cores (16+ recommended)
- **RAM**: 32GB+ (64GB+ recommended)
- **Storage**: 200GB+ SSD
- **Network**: 1Gbps+ connection
- **GPU**: NVIDIA A100/V100 (for AI services)

#### 2. Environment Preparation
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Create app user
sudo useradd -m -s /bin/bash jeantrail
sudo usermod -aG docker jeantrail
```

#### 3. Application Deployment
```bash
# Switch to app user
sudo su - jeantrail

# Clone repository
git clone https://github.com/jeantrail/jeantrail-os.git
cd jeantrail-os

# Configure production environment
cp .env.example .env.production
nano .env.production
```

#### 4. Production Environment Configuration
```bash
# .env.production
NODE_ENV=production
PORT=3000
DOMAIN=your-domain.com

# Database (Use managed services in production)
DATABASE_URL=postgresql://user:pass@managed-db:5432/jeantrail_prod
REDIS_URL=redis://managed-redis:6379

# Security
JWT_SECRET=your-super-secure-random-string-here
CORS_ORIGIN=https://your-domain.com

# AI Services (Production endpoints)
QWEN_API_URL=https://ai.your-domain.com/qwen
SDXL_API_URL=https://ai.your-domain.com/sdxl

# Monitoring
SENTRY_DSN=https://your-sentry-dsn
LOG_LEVEL=info
```

#### 5. Build and Deploy
```bash
# Build frontend
npm run build

# Start production services
docker-compose -f docker-compose.prod.yml up -d

# Setup SSL certificate (see SSL section)
```

---

## 🐳 Docker Services Configuration

### AI Services Stack (`docker-compose.ai.yml`)
```yaml
version: '3.8'
services:
  qwen-3-72b:
    image: jeantrail/qwen-3:latest
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    environment:
      - MODEL_PATH=/models/qwen-3-72b.Q4_K_M.gguf
      - MAX_CTX=32768
      - HOST=0.0.0.0
      - PORT=8000
    volumes:
      - ./models:/models:ro
    ports:
      - "8001:8000"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  sdxl:
    image: jeantrail/sdxl:latest
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    ports:
      - "8002:8000"
    environment:
      - MODEL_PATH=/models/sd-xl-base-1.0.safetensors
    volumes:
      - ./models:/models:ro

  postgresql:
    image: postgres:15
    environment:
      - POSTGRES_DB=jeantrail
      - POSTGRES_USER=jeantrail
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/migrations:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"

volumes:
  postgres_data:
  redis_data:
```

### Production Stack (`docker-compose.prod.yml`)
```yaml
version: '3.8'
services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.prod
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./ssl:/etc/ssl/certs:ro
    environment:
      - NODE_ENV=production
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/ssl/certs:ro
    depends_on:
      - frontend
    restart: unless-stopped
```

---

## 🗄️ Database Setup

### PostgreSQL Configuration
```sql
-- Create production database
CREATE DATABASE jeantrail_prod;
CREATE USER jeantrail_prod WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE jeantrail_prod TO jeantrail_prod;

-- Run migrations
psql -h localhost -U jeantrail_prod -d jeantrail_prod -f database/migrations/001_initial_schema.sql
```

### Redis Configuration
```bash
# Redis configuration for production
echo "maxmemory 2gb" >> /etc/redis/redis.conf
echo "maxmemory-policy allkeys-lru" >> /etc/redis/redis.conf
echo "save 900 1" >> /etc/redis/redis.conf
echo "save 300 10" >> /etc/redis/redis.conf
echo "save 60 10000" >> /etc/redis/redis.conf
```

### Database Backups
```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/postgres"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup PostgreSQL
docker exec jeantrail_postgres_1 pg_dump -U jeantrail_prod jeantrail_prod > $BACKUP_DIR/backup_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/backup_$DATE.sql

# Remove old backups (keep last 7 days)
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete
```

---

## 🔒 SSL/HTTPS Setup

### Let's Encrypt with Certbot
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Generate SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Nginx SSL Configuration
```nginx
# nginx.conf
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 📊 Monitoring & Logging

### Prometheus + Grafana Setup
```yaml
# monitoring.yml
version: '3.8'
services:
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana
```

### Application Logging
```javascript
// logging.config.js
module.exports = {
  level: process.env.LOG_LEVEL || 'info',
  format: 'json',
  defaultMeta: { service: 'jeantrail-os' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console()
  ]
};
```

---

## ⚡ Scaling & Performance

### Horizontal Scaling
```bash
# Scale frontend services
docker-compose up -d --scale frontend=3

# Load balancer configuration
upstream backend {
    server localhost:3000;
    server localhost:3001;
    server localhost:3002;
}
```

### Performance Optimization
```javascript
// caching.config.js
const Redis = require('redis');
const client = Redis.createClient({
  url: process.env.REDIS_URL,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3
});

// Cache middleware
const cache = (duration = 300) => {
  return async (req, res, next) => {
    const key = `cache:${req.originalUrl}`;
    const cached = await client.get(key);
    
    if (cached) {
      return res.json(JSON.parse(cached));
    }
    
    res.sendResponse = res.json;
    res.json = (body) => {
      client.setex(key, duration, JSON.stringify(body));
      res.sendResponse(body);
    };
    
    next();
  };
};
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Docker Services Won't Start
```bash
# Check Docker status
sudo systemctl status docker

# Check logs
docker-compose logs

# Rebuild containers
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

#### 2. AI Model Loading Issues
```bash
# Check GPU availability
nvidia-smi

# Verify model files
ls -la models/

# Check model service logs
docker logs jeantrail_qwen-3-72b_1
```

#### 3. Database Connection Errors
```bash
# Test PostgreSQL connection
docker exec -it jeantrail_postgres_1 psql -U jeantrail_prod -d jeantrail_prod

# Check Redis connection
docker exec -it jeantrail_redis_1 redis-cli ping
```

#### 4. Frontend Build Errors
```bash
# Clear node modules
rm -rf node_modules package-lock.json
npm install

# Check TypeScript errors
npm run build

# Fix permission issues
sudo chown -R $USER:$USER ./
```

### Health Checks
```bash
#!/bin/bash
# health-check.sh

echo "🔍 Checking JeanTrail OS Health..."

# Check frontend
if curl -f http://localhost:1420 > /dev/null 2>&1; then
    echo "✅ Frontend is running"
else
    echo "❌ Frontend is down"
fi

# Check AI services
services=("8001:Qwen-3" "8002:SDXL" "8003:Whisper" "8004:CoquiTTS")
for service in "${services[@]}"; do
    port=${service%:*}
    name=${service#*:}
    if curl -f http://localhost:$port/health > /dev/null 2>&1; then
        echo "✅ $name is running"
    else
        echo "❌ $name is down"
    fi
done

# Check databases
if docker exec jeantrail_postgres_1 pg_isready -U jeantrail_prod > /dev/null 2>&1; then
    echo "✅ PostgreSQL is running"
else
    echo "❌ PostgreSQL is down"
fi

if docker exec jeantrail_redis_1 redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis is running"
else
    echo "❌ Redis is down"
fi
```

---

## 📱 Production Checklist

### Pre-deployment Checklist
- [ ] Environment variables configured
- [ ] SSL certificates installed
- [ ] Database migrations applied
- [ ] AI models downloaded and tested
- [ ] Monitoring setup (Prometheus/Grafana)
- [ ] Backup scripts configured
- [ ] Log rotation configured
- [ ] Security headers configured
- [ ] Performance testing completed
- [ ] Load testing completed

### Post-deployment Verification
- [ ] All services responding to health checks
- [ ] AI models generating responses
- [ ] Database connections working
- [ ] SSL certificate valid
- [ ] Monitoring data flowing
- [ ] Backup scripts running
- [ ] Error rates below threshold
- [ ] Response times acceptable

---

## 🆘 Support

For deployment issues:
1. Check the logs: `docker-compose logs -f`
2. Run health check: `./health-check.sh`
3. Review troubleshooting section above
4. Create an issue on GitHub with full logs

---

**Deployment Guide v1.0** | **Last Updated: December 2024** | **Author: Jean AI Assistant** 🤖