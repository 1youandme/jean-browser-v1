# JeanTrail OS - Qwen-3 Integration Guide

## 🧠 Overview

This document describes the complete integration of Qwen-3 and other AI models into JeanTrail OS, creating a powerful, cost-optimized, multi-modal AI backend.

## 🏗️ Architecture

```
JeanTrail Frontend (React)
         ↓
AI Gateway (Rust/Axum)
         ↓
Model Registry (Redis)
         ↓
┌─────────────────────────────────┐
│  Model Workers (Async Docker)   │
│  ┌─────────────┐ ┌─────────────┐ │
│  │ Qwen-3 72B  │ │ SDXL        │ │
│  │ (Text)      │ │ (Image)     │ │
│  └─────────────┘ └─────────────┘ │
│  ┌─────────────┐ ┌─────────────┐ │
│  │ Whisper     │ │ Coqui TTS   │ │
│  │ (Speech)    │ │ (Speech)    │ │
│  └─────────────┘ └─────────────┘ │
└─────────────────────────────────┘
         ↓
PostgreSQL (Jobs, Results, Costs)
```

## 🚀 Quick Start

### 1. Start AI Services

```bash
# Start all AI services
docker-compose -f docker-compose.ai.yml up -d

# Check service health
curl http://localhost:3001/health
```

### 2. Run Rust AI Gateway

```bash
cd src-tauri
cargo run --bin ai-gateway
```

### 3. Start Frontend

```bash
npm run dev
```

## 📋 Services Overview

### AI Models

| Model | Purpose | Endpoint | Cost |
|-------|---------|----------|------|
| Qwen-3 72B | Text generation | :8001 | $0.001/token |
| SDXL | Image generation | :8002 | $0.05/image |
| Whisper | Speech-to-text | :8004 | $0.01/second |
| Coqui TTS | Text-to-speech | :8005 | $0.005/second |

### Core Components

#### 1. AI Gateway (Rust/Axum)
- **Port**: 3001
- **Purpose**: Central orchestration and job management
- **Features**: 
  - Async job processing
  - Cost tracking
  - Model routing
  - Streaming support

#### 2. Model Registry (Redis)
- **Port**: 6380
- **Purpose**: Model health monitoring and configuration
- **Features**:
  - Real-time health checks
  - Model versioning
  - Performance metrics

#### 3. Database (PostgreSQL)
- **Port**: 5432
- **Purpose**: Persistent storage for jobs, results, and analytics
- **Tables**:
  - `ai_jobs` - Job tracking
  - `ai_results` - Result storage
  - `ai_costs` - Cost management
  - `ai_usage_stats` - Analytics

## 🔧 Configuration

### Environment Variables

```bash
# AI Gateway
DATABASE_URL=postgresql://jeantrail:secure_password_123@postgres:5432/jeantrail
REDIS_URL=redis://model-registry:6379

# Model Endpoints
QWEN_URL=http://qwen-3-72b:8000
SDXL_URL=http://sdxl:8000
WHISPER_URL=http://whisper:8000
COQUI_URL=http://coqui:8000
```

### Model Settings

#### Qwen-3 Configuration
```json
{
  "model_path": "/models/qwen-3-72b.Q4_K_M.gguf",
  "n_ctx": 32768,
  "n_threads": 8,
  "n_gpu_layers": 40,
  "temperature": 0.7,
  "max_tokens": 2048
}
```

## 📡 API Endpoints

### Text Generation
```bash
curl -X POST http://localhost:3001/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Hello Jean!",
    "model": "qwen-3-72b",
    "user_id": "user123",
    "stream": false,
    "max_tokens": 2048,
    "temperature": 0.7
  }'
```

### Image Generation
```bash
curl -X POST http://localhost:3001/generate-image \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A futuristic AI assistant",
    "user_id": "user123",
    "width": 1024,
    "height": 1024
  }'
```

### Multimodal Workflow
```bash
curl -X POST http://localhost:3001/pipeline/process \
  -H "Content-Type: application/json" \
  -d '{
    "input_data": {"prompt": "Create a futuristic AI image"},
    "user_id": "user123",
    "workflow": "text_to_image"
  }'
```

### Job Status
```bash
curl http://localhost:3001/job/{job_id}
```

### Streaming
```bash
curl -X POST http://localhost:3001/generate \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{
    "prompt": "Tell me a story",
    "stream": true
  }'
```

## 🎯 Workflows

### Available Workflows

1. **text_to_image**
   - Enhance prompt with Qwen-3
   - Generate image with SDXL

2. **speech_to_text_to_analysis**
   - Transcribe audio with Whisper
   - Analyze text with Qwen-3

3. **text_to_speech**
   - Optimize text for speech
   - Generate audio with Coqui

4. **multimodal_analysis**
   - Extract text from content
   - Analyze meaning
   - Generate response

5. **image_description**
   - Describe images with Qwen-3
   - Enhance descriptions

