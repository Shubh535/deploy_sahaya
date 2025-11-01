"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiRequest } from '../utils/apiClient';

interface SessionTemplate {
  key: string;
  title: string;
  duration: string;
  icon: string;
  description: string;
  xpReward: number;
  color: string;
  gradient: string;
}

const TEMPLATES: SessionTemplate[] = [
  {
    key: 'calm-2min',
    title: 'Calm in 2 Minutes',
    duration: '2 min',
    icon: '🌊',
    description: 'Quick reset for instant relaxation',
    xpReward: 10,
    color: '#A8C7FA',
    gradient: 'from-blue-300 to-cyan-300'
  },
  {
    key: 'focus-reset',
    title: 'Focus Reset',
    duration: '3 min',
    icon: '🎯',
    description: 'Sharpen your concentration',
    xpReward: 15,
    color: '#F8C8DC',
    gradient: 'from-pink-300 to-amber-300'
  },
  {
    key: 'gratitude-pulse',
    title: 'Gratitude Pulse',
    duration: '4 min',
    icon: '🙏',
    description: 'Cultivate appreciation and joy',
    xpReward: 20,
    color: '#C6E7E3',
    gradient: 'from-emerald-300 to-teal-300'
  },
  {
    key: 'letting-go',
    title: 'Letting Go Ritual',
    duration: '5 min',
    icon: '🕊️',
    description: 'Release stress and tension',
    xpReward: 25,
    color: '#8AAAE5',
    gradient: 'from-indigo-300 to-purple-300'
  }
];

type SessionPhase = 'ready' | 'breathe' | 'reflect' | 'affirm' | 'close' | 'complete';

interface SessionStep {
  phase: SessionPhase;
  title: string;
  instruction: string;
  duration: number;
}

