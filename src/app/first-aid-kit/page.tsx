"use client";
import React, { useState, useRef, useEffect, createContext, useContext } from "react";
import Image from "next/image";
import RequireAuth from "../components/RequireAuth";
import SmartBreathingCoach from "./SmartBreathingCoach";
import AffirmationStream from "./AffirmationStream";
import MindfulnessMicroSessions from "./MindfulnessMicroSessions";
import ProgressiveMuscleRelaxation from "./ProgressiveMuscleRelaxation";
import StressThermometer from "./StressThermometer";

const BreathingContext = createContext<any>(null);

interface Sound {
  name: string;
  url: string;
  benefit: string;
}

interface SoundRecommendation {
  category: string;
  sounds: Sound[];
  reason: string;
  priority?: string;
}

function SoundscapePlayer() {
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<SoundRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch AI-powered sound recommendations on component mount
  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/unified', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          route: 'soundscape/recommend',
          data: {}
        })
      });

      if (!response.ok) throw new Error('Failed to fetch recommendations');

      const data = await response.json();
      console.log('🎵 Sound recommendations:', data);
      setRecommendations(data.recommendations || []);
    } catch (err: any) {
      console.error('Error fetching sound recommendations:', err);
      setError(err.message);
      // Fallback to default sounds
      setRecommendations([
        {
          category: 'general-wellness',
          sounds: [
            { name: 'Ocean Waves', url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3', benefit: 'Natural calming sound for relaxation' },
            { name: 'Gentle Rain', url: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_12b3f47ae3.mp3', benefit: 'Soothing precipitation sounds' },
            { name: 'Forest Birds', url: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_4a06674886.mp3', benefit: 'Natural sounds for peace' }
          ],
          reason: 'Calming sounds for general wellness and relaxation.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Handle audio playback when sound is selected
  useEffect(() => {
    if (!selected) return;
    if (audio) {
      audio.pause();
      setAudio(null);
    }
    const a = new window.Audio(selected);
    a.loop = true;
    setAudio(a);
    setPlaying(false);
    return () => {
      a.pause();
    };
  }, [selected]);

  const handlePlay = () => {
    if (audio) {
      audio.play();
      setPlaying(true);
    }
  };

  const handlePause = () => {
    if (audio) {
      audio.pause();
      setPlaying(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 shadow-lg border border-purple-100 animate-fadein mt-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xl font-bold text-purple-700 mb-1">🎵 AI-Powered Soundscapes</div>
          <div className="text-sm text-gray-600">Personalized therapeutic sounds based on your wellness data</div>
        </div>
        <button
          onClick={fetchRecommendations}
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-purple-500 text-white font-semibold shadow hover:bg-purple-600 transition disabled:opacity-50"
        >
          {loading ? '🔄' : '✨'} Refresh
        </button>
      </div>

      {loading && (
        <div className="text-center py-8 text-gray-500">
          <div className="animate-spin text-4xl mb-2">🎵</div>
          Loading personalized soundscapes...
        </div>
      )}

      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
          ⚠️ Using default sounds (AI recommendations temporarily unavailable)
        </div>
      )}

      {!loading && recommendations.map((rec, idx) => (
        <div key={idx} className="bg-white/80 backdrop-blur-sm rounded-lg p-4 shadow-sm border border-purple-100">
          <div className="flex items-start gap-3 mb-3">
            <div className="text-2xl">{rec.priority === 'high' ? '⭐' : '🎯'}</div>
            <div className="flex-1">
              <div className="font-semibold text-gray-800 capitalize mb-1">
                {rec.category.replace(/-/g, ' ')}
              </div>
              <div className="text-sm text-gray-600">{rec.reason}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {rec.sounds.map((sound, sidx) => (
              <button
                key={sidx}
                onClick={() => {
                  setSelected(sound.url);
                  setSelectedCategory(rec.category);
                }}
                className={`p-3 rounded-lg text-left transition-all ${
                  selected === sound.url
                    ? 'bg-purple-100 border-2 border-purple-400 shadow-md'
                    : 'bg-gray-50 border border-gray-200 hover:bg-purple-50 hover:border-purple-200'
                }`}
              >
                <div className="font-semibold text-gray-800 text-sm mb-1">{sound.name}</div>
                <div className="text-xs text-gray-500">{sound.benefit}</div>
              </button>
            ))}
          </div>
        </div>
      ))}

      {selected && (
        <div className="flex items-center justify-center gap-4 bg-white/90 backdrop-blur-sm rounded-lg p-4 border border-purple-200 shadow-sm">
          <div className="flex-1 text-center">
            <div className="text-sm text-gray-500 mb-1">Now Playing:</div>
            <div className="font-semibold text-gray-800">
              {recommendations.flatMap(r => r.sounds).find(s => s.url === selected)?.name || 'Selected Sound'}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              className="px-6 py-2 rounded-lg bg-purple-500 text-white font-semibold shadow hover:bg-purple-600 transition disabled:opacity-50"
              onClick={handlePlay}
              disabled={!selected || playing}
            >
              ▶️ Play
            </button>
            <button
              className="px-6 py-2 rounded-lg bg-purple-300 text-white font-semibold shadow hover:bg-purple-400 transition disabled:opacity-50"
              onClick={handlePause}
              disabled={!selected || !playing}
            >
              ⏸️ Pause
            </button>
          </div>
        </div>
      )}

      <div className="text-xs text-gray-500 text-center">
        💡 Tip: Use headphones for the best therapeutic experience. Volume is controlled by your device.
      </div>
    </div>
  );
}

function ARBreathingLotus() {
  const { phase, running, phaseProgress } = useContext(BreathingContext);
  const scale = phase === 'in' ? 1 + 0.3 * phaseProgress : 1.3 - 0.3 * phaseProgress;
  return (
    <div className="flex flex-col items-center gap-2 mt-6 animate-fadein">
      <div className="text-lg font-semibold text-indigo-700 mb-2">AR Breathing Lotus</div>
      <div className="relative flex items-center justify-center" style={{ height: 180 }}>
        <svg
          width={160}
          height={160}
          style={{ transform: `scale(${scale})`, transition: 'transform 0.2s cubic-bezier(.4,2,.6,1)' }}
        >
          <defs>
            <radialGradient id="lotusGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f0abfc" stopOpacity="0.8" />
              <stop offset="80%" stopColor="#818cf8" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#fff" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="80" cy="80" r="60" fill="url(#lotusGlow)" />
          {[...Array(8)].map((_, i) => (
            <ellipse
              key={i}
              cx="80"
              cy="50"
              rx="18"
              ry="40"
              fill="#f0abfc"
              opacity={0.5}
              transform={`rotate(${i * 45} 80 80)`}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xl font-bold text-indigo-600 drop-shadow">
            {phase === 'in' ? 'Breathe In' : phase === 'hold' ? 'Hold' : 'Breathe Out'}
          </span>
        </div>
      </div>
      <div className="text-xs text-gray-500 mt-1">Follow the glowing lotus: Inhale as it grows, exhale as it shrinks.</div>
    </div>
  );
}

function BreathingModule() {
  const [phase, setPhase] = useState<'in' | 'hold' | 'out'>('in');
  const [count, setCount] = useState(4);
  const [running, setRunning] = useState(false);
  const [phaseProgress, setPhaseProgress] = useState(0); // 0 to 1
  const [timer, setTimer] = useState(4); // seconds left in phase
  const seq = [
    { phase: 'in', duration: 4 },
    { phase: 'hold', duration: 4 },
    { phase: 'out', duration: 6 },
  ];
  const currentStep = seq.find(s => s.phase === phase)!;
  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          // Move to next phase
          const currentIndex = seq.findIndex(s => s.phase === phase);
          const nextIndex = (currentIndex + 1) % seq.length;
          const nextPhase = seq[nextIndex].phase as 'in' | 'hold' | 'out';
          setPhase(nextPhase);
          setPhaseProgress(0);
          return seq[nextIndex].duration;
        }
        setPhaseProgress((currentStep.duration - prev + 1) / currentStep.duration);
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [running, phase, currentStep.duration]);
  const start = () => {
    setRunning(true);
    setPhase('in');
    setTimer(4);
    setPhaseProgress(0);
  };
  const stop = () => {
    setRunning(false);
    setPhase('in');
    setTimer(4);
    setPhaseProgress(0);
  };
  return (
    <BreathingContext.Provider value={{ phase, running, phaseProgress }}>
      <div className="flex flex-col items-center gap-2 bg-pink-50 rounded-xl p-6 shadow border border-pink-100 animate-fadein mt-6">
        <div className="text-lg font-semibold text-pink-700 mb-2">4-4-6 Breathing</div>
        <div className="flex flex-col items-center gap-2">
          <div className="text-2xl font-bold text-pink-600">
            {phase === 'in' && 'Breathe In'}
            {phase === 'hold' && 'Hold'}
            {phase === 'out' && 'Breathe Out'}
          </div>
          <div className="text-2xl text-pink-400 font-mono">{timer} sec</div>
        </div>
        <button
          className="mt-4 px-4 py-2 rounded-lg bg-pink-500 text-white font-semibold shadow disabled:opacity-60"
          onClick={running ? stop : start}
        >
          {running ? 'Stop' : 'Start'}
        </button>
        <div className="text-xs text-gray-500 mt-2">4-4-6 breathing: Inhale 4s, hold 4s, exhale 6s. Repeat for calm.</div>
      </div>
      <ARBreathingLotus />
    </BreathingContext.Provider>
  );
}

function CrisisButton() {
  const [show, setShow] = useState(false);
  return (
    <div className="flex flex-col items-center gap-2 mt-6">
      <button
        className="px-6 py-3 rounded-xl bg-red-500 text-white font-bold shadow-lg text-lg animate-pulse"
        onClick={() => setShow(true)}
      >
        🚨 Crisis? Get Help Now
      </button>
      {show && (
        <div className="bg-white/90 border border-red-200 rounded-xl p-4 mt-2 shadow-xl animate-fadein flex flex-col items-center gap-2">
          <div className="text-red-700 font-bold mb-1">You are not alone.</div>
          <div className="text-gray-700 text-sm mb-2">If you are in crisis or need immediate support, please reach out:</div>
          <a href="tel:9152987821" className="text-blue-600 underline font-semibold">Kiran Helpline (India): 9152987821</a>
          <a href="https://www.vandrevalafoundation.com/helpline" target="_blank" rel="noopener" className="text-blue-600 underline font-semibold">Vandrevala Foundation</a>
          <a href="https://www.snehi.org/helpline" target="_blank" rel="noopener" className="text-blue-600 underline font-semibold">Snehi Helpline</a>
          <button className="mt-2 text-xs text-pink-500 underline" onClick={() => setShow(false)}>Close</button>
        </div>
      )}
    </div>
  );
}

export default function FirstAidKitPage() {
  const [showAR, setShowAR] = useState(false);
  const [activeModule, setActiveModule] = useState<'breathing' | 'affirmations' | 'mindfulness' | null>(null);
  const [particles, setParticles] = useState<Array<{
    left: string;
    top: string;
    animationDelay: string;
    animationDuration: string;
    size: string;
    color: string;
  }>>([]);

  // Generate particles only on client side to avoid hydration mismatch
  useEffect(() => {
    const colors = ['bg-emerald-200', 'bg-teal-200', 'bg-cyan-200', 'bg-blue-200', 'bg-indigo-200', 'bg-purple-200'];
    const newParticles = [...Array(18)].map((_, i) => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 8}s`,
      animationDuration: `${6 + Math.random() * 4}s`,
      size: `${Math.random() * 6 + 2}px`,
      color: colors[Math.floor(Math.random() * colors.length)]
    }));
    setParticles(newParticles);
  }, []);

  return (
    <RequireAuth>
      <main className='relative flex flex-col items-center justify-center min-h-screen px-4 py-12 overflow-hidden'>
        {/* Soothing gradient background with animation */}
        <div className='absolute inset-0 z-0 animate-gradient-flow' />

        {/* Floating nature elements */}
        <div className='absolute top-16 left-12 text-5xl animate-bubble-gentle opacity-30'>🌸</div>
        <div className='absolute top-32 right-20 text-4xl animate-bubble-flow opacity-25'>🧘‍♀️</div>
        <div className='absolute bottom-40 left-16 text-6xl animate-bubble-dance opacity-20'>🌿</div>
        <div className='absolute bottom-24 right-12 text-4xl animate-float-gentle opacity-35'>🕊️</div>
        <div className='absolute top-1/2 left-8 text-3xl animate-drift opacity-40'>✨</div>
        <div className='absolute top-3/4 right-16 text-5xl animate-float-slow opacity-25'>🌙</div>
        <div className='absolute top-20 left-1/3 text-4xl animate-breathe opacity-30'>💭</div>
        <div className='absolute bottom-32 right-1/3 text-3xl animate-float-wave opacity-35'>🌸</div>

        {/* Animated particles */}
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
        <div className='relative z-10 w-full max-w-4xl mx-auto text-center'>
          {/* Header */}
          <header className='mb-12 animate-fade-in-gentle'>
            <div className='text-7xl mb-6 animate-pulse-soft'>🧰</div>
            <h1 className='text-6xl sm:text-7xl font-light mb-4 text-slate-700 dark:text-slate-200 tracking-wide'>
              First Aid Kit
            </h1>
            <p className='text-xl sm:text-2xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed font-light mb-8'>
              Your gentle toolkit for emotional wellness. Find calm, breathe deeply, and access support when you need it most.
            </p>
          </header>

          {/* Module Selection or Active Module */}
          {!activeModule ? (
            <>
              {/* Wellness Module Selection Grid */}
              <div className='glass-card max-w-3xl mx-auto animate-float-gentle mb-8'>
                <div className='p-8 space-y-6'>
                  <h2 className='text-3xl font-light text-slate-700 dark:text-slate-200 mb-6'>
                    Choose Your Wellness Module
                  </h2>
                  
                  <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                    {/* Smart Breathing Coach */}
                    <button
                      onClick={() => setActiveModule('breathing')}
                      className='group flex flex-col items-center gap-3 p-6 rounded-2xl bg-gradient-to-br from-blue-100 to-cyan-100 hover:from-blue-200 hover:to-cyan-200 dark:from-blue-900/30 dark:to-cyan-900/30 dark:hover:from-blue-800/40 dark:hover:to-cyan-800/40 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 border border-blue-200 dark:border-blue-700'
                    >
                      <span className='text-5xl group-hover:animate-bounce'>🫁</span>
                      <h3 className='text-lg font-semibold text-blue-700 dark:text-blue-300'>
                        Smart Breathing
                      </h3>
                      <p className='text-xs text-blue-600 dark:text-blue-400 text-center font-light'>
                        AI-guided breathing patterns with calming visuals
                      </p>
                    </button>

                    {/* Affirmation Stream */}
                    <button
                      onClick={() => setActiveModule('affirmations')}
                      className='group flex flex-col items-center gap-3 p-6 rounded-2xl bg-gradient-to-br from-pink-100 to-rose-100 hover:from-pink-200 hover:to-rose-200 dark:from-pink-900/30 dark:to-rose-900/30 dark:hover:from-pink-800/40 dark:hover:to-rose-800/40 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 border border-pink-200 dark:border-pink-700'
                    >
                      <span className='text-5xl group-hover:animate-bounce'>💬</span>
                      <h3 className='text-lg font-semibold text-pink-700 dark:text-pink-300'>
                        Affirmations
                      </h3>
                      <p className='text-xs text-pink-600 dark:text-pink-400 text-center font-light'>
                        Personalized affirmations to uplift your mood
                      </p>
                    </button>

                    {/* Mindfulness Sessions */}
                    <button
                      onClick={() => setActiveModule('mindfulness')}
                      className='group flex flex-col items-center gap-3 p-6 rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 hover:from-purple-200 hover:to-indigo-200 dark:from-purple-900/30 dark:to-indigo-900/30 dark:hover:from-purple-800/40 dark:hover:to-indigo-800/40 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 border border-purple-200 dark:border-purple-700'
                    >
                      <span className='text-5xl group-hover:animate-bounce'>🧘</span>
                      <h3 className='text-lg font-semibold text-purple-700 dark:text-purple-300'>
                        Mindfulness
                      </h3>
                      <p className='text-xs text-purple-600 dark:text-purple-400 text-center font-light'>
                        Guided micro-sessions with XP rewards
                      </p>
                    </button>
                  </div>
                </div>
              </div>

              {/* Traditional toolkit below */}
              <div className='glass-card max-w-3xl mx-auto animate-float-gentle'>
                <div className='p-8 space-y-8'>
                  <h2 className='text-2xl font-light text-slate-700 dark:text-slate-200 mb-4'>
                    Quick Tools
                  </h2>

                  {/* Stress Thermometer - NEW! */}
                  <StressThermometer />

                  {/* AR Grounding Button */}
                  <div className='text-center'>
                    <button
                      className='btn-primary animate-pulse-soft group'
                      onClick={() => setShowAR(true)}
                      aria-label="Open AR Grounding"
                    >
                      <span className='text-2xl mr-2 group-hover:animate-bounce'>🌐</span>
                      AR Grounding Experience
                    </button>
                  </div>

                  {/* Breathing Module */}
                  <BreathingModule />

                  {/* Progressive Muscle Relaxation - NEW! */}
                  <ProgressiveMuscleRelaxation />

                  {/* Soundscape Player - ENHANCED! */}
                  <SoundscapePlayer />

                  {/* Crisis Support */}
                  <CrisisButton />
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Active Module Display */}
              <div className='glass-card max-w-4xl mx-auto animate-float-gentle'>
                <div className='p-8'>
                  {/* Back Button */}
                  <button
                    onClick={() => setActiveModule(null)}
                    className='mb-6 flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold transition-all'
                  >
                    <span>←</span>
                    <span>Back to Modules</span>
                  </button>

                  {/* Render Selected Module */}
                  {activeModule === 'breathing' && <SmartBreathingCoach />}
                  {activeModule === 'affirmations' && <AffirmationStream />}
                  {activeModule === 'mindfulness' && <MindfulnessMicroSessions />}
                </div>
              </div>
            </>
          )}
        </div>

        {showAR && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in-gentle">
            <div className="glass-card max-w-md w-full mx-4 animate-float-gentle">
              <div className='flex justify-end mb-4'>
                <button
                  className="text-2xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                  onClick={() => setShowAR(false)}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              <BreathingModule />
            </div>
          </div>
        )}
      </main>
    </RequireAuth>
  );
}