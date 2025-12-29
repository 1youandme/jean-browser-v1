import { useState, useEffect, useCallback } from 'react';

export enum AvatarState {
  IDLE = 'idle',
  LISTENING = 'listening',
  PROCESSING = 'processing',
  SPEAKING = 'speaking',
  ERROR = 'error',
  THINKING = 'thinking'
}

export enum AvatarMood {
  NEUTRAL = 'neutral',
  HAPPY = 'happy',
  CONCERNED = 'concerned',
  EXCITED = 'excited',
  CONFUSED = 'confused',
  FOCUSED = 'focused',
  FRIENDLY = 'friendly'
}

export interface VisemeEvent {
  viseme: number;
  timestamp: number;
  duration: number;
  confidence?: number;
}

export interface PhonemeEvent {
  phoneme: string;
  timestamp: number;
  duration: number;
  stress?: number;
}

export interface AvatarConfig {
  modelId: string;
  voiceId: string;
  language: string;
  speakingRate: number;
  pitch: number;
  volume: number;
  emotionIntensity: number;
  lipSyncSensitivity: number;
}

export interface AvatarStateConfig {
  state: AvatarState;
  mood: AvatarMood;
  config: AvatarConfig;
  isListening: boolean;
  isSpeaking: boolean;
  volumeLevel: number;
  batteryLevel: number;
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
  lastActivity: Date;
}

interface JeanAvatarStateHook {
  // State
  avatarState: AvatarStateConfig;
  
  // Actions
  setState: (state: AvatarState) => void;
  setMood: (mood: AvatarMood) => void;
  startListening: () => void;
  stopListening: () => void;
  startSpeaking: () => void;
  stopSpeaking: () => void;
  
  // Lip-sync integration
  onVisemeStream: (visemes: VisemeEvent[]) => void;
  onPhonemeStream: (phonemes: PhonemeEvent[]) => void;
  
  // Configuration
  updateConfig: (config: Partial<AvatarConfig>) => void;
  
  // Status
  isActive: boolean;
  canListen: boolean;
  canSpeak: boolean;
  
  // Cleanup
  cleanup: () => void;
}

