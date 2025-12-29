import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { JeanPresenceState } from '../jean-runtime/state/JeanPresenceStateMachine';

interface JeanAvatar3DProps {
  isActive?: boolean;
  onChatMessage?: (message: string) => void;
  className?: string;
  hideUI?: boolean;
  fill?: boolean;
  presenceState?: JeanPresenceState;
}

export const JeanAvatar3D: React.FC<JeanAvatar3DProps> = ({ 
  isActive = false, 
  onChatMessage,
  className = "",
  hideUI = false,
  fill = false,
  presenceState = JeanPresenceState.IDLE
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const frameRef = useRef<number>(0);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [emotionMap, setEmotionMap] = useState<any | null>(null);
  const [currentExpression, setCurrentExpression] = useState<string>('neutral');
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const phonemeMapRef = useRef<any | null>(null);
  const [jawLevel, setJawLevel] = useState(0);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup with Arabic support
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.z = 5;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: true,
      powerPreference: "high-performance"
    });
    const initialRect = mountRef.current.getBoundingClientRect();
    renderer.setSize(initialRect.width || 300, initialRect.height || 300);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    mountRef.current.appendChild(renderer.domElement);

    // Enhanced lighting setup for Jean's appearance
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 0.9);
    mainLight.position.set(5, 8, 5);
    mainLight.castShadow = true;
    mainLight.shadow.camera.near = 0.1;
    mainLight.shadow.camera.far = 50;
    mainLight.shadow.camera.left = -10;
    mainLight.shadow.camera.right = 10;
    mainLight.shadow.camera.top = 10;
    mainLight.shadow.camera.bottom = -10;
    scene.add(mainLight);

    // Jean's characteristic blue glow
    const jeanGlow = new THREE.PointLight(0x4a90e2, 0.8, 100);
    jeanGlow.position.set(-3, 2, 3);
    scene.add(jeanGlow);

    // Active state green glow
    const activeGlow = new THREE.PointLight(0x00ff88, isActive ? 0.6 : 0.2, 100);
    activeGlow.position.set(3, 2, 3);
    scene.add(activeGlow);

    const tryLoad = (paths: string[]) => {
      const loader = new GLTFLoader();
      const attempt = (i: number) => {
        loader.load(
          paths[i],
          (gltf) => {
            const model = gltf.scene;
            model.scale.setScalar(1.2);
            model.position.y = -0.8;
            model.rotation.y = Math.PI * 0.9;
            model.traverse((child) => {
              if (child instanceof THREE.Mesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                if (child.material) {
                  const material = child.material as THREE.MeshStandardMaterial;
                  material.color = new THREE.Color(0x2c3e50);
                  material.metalness = 0.3;
                  material.roughness = 0.4;
                  material.emissive = new THREE.Color(0x1a5490);
                  material.emissiveIntensity = isActive ? 0.15 : 0.05;
                }
              }
            });
            const crownGeometry = new THREE.TorusGeometry(1.3, 0.08, 8, 32);
            const crownMaterial = new THREE.MeshPhongMaterial({
              color: 0x4a90e2,
              emissive: 0x1a5490,
              emissiveIntensity: isActive ? 0.8 : 0.3,
              shininess: 100
            });
            const crown = new THREE.Mesh(crownGeometry, crownMaterial);
            crown.position.y = 1.2;
            crown.rotation.x = Math.PI / 4;
            model.add(crown);
            modelRef.current = model;
            scene.add(model);
            setIsModelLoaded(true);
          },
          () => {},
          (error) => {
            if (i + 1 < paths.length) attempt(i + 1);
            else createJeanFallback(scene);
          }
        );
      };
      attempt(0);
    };
    tryLoad(['/models/jean_final.glb', '/models/jean_rigged.glb', '/models/jean_v1_frozen.glb']);

    const createJeanFallback = (scene: THREE.Scene) => {
      const group = new THREE.Group();
      
      // Jean's head
      const headGeometry = new THREE.SphereGeometry(1.5, 32, 32);
      const headMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x2c3e50,
        emissive: 0x1a5490,
        emissiveIntensity: 0.1,
        shininess: 80
      });
      const head = new THREE.Mesh(headGeometry, headMaterial);
      group.add(head);
      
      // Jean's tech crown
      const crownGeometry = new THREE.TorusGeometry(1.6, 0.1, 8, 32);
      const crownMaterial = new THREE.MeshPhongMaterial({
        color: 0x4a90e2,
        emissive: 0x1a5490,
        emissiveIntensity: 0.6
      });
      const crown = new THREE.Mesh(crownGeometry, crownMaterial);
      crown.position.y = 1.4;
      crown.rotation.x = Math.PI / 4;
      group.add(crown);
      
      modelRef.current = group;
      scene.add(group);
      setIsModelLoaded(true);
    };

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!mountRef.current || !renderer || !cameraRef.current) return;
      const r = mountRef.current.getBoundingClientRect();
      renderer.setSize(r.width, r.height);
      cameraRef.current.aspect = r.width / r.height;
      cameraRef.current.updateProjectionMatrix();
    };
    window.addEventListener('resize', handleResize);
    // No emotion/audio pipelines attached

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      if (audioCtxRef.current) audioCtxRef.current.close().catch(() => {});
    };
  }, [isActive, isModelLoaded]);

  const handleClick = () => {
    if (modelRef.current) {
      const originalScale = 1.2;
      modelRef.current.scale.setScalar(originalScale * 1.05);
      setTimeout(() => {
        if (modelRef.current) modelRef.current.scale.setScalar(originalScale);
      }, 120);
    }
  };

  return (
    <div className={`relative ${className} jean-avatar ${isActive ? 'active' : ''}`}>
      <div 
        ref={mountRef}
        onClick={hideUI ? undefined : handleClick}
        onKeyDown={hideUI ? undefined : (e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); }}
        onMouseEnter={hideUI ? undefined : () => {}}
        tabIndex={hideUI ? -1 : 0}
        className={`${hideUI ? '' : 'cursor-pointer transition-all duration-500 rounded-2xl overflow-hidden border-2 '}${hideUI ? '' : (isActive ? 'shadow-2xl shadow-blue-500/60 border-blue-400' : 'shadow-lg shadow-gray-800/30 border-gray-600')}`}
        style={{
          width: fill ? '100vw' : '300px',
          height: fill ? '100vh' : '300px',
          background: hideUI ? 'transparent' : (isActive 
            ? 'radial-gradient(circle at center, rgba(74,144,226,0.15) 0%, rgba(0,255,136,0.05) 40%, transparent 70%)'
            : 'radial-gradient(circle at center, rgba(44,62,80,0.1) 0%, transparent 60%)'),
          cursor: hideUI ? 'none' : undefined
        }}
      />
      
      {hideUI ? null : (
        <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold transition-all duration-300 ${
          isActive 
            ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/50' 
            : 'bg-gradient-to-r from-gray-600 to-gray-700 text-gray-200'
        }`}>
          {isActive ? 'واجهة استشارية' : 'بانتظار أمرك'}
        </div>
      )}
      
      {hideUI || isModelLoaded ? null : (
        <div className="absolute inset-0 flex items-center justify-center bg-transparent"></div>
      )}
      
      {hideUI ? null : (
        <div className="absolute bottom-4 left-4 right-4 text-center">
          <p className="text-xs text-gray-400 opacity-75 hover:opacity-100 transition-opacity">
            {isActive ? 'انقر لفتح اللوحة الاستشارية' : 'انقر لتفعيل الواجهة'}
          </p>
        </div>
      )}
    </div>
  );
};
