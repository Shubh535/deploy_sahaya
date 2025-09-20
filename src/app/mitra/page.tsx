

"use client";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../components/AuthProvider";
import { getIdToken } from "../utils/getIdToken";

// Speech Recognition types
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

declare const SpeechRecognition: {
  prototype: SpeechRecognition;
  new(): SpeechRecognition;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

const MODES = [
  { key: "coach", label: "Coach", icon: "👩‍🏫" },
  { key: "listener", label: "Listener", icon: "👂" },
  { key: "mindfulness", label: "Mindfulness", icon: "🌸" },
];

const LANGUAGES = [
  { key: "en", label: "English" },
  { key: "hi", label: "हिन्दी" },
];

function MessageBubble({ text, fromUser }: { text: string; fromUser: boolean }) {
  return (
    <div
      className={`max-w-[75%] px-4 py-2 rounded-2xl mb-2 text-sm shadow-md whitespace-pre-line ${
        fromUser
          ? "ml-auto bg-gradient-to-br from-blue-200 to-blue-100 text-right dark:from-blue-800 dark:to-blue-700"
          : "mr-auto bg-gradient-to-br from-purple-100 to-pink-50 dark:from-purple-800 dark:to-pink-700"
      }`}
    >
      {text}
    </div>
  );
}

function ZenPortalAnimation({ onComplete }: { onComplete: () => void }) {
  const [stage, setStage] = useState<'portal' | 'expanding' | 'revealing' | 'done'>('portal');

  useEffect(() => {
    const timer1 = setTimeout(() => setStage('expanding'), 500);
    const timer2 = setTimeout(() => setStage('revealing'), 1500);
    const timer3 = setTimeout(() => {
      setStage('done');
      onComplete();
    }, 3500);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center z-50 overflow-hidden">
      {/* Floating particles */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className={`absolute w-2 h-2 bg-white rounded-full opacity-60 animate-ping`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      <div className="text-center relative z-10">
        {stage === 'portal' && (
          <div className="w-16 h-16 border-4 border-white rounded-full animate-pulse"></div>
        )}
        {stage === 'expanding' && (
          <div className="relative">
            <div className="w-32 h-32 border-4 border-white rounded-full animate-ping absolute inset-0"></div>
            <div className="w-24 h-24 border-4 border-purple-300 rounded-full animate-ping absolute inset-4"></div>
            <div className="w-16 h-16 border-4 border-pink-300 rounded-full animate-ping absolute inset-8"></div>
            <div className="w-8 h-8 bg-white rounded-full absolute inset-12 animate-pulse"></div>
          </div>
        )}
        {stage === 'revealing' && (
          <div className="relative animate-fade-in">
            <div className="text-8xl animate-bounce">�‍♀️</div>
            <div className="absolute -top-8 -left-8 text-4xl animate-spin">✨</div>
            <div className="absolute -top-8 -right-8 text-4xl animate-spin">�</div>
            <div className="absolute -bottom-8 -left-8 text-4xl animate-spin">�️</div>
            <div className="absolute -bottom-8 -right-8 text-4xl animate-spin">🌿</div>
            {/* Ripple effects */}
            <div className="absolute inset-0 border-2 border-white rounded-full animate-ping opacity-75"></div>
            <div className="absolute inset-2 border-2 border-purple-300 rounded-full animate-ping opacity-50" style={{animationDelay: '0.5s'}}></div>
          </div>
        )}
        {stage === 'done' && (
          <div className="text-6xl animate-fade-out">�‍♀️</div>
        )}
        <p className="mt-8 text-2xl text-white font-light animate-fade-in">
          {stage === 'portal' && "Opening your mindfulness portal..."}
          {stage === 'expanding' && "Connecting to your inner peace..."}
          {stage === 'revealing' && "Welcome to your sacred space"}
          {stage === 'done' && "Find your center"}
        </p>
      </div>
    </div>
  );
}

export default function MitraChatPage() {
  const { user, loading } = useAuth();
  const [messages, setMessages] = useState<{ text: string; role: "user" | "assistant" }[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [mode, setMode] = useState("listener");
  const [language, setLanguage] = useState("en");
  const [error, setError] = useState("");
  const [showAnimation, setShowAnimation] = useState(true);
  const [particles, setParticles] = useState<Array<{
    left: string;
    top: string;
    animationDelay: string;
    animationDuration: string;
    size: string;
    color: string;
  }>>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [emotionalIntensity, setEmotionalIntensity] = useState<number>(0);
  const [voiceSupported, setVoiceSupported] = useState<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Generate particles only on client side to avoid hydration mismatch
  useEffect(() => {
    const colors = ['bg-emerald-200', 'bg-teal-200', 'bg-cyan-200', 'bg-blue-200', 'bg-indigo-200', 'bg-purple-200'];
    const newParticles = [...Array(15)].map((_, i) => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 8}s`,
      animationDuration: `${6 + Math.random() * 4}s`,
      size: `${Math.random() * 6 + 2}px`,
      color: colors[Math.floor(Math.random() * colors.length)]
    }));
    setParticles(newParticles);
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        setVoiceSupported(true);
        const recognitionInstance = new SpeechRecognition();
        recognitionInstance.continuous = false;
        recognitionInstance.interimResults = false;
        recognitionInstance.lang = language === 'hi' ? 'hi-IN' : 'en-US';

        recognitionInstance.onstart = () => {
          setIsRecording(true);
          setEmotionalIntensity(0);
          setError(""); // Clear any previous errors
        };

        recognitionInstance.onend = () => {
          setIsRecording(false);
        };

        recognitionInstance.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setIsRecording(false);
          let errorMessage = 'Voice recognition failed.';
          switch (event.error) {
            case 'network':
              errorMessage = 'Network error. Please check your connection.';
              break;
            case 'not-allowed':
              errorMessage = 'Microphone access denied. Please allow microphone access.';
              break;
            case 'no-speech':
              errorMessage = 'No speech detected. Please try again.';
              break;
            case 'aborted':
              errorMessage = 'Voice recognition was cancelled.';
              break;
            default:
              errorMessage = `Voice recognition error: ${event.error}`;
          }
          setError(errorMessage);
        };

        recognitionInstance.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          setInput(transcript);

          // Analyze emotional intensity based on speech patterns
          const intensity = analyzeEmotionalIntensity(transcript);
          setEmotionalIntensity(intensity);

          // Auto-send the message after voice input
          setTimeout(() => {
            handleVoiceMessage(transcript, intensity);
          }, 500);
        };

        setRecognition(recognitionInstance);
      } else {
        setVoiceSupported(false);
        console.warn('Speech recognition not supported in this browser');
      }
    }
  }, [language]);

  // Update recognition language when language changes
  useEffect(() => {
    if (recognition) {
      recognition.lang = language === 'hi' ? 'hi-IN' : 'en-US';
    }
  }, [language, recognition]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Analyze emotional intensity from speech text
  const analyzeEmotionalIntensity = (text: string): number => {
    const lowerText = text.toLowerCase();

    // Keywords indicating high emotional intensity
    const highIntensityWords = [
      'hate', 'angry', 'furious', 'rage', 'hate', 'despise', 'loath',
      'terrible', 'awful', 'horrible', 'worst', 'suck', 'hate',
      'depressed', 'anxious', 'panic', 'scared', 'terrified', 'fear',
      'overwhelmed', 'stressed', 'breakdown', 'crisis', 'emergency',
      'help', 'please', 'begging', 'desperate', 'urgent'
    ];

    // Keywords indicating medium emotional intensity
    const mediumIntensityWords = [
      'sad', 'upset', 'worried', 'concerned', 'frustrated', 'annoyed',
      'disappointed', 'tired', 'exhausted', 'overwhelmed', 'stressed',
      'confused', 'lost', 'unsure', 'doubt', 'question', 'wonder'
    ];

    // Check for exclamation marks and question marks (indicators of intensity)
    const punctuationCount = (text.match(/[!?]/g) || []).length;
    const wordCount = text.split(' ').length;

    let intensity = 0;

    // Count high intensity words
    highIntensityWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = text.match(regex);
      if (matches) intensity += matches.length * 3;
    });

    // Count medium intensity words
    mediumIntensityWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = text.match(regex);
      if (matches) intensity += matches.length * 1.5;
    });

    // Add intensity based on punctuation density
    intensity += (punctuationCount / wordCount) * 2;

    // Cap intensity at 10
    return Math.min(Math.max(intensity, 0), 10);
  };

  // Handle voice message with emotional context
  const handleVoiceMessage = async (transcript: string, intensity: number) => {
    if (!transcript.trim()) return;

    setSending(true);
    setError("");

    // Add emotional context to the message
    let enhancedMessage = transcript;
    if (intensity > 5) {
      enhancedMessage = `[High emotional intensity detected] ${transcript}`;
    } else if (intensity > 2) {
      enhancedMessage = `[Moderate emotional intensity detected] ${transcript}`;
    }

    const newMessages = [...messages, { text: transcript, role: "user" as const }];
    setMessages(newMessages);
    setInput("");

    try {
      const token = await getIdToken();
      const res = await fetch(`${API_BASE}/api/mitra/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: enhancedMessage,
          mode,
          language,
          history: newMessages.map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', text: m.text })),
          emotionalIntensity: intensity,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Chat failed");
      setMessages((msgs) => [...msgs, { text: data.aiResponse.text, role: "assistant" }]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "An error occurred");
    } finally {
      setSending(false);
      setEmotionalIntensity(0);
    }
  };

  // Start voice recording
  const startVoiceRecording = () => {
    if (recognition && !isRecording) {
      try {
        recognition.start();
      } catch (error) {
        console.error('Failed to start voice recognition:', error);
        setError('Voice recognition not supported or failed to start.');
      }
    }
  };

  // Stop voice recording
  const stopVoiceRecording = () => {
    if (recognition && isRecording) {
      recognition.stop();
    }
  };

  const sendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;
    setSending(true);
    setError("");
  const newMessages = [...messages, { text: input, role: "user" as const }];
  setMessages(newMessages);
    setInput("");
    try {
      const token = await getIdToken();
      const res = await fetch(`${API_BASE}/api/mitra/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: input,
          mode,
          language,
          history: newMessages.map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', text: m.text })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Chat failed");
      setMessages((msgs) => [...msgs, { text: data.aiResponse.text, role: "assistant" }]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "An error occurred");
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Please sign in to chat with Mitra.</div>;

  return (
    <>
      {showAnimation && (
        <ZenPortalAnimation onComplete={() => setShowAnimation(false)} />
      )}
      <div className="relative flex flex-col h-[100dvh] overflow-hidden">
        {/* Soothing gradient background with animation */}
        <div className='absolute inset-0 z-0 animate-gradient-flow' />

        {/* Floating nature elements */}
        <div className='absolute top-16 left-12 text-5xl animate-bubble-gentle opacity-30'>🌸</div>
        <div className='absolute top-32 right-20 text-4xl animate-bubble-flow opacity-25'>🧘‍♀️</div>
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

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between px-4 py-3 shadow bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-white/20 dark:border-gray-700/50">
          <div className="font-bold text-lg text-slate-700 dark:text-slate-200 flex items-center gap-2">
            <span className="text-3xl animate-pulse-soft">🧞‍♂️</span>
            <div>
              <span>Mitra</span>
              <span className="text-base text-slate-500 dark:text-slate-400">(मित्र)</span>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            {/* Emotional Intensity Indicator */}
            {emotionalIntensity > 0 && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 border border-orange-200 dark:border-orange-700/50">
                <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
                  Emotional Intensity: {emotionalIntensity.toFixed(1)}/10
                </span>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full ${
                        i < Math.round(emotionalIntensity / 2)
                          ? 'bg-red-500 animate-pulse'
                          : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Recording Status */}
            {isRecording && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-red-100 to-pink-100 dark:from-red-900/30 dark:to-pink-900/30 border border-red-200 dark:border-red-700/50 animate-pulse">
                <span className="text-sm font-medium text-red-700 dark:text-red-300">🎤 Listening...</span>
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            )}

            <select
              className="rounded-xl px-3 py-2 border text-sm bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-slate-200 dark:border-slate-600 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all duration-300 text-slate-700 dark:text-slate-200"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.key} value={lang.key}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Chat Area */}
        <div className="relative z-10 flex-1 overflow-y-auto px-4 py-6">
          {messages.length === 0 && (
            <div className="text-center text-slate-500 dark:text-slate-400 mt-16 animate-fade-in-gentle">
              <div className="text-6xl mb-4 animate-bounce">🧞‍♂️</div>
              <p className="text-xl font-light mb-2">Your gentle AI companion awaits</p>
              <p className="text-sm font-light mb-4">Share what&apos;s in your heart - I&apos;m here to listen with compassion</p>
              {voiceSupported && (
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-lg p-4 border border-emerald-200 dark:border-emerald-700/50">
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300 mb-2">🎤 Voice Input Available</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">
                    Click the microphone button to speak your thoughts. I&apos;ll automatically detect emotional intensity and respond with appropriate care.
                  </p>
                </div>
              )}
              {!voiceSupported && (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-700/50">
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-300 mb-2">🎤 Voice Input Not Available</p>
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    Voice input requires a compatible browser (Chrome, Edge, Safari). Please use text input or update your browser.
                  </p>
                </div>
              )}
            </div>
          )}
          {messages.map((msg, i) => (
            <MessageBubble key={i} text={msg.text} fromUser={msg.role === "user"} />
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <form
          onSubmit={sendMessage}
          className="relative z-10 flex items-center gap-3 px-4 py-4 bg-white/90 dark:bg-slate-800/90 border-t border-white/20 dark:border-slate-700/50 backdrop-blur-sm"
        >
          <input
            type="text"
            className="flex-1 rounded-2xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/20 bg-white/70 dark:bg-slate-700/70 backdrop-blur-sm border-slate-200 dark:border-slate-600 focus:border-emerald-400 transition-all duration-300 text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
            placeholder="Share what's on your mind..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={sending}
            autoFocus
          />

          {/* Voice Recording Button */}
          {voiceSupported ? (
            <button
              type="button"
              onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
              className={`p-3 rounded-full transition-all duration-300 hover:scale-110 ${
                isRecording
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse shadow-lg shadow-red-500/50'
                  : 'bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/30'
              } text-white disabled:opacity-60`}
              disabled={sending}
              title={isRecording ? 'Stop recording and send message' : 'Start voice input'}
            >
              {isRecording ? (
                <div className="flex items-center gap-1">
                  <span className="text-lg">⏹️</span>
                  <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                </div>
              ) : (
                <span className="text-lg">🎤</span>
              )}
            </button>
          ) : (
            <div className="p-3 rounded-full bg-gray-400 text-white cursor-not-allowed" title="Voice input not supported in this browser">
              <span className="text-lg">🎤❌</span>
            </div>
          )}

          <button
            type="submit"
            className="btn-primary disabled:opacity-60 transition-all duration-300 hover:scale-105"
            disabled={sending || !input.trim()}
          >
            {sending ? (
              <div className="animate-spin text-xl">🌀</div>
            ) : (
              <span className="flex items-center gap-2">
                <span className="text-lg">✨</span>
                Send
              </span>
            )}
          </button>
        </form>

        {/* Floating Mode Toggle */}
        <div className="fixed bottom-28 right-4 z-20 flex flex-col gap-3">
          {MODES.map((m) => (
            <button
              key={m.key}
              onClick={() => setMode(m.key)}
              className={`glass-card px-4 py-3 flex items-center gap-3 text-sm font-medium transition-all duration-300 hover:scale-105 border-2 ${
                mode === m.key
                ? "bg-emerald-500 text-white border-emerald-600 scale-110 shadow-xl"
                : "bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-white/30 dark:border-slate-600/50 hover:bg-white/90 dark:hover:bg-slate-800/90"
            }`}
            style={{ minWidth: 140 }}
          >
              <span className="text-xl">{m.icon}</span>
              <span>{m.label}</span>
            </button>
          ))}
        </div>

        {error && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 glass-card bg-red-50/90 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-6 py-3 rounded-2xl shadow-lg border-red-200/50 dark:border-red-700/50 animate-fade-in-gentle">
            {error}
          </div>
        )}
      </div>
    </>
  );
}