export const useJeanAvatarState = (
  initialConfig?: Partial<AvatarConfig>
): JeanAvatarStateHook => {
  const [avatarState, setAvatarState] = useState<AvatarStateConfig>({
    state: AvatarState.IDLE,
    mood: AvatarMood.NEUTRAL,
    config: {
      modelId: 'default-3d-avatar',
      voiceId: 'default-voice',
      language: 'en',
      speakingRate: 1.0,
      pitch: 1.0,
      volume: 0.8,
      emotionIntensity: 0.7,
      lipSyncSensitivity: 0.8,
      ...initialConfig
    },
    isListening: false,
    isSpeaking: false,
    volumeLevel: 0.8,
    batteryLevel: 100,
    connectionStatus: 'connected',
    lastActivity: new Date()
  });

  // State management functions
  const setState = useCallback((newState: AvatarState) => {
    setAvatarState(prev => ({
      ...prev,
      state: newState,
      lastActivity: new Date()
    }));

    // Auto-mood adjustment based on state
    switch (newState) {
      case AvatarState.LISTENING:
        setMood(AvatarMood.FOCUSED);
        break;
      case AvatarState.SPEAKING:
        setMood(AvatarMood.FRIENDLY);
        break;
      case AvatarState.PROCESSING:
        setMood(AvatarMood.FOCUSED);
        break;
      case AvatarState.ERROR:
        setMood(AvatarMood.CONCERNED);
        break;
      case AvatarState.THINKING:
        setMood(AvatarMood.FOCUSED);
        break;
      default:
        setMood(AvatarMood.NEUTRAL);
    }
  }, []);

  const setMood = useCallback((newMood: AvatarMood) => {
    setAvatarState(prev => ({
      ...prev,
      mood: newMood,
      lastActivity: new Date()
    }));
  }, []);

  const startListening = useCallback(() => {
    setState(AvatarState.LISTENING);
    setAvatarState(prev => ({
      ...prev,
      isListening: true,
      lastActivity: new Date()
    }));
  }, [setState]);

  const stopListening = useCallback(() => {
    setAvatarState(prev => ({
      ...prev,
      isListening: false,
      lastActivity: new Date()
    }));
    
    // Return to idle after a brief moment
    setTimeout(() => setState(AvatarState.IDLE), 500);
  }, [setState]);

  const startSpeaking = useCallback(() => {
    setState(AvatarState.SPEAKING);
    setAvatarState(prev => ({
      ...prev,
      isSpeaking: true,
      lastActivity: new Date()
    }));
  }, [setState]);

  const stopSpeaking = useCallback(() => {
    setAvatarState(prev => ({
      ...prev,
      isSpeaking: false,
      lastActivity: new Date()
    }));
    
    // Return to idle after a brief moment
    setTimeout(() => setState(AvatarState.IDLE), 500);
  }, [setState]);

  // Lip-sync integration
  const onVisemeStream = useCallback((visemes: VisemeEvent[]) => {
    if (avatarState.state !== AvatarState.SPEAKING) {
      startSpeaking();
    }

    // Process viseme stream
    visemes.forEach(viseme => {
      console.log('Viseme event:', viseme);
      // Here you would trigger the avatar's lip-sync animation
      // based on the viseme data
    });

    // Auto-stop speaking when viseme stream ends
    const lastViseme = visemes[visemes.length - 1];
    if (lastViseme) {
      const endTime = lastViseme.timestamp + lastViseme.duration;
      const timeUntilEnd = endTime - Date.now();
      if (timeUntilEnd > 0) {
        setTimeout(() => stopSpeaking(), timeUntilEnd + 100);
      } else {
        stopSpeaking();
      }
    }
  }, [avatarState.state, startSpeaking, stopSpeaking]);

  const onPhonemeStream = useCallback((phonemes: PhonemeEvent[]) => {
    if (avatarState.state !== AvatarState.SPEAKING) {
      startSpeaking();
    }

    // Process phoneme stream for more detailed lip-sync
    phonemes.forEach(phoneme => {
      console.log('Phoneme event:', phoneme);
      // Here you would trigger more granular facial animations
      // based on phoneme data
    });

    // Auto-stop speaking when phoneme stream ends
    const lastPhoneme = phonemes[phonemes.length - 1];
    if (lastPhoneme) {
      const endTime = lastPhoneme.timestamp + lastPhoneme.duration;
      const timeUntilEnd = endTime - Date.now();
      if (timeUntilEnd > 0) {
        setTimeout(() => stopSpeaking(), timeUntilEnd + 100);
      } else {
        stopSpeaking();
      }
    }
  }, [avatarState.state, startSpeaking, stopSpeaking]);

  // Configuration management
  const updateConfig = useCallback((configUpdate: Partial<AvatarConfig>) => {
    setAvatarState(prev => ({
      ...prev,
      config: { ...prev.config, ...configUpdate },
      lastActivity: new Date()
    }));
  }, []);

  // Status checks
  const isActive = avatarState.state !== AvatarState.IDLE;
  const canListen = !avatarState.isListening && !avatarState.isSpeaking;
  const canSpeak = !avatarState.isSpeaking;

  // Cleanup
  const cleanup = useCallback(() => {
    setState(AvatarState.IDLE);
    setMood(AvatarMood.NEUTRAL);
    setAvatarState(prev => ({
      ...prev,
      isListening: false,
      isSpeaking: false,
      lastActivity: new Date()
    }));
  }, [setState, setMood]);

  // Auto-idle timeout
  useEffect(() => {
    const idleTimeout = setTimeout(() => {
      const timeSinceLastActivity = Date.now() - avatarState.lastActivity.getTime();
      if (timeSinceLastActivity > 30000 && avatarState.state !== AvatarState.IDLE) { // 30 seconds
        setState(AvatarState.IDLE);
        setMood(AvatarMood.NEUTRAL);
      }
    }, 31000);

    return () => clearTimeout(idleTimeout);
  }, [avatarState.lastActivity, avatarState.state, setState, setMood]);

  // Connection status monitoring
  useEffect(() => {
    const checkConnection = () => {
      // Simulate connection checking
      setAvatarState(prev => ({
        ...prev,
        connectionStatus: Math.random() > 0.95 ? 'disconnected' : 'connected'
      }));
    };

    const interval = setInterval(checkConnection, 5000);
    return () => clearInterval(interval);
  }, []);

  // Battery level simulation
  useEffect(() => {
    const batteryInterval = setInterval(() => {
      setAvatarState(prev => ({
        ...prev,
        batteryLevel: Math.max(0, prev.batteryLevel - 0.1)
      }));
    }, 60000); // Decrease battery every minute

    return () => clearInterval(batteryInterval);
  }, []);

  return {
    avatarState,
    setState,
    setMood,
    startListening,
    stopListening,
    startSpeaking,
    stopSpeaking,
    onVisemeStream,
    onPhonemeStream,
    updateConfig,
    isActive,
    canListen,
    canSpeak,
    cleanup
  };
};

