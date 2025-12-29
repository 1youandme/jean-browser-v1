import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { AnimationMixer, Clock, Vector2, Raycaster } from 'three';
import { 
  MessageSquare, 
  Smile, 
  Frown, 
  Meh, 
  Heart, 
  Zap, 
  Eye, 
  EyeOff, 
  Volume2, 
  VolumeX 
} from 'lucide-react';

// Types
interface Jean3DModelProps {
  modelPath?: string;
  isSpeaking?: boolean;
  audioLevel?: number;
  emotion?: 'neutral' | 'happy' | 'sad' | 'thinking' | 'excited' | 'angry';
  isVisible?: boolean;
  mouseTracking?: boolean;
  autoRotate?: boolean;
  scale?: number;
  position?: [number, number, number];
  onModelLoaded?: () => void;
  onAnimationComplete?: () => void;
}

interface FacialExpression {
  name: string;
  blendShapes: { [key: string]: number };
  duration: number;
}

interface LipSyncData {
  visemes: Array<{
    viseme: number;
    weight: number;
    duration: number;
  }>;
}

// Mock facial expressions (would be configured based on actual model)
const FACIAL_EXPRESSIONS: { [key: string]: FacialExpression } = {
  neutral: {
    name: 'neutral',
    blendShapes: {
      'mouthSmile': 0,
      'mouthFrown': 0,
      'eyeBlinkLeft': 0,
      'eyeBlinkRight': 0,
      'browDownLeft': 0,
      'browDownRight': 0,
      'jawOpen': 0
    },
    duration: 500
  },
  happy: {
    name: 'happy',
    blendShapes: {
      'mouthSmile': 0.8,
      'mouthFrown': 0,
      'eyeBlinkLeft': 0.1,
      'eyeBlinkRight': 0.1,
      'browDownLeft': -0.3,
      'browDownRight': -0.3,
      'jawOpen': 0.2
    },
    duration: 1000
  },
  sad: {
    name: 'sad',
    blendShapes: {
      'mouthSmile': 0,
      'mouthFrown': 0.6,
      'eyeBlinkLeft': 0.3,
      'eyeBlinkRight': 0.3,
      'browDownLeft': 0.5,
      'browDownRight': 0.5,
      'jawOpen': 0
    },
    duration: 800
  },
  thinking: {
    name: 'thinking',
    blendShapes: {
      'mouthSmile': 0.1,
      'mouthFrown': 0.2,
      'eyeBlinkLeft': 0.5,
      'eyeBlinkRight': 0.5,
      'browDownLeft': 0.3,
      'browDownRight': 0.3,
      'jawOpen': 0.1
    },
    duration: 600
  },
  excited: {
    name: 'excited',
    blendShapes: {
      'mouthSmile': 1.0,
      'mouthFrown': 0,
      'eyeBlinkLeft': 0.1,
      'eyeBlinkRight': 0.1,
      'browDownLeft': -0.5,
      'browDownRight': -0.5,
      'jawOpen': 0.4
    },
    duration: 1200
  },
  angry: {
    name: 'angry',
    blendShapes: {
      'mouthSmile': 0,
      'mouthFrown': 0.8,
      'eyeBlinkLeft': 0.2,
      'eyeBlinkRight': 0.2,
      'browDownLeft': 0.8,
      'browDownRight': 0.8,
      'jawOpen': 0.3
    },
    duration: 700
  }
};

