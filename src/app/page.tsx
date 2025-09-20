'use client';
import Link from 'next/link';
import { useAuth } from './components/AuthProvider';
import { signOut } from 'firebase/auth';
import { auth } from './firebaseClient';
import { useState, useEffect } from 'react';

export default function Home() {
  const { user, loading } = useAuth();
  const [particles, setParticles] = useState<Array<{left: string, top: string, animationDelay: string, animationDuration: string, size: string, color: string}>>([]);

  // Generate particles only on client side to avoid hydration mismatch
  useEffect(() => {
    const colors = ['bg-blue-200', 'bg-indigo-200', 'bg-purple-200', 'bg-cyan-200', 'bg-slate-200', 'bg-violet-200'];
    const newParticles = [...Array(25)].map((_, i) => ({
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
    <main className='relative flex flex-col items-center justify-center min-h-screen px-4 py-12 overflow-hidden'>
      {/* Soothing gradient background with animation */}
      <div className='absolute inset-0 z-0 animate-gradient-flow' />

      {/* Floating nature elements */}
      <div className='absolute top-16 left-12 text-5xl animate-bubble-gentle opacity-30'></div>
      <div className='absolute top-32 right-20 text-4xl animate-bubble-flow opacity-25'></div>
      <div className='absolute bottom-40 left-16 text-6xl animate-bubble-dance opacity-20'></div>
      <div className='absolute bottom-24 right-12 text-4xl animate-float-gentle opacity-35'></div>
      <div className='absolute top-1/2 left-8 text-3xl animate-drift opacity-40'></div>
      <div className='absolute top-3/4 right-16 text-5xl animate-float-slow opacity-25'></div>
      <div className='absolute top-20 left-1/3 text-4xl animate-breathe opacity-30'></div>
      <div className='absolute bottom-32 right-1/3 text-3xl animate-float-wave opacity-35'></div>

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
        {/* Welcome section */}
        <header className='mb-12 animate-fade-in-gentle'>
          <div className='text-7xl mb-6 animate-pulse-soft'></div>
          <h1 className='text-6xl sm:text-7xl font-light mb-4 text-slate-700 dark:text-slate-200 tracking-wide'>
            Sahay <span className='text-4xl align-super text-emerald-500'>(सहय)</span>
          </h1>
          <p className='text-xl sm:text-2xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed font-light mb-8'>
            Your gentle companion for inner peace. Find tranquility, build resilience, and grow through mindful moments designed just for you.
          </p>

          <div className='flex justify-center gap-4 mb-8'>
            {loading ? (
              <div className='flex items-center gap-3 text-emerald-600'>
                <div className='animate-spin text-2xl'></div>
                <span className='font-medium'>Preparing your peaceful space...</span>
              </div>
            ) : user ? (
              <div className='flex flex-col sm:flex-row items-center gap-4'>
                <span className='text-emerald-600 dark:text-emerald-400 font-medium text-lg'>
                  Welcome back, {user.displayName || 'friend'} 
                </span>
                <button
                  className='btn-outline'
                  onClick={() => signOut(auth)}
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link href='/login' className='btn-primary animate-pulse-soft'>
                Begin Your Journey
              </Link>
            )}
          </div>
        </header>

        {/* Feature navigation */}
        <nav className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 animate-fade-in-delayed'>
          <Link href='/mitra' className='btn-feature group'>
            <span className='text-3xl mb-1 group-hover:animate-bounce'></span>
            <span>Mitra</span>
            <span className='text-xs opacity-75'>AI Companion</span>
          </Link>
          <Link href='/manthan' className='btn-feature group'>
            <span className='text-3xl mb-1 group-hover:animate-bounce'></span>
            <span>Manthan</span>
            <span className='text-xs opacity-75'>AI Journal</span>
          </Link>
          <Link href='/dhwani' className='btn-feature group'>
            <span className='text-3xl mb-1 group-hover:animate-bounce'></span>
            <span>Dhwani</span>
            <span className='text-xs opacity-75'>Soundscapes</span>
          </Link>
          <Link href='/health' className='btn-feature group'>
            <span className='text-3xl mb-1 group-hover:animate-bounce'></span>
            <span>Health</span>
            <span className='text-xs opacity-75'>Dashboard</span>
          </Link>
          <Link href='/practice-space' className='btn-feature group'>
            <span className='text-3xl mb-1 group-hover:animate-bounce'></span>
            <span>Practice</span>
            <span className='text-xs opacity-75'>Space</span>
          </Link>
          <Link href='/ar-grounding' className='btn-feature group'>
            <span className='text-3xl mb-1 group-hover:animate-bounce'></span>
            <span>AR</span>
            <span className='text-xs opacity-75'>Grounding</span>
          </Link>
          <Link href='/sanjha-grove' className='btn-feature group'>
            <span className='text-3xl mb-1 group-hover:animate-bounce'></span>
            <span>Sanjha</span>
            <span className='text-xs opacity-75'>Grove</span>
          </Link>
          <Link href='/journal' className='btn-feature group'>
            <span className='text-3xl mb-1 group-hover:animate-bounce'></span>
            <span>Journal</span>
            <span className='text-xs opacity-75'>Reflections</span>
          </Link>
        </nav>

        {/* Inspirational message */}
        <div className='glass-card max-w-2xl mx-auto mb-12 animate-float-gentle'>
          <div className='text-6xl mb-4'></div>
          <h3 className='text-2xl font-light text-slate-700 dark:text-slate-200 mb-3'>Grow Your Inner Light</h3>
          <p className='text-slate-600 dark:text-slate-400 leading-relaxed'>
            Every breath, every thought, every gentle step forward nurtures your spirit.
            You&apos;re not alone on this beautiful journey of self-discovery and healing.
          </p>
        </div>

        {/* User dashboard when logged in */}
        {user && (
          <div className='w-full max-w-5xl animate-fade-in-gentle'>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
              <div className='glass-card text-center animate-float-slow'>
                <div className='text-4xl mb-3'></div>
                <h4 className='font-light text-slate-700 dark:text-slate-200 mb-2'>Today&apos;s Peace</h4>
                <p className='text-sm text-slate-600 dark:text-slate-400 mb-4'>How are you feeling in this moment?</p>
                <div className='flex justify-center gap-3'>
                  {['', '', '', '', ''].map(emoji => (
                    <button key={emoji} className='text-3xl hover:scale-125 transition-transform duration-300 hover:animate-bounce'>
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className='glass-card text-center animate-float-wave' style={{animationDelay: '0.5s'}}>
                <div className='text-4xl mb-3'></div>
                <h4 className='font-light text-slate-700 dark:text-slate-200 mb-2'>Quick Moments</h4>
                <p className='text-sm text-slate-600 dark:text-slate-400 mb-4'>Gentle ways to nurture your well-being</p>
                <div className='flex flex-col gap-3'>
                  <Link href='/mitra' className='text-sm bg-emerald-100 dark:bg-emerald-900/50 px-4 py-2 rounded-full hover:bg-emerald-200 dark:hover:bg-emerald-800/50 transition-colors duration-300'>
                      Chat with Mitra
                  </Link>
                  <Link href='/practice-space' className='text-sm bg-teal-100 dark:bg-teal-900/50 px-4 py-2 rounded-full hover:bg-teal-200 dark:hover:bg-teal-800/50 transition-colors duration-300'>
                      Practice Mindfulness
                  </Link>
                </div>
              </div>

              <div className='glass-card text-center animate-drift' style={{animationDelay: '1s'}}>
                <div className='text-4xl mb-3'></div>
                <h4 className='font-light text-slate-700 dark:text-slate-200 mb-2'>Your Journey</h4>
                <p className='text-sm text-slate-600 dark:text-slate-400 mb-4'>7 days of gentle progress! </p>
                <div className='flex justify-center gap-2'>
                  {[...Array(7)].map((_, i) => (
                    <div key={i} className='w-4 h-4 bg-emerald-400 rounded-full animate-pulse-soft' style={{animationDelay: `${i * 0.2}s`}}></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className='relative z-10 w-full max-w-3xl mx-auto text-center text-slate-500 dark:text-slate-400 text-sm mt-16 animate-fade-in-gentle'>
        <p className='font-light'>
           {new Date().getFullYear()} Sahay. Crafted with <span className='text-pink-400 animate-pulse-soft'></span> for your journey to inner peace.
        </p>
      </footer>
    </main>
  );
}
