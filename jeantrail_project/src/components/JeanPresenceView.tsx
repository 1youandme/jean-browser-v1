import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { JeanPresenceState } from '../jean-runtime/state/JeanPresenceStateMachine';

interface JeanPresenceViewProps {
  className?: string;
}

export const JeanPresenceView: React.FC<JeanPresenceViewProps> = ({ className = "" }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [presenceState, setPresenceState] = useState<JeanPresenceState>(JeanPresenceState.IDLE);
  const modelRef = useRef<THREE.Group | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const frameIdRef = useRef<number>(0);

  // Listen for Presence Changes
  useEffect(() => {
    const handlePresenceChange = (event: CustomEvent) => {
      if (event.detail && event.detail.state) {
        setPresenceState(event.detail.state);
        console.log('[Jean Presence View] State updated:', event.detail.state);
      }
    };

    window.addEventListener('jean-presence-change' as any, handlePresenceChange as any);
    return () => {
      window.removeEventListener('jean-presence-change' as any, handlePresenceChange as any);
    };
  }, []);

  // Three.js Setup
  useEffect(() => {
    if (!mountRef.current) return;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 3.5); // Optimal portrait distance
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    rendererRef.current = renderer;
    mountRef.current.appendChild(renderer.domElement);

    // Lighting (Calm, Studio)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.0);
    keyLight.position.set(2, 2, 5);
    scene.add(keyLight);

    const rimLight = new THREE.SpotLight(0x4a90e2, 2.0); // Jean Blue Rim
    rimLight.position.set(-2, 3, -2);
    rimLight.lookAt(0, 0, 0);
    scene.add(rimLight);

    // Load Frozen Model
    const loader = new GLTFLoader();
    loader.load(
      '/models/jean_v1_frozen.glb',
      (gltf) => {
        const model = gltf.scene;
        modelRef.current = model;
        
        // Contract Compliance: Default Scale [1,1,1], Facing Positive Z
        // Adjusting slightly for camera framing if needed, but keeping close to contract.
        model.position.y = -1.5; // Center head in frame
        
        scene.add(model);
        console.log('[Jean Presence View] Frozen Model Loaded.');
      },
      undefined,
      (error) => {
        console.error('[Jean Presence View] Error loading model:', error);
      }
    );

    // Animation Loop
    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate);
      
      if (modelRef.current) {
        // Idle Float / Breath
        const time = Date.now() * 0.001;
        modelRef.current.position.y = -1.5 + Math.sin(time * 0.5) * 0.02;
        modelRef.current.rotation.y = Math.sin(time * 0.2) * 0.05; // Very subtle look around

        // Presence State Reactivity (Visual cues only)
        if (presenceState === JeanPresenceState.OBSERVING) {
           modelRef.current.rotation.y = Math.sin(time * 1.0) * 0.1; // Faster look
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(frameIdRef.current);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [presenceState]); // Re-run if state changes significantly? No, state is handled in loop.

  // Handle Resize
  useEffect(() => {
      const handleResize = () => {
          if (!mountRef.current || !cameraRef.current || !rendererRef.current) return;
          const width = mountRef.current.clientWidth;
          const height = mountRef.current.clientHeight;
          cameraRef.current.aspect = width / height;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(width, height);
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div 
      ref={mountRef} 
      className={`w-full h-full min-h-[400px] flex items-center justify-center transition-opacity duration-1000 ${className}`}
      aria-label={`Jean Presence: ${presenceState}`}
    />
  );
};
