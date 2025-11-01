import { useState, useEffect, useRef, useCallback } from 'react';

export type SoundscapeMode = 'calm' | 'focus' | 'sleep';
export type MoodState = 'anxious' | 'calm' | 'sad' | 'energetic' | 'stressed' | 'peaceful' | 'neutral';

interface SoundscapeParameters {
  baseFrequency: number;
  harmonics: number[];
  filterFrequency: number;
  reverbAmount: number;
  noiseAmount: number;
  tempo: number; // BPM for rhythmic elements
  intensity: number; // 0-1 scale
}

interface UseAdaptiveSoundscapeReturn {
  isPlaying: boolean;
  mode: SoundscapeMode;
  volume: number;
  mood: MoodState | null;
  analyserNode: AnalyserNode | null;
  play: () => void;
  pause: () => void;
  setMode: (mode: SoundscapeMode) => void;
  setVolume: (volume: number) => void;
  setMood: (mood: MoodState) => void;
  updateParameters: (params: Partial<SoundscapeParameters>) => void;
  isSupported: boolean;
}

// Mood-to-soundscape parameter mappings
const MOOD_PARAMETERS: Record<MoodState, Partial<SoundscapeParameters>> = {
  anxious: {
    baseFrequency: 136, // Om frequency (calming)
    filterFrequency: 800,
    reverbAmount: 0.4,
    noiseAmount: 0.2,
    tempo: 60,
    intensity: 0.5,
  },
  calm: {
    baseFrequency: 256, // C note
    filterFrequency: 1200,
    reverbAmount: 0.6,
    noiseAmount: 0.15,
    tempo: 60,
    intensity: 0.4,
  },
  sad: {
    baseFrequency: 174, // Lower frequency for grounding
    filterFrequency: 600,
    reverbAmount: 0.5,
    noiseAmount: 0.3,
    tempo: 50,
    intensity: 0.45,
  },
  energetic: {
    baseFrequency: 432, // Higher, uplifting frequency
    filterFrequency: 2000,
    reverbAmount: 0.3,
    noiseAmount: 0.1,
    tempo: 90,
    intensity: 0.7,
  },
  stressed: {
    baseFrequency: 136,
    filterFrequency: 700,
    reverbAmount: 0.5,
    noiseAmount: 0.25,
    tempo: 55,
    intensity: 0.5,
  },
  peaceful: {
    baseFrequency: 256,
    filterFrequency: 1500,
    reverbAmount: 0.7,
    noiseAmount: 0.1,
    tempo: 55,
    intensity: 0.35,
  },
  neutral: {
    baseFrequency: 256,
    filterFrequency: 1000,
    reverbAmount: 0.5,
    noiseAmount: 0.2,
    tempo: 60,
    intensity: 0.5,
  },
};

// Mode-specific parameters (more soothing)
const MODE_PARAMETERS: Record<SoundscapeMode, Partial<SoundscapeParameters>> = {
  calm: {
    baseFrequency: 256,
    harmonics: [1, 2, 3, 4, 5, 7], // More rich harmonics
    filterFrequency: 1200,
    reverbAmount: 0.7,
    noiseAmount: 0.08, // Less noise for clarity
    tempo: 55,
    intensity: 0.3, // Gentler
  },
  focus: {
    baseFrequency: 432,
    harmonics: [1, 2, 3], // More harmonics for richness
    filterFrequency: 1800,
    reverbAmount: 0.4,
    noiseAmount: 0.05,
    tempo: 70,
    intensity: 0.4, // Less intense
  },
  sleep: {
    baseFrequency: 136,
    harmonics: [1, 1.5, 2, 2.5, 3], // Very soothing overtones
    filterFrequency: 600,
    reverbAmount: 0.85, // More spacious
    noiseAmount: 0.12, // Subtle pink noise
    tempo: 40,
    intensity: 0.25, // Very gentle
  },
};

