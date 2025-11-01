

"use client";

import React, { useState, useEffect } from "react";
import { plantTree } from "../sanjha-grove/useGarden";
import RequireAuth from "../components/RequireAuth";
import { apiRequest } from "../utils/apiClient";

// Enhanced scenarios with real-world contexts
const SCENARIOS = [
  {
    key: "interview",
    label: "🎤 Job Interview",
    icon: "🎤",
    category: "Professional",
    difficulty: "Advanced",
    description: "Practice confident, professional communication in high-stakes interviews.",
    prompt: "You're in a final-round interview for your dream internship. The interviewer asks: 'Tell me about a time you failed and what you learned from it.'",
    context: "Professional interview setting. Focus on STAR method (Situation, Task, Action, Result) and demonstrate self-awareness.",
    skillsTargeted: ["confidence", "storytelling", "professionalism", "self-reflection"]
  },
  {
    key: "parent-talk",
    label: "👨‍👩‍👧 Parent Conversation",
    icon: "👨‍👩‍👧",
    category: "Family",
    difficulty: "Intermediate",
    description: "Navigate difficult conversations with parents about life choices and boundaries.",
    prompt: "Your parents are pressuring you to choose a career path you're not passionate about. You need to share your true interests.",
    context: "Family dinner setting. Balance respect with assertiveness. Acknowledge their concerns while expressing your needs.",
    skillsTargeted: ["empathy", "assertiveness", "emotional-intelligence", "boundary-setting"]
  },
  {
    key: "presentation",
    label: "📊 Academic Presentation",
    icon: "📊",
    category: "Academic",
    difficulty: "Intermediate",
    description: "Build confidence in public speaking and handling questions.",
    prompt: "You're presenting your research project to professors and peers. A professor challenges your methodology with a tough question.",
    context: "Academic setting with audience. Demonstrate knowledge, stay calm under pressure, and engage professionally.",
    skillsTargeted: ["confidence", "clarity", "composure", "critical-thinking"]
  },
  {
    key: "peer-conflict",
    label: "🤝 Peer Conflict Resolution",
    icon: "🤝",
    category: "Social",
    difficulty: "Intermediate",
    description: "Resolve conflicts with friends or classmates constructively.",
    prompt: "A close friend publicly embarrassed you in front of others. You need to address it without damaging the friendship.",
    context: "Private conversation. Use 'I' statements, express feelings without blame, and seek mutual understanding.",
    skillsTargeted: ["empathy", "assertiveness", "emotional-intelligence", "conflict-resolution"]
  },
  {
    key: "mentor-feedback",
    label: "💼 Receiving Critique",
    icon: "💼",
    category: "Professional",
    difficulty: "Advanced",
    description: "Accept and respond to constructive criticism professionally.",
    prompt: "Your project supervisor gives harsh criticism about your work quality, saying it's below expectations.",
    context: "Professional mentorship. Listen actively, ask clarifying questions, show willingness to improve.",
    skillsTargeted: ["composure", "growth-mindset", "professionalism", "active-listening"]
  },
  {
    key: "networking",
    label: "🌐 Professional Networking",
    icon: "🌐",
    category: "Professional",
    difficulty: "Beginner",
    description: "Initiate conversations and build professional connections.",
    prompt: "You're at a career fair and want to approach a senior professional from your dream company.",
    context: "Networking event. Be concise, show genuine interest, and create memorable first impressions.",
    skillsTargeted: ["confidence", "communication-clarity", "professionalism", "rapport-building"]
  },
  {
    key: "asking-help",
    label: "🆘 Asking for Help",
    icon: "🆘",
    category: "Personal Growth",
    difficulty: "Beginner",
    description: "Overcome barriers to asking for support when overwhelmed.",
    prompt: "You're struggling with mental health and need to tell someone (friend, counselor, or family) that you need help.",
    context: "Vulnerable conversation. Practice opening up, being specific about needs, and accepting support.",
    skillsTargeted: ["vulnerability", "self-awareness", "communication-clarity", "emotional-intelligence"]
  },
  {
    key: "negotiation",
    label: "💰 Salary Negotiation",
    icon: "💰",
    category: "Professional",
    difficulty: "Advanced",
    description: "Advocate for your worth in professional settings.",
    prompt: "You received a job offer but the salary is below market rate. You need to negotiate professionally.",
    context: "Professional negotiation. Research-backed arguments, confident but flexible tone, win-win mindset.",
    skillsTargeted: ["confidence", "assertiveness", "negotiation", "professionalism"]
  }
];

