#!/bin/bash
echo "Building Video Worker Image..."
docker build -t jeantrail/video-worker:latest .

echo "Creating Test Job..."
cat <<EOF > test_job.json
{
  "job_id": "test-001",
  "model_id": "stable-video-diffusion-img2vid-xt",
  "params": {
    "image_path": "/inputs/test_image.png",
    "width": 1024,
    "height": 576,
    "num_frames": 25,
    "fps": 7,
    "seed": 12345
  },
  "constraints": {
    "max_duration_seconds": 5.0
  },
  "output_path": "/outputs/result.mp4"
}
EOF

echo "Running Worker (Dry Run - Requires GPU)..."
# Note: --gpus all requires NVIDIA Container Toolkit
docker run --rm \
  --gpus all \
  --network none \
  -v $(pwd)/test_inputs:/inputs \
  -v $(pwd)/test_outputs:/outputs \
  -v $(pwd)/models:/models \
  -v $(pwd)/test_job.json:/app/job.json \
  jeantrail/video-worker:latest \
  --job /app/job.json