export function useAdaptiveSoundscape(): UseAdaptiveSoundscapeReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [mode, setMode] = useState<SoundscapeMode>('calm');
  const [volume, setVolume] = useState(0.7);
  const [mood, setMood] = useState<MoodState | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  // Web Audio API nodes
  const audioContextRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  
  // Oscillators for harmonic layers
  const oscillatorsRef = useRef<OscillatorNode[]>([]);
  const oscillatorGainsRef = useRef<GainNode[]>([]);
  
  // Noise and filter nodes
  const noiseSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const noiseGainRef = useRef<GainNode | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);
  
  // Current parameters
  const parametersRef = useRef<SoundscapeParameters>({
    baseFrequency: 256,
    harmonics: [1, 2, 3, 5],
    filterFrequency: 1000,
    reverbAmount: 0.5,
    noiseAmount: 0.2,
    tempo: 60,
    intensity: 0.5,
  });

  // Check for Web Audio API support
  useEffect(() => {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    setIsSupported(!!AudioContext);
  }, []);

  // Initialize Audio Context
  const initAudioContext = useCallback(() => {
    if (audioContextRef.current) return;

    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) {
      console.error('Web Audio API not supported');
      return;
    }

    const ctx = new AudioContext();
    audioContextRef.current = ctx;

    // Create master gain for volume control
    const masterGain = ctx.createGain();
    masterGain.gain.value = volume;
    masterGain.connect(ctx.destination);
    masterGainRef.current = masterGain;

    // Create analyser for visualization
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.connect(masterGain);
    analyserRef.current = analyser;

    // Create filter
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = parametersRef.current.filterFrequency;
    filter.Q.value = 1;
    filter.connect(analyser);
    filterRef.current = filter;

    // Create noise gain
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = parametersRef.current.noiseAmount * parametersRef.current.intensity;
    noiseGain.connect(filter);
    noiseGainRef.current = noiseGain;

    console.log('Audio context initialized');
  }, [volume]);

  // Generate pink/brown noise buffer
  const createNoiseBuffer = useCallback(() => {
    if (!audioContextRef.current) return null;

    const ctx = audioContextRef.current;
    const bufferSize = ctx.sampleRate * 2; // 2 seconds of noise
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // Generate brown noise (more bass-heavy than white noise)
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5; // Compensate for volume
    }

    return buffer;
  }, []);

  // Create and start oscillators
  const startOscillators = useCallback(() => {
    console.log('🎛️  [Dhwani] startOscillators called');
    console.log('🎛️  [Dhwani] audioContextRef.current:', !!audioContextRef.current);
    console.log('🎛️  [Dhwani] filterRef.current:', !!filterRef.current);
    
    if (!audioContextRef.current || !filterRef.current) {
      console.error('❌ [Dhwani] Cannot start oscillators - missing AudioContext or filter');
      return;
    }

    const ctx = audioContextRef.current;
    const params = parametersRef.current;
    
    console.log('🎛️  [Dhwani] Parameters:', params);

    // Stop existing oscillators
    oscillatorsRef.current.forEach(osc => {
      try {
        osc.stop();
      } catch (e) {
        // Ignore if already stopped
      }
    });
    oscillatorsRef.current = [];
    oscillatorGainsRef.current = [];

    // Create oscillators for each harmonic
    params.harmonics.forEach((harmonic, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      // Add subtle vibrato for warmth
      const vibrato = ctx.createOscillator();
      const vibratoGain = ctx.createGain();
      vibrato.frequency.value = 4; // 4 Hz vibrato (slow, soothing)
      vibratoGain.gain.value = 2; // ±2 Hz frequency variation
      vibrato.connect(vibratoGain);
      vibratoGain.connect(osc.frequency);

      // Set frequency based on harmonic
      osc.frequency.value = params.baseFrequency * harmonic;
      
      // Use different waveforms for variety
      if (index === 0) {
        osc.type = 'sine'; // Base tone
      } else if (index === 1) {
        osc.type = 'triangle'; // First harmonic
      } else {
        osc.type = 'sine'; // Higher harmonics
      }

      // Set gain with exponential falloff for more natural sound
      const harmonicGain = (params.intensity * 0.6) / Math.pow(index + 1, 1.3) / params.harmonics.length;
      gain.gain.value = harmonicGain;
      
      console.log(`🎵 [Dhwani] Oscillator ${index}: freq=${osc.frequency.value}Hz, gain=${harmonicGain.toFixed(4)}, type=${osc.type}`);

      // Connect: oscillator -> gain -> filter
      osc.connect(gain);
      gain.connect(filterRef.current!);

      osc.start();
      vibrato.start();

      oscillatorsRef.current.push(osc);
      oscillatorGainsRef.current.push(gain);
    });

    console.log(`✅ [Dhwani] Started ${params.harmonics.length} oscillators`);
  }, []);

  // Start noise source
  const startNoise = useCallback(() => {
    console.log('🔊 [Dhwani] startNoise called');
    console.log('🔊 [Dhwani] audioContextRef.current:', !!audioContextRef.current);
    console.log('🔊 [Dhwani] noiseGainRef.current:', !!noiseGainRef.current);
    
    if (!audioContextRef.current || !noiseGainRef.current) {
      console.error('❌ [Dhwani] Cannot start noise - missing AudioContext or noiseGain');
      return;
    }

    const ctx = audioContextRef.current;
    const noiseBuffer = createNoiseBuffer();
    if (!noiseBuffer) {
      console.error('❌ [Dhwani] Failed to create noise buffer');
      return;
    }

    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer;
    source.loop = true;
    source.connect(noiseGainRef.current);
    source.start();

    noiseSourceRef.current = source;
    console.log('✅ [Dhwani] Noise source started, buffer size:', noiseBuffer.length);
  }, [createNoiseBuffer]);

  // Update parameters smoothly
  const updateParameters = useCallback((newParams: Partial<SoundscapeParameters>) => {
    if (!audioContextRef.current) return;

    const ctx = audioContextRef.current;
    const currentTime = ctx.currentTime;
    const params = { ...parametersRef.current, ...newParams };
    parametersRef.current = params;

    // Update filter frequency
    if (filterRef.current && newParams.filterFrequency !== undefined) {
      filterRef.current.frequency.exponentialRampToValueAtTime(
        params.filterFrequency,
        currentTime + 0.5
      );
    }

    // Update noise amount
    if (noiseGainRef.current && (newParams.noiseAmount !== undefined || newParams.intensity !== undefined)) {
      noiseGainRef.current.gain.linearRampToValueAtTime(
        params.noiseAmount * params.intensity,
        currentTime + 0.5
      );
    }

    // Update oscillator frequencies and gains
    if (newParams.baseFrequency !== undefined || newParams.harmonics !== undefined || newParams.intensity !== undefined) {
      oscillatorsRef.current.forEach((osc, index) => {
        const harmonic = params.harmonics[index];
        if (harmonic !== undefined) {
          osc.frequency.exponentialRampToValueAtTime(
            params.baseFrequency * harmonic,
            currentTime + 0.5
          );
        }
      });

      oscillatorGainsRef.current.forEach((gain, index) => {
        const harmonicGain = params.intensity / (index + 1) / params.harmonics.length;
        gain.gain.linearRampToValueAtTime(harmonicGain, currentTime + 0.5);
      });
    }

    console.log('Parameters updated:', params);
  }, []);

  // Play soundscape
  const play = useCallback(async () => {
    console.log('🎵 [Dhwani] Play button clicked');
    console.log('🎵 [Dhwani] isSupported:', isSupported);
    console.log('🎵 [Dhwani] isPlaying:', isPlaying);
    
    if (!isSupported) {
      console.error('❌ [Dhwani] Web Audio API not supported');
      return;
    }

    if (isPlaying) {
      console.log('⚠️  [Dhwani] Already playing, ignoring');
      return;
    }

    // Initialize or resume audio context
    if (!audioContextRef.current) {
      console.log('🔧 [Dhwani] Creating new AudioContext...');
      initAudioContext();
      console.log('✅ [Dhwani] AudioContext initialized');
    } else if (audioContextRef.current.state === 'suspended') {
      console.log('⏯️  [Dhwani] Resuming suspended AudioContext...');
      await audioContextRef.current.resume();
      console.log('✅ [Dhwani] AudioContext resumed:', audioContextRef.current.state);
    } else {
      console.log('✅ [Dhwani] AudioContext already running:', audioContextRef.current.state);
    }

    // Always start oscillators and noise when playing
    console.log('🎛️  [Dhwani] Starting oscillators...');
    startOscillators();
    console.log('🔊 [Dhwani] Starting noise...');
    startNoise();
    setIsPlaying(true);

    console.log('✅ [Dhwani] Soundscape started successfully!');
    console.log('🎵 [Dhwani] Master volume:', masterGainRef.current?.gain.value);
    console.log('🎵 [Dhwani] Oscillators count:', oscillatorsRef.current.length);
    console.log('🎵 [Dhwani] Parameters:', parametersRef.current);
  }, [isSupported, isPlaying, initAudioContext, startOscillators, startNoise]);

  // Pause soundscape
  const pause = useCallback(() => {
    if (!isPlaying) return;

    // Stop oscillators
    oscillatorsRef.current.forEach(osc => {
      try {
        osc.stop();
      } catch (e) {
        // Ignore if already stopped
      }
    });
    oscillatorsRef.current = [];
    oscillatorGainsRef.current = [];

    // Stop noise
    if (noiseSourceRef.current) {
      try {
        noiseSourceRef.current.stop();
      } catch (e) {
        // Ignore if already stopped
      }
      noiseSourceRef.current = null;
    }

    // Suspend audio context to save resources
    if (audioContextRef.current && audioContextRef.current.state === 'running') {
      audioContextRef.current.suspend();
    }

    setIsPlaying(false);
    console.log('Soundscape paused');
  }, [isPlaying]);

  // Update volume
  useEffect(() => {
    if (masterGainRef.current && audioContextRef.current) {
      const currentTime = audioContextRef.current.currentTime;
      masterGainRef.current.gain.linearRampToValueAtTime(volume, currentTime + 0.1);
    }
  }, [volume]);

  // Update mode
  useEffect(() => {
    const modeParams = MODE_PARAMETERS[mode];
    updateParameters(modeParams);

    if (isPlaying && audioContextRef.current) {
      console.log('🔄 [Dhwani] Mode changed while playing, restarting oscillators...');
      // Restart oscillators with new parameters ONLY if AudioContext exists
      startOscillators();
    }
  }, [mode, isPlaying, updateParameters, startOscillators]);

  // Update mood
  useEffect(() => {
    if (!mood) return;

    const moodParams = MOOD_PARAMETERS[mood];
    updateParameters(moodParams);
  }, [mood, updateParameters]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Stop oscillators
      oscillatorsRef.current.forEach((osc) => {
        try {
          osc.stop();
        } catch (e) {
          // Ignore if already stopped
        }
      });
      oscillatorsRef.current = [];

      // Stop noise
      if (noiseSourceRef.current) {
        try {
          noiseSourceRef.current.stop();
        } catch (e) {
          // Ignore if already stopped
        }
        noiseSourceRef.current = null;
      }

      // Close audio context
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on unmount

  return {
    isPlaying,
    mode,
    volume,
    mood,
    analyserNode: analyserRef.current,
    play,
    pause,
    setMode,
    setVolume,
    setMood,
    updateParameters,
    isSupported,
  };
}
