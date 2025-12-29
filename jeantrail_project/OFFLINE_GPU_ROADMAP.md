# Offline / Local GPU Roadmap

## Strategic Objective
Transition Jean Runtime from a logic-based state machine to a fully sovereign, neuro-symbolic agent running on local hardware.

## Target Architectures

### 1. WebGPU (Primary)
- **Technology:** WebGPU API for direct GPU access in the browser.
- **Model Format:** ONNX / GGUF (via WebLLM or similar).
- **Goal:** Run 3B-7B parameter models (e.g., Llama 3 8B, Phi-3) directly in the tab.
- **Latency Target:** < 50ms token generation time.

### 2. WASM (Fallback)
- **Technology:** WebAssembly for CPU-based inference.
- **Use Case:** Devices without WebGPU support or restricted environments.
- **Model Scale:** Quantized TinyLlama (1.1B) or specialized SLMs.

### 3. Optional CUDA / Metal Bridge
- **Technology:** Local native bridge to system GPU.
- **Status:** Research only. Requires native companion app.

## Execution Boundaries

| Feature | Local (Sovereign) | Remote (Optional) |
| :--- | :--- | :--- |
| **Prompt Processing** | 100% | 0% |
| **Token Generation** | 100% | 0% |
| **Memory Embeddings** | 100% (Vector DB in IndexedDB) | 0% |
| **Knowledge Retrieval** | Local Files / Browser Cache | Live Web Search (Proxied) |

## Security Boundaries
- **Sandboxing:** The Inference Engine runs in a dedicated WebWorker, isolated from the main thread and DOM.
- **Input Sanitization:** All prompts pass through the Safety Policy Layer *before* reaching the model.
- **Output Validation:** Model outputs are validated against the `JeanRuntimeBoundary` constraints before execution.

## Migration Strategy

### Stage 1: Current (Beta)
- **Logic:** Deterministic State Machine + Heuristics.
- **Safety:** Regex/Rule-based.

### Stage 2: Hybrid (Q2 2026)
- **Logic:** Small Language Model (SLM) for intent classification.
- **Safety:** Semantic embedding check.
- **Execution:** Still rule-based.

### Stage 3: Fully Neural (Q4 2026)
- **Logic:** End-to-end Local LLM decision making.
- **Safety:** Dual-model verification (Actor/Critic).
- **Execution:** Model-generated function calls.

## Hardware Requirements (Projected)
- **Minimum:** 8GB RAM, Integrated GPU (M1/M2/M3 or Intel Iris Xe).
- **Recommended:** 16GB+ RAM, Discrete GPU (NVIDIA RTX 3060+ or equivalent).
