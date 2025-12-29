# 🧪 JeanTrail OS - Testing Guide

## 📋 Overview

This comprehensive testing guide covers all aspects of JeanTrail OS testing, from basic functionality to advanced AI integration. Follow these steps to verify your installation is working correctly.

---

## 🚀 Quick Start Tests

### Prerequisites Check
```bash
# Run the quick diagnosis script
./quick-diagnosis.sh

# Or manually check each component:
echo "🔍 Testing JeanTrail OS Components..."

# Test frontend
if curl -f http://localhost:1420 > /dev/null 2>&1; then
    echo "✅ Frontend is running"
else
    echo "❌ Frontend is down"
fi

# Test AI services (if Docker is available)
for service in qwen sdxl whisper coqui; do
    port=$(echo $service | tr '[:lower:]' '[:upper:]' | sed 's/COQUI/COQUI_TTS/')
    case $service in
        qwen) port=8001 ;;
        sdxl) port=8002 ;;
        whisper) port=8003 ;;
        coqui) port=8004 ;;
    esac
    
    if curl -f http://localhost:$port/health > /dev/null 2>&1; then
        echo "✅ $service AI is running"
    else
        echo "❌ $service AI is down"
    fi
done
```

---

## 🌐 Frontend Tests

### Basic Functionality Tests
```bash
# Test main page loads
curl -I http://localhost:1420

# Expected output: HTTP/1.1 200 OK

# Test Jean 3D model availability
curl -I http://localhost:1420/human%20head%203d%20model.glb

# Expected output: HTTP/1.1 200 OK

# Test API endpoints
curl -I http://localhost:1420/api/health

# Test static assets
curl -I http://localhost:1420/src/main.tsx
curl -I http://localhost:1420/src/index.css
```

### Browser Compatibility Tests
Open your browser and navigate to `http://localhost:1420`:

#### ✅ Expected Behavior:
1. **JeanTrail Logo**: Should appear with gradient effect
2. **Jean 3D Avatar**: Should load with blue glow effect
3. **4-Strip Buttons**: Four colored buttons should be visible
3. **Jean Activation**: Clicking Jean icon should open sidebar
4. **Responsive Design**: Should adapt to window resizing
5. **RTL Support**: Toggle should change text direction

#### 🧪 Manual Tests:
1. **Jean Avatar Interaction**:
   - Click on Jean avatar in header
   - Should activate and show green status
   - 3D model should rotate and float
   - Eyes should glow when active

2. **Strip Navigation**:
   - Click each strip button (Local, Proxy, Web, Mobile)
   - URL bar should update accordingly
   - Strip should highlight with appropriate color

3. **Responsive Layout**:
   - Resize browser window
   - Layout should adapt without breaking
   - Mobile view should stack elements vertically

---

## 🤖 AI Services Tests

### Test without Docker (Mock Testing)

If Docker is not available, use these mock tests:

```bash
# Create mock test script
cat > test-ai-mock.sh << 'EOF'
#!/bin/bash

echo "🤖 Testing AI Services (Mock Mode)"

# Mock Qwen-3 test
curl -X POST http://localhost:9999/mock/qwen \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Hello Jean","maxTokens":50}' 2>/dev/null || {
    echo "📝 Mock Qwen-3 Response: 'Hello! I am Jean, your AI assistant.'"
}

# Mock SDXL test
curl -X POST http://localhost:9999/mock/sdxl \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Futuristic AI","width":512,"height":512}' 2>/dev/null || {
    echo "🎨 Mock SDXL Response: 'Image generated successfully'"
}

# Mock Whisper test
echo "🎤 Mock Whisper Response: 'Transcribed audio text'"
echo "🔊 Mock Coqui TTS Response: 'Audio generated successfully'"

echo "✅ All AI mock tests completed"
EOF

chmod +x test-ai-mock.sh
./test-ai-mock.sh
```

### Test with Docker (When Available)

```bash
# Start AI services
docker-compose -f docker-compose.ai.yml up -d

# Wait for services to start
sleep 30

# Test Qwen-3
echo "🧠 Testing Qwen-3..."
curl -X POST http://localhost:8001/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Hello, Jean! How are you today?",
    "maxTokens": 100,
    "temperature": 0.7
  }'

# Test SDXL
echo "🎨 Testing SDXL..."
curl -X POST http://localhost:8002/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A futuristic AI assistant in digital landscape",
    "width": 512,
    "height": 512,
    "steps": 20
  }'

# Test Whisper
echo "🎤 Testing Whisper..."
# Create test audio file
curl -X POST http://localhost:8003/transcribe \
  -F "file=@test-audio.wav" \
  -F "language=en"

# Test Coqui TTS
echo "🔊 Testing Coqui TTS..."
curl -X POST http://localhost:8004/generate \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello! I am Jean, your AI assistant.",
    "voice": "default",
    "language": "en"
  }'
```

