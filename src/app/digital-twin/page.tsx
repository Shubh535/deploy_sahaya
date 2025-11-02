"use client";
import { useEffect, useState } from "react";
import { useAuth } from "../components/AuthProvider";

import { getIdToken } from "../utils/getIdToken";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

interface MoodEntry {
  mood: string;
  timestamp: string;
}

interface DigitalTwinData {
  mood: string | null;
  moodHistory: MoodEntry[];
  aiInsights: Record<string, any>;
  updatedAt?: string;
}

export default function DigitalTwinPage() {
  const { user, loading } = useAuth();
  const [data, setData] = useState<DigitalTwinData | null>(null);
  const [moodInput, setMoodInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  // Trigger AI analysis
  const handleAnalyzeAI = async () => {
    setAnalyzing(true);
    setError("");
    try {
      const token = await getIdToken();
      const res = await fetch(`${API_BASE}/api/digital-twin/analyze`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "AI analysis failed");
      // Reload data to get updated aiInsights
      const updated = await fetch(`${API_BASE}/api/digital-twin`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(await updated.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const token = await getIdToken();
        const res = await fetch(`${API_BASE}/api/digital-twin`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to load digital twin data");
        setData(await res.json());
      } catch (e: any) {
        setError(e.message);
      }
    })();
  }, [user]);

  const handleMoodSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const token = await getIdToken();
      console.log('Submitting mood:', moodInput, 'Token:', token);
      const res = await fetch(`${API_BASE}/api/digital-twin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ mood: moodInput }),
      });
      const text = await res.text();
      console.log('POST /api/digital-twin response:', res.status, text);
      if (!res.ok) throw new Error(`Failed to update mood: ${text}`);
      setMoodInput("");
      // Reload data
      const updated = await fetch(`${API_BASE}/api/digital-twin`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(await updated.json());
    } catch (e: any) {
      setError(e.message);
      console.error('handleMoodSubmit error:', e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return <div className="flex items-center justify-center min-h-screen text-slate-600 dark:text-slate-300">Please sign in to view your Digital Twin.</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-cyan-50/30 dark:from-slate-900 dark:via-emerald-950/30 dark:to-cyan-950/30 px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <header className="text-center mb-12 animate-fade-in">
          <div className="text-6xl mb-4">🧬</div>
          <h1 className="text-5xl font-light mb-3 text-slate-700 dark:text-slate-200 tracking-wide">
            Digital Twin <span className="text-2xl align-super text-emerald-500">(डिजिटल ट्विन)</span>
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Your emotional mirror - track patterns, gain insights, understand yourself better
          </p>
        </header>

        {error && (
          <div className="glass-card bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700 mb-6 animate-fade-in">
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        <div className="glass-card mb-6 animate-fade-in">
          <h2 className="text-xl font-medium text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
            <span className="text-2xl">💭</span>
            Current Mood
          </h2>
          <div className="mb-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700">
            <span className="text-2xl font-light text-emerald-700 dark:text-emerald-300">
              {data?.mood || "Not set yet"}
            </span>
          </div>
          <form onSubmit={handleMoodSubmit} className="flex gap-3">
            <input
              type="text"
              value={moodInput}
              onChange={e => setMoodInput(e.target.value)}
              placeholder="How are you feeling right now?"
              className="flex-1 rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/20 bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 focus:border-emerald-400 transition-colors text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
              disabled={saving}
              required
            />
            <button 
              type="submit" 
              className="btn-primary px-6 disabled:opacity-60" 
              disabled={saving}
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                "Update"
              )}
            </button>
          </form>
        </div>

        <div className="glass-card mb-6 animate-fade-in">
          <h2 className="text-xl font-medium text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
            <span className="text-2xl">📊</span>
            Mood History
          </h2>
          <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50">
            {data?.moodHistory?.length ? (
              <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                {data.moodHistory.slice().reverse().map((entry, i) => (
                  <li key={i} className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <span className="font-medium text-slate-700 dark:text-slate-200">{entry.mood}</span>
                    <span className="text-sm text-slate-500 dark:text-slate-400 ml-2">
                      {new Date(entry.timestamp).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-400 dark:text-slate-500 text-center py-8">
                No mood history yet. Start by updating your current mood above.
              </p>
            )}
          </div>
        </div>

        <div className="glass-card animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-medium text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <span className="text-2xl">🤖</span>
              AI Insights
            </h2>
            <button
              onClick={handleAnalyzeAI}
              className="btn-primary disabled:opacity-60"
              disabled={analyzing}
            >
              {analyzing ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Analyzing...
                </div>
              ) : (
                "Analyze with AI"
              )}
            </button>
          </div>
          <pre className="bg-slate-100 dark:bg-slate-800/50 rounded-xl p-4 text-xs overflow-x-auto border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
            {JSON.stringify(data?.aiInsights, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
