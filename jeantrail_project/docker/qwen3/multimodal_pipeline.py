import asyncio
import aiohttp
import json
import logging
import base64
import io
from typing import Dict, Any, List, Optional, AsyncGenerator, Union
from dataclasses import dataclass
from enum import Enum
import uuid
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class ModelType(Enum):
    TEXT = "text"
    IMAGE = "image"
    VIDEO = "video"
    AUDIO = "audio"

class PipelineStage(Enum):
    INPUT_PROCESSING = "input_processing"
    ROUTING = "routing"
    PROCESSING = "processing"
    OUTPUT_FORMATTING = "output_formatting"
    POST_PROCESSING = "post_processing"

@dataclass
class PipelineRequest:
    request_id: str
    input_data: Dict[str, Any]
    user_id: str
    priority: str = "normal"
    workflow: Optional[str] = None  # Predefined workflow name
    max_stages: int = 10
    timeout_seconds: int = 300

@dataclass
class PipelineResponse:
    request_id: str
    status: str
    results: List[Dict[str, Any]]
    metadata: Dict[str, Any]
    errors: List[str]
    stages_completed: List[str]
    total_cost_cents: int
    processing_time_ms: int

@dataclass
class ModelEndpoint:
    name: str
    url: str
    model_type: ModelType
    cost_per_request: float
    max_retries: int = 3
    timeout_seconds: int = 60
    health_check_url: Optional[str] = None

