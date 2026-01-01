# Qwen-3 AI Model Service for JeanTrail OS
FROM python:3.10-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    DEBIAN_FRONTEND=noninteractive

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    software-properties-common \
    git \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Create app directory
WORKDIR /app

# Copy application code
COPY . .

# Create model cache directory
RUN mkdir -p /app/models

# Download Qwen-3 model (will be done at runtime for flexibility)
# RUN python -c "from transformers import AutoModelForCausalLM, AutoTokenizer; \
#     AutoModelForCausalLM.from_pretrained('Qwen/Qwen2-7B-Instruct', cache_dir='/app/models')"

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

# Run the application
CMD ["python", "app.py"]