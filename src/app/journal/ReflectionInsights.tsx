"use client";
import React from 'react';

interface ReflectionInsightsProps {
  sessionData: {
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
  };
  onNewReflection: () => void;
  onBack: () => void;
}

export default function ReflectionInsights({ sessionData, onNewReflection, onBack }: ReflectionInsightsProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeDisplayName = (type: string) => {
    const types = {
      daily: 'Daily Reflection',
      emotional: 'Emotional Awareness',
      mindfulness: 'Mindfulness Practice',
      gratitude: 'Gratitude Journal',
      growth: 'Personal Growth'
    };
    return types[type as keyof typeof types] || type;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-8 mb-6">
        <div className="text-center mb-8">
          <div className="text-4xl mb-4">✨</div>
          <h2 className="text-2xl font-medium text-slate-800 dark:text-slate-200 mb-2">
            Reflection Complete
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            {getTypeDisplayName(sessionData.type)} • {formatDate(sessionData.createdAt)}
          </p>
        </div>

        {/* Emotional State Summary */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
            <h3 className="font-medium text-slate-800 dark:text-slate-200 mb-2">Emotional State</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Before reflection:</span>
                <span className="font-medium">{sessionData.emotionalState.before}/10</span>
              </div>
              {sessionData.emotionalState.after && (
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">After reflection:</span>
                  <span className="font-medium">{sessionData.emotionalState.after}/10</span>
                </div>
              )}
              {sessionData.emotionalState.emotions.length > 0 && (
                <div>
                  <span className="text-sm text-slate-600 dark:text-slate-400">Emotions:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {sessionData.emotionalState.emotions.map((emotion, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 text-xs rounded-full"
                      >
                        {emotion}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
            <h3 className="font-medium text-slate-800 dark:text-slate-200 mb-2">Session Summary</h3>
            <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
              <div>{sessionData.prompts.length} prompts explored</div>
              <div>{sessionData.responses.length} responses recorded</div>
              <div>{sessionData.insights.length} AI insights generated</div>
            </div>
          </div>
        </div>

        {/* AI Insights */}
        <div className="mb-8">
          <h3 className="text-xl font-medium text-slate-800 dark:text-slate-200 mb-4 flex items-center">
            <span className="mr-2">🧠</span>
            AI-Generated Insights
          </h3>
          <div className="space-y-4">
            {sessionData.insights.map((insight, index) => (
              <div
                key={index}
                className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg p-4 border-l-4 border-indigo-400"
              >
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  {insight}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Your Responses */}
        <div className="mb-8">
          <h3 className="text-xl font-medium text-slate-800 dark:text-slate-200 mb-4 flex items-center">
            <span className="mr-2">📝</span>
            Your Reflections
          </h3>
          <div className="space-y-4">
            {sessionData.prompts.map((prompt, index) => (
              <div key={index} className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                <h4 className="font-medium text-slate-800 dark:text-slate-200 mb-2">
                  {prompt}
                </h4>
                <p className="text-slate-600 dark:text-slate-400 italic">
                  &ldquo;{sessionData.responses[index]}&rdquo;
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={onNewReflection}
            className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors font-medium"
          >
            Start New Reflection
          </button>
          <button
            onClick={onBack}
            className="px-6 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            Back to Journal
          </button>
        </div>
      </div>
    </div>
  );
}