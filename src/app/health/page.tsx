"use client";
import React, { useEffect, useState } from "react";
import { apiRequest } from "../utils/apiClient";
import RequireAuth from "../components/RequireAuth";
import { useAuth } from "../components/AuthProvider";

interface HealthData {
  steps?: number;
  heartRate?: number;
  sleep?: number;
  sleepQuality?: number;
  activityLevel?: string;
  activityDescription?: string;
  waterIntake?: number;
  stressLevel?: number;
  mood?: string;
  screenTime?: number;
  notes?: string;
  timestamp?: number;
  streak?: number;
  badges?: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    earnedAt: number;
  }>;
}

interface Insight {
  type: string;
  title: string;
  message: string;
  priority: string;
}

interface MealSuggestion {
  name: string;
  ingredients: string[];
  prepTime: string;
  benefits: string;
  calories: string;
}

const MOOD_OPTIONS = [
  { value: 'happy', emoji: '😊', label: 'Happy' },
  { value: 'calm', emoji: '😌', label: 'Calm' },
  { value: 'anxious', emoji: '😰', label: 'Anxious' },
  { value: 'stressed', emoji: '😫', label: 'Stressed' },
  { value: 'energetic', emoji: '⚡', label: 'Energetic' },
  { value: 'tired', emoji: '😴', label: 'Tired' },
  { value: 'neutral', emoji: '😐', label: 'Neutral' }
];

const ACTIVITY_SUGGESTIONS = [
  'Morning jog', 'Evening walk', 'Yoga session', 'Gym workout', 'Swimming', 
  'Cycling', 'Dance practice', 'Study break stretch', 'Basketball game', 'Badminton'
];

