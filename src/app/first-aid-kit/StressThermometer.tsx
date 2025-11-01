"use client";
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface StressLog {
  level: number;
  timestamp: number;
  note?: string;
}

const STRESS_LEVELS = [
  { value: 0, label: 'Completely Calm', color: 'from-green-400 to-emerald-400', emoji: '😌', description: 'Feeling peaceful and relaxed' },
  { value: 1, label: 'Very Relaxed', color: 'from-green-300 to-green-400', emoji: '😊', description: 'Comfortable and at ease' },
  { value: 2, label: 'Relaxed', color: 'from-lime-300 to-green-300', emoji: '🙂', description: 'Generally calm' },
  { value: 3, label: 'Slightly Tense', color: 'from-yellow-300 to-lime-300', emoji: '😐', description: 'Minor tension noticeable' },
  { value: 4, label: 'Somewhat Stressed', color: 'from-yellow-400 to-yellow-300', emoji: '😕', description: 'Starting to feel pressure' },
  { value: 5, label: 'Moderately Stressed', color: 'from-orange-300 to-yellow-400', emoji: '😟', description: 'Noticeable stress' },
  { value: 6, label: 'Stressed', color: 'from-orange-400 to-orange-300', emoji: '😰', description: 'Feeling overwhelmed' },
  { value: 7, label: 'Very Stressed', color: 'from-red-400 to-orange-400', emoji: '😨', description: 'High stress level' },
  { value: 8, label: 'Extremely Stressed', color: 'from-red-500 to-red-400', emoji: '😱', description: 'Severe stress' },
  { value: 9, label: 'Panic Level', color: 'from-red-600 to-red-500', emoji: '😵', description: 'Crisis stress' },
  { value: 10, label: 'Crisis', color: 'from-red-700 to-red-600', emoji: '🆘', description: 'Emergency level stress' }
];

const TOOL_RECOMMENDATIONS: Record<string, {
  levels: number[];
  title: string;
  tools: Array<{ icon: string; name: string; description: string }>;
  alert?: string;
}> = {
  low: {
    levels: [0, 1, 2, 3],
    title: 'Maintain Your Calm',
    tools: [
      { icon: '🧘', name: 'Mindfulness Session', description: 'Deepen your relaxation' },
      { icon: '📝', name: 'Gratitude Journal', description: 'Appreciate good moments' },
      { icon: '🎵', name: 'Calming Sounds', description: 'Ambient soundscapes' }
    ]
  },
  medium: {
    levels: [4, 5, 6],
    title: 'Reduce Your Stress',
    tools: [
      { icon: '💨', name: 'Breathing Exercise', description: '4-4-6 technique' },
      { icon: '💭', name: 'Affirmations', description: 'Positive self-talk' },
      { icon: '🎧', name: 'Progressive Relaxation', description: 'Release muscle tension' }
    ]
  },
  high: {
    levels: [7, 8, 9, 10],
    title: 'Immediate Relief Needed',
    tools: [
      { icon: '✋', name: '5-4-3-2-1 Grounding', description: 'Quick anxiety relief' },
      { icon: '🧊', name: 'Ice Cube Technique', description: 'Physical grounding' },
      { icon: '📞', name: 'Reach Out', description: 'Contact support person' }
    ],
    alert: 'Your stress is very high. Consider taking a break and using multiple tools.'
  }
};

