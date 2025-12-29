import { useState, useEffect, useCallback, useRef } from 'react';
import { invoke } from '@tauri-apps/api/tauri';

export type AvatarState = 'idle' | 'listening' | 'speaking' | 'processing' | 'error';
export type AvatarMood = 'neutral' | 'happy' | 'concerned' | 'excited' | 'thoughtful' | 'confused';
export type AvatarAnimation = 'idle_breathing' | 'talking' | 'listening_blink' | 'thinking' | 'error_shake';

export interface JeanAvatarConfig {
  model_url: string;
  voice_id: string;
  animation_speed: number;
  auto_blink: boolean;
  responsiveness: number; // 0.0 to 1.0
  mood_sensitivity: number; // How much avatar responds to content mood
}

export interface PhonemeStream {
  phoneme: string;
  duration: number; // milliseconds
  intensity: number; // 0.0 to 1.0
  timestamp: number;
}

export interface VisemeData {
  viseme_id: number;
  phoneme: string;
  mouth_shape: string;
  duration: number;
  blend_shapes: Record<string, number>;
}

export interface JeanAvatarState {
  state: AvatarState;
  mood: AvatarMood;
  current_animation: AvatarAnimation;
  is_visible: boolean;
  phoneme_stream: PhonemeStream[];
  current_viseme: VisemeData | null;
  last_activity: Date;
  error_message?: string;
}

export interface JeanAvatarActions {
  setState: (state: AvatarState) => void;
  setMood: (mood: AvatarMood) => void;
  startListening: () => void;
  stopListening: () => void;
  startSpeaking: (text: string, options?: SpeakingOptions) => Promise<void>;
  stopSpeaking: () => void;
  showError: (message: string) => void;
  clearError: () => void;
  updateConfig: (config: Partial<JeanAvatarConfig>) => void;
  playAnimation: (animation: AvatarAnimation, duration?: number) => void;
  processPhonemeStream: (phonemes: PhonemeStream[]) => void;
}

export interface SpeakingOptions {
  voice_id?: string;
  speech_rate?: number;
  pitch?: number;
  volume?: number;
  emotion?: AvatarMood;
  show_visemes?: boolean;
}

const DEFAULT_CONFIG: JeanAvatarConfig = {
  model_url: '/models/jean_avatar.glb',
  voice_id: 'jean_default',
  animation_speed: 1.0,
  auto_blink: true,
  responsiveness: 0.8,
  mood_sensitivity: 0.6,
};

const PHONEME_TO_VISEME_MAP: Record<string, number> = {
  // English phonemes to viseme IDs
  'AA': 0, 'AE': 1, 'AH': 2, 'AO': 3, 'AW': 4,
  'AY': 5, 'B': 6, 'CH': 7, 'D': 8, 'DH': 9,
  'EH': 10, 'ER': 11, 'EY': 12, 'F': 13, 'G': 14,
  'HH': 15, 'IH': 16, 'IY': 17, 'JH': 18, 'K': 19,
  'L': 20, 'M': 21, 'N': 22, 'NG': 23, 'OW': 24,
  'OY': 25, 'P': 26, 'R': 27, 'S': 28, 'SH': 29,
  'T': 30, 'TH': 31, 'UH': 32, 'UW': 33, 'V': 34,
  'W': 35, 'Y': 36, 'Z': 37, 'ZH': 38,
  // Silence
  'SIL': 39,
};

