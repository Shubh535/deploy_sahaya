// COPY THIS ENTIRE FILE TO: src/app/sanjha-grove/page.tsx
// This version includes:
// 1. Lighter background colors (blue-50, indigo-100, etc instead of blue-900)
// 2. Left column: 4 stat cards stacked vertically
// 3. Right column: 2 charts (Timeline & Distribution) stacked vertically
// 4. Better text colors for lighter background (slate-800 instead of white)
// 5. Fixed height charts (400px each)
// 6. Improved spacing and aesthetic layout

'use client';

import React, { useState, useEffect } from 'react';
import RequireAuth from '../components/RequireAuth';
import Tree from './Tree';
import { useGarden } from './useGarden';
import { LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { getIdToken } from '../utils/getIdToken';
import { useAuth } from '../components/AuthProvider';

function getGradientByHour(hour: number) {
  // Lighter shades for better contrast
  if (hour < 6) return 'from-blue-300 via-indigo-300 to-purple-300';
  if (hour < 10) return 'from-blue-100 via-indigo-50 to-pink-100';
  if (hour < 17) return 'from-blue-50 via-indigo-100 to-green-50';
  if (hour < 20) return 'from-pink-100 via-indigo-200 to-purple-100';
  return 'from-blue-300 via-indigo-300 to-purple-300';
}

export default function SanjhaGrovePage() {
  const { user, loading } = useAuth();
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

  const [analytics, setAnalytics] = useState<any>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [timeRange, setTimeRange] = useState('30');
  const [showAnalytics, setShowAnalytics] = useState(true);

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

  useEffect(() => {
    // Don't fetch analytics until auth is loaded and user is authenticated
    if (loading || !user) return;
    
    const fetchAnalytics = async () => {
      setLoadingAnalytics(true);
      try {
        const token = await getIdToken();
        const res = await fetch(`/api/grove/analytics?timeRange=${timeRange}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          setAnalytics(data);
        }
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoadingAnalytics(false);
      }
    };
    fetchAnalytics();
  }, [timeRange, user, loading]);

  const MOOD_COLORS: { [key: string]: string } = {
    happy: '#10b981',
    calm: '#06b6d4',
    neutral: '#6366f1',
    anxious: '#f59e0b',
    sad: '#3b82f6',
    angry: '#ef4444',
  };

  const moodEmojis: { [key: string]: string } = {
    happy: '😊',
    calm: '😌',
    neutral: '😐',
    anxious: '😰',
    sad: '😢',
    angry: '😡',
  };

  return (
    <RequireAuth>
      <main className='relative flex flex-col items-center justify-center min-h-screen px-4 py-12 overflow-hidden w-full'>
        <div className={`fixed inset-0 -z-10 transition-all duration-1000 bg-gradient-to-br ${gradient}`} />

        <div className='absolute top-16 left-12 text-5xl animate-bubble-gentle opacity-30'>🌸</div>
        <div className='absolute top-32 right-20 text-4xl animate-bubble-flow opacity-25'>🌳</div>
        <div className='absolute bottom-40 left-16 text-6xl animate-bubble-dance opacity-20'>🌿</div>
        <div className='absolute bottom-24 right-12 text-4xl animate-float-gentle opacity-35'>🕊️</div>
        <div className='absolute top-1/2 left-8 text-3xl animate-drift opacity-40'>✨</div>
        <div className='absolute top-3/4 right-16 text-5xl animate-float-slow opacity-25'>🌙</div>
        <div className='absolute top-20 left-1/3 text-4xl animate-breathe opacity-30'>🌱</div>
        <div className='absolute bottom-32 right-1/3 text-3xl animate-float-wave opacity-35'>🌸</div>

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

        <div className='relative z-10 w-full max-w-7xl mx-auto text-center px-4'>
          <header className='mb-12 animate-fade-in-gentle'>
            <div className='text-7xl mb-6 animate-pulse-soft'>🌳</div>
            <h1 className='text-5xl sm:text-6xl md:text-7xl font-light mb-4 text-slate-800 dark:text-white drop-shadow-lg tracking-wide'>
              Sanjha Grove
            </h1>
            <p className='text-lg sm:text-xl text-slate-700 dark:text-white/90 max-w-2xl mx-auto leading-relaxed font-light drop-shadow'>
              A shared digital sanctuary where every positive action blossoms into a glowing tree.
            </p>
          </header>

          {analytics && (
            <div className='mb-12'>
              <div className='flex items-center justify-between mb-6 glass-card p-4 rounded-2xl'>
                <div className='flex items-center gap-3'>
                  <span className='text-3xl'>📊</span>
                  <div className='text-left'>
                    <h2 className='text-2xl font-light text-slate-800 dark:text-white'>Your Growth Journey</h2>
                    <p className='text-sm text-slate-600 dark:text-white/70'>Track your mindfulness patterns</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAnalytics(!showAnalytics)}
                  className='px-5 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-slate-800 dark:text-white font-medium transition-all duration-300 hover:scale-105'
                >
                  {showAnalytics ? '👁️ Hide' : '👁️ Show'}
                </button>
              </div>

              {showAnalytics && (
                <div className='space-y-8 animate-fade-in-gentle'>
                  <div className='flex justify-center gap-2'>
                    {[
                      { label: '7 Days', value: '7', emoji: '📅' },
                      { label: '30 Days', value: '30', emoji: '📆' },
                      { label: '90 Days', value: '90', emoji: '🗓️' },
                    ].map(range => (
                      <button
                        key={range.value}
                        onClick={() => setTimeRange(range.value)}
                        className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 ${
                          timeRange === range.value
                            ? 'bg-emerald-500 text-white shadow-xl scale-105'
                            : 'glass-card text-slate-800 dark:text-white hover:scale-105'
                        }`}
                      >
                        <span>{range.emoji}</span>
                        <span>{range.label}</span>
                      </button>
                    ))}
                  </div>

                  <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
                    <div className='lg:col-span-1 space-y-4'>
                      <div className='glass-card p-6 text-center hover:scale-105 transition-transform duration-300 cursor-pointer group'>
                        <div className='text-5xl mb-3 group-hover:scale-110 transition-transform'>🌳</div>
                        <div className='text-4xl font-bold text-slate-800 dark:text-white mb-2'>{analytics.overview.totalTrees}</div>
                        <div className='text-xs uppercase tracking-wider text-slate-600 dark:text-white/70 font-medium'>Total Trees</div>
                      </div>

                      <div className='glass-card p-6 text-center hover:scale-105 transition-transform duration-300 cursor-pointer group'>
                        <div className='text-5xl mb-3 group-hover:scale-110 transition-transform'>🔥</div>
                        <div className='text-4xl font-bold text-slate-800 dark:text-white mb-2'>{analytics.overview.currentStreak}</div>
                        <div className='text-xs uppercase tracking-wider text-slate-600 dark:text-white/70 font-medium'>Day Streak</div>
                      </div>

                      <div className='glass-card p-6 text-center hover:scale-105 transition-transform duration-300 cursor-pointer group'>
                        <div className='text-5xl mb-3 group-hover:scale-110 transition-transform'>📅</div>
                        <div className='text-4xl font-bold text-slate-800 dark:text-white mb-2'>{analytics.overview.activeDaysThisMonth}</div>
                        <div className='text-xs uppercase tracking-wider text-slate-600 dark:text-white/70 font-medium'>Active Days</div>
                      </div>

                      <div className='glass-card p-6 text-center hover:scale-105 transition-transform duration-300 cursor-pointer group'>
                        <div className='text-5xl mb-3 group-hover:scale-110 transition-transform'>
                          {moodEmojis[analytics.overview.dominantMood] || '💭'}
                        </div>
                        <div className='text-2xl font-bold text-slate-800 dark:text-white mb-2 capitalize'>
                          {analytics.overview.dominantMood}
                        </div>
                        <div className='text-xs uppercase tracking-wider text-slate-600 dark:text-white/70 font-medium'>Dominant Mood</div>
                      </div>
                    </div>

                    <div className='lg:col-span-2 space-y-4'>
                      <div className='glass-card p-8 hover:shadow-2xl transition-shadow duration-300 h-[400px]'>
                        <div className='flex items-center justify-between mb-6'>
                          <h3 className='text-2xl font-light text-slate-800 dark:text-white flex items-center gap-3'>
                            <span className='text-3xl'>📈</span>
                            <span>Mood Timeline</span>
                          </h3>
                        </div>
                        <ResponsiveContainer width="100%" height="85%">
                          <LineChart data={analytics.timeline}>
                            <XAxis 
                              dataKey="date" 
                              stroke="rgba(100,100,100,0.5)"
                              tick={{ fill: 'rgba(51,51,51,0.8)', fontSize: 11 }}
                              tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            />
                            <YAxis 
                              stroke="rgba(100,100,100,0.3)"
                              tick={{ fill: 'rgba(51,51,51,0.6)', fontSize: 11 }}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                border: 'none',
                                borderRadius: '16px',
                                padding: '16px',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                              }}
                              labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { 
                                weekday: 'short', 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="count" 
                              stroke="#10b981" 
                              strokeWidth={4}
                              dot={{ fill: '#10b981', r: 6, strokeWidth: 2, stroke: '#fff' }}
                              activeDot={{ r: 10, stroke: '#fff', strokeWidth: 3 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>

                      <div className='glass-card p-8 hover:shadow-2xl transition-shadow duration-300 h-[400px]'>
                        <div className='flex items-center justify-between mb-6'>
                          <h3 className='text-2xl font-light text-slate-800 dark:text-white flex items-center gap-3'>
                            <span className='text-3xl'>🎨</span>
                            <span>Mood Distribution</span>
                          </h3>
                        </div>
                        <ResponsiveContainer width="100%" height="85%">
                          <PieChart>
                            <Pie
                              data={analytics.moodDistribution}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ mood, percentage }) => `${mood}: ${percentage}%`}
                              outerRadius={100}
                              fill="#8884d8"
                              dataKey="count"
                              stroke="#fff"
                              strokeWidth={2}
                            >
                              {analytics.moodDistribution.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={MOOD_COLORS[entry.mood] || '#6366f1'} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                border: 'none',
                                borderRadius: '16px',
                                padding: '16px',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {analytics.insights && analytics.insights.length > 0 && (
                    <div className='glass-card p-8'>
                      <div className='flex items-center gap-3 mb-6'>
                        <span className='text-4xl'>💡</span>
                        <h3 className='text-2xl font-light text-slate-800 dark:text-white'>Your Insights</h3>
                      </div>
                      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                        {analytics.insights.map((insight: string, index: number) => (
                          <div
                            key={index}
                            className='bg-white/15 backdrop-blur-sm rounded-2xl p-6 text-slate-700 dark:text-white/90 font-light hover:bg-white/20 transition-all duration-300 hover:scale-105 cursor-pointer border border-white/10'
                          >
                            <p className='text-sm leading-relaxed'>{insight}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className='glass-card hover:shadow-2xl transition-shadow duration-500 mb-12'>
            <div className='p-8'>
              <div className='flex items-center justify-center gap-4 mb-8'>
                <div className='text-5xl animate-bounce'>🌱</div>
                <div className='text-center'>
                  <h2 className='text-3xl font-light text-slate-700 dark:text-slate-100 mb-2'>
                    Our Collective Garden
                  </h2>
                  <div className='flex items-center justify-center gap-2'>
                    <div className='h-2 w-2 bg-emerald-500 rounded-full animate-pulse'></div>
                    <p className='text-lg text-slate-600 dark:text-slate-300 font-light'>
                      {trees.length} {trees.length === 1 ? 'tree' : 'trees'} planted by our community
                    </p>
                    <div className='h-2 w-2 bg-emerald-500 rounded-full animate-pulse'></div>
                  </div>
                </div>
                <div className='text-5xl animate-bounce' style={{ animationDelay: '0.2s' }}>🌿</div>
              </div>

              <div className='relative w-full h-[500px] md:h-[600px] overflow-hidden rounded-3xl border-2 border-white/40 shadow-2xl bg-gradient-to-b from-white/30 via-emerald-50/40 to-emerald-100/50 backdrop-blur-sm'>
                <div className='absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-emerald-200/30 to-transparent'></div>
                
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
                  <div className='absolute inset-0 flex flex-col items-center justify-center text-slate-600 dark:text-white/80 animate-fade-in-gentle'>
                    <div className='text-8xl mb-6 animate-bounce'>🌱</div>
                    <p className='text-2xl font-light mb-3'>Our garden awaits your first seed</p>
                    <p className='text-base font-light text-slate-500 dark:text-white/60 max-w-md text-center'>
                      Journal your thoughts and watch your tree blossom here
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className='glass-card max-w-3xl mx-auto hover:scale-105 transition-transform duration-500'>
            <div className='text-center p-10'>
              <div className='text-6xl mb-6 animate-pulse-soft'>✨</div>
              <h3 className='text-2xl font-light text-slate-700 dark:text-slate-100 mb-4'>
                Every Action Matters
              </h3>
              <p className='text-base text-slate-600 dark:text-slate-300 leading-relaxed font-light'>
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