export default function StressThermometer() {
  const [currentLevel, setCurrentLevel] = useState<number | null>(null);
  const [stressHistory, setStressHistory] = useState<StressLog[]>([]);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [hoveredLevel, setHoveredLevel] = useState<number | null>(null);

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('stressHistory');
    if (saved) {
      setStressHistory(JSON.parse(saved));
    }
  }, []);

  const logStressLevel = (level: number) => {
    const newLog: StressLog = {
      level,
      timestamp: Date.now()
    };
    
    const updatedHistory = [newLog, ...stressHistory].slice(0, 50); // Keep last 50 entries
    setStressHistory(updatedHistory);
    localStorage.setItem('stressHistory', JSON.stringify(updatedHistory));
    
    setCurrentLevel(level);
    setShowRecommendations(true);
  };

  const getRecommendations = (level: number) => {
    if (TOOL_RECOMMENDATIONS.high.levels.includes(level)) {
      return TOOL_RECOMMENDATIONS.high;
    } else if (TOOL_RECOMMENDATIONS.medium.levels.includes(level)) {
      return TOOL_RECOMMENDATIONS.medium;
    } else {
      return TOOL_RECOMMENDATIONS.low;
    }
  };

  const getTodayAverage = () => {
    const today = new Date().setHours(0, 0, 0, 0);
    const todayLogs = stressHistory.filter(log => log.timestamp >= today);
    if (todayLogs.length === 0) return null;
    return (todayLogs.reduce((sum, log) => sum + log.level, 0) / todayLogs.length).toFixed(1);
  };

  const getWeekTrend = () => {
    const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const weekLogs = stressHistory.filter(log => log.timestamp >= weekAgo);
    if (weekLogs.length < 2) return null;
    
    const firstHalf = weekLogs.slice(Math.floor(weekLogs.length / 2));
    const secondHalf = weekLogs.slice(0, Math.floor(weekLogs.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, log) => sum + log.level, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, log) => sum + log.level, 0) / secondHalf.length;
    
    const diff = secondAvg - firstAvg;
    if (diff < -0.5) return 'improving';
    if (diff > 0.5) return 'worsening';
    return 'stable';
  };

  const displayLevel = hoveredLevel !== null ? hoveredLevel : currentLevel;
  const levelInfo = displayLevel !== null ? STRESS_LEVELS[displayLevel] : null;
  const recommendations = currentLevel !== null ? getRecommendations(currentLevel) : null;

  return (
    <div className="flex flex-col gap-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 shadow-lg border border-blue-100 animate-fadein">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-4xl">🌡️</span>
        <div>
          <div className="text-xl font-semibold text-blue-700">Stress Thermometer</div>
          <div className="text-sm text-blue-600">Track and manage your stress levels</div>
        </div>
      </div>

      {/* Stats */}
      {stressHistory.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-2">
          <div className="bg-white/60 backdrop-blur rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {getTodayAverage() || '--'}
            </div>
            <div className="text-xs text-slate-600">Today's Average</div>
          </div>
          <div className="bg-white/60 backdrop-blur rounded-lg p-3 text-center">
            <div className="text-2xl">
              {getWeekTrend() === 'improving' && '📉'}
              {getWeekTrend() === 'worsening' && '📈'}
              {getWeekTrend() === 'stable' && '➡️'}
              {!getWeekTrend() && '--'}
            </div>
            <div className="text-xs text-slate-600">
              {getWeekTrend() === 'improving' && 'Improving'}
              {getWeekTrend() === 'worsening' && 'Needs Attention'}
              {getWeekTrend() === 'stable' && 'Stable'}
              {!getWeekTrend() && 'Week Trend'}
            </div>
          </div>
        </div>
      )}

      {/* Thermometer Scale */}
      <div className="relative">
        <div className="text-sm font-semibold text-center text-slate-700 mb-2">
          Tap your current stress level
        </div>
        
        <div className="space-y-1">
          {STRESS_LEVELS.map((level) => (
            <motion.button
              key={level.value}
              onClick={() => logStressLevel(level.value)}
              onMouseEnter={() => setHoveredLevel(level.value)}
              onMouseLeave={() => setHoveredLevel(null)}
              className={`w-full h-10 rounded-lg bg-gradient-to-r ${level.color} 
                         flex items-center justify-between px-4 transition-all
                         hover:scale-105 hover:shadow-lg relative overflow-hidden`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="text-white font-bold drop-shadow">
                {level.value}
              </span>
              <span className="text-2xl drop-shadow">{level.emoji}</span>
              
              {/* Selection indicator */}
              {currentLevel === level.value && (
                <motion.div
                  layoutId="selected"
                  className="absolute inset-0 border-4 border-white rounded-lg"
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Level Description */}
      <AnimatePresence mode="wait">
        {levelInfo && (
          <motion.div
            key={levelInfo.value}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="bg-white/80 backdrop-blur rounded-lg p-4 text-center"
          >
            <div className="text-3xl mb-2">{levelInfo.emoji}</div>
            <div className="text-lg font-bold text-slate-700">{levelInfo.label}</div>
            <div className="text-sm text-slate-600">{levelInfo.description}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recommendations */}
      <AnimatePresence>
        {showRecommendations && recommendations && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3 overflow-hidden"
          >
            <div className="flex justify-between items-center">
              <div className="text-lg font-semibold text-blue-700">
                {recommendations.title}
              </div>
              <button
                onClick={() => setShowRecommendations(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {recommendations.alert && (
              <div className="bg-red-100 border border-red-300 rounded-lg p-3 text-sm text-red-700 flex items-start gap-2">
                <span>⚠️</span>
                <span>{recommendations.alert}</span>
              </div>
            )}

            <div className="grid gap-2">
              {recommendations.tools.map((tool, i) => (
                <div
                  key={i}
                  className="bg-white/80 backdrop-blur rounded-lg p-3 flex items-center gap-3 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <span className="text-3xl">{tool.icon}</span>
                  <div className="flex-1">
                    <div className="font-semibold text-slate-700">{tool.name}</div>
                    <div className="text-xs text-slate-600">{tool.description}</div>
                  </div>
                  <span className="text-blue-400">→</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="text-xs text-slate-500 text-center">
        💡 Regular stress tracking helps identify patterns and triggers
      </div>
    </div>
  );
}