const VISEME_BLEND_SHAPES: Record<number, Record<string, number>> = {
  0: { 'jawOpen': 0.3, 'mouthShape': 'AA' }, // AA
  1: { 'jawOpen': 0.4, 'mouthShape': 'AE' }, // AE
  2: { 'jawOpen': 0.2, 'mouthShape': 'AH' }, // AH
  3: { 'jawOpen': 0.3, 'lipsRound': 0.4, 'mouthShape': 'AO' }, // AO
  4: { 'jawOpen': 0.3, 'lipsRound': 0.2, 'mouthShape': 'AW' }, // AW
  5: { 'jawOpen': 0.2, 'mouthWide': 0.3, 'mouthShape': 'AY' }, // AY
  6: { 'lipsPressed': 0.8, 'mouthShape': 'B' }, // B
  7: { 'lipsPressed': 0.6, 'tongueTip': 0.4, 'mouthShape': 'CH' }, // CH
  8: { 'tongueTip': 0.6, 'mouthShape': 'D' }, // D
  9: { 'tongueTip': 0.4, 'teethVisible': 0.3, 'mouthShape': 'DH' }, // DH
  10: { 'jawOpen': 0.2, 'mouthWide': 0.2, 'mouthShape': 'EH' }, // EH
  11: { 'tongueBack': 0.6, 'lipsRound': 0.3, 'mouthShape': 'ER' }, // ER
  12: { 'jawOpen': 0.2, 'mouthWide': 0.3, 'mouthShape': 'EY' }, // EY
  13: { 'teethVisible': 0.8, 'lipsPressed': 0.2, 'mouthShape': 'F' }, // F
  14: { 'tongueBack': 0.4, 'mouthShape': 'G' }, // G
  15: { 'mouthOpen': 0.1, 'mouthShape': 'HH' }, // HH
  16: { 'jawOpen': 0.1, 'mouthWide': 0.2, 'mouthShape': 'IH' }, // IH
  17: { 'jawOpen': 0.1, 'lipsSpread': 0.4, 'mouthShape': 'IY' }, // IY
  18: { 'lipsPressed': 0.4, 'tongueTip': 0.4, 'mouthShape': 'JH' }, // JH
  19: { 'tongueBack': 0.6, 'mouthShape': 'K' }, // K
  20: { 'tongueTip': 0.8, 'mouthShape': 'L' }, // L
  21: { 'lipsPressed': 0.6, 'mouthClosed': 0.4, 'mouthShape': 'M' }, // M
  22: { 'tongueTip': 0.4, 'mouthShape': 'N' }, // N
  23: { 'tongueBack': 0.4, 'mouthClosed': 0.2, 'mouthShape': 'NG' }, // NG
  24: { 'lipsRound': 0.6, 'mouthShape': 'OW' }, // OW
  25: { 'lipsRound': 0.4, 'mouthWide': 0.2, 'mouthShape': 'OY' }, // OY
  26: { 'lipsPressed': 0.8, 'mouthShape': 'P' }, // P
  27: { 'lipsRound': 0.3, 'tongueBack': 0.2, 'mouthShape': 'R' }, // R
  28: { 'mouthOpen': 0.2, 'mouthShape': 'S' }, // S
  29: { 'mouthOpen': 0.2, 'lipsRound': 0.2, 'mouthShape': 'SH' }, // SH
  30: { 'tongueTip': 0.6, 'mouthShape': 'T' }, // T
  31: { 'tongueTip': 0.4, 'teethVisible': 0.6, 'mouthShape': 'TH' }, // TH
  32: { 'jawOpen': 0.1, 'mouthShape': 'UH' }, // UH
  33: { 'lipsRound': 0.8, 'mouthShape': 'UW' }, // UW
  34: { 'teethVisible': 0.8, 'lipsPressed': 0.3, 'mouthShape': 'V' }, // V
  35: { 'lipsRound': 0.6, 'mouthWide': 0.2, 'mouthShape': 'W' }, // W
  36: { 'lipsSpread': 0.4, 'mouthShape': 'Y' }, // Y
  37: { 'mouthOpen': 0.1, 'mouthShape': 'Z' }, // Z
  38: { 'mouthOpen': 0.2, 'lipsRound': 0.2, 'mouthShape': 'ZH' }, // ZH
  39: { 'mouthClosed': 1.0, 'mouthShape': 'SIL' }, // Silence
};