export default function HealthPage() {
  const { user, loading: authLoading } = useAuth();
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState<Partial<HealthData>>({
    steps: 0,
    heartRate: 70,
    sleep: 7,
    sleepQuality: 7,
    activityLevel: 'moderate',
    activityDescription: '',
    waterIntake: 6,
    stressLevel: 5,
    mood: 'neutral',
    screenTime: 240,
    notes: ''
  });
  const [saving, setSaving] = useState(false);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [mealSuggestions, setMealSuggestions] = useState<MealSuggestion[]>([]);
  const [loadingMeals, setLoadingMeals] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatResponse, setChatResponse] = useState('');
  const [chatting, setChatting] = useState(false);
  const [showActivitySuggestions, setShowActivitySuggestions] = useState(false);
  const [particles, setParticles] = useState<Array<{
    left: string;
    top: string;
    animationDelay: string;
    animationDuration: string;
    size: string;
    color: string;
  }>>([]);

  // Generate particles
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

  // Fetch health data
  useEffect(() => {
    if (authLoading || !user) return;
    const fetchHealth = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await apiRequest("/api/health", { method: "GET" });
        setHealth(data);
        // Pre-fill form with existing data
        setForm(prev => ({ ...prev, ...data }));
      } catch (err: any) {
        if (err?.response?.status !== 404) {
          setError(err?.response?.data?.error || err.message || "Failed to fetch health data");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchHealth();
  }, [authLoading, user]);

  // Auto-fetch insights when data exists
  useEffect(() => {
    if (health && !loadingInsights && insights.length === 0) {
      fetchInsights();
    }
  }, [health]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setForm({ ...form, [name]: type === 'number' ? Number(value) : value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await apiRequest("/api/health", {
        method: "POST",
        body: JSON.stringify({ ...form, timestamp: Date.now() }),
      });
      setHealth({ ...form as HealthData, streak: response.streak, timestamp: Date.now() });
      
      // Show success animation
      alert(`✨ Data saved! Your streak: ${response.streak} days 🔥`);
      
      // Refresh insights
      fetchInsights();
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || "Failed to save health data");
    } finally {
      setSaving(false);
    }
  };

  const fetchInsights = async () => {
    setLoadingInsights(true);
    try {
      const data = await apiRequest("/api/health/insights", { method: "POST" });
      setInsights(data.insights || []);
    } catch (err) {
      console.error('Failed to fetch insights:', err);
    } finally {
      setLoadingInsights(false);
    }
  };

  const fetchMeals = async (mealType: string) => {
    setLoadingMeals(true);
    try {
      const data = await apiRequest("/api/health/nutrition", {
        method: "POST",
        body: JSON.stringify({
          mealType,
          activityLevel: form.activityLevel,
          studyIntensity: 'moderate'
        })
      });
      setMealSuggestions(data.suggestions || []);
    } catch (err) {
      console.error('Failed to fetch meal suggestions:', err);
    } finally {
      setLoadingMeals(false);
    }
  };

  const sendChatMessage = async () => {
    if (!chatMessage.trim()) return;
    setChatting(true);
    try {
      const data = await apiRequest("/api/health/chat", {
        method: "POST",
        body: JSON.stringify({ message: chatMessage })
      });
      setChatResponse(data.response || 'I am here to help! Ask me anything about wellness, nutrition, or study habits.');
    } catch (err) {
      console.error('Chat error:', err);
      setChatResponse('Sorry, I encountered an error. Please try again!');
    } finally {
      setChatting(false);
    }
  };

  if (authLoading) {
    return (
      <RequireAuth>
        <main className='relative flex flex-col items-center justify-center min-h-screen px-4 py-12 overflow-hidden'>
          <div className='absolute inset-0 z-0 animate-gradient-flow' />
          <div className='relative z-10 glass-card p-8 text-center animate-float-gentle'>
            <div className='animate-spin text-4xl mb-4'>🌀</div>
            <p className='text-slate-600 dark:text-slate-400 font-light'>Preparing your wellness space...</p>
          </div>
        </main>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <main className='relative flex flex-col items-center min-h-screen px-4 py-12 overflow-hidden'>
        {/* Background */}
        <div className='absolute inset-0 z-0 animate-gradient-flow' />
        
        {/* Floating elements */}
        <div className='absolute top-16 left-12 text-5xl animate-bubble-gentle opacity-30'>🌸</div>
        <div className='absolute top-32 right-20 text-4xl animate-bubble-flow opacity-25'>💓</div>
        <div className='absolute bottom-40 left-16 text-6xl animate-bubble-dance opacity-20'>🌿</div>
        <div className='absolute top-20 left-1/3 text-4xl animate-breathe opacity-30'>🌱</div>

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
          <header className='text-center mb-12 animate-fade-in-gentle'>
            <div className='text-7xl mb-6 animate-pulse-soft'>🧠</div>
            <h1 className='text-6xl sm:text-7xl font-light mb-4 text-slate-700 dark:text-slate-200 tracking-wide'>
              Sahay Sense
            </h1>
            <p className='text-xl sm:text-2xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed font-light mb-4'>
              Your intelligent wellness companion. Track, learn, and grow every day. 🌿
            </p>
            
            {/* Streak & Badges */}
            {health?.streak !== undefined && health.streak > 0 && (
              <div className='flex items-center justify-center gap-6 mt-6'>
                <div className='glass-card px-6 py-3 inline-flex items-center gap-3 animate-bounce'>
                  <span className='text-3xl'>🔥</span>
                  <div>
                    <div className='text-2xl font-bold text-emerald-600 dark:text-emerald-400'>{health.streak} Days</div>
                    <div className='text-xs text-slate-600 dark:text-slate-400'>Logging Streak!</div>
                  </div>
                </div>
                
                {health.badges && health.badges.length > 0 && (
                  <div className='glass-card px-6 py-3'>
                    <div className='flex gap-2'>
                      {health.badges.slice(0, 3).map((badge, i) => (
                        <div key={i} className='text-3xl animate-bounce' title={badge.name} style={{ animationDelay: `${i * 0.1}s` }}>
                          {badge.icon}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </header>

          {/* AI Insights Section */}
          {insights.length > 0 && (
            <div className='mb-8 animate-fade-in-gentle'>
              <h2 className='text-2xl font-light mb-4 text-slate-700 dark:text-slate-200 flex items-center gap-2'>
                <span>💡</span> Your Wellness Insights
              </h2>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {insights.map((insight, i) => (
                  <div 
                    key={i}
                    className={`glass-card animate-float-gentle border-l-4 ${
                      insight.priority === 'high' ? 'border-red-400' :
                      insight.priority === 'medium' ? 'border-yellow-400' :
                      'border-blue-400'
                    }`}
                    style={{ animationDelay: `${i * 0.1}s` }}
                  >
                    <h3 className='font-medium text-lg mb-2'>{insight.title}</h3>
                    <p className='text-sm text-slate-600 dark:text-slate-400'>{insight.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Daily Wellness Journal Form */}
          <div className='glass-card mb-8 animate-float-wave'>
            <div className='text-center mb-6'>
              <h2 className='text-3xl font-light text-slate-700 dark:text-slate-200 mb-2'>Today's Wellness Journal 📝</h2>
              <p className='text-slate-600 dark:text-slate-400 font-light'>Log your day to unlock personalized insights</p>
            </div>
            
            <form onSubmit={handleSubmit} className='space-y-6'>
              {/* Mood Selection */}
              <div className='space-y-3'>
                <label className='block text-sm font-medium text-slate-700 dark:text-slate-300'>How are you feeling today? 💭</label>
                <div className='grid grid-cols-4 md:grid-cols-7 gap-3'>
                  {MOOD_OPTIONS.map(mood => (
                    <button
                      key={mood.value}
                      type='button'
                      onClick={() => setForm({ ...form, mood: mood.value })}
                      className={`p-4 rounded-2xl border-2 transition-all duration-300 hover:scale-110 ${
                        form.mood === mood.value
                          ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 shadow-lg'
                          : 'border-slate-200 dark:border-slate-600 bg-white/50 dark:bg-slate-800/50'
                      }`}
                    >
                      <div className='text-3xl mb-1'>{mood.emoji}</div>
                      <div className='text-xs'>{mood.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sleep & Sleep Quality */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div className='space-y-2'>
                  <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2'>
                    <span>😴</span> Sleep Duration (hours)
                  </label>
                  <input
                    type="number"
                    name="sleep"
                    className='w-full px-4 py-3 rounded-2xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200 dark:border-slate-600 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all duration-300'
                    value={form.sleep}
                    onChange={handleChange}
                    min={0}
                    max={24}
                    step={0.5}
                  />
                </div>
                <div className='space-y-2'>
                  <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2'>
                    <span>✨</span> Sleep Quality (1-10)
                  </label>
                  <input
                    type="range"
                    name="sleepQuality"
                    className='w-full h-3 rounded-lg appearance-none cursor-pointer'
                    value={form.sleepQuality}
                    onChange={handleChange}
                    min={1}
                    max={10}
                  />
                  <div className='text-center text-2xl font-bold text-emerald-600 dark:text-emerald-400'>{form.sleepQuality}/10</div>
                </div>
              </div>

              {/* Activity Level & Description with Autocomplete */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div className='space-y-2'>
                  <label className='block text-sm font-medium text-slate-700 dark:text-slate-300'>Activity Level</label>
                  <select
                    name="activityLevel"
                    className='w-full px-4 py-3 rounded-2xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200 dark:border-slate-600 focus:border-emerald-400'
                    value={form.activityLevel}
                    onChange={handleChange}
                  >
                    <option value="low">Low (Mostly sitting)</option>
                    <option value="moderate">Moderate (Some activity)</option>
                    <option value="high">High (Very active)</option>
                  </select>
                </div>
                <div className='space-y-2 relative'>
                  <label className='block text-sm font-medium text-slate-700 dark:text-slate-300'>Activity Description</label>
                  <input
                    type="text"
                    name="activityDescription"
                    placeholder="e.g., Morning jog, Yoga..."
                    className='w-full px-4 py-3 rounded-2xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200 dark:border-slate-600 focus:border-emerald-400'
                    value={form.activityDescription}
                    onChange={handleChange}
                    onFocus={() => setShowActivitySuggestions(true)}
                    onBlur={() => setTimeout(() => setShowActivitySuggestions(false), 200)}
                  />
                  {showActivitySuggestions && (
                    <div className='absolute z-20 w-full mt-1 glass-card max-h-40 overflow-y-auto'>
                      {ACTIVITY_SUGGESTIONS.filter(s => 
                        s.toLowerCase().includes((form.activityDescription || '').toLowerCase())
                      ).map((suggestion, i) => (
                        <button
                          key={i}
                          type='button'
                          className='w-full text-left px-4 py-2 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors'
                          onClick={() => {
                            setForm({ ...form, activityDescription: suggestion });
                            setShowActivitySuggestions(false);
                          }}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Hydration, Stress, Screen Time */}
              <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                <div className='space-y-2'>
                  <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2'>
                    <span>💧</span> Water Intake (glasses)
                  </label>
                  <input
                    type="number"
                    name="waterIntake"
                    className='w-full px-4 py-3 rounded-2xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200 dark:border-slate-600 focus:border-emerald-400'
                    value={form.waterIntake}
                    onChange={handleChange}
                    min={0}
                  />
                </div>
                <div className='space-y-2'>
                  <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2'>
                    <span>😰</span> Stress Level (1-10)
                  </label>
                  <input
                    type="range"
                    name="stressLevel"
                    className='w-full h-3 rounded-lg appearance-none cursor-pointer'
                    value={form.stressLevel}
                    onChange={handleChange}
                    min={1}
                    max={10}
                  />
                  <div className='text-center text-lg font-bold text-slate-700 dark:text-slate-300'>{form.stressLevel}/10</div>
                </div>
                <div className='space-y-2'>
                  <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2'>
                    <span>📱</span> Screen Time (mins)
                  </label>
                  <input
                    type="number"
                    name="screenTime"
                    className='w-full px-4 py-3 rounded-2xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200 dark:border-slate-600 focus:border-emerald-400'
                    value={form.screenTime}
                    onChange={handleChange}
                    min={0}
                  />
                </div>
              </div>

              {/* Steps & Heart Rate */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div className='space-y-2'>
                  <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2'>
                    <span>👣</span> Steps Today
                  </label>
                  <input
                    type="number"
                    name="steps"
                    className='w-full px-4 py-3 rounded-2xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200 dark:border-slate-600 focus:border-emerald-400'
                    value={form.steps}
                    onChange={handleChange}
                    min={0}
                  />
                </div>
                <div className='space-y-2'>
                  <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2'>
                    <span>❤️</span> Heart Rate (bpm)
                  </label>
                  <input
                    type="number"
                    name="heartRate"
                    className='w-full px-4 py-3 rounded-2xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200 dark:border-slate-600 focus:border-emerald-400'
                    value={form.heartRate}
                    onChange={handleChange}
                    min={40}
                    max={200}
                  />
                </div>
              </div>

              {/* Notes */}
              <div className='space-y-2'>
                <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2'>
                  <span>📓</span> Daily Notes (optional)
                </label>
                <textarea
                  name="notes"
                  placeholder="How was your day? Any observations?"
                  rows={3}
                  className='w-full px-4 py-3 rounded-2xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200 dark:border-slate-600 focus:border-emerald-400 resize-none'
                  value={form.notes}
                  onChange={handleChange}
                />
              </div>

              {error && (
                <div className='glass-card bg-red-50/50 dark:bg-red-900/10 border-red-200/50 dark:border-red-700/50 p-4 text-center'>
                  <p className='text-red-600 dark:text-red-400'>{error}</p>
                </div>
              )}

              <button
                type="submit"
                className='w-full btn-primary disabled:opacity-60 transition-all duration-300 hover:scale-105'
                disabled={saving}
              >
                {saving ? (
                  <span className='flex items-center justify-center gap-2'>
                    <div className='animate-spin'>🌀</div>
                    Saving...
                  </span>
                ) : (
                  '💾 Save Today\'s Wellness Data'
                )}
              </button>
            </form>
          </div>

          {/* Nutrition Suggestions */}
          <div className='glass-card mb-8 animate-float-gentle'>
            <div className='text-center mb-6'>
              <h2 className='text-3xl font-light text-slate-700 dark:text-slate-200 mb-2'>🍎 Nutrition Buddy</h2>
              <p className='text-slate-600 dark:text-slate-400 font-light'>Get personalized meal ideas for students</p>
            </div>
            
            <div className='flex gap-3 justify-center mb-6'>
              {['breakfast', 'lunch', 'dinner', 'snack'].map(meal => (
                <button
                  key={meal}
                  onClick={() => fetchMeals(meal)}
                  className='px-6 py-3 rounded-2xl bg-emerald-100 dark:bg-emerald-900/50 hover:bg-emerald-200 dark:hover:bg-emerald-800/50 text-emerald-700 dark:text-emerald-300 font-medium transition-all duration-300 hover:scale-105 capitalize'
                  disabled={loadingMeals}
                >
                  {meal}
                </button>
              ))}
            </div>

            {loadingMeals && (
              <div className='text-center py-8'>
                <div className='animate-spin text-4xl mb-2'>🌀</div>
                <p className='text-slate-600 dark:text-slate-400'>Cooking up suggestions...</p>
              </div>
            )}

            {!loadingMeals && mealSuggestions.length > 0 && (
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                {mealSuggestions.map((meal, i) => (
                  <div key={i} className='bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl p-4 border border-slate-200 dark:border-slate-600'>
                    <h3 className='font-medium text-lg mb-2 text-emerald-600 dark:text-emerald-400'>{meal.name}</h3>
                    <p className='text-xs text-slate-500 dark:text-slate-400 mb-2'>⏱️ {meal.prepTime} • {meal.calories}</p>
                    <p className='text-sm text-slate-600 dark:text-slate-300 mb-3'>{meal.benefits}</p>
                    <div className='text-xs text-slate-500 dark:text-slate-400'>
                      <strong>Ingredients:</strong> {meal.ingredients.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Gemini Chat Companion */}
          <div className='glass-card animate-float-wave'>
            <div className='text-center mb-6'>
              <h2 className='text-3xl font-light text-slate-700 dark:text-slate-200 mb-2'>💬 Ask Sahay Sense</h2>
              <p className='text-slate-600 dark:text-slate-400 font-light'>Your wellness questions, answered</p>
            </div>
            
            <div className='space-y-4'>
              <textarea
                placeholder="e.g., 'What's a quick dinner after evening classes?' or 'How to calm down before a presentation?'"
                rows={3}
                className='w-full px-4 py-3 rounded-2xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200 dark:border-slate-600 focus:border-emerald-400 resize-none'
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
              />
              
              <button
                onClick={sendChatMessage}
                className='w-full btn-primary disabled:opacity-60'
                disabled={chatting || !chatMessage.trim()}
              >
                {chatting ? '🤔 Thinking...' : '💬 Ask'}
              </button>

              {chatResponse && (
                <div className='bg-emerald-50/70 dark:bg-emerald-900/30 rounded-2xl p-6 border-2 border-emerald-200 dark:border-emerald-700'>
                  <div className='flex items-start gap-3'>
                    <span className='text-3xl'>🧠</span>
                    <p className='text-slate-700 dark:text-slate-200 leading-relaxed'>{chatResponse}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </RequireAuth>
  );
}