export default function MindfulnessMicroSessions() {
  const [selectedTemplate, setSelectedTemplate] = useState<SessionTemplate | null>(null);
  const [sessionActive, setSessionActive] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<SessionPhase>('ready');
  const [phaseProgress, setPhaseProgress] = useState(0);
  const [sessionSteps, setSessionSteps] = useState<SessionStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [wellnessLevel, setWellnessLevel] = useState(1);
  const [totalXP, setTotalXP] = useState(0);
  const [showReward, setShowReward] = useState(false);

  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  // Fetch user's wellness level on mount
  useEffect(() => {
    fetchWellnessProgress();
  }, []);

  const fetchWellnessProgress = async () => {
    try {
      const response = await apiRequest('/api/wellness/progress', {
        method: 'GET'
      });
      setWellnessLevel(response.level || 1);
      setTotalXP(response.xp || 0);
    } catch (error) {
      console.error('Failed to fetch wellness progress:', error);
    }
  };

  const handleStartSession = async (template: SessionTemplate) => {
    setLoading(true);
    setSelectedTemplate(template);
    
    try {
      // Generate session script from Gemini
      const response = await apiRequest('/api/wellness/generate-session', {
        method: 'POST',
        body: JSON.stringify({
          sessionType: template.key,
          duration: template.duration
        })
      });

      setSessionSteps(response.steps || []);
      setSessionActive(true);
      setCurrentPhase('breathe');
      setCurrentStepIndex(0);
      setPhaseProgress(0);
    } catch (error) {
      console.error('Failed to generate session:', error);
      // Fallback to default steps
      setSessionSteps([
        { phase: 'breathe', title: 'Breathe', instruction: 'Take slow, deep breaths', duration: 30 },
        { phase: 'reflect', title: 'Reflect', instruction: 'Notice how you feel', duration: 30 },
        { phase: 'affirm', title: 'Affirm', instruction: 'I am calm and centered', duration: 30 },
        { phase: 'close', title: 'Close', instruction: 'Gently return to the present', duration: 30 }
      ]);
      setSessionActive(true);
      setCurrentPhase('breathe');
      setCurrentStepIndex(0);
    } finally {
      setLoading(false);
    }
  };

  // Session timer logic
  useEffect(() => {
    if (!sessionActive || currentPhase === 'ready' || currentPhase === 'complete') return;

    const currentStep = sessionSteps[currentStepIndex];
    if (!currentStep) return;

    const interval = setInterval(() => {
      setPhaseProgress(prev => {
        const newProgress = prev + (100 / currentStep.duration);
        
        if (newProgress >= 100) {
          // Move to next phase
          if (currentStepIndex < sessionSteps.length - 1) {
            setCurrentStepIndex(currentStepIndex + 1);
            setCurrentPhase(sessionSteps[currentStepIndex + 1].phase);
            return 0;
          } else {
            // Session complete
            handleSessionComplete();
            return 100;
          }
        }
        
        return newProgress;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionActive, currentPhase, currentStepIndex, sessionSteps]);

  const handleSessionComplete = async () => {
    setCurrentPhase('complete');
    setSessionActive(false);
    
    if (!selectedTemplate) return;

    const earnedXP = selectedTemplate.xpReward;
    setXpEarned(earnedXP);
    setShowReward(true);

    // Save session completion
    try {
      const response = await apiRequest('/api/wellness/complete-session', {
        method: 'POST',
        body: JSON.stringify({
          sessionType: selectedTemplate.key,
          duration: selectedTemplate.duration,
          xpEarned: earnedXP,
          completedAt: Date.now()
        })
      });

      // Update local XP and level
      setTotalXP(response.totalXP || totalXP + earnedXP);
      setWellnessLevel(response.level || wellnessLevel);
    } catch (error) {
      console.error('Failed to save session completion:', error);
    }

    setTimeout(() => setShowReward(false), 5000);
  };

  const handleStopSession = () => {
    setSessionActive(false);
    setCurrentPhase('ready');
    setCurrentStepIndex(0);
    setPhaseProgress(0);
    setSelectedTemplate(null);
  };

  const getPhaseIcon = (phase: SessionPhase) => {
    switch (phase) {
      case 'breathe': return '🫁';
      case 'reflect': return '💭';
      case 'affirm': return '✨';
      case 'close': return '🙏';
      default: return '🌟';
    }
  };

  const currentStep = sessionSteps[currentStepIndex];
  const xpToNextLevel = wellnessLevel * 100;
  const xpProgress = (totalXP % 100) / 100 * 100;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* Header with Progress */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-light text-slate-700 dark:text-slate-200">
          Mindfulness Micro-Sessions
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Brief, guided sessions to reset and recharge
        </p>

        {/* Wellness Level Display */}
        <div className="max-w-md mx-auto bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🌿</span>
              <span className="font-semibold text-purple-600 dark:text-purple-400">
                Wellness Level {wellnessLevel}
              </span>
            </div>
            <span className="text-sm text-slate-600 dark:text-slate-400">
              {totalXP} XP
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${xpProgress}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 text-center">
            {xpToNextLevel - (totalXP % 100)} XP to Level {wellnessLevel + 1}
          </p>
        </div>
      </div>

      {/* Session Templates or Active Session */}
      {!sessionActive && currentPhase !== 'complete' ? (
        <div className="grid md:grid-cols-2 gap-6">
          {TEMPLATES.map(template => (
            <motion.button
              key={template.key}
              onClick={() => handleStartSession(template)}
              disabled={loading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`bg-gradient-to-br ${template.gradient} rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 text-left disabled:opacity-50`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-5xl">{template.icon}</span>
                  <span className="text-sm font-semibold text-slate-700 bg-white/50 px-3 py-1 rounded-full">
                    {template.duration}
                  </span>
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-slate-800 mb-2">
                    {template.title}
                  </h3>
                  <p className="text-slate-700 text-sm">
                    {template.description}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <span className="text-xl">⭐</span>
                  <span className="font-medium">+{template.xpReward} XP</span>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      ) : sessionActive ? (
        <div className="space-y-8">
          {/* Active Session Display */}
          <div className={`bg-gradient-to-br ${selectedTemplate?.gradient} rounded-3xl p-12 shadow-2xl`}>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPhase}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="text-center space-y-6"
              >
                <div className="text-7xl mb-4">
                  {getPhaseIcon(currentPhase)}
                </div>
                <h3 className="text-3xl font-light text-slate-800">
                  {currentStep?.title}
                </h3>
                <p className="text-xl text-slate-700 leading-relaxed">
                  {currentStep?.instruction}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4">
              <div
                className={`bg-gradient-to-r ${selectedTemplate?.gradient} h-4 rounded-full transition-all duration-1000`}
                style={{ width: `${phaseProgress}%` }}
              />
            </div>
            <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
              <span>Phase {currentStepIndex + 1} of {sessionSteps.length}</span>
              <span>{Math.round(phaseProgress)}%</span>
            </div>
          </div>

          {/* Phase Timeline */}
          <div className="flex items-center justify-center gap-3">
            {sessionSteps.map((step, i) => (
              <div
                key={i}
                className={`flex flex-col items-center gap-1 ${
                  i === currentStepIndex ? 'scale-125' : 'opacity-50'
                } transition-all duration-300`}
              >
                <div className={`w-3 h-3 rounded-full ${
                  i < currentStepIndex
                    ? 'bg-emerald-500'
                    : i === currentStepIndex
                    ? `bg-gradient-to-r ${selectedTemplate?.gradient}`
                    : 'bg-slate-300 dark:bg-slate-600'
                }`} />
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  {step.phase}
                </span>
              </div>
            ))}
          </div>

          {/* Stop Button */}
          <div className="flex justify-center">
            <button
              onClick={handleStopSession}
              className="px-8 py-3 bg-red-400 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              Stop Session
            </button>
          </div>
        </div>
      ) : (
        /* Completion Reward */
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`bg-gradient-to-br ${selectedTemplate?.gradient} rounded-3xl p-12 shadow-2xl text-center space-y-6`}
        >
          <div className="text-7xl">🎉</div>
          <h3 className="text-3xl font-semibold text-slate-800">
            Session Complete!
          </h3>
          <div className="space-y-2">
            <p className="text-2xl font-bold text-slate-800">
              +{xpEarned} Wellness XP 🌿
            </p>
            <p className="text-slate-700">
              You're now at {totalXP} XP (Level {wellnessLevel})
            </p>
          </div>
          <button
            onClick={() => {
              setCurrentPhase('ready');
              setSelectedTemplate(null);
            }}
            className="px-8 py-3 bg-white/80 text-slate-800 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            Choose Another Session
          </button>
        </motion.div>
      )}

      {/* Floating Reward Animation */}
      <AnimatePresence>
        {showReward && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.5 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -100, scale: 0.5 }}
            className="fixed inset-0 flex items-center justify-center pointer-events-none z-50"
          >
            <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm px-8 py-6 rounded-full shadow-2xl">
              <p className="text-3xl font-bold text-purple-600">
                +{xpEarned} XP! 🌟
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