// Main Component
export const Jean3DModel: React.FC<Jean3DModelProps> = ({
  modelPath = '/models/jean-character.glb',
  isSpeaking = false,
  audioLevel = 0,
  emotion = 'neutral',
  isVisible = true,
  mouseTracking = true,
  autoRotate = false,
  scale = 1.0,
  position = [0, 0, 0],
  onModelLoaded,
  onAnimationComplete
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const mixerRef = useRef<AnimationMixer | null>(null);
  const clockRef = useRef<Clock>(new Clock());
  const controlsRef = useRef<OrbitControls | null>(null);
  const frameRef = useRef<number>();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentEmotion, setCurrentEmotion] = useState(emotion);
  const [isModelVisible, setIsModelVisible] = useState(isVisible);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Initialize Three.js scene
  const initScene = useCallback(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 1.6, 3);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true 
    });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls setup
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 1;
    controls.maxDistance = 10;
    controls.maxPolarAngle = Math.PI;
    controlsRef.current = controls;

    // Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7.5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-5, 5, -5);
    scene.add(fillLight);

    // Add a simple floor for better lighting visualization
    const floorGeometry = new THREE.PlaneGeometry(10, 10);
    const floorMaterial = new THREE.ShadowMaterial({ opacity: 0.3 });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1;
    floor.receiveShadow = true;
    scene.add(floor);
  }, []);

  // Load 3D model
  const loadModel = useCallback(() => {
    if (!sceneRef.current) return;

    const loader = new GLTFLoader();
    
    // Create a simple placeholder geometry if model fails to load
    const createPlaceholderModel = () => {
      const group = new THREE.Group();
      
      // Head
      const headGeometry = new THREE.SphereGeometry(0.5, 32, 32);
      const headMaterial = new THREE.MeshPhongMaterial({ color: 0xffdbac });
      const head = new THREE.Mesh(headGeometry, headMaterial);
      head.position.set(0, 1.5, 0);
      head.castShadow = true;
      group.add(head);

      // Body
      const bodyGeometry = new THREE.CylinderGeometry(0.4, 0.6, 1.2, 32);
      const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x4169e1 });
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.set(0, 0.5, 0);
      body.castShadow = true;
      group.add(body);

      // Eyes
      const eyeGeometry = new THREE.SphereGeometry(0.1, 16, 16);
      const eyeMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
      
      const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
      leftEye.position.set(-0.15, 1.6, 0.4);
      group.add(leftEye);

      const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
      rightEye.position.set(0.15, 1.6, 0.4);
      group.add(rightEye);

      // Simple smile
      const smileGeometry = new THREE.TorusGeometry(0.15, 0.02, 8, 16, Math.PI);
      const smileMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
      const smile = new THREE.Mesh(smileGeometry, smileMaterial);
      smile.position.set(0, 1.3, 0.45);
      smile.rotation.z = Math.PI;
      group.add(smile);

      group.scale.set(scale, scale, scale);
      group.position.set(...position);
      
      return group;
    };

    loader.load(
      modelPath,
      (gltf) => {
        const model = gltf.scene;
        model.scale.set(scale, scale, scale);
        model.position.set(...position);
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        modelRef.current = model;
        sceneRef.current.add(model);

        // Setup animations
        if (gltf.animations.length > 0) {
          mixerRef.current = new AnimationMixer(model);
          gltf.animations.forEach((clip) => {
            mixerRef.current?.clipAction(clip).play();
          });
        }

        setIsLoading(false);
        if (onModelLoaded) onModelLoaded();
      },
      (progress) => {
        // Loading progress
        const percent = (progress.loaded / progress.total) * 100;
        console.log(`Loading model: ${percent}%`);
      },
      (error) => {
        console.error('Error loading 3D model:', error);
        console.log('Using placeholder model instead');
        
        // Fallback to placeholder model
        const placeholderModel = createPlaceholderModel();
        modelRef.current = placeholderModel;
        sceneRef.current.add(placeholderModel);
        
        setIsLoading(false);
        setError(null);
        if (onModelLoaded) onModelLoaded();
      }
    );
  }, [modelPath, scale, position, onModelLoaded]);

  // Handle mouse tracking
  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!mouseTracking || !mountRef.current) return;

    const rect = mountRef.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    setMousePosition({ x, y });

    // Update model head rotation to follow mouse
    if (modelRef.current) {
      const headBone = modelRef.current.getObjectByName('Head') || modelRef.current;
      if (headBone) {
        headBone.rotation.y = x * 0.3;
        headBone.rotation.x = y * 0.2;
      }
    }
  }, [mouseTracking]);

  // Apply facial expression
  const applyFacialExpression = useCallback((expression: FacialExpression) => {
    if (!modelRef.current) return;

    // This would need to be implemented based on the actual model's blend shapes
    // For now, we'll simulate with basic transformations
    const head = modelRef.current.getObjectByName('Head') || modelRef.current;
    if (head) {
      // Simple expression simulation
      switch (expression.name) {
        case 'happy':
          head.rotation.z = 0.1;
          break;
        case 'sad':
          head.rotation.z = -0.1;
          head.position.y = 1.4;
          break;
        case 'thinking':
          head.rotation.x = 0.1;
          break;
        case 'excited':
          head.position.y = 1.6;
          break;
        default:
          head.rotation.z = 0;
          head.position.y = 1.5;
      }
    }
  }, []);

  // Lip sync animation
  const updateLipSync = useCallback((audioLevel: number) => {
    if (!modelRef.current || !isSpeaking) return;

    const jaw = modelRef.current.getObjectByName('Jaw') || modelRef.current;
    if (jaw) {
      const jawOpen = Math.min(audioLevel * 0.3, 0.5);
      jaw.rotation.x = jawOpen;
    }
  }, [isSpeaking]);

  // Animation loop
  const animate = useCallback(() => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;

    frameRef.current = requestAnimationFrame(animate);

    const delta = clockRef.current.getDelta();

    // Update animation mixer
    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }

    // Update controls
    if (controlsRef.current) {
      controlsRef.current.update();
    }

    // Auto rotate if enabled
    if (autoRotate && modelRef.current) {
      modelRef.current.rotation.y += 0.01;
    }

    // Update lip sync
    updateLipSync(audioLevel);

    rendererRef.current.render(sceneRef.current, cameraRef.current);
  }, [autoRotate, audioLevel, updateLipSync]);

  // Handle window resize
  const handleResize = useCallback(() => {
    if (!mountRef.current || !cameraRef.current || !rendererRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    cameraRef.current.aspect = width / height;
    cameraRef.current.updateProjectionMatrix();
    rendererRef.current.setSize(width, height);
  }, []);

  // Initialize and setup
  useEffect(() => {
    initScene();
    loadModel();

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      
      if (rendererRef.current && mountRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, [initScene, loadModel, handleResize, handleMouseMove]);

  // Start animation loop
  useEffect(() => {
    animate();
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [animate]);

  // Update emotion
  useEffect(() => {
    if (emotion !== currentEmotion) {
      setCurrentEmotion(emotion);
      applyFacialExpression(FACIAL_EXPRESSIONS[emotion]);
    }
  }, [emotion, currentEmotion, applyFacialExpression]);

  // Update visibility
  useEffect(() => {
    setIsModelVisible(isVisible);
    if (modelRef.current) {
      modelRef.current.visible = isVisible;
    }
  }, [isVisible]);

  return (
    <div className="relative w-full h-full">
      {/* 3D Model Container */}
      <div
        ref={mountRef}
        className={`w-full h-full transition-opacity duration-500 ${
          isModelVisible ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading Jean 3D Model...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={loadModel}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Controls Overlay */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 space-y-3">
        <div className="text-sm font-medium text-gray-900 mb-2">Jean Controls</div>
        
        {/* Emotion Selector */}
        <div className="space-y-2">
          <div className="text-xs text-gray-600">Emotion</div>
          <div className="grid grid-cols-3 gap-1">
            {Object.keys(FACIAL_EXPRESSIONS).map((emo) => (
              <button
                key={emo}
                onClick={() => setCurrentEmotion(emo as any)}
                className={`p-2 text-xs rounded ${
                  currentEmotion === emo 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {emo === 'neutral' && <Meh className="w-3 h-3 mx-auto" />}
                {emo === 'happy' && <Smile className="w-3 h-3 mx-auto" />}
                {emo === 'sad' && <Frown className="w-3 h-3 mx-auto" />}
                {emo === 'thinking' && <MessageSquare className="w-3 h-3 mx-auto" />}
                {emo === 'excited' && <Zap className="w-3 h-3 mx-auto" />}
                {emo === 'angry' && <MessageSquare className="w-3 h-3 mx-auto" />}
              </button>
            ))}
          </div>
        </div>

        {/* Toggle Controls */}
        <div className="space-y-2">
          <div className="text-xs text-gray-600">Options</div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsModelVisible(!isModelVisible)}
              className="p-2 text-xs bg-gray-100 hover:bg-gray-200 rounded flex items-center space-x-1"
            >
              {isModelVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              <span>{isModelVisible ? 'Hide' : 'Show'}</span>
            </button>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              className={`p-2 text-xs rounded flex items-center space-x-1 ${
                mouseTracking ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <MessageSquare className="w-3 h-3" />
              <span>Mouse Track</span>
            </button>
          </div>
        </div>

        {/* Speaking Indicator */}
        {isSpeaking && (
          <div className="flex items-center space-x-2 text-green-600">
            <Volume2 className="w-4 h-4 animate-pulse" />
            <span className="text-xs">Speaking</span>
          </div>
        )}

        {/* Audio Level Indicator */}
        {isSpeaking && (
          <div className="space-y-1">
            <div className="text-xs text-gray-600">Audio Level</div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-100"
                style={{ width: `${audioLevel * 100}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg px-3 py-2">
        <div className="flex items-center space-x-3 text-xs">
          <span className={`px-2 py-1 rounded-full ${
            isLoading ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
          }`}>
            {isLoading ? 'Loading' : 'Ready'}
          </span>
          <span className="text-gray-600">
            Emotion: <span className="font-medium">{currentEmotion}</span>
          </span>
          {mouseTracking && (
            <span className="text-gray-600">
              Mouse: <span className="font-medium">
                ({mousePosition.x.toFixed(2)}, {mousePosition.y.toFixed(2)})
              </span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default Jean3DModel;