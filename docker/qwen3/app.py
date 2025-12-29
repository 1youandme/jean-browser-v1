import asyncio
import aiohttp
import json
import logging
import time
from typing import AsyncGenerator, Dict, Any, Optional, List
from contextlib import asynccontextmanager
from dataclasses import dataclass
from fastapi import FastAPI, Request, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel, Field
from sse_starlette import EventSourceResponse
import uvicorn
import os
from llama_cpp import Llama
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from fastapi.responses import Response

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Prometheus Metrics
REQUEST_COUNT = Counter('qwen_requests_total', 'Total Qwen requests', ['model', 'status'])
REQUEST_DURATION = Histogram('qwen_request_duration_seconds', 'Qwen request duration')
TOKENS_GENERATED = Counter('qwen_tokens_generated_total', 'Total tokens generated')

@dataclass
class ModelConfig:
    model_path: str
    n_ctx: int = 32768
    n_threads: int = 8
    n_gpu_layers: int = 40
    verbose: bool = False
    temperature: float = 0.7
    max_tokens: int = 2048

class GenerateRequest(BaseModel):
    prompt: str = Field(..., description="The prompt to generate text from")
    max_tokens: int = Field(2048, ge=1, le=4096, description="Maximum number of tokens to generate")
    temperature: float = Field(0.7, ge=0.0, le=2.0, description="Sampling temperature")
    stream: bool = Field(False, description="Whether to stream the response")
    top_p: float = Field(0.95, ge=0.0, le=1.0, description="Top-p sampling")
    top_k: int = Field(40, ge=1, description="Top-k sampling")
    repeat_penalty: float = Field(1.1, ge=0.0, le=2.0, description="Repetition penalty")
    stop: Optional[List[str]] = Field(None, description="Stop sequences")

class GenerateResponse(BaseModel):
    text: str
    tokens_generated: int
    model: str
    usage: Dict[str, int]
    finish_reason: str

class ChatRequest(BaseModel):
    messages: List[Dict[str, str]] = Field(..., description="List of chat messages")
    max_tokens: int = Field(2048, ge=1, le=4096)
    temperature: float = Field(0.7, ge=0.0, le=2.0)
    stream: bool = Field(False)
    system_prompt: Optional[str] = Field(None, description="System prompt to use")

class Qwen3Inference:
    def __init__(self, config: ModelConfig):
        self.config = config
        self.model = None
        self.session_id = "qwen-3-72b"
        self.load_model()
    
    def load_model(self):
        """Load the Qwen model with optimized settings"""
        try:
            logger.info(f"Loading Qwen model from {self.config.model_path}")
            self.model = Llama(
                model_path=self.config.model_path,
                n_ctx=self.config.n_ctx,
                n_threads=self.config.n_threads,
                n_gpu_layers=self.config.n_gpu_layers,
                verbose=self.config.verbose,
                use_mlock=True,
                embedding=False,
                rope_scaling_type=1,
                n_batch=512,
                f16_kv=True
            )
            logger.info("Qwen model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load Qwen model: {e}")
            raise
    
    def format_chat_prompt(self, messages: List[Dict[str, str]], system_prompt: Optional[str] = None) -> str:
        """Format chat messages into a single prompt"""
        prompt_parts = []
        
        if system_prompt:
            prompt_parts.append(f"<|system|>\n{system_prompt}\n<|endoftext|>")
        
        for message in messages:
            role = message.get("role", "user")
            content = message.get("content", "")
            
            if role == "system":
                prompt_parts.append(f"<|system|>\n{content}\n<|endoftext|>")
            elif role == "user":
                prompt_parts.append(f"<|user|>\n{content}\n<|endoftext|>")
            elif role == "assistant":
                prompt_parts.append(f"<|assistant|>\n{content}\n<|endoftext|>")
        
        prompt_parts.append("<|assistant|>\n")
        return "\n".join(prompt_parts)
    
    async def generate(
        self,
        prompt: str,
        max_tokens: int = 2048,
        temperature: float = 0.7,
        stream: bool = False,
        top_p: float = 0.95,
        top_k: int = 40,
        repeat_penalty: float = 1.1,
        stop: Optional[List[str]] = None
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """Generate text with streaming support"""
        try:
            start_time = time.time()
            tokens_generated = 0
            
            if stream:
                # Streaming generation
                for output in self.model(
                    prompt,
                    max_tokens=max_tokens,
                    temperature=temperature,
                    top_p=top_p,
                    top_k=top_k,
                    repeat_penalty=repeat_penalty,
                    stop=stop,
                    stream=True
                ):
                    token_text = output["choices"][0]["text"]
                    tokens_generated += 1
                    
                    yield {
                        "token": token_text,
                        "done": False,
                        "tokens_generated": tokens_generated,
                        "model": self.session_id
                    }
                
                # Final chunk
                duration = time.time() - start_time
                yield {
                    "token": "",
                    "done": True,
                    "tokens_generated": tokens_generated,
                    "model": self.session_id,
                    "duration": duration,
                    "tokens_per_second": tokens_generated / duration if duration > 0 else 0
                }
                
            else:
                # Non-streaming generation
                output = self.model(
                    prompt,
                    max_tokens=max_tokens,
                    temperature=temperature,
                    top_p=top_p,
                    top_k=top_k,
                    repeat_penalty=repeat_penalty,
                    stop=stop,
                    stream=False
                )
                
                text = output["choices"][0]["text"]
                tokens_generated = output.get("usage", {}).get("completion_tokens", len(text.split()))
                duration = time.time() - start_time
                
                yield {
                    "result": text,
                    "done": True,
                    "tokens_generated": tokens_generated,
                    "model": self.session_id,
                    "duration": duration,
                    "tokens_per_second": tokens_generated / duration if duration > 0 else 0,
                    "usage": {
                        "prompt_tokens": output.get("usage", {}).get("prompt_tokens", 0),
                        "completion_tokens": tokens_generated,
                        "total_tokens": output.get("usage", {}).get("total_tokens", tokens_generated)
                    }
                }
                
        except Exception as e:
            logger.error(f"Generation error: {e}")
            yield {
                "error": str(e),
                "done": True,
                "model": self.session_id
            }

# Global model instance
qwen_model = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    global qwen_model
    
    # Initialize model
    config = ModelConfig(
        model_path=os.getenv("MODEL_PATH", "/models/qwen-3-72b.Q4_K_M.gguf"),
        n_ctx=int(os.getenv("MAX_CTX", "32768")),
        n_threads=int(os.getenv("N_THREADS", "8")),
        n_gpu_layers=int(os.getenv("N_GPU_LAYERS", "40"))
    )
    
    qwen_model = Qwen3Inference(config)
    
    yield
    
    # Cleanup
    logger.info("Shutting down Qwen service")

# Create FastAPI app
app = FastAPI(
    title="JeanTrail Qwen-3 API",
    description="Advanced Qwen-3 inference with streaming support",
    version="2.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "model": "qwen-3-72b",
        "version": "2.0.0",
        "gpu_available": qwen_model is not None
    }

@app.get("/metrics")
async def metrics():
    """Prometheus metrics endpoint"""
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)

