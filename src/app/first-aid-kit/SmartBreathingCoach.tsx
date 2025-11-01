"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiRequest } from '../utils/apiClient';

interface BreathingPattern {
  key: string;
  label: string;
  inhale: number;
  hold: number;
  exhale: number;
  description: string;
  color: string;
  gradient: string;
}

const PATTERNS: BreathingPattern[] = [
  {
    key: 'calm',
    label: '🌊 Calm',
    inhale: 4,
    hold: 4,
    exhale: 4,
    description: 'Balanced breathing for relaxation',
    color: '#A8C7FA',
    gradient: 'from-blue-200 to-cyan-200'
  },
  {
    key: 'focus',
    label: '🎯 Focus',
    inhale: 4,
    hold: 2,
    exhale: 6,
    description: 'Quick reset for concentration',
    color: '#F8C8DC',
    gradient: 'from-pink-200 to-amber-200'
  },
  {
    key: 'sleep',
    label: '😴 Sleep',
    inhale: 4,
    hold: 7,
    exhale: 8,
    description: 'Deep relaxation for bedtime',
    color: '#8AAAE5',
    gradient: 'from-indigo-200 to-purple-200'
  }
];

type Phase = 'inhale' | 'hold' | 'exhale' | 'ready';

export default function SmartBreathingCoach() {
  const [selectedPattern, setSelectedPattern] = useState<BreathingPattern>(PATTERNS[0]);
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<Phase>('ready');
  const [countdown, setCountdown] = useState(0);
  const [completedCycles, setCompletedCycles] = useState(0);
  const [totalCycles, setTotalCycles] = useState(5);
  const [narration, setNarration] = useState<string>('');
  const [showMotivation, setShowMotivation] = useState(false);
  const [motivationText, setMotivationText] = useState('');
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const motivationalMessages = [
    "You're doing great 🌟",
    "Stay present ✨",
    "Feel the calm 🌿",
    "You've got this 💪",
    "Breathe with intention 🧘",
    "Perfect rhythm 🎵",
    "Well done! 🌸",
    "Keep going 💙"
  ];

  // Generate narration on pattern change
  useEffect(() => {
    if (isActive) {
      generateNarration();
    }
  }, [selectedPattern]);

  const generateNarration = async () => {
    try {
      const response = await apiRequest('/api/wellness/narration', {
        method: 'POST',
        body: JSON.stringify({
          pattern: selectedPattern.key,
          inhale: selectedPattern.inhale,
          hold: selectedPattern.hold,
          exhale: selectedPattern.exhale
        })
      });
      setNarration(response.narration);
    } catch (error) {
      console.error('Failed to generate narration:', error);
    }
  };

  // Breathing cycle logic
  useEffect(() => {
    if (!isActive || phase === 'ready') return;

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          // Move to next phase
          if (phase === 'inhale') {
            setPhase('hold');
            return selectedPattern.hold;
          } else if (phase === 'hold') {
            setPhase('exhale');
            return selectedPattern.exhale;
          } else if (phase === 'exhale') {
            // Cycle complete
            const newCompletedCycles = completedCycles + 1;
            setCompletedCycles(newCompletedCycles);
            
            // Show motivation every cycle
            showRandomMotivation();
            
            // Check if all cycles completed
            if (newCompletedCycles >= totalCycles) {
              handleSessionComplete();
              return 0;
            }
            
            // Start new cycle
            setPhase('inhale');
            return selectedPattern.inhale;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, phase, countdown, completedCycles, selectedPattern, totalCycles]);

  const showRandomMotivation = () => {
    const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
    setMotivationText(randomMessage);
    setShowMotivation(true);
    setTimeout(() => setShowMotivation(false), 2000);
  };

  const handleStart = () => {
    setIsActive(true);
    setPhase('inhale');
    setCountdown(selectedPattern.inhale);
    setCompletedCycles(0);
    generateNarration();
  };

  const handleStop = () => {
    setIsActive(false);
    setPhase('ready');
    setCountdown(0);
  };

  const handleSessionComplete = async () => {
    setIsActive(false);
    setPhase('ready');
    setMotivationText('Session Complete! 🎉');
    setShowMotivation(true);
    
    // Save session to Firestore
    try {
      await apiRequest('/api/wellness/breathing-session', {
        method: 'POST',
        body: JSON.stringify({
          pattern: selectedPattern.key,
          cycles: completedCycles,
          duration: (selectedPattern.inhale + selectedPattern.hold + selectedPattern.exhale) * completedCycles,
          timestamp: Date.now()
        })
      });
    } catch (error) {
      console.error('Failed to save session:', error);
    }
    
    setTimeout(() => setShowMotivation(false), 3000);
  };

  // Calculate circle scale based on phase
  const getCircleScale = () => {
    if (phase === 'inhale') {
      const progress = 1 - (countdown / selectedPattern.inhale);
      return 0.6 + (0.4 * progress); // Scale from 0.6 to 1.0
    } else if (phase === 'exhale') {
      const progress = 1 - (countdown / selectedPattern.exhale);
      return 1.0 - (0.4 * progress); // Scale from 1.0 to 0.6
    }
    return 1.0; // Hold phase
  };

  const getPhaseText = () => {
    switch (phase) {
      case 'inhale': return 'Breathe In';
      case 'hold': return 'Hold';
      case 'exhale': return 'Breathe Out';
      default: return 'Ready to Begin';
    }
  };

  const getPhaseColor = () => {
    switch (phase) {
      case 'inhale': return selectedPattern.color;
      case 'hold': return '#C6E7E3';
      case 'exhale': return '#8AAAE5';
      default: return '#E0E0E0';
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-light text-slate-700 dark:text-slate-200">
          Smart Breathing Coach
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          AI-guided breathing exercises with personalized rhythm
        </p>
      </div>

      {/* Pattern Selector */}
      <div className="flex justify-center gap-3">
        {PATTERNS.map(pattern => (
          <button
            key={pattern.key}
            onClick={() => {
              if (!isActive) {
                setSelectedPattern(pattern);
              }
            }}
            disabled={isActive}
            className={`px-6 py-3 rounded-2xl font-medium transition-all duration-300 ${
              selectedPattern.key === pattern.key
                ? `bg-gradient-to-r ${pattern.gradient} text-slate-800 shadow-lg scale-105`
                : 'bg-white/70 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 hover:scale-105'
            } ${isActive ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {pattern.label}
          </button>
        ))}
      </div>

      {/* Pattern Description */}
      <div className="text-center">
        <p className="text-slate-600 dark:text-slate-400 text-sm">
          {selectedPattern.description}
        </p>
        <p className="text-xs text-slate-500 mt-1">
          {selectedPattern.inhale}s inhale · {selectedPattern.hold}s hold · {selectedPattern.exhale}s exhale
        </p>
      </div>

      {/* Breathing Circle */}
      <div className="relative flex items-center justify-center h-80">
        {/* Animated Circle */}
        <motion.div
          animate={{
            scale: getCircleScale(),
          }}
          transition={{
            duration: 1,
            ease: "easeInOut"
          }}
          className="relative"
        >
          <div
            className="w-64 h-64 rounded-full shadow-2xl"
            style={{
              background: `radial-gradient(circle, ${getPhaseColor()} 0%, ${getPhaseColor()}88 50%, transparent 100%)`,
              boxShadow: `0 0 60px ${getPhaseColor()}aa`
            }}
          />
        </motion.div>

        {/* Phase Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <AnimatePresence mode="wait">
            <motion.div
              key={phase}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <p className="text-3xl font-light text-slate-700 dark:text-slate-200 mb-2">
                {getPhaseText()}
              </p>
              {isActive && (
                <p className="text-5xl font-bold text-slate-800 dark:text-slate-100">
                  {countdown}
                </p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Motivation Text */}
        <AnimatePresence>
          {showMotivation && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 100 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -20 }}
              className="absolute bottom-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg"
            >
              <p className="text-lg font-medium text-slate-700 dark:text-slate-200">
                {motivationText}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Progress Ring */}
      <div className="flex items-center justify-center gap-4">
        <div className="flex items-center gap-2">
          {[...Array(totalCycles)].map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                i < completedCycles
                  ? `bg-gradient-to-r ${selectedPattern.gradient}`
                  : 'bg-slate-300 dark:bg-slate-600'
              }`}
            />
          ))}
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {completedCycles} / {totalCycles} cycles
        </p>
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-4">
        {!isActive ? (
          <button
            onClick={handleStart}
            className="px-8 py-4 bg-gradient-to-r from-emerald-400 to-teal-400 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            <span className="flex items-center gap-2">
              <span className="text-xl">▶️</span>
              Start Session
            </span>
          </button>
        ) : (
          <button
            onClick={handleStop}
            className="px-8 py-4 bg-gradient-to-r from-red-400 to-rose-400 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            <span className="flex items-center gap-2">
              <span className="text-xl">⏹️</span>
              Stop Session
            </span>
          </button>
        )}
      </div>

      {/* Narration Display */}
      {narration && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg"
        >
          <p className="text-sm text-slate-600 dark:text-slate-400 italic text-center">
            💭 {narration}
          </p>
        </motion.div>
      )}
    </div>
  );
}
