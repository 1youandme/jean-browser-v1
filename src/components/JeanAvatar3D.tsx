import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

interface JeanAvatar3DProps {
  isActive?: boolean;
  onChatMessage?: (message: string) => void;
  className?: string;
}

export const JeanAvatar3D: React.FC<JeanAvatar3DProps> = ({ 
  isActive = false, 
  onChatMessage,
  className = ""
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const frameRef = useRef<number>(0);
  const [isModelLoaded, setIsModelLoaded] = useState(false);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup with Arabic support
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.z = 5;
    cameraRef.current = camera;

    // Renderer setup with enhanced quality
    const renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(300, 300);
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

    // Load and enhance GLB model as Jean
    const loader = new GLTFLoader();
    loader.load(
      '/human head 3d model.glb',
      (gltf) => {
        const model = gltf.scene;
        
        // Optimize model for Jean character
        model.scale.setScalar(1.2);
        model.position.y = -0.8;
        model.rotation.y = Math.PI * 0.9; // Slight angle for better view
        
        // Enhanced materials with Jean's colors
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            
            // Jean's characteristic blue-tinted materials
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
        
        // Add Jean's distinctive features
        // Tech crown/circuit
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
        
        // Glowing eyes (Jean's signature)
        const eyeGeometry = new THREE.SphereGeometry(0.12, 16, 16);
        const eyeMaterial = new THREE.MeshPhongMaterial({
          color: isActive ? 0x00ff88 : 0x4a90e2,
          emissive: isActive ? 0x00ff88 : 0x1a5490,
          emissiveIntensity: isActive ? 1.0 : 0.5
        });
        
        // Left eye
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.35, 0.15, 1.1);
        model.add(leftEye);
        
        // Right eye
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.35, 0.15, 1.1);
        model.add(rightEye);
        
        modelRef.current = model;
        scene.add(model);
        setIsModelLoaded(true);
      },
      (progress) => {
        console.log('تحميل Jean:', (progress.loaded / progress.total * 100) + '%');
      },
      (error) => {
        console.error('خطأ في تحميل Jean:', error);
        // Create Jean fallback
        createJeanFallback(scene);
      }
    );

    // Jean fallback model
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
      
      // Jean's glowing eyes
      const eyeGeometry = new THREE.SphereGeometry(0.15, 16, 16);
      const eyeMaterial = new THREE.MeshPhongMaterial({
        color: isActive ? 0x00ff88 : 0x4a90e2,
        emissive: isActive ? 0x00ff88 : 0x1a5490,
        emissiveIntensity: isActive ? 0.8 : 0.4
      });
      
      const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
      leftEye.position.set(-0.4, 0.2, 1.3);
      group.add(leftEye);
      
      const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
      rightEye.position.set(0.4, 0.2, 1.3);
      group.add(rightEye);
      
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

    // Enhanced animation
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      
      if (modelRef.current) {
        // Gentle floating animation
        modelRef.current.position.y = Math.sin(Date.now() * 0.0008) * 0.15 - 0.8;
        
        // Active state rotation
        if (isActive) {
          modelRef.current.rotation.y += 0.003;
        }
        
        // Breathing effect
        const breathingScale = 1 + Math.sin(Date.now() * 0.0015) * 0.025;
        modelRef.current.scale.setScalar(breathingScale * 1.2);
      }
      
      renderer.render(scene, camera);
    };

    animate();

    // Enhanced mouse tracking for Jean
    const handleMouseMove = (event: MouseEvent) => {
      if (!modelRef.current || !isModelLoaded) return;
      
      const rect = mountRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      // Jean follows user smoothly
      modelRef.current.rotation.x = y * 0.08;
      modelRef.current.rotation.z = x * 0.04;
      
      // Eye tracking effect
      if (isActive) {
        modelRef.current.rotation.y += x * 0.02;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [isActive, isModelLoaded]);

  // Jean's Arabic messages
  const handleClick = () => {
    if (onChatMessage) {
      const arabicMessages = [
        "مرحباً! أنا Jean، مساعدك الذكي في JeanTrail.",
        "كيف يمكنني مساعدتك في رحلتك الرقمية اليوم؟",
        "Jean جاهز لاستكشاف الويب معك!",
        "دعني أساعدك في العثور على ما تحتاجه.",
        "أنا هنا لجعل تجربتك أفضل!"
      ];
      const randomMessage = arabicMessages[Math.floor(Math.random() * arabicMessages.length)];
      onChatMessage(randomMessage);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div 
        ref={mountRef}
        onClick={handleClick}
        className={`cursor-pointer transition-all duration-500 rounded-2xl overflow-hidden border-2 ${
          isActive 
            ? 'shadow-2xl shadow-blue-500/60 border-blue-400' 
            : 'shadow-lg shadow-gray-800/30 border-gray-600'
        }`}
        style={{
          width: '300px',
          height: '300px',
          background: isActive 
            ? 'radial-gradient(circle at center, rgba(74,144,226,0.15) 0%, rgba(0,255,136,0.05) 40%, transparent 70%)'
            : 'radial-gradient(circle at center, rgba(44,62,80,0.1) 0%, transparent 60%)'
        }}
      />
      
      {/* Jean's status in Arabic */}
      <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold transition-all duration-300 ${
        isActive 
          ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/50' 
          : 'bg-gradient-to-r from-gray-600 to-gray-700 text-gray-200'
      }`}>
        {isActive ? 'Jean نشط 🔥' : 'Jean في الانتظار'}
      </div>
      
      {/* Loading indicator with Arabic */}
      {!isModelLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-900/80 to-purple-900/80">
          <div className="text-white text-center">
            <div className="mb-2">
              <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
            <div className="text-sm font-medium">تحميل Jean...</div>
          </div>
        </div>
      )}
      
      {/* Interactive hint */}
      <div className="absolute bottom-4 left-4 right-4 text-center">
        <p className="text-xs text-gray-400 opacity-75 hover:opacity-100 transition-opacity">
          {isActive ? 'انقر للتحدث مع Jean' : 'انقر لتفعيل Jean'}
        </p>
      </div>
    </div>
  );
};