// Skill levels and badges
interface UserProgress {
  level: number;
  xp: number;
  xpToNextLevel: number;
  skillScores: {
    confidence: number;
    empathy: number;
    clarity: number;
    professionalism: number;
    assertiveness: number;
    [key: string]: number;
  };
  badges: Badge[];
  totalPractices: number;
  streak: number;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt?: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface DetailedFeedback {
  overall: string;
  empathyScore: number; // 0-100
  toneScore: number; // 0-100
  clarityScore: number; // 0-100
  strengthsFound: string[];
  areasToImprove: string[];
  specificSuggestions: string[];
  skillsImproved: string[];
  xpEarned: number;
}

const BADGES: Badge[] = [
  { id: 'first-practice', name: 'First Steps', description: 'Complete your first practice session', icon: '🌱', rarity: 'common' },
  { id: 'conversationalist', name: 'Conversationalist', description: 'Complete 10 practice sessions', icon: '💬', rarity: 'common' },
  { id: 'confident-speaker', name: 'Confident Speaker', description: 'Achieve 80+ confidence score', icon: '🎤', rarity: 'rare' },
  { id: 'empathy-master', name: 'Empathy Master', description: 'Achieve 90+ empathy score', icon: '💝', rarity: 'rare' },
  { id: 'interview-ace', name: 'Interview Ace', description: 'Excel in 5 interview simulations', icon: '👔', rarity: 'epic' },
  { id: 'family-bridge', name: 'Family Bridge', description: 'Master difficult family conversations', icon: '🌉', rarity: 'epic' },
  { id: 'communication-guru', name: 'Communication Guru', description: 'Reach Level 10', icon: '🏆', rarity: 'legendary' },
  { id: 'week-warrior', name: '7-Day Warrior', description: 'Practice 7 days in a row', icon: '🔥', rarity: 'rare' },
];

export default function PracticeSpacePage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [userInput, setUserInput] = useState("");
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null); // Changed to string for basic endpoint
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [turnCount, setTurnCount] = useState(0);
  const [userProgress, setUserProgress] = useState<UserProgress>({
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    skillScores: {
      confidence: 0,
      empathy: 0,
      clarity: 0,
      professionalism: 0,
      assertiveness: 0,
      'emotional-intelligence': 0,
      'communication-clarity': 0,
      'active-listening': 0
    },
    badges: [],
    totalPractices: 0,
    streak: 0
  });
  const [showProgress, setShowProgress] = useState(false);
  const [newBadgeEarned, setNewBadgeEarned] = useState<Badge | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [particles, setParticles] = useState<Array<{
    left: string;
    top: string;
    animationDelay: string;
    animationDuration: string;
    size: string;
    color: string;
  }>>([]);

  // Generate particles only on client side to avoid hydration mismatch
  useEffect(() => {
    const colors = ['bg-emerald-200', 'bg-teal-200', 'bg-cyan-200', 'bg-blue-200', 'bg-indigo-200', 'bg-purple-200'];
    const newParticles = [...Array(18)].map((_, i) => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 8}s`,
      animationDuration: `${6 + Math.random() * 4}s`,
      size: `${Math.random() * 6 + 2}px`,
      color: colors[Math.floor(Math.random() * colors.length)]
    }));
    setParticles(newParticles);
  }, []);

  const handleScenario = (key: string) => {
    setSelected(key);
    setUserInput("");
    setAiResponse(null);
    setFeedback(null);
    setHistory([]);
  };

  const handleSend = async () => {
    setLoading(true);
    setAiResponse(null);
    setFeedback(null);
    try {
      // Updated to use the correct practice endpoint with enhanced AI
      const res = await apiRequest('/api/practice/simulate', {
        method: 'POST',
        body: JSON.stringify({ 
          scenario: selected, 
          userInput, 
          history: history.map(h => ({ user: h.user, ai: h.ai })),
          userId: 'current-user' // Add userId for compatibility
        }),
      });
      setAiResponse(res.ai);
      setFeedback(res.feedback);
      setHistory(h => [...h, { user: userInput, ai: res.ai, fb: res.feedback }]);
      // Plant a tree for growth/learning
      const color = '#fcd34d'; // soft yellow for growth
      const x = Math.random();
      const y = 0.6 + Math.random() * 0.3;
      await plantTree({ x, y, color, mood: 'growth' });
    } catch (error) {
      console.error('Practice simulation error:', error);
      setAiResponse(null);
      setFeedback("Simulation temporarily unavailable.");
    } finally {
      setLoading(false);
    }
  };

  const handleReplay = (idx: number) => {
    const h = history[idx];
    setUserInput(h.user);
    setAiResponse(h.ai);
    setFeedback(h.fb);
  };

  return (
    <RequireAuth>
      <main className='relative flex flex-col items-center justify-center min-h-screen px-4 py-12 overflow-hidden'>
        {/* Soothing gradient background with animation */}
        <div className='absolute inset-0 z-0 animate-gradient-flow' />

        {/* Floating nature elements */}
        <div className='absolute top-16 left-12 text-5xl animate-bubble-gentle opacity-30'>🌸</div>
        <div className='absolute top-32 right-20 text-4xl animate-bubble-flow opacity-25'>🎭</div>
        <div className='absolute bottom-40 left-16 text-6xl animate-bubble-dance opacity-20'>🌿</div>
        <div className='absolute bottom-24 right-12 text-4xl animate-float-gentle opacity-35'>🕊️</div>
        <div className='absolute top-1/2 left-8 text-3xl animate-drift opacity-40'>✨</div>
        <div className='absolute top-3/4 right-16 text-5xl animate-float-slow opacity-25'>🌙</div>
        <div className='absolute top-20 left-1/3 text-4xl animate-breathe opacity-30'>💭</div>
        <div className='absolute bottom-32 right-1/3 text-3xl animate-float-wave opacity-35'>🌸</div>

        {/* Animated particles */}
        <div className='absolute inset-0 z-0'>
          {particles.map((particle, i) => (
            <div
              key={i}
              className={`absolute rounded-full opacity-60 animate-particle-float ${particle.color}`}
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
        <div className='relative z-10 w-full max-w-4xl mx-auto text-center'>
          {/* Header */}
          <header className='mb-12 animate-fade-in-gentle'>
            <div className='text-7xl mb-6 animate-pulse-soft'>🎭</div>
            <h1 className='text-6xl sm:text-7xl font-light mb-4 text-slate-700 dark:text-slate-200 tracking-wide'>
              Practice Space
            </h1>
            <p className='text-xl sm:text-2xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed font-light mb-8'>
              A safe space to practice mindfulness scenarios. Grow through gentle roleplay and compassionate feedback.
            </p>
          </header>

          {/* Main practice area */}
          <div className='glass-card max-w-3xl mx-auto animate-float-gentle'>
            <div className='w-full'>
              {!selected ? (
                <div className='space-y-6'>
                  <div className='text-center mb-8'>
                    <div className='text-4xl mb-4 animate-bounce'>🎭</div>
                    <h2 className='text-2xl font-light text-slate-700 dark:text-slate-200 mb-2'>Choose Your Scenario</h2>
                    <p className='text-slate-600 dark:text-slate-400 font-light'>Select a situation to practice mindful communication</p>
                  </div>
                  <div className='grid gap-4 md:grid-cols-2'>
                    {SCENARIOS.map(s => (
                      <button
                        key={s.key}
                        className='glass-card p-6 text-left hover:scale-105 transition-all duration-300 group animate-fade-in-gentle'
                        onClick={() => handleScenario(s.key)}
                      >
                        <div className='flex items-start gap-4'>
                          <div className='text-3xl group-hover:animate-bounce'>🎭</div>
                          <div>
                            <div className='font-medium text-slate-700 dark:text-slate-200 mb-2'>{s.label}</div>
                            <div className='text-sm text-slate-600 dark:text-slate-400 leading-relaxed'>{s.description}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className='space-y-6'>
                  <button
                    className='text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors duration-300 flex items-center gap-2 animate-fade-in-gentle'
                    onClick={() => setSelected(null)}
                  >
                    ← Back to scenarios
                  </button>

                  {/* Scenario prompt */}
                  <div className='glass-card p-6 animate-float-slow'>
                    <div className='flex items-center gap-3 mb-4'>
                      <div className='text-3xl animate-bounce'>📝</div>
                      <h3 className='text-xl font-light text-slate-700 dark:text-slate-200'>Scenario</h3>
                    </div>
                    <p className='text-slate-600 dark:text-slate-400 leading-relaxed font-light'>
                      {SCENARIOS.find(s => s.key === selected)?.prompt}
                    </p>
                  </div>

                  {/* User input */}
                  <div className='space-y-3'>
                    <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 text-left'>
                      Your Response
                    </label>
                    <textarea
                      className='w-full min-h-[100px] rounded-2xl border px-4 py-3 text-base bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-slate-200 dark:border-slate-600 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all duration-300 text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 resize-none'
                      placeholder="Share how you would respond in this situation..."
                      value={userInput}
                      onChange={e => setUserInput(e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  {/* Send button */}
                  <button
                    className='w-full btn-primary disabled:opacity-60 transition-all duration-300 hover:scale-105'
                    onClick={handleSend}
                    disabled={loading || !userInput.trim()}
                  >
                    {loading ? (
                      <span className='flex items-center justify-center gap-2'>
                        <div className='animate-spin'>🌀</div>
                        Analyzing your response...
                      </span>
                    ) : (
                      <span className='flex items-center gap-2'>
                        <span className='text-lg'>✨</span>
                        Send & Get Feedback
                      </span>
                    )}
                  </button>

                  {/* AI Response */}
                  {aiResponse && (
                    <div className='glass-card p-6 animate-fade-in-gentle border-l-4 border-emerald-400'>
                      <div className='flex items-center gap-3 mb-4'>
                        <div className='text-3xl animate-pulse-soft'>🤖</div>
                        <h4 className='text-lg font-light text-slate-700 dark:text-slate-200'>AI Interviewer</h4>
                      </div>
                      <p className='text-slate-600 dark:text-slate-400 leading-relaxed font-light'>{aiResponse}</p>
                    </div>
                  )}

                  {/* Feedback */}
                  {feedback && (
                    <div className='glass-card p-6 animate-fade-in-delayed border-l-4 border-pink-400'>
                      <div className='flex items-center gap-3 mb-4'>
                        <div className='text-3xl animate-bounce'>💝</div>
                        <h4 className='text-lg font-light text-slate-700 dark:text-slate-200'>Gentle Feedback</h4>
                      </div>
                      <p className='text-slate-600 dark:text-slate-400 leading-relaxed font-light'>{feedback}</p>
                    </div>
                  )}

                  {/* History replay */}
                  {history.length > 0 && (
                    <div className='animate-float-wave'>
                      <div className='flex items-center gap-3 mb-4'>
                        <div className='text-3xl animate-pulse-soft'>📚</div>
                        <h4 className='text-lg font-light text-slate-700 dark:text-slate-200'>Review Your Practice</h4>
                      </div>
                      <div className='space-y-3'>
                        {history.map((h, i) => (
                          <button
                            key={i}
                            className='w-full glass-card p-4 text-left hover:scale-105 transition-all duration-300 group'
                            onClick={() => handleReplay(i)}
                          >
                            <div className='flex items-start gap-3'>
                              <div className='text-2xl group-hover:animate-bounce'>💭</div>
                              <div className='flex-1'>
                                <div className='text-sm font-medium text-slate-700 dark:text-slate-200 mb-1'>You said:</div>
                                <div className='text-sm text-slate-600 dark:text-slate-400 mb-2 line-clamp-2'>{h.user}</div>
                                <div className='text-xs text-slate-500 dark:text-slate-500'>Click to review this exchange</div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </RequireAuth>
  );
}
