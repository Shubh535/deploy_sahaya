"use client";
import React, { useState, useRef, useEffect, createContext, useContext } from "react";
import Image from "next/image";
import RequireAuth from "../components/RequireAuth";

const BreathingContext = createContext<any>(null);

function SoundscapePlayer() {
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const SOUNDS = [
    { key: 'rain', label: 'Rain', url: '/soundscapes/rain.mp3' },
    { key: 'forest', label: 'Forest', url: '/soundscapes/forest.mp3' },
    { key: 'waves', label: 'Waves', url: '/soundscapes/waves.mp3' },
    { key: 'om', label: 'Om Chant', url: '/soundscapes/om.mp3' },
  ];
  useEffect(() => {
    if (!selected) return;
    if (audio) {
      audio.pause();
      setAudio(null);
    }
    const a = new window.Audio(SOUNDS.find(s => s.key === selected)?.url || '');
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
    <div className="flex flex-col items-center gap-2 bg-indigo-50 rounded-xl p-6 shadow border border-indigo-100 animate-fadein mt-6">
      <div className="text-lg font-semibold text-indigo-700 mb-2">Calming Soundscapes</div>
      <div className="flex gap-2 mb-2">
        {SOUNDS.map(s => (
          <button
            key={s.key}
            className={`px-3 py-1 rounded-lg font-semibold border ${selected === s.key ? 'bg-indigo-200 border-indigo-400' : 'bg-white border-indigo-100'} transition`}
            onClick={() => setSelected(s.key)}
          >
            {s.label}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <button
          className="px-4 py-2 rounded-lg bg-indigo-500 text-white font-semibold shadow disabled:opacity-60"
          onClick={handlePlay}
          disabled={!selected || playing}
        >Play</button>
        <button
          className="px-4 py-2 rounded-lg bg-indigo-300 text-white font-semibold shadow disabled:opacity-60"
          onClick={handlePause}
          disabled={!selected || !playing}
        >Pause</button>
      </div>
      <div className="text-xs text-gray-500 mt-2">Choose a soundscape and press Play. Volume is controlled by your device.</div>
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

          {/* Main toolkit */}
          <div className='glass-card max-w-3xl mx-auto animate-float-gentle'>
            <div className='p-8 space-y-8'>
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

              {/* Soundscape Player */}
              <SoundscapePlayer />

              {/* Crisis Support */}
              <CrisisButton />
            </div>
          </div>
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