FROM python:3.11-slim
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libsndfile1 \
    portaudio19-dev \
    build-essential \
  && rm -rf /var/lib/apt/lists/*
RUN pip install --no-cache-dir opencv-python-headless pyaudio
WORKDIR /opt/media
