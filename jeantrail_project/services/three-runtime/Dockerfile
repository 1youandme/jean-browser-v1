FROM python:3.11-slim
RUN apt-get update && apt-get install -y libgl1 libx11-6 && rm -rf /var/lib/apt/lists/*
RUN pip install --no-cache-dir open3d trimesh
WORKDIR /opt/three
