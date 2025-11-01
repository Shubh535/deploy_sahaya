"use client";

import React, { useState, useEffect } from "react";
import { plantTree } from "../sanjha-grove/useGarden";
import RequireAuth from "../components/RequireAuth";
import { apiRequest } from "../utils/apiClient";

// Enhanced scenarios with real-world contexts
const SCENARIOS = [
  {
    key: "job-interview",
    label: "Job Interview",
    icon: "💼",
    description: "Practice professional interviews with AI-driven questions and feedback on confidence, clarity, and body language cues.",
    prompt: "You are in a job interview for a software engineering position. The interviewer will ask you behavioral and technical questions.",
    difficulty: "intermediate",
    skills: ["confidence", "clarity", "professionalism"]
  },
  {
    key: "parent-talk",
    label: "Difficult Parent Conversation",
    icon: "👨‍👩‍👦",
    description: "Navigate sensitive family discussions with empathy, active listening, and boundary setting.",
    prompt: "Your parents are concerned about your career choices and want to have a serious conversation about your future.",
    difficulty: "advanced",
    skills: ["empathy", "boundaries", "emotional-regulation"]
  },
  {
    key: "presentation",
    label: "Public Presentation",
    icon: "🎤",
    description: "Deliver compelling presentations with clear structure, engaging delivery, and audience connection.",
    prompt: "You need to present your project to a group of 30 people, including senior stakeholders.",
    difficulty: "intermediate",
    skills: ["clarity", "confidence", "engagement"]
  },
  {
    key: "conflict-resolution",
    label: "Peer Conflict Resolution",
    icon: "🤝",
    description: "Mediate disagreements with assertiveness, empathy, and collaborative problem-solving.",
    prompt: "Two team members are in conflict about project responsibilities, and you need to help resolve it.",
    difficulty: "advanced",
    skills: ["empathy", "assertiveness", "problem-solving"]
  },
  {
    key: "feedback-giving",
    label: "Giving Constructive Feedback",
    icon: "💬",
    description: "Deliver criticism constructively while maintaining positive relationships and encouraging growth.",
    prompt: "You need to give feedback to a colleague whose work quality has declined recently.",
    difficulty: "intermediate",
    skills: ["empathy", "clarity", "tact"]
  },
  {
    key: "negotiation",
    label: "Salary Negotiation",
    icon: "💰",
    description: "Negotiate effectively with confidence, research-backed arguments, and professional composure.",
    prompt: "You've received a job offer but want to negotiate a higher salary and better benefits.",
    difficulty: "advanced",
    skills: ["confidence", "assertiveness", "research"]
  }
];

interface UserProgress {
  level: number;
  xp: number;
  badges: string[];
  skillLevels: Record<string, number>;
  completedScenarios: string[];
  totalPractices: number;
}

interface DetailedFeedback {
  overall: string;
  empathy: { score: number; feedback: string };
  tone: { score: number; feedback: string };
  clarity: { score: number; feedback: string };
  suggestions: string[];
  strengths: string[];
  areasToImprove: string[];
  xpGained: number;
  badgeEarned?: string;
}

export default function PracticeSpaceEnhancedPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [conversationHistory, setConversationHistory] = useState<Array<{user: string; ai: string}>>([]);
  const [userInput, setUserInput] = useState("");
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<DetailedFeedback | null>(null);
  const [loading, setLoading] = useState(false);
  const [turnCount, setTurnCount] = useState(0);
  const [progress, setProgress] = useState<UserProgress>({
    level: 1,
    xp: 0,
    badges: [],
    skillLevels: {
      empathy: 1,
      clarity: 1,
      confidence: 1,
      assertiveness: 1,
      professionalism: 1
    },
    completedScenarios: [],
    totalPractices: 0
  });
  const [showProgress, setShowProgress] = useState(false);
  const [particles, setParticles] = useState<Array<{
    left: string;
    top: string;
    animationDelay: string;
    animationDuration: string;
    size: string;
    color: string;
  }>>([]);

  // Generate particles
  useEffect(() => {
    const colors = ['bg-purple-200', 'bg-pink-200', 'bg-blue-200', 'bg-indigo-200', 'bg-violet-200'];
    const newParticles = [...Array(20)].map(() => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 8}s`,
      animationDuration: `${6 + Math.random() * 4}s`,
      size: `${Math.random() * 6 + 2}px`,
      color: colors[Math.floor(Math.random() * colors.length)]
    }));
    setParticles(newParticles);
  }, []);

  // Load user progress
  useEffect(() => {
    const loadProgress = async () => {
      try {
        const data = await apiRequest('/api/practice/progress', { method: 'GET' });
        if (data.progress) {
          setProgress(data.progress);
        }
      } catch (err) {
        console.log('No previous progress found, starting fresh');
      }
    };
    loadProgress();
  }, []);

  const handleScenario = (key: string) => {
    setSelected(key);
    setUserInput("");
    setAiResponse(null);
    setFeedback(null);
    setConversationHistory([]);
    setTurnCount(0);
  };

  const handleSend = async () => {
    if (!userInput.trim() || loading) return;
    
    setLoading(true);
    setFeedback(null);
    
    try {
      const res = await apiRequest('/api/practice/simulate-enhanced', {
        method: 'POST',
        body: JSON.stringify({ 
          scenario: selected, 
          userInput,
          conversationHistory,
          turnCount
        }),
      });

      setAiResponse(res.aiResponse);
      setConversationHistory(prev => [...prev, { user: userInput, ai: res.aiResponse }]);
      setTurnCount(prev => prev + 1);
      setUserInput("");

      // Get detailed feedback every 2-3 turns
      if (turnCount > 0 && turnCount % 2 === 0) {
        const feedbackRes = await apiRequest('/api/practice/feedback-enhanced', {
          method: 'POST',
          body: JSON.stringify({
            scenario: selected,
            conversationHistory: [...conversationHistory, { user: userInput, ai: res.aiResponse }]
          })
        });
        
        setFeedback(feedbackRes.feedback);
        
        // Update progress
        const newProgress = {
          ...progress,
          xp: progress.xp + feedbackRes.feedback.xpGained,
          totalPractices: progress.totalPractices + 1
        };
        
        // Level up?
        const newLevel = Math.floor(newProgress.xp / 100) + 1;
        if (newLevel > progress.level) {
          newProgress.level = newLevel;
          alert(`🎉 Level Up! You're now level ${newLevel}!`);
        }
        
        // Badge earned?
        if (feedbackRes.feedback.badgeEarned && !progress.badges.includes(feedbackRes.feedback.badgeEarned)) {
          newProgress.badges = [...progress.badges, feedbackRes.feedback.badgeEarned];
        }
        
        setProgress(newProgress);
        
        // Save progress
        await apiRequest('/api/practice/progress', {
          method: 'POST',
          body: JSON.stringify({ progress: newProgress })
        });
        
        // Plant a tree for growth
        const color = '#a78bfa'; // purple for practice
        const x = Math.random();
        const y = 0.6 + Math.random() * 0.3;
        await plantTree({ x, y, color, mood: 'practice' });
      }
      
    } catch (err) {
      console.error('Practice simulation error:', err);
      setAiResponse("I'm having trouble connecting right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEndSession = () => {
    setSelected(null);
    setConversationHistory([]);
    setUserInput("");
    setAiResponse(null);
    setFeedback(null);
    setTurnCount(0);
  };

  const selectedScenario = SCENARIOS.find(s => s.key === selected);
  const xpToNextLevel = (progress.level * 100) - progress.xp;
  const xpProgress = (progress.xp % 100);

  return (
    <RequireAuth>
      <main className='relative flex flex-col items-center justify-center min-h-screen px-4 py-12 overflow-hidden bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900'>
        
        {/* Animated background elements */}
        <div className='absolute top-16 left-12 text-5xl animate-bounce opacity-20'>💼</div>
        <div className='absolute top-32 right-20 text-4xl animate-pulse opacity-15'>🎤</div>
        <div className='absolute bottom-40 left-16 text-6xl animate-float opacity-10'>🤝</div>
        <div className='absolute bottom-24 right-12 text-4xl animate-bounce opacity-25'>💬</div>
        
        {/* Particles */}
        <div className='absolute inset-0 z-0'>
          {particles.map((particle, i) => (
            <div
              key={i}
              className={`absolute rounded-full opacity-40 animate-float ${particle.color}`}
              style={{
                left: particle.left,
                top: particle.top,
                width: particle.size,
                height: particle.size,
                animationDelay: particle.animationDelay,
                animationDuration: particle.animationDuration
              }}
            />
          ))}
        </div>

        {/* Main content */}
        <div className='relative z-10 w-full max-w-6xl mx-auto'>
          
          {/* Header with Progress */}
          <header className='mb-8 text-center'>
            <div className='text-7xl mb-4 animate-pulse'>🎭</div>
            <h1 className='text-5xl sm:text-6xl font-bold mb-3 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent'>
              Practice Space Pro
            </h1>
            <p className='text-lg text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto'>
              AI-Driven Conversation Simulations for Real-World Success
            </p>
            
            {/* Progress bar */}
            <div className='max-w-md mx-auto bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg'>
              <div className='flex items-center justify-between mb-2'>
                <div className='flex items-center gap-2'>
                  <span className='text-2xl'>⭐</span>
                  <span className='font-bold text-purple-600 dark:text-purple-400'>Level {progress.level}</span>
                </div>
                <button 
                  onClick={() => setShowProgress(!showProgress)}
                  className='text-sm text-purple-600 dark:text-purple-400 hover:underline'
                >
                  {showProgress ? 'Hide' : 'View'} Stats
                </button>
              </div>
              <div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-2'>
                <div 
                  className='bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500'
                  style={{ width: `${xpProgress}%` }}
                />
              </div>
              <div className='text-xs text-gray-600 dark:text-gray-400'>
                {progress.xp} XP • {xpToNextLevel} XP to Level {progress.level + 1}
              </div>
              
              {/* Badges */}
              {progress.badges.length > 0 && (
                <div className='mt-3 flex gap-2 justify-center flex-wrap'>
                  {progress.badges.map(badge => (
                    <span key={badge} className='text-2xl' title={badge}>
                      {badge === 'first-practice' && '🎓'}
                      {badge === 'empathy-master' && '💝'}
                      {badge === 'clarity-champion' && '💎'}
                      {badge === 'confident-communicator' && '🦁'}
                      {badge === 'practice-warrior' && '⚔️'}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Detailed Stats Modal */}
            {showProgress && (
              <div className='mt-4 max-w-2xl mx-auto bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl'>
                <h3 className='text-xl font-bold mb-4 text-purple-600 dark:text-purple-400'>Your Growth Journey</h3>
                <div className='grid grid-cols-2 gap-4 text-left'>
                  <div>
                    <div className='text-sm text-gray-600 dark:text-gray-400'>Total Practices</div>
                    <div className='text-2xl font-bold text-purple-600'>{progress.totalPractices}</div>
                  </div>
                  <div>
                    <div className='text-sm text-gray-600 dark:text-gray-400'>Badges Earned</div>
                    <div className='text-2xl font-bold text-pink-600'>{progress.badges.length}</div>
                  </div>
                </div>
                
                <div className='mt-4'>
                  <h4 className='font-semibold mb-2 text-gray-700 dark:text-gray-300'>Skill Levels</h4>
                  {Object.entries(progress.skillLevels).map(([skill, level]) => (
                    <div key={skill} className='mb-2'>
                      <div className='flex justify-between text-sm mb-1'>
                        <span className='capitalize text-gray-700 dark:text-gray-300'>{skill}</span>
                        <span className='text-purple-600 dark:text-purple-400'>Level {level}</span>
                      </div>
                      <div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2'>
                        <div 
                          className='bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full'
                          style={{ width: `${(level / 10) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </header>

          {/* Scenario Selection or Active Practice */}
          {!selected ? (
            <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
              {SCENARIOS.map(scenario => (
                <button
                  key={scenario.key}
                  onClick={() => handleScenario(scenario.key)}
                  className='bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 text-left hover:scale-105 hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-purple-400'
                >
                  <div className='text-4xl mb-3'>{scenario.icon}</div>
                  <h3 className='text-xl font-bold mb-2 text-gray-800 dark:text-gray-200'>{scenario.label}</h3>
                  <p className='text-sm text-gray-600 dark:text-gray-400 mb-3'>{scenario.description}</p>
                  <div className='flex gap-2 flex-wrap'>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      scenario.difficulty === 'beginner' ? 'bg-green-100 text-green-700' :
                      scenario.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {scenario.difficulty}
                    </span>
                    {scenario.skills.slice(0, 2).map(skill => (
                      <span key={skill} className='text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'>
                        {skill}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className='max-w-4xl mx-auto space-y-6'>
              
              {/* Scenario Header */}
              <div className='bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl'>
                <div className='flex items-center justify-between mb-4'>
                  <div className='flex items-center gap-3'>
                    <span className='text-4xl'>{selectedScenario?.icon}</span>
                    <div>
                      <h2 className='text-2xl font-bold text-gray-800 dark:text-gray-200'>{selectedScenario?.label}</h2>
                      <p className='text-sm text-gray-600 dark:text-gray-400'>Turn {turnCount + 1}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleEndSession}
                    className='px-4 py-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition'
                  >
                    End Session
                  </button>
                </div>
                <div className='bg-purple-50 dark:bg-purple-900/30 rounded-lg p-4'>
                  <p className='text-gray-700 dark:text-gray-300'>{selectedScenario?.prompt}</p>
                </div>
              </div>

              {/* Conversation History */}
              {conversationHistory.length > 0 && (
                <div className='bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl max-h-96 overflow-y-auto space-y-4'>
                  {conversationHistory.map((exchange, idx) => (
                    <div key={idx} className='space-y-3'>
                      <div className='flex gap-3'>
                        <div className='text-2xl'>👤</div>
                        <div className='flex-1 bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3'>
                          <div className='text-xs text-gray-500 dark:text-gray-400 mb-1'>You</div>
                          <p className='text-gray-800 dark:text-gray-200'>{exchange.user}</p>
                        </div>
                      </div>
                      <div className='flex gap-3'>
                        <div className='text-2xl'>🤖</div>
                        <div className='flex-1 bg-purple-50 dark:bg-purple-900/30 rounded-lg p-3'>
                          <div className='text-xs text-gray-500 dark:text-gray-400 mb-1'>AI Interviewer</div>
                          <p className='text-gray-800 dark:text-gray-200'>{exchange.ai}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Latest AI Response */}
              {aiResponse && conversationHistory.length === 0 && (
                <div className='bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl'>
                  <div className='flex gap-3'>
                    <div className='text-3xl'>🤖</div>
                    <div className='flex-1'>
                      <div className='text-sm text-gray-500 dark:text-gray-400 mb-2'>AI Interviewer</div>
                      <p className='text-gray-800 dark:text-gray-200 leading-relaxed'>{aiResponse}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Detailed Feedback */}
              {feedback && (
                <div className='bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40 rounded-2xl p-6 shadow-xl'>
                  <div className='flex items-center gap-3 mb-4'>
                    <span className='text-3xl'>📊</span>
                    <h3 className='text-2xl font-bold text-gray-800 dark:text-gray-200'>Detailed Feedback</h3>
                  </div>
                  
                  {/* Overall */}
                  <div className='bg-white/70 dark:bg-gray-800/70 rounded-lg p-4 mb-4'>
                    <p className='text-gray-800 dark:text-gray-200 leading-relaxed'>{feedback.overall}</p>
                  </div>

                  {/* Score Breakdown */}
                  <div className='grid md:grid-cols-3 gap-4 mb-4'>
                    <div className='bg-white/70 dark:bg-gray-800/70 rounded-lg p-4'>
                      <div className='flex items-center justify-between mb-2'>
                        <span className='text-sm font-semibold text-gray-700 dark:text-gray-300'>💝 Empathy</span>
                        <span className='text-lg font-bold text-purple-600'>{feedback.empathy.score}/10</span>
                      </div>
                      <div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2'>
                        <div 
                          className='bg-purple-500 h-2 rounded-full'
                          style={{ width: `${feedback.empathy.score * 10}%` }}
                        />
                      </div>
                      <p className='text-xs text-gray-600 dark:text-gray-400'>{feedback.empathy.feedback}</p>
                    </div>

                    <div className='bg-white/70 dark:bg-gray-800/70 rounded-lg p-4'>
                      <div className='flex items-center justify-between mb-2'>
                        <span className='text-sm font-semibold text-gray-700 dark:text-gray-300'>🎵 Tone</span>
                        <span className='text-lg font-bold text-pink-600'>{feedback.tone.score}/10</span>
                      </div>
                      <div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2'>
                        <div 
                          className='bg-pink-500 h-2 rounded-full'
                          style={{ width: `${feedback.tone.score * 10}%` }}
                        />
                      </div>
                      <p className='text-xs text-gray-600 dark:text-gray-400'>{feedback.tone.feedback}</p>
                    </div>

                    <div className='bg-white/70 dark:bg-gray-800/70 rounded-lg p-4'>
                      <div className='flex items-center justify-between mb-2'>
                        <span className='text-sm font-semibold text-gray-700 dark:text-gray-300'>💎 Clarity</span>
                        <span className='text-lg font-bold text-blue-600'>{feedback.clarity.score}/10</span>
                      </div>
                      <div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2'>
                        <div 
                          className='bg-blue-500 h-2 rounded-full'
                          style={{ width: `${feedback.clarity.score * 10}%` }}
                        />
                      </div>
                      <p className='text-xs text-gray-600 dark:text-gray-400'>{feedback.clarity.feedback}</p>
                    </div>
                  </div>

                  {/* Strengths and Areas to Improve */}
                  <div className='grid md:grid-cols-2 gap-4 mb-4'>
                    <div className='bg-green-50 dark:bg-green-900/30 rounded-lg p-4'>
                      <div className='flex items-center gap-2 mb-2'>
                        <span className='text-xl'>✨</span>
                        <h4 className='font-semibold text-green-700 dark:text-green-300'>Strengths</h4>
                      </div>
                      <ul className='space-y-1'>
                        {feedback.strengths.map((strength, idx) => (
                          <li key={idx} className='text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2'>
                            <span className='text-green-500'>✓</span>
                            <span>{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className='bg-yellow-50 dark:bg-yellow-900/30 rounded-lg p-4'>
                      <div className='flex items-center gap-2 mb-2'>
                        <span className='text-xl'>🎯</span>
                        <h4 className='font-semibold text-yellow-700 dark:text-yellow-300'>Areas to Improve</h4>
                      </div>
                      <ul className='space-y-1'>
                        {feedback.areasToImprove.map((area, idx) => (
                          <li key={idx} className='text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2'>
                            <span className='text-yellow-500'>→</span>
                            <span>{area}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Suggestions */}
                  <div className='bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4'>
                    <div className='flex items-center gap-2 mb-2'>
                      <span className='text-xl'>💡</span>
                      <h4 className='font-semibold text-blue-700 dark:text-blue-300'>Actionable Suggestions</h4>
                    </div>
                    <ul className='space-y-2'>
                      {feedback.suggestions.map((suggestion, idx) => (
                        <li key={idx} className='text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2'>
                          <span className='text-blue-500 font-bold'>{idx + 1}.</span>
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* XP Gained */}
                  <div className='mt-4 text-center'>
                    <div className='inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full font-semibold'>
                      <span className='text-xl'>⭐</span>
                      <span>+{feedback.xpGained} XP Earned!</span>
                    </div>
                    {feedback.badgeEarned && (
                      <div className='mt-2 text-2xl'>
                        🏆 Badge Unlocked: {feedback.badgeEarned}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Input Area */}
              <div className='bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl'>
                <label className='block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2'>
                  Your Response
                </label>
                <textarea
                  className='w-full min-h-[120px] rounded-xl border-2 border-gray-200 dark:border-gray-700 px-4 py-3 text-base bg-white dark:bg-gray-900 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all text-gray-800 dark:text-gray-200 placeholder-gray-400 resize-none'
                  placeholder="Type your response here..."
                  value={userInput}
                  onChange={e => setUserInput(e.target.value)}
                  disabled={loading}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && e.ctrlKey) {
                      handleSend();
                    }
                  }}
                />
                <div className='flex items-center justify-between mt-3'>
                  <span className='text-xs text-gray-500 dark:text-gray-400'>
                    Tip: Press Ctrl+Enter to send
                  </span>
                  <button
                    onClick={handleSend}
                    disabled={loading || !userInput.trim()}
                    className='px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 shadow-lg'
                  >
                    {loading ? (
                      <span className='flex items-center gap-2'>
                        <div className='animate-spin'>⚙️</div>
                        Processing...
                      </span>
                    ) : (
                      <span className='flex items-center gap-2'>
                        <span>Send</span>
                        <span>→</span>
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </RequireAuth>
  );
}
