'use client';
import React, { useState, useEffect } from 'react';
import RequireAuth from '../components/RequireAuth';
import { useAdaptiveSoundscape, SoundscapeMode, MoodState } from './useAdaptiveSoundscape';
import { useManthanInsights } from './useManthanInsights';
import SoundVisualizer from './SoundVisualizer';
import { plantTree } from '../sanjha-grove/useGarden';

const MODE_INFO: Record<SoundscapeMode, {
  label: string;
  icon: string;
  description: string;
  benefits: string[];
}> = {
  calm: {
    label: 'Calm',
    icon: '🌊',
    description: 'Gentle, soothing sounds for relaxation and peace',
    benefits: ['Reduces anxiety', 'Promotes relaxation', 'Lowers heart rate', 'Eases tension'],
  },
  focus: {
    label: 'Focus',
    icon: '🎯',
    description: 'Optimized frequencies for concentration and productivity',
    benefits: ['Enhances concentration', 'Boosts productivity', 'Reduces distractions', 'Improves clarity'],
  },
  sleep: {
    label: 'Sleep',
    icon: '😴',
    description: 'Deep, restful soundscapes for better sleep quality',
    benefits: ['Promotes deep sleep', 'Reduces insomnia', 'Calms racing thoughts', 'Restful recovery'],
  },
};

const MOOD_INFO: Record<MoodState, {
  label: string;
  icon: string;
  color: string;
}> = {
  anxious: { label: 'Anxious', icon: '😰', color: 'text-red-600 dark:text-red-400' },
  calm: { label: 'Calm', icon: '😌', color: 'text-blue-600 dark:text-blue-400' },
  sad: { label: 'Sad', icon: '😢', color: 'text-slate-600 dark:text-slate-400' },
  energetic: { label: 'Energetic', icon: '⚡', color: 'text-yellow-600 dark:text-yellow-400' },
  stressed: { label: 'Stressed', icon: '😣', color: 'text-orange-600 dark:text-orange-400' },
  peaceful: { label: 'Peaceful', icon: '🕊️', color: 'text-emerald-600 dark:text-emerald-400' },
  neutral: { label: 'Neutral', icon: '😐', color: 'text-slate-600 dark:text-slate-400' },
};