## 💰 Cost Management

### Cost Tracking
- Real-time cost estimation
- Usage analytics
- Budget alerts
- Cost optimization rules

### Budget Setup
```sql
INSERT INTO ai_budgets (
    user_id, budget_type, amount_cents, 
    period_start, period_end, alert_threshold_percentage
) VALUES (
    'user123', 'daily', 1000,  -- $10 per day
    CURRENT_DATE, CURRENT_DATE + INTERVAL '1 day', 80
);
```

### Cost Optimization
```sql
INSERT INTO ai_cost_optimization_rules (
    user_id, rule_name, rule_type, conditions, actions
) VALUES (
    'user123', 'model_selection', 'model_selection',
    '{"input_length": "<100", "task_type": "simple"}',
    '{"model": "qwen-3-32b", "temperature": 0.5}'
);
```

## 📊 Monitoring

### Health Checks
```bash
# AI Gateway
curl http://localhost:3001/health

# Individual Models
curl http://localhost:8001/health  # Qwen-3
curl http://localhost:8002/health  # SDXL
curl http://localhost:8004/health  # Whisper
curl http://localhost:8005/health  # Coqui
```

### Metrics
- Request count and duration
- Token usage and costs
- Model health status
- Queue wait times
- Success/failure rates

### Prometheus Metrics
Available at `http://localhost:3001/metrics`

## 🔍 Prompt Engineering

### Template System
```rust
// Jean Core prompt
let prompt = prompt_service.build_jean_core_prompt(
    user_query,
    &context
).await?;

// Price intelligence
let prompt = prompt_service.build_price_intelligence_prompt(
    alibaba_price,
    amazon_price,
    weight,
    has_free_shipping
).await?;
```

### Predefined Templates
- **jean_core** - General Jean assistant
- **price_intelligence** - Price analysis
- **mobile_emulator** - Mobile app guidance
- **sdxl_image** - Image generation

## 🛠️ Development

### Adding New Models

1. **Create Docker Service**
```yaml
new-model:
  image: your-model:latest
  ports:
    - "8006:8000"
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
```

2. **Register Model in Gateway**
```rust
registry.add_model(ModelInfo {
    name: "new-model",
    version: "v1.0.0",
    endpoint: "http://new-model:8000",
    model_type: ModelType::Text,
    cost_per_unit: 0.002,
    unit_type: UnitType::Token,
    // ... other fields
});
```

3. **Create API Handler**
```rust
async fn call_new_model_api(input: &Value, endpoint: &str) -> Result<Value> {
    // Implementation
}
```

### Custom Workflows

```rust
// Add new workflow to pipeline.rs
workflows.insert("custom_workflow", vec![
    {"stage": "step1", "model": "model1", "purpose": "purpose1"},
    {"stage": "step2", "model": "model2", "purpose": "purpose2"},
]);
```

## 🧪 Testing

### Unit Tests
```bash
cd src-tauri
cargo test ai_gateway
cargo test prompt_engineering
```

### Integration Tests
```bash
# Test text generation
curl -X POST http://localhost:3001/generate \
  -d '{"prompt": "test", "user_id": "test"}'

# Test image generation
curl -X POST http://localhost:3001/generate-image \
  -d '{"prompt": "test image", "user_id": "test"}'

# Test workflow
curl -X POST http://localhost:3001/pipeline/process \
  -d '{"input_data": {"prompt": "test"}, "user_id": "test", "workflow": "text_to_image"}'
```

## 🔒 Security

### Access Control
- User-based permissions
- Rate limiting
- Cost limits
- API key authentication

### Privacy
- No data sent to cloud LLMs
- Local processing only
- Encrypted storage
- Audit logging

## 📈 Performance Optimization

### Model Optimization
- Quantized models (Q4_K_M)
- GPU memory sharing
- Batch processing
- Intelligent routing

### Caching
- Redis caching for model status
- Result caching for repeated queries
- Connection pooling
- Async processing

## 🚨 Troubleshooting

### Common Issues

1. **Model Not Responding**
   ```bash
   docker logs qwen-3-72b
   curl http://localhost:8001/health
   ```

2. **High Memory Usage**
   ```bash
   docker stats
   # Reduce n_gpu_layers in model config
   ```

3. **Jobs Stuck in Processing**
   ```bash
   # Check worker status
   curl http://localhost:3001/health
   # Restart workers
   docker-compose restart ai-gateway
   ```

4. **Cost Tracking Issues**
   ```sql
   -- Check cost tables
   SELECT * FROM ai_costs;
   SELECT * FROM ai_usage_stats;
   ```

## 📚 Additional Resources

- [Qwen-3 Documentation](https://huggingface.co/Qwen/Qwen-3-72B)
- [SDXL Documentation](https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0)
- [Axum Framework](https://github.com/tokio-rs/axum)
- [Redis Documentation](https://redis.io/documentation)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Add tests for new functionality
4. Submit pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.