@app.post("/generate")
async def generate_text(request: GenerateRequest):
    """Generate text from prompt"""
    if not qwen_model:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    REQUEST_COUNT.labels(model="qwen-3-72b", status="started").inc()
    
    try:
        stream = request.stream
        
        async def event_generator():
            async for chunk in qwen_model.generate(
                prompt=request.prompt,
                max_tokens=request.max_tokens,
                temperature=request.temperature,
                stream=stream,
                top_p=request.top_p,
                top_k=request.top_k,
                repeat_penalty=request.repeat_penalty,
                stop=request.stop
            ):
                yield json.dumps(chunk)
                
                if chunk.get("done", False):
                    if "error" in chunk:
                        REQUEST_COUNT.labels(model="qwen-3-72b", status="error").inc()
                    else:
                        REQUEST_COUNT.labels(model="qwen-3-72b", status="success").inc()
                        TOKENS_GENERATED.inc(chunk.get("tokens_generated", 0))
        
        if stream:
            return EventSourceResponse(event_generator())
        else:
            async for result in event_generator():
                data = json.loads(result)
                if data.get("done", False) and "result" in data:
                    return GenerateResponse(
                        text=data["result"],
                        tokens_generated=data["tokens_generated"],
                        model=data["model"],
                        usage=data.get("usage", {}),
                        finish_reason="stop"
                    )
                elif data.get("done", False) and "error" in data:
                    raise HTTPException(status_code=500, detail=data["error"])
                    
    except Exception as e:
        REQUEST_COUNT.labels(model="qwen-3-72b", status="error").inc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat")
async def chat_completion(request: ChatRequest):
    """Chat completion endpoint"""
    if not qwen_model:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    # Format chat messages
    prompt = qwen_model.format_chat_prompt(
        request.messages,
        request.system_prompt
    )
    
    # Use generate endpoint with formatted prompt
    generate_request = GenerateRequest(
        prompt=prompt,
        max_tokens=request.max_tokens,
        temperature=request.temperature,
        stream=request.stream
    )
    
    return await generate_text(generate_request)

@app.get("/models")
async def list_models():
    """List available models"""
    return {
        "models": [
            {
                "id": "qwen-3-72b",
                "object": "model",
                "created": int(time.time()),
                "owned_by": "jeantrail"
            }
        ],
        "object": "list"
    }

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "JeanTrail Qwen-3 API",
        "version": "2.0.0",
        "endpoints": {
            "generate": "/generate",
            "chat": "/chat",
            "health": "/health",
            "metrics": "/metrics",
            "models": "/models"
        }
    }

if __name__ == "__main__":
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
        log_level="info"
    )