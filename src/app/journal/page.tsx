"use client";
import React, { useState } from "react";
import { useAuth } from "../components/AuthProvider";
import RequireAuth from "../components/RequireAuth";
import ReflectionSession from "./ReflectionSession";
import ReflectionInsights from "./ReflectionInsights";
import JournalDashboard from "./JournalDashboard";
import MoodTracker from "./MoodTracker";

const REFLECTION_TYPES = [
  {
    key: "daily",
    label: "Daily Reflection",
    icon: "🌅",
    description: "Reflect on your day, achievements, and learnings",
    color: "from-amber-400 to-orange-500"
  },
  {
    key: "emotional",
    label: "Emotional Awareness",
    icon: "💭",
    description: "Explore and understand your current emotions",
    color: "from-rose-400 to-pink-500"
  },
  {
    key: "mindfulness",
    label: "Mindfulness Practice",
    icon: "🧘‍♀️",
    description: "Present moment awareness and meditation",
    color: "from-blue-400 to-indigo-500"
  },
  {
    key: "gratitude",
    label: "Gratitude Journal",
    icon: "🙏",
    description: "Focus on appreciation and thankfulness",
    color: "from-purple-400 to-indigo-500"
  },
  {
    key: "growth",
    label: "Personal Growth",
    icon: "🌱",
    description: "Track your development and aspirations",
    color: "from-blue-400 to-cyan-500"
  }
];

type JournalPhase = 'selection' | 'reflection' | 'insights' | 'dashboard' | 'mood';

export default function JournalPage() {
  const { user } = useAuth();
  const [phase, setPhase] = useState<JournalPhase>('selection');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [completedSession, setCompletedSession] = useState<{
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
  } | null>(null);

  if (!user) {
    return (
      <RequireAuth>
        <div>Please sign in to access your self-introspection journal.</div>
      </RequireAuth>
    );
  }

  const handleTypeSelect = (type: string) => {
    setSelectedType(type);
    setPhase('reflection');
  };

  const handleReflectionComplete = (sessionData: {
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
  }) => {
    setCompletedSession(sessionData);
    setPhase('insights');
  };

  const handleNewReflection = () => {
    setSelectedType(null);
    setCompletedSession(null);
    setPhase('selection');
  };

  const handleBackFromReflection = () => {
    setSelectedType(null);
    setPhase('selection');
  };

  const handleBackFromInsights = () => {
    setCompletedSession(null);
    setPhase('selection');
  };

  return (
    <RequireAuth>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900">
        <div className="relative z-10 pt-8 pb-4">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <div className="text-6xl mb-4">🪷</div>
            <h1 className="text-4xl md:text-5xl font-light text-slate-800 dark:text-slate-200 mb-2">
              Self-Introspection Journal
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Embark on a journey of self-discovery through guided reflection and AI-powered insights
            </p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 pb-8">
          {phase === 'selection' && (
            <div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {REFLECTION_TYPES.map((type) => (
                  <button
                    key={type.key}
                    onClick={() => handleTypeSelect(type.key)}
                    className="group relative overflow-hidden bg-white dark:bg-slate-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-slate-200 dark:border-slate-700"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-r ${type.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                    <div className="p-6 text-center">
                      <div className="text-4xl mb-3">{type.icon}</div>
                      <h3 className="text-xl font-medium text-slate-800 dark:text-slate-200 mb-2">
                        {type.label}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        {type.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="text-center mt-8">
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => setPhase('mood')}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors"
                  >
                    😊 Track Mood
                  </button>
                  <button
                    onClick={() => setPhase('dashboard')}
                    className="bg-slate-600 hover:bg-slate-700 text-white px-6 py-3 rounded-lg transition-colors"
                  >
                    📊 View My Dashboard
                  </button>
                </div>
              </div>
            </div>
          )}

          {phase === 'dashboard' && (
            <JournalDashboard onBack={() => setPhase('selection')} />
          )}

          {phase === 'mood' && (
            <MoodTracker onBack={() => setPhase('selection')} />
          )}

          {phase === 'reflection' && selectedType && (
            <div>
              <div className="mb-6 text-center">
                <button
                  onClick={handleBackFromReflection}
                  className="text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                >
                  ← Back to selection
                </button>
              </div>
              <ReflectionSession
                type={selectedType}
                onComplete={handleReflectionComplete}
                onBack={handleBackFromReflection}
              />
            </div>
          )}

          {phase === 'insights' && completedSession && (
            <div>
              <div className="mb-6 text-center">
                <button
                  onClick={handleBackFromInsights}
                  className="text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                >
                  ← Back to selection
                </button>
              </div>
              <ReflectionInsights
                sessionData={completedSession}
                onNewReflection={handleNewReflection}
                onBack={handleBackFromInsights}
              />
            </div>
          )}
        </div>
      </div>
    </RequireAuth>
  );
}