export default function DhwaniPage() {
  const [particles, setParticles] = useState<Array<{
    left: string;
    top: string;
    animationDelay: string;
    animationDuration: string;
    size: string;
    color: string;
  }>>([]);
  
  const [planted, setPlanted] = useState(false);
  const [autoAdapt, setAutoAdapt] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Web Audio API soundscape
  const {
    isPlaying,
    mode,
    volume,
    mood: currentMood,
    analyserNode,
    play,
    pause,
    setMode,
    setVolume,
    setMood: setSoundscapeMood,
    updateParameters,
    isSupported,
  } = useAdaptiveSoundscape();

  // Manthan insights for adaptive audio
  const {
    insights,
    loading: insightsLoading,
    mood: manthanMood,
    refresh: refreshInsights,
  } = useManthanInsights();

  // Generate particles only on client side
  useEffect(() => {
    const colors = ['bg-blue-200', 'bg-indigo-200', 'bg-purple-200', 'bg-cyan-200', 'bg-slate-200', 'bg-violet-200'];
    const newParticles = [...Array(20)].map(() => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 8}s`,
      animationDuration: `${6 + Math.random() * 4}s`,
      size: `${Math.random() * 6 + 2}px`,
      color: colors[Math.floor(Math.random() * colors.length)]
    }));
    setParticles(newParticles);
  }, []);

  // Auto-adapt soundscape to Manthan mood
  useEffect(() => {
    if (autoAdapt && manthanMood && manthanMood !== currentMood) {
      console.log(`Auto-adapting soundscape from ${currentMood} to ${manthanMood}`);
      setSoundscapeMood(manthanMood);
    }
  }, [autoAdapt, manthanMood, currentMood, setSoundscapeMood]);

  // Plant tree when playing
  const handlePlay = async () => {
    play();
    
    if (!planted) {
      const color = mode === 'calm' ? '#a7f3d0' :
                    mode === 'focus' ? '#fbbf24' :
                    '#c4b5fd';
      const x = Math.random();
      const y = 0.6 + Math.random() * 0.3;
      await plantTree({ x, y, color, mood: mode });
      setPlanted(true);
    }
  };

  // Get recommended mode based on mood
  const getRecommendedMode = (mood: MoodState | null): SoundscapeMode => {
    if (!mood) return 'calm';
    
    switch (mood) {
      case 'anxious':
      case 'stressed':
        return 'calm';
      case 'energetic':
        return 'focus';
      case 'sad':
      case 'peaceful':
      case 'calm':
        return 'calm';
      default:
        return 'calm';
    }
  };

  const recommendedMode = getRecommendedMode(manthanMood);
  const currentMoodInfo = currentMood ? MOOD_INFO[currentMood] : null;

  return (
    <RequireAuth>
      <main className='relative flex flex-col items-center justify-center min-h-screen px-4 py-12 overflow-hidden'>
        {/* Background */}
        <div className='absolute inset-0 z-0 animate-gradient-flow' />

        {/* Floating elements */}
        <div className='absolute top-16 left-12 text-5xl animate-bubble-gentle opacity-30'>🌸</div>
        <div className='absolute top-32 right-20 text-4xl animate-bubble-flow opacity-25'>🎵</div>
        <div className='absolute bottom-40 left-16 text-6xl animate-bubble-dance opacity-20'>🌿</div>
        <div className='absolute bottom-24 right-12 text-4xl animate-float-gentle opacity-35'>🎧</div>
        
        {/* Particles */}
        <div className='absolute inset-0 z-0'>
          {particles.map((particle, i) => (
            <div
              key={i}
              className={`absolute rounded-full opacity-60 animate-particle-float ${particle.color}`}
              style={{
                left: particle.left,
                top: particle.top,
                width: particle.size,
                height: particle.size,
                animationDelay: particle.animationDelay,
                animationDuration: particle.animationDuration
              }}
            />
          ))}
        </div>

        {/* Main content */}
        <div className='relative z-10 w-full max-w-6xl mx-auto'>
          {/* Header */}
          <header className='mb-12 text-center animate-fade-in-gentle'>
            <div className='text-7xl mb-6 animate-pulse-soft'>🎵</div>
            <h1 className='text-6xl sm:text-7xl font-light mb-4 text-slate-700 dark:text-slate-200 tracking-wide'>
              Dhwani <span className='text-4xl align-super text-emerald-500'>(ध्वनि)</span>
            </h1>
            <p className='text-xl sm:text-2xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed font-light'>
              AI-powered adaptive soundscapes that respond to your emotional state from Manthan
            </p>
          </header>

          {/* Web Audio API Support Warning */}
          {!isSupported && (
            <div className='glass-card max-w-2xl mx-auto mb-8 bg-red-50/90 dark:bg-red-900/20 border-red-200 dark:border-red-700'>
              <div className='text-center py-6'>
                <div className='text-4xl mb-4'>⚠️</div>
                <h3 className='text-xl font-medium text-red-700 dark:text-red-300 mb-2'>
                  Web Audio API Not Supported
                </h3>
                <p className='text-slate-600 dark:text-slate-400'>
                  Your browser doesn't support the Web Audio API. Please use a modern browser like Chrome, Firefox, Safari, or Edge.
                </p>
              </div>
            </div>
          )}

          {/* Manthan Insights */}
          {insights && (
            <div className='glass-card max-w-4xl mx-auto mb-8 animate-fade-in-gentle'>
              <div className='flex items-center justify-between mb-6'>
                <div className='flex items-center gap-3'>
                  <div className='text-4xl'>🧠</div>
                  <div>
                    <h2 className='text-2xl font-light text-slate-700 dark:text-slate-200'>
                      Your Emotional State
                    </h2>
                    <p className='text-sm text-slate-600 dark:text-slate-400'>
                      Based on your recent Manthan reflections
                    </p>
                  </div>
                </div>
                <button
                  onClick={refreshInsights}
                  disabled={insightsLoading}
                  className='btn-secondary text-sm'
                >
                  {insightsLoading ? '🔄' : '↻'} Refresh
                </button>
              </div>

              <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-6'>
                <div className='bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 p-4 rounded-xl border border-blue-200 dark:border-blue-700/50'>
                  <div className='text-sm font-medium text-blue-700 dark:text-blue-300 mb-1'>Emotion</div>
                  <div className='text-xl font-light text-blue-900 dark:text-blue-100 capitalize'>
                    {insights.primaryEmotion}
                  </div>
                </div>

                <div className='bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-900/30 dark:to-violet-900/30 p-4 rounded-xl border border-indigo-200 dark:border-indigo-700/50'>
                  <div className='text-sm font-medium text-indigo-700 dark:text-indigo-300 mb-1'>Manthan Mood</div>
                  <div className='text-xl font-light text-indigo-900 dark:text-indigo-100 capitalize'>
                    {manthanMood || 'neutral'}
                  </div>
                </div>

                <div className='bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 p-4 rounded-xl border border-purple-200 dark:border-purple-700/50'>
                  <div className='text-sm font-medium text-purple-700 dark:text-purple-300 mb-1'>Intensity</div>
                  <div className='text-xl font-light text-purple-900 dark:text-purple-100'>
                    {Math.round(insights.emotionIntensity * 100)}%
                  </div>
                </div>

                <div className='bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/30 dark:to-red-900/30 p-4 rounded-xl border border-orange-200 dark:border-orange-700/50'>
                  <div className='text-sm font-medium text-orange-700 dark:text-orange-300 mb-1'>Stress</div>
                  <div className='text-xl font-light text-orange-900 dark:text-orange-100 capitalize'>
                    {insights.stressLevel}
                  </div>
                </div>

                <div className='bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 p-4 rounded-xl border border-emerald-200 dark:border-emerald-700/50'>
                  <div className='text-sm font-medium text-emerald-700 dark:text-emerald-300 mb-1'>Energy</div>
                  <div className='text-xl font-light text-emerald-900 dark:text-emerald-100 capitalize'>
                    {insights.energyLevel}
                  </div>
                </div>
              </div>

              {manthanMood && (
                <div className='bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-700/50 p-4 rounded-xl border border-slate-200 dark:border-slate-600'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-3'>
                      <span className='text-3xl'>{MOOD_INFO[manthanMood].icon}</span>
                      <div>
                        <div className='text-sm font-medium text-slate-600 dark:text-slate-400'>Detected Mood</div>
                        <div className={`text-lg font-medium ${MOOD_INFO[manthanMood].color}`}>
                          {MOOD_INFO[manthanMood].label}
                        </div>
                      </div>
                    </div>
                    <div className='text-right'>
                      <div className='text-sm font-medium text-slate-600 dark:text-slate-400'>Recommended</div>
                      <div className='text-lg font-medium text-emerald-600 dark:text-emerald-400'>
                        {MODE_INFO[recommendedMode].icon} {MODE_INFO[recommendedMode].label}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* No Manthan Data Notice */}
          {!insights && !insightsLoading && (
            <div className='glass-card max-w-4xl mx-auto mb-8 animate-fade-in-gentle bg-blue-50/90 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700'>
              <div className='flex items-start gap-4'>
                <div className='text-4xl'>💡</div>
                <div className='flex-1'>
                  <h3 className='text-xl font-medium text-blue-700 dark:text-blue-300 mb-2'>
                    Manthan Integration Available
                  </h3>
                  <p className='text-slate-600 dark:text-slate-400 mb-4'>
                    Dhwani can adapt its soundscapes based on your emotional state from Manthan journal entries. 
                    To enable this feature, add some reflections in the <strong>Manthan (Journal)</strong> page.
                  </p>
                  <div className='flex items-center gap-4'>
                    <a
                      href='/manthan'
                      className='btn-primary text-sm'
                    >
                      📝 Go to Manthan
                    </a>
                    <button
                      onClick={refreshInsights}
                      className='btn-secondary text-sm'
                    >
                      🔄 Check Again
                    </button>
                  </div>
                  <div className='mt-4 p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg'>
                    <div className='text-sm font-medium text-slate-700 dark:text-slate-300 mb-2'>
                      🎯 How it works:
                    </div>
                    <ul className='text-sm text-slate-600 dark:text-slate-400 space-y-1'>
                      <li>✓ Write journal entries in Manthan</li>
                      <li>✓ Manthan analyzes your emotional state</li>
                      <li>✓ Dhwani automatically adapts soundscapes to your mood</li>
                      <li>✓ Example: Feeling anxious → Calming frequencies</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Soundscape Interface */}
          <div className='grid grid-cols-1 lg:grid-cols-5 gap-6'>
            {/* Visualizer */}
            <div className='lg:col-span-3 glass-card p-0 overflow-hidden animate-float-gentle'>
              <div style={{ height: '400px' }}>
                <SoundVisualizer
                  analyserNode={analyserNode}
                  isPlaying={isPlaying}
                  mode={mode}
                  className='w-full h-full'
                />
              </div>
              
              {/* Playback Controls */}
              <div className='p-6 border-t border-white/20 dark:border-slate-700/50'>
                <div className='flex items-center justify-between mb-4'>
                  <div>
                    <div className='text-sm font-medium text-slate-600 dark:text-slate-400 mb-1'>
                      Current Mode
                    </div>
                    <div className='flex items-center gap-2'>
                      <span className='text-2xl'>{MODE_INFO[mode].icon}</span>
                      <span className='text-xl font-light text-slate-700 dark:text-slate-200'>
                        {MODE_INFO[mode].label}
                      </span>
                    </div>
                  </div>
                  
                  {currentMoodInfo && (
                    <div className='text-right'>
                      <div className='text-sm font-medium text-slate-600 dark:text-slate-400 mb-1'>
                        Adapted for
                      </div>
                      <div className='flex items-center gap-2 justify-end'>
                        <span className='text-2xl'>{currentMoodInfo.icon}</span>
                        <span className={`text-lg font-medium ${currentMoodInfo.color}`}>
                          {currentMoodInfo.label}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Play/Pause Button */}
                <button
                  onClick={isPlaying ? pause : handlePlay}
                  disabled={!isSupported}
                  className={`w-full py-4 rounded-2xl font-medium text-lg transition-all duration-300 ${
                    isPlaying
                      ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg hover:shadow-xl'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isPlaying ? (
                    <span className='flex items-center justify-center gap-3'>
                      <span className='text-2xl'>⏸️</span>
                      Pause Soundscape
                    </span>
                  ) : (
                    <span className='flex items-center justify-center gap-3'>
                      <span className='text-2xl'>▶️</span>
                      Play Soundscape
                    </span>
                  )}
                </button>

                {planted && (
                  <p className='text-sm text-emerald-600 dark:text-emerald-400 mt-3 text-center font-light animate-fade-in-gentle'>
                    🌿 A beautiful tree has been planted in your grove!
                  </p>
                )}

                {/* Volume Control */}
                <div className='mt-6'>
                  <div className='flex items-center justify-between mb-2'>
                    <label className='text-sm font-medium text-slate-700 dark:text-slate-300'>
                      Volume
                    </label>
                    <span className='text-sm text-slate-600 dark:text-slate-400'>
                      {Math.round(volume * 100)}%
                    </span>
                  </div>
                  <input
                    type='range'
                    min='0'
                    max='100'
                    value={volume * 100}
                    onChange={(e) => setVolume(Number(e.target.value) / 100)}
                    className='w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500'
                  />
                </div>
              </div>
            </div>

            {/* Controls Panel */}
            <div className='lg:col-span-2 space-y-6'>
              {/* Mode Selection */}
              <div className='glass-card animate-fade-in-gentle'>
                <h3 className='text-lg font-medium text-slate-700 dark:text-slate-200 mb-4'>
                  Soundscape Mode
                </h3>
                <div className='space-y-3'>
                  {(Object.keys(MODE_INFO) as SoundscapeMode[]).map((modeKey) => {
                    const info = MODE_INFO[modeKey];
                    const isActive = mode === modeKey;
                    const isRecommended = modeKey === recommendedMode;
                    
                    return (
                      <button
                        key={modeKey}
                        onClick={() => setMode(modeKey)}
                        className={`w-full text-left p-4 rounded-xl transition-all duration-300 border-2 ${
                          isActive
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-emerald-600 shadow-lg'
                            : isRecommended
                            ? 'bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 border-blue-300 dark:border-blue-700 hover:shadow-md'
                            : 'bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-600 hover:bg-white/70 dark:hover:bg-slate-800/70'
                        }`}
                      >
                        <div className='flex items-center gap-3 mb-2'>
                          <span className='text-2xl'>{info.icon}</span>
                          <div className='flex-1'>
                            <div className='font-medium'>{info.label}</div>
                            {isRecommended && !isActive && (
                              <div className='text-xs text-blue-600 dark:text-blue-400'>
                                ⭐ Recommended for you
                              </div>
                            )}
                          </div>
                          {isActive && <span className='text-lg'>✓</span>}
                        </div>
                        <p className={`text-sm ${
                          isActive ? 'text-white/90' : 'text-slate-600 dark:text-slate-400'
                        }`}>
                          {info.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Auto-Adapt Toggle */}
              <div className='glass-card animate-fade-in-gentle'>
                <label className='flex items-center justify-between cursor-pointer'>
                  <div>
                    <div className='font-medium text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-2'>
                      Auto-Adapt to Mood
                      {manthanMood && autoAdapt && (
                        <span className='px-2 py-0.5 text-xs bg-emerald-500 text-white rounded-full animate-pulse'>
                          Active
                        </span>
                      )}
                      {!manthanMood && (
                        <span className='px-2 py-0.5 text-xs bg-slate-400 text-white rounded-full'>
                          No Data
                        </span>
                      )}
                    </div>
                    <p className='text-sm text-slate-600 dark:text-slate-400'>
                      {manthanMood 
                        ? 'Automatically adjust soundscape based on Manthan insights'
                        : 'Add journal entries in Manthan to enable mood adaptation'
                      }
                    </p>
                  </div>
                  <input
                    type='checkbox'
                    checked={autoAdapt}
                    onChange={(e) => setAutoAdapt(e.target.checked)}
                    disabled={!manthanMood}
                    className='w-12 h-6 rounded-full appearance-none cursor-pointer relative
                      bg-slate-300 dark:bg-slate-600
                      checked:bg-emerald-500
                      disabled:opacity-50 disabled:cursor-not-allowed
                      after:content-[""] after:absolute after:top-0.5 after:left-0.5
                      after:w-5 after:h-5 after:rounded-full after:bg-white
                      after:transition-all after:duration-200
                      checked:after:left-6'
                  />
                </label>
              </div>

              {/* Benefits */}
              <div className='glass-card animate-fade-in-gentle'>
                <h3 className='text-lg font-medium text-slate-700 dark:text-slate-200 mb-3'>
                  {MODE_INFO[mode].icon} Benefits
                </h3>
                <ul className='space-y-2'>
                  {MODE_INFO[mode].benefits.map((benefit, index) => (
                    <li key={index} className='flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400'>
                      <span className='text-emerald-500 mt-0.5'>✓</span>
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Advanced Controls */}
              <div className='glass-card animate-fade-in-gentle'>
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className='w-full flex items-center justify-between text-left font-medium text-slate-700 dark:text-slate-200 mb-3'
                >
                  <span>Advanced Controls</span>
                  <span className='text-xl'>{showAdvanced ? '▼' : '▶'}</span>
                </button>
                
                {showAdvanced && (
                  <div className='space-y-4 pt-4 border-t border-white/20 dark:border-slate-700/50 animate-fade-in'>
                    <div>
                      <label className='text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block'>
                        Base Frequency (Hz)
                      </label>
                      <input
                        type='range'
                        min='50'
                        max='500'
                        step='10'
                        onChange={(e) => updateParameters({ baseFrequency: Number(e.target.value) })}
                        className='w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500'
                      />
                    </div>

                    <div>
                      <label className='text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block'>
                        Noise Amount
                      </label>
                      <input
                        type='range'
                        min='0'
                        max='100'
                        onChange={(e) => updateParameters({ noiseAmount: Number(e.target.value) / 100 })}
                        className='w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500'
                      />
                    </div>

                    <div>
                      <label className='text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block'>
                        Intensity
                      </label>
                      <input
                        type='range'
                        min='0'
                        max='100'
                        onChange={(e) => updateParameters({ intensity: Number(e.target.value) / 100 })}
                        className='w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500'
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Info Section */}
          <div className='glass-card max-w-4xl mx-auto mt-8 animate-fade-in-gentle'>
            <div className='text-center'>
              <div className='text-4xl mb-4'>ℹ️</div>
              <h3 className='text-xl font-medium text-slate-700 dark:text-slate-200 mb-3'>
                How Dhwani Works
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-6 text-left'>
                <div>
                  <div className='text-3xl mb-2'>🧠</div>
                  <h4 className='font-medium text-slate-700 dark:text-slate-200 mb-2'>
                    AI Analysis
                  </h4>
                  <p className='text-sm text-slate-600 dark:text-slate-400'>
                    Analyzes your journal entries and Manthan reflections to understand your emotional state
                  </p>
                </div>
                <div>
                  <div className='text-3xl mb-2'>🎵</div>
                  <h4 className='font-medium text-slate-700 dark:text-slate-200 mb-2'>
                    Adaptive Audio
                  </h4>
                  <p className='text-sm text-slate-600 dark:text-slate-400'>
                    Generates real-time soundscapes using Web Audio API with frequencies optimized for your mood
                  </p>
                </div>
                <div>
                  <div className='text-3xl mb-2'>✨</div>
                  <h4 className='font-medium text-slate-700 dark:text-slate-200 mb-2'>
                    Interactive Visuals
                  </h4>
                  <p className='text-sm text-slate-600 dark:text-slate-400'>
                    Beautiful Canvas-based visualizations that react to the soundscape in real-time
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </RequireAuth>
  );
}
