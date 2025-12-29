# 📚 JeanTrail OS - API Documentation

## 📋 Table of Contents
- [Overview](#overview)
- [Authentication](#authentication)
- [AI Services APIs](#ai-services-apis)
- [Jean Assistant APIs](#jean-assistant-apis)
- [Browser APIs](#browser-apis)
- [File System APIs](#file-system-apis)
- [Proxy APIs](#proxy-apis)
- [Database APIs](#database-apis)
- [WebSocket APIs](#websocket-apis)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [SDK Examples](#sdk-examples)

---

## 🌟 Overview

JeanTrail OS provides a comprehensive REST API for controlling browser functionality, AI services, and system operations. All APIs use JSON for request/response format and follow RESTful principles.

### Base URLs
- **Development**: `http://localhost:1420/api`
- **Production**: `https://your-domain.com/api`
- **AI Services**: `http://localhost:8001`

### Common Headers
```http
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>
X-API-Version: v1
```

### Response Format
```json
{
  "success": true,
  "data": {},
  "message": "Operation completed successfully",
  "timestamp": "2024-12-09T15:30:00Z",
  "requestId": "req_123456789"
}
```

---

## 🔐 Authentication

### JWT Authentication
All API endpoints (except public ones) require JWT authentication.

#### Obtain JWT Token
```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "user@jeantrail.ai",
  "password": "user_password"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh_token_here",
    "expiresIn": 3600,
    "user": {
      "id": "user_123",
      "email": "user@jeantrail.ai",
      "role": "user"
    }
  }
}
```

#### Refresh Token
```http
POST /api/auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "refresh_token_here"
}
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer <JWT_TOKEN>
```

---

## 🤖 AI Services APIs

### Qwen-3 Text Generation

#### Generate Text
```http
POST /api/ai/qwen/generate
Authorization: Bearer <JWT_TOKEN>
```

**Request Body:**
```json
{
  "prompt": "Hello, Jean! How can you help me today?",
  "maxTokens": 2048,
  "temperature": 0.7,
  "topP": 0.9,
  "stream": false,
  "context": {
    "userId": "user_123",
    "sessionId": "session_456"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "text": "Hello! I'm Jean, your AI assistant. I can help you with browsing, file management, and more!",
    "usage": {
      "promptTokens": 25,
      "completionTokens": 30,
      "totalTokens": 55
    },
    "model": "qwen-3-72b",
    "finishReason": "stop"
  }
}
```

#### Stream Text Generation
```http
POST /api/ai/qwen/stream
Authorization: Bearer <JWT_TOKEN>
```

**Request Body:** Same as generate, with `"stream": true`

**Response:** Server-Sent Events (SSE)
```
data: {"type": "token", "value": "Hello"}
data: {"type": "token", "value": "! I'm"}
data: {"type": "done", "usage": {...}}
```

### SDXL Image Generation

#### Generate Image
```http
POST /api/ai/sdxl/generate
Authorization: Bearer <JWT_TOKEN>
```

**Request Body:**
```json
{
  "prompt": "A futuristic AI assistant in a digital landscape",
  "negativePrompt": "blurry, low quality, distorted",
  "width": 1024,
  "height": 1024,
  "steps": 30,
  "guidanceScale": 7.5,
  "seed": 42,
  "style": "photorealistic"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "imageUrl": "https://api.jeantrail.ai/images/generated_123456.png",
    "imageId": "img_123456",
    "metadata": {
      "prompt": "A futuristic AI assistant...",
      "model": "sdxl-base-1.0",
      "steps": 30,
      "seed": 42,
      "generationTime": 15.2
    }
  }
}
```

### Whisper Speech-to-Text

#### Transcribe Audio
```http
POST /api/ai/whisper/transcribe
Authorization: Bearer <JWT_TOKEN>
Content-Type: multipart/form-data
```

**Request:**
```
file: <audio_file>
language: "en" // optional
model: "whisper-1"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "text": "Hello Jean, can you help me browse the web?",
    "language": "en",
    "duration": 3.5,
    "confidence": 0.95
  }
}
```

### Coqui TTS (Text-to-Speech)

#### Generate Speech
```http
POST /api/ai/tts/generate
Authorization: Bearer <JWT_TOKEN>
```

**Request Body:**
```json
{
  "text": "Hello! I'm Jean, your AI assistant.",
  "voice": "default",
  "language": "en",
  "speed": 1.0,
  "format": "mp3"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "audioUrl": "https://api.jeantrail.ai/audio/speech_123456.mp3",
    "audioId": "audio_123456",
    "duration": 2.3,
    "format": "mp3"
  }
}
```

---

## 🧠 Jean Assistant APIs

### Chat with Jean

#### Send Message
```http
POST /api/jean/chat
Authorization: Bearer <JWT_TOKEN>
```

**Request Body:**
```json
{
  "message": "Help me find information about AI browsers",
  "context": {
    "currentUrl": "https://jeantrail.ai",
    "activeTab": "search",
    "userPreferences": {
      "language": "en",
      "timezone": "UTC"
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "I'll help you find information about AI browsers. Let me search for the latest developments...",
    "actions": [
      {
        "type": "search",
        "query": "AI browsers 2024",
        "confidence": 0.95
      },
      {
        "type": "open_tab",
        "url": "https://example.com/ai-browsers",
        "confidence": 0.87
      }
    ],
    "sessionId": "session_456",
    "messageId": "msg_789"
  }
}
```

#### Execute Action
```http
POST /api/jean/execute
Authorization: Bearer <JWT_TOKEN>
```

**Request Body:**
```json
{
  "actionId": "action_123",
  "confirm": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "executed": true,
    "result": {
      "type": "search_completed",
      "results": [
        {
          "title": "Latest AI Browser Developments",
          "url": "https://example.com/article1",
          "snippet": "AI browsers are revolutionizing..."
        }
      ]
    }
  }
}
```

### Jean Settings

#### Get Settings
```http
GET /api/jean/settings
Authorization: Bearer <JWT_TOKEN>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "personality": "helpful",
    "language": "en",
    "voiceEnabled": true,
    "autoActions": true,
    "privacy": {
      "shareUsage": false,
      "storeHistory": true
    },
    "appearance": {
      "avatar": "3d_model",
      "theme": "dark"
    }
  }
}
```

#### Update Settings
```http
PUT /api/jean/settings
Authorization: Bearer <JWT_TOKEN>
```

**Request Body:**
```json
{
  "personality": "professional",
  "voiceEnabled": false,
  "privacy": {
    "shareUsage": true
  }
}
```

---

## 🌐 Browser APIs

### Tab Management

#### Create Tab
```http
POST /api/browser/tabs
Authorization: Bearer <JWT_TOKEN>
```

**Request Body:**
```json
{
  "url": "https://example.com",
  "title": "Example Website",
  "type": "web",
  "workspace": "main"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "tabId": "tab_123",
    "url": "https://example.com",
    "title": "Example Website",
    "type": "web",
    "isActive": true,
    "createdAt": "2024-12-09T15:30:00Z"
  }
}
```

#### List Tabs
```http
GET /api/browser/tabs?workspace=main&type=web
Authorization: Bearer <JWT_TOKEN>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "tabs": [
      {
        "id": "tab_123",
        "title": "Example Website",
        "url": "https://example.com",
        "type": "web",
        "isActive": true,
        "isPinned": false,
        "favicon": "https://example.com/favicon.ico"
      }
    ],
    "total": 1
  }
}
```

#### Close Tab
```http
DELETE /api/browser/tabs/{tabId}
Authorization: Bearer <JWT_TOKEN>
```

### Navigation

#### Navigate to URL
```http
POST /api/browser/navigate
Authorization: Bearer <JWT_TOKEN>
```

**Request Body:**
```json
{
  "tabId": "tab_123",
  "url": "https://new-url.com",
  "waitForLoad": true
}
```

#### Get Page Content
```http
GET /api/browser/content/{tabId}?format=text
Authorization: Bearer <JWT_TOKEN>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "title": "Page Title",
    "content": "Page text content...",
    "metadata": {
      "wordCount": 1250,
      "readingTime": "5 min",
      "language": "en"
    }
  }
}
```

---

## 📁 File System APIs

### List Directory
```http
GET /api/files/list?path=/home/user&includeHidden=false
Authorization: Bearer <JWT_TOKEN>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "path": "/home/user",
    "items": [
      {
        "name": "Documents",
        "type": "directory",
        "size": 4096,
        "modified": "2024-12-09T10:30:00Z",
        "permissions": "rwxr-xr-x"
      },
      {
        "name": "file.txt",
        "type": "file",
        "size": 1024,
        "modified": "2024-12-09T15:30:00Z",
        "permissions": "rw-r--r--"
      }
    ]
  }
}
```

### Read File
```http
GET /api/files/read?path=/home/user/file.txt&encoding=utf8
Authorization: Bearer <JWT_TOKEN>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "content": "File content here...",
    "encoding": "utf8",
    "size": 1024,
    "mimeType": "text/plain"
  }
}
```

### Write File
```http
POST /api/files/write
Authorization: Bearer <JWT_TOKEN>
```

**Request Body:**
```json
{
  "path": "/home/user/new_file.txt",
  "content": "New file content",
  "encoding": "utf8",
  "createDirectories": true
}
```

---

## 🌐 Proxy APIs

### Create Proxy Session
```http
POST /api/proxy/session
Authorization: Bearer <JWT_TOKEN>
```

**Request Body:**
```json
{
  "targetUrl": "https://example.com",
  "node": "us-west-1",
  "type": "http"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "proxy_123",
    "proxyUrl": "https://proxy.jeantrail.ai/session/proxy_123",
    "node": "us-west-1",
    "expiresAt": "2024-12-09T16:30:00Z"
  }
}
```

### Get Proxy Status
```http
GET /api/proxy/status/{sessionId}
Authorization: Bearer <JWT_TOKEN>
```

---

## 🗄️ Database APIs

### Execute Query
```http
POST /api/database/query
Authorization: Bearer <JWT_TOKEN>
```

**Request Body:**
```json
{
  "sql": "SELECT * FROM users WHERE active = $1",
  "params": [true],
  "type": "select"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "rows": [
      {
        "id": 1,
        "name": "John Doe",
        "active": true
      }
    ],
    "rowCount": 1,
    "executionTime": 2.5
  }
}
```

---

## 🔌 WebSocket APIs

### Real-time Events

#### Connect to WebSocket
```javascript
const ws = new WebSocket('ws://localhost:1420/api/ws?token=<JWT_TOKEN>');

ws.onopen = function(event) {
    console.log('Connected to JeanTrail WebSocket');
    
    // Subscribe to events
    ws.send(JSON.stringify({
        type: 'subscribe',
        events: ['tab_updates', 'jean_messages', 'system_status']
    }));
};

ws.onmessage = function(event) {
    const data = JSON.parse(event.data);
    console.log('Received:', data);
};
```

#### Event Types
- `tab_updates`: Tab creation, closure, navigation
- `jean_messages`: Jean assistant responses
- `system_status`: Service health updates
- `file_changes`: File system modifications
- `proxy_updates`: Proxy session changes

---

## ❌ Error Handling

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Invalid request parameters",
    "details": {
      "field": "url",
      "reason": "Invalid URL format"
    }
  },
  "timestamp": "2024-12-09T15:30:00Z",
  "requestId": "req_123456789"
}
```

### Common Error Codes
| Code | Description |
|------|-------------|
| `INVALID_REQUEST` | Invalid request parameters |
| `UNAUTHORIZED` | Invalid or missing authentication |
| `FORBIDDEN` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `RATE_LIMITED` | Too many requests |
| `SERVICE_UNAVAILABLE` | AI service temporarily unavailable |
| `VALIDATION_ERROR` | Input validation failed |

---

## ⏱️ Rate Limiting

### Rate Limits
- **Standard APIs**: 100 requests/minute
- **AI Generation APIs**: 10 requests/minute
- **File Operations**: 50 requests/minute

### Rate Limit Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1702125600
```

### Rate Limit Response
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Rate limit exceeded. Try again in 60 seconds."
  }
}
```

---

## 💻 SDK Examples

### JavaScript/TypeScript SDK
```typescript
import { JeanTrailAPI } from '@jeantrail/sdk';

const api = new JeanTrailAPI({
  baseURL: 'http://localhost:1420/api',
  token: 'your_jwt_token'
});

// Chat with Jean
const response = await api.jean.chat({
  message: 'Help me browse the web',
  context: { currentUrl: 'https://jeantrail.ai' }
});

console.log(response.data.message);

// Generate image
const image = await api.ai.sdxl.generate({
  prompt: 'Futuristic AI assistant',
  width: 1024,
  height: 1024
});

console.log(image.data.imageUrl);
```

### Python SDK
```python
from jeantrail_sdk import JeanTrailAPI

api = JeanTrailAPI(
    base_url='http://localhost:1420/api',
    token='your_jwt_token'
)

# Generate text with Qwen-3
response = api.ai.qwen.generate(
    prompt="Hello Jean!",
    max_tokens=500
)

print(response.data.text)

# List browser tabs
tabs = api.browser.tabs.list()
for tab in tabs.data.tabs:
    print(f"{tab.title}: {tab.url}")
```

### cURL Examples
```bash
# Chat with Jean
curl -X POST http://localhost:1420/api/jean/chat \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello Jean!",
    "context": {}
  }'

# Generate image
curl -X POST http://localhost:1420/api/ai/sdxl/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Futuristic AI assistant",
    "width": 1024,
    "height": 1024
  }'
```

---

## 📊 API Usage Examples

### Complete Browser Workflow
```javascript
// 1. Authenticate
const auth = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@jeantrail.ai',
    password: 'password'
  })
});

