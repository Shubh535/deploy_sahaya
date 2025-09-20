

"use client";
import { useState, useRef, useEffect } from "react";
import { plantTree } from "../sanjha-grove/useGarden";
import { useAuth } from "../components/AuthProvider";
import { getIdToken } from "../utils/getIdToken";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

function MoodArt({ imageBase64 }: { imageBase64: string | null }) {
  if (!imageBase64) return null;
  return (
    <div className="flex justify-center items-center my-4">
      <img
        src={`data:image/png;base64,${imageBase64}`}
        alt="Mood Art"
        className="rounded-3xl shadow-xl border-4 border-white/40 bg-gradient-to-br from-indigo-100 to-pink-100 animate-fadein"
        style={{ maxWidth: 320, maxHeight: 200, boxShadow: "0 0 32px 8px #a5b4fc55" }}
      />
    </div>
  );
}

function MoodDNATimeline({ moods }: { moods: { mood: string; color: string; date: string; details: string }[] }) {
  const [expanded, setExpanded] = useState<number | null>(null);
  return (
    <div className="overflow-x-auto py-4">
      <div className="flex items-center gap-6 min-w-[400px]">
        {moods.map((m, i) => (
          <div key={i} className="flex flex-col items-center relative group">
            <button
              className={`w-8 h-8 rounded-full border-4 transition-all duration-300 shadow-lg ${expanded === i ? "scale-125 border-white" : "border-transparent"}`}
              style={{ background: `radial-gradient(circle at 60% 40%, ${m.color} 70%, #fff0 100%)`, boxShadow: `0 0 16px 4px ${m.color}55` }}
              onClick={() => setExpanded(expanded === i ? null : i)}
              aria-label={m.mood}
            />
            <span className="text-xs mt-2 text-gray-700 font-medium">{m.mood}</span>
            <span className="text-[10px] text-gray-400">{m.date}</span>
            {expanded === i && (
              <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-white/90 rounded-xl shadow-xl p-4 min-w-[200px] z-10 animate-fadein border border-indigo-100">
                <div className="font-semibold text-indigo-700 mb-1">{m.mood}</div>
                <div className="text-xs text-gray-700 mb-1">{m.details}</div>
                <button className="text-xs text-indigo-500 mt-2 underline" onClick={() => setExpanded(null)}>Close</button>
              </div>
            )}
            {i < moods.length - 1 && (
              <div className="absolute left-8 top-1/2 w-12 h-1 rounded-full" style={{ background: `linear-gradient(90deg, ${m.color} 60%, ${moods[i + 1].color} 100%)`, zIndex: 0 }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ManthanJournalPage() {
  const { user, loading } = useAuth();
  const [entry, setEntry] = useState("");
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [reframe, setReframe] = useState<string | null>(null);
  const [sentiment, setSentiment] = useState<string | null>(null);
  const [art, setArt] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [moodDNA, setMoodDNA] = useState<Array<{
    mood: string;
    color: string;
    date: string;
    details: string;
  }>>([]);
  const [particles, setParticles] = useState<Array<{
    left: string;
    top: string;
    animationDelay: string;
    animationDuration: string;
    size: string;
    color: string;
  }>>([]);
  const entryRef = useRef<HTMLTextAreaElement>(null);

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

  useEffect(() => {
    if (entryRef.current) entryRef.current.focus();
  }, []);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setError("");
    setReframe(null);
    setSentiment(null);
    setArt(null);
    try {
      const token = await getIdToken();
      // Analyze journal entry for sentiment/reframing
      const res = await fetch(`${API_BASE}/api/journal/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ entry }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      setReframe(data.reframing);
      setSentiment(data.sentiment);
      // Image generation temporarily disabled on this deployment to fit Hobby plan limits
      // setArt(null);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred';
      setError(errorMessage);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const token = await getIdToken();
      const res = await fetch(`${API_BASE}/api/journal/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: entry, encrypted: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setMoodDNA((dna) => [
        ...dna,
        {
          mood: sentiment || "unknown",
          color: sentiment === "positive" ? "#a5b4fc" : sentiment === "negative" ? "#fca5a5" : "#fcd34d",
          date: new Date().toLocaleDateString(),
          details: reframe || entry,
        },
      ]);
      // Plant a tree in Sanjha Grove
      const color = sentiment === "positive" ? "#a5b4fc" : sentiment === "negative" ? "#fca5a5" : "#fcd34d";
      const x = Math.random();
      const y = 0.6 + Math.random() * 0.3; // lower part of garden
      await plantTree({ x, y, color, mood: sentiment || "unknown" });
      setEntry("");
      setReframe(null);
      setSentiment(null);
      setArt(null);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className='relative flex flex-col items-center justify-center min-h-screen px-4 py-12 overflow-hidden'>
      <div className='absolute inset-0 z-0 animate-gradient-flow' />
      <div className='relative z-10 glass-card p-8 text-center animate-float-gentle'>
        <div className='animate-spin text-4xl mb-4'>🌀</div>
        <p className='text-slate-600 dark:text-slate-400 font-light'>Preparing your reflection space...</p>
      </div>
    </div>
  );
  if (!user) return (
    <div className='relative flex flex-col items-center justify-center min-h-screen px-4 py-12 overflow-hidden'>
      <div className='absolute inset-0 z-0 animate-gradient-flow' />
      <div className='relative z-10 glass-card p-8 text-center animate-float-gentle'>
        <div className='text-4xl mb-4'>🔐</div>
        <p className='text-slate-600 dark:text-slate-400 font-light'>Please sign in to begin your journey of self-discovery.</p>
      </div>
    </div>
  );

  return (
    <div className='relative min-h-screen overflow-hidden'>
      {/* Soothing gradient background with animation */}
      <div className='absolute inset-0 z-0 animate-gradient-flow' />

      {/* Floating nature elements */}
      <div className='absolute top-16 left-12 text-5xl animate-bubble-gentle opacity-30'>🌸</div>
      <div className='absolute top-32 right-20 text-4xl animate-bubble-flow opacity-25'>🧠</div>
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
      <div className='relative z-10 max-w-4xl mx-auto p-6 min-h-screen'>
        {/* Header */}
        <header className='text-center mb-8 animate-fade-in-gentle'>
          <div className='text-6xl mb-4 animate-pulse-soft'>🧠</div>
          <h1 className='text-4xl sm:text-5xl font-light mb-2 text-slate-700 dark:text-slate-200 tracking-wide'>
            Manthan <span className='text-3xl align-super text-emerald-500'>(मंथन)</span>
          </h1>
          <p className='text-lg text-slate-600 dark:text-slate-300 font-light'>AI Journal for reflection, reframing, and emotional growth</p>
        </header>

        {/* Journal input */}
        <div className='glass-card mb-8 animate-float-gentle'>
          <div className='p-6'>
            <div className='flex items-center gap-3 mb-4'>
              <div className='text-3xl animate-bounce'>📝</div>
              <h2 className='text-xl font-light text-slate-700 dark:text-slate-200'>Your Thoughts</h2>
            </div>
            <textarea
              ref={entryRef}
              className='w-full min-h-[120px] rounded-2xl border px-4 py-3 text-base bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-slate-200 dark:border-slate-600 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all duration-300 text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 resize-none'
              placeholder="Pour out your heart... let your thoughts flow freely..."
              value={entry}
              onChange={e => setEntry(e.target.value)}
              disabled={analyzing || saving}
            />
            <div className='flex gap-4 mt-6'>
              <button
                className='btn-primary flex-1 disabled:opacity-60 transition-all duration-300 hover:scale-105'
                onClick={handleAnalyze}
                disabled={analyzing || !entry.trim()}
              >
                {analyzing ? (
                  <span className='flex items-center justify-center gap-2'>
                    <div className='animate-spin'>🌀</div>
                    Analyzing...
                  </span>
                ) : (
                  <span className='flex items-center gap-2'>
                    <span className='text-lg'>🔍</span>
                    Analyze & Visualize
                  </span>
                )}
              </button>
              <button
                className='px-6 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 flex-1'
                onClick={handleSave}
                disabled={saving || !entry.trim() || !sentiment}
              >
                {saving ? (
                  <span className='flex items-center justify-center gap-2'>
                    <div className='animate-spin'>🌀</div>
                    Saving...
                  </span>
                ) : (
                  <span className='flex items-center gap-2'>
                    <span className='text-lg'>💾</span>
                    Save Entry
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className='glass-card mb-6 p-4 animate-fade-in-gentle bg-red-50/50 dark:bg-red-900/10 border-red-200/50 dark:border-red-700/50'>
            <div className='flex items-center gap-3'>
              <div className='text-2xl'>⚠️</div>
              <p className='text-red-600 dark:text-red-400 font-light'>{error}</p>
            </div>
          </div>
        )}

        {/* Reframing suggestion */}
        {reframe && (
          <div className='glass-card mb-6 p-6 animate-fade-in-gentle border-l-4 border-emerald-400'>
            <div className='flex items-center gap-3 mb-4'>
              <div className='text-3xl animate-pulse-soft'>💡</div>
              <h3 className='text-lg font-light text-slate-700 dark:text-slate-200'>Gentle Reframing</h3>
            </div>
            <p className='text-slate-600 dark:text-slate-400 leading-relaxed font-light'>{reframe}</p>
          </div>
        )}

        {/* Mood Art */}
        <MoodArt imageBase64={art} />

        {/* Mood DNA Timeline */}
        {moodDNA.length > 0 && (
          <div className='glass-card mt-8 p-6 animate-float-slow'>
            <div className='flex items-center gap-3 mb-6'>
              <div className='text-3xl animate-bounce'>🧬</div>
              <h2 className='text-xl font-light text-slate-700 dark:text-slate-200'>Your Mood DNA</h2>
            </div>
            <MoodDNATimeline moods={moodDNA} />
          </div>
        )}
      </div>
    </div>
  );
}
