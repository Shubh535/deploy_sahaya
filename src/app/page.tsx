'use client';
import Link from 'next/link';
import { useAuth } from './components/AuthProvider';
import { signOut } from 'firebase/auth';
import { auth as getAuth } from './firebaseClient';
import { useState, useEffect } from 'react';

export default function Home() {
  const { user, loading } = useAuth();
  const [displayedText, setDisplayedText] = useState('');
  const [currentScriptIndex, setCurrentScriptIndex] = useState(0);
  const [isWriting, setIsWriting] = useState(true);
  const [showCursor, setShowCursor] = useState(true);

  const scripts = [
    { text: 'Sahay', lang: 'en' },
    { text: 'सहाय', lang: 'hi' },
    { text: 'سہائ', lang: 'ur' }
  ];

  // Animated app name cycling through scripts
  useEffect(() => {
    const currentScript = scripts[currentScriptIndex];
    let charIndex = 0;
    let timeoutId: NodeJS.Timeout;

    if (isWriting) {
      // Writing phase
      const writeChar = () => {
        if (charIndex < currentScript.text.length) {
          setDisplayedText(currentScript.text.substring(0, charIndex + 1));
          charIndex++;
          timeoutId = setTimeout(writeChar, 200);
        } else {
          // Pause before erasing
          timeoutId = setTimeout(() => setIsWriting(false), 3000);
        }
      };
      writeChar();
    } else {
      // Erasing phase
      const eraseChar = () => {
        if (charIndex < currentScript.text.length) {
          setDisplayedText(currentScript.text.substring(0, currentScript.text.length - charIndex - 1));
          charIndex++;
          timeoutId = setTimeout(eraseChar, 130);
        } else {
          // Move to next script
          setCurrentScriptIndex((prev) => (prev + 1) % scripts.length);
          setIsWriting(true);
        }
      };
      eraseChar();
    }

    return () => clearTimeout(timeoutId);
  }, [currentScriptIndex, isWriting]);

  // Cursor blink
  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 530);
    return () => clearInterval(interval);
  }, []);

  // Minimal background particles (reduced to 6)
  const [particles, setParticles] = useState<Array<{left: string, top: string, size: string}>>([]);
  useEffect(() => {
    setParticles([...Array(6)].map(() => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: `${Math.random() * 4 + 2}px`
    })));
  }, []);

  return (
    <main className='relative flex flex-col items-center justify-center min-h-screen px-4 py-12 bg-gradient-to-br from-slate-50 via-emerald-50/30 to-cyan-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900'>
      {/* Minimal background particles */}
      <div className='absolute inset-0 overflow-hidden pointer-events-none'>
        {particles.map((particle, i) => (
          <div
            key={i}
            className='absolute rounded-full bg-emerald-300/15 dark:bg-emerald-400/10'
            style={{
              left: particle.left,
              top: particle.top,
              width: particle.size,
              height: particle.size
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className='relative z-10 w-full max-w-4xl mx-auto text-center'>
        {/* Welcome section with animated app name */}
        <header className='mb-12 animate-fade-in'>
          {/* Leaf emoji above the name */}
          <div className='text-5xl mb-4'>🌿</div>
          
          <h1 className='text-6xl sm:text-7xl mb-4 text-slate-800 dark:text-slate-100 tracking-wide' style={{ fontFamily: '"Times New Roman", Times, serif' }}>
            <span className='inline-block min-w-[200px] text-left'>
              {displayedText}
              <span className={`inline-block w-0.5 h-16 bg-emerald-600 ml-1 align-middle ${showCursor ? 'opacity-100' : 'opacity-0'}`} />
            </span>
          </h1>
          
          {/* "Here for your calm" tagline in green */}
          <p className='text-xl sm:text-2xl text-emerald-600 dark:text-emerald-400 font-light mb-6'>
            Here for your calm
          </p>
          
          <p className='text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed font-light mb-8'>
            Your gentle space for mental wellness. Find peace, build resilience, and grow mindfully.
          </p>

          <div className='flex justify-center gap-4 mb-8'>
            {loading ? (
              <div className='flex items-center gap-3 text-emerald-600'>
                <div className='w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin' />
                <span className='font-medium'>Loading...</span>
              </div>
            ) : user ? (
              <div className='flex flex-col sm:flex-row items-center gap-4'>
                <span className='text-emerald-600 dark:text-emerald-400 font-medium text-lg'>
                  Welcome back, {user.displayName || 'friend'}
                </span>
                <button
                  className='btn-outline'
                  onClick={() => {
                    if (typeof window === 'undefined') return;
                    signOut(getAuth());
                  }}
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link href='/login' className='btn-primary'>
                Begin Your Journey
              </Link>
            )}
          </div>
        </header>

        {/* Feature navigation - square buttons in responsive grid */}
        <nav className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-12 animate-fade-in-delayed max-w-3xl mx-auto'>
          <Link href='/mitra' className='btn-feature'>
            <span className='text-2xl mb-1'>🤝</span>
            <span className='text-xs'>Mitra</span>
            <span className='text-[10px] opacity-75'>AI Companion</span>
          </Link>
          <Link href='/manthan' className='btn-feature'>
            <span className='text-2xl mb-1'>📝</span>
            <span className='text-xs'>Manthan</span>
            <span className='text-[10px] opacity-75'>AI Journal</span>
          </Link>
          <Link href='/dhwani' className='btn-feature'>
            <span className='text-2xl mb-1'>🎵</span>
            <span className='text-xs'>Dhwani</span>
            <span className='text-[10px] opacity-75'>Soundscapes</span>
          </Link>
          <Link href='/health' className='btn-feature'>
            <span className='text-2xl mb-1'>❤️</span>
            <span className='text-xs'>Health</span>
            <span className='text-[10px] opacity-75'>Dashboard</span>
          </Link>
          <Link href='/practice-space' className='btn-feature'>
            <span className='text-2xl mb-1'>🧘</span>
            <span className='text-xs'>Practice</span>
            <span className='text-[10px] opacity-75'>Space</span>
          </Link>
          <Link href='/entertainment' className='btn-feature'>
            <span className='text-2xl mb-1'>🎭</span>
            <span className='text-xs'>Entertainment</span>
            <span className='text-[10px] opacity-75'>Joy & Music</span>
          </Link>
          <Link href='/sanjha-grove' className='btn-feature'>
            <span className='text-2xl mb-1'>🌳</span>
            <span className='text-xs'>Sanjha</span>
            <span className='text-[10px] opacity-75'>Grove</span>
          </Link>
          <Link href='/journal' className='btn-feature'>
            <span className='text-2xl mb-1'>📖</span>
            <span className='text-xs'>Journal</span>
            <span className='text-[10px] opacity-75'>Reflections</span>
          </Link>
        </nav>

        {/* Inspirational message - clean card */}
        <div className='glass-card max-w-2xl mx-auto mb-12'>
          <h3 className='text-xl font-medium text-slate-700 dark:text-slate-200 mb-3'>Grow Your Inner Light</h3>
          <p className='text-slate-600 dark:text-slate-400 leading-relaxed'>
            Every breath, every thought, every gentle step forward nurtures your spirit.
            You&apos;re not alone on this beautiful journey of self-discovery and healing.
          </p>
        </div>

        {/* User dashboard when logged in - simplified */}
        {user && (
          <div className='w-full max-w-5xl animate-fade-in'>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
              <div className='glass-card text-center'>
                <h4 className='font-medium text-slate-700 dark:text-slate-200 mb-2'>Today&apos;s Peace</h4>
                <p className='text-sm text-slate-600 dark:text-slate-400 mb-4'>How are you feeling?</p>
                <div className='flex justify-center gap-3'>
                  {['😊', '😌', '😐', '😔', '😢'].map(emoji => (
                    <button key={emoji} className='text-2xl hover:opacity-70 transition-opacity'>
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className='glass-card text-center'>
                <h4 className='font-medium text-slate-700 dark:text-slate-200 mb-2'>Quick Moments</h4>
                <p className='text-sm text-slate-600 dark:text-slate-400 mb-4'>Gentle ways to nurture well-being</p>
                <div className='flex flex-col gap-3'>
                  <Link href='/mitra' className='text-sm bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-4 py-2 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors'>
                    Chat with Mitra
                  </Link>
                  <Link href='/practice-space' className='text-sm bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 px-4 py-2 rounded-lg hover:bg-teal-100 dark:hover:bg-teal-900 transition-colors'>
                    Practice Mindfulness
                  </Link>
                </div>
              </div>

              <div className='glass-card text-center'>
                <h4 className='font-medium text-slate-700 dark:text-slate-200 mb-2'>Your Journey</h4>
                <p className='text-sm text-slate-600 dark:text-slate-400 mb-4'>7 days of progress</p>
                <div className='flex justify-center gap-2'>
                  {[...Array(7)].map((_, i) => (
                    <div key={i} className='w-3 h-3 bg-emerald-500 rounded-full'></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className='relative z-10 w-full max-w-3xl mx-auto text-center text-slate-500 dark:text-slate-400 text-sm mt-16'>
        <p className='font-light'>
          © {new Date().getFullYear()} Sahay. Crafted with care for your journey to inner peace.
        </p>
      </footer>
    </main>
  );
}
