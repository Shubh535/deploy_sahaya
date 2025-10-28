'use client';
import React, { useState, useRef, useEffect } from 'react';
import { plantTree } from '../sanjha-grove/useGarden';
import RequireAuth from '../components/RequireAuth';
import { apiRequest } from '../utils/apiClient';

interface SoundRecommendation {
  category: string;
  sounds: Array<{
    name: string;
    url: string;
    benefit: string;
  }>;
  reason: string;
  priority?: string;
  analysis?: {
    moodState: string;
    confidence: number;
    intensity: string;
    duration: number;
    summary: string;
  };
}

export default function DhwaniPage() {
  const [soundType, setSoundType] = useState<'rain' | 'waves' | 'brown-noise' | 'forest' | 'birds' | 'wind' | 'fire' | 'tibetan-bowls' | 'piano' | 'white-noise' | 'binaural-beats' | 'meditation-chimes' | 'nature-stream' | 'heartbeat'>('rain');
  const [recommendations, setRecommendations] = useState<SoundRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState<SoundRecommendation | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [planted, setPlanted] = useState(false);
  const [particles, setParticles] = useState<Array<{
    left: string;
    top: string;
    animationDelay: string;
    animationDuration: string;
    size: string;
    color: string;
  }>>([]);
  const [meditationTheme, setMeditationTheme] = useState('');
  const [meditationScript, setMeditationScript] = useState('');
  const [generating, setGenerating] = useState(false);

  // Alternative working URLs (uncomment to use different sounds):
  // rain: 'https://www.soundjay.com/button/beep-07a.mp3', // Alternative sample
  // waves: 'https://www.soundjay.com/button/beep-07a.mp3', // Alternative sample
  // 'brown-noise': 'https://www.soundjay.com/button/beep-07a.mp3', // Alternative sample
  // forest: 'https://www.soundjay.com/button/beep-07a.mp3', // Alternative sample
  // birds: 'https://www.soundjay.com/button/beep-07a.mp3', // Alternative sample
  // wind: 'https://www.soundjay.com/button/beep-07a.mp3', // Alternative sample
  // fire: 'https://www.soundjay.com/button/beep-07a.mp3', // Alternative sample
  // 'tibetan-bowls': 'https://www.soundjay.com/button/beep-07a.mp3', // Alternative sample
  // piano: 'https://www.soundjay.com/button/beep-07a.mp3', // Alternative sample
  // 'white-noise': 'https://www.soundjay.com/button/beep-07a.mp3', // Alternative sample
  // 'binaural-beats': 'https://www.soundjay.com/button/beep-07a.mp3', // Alternative sample
  // 'meditation-chimes': 'https://www.soundjay.com/button/beep-07a.mp3', // Alternative sample
  // 'nature-stream': 'https://www.soundjay.com/button/beep-07a.mp3', // Alternative sample
  // heartbeat: 'https://www.soundjay.com/button/beep-07a.mp3', // Alternative sample

  const soundUrls: Record<string, string> = {
    rain: 'https://www.soundjay.com/button/beep-07a.mp3', // Gentle rain (sample)
    waves: 'https://www.soundjay.com/button/beep-07a.mp3', // Ocean waves (sample)
    'brown-noise': 'https://www.soundjay.com/button/beep-07a.mp3', // Brown noise (sample)
    forest: 'https://www.soundjay.com/button/beep-07a.mp3', // Forest sounds (sample)
    birds: 'https://www.soundjay.com/button/beep-07a.mp3', // Bird songs (sample)
    wind: 'https://www.soundjay.com/button/beep-07a.mp3', // Wind sounds (sample)
    fire: 'https://www.soundjay.com/button/beep-07a.mp3', // Fireplace (sample)
    'tibetan-bowls': 'https://www.soundjay.com/button/beep-07a.mp3', // Tibetan singing bowls (sample)
    piano: 'https://www.soundjay.com/button/beep-07a.mp3', // Soft piano (sample)
    'white-noise': 'https://www.soundjay.com/button/beep-07a.mp3', // White noise (sample)
    'binaural-beats': 'https://www.soundjay.com/button/beep-07a.mp3', // Binaural beats for focus (sample)
    'meditation-chimes': 'https://www.soundjay.com/button/beep-07a.mp3', // Meditation chimes (sample)
    'nature-stream': 'https://www.soundjay.com/button/beep-07a.mp3', // Nature stream (sample)
    heartbeat: 'https://www.soundjay.com/button/beep-07a.mp3', // Gentle heartbeat (sample)
  };

  // Generate particles only on client side to avoid hydration mismatch
  useEffect(() => {
    const colors = ['bg-blue-200', 'bg-indigo-200', 'bg-purple-200', 'bg-cyan-200', 'bg-slate-200', 'bg-violet-200'];
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

  // Fetch AI recommendations on component mount
  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      console.log('Fetching AI-powered recommendations...');
      const data = await apiRequest('/soundscape/recommend', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      console.log('AI Recommendations data:', data);

      // Add analysis data to each recommendation for display
      const recommendationsWithAnalysis = data.recommendations.map((rec: any) => ({
        ...rec,
        analysis: data.analysis
      }));

      setRecommendations(recommendationsWithAnalysis);
    } catch (error) {
      console.error('Failed to fetch AI recommendations:', error);
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSoundType(e.target.value as any);
    setPlanted(false);
  };

  const handlePlay = async () => {
    if (!planted) {
      // Plant a relaxing tree in Sanjha Grove
      const color = '#a7f3d0'; // soft green for calm/relax
      const x = Math.random();
      const y = 0.6 + Math.random() * 0.3;
      await plantTree({ x, y, color, mood: 'relaxed' });
      setPlanted(true);
    }
    audioRef.current?.play();
  };

  const playRecommendedSound = async (sound: { name: string; url: string; benefit: string }) => {
    if (audioRef.current) {
      audioRef.current.src = sound.url;
      audioRef.current.play();
    }

    if (!planted) {
      const color = '#a7f3d0';
      const x = Math.random();
      const y = 0.6 + Math.random() * 0.3;
      await plantTree({ x, y, color, mood: 'relaxed' });
      setPlanted(true);
    }
  };

  const generateMeditation = async () => {
    if (!meditationTheme.trim()) return;

    setGenerating(true);
    try {
      const response = await apiRequest('/dhwani/generate', {
        method: 'POST',
        body: JSON.stringify({
          theme: meditationTheme,
          duration: 5,
          mood: 'calm'
        }),
      });
      setMeditationScript(response.script);
    } catch (error) {
      console.error('Error generating meditation:', error);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <RequireAuth>
      <main className='relative flex flex-col items-center justify-center min-h-screen px-4 py-12 overflow-hidden'>
        {/* Soothing gradient background with animation */}
        <div className='absolute inset-0 z-0 animate-gradient-flow' />

        {/* Floating nature elements */}
        <div className='absolute top-16 left-12 text-5xl animate-bubble-gentle opacity-30'>🌸</div>
        <div className='absolute top-32 right-20 text-4xl animate-bubble-flow opacity-25'>🌊</div>
        <div className='absolute bottom-40 left-16 text-6xl animate-bubble-dance opacity-20'>🌿</div>
        <div className='absolute bottom-24 right-12 text-4xl animate-float-gentle opacity-35'>🎵</div>
        <div className='absolute top-1/2 left-8 text-3xl animate-drift opacity-40'>✨</div>
        <div className='absolute top-3/4 right-16 text-5xl animate-float-slow opacity-25'>🕊️</div>
        <div className='absolute top-20 left-1/3 text-4xl animate-breathe opacity-30'>🌙</div>
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
          <header className='mb-12 animate-fade-in-gentle'>
            <div className='text-7xl mb-6 animate-pulse-soft'>🎵</div>
            <h1 className='text-6xl sm:text-7xl font-light mb-4 text-slate-700 dark:text-slate-200 tracking-wide'>
              Dhwani <span className='text-4xl align-super text-emerald-500'>(ध्वनि)</span>
            </h1>
            <p className='text-xl sm:text-2xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed font-light mb-8'>
              AI-powered adaptive soundscapes for your emotional wellness journey. Let the gentle rhythms nurture your inner peace.
            </p>
          </header>

          {/* AI Recommendations Section */}
          {loading ? (
            <div className='glass-card max-w-2xl mx-auto mb-8 animate-float-gentle'>
              <div className='flex flex-col items-center py-8'>
                <div className='animate-spin text-4xl mb-4'>🌀</div>
                <p className='text-slate-600 dark:text-slate-400 font-light'>Analyzing your comprehensive wellness data...</p>
                <p className='text-sm text-slate-500 dark:text-slate-500 mt-2'>This may take a moment as we process your journal entries, mood patterns, and activity data</p>
              </div>
            </div>
          ) : recommendations.length > 0 ? (
            <div className='w-full mb-12'>
              {/* Analysis Summary */}
              <div className='glass-card max-w-4xl mx-auto mb-8 animate-fade-in-gentle'>
                <div className='text-center mb-6'>
                  <div className='text-4xl mb-4'>🧠</div>
                  <h2 className='text-2xl font-light text-slate-700 dark:text-slate-200 mb-4'>AI Wellness Analysis</h2>
                  <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm'>
                    <div className='bg-emerald-50/50 dark:bg-emerald-900/20 p-3 rounded-lg'>
                      <div className='font-medium text-emerald-700 dark:text-emerald-300'>Mood State</div>
                      <div className='text-emerald-600 dark:text-emerald-400 capitalize'>
                        {recommendations[0]?.analysis?.moodState || 'Analyzing...'}
                      </div>
                    </div>
                    <div className='bg-blue-50/50 dark:bg-blue-900/20 p-3 rounded-lg'>
                      <div className='font-medium text-blue-700 dark:text-blue-300'>Confidence</div>
                      <div className='text-blue-600 dark:text-blue-400'>
                        {recommendations[0]?.analysis?.confidence ?
                          `${Math.round(recommendations[0].analysis.confidence * 100)}%` :
                          'N/A'
                        }
                      </div>
                    </div>
                    <div className='bg-purple-50/50 dark:bg-purple-900/20 p-3 rounded-lg'>
                      <div className='font-medium text-purple-700 dark:text-purple-300'>Intensity</div>
                      <div className='text-purple-600 dark:text-purple-400 capitalize'>
                        {recommendations[0]?.analysis?.intensity || 'Medium'}
                      </div>
                    </div>
                    <div className='bg-orange-50/50 dark:bg-orange-900/20 p-3 rounded-lg'>
                      <div className='font-medium text-orange-700 dark:text-orange-300'>Duration</div>
                      <div className='text-orange-600 dark:text-orange-400'>
                        {recommendations[0]?.analysis?.duration || 30} min
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className='text-center mb-8'>
                <div className='text-5xl mb-4 animate-bounce'>🤖</div>
                <h2 className='text-3xl font-light text-slate-700 dark:text-slate-200 mb-4'>Personalized Sound Therapy</h2>
                <p className='text-slate-600 dark:text-slate-400 font-light max-w-2xl mx-auto'>
                  AI-crafted soundscapes tailored to your unique emotional profile and wellness needs
                </p>
              </div>

              <div className='grid gap-6 md:grid-cols-2'>
                {recommendations.map((rec, index) => (
                  <div key={index} className='glass-card text-left animate-fade-in-gentle' style={{animationDelay: `${index * 0.2}s`}}>
                    <div className='flex items-center gap-3 mb-4'>
                      <div className='text-3xl'>
                        {rec.category.includes('anxiety') ? '😌' :
                         rec.category.includes('stress') ? '🧘' :
                         rec.category.includes('focus') ? '�' :
                         rec.category.includes('sleep') ? '😴' :
                         rec.category.includes('energy') ? '⚡' :
                         rec.category.includes('depression') ? '🌅' :
                         rec.category.includes('creative') ? '🎨' : '🎵'}
                      </div>
                      <div>
                        <h3 className='text-xl font-light text-slate-700 dark:text-slate-200 capitalize'>
                          {rec.category.replace('-', ' ').replace('_', ' ')}
                        </h3>
                        <div className='text-xs text-slate-500 dark:text-slate-400'>
                          Priority: {rec.priority || 'medium'}
                        </div>
                      </div>
                    </div>
                    <p className='text-sm text-slate-600 dark:text-slate-400 mb-4 leading-relaxed'>{rec.reason}</p>
                    <div className='space-y-3'>
                      {rec.sounds.map((sound, soundIndex) => (
                        <button
                          key={soundIndex}
                          onClick={() => playRecommendedSound(sound)}
                          className='w-full text-left p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-900/20 hover:bg-emerald-100/50 dark:hover:bg-emerald-800/30 transition-all duration-300 hover:scale-105 border border-emerald-200/50 dark:border-emerald-700/50 group'
                        >
                          <div className='flex items-center gap-3'>
                            <div className='text-2xl group-hover:animate-bounce'>
                              {sound.name.includes('Ocean') || sound.name.includes('Waves') ? '🌊' :
                               sound.name.includes('Rain') || sound.name.includes('Forest') ? '🌧️' :
                               sound.name.includes('Brown') || sound.name.includes('White') ? '🎼' :
                               sound.name.includes('Piano') || sound.name.includes('Jazz') ? '🎹' :
                               sound.name.includes('Birds') || sound.name.includes('Nature') ? '🐦' :
                               sound.name.includes('Wind') ? '💨' :
                               sound.name.includes('Fire') || sound.name.includes('Fireplace') ? '🔥' :
                               sound.name.includes('Tibetan') || sound.name.includes('Bowls') ? '🔔' :
                               sound.name.includes('Binaural') || sound.name.includes('Beats') ? '🧠' :
                               sound.name.includes('Chimes') || sound.name.includes('Meditation') ? '🎵' :
                               sound.name.includes('Stream') ? '🏞️' :
                               sound.name.includes('Heartbeat') ? '❤️' : '🎵'}
                            </div>
                            <div className='flex-1'>
                              <div className='font-medium text-slate-700 dark:text-slate-200'>{sound.name}</div>
                              <div className='text-xs text-slate-600 dark:text-slate-400 leading-tight'>{sound.benefit}</div>
                            </div>
                            <div className='text-lg opacity-50 group-hover:opacity-100 transition-opacity'>▶️</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className='glass-card max-w-2xl mx-auto mb-8 animate-float-gentle'>
              <div className='text-center py-8'>
                <div className='text-4xl mb-4'>🌱</div>
                <h3 className='text-xl font-light text-slate-700 dark:text-slate-200 mb-4'>No recommendations available</h3>
                <p className='text-slate-600 dark:text-slate-400 mb-6 font-light leading-relaxed'>
                  Dhwani needs some data to create personalized sound therapy recommendations.
                  Try writing in your journal, using Manthan for reflection, or tracking your mood to help our AI understand your needs better!
                </p>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
                  <div className='text-center p-4 bg-slate-50/50 dark:bg-slate-800/50 rounded-lg'>
                    <div className='text-2xl mb-2'>📝</div>
                    <div className='text-sm font-medium'>Write in Journal</div>
                    <div className='text-xs text-slate-600 dark:text-slate-400'>Share your thoughts</div>
                  </div>
                  <div className='text-center p-4 bg-slate-50/50 dark:bg-slate-800/50 rounded-lg'>
                    <div className='text-2xl mb-2'>🧠</div>
                    <div className='text-sm font-medium'>Use Manthan</div>
                    <div className='text-xs text-slate-600 dark:text-slate-400'>AI-powered reflection</div>
                  </div>
                  <div className='text-center p-4 bg-slate-50/50 dark:bg-slate-800/50 rounded-lg'>
                    <div className='text-2xl mb-2'>😊</div>
                    <div className='text-sm font-medium'>Track Mood</div>
                    <div className='text-xs text-slate-600 dark:text-slate-400'>Monitor emotional state</div>
                  </div>
                </div>
                <button
                  onClick={fetchRecommendations}
                  className='btn-primary animate-pulse-soft'
                >
                  🔄 Refresh Recommendations
                </button>
              </div>
            </div>
          )}

          {/* Manual Sound Selection */}
          <div className='glass-card max-w-2xl mx-auto animate-float-slow'>
            <div className='text-center mb-8'>
              <div className='text-5xl mb-4 animate-bounce'>🎧</div>
              <h2 className='text-3xl font-light text-slate-700 dark:text-slate-200 mb-4'>Quick Play</h2>
              <p className='text-slate-600 dark:text-slate-400 font-light'>Choose a soundscape to begin your journey of tranquility</p>
            </div>

            <div className='flex flex-col gap-6 items-center max-w-md mx-auto'>
              <div className='w-full'>
                <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 text-center'>
                  Choose your soundscape:
                </label>
                <select
                  className='w-full px-4 py-3 rounded-2xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200 dark:border-slate-600 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all duration-300 text-slate-700 dark:text-slate-200'
                  value={soundType}
                  onChange={handleChange}
                >
                  <option value="rain">🌧️ Rain</option>
                  <option value="waves">🌊 Ocean Waves</option>
                  <option value="brown-noise">🎼 Brown Noise</option>
                  <option value="forest">🌲 Forest</option>
                  <option value="birds">🐦 Bird Songs</option>
                  <option value="wind">💨 Wind</option>
                  <option value="fire">🔥 Fireplace</option>
                  <option value="tibetan-bowls">🔔 Tibetan Bowls</option>
                  <option value="piano">🎹 Soft Piano</option>
                  <option value="white-noise">🌫️ White Noise</option>
                  <option value="binaural-beats">🧠 Binaural Beats</option>
                  <option value="meditation-chimes">🎵 Meditation Chimes</option>
                  <option value="nature-stream">🏞️ Nature Stream</option>
                  <option value="heartbeat">❤️ Heartbeat</option>
                </select>
              </div>

              <div className='w-full'>
                <audio ref={audioRef} src={soundUrls[soundType]} style={{ width: '100%' }} controls className='rounded-2xl'>
                  Your browser does not support the audio element.
                </audio>
                <button
                  className='mt-6 btn-primary w-full animate-pulse-soft group'
                  onClick={handlePlay}
                >
                  <span className='text-2xl mr-2 group-hover:animate-bounce'>🌱</span>
                  Play & Plant Tree
                </button>
                {planted && (
                  <p className='text-sm text-emerald-600 dark:text-emerald-400 mt-3 font-light animate-fade-in-gentle'>
                    🌿 A beautiful tree has been planted in your grove!
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Guided Meditation Section */}
          <div className='glass-card max-w-2xl mx-auto mt-12 animate-float-slow'>
            <div className='text-center mb-8'>
              <div className='text-5xl mb-4 animate-bounce'>🧘</div>
              <h2 className='text-3xl font-light text-slate-700 dark:text-slate-200 mb-4'>Guided Meditation</h2>
              <p className='text-slate-600 dark:text-slate-400 font-light'>Calming scripts to guide your meditation practice</p>
            </div>

            <div className='flex flex-col gap-6 items-center max-w-md mx-auto'>
              <div className='w-full'>
                <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 text-center'>
                  Meditation Theme:
                </label>
                <input
                  type="text"
                  value={meditationTheme}
                  onChange={(e) => setMeditationTheme(e.target.value)}
                  className='w-full px-4 py-3 rounded-2xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200 dark:border-slate-600 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all duration-300 text-slate-700 dark:text-slate-200'
                  placeholder='Enter a theme for your meditation (e.g., beach, forest, mountains)'
                />
              </div>

              <div className='w-full'>
                <button
                  onClick={generateMeditation}
                  className='w-full px-4 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 transition-all duration-300 text-white font-medium flex items-center justify-center gap-2'
                >
                  {generating ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4zm16 0a8 8 0 01-8 8v-8h8z"></path>
                      </svg>
                      Generating...
                    </>
                  ) : (
                    <>
                      <span>🎶</span>
                      Generate Meditation Script
                    </>
                  )}
                </button>
              </div>

              {meditationScript && (
                <div className='w-full p-4 rounded-2xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700'>
                  <h3 className='text-lg font-medium text-slate-700 dark:text-slate-200 mb-2'>Your Meditation Script</h3>
                  <p className='text-slate-600 dark:text-slate-400 leading-relaxed' style={{ whiteSpace: 'pre-line' }}>
                    {meditationScript}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Guided Meditation Generator */}
          <div className='glass-card max-w-2xl mx-auto mt-8 animate-float-slow'>
            <div className='text-center mb-8'>
              <div className='text-5xl mb-4 animate-bounce'>🧘</div>
              <h2 className='text-3xl font-light text-slate-700 dark:text-slate-200 mb-4'>Guided Meditation</h2>
              <p className='text-slate-600 dark:text-slate-400 font-light'>AI-generated personalized meditation scripts</p>
            </div>

            <div className='flex flex-col gap-4 items-center max-w-md mx-auto'>
              <input
                type='text'
                placeholder='Enter meditation theme (e.g., stress relief, self-love)'
                value={meditationTheme}
                onChange={(e) => setMeditationTheme(e.target.value)}
                className='w-full px-4 py-3 rounded-2xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200 dark:border-slate-600 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all duration-300 text-slate-700 dark:text-slate-200'
              />
              <button
                onClick={generateMeditation}
                disabled={generating || !meditationTheme.trim()}
                className='btn-primary w-full animate-pulse-soft disabled:opacity-50'
              >
                {generating ? 'Generating...' : '✨ Generate Meditation'}
              </button>
            </div>

            {meditationScript && (
              <div className='mt-6 p-4 bg-slate-50/50 dark:bg-slate-800/50 rounded-2xl'>
                <h3 className='text-lg font-medium text-slate-700 dark:text-slate-200 mb-3'>Your Meditation Script</h3>
                <div className='text-sm text-slate-600 dark:text-slate-400 whitespace-pre-line leading-relaxed'>
                  {meditationScript}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </RequireAuth>
  );
}
