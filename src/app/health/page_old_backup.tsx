"use client";
import React, { useEffect, useState } from "react";
import { apiRequest } from "../utils/apiClient";
import RequireAuth from "../components/RequireAuth";
import { useAuth } from "../components/AuthProvider";

interface HealthData {
  steps?: number;
  heartRate?: number;
  sleep?: number;
  timestamp?: number;
}

export default function HealthPage() {
  const { user, loading: authLoading } = useAuth();
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState<HealthData>({ steps: 0, heartRate: 0, sleep: 0 });
  const [saving, setSaving] = useState(false);
  const [fitConnected, setFitConnected] = useState(false);
  const [syncing, setSyncing] = useState(false);
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

  // Check if Google Fit is connected (token exists)
  useEffect(() => {
    if (authLoading || !user) return;
    async function checkFit() {
      try {
        await apiRequest("/fit/sync", { method: "POST" });
        setFitConnected(true);
      } catch {
        setFitConnected(false);
      }
    }
    checkFit();
  }, [authLoading, user]);
  // Google Fit connect handler
  const handleConnectFit = () => {
    window.location.href = "/api/fit/auth";
  };

  // Google Fit sync handler
  const handleSyncFit = async () => {
    setSyncing(true);
    setError("");
    try {
      const res = await apiRequest("/fit/sync", { method: "POST" });
      // TODO: Parse and update health state with real data from backend
      setHealth((h) => ({ ...h, ...res }));
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || "Failed to sync with Google Fit");
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    if (authLoading || !user) return;
    const fetchHealth = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await apiRequest("/health", { method: "GET" });
        setHealth(data);
      } catch (err: any) {
        setError(err?.response?.data?.error || err.message || "Failed to fetch health data");
      } finally {
        setLoading(false);
      }
    };
    fetchHealth();
  }, [authLoading, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: Number(e.target.value) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await apiRequest("/health", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setHealth({ ...form, timestamp: Date.now() });
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || "Failed to save health data");
    } finally {
      setSaving(false);
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
      <main className='relative flex flex-col items-center justify-center min-h-screen px-4 py-12 overflow-hidden'>
        {/* Soothing gradient background with animation */}
        <div className='absolute inset-0 z-0 animate-gradient-flow' />

        {/* Floating nature elements */}
        <div className='absolute top-16 left-12 text-5xl animate-bubble-gentle opacity-30'>🌸</div>
        <div className='absolute top-32 right-20 text-4xl animate-bubble-flow opacity-25'>💓</div>
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
        <div className='relative z-10 w-full max-w-4xl mx-auto text-center'>
          {/* Header */}
          <header className='mb-12 animate-fade-in-gentle'>
            <div className='text-7xl mb-6 animate-pulse-soft'>💓</div>
            <h1 className='text-6xl sm:text-7xl font-light mb-4 text-slate-700 dark:text-slate-200 tracking-wide'>
              Health Dashboard
            </h1>
            <p className='text-xl sm:text-2xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed font-light mb-8'>
              Nurture your body and mind with gentle health tracking. Your wellness journey begins here.
            </p>
          </header>

          {/* Google Fit Integration */}
          <div className='glass-card max-w-2xl mx-auto mb-8 animate-float-gentle'>
            <div className='text-center mb-6'>
              <div className='text-4xl mb-4 animate-bounce'>🔗</div>
              <h3 className='text-xl font-light text-slate-700 dark:text-slate-200 mb-2'>Google Fit Integration</h3>
              <p className='text-slate-600 dark:text-slate-400 font-light'>Connect your health data for seamless wellness tracking</p>
            </div>
            <div className='flex flex-col sm:flex-row gap-4 justify-center'>
              <button
                className={`px-6 py-3 rounded-2xl font-medium transition-all duration-300 hover:scale-105 ${
                  fitConnected
                    ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border-2 border-emerald-300'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg hover:shadow-xl'
                }`}
                onClick={handleConnectFit}
                disabled={fitConnected}
              >
                {fitConnected ? '✅ Google Fit Connected' : '🔗 Connect Google Fit'}
              </button>
              <button
                className='px-6 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50'
                onClick={handleSyncFit}
                disabled={!fitConnected || syncing}
              >
                {syncing ? (
                  <span className='flex items-center gap-2'>
                    <div className='animate-spin'>🌀</div>
                    Syncing...
                  </span>
                ) : (
                  '🔄 Sync Data'
                )}
              </button>
            </div>
          </div>

          {/* Health Metrics Display */}
          {loading ? (
            <div className='glass-card max-w-4xl mx-auto animate-float-gentle'>
              <div className='flex flex-col items-center py-12'>
                <div className='animate-spin text-4xl mb-4'>🌀</div>
                <p className='text-slate-600 dark:text-slate-400 font-light'>Loading your health insights...</p>
              </div>
            </div>
          ) : error ? (
            <div className='glass-card max-w-2xl mx-auto animate-float-gentle bg-red-50/50 dark:bg-red-900/10 border-red-200/50 dark:border-red-700/50'>
              <div className='text-center py-8'>
                <div className='text-4xl mb-4'>⚠️</div>
                <p className='text-red-600 dark:text-red-400 font-light'>{error}</p>
              </div>
            </div>
          ) : (
            <div className='w-full max-w-4xl mx-auto mb-8'>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                <div className='glass-card text-center animate-fade-in-gentle'>
                  <div className='text-5xl mb-4 animate-bounce'>👣</div>
                  <div className='text-4xl font-light text-slate-700 dark:text-slate-200 mb-2'>{health?.steps ?? "-"}</div>
                  <div className='text-sm text-slate-600 dark:text-slate-400 font-light'>Steps Today</div>
                </div>
                <div className='glass-card text-center animate-fade-in-delayed'>
                  <div className='text-5xl mb-4 animate-pulse-soft'>❤️</div>
                  <div className='text-4xl font-light text-slate-700 dark:text-slate-200 mb-2'>{health?.heartRate ?? "-"}</div>
                  <div className='text-sm text-slate-600 dark:text-slate-400 font-light'>Heart Rate (bpm)</div>
                </div>
                <div className='glass-card text-center animate-float-slow'>
                  <div className='text-5xl mb-4 animate-breathe'>🛌</div>
                  <div className='text-4xl font-light text-slate-700 dark:text-slate-200 mb-2'>{health?.sleep ?? "-"}</div>
                  <div className='text-sm text-slate-600 dark:text-slate-400 font-light'>Sleep (hours)</div>
                </div>
              </div>
              {health?.timestamp && (
                <div className='text-center mt-6 text-sm text-slate-500 dark:text-slate-400 font-light animate-fade-in-gentle'>
                  Last updated: {new Date(health.timestamp).toLocaleString()}
                </div>
              )}
            </div>
          )}

          {/* Manual Health Data Entry */}
          <div className='glass-card max-w-2xl mx-auto animate-float-wave'>
            <div className='text-center mb-6'>
              <div className='text-4xl mb-4 animate-bounce'>📝</div>
              <h3 className='text-xl font-light text-slate-700 dark:text-slate-200 mb-2'>Update Your Health</h3>
              <p className='text-slate-600 dark:text-slate-400 font-light'>Share your wellness data to track your journey</p>
            </div>
            <form className='space-y-6' onSubmit={handleSubmit}>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div className='space-y-2'>
                  <label className='block text-sm font-medium text-slate-700 dark:text-slate-300'>Steps</label>
                  <input
                    type="number"
                    name="steps"
                    placeholder="0"
                    className='w-full px-4 py-3 rounded-2xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200 dark:border-slate-600 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all duration-300 text-slate-700 dark:text-slate-200'
                    value={form.steps}
                    onChange={handleChange}
                    min={0}
                  />
                </div>
                <div className='space-y-2'>
                  <label className='block text-sm font-medium text-slate-700 dark:text-slate-300'>Heart Rate (bpm)</label>
                  <input
                    type="number"
                    name="heartRate"
                    placeholder="0"
                    className='w-full px-4 py-3 rounded-2xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200 dark:border-slate-600 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all duration-300 text-slate-700 dark:text-slate-200'
                    value={form.heartRate}
                    onChange={handleChange}
                    min={0}
                  />
                </div>
                <div className='space-y-2'>
                  <label className='block text-sm font-medium text-slate-700 dark:text-slate-300'>Sleep (hours)</label>
                  <input
                    type="number"
                    name="sleep"
                    placeholder="0"
                    className='w-full px-4 py-3 rounded-2xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200 dark:border-slate-600 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all duration-300 text-slate-700 dark:text-slate-200'
                    value={form.sleep}
                    onChange={handleChange}
                    min={0}
                    step={0.1}
                  />
                </div>
              </div>
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
                  '💾 Save Health Data'
                )}
              </button>
            </form>
          </div>
        </div>
      </main>
    </RequireAuth>
  );
}