// Helper functions for avatar animation
export const getAvatarAnimationClass = (state: AvatarState, mood: AvatarMood): string => {
  const stateClasses = {
    [AvatarState.IDLE]: 'avatar-idle',
    [AvatarState.LISTENING]: 'avatar-listening',
    [AvatarState.PROCESSING]: 'avatar-processing',
    [AvatarState.SPEAKING]: 'avatar-speaking',
    [AvatarState.ERROR]: 'avatar-error',
    [AvatarState.THINKING]: 'avatar-thinking'
  };

  const moodModifiers = {
    [AvatarMood.NEUTRAL]: '',
    [AvatarMood.HAPPY]: ' mood-happy',
    [AvatarMood.CONCERNED]: ' mood-concerned',
    [AvatarMood.EXCITED]: ' mood-excited',
    [AvatarMood.CONFUSED]: ' mood-confused',
    [AvatarMood.FOCUSED]: ' mood-focused',
    [AvatarMood.FRIENDLY]: ' mood-friendly'
  };

  return stateClasses[state] + moodModifiers[mood];
};

// Viseme to mouth shape mapping for 3D avatars
export const visemeToMouthShape = (viseme: number): string => {
  const mouthShapes = [
    'rest',           // 0
    'aa',             // 1
    'E',              // 2
    'I',              // 3
    'O',              // 4
    'U',              // 5
    'FV',             // 6
    'L',              // 7
    'Th',             // 8
    'R',              // 9
    'WQ',             // 10
    'a',              // 11
    'ChShJ',          // 12
    'sz',             // 13
    'DhG',            // 14
    'KGT',            // 15
    'MPB',            // 16
    'N',              // 17
    'NG',             // 18
    'SIL',            // 19 (silence)
  ];

  return mouthShapes[viseme] || 'rest';
};

// Phoneme to mouth shape mapping (more detailed)
export const phonemeToMouthShape = (phoneme: string): string => {
  const phonemeMap: { [key: string]: string } = {
    'AA': 'aa', 'AE': 'aa', 'AH': 'aa', 'AO': 'O',
    'AW': 'WQ', 'AY': 'I', 'B': 'MPB', 'CH': 'ChShJ',
    'D': 'Th', 'DH': 'Th', 'EH': 'E', 'ER': 'R',
    'EY': 'E', 'F': 'FV', 'G': 'KGT', 'HH': 'rest',
    'IH': 'I', 'IY': 'I', 'JH': 'ChShJ', 'K': 'KGT',
    'L': 'L', 'M': 'MPB', 'N': 'N', 'NG': 'NG',
    'OW': 'O', 'OY': 'O', 'P': 'MPB', 'R': 'R',
    'S': 'sz', 'SH': 'ChShJ', 'T': 'Th', 'TH': 'Th',
    'UH': 'U', 'UW': 'U', 'V': 'FV', 'W': 'WQ',
    'Y': 'I', 'Z': 'sz', 'ZH': 'ChShJ', 'SIL': 'SIL'
  };

  return phonemeMap[phoneme.toUpperCase()] || 'rest';
};

export default useJeanAvatarState;