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

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Please sign in to view your Digital Twin.</div>;

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Emotional Digital Twin</h1>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      <div className="mb-4">
        <div className="text-lg">Current Mood: <span className="font-semibold">{data?.mood || "Not set"}</span></div>
        <form onSubmit={handleMoodSubmit} className="flex gap-2 mt-2">
          <input
            type="text"
            value={moodInput}
            onChange={e => setMoodInput(e.target.value)}
            placeholder="How are you feeling?"
            className="border rounded px-2 py-1 flex-1"
            disabled={saving}
            required
          />
          <button type="submit" className="bg-blue-600 text-white px-4 py-1 rounded" disabled={saving}>
            {saving ? "Saving..." : "Update"}
          </button>
        </form>
      </div>
      <div className="mb-4">
        <h2 className="font-semibold mb-1">Mood History</h2>
        <ul className="max-h-40 overflow-y-auto border rounded p-2 bg-white">
          {data?.moodHistory?.length ? (
            data.moodHistory.slice().reverse().map((entry, i) => (
              <li key={i} className="text-sm text-gray-700">
                <span className="font-medium">{entry.mood}</span> <span className="text-gray-400">({new Date(entry.timestamp).toLocaleString()})</span>
              </li>
            ))
          ) : (
            <li className="text-gray-400">No mood history yet.</li>
          )}
        </ul>
      </div>
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h2 className="font-semibold">AI Insights</h2>
          <button
            onClick={handleAnalyzeAI}
            className="bg-purple-600 text-white px-3 py-1 rounded text-xs disabled:opacity-60"
            disabled={analyzing}
          >
            {analyzing ? "Analyzing..." : "Analyze with AI"}
          </button>
        </div>
        <pre className="bg-gray-100 rounded p-2 text-xs overflow-x-auto">{JSON.stringify(data?.aiInsights, null, 2)}</pre>
      </div>
    </div>
  );
}