const { token } = await auth.json();

// 2. Create a new tab
const tab = await fetch('/api/browser/tabs', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    url: 'https://example.com',
    type: 'web'
  })
});

const { tabId } = await tab.json();

// 3. Ask Jean to analyze the page
const analysis = await fetch('/api/jean/chat', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    message: 'Analyze this page and summarize the key points',
    context: { currentUrl: 'https://example.com', activeTab: tabId }
  })
});

const result = await analysis.json();
console.log(result.data.message);
```

---

## 🔄 API Versioning

### Versioning Strategy
- Current version: `v1`
- Version specified in URL: `/api/v1/...`
- Backward compatibility maintained for at least 6 months
- Deprecation notices sent 3 months before removal

### Version Headers
```http
X-API-Version: v1
X-API-Deprecated: false
X-API-Sunset: 2025-06-09T00:00:00Z
```

---

## 📝 OpenAPI Specification

The complete OpenAPI 3.0 specification is available at:
- **Development**: `http://localhost:1420/api/docs`
- **Production**: `https://your-domain.com/api/docs`

### Interactive Documentation
- **Swagger UI**: `http://localhost:1420/api/docs/swagger`
- **ReDoc**: `http://localhost:1420/api/docs/redoc`

---

## 🆘 Support

For API-related issues:
1. Check the API status: `GET /api/status`
2. Review error messages and codes
3. Consult the troubleshooting section
4. Create an issue on GitHub with request details

---

**API Documentation v1.0** | **Last Updated: December 2024** | **Author: Jean AI Assistant** 🤖