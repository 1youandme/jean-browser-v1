# 🔧 JeanTrail OS - Troubleshooting Guide

## 📋 Table of Contents
- [Quick Diagnostics](#quick-diagnostics)
- [Installation Issues](#installation-issues)
- [Docker & Container Issues](#docker--container-issues)
- [AI Services Problems](#ai-services-problems)
- [Database Connection Issues](#database-connection-issues)
- [Frontend Issues](#frontend-issues)
- [Performance Issues](#performance-issues)
- [Authentication Problems](#authentication-problems)
- [Network & Proxy Issues](#network--proxy-issues)
- [File System Issues](#file-system-issues)
- [Memory & Resource Issues](#memory--resource-issues)
- [Advanced Debugging](#advanced-debugging)

---

## 🚀 Quick Diagnostics

### Health Check Script
```bash
#!/bin/bash
# quick-diagnosis.sh

echo "🔍 JeanTrail OS Quick Diagnosis"
echo "==============================="

# Check if required services are running
check_service() {
    local service=$1
    local port=$2
    local name=$3
    
    if curl -f http://localhost:$port/health > /dev/null 2>&1; then
        echo "✅ $name is running (port $port)"
        return 0
    else
        echo "❌ $name is not responding (port $port)"
        return 1
    fi
}

# Core services
check_service "frontend" "1420" "Frontend"
check_service "qwen" "8001" "Qwen-3 AI"
check_service "sdxl" "8002" "SDXL Image Gen"
check_service "whisper" "8003" "Whisper STT"
check_service "coqui" "8004" "Coqui TTS"

# Database checks
if docker exec jeantrail_postgres_1 pg_isready -U jeantrail > /dev/null 2>&1; then
    echo "✅ PostgreSQL is running"
else
    echo "❌ PostgreSQL is down"
fi

if docker exec jeantrail_redis_1 redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis is running"
else
    echo "❌ Redis is down"
fi

# System resources
echo -e "\n📊 System Resources:"
echo "Memory Usage: $(free -h | awk '/^Mem:/{printf "%.1f%% used", $3/$2 * 100.0}')"
echo "Disk Usage: $(df -h . | awk 'NR==2{printf "%.1f%% used", $5}')"
echo "CPU Load: $(uptime | awk -F'load average:' '{ print $2 }')"

echo -e "\n🔗 Check detailed logs with: docker-compose logs -f"
```

### Manual Health Check
```bash
# 1. Check all services
docker-compose -f docker-compose.ai.yml ps

# 2. Test frontend
curl -I http://localhost:1420

# 3. Test AI services
curl -f http://localhost:8001/health
curl -f http://localhost:8002/health

# 4. Check database
docker exec jeantrail_postgres_1 psql -U jeantrail -c "SELECT 1;"

# 5. Check logs
tail -f logs/jeantrail.log
```

---

## 📦 Installation Issues

### Problem: Docker Not Installed
**Symptoms:**
```
bash: docker: command not found
```

**Solution:**
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Log out and back in for group changes to take effect
```

### Problem: Node.js Version Incompatible
**Symptoms:**
```
npm ERR! node v14.17.0 is not supported
```

**Solution:**
```bash
# Install Node.js 18+ using NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18
nvm alias default 18
```

### Problem: Permission Denied
**Symptoms:**
```
Permission denied: ./run.sh
```

**Solution:**
```bash
chmod +x run.sh
chmod +x stop.sh
```

### Problem: Git Clone Failed
**Symptoms:**
```
fatal: unable to access 'https://github.com/...': SSL connection failed
```

**Solution:**
```bash
# Fix SSL certificate issues
git config --global http.sslVerify false

# Or use SSH instead
git clone git@github.com:jeantrail/jeantrail-os.git
```

---

## 🐳 Docker & Container Issues

### Problem: Containers Won't Start
**Symptoms:**
```
ERROR: Service 'qwen-3-72b' failed to build
```

**Debugging Steps:**
```bash
# 1. Check Docker status
sudo systemctl status docker

# 2. Check Docker logs
sudo journalctl -u docker -f

# 3. Rebuild containers
docker-compose -f docker-compose.ai.yml down
docker-compose -f docker-compose.ai.yml build --no-cache
docker-compose -f docker-compose.ai.yml up -d

# 4. Check container logs
docker-compose -f docker-compose.ai.yml logs qwen-3-72b
```

### Problem: GPU Not Available
**Symptoms:**
```
WARNING: No GPUs detected
```

**Solution:**
```bash
# Install NVIDIA Container Toolkit
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | sudo tee /etc/apt/sources.list.d/nvidia-docker.list

sudo apt-get update && sudo apt-get install -y nvidia-docker2
sudo systemctl restart docker

# Test GPU access
docker run --rm --gpus all nvidia/cuda:11.0-base nvidia-smi
```

### Problem: Port Already in Use
**Symptoms:**
```
ERROR: for frontend  Port '1420' is already allocated
```

**Solution:**
```bash
# Find process using the port
sudo lsof -i :1420

# Kill the process
sudo kill -9 <PID>

# Or use a different port
export PORT=1421
npm run dev
```

### Problem: Out of Disk Space
**Symptoms:**
```
ERROR: no space left on device
```

**Solution:**
```bash
# Clean Docker
docker system prune -a

# Clean old images
docker image prune -a

# Clean volumes (be careful!)
docker volume prune

# Check disk space
df -h

# Clean temporary files
rm -rf /tmp/jeantrail-*
rm -rf logs/*
rm -rf outputs/*
```

---

## 🤖 AI Services Problems

### Problem: Qwen-3 Model Not Loading
**Symptoms:**
```
Model loading failed: File not found
```

**Debugging:**
```bash
# 1. Check model files
ls -la models/
ls -la models/qwen-3-72b.Q4_K_M.gguf

# 2. Check model size
du -h models/qwen-3-72b.Q4_K_M.gguf

# 3. Check permissions
ls -la models/

# 4. Download model if missing
mkdir -p models
wget -O models/qwen-3-72b.Q4_K_M.gguf https://huggingface.co/Qwen/Qwen-3-72B-GGUF/resolve/main/qwen-3-72b.Q4_K_M.gguf
```

### Problem: AI Service Timeouts
**Symptoms:**
```
Request timeout after 120000ms
```

**Solution:**
```bash
# Increase timeout
export AI_TIMEOUT=300000

# Check GPU memory usage
nvidia-smi

# Restart AI services
docker-compose -f docker-compose.ai.yml restart

# Check service logs for bottlenecks
docker-compose -f docker-compose.ai.yml logs qwen-3-72b | tail -50
```

### Problem: Poor AI Response Quality
**Symptoms:**
`` Responses are gibberish or incomplete

**Solution:**
```bash
# 1. Check model parameters
grep -E "temperature|max_tokens" docker-compose.ai.yml

# 2. Adjust settings in .env
export JEAN_TEMPERATURE=0.5
export JEAN_MAX_TOKENS=1024

# 3. Check prompt context
curl -X POST http://localhost:8001/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Hello","max_tokens":50}'

# 4. Verify model integrity
md5sum models/qwen-3-72b.Q4_K_M.gguf
```

### Problem: SDXL Image Generation Fails
**Symptoms:**
```
CUDA out of memory
```

**Solution:**
```bash
# 1. Reduce image size
export SDXL_WIDTH=512
export SDXL_HEIGHT=512

# 2. Reduce batch size
export SDXL_BATCH_SIZE=1

# 3. Clear GPU memory
nvidia-smi --gpu-reset

# 4. Restart SDXL service
docker-compose -f docker-compose.ai.yml restart sdxl
```

---

## 🗄️ Database Connection Issues

### Problem: PostgreSQL Connection Failed
**Symptoms:**
```
ECONNREFUSED: Connection refused
```

**Debugging:**
```bash
# 1. Check PostgreSQL container
docker ps | grep postgres

# 2. Check PostgreSQL logs
docker-compose logs postgresql

# 3. Test connection manually
docker exec -it jeantrail_postgres_1 psql -U jeantrail -d jeantrail

# 4. Check database exists
docker exec jeantrail_postgres_1 psql -U jeantrail -c "\l"

# 5. Reset database password
docker exec -it jeantrail_postgres_1 psql -U postgres -c "ALTER USER jeantrail PASSWORD 'new_password';"
```

### Problem: Database Migration Failed
**Symptoms:**
```
Migration failed: relation already exists
```

**Solution:**
```bash
# 1. Check migration status
docker exec jeantrail_postgres_1 psql -U jeantrail -d jeantrail -c "SELECT * FROM schema_migrations;"

# 2. Reset database (data loss!)
docker-compose down
docker volume rm jeantrail_postgres_data
docker-compose up -d postgresql

# 3. Run migrations manually
docker exec jeantrail_postgres_1 psql -U jeantrail -d jeantrail -f /docker-entrypoint-initdb.d/001_initial_schema.sql
```

### Problem: Redis Connection Issues
**Symptoms:**
```
Redis connection timeout
```

**Solution:**
```bash
# 1. Check Redis container
docker ps | grep redis

# 2. Test Redis connection
docker exec jeantrail_redis_1 redis-cli ping

# 3. Check Redis logs
docker-compose logs redis

# 4. Flush Redis if corrupted
docker exec jeantrail_redis_1 redis-cli FLUSHALL
```

---

## 🌐 Frontend Issues

### Problem: Vite Development Server Fails
**Symptoms:**
```
Error: listen EADDRINUSE :::1420
```

**Solution:**
```bash
# 1. Kill existing process
sudo fuser -k 1420/tcp

# 2. Clear node_modules
rm -rf node_modules package-lock.json
npm install

# 3. Check port usage
netstat -tulpn | grep :1420

# 4. Start with different port
export PORT=1421
npm run dev
```

### Problem: Three.js/3D Model Loading Issues
**Symptoms:**
```
GLTFLoader: Failed to load model
```

**Solution:**
```bash
# 1. Check model file
ls -la public/human\ head\ 3d\ model.glb

# 2. Verify file integrity
file public/human\ head\ 3d\ model.glb

# 3. Check browser console for WebGL errors
# Open Chrome DevTools -> Console

# 4. Test Three.js manually
curl -s https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js | head -20

# 5. Clear browser cache and reload
```

### Problem: Hot Module Replacement (HMR) Not Working
**Symptoms:**
```
[HMR] Update failed
```

**Solution:**
```bash
# 1. Check firewall settings
sudo ufw status

# 2. Update vite.config.ts
export default defineConfig({
  server: {
    port: 1420,
    host: '0.0.0.0',  // Allow external connections
    hmr: {
      port: 1421
    }
  }
});

# 3. Restart development server
npm run dev
```

---

## ⚡ Performance Issues

### Problem: Slow AI Response Times
**Symptoms:**
```
Response time: 30+ seconds
```

**Optimization:**
```bash
# 1. Check GPU utilization
nvidia-smi

# 2. Optimize model parameters
export JEAN_MAX_TOKENS=512
export JEAN_TEMPERATURE=0.5

# 3. Enable caching
export AI_CACHE_ENABLED=true
export AI_CACHE_TTL=3600

# 4. Monitor resource usage
docker stats jeantrail_qwen-3-72b_1

# 5. Profile the application
curl -w "@curl-format.txt" -X POST http://localhost:8001/generate -d '{"prompt":"test"}'
```

### Problem: High Memory Usage
**Symptoms:**
```
Memory usage: 95%+
```

**Solution:**
```bash
# 1. Check memory usage by process
ps aux --sort=-%mem | head

# 2. Clear Docker caches
docker system prune -a

# 3. Optimize Node.js memory
export NODE_OPTIONS="--max-old-space-size=4096"

# 4. Restart services
./stop.sh && ./run.sh

# 5. Monitor with htop
htop
```

### Problem: Frontend Build Fails
**Symptoms:**
```
JavaScript heap out of memory
```

**Solution:**
```bash
# 1. Increase Node.js memory
export NODE_OPTIONS="--max-old-space-size=8192"

# 2. Clean build artifacts
rm -rf dist/
rm -rf .vite/

# 3. Optimize build
npm run build -- --mode production

# 4. Check for memory leaks
npm run dev -- --inspect
```

---

## 🔐 Authentication Problems

### Problem: JWT Token Invalid
**Symptoms:**
```
401 Unauthorized: Invalid token
```

**Debugging:**
```bash
# 1. Check JWT secret
echo $JWT_SECRET | wc -c  # Should be 32+ characters

# 2. Test token generation
curl -X POST http://localhost:1420/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}'

# 3. Decode token
echo "eyJhbGciOiJIUzI1NiIs..." | cut -d'.' -f2 | base64 -d | jq .

# 4. Check token expiration
grep JWT_EXPIRES_IN .env
```

### Problem: CORS Errors
**Symptoms:**
```
Access to fetch at 'http://localhost:1420' has been blocked by CORS policy
```

**Solution:**
```bash
# 1. Check CORS origin
grep CORS_ORIGIN .env

# 2. Update CORS settings
export CORS_ORIGIN=http://localhost:3000,http://localhost:1420

# 3. Restart frontend
npm run dev

# 4. Check browser network tab for preflight requests
```

---

## 🌐 Network & Proxy Issues

### Problem: Proxy Connection Fails
**Symptoms:**
```
ECONNREFUSED: Proxy connection refused
```

**Solution:**
```bash
# 1. Check proxy node status
curl http://localhost:8080/nodes

# 2. Test proxy connection
curl -X POST http://localhost:8080/session \
  -H "Content-Type: application/json" \
  -d '{"targetUrl":"https://example.com"}'

# 3. Check proxy logs
docker-compose logs proxy

# 4. Verify proxy configuration
cat proxy/config.yaml
```

### Problem: WebSocket Connection Issues
**Symptoms:**
```
WebSocket connection failed: 403 Forbidden
```

**Debugging:**
```bash
# 1. Test WebSocket connection
wscat -c ws://localhost:1420/api/ws?token=YOUR_TOKEN

# 2. Check WebSocket headers
curl -I -H "Upgrade: websocket" http://localhost:1420/api/ws

# 3. Check CORS for WebSockets
grep websocket nginx.conf
```

---

## 📁 File System Issues

### Problem: File Access Denied
**Symptoms:**
```
EACCES: permission denied
```

**Solution:**
```bash
# 1. Check file permissions
ls -la /path/to/file

# 2. Fix permissions
chmod 644 /path/to/file
chown $USER:$USER /path/to/file

# 3. Check directory permissions
ls -ld /path/to/directory

# 4. Test file access
touch /path/to/test_file
```

### Problem: Disk Space Full
**Symptoms:**
```
ENOSPC: no space left on device
```

**Solution:**
```bash
# 1. Check disk usage
df -h

# 2. Find large files
find / -type f -size +1G 2>/dev/null | head

# 3. Clean temporary files
rm -rf /tmp/*
rm -rf logs/*
rm -rf outputs/*

# 4. Clean Docker
docker system prune -a

# 5. Compress old logs
gzip logs/*.log
```

---

## 💾 Memory & Resource Issues

### Problem: GPU Out of Memory
**Symptoms:**
```
CUDA out of memory. Tried to allocate 2.00 GiB
```

**Solution:**
```bash
# 1. Check GPU memory usage
nvidia-smi

# 2. Reduce model batch size
export BATCH_SIZE=1

# 3. Reduce context length
export MAX_CTX=8192

# 4. Use smaller model
export MODEL_NAME=Qwen-3-7B

# 5. Clear GPU memory
nvidia-smi --gpu-reset
```

### Problem: CPU Usage 100%
**Symptoms:**
```
System becomes unresponsive
```

**Debugging:**
```bash
# 1. Find CPU-intensive processes
top -o %CPU

# 2. Check Docker containers
docker stats --no-stream

# 3. Limit container resources
# Add to docker-compose.yml:
deploy:
  resources:
    limits:
      cpus: '2.0'

# 4. Restart affected services
docker-compose restart
```

---

## 🔬 Advanced Debugging

### Enable Debug Logging
```bash
# Set debug level
export LOG_LEVEL=debug
export DEBUG=jeantrail:*

# Enable detailed logs
export RUST_LOG=debug
export NODE_OPTIONS="--trace-warnings"

# Start with debugging
npm run dev -- --inspect
```

### Performance Profiling
```bash
# Profile Node.js
npm run build -- --profile
node --inspect dist/index.js

# Profile Docker containers
docker exec jeantrail_qwen-3-72b_1 py-spy top --pid 1

# Memory profiling
node --inspect --heap-prof dist/index.js
```

### Network Debugging
```bash
# Check network connections
netstat -tulpn | grep :1420

# Monitor network traffic
tcpdump -i any port 1420

# Test latency
curl -w "@curl-format.txt" http://localhost:1420
```

### Database Debugging
```bash
# Monitor PostgreSQL queries
docker exec jeantrail_postgres_1 psql -U jeantrail -c "
SELECT query, calls, total_time, mean_time 
FROM pg_stat_statements 
ORDER BY total_time DESC 
LIMIT 10;"

# Check database locks
docker exec jeantrail_postgres_1 psql -U jeantrail -c "
SELECT blocked_locks.pid AS blocked_pid,
       blocked_activity.usename AS blocked_user,
       blocking_locks.pid AS blocking_pid,
       blocking_activity.usename AS blocking_user,
       blocked_activity.query AS blocked_statement,
       blocking_activity.query AS current_statement_in_blocking_process
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype
JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;"
```

---

## 📊 Monitoring & Diagnostics

### Real-time Monitoring
```bash
# System monitoring
watch -n 1 'free -h && echo "====" && df -h && echo "====" && docker stats --no-stream'

# Application monitoring
curl -s http://localhost:1420/api/health | jq .

# AI service monitoring
for port in 8001 8002 8003 8004; do
    echo "Port $port:"
    curl -s http://localhost:$port/health || echo "DOWN"
    echo "---"
done
```

### Log Analysis
```bash
# Search for errors
grep -i error logs/*.log

# Monitor specific services
tail -f logs/jeantrail.log | grep ERROR

# Analyze request patterns
grep "POST /api/jean/chat" logs/access.log | wc -l

# Check slow queries
grep "slow query" logs/database.log
```

---

## 🆘 Emergency Recovery

### Full System Reset
```bash
# WARNING: This will delete all data!
./stop.sh

# Remove all Docker containers and volumes
docker system prune -a --volumes
docker volume prune

# Reset configuration
cp .env.example .env

# Rebuild from scratch
./run.sh
```

### Database Recovery
```bash
# Create backup
docker exec jeantrail_postgres_1 pg_dump -U jeantrail jeantrail > backup.sql

# Restore from backup
docker exec -i jeantrail_postgres_1 psql -U jeantrail jeantrail < backup.sql

# Reset database
docker exec jeantrail_postgres_1 psql -U jeantrail -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
docker exec jeantrail_postgres_1 psql -U jeantrail -f /docker-entrypoint-initdb.d/001_initial_schema.sql
```

---

## 📞 Getting Help

### Collect Debug Information
```bash
# Create debug bundle
mkdir debug_info
docker-compose logs > debug_info/docker.log
systemctl status docker > debug_info/docker-status.txt
free -h > debug_info/memory.txt
df -h > debug_info/disk.txt
nvidia-smi > debug_info/gpu.txt 2>/dev/null || echo "No GPU" > debug_info/gpu.txt
ps aux > debug_info/processes.txt
netstat -tulpn > debug_info/network.txt

# Compress and share
tar -czf jeantrail-debug.tar.gz debug_info/
```

### Community Support
1. **GitHub Issues**: Create issue with debug bundle
2. **Discord**: Join JeanTrail community
3. **Documentation**: Check latest guides
4. **FAQ**: Review common questions

---

## 🔧 Prevention & Maintenance

### Regular Maintenance
```bash
# Weekly cleanup
docker system prune -a
npm cache clean --force

# Monthly checks
./health-check.sh
update models/qwen-3-72b.Q4_K_M.gguf

# Backup configuration
cp .env .env.backup
docker exec jeantrail_postgres_1 pg_dump -U jeantrail jeantrail > backup_$(date +%Y%m%d).sql
```

### Monitoring Alerts
```bash
# Create monitoring script
cat > monitor.sh << 'EOF'
#!/bin/bash
while true; do
    if ! curl -f http://localhost:1420 > /dev/null 2>&1; then
        echo "Frontend down at $(date)" | mail -s "JeanTrail Alert" admin@example.com
    fi
    sleep 60
done
EOF

chmod +x monitor.sh
nohup ./monitor.sh > monitor.log 2>&1 &
```

---

**Troubleshooting Guide v1.0** | **Last Updated: December 2024** | **Author: Jean AI Assistant** 🤖

> 💡 **Pro Tip**: Most issues are resolved by restarting services with `./stop.sh && ./run.sh`. If problems persist, check the logs and follow the debugging steps above.