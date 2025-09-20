
'use client';

import React, { useState, useEffect } from 'react';
import RequireAuth from '../components/RequireAuth';
import Tree from './Tree';
import { useGarden } from './useGarden';

function getGradientByHour(hour: number) {
  // Soft gradient sky: morning, day, evening, night
  if (hour < 6) return 'from-blue-900 via-indigo-900 to-purple-900'; // night
  if (hour < 10) return 'from-blue-200 via-indigo-100 to-pink-200'; // morning
  if (hour < 17) return 'from-blue-100 via-indigo-200 to-green-100'; // day
  if (hour < 20) return 'from-pink-200 via-indigo-300 to-purple-200'; // evening
  return 'from-blue-900 via-indigo-900 to-purple-900'; // night
}

export default function SanjhaGrovePage() {
  const trees = useGarden();
  const hour = typeof window !== 'undefined' ? new Date().getHours() : 12;
  const gradient = getGradientByHour(hour);
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
    const newParticles = [...Array(20)].map((_, i) => ({
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
      <main className='relative flex flex-col items-center justify-center min-h-screen px-4 py-12 overflow-hidden w-full'>
        {/* Animated gradient sky background */}
        <div className={`fixed inset-0 -z-10 transition-all duration-1000 bg-gradient-to-br ${gradient}`} />

        {/* Floating nature elements */}
        <div className='absolute top-16 left-12 text-5xl animate-bubble-gentle opacity-30'>🌸</div>
        <div className='absolute top-32 right-20 text-4xl animate-bubble-flow opacity-25'>🌳</div>
        <div className='absolute bottom-40 left-16 text-6xl animate-bubble-dance opacity-20'>🌿</div>
        <div className='absolute bottom-24 right-12 text-4xl animate-float-gentle opacity-35'>🕊️</div>
        <div className='absolute top-1/2 left-8 text-3xl animate-drift opacity-40'>✨</div>
        <div className='absolute top-3/4 right-16 text-5xl animate-float-slow opacity-25'>🌙</div>
        <div className='absolute top-20 left-1/3 text-4xl animate-breathe opacity-30'>🌱</div>
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
        <div className='relative z-10 w-full max-w-5xl mx-auto text-center'>
          {/* Header */}
          <header className='mb-8 animate-fade-in-gentle'>
            <div className='text-7xl mb-6 animate-pulse-soft'>🌳</div>
            <h1 className='text-6xl sm:text-7xl font-light mb-4 text-white drop-shadow-lg tracking-wide'>
              Sanjha Grove
            </h1>
            <p className='text-xl sm:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed font-light mb-8 drop-shadow'>
              A shared digital sanctuary where every positive action blossoms into a glowing tree. Watch our collective growth together.
            </p>
          </header>

          {/* Garden visualization */}
          <div className='glass-card animate-float-gentle mb-8'>
            <div className='p-6'>
              <div className='flex items-center justify-center gap-4 mb-6'>
                <div className='text-4xl animate-bounce'>🌱</div>
                <div className='text-center'>
                  <h2 className='text-2xl font-light text-slate-700 dark:text-slate-200 mb-1'>Our Collective Garden</h2>
                  <p className='text-slate-600 dark:text-slate-400 font-light'>{trees.length} trees planted by our community</p>
                </div>
                <div className='text-4xl animate-bounce'>🌿</div>
              </div>

              <div className='relative w-full h-[70vh] overflow-hidden rounded-3xl border border-white/30 shadow-2xl bg-gradient-to-b from-white/20 to-emerald-100/30 backdrop-blur-sm'>
                {/* Render all trees in the garden */}
                <svg width="100%" height="100%" viewBox="0 0 1000 600" className="absolute inset-0 w-full h-full">
                  {trees.map(tree => (
                    <Tree
                      key={tree.id}
                      x={tree.x}
                      y={tree.y}
                      color={tree.color}
                      mood={tree.mood}
                      animate
                    />
                  ))}
                </svg>
                {trees.length === 0 && (
                  <div className='absolute inset-0 flex flex-col items-center justify-center text-white/80 animate-fade-in-gentle'>
                    <div className='text-6xl mb-4 animate-bounce'>🌱</div>
                    <p className='text-xl font-light mb-2'>Our garden awaits your first seed</p>
                    <p className='text-sm font-light'>Take a positive action to plant the first glowing tree!</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Inspirational message */}
          <div className='glass-card max-w-2xl mx-auto animate-float-slow'>
            <div className='text-center p-8'>
              <div className='text-5xl mb-4 animate-pulse-soft'>✨</div>
              <h3 className='text-xl font-light text-slate-700 dark:text-slate-200 mb-3'>Every Action Matters</h3>
              <p className='text-slate-600 dark:text-slate-400 leading-relaxed font-light'>
                Your mindfulness, your reflections, your growth - each one contributes to our beautiful shared sanctuary.
                Together, we create something truly magical.
              </p>
            </div>
          </div>
        </div>
      </main>
    </RequireAuth>
  );
}
