"use client";
import React, { useState } from "react";
import { apiRequest } from "../utils/apiClient";

export default function MoodTracker({ onBack }: { onBack: () => void }) {
  const [mood, setMood] = useState<number>(5);
  const [note, setNote] = useState<string>("");
  const [emotions, setEmotions] = useState<string[]>([]);
  const [triggers, setTriggers] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const emotionOptions = [
    "Happy", "Sad", "Angry", "Anxious", "Calm", "Excited", "Frustrated", "Grateful",
    "Overwhelmed", "Peaceful", "Stressed", "Content", "Lonely", "Hopeful", "Tired", "Energetic"
  ];

  const triggerOptions = [
    "Work", "Family", "Friends", "Health", "Weather", "Sleep", "Food", "Exercise",
    "Social Media", "News", "Finances", "Relationships", "Hobbies", "Travel", "Other"
  ];

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiRequest('/journal/mood', {
        method: 'POST',
        body: JSON.stringify({ mood, note, emotions, triggers }),
      });
      alert('Mood entry saved successfully!');
      onBack();
    } catch (error) {
      console.error('Error saving mood:', error);
      alert('Failed to save mood entry. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const toggleEmotion = (emotion: string) => {
    setEmotions(prev =>
      prev.includes(emotion)
        ? prev.filter(e => e !== emotion)
        : [...prev, emotion]
    );
  };

  const toggleTrigger = (trigger: string) => {
    setTriggers(prev =>
      prev.includes(trigger)
        ? prev.filter(t => t !== trigger)
        : [...prev, trigger]
    );
  };

  return (
    <div className="max-w-2xl mx-auto px-4">
      <div className="mb-6 text-center">
        <button
          onClick={onBack}
          className="text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          ← Back to journal
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-6 text-center">
          😊 Track Your Mood
        </h2>

        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            How are you feeling right now? (1-10)
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={mood}
            onChange={(e) => setMood(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700"
          />
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
            <span>1 - Very Low</span>
            <span className="font-semibold text-lg">{mood}</span>
            <span>10 - Excellent</span>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            What's on your mind? (Optional note)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Share what's contributing to your mood..."
            className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 resize-none"
            rows={3}
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Which emotions are you experiencing?
          </label>
          <div className="flex flex-wrap gap-2">
            {emotionOptions.map(emotion => (
              <button
                key={emotion}
                onClick={() => toggleEmotion(emotion)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  emotions.includes(emotion)
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                {emotion}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            What triggered this mood? (Optional)
          </label>
          <div className="flex flex-wrap gap-2">
            {triggerOptions.map(trigger => (
              <button
                key={trigger}
                onClick={() => toggleTrigger(trigger)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  triggers.includes(trigger)
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                {trigger}
              </button>
            ))}
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white px-8 py-3 rounded-lg transition-colors font-medium"
          >
            {saving ? 'Saving...' : '💾 Save Mood Entry'}
          </button>
        </div>
      </div>
    </div>
  );
}