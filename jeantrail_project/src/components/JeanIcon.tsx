import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

interface JeanIconProps {
  size?: number;
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
}

export const JeanIcon: React.FC<JeanIconProps> = ({ 
  size = 32, 
  isActive = false, 
  onClick,
  className = ""
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.z = 5;
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(size, size);
    renderer.setPixelRatio(window.devicePixelRatio * 2);
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);

    // Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0x4a90e2, 0.5);
    pointLight.position.set(-5, 3, 2);
    scene.add(pointLight);

    // Create Jean avatar placeholder (stylized head)
    const group = new THREE.Group();
    
    // Head base (stylized)
    const headGeometry = new THREE.SphereGeometry(1.5, 32, 32);
    const headMaterial = new THREE.MeshPhongMaterial({
      color: isActive ? 0x4a90e2 : 0x2c3e50,
      emissive: isActive ? 0x1a5490 : 0x0f1419,
      emissiveIntensity: isActive ? 0.3 : 0.1,
      shininess: 100,
      specular: 0x222222
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.castShadow = true;
    group.add(head);

    // Jean's distinctive features
    // Eyes (glowing when active)
    const eyeGeometry = new THREE.SphereGeometry(0.15, 16, 16);
    const eyeMaterial = new THREE.MeshPhongMaterial({
      color: isActive ? 0x00ff88 : 0xffffff,
      emissive: isActive ? 0x00ff88 : 0xffffff,
      emissiveIntensity: isActive ? 0.8 : 0.3
    });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.4, 0.2, 1.3);
    group.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.4, 0.2, 1.3);
    group.add(rightEye);

    // Jean's tech crown/circuit
    const crownGeometry = new THREE.TorusGeometry(1.6, 0.1, 8, 32);
    const crownMaterial = new THREE.MeshPhongMaterial({
      color: 0x4a90e2,
      emissive: 0x1a5490,
      emissiveIntensity: isActive ? 0.6 : 0.2
    });
    const crown = new THREE.Mesh(crownGeometry, crownMaterial);
    crown.position.y = 1.4;
    crown.rotation.x = Math.PI / 4;
    group.add(crown);

    // Circuit lines on head
    const curve = new THREE.EllipseCurve(
      0, 0,
      1.7, 0.8,
      0, 2 * Math.PI,
      false,
      0
    );
    const points = curve.getPoints(64);
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(
      points.map(p => new THREE.Vector3(p.x, p.y + 0.5, 1.2))
    );
    const lineMaterial = new THREE.LineBasicMaterial({ 
      color: 0x00ff88,
      opacity: isActive ? 0.8 : 0.4,
      transparent: true
    });
    const circuitLine = new THREE.Line(lineGeometry, lineMaterial);
    group.add(circuitLine);

    modelRef.current = group;
    scene.add(group);

    // Animation
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      
      if (modelRef.current) {
        // Gentle floating animation
        modelRef.current.position.y = Math.sin(Date.now() * 0.001) * 0.1;
        
        // Slow rotation when active
        if (isActive) {
          modelRef.current.rotation.y += 0.01;
        }
        
        // Breathing effect
        const breathingScale = 1 + Math.sin(Date.now() * 0.002) * 0.02;
        modelRef.current.scale.set(breathingScale, breathingScale, breathingScale);
      }
      
      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [size, isActive]);

  return (
    <div 
      ref={mountRef}
      className={`cursor-pointer transition-all duration-300 ${className}`}
      style={{ 
        width: size, 
        height: size,
        filter: isActive ? 'drop-shadow(0 0 8px rgba(74, 144, 226, 0.6))' : 'none'
      }}
      onClick={onClick}
    />
  );
};