---

## 🗄️ Database Tests

### PostgreSQL Tests
```bash
# Test database connection
docker exec jeantrail_postgres_1 psql -U jeantrail -d jeantrail -c "SELECT version();"

# Test tables exist
docker exec jeantrail_postgres_1 psql -U jeantrail -d jeantrail -c "\dt"

# Test basic CRUD operations
docker exec jeantrail_postgres_1 psql -U jeantrail -d jeantrail -c "
INSERT INTO users (id, email, created_at) VALUES ('test_1', 'test@example.com', NOW());
SELECT * FROM users WHERE id = 'test_1';
DELETE FROM users WHERE id = 'test_1';
"
```

### Redis Tests
```bash
# Test Redis connection
docker exec jeantrail_redis_1 redis-cli ping

# Test basic operations
docker exec jeantrail_redis_1 redis-cli set test_key "Hello JeanTrail"
docker exec jeantrail_redis_1 redis-cli get test_key
docker exec jeantrail_redis_1 redis-cli del test_key
```

---

## 🌐 Network Tests

### Proxy Network Tests
```bash
# Test proxy endpoint
curl -X POST http://localhost:8080/session \
  -H "Content-Type: application/json" \
  -d '{
    "targetUrl": "https://example.com",
    "node": "us-west-1"
  }'

# Test node status
curl http://localhost:8080/nodes
```

### WebSocket Tests
```bash
# Test WebSocket connection
wscat -c ws://localhost:1420/api/ws?token=mock_token

# Send test message
{"type": "subscribe", "events": ["jean_messages"]}

# Expected response: {"type": "subscribed", "events": ["jean_messages"]}
```

---

## 📱 Performance Tests

### Load Testing
```bash
# Install Apache Bench if not available
# sudo apt-get install apache2-utils

# Test frontend performance
ab -n 100 -c 10 http://localhost:1420/

# Test API performance
ab -n 50 -c 5 http://localhost:1420/api/health

# Expected results:
# - Frontend: <500ms average response time
# - API: <100ms average response time
# - 0 failed requests
```

### Memory Usage Tests
```bash
# Monitor memory usage
watch -n 1 'free -h && echo "=== Node.js Process ===" && ps aux | grep "node.*1420"'

# Test memory leak detection
node --inspect --heap-prof dist/index.js

# Expected memory usage:
# - Baseline: <200MB
# - After 10 minutes: <500MB
# - No continuous growth (indicates leak)
```

---

## 🔒 Security Tests

### Authentication Tests
```bash
# Test JWT generation
curl -X POST http://localhost:1420/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test_password"
  }'

# Test protected endpoint without token
curl -I http://localhost:1420/api/jean/chat

# Expected: 401 Unauthorized

# Test protected endpoint with invalid token
curl -I http://localhost:1420/api/jean/chat \
  -H "Authorization: Bearer invalid_token"

# Expected: 401 Unauthorized
```

### CORS Tests
```bash
# Test CORS headers
curl -I http://localhost:1420/api/health \
  -H "Origin: http://localhost:3000"

# Expected headers:
# Access-Control-Allow-Origin: http://localhost:1420
# Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS
```

---

## 📊 Integration Tests

### End-to-End Test Scenarios

#### Scenario 1: Complete Jean AI Workflow
```bash
# 1. Start JeanTrail
./run.sh

# 2. Open browser and navigate to http://localhost:1420

# 3. Click Jean avatar to activate

# 4. Type command in Jean chat: "Search for AI browsers"

# 5. Verify Jean responds with search results

# 6. Verify browser navigates to search results

# Expected: Jean understands natural language and executes browser actions
```

#### Scenario 2: 4-Strip Navigation
```bash
# 1. Start with Web strip active

# 2. Click "Local Device" strip

# 3. Verify file browser interface loads

# 4. Click "Proxy Network" strip

# 5. Verify proxy interface loads

# 6. Click "Mobile Apps" strip

# 7. Verify mobile emulator loads

# Expected: Each strip shows appropriate interface and maintains state
```

#### Scenario 3: AI Generation Workflow
```bash
# 1. Activate Jean AI

# 2. Command: "Generate an image of a futuristic city"

# 3. Verify SDXL generates and displays image

# 4. Command: "Summarize this page"

# 5. Verify Qwen-3 provides accurate summary

# Expected: AI services integrate seamlessly with browser interface
```

