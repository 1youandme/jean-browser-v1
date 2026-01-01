# Base Image: PyTorch with CUDA support
FROM pytorch/pytorch:2.1.2-cuda12.1-cudnn8-runtime

# Metadata
LABEL maintainer="ai-kernel-team"
LABEL capability="video_gen"
LABEL version="1.0.0"

# Environment Variables
ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1
ENV HF_HOME=/models

# Install System Dependencies (FFmpeg, Git)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libsm6 \
    libxext6 \
    git \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Create Working Directory
WORKDIR /app

# Install Python Dependencies
# We leverage caching by copying requirements first
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy Worker Code
COPY worker_entry.py .
COPY job_spec.schema.json .

# Create Directories for Mounts
RUN mkdir -p /inputs /outputs /models

# Create a non-root user for security
RUN useradd -m -u 1000 worker
RUN chown -R worker:worker /app /inputs /outputs /models
USER worker

# Entrypoint
ENTRYPOINT ["python", "worker_entry.py"]
CMD ["--help"]
