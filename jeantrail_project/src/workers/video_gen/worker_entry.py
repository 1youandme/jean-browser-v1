import argparse
import json
import os
import sys
import torch
import cv2
import numpy as np
from diffusers import StableVideoDiffusionPipeline
from diffusers.utils import load_image, export_to_video
from PIL import Image

def load_pipeline(model_id):
    print(f"[Worker] Loading model: {model_id}")
    pipe = StableVideoDiffusionPipeline.from_pretrained(
        model_id, 
        torch_dtype=torch.float16, 
        variant="fp16"
    )
    pipe.enable_model_cpu_offload()
    # pipe.to("cuda") # Handled by cpu_offload
    return pipe

def validate_constraints(job_spec):
    constraints = job_spec.get("constraints", {})
    max_dur = constraints.get("max_duration_seconds", 12.0)
    
    # SVD typical: 25 frames @ 7 fps ~= 3.5s
    # OpenSora might be longer
    
    params = job_spec["params"]
    frames = params.get("num_frames", 25)
    fps = params.get("fps", 7)
    
    duration = frames / fps
    
    if duration > 12.0:
        print(f"[Error] Duration {duration:.2f}s exceeds hard limit of 12.0s")
        sys.exit(1)
        
    if duration > max_dur:
        print(f"[Error] Duration {duration:.2f}s exceeds job limit of {max_dur}s")
        sys.exit(1)
        
    print(f"[Worker] Validation Passed: Duration {duration:.2f}s <= {max_dur}s")

def run_job(job_file):
    print(f"[Worker] Reading job spec from {job_file}")
    with open(job_file, 'r') as f:
        job = json.load(f)
        
    validate_constraints(job)
    
    params = job["params"]
    output_path = job["output_path"]
    seed = params.get("seed", 42)
    
    # Determinism
    generator = torch.manual_seed(seed)
    
    # Load Image
    image_path = params["image_path"]
    if not os.path.exists(image_path):
        print(f"[Error] Input image not found: {image_path}")
        sys.exit(1)
        
    image = load_image(image_path)
    image = image.resize((params.get("width", 1024), params.get("height", 576)))
    
    # Initialize Model
    model_id = job.get("model_id", "stabilityai/stable-video-diffusion-img2vid-xt")
    pipe = load_pipeline(model_id)
    
    print("[Worker] Generating video...")
    frames = pipe(
        image, 
        decode_chunk_size=8, 
        generator=generator,
        num_frames=params.get("num_frames", 25),
        motion_bucket_id=params.get("motion_bucket_id", 127),
        noise_aug_strength=params.get("noise_aug_strength", 0.1),
    ).frames[0]
    
    # Export
    print(f"[Worker] Saving to {output_path}")
    export_to_video(frames, output_path, fps=params.get("fps", 7))
    
    # Write Metadata
    meta_path = output_path + ".meta.json"
    metadata = {
        "job_id": job["job_id"],
        "status": "completed",
        "output_path": output_path,
        "duration_sec": len(frames) / params.get("fps", 7),
        "frame_count": len(frames),
        "resolution": f"{image.width}x{image.height}",
        "seed": seed
    }
    
    with open(meta_path, 'w') as f:
        json.dump(metadata, f, indent=2)
        
    print("[Worker] Job Completed Successfully")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--job", required=True, help="Path to job spec JSON")
    args = parser.parse_args()
    
    try:
        run_job(args.job)
    except Exception as e:
        print(f"[Fatal Error] {e}")
        sys.exit(1)