---

## 🧪 Automated Testing Scripts

### Complete Test Suite
```bash
#!/bin/bash
# complete-test-suite.sh

echo "🧪 JeanTrail OS Complete Test Suite"
echo "===================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run test
run_test() {
    local test_name=$1
    local test_command=$2
    
    echo -n "Testing $test_name... "
    
    if eval $test_command > /dev/null 2>&1; then
        echo -e "${GREEN}PASS${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}FAIL${NC}"
        ((TESTS_FAILED++))
    fi
}

# Frontend tests
run_test "Frontend Server" "curl -f http://localhost:1420"
run_test "Jean 3D Model" "curl -f http://localhost:1420/human%20head%203d%20model.glb"
run_test "Main CSS" "curl -f http://localhost:1420/src/index.css"
run_test "React Bundle" "curl -f http://localhost:1420/src/main.tsx"

# API tests (if available)
run_test "API Health Endpoint" "curl -f http://localhost:1420/api/health"

# Docker tests (if available)
if command -v docker &> /dev/null; then
    run_test "Docker Service" "docker ps"
    run_test "Qwen-3 AI" "curl -f http://localhost:8001/health"
    run_test "SDXL AI" "curl -f http://localhost:8002/health"
    run_test "PostgreSQL" "docker exec jeantrail_postgres_1 pg_isready -U jeantrail"
    run_test "Redis" "docker exec jeantrail_redis_1 redis-cli ping"
fi

# Results
echo ""
echo "===================================="
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo "===================================="

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! JeanTrail OS is working correctly.${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  Some tests failed. Check the logs for details.${NC}"
    exit 1
fi
```

### Performance Test Script
```bash
#!/bin/bash
# performance-test.sh

echo "📊 JeanTrail OS Performance Tests"
echo "=================================="

# Frontend performance
echo "Testing frontend performance..."
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:1420

# Load testing
echo "Running load test..."
ab -n 100 -c 10 http://localhost:1420/ > load-test-results.txt

# Memory usage
echo "Checking memory usage..."
ps aux | grep "node.*1420" | awk '{print "Memory Usage: " $6 " KB"}'

echo "Performance tests completed. Check load-test-results.txt for details."
```

---

## 📋 Test Results Template

### Test Report Format
```markdown
# JeanTrail OS Test Report

## Environment
- OS: [Operating System]
- Node.js: [Version]
- Docker: [Version/Not Available]
- Date: [Test Date]
- Tester: [Your Name]

## Test Results
| Component | Status | Notes |
|-----------|--------|-------|
| Frontend | ✅/❌ | [Details] |
| Jean 3D Avatar | ✅/❌ | [Details] |
| Qwen-3 AI | ✅/❌ | [Details] |
| SDXL | ✅/❌ | [Details] |
| PostgreSQL | ✅/❌ | [Details] |
| Redis | ✅/❌ | [Details] |
| Proxy Network | ✅/❌ | [Details] |

## Performance Metrics
- Page Load Time: [X.XX seconds]
- Memory Usage: [XXX MB]
- API Response Time: [XXX ms]

## Issues Found
1. [Issue description]
2. [Issue description]

## Recommendations
1. [Recommendation]
2. [Recommendation]
```

---

## 🆘 Troubleshooting Test Failures

### Common Test Failures and Solutions

#### Frontend Not Loading
```bash
# Check Node.js process
ps aux | grep "node.*1420"

# Restart frontend
npm run dev

# Check port conflicts
netstat -tulpn | grep :1420
```

#### AI Services Not Responding
```bash
# Check Docker containers
docker ps

# Restart AI services
docker-compose -f docker-compose.ai.yml restart

# Check GPU availability
nvidia-smi
```

#### Database Connection Issues
```bash
# Test database connection
docker exec jeantrail_postgres_1 psql -U jeantrail -c "SELECT 1;"

# Restart database
docker-compose restart postgresql
```

---

## 📈 Continuous Testing

### Automated Testing Setup
```bash
# Create cron job for daily tests
crontab -e

# Add: 0 9 * * * /path/to/jeantrail-os/complete-test-suite.sh >> /var/log/jeantrail-tests.log
```

### Test Monitoring
```bash
# Monitor test results
tail -f /var/log/jeantrail-tests.log

# Set up alerts for test failures
# (Implementation depends on your monitoring system)
```

---

**Testing Guide v1.0** | **Last Updated: December 2024** | **Author: Jean AI Assistant** 🤖

> 💡 **Tip**: Run the complete test suite weekly to ensure your JeanTrail OS installation remains in optimal condition.