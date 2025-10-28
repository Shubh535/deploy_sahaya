"use client";
import React, { useState, useEffect } from "react";
import { apiRequest } from "../utils/apiClient";
import { getIdToken } from "../utils/getIdToken";

interface Session {
  id: string;
  type: string;
  prompts: string[];
  responses: string[];
  insights: string[];
  emotionalState: {
    before: number;
    after?: number;
    emotions: string[];
  };
  createdAt: string;
  completedAt: string;
}

interface MoodEntry {
  id: string;
  mood: number;
  note: string;
  emotions: string[];
  triggers: string[];
  createdAt: string;
}

export default function JournalDashboard({ onBack }: { onBack: () => void }) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [sessionsRes, moodRes] = await Promise.all([
        apiRequest('/journal/sessions'),
        apiRequest('/journal/mood')
      ]);

      setSessions(sessionsRes.sessions || []);
      setMoodEntries(moodRes.moodEntries || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const token = await getIdToken();
      const response = await fetch('/api/journal/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ format: 'markdown' }),
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'my-journey.md');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting:', error);
      alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const avgMood = moodEntries.length > 0
    ? moodEntries.reduce((sum, entry) => sum + entry.mood, 0) / moodEntries.length
    : 0;

  const recentEmotions = moodEntries
    .flatMap(entry => entry.emotions)
    .reduce((acc, emotion) => {
      acc[emotion] = (acc[emotion] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const topEmotions = Object.entries(recentEmotions)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3);

  return (
    <div className="max-w-6xl mx-auto px-4">
      <div className="mb-6 text-center">
        <button
          onClick={onBack}
          className="text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          ← Back to journal
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-4">
          📊 Your Reflection Dashboard
        </h2>

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {sessions.length}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Reflection Sessions
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {avgMood.toFixed(1)}/10
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Average Mood
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {moodEntries.length}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Mood Entries
            </div>
          </div>
        </div>

        {topEmotions.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
              Recent Emotions
            </h3>
            <div className="flex flex-wrap gap-2">
              {topEmotions.map(([emotion, count]) => (
                <span
                  key={emotion}
                  className="bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full text-sm"
                >
                  {emotion} ({count})
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={handleExport}
            disabled={exporting || sessions.length === 0}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white px-6 py-2 rounded-lg transition-colors"
          >
            {exporting ? 'Exporting...' : '📖 Export to Book'}
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-4">
            Recent Sessions
          </h3>
          {sessions.slice(0, 5).map(session => (
            <div key={session.id} className="border-b border-slate-200 dark:border-slate-700 pb-3 mb-3 last:border-b-0 last:pb-0 last:mb-0">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium text-slate-800 dark:text-slate-200 capitalize">
                    {session.type} Reflection
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    {new Date(session.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-500">
                  Mood: {session.emotionalState.before}/10
                </div>
              </div>
            </div>
          ))}
          {sessions.length === 0 && (
            <p className="text-slate-500 dark:text-slate-400">No sessions yet. Start reflecting!</p>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-4">
            Recent Mood Entries
          </h3>
          {moodEntries.slice(0, 5).map(entry => (
            <div key={entry.id} className="border-b border-slate-200 dark:border-slate-700 pb-3 mb-3 last:border-b-0 last:pb-0 last:mb-0">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium text-slate-800 dark:text-slate-200">
                    Mood: {entry.mood}/10
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    {new Date(entry.createdAt).toLocaleDateString()}
                  </div>
                  {entry.note && (
                    <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      {entry.note}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {moodEntries.length === 0 && (
            <p className="text-slate-500 dark:text-slate-400">No mood entries yet. Track your feelings!</p>
          )}
        </div>
      </div>
    </div>
  );
}