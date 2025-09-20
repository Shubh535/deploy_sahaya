"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../utils/apiClient';

interface ReflectionSessionProps {
  type: string;
  onComplete: (sessionData: {
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
  }) => void;
  onBack: () => void;
}

interface Prompt {
  text: string;
  response?: string;
}

interface EmotionalState {
  before: number;
  after?: number;
  emotions: string[];
}

export default function ReflectionSession({ type, onComplete, onBack }: ReflectionSessionProps) {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [responses, setResponses] = useState<string[]>([]);
  const [currentResponse, setCurrentResponse] = useState('');
  const [emotionalState, setEmotionalState] = useState<EmotionalState>({
    before: 5,
    emotions: []
  });
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<'assessment' | 'reflection' | 'insights'>('assessment');

  const loadPrompts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/journal/reflection-prompts', {
        method: 'POST',
        body: JSON.stringify({ type })
      });
      setPrompts(data.prompts.map((text: string) => ({ text })));
    } catch (error) {
      console.error('Failed to load prompts:', error);
      // Fallback prompts
      setPrompts([
        { text: "What are you feeling right now?" },
        { text: "What thoughts are present in your mind?" },
        { text: "What would you like to explore further?" }
      ]);
    } finally {
      setLoading(false);
    }
  }, [type]);

  // Load reflection prompts when component mounts
  useEffect(() => {
    loadPrompts();
  }, [loadPrompts]);

  const handleEmotionalAssessment = () => {
    setPhase('reflection');
  };

  const handleResponseSubmit = () => {
    if (currentResponse.trim()) {
      const newResponses = [...responses, currentResponse.trim()];
      setResponses(newResponses);

      const updatedPrompts = [...prompts];
      updatedPrompts[currentPromptIndex].response = currentResponse.trim();
      setPrompts(updatedPrompts);

      setCurrentResponse('');

      if (currentPromptIndex < prompts.length - 1) {
        setCurrentPromptIndex(currentPromptIndex + 1);
      } else {
        // All prompts completed, generate insights
        generateInsights(newResponses);
      }
    }
  };

  const generateInsights = async (finalResponses: string[]) => {
    try {
      setLoading(true);
      setPhase('insights');

      const data = await apiRequest('/journal/insights', {
        method: 'POST',
        body: JSON.stringify({
          type,
          responses: finalResponses,
          emotionalState
        })
      });

      // Save the session (client-side only in Hobby deployment)
      const sessionData = {
        id: `session_${Date.now()}`,
        type,
        prompts: prompts.map(p => p.text),
        responses: finalResponses,
        insights: data.insights,
        emotionalState: {
          ...emotionalState,
          after: emotionalState.before // Could be updated based on reflection
        },
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString()
      };

      // Save the session
      await apiRequest('/journal/sessions', {
        method: 'POST',
        body: JSON.stringify(sessionData)
      });

      onComplete(sessionData);
    } catch (error) {
      console.error('Failed to generate insights:', error);
      onComplete({
        id: `session_${Date.now()}`,
        type,
        prompts: prompts.map(p => p.text),
        responses: finalResponses,
        insights: ['AI insights unavailable at the moment. Your reflections have been saved.'],
        emotionalState,
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const currentPrompt = prompts[currentPromptIndex];

  if (loading && prompts.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-slate-600 dark:text-slate-400">Loading reflection prompts...</span>
      </div>
    );
  }

  if (phase === 'assessment') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-8">
          <h3 className="text-xl font-medium text-slate-800 dark:text-slate-200 mb-6 text-center">
            Before we begin...
          </h3>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                How are you feeling right now? (1-10)
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={emotionalState.before}
                onChange={(e) => setEmotionalState(prev => ({ ...prev, before: parseInt(e.target.value) }))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>1</span>
                <span className="font-medium">{emotionalState.before}/10</span>
                <span>10</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                What emotions are you experiencing? (optional)
              </label>
              <input
                type="text"
                placeholder="e.g., calm, anxious, excited..."
                value={emotionalState.emotions.join(', ')}
                onChange={(e) => setEmotionalState(prev => ({
                  ...prev,
                  emotions: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200"
              />
            </div>

            <button
              onClick={handleEmotionalAssessment}
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 transition-colors font-medium"
            >
              Begin Reflection
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'insights') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-slate-600 dark:text-slate-400">Generating AI insights...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-8">
        {/* Progress indicator */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Question {currentPromptIndex + 1} of {prompts.length}
            </span>
            <span className="text-sm text-slate-600 dark:text-slate-400">
              {Math.round(((currentPromptIndex + 1) / prompts.length) * 100)}% complete
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2 dark:bg-slate-700">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentPromptIndex + 1) / prompts.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Current prompt */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-4">
            {currentPrompt?.text}
          </h3>

          <textarea
            value={currentResponse}
            onChange={(e) => setCurrentResponse(e.target.value)}
            placeholder="Take your time to reflect and write your thoughts..."
            className="w-full h-32 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                handleResponseSubmit();
              }
            }}
          />
          <p className="text-xs text-slate-500 mt-1">
            Press Ctrl+Enter to submit your response
          </p>
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={onBack}
            className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            ← Back
          </button>

          <button
            onClick={handleResponseSubmit}
            disabled={!currentResponse.trim()}
            className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {currentPromptIndex < prompts.length - 1 ? 'Next' : 'Complete Reflection'}
          </button>
        </div>
      </div>
    </div>
  );
}