class MultimodalPipeline:
    def __init__(self):
        self.endpoints = {
            "qwen-3-72b": ModelEndpoint(
                name="qwen-3-72b",
                url="http://qwen-3-72b:8000",
                model_type=ModelType.TEXT,
                cost_per_request=0.001,
                health_check_url="http://qwen-3-72b:8000/health"
            ),
            "sdxl": ModelEndpoint(
                name="sdxl",
                url="http://sdxl:8000",
                model_type=ModelType.IMAGE,
                cost_per_request=0.05,
                health_check_url="http://sdxl:8000/health"
            ),
            "whisper": ModelEndpoint(
                name="whisper",
                url="http://whisper:8000",
                model_type=ModelType.AUDIO,
                cost_per_request=0.01,
                health_check_url="http://whisper:8000/health"
            ),
            "coqui": ModelEndpoint(
                name="coqui",
                url="http://coqui:8000",
                model_type=ModelType.AUDIO,
                cost_per_request=0.005,
                health_check_url="http://coqui:8000/health"
            ),
        }
        
        self.active_requests: Dict[str, PipelineRequest] = {}
        self.request_history: List[PipelineResponse] = []
        self.workflows = self._init_workflows()

    def _init_workflows(self) -> Dict[str, List[Dict[str, Any]]]:
        """Initialize predefined workflows"""
        return {
            "text_to_image": [
                {"stage": "text_enhancement", "model": "qwen-3-72b", "purpose": "enhance_prompt"},
                {"stage": "image_generation", "model": "sdxl", "purpose": "generate_image"}
            ],
            "speech_to_text_to_analysis": [
                {"stage": "speech_to_text", "model": "whisper", "purpose": "transcribe"},
                {"stage": "text_analysis", "model": "qwen-3-72b", "purpose": "analyze_content"}
            ],
            "text_to_speech": [
                {"stage": "text_processing", "model": "qwen-3-72b", "purpose": "optimize_for_speech"},
                {"stage": "speech_synthesis", "model": "coqui", "purpose": "generate_audio"}
            ],
            "multimodal_analysis": [
                {"stage": "text_extraction", "model": "qwen-3-72b", "purpose": "extract_text"},
                {"stage": "content_analysis", "model": "qwen-3-72b", "purpose": "analyze_meaning"},
                {"stage": "response_generation", "model": "qwen-3-72b", "purpose": "generate_response"}
            ],
            "image_description": [
                {"stage": "image_analysis", "model": "qwen-3-72b", "purpose": "describe_image"},
                {"stage": "text_enhancement", "model": "qwen-3-72b", "purpose": "enhance_description"}
            ]
        }

    async def process_request(self, request: PipelineRequest) -> PipelineResponse:
        """Process a multimodal pipeline request"""
        start_time = datetime.now()
        
        try:
            self.active_requests[request.request_id] = request
            
            logger.info(f"Processing pipeline request {request.request_id}")
            
            # Initialize response
            response = PipelineResponse(
                request_id=request.request_id,
                status="processing",
                results=[],
                metadata={"workflow": request.workflow, "started_at": start_time.isoformat()},
                errors=[],
                stages_completed=[],
                total_cost_cents=0,
                processing_time_ms=0
            )
            
            # Execute workflow
            workflow_stages = self._get_workflow_stages(request.workflow)
            
            for i, stage in enumerate(workflow_stages):
                if i >= request.max_stages:
                    logger.warning(f"Max stages reached for request {request.request_id}")
                    break
                
                stage_start = datetime.now()
                try:
                    result = await self._execute_stage(stage, request, response.results)
                    response.results.append(result)
                    response.stages_completed.append(stage["stage"])
                    response.total_cost_cents += result.get("cost_cents", 0)
                    
                    logger.info(f"Completed stage {stage['stage']} for request {request.request_id}")
                    
                except Exception as e:
                    error_msg = f"Stage {stage['stage']} failed: {str(e)}"
                    logger.error(error_msg)
                    response.errors.append(error_msg)
                    
                    # Decide whether to continue or stop
                    if stage.get("critical", False):
                        response.status = "failed"
                        break
                    else:
                        continue
            
            # Finalize response
            response.status = "completed" if not response.errors else "partial"
            response.processing_time_ms = int((datetime.now() - start_time).total_seconds() * 1000)
            response.metadata["completed_at"] = datetime.now().isoformat()
            
            # Store in history
            self.request_history.append(response)
            if len(self.request_history) > 1000:  # Keep last 1000 requests
                self.request_history.pop(0)
            
            return response
            
        except Exception as e:
            logger.error(f"Pipeline request {request.request_id} failed: {str(e)}")
            return PipelineResponse(
                request_id=request.request_id,
                status="failed",
                results=[],
                metadata={"error": str(e)},
                errors=[str(e)],
                stages_completed=[],
                total_cost_cents=0,
                processing_time_ms=int((datetime.now() - start_time).total_seconds() * 1000)
            )
        finally:
            self.active_requests.pop(request.request_id, None)

    def _get_workflow_stages(self, workflow_name: Optional[str]) -> List[Dict[str, Any]]:
        """Get workflow stages by name or create default"""
        if workflow_name and workflow_name in self.workflows:
            return self.workflows[workflow_name].copy()
        
        # Default workflow: basic text processing
        return [
            {"stage": "text_processing", "model": "qwen-3-72b", "purpose": "process_input"}
        ]

    async def _execute_stage(
        self, 
        stage: Dict[str, Any], 
        request: PipelineRequest, 
        previous_results: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Execute a single pipeline stage"""
        model_name = stage["model"]
        stage_name = stage["stage"]
        purpose = stage["purpose"]
        
        endpoint = self.endpoints.get(model_name)
        if not endpoint:
            raise ValueError(f"Unknown model endpoint: {model_name}")
        
        # Prepare input for this stage
        stage_input = self._prepare_stage_input(stage, request, previous_results)
        
        # Call model endpoint
        result = await self._call_model(endpoint, stage_input, purpose)
        
        # Process result
        processed_result = self._process_stage_result(result, stage, previous_results)
        
        return {
            "stage": stage_name,
            "model": model_name,
            "purpose": purpose,
            "input": stage_input,
            "result": processed_result,
            "cost_cents": int(endpoint.cost_per_request * 100),
            "timestamp": datetime.now().isoformat()
        }

    def _prepare_stage_input(
        self, 
        stage: Dict[str, Any], 
        request: PipelineRequest, 
        previous_results: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Prepare input for a specific stage"""
        base_input = request.input_data.copy()
        
        # Add results from previous stages
        for prev_result in previous_results:
            if "result" in prev_result:
                # Merge previous results into context
                if "context" not in base_input:
                    base_input["context"] = {}
                base_input["context"][prev_result["stage"]] = prev_result["result"]
        
        # Add stage-specific context
        stage_name = stage["stage"]
        if stage_name == "text_enhancement" and "prompt" in base_input:
            # For prompt enhancement
            base_input["enhancement_type"] = "image_generation" if stage.get("purpose") == "enhance_prompt" else "general"
        
        elif stage_name == "speech_to_text" and "audio_data" in base_input:
            # For speech transcription
            base_input["language"] = base_input.get("language", "auto")
        
        elif stage_name == "text_to_speech" and "text" in base_input:
            # For speech synthesis
            base_input["voice"] = base_input.get("voice", "default")
            base_input["language"] = base_input.get("language", "en")
        
        return base_input

    async def _call_model(self, endpoint: ModelEndpoint, input_data: Dict[str, Any], purpose: str) -> Dict[str, Any]:
        """Call a model endpoint with retry logic"""
        async with aiohttp.ClientSession() as session:
            for attempt in range(endpoint.max_retries + 1):
                try:
                    if endpoint.model_type == ModelType.TEXT:
                        return await self._call_text_model(session, endpoint, input_data, purpose)
                    elif endpoint.model_type == ModelType.IMAGE:
                        return await self._call_image_model(session, endpoint, input_data, purpose)
                    elif endpoint.model_type == ModelType.AUDIO:
                        return await self._call_audio_model(session, endpoint, input_data, purpose)
                    else:
                        raise ValueError(f"Unsupported model type: {endpoint.model_type}")
                        
                except Exception as e:
                    if attempt == endpoint.max_retries:
                        raise
                    logger.warning(f"Attempt {attempt + 1} failed for {endpoint.name}: {str(e)}")
                    await asyncio.sleep(2 ** attempt)  # Exponential backoff

    async def _call_text_model(
        self, 
        session: aiohttp.ClientSession, 
        endpoint: ModelEndpoint, 
        input_data: Dict[str, Any], 
        purpose: str
    ) -> Dict[str, Any]:
        """Call text generation model"""
        url = f"{endpoint.url}/generate"
        
        # Prepare prompt based on purpose
        if purpose == "enhance_prompt":
            prompt = self._build_prompt_enhancement(input_data.get("prompt", ""))
        elif purpose == "analyze_content":
            prompt = self._build_content_analysis(input_data.get("text", ""))
        elif purpose == "optimize_for_speech":
            prompt = self._build_speech_optimization(input_data.get("text", ""))
        elif purpose == "extract_text":
            prompt = self._build_text_extraction(input_data)
        elif purpose == "describe_image":
            prompt = self._build_image_description_prompt(input_data)
        else:
            prompt = input_data.get("prompt", str(input_data))
        
        payload = {
            "prompt": prompt,
            "max_tokens": input_data.get("max_tokens", 2048),
            "temperature": input_data.get("temperature", 0.7),
            "stream": False
        }
        
        async with session.post(url, json=payload, timeout=aiohttp.ClientTimeout(total=endpoint.timeout_seconds)) as response:
            if response.status != 200:
                raise Exception(f"Model returned status {response.status}")
            
            result = await response.json()
            return {
                "text": result.get("text", ""),
                "model": endpoint.name,
                "purpose": purpose
            }

    async def _call_image_model(
        self, 
        session: aiohttp.ClientSession, 
        endpoint: ModelEndpoint, 
        input_data: Dict[str, Any], 
        purpose: str
    ) -> Dict[str, Any]:
        """Call image generation model"""
        url = f"{endpoint.url}/generate"
        
        payload = {
            "prompt": input_data.get("prompt", ""),
            "negative_prompt": input_data.get("negative_prompt", ""),
            "width": input_data.get("width", 1024),
            "height": input_data.get("height", 1024),
            "num_inference_steps": input_data.get("num_inference_steps", 20),
            "guidance_scale": input_data.get("guidance_scale", 7.5)
        }
        
        async with session.post(url, json=payload, timeout=aiohttp.ClientTimeout(total=endpoint.timeout_seconds)) as response:
            if response.status != 200:
                raise Exception(f"Model returned status {response.status}")
            
            result = await response.json()
            return {
                "image_data": result.get("image", ""),
                "model": endpoint.name,
                "purpose": purpose
            }

    async def _call_audio_model(
        self, 
        session: aiohttp.ClientSession, 
        endpoint: ModelEndpoint, 
        input_data: Dict[str, Any], 
        purpose: str
    ) -> Dict[str, Any]:
        """Call audio model (speech-to-text or text-to-speech)"""
        
        if purpose == "transcribe":
            # Speech-to-text
            url = f"{endpoint.url}/transcribe"
            
            # Handle audio data (assuming base64 encoded)
            audio_data = input_data.get("audio_data", "")
            if isinstance(audio_data, str):
                # Decode base64 and create file-like object
                audio_bytes = base64.b64decode(audio_data)
                audio_file = io.BytesIO(audio_bytes)
                
                form_data = aiohttp.FormData()
                form_data.add_field('audio', audio_file, filename='audio.wav', content_type='audio/wav')
                
                async with session.post(url, data=form_data, timeout=aiohttp.ClientTimeout(total=endpoint.timeout_seconds)) as response:
                    if response.status != 200:
                        raise Exception(f"Model returned status {response.status}")
                    
                    result = await response.json()
                    return {
                        "text": result.get("text", ""),
                        "language": result.get("language", "unknown"),
                        "model": endpoint.name,
                        "purpose": purpose
                    }
        
        elif purpose == "generate_audio":
            # Text-to-speech
            url = f"{endpoint.url}/synthesize"
            
            payload = {
                "text": input_data.get("text", ""),
                "language": input_data.get("language", "en"),
                "voice": input_data.get("voice", "default")
            }
            
            async with session.post(url, json=payload, timeout=aiohttp.ClientTimeout(total=endpoint.timeout_seconds)) as response:
                if response.status != 200:
                    raise Exception(f"Model returned status {response.status}")
                
                result = await response.json()
                return {
                    "audio_data": result.get("audio", ""),
                    "model": endpoint.name,
                    "purpose": purpose
                }
        
        else:
            raise ValueError(f"Unknown audio purpose: {purpose}")

    def _process_stage_result(
        self, 
        result: Dict[str, Any], 
        stage: Dict[str, Any], 
        previous_results: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Process and format stage result"""
        processed = result.copy()
        
        # Add stage metadata
        processed["stage_metadata"] = {
            "stage_name": stage["stage"],
            "purpose": stage["purpose"],
            "critical": stage.get("critical", False)
        }
        
        # Special processing for specific stages
        if stage["stage"] == "text_enhancement" and "text" in result:
            # Clean up enhanced prompt
            enhanced_text = result["text"].strip()
            if enhanced_text.startswith('"') and enhanced_text.endswith('"'):
                enhanced_text = enhanced_text[1:-1]
            processed["enhanced_prompt"] = enhanced_text
        
        elif stage["stage"] == "image_generation" and "image_data" in result:
            # Add image metadata
            processed["image_format"] = "png"
            processed["image_size"] = "1024x1024"
        
        elif stage["stage"] == "speech_to_text" and "text" in result:
            # Add transcription metadata
            processed["confidence"] = 0.95  # Placeholder
            processed["word_count"] = len(result["text"].split())
        
        return processed

    def _build_prompt_enhancement(self, original_prompt: str) -> str:
        """Build prompt for enhancement"""
        return f"""Enhance this image generation prompt to be more descriptive and detailed. Add artistic style, lighting, composition, and quality details.

Original prompt: {original_prompt}

Enhanced prompt:"""

    def _build_content_analysis(self, text: str) -> str:
        """Build prompt for content analysis"""
        return f"""Analyze this text content and provide insights on:
1. Main topics and themes
2. Sentiment and tone
3. Key entities and concepts
4. Intent and purpose

Text: {text}

Analysis:"""

    def _build_speech_optimization(self, text: str) -> str:
        """Build prompt for speech optimization"""
        return f"""Optimize this text for natural speech synthesis. Make it more conversational, add appropriate punctuation, and improve flow.

Original text: {text}

Optimized text:"""

    def _build_text_extraction(self, input_data: Dict[str, Any]) -> str:
        """Build prompt for text extraction"""
        context = input_data.get("context", {})
        prompt = "Extract and summarize the key information from this content:\n\n"
        
        # Add context from previous stages
        for stage, data in context.items():
            prompt += f"{stage.title()}: {data}\n\n"
        
        prompt += "\nKey information:"
        return prompt

    def _build_image_description_prompt(self, input_data: Dict[str, Any]) -> str:
        """Build prompt for image description"""
        prompt = "Describe this image in detail. Include:\n"
        prompt += "1. Main subjects and objects\n"
        prompt += "2. Setting and environment\n"
        prompt += "3. Colors and lighting\n"
        prompt += "4. Composition and perspective\n"
        prompt += "5. Mood and atmosphere\n\n"
        
        if "image_data" in input_data:
            prompt += "Image data is provided for analysis.\n\n"
        
        prompt += "Description:"
        return prompt

    async def health_check(self) -> Dict[str, Any]:
        """Check health of all model endpoints"""
        health_status = {}
        async with aiohttp.ClientSession() as session:
            for name, endpoint in self.endpoints.items():
                try:
                    health_url = endpoint.health_check_url or f"{endpoint.url}/health"
                    async with session.get(health_url, timeout=aiohttp.ClientTimeout(total=10)) as response:
                        if response.status == 200:
                            health_status[name] = {"status": "healthy", "response_time": 0}
                        else:
                            health_status[name] = {"status": "unhealthy", "error": f"HTTP {response.status}"}
                except Exception as e:
                    health_status[name] = {"status": "unhealthy", "error": str(e)}
        
        return {
            "pipeline_status": "healthy" if all(h["status"] == "healthy" for h in health_status.values()) else "degraded",
            "models": health_status,
            "active_requests": len(self.active_requests),
            "total_processed": len(self.request_history)
        }

    async def get_request_status(self, request_id: str) -> Optional[Dict[str, Any]]:
        """Get status of a specific request"""
        if request_id in self.active_requests:
            return {
                "request_id": request_id,
                "status": "processing",
                "request": self.active_requests[request_id].__dict__
            }
        
        # Check in history
        for response in self.request_history:
            if response.request_id == request_id:
                return response.__dict__
        
        return None

    def get_available_workflows(self) -> Dict[str, List[Dict[str, Any]]]:
        """Get all available workflows"""
        return self.workflows.copy()

    def get_pipeline_stats(self) -> Dict[str, Any]:
        """Get pipeline statistics"""
        if not self.request_history:
            return {"total_requests": 0}
        
        total_requests = len(self.request_history)
        successful_requests = sum(1 for r in self.request_history if r.status == "completed")
        failed_requests = sum(1 for r in self.request_history if r.status == "failed")
        avg_processing_time = sum(r.processing_time_ms for r in self.request_history) / total_requests
        total_cost = sum(r.total_cost_cents for r in self.request_history)
        
        return {
            "total_requests": total_requests,
            "successful_requests": successful_requests,
            "failed_requests": failed_requests,
            "success_rate": successful_requests / total_requests * 100,
            "avg_processing_time_ms": avg_processing_time,
            "total_cost_cents": total_cost,
            "active_requests": len(self.active_requests)
        }

# Initialize global pipeline instance
pipeline = MultimodalPipeline()

# FastAPI endpoints for pipeline
from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel

app = FastAPI(title="JeanTrail Multimodal Pipeline", version="1.0.0")

class PipelineRequestModel(BaseModel):
    input_data: Dict[str, Any]
    user_id: str
    priority: str = "normal"
    workflow: Optional[str] = None
    max_stages: int = 10
    timeout_seconds: int = 300

@app.post("/process")
async def process_pipeline_request(request: PipelineRequestModel):
    """Process a multimodal pipeline request"""
    request_id = str(uuid.uuid4())
    
    pipeline_request = PipelineRequest(
        request_id=request_id,
        input_data=request.input_data,
        user_id=request.user_id,
        priority=request.priority,
        workflow=request.workflow,
        max_stages=request.max_stages,
        timeout_seconds=request.timeout_seconds
    )
    
    try:
        response = await pipeline.process_request(pipeline_request)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/request/{request_id}")
async def get_request_status(request_id: str):
    """Get status of a specific request"""
    status = await pipeline.get_request_status(request_id)
    if not status:
        raise HTTPException(status_code=404, detail="Request not found")
    return status

@app.get("/health")
async def health_check():
    """Health check for the pipeline"""
    return await pipeline.health_check()

@app.get("/workflows")
async def get_workflows():
    """Get available workflows"""
    return pipeline.get_available_workflows()

@app.get("/stats")
async def get_stats():
    """Get pipeline statistics"""
    return pipeline.get_pipeline_stats()

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "JeanTrail Multimodal Pipeline API",
        "version": "1.0.0",
        "endpoints": {
            "process": "/process",
            "request_status": "/request/{request_id}",
            "health": "/health",
            "workflows": "/workflows",
            "stats": "/stats"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)