export const useJeanAvatar = (initialConfig?: Partial<JeanAvatarConfig>) => {
  const [config, setConfig] = useState<JeanAvatarConfig>({
    ...DEFAULT_CONFIG,
    ...initialConfig,
  });

  const [avatarState, setAvatarState] = useState<JeanAvatarState>({
    state: 'idle',
    mood: 'neutral',
    current_animation: 'idle_breathing',
    is_visible: true,
    phoneme_stream: [],
    current_viseme: null,
    last_activity: new Date(),
  });

  const isSpeakingRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const phonemeStreamRef = useRef<PhonemeStream[]>([]);

  // Initialize audio context
  useEffect(() => {
    if (typeof window !== 'undefined' && !audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }, []);

  // Auto-blink and idle animations
  useEffect(() => {
    if (!config.auto_blink || avatarState.state !== 'idle') return;

    const blinkInterval = setInterval(() => {
      // Random blink every 2-5 seconds
      if (Math.random() < 0.3) {
        playAnimation('listening_blink', 200);
      }
    }, 3000);

    return () => clearInterval(blinkInterval);
  }, [config.auto_blink, avatarState.state]);

  // Update last activity on state changes
  useEffect(() => {
    setAvatarState(prev => ({ ...prev, last_activity: new Date() }));
  }, [avatarState.state]);

  const setState = useCallback((newState: AvatarState) => {
    setAvatarState(prev => ({
      ...prev,
      state: newState,
      current_animation: getDefaultAnimationForState(newState),
    }));
  }, []);

  const setMood = useCallback((mood: AvatarMood) => {
    setAvatarState(prev => ({ ...prev, mood }));
    
    // Trigger mood-based animation if idle
    if (avatarState.state === 'idle') {
      const moodAnimation = getAnimationForMood(mood);
      if (moodAnimation) {
        playAnimation(moodAnimation, 1000);
      }
    }
  }, [avatarState.state]);

  const startListening = useCallback(() => {
    setState('listening');
    playAnimation('listening_blink');
    
    // Start voice recognition if available
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      
      recognition.onresult = (event: any) => {
        const current = event.resultIndex;
        const transcript = event.results[current][0].transcript;
        
        // Process speech and update avatar
        processSpeechTranscript(transcript);
      };
      
      recognition.onerror = (event: any) => {
        showError(`Speech recognition error: ${event.error}`);
      };
      
      recognition.start();
    }
  }, [setState]);

  const stopListening = useCallback(() => {
    setState('processing');
    
    // Stop speech recognition if active
    // This would need to track the recognition instance
  }, [setState]);

  const startSpeaking = useCallback(async (text: string, options: SpeakingOptions = {}) => {
    if (isSpeakingRef.current) return;
    
    isSpeakingRef.current = true;
    setState('speaking');
    
    try {
      // Generate phoneme stream from TTS service
      const phonemes = await generatePhonemeStream(text, {
        voice_id: options.voice_id || config.voice_id,
        speech_rate: options.speech_rate || 1.0,
        pitch: options.pitch || 1.0,
        emotion: options.emotion || avatarState.mood,
      });
      
      // Set mood from options if provided
      if (options.emotion) {
        setMood(options.emotion);
      }
      
      // Process phoneme stream for lip-sync
      if (options.show_visemes !== false) {
        processPhonemeStream(phonemes);
      }
      
      // Generate and play audio
      const audioBuffer = await generateAudioFromPhonemes(phonemes);
      await playAudioWithVisemes(audioBuffer, phonemes);
      
    } catch (error) {
      console.error('Speech generation error:', error);
      showError(`Failed to generate speech: ${error}`);
    } finally {
      isSpeakingRef.current = false;
      setState('idle');
      setAvatarState(prev => ({ ...prev, current_viseme: null, phoneme_stream: [] }));
    }
  }, [config, avatarState.mood, setState, setMood]);

  const stopSpeaking = useCallback(() => {
    isSpeakingRef.current = false;
    
    // Stop any ongoing audio playback
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(console.error);
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    setState('idle');
    setAvatarState(prev => ({ ...prev, current_viseme: null, phoneme_stream: [] }));
  }, [setState]);

  const showError = useCallback((message: string) => {
    setAvatarState(prev => ({
      ...prev,
      state: 'error',
      current_animation: 'error_shake',
      error_message: message,
      last_activity: new Date(),
    }));
    
    // Auto-clear error after 5 seconds
    setTimeout(() => {
      setAvatarState(prev => ({
        ...prev,
        state: 'idle',
        current_animation: 'idle_breathing',
        error_message: undefined,
      }));
    }, 5000);
  }, []);

  const clearError = useCallback(() => {
    setAvatarState(prev => ({
      ...prev,
      state: 'idle',
      current_animation: 'idle_breathing',
      error_message: undefined,
    }));
  }, []);

  const updateConfig = useCallback((newConfig: Partial<JeanAvatarConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  const playAnimation = useCallback((animation: AvatarAnimation, duration?: number) => {
    setAvatarState(prev => ({
      ...prev,
      current_animation: animation,
    }));
    
    if (duration) {
      setTimeout(() => {
        setAvatarState(prev => ({
          ...prev,
          current_animation: getDefaultAnimationForState(prev.state),
        }));
      }, duration);
    }
  }, []);

  const processPhonemeStream = useCallback((phonemes: PhonemeStream[]) => {
    phonemeStreamRef.current = phonemes;
    setAvatarState(prev => ({ ...prev, phoneme_stream: phonemes }));
    
    // Start viseme animation sequence
    let currentIndex = 0;
    
    const animateVisemes = () => {
      if (currentIndex >= phonemes.length || !isSpeakingRef.current) {
        setAvatarState(prev => ({ ...prev, current_viseme: null }));
        return;
      }
      
      const phoneme = phonemes[currentIndex];
      const viseme = createVisemeFromPhoneme(phoneme);
      
      setAvatarState(prev => ({ ...prev, current_viseme: viseme }));
      
      currentIndex++;
      setTimeout(animateVisemes, phoneme.duration);
    };
    
    animateVisemes();
  }, []);

  // Helper functions
  const generatePhonemeStream = async (text: string, options: any): Promise<PhonemeStream[]> => {
    try {
      // Call backend TTS service for phoneme generation
      const phonemes = await invoke('generate_phoneme_stream', {
        text,
        voiceId: options.voice_id,
        speechRate: options.speech_rate,
        pitch: options.pitch,
        emotion: options.emotion,
      });
      
      return phonemes as PhonemeStream[];
    } catch (error) {
      // Fallback to basic phoneme generation
      return generateBasicPhonemes(text);
    }
  };

  const generateAudioFromPhonemes = async (phonemes: PhonemeStream[]): Promise<AudioBuffer> => {
    try {
      // Call backend TTS service for audio generation
      const audioData = await invoke('generate_audio_from_phonemes', {
        phonemes,
        modelUrl: config.model_url,
      });
      
      // Convert to AudioBuffer
      const audioBuffer = await audioContextRef.current!.decodeAudioData(audioData as ArrayBuffer);
      return audioBuffer;
    } catch (error) {
      console.error('Audio generation failed:', error);
      throw error;
    }
  };

  const playAudioWithVisemes = async (audioBuffer: AudioBuffer, phonemes: PhonemeStream[]) => {
    const source = audioContextRef.current!.createBufferSource();
    source.buffer = audioBuffer;
    
    source.connect(audioContextRef.current!.destination);
    source.start();
    
    return new Promise<void>((resolve) => {
      source.onended = () => resolve();
    });
  };

  const createVisemeFromPhoneme = (phoneme: PhonemeStream): VisemeData => {
    const visemeId = PHONEME_TO_VISEME_MAP[phoneme.phoneme] || 39; // Default to silence
    const blendShapes = VISEME_BLEND_SHAPES[visemeId] || VISEME_BLEND_SHAPES[39];
    
    return {
      viseme_id: visemeId,
      phoneme: phoneme.phoneme,
      mouth_shape: blendShapes.mouth_shape || 'SIL',
      duration: phoneme.duration,
      blend_shapes: blendShapes,
    };
  };

  const generateBasicPhonemes = (text: string): PhonemeStream[] => {
    // Very basic phoneme generation - in production would use proper TTS
    const words = text.toLowerCase().split(/\s+/);
    const phonemes: PhonemeStream[] = [];
    
    words.forEach((word, wordIndex) => {
      for (let i = 0; i < word.length; i++) {
        const letter = word[i];
        const phoneme = getBasicPhonemeForLetter(letter);
        const duration = Math.random() * 100 + 50; // 50-150ms
        
        phonemes.push({
          phoneme,
          duration,
          intensity: 0.8,
          timestamp: Date.now() + phonemes.reduce((sum, p) => sum + p.duration, 0),
        });
      }
      
      // Add silence between words
      phonemes.push({
        phoneme: 'SIL',
        duration: 100,
        intensity: 0,
        timestamp: Date.now() + phonemes.reduce((sum, p) => sum + p.duration, 0),
      });
    });
    
    return phonemes;
  };

  const getBasicPhonemeForLetter = (letter: string): string => {
    const basicMap: Record<string, string> = {
      'a': 'AH', 'b': 'B', 'c': 'K', 'd': 'D', 'e': 'EH',
      'f': 'F', 'g': 'G', 'h': 'HH', 'i': 'IH', 'j': 'JH',
      'k': 'K', 'l': 'L', 'm': 'M', 'n': 'N', 'o': 'OW',
      'p': 'P', 'q': 'K', 'r': 'R', 's': 'S', 't': 'T',
      'u': 'UH', 'v': 'V', 'w': 'W', 'x': 'K', 'y': 'Y',
      'z': 'Z',
    };
    
    return basicMap[letter] || 'SIL';
  };

  const processSpeechTranscript = (transcript: string) => {
    // Analyze transcript for emotion and update mood
    const detectedMood = analyzeMoodFromText(transcript);
    if (detectedMood !== avatarState.mood) {
      setMood(detectedMood);
    }
  };

  const analyzeMoodFromText = (text: string): AvatarMood => {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('thank') || lowerText.includes('great')) return 'happy';
    if (lowerText.includes('help') || lowerText.includes('problem')) return 'concerned';
    if (lowerText.includes('wow') || lowerText.includes('amazing')) return 'excited';
    if (lowerText.includes('think') || lowerText.includes('consider')) return 'thoughtful';
    if (lowerText.includes('what') || lowerText.includes('how')) return 'confused';
    
    return 'neutral';
  };

  const getDefaultAnimationForState = (state: AvatarState): AvatarAnimation => {
    switch (state) {
      case 'idle': return 'idle_breathing';
      case 'listening': return 'listening_blink';
      case 'speaking': return 'talking';
      case 'processing': return 'thinking';
      case 'error': return 'error_shake';
      default: return 'idle_breathing';
    }
  };

  const getAnimationForMood = (mood: AvatarMood): AvatarAnimation | null => {
    switch (mood) {
      case 'happy': return 'idle_breathing'; // Could add happy animation
      case 'concerned': return 'thinking';
      case 'excited': return 'talking'; // Could add excited animation
      default: return null;
    }
  };

  const actions: JeanAvatarActions = {
    setState,
    setMood,
    startListening,
    stopListening,
    startSpeaking,
    stopSpeaking,
    showError,
    clearError,
    updateConfig,
    playAnimation,
    processPhonemeStream,
  };

  return {
    state: avatarState,
    config,
    actions,
    isReady: !!audioContextRef.current,
  };
};

// Types for external integration
export interface Wav2LipConfig {
  model_path: string;
  face_detector_path: string;
  checkpoint_path: string;
  device: 'cpu' | 'cuda';
}

export interface LipSyncFrame {
  frame_data: ImageData;
  timestamp: number;
  viseme_id: number;
  confidence: number;
}

export const useJeanAvatarWithWav2Lip = (wav2lipConfig?: Wav2LipConfig) => {
  const avatar = useJeanAvatar();
  
  const processVideoFrame = useCallback(async (audioBuffer: AudioBuffer): Promise<LipSyncFrame[]> => {
    // This would integrate with Wav2Lip service
    // For now, return placeholder frames
    return [];
  }, []);

  const generateVideoFromAudio = useCallback(async (audioFile: File, faceImage: File): Promise<string> => {
    // This would call Wav2Lip backend service
    try {
      const videoUrl = await invoke('generate_lip_sync_video', {
        audioPath: audioFile.path,
        faceImagePath: faceImage.path,
        config: wav2lipConfig,
      });
      
      return videoUrl as string;
    } catch (error) {
      avatar.actions.showError(`Video generation failed: ${error}`);
      throw error;
    }
  }, [avatar, wav2lipConfig]);

  return {
    ...avatar,
    processVideoFrame,
    generateVideoFromAudio,
  };
};